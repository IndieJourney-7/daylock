-- ============================================================
-- Phase 3: Social Proof & Gamification System Schema
-- SAFE TO RE-RUN: All statements use IF NOT EXISTS / DROP IF EXISTS
-- Run this in Supabase SQL Editor
-- ============================================================

-- ============================================================
-- 1. ACHIEVEMENTS SYSTEM
-- ============================================================

CREATE TABLE IF NOT EXISTS achievements (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  icon TEXT NOT NULL DEFAULT '🏆',
  category TEXT NOT NULL DEFAULT 'general' CHECK (category IN ('streak', 'attendance', 'quality', 'social', 'special', 'general')),
  tier TEXT NOT NULL DEFAULT 'bronze' CHECK (tier IN ('bronze', 'silver', 'gold', 'platinum', 'legendary')),
  threshold INTEGER DEFAULT 0,
  xp_reward INTEGER DEFAULT 50,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS user_achievements (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  achievement_id TEXT NOT NULL REFERENCES achievements(id) ON DELETE CASCADE,
  earned_at TIMESTAMPTZ DEFAULT now(),
  notified BOOLEAN DEFAULT false,
  metadata JSONB DEFAULT '{}',
  UNIQUE(user_id, achievement_id)
);

-- ============================================================
-- 2. LEADERBOARDS
-- ============================================================

CREATE OR REPLACE VIEW leaderboard_view AS
SELECT
  p.id AS user_id,
  p.name,
  p.avatar_url,
  COALESCE(p.current_streak, 0) AS current_streak,
  COALESCE(p.longest_streak, 0) AS longest_streak,
  COALESCE(p.total_discipline_points, 0) AS discipline_score,
  COUNT(a.id) FILTER (WHERE a.status = 'approved') AS total_approved,
  COUNT(a.id) AS total_submissions,
  ROUND(
    COUNT(a.id) FILTER (WHERE a.status = 'approved')::numeric / 
    NULLIF(COUNT(a.id), 0) * 100, 1
  ) AS attendance_rate,
  ROUND(AVG(a.quality_rating)::numeric, 1) AS avg_quality,
  (SELECT COUNT(*) FROM user_achievements ua WHERE ua.user_id = p.id) AS achievements_count
FROM profiles p
LEFT JOIN attendance a ON a.user_id = p.id
GROUP BY p.id, p.name, p.avatar_url, p.current_streak, p.longest_streak, p.total_discipline_points;

CREATE OR REPLACE VIEW room_leaderboard_view AS
SELECT
  a.room_id,
  a.user_id,
  p.name,
  p.avatar_url,
  COUNT(a.id) FILTER (WHERE a.status = 'approved') AS approved_count,
  COUNT(a.id) AS total_count,
  ROUND(
    COUNT(a.id) FILTER (WHERE a.status = 'approved')::numeric / 
    NULLIF(COUNT(a.id), 0) * 100, 1
  ) AS attendance_rate,
  ROUND(AVG(a.quality_rating)::numeric, 1) AS avg_quality,
  COALESCE(p.current_streak, 0) AS current_streak
FROM attendance a
JOIN profiles p ON p.id = a.user_id
GROUP BY a.room_id, a.user_id, p.name, p.avatar_url, p.current_streak;

-- ============================================================
-- 3. PUSH NOTIFICATIONS
-- ============================================================

CREATE TABLE IF NOT EXISTS push_subscriptions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  endpoint TEXT NOT NULL,
  keys JSONB NOT NULL,
  user_agent TEXT,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, endpoint)
);

CREATE TABLE IF NOT EXISTS notification_preferences (
  user_id UUID PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
  room_opening BOOLEAN DEFAULT true,
  room_closing BOOLEAN DEFAULT true,
  streak_at_risk BOOLEAN DEFAULT true,
  proof_reviewed BOOLEAN DEFAULT true,
  achievement_earned BOOLEAN DEFAULT true,
  challenge_updates BOOLEAN DEFAULT true,
  weekly_digest BOOLEAN DEFAULT true,
  quiet_hours_start TIME,
  quiet_hours_end TIME,
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN (
    'room_opening', 'room_closing', 'streak_at_risk', 'proof_reviewed',
    'achievement_earned', 'challenge_invite', 'challenge_update', 'challenge_complete',
    'warning_issued', 'weekly_digest', 'system'
  )),
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  data JSONB DEFAULT '{}',
  read BOOLEAN DEFAULT false,
  push_sent BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- 4. CHALLENGES / FRIEND COMPETITION
