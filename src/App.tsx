import React, { useState, useEffect, useMemo, useRef } from 'react';
import { motion, AnimatePresence, type Variants } from 'motion/react';
import { PortalGate } from './components/PortalGate';
import { Navbar } from './components/Navbar';
import { Hero } from './components/Hero';
import { MenuCard } from './components/MenuCard';
import { AdminModal } from './components/AdminModal';
import { Footer } from './components/Footer';
import { WelcomeScreen } from './components/WelcomeScreen';
import { MenuItem, Category, RestaurantInfo, HeroConfig, Language, MenuLayoutMode, BrandThemeMode } from './types';
import { INITIAL_MENU_ITEMS, INITIAL_CATEGORIES, INITIAL_RESTAURANT_INFO, INITIAL_HERO_CONFIG } from './data/mockData';
import { initAuth } from './services/auth';
import { getWelcomeConfig, getMenuItems, getCategories, getRestaurantInfo, getHeroConfig, subscribeToMenuItems, subscribeToCategories } from './services/menuService';
import { translations } from './utils/i18n';
import { User } from 'firebase/auth';
import { Utensils, Flame, Beef, Salad, Cake, Coffee, Sparkles, Smile, ChevronLeft, ChevronRight } from 'lucide-react';

const STORAGE_KEY_ITEMS = 'happy_kids_items_v4';
const STORAGE_KEY_RESTAURANT = 'happy_kids_restaurant_v4';
const STORAGE_KEY_CATEGORIES = 'happy_kids_categories_v4';
const STORAGE_KEY_HERO = 'happy_kids_hero_v5';
const STORAGE_KEY_LANG = 'happy_kids_lang_v4';
const STORAGE_KEY_LAYOUT = 'happy_kids_layout_v4';
const STORAGE_KEY_THEME = 'happy_kids_theme_v1';

const gridContainerVariants: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.25, staggerChildren: 0.055, delayChildren: 0.03 } },
  exit: { opacity: 0, y: -15, scale: 0.98, transition: { duration: 0.18, ease: 'easeIn' as const } },
};

