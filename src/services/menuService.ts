import {
  collection,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  setDoc,
} from 'firebase/firestore';

import { db } from './firestore';
import { MenuItem } from '../types';

const COLLECTION_NAME = 'menuItems';

const menuItemsCollection = collection(db, COLLECTION_NAME);

/**
 * جلب جميع الوجبات من Firestore
 */
export async function getMenuItems(): Promise<MenuItem[]> {
  const snapshot = await getDocs(menuItemsCollection);

  return snapshot.docs.map((item) => ({
    id: item.id,
    ...item.data(),
  })) as MenuItem[];
}

/**
 * إضافة وجبة جديدة
 */
export async function addMenuItem(
  item: Omit<MenuItem, 'id'>
): Promise<string> {
  const docRef = await addDoc(menuItemsCollection, item);

  return docRef.id;
}

/**
 * إضافة وجبة مع استخدام ID محدد
 * سنستخدمها لاحقًا لنقل الوجبات القديمة إلى Firestore
 */
export async function setMenuItem(
  id: string,
  item: Omit<MenuItem, 'id'>
): Promise<void> {
  await setDoc(
    doc(db, COLLECTION_NAME, id),
    item
  );
}

/**
 * تعديل وجبة
 */
export async function updateMenuItem(
  id: string,
  item: Partial<Omit<MenuItem, 'id'>>
): Promise<void> {
  await updateDoc(
    doc(db, COLLECTION_NAME, id),
    item
  );
}

/**
 * حذف وجبة
 */
export async function deleteMenuItem(
  id: string
): Promise<void> {
  await deleteDoc(
    doc(db, COLLECTION_NAME, id)
  );
}
