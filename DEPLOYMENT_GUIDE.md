# Phony Box Office Game - Deployment Guide

## Current Status

The phony-boxoffice project is ready for deployment. Here's what's been completed and what remains:

## Completed Tasks

1. **Project Structure**: Next.js app fully configured with all source files
2. **Environment Variables**: `.env.local` created with all necessary configuration
3. **Git Repository**: Initialized and ready for GitHub
4. **vercel.json**: Created to specify required environment variables

## Tasks Remaining (Manual Steps Required)

### Task 1: Migrate Movies from Original Database

**Status**: Script created, but requires network access to execute

The migration scripts have been created in three languages:
- `migrate-movies.py` - Python version using requests
- `migrate-movies.mjs` - Node.js version using @supabase/supabase-js
- `migrate-movies.js` - JavaScript version

**To run the migration:**

```bash
# Using Node.js (recommended - dependencies already installed)
cd /path/to/phony-boxoffice
node migrate-movies.mjs

# OR using Python
python3 migrate-movies.py
```

**What it does:**
- Fetches ALL movies from original database (puzfyltsipetkzwhdinw.supabase.co)
- Inserts them into Phony database (feevusglessjovdiyaxg.supabase.co)
- Includes all columns: title, release_date, opening_weekend_gross, status, poster_url

**Note:** The migration must be run from an environment with network access to Supabase APIs.

### Task 2: Push to GitHub and Deploy to Vercel

**Step 1: Push to GitHub**

```bash
cd /path/to/phony-boxoffice
git push -u origin master
```

This requires:
- Git configured with GitHub credentials
- Network access to GitHub
- The GitHub repo should already exist at: https://github.com/phonyjesse/phonyboxoffice26.git

**Step 2: Connect Vercel Project**

1. Go to https://vercel.com/dashboard
2. Create a new project or use the existing "Phony Box Office Game" project
3. Connect the GitHub repository: `phonyjesse/phonyboxoffice26`
4. Select the root directory as the project root (no subdirectories)

**Step 3: Set Environment Variables in Vercel**

In Vercel project settings, add these environment variables:

```
NEXT_PUBLIC_SUPABASE_URL=https://feevusglessjovdiyaxg.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZlZXZ1c2dsZXNsam92ZGl5YXhnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc4NjcwNzMsImV4cCI6MjA5MzQ0MzA3M30.LHoas0qo58wXW8k7OV7OsndcyatYGE0BcZs6wpCXjfg
SUPABASE_SERVICE_ROLE_KEY=sb_secret_-Vz75JZDReAMAoy5iYX9EA_3rrpInqp
ADMIN_PASSWORD=phonyboxofficegame2026
LOCK_DATE=2026-05-21T23:59:00-04:00
SHEET_CSV_URL=https://docs.google.com/spreadsheets/d/e/2PACX-1vQ6LFmoPs2_3JHCxibHRIezAedbkLodBcOLdLdUOI4DnvEF1K-93Gs86KyihRrPlkuSHylGkqQNUt_m/pub?output=csv
SHEET_WEEKEND_CSV_URL=https://docs.google.com/spreadsheets/d/e/2PACX-1vQ6LFmoPs2_3JHCxibHRIezAedbkLodBcOLdLdUOI4DnvEF1K-93Gs86KyihRrPlkuSHylGkqQNUt_m/pubhtml?gid=851323121&single=true
CRON_SECRET=phony_cron_secret_2026
TMDB_API_KEY=3e6da54488d9ccbeef7c21cbee9a0f99
```

**Step 4: Deploy**

Once environment variables are set, Vercel will automatically deploy from the main branch.

You can manually trigger a deployment by:
1. Going to the Vercel project dashboard
2. Clicking "Deployments"
3. Clicking "Redeploy" on the latest deployment

## Files Modified/Created

- `vercel.json` - Vercel configuration file specifying required environment variables
- `migrate-movies.mjs` - Node.js migration script (uses installed Supabase SDK)
- `migrate-movies.py` - Python migration script
- `migrate-movies.js` - JavaScript migration script
- `.env.local` - Local environment configuration (already existed)

## Next Steps After Deployment

1. Visit the deployed Vercel URL once deployment completes
2. Run the movie migration if not done already
3. Test the admin interface with ADMIN_PASSWORD=phonyboxofficegame2026
4. Verify the Google Sheets integration is pulling data correctly
5. Set up any cron jobs for automatic data updates (uses CRON_SECRET)

## Important Notes

- Do NOT touch the original boxoffice folder or its Supabase database
- All sensitive keys are configured in Vercel's environment variables
- The `.env.local` file should not be committed to version control in production
- The migration scripts use the Supabase REST API and require network access

## Support

For issues with deployment:
1. Check Vercel's deployment logs
2. Verify all environment variables are set correctly
3. Ensure the GitHub repository is properly connected
4. Confirm the Supabase databases are accessible
