# Role-Based Permissions Testing & Validation Guide

## Migration Steps

### 1. Run Database Migration

Execute the migration script in your Supabase SQL Editor:

```bash
# Open Supabase Dashboard → SQL Editor → New Query
# Paste contents of: migration-roles-and-groups.sql
# Click "Run"
```

**Expected Results:**
- ✅ `groups` table created
- ✅ `user_role` enum type created
- ✅ `profiles` table updated with `role` and `group_id` columns
- ✅ `items` table updated with `group_id` and `delivered_at` columns
- ✅ `claims` table updated with `group_id` column
- ✅ "Reynolds Family" group created
- ✅ All existing users assigned to default group
- ✅ First user (oldest) set as admin
- ✅ RLS policies updated for role-based permissions

### 2. Verify Migration

Run these queries to verify the migration:

```sql
-- Check groups table
SELECT * FROM groups;
-- Should show "Reynolds Family" group

-- Check profiles with roles
SELECT id, full_name, first_name, role, group_id FROM profiles;
-- First user should have role = 'admin'
-- All others should have role = 'participant'

-- Check items are assigned to group
SELECT id, name, group_id FROM items LIMIT 5;
-- All items should have group_id matching the default group

-- Check permission functions exist
SELECT routine_name FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_name IN ('is_organizer_or_admin', 'is_admin', 'get_user_role', 'can_manage_item');
-- Should return 4 functions
```

## Testing Role Permissions

### Participant Role (Default)

**What participants CAN do:**
- ✅ View all items in their group
- ✅ Dibs/pass on items
- ✅ Place bids on conflicted items
- ✅ Edit/delete their own uploaded items
- ✅ View their own claims and bids
- ✅ View My Stuff (won items)

**What participants CANNOT do:**
- ❌ Edit/delete other users' items
- ❌ Access /organizer page
- ❌ Access /admin page
- ❌ See other users' bid amounts in conflicts
- ❌ Mark items as delivered
- ❌ Change user roles

**Test Steps:**
1. Log in as a participant
2. Verify navigation does NOT show "Organizer" or "Admin" links
3. Try to access /organizer directly → should redirect to /
4. Try to access /admin directly → should redirect to /
5. Browse items and verify NO edit/delete buttons on others' items
6. View Conflicts page → bid amounts should be hidden from other users
7. Upload an item → verify you CAN edit/delete your own item

### Organizer Role

**What organizers CAN do (in addition to participant permissions):**
- ✅ Edit ANY item (name, description, image, timer)
- ✅ Delete ANY item
- ✅ Access /organizer page
- ✅ View all resolved items with winners
- ✅ Mark items as delivered/pending
- ✅ See ALL bid amounts in conflicts
- ✅ Filter deliveries by pending/delivered
- ✅ Search items by winner name

**What organizers CANNOT do:**
- ❌ Change user roles
- ❌ Remove users from group
- ❌ Adjust user points
- ❌ Access /admin page

**Test Steps:**
1. Set a user to organizer role (as admin):
   ```sql
   UPDATE profiles SET role = 'organizer' WHERE id = '<user_id>';
   ```
2. Log in as the organizer
3. Verify "Organizer" link appears in navigation
4. Browse items → verify edit/delete buttons on ALL items
5. Click edit on someone else's item → verify modal opens and save works
6. Click delete on someone else's item → verify deletion succeeds
7. Navigate to /organizer page:
   - Verify all resolved items are shown
   - Verify winner names are displayed
   - Toggle delivery status → verify updates in real-time
   - Test search by winner name
   - Test filter by pending/delivered
8. View Conflicts page → verify bid amounts are visible
9. Try to access /admin → should redirect to /

### Admin Role

**What admins CAN do (all organizer + participant permissions PLUS):**
- ✅ All organizer permissions
- ✅ Access /admin page
- ✅ View all group members with roles
- ✅ Change any user's role (participant/organizer/admin)
- ✅ Manually adjust any user's points
- ✅ Remove users from group
- ✅ Search/filter users

**What admins should be careful with:**
- ⚠️ Removing own admin role (confirm dialog)
- ⚠️ Removing last admin (should keep at least one)

**Test Steps:**
1. Log in as admin (first user from migration)
2. Verify both "Organizer" AND "Admin" links in navigation
3. Navigate to /admin page:
   - Verify all users are listed
   - Verify role badges displayed correctly
   - Verify stats cards show correct counts
