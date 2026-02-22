-- =====================================================
-- ADD GROUP SUPPORT TO ROOM RULES
-- Rules can now be grouped under titled sections
-- e.g., "Chest Day" title with items underneath
-- =====================================================

-- Add group_title column (nullable - ungrouped rules have NULL)
ALTER TABLE room_rules ADD COLUMN IF NOT EXISTS group_title TEXT;

-- Add group_sort for ordering groups themselves (separate from item sort_order)
ALTER TABLE room_rules ADD COLUMN IF NOT EXISTS group_sort INT DEFAULT 0;

-- Index for efficient grouping queries
CREATE INDEX IF NOT EXISTS idx_room_rules_group ON room_rules(room_id, group_title, sort_order);
