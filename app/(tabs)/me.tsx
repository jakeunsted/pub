import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, StyleSheet } from 'react-native';

import { Text, View } from '@/components/Themed';
import { Avatar } from '@/components/ui/avatar';
import { Button, ButtonText } from '@/components/ui/button';
import { useAuth } from '@/lib/auth-context';
import { supabase } from '@/lib/superbase';

interface Profile {
  id: string;
  display_name: string | null;
}

export default function MeScreen() {
  const { t } = useTranslation();
  const { session, signOut } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (session?.user?.id) {
      loadProfile();
    }
  }, [session]);

  const loadProfile = async () => {
    if (!session?.user?.id) {
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, display_name')
        .eq('id', session.user.id)
        .single();

      if (error) {
        console.error('Error loading profile:', error);
      } else {
        setProfile(data);
      }
    } catch (error) {
      console.error('Failed to load profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    router.replace('/login');
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.profileSection}>
        <Avatar name={profile?.display_name || undefined} size="large" />
        <Text style={styles.displayName}>
          {profile?.display_name || session?.user?.email || t('me.me')}
        </Text>
      </View>
      <Button
        style={styles.button}
        onPress={() => router.push('/profile-settings')}
        size="lg"
        action="primary"
        variant="solid"
      >
        <ButtonText>{t('me.settings')}</ButtonText>
      </Button>
      <Button
        style={styles.button}
        onPress={handleSignOut}
        size="lg"
        action="negative"
        variant="solid"
      >
        <ButtonText>{t('me.signOut')}</ButtonText>
      </Button>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  profileSection: {
    alignItems: 'center',
    marginBottom: 40,
  },
  displayName: {
    fontSize: 24,
    fontWeight: '600',
    marginTop: 16,
  },
  button: {
    width: '100%',
    marginBottom: 15,
  },
});
