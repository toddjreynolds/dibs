-- Migration: Timer and Bidding System
-- Add new columns to existing database

-- Add columns to profiles table
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS points INTEGER DEFAULT 100 NOT NULL;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS couple_id UUID;

-- Add columns to items table
ALTER TABLE items ADD COLUMN IF NOT EXISTS expires_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE items ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active' CHECK (status IN ('active', 'resolved', 'donated')) NOT NULL;
ALTER TABLE items ADD COLUMN IF NOT EXISTS winner_id UUID REFERENCES profiles(id) ON DELETE SET NULL;
ALTER TABLE items ADD COLUMN IF NOT EXISTS resolved_at TIMESTAMP WITH TIME ZONE;

-- Add column to claims table
ALTER TABLE claims ADD COLUMN IF NOT EXISTS bid_amount INTEGER DEFAULT 0 NOT NULL;

-- Create new indexes
CREATE INDEX IF NOT EXISTS idx_items_expires_at ON items(expires_at);
CREATE INDEX IF NOT EXISTS idx_items_status ON items(status);
CREATE INDEX IF NOT EXISTS idx_profiles_couple_id ON profiles(couple_id);

-- Update existing items to have expires_at (7 days from created_at at 7pm)
UPDATE items 
SET expires_at = (
  DATE_TRUNC('day', created_at + INTERVAL '7 days') + TIME '19:00:00'
)
WHERE expires_at IS NULL AND status = 'active';

-- Update the handle_new_user function to include points
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

