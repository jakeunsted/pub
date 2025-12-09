import { useEffect, useState } from 'react';

import { useAuth } from '@/lib/auth-context';
import { supabase } from '@/lib/superbase';

export function usePendingRequestCount(refreshTrigger?: number): number {
  const { session } = useAuth();
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!session?.user?.id) {
      setCount(0);
      return;
    }

    const loadPendingCount = async () => {
      try {
        // Get all group IDs the user is a member of
        const { data: memberships } = await supabase
          .from('group_members')
          .select('group_id')
          .eq('user_id', session.user.id);

        if (!memberships || memberships.length === 0) {
          setCount(0);
          return;
        }

        const groupIds = memberships.map((m) => m.group_id);
        const now = new Date().toISOString();

        // Get active pub_requests for these groups (excluding requests made by the user)
        const { data: pubRequests } = await supabase
          .from('pub_requests')
          .select('id')
          .in('group_id', groupIds)
          .gt('expires_at', now)
          .neq('requested_by', session.user.id);

        if (!pubRequests || pubRequests.length === 0) {
          setCount(0);
          return;
        }

        const requestIds = pubRequests.map((r) => r.id);

        // Get all responses for these requests by the current user
        const { data: responses } = await supabase
          .from('pub_responses')
          .select('request_id')
          .in('request_id', requestIds)
          .eq('user_id', session.user.id);

        const respondedRequestIds = new Set((responses || []).map((r) => r.request_id));

        // Count requests where user hasn't responded
        const pendingCount = pubRequests.filter((r) => !respondedRequestIds.has(r.id)).length;

        setCount(pendingCount);
      } catch (error) {
        console.error('Failed to load pending request count:', error);
        setCount(0);
      }
    };

    loadPendingCount();

    // Set up real-time subscriptions
    const requestsSubscription = supabase
      .channel('pub_requests_count_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'pub_requests',
        },
        () => {
          loadPendingCount();
        }
      )
      .subscribe();

    const responsesSubscription = supabase
      .channel('pub_responses_count_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'pub_responses',
        },
        () => {
          loadPendingCount();
        }
      )
      .subscribe();

    return () => {
      requestsSubscription.unsubscribe();
      responsesSubscription.unsubscribe();
    };
  }, [session, refreshTrigger]);

  return count;
}

