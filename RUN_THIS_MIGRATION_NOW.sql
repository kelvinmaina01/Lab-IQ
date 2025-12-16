-- ============================================================================
-- ANALYST IQ SYSTEM - CLEAN MIGRATION
-- Run this in Supabase SQL Editor
-- ============================================================================

-- ============================================================================
-- 1. ANALYST IQ PROFILES
-- ============================================================================
CREATE TABLE IF NOT EXISTS analyst_iq_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Overall IQ Score (0-2000, like chess ELO)
  overall_iq INTEGER DEFAULT 1000,

  -- Three Skill Dimensions (ELO-style ratings)
  data_integrity_score INTEGER DEFAULT 1000, -- Forensic Lab skill
  logic_reasoning_score INTEGER DEFAULT 1000, -- Reverse Engineer skill
  optimization_score INTEGER DEFAULT 1000,    -- Ghost Racer skill

  -- Skill Percentiles (vs other users)
  data_integrity_percentile INTEGER,
  logic_reasoning_percentile INTEGER,
  optimization_percentile INTEGER,

  -- Learning Metrics
  learning_velocity DECIMAL DEFAULT 1.0,
  consistency_score DECIMAL DEFAULT 0.5,
  challenge_completion_rate DECIMAL DEFAULT 0.0,

  -- Learning Style (detected by AI)
  learning_style TEXT,
  preferred_mode TEXT,

  -- Strengths & Weaknesses
  strength_areas TEXT[],
  weakness_areas TEXT[],

  -- Current Level
  current_level TEXT DEFAULT 'novice',
  total_challenges_completed INTEGER DEFAULT 0,
  total_time_spent_minutes INTEGER DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_analyst_profiles_user ON analyst_iq_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_analyst_profiles_overall_iq ON analyst_iq_profiles(overall_iq DESC);

-- ============================================================================
-- 2. CHALLENGE MATCHES (Game Sessions)
-- ============================================================================
CREATE TABLE IF NOT EXISTS challenge_matches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,

  -- Player
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Match Type & Difficulty
  match_mode TEXT NOT NULL CHECK (match_mode IN ('forensic', 'reverse', 'racer')),
  target_difficulty INTEGER NOT NULL,
  actual_difficulty INTEGER,

  -- Dataset (references existing datasets table)
  dataset_id UUID REFERENCES datasets(id) ON DELETE SET NULL,
  dataset_snapshot JSONB,

  -- Challenge Details (AI Generated)
  challenge_setup JSONB NOT NULL,
  ai_secret JSONB,

  -- User Performance
  user_solution TEXT,
  execution_time_ms INTEGER,
  attempts_count INTEGER DEFAULT 1,
  hints_requested INTEGER DEFAULT 0,

  -- Results
  success BOOLEAN DEFAULT false,
  accuracy_score DECIMAL,
  speed_score DECIMAL,
  quality_score DECIMAL,

  -- IQ Changes
  iq_before INTEGER,
  iq_after INTEGER,
  iq_delta INTEGER GENERATED ALWAYS AS (iq_after - iq_before) STORED,

  -- Metadata
  browser_metrics JSONB,
  error_log TEXT[]
);

CREATE INDEX IF NOT EXISTS idx_matches_user ON challenge_matches(user_id);
CREATE INDEX IF NOT EXISTS idx_matches_mode ON challenge_matches(match_mode);
CREATE INDEX IF NOT EXISTS idx_matches_completed ON challenge_matches(completed_at) WHERE completed_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_matches_success ON challenge_matches(success);

-- ============================================================================
-- 3. PERFORMANCE EVENTS (Granular Tracking)
-- ============================================================================
CREATE TABLE IF NOT EXISTS performance_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT NOW(),

  -- Context
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  match_id UUID REFERENCES challenge_matches(id) ON DELETE CASCADE,

  -- Event Type
  event_type TEXT NOT NULL,
  event_data JSONB NOT NULL,

  -- Insights
  skill_indicator TEXT,
  performance_metric DECIMAL
);

