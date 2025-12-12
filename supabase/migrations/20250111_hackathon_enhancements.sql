-- Hackathon Enhancement Migration
-- Adds support for: AI generation, visual outputs, dashboard portfolios, GitHub sync

-- ============================================================================
-- VISUAL OUTPUTS & PINS
-- ============================================================================
CREATE TABLE IF NOT EXISTS hackathon_outputs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT NOW(),

  -- Ownership
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  submission_id UUID REFERENCES hackathon_submissions(id) ON DELETE CASCADE,
  challenge_id UUID REFERENCES hackathon_challenges(id) ON DELETE CASCADE,

  -- Output Content
  output_type TEXT NOT NULL CHECK (output_type IN ('plot', 'table', 'text', 'metric', 'insight')),
  title TEXT NOT NULL,
  description TEXT,

  -- Data
  content JSONB NOT NULL, -- Stores the actual output data
  thumbnail_url TEXT, -- For plots - base64 or uploaded image

  -- Metadata
  code_used TEXT, -- The code that generated this output
  execution_context JSONB, -- Parameters, dataset info, etc.

  -- Pinning & Organization
  is_pinned BOOLEAN DEFAULT false,
  pin_order INTEGER,
  tags TEXT[],

  -- Sharing
  is_public BOOLEAN DEFAULT false,
  view_count INTEGER DEFAULT 0
);

CREATE INDEX idx_outputs_user ON hackathon_outputs(user_id);
CREATE INDEX idx_outputs_submission ON hackathon_outputs(submission_id);
CREATE INDEX idx_outputs_pinned ON hackathon_outputs(user_id, is_pinned) WHERE is_pinned = true;
CREATE INDEX idx_outputs_public ON hackathon_outputs(is_public) WHERE is_public = true;

-- ============================================================================
-- HACKATHON PORTFOLIOS (User Dashboards)
-- ============================================================================
CREATE TABLE IF NOT EXISTS hackathon_portfolios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- User
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Portfolio Content
  display_name TEXT,
  bio TEXT,
  profile_image_url TEXT,

  -- Layout & Design
  layout_config JSONB DEFAULT '{}'::jsonb, -- Dashboard layout preferences
  theme TEXT DEFAULT 'default',

  -- Sections
  pinned_outputs UUID[], -- Array of output IDs
  featured_challenges UUID[], -- Challenges to showcase

  -- Analytics Summary
  summary_stats JSONB, -- Custom stats they want to show
  skills_demonstrated TEXT[],

  -- Sharing & Visibility
  is_public BOOLEAN DEFAULT false,
  custom_url_slug TEXT UNIQUE,

  -- GitHub Integration
  github_username TEXT,
  github_repo_url TEXT,
  last_github_sync TIMESTAMPTZ,
  auto_sync_enabled BOOLEAN DEFAULT false
);

CREATE INDEX idx_portfolios_user ON hackathon_portfolios(user_id);
CREATE INDEX idx_portfolios_public ON hackathon_portfolios(is_public) WHERE is_public = true;
CREATE INDEX idx_portfolios_slug ON hackathon_portfolios(custom_url_slug) WHERE custom_url_slug IS NOT NULL;

-- ============================================================================
-- CUSTOM DATASETS FOR CHALLENGES
-- ============================================================================
CREATE TABLE IF NOT EXISTS hackathon_custom_datasets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT NOW(),

  -- Ownership
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Dataset Info
  name TEXT NOT NULL,
  description TEXT,
  file_url TEXT NOT NULL, -- Supabase storage URL
  file_size_bytes BIGINT,
  row_count INTEGER,
  column_count INTEGER,

  -- Schema
  schema_info JSONB, -- Column names, types, sample data

  -- Usage
  is_public BOOLEAN DEFAULT false,
  times_used INTEGER DEFAULT 0,

  -- AI Generation Context
  suggested_challenges JSONB -- AI-generated challenge ideas for this dataset
);

CREATE INDEX idx_custom_datasets_user ON hackathon_custom_datasets(user_id);
CREATE INDEX idx_custom_datasets_public ON hackathon_custom_datasets(is_public) WHERE is_public = true;

