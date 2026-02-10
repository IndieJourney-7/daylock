-- =====================================================
-- STORAGE BUCKET SETUP FOR PROOFS
-- Run this in Supabase SQL Editor after creating the bucket in Dashboard
-- =====================================================

-- STEP 1: Create the 'proofs' bucket
-- NOTE: This must be done in Supabase Dashboard > Storage > New Bucket
-- OR run this INSERT (only works if you have admin access):
INSERT INTO storage.buckets (id, name, public)
VALUES ('proofs', 'proofs', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- STEP 2: Run the policies below

-- Allow authenticated users to upload to their own folder
CREATE POLICY "Users can upload proofs to own folder"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'proofs' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow authenticated users to update their own proofs (for upsert)
CREATE POLICY "Users can update own proofs"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'proofs' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow public read access to all proofs (for admins to see)
CREATE POLICY "Anyone can view proofs"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'proofs');

-- Alternative: Only allow owners and room admins to view
-- This is more restrictive but requires more complex logic
-- CREATE POLICY "Users and admins can view proofs"
-- ON storage.objects FOR SELECT
-- TO authenticated
-- USING (
--   bucket_id = 'proofs' 
--   AND (
--     (storage.foldername(name))[1] = auth.uid()::text
--     OR EXISTS (
--       SELECT 1 FROM room_invites ri
--       WHERE ri.admin_id = auth.uid()
--       AND ri.status = 'accepted'
--     )
--   )
-- );
