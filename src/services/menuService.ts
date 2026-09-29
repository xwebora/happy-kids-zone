import {
  collection,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  setDoc,
  onSnapshot,
} from 'firebase/firestore';

import { db } from './firestore';
import {
  MenuItem,
  Category,
  RestaurantInfo,
  HeroConfig,
} from '../types';

const MENU_ITEMS_COLLECTION = 'menuItems';
const CATEGORIES_COLLECTION = 'categories';
const RESTAURANT_COLLECTION = 'restaurant';
const HERO_COLLECTION = 'hero';

// ============================================================
// MENU ITEMS
// ============================================================

const menuItemsCollection = collection(
  db,
  MENU_ITEMS_COLLECTION
);

/**
 * جلب جميع الوجبات
 */
export async function getMenuItems(): Promise<MenuItem[]> {
  const snapshot = await getDocs(menuItemsCollection);

  return snapshot.docs.map((item) => ({
    id: item.id,
    ...item.data(),
  })) as MenuItem[];
}

/**
 * مراقبة الوجبات بشكل مباشر
 */
export function subscribeToMenuItems(
  callback: (items: MenuItem[]) => void
) {
  return onSnapshot(menuItemsCollection, (snapshot) => {
    const items = snapshot.docs.map((item) => ({
      id: item.id,
      ...item.data(),
    })) as MenuItem[];

    callback(items);
  });
}
/**
 * إضافة وجبة جديدة
 */
export async function addMenuItem(
  item: Omit<MenuItem, 'id'>
): Promise<string> {
  const docRef = await addDoc(
    menuItemsCollection,
    item
  );

  return docRef.id;
}

/**
 * حفظ وجبة باستخدام ID محدد
 */
export async function setMenuItem(
  id: string,
  item: Omit<MenuItem, 'id'>
): Promise<void> {
  await setDoc(
    doc(db, MENU_ITEMS_COLLECTION, id),
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
    doc(db, MENU_ITEMS_COLLECTION, id),
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
    doc(db, MENU_ITEMS_COLLECTION, id)
  );
}

// ============================================================
// CATEGORIES
// ============================================================

/**
 * جلب جميع الأصناف
 */
export async function getCategories(): Promise<Category[]> {
  const snapshot = await getDocs(
    collection(db, CATEGORIES_COLLECTION)
  );

  return snapshot.docs.map((item) => ({
    id: item.id,
    ...item.data(),
  })) as Category[];
}

/**
 * حفظ صنف باستخدام ID محدد
 */
export async function setCategory(
  id: string,
  category: Omit<Category, 'id'>
): Promise<void> {
  await setDoc(
    doc(db, CATEGORIES_COLLECTION, id),
    category
  );
}

/**
 * حذف صنف
 */
export async function deleteCategory(
  id: string
): Promise<void> {
  await deleteDoc(
    doc(db, CATEGORIES_COLLECTION, id)
  );
}

// ============================================================
// RESTAURANT
// ============================================================

/**
 * حفظ معلومات المطعم
 *
 * نستخدم document ثابت اسمه "main"
 * حتى لا يتم إنشاء نسخة جديدة كل مرة.
 */
export async function setRestaurantInfo(
  restaurant: RestaurantInfo
): Promise<void> {
  await setDoc(
    doc(db, RESTAURANT_COLLECTION, 'main'),
    restaurant
  );
}

/**
 * جلب معلومات المطعم
 */
export async function getRestaurantInfo(): Promise<RestaurantInfo | null> {
  const snapshot = await getDocs(
    collection(db, RESTAURANT_COLLECTION)
  );

  const mainDoc = snapshot.docs.find(
    (item) => item.id === 'main'
  );

  if (!mainDoc) {
    return null;
  }

  return mainDoc.data() as RestaurantInfo;
}

// ============================================================
// HERO
// ============================================================

/**
 * حفظ إعدادات Hero
 */
export async function setHeroConfig(
  hero: HeroConfig
): Promise<void> {
  await setDoc(
    doc(db, HERO_COLLECTION, 'main'),
    hero
  );
}

/**
 * جلب إعدادات Hero
 */
export async function getHeroConfig(): Promise<HeroConfig | null> {
  const snapshot = await getDocs(
    collection(db, HERO_COLLECTION)
  );

  const mainDoc = snapshot.docs.find(
    (item) => item.id === 'main'
  );

  if (!mainDoc) {
    return null;
  }

  return mainDoc.data() as HeroConfig;
}

// ============================================================
// FULL MIGRATION
// ============================================================

export interface MigrationResult {
  menuItems: number;
  categories: number;
  restaurant: boolean;
  hero: boolean;
}

/**
 * نقل جميع بيانات لوحة التحكم إلى Firestore
 *
 * هذه العملية لا تحذف أي شيء من localStorage
 * ولا تحذف أي صور من Google Drive.
 */
export async function migrateAllDataToFirestore(
  items: MenuItem[],
  categories: Category[],
  restaurant: RestaurantInfo,
  hero: HeroConfig
): Promise<MigrationResult> {

  let migratedItems = 0;
  let migratedCategories = 0;

  // ----------------------------------------------------------
  // 1. الوجبات
  // ----------------------------------------------------------

  for (const item of items) {
    const { id, ...itemData } = item;

    await setMenuItem(
      id,
      itemData
    );

    migratedItems++;
  }

  // ----------------------------------------------------------
  // 2. الأصناف
  // ----------------------------------------------------------

  for (const category of categories) {
    const { id, ...categoryData } = category;

    await setCategory(
      id,
      categoryData
    );

    migratedCategories++;
  }

  // ----------------------------------------------------------
  // 3. معلومات المطعم
  // ----------------------------------------------------------

  await setRestaurantInfo(
    restaurant
  );

  // ----------------------------------------------------------
  // 4. Hero
  // ----------------------------------------------------------

  await setHeroConfig(
    hero
  );

  return {
    menuItems: migratedItems,
    categories: migratedCategories,
    restaurant: true,
    hero: true,
  };
}
