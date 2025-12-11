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

// Configure Android notification channel (required for Android 8.0+)
if (isNotificationsAvailable() && Platform.OS === 'android') {
  try {
    Notifications.setNotificationChannelAsync('default', {
      name: 'Default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FF231F7C',
      sound: 'default',
      enableVibrate: true,
      showBadge: true,
    }).then(() => {
      console.log('[PUSH] ✅ Android notification channel configured');
    }).catch((error) => {
      console.error('[PUSH] ❌ Error configuring Android notification channel:', error);
    });
  } catch (error) {
    console.error('[PUSH] ❌ Error setting up Android notification channel:', error);
  }
}

// Configure notification handler (only if available)
if (isNotificationsAvailable()) {
  try {
    Notifications.setNotificationHandler({
      handleNotification: async (notification) => {
        console.log('[PUSH] Notification handler called:', {
          title: notification.request.content.title,
          body: notification.request.content.body,
          data: notification.request.content.data,
        });
        return {
          shouldShowAlert: true,
          shouldPlaySound: true,
          shouldSetBadge: true,
          shouldShowBanner: true,
          shouldShowList: true,
        };
      },
    });
    console.log('[PUSH] ✅ Notification handler configured successfully');
  } catch (error) {
    // Silently fail in Expo Go
    console.log('[PUSH] Push notifications not available in Expo Go. Use a development build for full functionality.');
  }
}

/**
 * Requests notification permissions and returns the result
 */
export async function requestNotificationPermissions(): Promise<boolean> {
  if (!isNotificationsAvailable()) {
    console.log('[PUSH] Push notifications not available in Expo Go. Use a development build.');
    return false;
  }

  try {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    console.log(`[PUSH] Current permission status: ${existingStatus}`);
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      console.log('[PUSH] Requesting notification permissions...');
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
      console.log(`[PUSH] Permission request result: ${status}`);
    } else {
      console.log('[PUSH] ✅ Permissions already granted');
    }

    return finalStatus === 'granted';
  } catch (error) {
    console.error('[PUSH] ❌ Error requesting notification permissions:', error);
    return false;
  }
}

/**
 * Gets the Expo push token for the current device
 */
