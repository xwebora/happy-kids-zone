import React, { useState } from 'react';
import { motion, AnimatePresence, type Variants } from 'motion/react';
import { Edit3, Trash2, XCircle, Sparkles, Heart, Star } from 'lucide-react';
import { MenuItem, Language } from '../types';
import { translations } from '../utils/i18n';

interface MenuCardProps {
  item: MenuItem;
  currency: string;
  language: Language;
  index?: number;
  isAdmin?: boolean;
  onEdit?: (item: MenuItem) => void;
  onDelete?: (item: MenuItem) => void;
  layoutVariant?: 'vertical' | 'horizontal' | 'carousel';
  theme?: 'dark' | 'light';
}

// Child animation variants for lively kids staggered pop-in
export const cardVariants: Variants = {
  hidden: { 
    opacity: 0, 
    scale: 0.82, 
    y: 35,
    rotate: -1.5,
  },
  visible: (i: number) => ({
    opacity: 1,
    scale: 1,
    y: 0,
    rotate: 0,
    transition: {
      type: 'spring' as const,
      stiffness: 380,
      damping: 22,
      mass: 0.8,
      delay: Math.min(i * 0.045, 0.35),
    },
  }),
  exit: {
    opacity: 0,
    scale: 0.85,
    y: -20,
    transition: {
      duration: 0.2,
      ease: 'easeIn' as const,
    },
  },
};

