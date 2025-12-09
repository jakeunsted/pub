import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, FlatList, View as RNView, StyleSheet } from 'react-native';

import { Text, View } from '@/components/Themed';
import { Avatar } from '@/components/ui/avatar';
import { Button, ButtonText } from '@/components/ui/button';
import { useAuth } from '@/lib/auth-context';
import { supabase } from '@/lib/superbase';
import { type GroupMember } from './MemberItem';

interface PubSession {
  id: string;
  requested_by: string;
  requested_by_name: string | null;
  created_at: string;
  expires_at: string;
  acceptedMembers: GroupMember[];
  currentUserResponse: boolean | null; // null = pending, true = accepted, false = denied
}

interface PubSessionsListProps {
  groupId: string;
}

export function PubSessionsList({ groupId }: PubSessionsListProps) {
  const { t } = useTranslation();
  const { session } = useAuth();
  const [sessions, setSessions] = useState<PubSession[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPubSessions();

    // Set up real-time subscriptions
    const requestsSubscription = supabase
      .channel(`pub_requests_group_${groupId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'pub_requests',
          filter: `group_id=eq.${groupId}`,
        },
        () => {
          loadPubSessions();
        }
      )
      .subscribe();

    const responsesSubscription = supabase
      .channel(`pub_responses_group_${groupId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'pub_responses',
        },
        () => {
          loadPubSessions();
        }
      )
      .subscribe();

    return () => {
      requestsSubscription.unsubscribe();
      responsesSubscription.unsubscribe();
    };
  }, [groupId]);

  const loadPubSessions = async () => {
    try {
      setLoading(true);
      const now = new Date().toISOString();

      // Get active pub_requests for this group
      const { data: pubRequests, error: requestsError } = await supabase
        .from('pub_requests')
        .select('id, requested_by, created_at, expires_at')
        .eq('group_id', groupId)
        .gt('expires_at', now)
        .order('created_at', { ascending: false });

      if (requestsError) {
        console.error('Error loading pub requests:', requestsError);
        setSessions([]);
        return;
      }

      if (!pubRequests || pubRequests.length === 0) {
        setSessions([]);
        return;
      }

      // Fetch details for each request
      const sessionsWithMembers = await Promise.all(
        pubRequests.map(async (request) => {
          // Get requester name
          const { data: requesterData } = await supabase
            .from('profiles')
            .select('display_name')
            .eq('id', request.requested_by)
            .single();

          // Get all responses for this request (to find current user's response)
          const { data: allResponses } = await supabase
            .from('pub_responses')
            .select('user_id, response')
            .eq('request_id', request.id);

          // Get current user's response
          const currentUserResponse = session?.user?.id
            ? allResponses?.find((r) => r.user_id === session.user.id)?.response ?? null
            : null;

          // Get accepted responses
          const acceptedResponses = allResponses?.filter((r) => r.response === true) || [];

          if (acceptedResponses.length === 0) {
            return {
              id: request.id,
              requested_by: request.requested_by,
              requested_by_name: requesterData?.display_name || null,
              created_at: request.created_at,
              expires_at: request.expires_at,
              acceptedMembers: [],
              currentUserResponse,
            };
          }

          // Get profiles for accepted members (including requester who is auto-accepted)
          const userIds = [...acceptedResponses.map((r) => r.user_id), request.requested_by];
          const { data: profilesData } = await supabase
            .from('profiles')
            .select('id, display_name')
            .in('id', userIds);

          const profileMap = new Map(
            (profilesData || []).map((p) => [p.id, p.display_name])
          );

          // Map accepted members (including requester)
          const acceptedMembers: GroupMember[] = userIds.map((userId) => ({
            user_id: userId,
            display_name: profileMap.get(userId) || null,
          }));

          return {
            id: request.id,
            requested_by: request.requested_by,
            requested_by_name: requesterData?.display_name || null,
            created_at: request.created_at,
            expires_at: request.expires_at,
            acceptedMembers,
            currentUserResponse,
          };
        })
      );

      setSessions(sessionsWithMembers);
    } catch (error) {
      console.error('Failed to load pub sessions:', error);
      setSessions([]);
    } finally {
      setLoading(false);
    }
  };

  const handleRespond = async (requestId: string, response: boolean) => {
    if (!session?.user?.id) {
      Alert.alert(t('common.error'), t('common.notAuthenticated'));
      return;
    }

    try {
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

      // Reload sessions to show updated status
      loadPubSessions();
    } catch (error: any) {
      console.error('Failed to respond to request:', error);
      Alert.alert(t('common.error'), error.message || 'Failed to respond to request');
    }
  };

  if (loading) {
    return null;
  }

  if (sessions.length === 0) {
    return null;
  }

  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>🍺 {t('groups.activePubSessions')}</Text>
      {sessions.map((sessionItem) => {
        const canRespond = session?.user?.id && sessionItem.requested_by !== session.user.id;
        const hasResponded = sessionItem.currentUserResponse !== null;
        const currentResponse = sessionItem.currentUserResponse;

        return (
          <RNView key={sessionItem.id} style={styles.sessionCard}>
            <RNView style={styles.sessionHeader}>
              <Text style={styles.sessionRequestedBy}>
                {t('pub.requestedBy')}: {sessionItem.requested_by_name || 'Unknown'}
              </Text>
              <Text style={styles.sessionTime}>
                {new Date(sessionItem.created_at).toLocaleDateString()}
              </Text>
            </RNView>

            {/* Response buttons */}
            {canRespond && (
              <RNView style={styles.responseButtons}>
                <Button
                  variant={currentResponse === true ? 'solid' : 'outline'}
                  action="positive"
                  size="md"
                  onPress={() => handleRespond(sessionItem.id, true)}
                  style={styles.responseButton}
                >
                  <ButtonText>{t('pub.accept')}</ButtonText>
                </Button>
                <Button
                  variant={currentResponse === false ? 'solid' : 'outline'}
                  action="negative"
                  size="md"
                  onPress={() => handleRespond(sessionItem.id, false)}
                  style={styles.responseButton}
                >
                  <ButtonText>{t('pub.deny')}</ButtonText>
                </Button>
              </RNView>
            )}

            {sessionItem.acceptedMembers.length > 0 ? (
              <RNView style={styles.membersList}>
                <Text style={styles.membersLabel}>
                  {t('groups.agreed')} ({sessionItem.acceptedMembers.length}):
                </Text>
                <FlatList
                  data={sessionItem.acceptedMembers}
                  renderItem={({ item }) => (
                    <RNView style={styles.memberItem}>
                      <Avatar name={item.display_name || undefined} size="small" />
                      <Text style={styles.memberName}>
                        {item.display_name || 'Unknown User'}
                      </Text>
                    </RNView>
                  )}
                  keyExtractor={(item) => item.user_id}
                  scrollEnabled={false}
                />
              </RNView>
            ) : (
              <Text style={styles.noAgreementsYet}>{t('groups.noAgreementsYet')}</Text>
            )}
          </RNView>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    marginTop: 20,
    backgroundColor: 'transparent',
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 15,
  },
  sessionCard: {
    marginBottom: 16,
    padding: 16,
    borderRadius: 12,
  },
  sessionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sessionRequestedBy: {
    fontSize: 14,
    fontWeight: '500',
    flex: 1,
  },
  sessionTime: {
    fontSize: 12,
    opacity: 0.6,
  },
  membersList: {
    marginTop: 8,
  },
  membersLabel: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 8,
    opacity: 0.8,
  },
  memberItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingLeft: 4,
  },
  memberName: {
    fontSize: 16,
    marginLeft: 12,
  },
  noAgreementsYet: {
    fontSize: 14,
    opacity: 0.6,
    fontStyle: 'italic',
  },
  responseButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 12,
    marginBottom: 12,
  },
  responseButton: {
    flex: 1,
  },
});

