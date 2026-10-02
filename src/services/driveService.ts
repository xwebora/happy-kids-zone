import { MenuItem } from '../types';
import { getAccessToken } from './auth';

const DRIVE_UPLOAD_URL = 'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart';
const DRIVE_FILES_URL = 'https://www.googleapis.com/drive/v3/files';

export async function getOrCreateMenuFolder(folderName = 'Sultan_Restaurant_Menu'): Promise<string> {
  const token = await getAccessToken();
  if (!token) throw new Error('يرجى تسجيل الدخول بحساب Google أولاً للمزامنة مع Drive');
  const query = encodeURIComponent(`name = '${folderName}' and mimeType = 'application/vnd.google-apps.folder' and trashed = false`);
  const searchRes = await fetch(`${DRIVE_FILES_URL}?q=${query}&fields=files(id, name)`, { headers: { Authorization: `Bearer ${token}` } });
  if (!searchRes.ok) throw new Error('فشل البحث في مجلدات Google Drive');
  const data = await searchRes.json();
  if (data.files && data.files.length > 0) return data.files[0].id;
  const createRes = await fetch(DRIVE_FILES_URL, { method: 'POST', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ name: folderName, mimeType: 'application/vnd.google-apps.folder', description: 'مجلد يحتوي على صور وقوائم طعام مطعم سلطان المذاق' }) });
  if (!createRes.ok) throw new Error('فشل إنشاء مجلد Google Drive للوجبات');
  const folderData = await createRes.json();
  return folderData.id;
}

export async function uploadImageToDrive(file: File | Blob, fileName: string, folderId?: string): Promise<{ fileId: string; webViewLink?: string; webContentLink?: string; directUrl: string }> {
  const token = await getAccessToken();
  if (!token) throw new Error('رمز الدخول غير متوفر');
  let parentId = folderId;
  if (!parentId) parentId = await getOrCreateMenuFolder();
  const metadata = { name: fileName, parents: [parentId], description: 'صورة وجبة مطعم سلطان المذاق' };
  const boundary = '-------314159265358979323846';
  const delimiter = `\r\n--${boundary}\r\n`;
  const closeDelim = `\r\n--${boundary}--`;
  const reader = new FileReader();
  const fileDataPromise = new Promise<ArrayBuffer>((resolve, reject) => { reader.onload = () => resolve(reader.result as ArrayBuffer); reader.onerror = reject; reader.readAsArrayBuffer(file); });
  const fileBytes = await fileDataPromise;
  const metadataContentType = 'application/json; charset=UTF-8';
  const fileContentType = file.type || 'image/jpeg';
  const multipartBody = new Blob([delimiter, `Content-Type: ${metadataContentType}\r\n\r\n`, JSON.stringify(metadata), delimiter, `Content-Type: ${fileContentType}\r\n`, 'Content-Transfer-Encoding: binary\r\n\r\n', fileBytes, closeDelim]);
  const res = await fetch(DRIVE_UPLOAD_URL, { method: 'POST', headers: { Authorization: `Bearer ${token}`, 'Content-Type': `multipart/related; boundary=${boundary}` }, body: multipartBody });
  if (!res.ok) { const errorText = await res.text(); console.error('Drive upload error:', errorText); throw new Error('فشل رفع الصورة إلى Google Drive'); }
  const uploadResult = await res.json();
  const fileId = uploadResult.id;
  try {
    await fetch(`${DRIVE_FILES_URL}/${fileId}/permissions`, { method: 'POST', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ role: 'reader', type: 'anyone' }) });
  } catch (err) { console.warn('Could not set public permission on Drive image', err); }
  const directUrl = `https://drive.google.com/thumbnail?id=${fileId}&sz=w800`;
  return { fileId, directUrl };
}

export async function saveMenuBackupToDrive(items: MenuItem[], folderId?: string): Promise<{ fileId: string; modifiedTime: string }> {
  const token = await getAccessToken();
  if (!token) throw new Error('رمز الدخول غير متوفر للنسخ الاحتياطي');
  let parentId = folderId;
  if (!parentId) parentId = await getOrCreateMenuFolder();
  const fileName = 'restaurant_menu_data.json';
  const query = encodeURIComponent(`name = '${fileName}' and '${parentId}' in parents and trashed = false`);
  const searchRes = await fetch(`${DRIVE_FILES_URL}?q=${query}&fields=files(id, name)`, { headers: { Authorization: `Bearer ${token}` } });
  const searchData = await searchRes.json();
  const content = JSON.stringify({ restaurant: 'مطعم قصر السلطان', updatedAt: new Date().toISOString(), totalItems: items.length, items }, null, 2);
  if (searchData.files && searchData.files.length > 0) {
    const existingId = searchData.files[0].id;
    const updateRes = await fetch(`https://www.googleapis.com/upload/drive/v3/files/${existingId}?uploadType=media`, { method: 'PATCH', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }, body: content });
    if (!updateRes.ok) throw new Error('فشل تحديث ملف المنيو على Google Drive');
    const updateData = await updateRes.json();
    return { fileId: existingId, modifiedTime: updateData.modifiedTime || new Date().toISOString() };
  }
  const metadata = { name: fileName, parents: [parentId], mimeType: 'application/json' };
  const boundary = '-------MenuJsonBoundary';
  const multipartBody = new Blob([`\r\n--${boundary}\r\n`, `Content-Type: application/json; charset=UTF-8\r\n\r\n`, JSON.stringify(metadata), `\r\n--${boundary}\r\n`, `Content-Type: application/json\r\n\r\n`, content, `\r\n--${boundary}--`]);
  const createRes = await fetch(DRIVE_UPLOAD_URL, { method: 'POST', headers: { Authorization: `Bearer ${token}`, 'Content-Type': `multipart/related; boundary=${boundary}` }, body: multipartBody });
  if (!createRes.ok) throw new Error('فشل إنشاء ملف المنيو في Google Drive');
  const resData = await createRes.json();
  return { fileId: resData.id, modifiedTime: new Date().toISOString() };
}

export async function deleteDriveFile(fileId: string): Promise<boolean> {
  const token = await getAccessToken();
  if (!token) return false;
  const res = await fetch(`${DRIVE_FILES_URL}/${fileId}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
  return res.ok;
}
