import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, StyleSheet, TouchableOpacity } from 'react-native';

import { Avatar } from '@/components/ui/avatar';
import { Text, View } from '@/components/Themed';
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
      <TouchableOpacity style={styles.button} onPress={() => router.push('/profile-settings')}>
        <Text style={styles.buttonText}>{t('me.settings')}</Text>
      </TouchableOpacity>
      <TouchableOpacity style={[styles.button, styles.signOutButton]} onPress={handleSignOut}>
        <Text style={[styles.buttonText, styles.signOutButtonText]}>{t('me.signOut')}</Text>
      </TouchableOpacity>
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
    height: 50,
    backgroundColor: '#007AFF',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  signOutButton: {
    backgroundColor: 'rgba(220, 38, 38, 0.8)',
  },
  signOutButtonText: {
    color: '#fff',
  },
});
