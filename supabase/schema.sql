-- =====================================================
-- DAYLOCK DATABASE SCHEMA
-- Run this in your Supabase SQL Editor
-- =====================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- USERS TABLE (extends Supabase auth.users)
-- =====================================================
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  name TEXT,
  avatar_url TEXT,
  settings JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- ROOMS TABLE
-- Created by users, assigned to admins
-- =====================================================
CREATE TABLE IF NOT EXISTS rooms (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  emoji TEXT DEFAULT '📋',
  time_start TIME NOT NULL,
  time_end TIME NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- ROOM RULES TABLE
-- Rules set by admin for the room
-- =====================================================
CREATE TABLE IF NOT EXISTS room_rules (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  room_id UUID NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
  text TEXT NOT NULL,
  enabled BOOLEAN DEFAULT TRUE,
  sort_order INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- ROOM INVITES TABLE
-- Admin invites with unique codes
-- =====================================================
CREATE TABLE IF NOT EXISTS room_invites (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  room_id UUID NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
  invite_code TEXT NOT NULL UNIQUE,
  admin_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'revoked')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  accepted_at TIMESTAMPTZ
);

-- =====================================================
-- ATTENDANCE TABLE
-- Daily attendance records with proof
-- =====================================================
CREATE TABLE IF NOT EXISTS attendance (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  room_id UUID NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  status TEXT DEFAULT 'waiting' CHECK (status IN ('waiting', 'pending_review', 'approved', 'rejected', 'missed')),
  proof_url TEXT,
  note TEXT,
  rejection_reason TEXT,
  submitted_at TIMESTAMPTZ,
  reviewed_at TIMESTAMPTZ,
  reviewed_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- One attendance record per room per user per day
  UNIQUE(room_id, user_id, date)
);

-- =====================================================
-- INDEXES FOR PERFORMANCE
-- =====================================================
CREATE INDEX IF NOT EXISTS idx_rooms_user_id ON rooms(user_id);
CREATE INDEX IF NOT EXISTS idx_room_rules_room_id ON room_rules(room_id);
CREATE INDEX IF NOT EXISTS idx_room_invites_code ON room_invites(invite_code);
CREATE INDEX IF NOT EXISTS idx_room_invites_admin ON room_invites(admin_id);
CREATE INDEX IF NOT EXISTS idx_attendance_room_date ON attendance(room_id, date);
CREATE INDEX IF NOT EXISTS idx_attendance_user_id ON attendance(user_id);

-- =====================================================
-- ROW LEVEL SECURITY (RLS)
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE room_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE room_invites ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance ENABLE ROW LEVEL SECURITY;

-- Drop existing policies first (idempotent)
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
DROP POLICY IF EXISTS "Users can view own rooms" ON rooms;
DROP POLICY IF EXISTS "Users can create rooms" ON rooms;
DROP POLICY IF EXISTS "Users can update own rooms" ON rooms;
DROP POLICY IF EXISTS "Users can delete own rooms" ON rooms;
DROP POLICY IF EXISTS "View rules for accessible rooms" ON room_rules;
DROP POLICY IF EXISTS "Admins can manage rules" ON room_rules;
DROP POLICY IF EXISTS "Users can view own room invites" ON room_invites;
DROP POLICY IF EXISTS "Users can create invites for own rooms" ON room_invites;
DROP POLICY IF EXISTS "Users can update own room invites" ON room_invites;
DROP POLICY IF EXISTS "View attendance for accessible rooms" ON attendance;
DROP POLICY IF EXISTS "Users can submit attendance" ON attendance;
DROP POLICY IF EXISTS "Users can update own attendance" ON attendance;

-- Profiles: Users can read all profiles, but only update their own
CREATE POLICY "Public profiles are viewable by everyone" ON profiles
  FOR SELECT USING (true);

CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Rooms: Users can CRUD their own rooms, admins can read assigned rooms
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

CREATE POLICY "Users can create rooms" ON rooms
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own rooms" ON rooms
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own rooms" ON rooms
  FOR DELETE USING (auth.uid() = user_id);

-- Room Rules: Admin can CRUD rules for assigned rooms
CREATE POLICY "View rules for accessible rooms" ON room_rules
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM rooms 
      WHERE rooms.id = room_rules.room_id 
      AND (
        rooms.user_id = auth.uid()
        OR EXISTS (
          SELECT 1 FROM room_invites 
          WHERE room_invites.room_id = rooms.id 
          AND room_invites.admin_id = auth.uid() 
          AND room_invites.status = 'accepted'
        )
      )
    )
  );

