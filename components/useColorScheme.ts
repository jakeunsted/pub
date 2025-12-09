import { useThemePreference } from '@/lib/theme-context';

export function useColorScheme() {
  const { effectiveTheme } = useThemePreference();
  return effectiveTheme;
}
