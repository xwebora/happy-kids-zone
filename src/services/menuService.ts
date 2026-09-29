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
