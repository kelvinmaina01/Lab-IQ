-- Analyst IQ System - Complete Database Schema
-- Tracks user skills across 3 dimensions: Forensics, Logic, Optimization

-- ============================================================================
-- ANALYST IQ PROFILES
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
  learning_velocity DECIMAL DEFAULT 1.0, -- How fast they improve
  consistency_score DECIMAL DEFAULT 0.5, -- How consistent performance is
  challenge_completion_rate DECIMAL DEFAULT 0.0,

  -- Learning Style (detected by AI)
  learning_style TEXT, -- 'visual', 'analytical', 'trial_error', 'methodical'
  preferred_mode TEXT, -- 'forensic', 'reverse', 'racer'

  -- Strengths & Weaknesses
  strength_areas TEXT[], -- ['data_cleaning', 'visualization']
  weakness_areas TEXT[], -- ['sql_joins', 'optimization']

  -- Current Level
  current_level TEXT DEFAULT 'novice', -- novice, intermediate, advanced, expert, master
  total_challenges_completed INTEGER DEFAULT 0,
  total_time_spent_minutes INTEGER DEFAULT 0
);

CREATE INDEX idx_analyst_profiles_user ON analyst_iq_profiles(user_id);
CREATE INDEX idx_analyst_profiles_overall_iq ON analyst_iq_profiles(overall_iq DESC);

-- ============================================================================
-- CHALLENGE MATCHES (Game Sessions)
-- ============================================================================
CREATE TABLE IF NOT EXISTS challenge_matches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,

  -- Player & Challenge
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Match Type & Difficulty
  match_mode TEXT NOT NULL CHECK (match_mode IN ('forensic', 'reverse', 'racer')),
  target_difficulty INTEGER NOT NULL, -- IQ level this was aimed at
  actual_difficulty INTEGER, -- Calculated after completion

  -- Dataset (references the existing datasets table)
  dataset_id UUID REFERENCES datasets(id) ON DELETE SET NULL,
  dataset_snapshot JSONB, -- Save dataset state for forensic mode

  -- Challenge Details (AI Generated)
  challenge_setup JSONB NOT NULL, -- Mode-specific setup
  ai_secret JSONB, -- Hidden truth (errors injected, target output, optimal code)

  -- User Performance
  user_solution TEXT, -- Their code
  execution_time_ms INTEGER,
  attempts_count INTEGER DEFAULT 1,
  hints_requested INTEGER DEFAULT 0,

  -- Results
  success BOOLEAN DEFAULT false,
  accuracy_score DECIMAL, -- How close to target (0-1)
  speed_score DECIMAL, -- For racer mode
  quality_score DECIMAL, -- Code quality assessment

  -- IQ Changes
  iq_before INTEGER,
  iq_after INTEGER,
  iq_delta INTEGER GENERATED ALWAYS AS (iq_after - iq_before) STORED,

  -- Metadata
  browser_metrics JSONB, -- Performance data
  error_log TEXT[]
);

CREATE INDEX idx_matches_user ON challenge_matches(user_id);
CREATE INDEX idx_matches_mode ON challenge_matches(match_mode);
CREATE INDEX idx_matches_completed ON challenge_matches(completed_at) WHERE completed_at IS NOT NULL;
CREATE INDEX idx_matches_success ON challenge_matches(success);

-- ============================================================================
-- PERFORMANCE EVENTS (Granular Tracking)
-- ============================================================================
CREATE TABLE IF NOT EXISTS performance_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT NOW(),

  -- Context
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  match_id UUID REFERENCES challenge_matches(id) ON DELETE CASCADE,

  -- Event Type
  event_type TEXT NOT NULL, -- 'code_run', 'hint_used', 'error_occurred', 'pattern_detected'
  event_data JSONB NOT NULL,

  -- Insights
  skill_indicator TEXT, -- Which skill this event reveals
  performance_metric DECIMAL -- Normalized score for this event
);

CREATE INDEX idx_events_user ON performance_events(user_id);
CREATE INDEX idx_events_match ON performance_events(match_id);
CREATE INDEX idx_events_type ON performance_events(event_type);
CREATE INDEX idx_events_created ON performance_events(created_at DESC);

