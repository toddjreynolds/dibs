# Environment Management Guide

This guide explains how to manage separate development and production environments for the Dibs app.

## Overview

The Dibs app uses **two separate Supabase projects**:
- **Development**: For local development and testing
- **Production**: For the live app used by your family

This separation ensures that:
- Production data is never at risk during development
- You can freely test destructive operations in dev
- Multiple developers can share dev credentials safely
- Production remains stable while you experiment

## Environment Structure

```
Development Environment
├── Supabase Project: dibs-dev (or similar)
├── Database: Separate dev database
├── Storage: Separate dev storage bucket
├── Users: Test users (alice@example.com, etc.)
└── Credentials: Stored in client/.env.local

Production Environment
├── Supabase Project: dibs-app (or similar)
├── Database: Real production database
├── Storage: Real production storage bucket
├── Users: Real family members
└── Credentials: Stored in Vercel/Netlify config
```

## File Structure

### Local Development Files (gitignored)

```
client/
├── .env.local                    # DEV credentials (used by npm run dev)
└── .env.production.local         # PROD credentials reference (for your records)
```

### Version Controlled Files

```
project-root/
├── supabase-schema.sql          # Database schema (used for both envs)
├── create-test-users.sql        # Test user reference (dev only)
├── ENVIRONMENT_GUIDE.md         # This file
├── SETUP_GUIDE.md               # How to set up dev environment
└── DEPLOYMENT.md                # How to deploy to production
```

## Setting Up Environments

### Development Setup (First Time)

