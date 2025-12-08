import { useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, ScrollView, StyleSheet } from 'react-native';

import { InviteSection, MemberList, type GroupMember } from '@/components/group-detail';
import { Text, View } from '@/components/Themed';
import { useAuth } from '@/lib/auth-context';
import { getGroupInvites, type InviteData } from '@/lib/invites';
import { supabase } from '@/lib/superbase';

export default function GroupDetailsScreen() {
  const { t } = useTranslation();
  const params = useLocalSearchParams<{ groupId: string }>();
  const groupId = typeof params.groupId === 'string' ? params.groupId : params.groupId?.[0];
  const { session } = useAuth();
  const [members, setMembers] = useState<GroupMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [pendingInvites, setPendingInvites] = useState<InviteData[]>([]);

  useEffect(() => {
    if (groupId) {
      loadMembers();
      loadInvites();
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

  const loadInvites = async () => {
    if (!groupId) {
      return;
    }

    try {
      const { invites, error } = await getGroupInvites(groupId);
      if (error) {
        console.error('Error loading invites:', error);
        return;
      }
      setPendingInvites(invites);
    } catch (error) {
      console.error('Failed to load invites:', error);
    }
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" />
        <Text style={styles.loadingText}>{t('groups.loading')}</Text>
      </View>
    );
  }

  const isMember = session?.user?.id && members.some((m) => m.user_id === session.user.id);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
      <MemberList members={members} />
      {isMember && session?.user?.id && (
        <InviteSection
          groupId={groupId!}
          inviterId={session.user.id}
          pendingInvites={pendingInvites}
          onInvitesChanged={loadInvites}
        />
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
  },
  loadingText: {
    marginTop: 10,
    opacity: 0.6,
  },
});