export const MenuCard: React.FC<MenuCardProps> = ({
  item,
  currency,
  language,
  index = 0,
  isAdmin = false,
  onEdit,
  onDelete,
  layoutVariant = 'vertical',
}) => {
  const [isLiked, setIsLiked] = useState(false);
  const [floatingParticles, setFloatingParticles] = useState<Array<{ id: number; x: number; y: number; color: string }>>([]);
  const t = translations[language] ?? translations.ar;
  const isAr = language === 'ar';
  const isKu = language === 'ku';

  const displayName = isAr ? item.name : isKu ? (item.nameKu || item.nameEn || item.name) : (item.nameEn || item.name);
  const secondaryName = '';
  const displayDesc = isAr
    ? item.description
    : isKu
      ? (item.descriptionKu || item.descriptionEn || item.description)
      : (item.descriptionEn || item.description);
  // Optional discount price must never render as NaN.
  const safePrice = Number.isFinite(Number(item.price)) ? Number(item.price) : 0;
  const safeOriginalPrice = Number.isFinite(Number(item.originalPrice))
    ? Number(item.originalPrice)
    : null;
  const hasDiscountPrice = safeOriginalPrice !== null && safeOriginalPrice > safePrice;

  // Playful tilt angle on hover alternating for cards
  const hoverRotate = index % 2 === 0 ? -1.2 : 1.2;

  // Trigger floating heart burst when liked
  const handleLikeClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    const nextState = !isLiked;
    setIsLiked(nextState);

    if (nextState) {
      const colors = ['#F2292E', '#FFD11A', '#F7941D', '#78C943', '#71359B'];
      const newParticles = Array.from({ length: 5 }).map((_, pIdx) => ({
        id: Date.now() + pIdx,
        x: (Math.random() - 0.5) * 40,
        y: -30 - Math.random() * 40,
        color: colors[pIdx % colors.length],
      }));
      setFloatingParticles(newParticles);
      setTimeout(() => setFloatingParticles([]), 900);
    }
  };

  // Horizontal / Wide landscape card layout
  if (layoutVariant === 'horizontal') {
    return (
      <motion.div
        layout
        custom={index}
        variants={cardVariants}
        initial="hidden"
        animate="visible"
        exit="exit"
        whileHover={{ 
          y: -5,
          transition: { type: 'spring', stiffness: 450, damping: 20 }
        }}
        whileTap={{ scale: 0.99 }}
        className={`group relative rounded-3xl bg-[#0f2156] border-2 transition-all duration-300 flex flex-col md:flex-row overflow-hidden shadow-lg ${
          item.available 
            ? 'border-[#2855D9] hover:border-[#FFD11A] hover:shadow-2xl hover:shadow-[#2855D9]/40' 
            : 'border-red-800/40 opacity-75'
        }`}
      >
        {/* Playful Corner Accent Ribbon for Special */}
        {item.isChefSpecial && (
          <div className="absolute top-0 start-0 z-20 overflow-hidden w-20 h-20 pointer-events-none">
            <div className="absolute transform -rotate-45 bg-[#FFD11A] text-[#0a163e] font-black text-[9px] py-0.5 w-28 text-center -start-7 top-4 shadow-md tracking-wider flex items-center justify-center gap-0.5">
              <Star className="w-2.5 h-2.5 fill-current" />
              <span>TOP</span>
            </div>
          </div>
        )}

        {/* Image on start side */}
        <div className="relative w-full md:w-64 lg:w-72 md:min-w-[230px] aspect-[16/10] md:aspect-auto h-48 md:h-auto overflow-hidden bg-[#0a163e] flex-shrink-0">
          <motion.img
            src={item.image || 'https://images.unsplash.com/photo-1550547660-d9450f859349?auto=format&fit=crop&w=600&q=80'}
            alt={displayName}
            className="w-full h-full object-cover object-center transform transition-transform duration-700 ease-out group-hover:scale-110"
            loading="lazy"
            onError={(e) => {
              (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1550547660-d9450f859349?auto=format&fit=crop&w=600&q=80';
            }}
          />

          <div className="absolute inset-0 bg-gradient-to-t md:bg-gradient-to-r from-[#0f2156] md:from-transparent via-transparent to-black/30 pointer-events-none" />

          {/* Badges top right */}
          <div className="absolute top-3 end-3 flex flex-col gap-1.5 items-end z-10">
            {item.isChefSpecial && (
              <motion.span 
                initial={{ scale: 0, rotate: -20 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: 'spring', stiffness: 500, damping: 18, delay: 0.1 }}
                whileHover={{ scale: 1.15, rotate: 5 }}
                className="px-2.5 py-1 rounded-full text-[11px] font-black bg-[#FFD11A] text-[#0a163e] shadow-md flex items-center gap-1 cursor-default"
              >
                <Sparkles className="w-3.5 h-3.5 text-[#0a163e] animate-spin" style={{ animationDuration: '6s' }} />
                <span>{t.specialBadge}</span>
              </motion.span>
            )}
            {item.isPopular && !item.isChefSpecial && (
              <motion.span 
                initial={{ scale: 0, rotate: -15 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: 'spring', stiffness: 500, damping: 18, delay: 0.1 }}
                whileHover={{ scale: 1.15, rotate: 5 }}
                className="px-2.5 py-1 rounded-full text-[11px] font-black bg-[#F7941D] text-white shadow-md flex items-center gap-1 cursor-default"
              >
                <Flame className="w-3 h-3 animate-pulse text-[#FFD11A]" />
                <span>{t.popularBadge}</span>
              </motion.span>
            )}
            {item.driveFileId && (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#71359B]/90 text-white border border-[#71359B] backdrop-blur-sm">
                Google Drive
              </span>
            )}
          </div>

          {/* Status top left */}
          <div className="absolute top-3 start-3 z-10">
            {!item.available && (
              <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-[#F2292E] text-white border border-red-400 backdrop-blur-sm flex items-center gap-1 shadow">
                <XCircle className="w-3 h-3" />
                <span>{t.notAvailable}</span>
              </span>
            )}
            {item.available && hasDiscountPrice && (
              <motion.span 
                whileHover={{ scale: 1.1, rotate: [-2, 2, -2] }}
                animate={{ scale: [1, 1.05, 1] }}
                transition={{ repeat: Infinity, duration: 2.5 }}
                className="px-2.5 py-0.5 rounded-full text-[11px] font-black bg-[#F2292E] text-white shadow-lg border border-white/20 block"
              >
                {Math.round(((safeOriginalPrice! - safePrice) / safeOriginalPrice!) * 100)}% {t.discount}
              </motion.span>
            )}
          </div>
        </div>

        {/* Horizontal details body */}
        <div className="p-5 md:p-6 flex-1 flex flex-col justify-between">
          <div>
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2">
              <div>
                <h3 className="text-xl font-black text-white font-['Noto_Kufi_Arabic'] group-hover:text-[#FFD11A] transition-colors leading-snug">
                  {displayName}
                </h3>
                
              </div>

            </div>

            <p className="text-xs sm:text-sm text-[#c5d5fc] leading-relaxed line-clamp-3 mt-2">
              {displayDesc}
            </p>
          </div>

          {/* Pricing & Footer Actions */}
          <div className="pt-4 mt-4 border-t border-[#1e3b96] flex items-center justify-between relative">
            <div className="flex items-baseline gap-1.5">
              <motion.span 
                whileHover={{ scale: 1.1 }}
                className="text-2xl sm:text-3xl font-black text-[#FFD11A] font-['Fredoka',sans-serif] inline-block tracking-tight"
              >
                {safePrice.toLocaleString()}
              </motion.span>
              <span className="text-xs sm:text-sm text-[#9ebbf9] font-bold">
                {currency}
              </span>
              {hasDiscountPrice && (
                <span className="text-xs sm:text-sm text-[#7897dc] line-through mx-1.5">
                  {safeOriginalPrice!.toLocaleString()} {currency}
                </span>
              )}
            </div>

            {isAdmin ? (
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => onEdit?.(item)}
                  className="p-2 rounded-xl bg-[#12245e] hover:bg-[#FFD11A] text-white hover:text-[#0a163e] border border-[#2855D9] transition-colors"
                  title={t.editItem}
                >
                  <Edit3 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => onDelete?.(item)}
                  className="p-2 rounded-xl bg-[#F2292E]/30 hover:bg-[#F2292E] text-[#ffc6c7] hover:text-white border border-[#F2292E]/60 transition-colors"
                  title={t.deleteItem}
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="relative">
                <AnimatePresence>
                  {floatingParticles.map((p) => (
                    <motion.div
                      key={p.id}
                      initial={{ opacity: 1, scale: 0.6, x: 0, y: 0 }}
                      animate={{ opacity: 0, scale: 1.4, x: p.x, y: p.y }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.7, ease: 'easeOut' }}
                      className="absolute pointer-events-none -top-1 start-2 z-30"
                    >
                      <Heart className="w-3.5 h-3.5 fill-current" style={{ color: p.color }} />
                    </motion.div>
                  ))}
                </AnimatePresence>

                <motion.button
                  onClick={handleLikeClick}
                  whileHover={{ scale: 1.25, rotate: isLiked ? -10 : 10 }}
                  whileTap={{ scale: 0.75 }}
                  transition={{ type: 'spring', stiffness: 500, damping: 15 }}
                  className={`w-9 h-9 rounded-full border-2 flex items-center justify-center transition-colors shadow-sm cursor-pointer select-none ${
                    isLiked 
                      ? 'bg-[#F2292E] border-[#F2292E] text-white shadow-lg shadow-[#F2292E]/50' 
                      : 'bg-[#12245e] border-[#2855D9] text-[#78C943] hover:border-[#F2292E] hover:text-[#F2292E]'
                  }`}
                  title={isLiked ? 'أعجبني!' : 'إعجاب'}
                >
                  <Heart className={`w-4 h-4 transition-transform ${isLiked ? 'fill-current scale-110' : 'fill-transparent'}`} />
                </motion.button>
              </div>
            )}
          </div>
        </div>
      </motion.div>
    );
  }

  const isCarousel = layoutVariant === 'carousel';

  return (
    <motion.div
      layout
      custom={index}
      variants={cardVariants}
      initial="hidden"
      animate="visible"
      exit="exit"
      whileHover={{ 
        y: -6,
        rotate: hoverRotate,
        transition: { type: 'spring', stiffness: 450, damping: 18 }
      }}
      whileTap={{ scale: 0.98 }}
      className={`group relative rounded-3xl bg-[#0f2156] border-2 transition-all duration-300 flex flex-col overflow-hidden shadow-lg isolate ${
        isCarousel ? 'w-[280px] sm:w-[320px] flex-shrink-0 snap-start' : ''
      } ${
        item.available 
          ? 'border-[#2855D9] hover:border-[#FFD11A] hover:shadow-2xl hover:shadow-[#2855D9]/40' 
          : 'border-red-800/40 opacity-75'
      }`}
    >
      {/* Playful Corner Accent Ribbon for Kids */}
      {item.isChefSpecial && (
        <div className="absolute top-0 start-0 z-20 overflow-hidden w-20 h-20 pointer-events-none">
          <div className="absolute transform -rotate-45 bg-[#FFD11A] text-[#0a163e] font-black text-[9px] py-0.5 w-28 text-center -start-7 top-4 shadow-md tracking-wider flex items-center justify-center gap-0.5">
            <Star className="w-2.5 h-2.5 fill-current" />
            <span>TOP</span>
          </div>
        </div>
      )}

      {/* Image container with bouncy zoom */}
      <div className="relative aspect-[16/10] w-full overflow-hidden bg-[#0a163e]">
        <motion.img
          src={item.image || 'https://images.unsplash.com/photo-1550547660-d9450f859349?auto=format&fit=crop&w=600&q=80'}
          alt={displayName}
          className="w-full h-full object-cover object-center transform transition-transform duration-700 ease-out group-hover:scale-110"
          loading="lazy"
          onError={(e) => {
            (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1550547660-d9450f859349?auto=format&fit=crop&w=600&q=80';
          }}
        />

        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#0f2156] via-transparent to-black/30 pointer-events-none" />

        {/* Badges top right */}
        <div className="absolute top-3 end-3 flex flex-col gap-1.5 items-end z-10">
          {item.isChefSpecial && (
            <motion.span 
              initial={{ scale: 0, rotate: -20 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: 'spring', stiffness: 500, damping: 18, delay: 0.1 }}
              whileHover={{ scale: 1.15, rotate: 5 }}
              className="px-2.5 py-1 rounded-full text-[11px] font-black bg-[#FFD11A] text-[#0a163e] shadow-md flex items-center gap-1 cursor-default"
            >
              <Sparkles className="w-3.5 h-3.5 text-[#0a163e] animate-spin" style={{ animationDuration: '6s' }} />
              <span>{t.specialBadge}</span>
            </motion.span>
          )}
          {item.isPopular && !item.isChefSpecial && (
            <motion.span 
              initial={{ scale: 0, rotate: -15 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: 'spring', stiffness: 500, damping: 18, delay: 0.1 }}
              whileHover={{ scale: 1.15, rotate: 5 }}
              className="px-2.5 py-1 rounded-full text-[11px] font-black bg-[#F7941D] text-white shadow-md flex items-center gap-1 cursor-default"
            >
              <Flame className="w-3 h-3 animate-pulse text-[#FFD11A]" />
              <span>{t.popularBadge}</span>
            </motion.span>
          )}
          {item.driveFileId && (
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#71359B]/90 text-white border border-[#71359B] backdrop-blur-sm">
              Google Drive
            </span>
          )}
        </div>

        {/* Status top left */}
        <div className="absolute top-3 start-3 z-10">
          {!item.available && (
            <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-[#F2292E] text-white border border-red-400 backdrop-blur-sm flex items-center gap-1 shadow">
              <XCircle className="w-3 h-3" />
              <span>{t.notAvailable}</span>
            </span>
          )}
          {item.available && item.originalPrice && item.originalPrice > item.price && (
            <motion.span 
              whileHover={{ scale: 1.1, rotate: [-2, 2, -2] }}
              animate={{ scale: [1, 1.05, 1] }}
              transition={{ repeat: Infinity, duration: 2.5 }}
              className="px-2.5 py-0.5 rounded-full text-[11px] font-black bg-[#F2292E] text-white shadow-lg border border-white/20 block"
            >
              {Math.round(((item.originalPrice - item.price) / item.originalPrice) * 100)}% {t.discount}
            </motion.span>
          )}
        </div>

      </div>

      {/* Content */}
      <div className="p-5 flex-1 flex flex-col justify-between">
        <div>
          <div className="flex items-start justify-between gap-2">
            <h3 className="text-lg font-black text-white font-['Noto_Kufi_Arabic'] group-hover:text-[#FFD11A] transition-colors leading-snug">
              {displayName}
            </h3>
          </div>

          {secondaryName && secondaryName !== displayName && (
            <p className="text-xs text-[#a2baf6] font-sans -mt-0.5 mb-2 line-clamp-1 font-semibold">
              {secondaryName}
            </p>
          )}

          <p className="text-xs text-[#c5d5fc] leading-relaxed line-clamp-2 mt-1">
            {displayDesc}
          </p>
        </div>

        {/* Pricing & Interactive Heart with Burst Animation */}
        <div className="pt-4 mt-3 border-t border-[#1e3b96] flex items-center justify-between relative">
          <div className="flex items-baseline gap-1.5">
            <motion.span 
              whileHover={{ scale: 1.1 }}
              className="text-2xl font-black text-[#FFD11A] font-['Fredoka',sans-serif] inline-block tracking-tight"
            >
              {safePrice.toLocaleString()}
            </motion.span>
            <span className="text-xs text-[#9ebbf9] font-bold">
              {currency}
            </span>
            {item.originalPrice && item.originalPrice > item.price && (
              <span className="text-xs text-[#7897dc] line-through mx-1">
                {safeOriginalPrice!.toLocaleString()} {currency}
              </span>
            )}
          </div>

          {isAdmin ? (
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => onEdit?.(item)}
                className="p-2 rounded-xl bg-[#12245e] hover:bg-[#FFD11A] text-white hover:text-[#0a163e] border border-[#2855D9] transition-colors"
                title={t.editItem}
              >
                <Edit3 className="w-4 h-4" />
              </button>
              <button
                onClick={() => onDelete?.(item)}
                className="p-2 rounded-xl bg-[#F2292E]/30 hover:bg-[#F2292E] text-[#ffc6c7] hover:text-white border border-[#F2292E]/60 transition-colors"
                title={t.deleteItem}
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="relative">
              {/* Floating hearts burst when liked */}
              <AnimatePresence>
                {floatingParticles.map((p) => (
                  <motion.div
                    key={p.id}
                    initial={{ opacity: 1, scale: 0.6, x: 0, y: 0 }}
                    animate={{ opacity: 0, scale: 1.4, x: p.x, y: p.y }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.7, ease: 'easeOut' }}
                    className="absolute pointer-events-none -top-1 start-2 z-30"
                  >
                    <Heart className="w-3.5 h-3.5 fill-current" style={{ color: p.color }} />
                  </motion.div>
                ))}
              </AnimatePresence>

              <motion.button
                onClick={handleLikeClick}
                whileHover={{ scale: 1.25, rotate: isLiked ? -10 : 10 }}
                whileTap={{ scale: 0.75 }}
                transition={{ type: 'spring', stiffness: 500, damping: 15 }}
                className={`w-9 h-9 rounded-full border-2 flex items-center justify-center transition-colors shadow-sm cursor-pointer select-none ${
                  isLiked 
                    ? 'bg-[#F2292E] border-[#F2292E] text-white shadow-lg shadow-[#F2292E]/50' 
                    : 'bg-[#12245e] border-[#2855D9] text-[#78C943] hover:border-[#F2292E] hover:text-[#F2292E]'
                }`}
                title={isLiked ? 'أعجبني!' : 'إعجاب'}
              >
                <Heart className={`w-4 h-4 transition-transform ${isLiked ? 'fill-current scale-110' : 'fill-transparent'}`} />
              </motion.button>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
};
