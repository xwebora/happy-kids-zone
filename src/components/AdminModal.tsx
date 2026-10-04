import React, { useState, useRef } from 'react';
import { deleteField } from 'firebase/firestore';
import { 
  X, 
  Plus, 
  Save, 
  Trash2, 
  Edit2, 
  Check, 
  CloudUpload, 
  LogOut, 
  Sparkles, 
  DollarSign, 
  RefreshCw, 
  AlertTriangle,
  Image as ImageIcon,
  CheckCircle2,
  Lock,
  Layers,
  LayoutTemplate,
  Sliders,
  Settings,
  ExternalLink,
  Copy,
  FileSpreadsheet,
  Upload,
  Download,
  GripVertical
} from 'lucide-react';
import {
  MenuItem,
  Category,
  RestaurantInfo,
  HeroConfig,
  Language,
  WelcomeConfig
} from '../types';
import { translations } from '../utils/i18n';
import { exportCategoriesToExcel, exportMenuItemsToExcel, downloadExcelTemplate, parseCategoriesExcel, parseMenuItemsExcel } from '../utils/excelService';
import { User } from 'firebase/auth';
import {
  updateMenuItem,
  deleteMenuItem,
  deleteAllMenuItems,
  setMenuItem,
  migrateAllDataToFirestore,
  setRestaurantInfo,
  setCategory,
  deleteCategory,
  reorderMenuItemsInCategory
} from '../services/menuService';

interface AdminModalProps {
  isOpen: boolean;
  onClose: () => void;
  items: MenuItem[];
  categories: Category[];
  hero: HeroConfig;
  restaurant: RestaurantInfo;
  language: Language;
  onUpdateItems: (newItems: MenuItem[]) => void;
  onUpdateCategories: (newCats: Category[]) => void;
  onUpdateHero: (newHero: HeroConfig) => void;
  onUpdateRestaurant: (info: RestaurantInfo) => void;
  welcomeConfig: WelcomeConfig;
  onUpdateWelcome: (config: WelcomeConfig) => void;
  user: User | null;
  onUserChange: (user: User | null) => void;
  onAdminLogout: () => void;
}

