import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Alert, Linking, Platform, StyleSheet, Text, View } from 'react-native';

import { useAuth } from '@/lib/auth-context';
import { acceptInvite, getInviteByToken, storePendingInviteToken } from '@/lib/invites';

const APP_STORE_URLS = {
  ios: 'https://apps.apple.com/app/pub/idXXXXXXX', // TODO: Replace with actual App Store URL
  android: 'https://play.google.com/store/apps/details?id=com.pub.app', // TODO: Replace with actual Play Store URL
};

// Deep link scheme
const DEEP_LINK_SCHEME = 'pub://';

/**
 * Detects if the user is on a mobile device
 */
function isMobileDevice(): boolean {
  if (Platform.OS !== 'web') {
    return true;
  }

  if (typeof window === 'undefined') {
    return false;
  }

  const userAgent = window.navigator.userAgent.toLowerCase();
  return /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(userAgent);
}

/**
 * Detects if the user is on iOS
 */
function isIOS(): boolean {
  if (Platform.OS === 'ios') {
    return true;
  }

  if (typeof window === 'undefined') {
    return false;
  }

  const userAgent = window.navigator.userAgent.toLowerCase();
  return /iphone|ipad|ipod/i.test(userAgent);
}

/**
 * Detects if the user is on Android
 */
function isAndroid(): boolean {
  if (Platform.OS === 'android') {
    return true;
  }

  if (typeof window === 'undefined') {
    return false;
  }

  const userAgent = window.navigator.userAgent.toLowerCase();
  return /android/i.test(userAgent);
}

export default function InviteWebScreen() {
  const { t } = useTranslation();
  const params = useLocalSearchParams<{ token: string }>();
  const token = typeof params.token === 'string' ? params.token : params.token?.[0];
  const router = useRouter();
  const { session, loading: authLoading } = useAuth();
  const [processing, setProcessing] = useState(false);
  const [redirecting, setRedirecting] = useState(false);

  useEffect(() => {
    if (!token) {
      if (Platform.OS === 'web') {
        router.replace('/');
      } else {
        Alert.alert(t('common.error'), t('groups.invite.invalidInviteLink'));
        router.replace('/(tabs)');
      }
      return;
    }

    // If we're on web and mobile, try to open the app
    if (Platform.OS === 'web' && isMobileDevice()) {
      handleMobileRedirect();
    } else {
      // On native or desktop web, handle the invite normally
      handleInvite();
    }
  }, [token, session, authLoading]);

  const handleMobileRedirect = async () => {
    if (!token) return;

    setRedirecting(true);

    // Try to open the app via deep link
    const deepLinkUrl = `${DEEP_LINK_SCHEME}invite/${token}`;
    
    try {
      // On web, try to open the deep link
      // This will attempt to open the app if installed
      if (Platform.OS === 'web' && typeof window !== 'undefined') {
        // Create a temporary link and click it to trigger deep link
        const link = document.createElement('a');
        link.href = deepLinkUrl;
        link.style.display = 'none';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        // Also try using Linking API (works in React Native Web)
        try {
          await Linking.openURL(deepLinkUrl);
        } catch (e) {
          // Linking might not work on web, that's okay
        }

        // Give the app a moment to open (2 seconds)
        // If user is still here, fall through to web handling
        setTimeout(() => {
          handleInvite();
        }, 2000);
      } else {
        // On native, use Linking API
        const canOpen = await Linking.canOpenURL(deepLinkUrl);
        
        if (canOpen) {
          await Linking.openURL(deepLinkUrl);
          // On native, if we can open it, the app should handle it
          // But if we're still here, fall through
          setTimeout(() => {
            handleInvite();
          }, 1000);
        } else {
          // Can't open deep link, check if we should redirect to app store
          // For now, just go to web version
          // TODO: Uncomment when app is on app stores
          // if (isIOS()) {
          //   if (Platform.OS === 'web' && typeof window !== 'undefined') {
          //     window.location.href = APP_STORE_URLS.ios;
          //   }
          //   return;
          // } else if (isAndroid()) {
          //   if (Platform.OS === 'web' && typeof window !== 'undefined') {
          //     window.location.href = APP_STORE_URLS.android;
          //   }
          //   return;
          // }
          
          // Fallback to web version
          handleInvite();
        }
      }
    } catch (error) {
      console.error('Error opening deep link:', error);
      // Fallback to web version
      handleInvite();
    }
  };

  const handleInvite = async () => {
    if (!token || authLoading) {
      return;
    }

    setRedirecting(false);
    setProcessing(true);

    // Verify the invite exists and is valid
    const { invite, error: inviteError } = await getInviteByToken(token);
    if (inviteError || !invite) {
      if (Platform.OS === 'web') {
        // On web, show error and redirect
        if (typeof window !== 'undefined') {
          alert(inviteError?.message || t('groups.invite.invalidInviteLink'));
        }
        router.replace('/');
      } else {
        Alert.alert(t('common.error'), inviteError?.message || t('groups.invite.invalidInviteLink'));
        router.replace('/(tabs)');
      }
      setProcessing(false);
      return;
    }

    // If user is logged in, accept immediately
    if (session?.user?.id) {
      const { success, error } = await acceptInvite(token, session.user.id);
      setProcessing(false);

      if (success) {
        if (Platform.OS === 'web') {
          // On web, show success message and redirect
          if (typeof window !== 'undefined') {
            alert(t('groups.invite.joinedGroup'));
          }
          router.replace('/');
        } else {
          Alert.alert(t('common.success'), t('groups.invite.joinedGroup'), [
            {
              text: t('common.ok'),
              onPress: () => router.replace('/(tabs)'),
            },
          ]);
        }
      } else {
        if (Platform.OS === 'web') {
          if (typeof window !== 'undefined') {
            alert(error?.message || t('groups.invite.failedToJoin'));
          }
          router.replace('/');
        } else {
          Alert.alert(t('common.error'), error?.message || t('groups.invite.failedToJoin'));
          router.replace('/(tabs)');
        }
      }
    } else {
      // User is not logged in, store token for later
      await storePendingInviteToken(token);
      setProcessing(false);
      
      if (Platform.OS === 'web') {
        // On web, redirect to login page
        router.replace('/login');
      } else {
        Alert.alert(
          t('groups.invite.loginRequired'),
          t('groups.invite.loginToJoin'),
          [
            {
              text: t('common.cancel'),
              style: 'cancel',
              onPress: () => router.replace('/(tabs)'),
            },
            {
              text: t('login.login'),
              onPress: () => router.push('/login'),
            },
          ]
        );
      }
    }
  };

  if (processing || authLoading || redirecting) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" />
        <Text style={styles.loadingText}>
          {redirecting 
            ? 'Opening app...' 
            : processing 
              ? t('groups.invite.processing') 
              : t('groups.loading')}
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" />
      <Text style={styles.loadingText}>{t('groups.invite.processing')}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 10,
    opacity: 0.6,
  },
});

