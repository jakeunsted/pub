import { useThemePreference } from '@/hooks/useThemePreference';

export function useColorScheme() {
  const { effectiveTheme } = useThemePreference();
  return effectiveTheme;
}
