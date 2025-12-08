# Send Invite Email Edge Function

This Supabase Edge Function sends invitation emails using Resend.

## Setup Instructions

### 1. Create a Resend Account

1. Go to [resend.com](https://resend.com) and sign up for a free account
2. The free tier includes 3,000 emails/month and 100 emails/day

### 2. Get Your Resend API Key

1. In your Resend dashboard, go to **API Keys**
2. Click **Create API Key**
3. Give it a name (e.g., "Supabase Invite Emails")
4. Copy the API key (you'll only see it once!)

### 3. Configure Your Sender Email

**Option A: Use Resend's Test Domain (Quick Start)**
- You can use `onboarding@resend.dev` for testing
- This is already set as the default in the function

**Option B: Use Your Own Domain (Recommended for Production)**
1. In Resend dashboard, go to **Domains**
2. Click **Add Domain**
3. Add your domain (e.g., `yourdomain.com`)
4. Add the DNS records Resend provides to your domain's DNS settings
5. Wait for verification (usually a few minutes)
6. Once verified, update the `RESEND_FROM_EMAIL` environment variable

### 4. Set Environment Variables in Supabase

1. Go to your Supabase project dashboard
2. Navigate to **Edge Functions** → **Settings**
3. Add the following secrets:
   - `RESEND_API_KEY`: Your Resend API key
   - `RESEND_FROM_EMAIL`: Your verified sender email (e.g., `noreply@yourdomain.com` or `onboarding@resend.dev` for testing)

Alternatively, you can set them via CLI:
```bash
npx supabase secrets set RESEND_API_KEY=your_api_key_here
npx supabase secrets set RESEND_FROM_EMAIL=onboarding@resend.dev
```

### 5. Deploy the Function

```bash
npx supabase functions deploy send-invite-email
```

## Testing

You can test the function locally or invoke it directly:

```bash
curl -i --location --request POST 'https://YOUR_PROJECT_REF.supabase.co/functions/v1/send-invite-email' \
  --header 'Authorization: Bearer YOUR_ANON_KEY' \
  --header 'Content-Type: application/json' \
  --data '{
    "email": "test@example.com",
    "token": "test-token-123",
    "groupName": "Test Group",
    "inviterName": "John Doe",
    "inviteUrl": "pub://invite/test-token-123"
  }'
```

## Alternative: Using Other Email Services

If you prefer to use a different email service (SendGrid, Mailgun, AWS SES, etc.), you can modify the `index.ts` file to use their API instead of Resend. The function structure remains the same.

