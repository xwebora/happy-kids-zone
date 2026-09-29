import React, { useState, useEffect, useMemo, useRef } from 'react';
import { motion, AnimatePresence, type Variants } from 'motion/react';
import { PortalGate } from './components/PortalGate';
import { Navbar } from './components/Navbar';
import { Hero } from './components/Hero';
import { MenuCard } from './components/MenuCard';
import { AdminModal } from './components/AdminModal';
import { Footer } from './components/Footer';
import { MenuItem, Category, RestaurantInfo, HeroConfig, Language, MenuLayoutMode, BrandThemeMode } from './types';
import { 
  INITIAL_MENU_ITEMS, 
  INITIAL_CATEGORIES, 
  INITIAL_RESTAURANT_INFO, 
  INITIAL_HERO_CONFIG 
} from './data/mockData';
import { initAuth } from './services/auth';
import { translations } from './utils/i18n';
import { User } from 'firebase/auth';
import { 
  Utensils, 
  Flame, 
  Beef, 
  Salad, 
  Cake, 
  Coffee, 
  Sparkles, 
  SlidersHorizontal,
  Smile,
  PartyPopper,
  Star,
  Heart,
  LayoutGrid,
  StretchHorizontal,
  GalleryHorizontal,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';

const STORAGE_KEY_ITEMS = 'happy_kids_items_v4';
const STORAGE_KEY_RESTAURANT = 'happy_kids_restaurant_v4';
const STORAGE_KEY_CATEGORIES = 'happy_kids_categories_v4';
const STORAGE_KEY_HERO = 'happy_kids_hero_v5';
const STORAGE_KEY_LANG = 'happy_kids_lang_v4';
const STORAGE_KEY_LAYOUT = 'happy_kids_layout_v4';
const STORAGE_KEY_THEME = 'happy_kids_theme_v1';

// Grid stagger container variants for playful category transition
const gridContainerVariants: Variants = {
  hidden: { 
    opacity: 0,
    y: 20
  },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.25,
      staggerChildren: 0.055,
      delayChildren: 0.03,
    },
  },
  exit: {
    opacity: 0,
    y: -15,
    scale: 0.98,
    transition: {
      duration: 0.18,
      ease: 'easeIn' as const,
    },
  },
};

