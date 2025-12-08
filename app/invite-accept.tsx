import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { Text } from '@/components/Themed';
import { useAuth } from '@/lib/auth-context';
import { acceptInvite, getInviteByToken, storePendingInviteToken } from '@/lib/invites';

export default function InviteAcceptScreen() {
  const { t } = useTranslation();
  const params = useLocalSearchParams<{ token: string }>();
  const token = typeof params.token === 'string' ? params.token : params.token?.[0];
  const { session, loading: authLoading } = useAuth();
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    if (!token) {
      Alert.alert(t('common.error'), t('groups.invite.invalidInviteLink'));
      router.replace('/(tabs)');
      return;
    }

    handleInvite();
  }, [token, session, authLoading]);

  const handleInvite = async () => {
    if (!token || authLoading) {
      return;
    }

    // Verify the invite exists and is valid
    const { invite, error: inviteError } = await getInviteByToken(token);
    if (inviteError || !invite) {
      Alert.alert(t('common.error'), inviteError?.message || t('groups.invite.invalidInviteLink'));
      router.replace('/(tabs)');
      return;
    }

    // If user is logged in, accept immediately
    if (session?.user?.id) {
      setProcessing(true);
      const { success, error } = await acceptInvite(token, session.user.id);
      setProcessing(false);

      if (success) {
        Alert.alert(t('common.success'), t('groups.invite.joinedGroup'), [
          {
            text: t('common.ok'),
            onPress: () => router.replace('/(tabs)'),
          },
        ]);
      } else {
        Alert.alert(t('common.error'), error?.message || t('groups.invite.failedToJoin'));
        router.replace('/(tabs)');
      }
    } else {
      // User is not logged in, store token for later
      await storePendingInviteToken(token);
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
  };

  if (processing || authLoading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" />
        <Text style={styles.loadingText}>
          {processing ? t('groups.invite.processing') : t('groups.loading')}
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

