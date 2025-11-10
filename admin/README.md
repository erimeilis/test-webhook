# Webhook Admin Panel - Setup Guide

A modern admin panel for the webhook system built with Hono, React, and Cloudflare Workers.

## Tech Stack

- **Framework**: Hono.js with React JSX rendering
- **Runtime**: Cloudflare Workers
- **Database**: Cloudflare D1 (SQLite)
- **Auth**: Better Auth (Google OAuth + Email/Password)
- **Email**: Resend API
- **Styling**: Tailwind CSS v4 with dark theme
- **ORM**: Drizzle
- **UI Components**: React component architecture with shadcn/ui patterns

## Features

- ✅ Google OAuth + Email/Password authentication
- ✅ Email verification via Resend
- ✅ Webhook management (create, view, delete, share)
- ✅ Server-side pagination (scalable to 100,500+ records)
- ✅ Webhook data collection and filtering
- ✅ Dark theme with professional UI components
- ✅ Responsive design with mobile support
- 🔄 Token rotation (planned)

## Prerequisites

- Node.js 18+ installed
- Cloudflare account (free tier works)
- Google Cloud Console account (for OAuth)
- Resend account (for email verification)

## Step 1: Google OAuth Setup

### 1.1 Create Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Click **"Create Project"** (top left dropdown)
3. Enter project name: `webhook-system`
4. Click **"Create"**

### 1.2 Configure OAuth Consent Screen

1. In Google Cloud Console, select your project
2. Navigate to **"APIs & Services"** → **"OAuth consent screen"** (left sidebar)
3. Select **"External"** user type → Click **"Create"**
4. Fill in required fields:
   - **App name**: `Webhook System`
   - **User support email**: Your email
   - **Developer contact email**: Your email
5. Click **"Save and Continue"**
6. Skip scopes (click **"Save and Continue"**)
7. Add test users (your email) → Click **"Save and Continue"**
8. Review and click **"Back to Dashboard"**

### 1.3 Create OAuth Credentials

1. Go to **"APIs & Services"** → **"Credentials"**
2. Click **"+ Create Credentials"** → **"OAuth 2.0 Client ID"**
3. Configure:
   - **Application type**: Web application
   - **Name**: `Webhook Admin Panel`
   - **Authorized redirect URIs**:
     - For local development: `http://localhost:5173/api/auth/callback/google`
     - For production: `https://your-worker.workers.dev/api/auth/callback/google`
4. Click **"Create"**
5. Copy your **Client ID** and **Client Secret** → Save them securely

## Step 2: Resend Email Setup

### 2.1 Create Resend Account