export default function App() {
  // Helper to determine view mode from current URL (enables dedicated standalone pages)
  const getViewFromUrl = (): 'portal' | 'customer' | 'admin' => {
    if (typeof window === 'undefined') return 'portal';
    const hash = window.location.hash.toLowerCase();
    const search = new URLSearchParams(window.location.search);
    const viewParam = search.get('view')?.toLowerCase() || search.get('page')?.toLowerCase();

    if (hash.includes('menu') || viewParam === 'menu') {
      return 'customer';
    }
    if (hash.includes('admin') || viewParam === 'admin') {
      return 'admin';
    }
    if (hash.includes('portal') || viewParam === 'portal') {
      return 'portal';
    }
    return 'portal';
  };

  // Current view mode: 'portal' (initial selection gate), 'customer' (dedicated kids menu page), or 'admin'
  const [viewMode, setViewMode] = useState<'portal' | 'customer' | 'admin'>(() => getViewFromUrl());

  const navigateToView = (mode: 'portal' | 'customer' | 'admin') => {
    setViewMode(mode);
    if (typeof window !== 'undefined') {
      if (mode === 'customer') {
        window.location.hash = '/menu';
      } else if (mode === 'admin') {
        window.location.hash = '/admin';
      } else {
        window.location.hash = '/portal';
      }
    }
  };

  // Synchronize viewMode whenever user navigates or opens direct link
  useEffect(() => {
    const handleHashChange = () => {
      const mode = getViewFromUrl();
      setViewMode(mode);
    };
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  // Language state
  const [language, setLanguage] = useState<Language>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_LANG);
      return (saved === 'en' || saved === 'ar') ? saved : 'ar';
    } catch {
      return 'ar';
    }
  });

  // Admin authentication state
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(false);
  const [isAdminModalOpen, setIsAdminModalOpen] = useState(false);

  // Items State
  const [items, setItems] = useState<MenuItem[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_ITEMS);
      if (saved) {
        const parsed: MenuItem[] = JSON.parse(saved);
        // If previous prices were in SAR single digits (e.g. 38), migrate smoothly to IQD
        const needsIqdPriceMigration = parsed.some(it => it.price < 500);
        if (needsIqdPriceMigration) {
          return INITIAL_MENU_ITEMS;
        }
        return parsed;
      }
      return INITIAL_MENU_ITEMS;
    } catch {
      return INITIAL_MENU_ITEMS;
    }
  });

  // Categories State (Dynamic: can add, edit, delete)
  const [categories, setCategories] = useState<Category[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_CATEGORIES);
      return saved ? JSON.parse(saved) : INITIAL_CATEGORIES;
    } catch {
      return INITIAL_CATEGORIES;
    }
  });

  // Restaurant Info & Admin Credentials
  const [restaurant, setRestaurant] = useState<RestaurantInfo>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_RESTAURANT);
      if (saved) {
        const parsed = JSON.parse(saved);
        // Ensure currency is set to Iraqi Dinar (د.ع / IQD)
        if (!parsed.currency || parsed.currency === 'ر.س' || parsed.currency === 'SAR' || parsed.currencyEn === 'SAR') {
          return {
            ...INITIAL_RESTAURANT_INFO,
            ...parsed,
            currency: 'د.ع',
            currencyEn: 'IQD',
          };
        }
        return parsed;
      }
      return INITIAL_RESTAURANT_INFO;
    } catch {
      return INITIAL_RESTAURANT_INFO;
    }
  });

  // Hero Section Configuration
  const [heroConfig, setHeroConfig] = useState<HeroConfig>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_HERO);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.featuredDishPrice && parsed.featuredDishPrice < 500) {
          parsed.featuredDishPrice = INITIAL_HERO_CONFIG.featuredDishPrice;
        }
        return {
          ...INITIAL_HERO_CONFIG,
          ...parsed,
        };
      }
      return INITIAL_HERO_CONFIG;
    } catch {
      return INITIAL_HERO_CONFIG;
    }
  });

  // Selected Category & Search Filter
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'default' | 'price-asc' | 'price-desc' | 'popular'>('default');

  // Layout Mode: 'grid' (classic cards) | 'horizontal' (wide cards) | 'carousel' (horizontal scrolling track)
  const [layoutMode, setLayoutMode] = useState<MenuLayoutMode>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_LAYOUT) as MenuLayoutMode;
      return (saved === 'grid' || saved === 'horizontal' || saved === 'carousel') ? saved : 'grid';
    } catch {
      return 'grid';
    }
  });

  // Logo-Inspired Brand Themes: 'blue' | 'yellow'
  const [brandTheme, setBrandTheme] = useState<BrandThemeMode>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_THEME) as BrandThemeMode;
      return (saved === 'blue' || saved === 'yellow') ? saved : 'blue';
    } catch {
      return 'blue';
    }
  });

  const carouselRef = useRef<HTMLDivElement>(null);

  const handleScrollCarousel = (direction: 'prev' | 'next') => {
    if (!carouselRef.current) return;
    const isRTL = language === 'ar';
    const scrollAmount = 340;
    const delta = direction === 'next' 
      ? (isRTL ? -scrollAmount : scrollAmount) 
      : (isRTL ? scrollAmount : -scrollAmount);
    carouselRef.current.scrollBy({ left: delta, behavior: 'smooth' });
  };

  // Google Drive user for Cloud sync
  const [user, setUser] = useState<User | null>(null);

  const menuSectionRef = useRef<HTMLDivElement>(null);
  const t = translations[language];

  // Sync to localStorage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_ITEMS, JSON.stringify(items));
  }, [items]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_LAYOUT, layoutMode);
  }, [layoutMode]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_THEME, brandTheme);
  }, [brandTheme]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_CATEGORIES, JSON.stringify(categories));
  }, [categories]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_RESTAURANT, JSON.stringify(restaurant));
  }, [restaurant]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_HERO, JSON.stringify(heroConfig));
  }, [heroConfig]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_LANG, language);
    document.documentElement.lang = language;
    document.documentElement.dir = language === 'ar' ? 'rtl' : 'ltr';
  }, [language]);

  // Init Google Auth listener
  useEffect(() => {
    const unsubscribe = initAuth(
      (currentUser) => setUser(currentUser),
      () => setUser(null)
    );
    return () => {
      if (typeof unsubscribe === 'function') unsubscribe();
    };
  }, []);

  const scrollToMenu = () => {
    menuSectionRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Filtered & Sorted Items
  const filteredItems = useMemo(() => {
    return items
      .filter((item) => {
        const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory;
        const matchesSearch =
          !searchQuery.trim() ||
          item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (item.nameEn && item.nameEn.toLowerCase().includes(searchQuery.toLowerCase())) ||
          item.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (item.descriptionEn && item.descriptionEn.toLowerCase().includes(searchQuery.toLowerCase()));
        return matchesCategory && matchesSearch;
      })
      .sort((a, b) => {
        if (sortBy === 'price-asc') return a.price - b.price;
        if (sortBy === 'price-desc') return b.price - a.price;
        if (sortBy === 'popular') return (b.isPopular ? 1 : 0) - (a.isPopular ? 1 : 0);
        // Default: Chef Specials first, then popular, then normal
        const aScore = (a.isChefSpecial ? 2 : 0) + (a.isPopular ? 1 : 0);
        const bScore = (b.isChefSpecial ? 2 : 0) + (b.isPopular ? 1 : 0);
        return bScore - aScore;
      });
  }, [items, selectedCategory, searchQuery, sortBy]);

  // Icon renderer
  const renderCategoryIcon = (iconName?: string) => {
    switch (iconName) {
      case 'Flame': return <Flame className="w-4 h-4" />;
      case 'Beef': return <Beef className="w-4 h-4" />;
      case 'Salad': return <Salad className="w-4 h-4" />;
      case 'Cake': return <Cake className="w-4 h-4" />;
      case 'Coffee': return <Coffee className="w-4 h-4" />;
      case 'Smile': return <Smile className="w-4 h-4" />;
      default: return <Utensils className="w-4 h-4" />;
    }
  };

  // Color cycler for category pills inspired by the logo
  const getCategoryColor = (index: number) => {
    const colors = [
      '#F2292E', // Red
      '#F7941D', // Orange
      '#FFD11A', // Yellow
      '#78C943', // Green
      '#71359B', // Purple
      '#2855D9', // Blue
    ];
    return colors[index % colors.length];
  };

  // Active category object
  const currentCategoryObj = useMemo(() => {
    if (selectedCategory === 'all') return null;
    return categories.find((c) => c.id === selectedCategory) || null;
  }, [categories, selectedCategory]);

  const activeCategoryColor = useMemo(() => {
    if (selectedCategory === 'all') return '#FFD11A';
    const idx = categories.findIndex((c) => c.id === selectedCategory);
    return getCategoryColor(idx >= 0 ? idx : 0);
  }, [categories, selectedCategory]);

  // If in Portal Gate mode, show initial 2 options
  if (viewMode === 'portal') {
    return (
      <AnimatePresence mode="wait">
        <motion.div
          key="portal-view"
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.98 }}
          transition={{ duration: 0.3 }}
        >
          <PortalGate
            language={language}
            onLanguageChange={setLanguage}
            restaurant={restaurant}
            hero={heroConfig}
            adminonly={true}
            onSelectCustomerView={() => navigateToView('customer')}
            onAdminLoginSuccess={() => {
              setIsAdminAuthenticated(true);
              navigateToView('admin');
              setIsAdminModalOpen(true);
            }}
          />
        </motion.div>
      </AnimatePresence>
    );
  }

