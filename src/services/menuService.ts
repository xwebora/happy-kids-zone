import {
  collection,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
} from 'firebase/firestore';

import { db } from './firestore';
import { MenuItem } from '../types';

const COLLECTION_NAME = 'menuItems';

// جلب جميع الوجبات
export async function getMenuItems(): Promise<MenuItem[]> {
  const snapshot = await getDocs(collection(db, COLLECTION_NAME));

  return snapshot.docs.map((item) => ({
    id: item.id,
    ...item.data(),
  })) as MenuItem[];
}

// إضافة وجبة
export async function addMenuItem(
  item: Omit<MenuItem, 'id'>
): Promise<string> {
  const docRef = await addDoc(
    collection(db, COLLECTION_NAME),
    item
  );

  return docRef.id;
}

// تعديل وجبة
export async function updateMenuItem(
  id: string,
  item: Partial<Omit<MenuItem, 'id'>>
): Promise<void> {
  await updateDoc(
    doc(db, COLLECTION_NAME, id),
    item
  );
}

// حذف وجبة
export async function deleteMenuItem(
  id: string
): Promise<void> {
  await deleteDoc(
    doc(db, COLLECTION_NAME, id)
  );
}
export async function testMenuItem(): Promise<string> {
  const testItem: Omit<MenuItem, 'id'> = {
    name: 'اختبار Firestore',
    nameEn: 'Firestore Test',
    description: 'هذا سجل اختبار وسيتم حذفه',
    descriptionEn: 'This is a test record and will be deleted',
    price: 1000,
    category: 'main',
    image: 'https://example.com/test.jpg',
    available: true,
    isPopular: false,
    isChefSpecial: false,
    preparationTime: '5 دقائق',
    preparationTimeEn: '5 min',
  };

  const id = await addMenuItem(testItem);

  console.log('✅ Menu item created:', id);

  return id;
}
