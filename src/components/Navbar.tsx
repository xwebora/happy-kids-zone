import React, { useState } from 'react';
import { Search, X, Menu as MenuIcon, Languages, Palette, Check, LayoutGrid, StretchHorizontal, GalleryHorizontal } from 'lucide-react';
import { Language, RestaurantInfo, BrandThemeMode, MenuLayoutMode } from '../types';
import { translations } from '../utils/i18n';
import { HappyKidsLogo } from './HappyKidsLogo';

interface NavbarProps {
  restaurant: RestaurantInfo;
  language: Language;
  onLanguageChange: (lang: Language) => void;
  onBackToPortal?: () => void;
  theme?: BrandThemeMode;
  onThemeChange?: (theme: BrandThemeMode) => void;
  onSearchChange: (query: string) => void;
  searchQuery: string;
  layoutMode?: MenuLayoutMode;
  onLayoutModeChange?: (mode: MenuLayoutMode) => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  restaurant,
  language,
  onLanguageChange,
  theme = 'blue',
  onThemeChange,
  onSearchChange,
  searchQuery,
  layoutMode = 'grid',
  onLayoutModeChange,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showThemeMenu, setShowThemeMenu] = useState(false);
  const t = translations[language];

  const themeOptions: { id: BrandThemeMode; labelAr: string; labelEn: string; colorHex: string; dotClass: string }[] = [
    { id: 'blue', labelAr: 'أزرق كيدز', labelEn: 'Kids Blue', colorHex: '#1d4ed8', dotClass: 'bg-[#2855D9]' },
    { id: 'yellow', labelAr: 'أصفر بهجة', labelEn: 'Joy Yellow', colorHex: '#d97706', dotClass: 'bg-[#FFD11A]' },
  ];

  const currentTheme = themeOptions.find((t) => t.id === theme) || themeOptions[0];

  return (
    <header className="sticky top-0 z-40 transition-colors duration-300 bg-[#0a163e]/95 backdrop-blur-md border-b-2 border-white/10 shadow-lg shadow-black/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          
          {/* Logo & Brand */}
          <div className="flex items-center gap-3">
            <HappyKidsLogo size="md" variant="horizontal" />
            <span className="hidden lg:inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-white/15 bg-white/5 text-[#78C943] text-xs font-bold">
              <span className="w-2 h-2 rounded-full bg-[#78C943] animate-pulse" />
              <span>{language === 'ar' ? 'منيو الأطفال المباشر' : 'Live Kids Menu'}</span>
            </span>
          </div>

          {/* Quick Search */}
          <div className="hidden md:flex items-center flex-1 max-w-sm mx-6">
            <div className="relative w-full">
              <Search className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#FFD11A]" />
              <input
                type="text"
                placeholder={t.searchPlaceholder}
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                className="w-full text-sm px-10 py-2.5 rounded-2xl border-2 border-white/20 bg-black/20 text-white placeholder-white/50 focus:outline-none focus:border-[#FFD11A] shadow-inner transition-colors"
              />
              {searchQuery && (
                <button
                  onClick={() => onSearchChange('')}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8ca2e2] hover:text-white"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* Action Buttons: Layout Switcher + Language + Brand Themes */}
          <div className="flex items-center gap-2 sm:gap-3">
            
            {/* Quick Layout Mode Buttons in Top Navbar */}
            {onLayoutModeChange && (
              <div className="hidden sm:flex items-center gap-1 p-1 rounded-2xl bg-white/10 border-2 border-white/20 shadow-md shrink-0">
                <button
                  onClick={() => onLayoutModeChange('grid')}
                  className={`p-2 rounded-xl text-xs font-black transition-all cursor-pointer ${
                    layoutMode === 'grid'
                      ? 'bg-[#FFD11A] text-[#0a163e] shadow-md font-bold scale-105'
                      : 'text-white/80 hover:text-white hover:bg-white/15'
                  }`}
                  title={t.layoutGrid}
                  aria-label={t.layoutGrid}
                >
                  <LayoutGrid className="w-4 h-4" />
                </button>
                <button
                  onClick={() => onLayoutModeChange('horizontal')}
                  className={`p-2 rounded-xl text-xs font-black transition-all cursor-pointer ${
                    layoutMode === 'horizontal'
                      ? 'bg-[#FFD11A] text-[#0a163e] shadow-md font-bold scale-105'
                      : 'text-white/80 hover:text-white hover:bg-white/15'
                  }`}
                  title={t.layoutHorizontal}
                  aria-label={t.layoutHorizontal}
                >
                  <StretchHorizontal className="w-4 h-4" />
                </button>
                <button
                  onClick={() => onLayoutModeChange('carousel')}
                  className={`p-2 rounded-xl text-xs font-black transition-all cursor-pointer ${
                    layoutMode === 'carousel'
                      ? 'bg-[#FFD11A] text-[#0a163e] shadow-md font-bold scale-105'
                      : 'text-white/80 hover:text-white hover:bg-white/15'
                  }`}
                  title={t.layoutCarousel}
                  aria-label={t.layoutCarousel}
                >
                  <GalleryHorizontal className="w-4 h-4" />
                </button>
              </div>
            )}

            {/* Language Switcher */}
            <button
              onClick={() => onLanguageChange(language === 'ar' ? 'en' : 'ar')}
              className="px-3.5 py-2 rounded-2xl border-2 border-[#2855D9] hover:border-[#FFD11A] bg-[#12245e] hover:bg-[#1a3382] text-[#FFD11A] text-xs font-bold flex items-center justify-center transition-all shadow-md active:scale-95"
              title="تغيير اللغة / Change Language"
            >
              <span>{language === 'ar' ? 'English' : 'عربي'}</span>
            </button>

            {/* Brand Theme Selector Inspired by Restaurant Logo */}
            <div className="relative">
              <button
                onClick={() => setShowThemeMenu(!showThemeMenu)}
                className="p-2 sm:px-3 sm:py-2 rounded-2xl border-2 border-white/20 bg-white/10 hover:bg-white/15 flex items-center gap-1.5 transition-all shadow-md active:scale-95 cursor-pointer text-white"
                title={language === 'ar' ? `لون الثيم (${currentTheme.labelAr})` : `Brand Theme (${currentTheme.labelEn})`}
                aria-label="Select Brand Theme"
              >
                <span className={`w-3.5 h-3.5 rounded-full ${currentTheme.dotClass} ring-2 ring-white/50 shadow-sm`} />
                <Palette className="w-4 h-4 text-white/90" />
              </button>

              {/* Theme Dropdown */}
              {showThemeMenu && (
                <>
                  <div 
                    className="fixed inset-0 z-40" 
                    onClick={() => setShowThemeMenu(false)} 
                  />
                  <div className="absolute end-0 mt-2 w-48 rounded-2xl bg-[#0b1638] border-2 border-white/20 shadow-2xl z-50 p-2 space-y-1 backdrop-blur-xl animate-in fade-in zoom-in-95 duration-150">
                    <div className="text-[10px] font-black uppercase tracking-wider text-white/50 px-2.5 py-1">
                      {language === 'ar' ? 'ألوان ثيم الشعار' : 'Brand Theme Colors'}
                    </div>
                    {themeOptions.map((opt) => {
                      const isActive = theme === opt.id;
                      return (
                        <button
                          key={opt.id}
                          onClick={() => {
                            onThemeChange?.(opt.id);
                            setShowThemeMenu(false);
                          }}
                          className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold transition-all text-start cursor-pointer ${
                            isActive 
                              ? 'bg-white/15 text-white shadow-sm ring-1 ring-white/30' 
                              : 'text-white/80 hover:bg-white/10 hover:text-white'
                          }`}
                        >
                          <div className="flex items-center gap-2.5">
                            <span className={`w-3.5 h-3.5 rounded-full ${opt.dotClass} ring-2 ring-white/40 shadow-sm`} />
                            <span>{language === 'ar' ? opt.labelAr : opt.labelEn}</span>
                          </div>
                          {isActive && <Check className="w-4 h-4 text-emerald-400" />}
                        </button>
                      );
                    })}
                  </div>
                </>
              )}
            </div>

            {/* Mobile Menu Toggle */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2.5 rounded-2xl border-2 border-white/20 bg-white/10 text-white"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <MenuIcon className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Search & Info Drawer */}
        {mobileMenuOpen && (
          <div className="md:hidden py-4 border-t border-white/10 space-y-3 animate-in fade-in duration-200">
            <div className="relative w-full">
              <Search className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#FFD11A]" />
              <input
                type="text"
                placeholder={t.searchPlaceholder}
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                className="w-full text-sm px-10 py-2.5 rounded-2xl border-2 border-white/20 bg-black/20 text-white placeholder-white/50 focus:outline-none focus:border-[#FFD11A]"
              />
            </div>
            
            {/* Mobile Layout Mode Selector */}
            {onLayoutModeChange && (
              <div className="pt-2">
                <div className="text-[11px] font-black text-white/60 mb-2">
                  {language === 'ar' ? 'طريقة عرض الوجبات:' : 'Menu Layout:'}
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    onClick={() => {
                      onLayoutModeChange('grid');
                    }}
                    className={`py-2 px-2 rounded-xl text-xs font-black flex items-center justify-center gap-1.5 border transition-all ${
                      layoutMode === 'grid'
                        ? 'border-[#FFD11A] bg-[#FFD11A] text-[#0a163e] shadow-md font-bold'
                        : 'border-white/15 bg-white/5 text-white/80'
                    }`}
                  >
                    <LayoutGrid className="w-4 h-4" />
                    <span>{language === 'ar' ? 'شبكي' : 'Grid'}</span>
                  </button>
                  <button
                    onClick={() => {
                      onLayoutModeChange('horizontal');
                    }}
                    className={`py-2 px-2 rounded-xl text-xs font-black flex items-center justify-center gap-1.5 border transition-all ${
                      layoutMode === 'horizontal'
                        ? 'border-[#FFD11A] bg-[#FFD11A] text-[#0a163e] shadow-md font-bold'
                        : 'border-white/15 bg-white/5 text-white/80'
                    }`}
                  >
                    <StretchHorizontal className="w-4 h-4" />
                    <span>{language === 'ar' ? 'عريض' : 'List'}</span>
                  </button>
                  <button
                    onClick={() => {
                      onLayoutModeChange('carousel');
                    }}
                    className={`py-2 px-2 rounded-xl text-xs font-black flex items-center justify-center gap-1.5 border transition-all ${
                      layoutMode === 'carousel'
                        ? 'border-[#FFD11A] bg-[#FFD11A] text-[#0a163e] shadow-md font-bold'
                        : 'border-white/15 bg-white/5 text-white/80'
                    }`}
                  >
                    <GalleryHorizontal className="w-4 h-4" />
                    <span>{language === 'ar' ? 'سلايدر' : 'Slider'}</span>
                  </button>
                </div>
              </div>
            )}

            {/* Mobile Brand Theme Selector */}
            <div className="pt-2">
              <div className="text-[11px] font-black text-white/60 mb-2">
                {language === 'ar' ? 'ثيم الخلفية (شعار كيدز زون):' : 'Background Theme:'}
              </div>
              <div className="grid grid-cols-2 gap-2">
                {themeOptions.map((opt) => (
                  <button
                    key={opt.id}
                    onClick={() => {
                      onThemeChange?.(opt.id);
                    }}
                    className={`py-2 px-2 rounded-xl text-xs font-black flex items-center justify-center gap-1.5 border transition-all ${
                      theme === opt.id
                        ? 'border-white bg-white/20 text-white shadow-md'
                        : 'border-white/15 bg-white/5 text-white/70'
                    }`}
                  >
                    <span className={`w-2.5 h-2.5 rounded-full ${opt.dotClass}`} />
                    <span>{language === 'ar' ? opt.labelAr : opt.labelEn}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-between pt-2">
              <button
                onClick={() => onLanguageChange(language === 'ar' ? 'en' : 'ar')}
                className="text-xs font-bold text-[#FFD11A]"
              >
                {language === 'ar' ? 'Switch to English' : 'التحويل للعربية'}
              </button>
            </div>
          </div>
        )}
      </div>
    </header>
  );
};
