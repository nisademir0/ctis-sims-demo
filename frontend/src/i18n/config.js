import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

// Import translation files
import translationTR from './locales/tr.json';
import translationEN from './locales/en.json';

const resources = {
  tr: {
    translation: translationTR
  },
  en: {
    translation: translationEN
  }
};

i18n
  .use(LanguageDetector) // Detect user language
  .use(initReactI18next) // Pass i18n instance to react-i18next
  .init({
    resources,
    fallbackLng: 'tr', // Default language
    lng: localStorage.getItem('language') || 'tr', // Use stored language or default
    
    interpolation: {
      escapeValue: false // React already escapes values
    },
    
    detection: {
      order: ['localStorage', 'navigator'],
      caches: ['localStorage']
    }
  });

export default i18n;
