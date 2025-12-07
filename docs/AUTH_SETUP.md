# StudyTide Authentication Setup Guide

This guide walks you through setting up Supabase authentication with multiple OAuth providers.

## Step 1: Create a Supabase Project

1. Go to [supabase.com](https://supabase.com) and sign up/log in
2. Click **"New Project"**
3. Enter:
   - **Name**: `studytide`
   - **Database Password**: (save this somewhere safe!)
   - **Region**: Choose closest to you
4. Wait for the project to be created (~2 minutes)

## Step 2: Get Your API Keys

1. In your Supabase dashboard, go to **Settings** → **API**
2. Copy:
   - **Project URL** (looks like `https://xxxxx.supabase.co`)
   - **anon/public key** (starts with `eyJ...`)

3. Create a `.env.local` file in your project root:

```env
NEXT_PUBLIC_SUPABASE_URL=your_project_url_here
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

## Step 3: Configure OAuth Providers

### Google OAuth

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing
3. Go to **APIs & Services** → **Credentials**
4. Click **Create Credentials** → **OAuth client ID**
5. Select **Web application**
6. Add authorized redirect URIs:
   - `https://YOUR_PROJECT_REF.supabase.co/auth/v1/callback`
7. Copy the **Client ID** and **Client Secret**
8. In Supabase: **Authentication** → **Providers** → **Google**
   - Enable it and paste your Client ID and Secret

### GitHub OAuth

1. Go to [GitHub Developer Settings](https://github.com/settings/developers)
2. Click **New OAuth App**
3. Fill in:
   - **Application name**: StudyTide
   - **Homepage URL**: `http://localhost:3000`
   - **Authorization callback URL**: `https://YOUR_PROJECT_REF.supabase.co/auth/v1/callback`
4. Copy **Client ID** and generate a **Client Secret**
5. In Supabase: **Authentication** → **Providers** → **GitHub**
   - Enable it and paste your credentials

### Discord OAuth

1. Go to [Discord Developer Portal](https://discord.com/developers/applications)
2. Click **New Application** → Name it "StudyTide"
3. Go to **OAuth2** → **General**
4. Add redirect: `https://YOUR_PROJECT_REF.supabase.co/auth/v1/callback`
5. Copy **Client ID** and **Client Secret**
6. In Supabase: **Authentication** → **Providers** → **Discord**
   - Enable and paste credentials

### Apple OAuth (Optional - Requires Apple Developer Account $99/year)

1. Go to [Apple Developer Portal](https://developer.apple.com/)
2. Create an App ID and Service ID
3. Configure Sign in with Apple
4. In Supabase: **Authentication** → **Providers** → **Apple**
   - Follow Supabase's detailed Apple setup guide

## Step 4: Configure Supabase Auth Settings

1. In Supabase dashboard, go to **Authentication** → **URL Configuration**
2. Set:
   - **Site URL**: `http://localhost:3000` (for development)
   - **Redirect URLs**: Add `http://localhost:3000/auth/callback`

3. For production, add your production URLs as well.

## Step 5: Test Your Setup

1. Run the development server:
   ```bash
   npm run dev
   ```

2. Open `http://localhost:3000/login`

3. Try signing up with email or an OAuth provider

## File Structure Created

```
src/
├── app/
│   ├── auth/
│   │   ├── callback/route.js       # OAuth callback handler
│   │   └── auth-code-error/page.js # Error page
│   ├── login/page.js               # Login page with OAuth buttons
│   ├── signup/page.js              # Signup page
│   └── dashboard/page.js           # Protected dashboard
├── lib/
│   └── supabase/
│       ├── client.js               # Browser client
│       └── server.js               # Server client
└── middleware.js                    # Auth middleware (route protection)
```

## How Authentication Works

1. **Email/Password**: Users sign up with email, receive confirmation email, then can log in
2. **OAuth**: Users click provider button → redirected to provider → redirected back to `/auth/callback` → session created → redirected to `/dashboard`
3. **Middleware**: Automatically protects routes - unauthenticated users are redirected to `/login`

## Supported OAuth Providers

| Provider | Status | Notes |
|----------|--------|-------|
| Google | ✅ Ready | Most common, recommended |
| GitHub | ✅ Ready | Great for developer users |
| Discord | ✅ Ready | Popular with students |
| Apple | ✅ Ready | Requires paid developer account |
| Microsoft | Can add | Good for school accounts |
| Twitter/X | Can add | Requires API access |
| Facebook | Can add | Requires app review |

## Adding More Providers

To add another provider:

1. Enable it in Supabase Dashboard → Authentication → Providers
2. Add a button in `login/page.js` and `signup/page.js`:

```jsx
<button
  onClick={() => handleOAuthLogin('provider_name')}
  disabled={loading}
  className="w-full flex items-center justify-center gap-3 px-4 py-3 border rounded-lg hover:bg-gray-50"
>
  {/* Add provider icon SVG */}
  <span>Continue with ProviderName</span>
</button>
```

## Troubleshooting

### "Invalid redirect URL"
- Check that your callback URL in the OAuth provider matches exactly: `https://YOUR_PROJECT_REF.supabase.co/auth/v1/callback`

### "Email not confirmed"
- Check spam folder for confirmation email
- In Supabase, you can disable email confirmation for testing: Authentication → Email Templates → toggle off "Enable email confirmations"

### OAuth redirect not working
- Ensure `NEXT_PUBLIC_SITE_URL` is set correctly
- Check that redirect URLs are added in Supabase URL Configuration

## Next Steps

After auth is working:
1. Set up database tables for classes, assignments, etc.
2. Create API routes for CRUD operations
3. Build out the dashboard features

