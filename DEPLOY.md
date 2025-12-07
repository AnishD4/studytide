# 🚀 Deploy StudyTide to Vercel

Follow these steps to deploy your StudyTide app to Vercel.

## Prerequisites

1. ✅ Supabase account with project created
2. ✅ Gemini API key
3. ✅ GitHub account (optional, but recommended)
4. ✅ Vercel account

## Step 1: Run Supabase Migration

Go to your Supabase project → SQL Editor and run:

```sql
-- Copy and paste the content from: supabase/study-tools-setup.sql
```

This creates the tables needed for assignments, flashcards, and study guides.

## Step 2: Remove SQLite Dependency

```bash
npm uninstall better-sqlite3
```

## Step 3: Set Up Git Repository (Recommended)

```bash
# Initialize git if not already done
git init

# Add all files
git add .

# Commit
git commit -m "Prepare for Vercel deployment"

# Create a new repository on GitHub and push
git remote add origin https://github.com/YOUR_USERNAME/studytide.git
git branch -M main
git push -u origin main
```

## Step 4: Deploy to Vercel

### Option A: Deploy via Vercel CLI

```bash
# Install Vercel CLI
npm i -g vercel

# Login
vercel login

# Deploy
vercel
```

### Option B: Deploy via Vercel Dashboard

1. Go to [vercel.com](https://vercel.com)
2. Click "New Project"
3. Import your GitHub repository
4. Vercel will auto-detect Next.js

## Step 5: Configure Environment Variables in Vercel

In your Vercel project settings → Environment Variables, add:

| Variable | Value | Where to find it |
|----------|-------|------------------|
| `NEXT_PUBLIC_SUPABASE_URL` | `https://xxx.supabase.co` | Supabase → Settings → API |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `eyJxxx...` | Supabase → Settings → API → anon public |
| `SUPABASE_SERVICE_ROLE_KEY` | `eyJxxx...` | Supabase → Settings → API → service_role |
| `GEMINI_API_KEY` | `AIzaxxx...` | Google AI Studio |

## Step 6: Configure Supabase Redirect URLs

In Supabase → Authentication → URL Configuration, add:

**Site URL:**
```
https://your-app.vercel.app
```

**Redirect URLs (add all):**
```
https://your-app.vercel.app/auth/callback
http://localhost:3000/auth/callback
```

## Step 7: Deploy!

```bash
# If using CLI
vercel --prod

# Or just push to GitHub and Vercel auto-deploys
git push
```

## Troubleshooting

### Build Fails with SQLite Error

**Solution:** Make sure you removed `better-sqlite3`:
```bash
npm uninstall better-sqlite3
rm -rf node_modules package-lock.json
npm install
```

### Environment Variables Not Working

**Solution:** Redeploy after adding env vars:
```bash
vercel --prod
```

### Supabase Auth Issues

**Solution:** Check redirect URLs match exactly (including https://)

### API Route Errors

**Solution:** Check Supabase tables exist:
```sql
SELECT * FROM assignments;
SELECT * FROM flashcards;
SELECT * FROM study_guides;
```

## Post-Deployment

1. Test authentication
2. Test creating classes
3. Test study tools (requires Gemini API key)
4. Check browser console for errors

## Custom Domain (Optional)

1. Vercel Dashboard → Your Project → Settings → Domains
2. Add your custom domain
3. Update Supabase redirect URLs

## Monitoring

- Vercel Dashboard: Real-time logs and analytics
- Supabase Dashboard: Database queries and auth logs

---

🌊 Your StudyTide app should now be live! Visit your Vercel URL to test.

