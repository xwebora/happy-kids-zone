import {
  collection,
  getDocs,
  addDoc,
  getDoc,
  updateDoc,
  deleteDoc,
  doc,
  setDoc,
  onSnapshot,
  writeBatch,
} from 'firebase/firestore';

import { db } from './firestore';
import {
  MenuItem,
  Category,
  RestaurantInfo,
  HeroConfig,
  WelcomeConfig
} from '../types';

const MENU_ITEMS_COLLECTION = 'menuItems';
const CATEGORIES_COLLECTION = 'categories';
const RESTAURANT_COLLECTION = 'restaurant';
const HERO_COLLECTION = 'hero';
const WELCOME_COLLECTION = 'welcome';

const menuItemsCollection = collection(db, MENU_ITEMS_COLLECTION);

export async function getMenuItems(): Promise<MenuItem[]> {
  const snapshot = await getDocs(menuItemsCollection);
  return snapshot.docs.map((item) => ({ id: item.id, ...item.data() })) as MenuItem[];
}

export function subscribeToMenuItems(callback: (items: MenuItem[]) => void) {
  return onSnapshot(menuItemsCollection, (snapshot) => {
    const items = snapshot.docs.map((item) => ({ id: item.id, ...item.data() })) as MenuItem[];
    callback(items);
  });
}

export async function addMenuItem(item: Omit<MenuItem, 'id'>): Promise<string> {
  const docRef = await addDoc(menuItemsCollection, item);
  return docRef.id;
}

export async function setMenuItem(id: string, item: Omit<MenuItem, 'id'>): Promise<void> {
  await setDoc(doc(db, MENU_ITEMS_COLLECTION, id), item);
}

export async function updateMenuItem(id: string, item: Partial<Omit<MenuItem, 'id'>>): Promise<void> {
  await updateDoc(doc(db, MENU_ITEMS_COLLECTION, id), item);
}

export async function updateMenuItemsOrder(items: MenuItem[]): Promise<void> {
  const batch = writeBatch(db);
  items.forEach((item, index) => {
    batch.update(doc(db, MENU_ITEMS_COLLECTION, item.id), { sortOrder: index });
  });
  await batch.commit();
}

export async function deleteMenuItem(id: string): Promise<void> {
  await deleteDoc(doc(db, MENU_ITEMS_COLLECTION, id));
}

export async function deleteAllMenuItems(items: MenuItem[]): Promise<void> {
  const batchSize = 450;
  for (let i = 0; i < items.length; i += batchSize) {
    const batch = writeBatch(db);
    items.slice(i, i + batchSize).forEach((item) => {
      batch.delete(doc(db, MENU_ITEMS_COLLECTION, item.id));
    });
    await batch.commit();
  }
}

export async function getCategories(): Promise<Category[]> {
  const snapshot = await getDocs(collection(db, CATEGORIES_COLLECTION));
  return snapshot.docs.map((item) => ({ id: item.id, ...item.data() })) as Category[];
}

export function subscribeToCategories(callback: (categories: Category[]) => void) {
  return onSnapshot(collection(db, CATEGORIES_COLLECTION), (snapshot) => {
    const categories = snapshot.docs.map((item) => ({ id: item.id, ...item.data() })) as Category[];
    callback(categories);
  });
}

export async function setCategory(id: string, category: Omit<Category, 'id'>): Promise<void> {
  await setDoc(doc(db, CATEGORIES_COLLECTION, id), category);
}

export async function updateCategoriesOrder(categories: Category[]): Promise<void> {
  const batch = writeBatch(db);
  categories.forEach((category, index) => {
    batch.update(doc(db, CATEGORIES_COLLECTION, category.id), { sortOrder: index });
  });
  await batch.commit();
}

export async function deleteCategory(id: string): Promise<void> {
  await deleteDoc(doc(db, CATEGORIES_COLLECTION, id));
}

export async function setRestaurantInfo(restaurant: RestaurantInfo): Promise<void> {
  await setDoc(doc(db, RESTAURANT_COLLECTION, 'main'), restaurant);
}

export async function getRestaurantInfo(): Promise<RestaurantInfo | null> {
  const snapshot = await getDocs(collection(db, RESTAURANT_COLLECTION));
  const mainDoc = snapshot.docs.find((item) => item.id === 'main');
  return mainDoc ? mainDoc.data() as RestaurantInfo : null;
}

export async function setHeroConfig(hero: HeroConfig): Promise<void> {
  await setDoc(doc(db, HERO_COLLECTION, 'main'), hero);
}

export async function getHeroConfig(): Promise<HeroConfig | null> {
  const snapshot = await getDocs(collection(db, HERO_COLLECTION));
  const mainDoc = snapshot.docs.find((item) => item.id === 'main');
  return mainDoc ? mainDoc.data() as HeroConfig : null;
}

export interface MigrationResult {
  menuItems: number;
  categories: number;
  restaurant: boolean;
  hero: boolean;
}

export async function migrateAllDataToFirestore(items: MenuItem[], categories: Category[], restaurant: RestaurantInfo, hero: HeroConfig): Promise<MigrationResult> {
  let migratedItems = 0;
  let migratedCategories = 0;
  for (const item of items) {
    const { id, ...itemData } = item;
    await setMenuItem(id, itemData);
    migratedItems++;
  }
  for (const category of categories) {
    const { id, ...categoryData } = category;
    await setCategory(id, categoryData);
    migratedCategories++;
  }
  await setRestaurantInfo(restaurant);
  await setHeroConfig(hero);
  return { menuItems: migratedItems, categories: migratedCategories, restaurant: true, hero: true };
}

const DEFAULT_WELCOME_CONFIG: WelcomeConfig = {
  enabled: true,
  backgroundType: 'video',
  backgroundUrl: '/happy-kids-zone/welcome-video.mp4',
  logoUrl: '',
  welcomeAr: 'أهلاً وسهلاً بكم',
  welcomeKu: 'بەخێربێن',
  welcomeEn: 'Welcome',
  welcomeSy: 'ܐܚܝܐ ܘܫܠܡܐ',
  overlayOpacity: 0.45,
  animation: 'fade'
};

export async function getWelcomeConfig(): Promise<WelcomeConfig> {
  try {
    const snapshot = await getDoc(doc(db, WELCOME_COLLECTION, 'main'));
    if (snapshot.exists()) return { ...DEFAULT_WELCOME_CONFIG, ...snapshot.data() } as WelcomeConfig;
    return DEFAULT_WELCOME_CONFIG;
  } catch (error) {
    console.error('Error loading welcome configuration:', error);
    return DEFAULT_WELCOME_CONFIG;
  }
}

export async function setWelcomeConfig(config: WelcomeConfig): Promise<void> {
  await setDoc(doc(db, WELCOME_COLLECTION, 'main'), config);
}
