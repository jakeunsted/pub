// Follow this setup guide to integrate the Deno language server with your editor:
// https://deno.land/manual/getting_started/setup_your_environment
// This enables autocomplete, go to definition, etc.

// Setup type definitions for built-in Supabase Runtime APIs
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from 'jsr:@supabase/supabase-js@2';

interface PubRequestNotificationRequest {
  requestId: string;
  groupId: string;
  requestedBy: string;
  groupName: string;
  requesterName: string;
}

interface MemberWithEmail {
  user_id: string;
  email: string;
  display_name: string | null;
  device_tokens: Array<{ token: string; platform: string }>;
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
      },
    });
  }

  try {
    const { requestId, groupId, requestedBy, groupName, requesterName }: PubRequestNotificationRequest = await req.json();

    if (!requestId || !groupId || !requestedBy || !groupName || !requesterName) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        {
          status: 400,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
          },
        }
      );
    }

    // Initialize Supabase client with service role key for admin access
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    // Get all group members excluding the requester
    const { data: members, error: membersError } = await supabase
      .from('group_members')
      .select('user_id')
      .eq('group_id', groupId)
      .neq('user_id', requestedBy);

    if (membersError) {
      console.error('Error fetching group members:', membersError);
      return new Response(
        JSON.stringify({ error: 'Failed to fetch group members', details: membersError.message }),
        {
          status: 500,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
          },
        }
      );
    }

    if (!members || members.length === 0) {
      return new Response(
        JSON.stringify({ success: true, message: 'No members to notify' }),
        {
          status: 200,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
          },
        }
      );
    }

    // Get user emails and device tokens for all members
    const userIds = members.map((m) => m.user_id);
    const membersWithDetails: MemberWithEmail[] = [];

    // Get user emails from auth.users (requires admin access)
    const { data: { users: authUsers }, error: authError } = await supabase.auth.admin.listUsers();
    if (authError) {
      console.error('Error fetching auth users:', authError);
    } else {
      // Get profiles for display names
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, display_name')
        .in('id', userIds);

      const profileMap = new Map(
        (profiles || []).map((p) => [p.id, p.display_name])
      );

      // Get device tokens
      const { data: deviceTokens } = await supabase
        .from('device_tokens')
        .select('user_id, token, platform')
        .in('user_id', userIds);

      const tokensByUser = new Map<string, Array<{ token: string; platform: string }>>();
      (deviceTokens || []).forEach((dt) => {
        if (!tokensByUser.has(dt.user_id)) {
          tokensByUser.set(dt.user_id, []);
        }
        tokensByUser.get(dt.user_id)!.push({ token: dt.token, platform: dt.platform });
      });

      // Combine auth users with profiles and tokens
      (authUsers || []).forEach((user) => {
        if (userIds.includes(user.id) && user.email) {
          membersWithDetails.push({
            user_id: user.id,
            email: user.email,
            display_name: profileMap.get(user.id) || null,
            device_tokens: tokensByUser.get(user.id) || [],
          });
        }
      });
    }

    if (membersWithDetails.length === 0) {
      return new Response(
        JSON.stringify({ success: true, message: 'No members with emails found' }),
        {
          status: 200,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
          },
        }
      );
    }

    // Get Resend API key from environment variables
    const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');
    const FROM_EMAIL = Deno.env.get('RESEND_FROM_EMAIL') || 'onboarding@resend.dev';

    // Get Expo Push API key
    const EXPO_PUSH_API_KEY = Deno.env.get('EXPO_PUSH_API_KEY');

    // Get base URL for deep links
    const APP_BASE_URL = Deno.env.get('EXPO_PUBLIC_APP_URL') || 'https://pub.jakeunsted.uk';

    // Construct deep link URL (goes to home page where pending requests are shown)
    const deepLinkUrl = `${APP_BASE_URL}/(tabs)`;

    // Send notifications to all members
    const notificationResults = await Promise.allSettled(
      membersWithDetails.map(async (member) => {
        const results: { email?: string; push?: string } = {};

        // Send email
        if (RESEND_API_KEY) {
          try {
            const emailHtml = `
              <!DOCTYPE html>
              <html>
                <head>
                  <meta charset="utf-8">
                  <meta name="viewport" content="width=device-width, initial-scale=1.0">
                </head>
                <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
                  <div style="background-color: #f8f9fa; padding: 30px; border-radius: 8px;">
                    <h1 style="color: #007AFF; margin-top: 0;">Pub Request!</h1>
                    <p>Hi ${member.display_name || 'there'},</p>
                    <p><strong>${requesterName}</strong> wants to go to the pub with the group <strong>"${groupName}"</strong>!</p>
                    <p>Click the button below to open the app and respond:</p>
                    <div style="text-align: center; margin: 30px 0;">
                      <a href="${deepLinkUrl}" style="display: inline-block; background-color: #007AFF; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 600;">Open App</a>
                    </div>
                    <p style="font-size: 14px; color: #666;">Or copy and paste this link into your browser:</p>
                    <p style="font-size: 12px; color: #999; word-break: break-all;">${deepLinkUrl}</p>
                    <p style="font-size: 14px; color: #666; margin-top: 30px;">This request will expire in 12 hours.</p>
                  </div>
                </body>
              </html>
            `;

            const resendResponse = await fetch('https://api.resend.com/emails', {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${RESEND_API_KEY}`,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                from: FROM_EMAIL,
                to: [member.email],
                subject: `${requesterName} wants to go to the pub!`,
                html: emailHtml,
              }),
            });

            if (resendResponse.ok) {
              const result = await resendResponse.json();
              results.email = `sent: ${result.id}`;
            } else {
              const errorData = await resendResponse.text();
              results.email = `error: ${errorData}`;
            }
          } catch (error: any) {
            results.email = `error: ${error.message}`;
          }
        }

        // Send push notifications
        if (EXPO_PUSH_API_KEY && member.device_tokens.length > 0) {
          try {
            const pushMessages = member.device_tokens.map((dt) => ({
              to: dt.token,
              sound: 'default',
              title: `${requesterName} wants to go to the pub!`,
              body: `Respond in the ${groupName} group`,
              data: {
                requestId,
                groupId,
                type: 'pub_request',
              },
            }));

            const expoResponse = await fetch('https://exp.host/--/api/v2/push/send', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                'Accept-Encoding': 'gzip, deflate',
              },
              body: JSON.stringify(pushMessages),
            });

            if (expoResponse.ok) {
              const result = await expoResponse.json();
              results.push = `sent: ${result.data?.length || 0} notifications`;
            } else {
              const errorData = await expoResponse.text();
              results.push = `error: ${errorData}`;
            }
          } catch (error: any) {
            results.push = `error: ${error.message}`;
          }
        }

        return { user_id: member.user_id, ...results };
      })
    );

    const successful = notificationResults.filter((r) => r.status === 'fulfilled').length;
    const failed = notificationResults.filter((r) => r.status === 'rejected').length;

    console.log(`Notifications sent: ${successful} successful, ${failed} failed`);

    return new Response(
      JSON.stringify({
        success: true,
        notified: successful,
        failed,
        results: notificationResults.map((r) =>
          r.status === 'fulfilled' ? r.value : { error: r.reason }
        ),
      }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      }
    );
  } catch (error: any) {
    console.error('Error sending pub request notifications:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error', message: error.message }),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      }
    );
  }
});

