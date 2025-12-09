import FontAwesome from '@expo/vector-icons/FontAwesome';
import { router } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Modal, Pressable, View as RNView, StyleSheet } from 'react-native';

import { Text, View, useThemeColor } from '@/components/Themed';
import { Button, ButtonText } from '@/components/ui/button';
import { FormControl, FormControlLabel, FormControlLabelText } from '@/components/ui/form-control';
import { useThemePreference, type ThemePreference } from '@/lib/theme-context';

export default function ProfileSettingsScreen() {
  const { t } = useTranslation();
  const { preference, setPreference } = useThemePreference();
  const [showThemeDropdown, setShowThemeDropdown] = useState(false);
  const textColor = useThemeColor({}, 'text');
  const backgroundColor = useThemeColor(
    { light: '#fff', dark: '#121212' },
    'background'
  );
  const borderColor = useThemeColor(
    { light: 'rgba(0, 0, 0, 0.1)', dark: 'rgba(255, 255, 255, 0.1)' },
    'tabIconDefault'
  );

  const handleThemeChange = (newPreference: ThemePreference) => {
    setPreference(newPreference);
    setShowThemeDropdown(false);
  };

  const getThemeLabel = () => {
    switch (preference) {
      case 'light':
        return t('profileSettings.light');
      case 'dark':
        return t('profileSettings.dark');
      case 'system':
        return t('profileSettings.system');
      default:
        return t('profileSettings.system');
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{t('profileSettings.title')}</Text>
      <View style={styles.section}>
        <FormControl>
          <FormControlLabel>
            <FormControlLabelText>{t('profileSettings.theme')}</FormControlLabelText>
          </FormControlLabel>
          <Button
            variant="outline"
            size="lg"
            onPress={() => setShowThemeDropdown(true)}
            style={styles.dropdownButton}
          >
            <ButtonText style={styles.dropdownButtonText}>{getThemeLabel()}</ButtonText>
            <FontAwesome name="chevron-down" size={14} color={textColor} style={styles.chevron} />
          </Button>
        </FormControl>
      </View>
      <Button
        variant="outline"
        size="lg"
        action="secondary"
        onPress={() => router.back()}
        style={styles.backButton}
      >
        <ButtonText>{t('common.back')}</ButtonText>
      </Button>

      <Modal
        visible={showThemeDropdown}
        transparent
        animationType="slide"
        onRequestClose={() => setShowThemeDropdown(false)}
      >
        <RNView style={styles.modalOverlay}>
          <Pressable style={styles.modalOverlayPressable} onPress={() => setShowThemeDropdown(false)} />
          <View style={[styles.modalContent, { backgroundColor, borderColor }]}>
            <Text style={[styles.modalTitle, { color: textColor }]}>
              {t('profileSettings.selectTheme')}
            </Text>
            <RNView style={styles.optionsList}>
              {(['light', 'dark', 'system'] as ThemePreference[]).map((option) => (
                <Button
                  key={option}
                  variant={preference === option ? 'solid' : 'outline'}
                  action={preference === option ? 'primary' : 'secondary'}
                  size="lg"
                  onPress={() => handleThemeChange(option)}
                  style={styles.optionButton}
                >
                  <ButtonText>{t(`profileSettings.${option}`)}</ButtonText>
                </Button>
              ))}
            </RNView>
            <Button
              variant="outline"
              size="md"
              action="secondary"
              onPress={() => setShowThemeDropdown(false)}
              style={styles.cancelButton}
            >
              <ButtonText>{t('common.cancel')}</ButtonText>
            </Button>
          </View>
        </RNView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 30,
  },
  section: {
    marginBottom: 30,
  },
  dropdownButton: {
    width: '100%',
    justifyContent: 'space-between',
    flexDirection: 'row',
    alignItems: 'center',
  },
  dropdownButtonText: {
    flex: 1,
  },
  chevron: {
    marginLeft: 8,
  },
  backButton: {
    marginTop: 20,
    width: '100%',
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalOverlayPressable: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    borderTopWidth: 1,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  optionsList: {
    gap: 12,
    marginBottom: 20,
  },
  optionButton: {
    width: '100%',
  },
  cancelButton: {
    width: '100%',
  },
});

