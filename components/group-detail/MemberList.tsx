import { useTranslation } from 'react-i18next';
import { FlatList, StyleSheet, View } from 'react-native';

import { Text } from '@/components/Themed';
import { MemberItem, type GroupMember } from './MemberItem';

interface MemberListProps {
  members: GroupMember[];
}

export function MemberList({ members }: MemberListProps) {
  const { t } = useTranslation();

  return (
    <View style={styles.membersSection}>
      <Text style={styles.sectionTitle}>{t('groups.members')}</Text>
      {members.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>{t('groups.noMembers')}</Text>
        </View>
      ) : (
        <FlatList
          data={members}
          renderItem={({ item }) => <MemberItem member={item} />}
          keyExtractor={(item) => item.user_id}
          scrollEnabled={false}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  membersSection: {
    marginTop: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 15,
  },
  emptyContainer: {
    paddingVertical: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    opacity: 0.6,
  },
});