// If in Admin mode, require admin authentication first
if (viewMode === 'admin') {

  // Direct access to #/admin is NOT allowed
  // unless the user has already passed the admin login.
  if (!isAdminAuthenticated) {
    return (
      <AnimatePresence mode="wait">
        <motion.div
          key="admin-login-required"
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.98 }}
          transition={{ duration: 0.3 }}
        >
          <PortalGate
            language={language}
            onLanguageChange={setLanguage}
            restaurant={restaurant}
            hero={heroConfig}
            onSelectCustomerView={() => navigateToView('customer')}
            onAdminLoginSuccess={() => {
              setIsAdminAuthenticated(true);
              navigateToView('admin');
            }}
          />
        </motion.div>
      </AnimatePresence>
    );
  }

  // User is authenticated → show Admin Panel
  return (
    <div className="min-h-screen bg-[#0a163e] text-white flex flex-col font-['Cairo',sans-serif]">
      <AdminModal
        isOpen={true}
        onClose={() => navigateToView('portal')}
        items={items}
        categories={categories}
        hero={heroConfig}
        restaurant={restaurant}
        language={language}
        onUpdateItems={setItems}
        onUpdateCategories={setCategories}
        onUpdateHero={setHeroConfig}
        onUpdateRestaurant={setRestaurant}
        user={user}
        onUserChange={setUser}
        onAdminLogout={() => {
          setIsAdminAuthenticated(false);
          navigateToView('portal');
        }}
      />
    </div>
  );
}

  // Brand Theme background styles: Blue & Yellow
  const themeBackgroundClasses: Record<BrandThemeMode, string> = {
    blue: 'bg-[#0a163e] selection:bg-[#FFD11A] selection:text-[#0a163e]',
    yellow: 'bg-[#3d2c00] selection:bg-[#F2292E] selection:text-white',
  };

  const themeStickyPillClasses: Record<BrandThemeMode, string> = {
    blue: 'bg-[#0a163e]/90 border-[#1e3b96]/60 shadow-[#0a163e]/60',
    yellow: 'bg-[#3d2c00]/90 border-[#b45309]/60 shadow-[#3d2c00]/60',
  };

  // Pure Customer View: Zero admin controls, lively kids motion animations
  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
      className={`min-h-screen text-white flex flex-col font-['Cairo',sans-serif] transition-colors duration-500 ${themeBackgroundClasses[brandTheme]}`}
    >
      {/* Top Navbar for Customers */}
      <Navbar
        restaurant={restaurant}
        language={language}
        onLanguageChange={setLanguage}
        onBackToPortal={() => navigateToView('portal')}
        theme={brandTheme}
        onThemeChange={setBrandTheme}
        onSearchChange={setSearchQuery}
        searchQuery={searchQuery}
        layoutMode={layoutMode}
        onLayoutModeChange={setLayoutMode}
      />

      {/* Main Menu Explorer */}
      <main ref={menuSectionRef} className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full space-y-6">
        {/* Dynamic Category Pills Bar with Brand Color Palette & Fluid Motion Indicator (Sticky on Scroll) */}
        <div className={`sticky top-20 z-30 -mx-4 sm:-mx-6 lg:-mx-8 px-4 sm:px-6 lg:px-8 py-3 backdrop-blur-md border-y shadow-lg transition-all duration-300 ${themeStickyPillClasses[brandTheme]}`}>
          <div className="flex items-center gap-2.5 overflow-x-auto pb-1 pt-1 scrollbar-none px-1">
            {/* "All" button */}
            <motion.button
              onClick={() => setSelectedCategory('all')}
              whileHover={{ scale: 1.07, y: -3 }}
              whileTap={{ scale: 0.93 }}
              transition={{ type: 'spring', stiffness: 450, damping: 20 }}
              className="relative px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-black flex items-center gap-2 whitespace-nowrap cursor-pointer select-none border-2 transition-colors duration-200"
              style={{
                borderColor: selectedCategory === 'all' ? '#FFD11A' : '#2855D9',
                backgroundColor: selectedCategory === 'all' ? '#FFD11A' : '#12245e',
                color: selectedCategory === 'all' ? '#0a163e' : '#ffffff',
              }}
            >
              {selectedCategory === 'all' && (
                <motion.div
                  layoutId="activeCategoryGlow"
                  className="absolute inset-0 rounded-2xl bg-[#FFD11A] shadow-lg shadow-[#FFD11A]/40 -z-10"
                  transition={{ type: 'spring', stiffness: 400, damping: 26 }}
                />
              )}
              <motion.span
                animate={selectedCategory === 'all' ? { rotate: [0, -15, 15, -10, 0] } : {}}
                transition={{ duration: 0.5 }}
              >
                <Utensils className="w-4 h-4" />
              </motion.span>
              <span>{t.allCategories}</span>
              <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold transition-colors ${
                selectedCategory === 'all' ? 'bg-[#0a163e] text-[#FFD11A]' : 'bg-[#1e3b96] text-white'
              }`}>
                {items.length}
              </span>
            </motion.button>

            {/* User Categories with Logo-inspired colors & Springy Motion */}
            {categories.map((cat, idx) => {
              const isSelected = selectedCategory === cat.id;
              const count = items.filter((i) => i.category === cat.id).length;
              const catName = language === 'ar' ? cat.name : (cat.nameEn || cat.name);
              const color = getCategoryColor(idx);

              return (
                <motion.button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  whileHover={{ scale: 1.07, y: -3 }}
                  whileTap={{ scale: 0.93 }}
                  transition={{ type: 'spring', stiffness: 450, damping: 20 }}
                  className="relative px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-black flex items-center gap-2 whitespace-nowrap cursor-pointer select-none border-2 transition-colors duration-200"
                  style={{
                    backgroundColor: isSelected ? color : '#12245e',
                    borderColor: isSelected ? color : '#2855D9',
                    color: isSelected ? '#ffffff' : '#ffffff',
                  }}
                >
                  {isSelected && (
                    <motion.div
                      layoutId="activeCategoryGlow"
                      className="absolute inset-0 rounded-2xl shadow-xl -z-10"
                      style={{ backgroundColor: color, boxShadow: `0 8px 24px ${color}55` }}
                      transition={{ type: 'spring', stiffness: 400, damping: 26 }}
                    />
                  )}
                  <motion.span
                    animate={isSelected ? { rotate: [0, -12, 12, -8, 0], scale: [1, 1.2, 1] } : {}}
                    transition={{ duration: 0.45 }}
                  >
                    {renderCategoryIcon(cat.icon)}
                  </motion.span>
                  <span>{catName}</span>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold transition-colors ${
                    isSelected ? 'bg-black/25 text-white' : 'bg-[#1e3b96] text-[#FFD11A]'
                  }`}>
                    {count}
                  </span>
                </motion.button>
              );
            })}
          </div>
        </div>

        {/* Active Search Filter */}
        {searchQuery && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center justify-between p-3.5 rounded-2xl bg-[#12245e] border-2 border-[#2855D9] text-xs text-[#a4bcf7]"
          >
            <span>{t.searchResultFor} <strong className="text-[#FFD11A]">"{searchQuery}"</strong> ({filteredItems.length})</span>
            <button
              onClick={() => setSearchQuery('')}
              className="text-[#FFD11A] font-bold hover:underline cursor-pointer"
            >
              {t.clearSearch}
            </button>
          </motion.div>
        )}

        {/* Menu Cards Display based on layoutMode (Grid / Horizontal / Carousel) */}
        <AnimatePresence mode="wait">
          {filteredItems.length > 0 ? (
            layoutMode === 'carousel' ? (
              <motion.div
                key={`carousel-wrap-${selectedCategory}-${sortBy}-${searchQuery}`}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.25 }}
                className="space-y-4"
              >
                {/* Carousel Controls bar */}
                <div className="flex items-center justify-between px-2 py-1 bg-[#0d1e52] rounded-2xl border border-[#2855D9]/50">
                  <div className="flex items-center gap-2.5 text-xs font-bold text-[#9ebbf9]">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#78C943] animate-pulse" />
                    <span>
                      {language === 'ar' 
                        ? 'تصفح وجبات الأطفال بالسحب يميناً ويساراً أو عبر الأسهم المرحة' 
                        : 'Swipe or use the cheerful arrows to explore meals'}
                    </span>
                    <span className="text-[10px] bg-[#12245e] border border-[#2855D9] px-2 py-0.5 rounded-full text-[#FFD11A]">
                      {filteredItems.length}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <motion.button
                      onClick={() => handleScrollCarousel('prev')}
                      whileHover={{ scale: 1.12 }}
                      whileTap={{ scale: 0.88 }}
                      className="w-9 h-9 rounded-xl bg-[#12245e] hover:bg-[#FFD11A] text-white hover:text-[#0a163e] border-2 border-[#2855D9] hover:border-[#FFD11A] flex items-center justify-center transition-colors shadow-md cursor-pointer"
                      title={t.prevDish}
                    >
                      {language === 'ar' ? <ChevronRight className="w-5 h-5" /> : <ChevronLeft className="w-5 h-5" />}
                    </motion.button>
                    <motion.button
                      onClick={() => handleScrollCarousel('next')}
                      whileHover={{ scale: 1.12 }}
                      whileTap={{ scale: 0.88 }}
                      className="w-9 h-9 rounded-xl bg-[#12245e] hover:bg-[#FFD11A] text-white hover:text-[#0a163e] border-2 border-[#2855D9] hover:border-[#FFD11A] flex items-center justify-center transition-colors shadow-md cursor-pointer"
                      title={t.nextDish}
                    >
                      {language === 'ar' ? <ChevronLeft className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
                    </motion.button>
                  </div>
                </div>

                {/* Horizontal Sliding Track */}
                <motion.div
                  ref={carouselRef}
                  variants={gridContainerVariants}
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                  className="flex gap-5 overflow-x-auto pb-6 pt-2 scroll-smooth scrollbar-thin scrollbar-thumb-[#2855D9] scrollbar-track-[#0a163e] snap-x snap-mandatory px-1"
                >
                  {filteredItems.map((item, idx) => (
                    <MenuCard
                      key={item.id}
                      item={item}
                      currency={language === 'ar' ? restaurant.currency : restaurant.currencyEn}
                      language={language}
                      index={idx}
                      isAdmin={false}
                      layoutVariant="carousel"
                    />
                  ))}
                </motion.div>
              </motion.div>
            ) : layoutMode === 'horizontal' ? (
              <motion.div 
                key={`horizontal-${selectedCategory}-${sortBy}-${searchQuery}`}
                variants={gridContainerVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
                className="grid grid-cols-1 xl:grid-cols-2 gap-5"
              >
                {filteredItems.map((item, idx) => (
                  <MenuCard
                    key={item.id}
                    item={item}
                    currency={language === 'ar' ? restaurant.currency : restaurant.currencyEn}
                    language={language}
                    index={idx}
                    isAdmin={false}
                    layoutVariant="horizontal"
                  />
                ))}
              </motion.div>
            ) : (
              <motion.div 
                key={`grid-${selectedCategory}-${sortBy}-${searchQuery}`}
                variants={gridContainerVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
                className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
              >
                {filteredItems.map((item, idx) => (
                  <MenuCard
                    key={item.id}
                    item={item}
                    currency={language === 'ar' ? restaurant.currency : restaurant.currencyEn}
                    language={language}
                    index={idx}
                    isAdmin={false}
                    layoutVariant="vertical"
                  />
                ))}
              </motion.div>
            )
          ) : (
            <motion.div 
              key="empty-state"
              initial={{ opacity: 0, scale: 0.88, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ type: 'spring', stiffness: 350, damping: 22 }}
              className="py-20 text-center space-y-4 bg-[#0f2156] rounded-3xl border-2 border-[#2855D9] shadow-xl max-w-xl mx-auto"
            >
              <motion.div
                animate={{ rotate: [-8, 8, -8], scale: [1, 1.1, 1] }}
                transition={{ repeat: Infinity, duration: 2.5, ease: 'easeInOut' }}
                className="w-16 h-16 rounded-full bg-[#FFD11A]/20 border-2 border-[#FFD11A] flex items-center justify-center mx-auto text-[#FFD11A]"
              >
                <Smile className="w-10 h-10" />
              </motion.div>
              <h3 className="text-xl font-black text-white font-['Fredoka','Cairo',sans-serif]">{t.noItemsFound}</h3>
              <p className="text-xs text-[#a4bcf7] max-w-sm mx-auto">
                {language === 'ar' 
                  ? 'لم نعثر على أطباق تطابق بحثك حالياً، جرب اختيار تصنيف آخر أو استعراض كل الوجبات' 
                  : 'No dishes match your query. Try choosing another category or browsing all meals.'}
              </p>
              <button
                onClick={() => { setSelectedCategory('all'); setSearchQuery(''); }}
                className="px-6 py-2.5 rounded-2xl bg-[#FFD11A] text-xs text-[#0a163e] font-black border-2 border-[#FFD11A] shadow-lg shadow-[#FFD11A]/30 hover:bg-[#e6bc17] transition-all cursor-pointer inline-flex items-center gap-2"
              >
                <Sparkles className="w-4 h-4" />
                <span>{t.viewAllDishes}</span>
              </button>
            </motion.div>
          )}
        </AnimatePresence>

      </main>

      {/* Footer */}
      <Footer restaurant={restaurant} language={language} />

    </motion.div>
  );
}
