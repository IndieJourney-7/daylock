-- =====================================================
-- ADD ROOM CODE (unique, generated from room name)
-- Run this in your Supabase SQL Editor
-- =====================================================

-- Add room_code column to rooms
ALTER TABLE rooms ADD COLUMN IF NOT EXISTS room_code TEXT UNIQUE;

-- Make time_start and time_end nullable (admin sets them later)
ALTER TABLE rooms ALTER COLUMN time_start DROP NOT NULL;
ALTER TABLE rooms ALTER COLUMN time_end DROP NOT NULL;

-- Set defaults to null for new rooms
ALTER TABLE rooms ALTER COLUMN time_start SET DEFAULT NULL;
ALTER TABLE rooms ALTER COLUMN time_end SET DEFAULT NULL;

-- Index for fast room_code lookups
CREATE INDEX IF NOT EXISTS idx_rooms_room_code ON rooms(room_code);