-- ============================================================

CREATE TABLE IF NOT EXISTS challenges (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  creator_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  room_id UUID REFERENCES rooms(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  description TEXT,
  type TEXT NOT NULL DEFAULT 'streak' CHECK (type IN ('streak', 'attendance', 'consistency', 'custom')),
  goal INTEGER NOT NULL DEFAULT 7,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'completed', 'cancelled')),
  invite_code TEXT UNIQUE,
  max_participants INTEGER DEFAULT 10,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS challenge_participants (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  challenge_id UUID NOT NULL REFERENCES challenges(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'joined' CHECK (status IN ('invited', 'joined', 'withdrawn', 'completed', 'won')),
  progress INTEGER DEFAULT 0,
  current_streak INTEGER DEFAULT 0,
  joined_at TIMESTAMPTZ DEFAULT now(),
  completed_at TIMESTAMPTZ,
  UNIQUE(challenge_id, user_id)
);

CREATE TABLE IF NOT EXISTS challenge_daily_log (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  challenge_id UUID NOT NULL REFERENCES challenges(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  completed BOOLEAN DEFAULT false,
  attendance_id UUID REFERENCES attendance(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(challenge_id, user_id, date)
);

-- ============================================================
-- 5. ACTIVITY FEED / SOCIAL TIMELINE
-- ============================================================

CREATE TABLE IF NOT EXISTS activity_feed (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  room_id UUID REFERENCES rooms(id) ON DELETE SET NULL,
  event_type TEXT NOT NULL CHECK (event_type IN (
    'proof_approved', 'streak_milestone', 'achievement_earned',
    'challenge_joined', 'challenge_progress', 'challenge_won',
    'warning_received', 'quality_5_star', 'perfect_day',
    'comeback', 'new_room'
  )),
  title TEXT NOT NULL,
  description TEXT,
  metadata JSONB DEFAULT '{}',
  visibility TEXT DEFAULT 'room' CHECK (visibility IN ('private', 'room', 'public')),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- 6. ROOM REMINDERS
-- ============================================================

CREATE TABLE IF NOT EXISTS room_reminders (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  room_id UUID NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
  minutes_before INTEGER NOT NULL DEFAULT 5,
  enabled BOOLEAN DEFAULT true,
  timezone TEXT DEFAULT 'UTC',
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, room_id, minutes_before)
);

-- Migration: Add timezone column if table already exists without it
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'room_reminders' AND column_name = 'timezone'
  ) THEN
    ALTER TABLE room_reminders ADD COLUMN timezone TEXT DEFAULT 'UTC';
  END IF;
END $$;

-- ============================================================
-- 7. INDEXES (all use IF NOT EXISTS — safe to re-run)
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_user_achievements_user ON user_achievements(user_id);
CREATE INDEX IF NOT EXISTS idx_user_achievements_notified ON user_achievements(user_id, notified) WHERE notified = false;
CREATE INDEX IF NOT EXISTS idx_push_subscriptions_user ON push_subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_push_subscriptions_active ON push_subscriptions(user_id) WHERE active = true;
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_unread ON notifications(user_id, read) WHERE read = false;
CREATE INDEX IF NOT EXISTS idx_notifications_type ON notifications(type);
CREATE INDEX IF NOT EXISTS idx_challenges_status ON challenges(status);
CREATE INDEX IF NOT EXISTS idx_challenges_invite_code ON challenges(invite_code);
CREATE INDEX IF NOT EXISTS idx_challenge_participants_user ON challenge_participants(user_id);
CREATE INDEX IF NOT EXISTS idx_challenge_participants_challenge ON challenge_participants(challenge_id);
CREATE INDEX IF NOT EXISTS idx_challenge_daily_log_date ON challenge_daily_log(challenge_id, date);
CREATE INDEX IF NOT EXISTS idx_activity_feed_user ON activity_feed(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_feed_room ON activity_feed(room_id);
CREATE INDEX IF NOT EXISTS idx_activity_feed_created ON activity_feed(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_activity_feed_type ON activity_feed(event_type);
CREATE INDEX IF NOT EXISTS idx_room_reminders_user ON room_reminders(user_id);
CREATE INDEX IF NOT EXISTS idx_room_reminders_room ON room_reminders(room_id);
CREATE INDEX IF NOT EXISTS idx_room_reminders_enabled ON room_reminders(user_id) WHERE enabled = true;

-- ============================================================
-- 8. RLS POLICIES (DROP IF EXISTS + CREATE — safe to re-run)
-- ============================================================

-- Achievements
ALTER TABLE achievements ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Anyone can read achievements" ON achievements;
CREATE POLICY "Anyone can read achievements" ON achievements FOR SELECT USING (true);

ALTER TABLE user_achievements ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view own achievements" ON user_achievements;
CREATE POLICY "Users can view own achievements" ON user_achievements FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "System can insert achievements" ON user_achievements;
CREATE POLICY "System can insert achievements" ON user_achievements FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Push subscriptions
ALTER TABLE push_subscriptions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users manage own subscriptions" ON push_subscriptions;
CREATE POLICY "Users manage own subscriptions" ON push_subscriptions FOR ALL USING (auth.uid() = user_id);

-- Notification preferences
ALTER TABLE notification_preferences ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users manage own preferences" ON notification_preferences;
CREATE POLICY "Users manage own preferences" ON notification_preferences FOR ALL USING (auth.uid() = user_id);

-- Notifications
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can read own notifications" ON notifications;
CREATE POLICY "Users can read own notifications" ON notifications FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can update own notifications" ON notifications;
CREATE POLICY "Users can update own notifications" ON notifications FOR UPDATE USING (auth.uid() = user_id);

-- Challenges
ALTER TABLE challenges ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Anyone can view active challenges" ON challenges;
CREATE POLICY "Anyone can view active challenges" ON challenges FOR SELECT USING (status IN ('active', 'completed') OR creator_id = auth.uid());
DROP POLICY IF EXISTS "Users can create challenges" ON challenges;
CREATE POLICY "Users can create challenges" ON challenges FOR INSERT WITH CHECK (auth.uid() = creator_id);
DROP POLICY IF EXISTS "Creators can update own challenges" ON challenges;
CREATE POLICY "Creators can update own challenges" ON challenges FOR UPDATE USING (auth.uid() = creator_id);

ALTER TABLE challenge_participants ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Participants visible to challenge members" ON challenge_participants;
CREATE POLICY "Participants visible to challenge members" ON challenge_participants FOR SELECT USING (
  challenge_id IN (SELECT challenge_id FROM challenge_participants WHERE user_id = auth.uid())
  OR user_id = auth.uid()
);
DROP POLICY IF EXISTS "Users can join challenges" ON challenge_participants;
CREATE POLICY "Users can join challenges" ON challenge_participants FOR INSERT WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can update own participation" ON challenge_participants;
CREATE POLICY "Users can update own participation" ON challenge_participants FOR UPDATE USING (auth.uid() = user_id);

ALTER TABLE challenge_daily_log ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Logs visible to challenge members" ON challenge_daily_log;
CREATE POLICY "Logs visible to challenge members" ON challenge_daily_log FOR SELECT USING (
  challenge_id IN (SELECT challenge_id FROM challenge_participants WHERE user_id = auth.uid())
);
DROP POLICY IF EXISTS "Users can log own progress" ON challenge_daily_log;
CREATE POLICY "Users can log own progress" ON challenge_daily_log FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Activity feed
ALTER TABLE activity_feed ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view activity in their rooms" ON activity_feed;
CREATE POLICY "Users can view activity in their rooms" ON activity_feed FOR SELECT USING (
  user_id = auth.uid()
  OR (visibility = 'public')
  OR (visibility = 'room' AND room_id IN (
    SELECT id FROM rooms WHERE user_id = auth.uid()
    UNION
    SELECT room_id FROM room_invites WHERE admin_id = auth.uid() AND status = 'accepted'
  ))
);
DROP POLICY IF EXISTS "System can insert feed events" ON activity_feed;
CREATE POLICY "System can insert feed events" ON activity_feed FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Room reminders
ALTER TABLE room_reminders ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users manage own reminders" ON room_reminders;
CREATE POLICY "Users manage own reminders" ON room_reminders FOR ALL USING (auth.uid() = user_id);