-- ============================================================================
-- AI GENERATION HISTORY
-- ============================================================================
CREATE TABLE IF NOT EXISTS hackathon_ai_generations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT NOW(),

  -- Request
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  generation_type TEXT NOT NULL CHECK (generation_type IN ('challenge', 'hint', 'solution', 'insight')),

  -- Input
  prompt TEXT NOT NULL,
  context JSONB, -- Dataset info, user preferences, etc.

  -- Output
  generated_content JSONB NOT NULL,
  challenge_id UUID REFERENCES hackathon_challenges(id) ON DELETE SET NULL,

  -- Metadata
  model_used TEXT DEFAULT 'gemini-pro',
  tokens_used INTEGER,
  generation_time_ms INTEGER,

  -- Quality feedback
  user_rating INTEGER CHECK (user_rating BETWEEN 1 AND 5),
  user_feedback TEXT
);

CREATE INDEX idx_ai_generations_user ON hackathon_ai_generations(user_id);
CREATE INDEX idx_ai_generations_type ON hackathon_ai_generations(generation_type);
CREATE INDEX idx_ai_generations_created ON hackathon_ai_generations(created_at DESC);

-- ============================================================================
-- GITHUB SYNC LOGS
-- ============================================================================
CREATE TABLE IF NOT EXISTS hackathon_github_syncs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  synced_at TIMESTAMPTZ DEFAULT NOW(),

  -- User & Portfolio
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  portfolio_id UUID REFERENCES hackathon_portfolios(id) ON DELETE CASCADE,

  -- Sync Details
  sync_type TEXT NOT NULL CHECK (sync_type IN ('manual', 'auto', 'portfolio', 'challenge')),
  github_repo_url TEXT NOT NULL,
  commit_sha TEXT,

  -- Content Synced
  items_synced JSONB, -- List of what was synced

  -- Status
  status TEXT NOT NULL CHECK (status IN ('pending', 'success', 'failed')),
  error_message TEXT
);

CREATE INDEX idx_github_syncs_user ON hackathon_github_syncs(user_id);
CREATE INDEX idx_github_syncs_status ON hackathon_github_syncs(status);

-- ============================================================================
-- UPDATE EXISTING TABLES
-- ============================================================================

