-- Lab-IQ Hackathons Complete Database Schema
-- This migration creates all tables for the gamified hackathon learning system

-- ============================================================================
-- HACKATHON CHALLENGES TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS hackathon_challenges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Challenge Metadata
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  difficulty_level TEXT NOT NULL CHECK (difficulty_level IN ('beginner', 'intermediate', 'expert', 'advanced')),
  language TEXT NOT NULL CHECK (language IN ('python', 'sql', 'r')),

  -- Challenge Content
  user_prompt TEXT NOT NULL,
  incomplete_code TEXT NOT NULL,
  complete_solution TEXT NOT NULL,
  blanks JSONB NOT NULL DEFAULT '[]'::jsonb, -- Array of blank objects with hints
  test_cases JSONB NOT NULL DEFAULT '[]'::jsonb,

  -- Dataset Association
  dataset_id UUID REFERENCES datasets(id) ON DELETE SET NULL,
  dataset_url TEXT,
  dataset_schema JSONB,

  -- Learning Metadata
  learning_objectives TEXT[] DEFAULT ARRAY[]::TEXT[],
  concepts_tested TEXT[] DEFAULT ARRAY[]::TEXT[],
  estimated_time_minutes INTEGER DEFAULT 15,

  -- Gamification
  base_points INTEGER DEFAULT 100,
  time_bonus_points INTEGER DEFAULT 50,
  hint_penalty_points INTEGER DEFAULT 10,

  -- Usage Stats
  attempts_count INTEGER DEFAULT 0,
  success_count INTEGER DEFAULT 0,
  average_completion_time_seconds INTEGER,

  -- Challenge Type
  challenge_format TEXT DEFAULT 'cloze' CHECK (challenge_format IN ('cloze', 'parsons', 'debug', 'optimize')),

  -- Visibility
  is_active BOOLEAN DEFAULT true,
  is_featured BOOLEAN DEFAULT false,
  creator_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,

  -- Search
  search_vector tsvector GENERATED ALWAYS AS (
    to_tsvector('english', COALESCE(title, '') || ' ' || COALESCE(description, ''))
  ) STORED
);

-- Indexes for hackathon_challenges
CREATE INDEX IF NOT EXISTS idx_challenges_difficulty ON hackathon_challenges(difficulty_level);
CREATE INDEX IF NOT EXISTS idx_challenges_language ON hackathon_challenges(language);
CREATE INDEX IF NOT EXISTS idx_challenges_active ON hackathon_challenges(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_challenges_featured ON hackathon_challenges(is_featured) WHERE is_featured = true;
CREATE INDEX IF NOT EXISTS idx_challenges_search ON hackathon_challenges USING GIN(search_vector);
CREATE INDEX IF NOT EXISTS idx_challenges_creator ON hackathon_challenges(creator_id);

-- ============================================================================
-- USER SUBMISSIONS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS hackathon_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT NOW(),

  -- Relationships
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  challenge_id UUID NOT NULL REFERENCES hackathon_challenges(id) ON DELETE CASCADE,

  -- Submission Content
  submitted_code TEXT NOT NULL,
  language TEXT NOT NULL,

  -- Execution Results
  passed BOOLEAN NOT NULL DEFAULT false,
  test_results JSONB DEFAULT '[]'::jsonb,
  execution_output JSONB,
  error_message TEXT,

  -- Performance Metrics
  completion_time_seconds INTEGER,
  hints_used INTEGER DEFAULT 0,
  attempts_before_success INTEGER DEFAULT 1,

  -- Scoring
  base_score INTEGER DEFAULT 0,
  time_bonus INTEGER DEFAULT 0,
  hint_penalty INTEGER DEFAULT 0,
  final_score INTEGER GENERATED ALWAYS AS (
    GREATEST(0, base_score + COALESCE(time_bonus, 0) - COALESCE(hint_penalty, 0))
  ) STORED,

  -- Code Quality (optional peer review)
  efficiency_rating DECIMAL(3,2),
  readability_rating DECIMAL(3,2),
  creativity_rating DECIMAL(3,2),
  peer_review_count INTEGER DEFAULT 0,

  -- Metadata
  browser_info JSONB,
  execution_environment TEXT DEFAULT 'browser-wasm'
);

