import { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { Language, translations, TranslationKey } from '@/lib/translations';

interface LanguageContextType {
  lang: Language;
  toggleLanguage: () => void;
  t: (key: TranslationKey) => string;
  dir: 'rtl' | 'ltr';
}

const LanguageContext = createContext<LanguageContextType | null>(null);

export const LanguageProvider = ({ children }: { children: ReactNode }) => {
  const [lang, setLang] = useState<Language>(() => {
    return (localStorage.getItem('app-lang') as Language) || 'he';
  });

  const toggleLanguage = useCallback(() => {
    setLang(prev => {
      const next = prev === 'he' ? 'en' : 'he';
      localStorage.setItem('app-lang', next);
      document.documentElement.lang = next;
      document.documentElement.dir = next === 'he' ? 'rtl' : 'ltr';
      return next;
    });
  }, []);

  const t = useCallback((key: TranslationKey) => {
    return translations[lang][key];
  }, [lang]);

  const dir = lang === 'he' ? 'rtl' : 'ltr';

  return (
    <LanguageContext.Provider value={{ lang, toggleLanguage, t, dir }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error('useLanguage must be used within LanguageProvider');
  return ctx;
};
