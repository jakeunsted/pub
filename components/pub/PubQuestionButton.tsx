import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, Modal, Pressable, Text as RNText, View as RNView, ScrollView, StyleSheet } from 'react-native';

import { Text, View, useThemeColor } from '@/components/Themed';
import { Avatar } from '@/components/ui/avatar';
import { Button, ButtonText } from '@/components/ui/button';
import { useAuth } from '@/lib/auth-context';
import { supabase } from '@/lib/superbase';
import PubPintButton from './PubPintButton';

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

interface PubQuestionButtonProps {
  onQuestionSent?: (groupId: string, groupName: string) => void;
}

export default function PubQuestionButton({ onQuestionSent }: PubQuestionButtonProps) {
  const { t } = useTranslation();
  const { session } = useAuth();
  const [groups, setGroups] = useState<Group[]>([]);
  const [showDialog, setShowDialog] = useState(false);
  const [status, setStatus] = useState<'idle' | 'cheer'>('idle');

  useEffect(() => {
    if (showDialog && session) {
      loadGroups();
    }
  }, [showDialog, session]);

  const loadGroups = async () => {
    if (!session?.user?.id) {
      return;
    }

    try {
      // First get the group IDs the user is a member of
      const { data: memberships, error: membershipError } = await supabase
        .from('group_members')
        .select('group_id')
        .eq('user_id', session.user.id);

      if (membershipError) {
        console.error('Error loading memberships:', membershipError);
        return;
      }

      if (!memberships || memberships.length === 0) {
        setGroups([]);
        return;
      }

      // Then get the groups by their IDs
      const groupIds = memberships.map((m) => m.group_id);
      const { data: groupsData, error: groupsError } = await supabase
        .from('groups')
        .select('id, name, created_at, created_by')
        .in('id', groupIds)
        .order('name', { ascending: true });

      if (groupsError) {
        console.error('Error loading groups:', groupsError);
        return;
      }

      // Fetch members for each group
      const groupsWithMembers = await Promise.all(
        (groupsData || []).map(async (group) => {
          const { data: memberData, error: memberError } = await supabase
            .from('group_members')
            .select('user_id')
            .eq('group_id', group.id);

          if (memberError) {
            console.error('Error loading members for group:', group.id, memberError);
            return { ...group, members: [] };
          }

          if (!memberData || memberData.length === 0) {
            return { ...group, members: [] };
          }

          // Fetch profiles for all members
          const userIds = memberData.map((m) => m.user_id);
          const { data: profilesData, error: profilesError } = await supabase
            .from('profiles')
            .select('id, display_name')
            .in('id', userIds);

          if (profilesError) {
            console.error('Error loading profiles:', profilesError);
            return { ...group, members: [] };
          }

          // Map user_ids to display names
          const profileMap = new Map(
            (profilesData || []).map((p) => [p.id, p.display_name])
          );

          const members: GroupMember[] = memberData.map((member) => ({
            user_id: member.user_id,
            display_name: profileMap.get(member.user_id) || null,
          }));

          return { ...group, members };
        })
      );

      setGroups(groupsWithMembers as Group[]);
    } catch (error: any) {
      console.error('Failed to load groups:', error);
    }
  };

  const handleButtonPress = () => {
    if (!session) {
      Alert.alert(t('common.error'), t('common.notAuthenticated'));
      return;
    }
    setShowDialog(true);
  };

  const handleSelectGroup = async (group: Group) => {
    if (!session?.user?.id) {
      Alert.alert(t('common.error'), t('common.notAuthenticated'));
      return;
    }

    setShowDialog(false);
    setStatus('cheer');

    try {
      // Check if there's already an active request for this group
      const now = new Date().toISOString();
      const { data: existingRequests, error: checkError } = await supabase
        .from('pub_requests')
        .select('id')
        .eq('group_id', group.id)
        .gt('expires_at', now);

      if (checkError) {
        throw new Error(checkError.message || 'Failed to check existing requests');
      }

      if (existingRequests && existingRequests.length > 0) {
        Alert.alert(
          t('pub.requestAlreadyExists'),
          t('pub.groupHasActiveRequest')
        );
        setStatus('idle');
        return;
      }

      // Calculate expiration time (12 hours from now)
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + 12);

      // Create pub_request record
      const { data: pubRequest, error: requestError } = await supabase
        .from('pub_requests')
        .insert({
          group_id: group.id,
          requested_by: session.user.id,
          expires_at: expiresAt.toISOString(),
        })
        .select()
        .single();

      if (requestError) {
        throw new Error(requestError.message || 'Failed to create pub request');
      }

      // Get requester's display name for notifications
      const { data: requesterProfile } = await supabase
        .from('profiles')
        .select('display_name')
        .eq('id', session.user.id)
        .single();

      const requesterName = requesterProfile?.display_name || 'Someone';

      // Send notifications to group members (don't block on errors)
      try {
        await supabase.functions.invoke('send-pub-request-notifications', {
          body: {
            requestId: pubRequest.id,
            groupId: group.id,
            requestedBy: session.user.id,
            groupName: group.name,
            requesterName,
          },
        });
      } catch (notificationError) {
        // Log but don't fail the request creation
        console.error('Failed to send notifications:', notificationError);
      }

      // Request created successfully, animation will complete naturally
      onQuestionSent?.(group.id, group.name);
      setStatus('idle');
    } catch (error: any) {
      console.error('Failed to send pub question:', error);
      Alert.alert(t('common.error'), error.message || 'Failed to send pub question');
      setStatus('idle');
    }
  };

  const handleCloseDialog = () => {
    setShowDialog(false);
  };

  const groupButtonBg = useThemeColor(
    { light: 'rgba(0, 0, 0, 0.03)', dark: 'rgba(255, 255, 255, 0.05)' },
    'background'
  );
  const groupButtonTextColor = useThemeColor({}, 'text');

  return (
    <>
      <PubPintButton status={status} onPress={handleButtonPress} />

      <Modal
        visible={showDialog}
        transparent
        animationType="slide"
        onRequestClose={handleCloseDialog}
      >
        <RNView style={styles.modalOverlay}>
          <Pressable style={styles.modalOverlayPressable} onPress={handleCloseDialog} />
          <View style={styles.modalContent} lightColor="#fff" darkColor="#121212">
            <Text style={styles.modalTitle}>{t('pub.selectGroup')}</Text>
            <Text style={styles.modalSubtitle}>
              {t('pub.chooseGroupToSendPubQuestion')}
            </Text>

            {groups.length === 0 ? (
              <View style={styles.emptyState}>
                <Text style={styles.emptyText}>{t('pub.noGroupsAvailable')}</Text>
                <Text style={styles.emptySubtext}>
                  {t('pub.createGroupFirst')}
                </Text>
              </View>
            ) : (
              <ScrollView
                style={styles.groupsScrollView}
                contentContainerStyle={styles.groupsListContent}
                showsVerticalScrollIndicator={true}
              >
                {groups.map((group) => (
                  <Button
                    key={group.id}
                    style={[styles.groupButton, { backgroundColor: groupButtonBg }]}
                    variant="solid"
                    action="default"
                    onPress={() => handleSelectGroup(group)}
                    size="lg"
                  >
                    <RNView style={styles.groupButtonContent}>
                      <RNView style={styles.groupButtonHeader}>
                        <ButtonText style={[styles.groupButtonText, { color: groupButtonTextColor }]}>
                          {group.name}
                        </ButtonText>
                      </RNView>
                      {group.members && group.members.length > 0 && (
                        <RNView style={styles.membersContainer}>
                          {group.members.slice(0, 5).map((member, index) => (
                            <RNView
                              key={member.user_id}
                              style={[
                                styles.avatarWrapper,
                                index > 0 && styles.avatarOverlap,
                              ]}
                            >
                              <Avatar name={member.display_name || undefined} size="small" />
                            </RNView>
                          ))}
                          {group.members.length > 5 && (
                            <RNView style={[styles.avatarWrapper, styles.avatarOverlap, styles.moreAvatars]}>
                              <RNText style={styles.moreAvatarsText}>+{group.members.length - 5}</RNText>
                            </RNView>
                          )}
                        </RNView>
                      )}
                    </RNView>
                  </Button>
                ))}
              </ScrollView>
            )}
          </View>
        </RNView>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalOverlayPressable: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: '80%',
    minHeight: '60%',
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  modalSubtitle: {
    fontSize: 14,
    marginBottom: 20,
  },
  groupsScrollView: {
    flex: 1,
    maxHeight: '70%',
  },
  groupsListContent: {
    paddingBottom: 20,
    gap: 12,
  },
  groupButton: {
    marginBottom: 12,
    minHeight: 82,
    borderRadius: 20,
    width: '100%',
  },
  groupButtonContent: {
    width: '100%',
    alignItems: 'flex-start',
  },
  groupButtonHeader: {
    width: '100%',
    marginBottom: 8,
  },
  groupButtonText: {
    fontSize: 18,
    fontWeight: '600',
  },
  membersContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
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
    backgroundColor: '#f5f5f5',
  },
  moreAvatarsText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#666',
  },
  emptyState: {
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    textAlign: 'center',
  },
});

