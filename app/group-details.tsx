import { useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, FlatList, StyleSheet } from 'react-native';

import { Text, View } from '@/components/Themed';
import { Avatar } from '@/components/ui/avatar';
import { useAuth } from '@/lib/auth-context';
import { supabase } from '@/lib/superbase';

interface GroupMember {
  user_id: string;
  display_name: string | null;
}

export default function GroupDetailsScreen() {
  const { t } = useTranslation();
  const params = useLocalSearchParams<{ groupId: string }>();
  const groupId = typeof params.groupId === 'string' ? params.groupId : params.groupId?.[0];
  const { session } = useAuth();
  const [members, setMembers] = useState<GroupMember[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (groupId) {
      loadMembers();
    }
  }, [groupId]);

  const loadMembers = async () => {
    if (!groupId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);

      // Get all members of the group
      const { data: memberData, error: memberError } = await supabase
        .from('group_members')
        .select('user_id')
        .eq('group_id', groupId);

      if (memberError) {
        console.error('Error loading members:', memberError);
        setLoading(false);
        return;
      }

      if (!memberData || memberData.length === 0) {
        setMembers([]);
        setLoading(false);
        return;
      }

      // Fetch profiles for all members
      const userIds = memberData.map((m) => m.user_id);
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('id, display_name')
        .in('id', userIds);

      if (profilesError) {
        console.error('Error loading profiles:', profilesError);
        setLoading(false);
        return;
      }

      // Map user_ids to display names
      const profileMap = new Map(
        (profilesData || []).map((p) => [p.id, p.display_name])
      );

      const membersList: GroupMember[] = memberData.map((member) => ({
        user_id: member.user_id,
        display_name: profileMap.get(member.user_id) || null,
      }));

      setMembers(membersList);
    } catch (error) {
      console.error('Failed to load members:', error);
    } finally {
      setLoading(false);
    }
  };

  const renderMember = ({ item }: { item: GroupMember }) => (
    <View style={styles.memberItem} lightColor="rgba(0, 0, 0, 0.02)" darkColor="rgba(255, 255, 255, 0.05)">
      <Avatar name={item.display_name || undefined} size="medium" />
      <Text style={styles.memberName}>
        {item.display_name || 'Unknown User'}
      </Text>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" />
        <Text style={styles.loadingText}>{t('groups.loading')}</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {members.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>{t('groups.noMembers')}</Text>
        </View>
      ) : (
        <FlatList
          data={members}
          renderItem={renderMember}
          keyExtractor={(item) => item.user_id}
          contentContainerStyle={styles.list}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  header: {
    marginBottom: 20,
  },
  backButton: {
    marginBottom: 10,
    paddingVertical: 8,
  },
  backButtonText: {
    fontSize: 16,
    color: '#007AFF',
    fontWeight: '600',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  loadingText: {
    marginTop: 10,
    opacity: 0.6,
  },
  list: {
    paddingBottom: 20,
  },
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
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    opacity: 0.6,
  },
});

