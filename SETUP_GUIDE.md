# Dibs App - Quick Setup Guide

This guide will help you get the Dibs app running in under 10 minutes.

## Step 1: Create Supabase Project (2 minutes)

1. Go to [supabase.com](https://supabase.com) and sign up/login
2. Click **New Project**
3. Fill in:
   - **Name**: dibs-app (or your choice)
   - **Database Password**: (save this somewhere safe)
   - **Region**: Choose closest to you
4. Click **Create new project**
5. Wait ~2 minutes for project to initialize

## Step 2: Get API Keys (1 minute)

1. In your Supabase project dashboard, click **Project Settings** (gear icon)
2. Click **API** in the sidebar
3. Copy these two values (you'll need them later):
   - **Project URL** (looks like: `https://xxxxx.supabase.co`)
   - **anon public** key (under "Project API keys")

## Step 3: Set Up Database (2 minutes)

1. In Supabase dashboard, click **SQL Editor** in the sidebar
2. Click **New query**
3. Open the file `supabase-schema.sql` from this project
4. Copy all the SQL code and paste it into the Supabase SQL editor
5. Click **Run** (or press Cmd/Ctrl + Enter)
6. You should see "Success. No rows returned"

## Step 4: Create Storage Bucket (3 minutes)

### Create the Bucket

1. In Supabase dashboard, click **Storage** in the sidebar
2. Click **Create a new bucket**
3. Enter name: `item-images`
4. Toggle **Public bucket** to ON
5. Click **Create bucket**

### Set Up Storage Policies

6. Click on the `item-images` bucket name
7. Go to **Policies** tab
8. You'll create 4 policies (one for each operation)

**Policy 1: SELECT (viewing images) - Public Access**
- Click **New Policy** button
- Enter policy name: `Public Access`
- Under **Allowed operation**: Check **SELECT** only
- **Target roles**: Leave as "Defaults to all (public) roles if none selected"
- **Policy definition**: Clear the text box and enter: `true`
- Click **Review** then **Save policy**

**Policy 2: INSERT (uploading images) - Authenticated Users**
- Click **New Policy** button
- Enter policy name: `Authenticated Upload`
- Under **Allowed operation**: Check **INSERT** only
- **Target roles**: Select **authenticated** from the dropdown
- **Policy definition**: Enter: `true`
- Click **Review** then **Save policy**

**Policy 3: UPDATE - Authenticated Users**
- Click **New Policy** button
- Enter policy name: `Authenticated Update`
- Under **Allowed operation**: Check **UPDATE** only
- **Target roles**: Select **authenticated** from the dropdown
- **Policy definition**: Enter: `true`
- Click **Review** then **Save policy**

**Policy 4: DELETE - Authenticated Users**
- Click **New Policy** button
- Enter policy name: `Authenticated Delete`
- Under **Allowed operation**: Check **DELETE** only
- **Target roles**: Select **authenticated** from the dropdown
- **Policy definition**: Enter: `true`
- Click **Review** then **Save policy**

**Note**: The policy definition `true` means "always allow this operation (for the specified role)". Since you're already in the `item-images` bucket's policy section, Supabase automatically scopes these policies to this bucket only.

## Step 5: Create Test Users (2 minutes)

1. In Supabase dashboard, click **Authentication** in the sidebar
2. Click **Users** tab
3. Click **Add user** dropdown, select **Create new user**
4. **Uncheck** "Auto Confirm User" (important!)
5. Create these 8 users:

| Email | Password |
|-------|----------|
| alice@example.com | password123 |
| bob@example.com | password123 |
| carol@example.com | password123 |
| david@example.com | password123 |
| emma@example.com | password123 |
| frank@example.com | password123 |
| grace@example.com | password123 |
| henry@example.com | password123 |

For each user:
- Click **Add user** > **Create new user**
- Enter email and password
- Expand **User Meta Data** section
- Click **Add**
- Enter key: `full_name`
- Enter value: `Alice Johnson` (or appropriate name from list below)
- Click **Create user**

Names for metadata:
- alice@example.com → Alice Johnson
- bob@example.com → Bob Smith
- carol@example.com → Carol Williams
- david@example.com → David Brown
- emma@example.com → Emma Davis
- frank@example.com → Frank Miller
- grace@example.com → Grace Wilson
- henry@example.com → Henry Moore

## Step 6: Configure the App (1 minute)

1. Open the project in your code editor
2. Navigate to the `client` folder
3. Create a file named `.env.local` (if it doesn't exist)
4. Add your Supabase credentials:

```
VITE_SUPABASE_URL=https://xxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key_here
```

Replace with the values you copied in Step 2.

## Step 7: Install and Run (1 minute)

Open terminal in the `client` directory and run:

```bash
npm install
npm run dev
```

The app will open at `http://localhost:5173`

## Step 8: Test Login

1. Go to `http://localhost:5173`
2. Log in with any test user:
   - Email: `alice@example.com`
   - Password: `password123`

## You're Done! 🎉

You can now:
- Upload items with photos
- Browse all items
- Click "Want" or "Pass" on items
- View your choices
- See conflicts when multiple people want the same item

## Troubleshooting

**Issue**: Can't log in
- Make sure you unchecked "Auto Confirm User" when creating accounts
- Verify the email and password are correct
- Check that .env.local has the correct credentials

**Issue**: Images won't upload
- Verify the storage bucket is named exactly `item-images`
- Make sure it's set to Public
- Check that all 4 storage policies are created

**Issue**: App won't start
- Make sure you're in the `client` directory
- Run `npm install` again
- Check that .env.local exists and has both variables

**Issue**: Can't see other users' items
- Verify the database schema was run successfully
- Check browser console for errors
- Make sure you're logged in

## Next Steps

- Invite family members to create accounts
- Start uploading estate items
- Have everyone mark their preferences
- Use the Conflicts view to resolve items multiple people want

Enjoy using Dibs! 📦✨

