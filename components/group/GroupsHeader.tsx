import { StyleSheet } from 'react-native';

import { Text, View } from '@/components/Themed';
import { Button, ButtonText } from '@/components/ui/button';

interface GroupsHeaderProps {
  onCreatePress: () => void;
  showCreateButton?: boolean;
}

export function GroupsHeader({ onCreatePress, showCreateButton = true }: GroupsHeaderProps) {
  return (
    <View style={styles.header}>
      <Text style={styles.title}>My Groups</Text>
      {showCreateButton && (
        <Button
          onPress={onCreatePress}
          size="sm"
          action="primary"
        >
          <ButtonText>+ Create</ButtonText>
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