-- Indexes for hackathon_submissions
CREATE INDEX IF NOT EXISTS idx_submissions_user ON hackathon_submissions(user_id);
CREATE INDEX IF NOT EXISTS idx_submissions_challenge ON hackathon_submissions(challenge_id);
CREATE INDEX IF NOT EXISTS idx_submissions_passed ON hackathon_submissions(passed);
CREATE INDEX IF NOT EXISTS idx_submissions_score ON hackathon_submissions(final_score DESC);
CREATE INDEX IF NOT EXISTS idx_submissions_created ON hackathon_submissions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_submissions_user_challenge ON hackathon_submissions(user_id, challenge_id);

-- ============================================================================
-- LEADERBOARD TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS hackathon_leaderboard (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- User Info
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Aggregate Stats
  total_challenges_completed INTEGER DEFAULT 0,
  total_points INTEGER DEFAULT 0,
  average_score DECIMAL(8,2) DEFAULT 0,

  -- Performance Metrics
  speed_run_score INTEGER DEFAULT 0, -- Sum of time bonuses
  accuracy_score INTEGER DEFAULT 0, -- Success rate * 1000
  consistency_score INTEGER DEFAULT 0, -- Attempts per success

  -- Badges & Achievements
  badges_earned TEXT[] DEFAULT ARRAY[]::TEXT[],
  current_streak INTEGER DEFAULT 0,
  longest_streak INTEGER DEFAULT 0,
  last_activity_date DATE,

  -- Rankings
  global_rank INTEGER,
  difficulty_ranks JSONB DEFAULT '{}'::jsonb, -- { "beginner": 5, "expert": 12 }
  language_ranks JSONB DEFAULT '{}'::jsonb, -- { "python": 3, "sql": 8 }

  -- Peer Contribution
  peer_reviews_given INTEGER DEFAULT 0,
  helpful_reviews_count INTEGER DEFAULT 0,
  challenges_created INTEGER DEFAULT 0
);

-- Indexes for hackathon_leaderboard
CREATE INDEX IF NOT EXISTS idx_leaderboard_total_points ON hackathon_leaderboard(total_points DESC);
CREATE INDEX IF NOT EXISTS idx_leaderboard_speed ON hackathon_leaderboard(speed_run_score DESC);
CREATE INDEX IF NOT EXISTS idx_leaderboard_accuracy ON hackathon_leaderboard(accuracy_score DESC);
CREATE INDEX IF NOT EXISTS idx_leaderboard_global_rank ON hackathon_leaderboard(global_rank);
CREATE INDEX IF NOT EXISTS idx_leaderboard_user ON hackathon_leaderboard(user_id);

-- ============================================================================
-- BADGES & ACHIEVEMENTS
-- ============================================================================
CREATE TABLE IF NOT EXISTS hackathon_badges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT NOW(),

  -- Badge Identity
  badge_code TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  icon_url TEXT,
  rarity TEXT DEFAULT 'common' CHECK (rarity IN ('common', 'rare', 'epic', 'legendary')),

  -- Unlock Criteria (stored as JSON for flexibility)
  unlock_criteria JSONB NOT NULL,

  points_value INTEGER DEFAULT 0
);

-- User Badge Junction Table
CREATE TABLE IF NOT EXISTS user_badges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  earned_at TIMESTAMPTZ DEFAULT NOW(),

  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  badge_id UUID NOT NULL REFERENCES hackathon_badges(id) ON DELETE CASCADE,

  -- Context
  challenge_id UUID REFERENCES hackathon_challenges(id) ON DELETE SET NULL,
  submission_id UUID REFERENCES hackathon_submissions(id) ON DELETE SET NULL,

  UNIQUE(user_id, badge_id)
);

