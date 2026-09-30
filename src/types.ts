export type Language = 'ar' | 'en' | 'ku';
export type MenuLayoutMode = 'grid' | 'horizontal' | 'carousel';
export type BrandThemeMode = 'blue' | 'yellow';

export interface MenuItem {
  id: string;
  name: string;
  nameEn: string;
  description: string;
  descriptionEn?: string;
  price: number;
  originalPrice?: number;
  category: string; // references Category.id
  image: string;
  driveFileId?: string;
  isPopular?: boolean;
  isChefSpecial?: boolean;
  calories?: number;
  preparationTime?: string;
  preparationTimeEn?: string;
  available: boolean;
}

export interface Category {
  id: string;
  name: string;
  nameEn: string;
  icon?: string;
}

export interface HeroConfig {
  welcomeBadgeAr: string;
  welcomeBadgeEn: string;
  titleLine1Ar: string;
  titleLine1En: string;
  titleHighlightAr: string;
  titleHighlightEn: string;
  taglineAr: string;
  taglineEn: string;
  badge1Value: string;
  badge1LabelAr: string;
  badge1LabelEn: string;
  badge2Value: string;
  badge2LabelAr: string;
  badge2LabelEn: string;
  badge3Value: string;
  badge3LabelAr: string;
  badge3LabelEn: string;
  featuredTagAr: string;
  featuredTagEn: string;
  featuredDishTitleAr: string;
  featuredDishTitleEn: string;
  featuredDishSubtitleAr: string;
  featuredDishSubtitleEn: string;
  featuredDishPrice: number;
  featuredDishImage: string;
}

export interface RestaurantInfo {
  name: string;
  nameEn: string;
  tagline: string;
  taglineEn: string;
  phone: string;
  whatsapp: string;
  address: string;
  addressEn: string;
  workingHours: string;
  workingHoursEn: string;
  currency: string;
  currencyEn: string;
  driveFolderName?: string;
  adminUsername: string;
  adminPassword: string;
}

export interface WelcomeConfig {
  enabled: boolean;

  backgroundType: 'video' | 'image';

  backgroundUrl: string;

  logoUrl: string;

  welcomeAr: string;
  welcomeKu: string;
  welcomeEn: string;
  welcomeSy: string;

  overlayOpacity: number;

  animation: 'fade' | 'slide' | 'zoom';
}
