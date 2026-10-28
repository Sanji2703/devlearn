import fs from 'fs';
import path from 'path';
import zlib from 'zlib';

function createPNG(width, height, drawFn) {
  // RGBA buffer: width * height * 4
  const buffer = Buffer.alloc(width * height * 4);

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * 4;
      const [r, g, b, a] = drawFn(x, y, width, height);
      buffer[idx] = r;
      buffer[idx + 1] = g;
      buffer[idx + 2] = b;
      buffer[idx + 3] = a;
    }
  }

  // Prepend filter byte 0x00 to each scanline
  const scanlines = Buffer.alloc(height * (width * 4 + 1));
  for (let y = 0; y < height; y++) {
    const srcStart = y * width * 4;
    const destStart = y * (width * 4 + 1);
    scanlines[destStart] = 0; // Filter None
    buffer.copy(scanlines, destStart + 1, srcStart, srcStart + width * 4);
  }

  const compressed = zlib.deflateSync(scanlines);

  // Build PNG chunks
  function makeChunk(type, data) {
    const len = data.length;
    const buf = Buffer.alloc(8 + len + 4);
    buf.writeUInt32BE(len, 0);
    buf.write(type, 4, 4, 'ascii');
    data.copy(buf, 8);
    const crc = crc32(buf.subarray(4, 8 + len));
    buf.writeUInt32BE(crc, 8 + len);
    return buf;
  }

  // CRC32 table
  function crc32(buf) {
    let c = 0xffffffff;
    for (let i = 0; i < buf.length; i++) {
      c = (c >>> 8) ^ table[(c ^ buf[i]) & 0xff];
    }
    return (c ^ 0xffffffff) >>> 0;
  }

  const table = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) {
      c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    }
    table[n] = c;
  }

  // IHDR
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; // 8 bits depth
  ihdr[9] = 6; // RGBA
  ihdr[10] = 0; // compression
  ihdr[11] = 0; // filter
  ihdr[12] = 0; // interlace

  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  const ihdrChunk = makeChunk('IHDR', ihdr);
  const idatChunk = makeChunk('IDAT', compressed);
  const iendChunk = makeChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([signature, ihdrChunk, idatChunk, iendChunk]);
}

// Distance to rounded rectangle
function distToRoundedRect(x, y, rx, ry, rw, rh, rad) {
  const qx = Math.abs(x - (rx + rw / 2)) - (rw / 2 - rad);
  const qy = Math.abs(y - (ry + rh / 2)) - (rh / 2 - rad);
  const ax = Math.max(qx, 0);
  const ay = Math.max(qy, 0);
  return Math.sqrt(ax * ax + ay * ay) + Math.min(Math.max(qx, qy), 0) - rad;
}

// Distance to line segment
function distToSegment(px, py, x1, y1, x2, y2) {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const lenSq = dx * dx + dy * dy;
  if (lenSq === 0) return Math.hypot(px - x1, py - y1);
  let t = Math.max(0, Math.min(1, ((px - x1) * dx + (py - y1) * dy) / lenSq));
  const projX = x1 + t * dx;
  const projY = y1 + t * dy;
  return Math.hypot(px - projX, py - projY);
}

// Draw DevLearn Icon (Base: #1E2538 (30, 37, 56), Code: #D9E8F4 (217, 232, 244), Accent: #C5D9E9 (197, 217, 233))
function drawAppIcon(x, y, w, h, isMaskable) {
  const normX = x / w;
  const normY = y / h;

  // Background: Full bleed #1E2538 for maskable, rounded rect for normal
  if (isMaskable) {
    // Fill full bleed
    const bgR = 0x1e, bgG = 0x25, bgB = 0x38;

    // Draw central badge inside safe zone (scale by 0.75)
    const cx = normX - 0.5;
    const cy = normY - 0.5;

    // Left bracket <
    const dLeft1 = distToSegment(normX, normY, 0.40, 0.35, 0.28, 0.50);
    const dLeft2 = distToSegment(normX, normY, 0.28, 0.50, 0.40, 0.65);
    const minLeft = Math.min(dLeft1, dLeft2);

    // Right bracket >
    const dRight1 = distToSegment(normX, normY, 0.60, 0.35, 0.72, 0.50);
    const dRight2 = distToSegment(normX, normY, 0.72, 0.50, 0.60, 0.65);
    const minRight = Math.min(dRight1, dRight2);

    // Center slash /
    const minSlash = distToSegment(normX, normY, 0.55, 0.30, 0.45, 0.70);

    const strokeWidth = 0.045;
    if (minSlash < strokeWidth) {
      return [0xc5, 0xd9, 0xe9, 255]; // #C5D9E9
    }
    if (minLeft < strokeWidth || minRight < strokeWidth) {
      return [0xd9, 0xe8, 0xf4, 255]; // #D9E8F4
    }

    return [bgR, bgG, bgB, 255];
  } else {
    // Normal icon with rounded corners
    const distBg = distToRoundedRect(x, y, 0, 0, w, h, w * 0.22);
    if (distBg > 0) {
      return [0, 0, 0, 0]; // Transparent outside rounded corner
    }

    // Inside base #1E2538
    const dLeft1 = distToSegment(normX, normY, 0.38, 0.35, 0.25, 0.50);
    const dLeft2 = distToSegment(normX, normY, 0.25, 0.50, 0.38, 0.65);
    const minLeft = Math.min(dLeft1, dLeft2);

    const dRight1 = distToSegment(normX, normY, 0.62, 0.35, 0.75, 0.50);
    const dRight2 = distToSegment(normX, normY, 0.75, 0.50, 0.62, 0.65);
    const minRight = Math.min(dRight1, dRight2);

    const minSlash = distToSegment(normX, normY, 0.56, 0.30, 0.44, 0.70);

    const strokeWidth = 0.048;
    if (minSlash < strokeWidth) {
      return [0xc5, 0xd9, 0xe9, 255]; // #C5D9E9
    }
    if (minLeft < strokeWidth || minRight < strokeWidth) {
      return [0xd9, 0xe8, 0xf4, 255]; // #D9E8F4
    }

    return [0x1e, 0x25, 0x38, 255];
  }
}

// Generate all required icons
const publicDir = path.resolve('public');
if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}

console.log('Generating 192x192 PNG...');
fs.writeFileSync(path.join(publicDir, 'pwa-192x192.png'), createPNG(192, 192, (x, y, w, h) => drawAppIcon(x, y, w, h, false)));

console.log('Generating 512x512 PNG...');
fs.writeFileSync(path.join(publicDir, 'pwa-512x512.png'), createPNG(512, 512, (x, y, w, h) => drawAppIcon(x, y, w, h, false)));

console.log('Generating 512x512 Maskable PNG...');
fs.writeFileSync(path.join(publicDir, 'pwa-maskable-512x512.png'), createPNG(512, 512, (x, y, w, h) => drawAppIcon(x, y, w, h, true)));

console.log('Generating Apple Touch Icon 180x180 PNG...');
fs.writeFileSync(path.join(publicDir, 'apple-touch-icon.png'), createPNG(180, 180, (x, y, w, h) => drawAppIcon(x, y, w, h, false)));

console.log('Generating 64x64 Favicon PNG...');
fs.writeFileSync(path.join(publicDir, 'favicon.ico'), createPNG(64, 64, (x, y, w, h) => drawAppIcon(x, y, w, h, false)));

console.log('All icons generated successfully!');
