import * as XLSX from 'xlsx';
import type { MenuItem, Category } from '../types';

export type ImportResult<T> = { rows: T[]; errors: string[] };
const text = (v: unknown) => v == null ? '' : String(v).trim();
const num = (v: unknown) => { const n = Number(v); return Number.isFinite(n) ? n : undefined; };
const bool = (v: unknown, fallback=false) => { const s=text(v).toLowerCase(); if (!s) return fallback; return ['true','1','yes','نعم'].includes(s); };

const normalizeName = (v: unknown) => text(v).toLowerCase().replace(/\s+/g, ' ').trim();
const makeId = (name: string, prefix: string) => {
  const slug = name
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return `${prefix}-${slug || crypto.randomUUID()}`;
};

const CATEGORY_HEADERS = ['Name AR', 'Name EN', 'Name KU', 'Icon'];
const ITEM_HEADERS = [
  'Name AR', 'Name EN', 'Name KU',
  'Category EN', 'Description AR', 'Description EN', 'Description KU', 'Price',
  'Original Price', 'Image URL', 'Drive File ID', 'Popular',
  'Chef Special', 'Calories', 'Prep Time AR', 'Prep Time EN',
  'Prep Time KU', 'Available'
];

const SAMPLE_CATEGORY = {
  'Name AR': 'برجر',
  'Name EN': 'Burger',
  'Name KU': 'بەرگەر',
  'Icon': 'Hamburger'
};

const SAMPLE_ITEM = {
  'Name AR': 'برجر لحم',
  'Name EN': 'Beef Burger',
  'Name KU': 'بەرگەری گۆشت',
  'Category EN': 'Burger',
  'Description AR': 'برجر لحم طازج مع الجبن والخضار',
  'Description EN': 'Fresh beef burger with cheese and vegetables',
  'Description KU': 'بەرگەری گۆشتی تازە لەگەڵ پەنیر و سەوزە',
  'Price': 7500,
  'Original Price': 8500,
  'Image URL': 'https://example.com/burger.jpg',
  'Drive File ID': '',
  'Popular': 'TRUE',
  'Chef Special': 'FALSE',
  'Calories': 650,
  'Prep Time AR': '15 دقيقة',
  'Prep Time EN': '15 min',
  'Prep Time KU': '١٥ خولەک',
  'Available': 'TRUE'
};

function downloadTemplate(headers: string[], sample: Record<string, unknown>, sheetName: string, filename: string) {
  const ws = XLSX.utils.aoa_to_sheet([
    headers,
    headers.map(header => sample[header] ?? '')
  ]);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, sheetName);
  XLSX.writeFile(wb, filename);
}

export function exportCategoriesToExcel(categories: Category[]) {
  const rows = categories.map(c => ({
    'Name AR': c.name,
    'Name EN': c.nameEn || c.name,
    'Name KU': c.nameKu || '',
    'Icon': c.icon || ''
  }));
  const ws = XLSX.utils.json_to_sheet(rows, { header: CATEGORY_HEADERS });
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Categories');
  XLSX.writeFile(wb, 'categories.xlsx');
}

export function exportMenuItemsToExcel(items: MenuItem[], categories: Category[] = []) {
  const categoryById = new Map(categories.map(c => [c.id, c.nameEn || c.name]));
  const rows = items.map(i => ({
    'Name AR': i.name,
    'Name EN': i.nameEn || i.name,
    'Name KU': i.nameKu || '',
    'Category EN': categoryById.get(i.category) || '',
    'Description AR': i.description || '',
    'Description EN': i.descriptionEn || '',
    'Description KU': i.descriptionKu || '',
    'Price': i.price,
    'Original Price': i.originalPrice ?? '',
    'Image URL': i.image || '',
    'Drive File ID': i.driveFileId || '',
    'Popular': i.isPopular ? 'TRUE' : 'FALSE',
    'Chef Special': i.isChefSpecial ? 'TRUE' : 'FALSE',
    'Calories': i.calories ?? '',
    'Prep Time AR': i.preparationTime || '',
    'Prep Time EN': i.preparationTimeEn || '',
    'Prep Time KU': i.preparationTimeKu || '',
    'Available': i.available ? 'TRUE' : 'FALSE'
  }));
  const ws = XLSX.utils.json_to_sheet(rows, { header: ITEM_HEADERS });
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Menu Items');
  XLSX.writeFile(wb, 'menu-items.xlsx');
}

export function downloadExcelTemplate(type: 'categories' | 'items') {
  if (type === 'categories') downloadTemplate(CATEGORY_HEADERS, SAMPLE_CATEGORY, 'Categories', 'categories-template.xlsx');
  else downloadTemplate(ITEM_HEADERS, SAMPLE_ITEM, 'Menu Items', 'menu-items-template.xlsx');
}

