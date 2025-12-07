import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';

import {
  CreateGroupForm,
  EmptyGroupsState,
  GroupList,
  GroupsHeader,
} from '@/components/group';
import { Text, View } from '@/components/Themed';
import { useAuth } from '@/lib/auth-context';
import { supabase } from '@/lib/superbase';

interface Group {
  id: string;
  name: string;
  created_at: string;
  created_by: string | null;
}

export default function MyGroupsScreen() {
  const { t } = useTranslation();
  const { session } = useAuth();
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);

  useEffect(() => {
    if (session) {
      loadGroups();
    }
  }, [session]);

  const loadGroups = async () => {
    if (!session?.user?.id) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      console.log('Loading groups for user:', session.user.id);

      // First get the group IDs the user is a member of
      const { data: memberships, error: membershipError } = await supabase
        .from('group_members')
        .select('group_id')
        .eq('user_id', session.user.id);

      if (membershipError) {
        console.error('Error loading memberships:', membershipError);
        throw membershipError;
      }

      console.log('Memberships found:', memberships?.length || 0);

      if (!memberships || memberships.length === 0) {
        setGroups([]);
        setLoading(false);
        return;
      }

      // Then get the groups by their IDs
      const groupIds = memberships.map((m) => m.group_id);
      const { data: groupsData, error: groupsError } = await supabase
        .from('groups')
        .select('id, name, created_at, created_by')
        .in('id', groupIds);

      if (groupsError) {
        console.error('Error loading groups:', groupsError);
        throw groupsError;
      }

      console.log('Groups loaded:', groupsData?.length || 0);
      setGroups((groupsData || []) as Group[]);
    } catch (error: any) {
      console.error('Failed to load groups:', error);
      Alert.alert(t('common.error'), error.message || t('groups.failedToLoad'));
      setGroups([]);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateGroup = async (name: string) => {
    if (!session?.user?.id) {
      Alert.alert(t('common.error'), t('common.notAuthenticated'));
      throw new Error('Not authenticated');
    }

    setCreating(true);
    try {
      // Create the group - use a workaround to get the ID without triggering RLS recursion
      // Insert without select first, then query for the ID
      const { error: insertError } = await supabase
        .from('groups')
        .insert({
          name,
          created_by: session.user.id,
        });

      if (insertError) throw insertError;

      // Query for the group we just created (by name and creator)
      // This should work once RLS policies are fixed
      const { data: groupData, error: queryError } = await supabase
        .from('groups')
        .select('id')
        .eq('name', name)
        .eq('created_by', session.user.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (queryError || !groupData?.id) {
        throw new Error('Failed to retrieve created group ID');
      }

      // Add creator as a member
      const { error: memberError } = await supabase
        .from('group_members')
        .insert({
          group_id: groupData.id,
          user_id: session.user.id,
        });

      if (memberError) {
        // If member insert fails, try to delete the group to avoid orphaned groups
        await supabase.from('groups').delete().eq('id', groupData.id);
        throw memberError;
      }

      // Success - close form and reload groups
      setShowCreateForm(false);
      await loadGroups();
    } catch (error: any) {
      const errorMessage = error.message || t('groups.failedToCreate');
      Alert.alert(t('common.error'), errorMessage);
      // Re-throw so the form component knows there was an error
      throw error;
    } finally {
      setCreating(false);
    }
  };

  const handleGroupPress = (group: Group) => {
    // TODO: Navigate to group details
    console.log('Group pressed:', group);
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" />
        <Text style={styles.loadingText}>{t('groups.loading')}</Text>
      </View>
    );
  }

  if (groups.length === 0 && !showCreateForm) {
    return <EmptyGroupsState onCreatePress={() => setShowCreateForm(true)} />;
  }

  return (
    <View style={styles.container}>
      <GroupsHeader
        onCreatePress={() => setShowCreateForm(true)}
        showCreateButton={!showCreateForm}
      />

      {showCreateForm ? (
        <CreateGroupForm
          onSubmit={handleCreateGroup}
          onCancel={() => setShowCreateForm(false)}
          isSubmitting={creating}
        />
      ) : (
        <GroupList groups={groups} onGroupPress={handleGroupPress} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  loadingText: {
    marginTop: 10,
    opacity: 0.6,
  },
});
