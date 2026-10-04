import * as XLSX from 'xlsx';
import type { MenuItem, Category } from '../types';

export type ImportResult<T> = { rows: T[]; errors: string[] };
const text = (v: unknown) => v == null ? '' : String(v).trim();
const num = (v: unknown) => { const n = Number(v); return Number.isFinite(n) ? n : undefined; };
const bool = (v: unknown, fallback=false) => { const s=text(v).toLowerCase(); if (!s) return fallback; return ['true','1','yes','نعم'].includes(s); };

const CATEGORY_HEADERS = ['Category ID', 'Name AR', 'Name EN', 'Name KU', 'Icon'];
const ITEM_HEADERS = [
  'Item ID', 'Category ID', 'Name AR', 'Name EN', 'Name KU',
  'Description AR', 'Description EN', 'Description KU', 'Price',
  'Original Price', 'Image URL', 'Drive File ID', 'Popular',
  'Chef Special', 'Calories', 'Prep Time AR', 'Prep Time EN',
  'Prep Time KU', 'Available'
];

function downloadTemplate(headers: string[], sheetName: string, filename: string) {
  const ws = XLSX.utils.aoa_to_sheet([headers]);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, sheetName);
  XLSX.writeFile(wb, filename);
}

export function exportCategoriesToExcel(categories: Category[]) {
 const rows = categories.map(c => ({'Category ID':c.id,'Name AR':c.name,'Name EN':c.nameEn,'Name KU':c.nameKu||'','Icon':c.icon||''}));
 const ws=XLSX.utils.json_to_sheet(rows, {header: CATEGORY_HEADERS});
 const wb=XLSX.utils.book_new(); XLSX.utils.book_append_sheet(wb,ws,'Categories'); XLSX.writeFile(wb,'categories.xlsx');
}
export function exportMenuItemsToExcel(items: MenuItem[]) {
 const rows=items.map(i=>({'Item ID':i.id,'Category ID':i.category,'Name AR':i.name,'Name EN':i.nameEn||'','Name KU':i.nameKu||'','Description AR':i.description||'','Description EN':i.descriptionEn||'','Description KU':i.descriptionKu||'','Price':i.price,'Original Price':i.originalPrice??'','Image URL':i.image||'','Drive File ID':i.driveFileId||'','Popular':i.isPopular?'TRUE':'FALSE','Chef Special':i.isChefSpecial?'TRUE':'FALSE','Calories':i.calories??'','Prep Time AR':i.preparationTime||'','Prep Time EN':i.preparationTimeEn||'','Prep Time KU':i.preparationTimeKu||'','Available':i.available?'TRUE':'FALSE'}));
 const ws=XLSX.utils.json_to_sheet(rows, {header: ITEM_HEADERS});
 const wb=XLSX.utils.book_new(); XLSX.utils.book_append_sheet(wb,ws,'Menu Items'); XLSX.writeFile(wb,'menu-items.xlsx');
}
export function downloadExcelTemplate(type:'categories'|'items'){ 
  if(type==='categories') downloadTemplate(CATEGORY_HEADERS,'Categories','categories-template.xlsx');
  else downloadTemplate(ITEM_HEADERS,'Menu Items','menu-items-template.xlsx');
}

export async function parseCategoriesExcel(file:File):Promise<ImportResult<Category>>{
 const wb=XLSX.read(await file.arrayBuffer(),{type:'array'}); const ws=wb.Sheets[wb.SheetNames[0]]; const raw=XLSX.utils.sheet_to_json<Record<string,unknown>>(ws,{defval:''}); const errors:string[]=[]; const rows:Category[]=[];
 raw.forEach((r,index)=>{const line=index+2,id=text(r['Category ID']),name=text(r['Name AR']); if(!id) errors.push('السطر '+line+': Category ID مطلوب'); if(!name) errors.push('السطر '+line+': Name AR مطلوب'); if(!id||!name)return; rows.push({id,name,nameEn:text(r['Name EN'])||name,nameKu:text(r['Name KU'])||text(r['Name EN'])||name,icon:text(r['Icon'])||'Utensils'});});
 return {rows,errors};
}
export async function parseMenuItemsExcel(file:File,categories:Category[]):Promise<ImportResult<MenuItem>>{
 const wb=XLSX.read(await file.arrayBuffer(),{type:'array'}); const ws=wb.Sheets[wb.SheetNames[0]]; const raw=XLSX.utils.sheet_to_json<Record<string,unknown>>(ws,{defval:''}); const ids=new Set(categories.map(c=>c.id)); const errors:string[]=[]; const rows:MenuItem[]=[];
 raw.forEach((r,index)=>{const line=index+2,category=text(r['Category ID']),name=text(r['Name AR']),price=num(r['Price']); if(!category) errors.push('السطر '+line+': Category ID مطلوب'); else if(!ids.has(category)) errors.push('السطر '+line+': التصنيف "'+category+'" غير موجود في النظام'); if(!name) errors.push('السطر '+line+': Name AR مطلوب'); if(price===undefined||price<0) errors.push('السطر '+line+': Price غير صحيح'); if(!category||!ids.has(category)||!name||price===undefined||price<0)return; const item:MenuItem={id:text(r['Item ID'])||crypto.randomUUID(),category,name,nameEn:text(r['Name EN'])||name,nameKu:text(r['Name KU'])||text(r['Name EN'])||name,description:text(r['Description AR']),descriptionEn:text(r['Description EN']),descriptionKu:text(r['Description KU']),price,image:text(r['Image URL']),available:bool(r['Available'],true),isPopular:bool(r['Popular']),isChefSpecial:bool(r['Chef Special'])}; const op=num(r['Original Price']);if(op!==undefined)item.originalPrice=op; const cal=num(r['Calories']);if(cal!==undefined)item.calories=cal; item.preparationTime=text(r['Prep Time AR']);item.preparationTimeEn=text(r['Prep Time EN']);item.preparationTimeKu=text(r['Prep Time KU']);const drive=text(r['Drive File ID']);if(drive)item.driveFileId=drive;rows.push(item);});
 return {rows,errors};
}