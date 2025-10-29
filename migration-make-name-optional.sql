-- Migration: Make item name optional
-- Run this in your Supabase SQL Editor

-- Remove NOT NULL constraint from name column
ALTER TABLE items 
ALTER COLUMN name DROP NOT NULL;

