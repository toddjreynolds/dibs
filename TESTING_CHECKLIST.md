# Timer and Bidding System - Testing Checklist

## Pre-Deployment Checklist

### Database Migration
- [ ] Run `migration-timer-bidding-system.sql` in Supabase SQL Editor
- [ ] Verify all new columns exist in profiles, items, and claims tables
- [ ] Confirm indexes were created successfully
- [ ] Check that existing items have `expires_at` populated

### Basic Functionality
- [ ] Upload a new item and verify it has `expires_at` and `status='active'`
- [ ] Confirm timer badge appears on all item cards
- [ ] Verify timer displays correct time format (days/hours/minutes)
- [ ] Check points display in navigation bar (should show 100 for new users)

### Timer Display Tests
- [ ] Create item and verify it shows "7 days" initially
- [ ] Wait 1 minute and confirm timer updates
- [ ] Manually set `expires_at` to 23 hours away, verify shows "X hours"
- [ ] Manually set `expires_at` to 30 minutes away, verify shows "X minutes"
- [ ] Set `expires_at` to past date, verify item disappears from browse

### Bidding System Tests

#### Single User Dibs
- [ ] User A calls dibs on item
- [ ] Verify purple overlay and heart badge appear
- [ ] No bidding panel should show (no conflict)
- [ ] User B passes on same item
- [ ] Item should resolve immediately to User A

#### Conflict State
- [ ] User A calls dibs on item
- [ ] User B calls dibs on same item
- [ ] Both users should see:
  - [ ] Pink gradient overlay
  - [ ] Interested users badges in top-left
  - [ ] White price tag badge in center
  - [ ] Bidding panel at bottom

#### Placing Bids
- [ ] Click "Place Your Bid" button
- [ ] Enter bid amount (e.g., 23)
- [ ] Click "Save Bid"
- [ ] Verify panel shows "23 points" with available points updated
- [ ] Verify navigation bar points decreased
- [ ] Click "Edit" to modify bid
- [ ] Change bid and save
- [ ] Verify new bid amount saved

#### Bid Validation
- [ ] Try to bid more than available points (should cap at max)
- [ ] Try to bid negative number (should cap at 0)
- [ ] Cancel bid edit and verify returns to previous state

### Resolution Tests

#### Highest Bidder Wins
- [ ] User A bids 50 points on item
- [ ] User B bids 30 points on same item
- [ ] Wait for expiration or manually expire
- [ ] Verify User A wins (item status = 'resolved', winner_id = User A)
- [ ] Verify User A's points decreased by 50
- [ ] Verify User B's points unchanged

#### Bid Tie Extension
- [ ] User A bids 40 points
- [ ] User B bids 40 points
- [ ] Wait for expiration
- [ ] Verify `expires_at` extended by 24 hours
- [ ] Have one user increase bid
- [ ] Wait for new expiration
- [ ] Verify higher bidder wins

#### Zero-Point Users
- [ ] Manually set User A points to 0
- [ ] User A calls dibs on item with no bid
- [ ] User B bids 10 points
- [ ] Verify User B wins (User A auto-loses to any bid >0)
- [ ] Test User A winning when all others withdraw

#### Immediate Resolution
- [ ] 3 users in household, User A calls dibs, Users B & C pass
- [ ] Verify item resolves immediately to User A
- [ ] All users pass on item
- [ ] Verify item status = 'donated', winner_id = null

### Couples Feature Tests

#### Setting Up Couples
- [ ] Link two users with same `couple_id` in database
- [ ] Verify both users show same points in navigation
- [ ] Verify one partner can place bid for both

#### Couple Behavior
- [ ] Partner A calls dibs on item
- [ ] Partner B also calls dibs on same item
- [ ] Verify NO conflict state (they see regular dibs overlay)
- [ ] Their names should appear together in interested badges
- [ ] Format should be: "User A & User B"