export async function getExpoPushToken(): Promise<string | null> {
  if (!isNotificationsAvailable()) {
    console.log('[PUSH] Push notifications not available in Expo Go. Use a development build.');
    return null;
  }

  try {
    const projectId = process.env.EXPO_PUBLIC_PROJECT_ID;
    console.log(`[PUSH] Getting push token with project ID: ${projectId || 'NOT SET'}`);
    
    if (!projectId) {
      console.error('[PUSH] ❌ EXPO_PUBLIC_PROJECT_ID is not set!');
      return null;
    }

    const hasPermission = await requestNotificationPermissions();
    if (!hasPermission) {
      console.log('[PUSH] ❌ Notification permissions not granted');
      return null;
    }

    console.log('[PUSH] Requesting Expo push token...');
    const tokenData = await Notifications.getExpoPushTokenAsync({
      projectId,
    });

    console.log('[PUSH] ✅ Expo push token obtained:', tokenData.data);

    return tokenData.data;
  } catch (error: any) {
    // In Expo Go, this will fail - that's expected
    console.error('[PUSH] ❌ Error getting push token:', error?.message || error);
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
  console.log(`[PUSH] Initializing push notifications for user: ${userId}`);
  try {
    const token = await getExpoPushToken();
    if (!token) {
      console.error('[PUSH] ❌ Failed to get push token');
      return { success: false, error: new Error('Failed to get push token') };
    }

    const result = await registerDeviceToken(token, userId);
    if (result.success) {
      console.log('[PUSH] ✅ Push notifications initialized successfully');
    } else {
      console.error('[PUSH] ❌ Failed to register device token:', result.error);
    }
    return result;
  } catch (error: any) {
    console.error('[PUSH] ❌ Error initializing push notifications:', error);
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

/**
 * Sets up notification listeners for receiving and handling push notifications
 * Returns cleanup function to remove listeners
 */
export function setupNotificationListeners(
  onNotificationReceived?: (notification: Notifications.Notification) => void,
  onNotificationTapped?: (response: Notifications.NotificationResponse) => void
): () => void {
  if (!isNotificationsAvailable()) {
    console.log('[PUSH] Push notifications not available. Skipping listener setup.');
    return () => {};
  }

  try {
    console.log('[PUSH] Setting up notification listeners...');
    
    // Listener for notifications received while app is in foreground
    const receivedSubscription = Notifications.addNotificationReceivedListener((notification) => {
      console.log('[PUSH] ✅ Notification received in foreground:', JSON.stringify({
        title: notification.request.content.title,
        body: notification.request.content.body,
        data: notification.request.content.data,
      }, null, 2));
      onNotificationReceived?.(notification);
    });

    // Listener for when user taps on a notification
    const responseSubscription = Notifications.addNotificationResponseReceivedListener((response) => {
      console.log('[PUSH] ✅ Notification tapped:', JSON.stringify({
        title: response.notification.request.content.title,
        body: response.notification.request.content.body,
        data: response.notification.request.content.data,
      }, null, 2));
      onNotificationTapped?.(response);
    });

    console.log('[PUSH] ✅ Notification listeners set up successfully');

    // Return cleanup function
    return () => {
      receivedSubscription.remove();
      responseSubscription.remove();
      console.log('[PUSH] Notification listeners removed');
    };
  } catch (error) {
    console.error('[PUSH] ❌ Error setting up notification listeners:', error);
    return () => {};
  }
}

/**
 * Diagnostic function to check notification setup status
 */
export async function diagnoseNotificationSetup(): Promise<void> {
  console.log('\n[PUSH DIAGNOSTICS] ========================================');
  console.log('[PUSH DIAGNOSTICS] Starting notification diagnostics...\n');

  // Check if notifications are available
  const available = isNotificationsAvailable();
  console.log(`[PUSH DIAGNOSTICS] Notifications available: ${available}`);

  if (!available) {
    console.log('[PUSH DIAGNOSTICS] ❌ Notifications not available. This might be Expo Go.');
    console.log('[PUSH DIAGNOSTICS] ========================================\n');
    return;
  }

  // Check permissions
  try {
    const { status } = await Notifications.getPermissionsAsync();
    console.log(`[PUSH DIAGNOSTICS] Permission status: ${status}`);
    if (status !== 'granted') {
      console.log('[PUSH DIAGNOSTICS] ⚠️  Permissions not granted!');
    }
  } catch (error) {
    console.error('[PUSH DIAGNOSTICS] ❌ Error checking permissions:', error);
  }

  // Check project ID
  const projectId = process.env.EXPO_PUBLIC_PROJECT_ID;
  console.log(`[PUSH DIAGNOSTICS] Project ID: ${projectId || 'NOT SET'}`);
  if (!projectId) {
    console.log('[PUSH DIAGNOSTICS] ❌ EXPO_PUBLIC_PROJECT_ID is not set!');
  }

  // Try to get push token
  try {
    console.log('[PUSH DIAGNOSTICS] Attempting to get push token...');
    const token = await getExpoPushToken();
    if (token) {
      console.log(`[PUSH DIAGNOSTICS] ✅ Push token obtained: ${token.substring(0, 30)}...`);
    } else {
      console.log('[PUSH DIAGNOSTICS] ❌ Failed to get push token');
    }
  } catch (error) {
    console.error('[PUSH DIAGNOSTICS] ❌ Error getting push token:', error);
  }

  // Check notification channels (Android)
  if (Platform.OS === 'android') {
    try {
      const channels = await Notifications.getNotificationChannelsAsync();
      console.log(`[PUSH DIAGNOSTICS] Android notification channels: ${channels.length}`);
      channels.forEach((channel) => {
        console.log(`[PUSH DIAGNOSTICS]   - ${channel.id}: ${channel.name} (importance: ${channel.importance})`);
      });
    } catch (error) {
      console.error('[PUSH DIAGNOSTICS] Error checking notification channels:', error);
    }
  }

  console.log('[PUSH DIAGNOSTICS] ========================================\n');
}

