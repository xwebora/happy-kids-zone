export type Language = 'ar' | 'en' | 'ku';
export type MenuLayoutMode = 'grid' | 'horizontal' | 'carousel';
export type BrandThemeMode = 'blue' | 'yellow';

export interface MenuItem {
  id: string;
  name: string;
  nameEn: string;
  nameKu?: string;
  description: string;
  descriptionEn?: string;
  descriptionKu?: string;
  price: number;
  originalPrice?: number;
  category: string;
  image: string;
  driveFileId?: string;
  isPopular?: boolean;
  isChefSpecial?: boolean;
  calories?: number;
  preparationTime?: string;
  preparationTimeEn?: string;
  preparationTimeKu?: string;
  available: boolean;
  sortOrder?: number;
}

export interface Category {
  id: string;
  name: string;
  nameEn: string;
  nameKu?: string;
  icon?: string;
  sortOrder?: number;
}

export interface HeroConfig {
  welcomeBadgeAr: string;
  welcomeBadgeEn: string;
  welcomeBadgeKu?: string;
  titleLine1Ar: string;
  titleLine1En: string;
  titleLine1Ku?: string;
  titleHighlightAr: string;
  titleHighlightEn: string;
  titleHighlightKu?: string;
  taglineAr: string;
  taglineEn: string;
  taglineKu?: string;
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
  featuredTagKu?: string;
  featuredDishTitleAr: string;
  featuredDishTitleEn: string;
  featuredDishTitleKu?: string;
  featuredDishSubtitleAr: string;
  featuredDishSubtitleEn: string;
  featuredDishSubtitleKu?: string;
  featuredDishPrice: number;
  featuredDishImage: string;
}

export interface RestaurantInfo {
  name: string;
  nameEn: string;
  nameKu?: string;
  tagline: string;
  taglineEn: string;
  taglineKu?: string;
  phone: string;
  whatsapp: string;
  address: string;
  addressEn: string;
  addressKu?: string;
  workingHours: string;
  workingHoursEn: string;
  workingHoursKu?: string;
  currency: string;
  currencyEn: string;
  currencyKu?: string;
  driveFolderName?: string;
  adminUsername?: string;
  adminPassword?: string;
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
