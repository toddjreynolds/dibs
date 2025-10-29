# Deployment Guide

This guide covers deploying the Dibs app to production.

## Prerequisites

- Supabase project set up (see SETUP_GUIDE.md)
- GitHub repository with your code
- Vercel or Netlify account (free tier works)

## Option 1: Deploy to Vercel (Recommended)

Vercel offers the best integration with Vite and is very simple to set up.

### Steps:

1. **Push to GitHub**
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git branch -M main
   git remote add origin your-repo-url
   git push -u origin main
   ```

2. **Connect to Vercel**
   - Go to [vercel.com](https://vercel.com)
   - Click **Add New** > **Project**
   - Import your GitHub repository
   - Vercel will auto-detect Vite

3. **Configure Project**
   - **Framework Preset**: Vite
   - **Root Directory**: `client`
   - **Build Command**: `npm run build` (auto-detected)
   - **Output Directory**: `dist` (auto-detected)

4. **Add Environment Variables**
   
   Click **Environment Variables** and add:
   
   | Name | Value |
   |------|-------|
   | `VITE_SUPABASE_URL` | Your Supabase project URL |
   | `VITE_SUPABASE_ANON_KEY` | Your Supabase anon key |

5. **Deploy**
   - Click **Deploy**
   - Wait 1-2 minutes for build to complete
   - Your app will be live at `https://your-app.vercel.app`

### Vercel Advantages:
- ✅ Automatic HTTPS
- ✅ Global CDN
- ✅ Automatic deployments on git push
- ✅ Preview deployments for PRs
- ✅ Built-in analytics
- ✅ Free for personal projects

## Option 2: Deploy to Netlify

Netlify is another excellent free hosting option.

### Steps:

1. **Push to GitHub** (same as above)