export const AdminModal: React.FC<AdminModalProps> = ({
  isOpen,
  onClose,
  items,
  categories,
  hero,
  restaurant,
  language,
  onUpdateItems,
  onUpdateCategories,
  onUpdateHero,
  onUpdateRestaurant,
  welcomeConfig,
  onUpdateWelcome,
  user,
  onUserChange,
  onAdminLogout,
}) => {
  const t = translations[language];
  const isAr = language === 'ar';
  const isKu = language === 'ku';

    // Admin Dashboard Tabs
  const [activeTab, setActiveTab] = useState<
    'items' | 'add-item' | 'categories' | 'hero' | 'welcome' | 'settings' | 'drive' | 'data'
  >('items');

  // Item Form State
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  const [formNameAr, setFormNameAr] = useState('');
  const [formNameEn, setFormNameEn] = useState('');
  const [formNameKu, setFormNameKu] = useState('');
  const [formDescAr, setFormDescAr] = useState('');
  const [formDescEn, setFormDescEn] = useState('');
  const [formDescKu, setFormDescKu] = useState('');
  const [formPrice, setFormPrice] = useState<number | ''>('');
  const [formOrigPrice, setFormOrigPrice] = useState<number | ''>('');
  const [formCategory, setFormCategory] = useState(categories[0]?.id || 'main');
  const [formImageUrl, setFormImageUrl] = useState('');
  const [formCalories, setFormCalories] = useState<number | ''>('');
  const [formPrepTimeAr, setFormPrepTimeAr] = useState('');
  const [formPrepTimeEn, setFormPrepTimeEn] = useState('');
  const [formPrepTimeKu, setFormPrepTimeKu] = useState('');
  const [formIsSpecial, setFormIsSpecial] = useState(false);
  const [formIsPopular, setFormIsPopular] = useState(false);
  const [formAvailable, setFormAvailable] = useState(true);
  const [syncBanner, setSyncBanner] = useState<string | null>(null);


  // Quick Price State
  const [quickPrices, setQuickPrices] = useState<Record<string, number>>({});
  const [savedSuccessId, setSavedSuccessId] = useState<string | null>(null);
  const [selectedItemIds, setSelectedItemIds] = useState<Set<string>>(new Set());

  // MENU_ORDERING_FEATURE
  const [draggedItemId, setDraggedItemId] = useState<string | null>(null);

  const orderedItems = [...items].sort((a, b) => {
    const catA = categories.find((c) => c.id === a.category)?.sortOrder ?? 999999;
    const catB = categories.find((c) => c.id === b.category)?.sortOrder ?? 999999;
    if (catA !== catB) return catA - catB;
    const orderA = a.sortOrder ?? items.findIndex((x) => x.id === a.id);
    const orderB = b.sortOrder ?? items.findIndex((x) => x.id === b.id);
    return orderA - orderB;
  });

  const handleMenuItemDrop = async (targetId: string) => {
    if (!draggedItemId || draggedItemId === targetId) return;
    const dragged = items.find((x) => x.id === draggedItemId);
    const target = items.find((x) => x.id === targetId);
    if (!dragged || !target || dragged.category !== target.category) return;

    const categoryItems = orderedItems.filter((x) => x.category === dragged.category);
    const from = categoryItems.findIndex((x) => x.id === draggedItemId);
    const to = categoryItems.findIndex((x) => x.id === targetId);
    if (from < 0 || to < 0) return;

    const next = [...categoryItems];
    const [moved] = next.splice(from, 1);
    next.splice(to, 0, moved);
    const updates = new Map(next.map((x, index) => [x.id, index]));
    const updatedItems = items.map((x) => updates.has(x.id) ? { ...x, sortOrder: updates.get(x.id) } : x);

    setDraggedItemId(null);
    onUpdateItems(updatedItems);
    try {
      await reorderMenuItemsInCategory(updatedItems, dragged.category);
      setSyncBanner(isAr ? 'تم حفظ ترتيب الوجبات' : 'Meal order saved');
      setTimeout(() => setSyncBanner(null), 2500);
    } catch (error) {
      console.error('Failed to save meal order:', error);
      setSyncBanner(isAr ? 'تعذر حفظ ترتيب الوجبات' : 'Could not save meal order');
    }
  };

  // Category Form State
  const [editingCat, setEditingCat] = useState<Category | null>(null);
  const [catNameAr, setCatNameAr] = useState('');
  const [catNameEn, setCatNameEn] = useState('');
  const [catNameKu, setCatNameKu] = useState('');
  const [catIcon, setCatIcon] = useState('Utensils');

  // Hero Edit Form State
  const [heroForm, setHeroForm] = useState<HeroConfig>(hero);
  const [heroSavedAlert, setHeroSavedAlert] = useState(false);

    // Welcome Screen Edit Form State
  const [welcomeForm, setWelcomeForm] = useState<WelcomeConfig>(welcomeConfig);
  const [welcomeSavedAlert, setWelcomeSavedAlert] = useState(false);

  // Sync welcomeForm whenever welcomeConfig changes
  React.useEffect(() => {
    setWelcomeForm(welcomeConfig);
  }, [welcomeConfig]);

  // Sync heroForm whenever hero prop changes
  React.useEffect(() => {
    setHeroForm(hero);
  }, [hero]);

  // Settings State (Credentials & info)
  const [settingsForm, setSettingsForm] = useState<RestaurantInfo>(restaurant);
  const [settingsSavedAlert, setSettingsSavedAlert] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);

  const handleCopyMenuLink = () => {
    if (typeof window !== 'undefined') {
      const url = `${window.location.origin}${window.location.pathname}#/menu`;
      navigator.clipboard.writeText(url).then(() => {
        setLinkCopied(true);
        setTimeout(() => setLinkCopied(false), 2500);
      });
    }
  };

  const [excelType, setExcelType] = useState<'categories' | 'items'>('items');
  const [excelBusy, setExcelBusy] = useState(false);
  const [excelPreview, setExcelPreview] = useState<{rows:any[];errors:string[]}>({rows:[],errors:[]});
  const excelInputRef = useRef<HTMLInputElement>(null);
  const handleExcelImport = async (file:File) => { setExcelBusy(true); try { const result=excelType==='categories'?await parseCategoriesExcel(file):await parseMenuItemsExcel(file,categories,items); setExcelPreview(result); } catch(error:any){setExcelPreview({rows:[],errors:[error?.message||'تعذر قراءة ملف Excel']});} finally{setExcelBusy(false);} };
  const applyExcelImport = async () => { if(excelPreview.errors.length||!excelPreview.rows.length)return; setExcelBusy(true); try { if(excelType==='categories'){for(const category of excelPreview.rows as Category[]){const {id,...data}=category;await setCategory(id,data);}onUpdateCategories(excelPreview.rows as Category[]);} else {for(const item of excelPreview.rows as MenuItem[]){const {id,...data}=item;await setMenuItem(id,data);}onUpdateItems(prev => { const imported = excelPreview.rows as MenuItem[]; const byId = new Map(prev.map(item => [item.id, item])); imported.forEach(item => byId.set(item.id, item)); return Array.from(byId.values()); });} setSyncBanner(isAr?'تم استيراد بيانات Excel بنجاح':'Excel data imported successfully');setExcelPreview({rows:[],errors:[]});}catch(error:any){setExcelPreview(p=>({...p,errors:[...p.errors,error?.message||'حدث خطأ أثناء الحفظ']}));}finally{setExcelBusy(false);} };
  // Confirmation Modal
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
  } | null>(null);

  if (!isOpen) return null;

  // Convert common Google Drive share links into an image URL that can be rendered directly.
  const normalizeGoogleDriveImageUrl = (url: string): string => {
    const value = url.trim();
    if (!value) return '';

    const match =
      value.match(/drive\.google\.com\/file\/d\/([a-zA-Z0-9_-]+)/) ||
      value.match(/[?&]id=([a-zA-Z0-9_-]+)/) ||
      value.match(/drive\.google\.com\/uc\/[^?]*\?[^#]*id=([a-zA-Z0-9_-]+)/);

    if (match?.[1]) {
      return `https://drive.google.com/thumbnail?id=${match[1]}&sz=w1600`;
    }

    return value;
  };

  // Populate Item form for editing
  const startEditItem = (item: MenuItem) => {
    setEditingItem(item);
    setFormNameAr(item.name);
    setFormNameEn(item.nameEn || '');
    setFormNameKu(item.nameKu || '');
    setFormDescAr(item.description);
    setFormDescEn(item.descriptionEn || '');
    setFormDescKu(item.descriptionKu || '');
    setFormPrice(item.price);
    setFormOrigPrice(item.originalPrice || '');
    setFormCategory(item.category);
    setFormImageUrl(item.image);
    setFormCalories(item.calories || '');
    setFormPrepTimeAr(item.preparationTime || '');
    setFormPrepTimeEn(item.preparationTimeEn || '');
    setFormPrepTimeKu(item.preparationTimeKu || '');
    setFormIsSpecial(!!item.isChefSpecial);
    setFormIsPopular(!!item.isPopular);
    setFormAvailable(item.available);
    setActiveTab('add-item');
  };

  const resetItemForm = () => {
    setEditingItem(null);
    setFormNameAr('');
    setFormNameEn('');
    setFormNameKu('');
    setFormDescAr('');
    setFormDescEn('');
    setFormDescKu('');
    setFormPrice('');
    setFormOrigPrice('');
    setFormCategory(categories[0]?.id || 'main');
    setFormImageUrl('');
    setFormCalories('');
    setFormPrepTimeAr('');
    setFormPrepTimeEn('');
    setFormPrepTimeKu('');
    setFormIsSpecial(false);
    setFormIsPopular(false);
    setFormAvailable(true);
  };

  // Save Item (Create or Update)
const handleSaveItem = async (e: React.FormEvent) => {
  console.log('🟡 handleSaveCategory CALLED');
  e.preventDefault();

  if (!formNameAr || formPrice === '') {
    alert(
      isAr
        ? 'يرجى إدخال اسم الوجبة والسعر'
        : 'Please provide dish name and price'
    );
    return;
  }

  const finalImageUrl =
    normalizeGoogleDriveImageUrl(formImageUrl) ||
    'https://drive.google.com/thumbnail?id=1D1HT9bZB2wj3S9K3tazS68J-_GPdZ5wO&sz=w1600';

  try {
    // ============================================
    // تعديل وجبة موجودة
    // ============================================
    if (editingItem) {
      // نبني التعديل فقط من القيم التي أدخلها المستخدم.
      // الحقول الاختيارية الفارغة لا تكتب قيمة فارغة ولا تستبدل قيمة موجودة.
      const updatedItem: Record<string, unknown> = {
        name: formNameAr,
        nameEn: formNameEn || formNameAr,
        nameKu: formNameKu || formNameEn || formNameAr,
        description: formDescAr,
        descriptionEn: formDescEn || formDescAr,
        descriptionKu: formDescKu || formDescEn || formDescAr,
        category: formCategory,
        image: finalImageUrl,
        available: formAvailable,
        isChefSpecial: formIsSpecial,
        isPopular: formIsPopular,
        sortOrder: items.filter((it) => it.category === formCategory).length,
      };

      // السعر: إذا تركه المستخدم فارغاً أثناء التعديل، يبقى السعر القديم كما هو.
      if (formPrice !== '') {
        updatedItem.price = Number(formPrice);
      }

      // السعر قبل الخصم: فارغ = حذف القيمة القديمة من Firestore.
      updatedItem.originalPrice = formOrigPrice === '' ? deleteField() : Number(formOrigPrice);

      // السعرات: فارغ = حذف القيمة القديمة من Firestore.
      updatedItem.calories = formCalories === '' ? deleteField() : Number(formCalories);

      // وقت التحضير لكل لغة مستقل. الفارغ يحذف القيمة القديمة بدلاً من نسخ لغة أخرى.
      updatedItem.preparationTime = formPrepTimeAr.trim() ? formPrepTimeAr.trim() : deleteField();
      updatedItem.preparationTimeEn = formPrepTimeEn.trim() ? formPrepTimeEn.trim() : deleteField();
      updatedItem.preparationTimeKu = formPrepTimeKu.trim() ? formPrepTimeKu.trim() : deleteField();

      // حفظ في Firestore
      await updateMenuItem(
        editingItem.id,
        updatedItem as Partial<Omit<MenuItem, 'id'>>
      );

      // تحديث واجهة الموقع
      const updatedList = items.map((it) =>
        it.id === editingItem.id
          ? {
              ...it,
              ...updatedItem,
            }
          : it
      );

      onUpdateItems(updatedList);

      setSyncBanner(
        isAr
          ? 'تم تحديث الوجبة وحفظها في قاعدة البيانات'
          : 'Item updated and saved to database'
      );
    }

    // ============================================
    // إضافة وجبة جديدة
    // ============================================
    else {
      const newItemData: Omit<MenuItem, 'id'> = {
        name: formNameAr,
        nameEn: formNameEn || formNameAr,
        nameKu: formNameKu || formNameEn || formNameAr,
        description: formDescAr,
        descriptionEn: formDescEn || formDescAr,
        descriptionKu: formDescKu || formDescEn || formDescAr,
        price: Number(formPrice),
        category: formCategory,
        image: finalImageUrl,
        available: formAvailable,
        isChefSpecial: formIsSpecial,
        isPopular: formIsPopular,
      };

      // الحقول الاختيارية لا تُرسل إلى Firestore عندما تكون فارغة.
      if (formOrigPrice !== '') newItemData.originalPrice = Number(formOrigPrice);
      if (formCalories !== '') newItemData.calories = Number(formCalories);
      if (formPrepTimeAr.trim()) newItemData.preparationTime = formPrepTimeAr.trim();
      if (formPrepTimeEn.trim()) newItemData.preparationTimeEn = formPrepTimeEn.trim();
      if (formPrepTimeKu.trim()) newItemData.preparationTimeKu = formPrepTimeKu.trim();
      // Generate the document ID for the Firestore menu item.
      const firestoreId = crypto.randomUUID();

      // حفظ في Firestore
      await setMenuItem(
        firestoreId,
        newItemData
      );

      // استخدام Firestore ID كـ ID للوجبة
      const newItem: MenuItem = {
        id: firestoreId,
        ...newItemData,
      };

      // تحديث الواجهة و localStorage
      onUpdateItems([
        newItem,
        ...items,
      ]);

      setSyncBanner(
        isAr
          ? 'تمت إضافة الوجبة وحفظها في قاعدة البيانات'
          : 'Item added and saved to database'
      );
    }

    setTimeout(() => {
      setSyncBanner(null);
    }, 3000);

    resetItemForm();
    setActiveTab('items');

  } catch (error: any) {
    console.error(
      '❌ Firestore save error:',
      error
    );

    alert(
      isAr
        ? `حدث خطأ أثناء حفظ الوجبة في قاعدة البيانات:\n${error.message || error}`
        : `Failed to save item to database:\n${error.message || error}`
    );
  }
};

  // Delete Item Confirmation
 const handleDeleteItem = (item: MenuItem) => {
  setConfirmDialog({
    isOpen: true,
    title: isAr
      ? 'حذف الوجبة نهائياً'
      : 'Delete Dish Permanently',

    message: isAr
      ? `هل أنت متأكد من حذف وجبة "${item.name}" من قائمة المطعم؟`
      : `Are you sure you want to delete "${item.nameEn || item.name}" from the menu?`,

    onConfirm: async () => {
      setConfirmDialog(null);

      try {
        // حذف من Firestore
        await deleteMenuItem(item.id);

        // تحديث الواجهة
        onUpdateItems(
          items.filter(
            (i) => i.id !== item.id
          )
        );

        setSyncBanner(
          isAr
            ? 'تم حذف الوجبة من قاعدة البيانات'
            : 'Item deleted from database'
        );

        setTimeout(() => {
          setSyncBanner(null);
        }, 3000);

      } catch (error: any) {
        console.error(
          '❌ Firestore delete error:',
          error
        );

        alert(
          isAr
            ? `تعذر حذف الوجبة من قاعدة البيانات:\n${error.message || error}`
            : `Failed to delete item:\n${error.message || error}`
        );
      }
    },
  });};


const handleDeleteSelectedItems = () => {
  const selectedItems = items.filter((item) => selectedItemIds.has(item.id));
  if (selectedItems.length === 0) return;
  setConfirmDialog({
    isOpen: true,
    title: isAr ? 'حذف الوجبات المحددة' : 'Delete Selected Meals',
    message: isAr
      ? `سيتم حذف ${selectedItems.length} وجبة محددة نهائياً من قاعدة البيانات. هل أنت متأكد؟`
      : `${selectedItems.length} selected meals will be permanently deleted from the database. Are you sure?`,
    onConfirm: async () => {
      setConfirmDialog(null);
      setExcelBusy(true);
      try {
        await deleteAllMenuItems(selectedItems);
        const deletedIds = new Set(selectedItems.map((item) => item.id));
        onUpdateItems(items.filter((item) => !deletedIds.has(item.id)));
        setSelectedItemIds(new Set());
        setSyncBanner(isAr ? `تم حذف ${selectedItems.length} وجبة بنجاح` : `${selectedItems.length} meals deleted successfully`);
      } catch (error: any) {
        console.error('Delete selected meals error:', error);
        alert(isAr ? `تعذر حذف الوجبات المحددة:\n${error?.message || error}` : `Failed to delete selected meals:\n${error?.message || error}`);
      } finally {
        setExcelBusy(false);
      }
      setTimeout(() => setSyncBanner(null), 4000);
    },
  });
};

const toggleItemSelection = (id: string) => {
  setSelectedItemIds((prev) => {
    const next = new Set(prev);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    return next;
  });
};

const toggleSelectAllItems = () => {
  setSelectedItemIds((prev) => {
    if (items.length > 0 && prev.size === items.length) return new Set();
    return new Set(items.map((item) => item.id));
  });
};

const handleDeleteAllItems = () => {
  if (items.length === 0) {
    setSyncBanner(isAr ? 'لا توجد وجبات لحذفها' : 'There are no meals to delete');
    setTimeout(() => setSyncBanner(null), 2500);
    return;
  }

  setConfirmDialog({
    isOpen: true,
    title: isAr ? 'حذف جميع الوجبات نهائياً' : 'Delete All Meals Permanently',
    message: isAr
      ? `تحذير: سيتم حذف جميع الوجبات وعددها ${items.length} من قاعدة البيانات نهائياً. لا يمكن التراجع عن هذه العملية. هل أنت متأكد؟`
      : `Warning: All ${items.length} meals will be permanently deleted from the database. This action cannot be undone. Are you sure?`,
    onConfirm: async () => {
      setConfirmDialog(null);
      setExcelBusy(true);

      try {
        await deleteAllMenuItems(items);
        onUpdateItems([]);
        setSyncBanner(
          isAr
            ? `تم حذف جميع الوجبات (${items.length}) بنجاح`
            : `All ${items.length} meals were deleted successfully`
        );
      } catch (error: any) {
        console.error('❌ Delete all meals error:', error);
        alert(
          isAr
            ? `تعذر حذف جميع الوجبات من قاعدة البيانات:\\n${error?.message || error}`
            : `Failed to delete all meals:\\n${error?.message || error}`
        );
      } finally {
        setExcelBusy(false);
      }

      setTimeout(() => setSyncBanner(null), 4000);
    },
  });
};

// نقل الوجبات الحالية إلى Firestore
const handleMigrateItemsToFirestore = async () => {
  if (
    !items ||
    items.length === 0
  ) {
    alert(
      isAr
        ? 'لا توجد وجبات لنقلها إلى قاعدة البيانات'
        : 'There are no menu items to migrate'
    );
    return;
  }

  const confirmed = window.confirm(
    isAr
      ? `سيتم نقل جميع بيانات لوحة التحكم إلى Firestore:

🍔 الوجبات: ${items.length}
📂 الأصناف: ${categories.length}
🏪 معلومات المطعم: نعم
🖼️ إعدادات Hero: نعم

لن يتم حذف أي شيء من جهازك أو Google Drive.

هل تريد المتابعة؟`
      : `All dashboard data will be migrated to Firestore:

🍔 Menu items: ${items.length}
📂 Categories: ${categories.length}
🏪 Restaurant information: Yes
🖼️ Hero settings: Yes

Nothing will be deleted from your device or Google Drive.

Continue?`
  );

  if (!confirmed) return;

  try {
    setSyncBanner(
      isAr
        ? 'جاري مزامنة جميع البيانات...'
        : 'Synchronizing all data...'
    );

    const result =
      await migrateAllDataToFirestore(
        items,
        categories,
        restaurant,
        hero
      );

    setSyncBanner(
      isAr
        ? `تمت المزامنة بنجاح: ${result.menuItems} وجبة و ${result.categories} صنف`
        : `Sync successful: ${result.menuItems} items and ${result.categories} categories`
    );

    setTimeout(() => {
      setSyncBanner(null);
    }, 5000);

  } catch (error: any) {
    console.error(
      '❌ Full Firestore migration error:',
      error
    );

    setSyncBanner(null);

    alert(
      isAr
        ? `حدث خطأ أثناء مزامنة البيانات:\n${error.message || error}`
        : `Database synchronization failed:\n${error.message || error}`
    );
  }
};
// Quick Inline Price Save
const handleQuickPriceSave = async (id: string) => {
  const newPrice = quickPrices[id];

  if (
    newPrice === undefined ||
    isNaN(newPrice) ||
    newPrice <= 0
  ) {
    return;
  }

  try {
    await updateMenuItem(id, {
      price: newPrice,
    });

    onUpdateItems(
      items.map((it) =>
        it.id === id
          ? {
              ...it,
              price: newPrice,
            }
          : it
      )
    );

    setSavedSuccessId(id);

    setTimeout(() => {
      setSavedSuccessId(null);
    }, 2000);

  } catch (error: any) {
    console.error(
      '❌ Price update error:',
      error
    );

    alert(
      isAr
        ? 'تعذر تحديث السعر في قاعدة البيانات'
        : 'Failed to update price'
    );
  }
};
  // Toggle Availability
 const handleToggleAvailability = async (id: string) => {
  const item = items.find(
    (it) => it.id === id
  );

  if (!item) return;

  const newAvailable = !item.available;

  try {
    await updateMenuItem(id, {
      available: newAvailable,
    });

    onUpdateItems(
      items.map((it) =>
        it.id === id
          ? {
              ...it,
              available: newAvailable,
            }
          : it
      )
    );

  } catch (error: any) {
    console.error(
      '❌ Availability update error:',
      error
    );

    alert(
      isAr
        ? 'تعذر تحديث حالة التوفر'
        : 'Failed to update availability'
    );
  }
};
 // Category Actions: Add or Update Category
const handleSaveCategory = async (e: React.FormEvent) => {
  e.preventDefault();

  if (!catNameAr.trim()) {
    alert(
      isAr
        ? 'يرجى إدخال اسم الصنف بالعربية'
        : 'Please provide category name'
    );
    return;
  }

  if (editingCat) {
    const updatedCategory: Category = {
      ...editingCat,
      name: catNameAr,
      nameEn: catNameEn || catNameAr,
      nameKu: catNameKu || catNameEn || catNameAr,
      icon: catIcon,
    };

    try {
      await setCategory(
        editingCat.id,
        {
          name: updatedCategory.name,
          nameEn: updatedCategory.nameEn,
          nameKu: updatedCategory.nameKu,
          icon: updatedCategory.icon,
        }
      );

      onUpdateCategories(
        categories.map((c) =>
          c.id === editingCat.id
            ? updatedCategory
            : c
        )
      );

      setEditingCat(null);
    } catch (error) {
      console.error(
        'Error updating category:',
        error
      );

      alert(
        isAr
          ? 'حدث خطأ أثناء حفظ التصنيف'
          : 'Error saving category'
      );

      return;
    }
  } else {
    const newCat: Category = {
      id: `cat-${Date.now()}`,
      name: catNameAr,
      nameEn: catNameEn || catNameAr,
      nameKu: catNameKu || catNameEn || catNameAr,
      icon: catIcon,
    };

    try {
      await setCategory(
        newCat.id,
        {
          name: newCat.name,
          nameEn: newCat.nameEn,
          nameKu: newCat.nameKu,
          icon: newCat.icon,
        }
      );

      onUpdateCategories([
        ...categories,
        newCat,
      ]);
    } catch (error) {
      console.error(
        'Error adding category:',
        error
      );

      alert(
        isAr
          ? 'حدث خطأ أثناء إضافة التصنيف'
          : 'Error adding category'
      );

      return;
    }
  }

  setCatNameAr('');
  setCatNameEn('');
  setCatNameKu('');
  setCatIcon('Utensils');
};
  // Start Category Edit
  const startEditCategory = (cat: Category) => {
    setEditingCat(cat);
    setCatNameAr(cat.name);
    setCatNameEn(cat.nameEn || cat.name);
    setCatNameKu(cat.nameKu || cat.nameEn || cat.name);
    setCatIcon(cat.icon || 'Utensils');
  };

  // Delete Category (checks linked items first)
  const handleDeleteCategory = (cat: Category) => {
  const linkedItems = items.filter(
    (i) => i.category === cat.id
  );

  if (linkedItems.length > 0) {
    alert(t.cannotDeleteCategoryHasItems);
    return;
  }

  setConfirmDialog({
    isOpen: true,
    title: t.confirmTitle,
    message: `${t.confirmDeleteCategory} (${isAr ? cat.name : cat.nameEn})`,
    onConfirm: async () => {
      setConfirmDialog(null);

      try {
        await deleteCategory(cat.id);

        onUpdateCategories(
          categories.filter(
            (c) => c.id !== cat.id
          )
        );

        console.log(
          '🟢 Category deleted successfully:',
          cat.id
        );
      } catch (error) {
        console.error(
          '🔴 Error deleting category:',
          error
        );

        alert(
          isAr
            ? 'حدث خطأ أثناء حذف التصنيف من قاعدة البيانات'
            : 'Error deleting category from database'
        );
      }
    },
  });
};

  // Save Hero Config
  const handleSaveHero = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateHero(heroForm);
    setHeroSavedAlert(true);
    setTimeout(() => setHeroSavedAlert(false), 3000);
  };

    // Save Welcome Screen Config
  const handleSaveWelcome = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const { setWelcomeConfig } = await import('../services/menuService');

      await setWelcomeConfig(welcomeForm);

      onUpdateWelcome(welcomeForm);

      setWelcomeSavedAlert(true);

      setTimeout(() => {
        setWelcomeSavedAlert(false);
      }, 3000);

    } catch (error) {
      console.error('Error saving welcome configuration:', error);

      alert(
        isAr
          ? 'حدث خطأ أثناء حفظ إعدادات شاشة الترحيب'
          : 'An error occurred while saving welcome screen settings'
      );
    }
  };

  // Save Settings & Credentials
