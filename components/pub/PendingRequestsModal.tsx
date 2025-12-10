import FontAwesome from '@expo/vector-icons/FontAwesome';
import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Alert, Pressable, Text as RNText, View as RNView, ScrollView, StyleSheet } from 'react-native';

import { Text, useThemeColor } from '@/components/Themed';
import { Avatar } from '@/components/ui/avatar';
import { Button, ButtonText } from '@/components/ui/button';
import { useAuth } from '@/lib/auth-context';
import { supabase } from '@/lib/superbase';

interface MemberResponse {
  user_id: string;
  display_name: string | null;
  status: 'pending' | 'accepted' | 'denied';
}

interface PubRequestWithDetails {
  id: string;
  group_id: string;
  group_name: string;
  requested_by: string;
  requested_by_name: string | null;
  created_at: string;
  expires_at: string;
  members: MemberResponse[];
}

interface PendingRequestsModalProps {
  refreshTrigger?: number;
}

export default function PendingRequestsModal({ refreshTrigger }: PendingRequestsModalProps) {
  const { t } = useTranslation();
  const { session } = useAuth();
  const [requests, setRequests] = useState<PubRequestWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [isExpanded, setIsExpanded] = useState(false);
  const [respondingToRequestId, setRespondingToRequestId] = useState<string | null>(null);

  useEffect(() => {
    if (session) {
      loadPendingRequests();

      // Set up real-time subscriptions
      const requestsSubscription = supabase
        .channel('pub_requests_changes')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'pub_requests',
          },
          () => {
            loadPendingRequests();
          }
        )
        .subscribe();

      const responsesSubscription = supabase
        .channel('pub_responses_changes')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'pub_responses',
          },
          () => {
            loadPendingRequests();
          }
        )
        .subscribe();

      return () => {
        requestsSubscription.unsubscribe();
        responsesSubscription.unsubscribe();
      };
    }
  }, [session, refreshTrigger]);

  const loadPendingRequests = async (showLoading = true) => {
    if (!session?.user?.id) {
      setLoading(false);
      return;
    }

    try {
      if (showLoading) {
        setLoading(true);
      }

      // Get all group IDs the user is a member of
      const { data: memberships, error: membershipError } = await supabase
        .from('group_members')
        .select('group_id')
        .eq('user_id', session.user.id);

      if (membershipError) {
        console.error('Error loading memberships:', membershipError);
        setLoading(false);
        return;
      }

      if (!memberships || memberships.length === 0) {
        setRequests([]);
        setLoading(false);
        return;
      }

      const groupIds = memberships.map((m) => m.group_id);
      const now = new Date().toISOString();

      // Get active pub_requests for these groups
      const { data: pubRequests, error: requestsError } = await supabase
        .from('pub_requests')
        .select('id, group_id, requested_by, created_at, expires_at')
        .in('group_id', groupIds)
        .gt('expires_at', now)
        .order('created_at', { ascending: false });

      if (requestsError) {
        console.error('Error loading pub requests:', requestsError);
        setLoading(false);
        return;
      }

      if (!pubRequests || pubRequests.length === 0) {
        setRequests([]);
        setLoading(false);
        return;
      }

      // Fetch details for each request
      const requestsWithDetails = await Promise.all(
        pubRequests.map(async (request) => {
          // Get group name
          const { data: groupData } = await supabase
            .from('groups')
            .select('name')
            .eq('id', request.group_id)
            .single();

          // Get requester name
          const { data: requesterData } = await supabase
            .from('profiles')
            .select('display_name')
            .eq('id', request.requested_by)
            .single();

          // Get all group members
          const { data: memberData } = await supabase
            .from('group_members')
            .select('user_id')
            .eq('group_id', request.group_id);

          if (!memberData || memberData.length === 0) {
            return {
              id: request.id,
              group_id: request.group_id,
              group_name: groupData?.name || 'Unknown Group',
              requested_by: request.requested_by,
              requested_by_name: requesterData?.display_name || null,
              created_at: request.created_at,
              expires_at: request.expires_at,
              members: [],
            };
          }

          // Get all responses for this request
          const { data: responsesData } = await supabase
            .from('pub_responses')
            .select('user_id, response')
            .eq('request_id', request.id);

          const responseMap = new Map(
            (responsesData || []).map((r) => [r.user_id, r.response])
          );

          // Get profiles for all members
          const userIds = memberData.map((m) => m.user_id);
          const { data: profilesData } = await supabase
            .from('profiles')
            .select('id, display_name')
            .in('id', userIds);

          const profileMap = new Map(
            (profilesData || []).map((p) => [p.id, p.display_name])
          );

          // Map members with their response status
          // Requester always shows as accepted
          const members: MemberResponse[] = memberData.map((member) => {
            // If this is the requester, always show as accepted
            if (member.user_id === request.requested_by) {
              return {
                user_id: member.user_id,
                display_name: profileMap.get(member.user_id) || null,
                status: 'accepted' as const,
              };
            }

            const response = responseMap.get(member.user_id);
            let status: 'pending' | 'accepted' | 'denied';
            if (response === undefined) {
              status = 'pending';
            } else if (response === true) {
              status = 'accepted';
            } else {
              status = 'denied';
            }

            return {
              user_id: member.user_id,
              display_name: profileMap.get(member.user_id) || null,
              status,
            };
          });

          return {
            id: request.id,
            group_id: request.group_id,
            group_name: groupData?.name || 'Unknown Group',
            requested_by: request.requested_by,
            requested_by_name: requesterData?.display_name || null,
            created_at: request.created_at,
            expires_at: request.expires_at,
            members,
          };
        })
      );

      setRequests(requestsWithDetails);
    } catch (error: any) {
      console.error('Failed to load pending requests:', error);
    } finally {
      if (showLoading) {
        setLoading(false);
      }
    }
  };

  const formatTimeRemaining = (expiresAt: string): string => {
    const now = new Date();
    const expiry = new Date(expiresAt);
    const diffMs = expiry.getTime() - now.getTime();

    if (diffMs <= 0) {
      return t('pub.expired');
    }

    const hours = Math.floor(diffMs / (1000 * 60 * 60));
    const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));

    let timeStr: string;
    if (hours > 0) {
      timeStr = `${hours}h ${minutes}m`;
    } else {
      timeStr = `${minutes}m`;
    }

    // Format directly with the time string
    return `Expires in ${timeStr}`;
  };

  const getStatusColor = (status: 'pending' | 'accepted' | 'denied'): string => {
    switch (status) {
      case 'accepted':
        return '#4CAF50';
      case 'denied':
        return '#F44336';
      case 'pending':
      default:
        return '#FF9800';
    }
  };

  const toggleExpand = () => {
    setIsExpanded(!isExpanded);
  };

  const handleRespond = async (requestId: string, response: boolean) => {
    if (!session?.user?.id) {
      Alert.alert(t('common.error'), t('common.notAuthenticated'));
      return;
    }

    // Prevent multiple simultaneous responses to the same request
    if (respondingToRequestId === requestId) {
      return;
    }

    try {
      setRespondingToRequestId(requestId);

      // Optimistically update the UI
      setRequests((prevRequests) =>
        prevRequests.map((req) => {
          if (req.id !== requestId) return req;

          const updatedMembers = req.members.map((member) => {
            if (member.user_id === session.user.id) {
              return {
                ...member,
                status: response ? 'accepted' : 'denied' as 'accepted' | 'denied',
              };
            }
            return member;
          });

          return {
            ...req,
            members: updatedMembers,
          };
        }) as typeof prevRequests
      );

      // Check if response already exists
      const { data: existingResponse } = await supabase
        .from('pub_responses')
        .select('id')
        .eq('request_id', requestId)
        .eq('user_id', session.user.id)
        .single();

      if (existingResponse) {
        // Update existing response
        const { error } = await supabase
          .from('pub_responses')
          .update({
            response,
            responded_at: new Date().toISOString(),
          })
          .eq('id', existingResponse.id);

        if (error) throw error;
      } else {
        // Create new response
        const { error } = await supabase
          .from('pub_responses')
          .insert({
            request_id: requestId,
            user_id: session.user.id,
            response,
            responded_at: new Date().toISOString(),
          });

        if (error) throw error;
      }

      // Reload requests to show updated status
      await loadPendingRequests(false);
    } catch (error: any) {
      console.error('Failed to respond to request:', error);
      // Revert optimistic update on error
      await loadPendingRequests(false);
      Alert.alert(t('common.error'), error.message || 'Failed to respond to request');
    } finally {
      setRespondingToRequestId(null);
    }
  };

  // All hooks must be called before any conditional returns
  const backgroundColor = useThemeColor(
    { light: '#fff', dark: '#121212' },
    'background'
  );
  const cardBackgroundColor = useThemeColor(
    { light: '#f8f9fa', dark: '#1a1a1a' },
    'background'
  );
  const requestCardBackgroundColor = useThemeColor(
    { light: '#ffffff', dark: '#242424' },
    'background'
  );
  const textColor = useThemeColor({}, 'text');
  const borderColor = useThemeColor(
    { light: 'rgba(0, 0, 0, 0.1)', dark: 'rgba(255, 255, 255, 0.1)' },
    'tabIconDefault'
  );

  // Don't show if no requests (but allow showing during response loading)
  if ((loading && requests.length === 0) || (!loading && requests.length === 0)) {
    return null;
  }

  return (
    <RNView style={styles.wrapper}>
      <RNView style={[styles.card, { backgroundColor: cardBackgroundColor }]}>
        {/* Collapsed Header */}
        <Pressable onPress={toggleExpand} style={styles.header}>
          <RNView style={styles.headerContent}>
            <Text style={[styles.headerTitle, { color: textColor }]}>
              {t('pub.pendingRequests')}
            </Text>
            <RNText style={[styles.requestCount, { color: textColor }]}>
              {requests.length} {requests.length === 1 ? 'request' : 'requests'}
            </RNText>
          </RNView>
          <FontAwesome
            name={isExpanded ? 'chevron-up' : 'chevron-down'}
            size={16}
            color={textColor}
            style={styles.chevron}
          />
        </Pressable>

        {/* Expanded Content */}
        {isExpanded && (
          <ScrollView style={styles.expandedContent} showsVerticalScrollIndicator>
            {requests.map((request) => {
              const currentUserResponse = request.members.find(
                (m) => m.user_id === session?.user?.id
              );
              // Show buttons if user hasn't responded OR if they're not the requester
              const canRespond = session?.user?.id && request.requested_by !== session.user.id;
              const currentResponse = currentUserResponse?.status === 'accepted' ? true : currentUserResponse?.status === 'denied' ? false : null;

              return (
                <RNView key={request.id} style={[styles.requestCard, { backgroundColor: requestCardBackgroundColor }]}>
                  <RNView style={styles.requestHeader}>
                    <Text style={[styles.groupName, { color: textColor }]}>
                      {request.group_name}
                    </Text>
                    <Text style={[styles.timeRemaining, { color: textColor }]}>
                      {formatTimeRemaining(request.expires_at)}
                    </Text>
                  </RNView>
                  <Text style={[styles.requestedBy, { color: textColor }]}>
                    {t('pub.requestedBy')}: {request.requested_by_name || 'Unknown'}
                  </Text>

                  {/* Accept/Deny Buttons for current user (can change response) */}
                  {canRespond && (
                    <RNView style={styles.responseButtons}>
                      <Button
                        variant={currentResponse === true ? 'solid' : 'outline'}
                        action="positive"
                        size="md"
                        onPress={() => handleRespond(request.id, true)}
                        style={styles.responseButton}
                        disabled={respondingToRequestId === request.id}
                      >
                        <ButtonText>{t('pub.accept')}</ButtonText>
                      </Button>
                      <Button
                        variant={currentResponse === false ? 'solid' : 'outline'}
                        action="negative"
                        size="md"
                        onPress={() => handleRespond(request.id, false)}
                        style={styles.responseButton}
                        disabled={respondingToRequestId === request.id}
                      >
                        <ButtonText>{t('pub.deny')}</ButtonText>
                      </Button>
                    </RNView>
                  )}

                  <RNView style={styles.membersSection}>
                    <Text style={[styles.membersTitle, { color: textColor }]}>
                      Members ({request.members.length})
                    </Text>
                    {request.members.map((member) => {
                      const isUpdating = respondingToRequestId === request.id && member.user_id === session?.user?.id;
                      return (
                        <RNView key={member.user_id} style={styles.memberRow}>
                          <RNView style={styles.memberInfo}>
                            <Avatar name={member.display_name || undefined} size="small" />
                            <Text style={[styles.memberName, { color: textColor }]} numberOfLines={1}>
                              {member.display_name || 'Unknown User'}
                            </Text>
                          </RNView>
                          <RNView
                            style={[
                              styles.statusBadge,
                              { backgroundColor: getStatusColor(member.status) },
                            ]}
                          >
                            {isUpdating ? (
                              <RNView style={styles.statusLoadingContainer}>
                                <ActivityIndicator size="small" color="#fff" />
                                <Text style={styles.statusText}>
                                  {t(`pub.memberStatus.${member.status}`)}
                                </Text>
                              </RNView>
                            ) : (
                              <Text style={styles.statusText}>
                                {t(`pub.memberStatus.${member.status}`)}
                              </Text>
                            )}
                          </RNView>
                        </RNView>
                      );
                    })}
                  </RNView>
                </RNView>
              );
            })}
          </ScrollView>
        )}
      </RNView>
    </RNView>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  card: {
    borderRadius: 16,
    padding: 0,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 8,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
  },
  chevron: {
    marginLeft: 8,
  },
  headerContent: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 4,
  },
  requestCount: {
    fontSize: 14,
    opacity: 0.7,
  },
  expandedContent: {
    maxHeight: 500,
    paddingHorizontal: 4,
    paddingBottom: 16,
  },
  requestCard: {
    marginBottom: 16,
    marginHorizontal: 4,
    padding: 16,
    borderRadius: 12,
  },
  responseButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 16,
    marginBottom: 16,
  },
  responseButton: {
    flex: 1,
  },
  requestHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  groupName: {
    fontSize: 20,
    fontWeight: '600',
  },
  timeRemaining: {
    fontSize: 14,
    opacity: 0.7,
  },
  requestedBy: {
    fontSize: 14,
    opacity: 0.7,
    marginBottom: 16,
  },
  membersSection: {
    marginTop: 8,
  },
  membersTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  memberRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    marginBottom: 8,
    borderRadius: 8,
  },
  memberInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    minWidth: 0,
    marginRight: 12,
  },
  memberName: {
    fontSize: 16,
    marginLeft: 12,
    flexShrink: 1,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    flexShrink: 0,
  },
  statusText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  statusLoadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
});