#### Couples vs Singles
- [ ] Couple calls dibs on item
- [ ] Single user also calls dibs
- [ ] Verify conflict state shows
- [ ] Badge should show "User1 & User2" for couple
- [ ] Badge should show "User3" for single user
- [ ] Couple can place one bid (either partner)

### UI/UX Tests

#### Timer Badge
- [ ] Positioned 8px from top-right
- [ ] White background with shadow
- [ ] Clock icon visible
- [ ] Text legible

#### Interested Users Badges
- [ ] Positioned 8px from top-left
- [ ] Stacked vertically with 8px gap
- [ ] Heart icons visible
- [ ] Names readable
- [ ] Only shows when 2+ interested parties

#### Bidding Panel
- [ ] Panel positioned at bottom of card
- [ ] All three states work correctly:
  1. Initial: "Place Your Bid" clickable
  2. Edit: Input field functional, Cancel/Save work
  3. Completed: Shows bid amount, Edit button works
- [ ] Price tag icon centered above panel

#### Points Display
- [ ] Shows in navigation bar
- [ ] Updates in real-time when bid placed
- [ ] Updates when item resolved
- [ ] Price tag icon visible

### Real-Time Updates

#### Item Changes
- [ ] User A uploads item, User B sees it immediately
- [ ] User A calls dibs, User B sees updated state
- [ ] Item resolves, all users see status change

#### Points Updates
- [ ] User places bid, points update immediately in nav
- [ ] User wins item, points deducted and reflected
- [ ] Couple partner's points update for both

#### Profile Changes
- [ ] Update user points manually in database
- [ ] Verify points update in UI without refresh

### Cross-Browser Testing
- [ ] Chrome
- [ ] Firefox
- [ ] Safari
- [ ] Mobile Safari (iOS)
- [ ] Chrome Mobile (Android)

### Mobile Responsive
- [ ] Timer badge visible and positioned correctly
- [ ] Interested badges readable
- [ ] Bidding panel accessible
- [ ] Points display fits in navigation
- [ ] Touch interactions work (tap to bid, edit, etc.)

### Error Handling
- [ ] Network error while placing bid (should show error message)
- [ ] Bid fails to save (should revert to previous state)
- [ ] Item deleted while user viewing (should handle gracefully)
- [ ] User logged out while editing bid (should redirect to login)

### Performance
- [ ] Load 50+ items, check page performance
- [ ] Multiple real-time subscriptions don't slow down app
- [ ] Timer updates don't cause flickering
- [ ] Image loading optimized

## Known Limitations

1. **Client-Side Expiration**: Currently checks for expired items in browser. For production, implement server-side cron job.

2. **Bid Privacy**: Users can see WHO is interested but not their bids. This is by design.

3. **Point Reset**: No UI to reset points. Must be done via SQL.

4. **Couple Management**: No UI to create/manage couples. Must be done via SQL.

5. **Historical Data**: No bid history or transaction log (can be added later).

## Post-Deployment Monitoring

- [ ] Monitor Supabase logs for errors
- [ ] Check real-time subscription usage
- [ ] Monitor database query performance
- [ ] Track user engagement with bidding feature
- [ ] Gather user feedback on 7-day timer duration

## Rollback Plan

If critical issues arise:

1. **Database Rollback**:
```sql
-- Remove new columns (data will be lost)
ALTER TABLE profiles DROP COLUMN IF EXISTS points;
ALTER TABLE profiles DROP COLUMN IF EXISTS couple_id;
ALTER TABLE items DROP COLUMN IF EXISTS expires_at;
ALTER TABLE items DROP COLUMN IF EXISTS status;
ALTER TABLE items DROP COLUMN IF EXISTS winner_id;
ALTER TABLE items DROP COLUMN IF EXISTS resolved_at;
ALTER TABLE claims DROP COLUMN IF EXISTS bid_amount;
```

2. **Code Rollback**:
   - Revert to previous git commit
   - Remove new components and utilities
   - Restore original ItemCard, Browse, Layout

3. **Verify**:
   - App loads without errors
   - Basic dibs/pass functionality works
   - No console errors