export async function parseCategoriesExcel(file: File, existingCategories: Category[] = []): Promise<ImportResult<Category>> {
  const wb = XLSX.read(await file.arrayBuffer(), { type: 'array' });
  const ws = wb.Sheets[wb.SheetNames[0]];
  const raw = XLSX.utils.sheet_to_json<Record<string, unknown>>(ws, { defval: '' });
  const errors: string[] = [];
  const rows: Category[] = [];
  const existingByNameEn = new Map(existingCategories.map(c => [normalizeName(c.nameEn || c.name), c]));
  const usedIds = new Set(existingCategories.map(c => c.id));

  raw.forEach((r, index) => {
    const line = index + 2;
    const name = text(r['Name AR']);
    const nameEn = text(r['Name EN']);

    if (!nameEn) errors.push('السطر ' + line + ': Name EN مطلوب');
    if (!name) errors.push('السطر ' + line + ': Name AR مطلوب');
    if (!nameEn || !name) return;

    const existing = existingByNameEn.get(normalizeName(nameEn));
    let id = existing?.id || makeId(nameEn, 'category');

    if (!existing) {
      let uniqueId = id;
      let counter = 2;
      while (usedIds.has(uniqueId)) uniqueId = `${id}-${counter++}`;
      id = uniqueId;
      usedIds.add(id);
    }

    rows.push({
      id,
      name,
      nameEn,
      nameKu: text(r['Name KU']) || nameEn || name,
      icon: text(r['Icon']) || 'Utensils'
    });
  });

  return { rows, errors };
}

export async function parseMenuItemsExcel(
  file: File,
  categories: Category[],
  existingItems: MenuItem[] = []
): Promise<ImportResult<MenuItem>> {
  const wb = XLSX.read(await file.arrayBuffer(), { type: 'array' });
  const ws = wb.Sheets[wb.SheetNames[0]];
  const raw = XLSX.utils.sheet_to_json<Record<string, unknown>>(ws, { defval: '' });
  const categoryByNameEn = new Map(categories.map(c => [normalizeName(c.nameEn || c.name), c]));
  const existingByNameEn = new Map(existingItems.map(i => [normalizeName(i.nameEn || i.name), i]));
  const usedIds = new Set(existingItems.map(i => i.id));
  const errors: string[] = [];
  const rows: MenuItem[] = [];

  raw.forEach((r, index) => {
    const line = index + 2;
    const categoryNameEn = text(r['Category EN']);
    const name = text(r['Name AR']);
    const nameEn = text(r['Name EN']);
    const price = num(r['Price']);

    if (!categoryNameEn) errors.push('السطر ' + line + ': Category EN مطلوب');
    else if (!categoryByNameEn.has(normalizeName(categoryNameEn))) errors.push('السطر ' + line + ': التصنيف الإنجليزي "' + categoryNameEn + '" غير موجود في النظام');

    if (!nameEn) errors.push('السطر ' + line + ': Name EN مطلوب');
    if (!name) errors.push('السطر ' + line + ': Name AR مطلوب');
    if (price === undefined || price < 0) errors.push('السطر ' + line + ': Price غير صحيح');

    const category = categoryByNameEn.get(normalizeName(categoryNameEn));
    if (!category || !nameEn || !name || price === undefined || price < 0) return;

    const existing = existingByNameEn.get(normalizeName(nameEn));
    let id = existing?.id || makeId(nameEn, 'item');

    if (!existing) {
      let uniqueId = id;
      let counter = 2;
      while (usedIds.has(uniqueId)) uniqueId = `${id}-${counter++}`;
      id = uniqueId;
      usedIds.add(id);
    }

    const item: MenuItem = {
      id,
      category: category.id,
      name,
      nameEn,
      nameKu: text(r['Name KU']) || nameEn || name,
      description: text(r['Description AR']),
      descriptionEn: text(r['Description EN']),
      descriptionKu: text(r['Description KU']),
      price,
      image: text(r['Image URL']),
      available: bool(r['Available'], true),
      isPopular: bool(r['Popular']),
      isChefSpecial: bool(r['Chef Special'])
    };

    const op = num(r['Original Price']);
    if (op !== undefined) item.originalPrice = op;
    const cal = num(r['Calories']);
    if (cal !== undefined) item.calories = cal;
    item.preparationTime = text(r['Prep Time AR']);
    item.preparationTimeEn = text(r['Prep Time EN']);
    item.preparationTimeKu = text(r['Prep Time KU']);
    const drive = text(r['Drive File ID']);
    if (drive) item.driveFileId = drive;
    rows.push(item);
  });

  return { rows, errors };
}
