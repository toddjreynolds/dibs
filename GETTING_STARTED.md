# Getting Started with Dibs

Welcome! This guide will get you up and running with the Dibs estate item sharing app.

## Quick Overview

**Dibs** is a web app that helps families browse, claim, and manage estate items collaboratively. It's perfect for estate sales, moving, downsizing, or any situation where multiple people need to coordinate on items.

## What You Need

- 10 minutes of time
- A Supabase account (free)
- Node.js 18+ installed
- A modern web browser

## Choose Your Path

### 👤 For End Users (Family Members)

**You just need the login credentials!**

Ask the person who set up Dibs for:
1. The website URL
2. Your email and password

Then:
1. Go to the URL
2. Log in
3. Start browsing and claiming items!

---

### 🛠️ For Setup (Admins)

Follow one of these guides based on your needs:

#### Option 1: Quick Setup (Recommended)
→ Follow **SETUP_GUIDE.md** for step-by-step instructions
- Takes about 10 minutes
- Creates everything from scratch
- Best for first-time setup

#### Option 2: Full Documentation
→ Follow **README.md** for comprehensive documentation
- Detailed explanations
- Troubleshooting tips
- All features explained

#### Option 3: Deploy to Production
→ Follow **DEPLOYMENT.md** to host online
- Deploy to Vercel or Netlify
- Free hosting
- Share with family

## Basic Usage

### Browsing Items

1. **Home page** shows all items
2. Use **filter buttons** to view:
   - All items
   - Items you're interested in
   - Items you've declined
   - Unclaimed items
   - Items with conflicts

### Claiming Items

For each item, you can:
- Click **👍 Want** - Show you're interested
- Click **👎 Pass** - Decline the item
- Click again to **undo** your choice

### Uploading Items

1. Click **Upload** in navigation
2. Take a photo or select from gallery
3. Add name and optional description
4. Click **Upload Item**

### Viewing Your Choices

1. Click **My Choices** in navigation
2. See two sections:
   - **Items I Want** (with conflict warnings)
   - **Items I've Declined**
3. Change any choice by clicking the buttons

### Resolving Conflicts

1. Click **Conflicts** in navigation
2. See all items multiple people want
3. View who wants each item
4. Coordinate with family members

## Tips for Success

### For Organizers

1. **Set up first**: Create the Supabase project and deploy
2. **Create accounts**: Make accounts for all family members
3. **Share credentials**: Give everyone their login info
4. **Upload items**: Add items with clear photos
5. **Set deadline**: Give everyone time to make choices
6. **Resolve conflicts**: Use the Conflicts page to coordinate

### For Users

1. **Browse everything**: Look at all items before deciding
2. **Be honest**: Only claim what you really want
3. **Check conflicts**: See if anyone else wants your items
4. **Communicate**: Talk to family about contested items
5. **Update choices**: You can change your mind anytime

## Common Scenarios

### Scenario 1: Estate Sale
1. Family member sets up Dibs
2. Takes photos of all items in the estate
3. Creates accounts for all interested family
4. Everyone browses and claims items
5. Family resolves any conflicts
6. Each person gets their claimed items

### Scenario 2: Moving/Downsizing
1. Person moving uploads items they can't take
2. Friends/family get accounts
3. Everyone picks what they want
4. Leftovers go to donation/sale

### Scenario 3: Divorce/Separation
1. Neutral party sets up and manages
2. Both parties get accounts
3. Separate browsing and claiming
4. Mediator helps with conflicts
5. Fair distribution based on choices

## Understanding Conflicts

**What is a conflict?**
When 2+ people mark the same item as "interested"

**How to see conflicts:**
- Red badge on item cards
- Filter by "Conflicts" 
- Visit Conflicts page

**How to resolve:**
- Talk with the other person
- One person changes their mind
- Flip a coin / draw straws
- Trade for another item
- Buy duplicate if possible

## Frequently Asked Questions

**Q: Can I change my mind?**
A: Yes! Click the same button again to undo, or click the other button to switch.

**Q: Can others see my choices?**
A: Yes, the app is transparent. Everyone can see how many people want each item (but not who declined).

**Q: What if multiple people want the same item?**
A: It shows as a "conflict" and you'll need to coordinate with family to resolve it.

**Q: Can I upload multiple photos per item?**
A: Not yet - that's a future feature. For now, upload the best single photo.

**Q: Can I delete an item I uploaded?**
A: Yes, if you uploaded it. (Future feature to be implemented)

**Q: Does it work on mobile?**
A: Yes! It's designed mobile-first and works great on phones.

**Q: Can I use the camera directly?**
A: Yes, on mobile devices you can take photos directly in the app.

**Q: What happens to unclaimed items?**
A: The app tracks them. You can filter to see "Unclaimed items" and decide what to do (donate, sell, etc.)

**Q: Is my data secure?**
A: Yes, Supabase uses bank-level encryption and security. Only authorized family members can access.

## Troubleshooting

### Can't Log In
- Check your email and password are correct
- Make sure your account was created
- Contact the person who set up Dibs

### Images Not Loading
- Check your internet connection
- Try refreshing the page
- Make sure images were uploaded correctly

### Not Seeing Updates
- Refresh the page
- Check your internet connection
- Real-time updates require stable connection

### App is Slow
- Check your internet speed
- Try closing other browser tabs
- Clear browser cache

## Getting Help

1. **Check the docs**: README.md has detailed information
2. **Technical issues**: Check ARCHITECTURE.md
3. **Setup problems**: Re-read SETUP_GUIDE.md
4. **Deployment issues**: Check DEPLOYMENT.md

## What's Next?

After getting started:

1. **Customize**: Edit colors, branding, text
2. **Add features**: Check PROJECT_SUMMARY.md for ideas
3. **Deploy**: Put it online for easy access
4. **Share**: Give everyone their login credentials
5. **Monitor**: Check the Conflicts page regularly

## Project Files Reference

- `README.md` - Main documentation
- `SETUP_GUIDE.md` - 10-minute setup guide
- `DEPLOYMENT.md` - Deploy to production
- `ARCHITECTURE.md` - Technical architecture
- `PROJECT_SUMMARY.md` - Complete overview
- `supabase-schema.sql` - Database schema
- `create-test-users.sql` - Test user reference

## Success Checklist

Before going live, make sure:

- [ ] Supabase project created
- [ ] Database schema installed
- [ ] Storage bucket created and configured
- [ ] User accounts created for all family
- [ ] .env.local configured locally
- [ ] App runs locally (npm run dev)
- [ ] Test upload works
- [ ] Test claiming works
- [ ] Test with 2+ users
- [ ] Conflicts page works
- [ ] Deployed to production (optional)
- [ ] Everyone has login credentials

## Support

This is an open-source project. For help:
- Review the documentation files
- Check Supabase docs: https://supabase.com/docs
- Check React docs: https://react.dev

## Have Fun!

The goal of Dibs is to make estate management easier and more transparent. 

Enjoy using it with your family! 🎉

---

**Quick Links:**
- 🚀 [Quick Setup](SETUP_GUIDE.md)
- 📚 [Full Docs](README.md)
- 🏗️ [Architecture](ARCHITECTURE.md)
- 🌐 [Deploy](DEPLOYMENT.md)
- 📦 [Summary](PROJECT_SUMMARY.md)