-- ============================================================================
-- FORENSIC MODE: ERROR INJECTIONS
-- ============================================================================
CREATE TABLE IF NOT EXISTS forensic_error_catalog (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT NOW(),

  -- Error Definition
  error_type TEXT NOT NULL, -- 'outlier', 'encoding', 'unit_mismatch', 'missing_data'
  error_name TEXT NOT NULL,
  description TEXT,
  difficulty_level INTEGER, -- IQ level where this error is appropriate

  -- How to Inject
  injection_logic JSONB, -- Rules for how to corrupt data
  detection_hints TEXT[], -- Progressive hints

  -- Stats
  times_used INTEGER DEFAULT 0,
  avg_time_to_solve_seconds INTEGER,
  solve_rate DECIMAL
);

-- Seed some error types
INSERT INTO forensic_error_catalog (error_type, error_name, description, difficulty_level, injection_logic) VALUES
  ('outlier', 'Statistical Outlier', 'Extreme values that break normal distribution', 800, '{"method": "add_extreme_values", "percentage": 0.05}'::jsonb),
  ('encoding', 'String Encoding Issue', 'Mixed UTF-8 and Latin-1 encoding', 1000, '{"method": "corrupt_encoding", "columns": "text"}'::jsonb),
  ('unit_mismatch', 'Unit Conversion Error', 'Some values in Celsius, others in Fahrenheit', 1200, '{"method": "mix_units", "column_type": "temperature"}'::jsonb),
  ('missing_pattern', 'Missing Data Pattern', 'Non-random missing values', 900, '{"method": "create_missing_pattern", "bias": "demographic"}'::jsonb),
  ('duplicate_subtle', 'Subtle Duplicates', 'Duplicates with small variations', 1100, '{"method": "create_near_duplicates", "similarity": 0.95}'::jsonb)
ON CONFLICT DO NOTHING;

-- ============================================================================
-- REVERSE MODE: TARGET OUTPUTS
-- ============================================================================
CREATE TABLE IF NOT EXISTS reverse_targets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  match_id UUID NOT NULL REFERENCES challenge_matches(id) ON DELETE CASCADE,

  -- Target
  target_type TEXT NOT NULL, -- 'visualization', 'table', 'metric'
  target_data JSONB NOT NULL, -- The result they need to reproduce
  target_image_url TEXT, -- For plots

  -- Solution
  solution_code TEXT NOT NULL,
  solution_steps TEXT[], -- Explanation of steps

  -- Validation
  validation_rules JSONB -- How to check if user got it right
);

-- ============================================================================
-- RACER MODE: BENCHMARK CODE
-- ============================================================================
CREATE TABLE IF NOT EXISTS racer_benchmarks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  match_id UUID NOT NULL REFERENCES challenge_matches(id) ON DELETE CASCADE,

  -- Slow Code
  slow_code TEXT NOT NULL,
  slow_execution_time_ms INTEGER NOT NULL,

  -- Target
  target_time_ms INTEGER NOT NULL, -- Must beat this
  optimal_code TEXT NOT NULL, -- Best solution
  optimal_time_ms INTEGER NOT NULL,

  -- User Performance
  user_speedup_factor DECIMAL, -- How much faster than slow code
  optimization_techniques_used TEXT[] -- Detected: 'vectorization', 'caching', etc.
);

-- ============================================================================
-- FUNCTIONS: IQ CALCULATION
-- ============================================================================

-- Calculate ELO-style rating change
CREATE OR REPLACE FUNCTION calculate_iq_delta(
  current_iq INTEGER,
  opponent_difficulty INTEGER,
  success BOOLEAN,
  performance_score DECIMAL
) RETURNS INTEGER AS $$
DECLARE
  k_factor INTEGER := 32; -- How much IQ can change per match
  expected_score DECIMAL;
  actual_score DECIMAL;
  rating_diff INTEGER;
BEGIN
  -- Calculate expected performance (ELO formula)
  rating_diff := opponent_difficulty - current_iq;
  expected_score := 1.0 / (1.0 + POWER(10, rating_diff / 400.0));

  -- Actual score (with performance nuance)
  IF success THEN
    actual_score := 0.5 + (performance_score * 0.5); -- 0.5 to 1.0
  ELSE
    actual_score := performance_score * 0.5; -- 0.0 to 0.5
  END IF;

  -- Calculate change
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
  -- Only update if match is complete
  IF NEW.completed_at IS NULL OR NEW.success IS NULL THEN
    RETURN NEW;
  END IF;

  -- Get current profile
  SELECT * INTO profile FROM analyst_iq_profiles WHERE user_id = NEW.user_id;

  -- Calculate IQ change based on mode
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

  -- Store IQ change in match record
  NEW.iq_after := profile.overall_iq + iq_change;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER match_complete_update_iq
  BEFORE UPDATE OF completed_at ON challenge_matches
  FOR EACH ROW
  WHEN (OLD.completed_at IS NULL AND NEW.completed_at IS NOT NULL)
  EXECUTE FUNCTION update_user_iq_after_match();

