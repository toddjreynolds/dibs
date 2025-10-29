# Timer and Bidding System Implementation Guide

This document explains the timer and bidding system that has been added to the Dibs app.

## Features Implemented

### 1. **7-Day Expiration Timer**
- Items expire 7 days after upload at 7pm
- Timer badge displays in top-right corner of each item card
- Time format changes based on remaining time:
  - 8-2 days remaining: "X days"
  - Last 24 hours: "X hours"
  - Last hour: "X minutes"
- Timer updates automatically every minute

### 2. **Point-Based Bidding System**
- Each user starts with 100 points
- Users can bid points on items they want when conflicts arise
- Highest bidder wins when item expires
- Points are deducted from winner after resolution
- Users can see WHO is interested but not their bids or point totals
- Bid ties trigger 24-hour extensions (can extend multiple times)
- Users at 0 points can still call dibs and win if others withdraw

### 3. **Couples Feature**
- Two users can be linked as a couple via `couple_id`
- Couples share a point pool
- Couples never conflict with each other
- Either partner can place/edit bids
- Display format: "Marc & Jensen"

### 4. **Automatic Item Resolution**
Rules for item resolution:
- **Solo dibs + all others passed** → Immediate win
- **All users passed** → Immediate donation
- **Expires with no dibs** → Donation
- **Conflict at expiration** → Highest bidder wins
- **Tie in bids** → Extend expires_at by 24 hours

### 5. **Visual Components**
- **Timer Badge**: White pill badge in top-right corner with clock icon
- **Interested Users Badges**: Stacked badges in top-left showing who wants the item (only in conflicts)
- **Bidding Panel**: Three states:
  1. Initial: "Place Your Bid" with available points
  2. Edit: Number input with Cancel/Save buttons
  3. Completed: Shows bid amount with Edit button
- **Points Display**: Shows user's current points in navigation bar with tag icon

## Database Migration

### Step 1: Run the Migration SQL

Execute the migration file in your Supabase SQL Editor:

```bash
# The migration file is located at:
migration-timer-bidding-system.sql
```

This will add the following columns:
- `profiles.points` (integer, default 100)
- `profiles.couple_id` (UUID, nullable)
- `items.expires_at` (timestamp)
- `items.status` ('active', 'resolved', 'donated')
- `items.winner_id` (UUID)
- `items.resolved_at` (timestamp)
- `claims.bid_amount` (integer, default 0)

### Step 2: Verify the Migration

Check that all columns were added successfully:

```sql
-- Check profiles table
SELECT * FROM profiles LIMIT 1;

-- Check items table
SELECT * FROM items LIMIT 1;

-- Check claims table
SELECT * FROM claims LIMIT 1;
```

## Setting Up Couples (Optional)

To link two users as a couple:

```sql
-- Generate a couple_id (any UUID)
UPDATE profiles 
SET couple_id = 'your-generated-uuid-here'
WHERE id IN ('user1-id', 'user2-id');
```

Example:
```sql
-- Link Marc and Jensen as a couple
UPDATE profiles 
SET couple_id = gen_random_uuid()
WHERE full_name IN ('Marc', 'Jensen');
```

## Testing the Features

### Test 1: Timer Display
1. Upload a new item
2. Verify the timer badge appears in the top-right corner
3. Check that it shows "7 days" initially
4. The timer should update every minute

### Test 2: Bidding on Conflicts
1. Have User A call dibs on an item
2. Have User B call dibs on the same item
3. Both users should see:
   - Pink gradient overlay on the image
   - Interested users badges in top-left
   - Bidding panel with "Place Your Bid"
4. Place a bid (e.g., 23 points)
5. Verify bid is saved and panel shows "23 points" with Edit button
6. Check that available points decreased in navigation bar

### Test 3: Item Resolution
1. Create an item and have multiple users call dibs
2. Wait for expiration (or manually update expires_at to past time)
3. The expiration checker should resolve the item automatically
4. Winner should be determined by highest bid
5. Points should be deducted from winner's account

