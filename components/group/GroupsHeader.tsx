import { StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';

import { Text, View } from '@/components/Themed';
import { Button, ButtonText } from '@/components/ui/button';

interface GroupsHeaderProps {
  onCreatePress: () => void;
  showCreateButton?: boolean;
}

export function GroupsHeader({ onCreatePress, showCreateButton = true }: GroupsHeaderProps) {
  const { t } = useTranslation();
  return (
    <View style={styles.header}>
      <Text style={styles.title}>{t('groups.title')}</Text>
      {showCreateButton && (
        <Button
          onPress={onCreatePress}
          size="sm"
          action="primary"
        >
          <ButtonText>{t('groups.create')}</ButtonText>
        </Button>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
  },
});
