import React, { useEffect, useState } from 'react';
import { Language, WelcomeConfig } from '../types';

interface WelcomeScreenProps {
  config: WelcomeConfig;
  onLanguageSelect: (language: Language) => void;
}

const WelcomeScreen: React.FC<WelcomeScreenProps> = ({
  config,
  onLanguageSelect,
}) => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setVisible(true);
    }, 150);

    return () => clearTimeout(timer);
  }, []);

  const getAnimationClass = () => {
    if (!visible) {
      switch (config.animation) {
        case 'slide':
          return 'opacity-0 translate-y-10';

        case 'zoom':
          return 'opacity-0 scale-75';

        case 'fade':
        default:
          return 'opacity-0';
      }
    }

    switch (config.animation) {
      case 'slide':
        return 'opacity-100 translate-y-0';

      case 'zoom':
        return 'opacity-100 scale-100';

      case 'fade':
      default:
        return 'opacity-100';
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] w-screen h-screen overflow-hidden bg-black">

      {/* BACKGROUND */}
      {config.backgroundType === 'video' && config.backgroundUrl ? (
        <video
          className="absolute inset-0 w-full h-full object-cover"
          src={config.backgroundUrl}
          autoPlay
          muted
          loop
          playsInline
          preload="auto"
        />
      ) : config.backgroundUrl ? (
        <img
          src={config.backgroundUrl}
          alt=""
          className="absolute inset-0 w-full h-full object-cover"
        />
      ) : (
        <div className="absolute inset-0 bg-[#0a163e]" />
      )}

      {/* DARK OVERLAY */}
      <div
        className="absolute inset-0 bg-black"
        style={{
          opacity: Math.max(
            0,
            Math.min(1, config.overlayOpacity ?? 0.45)
          ),
        }}
      />

      {/* GRADIENT */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-black/60" />

      {/* CONTENT */}
      <div
        className={`relative z-10 w-full h-full flex flex-col items-center justify-center px-5 transition-all duration-1000 ease-out ${getAnimationClass()}`}
      >

        {/* LOGO */}
        {config.logoUrl && (
          <div className="mb-8">
            <img
              src={config.logoUrl}
              alt="Restaurant Logo"
              className="max-w-[180px] sm:max-w-[220px] md:max-w-[260px] max-h-[150px] sm:max-h-[180px] md:max-h-[200px] object-contain drop-shadow-[0_8px_25px_rgba(0,0,0,0.6)]"
            />
          </div>
        )}

        {/* WELCOME TEXT */}
        <div className="text-center space-y-3">

          {/* 1. Syriac */}
          {config.welcomeSy && (
            <div
              dir="rtl"
              className="text-2xl sm:text-3xl md:text-4xl font-bold text-white drop-shadow-[0_3px_10px_rgba(0,0,0,0.8)]"
            >
              {config.welcomeSy}
            </div>
          )}

          {/* 2. Kurdish */}
          {config.welcomeKu && (
            <div
              dir="rtl"
              className="text-2xl sm:text-3xl md:text-4xl font-bold text-white drop-shadow-[0_3px_10px_rgba(0,0,0,0.8)]"
            >
              {config.welcomeKu}
            </div>
          )}

          {/* 3. Arabic */}
          {config.welcomeAr && (
            <div
              dir="rtl"
              className="text-3xl sm:text-4xl md:text-5xl font-black text-white drop-shadow-[0_4px_12px_rgba(0,0,0,0.8)]"
            >
              {config.welcomeAr}
            </div>
          )}

          {/* 4. English */}
          {config.welcomeEn && (
            <div
              dir="ltr"
              className="text-xl sm:text-2xl md:text-3xl font-semibold text-white/95 tracking-wide drop-shadow-[0_3px_10px_rgba(0,0,0,0.8)]"
            >
              {config.welcomeEn}
            </div>
          )}

        </div>

        {/* LANGUAGE BUTTONS */}
        <div className="flex flex-wrap justify-center gap-3 mt-10 max-w-[500px]">

          {/* Kurdish */}
          <a
            href="#/menu-kr"
            className="min-w-[105px] px-6 py-3 rounded-2xl bg-white/15 backdrop-blur-md border border-white/40 text-white font-black hover:bg-[#FFD11A] hover:text-[#0a163e] hover:border-[#FFD11A] hover:scale-105 active:scale-95 transition-all duration-300 shadow-lg text-center"
          >
            کوردی
          </a>

          {/* Arabic */}
          <a
            href="#/menu-ar"
            className="min-w-[105px] px-6 py-3 rounded-2xl bg-white/15 backdrop-blur-md border border-white/40 text-white font-black hover:bg-[#FFD11A] hover:text-[#0a163e] hover:border-[#FFD11A] hover:scale-105 active:scale-95 transition-all duration-300 shadow-lg text-center"
          >
            العربية
          </a>

          {/* English */}
          <a
            href="#/menu-en"
            className="min-w-[105px] px-6 py-3 rounded-2xl bg-white/15 backdrop-blur-md border border-white/40 text-white font-black hover:bg-[#FFD11A] hover:text-[#0a163e] hover:border-[#FFD11A] hover:scale-105 active:scale-95 transition-all duration-300 shadow-lg text-center"
          >
            English
          </a>

        </div>

      </div>
    </div>
  );
};

export { WelcomeScreen };
