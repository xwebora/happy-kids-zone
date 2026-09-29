import React, { useState, useRef } from 'react';
import { 
  X, 
  Upload, 
  Plus, 
  Save, 
  Trash2, 
  Edit2, 
  Check, 
  HardDrive, 
  CloudUpload, 
  LogOut, 
  Sparkles, 
  DollarSign, 
  RefreshCw, 
  AlertTriangle,
  FolderOpen,
  Image as ImageIcon,
  CheckCircle2,
  Lock,
  Layers,
  LayoutTemplate,
  Sliders,
  Settings,
  ExternalLink,
  Copy
} from 'lucide-react';
import { MenuItem, Category, RestaurantInfo, HeroConfig, Language } from '../types';
import { uploadImageToDrive, saveMenuBackupToDrive, deleteDriveFile } from '../services/driveService';
import { googleSignIn, logout } from '../services/auth';
import { translations } from '../utils/i18n';
import { User } from 'firebase/auth';
import {
  addMenuItem,
  updateMenuItem,
  deleteMenuItem,
  setMenuItem,
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
  user,
  onUserChange,
  onAdminLogout,
}) => {
  const t = translations[language];
  const isAr = language === 'ar';

  // Tabs: 'items' | 'add-item' | 'categories' | 'hero' | 'settings' | 'drive'
  const [activeTab, setActiveTab] = useState<'items' | 'add-item' | 'categories' | 'hero' | 'settings' | 'drive'>('items');
  const [isDriveSyncing, setIsDriveSyncing] = useState(false);
  const [syncBanner, setSyncBanner] = useState<string | null>(null);

  // Item Form State
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  const [formNameAr, setFormNameAr] = useState('');
  const [formNameEn, setFormNameEn] = useState('');
  const [formDescAr, setFormDescAr] = useState('');
  const [formDescEn, setFormDescEn] = useState('');
  const [formPrice, setFormPrice] = useState<number | ''>('');
  const [formOrigPrice, setFormOrigPrice] = useState<number | ''>('');
  const [formCategory, setFormCategory] = useState(categories[0]?.id || 'main');
  const [formImageUrl, setFormImageUrl] = useState('');
  const [formCalories, setFormCalories] = useState<number | ''>('');
  const [formPrepTimeAr, setFormPrepTimeAr] = useState('15 دقيقة');
  const [formPrepTimeEn, setFormPrepTimeEn] = useState('15 min');
  const [formIsSpecial, setFormIsSpecial] = useState(false);
  const [formIsPopular, setFormIsPopular] = useState(false);
  const [formAvailable, setFormAvailable] = useState(true);

  // File Upload State
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [uploadToDriveChecked, setUploadToDriveChecked] = useState(true);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Quick Price State
  const [quickPrices, setQuickPrices] = useState<Record<string, number>>({});
  const [savedSuccessId, setSavedSuccessId] = useState<string | null>(null);

  // Category Form State
  const [editingCat, setEditingCat] = useState<Category | null>(null);
  const [catNameAr, setCatNameAr] = useState('');
  const [catNameEn, setCatNameEn] = useState('');
  const [catIcon, setCatIcon] = useState('Utensils');

  // Hero Edit Form State
  const [heroForm, setHeroForm] = useState<HeroConfig>(hero);
  const [heroSavedAlert, setHeroSavedAlert] = useState(false);

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

  // Confirmation Modal
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
  } | null>(null);

  if (!isOpen) return null;

  // Google Drive Auth
  const handleGoogleLogin = async () => {
    try {
      const res = await googleSignIn();
      if (res) {
        onUserChange(res.user);
        setSyncBanner(isAr ? 'تم تسجيل الدخول بنجاح مع Google Drive' : 'Successfully connected to Google Drive');
        setTimeout(() => setSyncBanner(null), 4000);
      }
    } catch (err: any) {
      alert(err.message || 'Google login failed');
    }
  };

  const handleGoogleLogout = async () => {
    await logout();
    onUserChange(null);
  };

  // Sync to Drive
  const handleSyncToDrive = async () => {
    if (!user) {
      alert(isAr ? 'يرجى تسجيل الدخول بحساب Google أولاً' : 'Please connect Google account first');
      return;
    }

    setConfirmDialog({
      isOpen: true,
      title: isAr ? 'حفظ وتحديث نسخة Google Drive' : 'Sync Menu to Google Drive',
      message: isAr 
        ? `هل تريد حفظ قائمة المطعم الحالية (${items.length} طبق) إلى مجلد Google Drive؟` 
        : `Do you want to backup current menu (${items.length} items) to your Google Drive?`,
      onConfirm: async () => {
        setConfirmDialog(null);
        setIsDriveSyncing(true);
        setSyncBanner(isAr ? 'جارٍ رفع البيانات إلى Google Drive...' : 'Uploading data to Google Drive...');
        try {
          const res = await saveMenuBackupToDrive(items);
          setSyncBanner(isAr ? `تمت المزامنة بنجاح! معرف الملف: ${res.fileId}` : `Successfully synced! File ID: ${res.fileId}`);
        } catch (err: any) {
          setSyncBanner(err.message);
        } finally {
          setIsDriveSyncing(false);
          setTimeout(() => setSyncBanner(null), 5000);
        }
      },
    });
  };

  // Image Upload handler
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setFilePreview(URL.createObjectURL(file));
    }
  };

  // Populate Item form for editing
  const startEditItem = (item: MenuItem) => {
    setEditingItem(item);
    setFormNameAr(item.name);
    setFormNameEn(item.nameEn || '');
    setFormDescAr(item.description);
    setFormDescEn(item.descriptionEn || '');
    setFormPrice(item.price);
    setFormOrigPrice(item.originalPrice || '');
    setFormCategory(item.category);
    setFormImageUrl(item.image);
    setFormCalories(item.calories || '');
    setFormPrepTimeAr(item.preparationTime || '15 دقيقة');
    setFormPrepTimeEn(item.preparationTimeEn || '15 min');
    setFormIsSpecial(!!item.isChefSpecial);
    setFormIsPopular(!!item.isPopular);
    setFormAvailable(item.available);
    setSelectedFile(null);
    setFilePreview(null);
    setActiveTab('add-item');
  };

  const resetItemForm = () => {
    setEditingItem(null);
    setFormNameAr('');
    setFormNameEn('');
    setFormDescAr('');
    setFormDescEn('');
    setFormPrice('');
    setFormOrigPrice('');
    setFormCategory(categories[0]?.id || 'main');
    setFormImageUrl('');
    setFormCalories('');
    setFormPrepTimeAr('15 دقيقة');
    setFormPrepTimeEn('15 min');
    setFormIsSpecial(false);
    setFormIsPopular(false);
    setFormAvailable(true);
    setSelectedFile(null);
    setFilePreview(null);
  };

  // Save Item (Create or Update)
