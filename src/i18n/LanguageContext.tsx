import React, { createContext, useContext, useState, useEffect } from 'react';
import { Language } from './types';
import { ko } from './locales/ko';
import { en } from './locales/en';

type TranslationKeys = keyof typeof ko;

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  toggleLanguage: () => void;
  t: (key: TranslationKeys, params?: Record<string, string | number>) => string;
}

const translations = { ko, en };

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>(() => {
    try {
      const saved = localStorage.getItem('personnel_craft_lang');
      if (saved === 'ko' || saved === 'en') return saved;
      return navigator.language.toLowerCase().startsWith('ko') ? 'ko' : 'en';
    } catch {
      return 'ko';
    }
  });

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    try {
      localStorage.setItem('personnel_craft_lang', lang);
    } catch {
      // ignore
    }
  };

  const toggleLanguage = () => {
    const next = language === 'ko' ? 'en' : 'ko';
    setLanguage(next);
  };

  const t = (key: TranslationKeys, params?: Record<string, string | number>): string => {
    let text = translations[language][key] || translations.ko[key] || (key as string);
    if (params) {
      Object.entries(params).forEach(([paramKey, val]) => {
        text = text.replace(new RegExp(`\\{${paramKey}\\}`, 'g'), String(val));
      });
    }
    return text;
  };

  useEffect(() => {
    document.documentElement.lang = language;
  }, [language]);

  return (
    <LanguageContext.Provider value={{ language, setLanguage, toggleLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = (): LanguageContextType => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