4. Test role changes:
   - Change a participant to organizer → verify success
   - Change an organizer to admin → verify success
   - Change admin to participant → verify confirmation dialog
   - Log out and verify changed user has new permissions
5. Test points adjustment:
   - Click edit icon next to user's points
   - Enter new value → verify update succeeds
   - Check Browse page to verify points updated
6. Test user removal:
   - Click remove button → verify confirmation dialog
   - Confirm removal → verify user no longer in list
   - Verify removed user's group_id set to null in database
7. Test search functionality:
   - Search by name → verify filtering works
8. Verify admin also has organizer access:
   - Navigate to /organizer → verify page loads
   - Test delivery tracking features

## Real-World Scenarios

### Scenario 1: New Item Upload with Organizer Management
1. Participant uploads item with unclear description
2. Organizer edits item to clarify details
3. Multiple users dibs the item (conflict)
4. Organizer views bids in Conflicts page
5. Timer expires, item auto-resolves to highest bidder
6. Organizer sees item in /organizer with winner name
7. Organizer marks as delivered when handed off

### Scenario 2: Admin Role Management
1. Admin identifies active organizer role
2. Admin promotes participant to organizer
3. New organizer gains access to /organizer page
4. New organizer can now edit items and track deliveries
5. Admin monitors activity and adjusts as needed

### Scenario 3: Points Management
1. User reports incorrect points after bid
2. Admin reviews situation
3. Admin manually adjusts points with note
4. User can now place bid with corrected points

## Database Validation Queries

```sql
-- Check role distribution
SELECT role, COUNT(*) as count 
FROM profiles 
GROUP BY role;

-- Check items by group
SELECT g.name as group_name, COUNT(i.id) as item_count
FROM groups g
LEFT JOIN items i ON i.group_id = g.id
GROUP BY g.name;

-- Check delivery status
SELECT 
  status,
  delivered_at IS NOT NULL as is_delivered,
  COUNT(*) as count
FROM items
GROUP BY status, delivered_at IS NOT NULL;

-- Check permissions are working (run as different users)
SELECT can_manage_item(auth.uid(), '<some_item_id>');
-- Should return true for organizer/admin or item owner
-- Should return false for other participants

-- Verify RLS policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies
WHERE schemaname = 'public'
AND tablename IN ('profiles', 'items', 'claims', 'groups')
ORDER BY tablename, policyname;
```

## Common Issues & Solutions

### Issue: Navigation links not showing
**Solution:** Check that profile is being loaded in AuthContext with role field

### Issue: Edit/delete buttons not showing for organizers
**Solution:** Verify `useCanManageItem` hook is imported and used correctly

### Issue: Permission denied on item delete
**Solution:** Check RLS policies include `can_manage_item()` function

### Issue: /organizer or /admin redirecting to home
**Solution:** Verify role in profiles table and check route guards in App.jsx

### Issue: Bid amounts not showing to organizer in Conflicts
**Solution:** Verify `useIsOrganizer()` hook and bid_amount field in query

### Issue: Delivery status not updating
**Solution:** Check `delivered_at` column exists and RLS allows organizer updates

## Success Criteria

- ✅ Migration completes without errors
- ✅ All existing users assigned to "Reynolds Family" group
- ✅ First user has admin role
- ✅ Participants can only edit/delete their own items
- ✅ Organizers can edit/delete any item
- ✅ Organizers can access /organizer page and track deliveries
- ✅ Organizers can see bid amounts in conflicts
- ✅ Admins can access /admin page and manage roles
- ✅ Admins can adjust points and remove users
- ✅ Role badges display in navigation menu
- ✅ No linting errors in codebase
- ✅ Real-time updates work for all role-based features

## Next Steps (Future Implementation)

1. **Multi-group support:**
   - Group creation UI
   - Email invitations with signup links
   - Group switching for users in multiple groups
   - Cross-group isolation verification

2. **Notifications:**
   - Email when item won
   - Email when item delivered
   - In-app notification system

3. **Audit log:**
   - Track role changes
   - Track points adjustments
   - Track item edits by organizers

4. **Advanced organizer features:**
   - Bulk delivery status updates
   - Export delivery list as CSV
   - Item notes/comments for internal tracking