CREATE INDEX IF NOT EXISTS idx_events_user ON performance_events(user_id);
CREATE INDEX IF NOT EXISTS idx_events_match ON performance_events(match_id);
CREATE INDEX IF NOT EXISTS idx_events_type ON performance_events(event_type);
CREATE INDEX IF NOT EXISTS idx_events_created ON performance_events(created_at DESC);

-- ============================================================================
-- 4. FORENSIC MODE: ERROR INJECTIONS
-- ============================================================================
CREATE TABLE IF NOT EXISTS forensic_error_catalog (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT NOW(),

  -- Error Definition
  error_type TEXT NOT NULL,
  error_name TEXT NOT NULL,
  description TEXT,
  difficulty_level INTEGER,

  -- How to Inject
  injection_logic JSONB,
  detection_hints TEXT[],

  -- Stats
  times_used INTEGER DEFAULT 0,
  avg_time_to_solve_seconds INTEGER,
  solve_rate DECIMAL
);

-- Seed Error Types
INSERT INTO forensic_error_catalog (error_type, error_name, description, difficulty_level, injection_logic) VALUES
  ('outlier', 'Statistical Outlier', 'Extreme values that break normal distribution', 800, '{"method": "add_extreme_values", "percentage": 0.05}'::jsonb),
  ('encoding', 'String Encoding Issue', 'Mixed UTF-8 and Latin-1 encoding', 1000, '{"method": "corrupt_encoding", "columns": "text"}'::jsonb),
  ('unit_mismatch', 'Unit Conversion Error', 'Some values in Celsius, others in Fahrenheit', 1200, '{"method": "mix_units", "column_type": "temperature"}'::jsonb),
  ('missing_pattern', 'Missing Data Pattern', 'Non-random missing values', 900, '{"method": "create_missing_pattern", "bias": "demographic"}'::jsonb),
  ('duplicate_subtle', 'Subtle Duplicates', 'Duplicates with small variations', 1100, '{"method": "create_near_duplicates", "similarity": 0.95}'::jsonb)
ON CONFLICT DO NOTHING;

-- ============================================================================
-- 5. REVERSE MODE: TARGET OUTPUTS
-- ============================================================================
CREATE TABLE IF NOT EXISTS reverse_targets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  match_id UUID NOT NULL REFERENCES challenge_matches(id) ON DELETE CASCADE,

  -- Target
  target_type TEXT NOT NULL,
  target_data JSONB NOT NULL,
  target_image_url TEXT,

  -- Solution
  solution_code TEXT NOT NULL,
  solution_steps TEXT[],

  -- Validation
  validation_rules JSONB
);

-- ============================================================================
-- 6. RACER MODE: BENCHMARK CODE
-- ============================================================================
CREATE TABLE IF NOT EXISTS racer_benchmarks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  match_id UUID NOT NULL REFERENCES challenge_matches(id) ON DELETE CASCADE,

  -- Slow Code
  slow_code TEXT NOT NULL,
  slow_execution_time_ms INTEGER NOT NULL,

  -- Target
  target_time_ms INTEGER NOT NULL,
  optimal_code TEXT NOT NULL,
  optimal_time_ms INTEGER NOT NULL,

  -- User Performance
  user_speedup_factor DECIMAL,
  optimization_techniques_used TEXT[]
);

-- ============================================================================
-- 7. FUNCTIONS: IQ CALCULATION
-- ============================================================================

-- Calculate ELO-style rating change
CREATE OR REPLACE FUNCTION calculate_iq_delta(
  current_iq INTEGER,
  opponent_difficulty INTEGER,
  success BOOLEAN,
  performance_score DECIMAL
) RETURNS INTEGER AS $$
DECLARE
  k_factor INTEGER := 32;
  expected_score DECIMAL;
  actual_score DECIMAL;
  rating_diff INTEGER;
