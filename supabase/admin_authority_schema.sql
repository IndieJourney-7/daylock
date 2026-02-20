-- ============================================================
-- Phase 2: Admin Authority System Schema
-- Run this in Supabase SQL Editor after Phase 1 is deployed
-- ============================================================

-- 1. Add quality rating + admin feedback to attendance
ALTER TABLE attendance
ADD COLUMN IF NOT EXISTS quality_rating SMALLINT CHECK (quality_rating >= 1 AND quality_rating <= 5),
ADD COLUMN IF NOT EXISTS admin_feedback TEXT;

-- 2. Create warnings table
CREATE TABLE IF NOT EXISTS warnings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  room_id UUID NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  admin_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  type TEXT NOT NULL DEFAULT 'manual' CHECK (type IN ('auto', 'manual')),
  trigger_reason TEXT,
  severity TEXT NOT NULL DEFAULT 'info' CHECK (severity IN ('info', 'warning', 'strike', 'probation')),
  message TEXT NOT NULL,
  acknowledged BOOLEAN DEFAULT false,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Create consequences table
CREATE TABLE IF NOT EXISTS consequences (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  room_id UUID NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  admin_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  level TEXT NOT NULL DEFAULT 'warning' CHECK (level IN ('warning', 'strike', 'probation', 'final_warning', 'removal')),
  reason TEXT NOT NULL,
  notes TEXT,
  active BOOLEAN DEFAULT true,
  resolved_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 4. Add severity/category to room_rules (optional enrichment)
ALTER TABLE room_rules
ADD COLUMN IF NOT EXISTS category TEXT,
ADD COLUMN IF NOT EXISTS severity TEXT DEFAULT 'moderate' CHECK (severity IN ('minor', 'moderate', 'major')),
ADD COLUMN IF NOT EXISTS violation_count INTEGER DEFAULT 0;

-- 5. Indexes for performance
CREATE INDEX IF NOT EXISTS idx_warnings_room_id ON warnings(room_id);
CREATE INDEX IF NOT EXISTS idx_warnings_user_id ON warnings(user_id);
CREATE INDEX IF NOT EXISTS idx_warnings_admin_id ON warnings(admin_id);
CREATE INDEX IF NOT EXISTS idx_warnings_active ON warnings(active);
CREATE INDEX IF NOT EXISTS idx_consequences_room_id ON consequences(room_id);
CREATE INDEX IF NOT EXISTS idx_consequences_user_id ON consequences(user_id);
CREATE INDEX IF NOT EXISTS idx_consequences_active ON consequences(active);
CREATE INDEX IF NOT EXISTS idx_attendance_quality ON attendance(quality_rating);

-- 6. RLS Policies for warnings
ALTER TABLE warnings ENABLE ROW LEVEL SECURITY;

-- Users can see their own warnings
CREATE POLICY "Users can view own warnings"
ON warnings FOR SELECT
USING (auth.uid() = user_id);

-- Admins can view warnings for rooms they manage
CREATE POLICY "Admins can view room warnings"
ON warnings FOR SELECT
USING (
  admin_id = auth.uid()
  OR room_id IN (
    SELECT room_id FROM room_invites
    WHERE admin_id = auth.uid() AND status = 'accepted'
  )
);

-- Admins can create warnings
CREATE POLICY "Admins can create warnings"
ON warnings FOR INSERT
WITH CHECK (
  admin_id = auth.uid()
  OR room_id IN (
    SELECT room_id FROM room_invites
    WHERE admin_id = auth.uid() AND status = 'accepted'
  )
);

-- Admins can update warnings (dismiss, acknowledge)
CREATE POLICY "Admins can update warnings"
ON warnings FOR UPDATE
USING (
  admin_id = auth.uid()
  OR user_id = auth.uid()
  OR room_id IN (
    SELECT room_id FROM room_invites
    WHERE admin_id = auth.uid() AND status = 'accepted'
  )
);

-- 7. RLS Policies for consequences
ALTER TABLE consequences ENABLE ROW LEVEL SECURITY;

-- Users can see their own consequences
CREATE POLICY "Users can view own consequences"
ON consequences FOR SELECT
USING (auth.uid() = user_id);

-- Admins can view consequences for rooms they manage
CREATE POLICY "Admins can view room consequences"
ON consequences FOR SELECT
USING (
  admin_id = auth.uid()
  OR room_id IN (
    SELECT room_id FROM room_invites
    WHERE admin_id = auth.uid() AND status = 'accepted'
  )
);

-- Admins can create consequences
CREATE POLICY "Admins can create consequences"
ON consequences FOR INSERT
WITH CHECK (
  admin_id = auth.uid()
  OR room_id IN (
    SELECT room_id FROM room_invites
    WHERE admin_id = auth.uid() AND status = 'accepted'
  )
);

-- Admins can update consequences (resolve)
CREATE POLICY "Admins can update consequences"
ON consequences FOR UPDATE
USING (
  admin_id = auth.uid()
  OR room_id IN (
    SELECT room_id FROM room_invites
    WHERE admin_id = auth.uid() AND status = 'accepted'
  )
);

-- 8. Weekly room stats view (for dashboard)
CREATE OR REPLACE VIEW weekly_room_stats AS
SELECT
  room_id,
  user_id,
  date_trunc('week', date::date)::date AS week_start,
  COUNT(*) AS total_entries,
  COUNT(*) FILTER (WHERE status = 'approved') AS approved,
  COUNT(*) FILTER (WHERE status = 'rejected') AS rejected,
  COUNT(*) FILTER (WHERE status = 'missed') AS missed,
  ROUND(
    COUNT(*) FILTER (WHERE status = 'approved')::numeric / NULLIF(COUNT(*), 0) * 100, 1
  ) AS attendance_rate,
  ROUND(AVG(quality_rating)::numeric, 1) AS avg_quality
FROM attendance
GROUP BY room_id, user_id, date_trunc('week', date::date)
ORDER BY week_start DESC;