CREATE POLICY "Admins can manage rules" ON room_rules
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM room_invites 
      WHERE room_invites.room_id = room_rules.room_id 
      AND room_invites.admin_id = auth.uid() 
      AND room_invites.status = 'accepted'
    )
  );

-- Room Invites: Users can manage invites for own rooms, admins can accept
CREATE POLICY "Users can view own room invites" ON room_invites
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM rooms WHERE rooms.id = room_invites.room_id AND rooms.user_id = auth.uid())
    OR admin_id = auth.uid()
    OR status = 'pending'  -- Anyone can view pending to accept
  );

CREATE POLICY "Users can create invites for own rooms" ON room_invites
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM rooms WHERE rooms.id = room_invites.room_id AND rooms.user_id = auth.uid())
  );

CREATE POLICY "Users can update own room invites" ON room_invites
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM rooms WHERE rooms.id = room_invites.room_id AND rooms.user_id = auth.uid())
    OR (admin_id IS NULL AND status = 'pending')  -- Admin accepting
    OR admin_id = auth.uid()
  );

-- Attendance: Users can manage own attendance, admins can review
CREATE POLICY "View attendance for accessible rooms" ON attendance
  FOR SELECT USING (
    auth.uid() = user_id
    OR EXISTS (
      SELECT 1 FROM room_invites 
      WHERE room_invites.room_id = attendance.room_id 
      AND room_invites.admin_id = auth.uid() 
      AND room_invites.status = 'accepted'
    )
  );

CREATE POLICY "Users can submit attendance" ON attendance
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own attendance" ON attendance
  FOR UPDATE USING (
    auth.uid() = user_id
    OR EXISTS (
      SELECT 1 FROM room_invites 
      WHERE room_invites.room_id = attendance.room_id 
      AND room_invites.admin_id = auth.uid() 
      AND room_invites.status = 'accepted'
    )
  );

-- =====================================================
-- FUNCTIONS
-- =====================================================

-- Auto-create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, name, avatar_url)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(
      NEW.raw_user_meta_data->>'full_name',
      NEW.raw_user_meta_data->>'name',
      split_part(NEW.email, '@', 1)
    ),
    COALESCE(
      NEW.raw_user_meta_data->>'avatar_url',
      NEW.raw_user_meta_data->>'picture'
    )
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for auto-profile creation
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function to generate invite codes
CREATE OR REPLACE FUNCTION generate_invite_code()
RETURNS TEXT AS $$
DECLARE
  chars TEXT := 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
  result TEXT := '';
  i INT;
BEGIN
  -- Generate 3-letter prefix + 4 alphanumeric
  FOR i IN 1..3 LOOP
    result := result || substr(chars, floor(random() * 24 + 1)::int, 1);
  END LOOP;
  result := result || '-';
  FOR i IN 1..4 LOOP
    result := result || substr(chars, floor(random() * length(chars) + 1)::int, 1);
  END LOOP;
  RETURN result;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- VIEWS (Optional - for easier queries)
-- =====================================================

-- User's room stats view
CREATE OR REPLACE VIEW room_stats AS
SELECT 
  r.id as room_id,
  r.user_id,
  r.name,
  r.emoji,
  COUNT(DISTINCT a.date) FILTER (WHERE a.status = 'approved') as approved_days,
  COUNT(DISTINCT a.date) FILTER (WHERE a.status = 'rejected') as rejected_days,
  COUNT(DISTINCT a.date) FILTER (WHERE a.status = 'missed') as missed_days,
  COUNT(DISTINCT a.date) as total_days,
  COALESCE(
    ROUND(
      COUNT(DISTINCT a.date) FILTER (WHERE a.status = 'approved')::numeric / 
      NULLIF(COUNT(DISTINCT a.date), 0) * 100
    ), 0
  ) as attendance_rate
FROM rooms r
LEFT JOIN attendance a ON r.id = a.room_id
GROUP BY r.id, r.user_id, r.name, r.emoji;

-- =====================================================
-- STORAGE BUCKET FOR PROOFS
-- Run this separately in Supabase Dashboard > Storage
-- =====================================================
-- 1. Create bucket named 'proofs' (public: false)
-- 2. Add policy: Users can upload to their own folder
--    ((bucket_id = 'proofs') AND (auth.uid()::text = (storage.foldername(name))[1]))
