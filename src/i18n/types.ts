export type Language = 'ko' | 'en';

export interface TranslationDictionary {
  [key: string]: string | TranslationDictionary;
}
