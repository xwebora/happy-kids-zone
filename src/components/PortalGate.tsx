import React, { useState } from 'react';
import { 
  UtensilsCrossed, 
  ShieldCheck, 
  Languages, 
  Lock, 
  User, 
  Sparkles, 
  ArrowRight, 
  ArrowLeft,
  KeyRound,
  AlertCircle,
  Smile,
  Heart,
  ExternalLink,
  Eye,
  EyeOff
} from 'lucide-react';
import { Language, RestaurantInfo, HeroConfig } from '../types';
import { loginWithEmail } from '../services/auth';
import { translations } from '../utils/i18n';
import { HappyKidsLogo } from './HappyKidsLogo';

interface PortalGateProps {
  language: Language;
  onLanguageChange: (lang: Language) => void;
  restaurant: RestaurantInfo;
  hero?: HeroConfig;
  onSelectCustomerView: () => void;
  onAdminLoginSuccess: () => void;
  adminOnly?: boolean;
}

export const PortalGate: React.FC<PortalGateProps> = ({
  language,
  onLanguageChange,
  restaurant,
  hero,
  onSelectCustomerView,
  onAdminLoginSuccess,
  adminOnly = false,
}) => {
  const [showLoginModal, setShowLoginModal] = useState(adminOnly);
  const [usernameInput, setUsernameInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const t = translations[language];
  const isRtl = language === 'ar';

  const handleAdminSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    try {
      await loginWithEmail(usernameInput, passwordInput);
      setPasswordInput('');
      setShowLoginModal(false);
      onAdminLoginSuccess();
    } catch (error: any) {
      console.error('Admin login failed:', error);
      setErrorMsg(t.loginError);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a163e] text-white relative overflow-hidden flex flex-col justify-between selection:bg-[#FFD11A] selection:text-[#0a163e]">
      {/* Background Ambience & Lighting with Logo Colors */}
      <div className="absolute top-0 right-1/4 w-[500px] h-[500px] bg-[#2855D9]/30 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-10 left-10 w-[450px] h-[450px] bg-[#71359B]/25 rounded-full blur-[130px] pointer-events-none" />
      <div className="absolute top-1/3 left-1/3 w-[350px] h-[350px] bg-[#F7941D]/15 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute inset-0 bg-[radial-gradient(#2855D9_1.5px,transparent_1.5px)] [background-size:28px_28px] opacity-[0.07] pointer-events-none" />

      {/* Top Header */}
      <header className="relative z-10 max-w-6xl mx-auto w-full px-6 py-6 flex items-center justify-between">
        <HappyKidsLogo size="md" variant="horizontal" />

        {/* Language Switcher Pill */}
        <button
          onClick={() => onLanguageChange(language === 'ar' ? 'en' : 'ar')}
          className="px-4 py-2 rounded-2xl bg-[#122668]/80 hover:bg-[#1c3587] border border-[#2855D9] text-xs font-bold text-white flex items-center gap-2 transition-all shadow-md active:scale-95"
        >
          <Languages className="w-4 h-4 text-[#FFD11A]" />
          <span>{language === 'ar' ? 'English (EN)' : 'العربية (AR)'}</span>
        </button>
      </header>

      {/* Central Portal Cards Area */}
      <main className="relative z-10 max-w-5xl mx-auto px-6 py-8 w-full flex-1 flex flex-col justify-center items-center">
        
        {/* Title & Welcome */}
        <div className="text-center space-y-4 max-w-2xl mb-10">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#132a74] border border-[#FFD11A]/40 text-[#FFD11A] text-xs font-bold shadow-md">
            <Sparkles className="w-4 h-4 text-[#FFD11A] animate-pulse" />
            <span>{t.portalSubtitle}</span>
          </div>

          <h2 className="text-3xl sm:text-5xl font-black text-white font-['Noto_Kufi_Arabic'] leading-tight">
            {t.portalTitle}
          </h2>

          <p className="text-sm sm:text-base text-[#d1dbff] leading-relaxed">
            {language === 'ar' ? restaurant.tagline : restaurant.taglineEn}
          </p>

          {/* Color palette badges inspired by the logo */}
          <div className="flex items-center justify-center gap-2 pt-1">
            <span className="w-3.5 h-3.5 rounded-full bg-[#F2292E] shadow-sm shadow-[#F2292E]/50 animate-bounce" style={{ animationDelay: '0ms' }} />
            <span className="w-3.5 h-3.5 rounded-full bg-[#F7941D] shadow-sm shadow-[#F7941D]/50 animate-bounce" style={{ animationDelay: '100ms' }} />
            <span className="w-3.5 h-3.5 rounded-full bg-[#FFD11A] shadow-sm shadow-[#FFD11A]/50 animate-bounce" style={{ animationDelay: '200ms' }} />
            <span className="w-3.5 h-3.5 rounded-full bg-[#78C943] shadow-sm shadow-[#78C943]/50 animate-bounce" style={{ animationDelay: '300ms' }} />
            <span className="w-3.5 h-3.5 rounded-full bg-[#71359B] shadow-sm shadow-[#71359B]/50 animate-bounce" style={{ animationDelay: '400ms' }} />
            <span className="w-3.5 h-3.5 rounded-full bg-[#2855D9] shadow-sm shadow-[#2855D9]/50 animate-bounce" style={{ animationDelay: '500ms' }} />
          </div>
        </div>

               {/* The Two Main Portals (Customer vs Admin) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full max-w-4xl">
          
          {/* OPTION 1: CUSTOMER VIEW */}
          <div
            onClick={onSelectCustomerView}
            className="group relative cursor-pointer rounded-3xl bg-gradient-to-b from-[#13286b]/90 to-[#0e1d52]/90 border-2 border-[#2855D9] hover:border-[#FFD11A] p-7 sm:p-8 transition-all duration-300 hover:shadow-2xl hover:shadow-[#2855D9]/40 flex flex-col justify-between overflow-hidden transform hover:-translate-y-1"
          >
            <div className="absolute top-0 right-0 w-40 h-40 bg-[#FFD11A]/10 rounded-full blur-2xl group-hover:bg-[#FFD11A]/20 transition-all pointer-events-none" />

            <div className="space-y-5">
              <div className="flex items-center justify-between">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#FFD11A] via-[#F7941D] to-[#F2292E] p-1 shadow-lg shadow-[#F7941D]/30 flex items-center justify-center">
                  <div className="w-full h-full bg-[#0a163e] rounded-[13px] flex items-center justify-center group-hover:bg-transparent transition-colors">
                    <UtensilsCrossed className="w-8 h-8 text-[#FFD11A] group-hover:text-white transition-colors" />
                  </div>
                </div>

                <span className="text-[11px] px-3 py-1 rounded-full bg-[#2855D9]/40 border border-[#2855D9] text-[#ffd11a] font-mono font-bold">
                  #/menu
                </span>
              </div>

              <div>
                <span className="text-xs font-black text-[#FFD11A] uppercase tracking-wider block mb-1">
                  {language === 'ar'
                    ? 'للأطفال والعائلات والضيوف'
                    : 'For Kids & Families'}
                </span>

                <h3 className="text-2xl sm:text-3xl font-bold text-white font-['Noto_Kufi_Arabic'] group-hover:text-[#FFD11A] transition-colors">
                  {t.customerView}
                </h3>

                <p className="text-sm text-[#c5d3fc] mt-2 leading-relaxed">
                  {t.customerViewDesc}
                </p>
              </div>
            </div>

            <div className="pt-6 mt-6 border-t border-[#1e3b96] flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
              <span className="text-sm font-black text-[#FFD11A] flex items-center gap-2">
                <span>{t.exploreMenuBtn}</span>
                {isRtl
                  ? <ArrowLeft className="w-4 h-4" />
                  : <ArrowRight className="w-4 h-4" />}
              </span>

              <a
                href="#/menu"
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="px-3.5 py-1.5 rounded-xl bg-[#12245e] hover:bg-[#1f3a8f] border-2 border-[#2855D9] hover:border-[#FFD11A] text-xs font-black text-[#d1dbff] hover:text-[#FFD11A] flex items-center justify-center gap-1.5 shadow-md transition-all active:scale-95"
              >
                <ExternalLink className="w-3.5 h-3.5 text-[#FFD11A]" />
                <span>
                  {language === 'ar'
                    ? 'فتح بصفحة منفصلة ↗'
                    : 'Open in New Tab ↗'}
                </span>
              </a>
            </div>
          </div>

          {/* OPTION 2: ADMIN CONTROL PANEL */}
          <div
            onClick={() => setShowLoginModal(true)}
            className="group relative cursor-pointer rounded-3xl bg-gradient-to-b from-[#13286b]/90 to-[#0e1d52]/90 border-2 border-[#2855D9] hover:border-[#71359B] p-7 sm:p-8 transition-all duration-300 hover:shadow-2xl hover:shadow-[#71359B]/40 flex flex-col justify-between overflow-hidden transform hover:-translate-y-1"
          >
            <div className="absolute top-0 right-0 w-40 h-40 bg-[#71359B]/20 rounded-full blur-2xl group-hover:bg-[#71359B]/30 transition-all pointer-events-none" />

            <div className="space-y-5">
              <div className="flex items-center justify-between">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#71359B] to-[#2855D9] p-1 shadow-lg shadow-[#71359B]/30 flex items-center justify-center">
                  <div className="w-full h-full bg-[#0a163e] rounded-[13px] flex items-center justify-center group-hover:bg-transparent transition-colors">
                    <ShieldCheck className="w-8 h-8 text-[#a975db] group-hover:text-white transition-colors" />
                  </div>
                </div>

                <span className="text-[11px] px-3 py-1 rounded-full bg-[#71359B]/30 border border-[#71359B] text-purple-200 font-mono font-bold">
                  #/admin
                </span>
              </div>

              <div>
                <span className="text-xs font-black text-[#a975db] uppercase tracking-wider block mb-1">
                  {language === 'ar'
                    ? 'خاص بمدير المطعم'
                    : 'Admin & Staff Portal'}
                </span>

                <h3 className="text-2xl sm:text-3xl font-bold text-white font-['Noto_Kufi_Arabic'] group-hover:text-[#a975db] transition-colors">
                  {t.adminView}
                </h3>

                <p className="text-sm text-[#c5d3fc] mt-2 leading-relaxed">
                  {t.adminViewDesc}
                </p>

                <div className="mt-3 inline-flex items-center gap-2 px-3 py-1 rounded-xl bg-[#71359B]/15 border border-[#71359B]/40 text-purple-300 text-xs font-bold">
                  <Lock className="w-3.5 h-3.5 text-purple-300" />
                  <span>
                    {language === 'ar'
                      ? 'لوحة تحكم معزولة محمية بكلمة مرور'
                      : 'Isolated dashboard protected with password'}
                  </span>
                </div>
              </div>
            </div>

            <div className="pt-6 mt-6 border-t border-[#1e3b96] flex items-center justify-between">
              <span className="text-sm font-bold text-[#a975db] flex items-center gap-2">
                <Lock className="w-4 h-4" />
                <span>{t.enterAdminBtn}</span>
              </span>

              <span className="text-xs px-3 py-1 rounded-full bg-[#71359B]/40 text-purple-200 border border-[#71359B] font-bold">
                {language === 'ar' ? 'محمي بكلمة مرور' : 'Secured'}
              </span>
            </div>
          </div>

        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 max-w-6xl mx-auto w-full px-6 py-4 text-center text-xs text-[#708ed6] border-t border-[#162a6b]">
        Happy Kids Zone • {new Date().getFullYear()}
      </footer>

      {/* ADMIN LOGIN MODAL */}
      {showLoginModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-black/80 backdrop-blur-md"
            onClick={() => setShowLoginModal(false)}
          />

          <div className="relative w-full max-w-md bg-[#0f2156] border-2 border-[#2855D9] rounded-3xl p-6 sm:p-8 shadow-2xl z-10 text-white animate-in zoom-in-95 duration-200">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#FFD11A] to-[#F7941D] flex items-center justify-center text-[#0a163e]">
                <Lock className="w-6 h-6 stroke-[2.5]" />
              </div>
              <div>
                <h3 className="text-xl font-bold font-['Noto_Kufi_Arabic'] text-white">
                  {t.loginTitle}
                </h3>
                <p className="text-xs text-[#9cb5f5]">
                  {language === 'ar' ? 'أدخل البريد الإلكتروني وكلمة المرور' : 'Enter admin email & password'}
                </p>
              </div>
            </div>

            {errorMsg && (
              <div className="mb-4 p-3 rounded-xl bg-[#F2292E]/25 border border-[#F2292E] text-[#ffc7c8] text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-[#F2292E]" />
                <span>{errorMsg}</span>
              </div>
            )}

            <form onSubmit={handleAdminSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[#c5d5fc] mb-1.5">
                  {language === 'ar' ? 'البريد الإلكتروني' : 'Email address'}
                </label>
                <div className="relative">
                  <User className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#7595e8]" />
                  <input
                    type="text"
                    required
                    placeholder={language === 'ar' ? 'البريد الإلكتروني' : 'Email address'}
                    value={usernameInput}
                    onChange={(e) => setUsernameInput(e.target.value)}
                    className="w-full bg-[#0a163e] border border-[#2855D9] rounded-xl pr-10 pl-4 py-2.5 text-sm text-white focus:outline-none focus:border-[#FFD11A]"
                    dir="ltr"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#c5d5fc] mb-1.5">
                  {t.passwordLabel}
                </label>
                <div className="relative">
                  <KeyRound className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#7595e8]" />
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    placeholder="••••••••"
                    value={passwordInput}
                    onChange={(e) => setPasswordInput(e.target.value)}
                    className="w-full bg-[#0a163e] border border-[#2855D9] rounded-xl pr-10 pl-11 py-2.5 text-sm text-white focus:outline-none focus:border-[#FFD11A]"
                    dir="ltr"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((value) => !value)}
                    aria-label={showPassword ? 'إخفاء كلمة المرور' : 'إظهار كلمة المرور'}
                    title={showPassword ? 'إخفاء كلمة المرور' : 'إظهار كلمة المرور'}
                    className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#7595e8] hover:text-[#FFD11A] transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="pt-4 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowLoginModal(false)}
                  className="px-4 py-2.5 rounded-xl bg-[#142661] hover:bg-[#1a317a] text-xs font-bold text-[#b5c7f8]"
                >
                  {t.cancel}
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl bg-[#FFD11A] hover:bg-[#e6bc17] text-[#0a163e] font-black text-xs shadow-lg shadow-[#FFD11A]/20 flex items-center gap-2"
                >
                  <Lock className="w-3.5 h-3.5" />
                  <span>{t.loginAction}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
