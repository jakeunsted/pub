import { router } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, StyleSheet, Text, View } from 'react-native';

import { Button, ButtonText } from '@/components/ui/button';
import {
  FormControl,
  FormControlLabel,
  FormControlLabelText,
} from '@/components/ui/form-control';
import { Input, InputField } from '@/components/ui/input';

import { acceptInvite, getAndClearPendingInviteToken } from '@/lib/invites';
import { supabase } from '@/lib/superbase';

export default function RegisterScreen() {
  const { t } = useTranslation();
  const [email, setEmail] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleRegister = async () => {
    if (!email || !displayName || !password || !confirmPassword) {
      Alert.alert(t('common.error'), t('common.pleaseFillAllFields'));
      return;
    }

    if (!displayName.trim()) {
      Alert.alert(t('common.error'), t('register.displayNameRequired'));
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert(t('common.error'), t('register.passwordsDoNotMatch'));
      return;
    }

    if (password.length < 6) {
      Alert.alert(t('common.error'), t('register.passwordTooShort'));
      return;
    }

    setLoading(true);
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
    });

    if (authError) {
      Alert.alert(t('common.error'), authError.message);
      setLoading(false);
      return;
    }

    if (!authData.user) {
      Alert.alert(t('common.error'), 'Failed to create account. Please try again.');
      setLoading(false);
      return;
    }

    // Check if email confirmation is required
    // When email confirmation is required, session will be null
    const requiresEmailConfirmation = !authData.session;

    if (requiresEmailConfirmation) {
      // Wait a moment for the trigger to potentially create the profile
      await new Promise(resolve => setTimeout(resolve, 500));

      // Use upsert to create or update the profile with display name
      // This handles both cases: if trigger created it, or if we need to create it
      const { error: profileError } = await supabase
        .from('profiles')
        .upsert({
          id: authData.user.id,
          display_name: displayName.trim(),
        }, {
          onConflict: 'id',
        });

      if (profileError) {
        console.error('Error creating/updating profile:', profileError);
        // Don't block registration - user can update profile later if needed
        // The trigger might have created a profile without display_name, which is acceptable
      }

      // Show email verification message and redirect to login
      Alert.alert(
        t('register.checkEmail'),
        t('register.verifyEmailMessage'),
        [
          {
            text: t('common.ok'),
            onPress: () => router.replace('/login'),
          },
        ]
      );
      setLoading(false);
      return;
    }

    // Email is already confirmed (or confirmation not required)
    // Wait a moment for the trigger to potentially create the profile
    await new Promise(resolve => setTimeout(resolve, 500));

    // Use upsert to create or update the profile with display name
    const { error: profileError } = await supabase
      .from('profiles')
      .upsert({
        id: authData.user.id,
        display_name: displayName.trim(),
      }, {
        onConflict: 'id',
      });

    if (profileError) {
      console.error('Error creating/updating profile:', profileError);
      // Don't block registration - user can update profile later if needed
    }

    // Check for pending invite and accept it
    const pendingToken = await getAndClearPendingInviteToken();
    if (pendingToken) {
      const { success, error: inviteError } = await acceptInvite(pendingToken, authData.user.id);
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
        // Continue with normal registration success flow even if invite fails
      }
    }

    // Success - redirect to main app
    Alert.alert(t('common.success'), t('register.accountCreated'), [
      {
        text: t('common.ok'),
        onPress: () => router.replace('/(tabs)'),
      },
    ]);
    setLoading(false);
  };

  const navigateToLogin = () => {
    router.push('/login');
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{t('register.title')}</Text>

      <FormControl style={styles.formControl}>
        <FormControlLabel>
          <FormControlLabelText>{t('register.email')}</FormControlLabelText>
        </FormControlLabel>
        <Input>
          <InputField
            placeholder={t('register.email')}
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
          <FormControlLabelText>{t('register.displayName')}</FormControlLabelText>
        </FormControlLabel>
        <Input>
          <InputField
            placeholder={t('register.displayName')}
            value={displayName}
            onChangeText={setDisplayName}
            autoCapitalize="words"
            autoComplete="name"
          />
        </Input>
      </FormControl>

      <FormControl style={styles.formControl}>
        <FormControlLabel>
          <FormControlLabelText>{t('register.password')}</FormControlLabelText>
        </FormControlLabel>
        <Input>
          <InputField
            placeholder={t('register.password')}
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            autoCapitalize="none"
            autoComplete="password-new"
          />
        </Input>
      </FormControl>

      <FormControl style={styles.formControl}>
        <FormControlLabel>
          <FormControlLabelText>{t('register.confirmPassword')}</FormControlLabelText>
        </FormControlLabel>
        <Input>
          <InputField
            placeholder={t('register.confirmPassword')}
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            secureTextEntry
            autoCapitalize="none"
            autoComplete="password-new"
          />
        </Input>
      </FormControl>

      <Button
        style={styles.button}
        onPress={handleRegister}
        isDisabled={loading}
        size="lg"
        action="primary"
      >
        <ButtonText>{loading ? t('register.creatingAccount') : t('register.register')}</ButtonText>
      </Button>

      <Button
        variant="link"
        action="primary"
        onPress={navigateToLogin}
        style={styles.linkButton}
      >
        <ButtonText>{t('register.hasAccount')}</ButtonText>
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
