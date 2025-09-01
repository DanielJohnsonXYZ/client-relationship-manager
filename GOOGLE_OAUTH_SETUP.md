# Google OAuth Setup for Gmail Integration

## Prerequisites

1. **Google Cloud Console Project**: You need a Google Cloud Console project with Gmail API enabled.

## Step 1: Create Google OAuth Credentials

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select your project or create a new one
3. Enable the Gmail API:
   - Go to "APIs & Services" > "Library"
   - Search for "Gmail API" and enable it
4. Create OAuth credentials:
   - Go to "APIs & Services" > "Credentials"
   - Click "Create Credentials" > "OAuth client ID"
   - Choose "Web application"
   - Add authorized redirect URIs:
     - `http://localhost:3000/api/integrations/oauth/gmail` (for development)
     - `https://your-domain.com/api/integrations/oauth/gmail` (for production)

## Step 2: Environment Variables

Add these variables to your `.env.local` file:

```bash
# Google OAuth
GOOGLE_CLIENT_ID=your_google_client_id_here
GOOGLE_CLIENT_SECRET=your_google_client_secret_here

# Supabase (if not already set)
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
NEXT_PUBLIC_APP_URL=http://localhost:3000  # or your domain
```

## Step 3: Set Up Spark Shipping Client

1. Get your user ID from Supabase Auth dashboard
2. Edit `spark-shipping-setup.sql` and replace `YOUR_USER_ID_HERE` with your actual user ID
3. Run the SQL script in your Supabase SQL Editor

## Step 4: Test Gmail Integration

1. Start your development server: `npm run dev`
2. Navigate to Settings page
3. Click "Connect" for Gmail integration
4. Complete OAuth flow
5. The system will sync your Gmail messages and match them with Spark Shipping based on email addresses

## Gmail Sync Features

- **Automatic Client Matching**: Emails are matched to clients based on sender/recipient email addresses
- **Activity Tracking**: Email conversations are recorded as client activities  
- **Real-time Sync**: New emails are periodically synced and associated with relevant clients
- **Secure Token Storage**: OAuth tokens are securely stored and automatically refreshed

## Testing the Integration

1. Send an email to/from `contact@sparkshipping.com` (or add this email to one of your Gmail accounts)
2. Trigger a sync from the Settings page
3. Check the Spark Shipping client profile to see the synced email activity

## Troubleshooting

- **OAuth errors**: Check that redirect URIs match exactly in Google Console
- **API errors**: Ensure Gmail API is enabled in Google Cloud Console
- **Sync issues**: Check browser console and server logs for detailed error messages