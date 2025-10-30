-- Migration: Add first_name column to profiles table
-- Run this in your Supabase SQL Editor

-- Add first_name column (nullable to allow existing records)
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS first_name TEXT;

-- Optionally populate first_name from full_name (extract first word)
UPDATE profiles 
SET first_name = SPLIT_PART(full_name, ' ', 1)
WHERE first_name IS NULL;

