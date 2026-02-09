-- =====================================================
-- ADD ROOM TOGGLE (is_open) + allow_late_upload
-- Run this in your Supabase SQL Editor
-- =====================================================

-- Add is_paused column to rooms (admin can pause/unpause)
ALTER TABLE rooms ADD COLUMN IF NOT EXISTS is_paused BOOLEAN DEFAULT FALSE;

-- Add allow_late_upload column (admin can toggle to let user upload late proof)
ALTER TABLE rooms ADD COLUMN IF NOT EXISTS allow_late_upload BOOLEAN DEFAULT FALSE;

-- Add description column for rooms
ALTER TABLE rooms ADD COLUMN IF NOT EXISTS description TEXT DEFAULT '';

-- Update RLS policy for rooms to allow admin updates
DROP POLICY IF EXISTS "Users can update own rooms" ON rooms;
CREATE POLICY "Users can update own rooms" ON rooms
  FOR UPDATE USING (
    auth.uid() = user_id 
    OR EXISTS (
      SELECT 1 FROM room_invites 
      WHERE room_invites.room_id = rooms.id 
      AND room_invites.admin_id = auth.uid() 
      AND room_invites.status = 'accepted'
    )
  );
