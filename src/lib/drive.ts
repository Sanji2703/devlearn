import { getAccessToken } from './firebase';

export interface DriveFile {
  id: string;
  name: string;
  mimeType: string;
  webViewLink?: string;
  thumbnailLink?: string;
  size?: string;
  createdTime?: string;
}

// Upload a text/markdown/PDF blob or file to user's Google Drive
export async function uploadFileToDrive(
  file: File | Blob,
  fileName: string,
  mimeType: string = 'text/plain'
): Promise<DriveFile> {
  const token = await getAccessToken();
  if (!token) {
    throw new Error('Non authentifié avec Google Drive. Veuillez vous reconnecter.');
  }

  const metadata = {
    name: fileName,
    mimeType: mimeType,
    description: "Support d'apprentissage DevLearn",
  };

  const form = new FormData();
  form.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
  form.append('file', file);

  const res = await fetch(
    'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name,mimeType,webViewLink',
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: form,
    }
  );

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Erreur lors du téléversement sur Google Drive : ${errorText}`);
  }

  const data = await res.json();
  return data;
}

// Create a quick study note in Google Drive
export async function createStudyDocInDrive(
  title: string,
  content: string
): Promise<DriveFile> {
  const blob = new Blob([content], { type: 'text/markdown;charset=utf-8' });
  return uploadFileToDrive(blob, `${title}.md`, 'text/markdown');
}

// List files accessible by the app
export async function listAppDriveFiles(): Promise<DriveFile[]> {
  const token = await getAccessToken();
  if (!token) return [];

  try {
    const res = await fetch(
      'https://www.googleapis.com/drive/v3/files?pageSize=20&fields=files(id,name,mimeType,webViewLink,createdTime)&orderBy=modifiedTime desc',
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    if (!res.ok) {
      console.warn('Could not list drive files', await res.text());
      return [];
    }

    const data = await res.json();
    return data.files || [];
  } catch (err) {
    console.error('Failed to list drive files:', err);
    return [];
  }
}