### Test 4: Couples
1. Link two users as a couple (see SQL above)
2. Have one partner call dibs on an item
3. Have the other partner also call dibs
4. They should NOT see a conflict (couples don't conflict)
5. Their names should appear together: "User1 & User2"

### Test 5: Zero-Point Users
1. Manually set a user's points to 0:
   ```sql
   UPDATE profiles SET points = 0 WHERE id = 'user-id';
   ```
2. User can still call dibs
3. If someone else bids >0, they auto-lose
4. If everyone withdraws, user can still win

## Architecture Overview

### New Files Created

**Utilities:**
- `client/src/utils/timerUtils.js` - Timer calculations and formatting
- `client/src/utils/coupleUtils.js` - Couple relationship utilities
- `client/src/utils/itemResolution.js` - Item resolution logic

**Components:**
- `client/src/components/TimerBadge.jsx` - Timer display badge
- `client/src/components/InterestedUsersBadges.jsx` - Shows interested users
- `client/src/components/BiddingPanel.jsx` - Bidding UI with three states

**Hooks:**
- `client/src/hooks/useExpirationChecker.js` - Background expiration checker

**Database:**
- `migration-timer-bidding-system.sql` - Migration for existing databases
- `supabase-schema.sql` - Updated schema with new fields

### Modified Files

**Components:**
- `client/src/components/ItemCard.jsx` - Added timer, bidding panel, interested badges
- `client/src/components/Layout.jsx` - Added points display

**Pages:**
- `client/src/pages/Browse.jsx` - Added profiles, points, expiration filtering
- `client/src/pages/Upload.jsx` - Set expires_at and status on new items
- `client/src/pages/MyChoices.jsx` - Pass profiles and points to ItemCard

**Styles:**
- `client/src/index.css` - Added styles for timer, bidding, and points display

## Production Considerations

### Server-Side Expiration Checker

The current implementation checks for expired items in the client every minute. For production, implement a server-side cron job:

**Option 1: Supabase Edge Functions**
```typescript
// Create an edge function that runs every minute
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

serve(async (req) => {
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  )

  // Check for expired items
  const { data: items } = await supabase
    .from('items')
    .select('*')
    .eq('status', 'active')
    .lt('expires_at', new Date().toISOString())

  // Resolve each expired item
  for (const item of items || []) {
    await checkAndResolveItem(item.id)
  }

  return new Response('OK', { status: 200 })
})
```

**Option 2: External Cron Service**
Use a service like:
- GitHub Actions (free scheduled workflows)
- Vercel Cron Jobs
- AWS CloudWatch Events + Lambda
- Google Cloud Scheduler

### Performance Optimization

For large user bases, consider:
1. **Pagination**: Limit number of items loaded at once
2. **Caching**: Cache profile data to reduce database queries
3. **Indexes**: Ensure indexes are created (done in migration)
4. **Batch Operations**: Process multiple resolutions in batches

### Real-Time Updates

The app uses Supabase real-time subscriptions to update:
- Item changes (claims, resolutions)
- Profile points updates
- New items uploads

Ensure Supabase real-time is enabled for your project.

## Troubleshooting

### Timer Not Showing
- Check that `expires_at` is set on the item
- Verify the timer badge has proper z-index in CSS
- Check browser console for JavaScript errors

### Bidding Panel Not Appearing
- Ensure multiple users have dibbed the item
- Check that `item.claims` array is properly populated
- Verify profiles are being fetched in Browse component

### Points Not Updating
- Check that real-time subscription is working
- Verify Layout component is fetching points correctly
- Check Supabase RLS policies allow profile updates

### Item Not Resolving
- Check expiration checker is running (see console logs)
- Manually trigger resolution by calling `checkAndResolveItem(itemId)`
- Verify all resolution rules are being evaluated correctly

## Future Enhancements

Potential improvements:
1. **Notification System**: Alert users when they win or lose items
2. **Bid History**: Show history of bids placed
3. **Point Transactions**: Log of point earnings and spending
4. **Admin Dashboard**: Manage couples, reset points, resolve conflicts manually
5. **Item Categories**: Filter items by type
6. **Wishlist**: Mark items to watch without calling dibs
7. **Trade System**: Allow users to trade points or items

## Support

For issues or questions, please check:
1. This documentation
2. The existing codebase comments
3. Supabase documentation for database/real-time features
4. React documentation for component behavior

