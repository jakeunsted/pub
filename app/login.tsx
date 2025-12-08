import { router } from 'expo-router';
import { useState } from 'react';
import { Alert, StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { Button, ButtonText } from '@/components/ui/button';
import {
  FormControl,
  FormControlLabel,
  FormControlLabelText,
} from '@/components/ui/form-control';
import { Input, InputField } from '@/components/ui/input';
import { Text } from 'react-native';

import { acceptInvite, getAndClearPendingInviteToken } from '@/lib/invites';
import { supabase } from '@/lib/superbase';

export default function LoginScreen() {
  const { t } = useTranslation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert(t('common.error'), t('common.pleaseFillAllFields'));
      return;
    }

    setLoading(true);
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      Alert.alert(t('common.error'), error.message);
      setLoading(false);
      return;
    }

    // Check for pending invite and accept it
    if (data.user) {
      const pendingToken = await getAndClearPendingInviteToken();
      if (pendingToken) {
        const { success, error: inviteError } = await acceptInvite(pendingToken, data.user.id);
        if (success) {
          Alert.alert(t('common.success'), t('groups.invite.joinedGroup'), [
            {
              text: t('common.ok'),
              onPress: () => router.replace('/(tabs)'),
            },
          ]);
          setLoading(false);
          return;
        } else {
          console.error('Error accepting invite:', inviteError);
          // Continue with normal login flow even if invite fails
        }
      }
    }

    router.replace('/(tabs)');
    setLoading(false);
  };

  const navigateToRegister = () => {
    router.push('/register');
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{t('login.title')}</Text>

      <FormControl style={styles.formControl}>
        <FormControlLabel>
          <FormControlLabelText>{t('login.email')}</FormControlLabelText>
        </FormControlLabel>
        <Input>
          <InputField
            placeholder={t('login.email')}
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            autoComplete="email"
          />
        </Input>
      </FormControl>

      <FormControl style={styles.formControl}>
        <FormControlLabel>
          <FormControlLabelText>{t('login.password')}</FormControlLabelText>
        </FormControlLabel>
        <Input>
          <InputField
            placeholder={t('login.password')}
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            autoCapitalize="none"
            autoComplete="password"
          />
        </Input>
      </FormControl>

      <Button
        style={styles.button}
        onPress={handleLogin}
        isDisabled={loading}
        size="lg"
        action="primary"
      >
        <ButtonText>{loading ? t('login.loggingIn') : t('login.login')}</ButtonText>
      </Button>

      <Button
        variant="link"
        action="primary"
        onPress={navigateToRegister}
        style={styles.linkButton}
      >
        <ButtonText>{t('login.noAccount')}</ButtonText>
      </Button>
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
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 40,
  },
  formControl: {
    width: '100%',
    marginBottom: 20,
  },
  button: {
    width: '100%',
    marginTop: 10,
  },
  linkButton: {
    marginTop: 20,
  },
});