1. **Create Dev Supabase Project**
   - Go to [supabase.com](https://supabase.com)
   - Create new project: "dibs-dev"
   - Note the project URL and anon key

2. **Set Up Dev Database**
   - Run `supabase-schema.sql` in SQL Editor
   - Create `item-images` storage bucket
   - Set up storage policies

3. **Create Test Users**
   - Use `create-test-users.sql` as reference
   - Create 8 test users in Authentication

4. **Configure Local Environment**
   
   Create `client/.env.local`:
   ```env
   VITE_SUPABASE_URL=https://xxxxx.supabase.co
   VITE_SUPABASE_ANON_KEY=your_dev_anon_key_here
   ```

5. **Run Locally**
   ```bash
   cd client
   npm install
   npm run dev
   ```

### Production Setup

1. **Create Production Supabase Project**
   - Go to [supabase.com](https://supabase.com)
   - Create new project: "dibs-app" (or your choice)
   - Note the project URL and anon key

2. **Set Up Production Database**
   - Run `supabase-schema.sql` in SQL Editor
   - Create `item-images` storage bucket
   - Set up storage policies

3. **Create Real Users**
   - Create accounts for actual family members
   - Use real emails and secure passwords

4. **Save Production Credentials**
   
   Create `client/.env.production.local` for reference:
   ```env
   # PRODUCTION CREDENTIALS - DO NOT USE FOR LOCAL DEV
   # Only use these when deploying to Vercel/Netlify
   VITE_SUPABASE_URL=https://yyyyy.supabase.co
   VITE_SUPABASE_ANON_KEY=your_prod_anon_key_here
   ```

5. **Deploy to Production**
   - Follow `DEPLOYMENT.md`
   - Add production credentials to Vercel/Netlify
   - **Never** commit production credentials to git

## Daily Development Workflow

### Working Locally (Development)

```bash
# 1. Make sure you're using dev credentials
cat client/.env.local  # Should show dev Supabase URL

# 2. Start dev server
cd client
npm run dev

# 3. Make changes, test freely
# Your changes only affect the dev database

# 4. Commit code changes (credentials stay local)
git add .
git commit -m "Your changes"
git push origin main
```

### Deploying to Production

```bash
# 1. Test locally first with dev environment
npm run dev  # Test thoroughly

# 2. Commit and push code
git add .
git commit -m "Ready for production"
git push origin main

# 3. Vercel/Netlify auto-deploys using production credentials
# The deployment uses the credentials you configured in their dashboards

# 4. Test production thoroughly after deployment
```

## Switching Between Environments

### To Use Development (Default)

Your `client/.env.local` should contain dev credentials. This is what `npm run dev` uses.

```env
VITE_SUPABASE_URL=https://dev-project.supabase.co
VITE_SUPABASE_ANON_KEY=dev_key_here
```

### To Test Production Locally (Rare)

**⚠️ Warning**: Only do this if you need to test against production data locally.

Temporarily swap credentials in `client/.env.local`:
```env
VITE_SUPABASE_URL=https://prod-project.supabase.co
VITE_SUPABASE_ANON_KEY=prod_key_here
```

**Remember to switch back** to dev credentials when done!

### To Deploy to Production

Deployment platforms (Vercel/Netlify) have their own environment variable configuration. Set production credentials there:

**Vercel**: Project Settings → Environment Variables
**Netlify**: Site Settings → Environment Variables

These are completely separate from your local `.env.local` file.

## Best Practices

### ✅ Do

- **Always develop locally using dev environment**
- Keep production credentials in Vercel/Netlify only
- Test thoroughly in dev before deploying
- Use realistic test data in dev
- Share dev credentials with team members (they're meant to be shared)
- Back up production database regularly (Supabase does this automatically)
- Document any schema changes in migration files

### ❌ Don't

- **Never commit .env files to git** (already in .gitignore)
- Don't develop against production database
- Don't share production credentials publicly
- Don't deploy with dev credentials
- Don't delete test data in dev (others might be using it)
- Don't assume dev and prod are in sync (they can drift)

## Common Scenarios

### Adding a New Feature

1. Develop locally using dev environment
2. Test with dev data and users
3. Commit code changes
4. Push to GitHub
5. Deployment automatically uses production credentials

### Updating Database Schema

1. **Plan the change** - Write migration SQL
2. **Test in dev** - Run migration in dev Supabase
3. **Test locally** - Verify app works with new schema
4. **Apply to prod** - Run migration in prod Supabase
5. **Deploy code** - Push code that uses new schema
6. **Update schema file** - Update `supabase-schema.sql` for new setups

### Resetting Dev Database

Sometimes you want a fresh start in development:

1. Go to dev Supabase project
2. Go to Database → Schema → Tables
3. Delete all data or drop/recreate tables
4. Re-run `supabase-schema.sql`
5. Recreate test users

**Note**: Never do this in production!

### Debugging Production Issues

If there's a bug in production:

1. Try to reproduce in dev first
2. If you need to debug prod, you can:
   - View prod database (read-only) in Supabase dashboard
   - Check prod logs in Vercel/Netlify
   - Check Supabase logs in prod project
3. Fix bug in dev environment
4. Test thoroughly
5. Deploy fix to production

## Credentials Management

### Where Credentials Are Stored

| Location | Environment | File | Committed to Git? |
|----------|-------------|------|-------------------|
| Local development | Dev | `client/.env.local` | ❌ No (gitignored) |
| Personal reference | Prod | `client/.env.production.local` | ❌ No (gitignored) |
| Vercel deployment | Prod | Vercel dashboard | N/A (platform config) |
| Netlify deployment | Prod | Netlify dashboard | N/A (platform config) |

### Getting Credentials

**From Supabase**:
1. Open your Supabase project
2. Go to Project Settings (gear icon)
3. Click "API" in sidebar
4. Copy:
   - **Project URL**: `https://xxxxx.supabase.co`
   - **anon public key**: The key under "Project API keys"

### Rotating Credentials

If you need to change credentials:

**Development**:
1. Get new keys from dev Supabase project
2. Update `client/.env.local`
3. Restart dev server

**Production**:
1. Get new keys from prod Supabase project
2. Update credentials in Vercel/Netlify dashboard
3. Redeploy (or wait for next auto-deploy)

## Troubleshooting

### "I'm seeing production data locally"

- Check `client/.env.local` - it should have dev credentials
- Restart your dev server after changing .env files

### "Production isn't updating after deploy"

- Verify production credentials are set in Vercel/Netlify
- Check deployment logs for errors
- Clear browser cache
- Check Supabase dashboard for errors

### "Can't log in locally"

- Make sure you created test users in the **dev** Supabase project
- Check that dev credentials in .env.local are correct
- Verify test users exist in dev project's Authentication tab

### "Dev and prod schemas are different"

This is normal as you develop! To sync them:

1. Document what changed in a migration file
2. Test migration in dev
3. Apply migration to prod when ready
4. Update `supabase-schema.sql` for future setups

### "Forgot which Supabase project is which"

Check the project name in Supabase dashboard:
- Dev projects often have "dev" or "development" in the name
- Prod projects have the official app name
- Check user count: dev has test users, prod has real users
- Check data: dev has test data, prod has real data

## Security Considerations

### Development Environment

- ✅ Can share credentials with team members
- ✅ Safe to use simple passwords for test users
- ✅ Can commit test data to git if helpful
- ✅ Can reset/wipe database freely

### Production Environment

- 🔒 **Never** share credentials publicly
- 🔒 Use strong, unique passwords for users
- 🔒 **Never** commit credentials to git
- 🔒 Be careful with database operations
- 🔒 Enable Supabase security features
- 🔒 Regular backups (automatic with Supabase)
- 🔒 Monitor access logs

## Team Collaboration

### Sharing Dev Environment

When working with others:

1. **Share dev credentials** - Send them the dev .env.local contents
2. **Document test users** - Make sure everyone knows test login credentials
3. **Coordinate schema changes** - Communicate when updating database schema
4. **Keep dev data clean** - Don't leave junk data that confuses others

### Multiple Developers

All developers can:
- Use the same dev Supabase project
- Share the same test users
- Run locally with identical setup
- Test features without conflicts

Just make sure to:
- Communicate when making schema changes
- Don't delete other people's test data
- Keep test users available for everyone

## Cost Considerations

### Free Tier Per Project

Supabase free tier includes:
- 500 MB database
- 1 GB file storage
- 2 GB bandwidth per month

With two projects (dev + prod):
- Each has its own free tier allocation
- Dev usually uses very little (just testing)
- Prod grows with real usage

### When to Upgrade

Consider upgrading **production only** when:
- Database approaching 400 MB
- Storage approaching 800 MB
- Bandwidth consistently over 1.5 GB/month

Dev can usually stay on free tier indefinitely.

## Monitoring

### Development

- Not critical to monitor
- Check Supabase dashboard occasionally
- Watch for schema drift from production

### Production

- Check Supabase dashboard regularly
- Monitor in Vercel/Netlify:
  - Deployment status
  - Error logs
  - Performance metrics
- Set up Supabase email alerts:
  - Database near capacity
  - API rate limits
  - Unusual activity

## Quick Reference

### Local Development Commands

```bash
# Start dev server (uses .env.local = dev credentials)
npm run dev

# Build for production (tests build process)
npm run build

# Preview production build locally
npm run preview
```

### Key Files

```bash
# View current local credentials
cat client/.env.local

# View production credentials reference
cat client/.env.production.local

# View database schema
cat supabase-schema.sql

# View test users
cat create-test-users.sql
```

### Quick Checks

```bash
# Verify gitignore is working
git status  # Should NOT show .env files

# Check which environment you're using
echo $VITE_SUPABASE_URL  # (in running dev server context)
```

## Additional Resources

- [Supabase Documentation](https://supabase.com/docs)
- [Environment Variables in Vite](https://vitejs.dev/guide/env-and-mode.html)
- [Vercel Environment Variables](https://vercel.com/docs/environment-variables)
- [Netlify Environment Variables](https://docs.netlify.com/environment-variables/overview/)

## Summary

- **Development**: Safe playground for coding and testing
- **Production**: Real data, real users, handle with care
- **Separation**: Two Supabase projects keep them isolated
- **Credentials**: Local dev uses .env.local, prod uses platform config
- **Workflow**: Code in dev, commit, push, auto-deploy to prod with prod credentials
- **Safety**: Production data is never at risk during development

Happy coding! 🚀