const handleSaveItem = async (e: React.FormEvent) => {
  e.preventDefault();

  if (!formNameAr || formPrice === '') {
    alert(
      isAr
        ? 'يرجى إدخال اسم الوجبة والسعر'
        : 'Please provide dish name and price'
    );
    return;
  }

  let finalImageUrl =
    formImageUrl ||
    'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=600&q=80';

  let driveFileId = editingItem?.driveFileId;

  // رفع الصورة إلى Google Drive
  if (selectedFile) {
    if (user && uploadToDriveChecked) {
      setIsUploadingImage(true);

      try {
        const fileName = `item_${Date.now()}_${selectedFile.name.replace(/\s+/g, '_')}`;

        const uploadRes = await uploadImageToDrive(
          selectedFile,
          fileName
        );

        finalImageUrl = uploadRes.directUrl;
        driveFileId = uploadRes.fileId;
      } catch (err: any) {
        console.error('Drive upload failed:', err);

        finalImageUrl =
          filePreview || finalImageUrl;
      } finally {
        setIsUploadingImage(false);
      }
    } else if (filePreview) {
      finalImageUrl = filePreview;
    }
  }

  try {
    // ============================================
    // تعديل وجبة موجودة
    // ============================================
    if (editingItem) {
      const updatedItem: Partial<Omit<MenuItem, 'id'>> = {
        name: formNameAr,
        nameEn: formNameEn || formNameAr,
        description: formDescAr,
        descriptionEn: formDescEn || formDescAr,
        price: Number(formPrice),
        category: formCategory,
        image: finalImageUrl,
        available: formAvailable,
        isChefSpecial: formIsSpecial,
        isPopular: formIsPopular,
        preparationTime: formPrepTimeAr,
        preparationTimeEn: formPrepTimeEn,
      };

      if (formOrigPrice !== '') {
        updatedItem.originalPrice = Number(formOrigPrice);
      }

      if (formCalories !== '') {
        updatedItem.calories = Number(formCalories);
      }

      if (driveFileId) {
        updatedItem.driveFileId = driveFileId;
      }

      // حفظ في Firestore
      await updateMenuItem(
        editingItem.id,
        updatedItem
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
        description: formDescAr,
        descriptionEn: formDescEn || formDescAr,
        price: Number(formPrice),
        category: formCategory,
        image: finalImageUrl,
        available: formAvailable,
        isChefSpecial: formIsSpecial,
        isPopular: formIsPopular,
        preparationTime: formPrepTimeAr,
        preparationTimeEn: formPrepTimeEn,
      };

      if (formOrigPrice !== '') {
        newItemData.originalPrice = Number(formOrigPrice);
      }

      if (formCalories !== '') {
        newItemData.calories = Number(formCalories);
      }

      if (driveFileId) {
        newItemData.driveFileId = driveFileId;
      }

      // حفظ في Firestore
      const firestoreId = await addMenuItem(
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
      ? `هل أنت متأكد من حذف طبق "${item.name}" من قائمة المطعم؟`
      : `Are you sure you want to delete "${item.nameEn || item.name}" from the menu?`,

    onConfirm: async () => {
      setConfirmDialog(null);

      try {
        // حذف من Firestore
        await deleteMenuItem(item.id);

        // حذف الصورة من Google Drive إن وجدت
        if (item.driveFileId && user) {
          try {
            await deleteDriveFile(
              item.driveFileId
            );
          } catch (driveError) {
            console.warn(
              'Drive deletion error:',
              driveError
            );
          }
        }

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

// نقل الوجبات الحالية إلى Firestore
const handleMigrateItemsToFirestore = async () => {
  if (!items || items.length === 0) {
    alert(
      isAr
        ? 'لا توجد وجبات لنقلها إلى قاعدة البيانات'
        : 'There are no menu items to migrate'
    );
    return;
  }

  const confirmed = window.confirm(
    isAr
      ? `سيتم نقل ${items.length} وجبة إلى Firestore.\n\nلن يتم حذف أي شيء من جهازك أو Google Drive.\n\nهل تريد المتابعة؟`
      : `${items.length} menu items will be migrated to Firestore.\n\nNothing will be deleted from your device or Google Drive.\n\nContinue?`
  );

  if (!confirmed) return;

  try {
    setSyncBanner(
      isAr
        ? 'جاري نقل الوجبات إلى قاعدة البيانات...'
        : 'Migrating menu items to database...'
    );

    let migratedCount = 0;

    for (const item of items) {
      const { id, ...itemData } = item;

      await setMenuItem(id, itemData);

      migratedCount++;
    }

    setSyncBanner(
      isAr
        ? `تم نقل ${migratedCount} وجبة إلى قاعدة البيانات بنجاح`
        : `${migratedCount} menu items migrated successfully`
    );

    setTimeout(() => {
      setSyncBanner(null);
    }, 5000);

  } catch (error: any) {
    console.error('❌ Migration error:', error);

    setSyncBanner(null);

    alert(
      isAr
        ? `حدث خطأ أثناء نقل البيانات:\n${error.message || error}`
        : `Migration failed:\n${error.message || error}`
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
  const handleSaveCategory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!catNameAr.trim()) {
      alert(isAr ? 'يرجى إدخال اسم الصنف بالعربية' : 'Please provide category name');
      return;
    }

    if (editingCat) {
      onUpdateCategories(
        categories.map((c) =>
          c.id === editingCat.id
            ? { ...c, name: catNameAr, nameEn: catNameEn || catNameAr, icon: catIcon }
            : c
        )
      );
      setEditingCat(null);
    } else {
      const newCat: Category = {
        id: `cat-${Date.now()}`,
        name: catNameAr,
        nameEn: catNameEn || catNameAr,
        icon: catIcon,
      };
      onUpdateCategories([...categories, newCat]);
    }

    setCatNameAr('');
    setCatNameEn('');
    setCatIcon('Utensils');
  };

  // Start Category Edit
  const startEditCategory = (cat: Category) => {
    setEditingCat(cat);
    setCatNameAr(cat.name);
    setCatNameEn(cat.nameEn || cat.name);
    setCatIcon(cat.icon || 'Utensils');
  };

  // Delete Category (checks linked items first)
  const handleDeleteCategory = (cat: Category) => {
    const linkedItems = items.filter((i) => i.category === cat.id);
    if (linkedItems.length > 0) {
      alert(t.cannotDeleteCategoryHasItems);
      return;
    }

    setConfirmDialog({
      isOpen: true,
      title: t.confirmTitle,
      message: `${t.confirmDeleteCategory} (${isAr ? cat.name : cat.nameEn})`,
      onConfirm: () => {
        setConfirmDialog(null);
        onUpdateCategories(categories.filter((c) => c.id !== cat.id));
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

  // Save Settings & Credentials
  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateRestaurant(settingsForm);
    setSettingsSavedAlert(true);
    setTimeout(() => setSettingsSavedAlert(false), 3000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/85 backdrop-blur-md transition-opacity"
        onClick={onClose}
      />

      {/* Modal Dialog */}
      <div className="relative w-full max-w-5xl bg-[#0a163e] border-2 border-[#2855D9] rounded-3xl shadow-2xl flex flex-col max-h-[92vh] overflow-hidden text-white z-10">
        
        {/* Header */}
        <div className="px-6 py-5 border-b-2 border-[#1e3b96] flex items-center justify-between bg-[#0e2055]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-[#FFD11A] to-[#F7941D] flex items-center justify-center text-[#0a163e] font-black shadow-md">
              <DollarSign className="w-6 h-6 stroke-[2.5]" />
            </div>
            <div>
              <h2 className="text-xl font-black font-['Fredoka','Cairo',sans-serif] text-white">
                {t.adminDashboardTitle}
              </h2>
              <p className="text-xs text-[#9eb9fc]">
                {t.adminDashboardSubtitle}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Google Drive Status Pill */}
            {user ? (
              <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#78C943]/20 border border-[#78C943] text-[#78C943] text-xs font-bold">
                <span className="w-2 h-2 rounded-full bg-[#78C943] animate-pulse" />
                <span>Drive: {user.email?.split('@')[0]}</span>
                <button
                  onClick={handleGoogleLogout}
                  className="mr-1 text-white hover:text-red-300"
                  title="تسجيل الخروج من Drive"
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <button
                onClick={handleGoogleLogin}
                className="hidden sm:flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-[#12245e] hover:bg-[#1c3587] text-xs font-bold text-white border border-[#2855D9]"
              >
                <CloudUpload className="w-3.5 h-3.5 text-[#FFD11A]" />
                <span>Google Drive</span>
              </button>
            )}

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
            {isDriveSyncing && <RefreshCw className="w-3.5 h-3.5 animate-spin text-sky-400" />}
          </div>
        )}

        {/* Navigation Tabs */}
        <div className="flex items-center gap-1 px-6 pt-2 border-b-2 border-[#1e3b96] bg-[#0a163e] overflow-x-auto scrollbar-none">
          <button
            onClick={() => { setActiveTab('items'); resetItemForm(); }}
            className={`px-3.5 py-2.5 text-xs sm:text-sm font-black border-b-2 transition-all flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'items'
                ? 'border-[#FFD11A] text-[#FFD11A] bg-[#12245e]/80'
                : 'border-transparent text-[#9ebbf9] hover:text-white'
            }`}
          >
            <span>{t.tabItems} ({items.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('add-item')}
            className={`px-3.5 py-2.5 text-xs sm:text-sm font-black border-b-2 transition-all flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'add-item'
                ? 'border-[#FFD11A] text-[#FFD11A] bg-[#12245e]/80'
                : 'border-transparent text-[#9ebbf9] hover:text-white'
            }`}
          >
            <Plus className="w-3.5 h-3.5" />
            <span>{editingItem ? t.editItemTitle : t.addNewItem}</span>
          </button>
          <button
            onClick={() => setActiveTab('categories')}
            className={`px-3.5 py-2.5 text-xs sm:text-sm font-black border-b-2 transition-all flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'categories'
                ? 'border-[#FFD11A] text-[#FFD11A] bg-[#12245e]/80'
                : 'border-transparent text-[#9ebbf9] hover:text-white'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>{t.tabCategories} ({categories.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('hero')}
            className={`px-3.5 py-2.5 text-xs sm:text-sm font-black border-b-2 transition-all flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'hero'
                ? 'border-[#FFD11A] text-[#FFD11A] bg-[#12245e]/80'
                : 'border-transparent text-[#9ebbf9] hover:text-white'
            }`}
          >
            <LayoutTemplate className="w-3.5 h-3.5" />
            <span>{t.tabHero}</span>
          </button>
          <button
            onClick={() => setActiveTab('settings')}
            className={`px-3.5 py-2.5 text-xs sm:text-sm font-black border-b-2 transition-all flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'settings'
                ? 'border-[#FFD11A] text-[#FFD11A] bg-[#12245e]/80'
                : 'border-transparent text-[#9ebbf9] hover:text-white'
            }`}
          >
            <Settings className="w-3.5 h-3.5" />
            <span>{t.tabSettings}</span>
          </button>
          <button
            onClick={() => setActiveTab('drive')}
            className={`px-3.5 py-2.5 text-xs sm:text-sm font-black border-b-2 transition-all flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'drive'
                ? 'border-[#FFD11A] text-[#FFD11A] bg-[#12245e]/80'
                : 'border-transparent text-[#9ebbf9] hover:text-white'
            }`}
          >
            <HardDrive className="w-3.5 h-3.5" />
            <span>{t.tabDrive}</span>
          </button>
        </div>

        {/* Tab Contents Area */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          
          {/* TAB 1: MEALS & LIVE PRICE EDITING */}
          {activeTab === 'items' && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#12245e] p-4 rounded-2xl border-2 border-[#2855D9]">
                <div>
                  <h3 className="font-black text-sm text-white font-['Fredoka','Cairo',sans-serif]">
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
                      <th className="py-3 px-4">{isAr ? 'الصورة والاسم' : 'Image & Name'}</th>
                      <th className="py-3 px-4">{t.category}</th>
                      <th className="py-3 px-4">{isAr ? 'السعر الحالي' : 'Live Price'} ({isAr ? restaurant.currency : restaurant.currencyEn})</th>
                      <th className="py-3 px-4">{isAr ? 'حالة التوفر' : 'Availability'}</th>
                      <th className="py-3 px-4 text-center">{isAr ? 'إجراءات' : 'Actions'}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#211f18]">
                    {items.map((item) => (
                      <tr key={item.id} className="hover:bg-[#1a1d29] transition-colors">
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
                                {isAr ? (item.nameEn || '') : item.name}
                              </div>
                            </div>
                          </div>
                        </td>

                        <td className="py-3 px-4">
                          <span className="px-2.5 py-1 rounded-lg bg-[#1f212d] text-[#cfc7b9] font-medium text-[11px] border border-[#2f2b20]">
                            {(() => {
                              const found = categories.find((c) => c.id === item.category);
                              return found ? (isAr ? found.name : found.nameEn) : item.category;
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
                    ))}
                  </tbody>
                </table>
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
                      placeholder="مثال: مندي لحم نعيمي ملكي"
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

                {/* Descriptions (AR & EN) */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-[#a8a192] mb-1.5">
                      {t.descAr} *
                    </label>
                    <textarea
                      rows={3}
                      required
                      placeholder="وصف مكونات الطبق وسر التتبيلة..."
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
                          {isAr ? c.name : c.nameEn}
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

                {/* Image Upload / Google Drive Integration */}
                <div className="border border-[#2f2b20] p-4 rounded-2xl bg-[#11131a] space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-white flex items-center gap-2">
                      <ImageIcon className="w-4 h-4 text-[#d4af37]" />
                      <span>{t.itemImage}</span>
                    </span>
                    {user && (
                      <label className="flex items-center gap-1.5 text-xs text-sky-300 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={uploadToDriveChecked}
                          onChange={(e) => setUploadToDriveChecked(e.target.checked)}
                          className="rounded text-[#d4af37]"
                        />
                        <span>{t.saveToDriveAuto}</span>
                      </label>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center">
                    <div>
                      <input
                        type="file"
                        ref={fileInputRef}
                        accept="image/*"
                        onChange={handleFileChange}
                        className="hidden"
                      />
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="w-full py-4 px-4 rounded-xl border border-dashed border-[#443d2c] hover:border-[#d4af37] bg-[#171924] flex flex-col items-center justify-center gap-2 text-[#a39c8e] hover:text-white transition-all cursor-pointer"
                      >
                        <Upload className="w-5 h-5 text-[#d4af37]" />
                        <span className="text-xs font-semibold">
                          {selectedFile ? selectedFile.name : t.chooseFromDevice}
                        </span>
                      </button>
                    </div>

                    <div>
                      <label className="block text-[11px] text-[#8e877c] mb-1">
                        {t.orDirectUrl}:
                      </label>
                      <input
                        type="url"
                        placeholder="https://images.unsplash.com/..."
                        value={formImageUrl}
                        onChange={(e) => setFormImageUrl(e.target.value)}
                        className="w-full bg-[#171924] border border-[#312c21] rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#d4af37]"
                      />
                    </div>
                  </div>

                  {(filePreview || formImageUrl) && (
                    <div className="flex items-center gap-3 p-2 bg-[#171a26] rounded-xl border border-[#2b271d]">
                      <img
                        src={filePreview || formImageUrl}
                        alt="Preview"
                        className="w-16 h-16 rounded-lg object-cover"
                      />
                      <div className="text-xs">
                        <span className="font-semibold text-emerald-400 block">{isAr ? 'تم تحديد الصورة' : 'Image Selected'}</span>
                        <span className="text-[11px] text-[#817a6e]">
                          {selectedFile && uploadToDriveChecked && user ? 'Google Drive Upload Ready' : 'Ready'}
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
                    disabled={isUploadingImage}
                    className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-[#d4af37] to-[#ba8a24] hover:brightness-110 text-[#0c0d10] text-xs font-bold shadow flex items-center gap-2"
                  >
                    {isUploadingImage ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        <span>Uploading...</span>
                      </>
                    ) : (
                      <>
                        <Save className="w-3.5 h-3.5" />
                        <span>{t.saveItemBtn}</span>
                      </>
                    )}
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
                      onClick={() => { setEditingCat(null); setCatNameAr(''); setCatNameEn(''); }}
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
                      placeholder="مثال: أطباق بحرية"
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
                    </select>
                  </div>
                </div>

                <div className="flex justify-end pt-2">
                  <button
                    type="submit"
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

          {/* TAB 6: GOOGLE DRIVE BACKUP */}
          {activeTab === 'drive' && (
            <div className="space-y-6">
              <div className="bg-[#161824] p-6 rounded-2xl border border-[#2b271d] space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-sky-950/80 border border-sky-500/30 flex items-center justify-center text-sky-400">
                    <HardDrive className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-bold text-base text-white font-['Amiri',serif]">
                      Google Drive Cloud Storage
                    </h3>
                    <p className="text-xs text-[#9d9689]">
                      {isAr 
                        ? 'تخزين صور الأطباق ونسخ قائمة الطعام والأسعار سحابياً بأمان تام على حساب Google Drive الخاص بك.'
                        : 'Store food photos and backup entire menu pricing data securely to your Google Drive.'}
                    </p>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-[#10121a] border border-[#26241c] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <span className="text-xs text-[#7e7769]">{isAr ? 'حالة الربط:' : 'Status:'}</span>
                    <div className="text-sm font-bold text-white flex items-center gap-2 mt-1">
                      {user ? (
                        <>
                          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                          <span>{user.email}</span>
                        </>
                      ) : (
                        <>
                          <AlertTriangle className="w-4 h-4 text-amber-400" />
                          <span>{isAr ? 'غير متصل بحساب Google' : 'Not Connected'}</span>
                        </>
                      )}
                    </div>
                  </div>

                  <div>
                    {user ? (
                      <button
                        onClick={handleGoogleLogout}
                        className="px-4 py-2 rounded-xl bg-red-950/40 hover:bg-red-900 border border-red-800/40 text-red-300 text-xs font-bold flex items-center gap-2"
                      >
                        <LogOut className="w-3.5 h-3.5" />
                        <span>{isAr ? 'تسجيل الخروج من Drive' : 'Disconnect'}</span>
                      </button>
                    ) : (
                      <button
                        onClick={handleGoogleLogin}
                        className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-sky-600 to-blue-600 text-white font-bold text-xs shadow flex items-center gap-2"
                      >
                        <CloudUpload className="w-4 h-4" />
                        <span>{isAr ? 'ربط حساب Google Drive' : 'Connect Google Drive'}</span>
                      </button>
                    )}
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-[#12141d] border border-[#2b271d] space-y-3">
                  <div className="flex items-center gap-2 text-white font-bold text-sm font-['Amiri',serif]">
                    <Save className="w-4 h-4 text-[#d4af37]" />
                    <span>{isAr ? 'تصدير وحفظ نسخة المنيو والأسعار' : 'Export & Sync Menu Backup'}</span>
                  </div>
                  <p className="text-xs text-[#8c8577]">
                    {isAr ? `عدد الأطباق الجاهزة للحفظ: ${items.length} طبق` : `Total meals to backup: ${items.length}`}
                  </p>
                  <button
                    onClick={handleSyncToDrive}
                    disabled={!user || isDriveSyncing}
                    className={`w-full py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all ${
                      user && !isDriveSyncing
                        ? 'bg-[#d4af37] hover:bg-[#c39f2c] text-[#0c0d10]'
                        : 'bg-[#1e202c] text-[#555] cursor-not-allowed'
                    }`}
                  >
                    {isDriveSyncing ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        <span>Syncing...</span>
                      </>
                    ) : (
                      <>
                        <CloudUpload className="w-3.5 h-3.5" />
                        <span>{isAr ? 'تصدير وحفظ المنيو إلى Drive' : 'Sync Menu to Drive'}</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}

        </div>
      </div>

      {/* Explicit Confirmation Dialog (Mandatory for destructive actions & drive mutates) */}
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
