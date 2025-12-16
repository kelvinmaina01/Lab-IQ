-- =============================================================================
-- PINNED DASHBOARDS SYSTEM
-- Production-grade dashboard pinning with real-time sync
-- =============================================================================

-- Create enum for dashboard types
DO $$ BEGIN
    CREATE TYPE dashboard_type AS ENUM (
        'insight',      -- AI-generated insights
        'chart',        -- Data visualizations
        'metric',       -- Single KPI metrics
        'table',        -- Data tables
        'summary',      -- Text summaries
        'custom'        -- User-created custom dashboards
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create enum for dashboard source
DO $$ BEGIN
    CREATE TYPE dashboard_source AS ENUM (
        'ai_assistant',     -- Auto-pinned from AI chat
        'manual',           -- User-created
        'experiment',       -- From experiment results
        'report',           -- From report generation
        'workflow',         -- From workflow execution
        'system'            -- System-generated
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Main pinned_dashboards table
CREATE TABLE IF NOT EXISTS pinned_dashboards (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

    -- Dashboard identity
    title TEXT NOT NULL,
    description TEXT,
    type TEXT NOT NULL DEFAULT 'insight',
    source TEXT NOT NULL DEFAULT 'manual',

    -- Visual configuration
    config JSONB NOT NULL DEFAULT '{}',
    -- Config schema:
    -- {
    --   "chartType": "line|bar|pie|area|scatter|table|metric",
    --   "colors": ["#3b82f6", "#10b981"],
    --   "xAxis": "column_name",
    --   "yAxis": "column_name",
    --   "aggregation": "sum|avg|count|min|max",
    --   "filters": [{"column": "...", "operator": "=", "value": "..."}],
    --   "layout": {"width": 1|2|3, "height": 1|2}
    -- }

    -- Data reference
    data JSONB DEFAULT '{}',
    -- Data schema for different types:
    -- For charts: { "labels": [...], "datasets": [{ "label": "...", "data": [...] }] }
    -- For metrics: { "value": 123, "unit": "%", "trend": "up|down|stable", "change": 5.2 }
    -- For tables: { "columns": [...], "rows": [...] }
    -- For insights: { "summary": "...", "keyPoints": [...], "recommendations": [...] }

    -- Source reference
    source_id UUID,  -- Reference to dataset_id, experiment_id, etc.
    source_table TEXT,  -- 'datasets', 'experiments', 'workflows', etc.

    -- Organization
    category TEXT DEFAULT 'general',
    tags TEXT[] DEFAULT '{}',
    is_favorite BOOLEAN DEFAULT false,
    display_order INTEGER DEFAULT 0,

    -- Sharing
    is_shared BOOLEAN DEFAULT false,
    shared_with UUID[] DEFAULT '{}',  -- User IDs who can view

    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    last_viewed_at TIMESTAMPTZ,

    -- Soft delete
    is_archived BOOLEAN DEFAULT false
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_pinned_dashboards_user_id ON pinned_dashboards(user_id);
CREATE INDEX IF NOT EXISTS idx_pinned_dashboards_source ON pinned_dashboards(source);
CREATE INDEX IF NOT EXISTS idx_pinned_dashboards_category ON pinned_dashboards(category);
CREATE INDEX IF NOT EXISTS idx_pinned_dashboards_created_at ON pinned_dashboards(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_pinned_dashboards_is_favorite ON pinned_dashboards(is_favorite) WHERE is_favorite = true;
CREATE INDEX IF NOT EXISTS idx_pinned_dashboards_is_archived ON pinned_dashboards(is_archived) WHERE is_archived = false;

-- Enable Row Level Security
ALTER TABLE pinned_dashboards ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own dashboards"
    ON pinned_dashboards FOR SELECT
    USING (auth.uid() = user_id OR auth.uid() = ANY(shared_with));

CREATE POLICY "Users can create own dashboards"
    ON pinned_dashboards FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own dashboards"
    ON pinned_dashboards FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own dashboards"
    ON pinned_dashboards FOR DELETE
    USING (auth.uid() = user_id);

-- Dashboard snapshots for history/versioning
CREATE TABLE IF NOT EXISTS dashboard_snapshots (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    dashboard_id UUID NOT NULL REFERENCES pinned_dashboards(id) ON DELETE CASCADE,
    data JSONB NOT NULL,
    config JSONB NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id)
);

CREATE INDEX IF NOT EXISTS idx_dashboard_snapshots_dashboard_id ON dashboard_snapshots(dashboard_id);

-- Enable RLS on snapshots
ALTER TABLE dashboard_snapshots ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view snapshots of their dashboards"
    ON dashboard_snapshots FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM pinned_dashboards
            WHERE id = dashboard_snapshots.dashboard_id
            AND (user_id = auth.uid() OR auth.uid() = ANY(shared_with))
        )
    );

CREATE POLICY "Users can create snapshots of their dashboards"
    ON dashboard_snapshots FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM pinned_dashboards
            WHERE id = dashboard_snapshots.dashboard_id
            AND user_id = auth.uid()
        )
    );

-- Function to auto-update updated_at
CREATE OR REPLACE FUNCTION update_pinned_dashboard_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for auto-updating timestamp
DROP TRIGGER IF EXISTS trigger_update_pinned_dashboard_timestamp ON pinned_dashboards;
CREATE TRIGGER trigger_update_pinned_dashboard_timestamp
    BEFORE UPDATE ON pinned_dashboards
    FOR EACH ROW
    EXECUTE FUNCTION update_pinned_dashboard_timestamp();

-- Enable real-time for pinned_dashboards
ALTER PUBLICATION supabase_realtime ADD TABLE pinned_dashboards;

-- Insert some demo dashboards for presentation
INSERT INTO pinned_dashboards (user_id, title, description, type, source, config, data, category, is_favorite)
SELECT
    auth.uid(),
    'Experiment Success Rate',
    'Weekly success rate of experiments across all projects',
    'chart',
    'system',
    '{"chartType": "area", "colors": ["#10b981", "#3b82f6"], "showLegend": true}'::jsonb,
    '{"labels": ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"], "datasets": [{"label": "Success Rate", "data": [72, 78, 85, 82, 90, 88, 94]}]}'::jsonb,
    'experiments',
    true
WHERE auth.uid() IS NOT NULL
ON CONFLICT DO NOTHING;