1. Go to [Resend](https://resend.com/)
2. Click **"Sign Up"** → Create account
3. Verify your email address

### 2.2 Get API Key

1. In Resend dashboard, go to **"API Keys"**
2. Click **"Create API Key"**
3. Name: `Webhook System`
4. Permissions: **"Sending access"**
5. Click **"Create"**
6. Copy the API key (starts with `re_...`) → Save it securely
7. **Important**: This key is shown only once!

### 2.3 Verify Domain (Optional but Recommended)

For production:
1. Go to **"Domains"** in Resend dashboard
2. Click **"Add Domain"**
3. Enter your domain: `yourdomain.com`
4. Add the DNS records provided by Resend to your domain
5. Wait for verification (can take a few minutes to 24 hours)

For development, you can use Resend's test email feature without domain verification.

## Step 3: Configure Secrets for Local Development

### 3.1 Generate Better Auth Secret

Run this command to generate a secure random secret:

```bash
openssl rand -base64 32
```

Copy the output (e.g., `xK9f2Lm4pQw7RtY3nV8sH1jD6cB5aE0z...`)

### 3.2 Create Local Environment File

Create a `.dev.vars` file in the `admin/` directory:

```bash
cd admin
touch .dev.vars
```

Add your secrets to `.dev.vars`:

```env
GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-your-google-client-secret
RESEND_API_KEY=re_your_resend_api_key
BETTER_AUTH_SECRET=your-generated-secret-from-openssl
```

**Important**: `.dev.vars` is gitignored automatically by Wrangler.

### 3.3 Set Production Secrets (When Deploying)

For production deployment, set secrets using Wrangler CLI:

```bash
# Set each secret
wrangler secret put GOOGLE_CLIENT_ID
wrangler secret put GOOGLE_CLIENT_SECRET
wrangler secret put RESEND_API_KEY
wrangler secret put BETTER_AUTH_SECRET
```

You'll be prompted to enter each value. Paste the value and press Enter.

## Step 4: Local Development Setup

### 4.1 Install Dependencies

```bash
cd admin
npm install
```

### 4.2 Build Assets

```bash
npm run build:css
npm run build:client
```

### 4.3 Create Local D1 Database

```bash
wrangler d1 migrations apply webhook-db --local
```

This creates a local SQLite database in `.wrangler/state/v3/d1/`.

### 4.4 Start Development Server

```bash
npm run dev
```

Or manually:

```bash
wrangler dev --port 5173 --local
```

The admin panel will be available at: **http://localhost:5173**

## Step 5: Test Authentication

### 5.1 Test Email/Password Signup

1. Open http://localhost:5173/signup
2. Enter email: `test@example.com`
3. Enter password: `password123` (min 8 characters)
4. Click **"Create Account"**
5. Check terminal for verification email log (Resend in test mode)
6. Copy verification link from terminal and open in browser

### 5.2 Test Google OAuth

1. Open http://localhost:5173/login
2. Click **"Continue with Google"**
3. Select your Google account (must be added as test user)
4. Grant permissions
5. You'll be redirected back to the admin panel

### 5.3 Test Dashboard Access

After logging in:
- You should be redirected to `/dashboard`
- Dashboard shows user email and placeholder stats
- Try logging out and logging back in

## Step 6: Troubleshooting

### Google OAuth Errors

**Error: "redirect_uri_mismatch"**
- **Solution**: Verify redirect URI in Google Cloud Console matches exactly:
  - Local: `http://localhost:5173/api/auth/callback/google`
  - No trailing slashes
  - Correct port number

**Error: "Access blocked: This app's request is invalid"**
- **Solution**: Add your email as a test user in OAuth consent screen

**Error: "Invalid client"**
- **Solution**: Check `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` in `.dev.vars`

### Email Verification Issues

**No email received in development**
- Emails are logged to console in development mode
- Check Wrangler terminal output for email content
- Look for lines containing email verification link

**Resend API error: "API key invalid"**
- **Solution**: Verify `RESEND_API_KEY` in `.dev.vars` starts with `re_`
- Generate new API key in Resend dashboard if needed

**Error: "Domain not verified"**
- For production: Complete domain verification in Resend
- For development: Use Resend test mode with any email

### Database Issues

**Error: "No such table"**
- **Solution**: Run migrations: `wrangler d1 migrations apply webhook-db --local`

**Database locked error**
- **Solution**: Stop all Wrangler processes and restart

### Build Issues

**Tailwind CSS not loading**
- **Solution**: Run `npm run build:css` again
- Check `dist/styles.css` exists

**"Cannot find module" errors**
- **Solution**: Run `npm install` again
- Delete `node_modules` and reinstall if needed

## Project Structure

```
admin/
├── src/
│   ├── index.tsx           # Main Hono app entry point
│   ├── handlers/
│   │   └── auth.tsx        # Login/signup page handlers
│   ├── middleware/
│   │   └── auth.ts         # Authentication middleware
│   ├── lib/
│   │   ├── auth.ts         # Better Auth configuration
│   │   └── db-schema.ts    # Drizzle schema
│   ├── styles/
│   │   └── globals.css     # Tailwind CSS
│   └── types/
│       └── hono.ts         # TypeScript types
├── dist/                   # Built assets (CSS, JS)
├── .dev.vars               # Local secrets (gitignored)
├── wrangler.toml           # Cloudflare Workers config
├── package.json            # Dependencies
└── README.md               # This file
```

## Available Scripts

```bash
# Development
npm run dev                 # Start dev server (same as wrangler dev)

# Build
npm run build:css          # Build Tailwind CSS
npm run build:client       # Build client JS bundle
npm run build              # Full build + deploy

# Database
npm run db:generate        # Generate migration from schema
npm run db:migrate         # Apply migrations to local DB
npm run db:studio          # Open Drizzle Studio (DB UI)

# Quality
npm run type-check         # TypeScript type checking
npm run lint               # ESLint check
npm run lint:fix           # ESLint auto-fix
```

## Security Notes

1. **Never commit `.dev.vars`** - It's gitignored by default
2. **Rotate secrets regularly** - Especially if exposed
3. **Use different secrets** for development vs production
4. **Enable 2FA** on Google Cloud Console and Resend accounts
5. **Restrict API keys** to minimum required permissions

## Next Steps

After setup is complete:

1. ✅ Admin panel running locally
2. ✅ Authentication working (Google + Email)
3. ✅ Database migrations applied
4. 🔄 Implement webhook management features (Phase 2)
5. 🔄 Build data viewer and filtering (Phase 3)
6. 🔄 Add webhook sharing functionality (Phase 4)

## Production Deployment

When ready to deploy:

```bash
# Set production secrets (if not done already)
wrangler secret put GOOGLE_CLIENT_ID
wrangler secret put GOOGLE_CLIENT_SECRET
wrangler secret put RESEND_API_KEY
wrangler secret put BETTER_AUTH_SECRET

# Create production D1 database
wrangler d1 create webhook-db

# Update wrangler.toml with database_id from output
# Run migrations
wrangler d1 migrations apply webhook-db --remote

# Deploy
npm run build
```

Your admin panel will be live at: `https://webhook-admin.YOUR_SUBDOMAIN.workers.dev`

## Support

For issues or questions:
- Check the troubleshooting section above
- Review Cloudflare Workers docs: https://developers.cloudflare.com/workers/
- Better Auth docs: https://better-auth.com/
- Resend docs: https://resend.com/docs

## License

Private project - All rights reserved
