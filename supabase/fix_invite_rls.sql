-- Fix RLS policy for rooms to allow viewing room details for pending invites
-- This allows unauthenticated users to see room information when verifying invite codes

DROP POLICY IF EXISTS "Users can view own rooms" ON rooms;

CREATE POLICY "Users can view own rooms" ON rooms
  FOR SELECT USING (
    auth.uid() = user_id 
    OR EXISTS (
      SELECT 1 FROM room_invites 
      WHERE room_invites.room_id = rooms.id 
      AND room_invites.admin_id = auth.uid() 
      AND room_invites.status = 'accepted'
    )
    OR EXISTS (
      SELECT 1 FROM room_invites
      WHERE room_invites.room_id = rooms.id
      AND room_invites.status = 'pending'
    )
  );