-- Add new fields to hackathon_challenges
ALTER TABLE hackathon_challenges
  ADD COLUMN IF NOT EXISTS ai_generated BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS generation_prompt TEXT,
  ADD COLUMN IF NOT EXISTS custom_dataset_id UUID REFERENCES hackathon_custom_datasets(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS challenge_tasks JSONB DEFAULT '[]'::jsonb; -- New format: array of tasks instead of blanks

-- Add visual outputs tracking to submissions
ALTER TABLE hackathon_submissions
  ADD COLUMN IF NOT EXISTS outputs_generated INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS has_visualizations BOOLEAN DEFAULT false;

-- ============================================================================
-- ROW LEVEL SECURITY
-- ============================================================================

ALTER TABLE hackathon_outputs ENABLE ROW LEVEL SECURITY;
ALTER TABLE hackathon_portfolios ENABLE ROW LEVEL SECURITY;
ALTER TABLE hackathon_custom_datasets ENABLE ROW LEVEL SECURITY;
ALTER TABLE hackathon_ai_generations ENABLE ROW LEVEL SECURITY;
ALTER TABLE hackathon_github_syncs ENABLE ROW LEVEL SECURITY;

-- Outputs: Users can manage their own, everyone can see public
CREATE POLICY "Users can manage their own outputs"
  ON hackathon_outputs FOR ALL
  USING (auth.uid() = user_id);

CREATE POLICY "Public outputs are viewable by everyone"
  ON hackathon_outputs FOR SELECT
  USING (is_public = true);

-- Portfolios: Users manage their own, everyone can see public
CREATE POLICY "Users can manage their own portfolio"
  ON hackathon_portfolios FOR ALL
  USING (auth.uid() = user_id);

CREATE POLICY "Public portfolios are viewable by everyone"
  ON hackathon_portfolios FOR SELECT
  USING (is_public = true);

-- Custom datasets: Users manage their own, everyone can see public
CREATE POLICY "Users can manage their own datasets"
  ON hackathon_custom_datasets FOR ALL
  USING (auth.uid() = user_id);

CREATE POLICY "Public datasets are viewable by everyone"
  ON hackathon_custom_datasets FOR SELECT
  USING (is_public = true);

-- AI generations: Users can only see their own
CREATE POLICY "Users can view their own AI generations"
  ON hackathon_ai_generations FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create AI generations"
  ON hackathon_ai_generations FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- GitHub syncs: Users can only see their own
CREATE POLICY "Users can view their own syncs"
  ON hackathon_github_syncs FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create syncs"
  ON hackathon_github_syncs FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- ============================================================================
-- FUNCTIONS
-- ============================================================================

-- Function to pin/unpin output
CREATE OR REPLACE FUNCTION toggle_output_pin(p_output_id UUID, p_user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  v_is_pinned BOOLEAN;
  v_max_order INTEGER;
BEGIN
  -- Get current pin status
  SELECT is_pinned INTO v_is_pinned
  FROM hackathon_outputs
  WHERE id = p_output_id AND user_id = p_user_id;

  IF NOT FOUND THEN
    RETURN false;
  END IF;

  IF v_is_pinned THEN
    -- Unpin
    UPDATE hackathon_outputs
    SET is_pinned = false, pin_order = NULL
    WHERE id = p_output_id;
  ELSE
    -- Pin - assign next order
    SELECT COALESCE(MAX(pin_order), 0) + 1 INTO v_max_order
    FROM hackathon_outputs
    WHERE user_id = p_user_id AND is_pinned = true;

    UPDATE hackathon_outputs
    SET is_pinned = true, pin_order = v_max_order
    WHERE id = p_output_id;
  END IF;

  RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to create or get portfolio
CREATE OR REPLACE FUNCTION get_or_create_portfolio(p_user_id UUID)
RETURNS UUID AS $$
DECLARE
  v_portfolio_id UUID;
BEGIN
  -- Try to get existing
  SELECT id INTO v_portfolio_id
  FROM hackathon_portfolios
  WHERE user_id = p_user_id;

  -- Create if doesn't exist
  IF NOT FOUND THEN
    INSERT INTO hackathon_portfolios (user_id)
    VALUES (p_user_id)
    RETURNING id INTO v_portfolio_id;
  END IF;

  RETURN v_portfolio_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- VIEWS
-- ============================================================================

-- View for user portfolio summary
CREATE OR REPLACE VIEW user_portfolio_summary AS
SELECT
  p.user_id,
  p.display_name,
  p.bio,
  p.is_public,
  p.custom_url_slug,
  p.github_username,
  COUNT(DISTINCT o.id) FILTER (WHERE o.is_pinned) as pinned_count,
  COUNT(DISTINCT s.id) FILTER (WHERE s.passed) as challenges_completed,
  COALESCE(l.total_points, 0) as total_points,
  COALESCE(l.global_rank, 0) as global_rank,
  p.skills_demonstrated
FROM hackathon_portfolios p
LEFT JOIN hackathon_outputs o ON p.user_id = o.user_id
LEFT JOIN hackathon_submissions s ON p.user_id = s.user_id
LEFT JOIN hackathon_leaderboard l ON p.user_id = l.user_id
GROUP BY p.user_id, p.display_name, p.bio, p.is_public, p.custom_url_slug,
         p.github_username, l.total_points, l.global_rank, p.skills_demonstrated;

-- ============================================================================
-- SAMPLE DATA
-- ============================================================================

COMMENT ON TABLE hackathon_outputs IS 'Stores visual outputs (plots, tables) that users can pin to their dashboard';
COMMENT ON TABLE hackathon_portfolios IS 'User portfolio pages showcasing their work';
COMMENT ON TABLE hackathon_custom_datasets IS 'User-uploaded datasets for custom challenges';
COMMENT ON TABLE hackathon_ai_generations IS 'Log of AI-generated content for auditing and improvement';
COMMENT ON TABLE hackathon_github_syncs IS 'Track GitHub synchronization history';