-- Indexes for badges
CREATE INDEX IF NOT EXISTS idx_user_badges_user ON user_badges(user_id);
CREATE INDEX IF NOT EXISTS idx_user_badges_badge ON user_badges(badge_id);
CREATE INDEX IF NOT EXISTS idx_user_badges_earned ON user_badges(earned_at DESC);

-- ============================================================================
-- HINT USAGE TRACKING
-- ============================================================================
CREATE TABLE IF NOT EXISTS hackathon_hint_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  used_at TIMESTAMPTZ DEFAULT NOW(),

  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  challenge_id UUID NOT NULL REFERENCES hackathon_challenges(id) ON DELETE CASCADE,
  submission_id UUID REFERENCES hackathon_submissions(id) ON DELETE CASCADE,

  hint_level INTEGER NOT NULL CHECK (hint_level BETWEEN 1 AND 3), -- 1=conceptual, 2=syntax, 3=code
  blank_id TEXT,
  points_deducted INTEGER DEFAULT 0
);

-- Indexes for hint usage
CREATE INDEX IF NOT EXISTS idx_hint_usage_user ON hackathon_hint_usage(user_id);
CREATE INDEX IF NOT EXISTS idx_hint_usage_challenge ON hackathon_hint_usage(challenge_id);

-- ============================================================================
-- PEER REVIEW SYSTEM
-- ============================================================================
CREATE TABLE IF NOT EXISTS hackathon_solution_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT NOW(),

  -- Relationships
  reviewer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  submission_id UUID NOT NULL REFERENCES hackathon_submissions(id) ON DELETE CASCADE,

  -- Ratings
  efficiency_rating INTEGER CHECK (efficiency_rating BETWEEN 1 AND 5),
  readability_rating INTEGER CHECK (readability_rating BETWEEN 1 AND 5),
  creativity_rating INTEGER CHECK (creativity_rating BETWEEN 1 AND 5),

  -- Feedback
  comments TEXT,
  code_suggestions TEXT,

  -- Meta
  helpful_votes INTEGER DEFAULT 0,

  UNIQUE(reviewer_id, submission_id)
);

-- Indexes for reviews
CREATE INDEX IF NOT EXISTS idx_reviews_reviewer ON hackathon_solution_reviews(reviewer_id);
CREATE INDEX IF NOT EXISTS idx_reviews_submission ON hackathon_solution_reviews(submission_id);
CREATE INDEX IF NOT EXISTS idx_reviews_helpful ON hackathon_solution_reviews(helpful_votes DESC);

-- ============================================================================
-- DISCUSSION THREADS
-- ============================================================================
CREATE TABLE IF NOT EXISTS hackathon_discussions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  challenge_id UUID NOT NULL REFERENCES hackathon_challenges(id) ON DELETE CASCADE,
  author_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  parent_id UUID REFERENCES hackathon_discussions(id) ON DELETE CASCADE, -- For threaded replies

  content TEXT NOT NULL,
  upvotes INTEGER DEFAULT 0,
  is_solution_spoiler BOOLEAN DEFAULT false
);

-- Indexes for discussions
CREATE INDEX IF NOT EXISTS idx_discussions_challenge ON hackathon_discussions(challenge_id);
CREATE INDEX IF NOT EXISTS idx_discussions_author ON hackathon_discussions(author_id);
CREATE INDEX IF NOT EXISTS idx_discussions_parent ON hackathon_discussions(parent_id);
CREATE INDEX IF NOT EXISTS idx_discussions_upvotes ON hackathon_discussions(upvotes DESC);

-- ============================================================================
-- ROW LEVEL SECURITY POLICIES
-- ============================================================================

-- Enable RLS
ALTER TABLE hackathon_challenges ENABLE ROW LEVEL SECURITY;
ALTER TABLE hackathon_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE hackathon_leaderboard ENABLE ROW LEVEL SECURITY;
ALTER TABLE hackathon_badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE hackathon_hint_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE hackathon_solution_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE hackathon_discussions ENABLE ROW LEVEL SECURITY;

-- Challenges: Everyone can read active challenges
DROP POLICY IF EXISTS "Challenges are viewable by everyone" ON hackathon_challenges;
CREATE POLICY "Challenges are viewable by everyone"
  ON hackathon_challenges FOR SELECT
  USING (is_active = true OR creator_id = auth.uid());

