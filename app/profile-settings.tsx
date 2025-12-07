import { router } from 'expo-router';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { useThemePreference, type ThemePreference } from '@/hooks/useThemePreference';

export default function ProfileSettingsScreen() {
  const { preference, setPreference } = useThemePreference();

  const handleThemeChange = (newPreference: ThemePreference) => {
    setPreference(newPreference);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Profile Settings</Text>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Theme</Text>
        <TouchableOpacity
          style={[styles.option, preference === 'light' && styles.optionSelected]}
          onPress={() => handleThemeChange('light')}
        >
          <Text style={[styles.optionText, preference === 'light' && styles.optionTextSelected]}>
            Light
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.option, preference === 'dark' && styles.optionSelected]}
          onPress={() => handleThemeChange('dark')}
        >
          <Text style={[styles.optionText, preference === 'dark' && styles.optionTextSelected]}>
            Dark
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.option, preference === 'system' && styles.optionSelected]}
          onPress={() => handleThemeChange('system')}
        >
          <Text style={[styles.optionText, preference === 'system' && styles.optionTextSelected]}>
            System
          </Text>
        </TouchableOpacity>
      </View>
      <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
        <Text style={styles.backButtonText}>Back</Text>
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

