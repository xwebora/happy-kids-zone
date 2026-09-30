import React from 'react';
import { Phone, MapPin, Clock, MessageSquare, Heart, Smile } from 'lucide-react';
import { RestaurantInfo, Language } from '../types';
import { HappyKidsLogo } from './HappyKidsLogo';

interface FooterProps {
  restaurant: RestaurantInfo;
  language: Language;
}

export const Footer: React.FC<FooterProps> = ({ restaurant, language }) => {
  const isAr = language === 'ar';

  return (
    <footer className="bg-[#07102e] border-t-2 border-[#1e3b96] text-[#b4c8f8] pt-12 pb-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          
          {/* Col 1: About */}
          <div className="space-y-3">
            <HappyKidsLogo size="md" variant="horizontal" />
            <p className="text-xs leading-relaxed text-[#92aef3] pt-2">
              {isAr ? restaurant.tagline : restaurant.taglineEn}
            </p>
            <div className="flex items-center gap-1.5 pt-1">
              <span className="w-3 h-3 rounded-full bg-[#F2292E]" />
              <span className="w-3 h-3 rounded-full bg-[#F7941D]" />
              <span className="w-3 h-3 rounded-full bg-[#FFD11A]" />
              <span className="w-3 h-3 rounded-full bg-[#78C943]" />
              <span className="w-3 h-3 rounded-full bg-[#71359B]" />
              <span className="w-3 h-3 rounded-full bg-[#2855D9]" />
            </div>
          </div>

          {/* Col 2: Info & Hours */}
          <div className="space-y-2.5 text-xs">
            <h4 className="font-black text-white text-sm font-['Fredoka','Cairo',sans-serif] text-[#FFD11A]">
              {isAr ? 'أوقات العمل والموقع' : 'Working Hours & Location'}
            </h4>
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-[#FFD11A] shrink-0" />
              <span>{isAr ? restaurant.workingHours : restaurant.workingHoursEn}</span>
            </div>
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-[#F7941D] shrink-0" />
              <span>{isAr ? restaurant.address : restaurant.addressEn}</span>
            </div>
          </div>

          {/* Col 3: Direct contact */}
          <div className="space-y-3 text-xs">
            <h4 className="font-black text-white text-sm font-['Fredoka','Cairo',sans-serif] text-[#78C943]">
              {isAr ? 'خدمة الضيوف وحجوزات أعياد الميلاد' : 'Guest Inquiries & Birthday Bookings'}
            </h4>
            <div className="flex items-center gap-2">
              <Phone className="w-4 h-4 text-[#78C943] shrink-0" />
              <span dir="ltr">{restaurant.phone}</span>
            </div>
            <div className="flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-[#FFD11A] shrink-0" />
              <span>WhatsApp: {restaurant.whatsapp}</span>
            </div>
          </div>

        </div>

        <div className="pt-6 border-t border-[#12245e] flex flex-col sm:flex-row items-center justify-between text-xs text-[#708ecb] gap-4">
          <div dir={isAr ? 'rtl' : 'ltr'} style={{ unicodeBidi: 'isolate' }}>
            {isAr
              ? `© 2026 هابي كيدز زون. جميع الحقوق محفوظة.`
            : `© 2026 Happy Kids Zone. All Rights Reserved.`}
          </div>
          
          <div className="flex items-center gap-1.5 font-bold text-white">
            <span>{isAr ? 'صُنع بحب لأجمل ابتسامة' : 'Crafted with joy for happiest kids'}</span>
            <Smile className="w-4 h-4 text-[#FFD11A]" />
          </div>
        </div>
      </div>
    </footer>
  );
};
