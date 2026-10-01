import React from 'react';
import { Sparkles, UtensilsCrossed, Star, Phone, ArrowDown } from 'lucide-react';
import { HeroConfig, Language, RestaurantInfo } from '../types';
import { translations } from '../utils/i18n';

interface HeroProps {
  hero: HeroConfig;
  restaurant: RestaurantInfo;
  language: Language;
  onExploreMenu: () => void;
  theme?: 'dark' | 'light';
}

export const Hero: React.FC<HeroProps> = ({
  hero,
  restaurant,
  language,
  onExploreMenu,
  theme = 'dark',
}) => {
  const t = translations[language] ?? translations.ar;
  const isAr = language === 'ar';
  const isLight = theme === 'light';

  return (
    <section className={`relative overflow-hidden pt-8 pb-16 lg:py-20 border-b-2 transition-colors duration-300 ${
      isLight ? 'bg-gradient-to-b from-[#eef4ff] to-[#f4f7fc] border-blue-200' : 'border-[#1e3b96]'
    }`}>
      {/* Background Glows with Happy Kids Zone Brand Colors */}
      <div className="absolute top-1/4 -right-40 w-96 h-96 bg-[#2855D9]/25 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-20 -left-40 w-96 h-96 bg-[#71359B]/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-10 left-1/4 w-80 h-80 bg-[#FFD11A]/15 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-center">
          
          {/* Main Hero Text (Dynamic based on HeroConfig) */}
          <div className="lg:col-span-7 space-y-6 text-center lg:text-start">
            
            {/* Welcome Badge */}
            <div className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full border-2 text-xs sm:text-sm font-black tracking-wide shadow-md ${
              isLight ? 'bg-white border-amber-400 text-amber-800' : 'bg-[#12245e] border-[#FFD11A] text-[#FFD11A]'
            }`}>
              <Sparkles className="w-4 h-4 text-[#FFD11A] animate-pulse" />
              <span>{isAr ? hero.welcomeBadgeAr : hero.welcomeBadgeEn}</span>
            </div>

            {/* Main Title Line 1 + Highlight */}
            {(!isAr || (hero.titleLine1Ar && hero.titleHighlightAr)) && (
              <h1 className={`text-3xl sm:text-5xl lg:text-6xl font-black font-['Noto_Kufi_Arabic'] leading-tight lg:leading-[1.15] ${
                isLight ? 'text-slate-900' : 'text-white'
              }`}>
                {isAr ? hero.titleLine1Ar : hero.titleLine1En} {hero.titleHighlightAr && <br />}
                {hero.titleHighlightAr && (
                  <span className="bg-gradient-to-r from-[#FFD11A] via-[#F7941D] to-[#F2292E] bg-clip-text text-transparent drop-shadow-sm">
                    {isAr ? hero.titleHighlightAr : hero.titleHighlightEn}
                  </span>
                )}
              </h1>
            )}

            {/* Tagline */}
            {Boolean(isAr ? hero.taglineAr : hero.taglineEn) && (
              <p className={`text-base sm:text-lg max-w-2xl mx-auto lg:mx-0 leading-relaxed font-medium ${
                isLight ? 'text-slate-600' : 'text-[#d1dbff]'
              }`}>
                {isAr ? hero.taglineAr : hero.taglineEn}
              </p>
            )}
          </div>

          {/* Right Featured Visual Display */}
          <div className="lg:col-span-5 relative">
            <div className="relative mx-auto max-w-md lg:max-w-none">
              
              {/* Decorative Frame with Rainbow Glow */}
              <div className="absolute -inset-2 bg-gradient-to-r from-[#F2292E] via-[#FFD11A] to-[#2855D9] rounded-3xl blur-xl opacity-40 animate-pulse pointer-events-none" />
              
              <div className={`relative rounded-3xl overflow-hidden border-2 sm:border-3 shadow-2xl transition-all duration-300 hover:border-[#FFD11A] ${
                isLight ? 'border-blue-200 bg-white' : 'border-[#2855D9] bg-gradient-to-b from-[#102256] to-[#0a163e]'
              }`}>
                
                {/* Spotlight Header Bar: Clearly displays 'الوجبة الأكثر بهجة للأطفال' without cluttering the image */}
                <div className={`px-4 sm:px-5 py-3.5 flex items-center justify-between border-b-2 backdrop-blur-md ${
                  isLight ? 'border-blue-100 bg-blue-50/90' : 'border-[#1e3b96] bg-[#0c1a47]/90'
                }`}>
                  <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-gradient-to-r from-[#FFD11A]/20 via-[#F7941D]/20 to-[#F2292E]/20 border-2 border-[#FFD11A] text-[#FFD11A] text-xs sm:text-sm font-black shadow-md">
                    <Sparkles className="w-4 h-4 text-[#FFD11A] shrink-0 animate-pulse" />
                    <span className="font-['Noto_Kufi_Arabic'] tracking-wide text-amber-600 dark:text-[#FFD11A]">
                      {isAr ? hero.featuredTagAr : hero.featuredTagEn}
                    </span>
                  </div>

                  <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[11px] font-bold ${
                    isLight ? 'bg-white border-blue-200 text-blue-700' : 'bg-[#12245e] border-[#2855D9] text-[#FFD11A]'
                  }`}>
                    <Star className="w-3.5 h-3.5 fill-current text-[#FFD11A]" />
                    <span className={isLight ? 'text-slate-700' : 'text-[#d1dbff]'}>{t.chefSpecial}</span>
                  </div>
                </div>

                {/* Clean, Unobstructed Food Image Container */}
                <div className="relative h-64 sm:h-72 overflow-hidden bg-[#07102e] group">
                  <img
                    src={hero.featuredDishImage || 'https://images.unsplash.com/photo-1550547660-d9450f859349?auto=format&fit=crop&w=1000&q=80'}
                    alt={isAr ? hero.featuredDishTitleAr : hero.featuredDishTitleEn}
                    className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-700 ease-out"
                  />
                  {/* Gentle gradient vignette to blend into info section */}
                  <div className={`absolute inset-0 bg-gradient-to-t via-transparent to-transparent opacity-80 pointer-events-none ${
                    isLight ? 'from-white' : 'from-[#0c1a47]'
                  }`} />
                  
                  {/* Floating Price Pill in bottom corner */}
                  <div className={`absolute bottom-3 ${isAr ? 'left-3' : 'right-3'} backdrop-blur-md border-2 border-[#FFD11A] px-3.5 py-1.5 rounded-2xl shadow-xl flex items-center gap-1.5 ${
                    isLight ? 'bg-white/95 text-slate-900' : 'bg-[#0a163e]/95 text-white'
                  }`}>
                    <span className="text-xl sm:text-2xl font-black text-[#FFD11A] font-['Fredoka',sans-serif] leading-none">
                      {Number(hero.featuredDishPrice || 0).toLocaleString()}
                    </span>
                    <span className={`text-xs font-bold ${isLight ? 'text-slate-600' : 'text-[#d1dbff]'}`}>
                      {isAr ? restaurant.currency : restaurant.currencyEn}
                    </span>
                  </div>

                  {/* 'Available Now' Badge */}
                  <div className={`absolute bottom-3 ${isAr ? 'right-3' : 'left-3'} bg-[#78C943] text-[#0a163e] px-3 py-1 rounded-full text-[11px] sm:text-xs font-black shadow-lg flex items-center gap-1.5`}>
                    <span className="w-2 h-2 rounded-full bg-[#0a163e] animate-ping" />
                    <span>{t.availableNow}</span>
                  </div>
                </div>

                {/* Dedicated Dish Information Section with High Contrast and Zero Image Clutter */}
                <div className={`p-4 sm:p-5 space-y-2 border-t ${
                  isLight ? 'bg-white border-blue-100' : 'bg-gradient-to-b from-[#0c1a47] to-[#081335] border-[#1e3b96]'
                }`}>
                  <h4 className={`font-black text-lg sm:text-xl font-['Noto_Kufi_Arabic'] leading-snug ${
                    isLight ? 'text-slate-900' : 'text-white'
                  }`}>
                    {isAr ? hero.featuredDishTitleAr : hero.featuredDishTitleEn}
                  </h4>
                  <p className={`text-xs sm:text-sm leading-relaxed line-clamp-2 ${
                    isLight ? 'text-slate-600' : 'text-[#b8cbff]'
                  }`}>
                    {isAr ? hero.featuredDishSubtitleAr : hero.featuredDishSubtitleEn}
                  </p>
                </div>

              </div>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
};
