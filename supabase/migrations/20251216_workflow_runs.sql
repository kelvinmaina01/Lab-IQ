-- =============================================================================
-- WORKFLOW RUNS TABLE
-- Track workflow execution history and status
-- =============================================================================

-- Create workflow_runs table if not exists
CREATE TABLE IF NOT EXISTS workflow_runs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workflow_id UUID NOT NULL,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

    -- Execution details
    status TEXT NOT NULL DEFAULT 'pending',
    started_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ,
    duration_ms INTEGER,

    -- Execution context
    trigger_type TEXT, -- 'manual', 'scheduled', 'event'
    input_data JSONB DEFAULT '{}',
    output_data JSONB DEFAULT '{}',

    -- Step tracking
    current_step INTEGER DEFAULT 0,
    total_steps INTEGER DEFAULT 0,
    step_results JSONB[] DEFAULT '{}',

    -- Error handling
    error_message TEXT,
    error_stack TEXT,

    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_workflow_runs_workflow_id ON workflow_runs(workflow_id);
CREATE INDEX IF NOT EXISTS idx_workflow_runs_user_id ON workflow_runs(user_id);
CREATE INDEX IF NOT EXISTS idx_workflow_runs_status ON workflow_runs(status);
CREATE INDEX IF NOT EXISTS idx_workflow_runs_started_at ON workflow_runs(started_at DESC);

-- Enable RLS
ALTER TABLE workflow_runs ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own workflow runs"
    ON workflow_runs FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can create own workflow runs"
    ON workflow_runs FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own workflow runs"
    ON workflow_runs FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own workflow runs"
    ON workflow_runs FOR DELETE
    USING (auth.uid() = user_id);

-- Auto-update timestamp
CREATE OR REPLACE FUNCTION update_workflow_run_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_workflow_run_timestamp ON workflow_runs;
CREATE TRIGGER trigger_update_workflow_run_timestamp
    BEFORE UPDATE ON workflow_runs
    FOR EACH ROW
    EXECUTE FUNCTION update_workflow_run_timestamp();

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE workflow_runs;