-- Challenges: Users can create challenges
DROP POLICY IF EXISTS "Users can create challenges" ON hackathon_challenges;
CREATE POLICY "Users can create challenges"
  ON hackathon_challenges FOR INSERT
  WITH CHECK (auth.uid() = creator_id);

-- Challenges: Users can update their own challenges
DROP POLICY IF EXISTS "Users can update their own challenges" ON hackathon_challenges;
CREATE POLICY "Users can update their own challenges"
  ON hackathon_challenges FOR UPDATE
  USING (auth.uid() = creator_id);

-- Submissions: Users can view their own submissions
DROP POLICY IF EXISTS "Users can view their own submissions" ON hackathon_submissions;
CREATE POLICY "Users can view their own submissions"
  ON hackathon_submissions FOR SELECT
  USING (auth.uid() = user_id);

-- Submissions: Users can create their own submissions
DROP POLICY IF EXISTS "Users can create submissions" ON hackathon_submissions;
CREATE POLICY "Users can create submissions"
  ON hackathon_submissions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Leaderboard: Public read access
DROP POLICY IF EXISTS "Leaderboard is viewable by everyone" ON hackathon_leaderboard;
CREATE POLICY "Leaderboard is viewable by everyone"
  ON hackathon_leaderboard FOR SELECT
  USING (true);

-- Badges: Public read access
DROP POLICY IF EXISTS "Badges are viewable by everyone" ON hackathon_badges;
CREATE POLICY "Badges are viewable by everyone"
  ON hackathon_badges FOR SELECT
  USING (true);

-- User Badges: Users can view all earned badges
DROP POLICY IF EXISTS "User badges are viewable by everyone" ON user_badges;
CREATE POLICY "User badges are viewable by everyone"
  ON user_badges FOR SELECT
  USING (true);

-- Hint Usage: Users can view their own hint usage
DROP POLICY IF EXISTS "Users can view their own hint usage" ON hackathon_hint_usage;
CREATE POLICY "Users can view their own hint usage"
  ON hackathon_hint_usage FOR SELECT
  USING (auth.uid() = user_id);

-- Hint Usage: Users can insert their own hint usage
DROP POLICY IF EXISTS "Users can track hint usage" ON hackathon_hint_usage;
CREATE POLICY "Users can track hint usage"
  ON hackathon_hint_usage FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Reviews: Public read access
DROP POLICY IF EXISTS "Reviews are viewable by everyone" ON hackathon_solution_reviews;
CREATE POLICY "Reviews are viewable by everyone"
  ON hackathon_solution_reviews FOR SELECT
  USING (true);

-- Reviews: Users can create reviews
DROP POLICY IF EXISTS "Users can create reviews" ON hackathon_solution_reviews;
CREATE POLICY "Users can create reviews"
  ON hackathon_solution_reviews FOR INSERT
  WITH CHECK (auth.uid() = reviewer_id);

-- Discussions: Public read access
DROP POLICY IF EXISTS "Discussions are viewable by everyone" ON hackathon_discussions;
CREATE POLICY "Discussions are viewable by everyone"
  ON hackathon_discussions FOR SELECT
  USING (true);

-- Discussions: Users can create discussions
DROP POLICY IF EXISTS "Users can create discussions" ON hackathon_discussions;
CREATE POLICY "Users can create discussions"
  ON hackathon_discussions FOR INSERT
  WITH CHECK (auth.uid() = author_id);

-- ============================================================================
-- TRIGGERS & FUNCTIONS
-- ============================================================================

-- Function to update leaderboard on new submission
CREATE OR REPLACE FUNCTION update_leaderboard_on_submission()
RETURNS TRIGGER AS $$
DECLARE
  v_time_bonus INTEGER := 0;
  v_challenge_time_threshold INTEGER;
