import { router } from 'expo-router';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { useThemePreference, type ThemePreference } from '@/hooks/useThemePreference';

export default function ProfileSettingsScreen() {
  const { t } = useTranslation();
  const { preference, setPreference } = useThemePreference();

  const handleThemeChange = (newPreference: ThemePreference) => {
    setPreference(newPreference);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{t('profileSettings.title')}</Text>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{t('profileSettings.theme')}</Text>
        <TouchableOpacity
          style={[styles.option, preference === 'light' && styles.optionSelected]}
          onPress={() => handleThemeChange('light')}
        >
          <Text style={[styles.optionText, preference === 'light' && styles.optionTextSelected]}>
            {t('profileSettings.light')}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.option, preference === 'dark' && styles.optionSelected]}
          onPress={() => handleThemeChange('dark')}
        >
          <Text style={[styles.optionText, preference === 'dark' && styles.optionTextSelected]}>
            {t('profileSettings.dark')}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.option, preference === 'system' && styles.optionSelected]}
          onPress={() => handleThemeChange('system')}
        >
          <Text style={[styles.optionText, preference === 'system' && styles.optionTextSelected]}>
            {t('profileSettings.system')}
          </Text>
        </TouchableOpacity>
      </View>
      <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
        <Text style={styles.backButtonText}>{t('common.back')}</Text>
      </TouchableOpacity>
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
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 15,
  },
  option: {
    padding: 15,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    marginBottom: 10,
  },
  optionSelected: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  optionText: {
    fontSize: 16,
    color: '#000',
  },
  optionTextSelected: {
    color: '#fff',
    fontWeight: '600',
  },
  backButton: {
    marginTop: 20,
    padding: 15,
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
    alignItems: 'center',
  },
  backButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
});

