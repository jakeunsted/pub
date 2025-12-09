import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { Platform, useColorScheme as useRNColorScheme } from 'react-native';

export type ThemePreference = 'light' | 'dark' | 'system';

const THEME_PREFERENCE_KEY = 'theme-preference';

// Platform-specific storage helper
const getStorageItem = async (key: string): Promise<string | null> => {
  if (Platform.OS === 'web') {
    if (typeof window !== 'undefined') {
      return window.localStorage.getItem(key);
    }
    return null;
  }
  return await AsyncStorage.getItem(key);
};

const setStorageItem = async (key: string, value: string): Promise<void> => {
  if (Platform.OS === 'web') {
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(key, value);
    }
    return;
  }
  await AsyncStorage.setItem(key, value);
};

interface ThemeContextType {
  preference: ThemePreference;
  effectiveTheme: 'light' | 'dark';
  loading: boolean;
  setPreference: (preference: ThemePreference) => Promise<void>;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const systemColorScheme = useRNColorScheme();
  const [preference, setPreferenceState] = useState<ThemePreference>('system');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPreference();
  }, []);

  const loadPreference = async () => {
    try {
      const stored = await getStorageItem(THEME_PREFERENCE_KEY);
      if (stored && (stored === 'light' || stored === 'dark' || stored === 'system')) {
        setPreferenceState(stored as ThemePreference);
      }
    } catch (error) {
      console.error('Error loading theme preference:', error);
    } finally {
      setLoading(false);
    }
  };

  const savePreference = async (newPreference: ThemePreference) => {
    // Store current preference in case we need to revert
    const previousPreference = preference;
    // Update state immediately for instant UI feedback
    setPreferenceState(newPreference);
    try {
      await setStorageItem(THEME_PREFERENCE_KEY, newPreference);
    } catch (error) {
      console.error('Error saving theme preference:', error);
      // Revert on error
      setPreferenceState(previousPreference);
    }
  };

  const effectiveTheme = useMemo(() => {
    return preference === 'system' ? (systemColorScheme ?? 'light') : preference;
  }, [preference, systemColorScheme]);

  return (
    <ThemeContext.Provider value={{ preference, effectiveTheme, loading, setPreference: savePreference }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useThemePreference() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useThemePreference must be used within a ThemeProvider');
  }
  return context;
}

