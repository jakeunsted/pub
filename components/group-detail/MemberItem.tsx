import { StyleSheet } from 'react-native';

import { Text, View } from '@/components/Themed';
import { Avatar } from '@/components/ui/avatar';

export interface GroupMember {
  user_id: string;
  display_name: string | null;
}

interface MemberItemProps {
  member: GroupMember;
}

export function MemberItem({ member }: MemberItemProps) {
  return (
    <View style={styles.memberItem} lightColor="rgba(0, 0, 0, 0.02)" darkColor="rgba(255, 255, 255, 0.05)">
      <Avatar name={member.display_name || undefined} size="medium" />
      <Text style={styles.memberName}>
        {member.display_name || 'Unknown User'}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  memberItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.1)',
  },
  memberName: {
    fontSize: 16,
    fontWeight: '500',
    marginLeft: 15,
  },
});

