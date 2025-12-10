import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

import { supabase } from './superbase';

// Check if notifications are available (not available in Expo Go)
const isNotificationsAvailable = () => {
  try {
    // In Expo Go, this will throw or not be fully functional
    return Notifications != null;
  } catch {
    return false;
  }
};

// Configure notification handler (only if available)
if (isNotificationsAvailable()) {
  try {
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: true,
        shouldShowBanner: true,
        shouldShowList: true,
      }),
    });
  } catch (error) {
    // Silently fail in Expo Go
    console.log('Push notifications not available in Expo Go. Use a development build for full functionality.');
  }
}

/**
 * Requests notification permissions and returns the result
 */
export async function requestNotificationPermissions(): Promise<boolean> {
  if (!isNotificationsAvailable()) {
    console.log('Push notifications not available in Expo Go. Use a development build.');
    return false;
  }

  try {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    return finalStatus === 'granted';
  } catch (error) {
    console.error('Error requesting notification permissions:', error);
    return false;
  }
}

/**
 * Gets the Expo push token for the current device
 */
export async function getExpoPushToken(): Promise<string | null> {
  if (!isNotificationsAvailable()) {
    console.log('Push notifications not available in Expo Go. Use a development build.');
    return null;
  }

  try {
    const hasPermission = await requestNotificationPermissions();
    if (!hasPermission) {
      console.log('Notification permissions not granted');
      return null;
    }

    const tokenData = await Notifications.getExpoPushTokenAsync({
      projectId: process.env.EXPO_PUBLIC_PROJECT_ID,
    });

    console.log('Expo push token:', tokenData.data);

    return tokenData.data;
  } catch (error) {
    // In Expo Go, this will fail - that's expected
    console.log('Push notifications require a development build. Error:', error);
    return null;
  }
}

/**
 * Gets the platform name for the current device
 */
function getPlatform(): 'ios' | 'android' | 'web' {
  if (Platform.OS === 'ios') return 'ios';
  if (Platform.OS === 'android') return 'android';
  return 'web';
}

/**
 * Registers or updates a device token in the database
 */
export async function registerDeviceToken(token: string, userId: string): Promise<{ success: boolean; error?: Error }> {
  try {
    const platform = getPlatform();

    // Use upsert to insert or update the token
    const { error } = await supabase
      .from('device_tokens')
      .upsert(
        {
          user_id: userId,
          token,
          platform,
          updated_at: new Date().toISOString(),
        },
        {
          onConflict: 'user_id,token',
        }
      );

    if (error) {
      console.error('Error registering device token:', error);
      return { success: false, error: new Error(error.message) };
    }

    return { success: true };
  } catch (error: any) {
    console.error('Error registering device token:', error);
    return { success: false, error: error instanceof Error ? error : new Error(String(error)) };
  }
}

/**
 * Removes a device token from the database
 */
export async function unregisterDeviceToken(token: string, userId: string): Promise<{ success: boolean; error?: Error }> {
  try {
    const { error } = await supabase
      .from('device_tokens')
      .delete()
      .eq('user_id', userId)
      .eq('token', token);

    if (error) {
      console.error('Error unregistering device token:', error);
      return { success: false, error: new Error(error.message) };
    }

    return { success: true };
  } catch (error: any) {
    console.error('Error unregistering device token:', error);
    return { success: false, error: error instanceof Error ? error : new Error(String(error)) };
  }
}

/**
 * Initializes push notifications for the current user
 * Call this when the user logs in or when the app starts
 */
export async function initializePushNotifications(userId: string): Promise<{ success: boolean; error?: Error }> {
  try {
    const token = await getExpoPushToken();
    if (!token) {
      return { success: false, error: new Error('Failed to get push token') };
    }

    return await registerDeviceToken(token, userId);
  } catch (error: any) {
    console.error('Error initializing push notifications:', error);
    return { success: false, error: error instanceof Error ? error : new Error(String(error)) };
  }
}

/**
 * Cleans up push notifications when user logs out
 */
export async function cleanupPushNotifications(userId: string): Promise<void> {
  try {
    // Get all tokens for this user
    const { data: tokens } = await supabase
      .from('device_tokens')
      .select('token')
      .eq('user_id', userId);

    if (tokens && tokens.length > 0) {
      // Remove all tokens for this user
      await Promise.all(
        tokens.map((t) => unregisterDeviceToken(t.token, userId))
      );
    }
  } catch (error) {
    console.error('Error cleaning up push notifications:', error);
  }
}