const handleSaveSettings = async (e: React.FormEvent) => {
  e.preventDefault();

  try {
    // حفظ البيانات في Firestore
    await setRestaurantInfo(settingsForm);

    // تحديث بيانات التطبيق مباشرة
    onUpdateRestaurant(settingsForm);

    // إظهار رسالة النجاح
    setSettingsSavedAlert(true);

    setTimeout(() => {
      setSettingsSavedAlert(false);
    }, 3000);

  } catch (error) {
    console.error('Error saving restaurant settings:', error);

    alert(
      isAr
        ? 'حدث خطأ أثناء حفظ الإعدادات في قاعدة البيانات'
        : 'An error occurred while saving settings to the database'
    );
  }
};

  return (
    <div className="fixed inset-0 z-50 w-screen h-screen overflow-hidden">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/85 backdrop-blur-md transition-opacity"
        onClick={onClose}
      />

      {/* Modal Dialog */}
      <div className="relative w-full h-full bg-[#0a163e] flex flex-col overflow-hidden text-white z-10">
        
        {/* Header */}
        <div className="px-6 py-5 border-b-2 border-[#1e3b96] flex items-center justify-between bg-[#0e2055]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-[#FFD11A] to-[#F7941D] flex items-center justify-center text-[#0a163e] font-black shadow-md">
              <DollarSign className="w-6 h-6 stroke-[2.5]" />
            </div>
            <div>
              <h2 className="text-xl font-black font-['Noto_Kufi_Arabic'] text-white">
                {t.adminDashboardTitle}
              </h2>
              <p className="text-xs text-[#9eb9fc]">
                {t.adminDashboardSubtitle}
              </p>
            </div>
          </div>

         <div className="flex items-center gap-3">

            {/* View / Open Separate Kids Menu Page */}
            <a
              href="#/menu"
              target="_blank"
              rel="noopener noreferrer"
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#2855D9]/30 hover:bg-[#2855D9] border border-[#2855D9] text-xs font-bold text-white transition-colors"
              title={isAr ? 'فتح صفحة منيو الأطفال في نافذة منفصلة' : 'Open Menu Page in New Tab'}
            >
              <ExternalLink className="w-3.5 h-3.5 text-[#FFD11A]" />
              <span>{isAr ? 'عرض المنيو ↗' : 'View Menu ↗'}</span>
            </a>

            {/* Logout Admin */}
            <button
              onClick={() => {
                onAdminLogout();
                onClose();
              }}
              className="px-3 py-1.5 rounded-xl bg-[#F2292E]/25 hover:bg-[#F2292E] border border-[#F2292E] text-white text-xs font-bold flex items-center gap-1.5 transition-colors"
              title={t.logout}
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{t.logout}</span>
            </button>

            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-[#12245e] hover:bg-[#1a3382] text-[#9eb9fc] hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Sync alert banner */}
        {syncBanner && (
          <div className="bg-[#182030] border-b border-sky-500/30 px-6 py-2 text-xs text-sky-200 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CloudUpload className="w-4 h-4 text-sky-400" />
              <span>{syncBanner}</span>
            </div>
          </div>
        )}

        {/* Navigation Buttons */}
<div className="sticky top-0 z-30 flex items-center gap-2 px-5 py-3 border-b-2 border-[#1e3b96] bg-[#0a163e]/95 backdrop-blur-md overflow-x-auto">

  <button
    onClick={() => {
      setActiveTab('items');
      resetItemForm();
    }}
    className={`flex-shrink-0 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-black transition-all flex items-center gap-2 whitespace-nowrap border ${
      activeTab === 'items'
        ? 'bg-[#FFD11A] text-[#0a163e] border-[#FFD11A] shadow-lg shadow-[#FFD11A]/20'
        : 'bg-[#12245e] text-[#9ebbf9] border-[#2855D9] hover:bg-[#1a3382] hover:text-white'
    }`}
  >
    🍔
    <span>{t.tabItems}</span>
    <span className="px-1.5 py-0.5 rounded-md bg-black/15 text-[10px]">
      {items.length}
    </span>
  </button>

  <button
    onClick={() => setActiveTab('add-item')}
    className={`flex-shrink-0 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-black transition-all flex items-center gap-2 whitespace-nowrap border ${
      activeTab === 'add-item'
        ? 'bg-[#FFD11A] text-[#0a163e] border-[#FFD11A] shadow-lg shadow-[#FFD11A]/20'
        : 'bg-[#12245e] text-[#9ebbf9] border-[#2855D9] hover:bg-[#1a3382] hover:text-white'
    }`}
  >
    <Plus className="w-4 h-4" />
    <span>{editingItem ? t.editItemTitle : t.addNewItem}</span>
  </button>

  <button
    onClick={() => setActiveTab('categories')}
    className={`flex-shrink-0 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-black transition-all flex items-center gap-2 whitespace-nowrap border ${
      activeTab === 'categories'
        ? 'bg-[#FFD11A] text-[#0a163e] border-[#FFD11A] shadow-lg shadow-[#FFD11A]/20'
        : 'bg-[#12245e] text-[#9ebbf9] border-[#2855D9] hover:bg-[#1a3382] hover:text-white'
    }`}
  >
    <Layers className="w-4 h-4" />
    <span>{t.tabCategories}</span>
    <span className="px-1.5 py-0.5 rounded-md bg-black/15 text-[10px]">
      {categories.length}
    </span>
  </button>

  <button onClick={() => setActiveTab('data')} className={`flex-shrink-0 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-black transition-all flex items-center gap-2 whitespace-nowrap border ${activeTab === 'data' ? 'bg-[#FFD11A] text-[#0a163e] border-[#FFD11A]' : 'bg-[#12245e] text-[#9ebbf9] border-[#2855D9] hover:bg-[#1a3382] hover:text-white'}`}><FileSpreadsheet className="w-4 h-4" /><span>{isAr ? 'استيراد / تصدير' : 'Import / Export'}</span></button>
  <button
    onClick={() => setActiveTab('welcome')}
    className={`flex-shrink-0 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-black transition-all flex items-center gap-2 whitespace-nowrap border ${
      activeTab === 'welcome'
        ? 'bg-[#FFD11A] text-[#0a163e] border-[#FFD11A] shadow-lg shadow-[#FFD11A]/20'
        : 'bg-[#12245e] text-[#9ebbf9] border-[#2855D9] hover:bg-[#1a3382] hover:text-white'
    }`}
  >
    <span className="text-base">✨</span>
    <span>{isAr ? 'التـرحيب' : 'Welcome'}</span>
  </button>

  <button
    onClick={() => setActiveTab('settings')}
    className={`flex-shrink-0 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-black transition-all flex items-center gap-2 whitespace-nowrap border ${
      activeTab === 'settings'
        ? 'bg-[#FFD11A] text-[#0a163e] border-[#FFD11A] shadow-lg shadow-[#FFD11A]/20'
        : 'bg-[#12245e] text-[#9ebbf9] border-[#2855D9] hover:bg-[#1a3382] hover:text-white'
    }`}
  >
    <Settings className="w-4 h-4" />
    <span>{t.tabSettings}</span>
  </button>

</div>

        {/* Tab Contents Area */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          
          {activeTab === 'data' && (
            <div className="space-y-6">
              <div className="bg-[#12245e] p-6 rounded-2xl border-2 border-[#2855D9] space-y-5">
                <div><h3 className="font-black text-base text-white">{isAr ? 'استيراد وتصدير البيانات عبر Excel' : 'Excel Import & Export'}</h3><p className="text-xs text-[#9eb9fc] mt-1">{isAr ? 'عرّف التصنيفات أولاً، ثم استورد الوجبات المرتبطة بها بواسطة Category ID.' : 'Define categories first, then import menu items using Category ID.'}</p></div>
                <div className="flex flex-wrap gap-2"><button onClick={()=>setExcelType('categories')} className={`px-4 py-2 rounded-xl text-xs font-bold ${excelType==='categories'?'bg-[#FFD11A] text-[#0a163e]':'bg-[#0f2156] text-white border border-[#2855D9]'}`}>📂 {isAr?'التصنيفات':'Categories'}</button><button onClick={()=>setExcelType('items')} className={`px-4 py-2 rounded-xl text-xs font-bold ${excelType==='items'?'bg-[#FFD11A] text-[#0a163e]':'bg-[#0f2156] text-white border border-[#2855D9]'}`}>🍔 {isAr?'الوجبات':'Menu Items'}</button></div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3"><button onClick={()=>excelType==='categories'?exportCategoriesToExcel(categories):exportMenuItemsToExcel(items,categories)} className="px-4 py-3 rounded-xl bg-[#2855D9] text-white text-xs font-bold flex items-center justify-center gap-2"><Download className="w-4 h-4"/>{isAr?'تصدير Excel':'Export Excel'}</button><button onClick={()=>excelInputRef.current?.click()} className="px-4 py-3 rounded-xl bg-[#FFD11A] text-[#0a163e] text-xs font-black flex items-center justify-center gap-2"><Upload className="w-4 h-4"/>{isAr?'استيراد Excel':'Import Excel'}</button><button onClick={()=>downloadExcelTemplate(excelType)} className="px-4 py-3 rounded-xl bg-[#0f2156] border border-[#2855D9] text-white text-xs font-bold flex items-center justify-center gap-2"><FileSpreadsheet className="w-4 h-4"/>{isAr?'تحميل قالب Excel':'Download Template'}</button></div>
                <input ref={excelInputRef} type="file" accept=".xlsx,.xls" className="hidden" onChange={e=>{const f=e.target.files?.[0];if(f)handleExcelImport(f);e.currentTarget.value='';}} />
                {excelBusy&&<div className="text-xs text-[#FFD11A]">{isAr?'جاري معالجة الملف...':'Processing file...'}</div>}
                {(excelPreview.rows.length>0||excelPreview.errors.length>0)&&<div className="rounded-xl bg-[#0f2156] border border-[#2855D9] p-4 space-y-3"><div className="text-sm font-black">{isAr?'معاينة: '+excelPreview.rows.length+' سجل':'Preview: '+excelPreview.rows.length+' records'}</div>{excelPreview.errors.length>0&&<div className="p-3 rounded-lg bg-red-950/40 border border-red-700/50 text-red-300 text-xs space-y-1">{excelPreview.errors.slice(0,20).map((e,i)=><div key={i}>• {e}</div>)}</div>}{excelPreview.rows.length>0&&!excelPreview.errors.length&&<button onClick={applyExcelImport} disabled={excelBusy} className="px-5 py-2.5 rounded-xl bg-emerald-600 text-white text-xs font-black">{isAr?'تأكيد الاستيراد والحفظ':'Confirm Import & Save'}</button>}</div>}
              </div>
            </div>
          )}
          {/* TAB 1: MEALS & LIVE PRICE EDITING */}
          {activeTab === 'items' && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#12245e] p-4 rounded-2xl border-2 border-[#2855D9]">
                <div>
                  <h3 className="font-black text-sm text-white font-['Noto_Kufi_Arabic']">
                    {t.itemsList}
                  </h3>
                  <p className="text-xs text-[#a2bbf5]">
                    {t.quickPriceHint}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => { resetItemForm(); setActiveTab('add-item'); }}
                    className="px-4 py-2 rounded-xl bg-[#FFD11A] hover:bg-[#e8bd13] text-[#0a163e] font-black text-xs flex items-center gap-1.5 shadow"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>{t.addNewItem}</span>
                  </button>
                </div>
              </div>

              {/* Items Table */}
              <div className="overflow-x-auto rounded-2xl border-2 border-[#2855D9] bg-[#0f2156]">
                <table className="w-full text-start text-xs">
                  <thead className="bg-[#12245e] text-[#a2bbf5] border-b-2 border-[#2855D9] font-bold">
                    <tr>
                      <th className="py-3 px-4 w-12 text-center"><input type="checkbox" checked={items.length > 0 && selectedItemIds.size === items.length} onChange={toggleSelectAllItems} className="w-4 h-4 accent-[#FFD11A] cursor-pointer" /></th>
                      <th className="py-3 px-2 text-center" title={isAr ? 'اسحب لإعادة الترتيب' : 'Drag to reorder'}>↕</th>
                      <th className="py-3 px-4">{isAr ? 'الصورة والاسم' : 'Image & Name'}</th>
                      <th className="py-3 px-4">{t.category}</th>
                      <th className="py-3 px-4">{isAr ? 'السعر الحالي' : 'Live Price'} ({isAr ? restaurant.currency : restaurant.currencyEn})</th>
                      <th className="py-3 px-4">{isAr ? 'حالة التوفر' : 'Availability'}</th>
                      <th className="py-3 px-4 text-center">{isAr ? 'إجراءات' : 'Actions'}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#211f18]">
                    {orderedItems.map((item, index) => {
                      const previous = orderedItems[index - 1];
                      const categoryChanged = !previous || previous.category !== item.category;
                      const category = categories.find((c) => c.id === item.category);
                      return (
                        <React.Fragment key={item.id}>
                          {categoryChanged && (
                            <tr className="bg-[#0a163e] border-t-4 border-[#FFD11A]/40">
                              <td colSpan={6} className="py-2.5 px-4 text-[#FFD11A] font-black">
                                <div className="flex items-center justify-between">
                                  <span>{category ? (isAr ? category.name : isKu ? (category.nameKu || category.nameEn || category.name) : category.nameEn) : item.category}</span>
                                  <span className="text-[10px] text-[#9eb9fc]">{orderedItems.filter(x => x.category === item.category).length} {isAr ? 'وجبات' : 'items'}</span>
                                </div>
                              </td>
                            </tr>
                          )}
                          <tr
                            key={item.id}
                            draggable
                            onDragStart={() => setDraggedItemId(item.id)}
                            onDragOver={(e) => {
                              const dragged = draggedItemId ? items.find((x) => x.id === draggedItemId) : null;
                              if (dragged && dragged.category === item.category) e.preventDefault();
                            }}
                            onDrop={(e) => { e.preventDefault(); void handleMenuItemDrop(item.id); }}
                            onDragEnd={() => setDraggedItemId(null)}
                            className={`${selectedItemIds.has(item.id) ? 'bg-red-950/20' : 'hover:bg-[#1a1d29]'} ${draggedItemId === item.id ? 'opacity-40' : ''} cursor-grab active:cursor-grabbing`}
                          >
                            <td className="py-3 px-2 text-center">
                              <GripVertical className="w-4 h-4 mx-auto text-[#FFD11A]/70" />
                            </td>
                            <td className="py-3 px-4 text-center"><input type="checkbox" checked={selectedItemIds.has(item.id)} onChange={() => toggleItemSelection(item.id)} className="w-4 h-4 accent-[#FFD11A] cursor-pointer" /></td>
                            <td className="py-3 px-4">
                          <div className="flex items-center gap-3">
                            <img
                              src={item.image}
                              alt={item.name}
                              className="w-12 h-12 rounded-xl object-cover border border-[#2b271f]"
                            />
                            <div>
                              <div className="font-bold text-white text-sm font-['Amiri',serif] flex items-center gap-1.5">
                                <span>{isAr ? item.name : (item.nameEn || item.name)}</span>
                                {item.isChefSpecial && (
                                  <Sparkles className="w-3.5 h-3.5 text-[#d4af37]" />
                                )}
                              </div>
                              <div className="text-[11px] text-[#7f786c]">
                                {isAr ? (item.nameEn || '') : isKu ? (item.nameKu || item.nameEn || '') : item.name}
                              </div>
                            </div>
                          </div>
                        </td>

                        <td className="py-3 px-4">
                          <span className="px-2.5 py-1 rounded-lg bg-[#1f212d] text-[#cfc7b9] font-medium text-[11px] border border-[#2f2b20]">
                            {(() => {
                              const found = categories.find((c) => c.id === item.category);
                              return found ? (isAr ? found.name : isKu ? (found.nameKu || found.nameEn || found.name) : found.nameEn) : item.category;
                            })()}
                          </span>
                        </td>

                        {/* Inline Live Price Editor */}
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-1.5">
                            <input
                              type="number"
                              defaultValue={item.price}
                              step="250"
                              onChange={(e) =>
                                setQuickPrices((prev) => ({
                                  ...prev,
                                  [item.id]: Number(e.target.value),
                                }))
                              }
                              className="w-24 px-2.5 py-1.5 rounded-lg bg-[#0e1017] border border-[#332f25] text-white font-bold text-xs focus:border-[#d4af37] focus:outline-none"
                            />
                            <button
                              onClick={() => handleQuickPriceSave(item.id)}
                              className={`p-1.5 rounded-lg border transition-all ${
                                savedSuccessId === item.id
                                  ? 'bg-emerald-600 border-emerald-500 text-white'
                                  : 'bg-[#222634] hover:bg-[#d4af37] text-[#9c9586] hover:text-[#0c0d10] border-[#363227]'
                              }`}
                              title={t.savePrice}
                            >
                              <Save className="w-3.5 h-3.5" />
                            </button>
                            {savedSuccessId === item.id && (
                              <span className="text-[10px] text-emerald-400 font-bold">{t.savedSuccess}</span>
                            )}
                          </div>
                        </td>

                        {/* Availability Toggle */}
                        <td className="py-3 px-4">
                          <button
                            onClick={() => handleToggleAvailability(item.id)}
                            className={`px-2.5 py-1 rounded-full text-[10px] font-bold border flex items-center gap-1 transition-all ${
                              item.available
                                ? 'bg-emerald-950/60 text-emerald-300 border-emerald-600/40 hover:bg-emerald-900/50'
                                : 'bg-red-950/60 text-red-300 border-red-700/40 hover:bg-red-900/50'
                            }`}
                          >
                            <span className={`w-1.5 h-1.5 rounded-full ${item.available ? 'bg-emerald-400' : 'bg-red-400'}`} />
                            <span>{item.available ? t.statusAvailable : t.statusUnavailable}</span>
                          </button>
                        </td>

                        {/* Actions: Edit & Delete */}
                        <td className="py-3 px-4 text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            <button
                              onClick={() => startEditItem(item)}
                              className="p-1.5 rounded-lg bg-[#202330] hover:bg-[#d4af37] text-[#a09a8e] hover:text-[#0c0d10] border border-[#312d22]"
                              title={t.editItem}
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDeleteItem(item)}
                              className="p-1.5 rounded-lg bg-red-950/40 hover:bg-red-900 text-red-400 hover:text-white border border-red-900/40"
                              title={t.deleteItem}
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                        </React.Fragment>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
                <div className="text-xs text-[#8f99b5]">
                  {selectedItemIds.size > 0 ? (isAr ? `تم تحديد ${selectedItemIds.size} من ${items.length} وجبة` : `${selectedItemIds.size} of ${items.length} meals selected`) : (isAr ? 'حدد الوجبات التي تريد حذفها' : 'Select meals to delete')}
                </div>
                <div className="flex items-center gap-2 justify-end">
                  <button type="button" onClick={toggleSelectAllItems} disabled={items.length === 0 || excelBusy} className="px-3.5 py-2 rounded-xl bg-[#202b4b] hover:bg-[#29406f] disabled:opacity-40 text-[#bcd0ff] border border-[#31508e] text-xs font-bold">
                    {selectedItemIds.size === items.length && items.length > 0 ? (isAr ? 'إلغاء تحديد الكل' : 'Deselect All') : (isAr ? 'تحديد الكل' : 'Select All')}
                  </button>
                  <button type="button" onClick={handleDeleteSelectedItems} disabled={selectedItemIds.size === 0 || excelBusy} className="px-4 py-2 rounded-xl bg-red-950/60 hover:bg-red-900 disabled:opacity-40 text-red-300 hover:text-white border border-red-800/60 text-xs font-black flex items-center gap-2">
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>{isAr ? `حذف المحدد${selectedItemIds.size ? ` (${selectedItemIds.size})` : ''}` : `Delete Selected${selectedItemIds.size ? ` (${selectedItemIds.size})` : ''}`}</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: ADD / EDIT ITEM (MEAL) */}
          {activeTab === 'add-item' && (
            <form onSubmit={handleSaveItem} className="space-y-6">
              <div className="bg-[#161822] p-6 rounded-2xl border border-[#2b271e] space-y-6">
                <div className="flex items-center justify-between pb-3 border-b border-[#252219]">
                  <h3 className="font-bold text-base text-white font-['Amiri',serif]">
                    {editingItem ? `${t.editItemTitle}: ${editingItem.name}` : t.addItemTitle}
                  </h3>
                  {editingItem && (
                    <button
                      type="button"
                      onClick={resetItemForm}
                      className="text-xs text-[#d4af37] hover:underline"
                    >
                      {t.cancelEdit}
                    </button>
                  )}
                </div>

                {/* Names (AR & EN) */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-[#a8a192] mb-1.5">
                      {t.nameAr} *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="مثال: برغر لحم"
                      value={formNameAr}
                      onChange={(e) => setFormNameAr(e.target.value)}
                      className="w-full bg-[#101218] border border-[#312c21] rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-[#d4af37]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-[#a8a192] mb-1.5">
                      {t.nameEn}
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Royal Naemi Meat Mandi"
                      value={formNameEn}
                      onChange={(e) => setFormNameEn(e.target.value)}
                      className="w-full bg-[#101218] border border-[#312c21] rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-[#d4af37]"
                      dir="ltr"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="md:col-span-1">
                    <label className="block text-xs font-semibold text-[#a8a192] mb-1.5">{t.nameKu || 'ناوی خواردن بە کوردی'}</label>
                    <input type="text" value={formNameKu} onChange={(e) => setFormNameKu(e.target.value)} className="w-full bg-[#101218] border border-[#312c21] rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-[#d4af37]" dir="rtl" />
                  </div>
                </div>

                {/* Descriptions (AR & EN) */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-[#a8a192] mb-1.5">
                      {t.descAr} *
                    </label>
                    <textarea
                      rows={3}
                      placeholder="وصف مكونات الوجبة ..."
                      value={formDescAr}
                      onChange={(e) => setFormDescAr(e.target.value)}
                      className="w-full bg-[#101218] border border-[#312c21] rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-[#d4af37]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-[#a8a192] mb-1.5">
                      {t.descEn}
                    </label>
                    <textarea
                      rows={3}
                      placeholder="Description in English..."
                      value={formDescEn}
                      onChange={(e) => setFormDescEn(e.target.value)}
                      className="w-full bg-[#101218] border border-[#312c21] rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-[#d4af37]"
                      dir="ltr"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="md:col-span-1">
                    <label className="block text-xs font-semibold text-[#a8a192] mb-1.5">{t.descKu || 'وەسف بە کوردی'}</label>
                    <textarea rows={3} value={formDescKu} onChange={(e) => setFormDescKu(e.target.value)} className="w-full bg-[#101218] border border-[#312c21] rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-[#d4af37]" dir="rtl" />
                  </div>
                </div>

                {/* Pricing & Category */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-[#a8a192] mb-1.5">
                      {t.price} ({isAr ? restaurant.currency : restaurant.currencyEn}) *
                    </label>
                    <input
                      type="number"
                      required
                      min="1"
                      step="any"
                      placeholder="95"
                      value={formPrice}
                      onChange={(e) => setFormPrice(e.target.value === '' ? '' : Number(e.target.value))}
                      className="w-full bg-[#101218] border border-[#312c21] rounded-xl px-3.5 py-2.5 text-sm font-bold text-[#d4af37] focus:outline-none focus:border-[#d4af37]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-[#a8a192] mb-1.5">
                      {t.origPrice}
                    </label>
                    <input
                      type="number"
                      min="1"
                      step="any"
                      placeholder="110"
                      value={formOrigPrice}
                      onChange={(e) => setFormOrigPrice(e.target.value === '' ? '' : Number(e.target.value))}
                      className="w-full bg-[#101218] border border-[#312c21] rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-[#d4af37]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-[#a8a192] mb-1.5">
                      {t.category} *
                    </label>
                    <select
                      value={formCategory}
                      onChange={(e) => setFormCategory(e.target.value)}
                      className="w-full bg-[#101218] border border-[#312c21] rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-[#d4af37]"
                    >
                      {categories.map((c) => (
                        <option key={c.id} value={c.id}>
                          {isAr ? c.name : isKu ? (c.nameKu || c.nameEn || c.name) : c.nameEn}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Additional Details */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-[#a8a192] mb-1.5">
                      {t.itemCalories}
                    </label>
                    <input
                      type="number"
                      placeholder="750"
                      value={formCalories}
                      onChange={(e) => setFormCalories(e.target.value === '' ? '' : Number(e.target.value))}
                      className="w-full bg-[#101218] border border-[#312c21] rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-[#d4af37]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-[#a8a192] mb-1.5">
                      {t.prepTime}
                    </label>
                    <input
                      type="text"
                      placeholder="20 دقيقة"
                      value={formPrepTimeAr}
                      onChange={(e) => setFormPrepTimeAr(e.target.value)}
                      className="w-full bg-[#101218] border border-[#312c21] rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-[#d4af37]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-[#a8a192] mb-1.5">
                      {t.prepTimeEn}
                    </label>
                    <input
                      type="text"
                      placeholder="20 min"
                      value={formPrepTimeEn}
                      onChange={(e) => setFormPrepTimeEn(e.target.value)}
                      className="w-full bg-[#101218] border border-[#312c21] rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-[#d4af37]"
                      dir="ltr"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#a8a192] mb-1.5">{t.prepTimeKu || 'کاتی ئامادەکردن بە کوردی'}</label>
                  <input type="text" placeholder="20 خولەک" value={formPrepTimeKu} onChange={(e) => setFormPrepTimeKu(e.target.value)} className="w-full bg-[#101218] border border-[#312c21] rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-[#d4af37]" dir="rtl" />
                </div>

                {/* Google Drive Image Link */}
                <div className="border border-[#2f2b20] p-4 rounded-2xl bg-[#11131a] space-y-4">
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-xs font-bold text-white flex items-center gap-2">
                      <ImageIcon className="w-4 h-4 text-[#d4af37]" />
                      <span>{t.itemImage}</span>
                    </span>
                    <span className="text-[11px] text-emerald-400 font-semibold">
                      Google Drive
                    </span>
                  </div>

                  <div>
                    <label className="block text-[11px] text-[#8e877c] mb-1.5">
                      {isAr ? 'رابط صورة Google Drive' : isKu ? 'بەستەری وێنەی Google Drive' : 'Google Drive image link'}
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="url"
                        placeholder="https://drive.google.com/file/d/..."
                        value={formImageUrl}
                        onChange={(e) => setFormImageUrl(e.target.value)}
                        className="flex-1 min-w-0 bg-[#171924] border border-[#312c21] rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-[#d4af37]"
                        dir="ltr"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          const converted = normalizeGoogleDriveImageUrl(formImageUrl);
                          if (!converted || converted === formImageUrl.trim()) {
                            alert(
                              isAr
                                ? 'يرجى لصق رابط Google Drive صحيح يحتوي على FILE_ID.'
                                : isKu
                                  ? 'تکایە بەستەرێکی دروستی Google Drive دابنێ کە FILE_ID ـی تێدا بێت.'
                                  : 'Please paste a valid Google Drive link containing the FILE_ID.'
                            );
                            return;
                          }
                          setFormImageUrl(converted);
                        }}
                        disabled={!formImageUrl.trim()}
                        className="shrink-0 px-3 rounded-xl bg-[#2855D9] hover:bg-[#3567ee] disabled:opacity-40 disabled:cursor-not-allowed text-white text-[11px] font-bold transition-all"
                      >
                        {isAr ? 'تحويل الرابط' : isKu ? 'گۆڕینی بەستەر' : 'Convert Link'}
                      </button>
                    </div>
                    <p className="text-[10px] text-[#817a6e] mt-2 leading-relaxed">
                      {isAr
                        ? 'الصق رابط المشاركة من Google Drive. سيتم تحويله تلقائياً إلى رابط مناسب لعرض الصورة داخل المنيو.'
                        : isKu
                          ? 'بەستەری هاوبەشکردنی Google Drive دابنێ. بەستەرەکە خۆکارانە بۆ پیشاندانی وێنە دەگۆڕدرێت.'
                          : 'Paste the Google Drive sharing link. It will be converted automatically for image display.'}
                    </p>
                  </div>

                  {formImageUrl && (
                    <div className="flex items-center gap-3 p-2 bg-[#171a26] rounded-xl border border-[#2b271d]">
                      <img
                        src={normalizeGoogleDriveImageUrl(formImageUrl)}
                        alt="Preview"
                        className="w-16 h-16 rounded-lg object-cover"
                      />
                      <div className="text-xs">
                        <span className="font-semibold text-emerald-400 block">
                          {isAr ? 'معاينة الصورة' : isKu ? 'پێشبینینی وێنە' : 'Image Preview'}
                        </span>
                        <span className="text-[11px] text-[#817a6e]">
                          Google Drive
                        </span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Flags */}
                <div className="flex flex-wrap gap-6 pt-2">
                  <label className="flex items-center gap-2 text-xs font-semibold text-[#c7c0b3] cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formIsSpecial}
                      onChange={(e) => setFormIsSpecial(e.target.checked)}
                      className="rounded text-[#d4af37]"
                    />
                    <span>{t.isChefSpecial}</span>
                  </label>
                  <label className="flex items-center gap-2 text-xs font-semibold text-[#c7c0b3] cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formIsPopular}
                      onChange={(e) => setFormIsPopular(e.target.checked)}
                      className="rounded text-[#d4af37]"
                    />
                    <span>{t.isPopular}</span>
                  </label>
                  <label className="flex items-center gap-2 text-xs font-semibold text-[#c7c0b3] cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formAvailable}
                      onChange={(e) => setFormAvailable(e.target.checked)}
                      className="rounded text-[#d4af37]"
                    />
                    <span>{t.isAvailable}</span>
                  </label>
                </div>

                {/* Submit */}
                <div className="pt-4 border-t border-[#252219] flex items-center justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => { resetItemForm(); setActiveTab('items'); }}
                    className="px-5 py-2.5 rounded-xl bg-[#202330] hover:bg-[#2b2f42] text-xs font-bold text-[#a09a8e]"
                  >
                    {t.cancel}
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-[#d4af37] to-[#ba8a24] hover:brightness-110 text-[#0c0d10] text-xs font-bold shadow flex items-center gap-2"
                  >
                    <>
                      <Save className="w-3.5 h-3.5" />
                      <span>{t.saveItemBtn}</span>
                    </>
                  </button>
                </div>
              </div>
            </form>
          )}

          {/* TAB 3: CATEGORY MANAGEMENT (ADD, EDIT, DELETE CATEGORIES) */}
          {activeTab === 'categories' && (
            <div className="space-y-6">
              {/* Form to Add / Edit Category */}
              <form onSubmit={handleSaveCategory} className="bg-[#161822] p-6 rounded-2xl border border-[#2b271e] space-y-4">
                <div className="flex items-center justify-between pb-2 border-b border-[#252219]">
                  <h3 className="font-bold text-sm text-white font-['Amiri',serif]">
                    {editingCat ? `${isAr ? 'تعديل الصنف' : 'Edit Category'}: ${editingCat.name}` : t.addNewCategory}
                  </h3>
                  {editingCat && (
                    <button
                      type="button"
                      onClick={() => { setEditingCat(null); setCatNameAr(''); setCatNameEn(''); setCatNameKu(''); }}
                      className="text-xs text-[#d4af37] hover:underline"
                    >
                      {t.cancel}
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-[#a8a192] mb-1.5">
                      {t.categoryNameAr} *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="مثال: وجبات سريعة"
                      value={catNameAr}
                      onChange={(e) => setCatNameAr(e.target.value)}
                      className="w-full bg-[#101218] border border-[#312c21] rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-[#d4af37]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[#a8a192] mb-1.5">
                      {t.categoryNameEn}
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Seafood Dishes"
                      value={catNameEn}
                      onChange={(e) => setCatNameEn(e.target.value)}
                      className="w-full bg-[#101218] border border-[#312c21] rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-[#d4af37]"
                      dir="ltr"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[#a8a192] mb-1.5">
                      {t.categoryNameKu || 'ناوی جۆر بە کوردی'}
                    </label>
                    <input
                      type="text"
                      placeholder="بۆ نموونە: خواردنە سەرەکییەکان"
                      value={catNameKu}
                      onChange={(e) => setCatNameKu(e.target.value)}
                      className="w-full bg-[#101218] border border-[#312c21] rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-[#d4af37]"
                      dir="rtl"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[#a8a192] mb-1.5">
                      {t.categoryIcon}
                    </label>
                    <select
                      value={catIcon}
                      onChange={(e) => setCatIcon(e.target.value)}
                      className="w-full bg-[#101218] border border-[#312c21] rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-[#d4af37]"
                    >
                      <option value="Utensils">Utensils (أواني طعام)</option>
                      <option value="Flame">Flame (نار وشواء)</option>
                      <option value="Beef">Beef (لحوم ومشاوي)</option>
                      <option value="Salad">Salad (مقبلات وخضار)</option>
                      <option value="Cake">Cake (حلويات)</option>
                      <option value="Coffee">Coffee (مشروبات وقهوة)</option>
                      <option value="Hamburger">Hamburger (برغر)</option>
                      <option value="Pizza">Pizza (بيتزا)</option>
                      <option value="Sandwich">Sandwich (سندويش)</option>
                      <option value="IceCreamBowl">Ice Cream Bowl (آيس كريم)</option>
                    </select>
                  </div>
                </div>

                <div className="flex justify-end pt-2">
                  <button
                    type="submit"
                    onClick={() => console.log('🟢 SAVE CATEGORY BUTTON CLICKED')}
                    className="px-5 py-2 rounded-xl bg-[#d4af37] hover:bg-[#c29e2c] text-[#0c0d10] font-bold text-xs shadow flex items-center gap-1.5"
                  >
                    <Save className="w-3.5 h-3.5" />
                    <span>{t.saveCategory}</span>
                  </button>
                </div>
              </form>

              {/* Categories List */}
              <div className="rounded-2xl border border-[#26231a] bg-[#14161f] overflow-hidden">
                <table className="w-full text-start text-xs">
                  <thead className="bg-[#191c28] text-[#a0998c] border-b border-[#29251c]">
                    <tr>
                      <th className="py-3 px-4">{t.categoryNameAr}</th>
                      <th className="py-3 px-4">{t.categoryNameEn}</th>
                      <th className="py-3 px-4">{t.categoryItemsCount}</th>
                      <th className="py-3 px-4 text-center">{isAr ? 'إجراءات' : 'Actions'}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#211f18]">
                    {categories.map((cat) => {
                      const count = items.filter((i) => i.category === cat.id).length;
                      return (
                        <tr key={cat.id} className="hover:bg-[#1a1d29] transition-colors">
                          <td className="py-3 px-4 font-bold text-white text-sm font-['Amiri',serif]">
                            {cat.name}
                          </td>
                          <td className="py-3 px-4 text-[#8e877c] font-sans">
                            {cat.nameEn || '-'}
                          </td>
                          <td className="py-3 px-4">
                            <span className="px-2.5 py-1 rounded-full bg-[#1d202c] text-[#d4af37] font-bold text-xs">
                              {count} {isAr ? 'وجبة' : 'items'}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-center">
                            <div className="flex items-center justify-center gap-1.5">
                              <button
                                onClick={() => startEditCategory(cat)}
                                className="p-1.5 rounded-lg bg-[#202330] hover:bg-[#d4af37] text-[#a09a8e] hover:text-[#0c0d10]"
                                title={t.editItem}
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => handleDeleteCategory(cat)}
                                className="p-1.5 rounded-lg bg-red-950/40 hover:bg-red-900 text-red-400 hover:text-white"
                                title={t.deleteItem}
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 4: HERO SECTION TEXT CUSTOMIZER */}
          {activeTab === 'hero' && (
            <form onSubmit={handleSaveHero} className="space-y-6">
              <div className="bg-[#161822] p-6 rounded-2xl border border-[#2b271e] space-y-6">
                <div>
                  <h3 className="font-bold text-base text-white font-['Amiri',serif]">
                    {t.heroSettingsTitle}
                  </h3>
                  <p className="text-xs text-[#9d9689]">
                    {t.heroSettingsSubtitle}
                  </p>
                </div>

                {heroSavedAlert && (
                  <div className="p-3 rounded-xl bg-emerald-950/80 border border-emerald-600/50 text-emerald-300 text-xs flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>{isAr ? 'تم حفظ نصوص وإعدادات واجهة Hero بنجاح!' : 'Hero settings saved successfully!'}</span>
                  </div>
                )}

                {/* Welcome Badges */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-[#a8a192] mb-1.5">
                      {t.welcomeBadgeAr}
                    </label>
                    <input
                      type="text"
                      value={heroForm.welcomeBadgeAr}
                      onChange={(e) => setHeroForm({ ...heroForm, welcomeBadgeAr: e.target.value })}
                      className="w-full bg-[#101218] border border-[#312c21] rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-[#d4af37]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-[#a8a192] mb-1.5">
                      {t.welcomeBadgeEn}
                    </label>
                    <input
                      type="text"
                      value={heroForm.welcomeBadgeEn}
                      onChange={(e) => setHeroForm({ ...heroForm, welcomeBadgeEn: e.target.value })}
                      className="w-full bg-[#101218] border border-[#312c21] rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-[#d4af37]"
                      dir="ltr"
                    />
                  </div>
                </div>

                {/* Main Titles */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-[#a8a192] mb-1.5">
                      {t.heroTitleLine1Ar}
                    </label>
                    <input
                      type="text"
                      value={heroForm.titleLine1Ar}
                      onChange={(e) => setHeroForm({ ...heroForm, titleLine1Ar: e.target.value })}
                      className="w-full bg-[#101218] border border-[#312c21] rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-[#d4af37]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-[#a8a192] mb-1.5">
                      {t.heroTitleLine1En}
                    </label>
                    <input
                      type="text"
                      value={heroForm.titleLine1En}
                      onChange={(e) => setHeroForm({ ...heroForm, titleLine1En: e.target.value })}
                      className="w-full bg-[#101218] border border-[#312c21] rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-[#d4af37]"
                      dir="ltr"
                    />
                  </div>
                </div>

                {/* Highlight Texts */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-[#a8a192] mb-1.5">
                      {t.heroHighlightAr}
                    </label>
                    <input
                      type="text"
                      value={heroForm.titleHighlightAr}
                      onChange={(e) => setHeroForm({ ...heroForm, titleHighlightAr: e.target.value })}
                      className="w-full bg-[#101218] border border-[#312c21] rounded-xl px-3.5 py-2.5 text-sm text-[#d4af37] font-bold focus:outline-none focus:border-[#d4af37]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-[#a8a192] mb-1.5">
                      {t.heroHighlightEn}
                    </label>
                    <input
                      type="text"
                      value={heroForm.titleHighlightEn}
                      onChange={(e) => setHeroForm({ ...heroForm, titleHighlightEn: e.target.value })}
                      className="w-full bg-[#101218] border border-[#312c21] rounded-xl px-3.5 py-2.5 text-sm text-[#d4af37] font-bold focus:outline-none focus:border-[#d4af37]"
                      dir="ltr"
                    />
                  </div>
                </div>

                {/* Taglines */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-[#a8a192] mb-1.5">
                      {t.heroTaglineAr}
                    </label>
                    <textarea
                      rows={2}
                      value={heroForm.taglineAr}
                      onChange={(e) => setHeroForm({ ...heroForm, taglineAr: e.target.value })}
                      className="w-full bg-[#101218] border border-[#312c21] rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-[#d4af37]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-[#a8a192] mb-1.5">
                      {t.heroTaglineEn}
                    </label>
                    <textarea
                      rows={2}
                      value={heroForm.taglineEn}
                      onChange={(e) => setHeroForm({ ...heroForm, taglineEn: e.target.value })}
                      className="w-full bg-[#101218] border border-[#312c21] rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-[#d4af37]"
                      dir="ltr"
                    />
                  </div>
                </div>

                {/* 3 Stat Badges */}
                <div className="p-4 rounded-xl bg-[#11131a] border border-[#2b271d] space-y-3">
                  <h4 className="text-xs font-bold text-[#d4af37]">{t.statBadges}</h4>
                  
                  {/* Badge 1 */}
                  <div className="grid grid-cols-3 gap-2">
                    <input
                      type="text"
                      placeholder="4.9 / 5"
                      value={heroForm.badge1Value}
                      onChange={(e) => setHeroForm({ ...heroForm, badge1Value: e.target.value })}
                      className="bg-[#181a24] border border-[#332f25] rounded-xl px-2.5 py-1.5 text-xs text-white"
                    />
                    <input
                      type="text"
                      placeholder="تقييم ضيوفنا"
                      value={heroForm.badge1LabelAr}
                      onChange={(e) => setHeroForm({ ...heroForm, badge1LabelAr: e.target.value })}
                      className="bg-[#181a24] border border-[#332f25] rounded-xl px-2.5 py-1.5 text-xs text-white"
                    />
                    <input
                      type="text"
                      placeholder="Guest Rating"
                      value={heroForm.badge1LabelEn}
                      onChange={(e) => setHeroForm({ ...heroForm, badge1LabelEn: e.target.value })}
                      className="bg-[#181a24] border border-[#332f25] rounded-xl px-2.5 py-1.5 text-xs text-white"
                      dir="ltr"
                    />
                  </div>

                  {/* Badge 2 */}
                  <div className="grid grid-cols-3 gap-2">
                    <input
                      type="text"
                      placeholder="طازج 100%"
                      value={heroForm.badge2Value}
                      onChange={(e) => setHeroForm({ ...heroForm, badge2Value: e.target.value })}
                      className="bg-[#181a24] border border-[#332f25] rounded-xl px-2.5 py-1.5 text-xs text-white"
                    />
                    <input
                      type="text"
                      placeholder="شواء ع الفحم"
                      value={heroForm.badge2LabelAr}
                      onChange={(e) => setHeroForm({ ...heroForm, badge2LabelAr: e.target.value })}
                      className="bg-[#181a24] border border-[#332f25] rounded-xl px-2.5 py-1.5 text-xs text-white"
                    />
                    <input
                      type="text"
                      placeholder="Charcoal Grilled"
                      value={heroForm.badge2LabelEn}
                      onChange={(e) => setHeroForm({ ...heroForm, badge2LabelEn: e.target.value })}
                      className="bg-[#181a24] border border-[#332f25] rounded-xl px-2.5 py-1.5 text-xs text-white"
                      dir="ltr"
                    />
                  </div>

                  {/* Badge 3 */}
                  <div className="grid grid-cols-3 gap-2">
                    <input
                      type="text"
                      placeholder="خدمة راقية"
                      value={heroForm.badge3Value}
                      onChange={(e) => setHeroForm({ ...heroForm, badge3Value: e.target.value })}
                      className="bg-[#181a24] border border-[#332f25] rounded-xl px-2.5 py-1.5 text-xs text-white"
                    />
                    <input
                      type="text"
                      placeholder="تحضير فوري"
                      value={heroForm.badge3LabelAr}
                      onChange={(e) => setHeroForm({ ...heroForm, badge3LabelAr: e.target.value })}
                      className="bg-[#181a24] border border-[#332f25] rounded-xl px-2.5 py-1.5 text-xs text-white"
                    />
                    <input
                      type="text"
                      placeholder="Fresh Prep"
                      value={heroForm.badge3LabelEn}
                      onChange={(e) => setHeroForm({ ...heroForm, badge3LabelEn: e.target.value })}
                      className="bg-[#181a24] border border-[#332f25] rounded-xl px-2.5 py-1.5 text-xs text-white"
                      dir="ltr"
                    />
                  </div>
                </div>

                {/* Featured Dish in Hero Box */}
                <div className="p-4 rounded-xl bg-[#11131a] border border-[#2b271d] space-y-3">
                  <h4 className="text-xs font-bold text-[#d4af37]">{t.featuredDishSection}</h4>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] text-[#8e877c] mb-1">{t.featuredDishTitleAr}</label>
                      <input
                        type="text"
                        value={heroForm.featuredDishTitleAr}
                        onChange={(e) => setHeroForm({ ...heroForm, featuredDishTitleAr: e.target.value })}
                        className="w-full bg-[#181a24] border border-[#332f25] rounded-xl px-3 py-2 text-xs text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] text-[#8e877c] mb-1">{t.featuredDishTitleEn}</label>
                      <input
                        type="text"
                        value={heroForm.featuredDishTitleEn}
                        onChange={(e) => setHeroForm({ ...heroForm, featuredDishTitleEn: e.target.value })}
                        className="w-full bg-[#181a24] border border-[#332f25] rounded-xl px-3 py-2 text-xs text-white"
                        dir="ltr"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] text-[#8e877c] mb-1">{t.featuredDishSubtitleAr}</label>
                      <input
                        type="text"
                        value={heroForm.featuredDishSubtitleAr}
                        onChange={(e) => setHeroForm({ ...heroForm, featuredDishSubtitleAr: e.target.value })}
                        className="w-full bg-[#181a24] border border-[#332f25] rounded-xl px-3 py-2 text-xs text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] text-[#8e877c] mb-1">{t.featuredDishPrice}</label>
                      <input
                        type="number"
                        value={heroForm.featuredDishPrice}
                        onChange={(e) => setHeroForm({ ...heroForm, featuredDishPrice: Number(e.target.value) })}
                        className="w-full bg-[#181a24] border border-[#332f25] rounded-xl px-3 py-2 text-xs text-[#d4af37] font-bold"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] text-[#8e877c] mb-1">{t.featuredDishImage}</label>
                    <input
                      type="url"
                      value={heroForm.featuredDishImage}
                      onChange={(e) => setHeroForm({ ...heroForm, featuredDishImage: e.target.value })}
                      className="w-full bg-[#181a24] border border-[#332f25] rounded-xl px-3 py-2 text-xs text-white"
                    />
                  </div>
                </div>

                <div className="pt-2 flex justify-end">
                  <button
                    type="submit"
                    className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-[#d4af37] to-[#ba8a24] text-[#0c0d10] font-bold text-xs shadow flex items-center gap-2"
                  >
                    <Save className="w-3.5 h-3.5" />
                    <span>{t.saveHeroSettings}</span>
                  </button>
                </div>
              </div>
            </form>
          )}

                    {/* TAB 5: WELCOME SCREEN */}
          {activeTab === 'welcome' && (
            <form onSubmit={handleSaveWelcome} className="space-y-6">
              <div className="bg-[#161822] p-6 rounded-2xl border border-[#2b271e] space-y-6">

                {/* Header */}
                <div className="flex items-center justify-between pb-4 border-b border-[#252219]">
                  <div>
                    <h3 className="font-bold text-base text-white font-['Amiri',serif]">
                      {isAr ? 'إعدادات شاشة الترحيب' : 'Welcome Screen Settings'}
                    </h3>

                    <p className="text-xs text-[#9d9689] mt-1">
                      {isAr
                        ? 'تخصيص شاشة الترحيب التي تظهر للزبون قبل دخول المنيو'
                        : 'Customize the welcome screen shown before entering the menu'}
                    </p>
                  </div>

                  <div className="w-11 h-11 rounded-xl bg-[#FFD11A]/10 border border-[#FFD11A]/30 flex items-center justify-center text-2xl">
                  </div>
                </div>

                {/* Saved Alert */}
                {welcomeSavedAlert && (
                  <div className="p-3 rounded-xl bg-emerald-950/80 border border-emerald-600/50 text-emerald-300 text-xs flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>
                      {isAr
                        ? 'تم حفظ إعدادات شاشة الترحيب بنجاح!'
                        : 'Welcome screen settings saved successfully!'}
                    </span>
                  </div>
                )}

                {/* Background Type */}
                <div className="space-y-3">
                  <label className="block text-xs font-semibold text-[#a8a192]">
                    {isAr ? 'نوع الخلفية' : 'Background Type'}
                  </label>

                  <div className="flex flex-wrap gap-3">

                    <label className={`flex items-center gap-2 px-4 py-3 rounded-xl border cursor-pointer transition-all ${
                      welcomeForm.backgroundType === 'video'
                        ? 'bg-[#FFD11A]/10 border-[#FFD11A] text-[#FFD11A]'
                        : 'bg-[#101218] border-[#312c21] text-[#a8a192]'
                    }`}>
                      <input
                        type="radio"
                        name="welcomeBackgroundType"
                        value="video"
                        checked={welcomeForm.backgroundType === 'video'}
                        onChange={() =>
                          setWelcomeForm({
                            ...welcomeForm,
                            backgroundType: 'video'
                          })
                        }
                      />

                      <span>
                        {isAr ? 'فيديو' : 'Video'}
                      </span>
                    </label>

                    <label className={`flex items-center gap-2 px-4 py-3 rounded-xl border cursor-pointer transition-all ${
                      welcomeForm.backgroundType === 'image'
                        ? 'bg-[#FFD11A]/10 border-[#FFD11A] text-[#FFD11A]'
                        : 'bg-[#101218] border-[#312c21] text-[#a8a192]'
                    }`}>
                      <input
                        type="radio"
                        name="welcomeBackgroundType"
                        value="image"
                        checked={welcomeForm.backgroundType === 'image'}
                        onChange={() =>
                          setWelcomeForm({
                            ...welcomeForm,
                            backgroundType: 'image'
                          })
                        }
                      />

                      <span>
                        {isAr ? 'صورة' : 'Image'}
                      </span>
                    </label>

                  </div>
                </div>

                {/* Background URL */}
                <div>
                  <label className="block text-xs font-semibold text-[#a8a192] mb-1.5">
                    {welcomeForm.backgroundType === 'video'
                      ? (isAr ? 'رابط الفيديو' : 'Video URL')
                      : (isAr ? 'رابط الصورة' : 'Image URL')}
                  </label>

                  <input
                    type="url"
                    value={welcomeForm.backgroundUrl}
                    onChange={(e) =>
                      setWelcomeForm({
                        ...welcomeForm,
                        backgroundUrl: e.target.value
                      })
                    }
                    placeholder={
                      welcomeForm.backgroundType === 'video'
                        ? 'https://example.com/welcome-video.mp4'
                        : 'https://example.com/welcome-image.jpg'
                    }
                    className="w-full bg-[#101218] border border-[#312c21] rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-[#d4af37]"
                    dir="ltr"
                  />
                </div>

                {/* Logo URL */}
                <div>
                  <label className="block text-xs font-semibold text-[#a8a192] mb-1.5">
                    {isAr ? 'شعار المطعم' : 'Restaurant Logo'}
                  </label>

                  <input
                    type="url"
                    value={welcomeForm.logoUrl}
                    onChange={(e) =>
                      setWelcomeForm({
                        ...welcomeForm,
                        logoUrl: e.target.value
                      })
                    }
                    placeholder="https://example.com/logo.png"
                    className="w-full bg-[#101218] border border-[#312c21] rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-[#d4af37]"
                    dir="ltr"
                  />

                  {welcomeForm.logoUrl && (
                    <div className="mt-3 flex items-center gap-3 p-3 rounded-xl bg-[#11131a] border border-[#2b271d]">
                      <img
                        src={welcomeForm.logoUrl}
                        alt="Restaurant Logo"
                        className="w-16 h-16 rounded-xl object-contain bg-black/20"
                      />

                      <span className="text-xs text-emerald-400">
                        {isAr ? 'معاينة الشعار' : 'Logo Preview'}
                      </span>
                    </div>
                  )}
                </div>

                {/* Welcome Texts */}
                <div className="pt-4 border-t border-[#252219] space-y-4">

                  <div>
                    <h4 className="text-sm font-bold text-[#FFD11A]">
                      {isAr ? 'نصوص الترحيب' : 'Welcome Texts'}
                    </h4>

                    <p className="text-[11px] text-[#8e877c] mt-1">
                      {isAr
                        ? 'ستظهر النصوص الأربعة معًا في شاشة الترحيب'
                        : 'All four texts will appear together on the welcome screen'}
                    </p>
                  </div>

                  {/* Arabic */}
                  <div>
                    <label className="block text-xs font-semibold text-[#a8a192] mb-1.5">
                      العربية
                    </label>

                    <input
                      type="text"
                      value={welcomeForm.welcomeAr}
                      onChange={(e) =>
                        setWelcomeForm({
                          ...welcomeForm,
                          welcomeAr: e.target.value
                        })
                      }
                      placeholder="أهلاً وسهلاً بكم"
                      className="w-full bg-[#101218] border border-[#312c21] rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-[#d4af37]"
                      dir="rtl"
                    />
                  </div>

                  {/* Kurdish */}
                  <div>
                    <label className="block text-xs font-semibold text-[#a8a192] mb-1.5">
                      الكردية
                    </label>

                    <input
                      type="text"
                      value={welcomeForm.welcomeKu}
                      onChange={(e) =>
                        setWelcomeForm({
                          ...welcomeForm,
                          welcomeKu: e.target.value
                        })
                      }
                      placeholder="بەخێربێن"
                      className="w-full bg-[#101218] border border-[#312c21] rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-[#d4af37]"
                      dir="rtl"
                    />
                  </div>

                  {/* English */}
                  <div>
                    <label className="block text-xs font-semibold text-[#a8a192] mb-1.5">
                      English
                    </label>

                    <input
                      type="text"
                      value={welcomeForm.welcomeEn}
                      onChange={(e) =>
                        setWelcomeForm({
                          ...welcomeForm,
                          welcomeEn: e.target.value
                        })
                      }
                      placeholder="Welcome"
                      className="w-full bg-[#101218] border border-[#312c21] rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-[#d4af37]"
                      dir="ltr"
                    />
                  </div>

                  {/* Syriac */}
                  <div>
                    <label className="block text-xs font-semibold text-[#a8a192] mb-1.5">
                      السريانية
                    </label>

                    <input
                      type="text"
                      value={welcomeForm.welcomeSy}
                      onChange={(e) =>
                        setWelcomeForm({
                          ...welcomeForm,
                          welcomeSy: e.target.value
                        })
                      }
                      placeholder="ܐܚܝܐ ܘܫܠܡܐ"
                      className="w-full bg-[#101218] border border-[#312c21] rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-[#d4af37]"
                      dir="rtl"
                    />
                  </div>

                </div>

                {/* Overlay Opacity */}
                <div className="pt-4 border-t border-[#252219]">

                  <div className="flex items-center justify-between mb-2">
                    <label className="text-xs font-semibold text-[#a8a192]">
                      {isAr ? 'قوة الظل' : 'Overlay Darkness'}
                    </label>

                    <span className="text-xs font-bold text-[#FFD11A]">
                      {Math.round(welcomeForm.overlayOpacity * 100)}%
                    </span>
                  </div>

                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.05"
                    value={welcomeForm.overlayOpacity}
                    onChange={(e) =>
                      setWelcomeForm({
                        ...welcomeForm,
                        overlayOpacity: Number(e.target.value)
                      })
                    }
                    className="w-full accent-[#FFD11A]"
                  />

                </div>

                {/* Animation */}
                <div>
                  <label className="block text-xs font-semibold text-[#a8a192] mb-1.5">
                    {isAr ? 'التأثير' : 'Animation'}
                  </label>

                  <select
                    value={welcomeForm.animation}
                    onChange={(e) =>
                      setWelcomeForm({
                        ...welcomeForm,
                        animation: e.target.value as WelcomeConfig['animation']
                      })
                    }
                    className="w-full bg-[#101218] border border-[#312c21] rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-[#d4af37]"
                  >
                    <option value="fade">
                      Fade
                    </option>

                    <option value="slide">
                      Slide
                    </option>

                    <option value="zoom">
                      Zoom
                    </option>
                  </select>
                </div>

                {/* Enabled */}
                <div className="p-4 rounded-xl bg-[#11131a] border border-[#2b271d]">

                  <label className="flex items-center justify-between cursor-pointer">

                    <div>
                      <div className="text-xs font-bold text-white">
                        {isAr
                          ? 'تفعيل شاشة الترحيب'
                          : 'Enable Welcome Screen'}
                      </div>

                      <div className="text-[11px] text-[#817a6e] mt-1">
                        {isAr
                          ? 'عند التعطيل سيتم تجاوز شاشة الترحيب'
                          : 'When disabled, the welcome screen will be skipped'}
                      </div>
                    </div>

                    <input
                      type="checkbox"
                      checked={welcomeForm.enabled}
                      onChange={(e) =>
                        setWelcomeForm({
                          ...welcomeForm,
                          enabled: e.target.checked
                        })
                      }
                      className="w-5 h-5 rounded text-[#FFD11A]"
                    />

                  </label>

                </div>

                {/* Save */}
                <div className="pt-4 border-t border-[#252219] flex justify-end">

                  <button
                    type="submit"
                    className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-[#FFD11A] to-[#F7941D] text-[#0c0d10] font-black text-xs shadow-lg flex items-center gap-2 hover:brightness-110 transition-all"
                  >
                    <Save className="w-4 h-4" />

                    <span>
                      {isAr
                        ? 'حفظ الإعدادات'
                        : 'Save Settings'}
                    </span>
                  </button>

                </div>

              </div>
            </form>
          )}


          {/* TAB 5: RESTAURANT SETTINGS & ADMIN PASSWORD */}
          {activeTab === 'settings' && (
            <form onSubmit={handleSaveSettings} className="space-y-6">
              <div className="bg-[#161822] p-6 rounded-2xl border border-[#2b271e] space-y-6">
                <div>
                  <h3 className="font-bold text-base text-white font-['Amiri',serif]">
                    {t.adminSecurityTitle}
                  </h3>
                  <p className="text-xs text-[#9d9689]">
                    {isAr ? 'تعديل اسم مستخدم المدير وكلمة المرور للدخول إلى لوحة التحكم' : 'Change admin credentials for portal login'}
                  </p>
                </div>

                {settingsSavedAlert && (
                  <div className="p-3 rounded-xl bg-emerald-950/80 border border-emerald-600/50 text-emerald-300 text-xs flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>{isAr ? 'تم حفظ بيانات المدير والمطعم بنجاح!' : 'Settings & Credentials saved successfully!'}</span>
                  </div>
                )}

                {/* Dedicated Kids Menu Direct Link & Separation Info */}
                <div className="p-4 rounded-xl bg-[#0f1d47] border-2 border-[#2855D9] space-y-3 shadow-lg">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <h4 className="text-xs font-black text-[#FFD11A] flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>{isAr ? 'رابط صفحة منيو الأطفال المستقلة (QR Code / Direct URL)' : 'Dedicated Kids Menu Page Link'}</span>
                      </h4>
                      <p className="text-[11px] text-[#b2c8fb] mt-1">
                        {isAr 
                          ? 'صفحة منيو الأطفال مفصولة تماماً عن لوحة التحكم، هذا الرابط مخصص للزبائن والأجهزة اللوحية وقوائم QR.' 
                          : 'The customer menu is completely isolated from the admin dashboard. Use this URL for QR codes and guests.'}
                      </p>
                    </div>
                    <span className="text-[10px] px-2.5 py-1 rounded-full bg-[#78C943]/20 border border-[#78C943] text-[#78C943] font-black shrink-0 self-start sm:self-center">
                      {isAr ? '✓ صفحة منفصلة 100%' : '✓ 100% Isolated'}
                    </span>
                  </div>

                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 pt-1">
                    <input
                      type="text"
                      readOnly
                      value={typeof window !== 'undefined' ? `${window.location.origin}${window.location.pathname}#/menu` : '#/menu'}
                      className="flex-1 bg-[#0a163e] border border-[#2855D9] rounded-xl px-3 py-2 text-xs text-[#FFD11A] font-mono select-all focus:outline-none"
                      dir="ltr"
                    />
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={handleCopyMenuLink}
                        className="flex-1 sm:flex-initial px-3.5 py-2 rounded-xl bg-[#2855D9] hover:bg-[#3564e9] text-xs font-bold text-white flex items-center justify-center gap-1.5 shadow transition-all active:scale-95"
                      >
                        {linkCopied ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-[#78C943]" />
                            <span>{isAr ? 'تم النسخ!' : 'Copied!'}</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5" />
                            <span>{isAr ? 'نسخ الرابط' : 'Copy Link'}</span>
                          </>
                        )}
                      </button>
                      <a
                        href="#/menu"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-1 sm:flex-initial px-3.5 py-2 rounded-xl bg-[#12245e] hover:bg-[#1a3382] border border-[#2855D9] text-xs font-bold text-[#FFD11A] flex items-center justify-center gap-1.5 shadow transition-all"
                        title={isAr ? 'فتح صفحة المنيو في نافذة جديدة' : 'Open in new tab'}
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                        <span>{isAr ? 'فتح في صفحة منفصلة ↗' : 'Open in New Tab ↗'}</span>
                      </a>
                    </div>
                  </div>
                </div>

                {/* Credentials */}
                <div className="p-4 rounded-xl bg-[#11131a] border border-[#2b271d] grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-[#a8a192] mb-1.5">
                      {t.newAdminUsername} *
                    </label>
                    <input
                      type="text"
                      required
                      value={settingsForm.adminUsername}
                      onChange={(e) => setSettingsForm({ ...settingsForm, adminUsername: e.target.value })}
                      className="w-full bg-[#181a24] border border-[#332f25] rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-[#d4af37]"
                      dir="ltr"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-[#a8a192] mb-1.5">
                      {t.newAdminPassword} *
                    </label>
                    <input
                      type="text"
                      required
                      value={settingsForm.adminPassword}
                      onChange={(e) => setSettingsForm({ ...settingsForm, adminPassword: e.target.value })}
                      className="w-full bg-[#181a24] border border-[#332f25] rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-[#d4af37]"
                      dir="ltr"
                    />
                  </div>
                </div>

                {/* Restaurant Info */}
                <h4 className="text-sm font-bold text-white font-['Amiri',serif] pt-2">
                  {t.restaurantDetails}
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-[#a8a192] mb-1.5">{t.restNameAr}</label>
                    <input
                      type="text"
                      value={settingsForm.name}
                      onChange={(e) => setSettingsForm({ ...settingsForm, name: e.target.value })}
                      className="w-full bg-[#101218] border border-[#312c21] rounded-xl px-3.5 py-2 text-xs text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-[#a8a192] mb-1.5">{t.restNameEn}</label>
                    <input
                      type="text"
                      value={settingsForm.nameEn}
                      onChange={(e) => setSettingsForm({ ...settingsForm, nameEn: e.target.value })}
                      className="w-full bg-[#101218] border border-[#312c21] rounded-xl px-3.5 py-2 text-xs text-white"
                      dir="ltr"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-[#a8a192] mb-1.5">{t.phone}</label>
                    <input
                      type="text"
                      value={settingsForm.phone}
                      onChange={(e) => setSettingsForm({ ...settingsForm, phone: e.target.value })}
                      className="w-full bg-[#101218] border border-[#312c21] rounded-xl px-3.5 py-2 text-xs text-white"
                      dir="ltr"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-[#a8a192] mb-1.5">{t.whatsapp}</label>
                    <input
                      type="text"
                      value={settingsForm.whatsapp}
                      onChange={(e) => setSettingsForm({ ...settingsForm, whatsapp: e.target.value })}
                      className="w-full bg-[#101218] border border-[#312c21] rounded-xl px-3.5 py-2 text-xs text-white"
                      dir="ltr"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-[#a8a192] mb-1.5">{t.addressAr}</label>
                    <input
                      type="text"
                      value={settingsForm.address}
                      onChange={(e) => setSettingsForm({ ...settingsForm, address: e.target.value })}
                      className="w-full bg-[#101218] border border-[#312c21] rounded-xl px-3.5 py-2 text-xs text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-[#a8a192] mb-1.5">{t.addressEn}</label>
                    <input
                      type="text"
                      value={settingsForm.addressEn}
                      onChange={(e) => setSettingsForm({ ...settingsForm, addressEn: e.target.value })}
                      className="w-full bg-[#101218] border border-[#312c21] rounded-xl px-3.5 py-2 text-xs text-white"
                      dir="ltr"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-[#a8a192] mb-1.5">{t.currencyAr}</label>
                    <input
                      type="text"
                      value={settingsForm.currency}
                      onChange={(e) => setSettingsForm({ ...settingsForm, currency: e.target.value })}
                      className="w-full bg-[#101218] border border-[#312c21] rounded-xl px-3.5 py-2 text-xs text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-[#a8a192] mb-1.5">{t.currencyEn}</label>
                    <input
                      type="text"
                      value={settingsForm.currencyEn}
                      onChange={(e) => setSettingsForm({ ...settingsForm, currencyEn: e.target.value })}
                      className="w-full bg-[#101218] border border-[#312c21] rounded-xl px-3.5 py-2 text-xs text-white"
                      dir="ltr"
                    />
                  </div>
                </div>

                <div className="pt-2 flex justify-end">
                  <button
                    type="submit"
                    className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-[#d4af37] to-[#ba8a24] text-[#0c0d10] font-bold text-xs shadow flex items-center gap-2"
                  >
                    <Save className="w-3.5 h-3.5" />
                    <span>{t.saveAllSettings}</span>
                  </button>
                </div>
              </div>
            </form>
          )}

          {/* TAB 6: FIRESTORE DATABASE SYNC */}
          {activeTab === 'drive' && (
            <div className="space-y-6">
              <div className="bg-[#12245e] p-6 rounded-2xl border-2 border-[#2855D9] space-y-5">
                <div>
                  <h3 className="font-black text-base text-white font-['Noto_Kufi_Arabic']">
                    {isAr ? 'مزامنة قاعدة البيانات' : 'Database Synchronization'}
                  </h3>
                  <p className="text-xs text-[#9eb9fc] mt-1">
                    {isAr ? 'مزامنة جميع بيانات لوحة التحكم مع قاعدة البيانات.' : 'Synchronize all dashboard data with the database.'}
                  </p>
                </div>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                  <div className="rounded-xl bg-[#0f2156] border border-[#2855D9] p-4 text-center">
                    <div className="text-2xl font-black text-[#FFD11A]">{items.length}</div>
                    <div className="text-xs text-[#a2bbf5] mt-1">{isAr ? 'الوجبات' : 'Meals'}</div>
                  </div>
                  <div className="rounded-xl bg-[#0f2156] border border-[#2855D9] p-4 text-center">
                    <div className="text-2xl font-black text-[#FFD11A]">{categories.length}</div>
                    <div className="text-xs text-[#a2bbf5] mt-1">{isAr ? 'الأصناف' : 'Categories'}</div>
                  </div>
                  <div className="rounded-xl bg-[#0f2156] border border-[#2855D9] p-4 text-center">
                    <div className="text-2xl font-black text-[#FFD11A]">{restaurant ? 1 : 0}</div>
                    <div className="text-xs text-[#a2bbf5] mt-1">{isAr ? 'معلومات المطعم' : 'Restaurant Info'}</div>
                  </div>
                  <div className="rounded-xl bg-[#0f2156] border border-[#2855D9] p-4 text-center">
                    <div className="text-2xl font-black text-[#FFD11A]">{hero ? 1 : 0}</div>
                    <div className="text-xs text-[#a2bbf5] mt-1">{isAr ? 'إعدادات Hero' : 'Hero Settings'}</div>
                  </div>
                </div>
                <button
                  onClick={handleMigrateItemsToFirestore}
                  className="w-full py-3 rounded-xl bg-[#FFD11A] hover:bg-[#e8bd13] text-[#0a163e] text-sm font-black flex items-center justify-center gap-2"
                >
                  <RefreshCw className="w-4 h-4" />
                  <span>{isAr ? 'مزامنة قاعدة البيانات' : 'Sync Database'}</span>
                </button>
              </div>
            </div>
          )}

        </div>
      </div>

      {/* Explicit Confirmation Dialog */}
      {confirmDialog && confirmDialog.isOpen && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4">
          <div 
            className="fixed inset-0 bg-black/80 backdrop-blur-sm"
            onClick={() => setConfirmDialog(null)}
          />
          <div className="relative w-full max-w-md bg-[#161824] border border-[#3b3528] rounded-3xl p-6 shadow-2xl z-10 text-white animate-in zoom-in-95">
            <h3 className="text-lg font-bold font-['Amiri',serif] text-white mb-2">
              {confirmDialog.title}
            </h3>
            <p className="text-xs text-[#a0998b] leading-relaxed mb-6">
              {confirmDialog.message}
            </p>
            <div className="flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setConfirmDialog(null)}
                className="px-4 py-2 rounded-xl bg-[#222534] hover:bg-[#2e3246] text-xs font-bold text-[#8e877c]"
              >
                {t.cancel}
              </button>
              <button
                type="button"
                onClick={confirmDialog.onConfirm}
                className="px-5 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-bold shadow"
              >
                {t.confirm}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
