import { Pressable, StyleSheet } from 'react-native';

import { Text, View, useThemeColor } from '@/components/Themed';

interface GroupItemProps {
  group: {
    id: string;
    name: string;
    created_at: string;
    created_by: string | null;
  };
  onPress?: () => void;
}

export function GroupItem({ group, onPress }: GroupItemProps) {
  const borderColor = useThemeColor(
    { light: 'rgba(0, 0, 0, 0.1)', dark: 'rgba(255, 255, 255, 0.1)' },
    'tabIconDefault'
  );

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        pressed && styles.groupItemPressed,
      ]}
    >
      <View
        style={[
          styles.groupItem,
          { borderColor },
        ]}
        lightColor="rgba(0, 0, 0, 0.02)"
        darkColor="rgba(255, 255, 255, 0.05)"
      >
        <Text style={styles.groupName}>{group.name}</Text>
        <Text style={styles.groupDate}>
          Created {new Date(group.created_at).toLocaleDateString()}
        </Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  groupItem: {
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
    borderWidth: 1,
  },
  groupItemPressed: {
    opacity: 0.7,
  },
  groupName: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 5,
  },
  groupDate: {
    fontSize: 14,
    opacity: 0.6,
  },
});