BEGIN
  -- Only process successful submissions
  IF NEW.passed THEN
    -- Get challenge time threshold for speed bonus calculation
    SELECT estimated_time_minutes * 60 INTO v_challenge_time_threshold
    FROM hackathon_challenges
    WHERE id = NEW.challenge_id;

    -- Calculate time bonus if completed faster than threshold
    IF NEW.completion_time_seconds IS NOT NULL AND
       NEW.completion_time_seconds < v_challenge_time_threshold THEN
      v_time_bonus := NEW.time_bonus;
    END IF;

    -- Update or insert leaderboard entry
    INSERT INTO hackathon_leaderboard (
      user_id,
      total_challenges_completed,
      total_points,
      speed_run_score,
      last_activity_date,
      updated_at
    )
    VALUES (
      NEW.user_id,
      1,
      NEW.final_score,
      v_time_bonus,
      CURRENT_DATE,
      NOW()
    )
    ON CONFLICT (user_id) DO UPDATE SET
      total_challenges_completed = hackathon_leaderboard.total_challenges_completed + 1,
      total_points = hackathon_leaderboard.total_points + NEW.final_score,
      speed_run_score = hackathon_leaderboard.speed_run_score + v_time_bonus,
      last_activity_date = CURRENT_DATE,
      updated_at = NOW();

    -- Update challenge stats
    UPDATE hackathon_challenges
    SET
      success_count = success_count + 1,
      average_completion_time_seconds = (
        COALESCE(average_completion_time_seconds * success_count, 0) + COALESCE(NEW.completion_time_seconds, 0)
      ) / (success_count + 1)
    WHERE id = NEW.challenge_id;
  END IF;

  -- Always update attempt count
  UPDATE hackathon_challenges
  SET attempts_count = attempts_count + 1
  WHERE id = NEW.challenge_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS leaderboard_update_trigger ON hackathon_submissions;

-- Create trigger
CREATE TRIGGER leaderboard_update_trigger
AFTER INSERT ON hackathon_submissions
FOR EACH ROW EXECUTE FUNCTION update_leaderboard_on_submission();

-- Function to refresh leaderboard rankings
CREATE OR REPLACE FUNCTION refresh_leaderboard_ranks()
RETURNS void AS $$
BEGIN
  -- Update global ranks
  WITH ranked_users AS (
    SELECT
      user_id,
      ROW_NUMBER() OVER (ORDER BY total_points DESC, total_challenges_completed DESC) as rank
    FROM hackathon_leaderboard
  )
  UPDATE hackathon_leaderboard l
  SET global_rank = r.rank
  FROM ranked_users r
  WHERE l.user_id = r.user_id;
END;
$$ LANGUAGE plpgsql;

-- Function to check and award badges
CREATE OR REPLACE FUNCTION check_and_award_badges(p_user_id UUID, p_submission_id UUID)
RETURNS void AS $$
DECLARE
  v_badge RECORD;
  v_user_stats RECORD;
  v_criteria JSONB;
BEGIN
  -- Get user stats
  SELECT
    total_challenges_completed,
    total_points,
    current_streak
  INTO v_user_stats
  FROM hackathon_leaderboard
  WHERE user_id = p_user_id;

  -- Check each badge
  FOR v_badge IN SELECT * FROM hackathon_badges LOOP
    v_criteria := v_badge.unlock_criteria;

    -- Check if user already has this badge
    IF NOT EXISTS (
      SELECT 1 FROM user_badges
      WHERE user_id = p_user_id AND badge_id = v_badge.id
    ) THEN
      -- Check criteria type and award if met
      CASE v_criteria->>'type'
        WHEN 'challenges_completed' THEN
          IF v_user_stats.total_challenges_completed >= (v_criteria->>'count')::INTEGER THEN
            INSERT INTO user_badges (user_id, badge_id, submission_id)
            VALUES (p_user_id, v_badge.id, p_submission_id);
          END IF;
        WHEN 'total_points' THEN
          IF v_user_stats.total_points >= (v_criteria->>'threshold')::INTEGER THEN
            INSERT INTO user_badges (user_id, badge_id, submission_id)
            VALUES (p_user_id, v_badge.id, p_submission_id);
          END IF;
        -- Add more badge criteria types as needed
      END CASE;
    END IF;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- SEED DATA - Default Badges
