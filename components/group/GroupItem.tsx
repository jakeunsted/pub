import { Pressable, Text as RNText, View as RNView, StyleSheet } from 'react-native';

import { Text, View, useThemeColor } from '@/components/Themed';
import { Avatar } from '@/components/ui/avatar';

interface GroupMember {
  user_id: string;
  display_name: string | null;
}

interface GroupItemProps {
  group: {
    id: string;
    name: string;
    created_at: string;
    created_by: string | null;
    members?: GroupMember[];
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
        <RNView style={styles.groupHeader} className="bg-transparent">
          <Text style={styles.groupName}>{group.name}</Text>
        </RNView>
        <Text style={styles.groupDate}>
          Created {new Date(group.created_at).toLocaleDateString()}
        </Text>
        {group.members && group.members.length > 0 && (
          <RNView style={styles.membersContainer} className="bg-transparent">
            {group.members.slice(0, 5).map((member, index) => (
              <RNView
                key={member.user_id}
                style={[
                  styles.avatarWrapper,
                  index > 0 && styles.avatarOverlap,
                ]}
                className="bg-transparent"
              >
                <Avatar name={member.display_name || undefined} size="small" />
              </RNView>
            ))}
            {group.members.length > 5 && (
              <RNView style={[styles.avatarWrapper, styles.avatarOverlap, styles.moreAvatars]} className="bg-transparent">
                <RNText style={styles.moreAvatarsText}>+{group.members.length - 5}</RNText>
              </RNView>
            )}
          </RNView>
        )}
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
  groupHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 5,
  },
  groupName: {
    fontSize: 18,
    fontWeight: '600',
    flex: 1,
  },
  groupDate: {
    fontSize: 14,
    opacity: 0.6,
    marginBottom: 10,
  },
  membersContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  avatarWrapper: {
    marginRight: -8,
  },
  avatarOverlap: {
    marginLeft: -8,
  },
  moreAvatars: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#fff',
  },
  moreAvatarsText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#666',
  },
});
