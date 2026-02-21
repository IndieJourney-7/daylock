-- ============================================================
-- Phase 3: Social Proof & Gamification System Schema
-- Run this in Supabase SQL Editor after Phase 2 is deployed
-- ============================================================

-- ============================================================
-- 1. ACHIEVEMENTS SYSTEM
-- Server-side achievement definitions and user unlocks
-- ============================================================

CREATE TABLE IF NOT EXISTS achievements (
  id TEXT PRIMARY KEY,                       -- e.g. 'streak_7', 'first_room'
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  icon TEXT NOT NULL DEFAULT '🏆',
  category TEXT NOT NULL DEFAULT 'general' CHECK (category IN ('streak', 'attendance', 'quality', 'social', 'special', 'general')),
  tier TEXT NOT NULL DEFAULT 'bronze' CHECK (tier IN ('bronze', 'silver', 'gold', 'platinum', 'legendary')),
  threshold INTEGER DEFAULT 0,               -- numeric threshold for auto-unlock
  xp_reward INTEGER DEFAULT 50,              -- XP/points given when earned
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS user_achievements (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  achievement_id TEXT NOT NULL REFERENCES achievements(id) ON DELETE CASCADE,
  earned_at TIMESTAMPTZ DEFAULT now(),
  notified BOOLEAN DEFAULT false,            -- has user been shown the toast?
  metadata JSONB DEFAULT '{}',               -- extra context (e.g. streak count at time)
  UNIQUE(user_id, achievement_id)
);

-- Achievement definitions should be inserted manually via Supabase dashboard
-- or through the admin interface using real data.

-- ============================================================
-- 2. LEADERBOARDS
-- Materialized view for fast ranking queries
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

-- Room-specific leaderboard
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
  keys JSONB NOT NULL,                        -- { p256dh, auth }
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
  quiet_hours_start TIME,                     -- e.g. 22:00
  quiet_hours_end TIME,                       -- e.g. 07:00
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
  data JSONB DEFAULT '{}',                    -- { roomId, achievementId, etc. }
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
  room_id UUID REFERENCES rooms(id) ON DELETE SET NULL,  -- optional: tie to room
  title TEXT NOT NULL,
  description TEXT,
  type TEXT NOT NULL DEFAULT 'streak' CHECK (type IN ('streak', 'attendance', 'consistency', 'custom')),
  goal INTEGER NOT NULL DEFAULT 7,            -- target days/count
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
  progress INTEGER DEFAULT 0,                 -- days completed
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
-- 6. INDEXES
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

-- ============================================================
-- 7. RLS POLICIES
-- ============================================================

-- Achievements (read-only for everyone, definitions are public)
ALTER TABLE achievements ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read achievements" ON achievements FOR SELECT USING (true);

ALTER TABLE user_achievements ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own achievements" ON user_achievements FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "System can insert achievements" ON user_achievements FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Push subscriptions
ALTER TABLE push_subscriptions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own subscriptions" ON push_subscriptions FOR ALL USING (auth.uid() = user_id);

-- Notification preferences
ALTER TABLE notification_preferences ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own preferences" ON notification_preferences FOR ALL USING (auth.uid() = user_id);

-- Notifications
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can read own notifications" ON notifications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update own notifications" ON notifications FOR UPDATE USING (auth.uid() = user_id);

-- Challenges
ALTER TABLE challenges ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view active challenges" ON challenges FOR SELECT USING (status IN ('active', 'completed') OR creator_id = auth.uid());
CREATE POLICY "Users can create challenges" ON challenges FOR INSERT WITH CHECK (auth.uid() = creator_id);
CREATE POLICY "Creators can update own challenges" ON challenges FOR UPDATE USING (auth.uid() = creator_id);

ALTER TABLE challenge_participants ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Participants visible to challenge members" ON challenge_participants FOR SELECT USING (
  challenge_id IN (SELECT challenge_id FROM challenge_participants WHERE user_id = auth.uid())
  OR user_id = auth.uid()
);
CREATE POLICY "Users can join challenges" ON challenge_participants FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own participation" ON challenge_participants FOR UPDATE USING (auth.uid() = user_id);

ALTER TABLE challenge_daily_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Logs visible to challenge members" ON challenge_daily_log FOR SELECT USING (
  challenge_id IN (SELECT challenge_id FROM challenge_participants WHERE user_id = auth.uid())
);
CREATE POLICY "Users can log own progress" ON challenge_daily_log FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Activity feed
ALTER TABLE activity_feed ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view activity in their rooms" ON activity_feed FOR SELECT USING (
  user_id = auth.uid()
  OR (visibility = 'public')
  OR (visibility = 'room' AND room_id IN (
    SELECT id FROM rooms WHERE user_id = auth.uid()
    UNION
    SELECT room_id FROM room_invites WHERE admin_id = auth.uid() AND status = 'accepted'
  ))
);
CREATE POLICY "System can insert feed events" ON activity_feed FOR INSERT WITH CHECK (auth.uid() = user_id);
