-- Dibs App Database Schema for Supabase
-- Run this in your Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create profiles table (extends auth.users)
CREATE TABLE profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  full_name TEXT NOT NULL,
  points INTEGER DEFAULT 100 NOT NULL,
  couple_id UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Public profiles are viewable by everyone"
  ON profiles FOR SELECT
  USING (true);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

-- Create items table
CREATE TABLE items (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT,
  description TEXT,
  image_url TEXT,
  uploaded_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  expires_at TIMESTAMP WITH TIME ZONE,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'resolved', 'donated')) NOT NULL,
  winner_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  resolved_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE items ENABLE ROW LEVEL SECURITY;

-- Items policies
CREATE POLICY "Items are viewable by everyone"
  ON items FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can create items"
  ON items FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Users can update own items"
  ON items FOR UPDATE
  USING (auth.uid() = uploaded_by);

CREATE POLICY "Users can delete own items"
  ON items FOR DELETE
  USING (auth.uid() = uploaded_by);

-- Create claims table
CREATE TABLE claims (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  item_id UUID REFERENCES items(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  status TEXT CHECK (status IN ('interested', 'declined')) NOT NULL,
  bid_amount INTEGER DEFAULT 0 NOT NULL,
  claimed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(item_id, user_id)
);

-- Enable Row Level Security
ALTER TABLE claims ENABLE ROW LEVEL SECURITY;

-- Claims policies
CREATE POLICY "Claims are viewable by everyone"
  ON claims FOR SELECT
  USING (true);

CREATE POLICY "Users can create own claims"
  ON claims FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own claims"
  ON claims FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own claims"
  ON claims FOR DELETE
  USING (auth.uid() = user_id);

-- Create indexes for better performance
CREATE INDEX idx_items_created_at ON items(created_at DESC);
CREATE INDEX idx_items_uploaded_by ON items(uploaded_by);
CREATE INDEX idx_items_expires_at ON items(expires_at);
CREATE INDEX idx_items_status ON items(status);
CREATE INDEX idx_profiles_couple_id ON profiles(couple_id);
CREATE INDEX idx_claims_item_id ON claims(item_id);
CREATE INDEX idx_claims_user_id ON claims(user_id);
CREATE INDEX idx_claims_status ON claims(status);

-- Function to automatically create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, points)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'User'),
    100
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create profile on signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Storage bucket for item images
-- Note: This needs to be created via Supabase Dashboard or CLI
-- Then set the following policies:

-- Storage policies (run after creating 'item-images' bucket in dashboard):
-- INSERT: authenticated users can upload
-- SELECT: everyone can view
-- UPDATE: users can update their own uploads
-- DELETE: users can delete their own uploads

