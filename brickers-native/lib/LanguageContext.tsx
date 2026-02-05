import React, { createContext, useContext, useState, useEffect } from 'react';
import { Platform } from 'react-native';
import { ko, translations, Language } from '../locales';

interface LanguageContextType {
    language: Language;
    setLanguage: (lang: Language) => void;
    t: typeof ko;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

const STORAGE_KEY = 'appLanguage';

// Simple storage abstraction that works in Expo Go without native modules
const storage = {
    _data: {} as Record<string, string>,

    async getItem(key: string): Promise<string | null> {
        // Try web localStorage first
        if (Platform.OS === 'web' && typeof localStorage !== 'undefined') {
            return localStorage.getItem(key);
        }
        // Fall back to in-memory storage (won't persist across app restarts in Expo Go)
        return this._data[key] || null;
    },

    async setItem(key: string, value: string): Promise<void> {
        // Try web localStorage first
        if (Platform.OS === 'web' && typeof localStorage !== 'undefined') {
            localStorage.setItem(key, value);
            return;
        }
        // Fall back to in-memory storage
        this._data[key] = value;
    },
};

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [language, setLanguageState] = useState<Language>('ko');
    const [isInitialized, setIsInitialized] = useState(false);

    useEffect(() => {
        const loadLanguage = async () => {
            try {
                const saved = await storage.getItem(STORAGE_KEY);
                if (saved && (saved === 'ko' || saved === 'en' || saved === 'ja')) {
                    setLanguageState(saved as Language);
                }
            } catch (err) {
                console.warn('[LanguageContext] Failed to load language:', err);
            } finally {
                setIsInitialized(true);
            }
        };
        loadLanguage();
    }, []);

    const setLanguage = async (lang: Language) => {
        setLanguageState(lang);
        try {
            await storage.setItem(STORAGE_KEY, lang);
        } catch (err) {
            console.warn('[LanguageContext] Failed to save language:', err);
        }
    };

    const t = translations[language];

    if (!isInitialized) {
        return null;
    }

    return (
        <LanguageContext.Provider value={{ language, setLanguage, t }}>
            {children}
        </LanguageContext.Provider>
    );
};

export const useLanguage = () => {
    const context = useContext(LanguageContext);
    if (!context) {
        throw new Error('useLanguage must be used within a LanguageProvider');
    }
    return context;
};
