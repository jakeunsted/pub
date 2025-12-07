import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useState } from 'react';
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

export function useThemePreference() {
  const systemColorScheme = useRNColorScheme();
  const [preference, setPreference] = useState<ThemePreference>('system');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPreference();
  }, []);

  const loadPreference = async () => {
    try {
      const stored = await getStorageItem(THEME_PREFERENCE_KEY);
      if (stored && (stored === 'light' || stored === 'dark' || stored === 'system')) {
        setPreference(stored as ThemePreference);
      }
    } catch (error) {
      console.error('Error loading theme preference:', error);
    } finally {
      setLoading(false);
    }
  };

  const savePreference = async (newPreference: ThemePreference) => {
    try {
      await setStorageItem(THEME_PREFERENCE_KEY, newPreference);
      setPreference(newPreference);
    } catch (error) {
      console.error('Error saving theme preference:', error);
    }
  };

  const effectiveTheme = preference === 'system' ? (systemColorScheme ?? 'light') : preference;

  return {
    preference,
    effectiveTheme,
    loading,
    setPreference: savePreference,
  };
}

