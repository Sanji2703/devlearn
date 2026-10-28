import fs from 'fs';
import path from 'path';
import zlib from 'zlib';

function createCRC32Table() {
  const table = new Uint32Array(256);
  for (let i = 0; i < 256; i++) {
    let c = i;
    for (let k = 0; k < 8; k++) {
      c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1);
    }
    table[i] = c;
  }
  return table;
}

const crcTable = createCRC32Table();
function crc32(buf) {
  let crc = -1;
  for (let i = 0; i < buf.length; i++) {
    crc = (crc >>> 8) ^ crcTable[(crc ^ buf[i]) & 0xFF];
  }
  return (crc ^ (-1)) >>> 0;
}

function makeChunk(type, data) {
  const typeBuf = Buffer.from(type, 'ascii');
  const lenBuf = Buffer.alloc(4);
  lenBuf.writeUInt32BE(data.length, 0);

  const crcBuf = Buffer.alloc(4);
  const toCrc = Buffer.concat([typeBuf, data]);
  crcBuf.writeUInt32BE(crc32(toCrc), 0);

  return Buffer.concat([lenBuf, toCrc, crcBuf]);
}

function generateDevLearnPNG(width, height, isMaskable = false) {
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  // IHDR
  const ihdrData = Buffer.alloc(13);
  ihdrData.writeUInt32BE(width, 0);
  ihdrData.writeUInt32BE(height, 4);
  ihdrData.writeUInt8(8, 8); // bit depth 8
  ihdrData.writeUInt8(6, 9); // RGBA
  ihdrData.writeUInt8(0, 10);
  ihdrData.writeUInt8(0, 11);
  ihdrData.writeUInt8(0, 12);
  const ihdrChunk = makeChunk('IHDR', ihdrData);

  // Raw image scanlines
  // Filter byte (0 = None) + RGBA per pixel
  const rowSize = 1 + width * 4;
  const rawData = Buffer.alloc(rowSize * height);

  // Background color: #1E2538 (R: 30, G: 37, B: 56, A: 255)
  // Text/Bracket: #F4F7F9 (R: 244, G: 247, B: 249)
  // Slash: #D9E8F4 (R: 217, G: 232, B: 244)
  const bgR = 30, bgG = 37, bgB = 56;
  const fgR = 244, fgG = 247, fgB = 249;
  const slR = 217, slG = 232, slB = 244;
  const dot1R = 217, dot1G = 232, dot1B = 244;
  const dot2R = 197, dot2G = 217, dot2B = 233;
  const dot3R = 183, dot3G = 201, dot3B = 214;
  const dot4R = 155, dot4G = 167, dot4B = 184;

  const cx = width / 2;
  const cy = height / 2;
  const radius = width * (isMaskable ? 0.5 : 0.44); // rounded rect or full bleed for maskable

  for (let y = 0; y < height; y++) {
    const rowOffset = y * rowSize;
    rawData[rowOffset] = 0; // Filter type: None

    for (let x = 0; x < width; x++) {
      const pxOffset = rowOffset + 1 + x * 4;

      // Base background
      let r = bgR, g = bgG, b = bgB, a = 255;

      // Distance from center for rounded corners if not maskable
      if (!isMaskable) {
        const dx = Math.abs(x - cx);
        const dy = Math.abs(y - cy);
        const cornerR = width * 0.22;
        const innerW = width / 2 - cornerR;
        const innerH = height / 2 - cornerR;
        if (dx > innerW && dy > innerH) {
          const cdx = dx - innerW;
          const cdy = dy - innerH;
          if (cdx * cdx + cdy * cdy > cornerR * cornerR) {
            a = 0; // transparent corner
          }
        }
      }

      // If opaque, check if pixel is part of </ > icon design
      if (a > 0) {
        const nx = (x / width) * 512;
        const ny = (y / height) * 512;

        // Slash line: from (285, 150) to (227, 362)
        // distance from point to line segment
        const p1x = 285, p1y = 150, p2x = 227, p2y = 362;
        const l2 = (p2x - p1x) ** 2 + (p2y - p1y) ** 2;
        const t = Math.max(0, Math.min(1, ((nx - p1x) * (p2x - p1x) + (ny - p1y) * (p2y - p1y)) / l2));
        const projx = p1x + t * (p2x - p1x);
        const projy = p1y + t * (p2y - p1y);
        const distSlash = Math.hypot(nx - projx, ny - projy);

        if (distSlash < 16) {
          r = slR; g = slG; b = slB;
        }

        // Left bracket: (180, 180) -> (90, 256) -> (180, 332)
        const dL1 = distToSegment(nx, ny, 180, 180, 90, 256);
        const dL2 = distToSegment(nx, ny, 90, 256, 180, 332);
        if (dL1 < 18 || dL2 < 18) {
          r = fgR; g = fgG; b = fgB;
        }

        // Right bracket: (332, 180) -> (422, 256) -> (332, 332)
        const dR1 = distToSegment(nx, ny, 332, 180, 422, 256);
        const dR2 = distToSegment(nx, ny, 422, 256, 332, 332);
        if (dR1 < 18 || dR2 < 18) {
          r = fgR; g = fgG; b = fgB;
        }

        // 4 dots
        if (Math.hypot(nx - 160, ny - 400) < 14) { r = dot1R; g = dot1G; b = dot1B; }
        if (Math.hypot(nx - 224, ny - 400) < 14) { r = dot2R; g = dot2G; b = dot2B; }
        if (Math.hypot(nx - 288, ny - 400) < 14) { r = dot3R; g = dot3G; b = dot3B; }
        if (Math.hypot(nx - 352, ny - 400) < 14) { r = dot4R; g = dot4G; b = dot4B; }
      }

      rawData[pxOffset] = r;
      rawData[pxOffset + 1] = g;
      rawData[pxOffset + 2] = b;
      rawData[pxOffset + 3] = a;
    }
  }

  const compressedData = zlib.deflateSync(rawData);
  const idatChunk = makeChunk('IDAT', compressedData);
  const iendChunk = makeChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([signature, ihdrChunk, idatChunk, iendChunk]);
}

function distToSegment(px, py, x1, y1, x2, y2) {
  const l2 = (x2 - x1) ** 2 + (y2 - y1) ** 2;
  const t = Math.max(0, Math.min(1, ((px - x1) * (x2 - x1) + (py - y1) * (y2 - y1)) / l2));
  return Math.hypot(px - (x1 + t * (x2 - x1)), py - (y1 + t * (y2 - y1)));
}

const publicDir = path.resolve('public');
if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}

// Write PNG icons
fs.writeFileSync(path.join(publicDir, 'pwa-192x192.png'), generateDevLearnPNG(192, 192, false));
fs.writeFileSync(path.join(publicDir, 'pwa-512x512.png'), generateDevLearnPNG(512, 512, false));
fs.writeFileSync(path.join(publicDir, 'pwa-maskable-512x512.png'), generateDevLearnPNG(512, 512, true));
fs.writeFileSync(path.join(publicDir, 'apple-touch-icon.png'), generateDevLearnPNG(180, 180, false));
fs.writeFileSync(path.join(publicDir, 'favicon.ico'), generateDevLearnPNG(64, 64, false));

console.log('PNG icons generated successfully in public/');
