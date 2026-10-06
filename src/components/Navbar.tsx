import React, { useState } from 'react';
import { Search, X, Menu as MenuIcon, Languages, Check, ChevronDown } from 'lucide-react';
import { Language, RestaurantInfo } from '../types';
import { translations } from '../utils/i18n';
import { HappyKidsLogo } from './HappyKidsLogo';

interface NavbarProps {
  restaurant: RestaurantInfo;
  language: Language;
  onLanguageChange: (lang: Language) => void;
  onBackToPortal?: () => void;
  onSearchChange: (query: string) => void;
  searchQuery: string;
}

export const Navbar: React.FC<NavbarProps> = ({
  restaurant,
  language,
  onLanguageChange,
  onSearchChange,
  searchQuery,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showLanguageMenu, setShowLanguageMenu] = useState(false);
  const t = translations[language] ?? translations.ar;

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
            
            {/* Language Dropdown - menu only */}
            <div className="relative">
              <button
                onClick={() => {
                  setShowLanguageMenu(!showLanguageMenu);
                }}
                className="px-3.5 py-2 rounded-2xl border-2 border-[#2855D9] hover:border-[#FFD11A] bg-[#12245e] hover:bg-[#1a3382] text-[#FFD11A] text-xs font-bold flex items-center gap-1.5 justify-center transition-all shadow-md active:scale-95"
                title="تغيير اللغة / Change Language"
                aria-label="Select language"
                aria-expanded={showLanguageMenu}
              >
                <Languages className="w-4 h-4" />
                <span>{language === 'ar' ? 'العربية' : language === 'en' ? 'English' : 'کوردی'}</span>
                <ChevronDown className={`w-3.5 h-3.5 transition-transform ${showLanguageMenu ? 'rotate-180' : ''}`} />
              </button>

              {showLanguageMenu && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setShowLanguageMenu(false)}
                  />
                  <div className="absolute end-0 mt-2 w-40 rounded-2xl bg-[#0b1638] border-2 border-white/20 shadow-2xl z-50 p-2 space-y-1 backdrop-blur-xl animate-in fade-in zoom-in-95 duration-150">
                    {([
                      { id: 'ar' as Language, label: 'العربية' },
                      { id: 'en' as Language, label: 'English' },
                      { id: 'ku' as Language, label: 'کوردی' },
                    ]).map((opt) => {
                      const isActive = language === opt.id;
                      return (
                        <button
                          key={opt.id}
                          onClick={() => {
                            onLanguageChange(opt.id);
                            setShowLanguageMenu(false);
                          }}
                          className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-bold transition-all text-start cursor-pointer ${
                            isActive
                              ? 'bg-[#FFD11A] text-[#0a163e] shadow-sm'
                              : 'text-white/85 hover:bg-white/10 hover:text-white'
                          }`}
                        >
                          <span>{opt.label}</span>
                          {isActive && <Check className="w-4 h-4" />}
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
            
            <div className="pt-2">
              <div className="text-[11px] font-black text-white/60 mb-2">
                {language === 'ar' ? 'اللغة:' : language === 'en' ? 'Language:' : 'زمان:'}
              </div>
              <div className="grid grid-cols-3 gap-2">
                {([
                  { id: 'ar' as Language, label: 'العربية' },
                  { id: 'en' as Language, label: 'English' },
                  { id: 'ku' as Language, label: 'کوردی' },
                ]).map((opt) => (
                  <button
                    key={opt.id}
                    onClick={() => {
                      onLanguageChange(opt.id);
                      setMobileMenuOpen(false);
                    }}
                    className={`py-2 px-2 rounded-xl text-xs font-black border transition-all ${
                      language === opt.id
                        ? 'border-[#FFD11A] bg-[#FFD11A] text-[#0a163e] shadow-md'
                        : 'border-white/15 bg-white/5 text-white/80 hover:bg-white/10'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </header>
  );
};
