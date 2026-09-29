import React, { createContext, useContext, useState, useEffect } from 'react';
import mobileService from '../services/mobileService';

const VernacularContext = createContext();

export const LANGUAGES = [
  { code: 'en', name: 'English', script: 'Latin', flag: '🇬🇧' },
  { code: 'hi', name: 'हिन्दी', script: 'देवनागरी', flag: '🇮🇳' },
  { code: 'sat', name: 'ᱥᱟᱱᱛᱟᱲᱤ', script: 'ᱚᱞ ᱪᱤᱠᱤ (Ol Chiki)', flag: '🏹' },
  { code: 'hoc', name: 'ᱦᱳ', script: 'Warang Chiti', flag: '🌿' },
  { code: 'unr', name: 'मुण्डारी', script: 'मुण्डारी', flag: '🌲' },
];

export const VernacularProvider = ({ children }) => {
  const [currentLang, setCurrentLang] = useState(() => {
    return localStorage.getItem('st_seva_lang') || 'en';
  });
  const [translations, setTranslations] = useState({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let isMounted = true;
    const loadTranslations = async () => {
      setLoading(true);
      try {
        const data = await mobileService.getTranslations(currentLang);
        if (isMounted && data && data.strings) {
          setTranslations(data.strings);
        }
      } catch (err) {
        console.error('Failed to load vernacular translations', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    loadTranslations();
    localStorage.setItem('st_seva_lang', currentLang);

    return () => {
      isMounted = false;
    };
  }, [currentLang]);

  const switchLanguage = (langCode) => {
    setCurrentLang(langCode);
  };

  const t = (key, fallback = '') => {
    return translations[key] || fallback || key;
  };

  return (
    <VernacularContext.Provider
      value={{
        currentLang,
        switchLanguage,
        t,
        translations,
        languages: LANGUAGES,
        loading
      }}
    >
      {children}
    </VernacularContext.Provider>
  );
};

export const useVernacular = () => {
  const context = useContext(VernacularContext);
  if (!context) {
    throw new Error('useVernacular must be used within a VernacularProvider');
  }
  return context;
};

export default VernacularContext;