-- ============================================================================

INSERT INTO hackathon_badges (badge_code, name, description, icon_url, rarity, unlock_criteria, points_value)
VALUES
  ('first_steps', 'First Steps', 'Complete your first challenge', '/badges/first-steps.svg', 'common',
   '{"type": "challenges_completed", "count": 1}'::jsonb, 50),

  ('persistent', 'Persistent Learner', 'Complete 10 challenges', '/badges/persistent.svg', 'common',
   '{"type": "challenges_completed", "count": 10}'::jsonb, 100),

  ('dedicated', 'Dedicated Scholar', 'Complete 50 challenges', '/badges/dedicated.svg', 'rare',
   '{"type": "challenges_completed", "count": 50}'::jsonb, 500),

  ('master', 'Data Master', 'Complete 100 challenges', '/badges/master.svg', 'epic',
   '{"type": "challenges_completed", "count": 100}'::jsonb, 1000),

  ('speed_demon', 'Speed Demon', 'Complete 5 challenges with time bonuses', '/badges/speed.svg', 'rare',
   '{"type": "speed_run_count", "count": 5}'::jsonb, 300),

  ('perfectionist', 'Perfectionist', 'Get perfect score on 10 challenges', '/badges/perfect.svg', 'epic',
   '{"type": "perfect_scores", "count": 10}'::jsonb, 750),

  ('polyglot', 'Code Polyglot', 'Complete challenges in Python, SQL, and R', '/badges/polyglot.svg', 'legendary',
   '{"type": "languages_used", "languages": ["python", "sql", "r"]}'::jsonb, 1500),

  ('helpful', 'Helpful Reviewer', 'Give 25 peer reviews', '/badges/helpful.svg', 'rare',
   '{"type": "reviews_given", "count": 25}'::jsonb, 400)
ON CONFLICT (badge_code) DO NOTHING;

-- ============================================================================
-- SAMPLE CHALLENGES (for testing)
-- ============================================================================

-- Sample Python Challenge (Beginner)
INSERT INTO hackathon_challenges (
  title,
  description,
  difficulty_level,
  language,
  user_prompt,
  incomplete_code,
  complete_solution,
  blanks,
  test_cases,
  learning_objectives,
  concepts_tested,
  estimated_time_minutes,
  base_points,
  challenge_format,
  is_active,
  is_featured
)
VALUES (
  'Calculate Basic Statistics',
  'Calculate the mean, median, and standard deviation of a numerical column in the dataset.',
  'beginner',
  'python',
  'Calculate mean, median, and standard deviation of the pH column',
  E'import pandas as pd\nimport numpy as np\n\n# Load dataset\ndf = pd.read_csv(\"dataset.csv\")\n\n# Calculate statistics\nmean_ph = df[\"pH\"].___BLANK_1___()\nmedian_ph = df[\"pH\"].___BLANK_2___()\nstd_ph = df[\"pH\"].___BLANK_3___()\n\nprint(f\"Mean: {mean_ph:.2f}\")\nprint(f\"Median: {median_ph:.2f}\")\nprint(f\"Std Dev: {std_ph:.2f}\")',
  E'import pandas as pd\nimport numpy as np\n\n# Load dataset\ndf = pd.read_csv(\"dataset.csv\")\n\n# Calculate statistics\nmean_ph = df[\"pH\"].mean()\nmedian_ph = df[\"pH\"].median()\nstd_ph = df[\"pH\"].std()\n\nprint(f\"Mean: {mean_ph:.2f}\")\nprint(f\"Median: {median_ph:.2f}\")\nprint(f\"Std Dev: {std_ph:.2f}\")',
  '[
    {
      "id": "BLANK_1",
      "type": "function_name",
      "expected_answer": "mean",
      "concept_tested": "pandas aggregation",
      "hint_progression": [
        "Think about which pandas function calculates the average",
        "The function name is a synonym for average",
        "Use the mean() function"
      ]
    },
    {
      "id": "BLANK_2",
      "type": "function_name",
      "expected_answer": "median",
      "concept_tested": "pandas aggregation",
      "hint_progression": [
        "This function finds the middle value",
        "The function is named after the statistical term for the middle value",
        "Use the median() function"
      ]
    },
    {
      "id": "BLANK_3",
      "type": "function_name",
      "expected_answer": "std",
      "concept_tested": "pandas aggregation",
      "hint_progression": [
        "This measures data spread or variability",
        "The abbreviation for standard deviation",
        "Use the std() function"
      ]
    }
  ]'::jsonb,
  '[
    {
      "description": "Mean is calculated correctly",
      "validation_type": "numeric_tolerance",
      "tolerance": 0.01
    },
    {
      "description": "Median is calculated correctly",
      "validation_type": "numeric_tolerance",
      "tolerance": 0.01
    },
    {
      "description": "Standard deviation is calculated correctly",
      "validation_type": "numeric_tolerance",
      "tolerance": 0.01
    }
  ]'::jsonb,
  ARRAY['pandas basics', 'descriptive statistics'],
  ARRAY['mean', 'median', 'standard deviation', 'pandas'],
  10,
  100,
  'cloze',
  true,
  true
)
ON CONFLICT DO NOTHING;

