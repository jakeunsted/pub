import { Alert, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';

import { Text, View } from '@/components/Themed';
import { Button, ButtonText } from '@/components/ui/button';

interface EmptyGroupsStateProps {
  onCreatePress: () => void;
}

export function EmptyGroupsState({ onCreatePress }: EmptyGroupsStateProps) {
  const { t } = useTranslation();
  return (
    <View style={styles.container}>
      <Text style={styles.title}>{t('groups.emptyState.title')}</Text>
      <Text style={styles.emptyText}>{t('groups.emptyState.noGroups')}</Text>
      <Button
        style={styles.button}
        onPress={onCreatePress}
        size="lg"
        action="primary"
      >
        <ButtonText>{t('groups.createGroup')}</ButtonText>
      </Button>
      <Button
        style={styles.button}
        onPress={() => {
          Alert.alert(t('groups.joinGroup'), t('groups.joinFunctionalityComingSoon'));
        }}
        size="lg"
        variant="outline"
        action="secondary"
      >
        <ButtonText>{t('groups.joinGroup')}</ButtonText>
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
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  emptyText: {
    fontSize: 16,
    marginBottom: 30,
    textAlign: 'center',
    opacity: 0.6,
  },
  button: {
    width: '100%',
    marginBottom: 10,
  },
});