2. **Connect to Netlify**
   - Go to [netlify.com](https://netlify.com)
   - Click **Add new site** > **Import an existing project**
   - Choose **GitHub** and authorize
   - Select your repository

3. **Configure Build Settings**
   - **Base directory**: `client`
   - **Build command**: `npm run build`
   - **Publish directory**: `client/dist`

4. **Add Environment Variables**
   
   Go to **Site settings** > **Environment variables** and add:
   
   | Key | Value |
   |-----|-------|
   | `VITE_SUPABASE_URL` | Your Supabase project URL |
   | `VITE_SUPABASE_ANON_KEY` | Your Supabase anon key |

5. **Deploy**
   - Click **Deploy site**
   - Wait for build to complete
   - Your app will be live at `https://random-name.netlify.app`
   - You can customize the domain in site settings

### Netlify Advantages:
- ✅ Automatic HTTPS
- ✅ Global CDN
- ✅ Automatic deployments on git push
- ✅ Deploy previews
- ✅ Form handling
- ✅ Free for personal projects

## Post-Deployment Checklist

### 1. Update Supabase Redirect URLs

After deployment, you need to add your production URL to Supabase:

1. Go to your Supabase dashboard
2. Click **Authentication** > **URL Configuration**
3. Add your production URL to **Site URL**
4. Add to **Redirect URLs**:
   - `https://your-app.vercel.app/*`
   - OR `https://your-app.netlify.app/*`

### 2. Test Authentication

1. Visit your production URL
2. Try logging in with a test account
3. Verify all features work:
   - Upload an item
   - Claim/decline items
   - Check conflicts page
   - Verify real-time updates

### 3. Custom Domain (Optional)

#### On Vercel:
1. Go to project settings
2. Click **Domains**
3. Add your custom domain
4. Follow DNS configuration instructions

#### On Netlify:
1. Go to **Domain settings**
2. Click **Add custom domain**
3. Follow DNS configuration instructions

### 4. Enable CORS (if needed)

If you encounter CORS issues:

1. Go to Supabase Dashboard
2. Click **Settings** > **API**
3. Add your production domain to **CORS Allowed Origins**

## Continuous Deployment

Both Vercel and Netlify automatically deploy when you push to your main branch:

```bash
# Make changes
git add .
git commit -m "Your changes"
git push origin main

# Deployment happens automatically!
```

## Monitoring

### Vercel Analytics
- Enable in project settings
- View real-time visitor stats
- Monitor Web Vitals

### Netlify Analytics
- Available on Pro plan
- Server-side analytics
- No client-side JavaScript needed

### Supabase Monitoring
- Go to **Reports** in Supabase dashboard
- Monitor:
  - Database queries
  - API requests
  - Storage usage
  - Active users

## Performance Optimization

### 1. Image Optimization

Images are stored in Supabase Storage. To optimize:

1. Consider adding image transformation in upload flow
2. Use Supabase image transformations:
   ```javascript
   const { data } = supabase.storage
     .from('item-images')
     .getPublicUrl(filePath, {
       transform: {
         width: 800,
         height: 800,
         resize: 'contain'
       }
     })
   ```

### 2. Caching

Both Vercel and Netlify automatically cache:
- Static assets (JS, CSS)
- Images
- API responses

### 3. Database Indexes

Already included in schema:
- `idx_items_created_at`
- `idx_items_uploaded_by`
- `idx_claims_item_id`
- `idx_claims_user_id`
- `idx_claims_status`

## Scaling

### Free Tier Limits:

**Supabase Free**
- 500 MB database
- 1 GB file storage
- 50 MB file uploads
- 2 GB bandwidth
- 50,000 monthly active users

**Vercel Free**
- 100 GB bandwidth
- Unlimited websites
- Automatic SSL

**Netlify Free**
- 100 GB bandwidth
- 300 build minutes/month
- Unlimited sites

### When to Upgrade:

Upgrade Supabase when:
- Database > 400 MB
- Storage > 800 MB
- Need more than 50K users

Upgrade Vercel/Netlify when:
- Bandwidth > 80 GB/month
- Need team collaboration

## Troubleshooting Deployment

### Build Fails

**Error**: "Module not found"
- Solution: Run `npm install` locally and commit `package-lock.json`

**Error**: "Environment variable not defined"
- Solution: Double-check all env vars are set in hosting platform

### Runtime Errors

**Error**: "Failed to fetch"
- Check Supabase URL and key are correct
- Verify CORS settings in Supabase
- Check browser console for specific error

**Error**: Images not loading
- Verify storage bucket is public
- Check storage policies
- Verify CORS settings

### Authentication Issues

**Error**: "Invalid login credentials"
- Verify users exist in Supabase
- Check email confirmation status
- Verify redirect URLs are set

## Backup Strategy

### Database Backups

Supabase automatically backs up your database:
- Daily backups on free tier
- 7-day retention on free tier
- Hourly backups on Pro tier

To manually backup:
1. Go to **Database** > **Backups**
2. Click **Create backup**

### Export Data

Create backup scripts:

```javascript
// backup-data.js
const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')

const supabase = createClient(url, key)

async function backup() {
  const { data: items } = await supabase.from('items').select('*')
  const { data: claims } = await supabase.from('claims').select('*')
  
  fs.writeFileSync('backup.json', JSON.stringify({
    items,
    claims,
    timestamp: new Date()
  }, null, 2))
}

backup()
```

## Security Checklist

- ✅ Environment variables not in git
- ✅ HTTPS enabled (automatic)
- ✅ Row Level Security enabled
- ✅ API keys are anon keys (not service keys)
- ✅ Storage policies configured
- ✅ Auth redirect URLs whitelisted
- ✅ CORS properly configured

## Production Environment Variables

Create a `.env.production` file (don't commit!) for reference:

```
VITE_SUPABASE_URL=your_production_url
VITE_SUPABASE_ANON_KEY=your_production_anon_key
```

Use different Supabase projects for staging/production if needed.

## Monitoring and Alerts

### Set Up Email Alerts

In Supabase:
1. Go to **Settings** > **Notifications**
2. Enable alerts for:
   - Database issues
   - Storage limits
   - API rate limits

### Application Monitoring

Consider adding:
- [Sentry](https://sentry.io) for error tracking
- [LogRocket](https://logrocket.com) for session replay
- [PostHog](https://posthog.com) for analytics

## Cost Estimation

For a family of 8 users with 100 items:

**Free tier covers:**
- Database: ~10 MB
- Storage: ~100 MB (images)
- Bandwidth: ~1 GB/month
- Hosting: Free

**Total cost: $0/month** ✨

When to expect costs:
- Growing to 50+ active users
- 1000+ items with images
- Heavy daily usage

## Support

- Supabase: [supabase.com/docs](https://supabase.com/docs)
- Vercel: [vercel.com/docs](https://vercel.com/docs)
- Netlify: [docs.netlify.com](https://docs.netlify.com)

Happy deploying! 🚀