-- ============================================================================
-- HELPER VIEWS
-- ============================================================================

-- View for user progress dashboard
CREATE OR REPLACE VIEW user_hackathon_progress AS
SELECT
  u.id as user_id,
  u.email,
  COALESCE(l.total_challenges_completed, 0) as challenges_completed,
  COALESCE(l.total_points, 0) as total_points,
  COALESCE(l.global_rank, 0) as global_rank,
  COALESCE(l.current_streak, 0) as current_streak,
  COALESCE(array_length(l.badges_earned, 1), 0) as badges_count,
  COUNT(DISTINCT hs.id) as total_submissions,
  COUNT(DISTINCT hs.id) FILTER (WHERE hs.passed = true) as successful_submissions,
  ROUND(
    (COUNT(DISTINCT hs.id) FILTER (WHERE hs.passed = true)::DECIMAL /
    NULLIF(COUNT(DISTINCT hs.id), 0) * 100), 2
  ) as success_rate
FROM auth.users u
LEFT JOIN hackathon_leaderboard l ON u.id = l.user_id
LEFT JOIN hackathon_submissions hs ON u.id = hs.user_id
GROUP BY u.id, u.email, l.total_challenges_completed, l.total_points,
         l.global_rank, l.current_streak, l.badges_earned;

-- View for challenge difficulty stats
CREATE OR REPLACE VIEW challenge_difficulty_stats AS
SELECT
  difficulty_level,
  language,
  COUNT(*) as total_challenges,
  AVG(base_points) as avg_points,
  AVG(estimated_time_minutes) as avg_time_minutes,
  SUM(attempts_count) as total_attempts,
  SUM(success_count) as total_successes,
  ROUND((SUM(success_count)::DECIMAL / NULLIF(SUM(attempts_count), 0) * 100), 2) as success_rate
FROM hackathon_challenges
WHERE is_active = true
GROUP BY difficulty_level, language;

-- ============================================================================
-- COMPLETE
-- ============================================================================

-- Grant permissions (adjust as needed for your setup)
-- GRANT SELECT ON ALL TABLES IN SCHEMA public TO authenticated;
-- GRANT INSERT, UPDATE ON hackathon_submissions TO authenticated;
-- GRANT INSERT ON hackathon_hint_usage TO authenticated;

COMMENT ON TABLE hackathon_challenges IS 'Stores all hackathon coding challenges with metadata and test cases';
COMMENT ON TABLE hackathon_submissions IS 'Records all user attempts at challenges with execution results';
COMMENT ON TABLE hackathon_leaderboard IS 'Maintains aggregated user rankings and statistics';
COMMENT ON TABLE hackathon_badges IS 'Defines all available achievement badges';
COMMENT ON TABLE user_badges IS 'Tracks which badges each user has earned';