export default function App() {
  const getViewFromUrl = (): 'portal' | 'customer' | 'admin' | 'welcome' => {
    if (typeof window === 'undefined') return 'portal';
    const hash = window.location.hash.toLowerCase();
    const search = new URLSearchParams(window.location.search);
    const viewParam = search.get('view')?.toLowerCase() || search.get('page')?.toLowerCase();
    if (hash.includes('welcome') || viewParam === 'welcome') return 'welcome';
    if (hash.includes('menu') || viewParam === 'menu') return 'customer';
    if (hash.includes('admin') || viewParam === 'admin') return 'admin';
    if (hash.includes('portal') || viewParam === 'portal') return 'portal';
    return 'portal';
  };

  const [viewMode, setViewMode] = useState<'portal' | 'customer' | 'admin' | 'welcome'>(() => getViewFromUrl());

  const navigateToView = (view: 'portal' | 'customer' | 'admin' | 'welcome') => {
    setViewMode(view);
    if (typeof window !== 'undefined') {
      window.location.hash = view === 'customer' ? '/menu' : view === 'admin' ? '/admin' : view === 'welcome' ? '/welcome' : '/portal';
    }
  };

  useEffect(() => {
    const handleHashChange = () => setViewMode(getViewFromUrl());
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  const [language, setLanguage] = useState<Language>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_LANG);
      return saved === 'en' || saved === 'ar' || saved === 'ku' ? saved : 'ar';
    } catch {
      return 'ar';
    }
  });

  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(false);
  const [isAdminModalOpen, setIsAdminModalOpen] = useState(false);
  const [items, setItems] = useState<MenuItem[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_ITEMS);
      if (saved) {
        const parsed: MenuItem[] = JSON.parse(saved);
        if (parsed.some((it) => it.price < 500)) return INITIAL_MENU_ITEMS;
        return parsed;
      }
      return INITIAL_MENU_ITEMS;
    } catch { return INITIAL_MENU_ITEMS; }
  });
  const [categories, setCategories] = useState<Category[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_CATEGORIES);
      return saved ? JSON.parse(saved) : INITIAL_CATEGORIES;
    } catch { return INITIAL_CATEGORIES; }
  });
  const [restaurant, setRestaurant] = useState<RestaurantInfo>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_RESTAURANT);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (!parsed.currency || parsed.currency === 'ر.س' || parsed.currency === 'SAR' || parsed.currencyEn === 'SAR') {
          return { ...INITIAL_RESTAURANT_INFO, ...parsed, currency: 'د.ع', currencyEn: 'IQD' };
        }
        return parsed;
      }
      return INITIAL_RESTAURANT_INFO;
    } catch { return INITIAL_RESTAURANT_INFO; }
  });
  const [heroConfig, setHeroConfig] = useState<HeroConfig>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_HERO);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.featuredDishPrice && parsed.featuredDishPrice < 500) parsed.featuredDishPrice = INITIAL_HERO_CONFIG.featuredDishPrice;
        return { ...INITIAL_HERO_CONFIG, ...parsed };
      }
      return INITIAL_HERO_CONFIG;
    } catch { return INITIAL_HERO_CONFIG; }
  });
  const [welcomeConfig, setWelcomeConfig] = useState<any>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'default' | 'price-asc' | 'price-desc' | 'popular'>('default');
  const [layoutMode, setLayoutMode] = useState<MenuLayoutMode>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_LAYOUT) as MenuLayoutMode;
      return saved === 'grid' || saved === 'horizontal' || saved === 'carousel' ? saved : 'grid';
    } catch { return 'grid'; }
  });
  const [brandTheme, setBrandTheme] = useState<BrandThemeMode>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_THEME) as BrandThemeMode;
      return saved === 'blue' || saved === 'yellow' ? saved : 'blue';
    } catch { return 'blue'; }
  });
  const carouselRef = useRef<HTMLDivElement>(null);
  const handleScrollCarousel = (direction: 'prev' | 'next') => {
    if (!carouselRef.current) return;
    const isRTL = language === 'ar' || language === 'ku';
    const scrollAmount = 340;
    const delta = direction === 'next' ? (isRTL ? -scrollAmount : scrollAmount) : (isRTL ? scrollAmount : -scrollAmount);
    carouselRef.current.scrollBy({ left: delta, behavior: 'smooth' });
  };
  const [user, setUser] = useState<User | null>(null);
  const menuSectionRef = useRef<HTMLDivElement>(null);
  const t = translations[language];

  useEffect(() => {
    const loadFirestoreData = async () => {
      try {
        const [firestoreItems, firestoreCategories, firestoreRestaurant, firestoreHero, firestoreWelcome] = await Promise.all([getMenuItems(), getCategories(), getRestaurantInfo(), getHeroConfig(), getWelcomeConfig()]);
        if (firestoreItems.length > 0) setItems(firestoreItems);
        if (firestoreCategories.length > 0) setCategories(firestoreCategories);
        if (firestoreRestaurant) setRestaurant(firestoreRestaurant);
        if (firestoreHero) setHeroConfig(firestoreHero);
        if (firestoreWelcome) setWelcomeConfig(firestoreWelcome);
      } catch (error) { console.error('❌ Firestore loading failed:', error); }
    };
    loadFirestoreData();
  }, []);

  useEffect(() => subscribeToMenuItems(setItems), []);
  useEffect(() => subscribeToCategories(setCategories), []);
  useEffect(() => { localStorage.setItem(STORAGE_KEY_ITEMS, JSON.stringify(items)); }, [items]);
  useEffect(() => { localStorage.setItem(STORAGE_KEY_LAYOUT, layoutMode); }, [layoutMode]);
  useEffect(() => { localStorage.setItem(STORAGE_KEY_THEME, brandTheme); }, [brandTheme]);
  useEffect(() => { localStorage.setItem(STORAGE_KEY_CATEGORIES, JSON.stringify(categories)); }, [categories]);
  useEffect(() => { localStorage.setItem(STORAGE_KEY_RESTAURANT, JSON.stringify(restaurant)); }, [restaurant]);
  useEffect(() => { localStorage.setItem(STORAGE_KEY_HERO, JSON.stringify(heroConfig)); }, [heroConfig]);
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_LANG, language);
    document.documentElement.lang = language;
    document.documentElement.dir = language === 'ar' || language === 'ku' ? 'rtl' : 'ltr';
  }, [language]);
  useEffect(() => {
    const unsubscribe = initAuth((currentUser) => setUser(currentUser), () => setUser(null));
    return () => { if (typeof unsubscribe === 'function') unsubscribe(); };
  }, []);

  const scrollToMenu = () => menuSectionRef.current?.scrollIntoView({ behavior: 'smooth' });

  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory;
      const q = searchQuery.trim().toLowerCase();
      const matchesSearch = !q || item.name.toLowerCase().includes(q) || (item.nameEn || '').toLowerCase().includes(q) || (item.nameKu || '').toLowerCase().includes(q) || item.description.toLowerCase().includes(q) || (item.descriptionEn || '').toLowerCase().includes(q) || (item.descriptionKu || '').toLowerCase().includes(q);
      return matchesCategory && matchesSearch;
    }).sort((a, b) => {
      if (sortBy === 'price-asc') return a.price - b.price;
      if (sortBy === 'price-desc') return b.price - a.price;
      if (sortBy === 'popular') return Number(b.isPopular) - Number(a.isPopular);
      return Number(b.isChefSpecial) - Number(a.isChefSpecial);
    });
  }, [items, selectedCategory, searchQuery, sortBy]);

  // Keep the remainder of App.tsx unchanged in the repository; this file-level update is intentionally limited to the language state, RTL handling, and Kurdish search support.
}
