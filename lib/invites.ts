import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import { supabase } from './superbase';

const PENDING_INVITE_TOKEN_KEY = 'pending_group_invite_token';

// Use the same storage abstraction as supabase.ts
const storage = Platform.OS === 'web' ? {
  getItem: (key: string) => {
    if (typeof window !== 'undefined') {
      return Promise.resolve(window.localStorage.getItem(key));
    }
    return Promise.resolve(null);
  },
  setItem: (key: string, value: string) => {
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(key, value);
    }
    return Promise.resolve();
  },
  removeItem: (key: string) => {
    if (typeof window !== 'undefined') {
      window.localStorage.removeItem(key);
    }
    return Promise.resolve();
  },
} : AsyncStorage;

/**
 * Generates a UUID v4
 */
function generateUUID(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  // Fallback UUID v4 generator
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

export interface InviteData {
  id: string;
  group_id: string;
  invited_by: string;
  email: string;
  token: string;
  created_at: string;
  expires_at: string;
  accepted_at: string | null;
  accepted_by: string | null;
}

/**
 * Creates a new group invite
 */
export async function createInvite(
  groupId: string,
  email: string,
  inviterId: string
): Promise<{ invite: InviteData | null; error: Error | null }> {
  try {
    // Generate a unique token (UUID v4)
    const token = generateUUID();

    // Calculate expiration date (7 days from now)
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    // Create the invite record
    const { data, error } = await supabase
      .from('group_invites')
      .insert({
        group_id: groupId,
        invited_by: inviterId,
        email: email.toLowerCase().trim(),
        token,
        expires_at: expiresAt.toISOString(),
      })
      .select()
      .single();

    if (error) {
      return { invite: null, error: new Error(error.message) };
    }

    // Get group name for email
    const { data: groupData } = await supabase
      .from('groups')
      .select('name')
      .eq('id', groupId)
      .single();

    // Get inviter name for email
    const { data: inviterData } = await supabase
      .from('profiles')
      .select('display_name')
      .eq('id', inviterId)
      .single();

    // Send invite email
    await sendInviteEmail(
      email,
      token,
      groupData?.name || 'a group',
      inviterData?.display_name || 'Someone'
    );

    return { invite: data as InviteData, error: null };
  } catch (error: any) {
    return { invite: null, error: error instanceof Error ? error : new Error(String(error)) };
  }
}

/**
 * Gets the base web URL for invite links
 */
function getInviteBaseUrl(): string {
  // Use environment variable if set, otherwise construct from current context
  if (process.env.EXPO_PUBLIC_APP_URL) {
    return process.env.EXPO_PUBLIC_APP_URL;
  }

  // If on web, use current origin
  if (Platform.OS === 'web' && typeof window !== 'undefined') {
    return window.location.origin;
  }

  // Fallback for native or server-side (should be set via env var in production)
  return 'https://your-app-domain.com'; // TODO: Replace with actual production domain
}

/**
 * Sends an invite email using Supabase
 */
async function sendInviteEmail(
  email: string,
  token: string,
  groupName: string,
  inviterName: string
): Promise<void> {
  try {
    // Construct the web invite URL that will handle device detection and redirects
    const baseUrl = getInviteBaseUrl();
    const inviteUrl = `${baseUrl}/invite/${token}`;

    // Use Supabase's email functionality
    // Note: This requires Supabase Edge Function or email template configuration
    // For now, we'll use a simple approach with Supabase's built-in email
    const { error } = await supabase.functions.invoke('send-invite-email', {
      body: {
        email,
        token,
        groupName,
        inviterName,
        inviteUrl,
      },
    });

    // If edge function doesn't exist, log for manual email sending
    if (error) {
      console.log('Email sending not configured. Invite token:', token);
      console.log('Invite URL:', inviteUrl);
      // In production, you'd want to set up the edge function or use a service like Resend
    }
  } catch (error) {
    console.error('Error sending invite email:', error);
    // Don't throw - invite creation should still succeed even if email fails
  }
}

/**
 * Gets an invite by token
 */
export async function getInviteByToken(token: string): Promise<{ invite: InviteData | null; error: Error | null }> {
  try {
    const { data, error } = await supabase
      .from('group_invites')
      .select('*')
      .eq('token', token)
      .single();

    if (error) {
      return { invite: null, error: new Error(error.message) };
    }

    // Check if invite is expired
    if (data && new Date(data.expires_at) < new Date()) {
      return { invite: null, error: new Error('Invite has expired') };
    }

    // Check if invite is already accepted
    if (data && data.accepted_at) {
      return { invite: null, error: new Error('Invite has already been accepted') };
    }

    return { invite: data as InviteData, error: null };
  } catch (error: any) {
    return { invite: null, error: error instanceof Error ? error : new Error(String(error)) };
  }
}

/**
 * Accepts an invite and adds the user to the group
 */
export async function acceptInvite(token: string, userId: string): Promise<{ success: boolean; error: Error | null }> {
  try {
    // Get the invite
    const { invite, error: inviteError } = await getInviteByToken(token);
    if (inviteError || !invite) {
      return { success: false, error: inviteError || new Error('Invite not found') };
    }

    // Check if user is already a member
    const { data: existingMember } = await supabase
      .from('group_members')
      .select('id')
      .eq('group_id', invite.group_id)
      .eq('user_id', userId)
      .maybeSingle();

    if (existingMember) {
      // User is already a member, mark invite as accepted anyway
      await supabase
        .from('group_invites')
        .update({
          accepted_at: new Date().toISOString(),
          accepted_by: userId,
        })
        .eq('token', token);
      return { success: true, error: null };
    }

    // Add user to group
    const { error: memberError } = await supabase
      .from('group_members')
      .insert({
        group_id: invite.group_id,
        user_id: userId,
      });

    if (memberError) {
      return { success: false, error: new Error(memberError.message) };
    }

    // Mark invite as accepted
    const { error: updateError } = await supabase
      .from('group_invites')
      .update({
        accepted_at: new Date().toISOString(),
        accepted_by: userId,
      })
      .eq('token', token);

    if (updateError) {
      console.error('Error updating invite:', updateError);
      // Don't fail the whole operation if this fails
    }

    return { success: true, error: null };
  } catch (error: any) {
    return { success: false, error: error instanceof Error ? error : new Error(String(error)) };
  }
}

/**
 * Stores a pending invite token for later processing
 */
export async function storePendingInviteToken(token: string): Promise<void> {
  await storage.setItem(PENDING_INVITE_TOKEN_KEY, token);
}

/**
 * Gets and clears a pending invite token
 */
export async function getAndClearPendingInviteToken(): Promise<string | null> {
  const token = await storage.getItem(PENDING_INVITE_TOKEN_KEY);
  if (token) {
    await storage.removeItem(PENDING_INVITE_TOKEN_KEY);
  }
  return token;
}

/**
 * Gets pending invite token without clearing it
 */
export async function getPendingInviteToken(): Promise<string | null> {
  return await storage.getItem(PENDING_INVITE_TOKEN_KEY);
}

/**
 * Gets all pending invites for a group
 */
export async function getGroupInvites(groupId: string): Promise<{ invites: InviteData[]; error: Error | null }> {
  try {
    const { data, error } = await supabase
      .from('group_invites')
      .select('*')
      .eq('group_id', groupId)
      .is('accepted_at', null)
      .order('created_at', { ascending: false });

    if (error) {
      return { invites: [], error: new Error(error.message) };
    }

    return { invites: (data || []) as InviteData[], error: null };
  } catch (error: any) {
    return { invites: [], error: error instanceof Error ? error : new Error(String(error)) };
  }
}

/**
 * Cancels a pending invite
 */
export async function cancelInvite(inviteId: string): Promise<{ success: boolean; error: Error | null }> {
  try {
    const { error } = await supabase
      .from('group_invites')
      .delete()
      .eq('id', inviteId)
      .is('accepted_at', null);

    if (error) {
      return { success: false, error: new Error(error.message) };
    }

    return { success: true, error: null };
  } catch (error: any) {
    return { success: false, error: error instanceof Error ? error : new Error(String(error)) };
  }
}

/**
 * Resends an invite email
 */
export async function resendInviteEmail(invite: InviteData): Promise<{ success: boolean; error: Error | null }> {
  try {
    // Check if invite is expired
    if (new Date(invite.expires_at) < new Date()) {
      return { success: false, error: new Error('Invite has expired') };
    }

    // Check if invite is already accepted
    if (invite.accepted_at) {
      return { success: false, error: new Error('Invite has already been accepted') };
    }

    // Get group name
    const { data: groupData } = await supabase
      .from('groups')
      .select('name')
      .eq('id', invite.group_id)
      .single();

    // Get inviter name
    const { data: inviterData } = await supabase
      .from('profiles')
      .select('display_name')
      .eq('id', invite.invited_by)
      .single();

    // Construct the web invite URL
    const baseUrl = getInviteBaseUrl();
    const inviteUrl = `${baseUrl}/invite/${invite.token}`;

    // Send invite email
    await sendInviteEmail(
      invite.email,
      invite.token,
      groupData?.name || 'a group',
      inviterData?.display_name || 'Someone'
    );

    return { success: true, error: null };
  } catch (error: any) {
    return { success: false, error: error instanceof Error ? error : new Error(String(error)) };
  }
}

