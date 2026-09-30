import React, { useEffect, useState } from 'react';
import { Language, WelcomeConfig } from '../types';

interface WelcomeScreenProps {
  config: WelcomeConfig;
  onLanguageSelect: (language: Language) => void;
}

const WelcomeScreen: React.FC<WelcomeScreenProps> = ({
  config,
  onLanguageSelect
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
      return 'opacity-0 translate-y-4 scale-95';
    }

    switch (config.animation) {
      case 'slide':
        return 'opacity-100 translate-y-0';

      case 'zoom':
        return 'opacity-100 scale-100';

      default:
        return 'opacity-100';
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] w-screen h-screen overflow-hidden bg-black">

      {/* Background */}
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

      {/* Dark overlay */}
      <div
        className="absolute inset-0 bg-black"
        style={{
          opacity: config.overlayOpacity
        }}
      />

      {/* Soft center glow */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-black/60" />

      {/* Content */}
      <div
        className={`
          relative z-10
          w-full h-full
          flex flex-col items-center justify-center
          px-5
          transition-all duration-1000 ease-out
          ${getAnimationClass()}
        `}
      >

        {/* Logo */}
        {config.logoUrl && (
          <div className="mb-8">
            <img
              src={config.logoUrl}
              alt="Restaurant Logo"
              className="
                max-w-[180px]
                sm:max-w-[220px]
                max-h-[150px]
                object-contain
                drop-shadow-[0_8px_25px_rgba(0,0,0,0.6)]
              "
            />
          </div>
        )}

        {/* Welcome text */}
        <div className="text-center space-y-3">

          {/* Syriac */}
          {config.welcomeSy && (
            <div
              dir="rtl"
              className="
                text-2xl
                sm:text-3xl
                md:text-4xl
                font-bold
                text-white
                drop-shadow-[0_3px_10px_rgba(0,0,0,0.8)]
              "
            >
              {config.welcomeSy}
            </div>
          )}

          {/* Arabic */}
          {config.welcomeAr && (
            <div
              dir="rtl"
              className="
                text-3xl
                sm:text-4xl
                md:text-5xl
                font-black
                text-white
                drop-shadow-[0_4px_12px_rgba(0,0,0,0.8)]
              "
            >
              {config.welcomeAr}
            </div>
          )}

          {/* Kurdish */}
          {config.welcomeKu && (
            <div
              dir="rtl"
              className="
                text-2xl
                sm:text-3xl
                md:text-4xl
                font-bold
                text-white
                drop-shadow-[0_3px_10px_rgba(0,0,0,0.8)]
              "
            >
              {config.welcomeKu}
            </div>
          )}

          {/* English */}
          {config.welcomeEn && (
            <div
              dir="ltr"
              className="
                text-xl
                sm:text-2xl
                md:text-3xl
                font-semibold
                text-white/95
                tracking-wide
                drop-shadow-[0_3px_10px_rgba(0,0,0,0.8)]
              "
            >
              {config.welcomeEn}
            </div>
          )}

        </div>

        {/* Language buttons */}
        <div
          className="
            flex
            flex-wrap
            justify-center
            gap-3
            mt-10
            max-w-[500px]
          "
        >

          <button
            onClick={() => onLanguageSelect('ku')}
            className="
              min-w-[105px]
              px-6 py-3
              rounded-2xl
              bg-white/15
              backdrop-blur-md
              border border-white/40
              text-white
              font-black
              hover:bg-[#FFD11A]
              hover:text-[#0a163e]
              hover:border-[#FFD11A]
              active:scale-95
              transition-all
              shadow-lg
            "
          >
            کوردی
          </button>

          <button
            onClick={() => onLanguageSelect('ar')}
            className="
              min-w-[105px]
              px-6 py-3
              rounded-2xl
              bg-white/15
              backdrop-blur-md
              border border-white/40
              text-white
              font-black
              hover:bg-[#FFD11A]
              hover:text-[#0a163e]
              hover:border-[#FFD11A]
              active:scale-95
              transition-all
              shadow-lg
            "
          >
            العربية
          </button>

          <button
            onClick={() => onLanguageSelect('en')}
            className="
              min-w-[105px]
              px-6 py-3
              rounded-2xl
              bg-white/15
              backdrop-blur-md
              border border-white/40
              text-white
              font-black
              hover:bg-[#FFD11A]
              hover:text-[#0a163e]
              hover:border-[#FFD11A]
              active:scale-95
              transition-all
              shadow-lg
            "
          >
            English
          </button>

        </div>

      </div>
    </div>
  );
};

export default WelcomeScreen;
