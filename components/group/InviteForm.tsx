import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, StyleSheet, View } from 'react-native';

import { Button, ButtonText } from '@/components/ui/button';
import {
  FormControl,
  FormControlLabel,
  FormControlLabelText,
} from '@/components/ui/form-control';
import { Input, InputField } from '@/components/ui/input';
import { createInvite } from '@/lib/invites';

interface InviteFormProps {
  groupId: string;
  inviterId: string;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function InviteForm({ groupId, inviterId, onSuccess, onCancel }: InviteFormProps) {
  const { t } = useTranslation();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!email.trim()) {
      Alert.alert(t('common.error'), t('groups.invite.pleaseEnterEmail'));
      return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      Alert.alert(t('common.error'), t('groups.invite.invalidEmail'));
      return;
    }

    setLoading(true);
    try {
      const { invite, error } = await createInvite(groupId, email.trim(), inviterId);

      if (error) {
        Alert.alert(t('common.error'), error.message || t('groups.invite.failedToSend'));
        return;
      }

      if (invite) {
        Alert.alert(t('common.success'), t('groups.invite.inviteSent'));
        setEmail('');
        onSuccess?.();
      }
    } catch (error: any) {
      Alert.alert(t('common.error'), error.message || t('groups.invite.failedToSend'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <FormControl style={styles.formControl}>
        <FormControlLabel>
          <FormControlLabelText>{t('groups.invite.email')}</FormControlLabelText>
        </FormControlLabel>
        <Input>
          <InputField
            placeholder={t('groups.invite.enterEmail')}
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            autoComplete="email"
            editable={!loading}
          />
        </Input>
      </FormControl>

      <View style={styles.buttons}>
        <Button
          style={styles.button}
          onPress={handleSubmit}
          isDisabled={loading}
          size="lg"
          action="primary"
        >
          <ButtonText>{loading ? t('groups.invite.sending') : t('groups.invite.sendInvite')}</ButtonText>
        </Button>
        {onCancel && (
          <Button
            style={styles.button}
            onPress={onCancel}
            size="lg"
            variant="outline"
            action="secondary"
            isDisabled={loading}
          >
            <ButtonText>{t('common.cancel')}</ButtonText>
          </Button>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: 20,
  },
  formControl: {
    width: '100%',
    marginBottom: 20,
  },
  buttons: {
    flexDirection: 'row',
    gap: 10,
  },
  button: {
    flex: 1,
  },
});