-- ============================================================================
-- FUNCTIONS: GET OR CREATE PROFILE
-- ============================================================================
CREATE OR REPLACE FUNCTION get_or_create_analyst_profile(p_user_id UUID)
RETURNS analyst_iq_profiles AS $$
DECLARE
  profile analyst_iq_profiles;
BEGIN
  SELECT * INTO profile FROM analyst_iq_profiles WHERE user_id = p_user_id;

  IF NOT FOUND THEN
    INSERT INTO analyst_iq_profiles (user_id)
    VALUES (p_user_id)
    RETURNING * INTO profile;
  END IF;

  RETURN profile;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- VIEWS: LEADERBOARDS PER MODE
-- ============================================================================

CREATE OR REPLACE VIEW forensic_leaderboard AS
SELECT
  p.user_id,
  u.email,
  p.data_integrity_score as iq_score,
  p.data_integrity_percentile,
  COUNT(m.id) FILTER (WHERE m.match_mode = 'forensic' AND m.success) as wins,
  COUNT(m.id) FILTER (WHERE m.match_mode = 'forensic') as total_matches,
  ROW_NUMBER() OVER (ORDER BY p.data_integrity_score DESC) as rank
FROM analyst_iq_profiles p
JOIN auth.users u ON p.user_id = u.id
LEFT JOIN challenge_matches m ON p.user_id = m.user_id
GROUP BY p.user_id, u.email, p.data_integrity_score, p.data_integrity_percentile;

CREATE OR REPLACE VIEW reverse_leaderboard AS
SELECT
  p.user_id,
  u.email,
  p.logic_reasoning_score as iq_score,
  p.logic_reasoning_percentile,
  COUNT(m.id) FILTER (WHERE m.match_mode = 'reverse' AND m.success) as wins,
  COUNT(m.id) FILTER (WHERE m.match_mode = 'reverse') as total_matches,
  ROW_NUMBER() OVER (ORDER BY p.logic_reasoning_score DESC) as rank
FROM analyst_iq_profiles p
JOIN auth.users u ON p.user_id = u.id
LEFT JOIN challenge_matches m ON p.user_id = m.user_id
GROUP BY p.user_id, u.email, p.logic_reasoning_score, p.logic_reasoning_percentile;

CREATE OR REPLACE VIEW racer_leaderboard AS
SELECT
  p.user_id,
  u.email,
  p.optimization_score as iq_score,
  p.optimization_percentile,
  COUNT(m.id) FILTER (WHERE m.match_mode = 'racer' AND m.success) as wins,
  COUNT(m.id) FILTER (WHERE m.match_mode = 'racer') as total_matches,
  AVG(rb.user_speedup_factor) as avg_speedup,
  ROW_NUMBER() OVER (ORDER BY p.optimization_score DESC) as rank
FROM analyst_iq_profiles p
JOIN auth.users u ON p.user_id = u.id
LEFT JOIN challenge_matches m ON p.user_id = m.user_id
LEFT JOIN racer_benchmarks rb ON m.id = rb.match_id
GROUP BY p.user_id, u.email, p.optimization_score, p.optimization_percentile;

-- ============================================================================
-- ROW LEVEL SECURITY
-- ============================================================================

ALTER TABLE analyst_iq_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE challenge_matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE performance_events ENABLE ROW LEVEL SECURITY;

-- Profiles: Users see their own, everyone sees public stats
CREATE POLICY "Users can view their own profile"
  ON analyst_iq_profiles FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile"
  ON analyst_iq_profiles FOR UPDATE
  USING (auth.uid() = user_id);

-- Matches: Users see their own matches
CREATE POLICY "Users can manage their own matches"
  ON challenge_matches FOR ALL
  USING (auth.uid() = user_id);

-- Events: Users see their own events
CREATE POLICY "Users can view their own events"
  ON performance_events FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "System can create events"
  ON performance_events FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE analyst_iq_profiles IS 'Tracks user analytical intelligence across 3 dimensions';
COMMENT ON TABLE challenge_matches IS 'Individual game sessions with performance data';
COMMENT ON TABLE performance_events IS 'Granular event tracking for ML and insights';
COMMENT ON TABLE forensic_error_catalog IS 'Library of data corruption patterns';
COMMENT ON TABLE reverse_targets IS 'Target outputs for reverse engineering mode';
COMMENT ON TABLE racer_benchmarks IS 'Performance benchmarks for optimization mode';
