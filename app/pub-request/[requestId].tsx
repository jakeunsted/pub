import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

import { useAuth } from '@/lib/auth-context';

/**
 * Deep link handler for pub requests
 * Redirects to home page where pending requests are shown
 */
export default function PubRequestDeepLink() {
  const params = useLocalSearchParams<{ requestId: string }>();
  const requestId = typeof params.requestId === 'string' ? params.requestId : params.requestId?.[0];
  const router = useRouter();
  const { session, loading: authLoading } = useAuth();

  useEffect(() => {
    if (authLoading) {
      return;
    }

    // If user is logged in, redirect to home page where pending requests are shown
    if (session?.user?.id) {
      router.replace('/(tabs)');
    } else {
      // If not logged in, redirect to login page
      router.replace('/login');
    }
  }, [session, authLoading, router]);

  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" />
      <Text style={styles.loadingText}>Opening app...</Text>
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

