import { Alert, StyleSheet } from 'react-native';

import { Text, View } from '@/components/Themed';
import { Button, ButtonText } from '@/components/ui/button';

interface EmptyGroupsStateProps {
  onCreatePress: () => void;
}

export function EmptyGroupsState({ onCreatePress }: EmptyGroupsStateProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>My Groups</Text>
      <Text style={styles.emptyText}>You don't have any groups yet</Text>
      <Button
        style={styles.button}
        onPress={onCreatePress}
        size="lg"
        action="primary"
      >
        <ButtonText>Create Group</ButtonText>
      </Button>
      <Button
        style={styles.button}
        onPress={() => {
          Alert.alert('Join Group', 'Join functionality coming soon!');
        }}
        size="lg"
        variant="outline"
        action="secondary"
      >
        <ButtonText>Join Group</ButtonText>
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
