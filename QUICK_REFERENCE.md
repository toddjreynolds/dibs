# Quick Reference Guide - Timer & Bidding System

## 🚀 Quick Start

### Deploy in 3 Steps
1. Run `migration-timer-bidding-system.sql` in Supabase
2. Deploy the code to your hosting platform
3. Verify timer badges appear on items

## 🔧 Common Operations

### Create a Couple
```sql
UPDATE profiles 
SET couple_id = gen_random_uuid()
WHERE full_name IN ('User1', 'User2');
```

### Reset User Points
```sql
UPDATE profiles SET points = 100 WHERE id = 'user-id';
```

### Manually Expire an Item
```sql
UPDATE items 
SET expires_at = NOW() - INTERVAL '1 hour'
WHERE id = 'item-id';
```

### Check Item Status
```sql
SELECT id, status, expires_at, winner_id 
FROM items 
WHERE id = 'item-id';
```

### View All Bids on an Item
```sql
SELECT c.bid_amount, p.full_name, c.status
FROM claims c
JOIN profiles p ON c.user_id = p.id
WHERE c.item_id = 'item-id' AND c.status = 'interested';
```

### Find Conflicts
```sql
SELECT i.id, COUNT(c.id) as interested_count
FROM items i
JOIN claims c ON i.id = c.item_id
WHERE c.status = 'interested' AND i.status = 'active'
GROUP BY i.id
HAVING COUNT(c.id) > 1;
```

## 📊 Key Features

### Timer Behavior
- **Duration**: 7 days from upload
- **Expiration Time**: 7pm (19:00)
- **Display Format**: 
  - 8-2 days: "X days"
  - 24h-1h: "X hours"
  - <1h: "X minutes"

### Point System
- **Starting Points**: 100 per user
- **Bid Range**: 0 to user's available points
- **Deduction**: Only when item won
- **Couple Sharing**: Couples share same point pool

### Resolution Rules
| Scenario | Outcome |
|----------|---------|
| Solo dibs + all passed | Immediate win |
| All users passed | Donated |
| No dibs at expiration | Donated |
| Conflict at expiration | Highest bidder wins |
| Tie in bids | Extend 24 hours |

## 🎨 UI Components

### Timer Badge
- Location: Top-right corner
- Spacing: 8px from edges
- Style: White pill with clock icon

### Interested Badges
- Location: Top-left corner
- Spacing: 8px gap between badges
- Shows: User names with heart icon
- Visible: Only in conflicts (2+ interested)

### Bidding Panel States
1. **Initial**: "Place Your Bid" + available points
2. **Edit**: Number input + Cancel/Save
3. **Completed**: Bid amount + Edit button

### Points Display
- Location: Navigation bar
- Icon: Price tag
- Format: "100 pts"

## 🐛 Troubleshooting

### Timer Not Showing
```sql
-- Check if expires_at is set
SELECT id, expires_at FROM items WHERE expires_at IS NULL;

-- Fix missing expires_at
UPDATE items 
SET expires_at = created_at + INTERVAL '7 days'
WHERE expires_at IS NULL;
```

### Bidding Panel Not Appearing
```sql
-- Check for conflicts
SELECT i.id, COUNT(c.id) as count
FROM items i
JOIN claims c ON i.id = c.item_id
WHERE c.status = 'interested'
GROUP BY i.id;
```

### Points Not Updating
```javascript
// Check browser console for:
// - Supabase connection errors
// - Real-time subscription errors
// - Profile fetch errors
```

### Item Not Resolving
```sql
-- Manually trigger resolution by updating expires_at
UPDATE items 
SET expires_at = NOW() - INTERVAL '1 minute'
WHERE id = 'item-id';

-- Check item resolution
SELECT status, winner_id, resolved_at 
FROM items 
WHERE id = 'item-id';
```

## 📱 Testing Quick Commands

### Create Test Scenario
```sql
-- Create conflict
-- (have 2+ users call dibs via UI)

-- Set to expire soon
UPDATE items 
SET expires_at = NOW() + INTERVAL '5 minutes'
WHERE id = 'item-id';

-- Watch for auto-resolution
-- Check status after 5 minutes
```

### Simulate Bid Tie
```sql
-- Set equal bids
UPDATE claims 
SET bid_amount = 50
WHERE item_id = 'item-id' AND status = 'interested';

-- Trigger expiration
UPDATE items 
SET expires_at = NOW() - INTERVAL '1 minute'
WHERE id = 'item-id';

-- Check if expires_at extended
SELECT expires_at FROM items WHERE id = 'item-id';
```

## 📞 Support Resources

| Issue | Resource |
|-------|----------|
| Feature details | TIMER_AND_BIDDING_IMPLEMENTATION.md |
| Testing procedures | TESTING_CHECKLIST.md |
| Deployment steps | IMPLEMENTATION_SUMMARY.md |
| This guide | QUICK_REFERENCE.md |

## 🔑 Key Files

```
Database:
  - migration-timer-bidding-system.sql
  - supabase-schema.sql

Components:
  - TimerBadge.jsx
  - InterestedUsersBadges.jsx
  - BiddingPanel.jsx
  - ItemCard.jsx (updated)
  - Layout.jsx (updated)

Utilities:
  - timerUtils.js
  - coupleUtils.js
  - itemResolution.js

Hooks:
  - useExpirationChecker.js
```

## 💾 Backup Commands

### Before Deployment
```sql
-- Backup profiles
CREATE TABLE profiles_backup AS SELECT * FROM profiles;

-- Backup items
CREATE TABLE items_backup AS SELECT * FROM items;

-- Backup claims
CREATE TABLE claims_backup AS SELECT * FROM claims;
```

### Rollback
```sql
-- Restore from backup (if needed)
DELETE FROM profiles;
INSERT INTO profiles SELECT * FROM profiles_backup;
-- Repeat for items and claims
```

## 🎯 Production Checklist

- [ ] Migration applied to production database
- [ ] Code deployed to hosting platform
- [ ] Environment variables set correctly
- [ ] Supabase real-time enabled
- [ ] Test user can see timer badges
- [ ] Test conflict and bidding works
- [ ] Points display correctly
- [ ] Real-time updates functioning
- [ ] Mobile responsive verified
- [ ] Error handling tested

## 📈 Monitoring

### Key Metrics to Watch
```sql
-- Active items
SELECT COUNT(*) FROM items WHERE status = 'active';

-- Resolved items
SELECT COUNT(*) FROM items WHERE status = 'resolved';

-- Average bid amount
SELECT AVG(bid_amount) FROM claims WHERE bid_amount > 0;

-- Users with 0 points
SELECT COUNT(*) FROM profiles WHERE points = 0;

-- Items expiring in 24 hours
SELECT COUNT(*) FROM items 
WHERE expires_at < NOW() + INTERVAL '24 hours' 
AND status = 'active';
```

---

**Quick Access**: Bookmark this file for fast reference during development and troubleshooting!

