-- =====================================================
-- DAYLOCK PRESSURE SYSTEM SCHEMA (Phase 1)
-- Run this AFTER the main schema.sql
-- Adds support for reflections and discipline tracking
-- =====================================================

-- =====================================================
-- REFLECTIONS TABLE
-- Stores user reflections after missed attendance
-- Linked to attendance records
-- =====================================================
CREATE TABLE IF NOT EXISTS reflections (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  attendance_id UUID REFERENCES attendance(id) ON DELETE SET NULL,
  room_id UUID REFERENCES rooms(id) ON DELETE SET NULL,
  reflection_text TEXT NOT NULL,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  points_earned INT DEFAULT 5,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- DISCIPLINE EVENTS TABLE (Optional - for server-side tracking)
-- Records point-earning/losing events
-- Can be used for leaderboards and admin analytics
-- =====================================================
CREATE TABLE IF NOT EXISTS discipline_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  room_id UUID REFERENCES rooms(id) ON DELETE SET NULL,
  event_type TEXT NOT NULL CHECK (event_type IN ('approved', 'missed', 'rejected', 'streak_bonus', 'reflection', 'on_time_bonus')),
  points INT NOT NULL,
  streak_at_time INT DEFAULT 0,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- ADD STREAK FIELDS TO PROFILES (Optional enhancement)
-- =====================================================
ALTER TABLE profiles 
  ADD COLUMN IF NOT EXISTS current_streak INT DEFAULT 0,
  ADD COLUMN IF NOT EXISTS longest_streak INT DEFAULT 0,
  ADD COLUMN IF NOT EXISTS total_discipline_points INT DEFAULT 0,
  ADD COLUMN IF NOT EXISTS streak_phase TEXT DEFAULT 'Start Today';

-- =====================================================
-- INDEXES
-- =====================================================
CREATE INDEX IF NOT EXISTS idx_reflections_user_id ON reflections(user_id);
CREATE INDEX IF NOT EXISTS idx_reflections_attendance_id ON reflections(attendance_id);
CREATE INDEX IF NOT EXISTS idx_discipline_events_user_id ON discipline_events(user_id);
CREATE INDEX IF NOT EXISTS idx_discipline_events_date ON discipline_events(user_id, date);

-- =====================================================
-- RLS POLICIES
-- =====================================================

ALTER TABLE reflections ENABLE ROW LEVEL SECURITY;
ALTER TABLE discipline_events ENABLE ROW LEVEL SECURITY;

-- Reflections: Users can see and create their own, admins can see for their rooms
CREATE POLICY "Users can view own reflections" ON reflections
  FOR SELECT USING (
    auth.uid() = user_id
    OR EXISTS (
      SELECT 1 FROM room_invites 
      WHERE room_invites.room_id = reflections.room_id 
      AND room_invites.admin_id = auth.uid() 
      AND room_invites.status = 'accepted'
    )
  );

CREATE POLICY "Users can create own reflections" ON reflections
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Discipline events: Users can see their own
CREATE POLICY "Users can view own discipline events" ON discipline_events
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own discipline events" ON discipline_events
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- =====================================================
-- NOTE: For Phase 1, discipline points are calculated 
-- client-side from attendance records. These tables are
-- prepared for Phase 2 server-side tracking.
-- =====================================================
