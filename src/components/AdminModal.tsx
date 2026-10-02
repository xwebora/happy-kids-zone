import React, { useState, useRef } from 'react';
import { deleteField } from 'firebase/firestore';
import { 
  X, 
  Upload, 
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
import {
  MenuItem,
  Category,
  RestaurantInfo,
  HeroConfig,
  Language,
  WelcomeConfig
} from '../types';
import { uploadMenuImage, deleteMenuImage } from '../services/storage';
import { translations } from '../utils/i18n';
import { User } from 'firebase/auth';
import {
  updateMenuItem,
  deleteMenuItem,
  setMenuItem,
  migrateAllDataToFirestore,
  setRestaurantInfo,
  setCategory,
  deleteCategory
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
    'items' | 'add-item' | 'categories' | 'hero' | 'welcome' | 'settings'
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

  // File Upload State
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Quick Price State
  const [quickPrices, setQuickPrices] = useState<Record<string, number>>({});
  const [savedSuccessId, setSavedSuccessId] = useState<string | null>(null);

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

  // Confirmation Modal
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
  } | null>(null);

  if (!isOpen) return null;

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
    setSelectedFile(null);
    setFilePreview(null);
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
    setSelectedFile(null);
    setFilePreview(null);
  };

  // Save Item (Create or Update)
  const handleSaveItem = async (e: React.FormEvent) => {
    console.log('🟡 handleSaveCategory CALLED');
    e.preventDefault();

    if (!formNameAr || formPrice === '') {
      alert(isAr ? 'يرجى إدخال اسم الوجبة والسعر' : 'Please provide dish name and price');
      return;
    }

    let finalImageUrl = formImageUrl || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=600&q=80';
    let storagePath = editingItem?.storagePath;

    if (selectedFile) {
      setIsUploadingImage(true);
      try {
        const uploadItemId = editingItem?.id || crypto.randomUUID();
        const uploadRes = await uploadMenuImage(selectedFile, uploadItemId, selectedFile.name);
        finalImageUrl = uploadRes.downloadUrl;
        storagePath = uploadRes.storagePath;
      } catch (err: any) {
        console.error('Firebase Storage upload failed:', err);
        alert(isAr ? `فشل رفع الصورة إلى Firebase Storage:\n${err.message || err}` : `Failed to upload image to Firebase Storage:\n${err.message || err}`);
        return;
      } finally {
        setIsUploadingImage(false);
      }
    }

    try {
      if (editingItem) {
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
        };

        if (formPrice !== '') updatedItem.price = Number(formPrice);
        updatedItem.originalPrice = formOrigPrice === '' ? deleteField() : Number(formOrigPrice);
        updatedItem.calories = formCalories === '' ? deleteField() : Number(formCalories);
        updatedItem.preparationTime = formPrepTimeAr.trim() ? formPrepTimeAr.trim() : deleteField();
        updatedItem.preparationTimeEn = formPrepTimeEn.trim() ? formPrepTimeEn.trim() : deleteField();
        updatedItem.preparationTimeKu = formPrepTimeKu.trim() ? formPrepTimeKu.trim() : deleteField();

        if (storagePath) updatedItem.storagePath = storagePath;
        else if (editingItem.storagePath) updatedItem.storagePath = deleteField();

        await updateMenuItem(editingItem.id, updatedItem as Partial<Omit<MenuItem, 'id'>>);

        if (selectedFile && editingItem.storagePath && editingItem.storagePath !== storagePath) {
          try { await deleteMenuImage(editingItem.storagePath); }
          catch (storageDeleteError) { console.warn('Old Firebase Storage image could not be deleted:', storageDeleteError); }
        }

        const updatedList = items.map((it) => it.id === editingItem.id ? { ...it, ...updatedItem } : it);
        onUpdateItems(updatedList);
        setSyncBanner(isAr ? 'تم تحديث الوجبة وحفظها في قاعدة البيانات' : 'Item updated and saved to database');
      } else {
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

        if (formOrigPrice !== '') newItemData.originalPrice = Number(formOrigPrice);
        if (formCalories !== '') newItemData.calories = Number(formCalories);
        if (formPrepTimeAr.trim()) newItemData.preparationTime = formPrepTimeAr.trim();
        if (formPrepTimeEn.trim()) newItemData.preparationTimeEn = formPrepTimeEn.trim();
        if (formPrepTimeKu.trim()) newItemData.preparationTimeKu = formPrepTimeKu.trim();
        if (storagePath) newItemData.storagePath = storagePath;

        const firestoreId = crypto.randomUUID();
        await setMenuItem(firestoreId, newItemData);
        const newItem: MenuItem = { id: firestoreId, ...newItemData };
        onUpdateItems([newItem, ...items]);
        setSyncBanner(isAr ? 'تمت إضافة الوجبة وحفظها في قاعدة البيانات' : 'Item added and saved to database');
      }

      setTimeout(() => setSyncBanner(null), 3000);
      resetItemForm();
      setActiveTab('items');
    } catch (error: any) {
      console.error('❌ Firestore save error:', error);
      alert(isAr ? `حدث خطأ أثناء حفظ الوجبة في قاعدة البيانات:\n${error.message || error}` : `Failed to save item to database:\n${error.message || error}`);
    }
  };

  const handleDeleteItem = (item: MenuItem) => {
    setConfirmDialog({
      isOpen: true,
      title: isAr ? 'حذف الوجبة نهائياً' : 'Delete Dish Permanently',
      message: isAr ? 'هل أنت متأكد من حذف هذه الوجبة؟' : 'Are you sure you want to delete this dish?',
      onConfirm: async () => {
        try {
          await deleteMenuItem(item.id);
          if (item.storagePath) {
            try { await deleteMenuImage(item.storagePath); }
            catch (storageError) { console.warn('Firebase Storage deletion error:', storageError); }
          }
          onUpdateItems(items.filter((i) => i.id !== item.id));
          setConfirmDialog(null);
        } catch (error: any) {
          alert(isAr ? `حدث خطأ أثناء حذف الوجبة:\n${error.message || error}` : `Failed to delete item:\n${error.message || error}`);
        }
      },
    });
  };
