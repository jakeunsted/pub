import FontAwesome from '@expo/vector-icons/FontAwesome';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { router, Stack, useSegments } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import { Platform, View } from 'react-native';
import 'react-native-reanimated';
import { SafeAreaProvider, SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { useColorScheme } from '@/components/useColorScheme';
import { AuthProvider, useAuth } from '@/lib/auth-context';
import { ThemeProvider as AppThemeProvider, useThemePreference } from '@/lib/theme-context';

import { GluestackUIProvider } from '@/components/ui/gluestack-ui-provider';
import '@/global.css';
import '@/lib/i18n';

export {
  // Catch any errors thrown by the Layout component.
  ErrorBoundary
} from 'expo-router';

export const unstable_settings = {
  // Ensure that reloading on `/modal` keeps a back button present.
  initialRouteName: '(tabs)',
};

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [loaded, error] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
    ...FontAwesome.font,
  });

  // Expo Router uses Error Boundaries to catch errors in the navigation tree.
  useEffect(() => {
    if (error) throw error;
  }, [error]);

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync().catch(() => {
        // Ignore errors if splash screen is already hidden
      });
    }
  }, [loaded]);

  if (!loaded) {
    return null;
  }

  return (
    <SafeAreaProvider>
      <AppThemeProvider>
        <AuthProvider>
          <RootLayoutNav />
        </AuthProvider>
      </AppThemeProvider>
    </SafeAreaProvider>
  );
}

function RootLayoutNav() {
  const colorScheme = useColorScheme();
  const { preference, effectiveTheme } = useThemePreference();
  const { session, loading } = useAuth();
  const segments = useSegments();
  const insets = useSafeAreaInsets();

  useEffect(() => {
    if (loading) return;

    const inAuthGroup = segments[0] === '(tabs)';
    const inLoginPage = segments[0] === 'login' || segments[0] === 'register';

    if (!session && inAuthGroup) {
      router.replace('/login');
    } else if (session && inLoginPage) {
      router.replace('/(tabs)');
    }
  }, [session, loading, segments]);

  // Use effectiveTheme which updates when preference changes
  const gluestackMode = effectiveTheme;
  // Also use effectiveTheme for React Navigation theme
  const navigationTheme = effectiveTheme === 'dark' ? DarkTheme : DefaultTheme;

  // iOS safe area background color - grey in light mode, lighter in dark mode
  const safeAreaBackgroundColor = Platform.OS === 'ios'
    ? effectiveTheme === 'dark'
      ? '#1C1C1E' // Dark grey for dark mode
      : '#858585' // Light grey for light mode
    : 'transparent';

  return (
    <GluestackUIProvider key={gluestackMode} mode={gluestackMode}>
      <ThemeProvider value={navigationTheme}>
        <View style={{ flex: 1 }}>
          {Platform.OS === 'ios' && insets.top > 0 && (
            <View
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                height: insets.top,
                backgroundColor: safeAreaBackgroundColor,
                zIndex: 1000,
              }}
            />
          )}
          <SafeAreaView style={{ flex: 1 }} edges={['top']}>
            <Stack>
              <Stack.Screen name="(tabs)" options={{ headerShown: false, title: 'Pub' }} />
              <Stack.Screen name="login" options={{ headerShown: false }} />
              <Stack.Screen name="register" options={{ headerShown: false }} />
              <Stack.Screen name="invite" options={{ headerShown: false }} />
              <Stack.Screen name="invite-accept" options={{ headerShown: false }} />
              <Stack.Screen name="profile-settings" options={{ presentation: 'modal', title: 'Profile Settings' }} />
              <Stack.Screen name="group-details" options={{ presentation: 'card', title: 'Group Details' }} />
              <Stack.Screen name="modal" options={{ presentation: 'modal' }} />
            </Stack>
          </SafeAreaView>
        </View>
      </ThemeProvider>
    </GluestackUIProvider>
  );
}
