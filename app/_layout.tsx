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
import { diagnoseNotificationSetup, setupNotificationListeners } from '@/lib/push-notifications';
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

  // Set up notification listeners and run diagnostics
  useEffect(() => {
    if (!session?.user?.id) {
      return;
    }

    // Run diagnostics on mount (only once per session)
    diagnoseNotificationSetup().catch((error) => {
      console.error('[PUSH] Error running diagnostics:', error);
    });

    const cleanup = setupNotificationListeners(
      // Handle notification received while app is in foreground
      (notification) => {
        console.log('[PUSH] Notification received in foreground:', notification);
        // The notification handler will display it, but we can add custom logic here if needed
      },
      // Handle notification tapped
      (response) => {
        console.log('[PUSH] Notification tapped:', response);
        const data = response.notification.request.content.data;

        // Navigate based on notification type
        if (data?.type === 'pub_request' && session?.user?.id) {
          // Navigate to home page where pending requests are shown
          router.push('/(tabs)');
        } else if (data?.requestId && session?.user?.id) {
          // If there's a specific requestId, we could navigate to it
          // For now, just go to home page
          router.push('/(tabs)');
        } else if (!session?.user?.id) {
          // If not logged in, go to login page
          router.push('/login');
        }
      }
    );

    return cleanup;
  }, [session]);

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
