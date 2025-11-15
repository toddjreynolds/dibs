-- Migration: Add Roles and Groups Support
-- This migration adds role-based permissions and multi-group architecture
-- Run this in your Supabase SQL Editor

-- Step 1: Create groups table (without policies yet)
CREATE TABLE IF NOT EXISTS groups (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on groups (policies added later after columns exist)
ALTER TABLE groups ENABLE ROW LEVEL SECURITY;

-- Step 2: Create role enum type
DO $$ BEGIN
  CREATE TYPE user_role AS ENUM ('participant', 'organizer', 'admin');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Step 3: Add columns to profiles table
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS role user_role DEFAULT 'participant' NOT NULL;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS group_id UUID REFERENCES groups(id) ON DELETE SET NULL;

-- Step 4: Add columns to items table
ALTER TABLE items ADD COLUMN IF NOT EXISTS group_id UUID REFERENCES groups(id) ON DELETE CASCADE;
ALTER TABLE items ADD COLUMN IF NOT EXISTS delivered_at TIMESTAMP WITH TIME ZONE;

-- Step 5: Add group_id to claims table
ALTER TABLE claims ADD COLUMN IF NOT EXISTS group_id UUID REFERENCES groups(id) ON DELETE CASCADE;

-- Step 6: Create default "Reynolds Family" group and migrate data
DO $$
DECLARE
  default_group_id UUID;
  first_user_id UUID;
BEGIN
  -- Get the first user (oldest created_at) to be the admin
  SELECT id INTO first_user_id
  FROM profiles
  ORDER BY created_at ASC
  LIMIT 1;

  -- Create the default group
  INSERT INTO groups (name, created_by, created_at)
  VALUES ('Reynolds Family', first_user_id, NOW())
  RETURNING id INTO default_group_id;

  -- Assign all existing users to the default group
  UPDATE profiles
  SET group_id = default_group_id;

  -- Set the first user as admin
  UPDATE profiles
  SET role = 'admin'
  WHERE id = first_user_id;

  -- Assign all existing items to the default group
  UPDATE items
  SET group_id = default_group_id;

  -- Assign all existing claims to the default group
  UPDATE claims
  SET group_id = default_group_id;

  RAISE NOTICE 'Default group created with ID: %', default_group_id;
  RAISE NOTICE 'First user % set as admin', first_user_id;
END $$;

-- Step 7: Create permission helper functions

-- Function to check if user is organizer or admin
CREATE OR REPLACE FUNCTION is_organizer_or_admin(user_id UUID, check_group_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM profiles
    WHERE id = user_id
    AND group_id = check_group_id
    AND role IN ('organizer', 'admin')
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if user is admin
CREATE OR REPLACE FUNCTION is_admin(user_id UUID, check_group_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM profiles
    WHERE id = user_id
    AND group_id = check_group_id
    AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get user's role
CREATE OR REPLACE FUNCTION get_user_role(user_id UUID)
RETURNS user_role AS $$
DECLARE
  user_role_result user_role;
BEGIN
  SELECT role INTO user_role_result
  FROM profiles
  WHERE id = user_id;
  
  RETURN COALESCE(user_role_result, 'participant'::user_role);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if user can manage an item
CREATE OR REPLACE FUNCTION can_manage_item(user_id UUID, item_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  item_group_id UUID;
  item_uploader_id UUID;
BEGIN
  -- Get item details
  SELECT group_id, uploaded_by INTO item_group_id, item_uploader_id
  FROM items
  WHERE id = item_id;
  
  -- User can manage if they're the uploader OR they're organizer/admin in the group
  RETURN (
    item_uploader_id = user_id OR
    is_organizer_or_admin(user_id, item_group_id)
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 8: Create groups policies (now that group_id columns exist)
CREATE POLICY "Users can view their own group"
  ON groups FOR SELECT
  USING (
    id IN (
      SELECT group_id FROM profiles WHERE profiles.id = auth.uid()
    )
  );

CREATE POLICY "Admins can update their group"
  ON groups FOR UPDATE
  USING (
    id IN (
      SELECT group_id FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'admin'
    )
  );

-- Step 9: Update RLS policies for role-based permissions

-- Drop old items policies
DROP POLICY IF EXISTS "Users can update own items" ON items;
DROP POLICY IF EXISTS "Users can delete own items" ON items;

-- New items policies with role support
CREATE POLICY "Users can update items they uploaded or manage"
  ON items FOR UPDATE
  USING (can_manage_item(auth.uid(), id));

CREATE POLICY "Users can delete items they uploaded or manage"
  ON items FOR DELETE
  USING (can_manage_item(auth.uid(), id));

-- Update profiles policies for role management
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (
    -- Users can update their own profile but not change their role
    (auth.uid() = id AND role = (SELECT role FROM profiles WHERE id = auth.uid()))
  );

CREATE POLICY "Admins can update user roles in their group"
  ON profiles FOR UPDATE
  USING (
    -- Admin can update users in their group
    EXISTS (
      SELECT 1 FROM profiles AS admin_profile
      WHERE admin_profile.id = auth.uid()
      AND admin_profile.role = 'admin'
      AND admin_profile.group_id = profiles.group_id
    )
  );

-- Step 10: Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_profiles_group_id ON profiles(group_id);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);
CREATE INDEX IF NOT EXISTS idx_items_group_id ON items(group_id);
CREATE INDEX IF NOT EXISTS idx_items_delivered_at ON items(delivered_at);
CREATE INDEX IF NOT EXISTS idx_claims_group_id ON claims(group_id);

-- Step 11: Update the handle_new_user function to assign default group
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  default_group_id UUID;
BEGIN
  -- Get the default group (for now, just get the first group)
  -- In future multi-group implementation, this will be based on invitation
  SELECT id INTO default_group_id
  FROM groups
  ORDER BY created_at ASC
  LIMIT 1;

  INSERT INTO public.profiles (id, full_name, points, group_id, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'User'),
    100,
    default_group_id,
    'participant'::user_role
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Migration complete!
-- Verify with:
-- SELECT * FROM groups;
-- SELECT id, full_name, role, group_id FROM profiles;
-- SELECT id, name, group_id FROM items LIMIT 5;

