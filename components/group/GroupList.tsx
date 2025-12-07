import { FlatList, StyleSheet } from 'react-native';

import { GroupItem } from './GroupItem';

interface GroupMember {
  user_id: string;
  display_name: string | null;
}

interface Group {
  id: string;
  name: string;
  created_at: string;
  created_by: string | null;
  members?: GroupMember[];
}

interface GroupListProps {
  groups: Group[];
  onGroupPress?: (group: Group) => void;
}

export function GroupList({ groups, onGroupPress }: GroupListProps) {
  return (
    <FlatList
      data={groups}
      renderItem={({ item }) => (
        <GroupItem group={item} onPress={() => onGroupPress?.(item)} />
      )}
      keyExtractor={(item) => item.id}
      contentContainerStyle={styles.list}
    />
  );
}

const styles = StyleSheet.create({
  list: {
    paddingBottom: 20,
  },
});

