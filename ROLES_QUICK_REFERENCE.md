# Roles & Permissions - Quick Reference

## 🚀 Quick Start

### 1. Run Migration (Required First Step)
Open Supabase SQL Editor and run: `migration-roles-and-groups.sql`

### 2. Verify Setup
```sql
-- Check your role
SELECT full_name, role FROM profiles WHERE id = auth.uid();

-- View all users and roles
SELECT full_name, role FROM profiles ORDER BY created_at;
```

### 3. Test Access
- **Admin:** Navigate to `/admin` and `/organizer`
- **Organizer:** Navigate to `/organizer` (should work), `/admin` (should redirect)
- **Participant:** Both should redirect to home

---

## 👥 Role Capabilities at a Glance

| Feature | Participant | Organizer | Admin |
|---------|-------------|-----------|-------|
| Dibs/Pass items | ✅ | ✅ | ✅ |
| Edit own items | ✅ | ✅ | ✅ |
| Edit ANY item | ❌ | ✅ | ✅ |
| Delete ANY item | ❌ | ✅ | ✅ |
| View Organizer Dashboard | ❌ | ✅ | ✅ |
| Mark items delivered | ❌ | ✅ | ✅ |
| See all bids | ❌ | ✅ | ✅ |
| Access Admin Settings | ❌ | ❌ | ✅ |
| Change user roles | ❌ | ❌ | ✅ |
| Adjust points | ❌ | ❌ | ✅ |
| Remove users | ❌ | ❌ | ✅ |

---

## 🎯 Common Tasks

### Promote User to Organizer (Admin)
1. Go to `/admin`
2. Find user in list
3. Change dropdown from "Participant" to "Organizer"
4. User immediately gains organizer access

### Mark Item as Delivered (Organizer)
1. Go to `/organizer`
2. Find resolved item
3. Click "Mark as Delivered" button
4. Status updates to green checkmark

### Edit Any Item (Organizer)
1. Browse to any item page
2. Click blue edit button (top-left of item card)
3. Modify details
4. Save changes

### Adjust User Points (Admin)
1. Go to `/admin`
2. Click edit icon next to user's points
3. Enter new value
4. Confirm

### Delete Any Item (Organizer)
1. Find item on any page
2. Click red delete button (top-left of item card)
3. Confirm deletion

---

## 🔐 Security Notes

- **RLS Enabled:** All tables have Row Level Security
- **Permission Functions:** Database validates permissions server-side
- **Route Guards:** Frontend prevents unauthorized page access
- **Real-time Updates:** Role changes apply immediately

---

## 📊 Admin Quick Stats

### View Role Distribution
```sql
SELECT role, COUNT(*) FROM profiles GROUP BY role;
```

### Check Pending Deliveries
```sql
SELECT COUNT(*) FROM items 
WHERE status = 'resolved' AND delivered_at IS NULL;
```

### View Recent Role Changes (if audit log added)
```sql
-- Future feature
```

---

## 🐛 Quick Troubleshooting

| Problem | Solution |
|---------|----------|
| "Organizer" link not showing | Check role in profiles table |
| Can't edit other's items | Verify role is organizer/admin |
| Page redirects unexpectedly | Check route guards in App.jsx |
| Bid amounts hidden | Must be organizer to see bids |
| Delivery toggle not working | Check RLS on items table |

---

## 📱 Navigation Reference

- **/** - Home (Browse items)
- **/organizer** - Delivery tracking (Organizer+)
- **/admin** - User & role management (Admin only)

---

## 🔄 Role Hierarchy

```
Admin (Full Control)
  └─ Can do everything Organizer can
     └─ Organizer (Item & Delivery Management)
        └─ Can do everything Participant can
           └─ Participant (Standard User)
```

---

## 📁 Key Files Reference

- **Migration:** `migration-roles-and-groups.sql`
- **Testing Guide:** `ROLES_TESTING_GUIDE.md`
- **Full Summary:** `ROLES_IMPLEMENTATION_SUMMARY.md`
- **Permission Hooks:** `client/src/hooks/useRole.js`
- **Organizer Page:** `client/src/pages/Organizer.jsx`
- **Admin Page:** `client/src/pages/Admin.jsx`

---

## ✅ Pre-Launch Checklist

- [ ] Migration run successfully in production
- [ ] First user confirmed as admin
- [ ] Test organizer can edit items
- [ ] Test organizer can track deliveries
- [ ] Test admin can change roles
- [ ] Test participant permissions restricted
- [ ] Navigation shows correct links per role
- [ ] Real-time updates working

---

**Need Help?** Check `ROLES_TESTING_GUIDE.md` for detailed testing scenarios and solutions.

