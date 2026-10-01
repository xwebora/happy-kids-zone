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
import { Utensils, Flame, Beef, Salad, Cake, Coffee, Smile } from 'lucide-react';

const STORAGE_KEY_ITEMS = 'happy_kids_items_v4';
const STORAGE_KEY_RESTAURANT = 'happy_kids_restaurant_v4';
const STORAGE_KEY_CATEGORIES = 'happy_kids_categories_v4';
const STORAGE_KEY_HERO = 'happy_kids_hero_v5';
const STORAGE_KEY_LANG = 'happy_kids_lang_v4';
const STORAGE_KEY_PORTAL_LANG = 'happy_kids_portal_lang_v1';
const STORAGE_KEY_LAYOUT = 'happy_kids_layout_v4';
const STORAGE_KEY_THEME = 'happy_kids_theme_v1';

const gridContainerVariants: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.25, staggerChildren: 0.055, delayChildren: 0.03 } },
  exit: { opacity: 0, y: -15, scale: 0.98, transition: { duration: 0.18, ease: 'easeIn' as const } },
};

type ViewMode = 'portal' | 'customer' | 'admin' | 'welcome';

export default function App() {
  const getRoute = () => {
    if (typeof window === 'undefined') return { view: 'welcome' as ViewMode, language: null as Language | null };

    const hash = decodeURIComponent(window.location.hash || '').toLowerCase();
    const route = hash.replace(/^#/, '').replace(/^\//, '').replace(/\/$/, '').split('?')[0];

    // Primary public menu URLs.
    if (route === 'menu-ar') return { view: 'customer' as ViewMode, language: 'ar' as Language };
    if (route === 'menu-en') return { view: 'customer' as ViewMode, language: 'en' as Language };
    if (route === 'menu-kr' || route === 'menu-ku') return { view: 'customer' as ViewMode, language: 'ku' as Language };

    // Query-string fallback, useful when a link is opened by a client that strips hash fragments.
    const params = new URLSearchParams(window.location.search);
    const queryView = params.get('view')?.toLowerCase();
    const queryLanguage = params.get('lang')?.toLowerCase();
    if (queryView === 'menu') {
      if (queryLanguage === 'en') return { view: 'customer' as ViewMode, language: 'en' as Language };
      if (queryLanguage === 'ku' || queryLanguage === 'kr') return { view: 'customer' as ViewMode, language: 'ku' as Language };
      return { view: 'customer' as ViewMode, language: 'ar' as Language };
    }

    if (route === 'welcome' || route === '') return { view: 'welcome' as ViewMode, language: null };
    if (route === 'portal') return { view: 'portal' as ViewMode, language: null };
    if (route === 'admin') return { view: 'admin' as ViewMode, language: null };
    return { view: 'welcome' as ViewMode, language: null };
  };

  const initialRoute = getRoute();
  const [viewMode, setViewMode] = useState<ViewMode>(initialRoute.view);

  const getPortalLanguage = (): Language => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_PORTAL_LANG);
      return saved === 'en' || saved === 'ar' ? saved : 'ar';
    } catch { return 'ar'; }
  };

  const [portalLanguage, setPortalLanguage] = useState<Language>(() => getPortalLanguage());
  const [language, setLanguage] = useState<Language>(() => {
    if (initialRoute.language) return initialRoute.language;
    try {
      if (initialRoute.view === 'portal' || initialRoute.view === 'admin') return getPortalLanguage();
      const saved = localStorage.getItem(STORAGE_KEY_LANG);
      return saved === 'en' || saved === 'ar' || saved === 'ku' ? saved : 'ar';
    } catch { return 'ar'; }
  });

  const goToMenu = (selectedLanguage: Language) => {
    const menuRoute = selectedLanguage === 'en' ? 'menu-en' : selectedLanguage === 'ku' ? 'menu-kr' : 'menu-ar';

    try {
      localStorage.setItem(STORAGE_KEY_LANG, selectedLanguage);
    } catch {
      // Ignore storage errors.
    }

    // Use a full navigation so the public language links always load the
    // language-specific menu route, even when the current page was loaded
    // from a cached GitHub Pages bundle.
    if (typeof window !== 'undefined') {
      const menuUrl = `${window.location.origin}${window.location.pathname}#/${menuRoute}`;
      window.location.assign(menuUrl);
      return;
    }

    setLanguage(selectedLanguage);
    setViewMode('customer');
  };

  const navigateToView = (view: ViewMode) => {
    if (view === 'customer') return goToMenu(language);
    const hash = view === 'portal' ? '#/portal' : view === 'admin' ? '#/admin' : '#/welcome';
    setViewMode(view);
    if (typeof window !== 'undefined') window.location.hash = hash;
  };

  const handleMenuLanguageChange = (selectedLanguage: Language) => {
    goToMenu(selectedLanguage);
  };

  const handlePortalLanguageChange = (selectedLanguage: Language) => {
    const nextLanguage: Language = selectedLanguage === 'en' ? 'en' : 'ar';
    setPortalLanguage(nextLanguage);
    setLanguage(nextLanguage);
    try {
      localStorage.setItem(STORAGE_KEY_PORTAL_LANG, nextLanguage);
      localStorage.setItem(STORAGE_KEY_LANG, nextLanguage);
    } catch { /* ignore */ }
  };

  useEffect(() => {
    const handleHashChange = () => {
      const route = getRoute();
      setViewMode(route.view);
      if (route.language) setLanguage(route.language);
      if (route.view === 'portal' || route.view === 'admin') setLanguage(getPortalLanguage());
    };
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(false);
  const [isAdminModalOpen, setIsAdminModalOpen] = useState(false);
  const [items, setItems] = useState<MenuItem[]>(() => { try { const saved = localStorage.getItem(STORAGE_KEY_ITEMS); if (saved) { const parsed: MenuItem[] = JSON.parse(saved); if (parsed.some(it => it.price < 500)) return INITIAL_MENU_ITEMS; return parsed; } return INITIAL_MENU_ITEMS; } catch { return INITIAL_MENU_ITEMS; } });
  const [categories, setCategories] = useState<Category[]>(() => { try { const saved = localStorage.getItem(STORAGE_KEY_CATEGORIES); return saved ? JSON.parse(saved) : INITIAL_CATEGORIES; } catch { return INITIAL_CATEGORIES; } });
  const [restaurant, setRestaurant] = useState<RestaurantInfo>(() => { try { const saved = localStorage.getItem(STORAGE_KEY_RESTAURANT); if (saved) { const parsed = JSON.parse(saved); if (!parsed.currency || parsed.currency === 'ر.س' || parsed.currency === 'SAR' || parsed.currencyEn === 'SAR') return { ...INITIAL_RESTAURANT_INFO, ...parsed, currency: 'د.ع', currencyEn: 'IQD' }; return parsed; } return INITIAL_RESTAURANT_INFO; } catch { return INITIAL_RESTAURANT_INFO; } });
  const [heroConfig, setHeroConfig] = useState<HeroConfig>(() => { try { const saved = localStorage.getItem(STORAGE_KEY_HERO); return saved ? { ...INITIAL_HERO_CONFIG, ...JSON.parse(saved) } : INITIAL_HERO_CONFIG; } catch { return INITIAL_HERO_CONFIG; } });
  const [welcomeConfig, setWelcomeConfig] = useState<any>(null);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'default' | 'price-asc' | 'price-desc' | 'popular'>('default');
  const [layoutMode, setLayoutMode] = useState<MenuLayoutMode>(() => { try { const saved = localStorage.getItem(STORAGE_KEY_LAYOUT) as MenuLayoutMode; return saved === 'grid' || saved === 'horizontal' || saved === 'carousel' ? saved : 'grid'; } catch { return 'grid'; } });
  const [brandTheme, setBrandTheme] = useState<BrandThemeMode>(() => { try { const saved = localStorage.getItem(STORAGE_KEY_THEME) as BrandThemeMode; return saved === 'blue' || saved === 'yellow' ? saved : 'blue'; } catch { return 'blue'; } });
  const [user, setUser] = useState<User | null>(null);
  const menuSectionRef = useRef<HTMLDivElement>(null);
  const t = translations[language] ?? translations.ar;

  useEffect(() => {
    (async () => {
      try {
        const [firestoreItems, firestoreCategories, firestoreRestaurant, firestoreHero, firestoreWelcome] = await Promise.all([getMenuItems(), getCategories(), getRestaurantInfo(), getHeroConfig(), getWelcomeConfig()]);
        if (firestoreItems.length) setItems(firestoreItems);
        if (firestoreCategories.length) setCategories(firestoreCategories);
        if (firestoreRestaurant) setRestaurant(firestoreRestaurant);
        if (firestoreHero) setHeroConfig(firestoreHero);
        if (firestoreWelcome) setWelcomeConfig(firestoreWelcome);
      } catch (error) { console.error('❌ Firestore loading failed:', error); }
    })();
  }, []);
  useEffect(() => subscribeToMenuItems(setItems), []);
  useEffect(() => subscribeToCategories(setCategories), []);
  useEffect(() => { localStorage.setItem(STORAGE_KEY_ITEMS, JSON.stringify(items)); }, [items]);
  useEffect(() => { localStorage.setItem(STORAGE_KEY_CATEGORIES, JSON.stringify(categories)); }, [categories]);
  useEffect(() => { localStorage.setItem(STORAGE_KEY_RESTAURANT, JSON.stringify(restaurant)); }, [restaurant]);
  useEffect(() => { localStorage.setItem(STORAGE_KEY_HERO, JSON.stringify(heroConfig)); }, [heroConfig]);
  useEffect(() => { localStorage.setItem(STORAGE_KEY_LAYOUT, layoutMode); }, [layoutMode]);
  useEffect(() => { localStorage.setItem(STORAGE_KEY_THEME, brandTheme); }, [brandTheme]);
  useEffect(() => { localStorage.setItem(STORAGE_KEY_LANG, language); document.documentElement.lang = language; document.documentElement.dir = language === 'ar' || language === 'ku' ? 'rtl' : 'ltr'; }, [language]);
  useEffect(() => { const unsub = initAuth(setUser); return () => unsub(); }, []);

  const scrollToMenu = () => menuSectionRef.current?.scrollIntoView({ behavior: 'smooth' });
  const filteredItems = useMemo(() => items.filter(item => { const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory; const q = searchQuery.toLowerCase(); const matchesSearch = !searchQuery.trim() || String(item.name ?? '').toLowerCase().includes(q) || String(item.nameEn ?? '').toLowerCase().includes(q) || String(item.nameKu ?? '').toLowerCase().includes(q) || String(item.description ?? '').toLowerCase().includes(q) || String(item.descriptionEn ?? '').toLowerCase().includes(q) || String(item.descriptionKu ?? '').toLowerCase().includes(q); return matchesCategory && matchesSearch; }).sort((a,b) => sortBy === 'price-asc' ? a.price-b.price : sortBy === 'price-desc' ? b.price-a.price : sortBy === 'popular' ? (b.isPopular?1:0)-(a.isPopular?1:0) : ((b.isChefSpecial?2:0)+(b.isPopular?1:0))-((a.isChefSpecial?2:0)+(a.isPopular?1:0))), [items, selectedCategory, searchQuery, sortBy]);
  const renderCategoryIcon = (name?: string) => ({ Flame: <Flame className="w-4 h-4" />, Beef: <Beef className="w-4 h-4" />, Salad: <Salad className="w-4 h-4" />, Cake: <Cake className="w-4 h-4" />, Coffee: <Coffee className="w-4 h-4" />, Smile: <Smile className="w-4 h-4" /> } as any)[name || ''] || <Utensils className="w-4 h-4" />;
  const getCategoryColor = (i: number) => ['#F2292E','#F7941D','#FFD11A','#78C943','#71359B','#2855D9'][i % 6];

  if (viewMode === 'welcome') {
    if (!welcomeConfig) return <div className="fixed inset-0 flex items-center justify-center bg-black text-white">Loading...</div>;
    return <WelcomeScreen config={welcomeConfig} onLanguageSelect={goToMenu} />;
  }

  if (viewMode === 'portal') return <AnimatePresence mode="wait"><motion.div key="portal" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}><PortalGate language={portalLanguage} onLanguageChange={handlePortalLanguageChange} restaurant={restaurant} hero={heroConfig} adminonly={true} onSelectCustomerView={() => goToMenu(portalLanguage)} onAdminLoginSuccess={() => { setIsAdminAuthenticated(true); navigateToView('admin'); setIsAdminModalOpen(true); }} /></motion.div></AnimatePresence>;

  if (viewMode === 'admin') {
    if (!isAdminAuthenticated) return <PortalGate language={portalLanguage} onLanguageChange={handlePortalLanguageChange} restaurant={restaurant} hero={heroConfig} adminonly={true} onSelectCustomerView={() => goToMenu(portalLanguage)} onAdminLoginSuccess={() => { setIsAdminAuthenticated(true); navigateToView('admin'); }} />;
    return <div className="min-h-screen bg-[#0a163e] text-white flex flex-col font-['Noto_Kufi_Arabic']"><AdminModal isOpen={true} onClose={() => navigateToView('portal')} items={items} categories={categories} hero={heroConfig} restaurant={restaurant} language={portalLanguage} onUpdateItems={setItems} onUpdateCategories={setCategories} onUpdateHero={setHeroConfig} welcomeConfig={welcomeConfig} onUpdateWelcome={setWelcomeConfig} onUpdateRestaurant={setRestaurant} user={user} onUserChange={setUser} onAdminLogout={() => { setIsAdminAuthenticated(false); navigateToView('portal'); }} /></div>;
  }

  const themeBackgroundClasses = { blue: 'bg-[#0a163e] selection:bg-[#FFD11A] selection:text-[#0a163e]', yellow: 'bg-[#3d2c00] selection:bg-[#F2292E] selection:text-white' } as const;
  const themeStickyPillClasses = { blue: 'bg-[#0a163e]/90 border-[#1e3b96]/60 shadow-[#0a163e]/60', yellow: 'bg-[#3d2c00]/90 border-[#b45309]/60 shadow-[#3d2c00]/60' } as const;
  return <motion.div initial={{opacity:0}} animate={{opacity:1}} className={`min-h-screen text-white flex flex-col font-['Noto_Kufi_Arabic'] transition-colors duration-500 ${themeBackgroundClasses[brandTheme]}`}>
    <Navbar restaurant={restaurant} language={language} onLanguageChange={handleMenuLanguageChange} theme={brandTheme} onThemeChange={setBrandTheme} onSearchChange={setSearchQuery} searchQuery={searchQuery} layoutMode={layoutMode} onLayoutModeChange={setLayoutMode} />
    <main ref={menuSectionRef} className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full space-y-6">
      <div className={`sticky top-20 z-30 -mx-4 sm:-mx-6 lg:-mx-8 px-4 sm:px-6 lg:px-8 py-3 backdrop-blur-md border-y shadow-lg ${themeStickyPillClasses[brandTheme]}`}><div className="flex items-center gap-2.5 overflow-x-auto pb-1 pt-1 scrollbar-none px-1"><motion.button onClick={()=>setSelectedCategory('all')} className="relative px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-black flex items-center gap-2 whitespace-nowrap border-2" style={{borderColor:selectedCategory==='all'?'#FFD11A':'#2855D9',backgroundColor:selectedCategory==='all'?'#FFD11A':'#12245e',color:selectedCategory==='all'?'#0a163e':'#fff'}}><Utensils className="w-4 h-4"/><span>{t.allCategories}</span></motion.button>{categories.map((category,index)=>{const active=selectedCategory===category.id;const color=getCategoryColor(index);const categoryName=language==='ku'?(category.nameKu||category.nameEn||category.name):language==='en'?(category.nameEn||category.name):category.name;return <motion.button key={category.id} onClick={()=>setSelectedCategory(category.id)} className="px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-black flex items-center gap-2 whitespace-nowrap border-2" style={{borderColor:active?color:'#2855D9',backgroundColor:active?color:'#12245e',color:active?'#0a163e':'#fff'}}>{renderCategoryIcon(category.icon)}<span>{categoryName}</span></motion.button>})}</div></div>
      <section className="pt-2"><Hero hero={heroConfig} language={language} restaurant={restaurant} onExploreMenu={scrollToMenu} /></section>
      <section className="space-y-6"><div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4"><div><h1 className="text-2xl sm:text-3xl font-black">{t.menuTitle}</h1><p className="text-white/60 text-sm mt-1">{t.menuSubtitle}</p></div><div className="flex items-center gap-2"><span className="text-xs text-white/50">{t.sortBy}</span><select value={sortBy} onChange={e=>setSortBy(e.target.value as typeof sortBy)} className="bg-[#12245e] border border-white/20 rounded-xl px-3 py-2 text-xs text-white"><option value="default">{t.sortSpecialFirst}</option><option value="popular">{t.sortPopular}</option><option value="price-asc">{t.sortPriceAsc}</option><option value="price-desc">{t.sortPriceDesc}</option></select></div></div>{searchQuery&&<div className="text-sm text-white/70">{t.searchResultFor} <span className="text-[#FFD11A] font-bold">{searchQuery}</span></div>}{filteredItems.length===0?<div className="text-center py-20 text-white/60">{t.noItemsFound}</div>:<motion.div variants={gridContainerVariants} initial="hidden" animate="visible" className={layoutMode==='grid'?'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5':layoutMode==='horizontal'?'flex flex-col gap-4':'flex gap-4 overflow-x-auto snap-x snap-mandatory pb-4'}>{filteredItems.map(item=><MenuCard key={item.id} item={item} language={language} currency={language==='en'?restaurant.currencyEn:restaurant.currency} onEdit={()=>setIsAdminModalOpen(true)} onDelete={()=>{}} />)}</motion.div>}</section>
    </main><Footer restaurant={restaurant} language={language} />
  </motion.div>;
}
