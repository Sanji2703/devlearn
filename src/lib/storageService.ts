import { ref, uploadBytesResumable, getDownloadURL, deleteObject } from 'firebase/storage';
import { storage } from './firebase';
import { LearningMaterial, SubjectId } from '../types';

export const MAX_FILE_SIZE_BYTES = 20 * 1024 * 1024; // 20 MB

export const ALLOWED_EXTENSIONS = [
  '.pdf',
  '.c',
  '.cpp',
  '.h',
  '.hpp',
  '.py',
  '.sql',
  '.txt',
  '.md',
  '.doc',
  '.docx',
  '.png',
  '.jpg',
  '.jpeg',
];

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 o';
  const k = 1024;
  const sizes = ['o', 'Ko', 'Mo', 'Go'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

export function sanitizeFileName(name: string): string {
  return name
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9._-]/g, '_');
}

export interface UploadOptions {
  subject?: SubjectId;
  moduleId?: string;
  exerciseId?: string;
  description?: string;
  onProgress?: (progressPercent: number) => void;
}

// Upload file to Firebase Storage (Mode Google) or Local Storage (Mode Local)
export async function uploadLearningFile(
  file: File,
  userId: string | null | undefined,
  options?: UploadOptions
): Promise<LearningMaterial> {
  if (file.size > MAX_FILE_SIZE_BYTES) {
    throw new Error(`Le fichier dépasse la taille maximale autorisée de ${formatFileSize(MAX_FILE_SIZE_BYTES)}.`);
  }

  const materialId = `mat_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
  const now = new Date().toISOString();
  const safeName = sanitizeFileName(file.name);

  // Mode Google : Tentative de téléversement vers Firebase Storage
  if (userId && userId !== 'local') {
    const storagePath = `users/${userId}/materials/${materialId}_${safeName}`;
    const storageRef = ref(storage, storagePath);

    try {
      const uploadTask = uploadBytesResumable(
        storageRef,
        file,
        {
          contentType: file.type || 'application/octet-stream',
          customMetadata: {
            userId,
            originalName: file.name,
            uploadedAt: now,
          },
        }
      );

      if (options?.onProgress) {
        uploadTask.on('state_changed', (snapshot) => {
          const progress = Math.round((snapshot.bytesTransferred / snapshot.totalBytes) * 100);
          options.onProgress?.(progress);
        });
      }

      await uploadTask;
      const downloadUrl = await getDownloadURL(uploadTask.snapshot.ref);

      const material: LearningMaterial = {
        id: materialId,
        userId,
        fileName: file.name,
        fileType: file.type || 'application/octet-stream',
        fileSize: file.size,
        storagePath,
        downloadUrl,
        subject: options?.subject,
        moduleId: options?.moduleId,
        exerciseId: options?.exerciseId,
        description: options?.description || '',
        storageType: 'firebase_storage',
        createdAt: now,
        updatedAt: now,
      };

      return material;
    } catch (storageError: any) {
      console.warn('Firebase Storage upload failed or bucket restricted, falling back to local storage:', storageError);
      // Fallback gracieux : Stockage du fichier en Data URL localement
      const localDataUrl = await readFileAsDataUrl(file);
      return {
        id: materialId,
        userId,
        fileName: file.name,
        fileType: file.type || 'application/octet-stream',
        fileSize: file.size,
        storagePath: `local://materials/${materialId}`,
        downloadUrl: localDataUrl,
        subject: options?.subject,
        moduleId: options?.moduleId,
        exerciseId: options?.exerciseId,
        description: options?.description || '',
        storageType: 'local_storage',
        createdAt: now,
        updatedAt: now,
      };
    }
  }

  // Mode Local : Stockage local direct
  const localDataUrl = await readFileAsDataUrl(file);
  return {
    id: materialId,
    userId: 'local',
    fileName: file.name,
    fileType: file.type || 'application/octet-stream',
    fileSize: file.size,
    storagePath: `local://materials/${materialId}`,
    downloadUrl: localDataUrl,
    subject: options?.subject,
    moduleId: options?.moduleId,
    exerciseId: options?.exerciseId,
    description: options?.description || '',
    storageType: 'local_storage',
    createdAt: now,
    updatedAt: now,
  };
}

export function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error('Impossible de lire le fichier sélectionné sur cet appareil.'));
    reader.readAsDataURL(file);
  });
}

export async function deleteLearningFile(material: LearningMaterial): Promise<void> {
  if (material.storageType === 'firebase_storage' && material.storagePath) {
    try {
      const storageRef = ref(storage, material.storagePath);
      await deleteObject(storageRef);
    } catch (err) {
      console.warn('Firebase storage delete error:', err);
    }
  }
}
