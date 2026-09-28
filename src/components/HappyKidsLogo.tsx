import React from 'react';

interface HappyKidsLogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  variant?: 'full' | 'puzzle-only' | 'horizontal';
  className?: string;
}

export const HappyKidsLogo: React.FC<HappyKidsLogoProps> = ({
  size = 'md',
  variant = 'horizontal',
  className = '',
}) => {
  // Dimension mappings
  const dimensions = {
    sm: { icon: 34, font: 'text-xs sm:text-sm', sub: 'text-[9px] sm:text-[10px]' },
    md: { icon: 46, font: 'text-sm sm:text-base md:text-lg', sub: 'text-[10px] sm:text-[11px]' },
    lg: { icon: 68, font: 'text-xl sm:text-2xl', sub: 'text-xs sm:text-sm' },
    xl: { icon: 96, font: 'text-3xl sm:text-4xl', sub: 'text-sm sm:text-base' },
  }[size];

  // Precise SVG recreating the authentic Happy Kids Zone puzzle mark
  const PuzzleMark = (
    <svg
      viewBox="0 0 160 190"
      className="shrink-0 drop-shadow-md select-none"
      style={{ width: dimensions.icon, height: (dimensions.icon * 190) / 160 }}
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Piece 1: H - Red #F2292E (Top Left) */}
      <path
        d="M 12 12 
           C 12 6, 18 0, 24 0 
           L 70 0 
           C 76 0, 80 4, 80 10 
           L 80 28 
           C 80 34, 88 38, 92 34 
           C 96 30, 96 20, 102 20 
           C 108 20, 108 36, 102 44 
           C 96 52, 86 48, 80 50 
           L 80 70 
           C 78 76, 72 80, 66 80 
           L 46 80 
           C 40 80, 36 86, 40 92 
           C 44 98, 54 96, 54 102 
           C 54 108, 38 108, 30 102 
           C 22 96, 26 86, 24 80 
           L 12 80 
           C 5 80, 0 75, 0 68 
           L 0 52 
           C -4 46, -10 46, -10 40 
           C -10 34, -4 34, 0 28 
           L 0 12 
           C 0 6, 6 12, 12 12 Z"
        fill="#F2292E"
      />
      {/* Letter H */}
      <text
        x="38"
        y="58"
        fill="#FFFFFF"
        fontFamily="'Fredoka', 'Cairo', sans-serif"
        fontWeight="800"
        fontSize="52"
        textAnchor="middle"
      >
        H
      </text>

      {/* Piece 2: A - Orange #F7941D (Top Right) */}
      <path
        d="M 80 0 
           L 148 0 
           C 154 0, 160 6, 160 12 
           L 160 68 
           C 160 74, 154 80, 148 80 
           L 128 80 
           C 122 80, 118 86, 122 92 
           C 126 98, 136 96, 136 102 
           C 136 108, 120 108, 112 102 
           C 104 96, 108 86, 106 80 
           L 80 80 
           L 80 50 
           C 86 48, 96 52, 102 44 
           C 108 36, 108 20, 102 20 
           C 96 20, 96 30, 92 34 
           C 88 38, 80 34, 80 28 Z"
        fill="#F7941D"
      />
      {/* Letter A */}
      <text
        x="122"
        y="58"
        fill="#FFFFFF"
        fontFamily="'Fredoka', 'Cairo', sans-serif"
        fontWeight="800"
        fontSize="52"
        textAnchor="middle"
      >
        A
      </text>

      {/* Piece 3: P - Yellow #FFD11A (Middle Left) */}
      <path
        d="M 0 80 
           L 24 80 
           C 26 86, 22 96, 30 102 
           C 38 108, 54 108, 54 102 
           C 54 96, 44 98, 40 92 
           C 36 86, 40 80, 46 80 
           L 80 80 
           L 80 100 
           C 80 106, 88 110, 92 106 
           C 96 102, 96 92, 102 92 
           C 108 92, 108 108, 102 116 
           C 96 124, 86 120, 80 122 
           L 80 150 
           C 74 150, 70 150, 66 150 
           L 46 150 
           C 40 150, 36 156, 40 162 
           C 44 168, 54 166, 54 172 
           C 54 178, 38 178, 30 172 
           C 22 166, 26 156, 24 150 
           L 0 150 
           L 0 128 
           C -8 126, -14 120, -14 114 
           C -14 108, -8 102, 0 100 Z"
        fill="#FFD11A"
      />
      {/* Letter P */}
      <text
        x="38"
        y="132"
        fill="#FFFFFF"
        fontFamily="'Fredoka', 'Cairo', sans-serif"
        fontWeight="800"
        fontSize="52"
        textAnchor="middle"
      >
        P
      </text>

      {/* Piece 4: P - Purple #71359B (Middle Right) */}
      <path
        d="M 80 80 
           L 106 80 
           C 108 86, 104 96, 112 102 
           C 120 108, 136 108, 136 102 
           C 136 96, 126 98, 122 92 
           C 118 86, 122 80, 128 80 
           L 160 80 
           L 160 148 
           C 160 154, 154 160, 148 160 
           L 92 160 
           C 86 160, 80 156, 80 150 
           L 80 122 
           C 86 120, 96 124, 102 116 
           C 108 108, 108 92, 102 92 
           C 96 92, 96 102, 92 106 
           C 88 110, 80 106, 80 100 Z"
        fill="#71359B"
      />
      {/* Letter P */}
      <text
        x="122"
        y="132"
        fill="#FFFFFF"
        fontFamily="'Fredoka', 'Cairo', sans-serif"
        fontWeight="800"
        fontSize="52"
        textAnchor="middle"
      >
        P
      </text>

      {/* Piece 5: Y - Green #78C943 (Bottom Left) */}
      <path
        d="M 0 150 
           L 24 150 
           C 26 156, 22 166, 30 172 
           C 38 178, 54 178, 54 172 
           C 54 166, 44 168, 40 162 
           C 36 156, 40 150, 46 150 
           L 80 150 
           C 80 156, 84 160, 84 166 
           L 84 190 
           C 84 196, 78 200, 72 200 
           L 12 200 
           C 6 200, 0 194, 0 188 Z"
        fill="#78C943"
      />
      {/* Letter Y */}
      <text
        x="38"
        y="192"
        fill="#FFFFFF"
        fontFamily="'Fredoka', 'Cairo', sans-serif"
        fontWeight="800"
        fontSize="48"
        textAnchor="middle"
      >
        Y
      </text>
    </svg>
  );

  if (variant === 'puzzle-only') {
    return <div className={`inline-flex items-center justify-center ${className}`}>{PuzzleMark}</div>;
  }

  return (
    <div className={`inline-flex items-center gap-2.5 sm:gap-3.5 select-none ${className}`}>
      {PuzzleMark}
      <div className="flex flex-col justify-center leading-none">
        <span
          dir="ltr"
          className={`font-['Fredoka',sans-serif] font-black tracking-wide uppercase drop-shadow-sm inline-flex items-center gap-1.5 ${dimensions.font}`}
          style={{ letterSpacing: '0.04em' }}
        >
          <span className="text-[#FFD11A]">KIDS</span>
          <span className="text-white">ZONE</span>
        </span>
        <span 
          dir="rtl"
          className={`${dimensions.sub} font-bold text-[#FFD11A] mt-1 font-['Cairo',sans-serif] tracking-normal`}
        >
          كيدز زون
        </span>
      </div>
    </div>
  );
};
