# Dibs - Estate Item Sharing App

A mobile-first web application for families to browse, claim, and manage estate items. Built with React, Vite, Tailwind CSS, and Supabase.

## Features

- 🔐 **Secure Authentication** - Email/password login with Supabase Auth
- 📸 **Image Upload** - Camera and gallery support for mobile devices
- 🖼️ **Browse Gallery** - Responsive grid layout with filtering options
- ⭐ **Dibs/Decline System** - Claim items you want or pass on items
- 📊 **Conflict Detection** - Real-time tracking of items with multiple claims
- 🔄 **Live Updates** - Real-time synchronization across all users
- 📱 **Mobile-First Design** - Optimized for smartphones and tablets

## Tech Stack

- **Frontend**: React 18 with Vite
- **Backend**: Supabase (PostgreSQL + Storage + Auth)
- **Styling**: Tailwind CSS
- **Routing**: React Router v6
- **Real-time**: Supabase Realtime subscriptions

## Prerequisites

- Node.js 18+ and npm
- A Supabase account (free tier works great)

## Setup Instructions

### 1. Clone the Repository

```bash
cd dibs
```

### 2. Set Up Supabase

1. Go to [supabase.com](https://supabase.com) and create a new project
2. Wait for the project to finish setting up
3. Go to **Project Settings > API** and copy:
   - Project URL
   - `anon` public API key

### 3. Create Database Schema

1. In your Supabase dashboard, go to **SQL Editor**
2. Click **New query**
3. Copy the contents of `supabase-schema.sql` and paste it into the editor
4. Click **Run** to execute the SQL

This will create:
- `profiles` table (user profiles)
- `items` table (estate items)
- `claims` table (user claims on items)
- Row Level Security policies
- Indexes for performance
- Trigger for automatic profile creation

### 4. Create Storage Bucket

1. In Supabase dashboard, go to **Storage**
2. Click **Create bucket**
3. Name it: `item-images`
4. Make it **Public**
5. Click **Create**

Then set up storage policies:
1. Click on the `item-images` bucket
2. Go to **Policies** tab
3. Add the following policies:

**SELECT (Read)** - Everyone can view:
```sql
true
```

**INSERT (Upload)** - Authenticated users can upload:
```sql
auth.role() = 'authenticated'
```

**UPDATE** - Users can update their own:
```sql
(bucket_id = 'item-images'::text)
```

**DELETE** - Users can delete their own:
```sql
(bucket_id = 'item-images'::text)
```

### 5. Create Test Users

Create 8 test users in Supabase Dashboard:

1. Go to **Authentication > Users**
2. Click **Add user** > **Create new user**
3. Create each user with:

| Email | Password | Full Name |
|-------|----------|-----------|
| alice@example.com | password123 | Alice Johnson |
| bob@example.com | password123 | Bob Smith |
| carol@example.com | password123 | Carol Williams |
| david@example.com | password123 | David Brown |
| emma@example.com | password123 | Emma Davis |
| frank@example.com | password123 | Frank Miller |
| grace@example.com | password123 | Grace Wilson |
| henry@example.com | password123 | Henry Moore |

**Note**: Profiles will be automatically created via the database trigger.

### 6. Configure Environment Variables

1. Navigate to the client directory:
```bash
cd client
```

2. Copy the example env file:
```bash
cp .env.example .env.local
```

3. Edit `.env.local` and add your Supabase credentials:
```
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 7. Install Dependencies

```bash
npm install
```

### 8. Run the Development Server

```bash
npm run dev
```

The app will open at `http://localhost:5173`

## Usage

### Login

Use any of the test user accounts to log in:
- Email: `alice@example.com`
- Password: `password123`

### Upload Items

1. Click **Upload** in the navigation
2. Take a photo or select from gallery
3. Add item name and optional description
4. Click **Upload Item**

### Browse and Claim

1. Browse all items on the home page
2. Use filters to view specific categories:
   - All Items
   - Items I'm Interested In
   - Declined Items
   - Unclaimed Items
   - Items with Conflicts

3. For each item:
   - Click **Want** (👍) to express interest
   - Click **Pass** (👎) to decline
   - Click again to undo your choice

### View Your Choices

1. Click **My Choices** to see all items you've interacted with
2. Items are separated into:
   - Items I Want (with conflict warnings)
   - Items I've Declined

### Resolve Conflicts

1. Click **Conflicts** to see items with multiple claims
2. View everyone interested in each contested item
3. Use this view to coordinate with family members

## Project Structure

```
dibs/
├── client/                 # React frontend
│   ├── src/
│   │   ├── api/           # Supabase client
│   │   ├── components/    # Reusable components
│   │   │   ├── ItemCard.jsx
│   │   │   └── Layout.jsx
│   │   ├── pages/         # Page components
│   │   │   ├── Browse.jsx
│   │   │   ├── Conflicts.jsx
│   │   │   ├── Login.jsx
│   │   │   ├── MyChoices.jsx
│   │   │   └── Upload.jsx
│   │   ├── hooks/         # Custom hooks
│   │   │   └── useAuth.js
│   │   ├── utils/         # Utilities
│   │   │   └── AuthContext.jsx
│   │   ├── App.jsx        # Main app component
│   │   └── main.jsx       # Entry point
│   ├── .env.local         # Environment variables (create this)
│   └── package.json
├── supabase-schema.sql    # Database schema
├── create-test-users.sql  # Test user reference
└── README.md
```

## Building for Production

```bash
cd client
npm run build
```

The production-ready files will be in `client/dist/`.

## Deployment

### Frontend (Vercel - Recommended)

1. Push your code to GitHub
2. Go to [vercel.com](https://vercel.com)
3. Click **Import Project**
4. Select your repository
5. Set the root directory to `client`
6. Add environment variables:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
7. Click **Deploy**

### Frontend (Netlify)

1. Push your code to GitHub
2. Go to [netlify.com](https://netlify.com)
3. Click **Add new site** > **Import an existing project**
4. Select your repository
5. Set:
   - Base directory: `client`
   - Build command: `npm run build`
   - Publish directory: `client/dist`
6. Add environment variables in **Site settings > Environment variables**
7. Click **Deploy site**

### Backend

Supabase is already hosted - no additional deployment needed!

## Features Detail

### Real-time Updates

The app uses Supabase Realtime to automatically sync changes:
- New items appear instantly for all users
- Claim updates reflect immediately
- Conflict status updates in real-time

### Mobile Optimization

- Touch-friendly buttons (44px minimum)
- Camera access for direct photo capture
- Responsive grid layouts
- Bottom navigation on mobile
- Swipe-friendly interface

### Security

- Row Level Security (RLS) policies on all tables
- Users can only modify their own claims
- Image uploads restricted to authenticated users
- Secure session management via Supabase Auth

## Troubleshooting

### Can't see uploaded images

1. Make sure the `item-images` bucket is **Public**
2. Verify storage policies are set correctly
3. Check browser console for CORS errors

### Real-time updates not working

1. Verify your Supabase project has Realtime enabled
2. Check that you're on a supported Supabase plan
3. Look for connection errors in browser console

### Login issues

1. Verify users are created in Supabase Auth dashboard
2. Check that email confirmation is disabled for test accounts
3. Ensure environment variables are correct

## Future Enhancements

- [ ] Item categories and tags
- [ ] Comments on items
- [ ] Export decisions to CSV
- [ ] Email notifications
- [ ] Multiple photos per item
- [ ] Search functionality
- [ ] User avatars
- [ ] Activity log

## License

MIT

## Support

For issues or questions, please check the Supabase documentation or create an issue in the repository.

