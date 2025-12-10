import { useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { View as RNView, ScrollView, StyleSheet } from 'react-native';

import { InviteSection, MemberList, PubSessionsList, type GroupMember } from '@/components/group-detail';
import { Skeleton } from '@/components/ui/skeleton';
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
      <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
        {/* Members Section Skeleton */}
        <RNView style={styles.skeletonSection}>
          <Skeleton className="h-6 w-32 mb-4 rounded" />
          {[1, 2, 3].map((i) => (
            <RNView key={i} style={styles.skeletonMemberItem}>
              <Skeleton className="w-12 h-12 rounded-full" />
              <Skeleton className="h-5 flex-1 ml-4 rounded" />
            </RNView>
          ))}
        </RNView>

        {/* Pub Sessions Section Skeleton */}
        <RNView style={styles.skeletonSection}>
          <Skeleton className="h-6 w-48 mb-4 rounded" />
          <RNView style={styles.skeletonSessionCard}>
            <RNView style={styles.skeletonSessionHeader}>
              <Skeleton className="h-4 w-32 rounded" />
              <Skeleton className="h-3 w-20 rounded" />
            </RNView>
            <RNView style={styles.skeletonResponseButtons}>
              <Skeleton className="h-10 flex-1 rounded" />
              <Skeleton className="h-10 flex-1 rounded" />
            </RNView>
            <Skeleton className="h-4 w-24 mb-2 rounded" />
            {[1, 2].map((i) => (
              <RNView key={i} style={styles.skeletonMemberItem}>
                <Skeleton className="w-8 h-8 rounded-full" />
                <Skeleton className="h-4 flex-1 ml-3 rounded" />
              </RNView>
            ))}
          </RNView>
        </RNView>

        {/* Invite Section Skeleton */}
        <RNView style={styles.skeletonSection}>
          <Skeleton className="h-12 w-full mb-4 rounded" />
          <Skeleton className="h-4 w-40 rounded" />
        </RNView>
      </ScrollView>
    );
  }

  const isMember = session?.user?.id && members.some((m) => m.user_id === session.user.id);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
      <MemberList members={members} />
      {groupId && <PubSessionsList groupId={groupId} />}
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
  skeletonSection: {
    marginTop: 20,
  },
  skeletonMemberItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
  },
  skeletonSessionCard: {
    marginBottom: 16,
    padding: 16,
    borderRadius: 12,
  },
  skeletonSessionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  skeletonResponseButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 12,
    marginBottom: 12,
  },
});