BEGIN
  rating_diff := opponent_difficulty - current_iq;
  expected_score := 1.0 / (1.0 + POWER(10, rating_diff / 400.0));

  IF success THEN
    actual_score := 0.5 + (performance_score * 0.5);
  ELSE
    actual_score := performance_score * 0.5;
  END IF;

  RETURN ROUND(k_factor * (actual_score - expected_score));
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Update user IQ after match
CREATE OR REPLACE FUNCTION update_user_iq_after_match()
RETURNS TRIGGER AS $$
DECLARE
  profile RECORD;
  iq_change INTEGER;
  new_iq INTEGER;
BEGIN
  IF NEW.completed_at IS NULL OR NEW.success IS NULL THEN
    RETURN NEW;
  END IF;

  SELECT * INTO profile FROM analyst_iq_profiles WHERE user_id = NEW.user_id;

  IF NEW.match_mode = 'forensic' THEN
    iq_change := calculate_iq_delta(
      profile.data_integrity_score,
      NEW.target_difficulty,
      NEW.success,
      COALESCE(NEW.accuracy_score, 0.5)
    );

    UPDATE analyst_iq_profiles
    SET
      data_integrity_score = data_integrity_score + iq_change,
      overall_iq = (data_integrity_score + logic_reasoning_score + optimization_score) / 3,
      total_challenges_completed = total_challenges_completed + 1,
      updated_at = NOW()
    WHERE user_id = NEW.user_id;

  ELSIF NEW.match_mode = 'reverse' THEN
    iq_change := calculate_iq_delta(
      profile.logic_reasoning_score,
      NEW.target_difficulty,
      NEW.success,
      COALESCE(NEW.accuracy_score, 0.5)
    );

    UPDATE analyst_iq_profiles
    SET
      logic_reasoning_score = logic_reasoning_score + iq_change,
      overall_iq = (data_integrity_score + logic_reasoning_score + optimization_score) / 3,
      total_challenges_completed = total_challenges_completed + 1,
      updated_at = NOW()
    WHERE user_id = NEW.user_id;

  ELSIF NEW.match_mode = 'racer' THEN
    iq_change := calculate_iq_delta(
      profile.optimization_score,
      NEW.target_difficulty,
      NEW.success,
      COALESCE(NEW.speed_score, 0.5)
    );

    UPDATE analyst_iq_profiles
    SET
      optimization_score = optimization_score + iq_change,
      overall_iq = (data_integrity_score + logic_reasoning_score + optimization_score) / 3,
      total_challenges_completed = total_challenges_completed + 1,
      updated_at = NOW()
    WHERE user_id = NEW.user_id;
  END IF;

  NEW.iq_after := profile.overall_iq + iq_change;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS match_complete_update_iq ON challenge_matches;
CREATE TRIGGER match_complete_update_iq
  BEFORE UPDATE OF completed_at ON challenge_matches
  FOR EACH ROW
  WHEN (OLD.completed_at IS NULL AND NEW.completed_at IS NOT NULL)
  EXECUTE FUNCTION update_user_iq_after_match();

-- ============================================================================
-- 8. ROW LEVEL SECURITY
-- ============================================================================

ALTER TABLE analyst_iq_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE challenge_matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE performance_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own profile" ON analyst_iq_profiles;
CREATE POLICY "Users can view their own profile"
  ON analyst_iq_profiles FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own profile" ON analyst_iq_profiles;
CREATE POLICY "Users can update their own profile"
  ON analyst_iq_profiles FOR UPDATE
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own profile" ON analyst_iq_profiles;
CREATE POLICY "Users can insert their own profile"
  ON analyst_iq_profiles FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can manage their own matches" ON challenge_matches;
CREATE POLICY "Users can manage their own matches"
  ON challenge_matches FOR ALL
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can view their own events" ON performance_events;
CREATE POLICY "Users can view their own events"
  ON performance_events FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "System can create events" ON performance_events;
CREATE POLICY "System can create events"
  ON performance_events FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- ============================================================================
-- ✅ MIGRATION COMPLETE!
-- ============================================================================
