import { Session } from '@supabase/supabase-js';
import React, { createContext, useContext, useEffect, useState } from 'react';

import { acceptInvite, getAndClearPendingInviteToken } from './invites';
import { cleanupPushNotifications, initializePushNotifications } from './push-notifications';
import { supabase } from './superbase';

interface AuthContextType {
  session: Session | null;
  loading: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);

      // Initialize push notifications if user is already logged in
      if (session?.user?.id) {
        // Check if push notifications are enabled before initializing
        supabase
          .from('profiles')
          .select('push_notifications_enabled')
          .eq('id', session.user.id)
          .single()
          .then(({ data }) => {
            if (data?.push_notifications_enabled !== false) {
              // Initialize push notifications if enabled (default is true)
              initializePushNotifications(session.user.id).catch((error) => {
                console.error('Error initializing push notifications:', error);
              });
            }
          })
          .catch((error) => {
            console.error('Error checking push notification preference:', error);
            // Default to initializing if we can't check preference
            initializePushNotifications(session.user.id).catch((err) => {
              console.error('Error initializing push notifications:', err);
            });
          });
      }
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      const previousSession = session;
      setSession(session);
      setLoading(false);

      // Handle push notifications
      if (session?.user?.id) {
        // Check if push notifications are enabled before initializing
        supabase
          .from('profiles')
          .select('push_notifications_enabled')
          .eq('id', session.user.id)
          .single()
          .then(({ data }) => {
            if (data?.push_notifications_enabled !== false) {
              // Initialize push notifications if enabled (default is true)
              initializePushNotifications(session.user.id).catch((error) => {
                console.error('Error initializing push notifications:', error);
              });
            }
          })
          .catch((error) => {
            console.error('Error checking push notification preference:', error);
            // Default to initializing if we can't check preference
            initializePushNotifications(session.user.id).catch((err) => {
              console.error('Error initializing push notifications:', err);
            });
          });
      } else if (previousSession?.user?.id) {
        // Clean up push notifications when user logs out
        cleanupPushNotifications(previousSession.user.id).catch((error) => {
          console.error('Error cleaning up push notifications:', error);
        });
      }

      // Check for pending invite when user logs in
      if (session?.user?.id) {
        const pendingToken = await getAndClearPendingInviteToken();
        if (pendingToken) {
          // Silently accept the invite in the background
          acceptInvite(pendingToken, session.user.id).catch((error) => {
            console.error('Error accepting pending invite:', error);
          });
        }
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const signOut = async () => {
    // Clean up push notifications before signing out
    if (session?.user?.id) {
      await cleanupPushNotifications(session.user.id).catch((error) => {
        console.error('Error cleaning up push notifications:', error);
      });
    }
    await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider value={{ session, loading, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

