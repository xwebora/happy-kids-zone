import { deleteObject, getDownloadURL, getStorage, ref, uploadBytes } from 'firebase/storage';
import { getApp } from 'firebase/app';

const storage = getStorage(getApp());
const MENU_IMAGES_PATH = 'menu-images';

function sanitizeFileName(fileName: string): string {
  return fileName
    .replace(/[^a-zA-Z0-9._-]/g, '_')
    .replace(/_+/g, '_')
    .slice(-120);
}

export async function uploadMenuImage(
  file: File | Blob,
  itemId: string,
  originalFileName = 'image.jpg'
): Promise<{ downloadUrl: string; storagePath: string }> {
  const extension = (originalFileName.split('.').pop() || 'jpg').toLowerCase();
  const safeName = sanitizeFileName(originalFileName.replace(/\.[^.]+$/, '')) || 'image';
  const storagePath = `${MENU_IMAGES_PATH}/${itemId}_${Date.now()}_${safeName}.${extension}`;
  const storageRef = ref(storage, storagePath);

  await uploadBytes(storageRef, file, {
    contentType: file.type || 'image/jpeg',
    cacheControl: 'public,max-age=31536000,immutable',
  });

  const downloadUrl = await getDownloadURL(storageRef);
  return { downloadUrl, storagePath };
}

export async function deleteMenuImage(storagePath?: string): Promise<boolean> {
  if (!storagePath) return false;

  try {
    await deleteObject(ref(storage, storagePath));
    return true;
  } catch (error: any) {
    if (error?.code === 'storage/object-not-found') return true;
    throw error;
  }
}
