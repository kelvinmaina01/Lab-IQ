-- =============================================================================
-- V1 Completion Migrations
-- 
-- Run these migrations to add tables required for V1 feature completion
-- =============================================================================

-- =============================================================================
-- 1. Model Signals Table (for SignalEmitter)
-- =============================================================================
CREATE TABLE IF NOT EXISTS model_signals (
    id TEXT PRIMARY KEY,
    type TEXT NOT NULL CHECK (type IN ('anomaly', 'prediction', 'threshold_breach', 'trend_change', 'correlation', 'pattern_detected')),
    model_id TEXT NOT NULL,
    dataset_id UUID REFERENCES datasets(id) ON DELETE CASCADE,
    score DECIMAL(4,3) NOT NULL CHECK (score >= 0 AND score <= 1),
    confidence DECIMAL(4,3) NOT NULL CHECK (confidence >= 0 AND confidence <= 1),
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for querying by model
CREATE INDEX IF NOT EXISTS idx_model_signals_model_id ON model_signals(model_id);

-- Index for querying by dataset
CREATE INDEX IF NOT EXISTS idx_model_signals_dataset_id ON model_signals(dataset_id);

-- Index for time-based queries
CREATE INDEX IF NOT EXISTS idx_model_signals_created_at ON model_signals(created_at DESC);

-- Enable RLS
ALTER TABLE model_signals ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can only see signals for their datasets
DROP POLICY IF EXISTS "Users can view their model signals" ON model_signals;
CREATE POLICY "Users can view their model signals" ON model_signals
    FOR SELECT
    USING (
        dataset_id IN (
            SELECT id FROM datasets WHERE user_id = auth.uid()
        )
    );

-- =============================================================================
-- 2. Notifications Table (for NotificationService)
-- =============================================================================
CREATE TABLE IF NOT EXISTS notifications (
    id TEXT PRIMARY KEY,
    type TEXT NOT NULL,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    urgency TEXT DEFAULT 'medium' CHECK (urgency IN ('low', 'medium', 'high', 'critical')),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    metadata JSONB DEFAULT '{}',
    read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for user notifications
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);

-- Index for unread notifications
CREATE INDEX IF NOT EXISTS idx_notifications_unread ON notifications(user_id, read) WHERE read = FALSE;

-- Index for time-based queries
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at DESC);

-- Enable RLS
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can only see their own notifications
DROP POLICY IF EXISTS "Users can view their notifications" ON notifications;
CREATE POLICY "Users can view their notifications" ON notifications
    FOR SELECT
    USING (user_id = auth.uid());

-- RLS Policy: System can insert notifications
DROP POLICY IF EXISTS "System can insert notifications" ON notifications;
CREATE POLICY "System can insert notifications" ON notifications
    FOR INSERT
    WITH CHECK (TRUE);

-- RLS Policy: Users can update (mark read) their notifications
DROP POLICY IF EXISTS "Users can update their notifications" ON notifications;
CREATE POLICY "Users can update their notifications" ON notifications
    FOR UPDATE
    USING (user_id = auth.uid());

-- =============================================================================
-- 3. Notification Preferences Table
-- =============================================================================
CREATE TABLE IF NOT EXISTS notification_preferences (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    channels JSONB DEFAULT '{"email": true, "inApp": true, "webhook": false}',
    filters JSONB DEFAULT '{"urgencyThreshold": "low", "mutedTypes": []}',
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE notification_preferences ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can manage their own preferences
DROP POLICY IF EXISTS "Users can manage their notification preferences" ON notification_preferences;
CREATE POLICY "Users can manage their notification preferences" ON notification_preferences
    FOR ALL
    USING (user_id = auth.uid());

-- =============================================================================
-- 4. Audit Log Table (for ComplianceService)
-- =============================================================================
CREATE TABLE IF NOT EXISTS audit_log (
    id TEXT PRIMARY KEY,
    action TEXT NOT NULL,
    resource_type TEXT NOT NULL,
    resource_id TEXT NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    details JSONB DEFAULT '{}',
    ip_address INET,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for resource-based queries
CREATE INDEX IF NOT EXISTS idx_audit_log_resource ON audit_log(resource_type, resource_id);

-- Index for user-based queries
CREATE INDEX IF NOT EXISTS idx_audit_log_user_id ON audit_log(user_id);

-- Index for time-based queries
CREATE INDEX IF NOT EXISTS idx_audit_log_created_at ON audit_log(created_at DESC);

-- Enable RLS
ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can see audit logs for their resources
DROP POLICY IF EXISTS "Users can view their audit logs" ON audit_log;
CREATE POLICY "Users can view their audit logs" ON audit_log
    FOR SELECT
    USING (user_id = auth.uid());

-- =============================================================================
-- 5. Data Processing Records Table (for GDPR Compliance)
-- =============================================================================
CREATE TABLE IF NOT EXISTS data_processing_records (
    id TEXT PRIMARY KEY,
    dataset_id UUID REFERENCES datasets(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    purpose TEXT NOT NULL,
    legal_basis TEXT NOT NULL,
    data_categories TEXT[] DEFAULT ARRAY[]::TEXT[],
    retention_period TEXT,
    processing_started TIMESTAMPTZ DEFAULT NOW(),
    processing_ended TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for dataset-based queries
CREATE INDEX IF NOT EXISTS idx_data_processing_dataset_id ON data_processing_records(dataset_id);

-- Enable RLS
ALTER TABLE data_processing_records ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can view their data processing records
DROP POLICY IF EXISTS "Users can view their data processing records" ON data_processing_records;
CREATE POLICY "Users can view their data processing records" ON data_processing_records
    FOR SELECT
    USING (user_id = auth.uid());

-- =============================================================================
-- 6. Experiments Table Updates (if not exists)
-- =============================================================================
-- Ensure experiments table has required columns for state machine

-- Add missing columns if they don't exist
DO $$
BEGIN
    -- Add proposed_by column if missing
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'experiments' AND column_name = 'proposed_by') THEN
        ALTER TABLE experiments ADD COLUMN proposed_by TEXT DEFAULT 'user';
    END IF;
    
    -- Add started_at column if missing
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'experiments' AND column_name = 'started_at') THEN
        ALTER TABLE experiments ADD COLUMN started_at TIMESTAMPTZ;
    END IF;
    
    -- Add completed_at column if missing
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'experiments' AND column_name = 'completed_at') THEN
        ALTER TABLE experiments ADD COLUMN completed_at TIMESTAMPTZ;
    END IF;
    
    -- Add results column if missing
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'experiments' AND column_name = 'results') THEN
        ALTER TABLE experiments ADD COLUMN results JSONB DEFAULT '{}';
    END IF;
END $$;

-- =============================================================================
-- 7. Reports Table Updates
-- =============================================================================
-- Ensure reports table has template column

DO $$
BEGIN
    -- Add template column if missing
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'reports' AND column_name = 'template') THEN
        ALTER TABLE reports ADD COLUMN template TEXT DEFAULT 'GENERAL';
    END IF;
    
    -- Add format column if missing
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'reports' AND column_name = 'format') THEN
        ALTER TABLE reports ADD COLUMN format TEXT DEFAULT 'pdf';
    END IF;
    
    -- Add experiment_id column if missing
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'reports' AND column_name = 'experiment_id') THEN
        ALTER TABLE reports ADD COLUMN experiment_id TEXT;
    END IF;
    
    -- Add content column if missing
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'reports' AND column_name = 'content') THEN
        ALTER TABLE reports ADD COLUMN content JSONB DEFAULT '{}';
    END IF;
END $$;

-- =============================================================================
-- COMPLETION MESSAGE
-- =============================================================================
DO $$
BEGIN
    RAISE NOTICE 'V1 migrations completed successfully!';
    RAISE NOTICE 'Tables created/updated: model_signals, notifications, notification_preferences, audit_log, data_processing_records';
    RAISE NOTICE 'Columns added: experiments (proposed_by, started_at, completed_at, results), reports (template, format, experiment_id, content)';
END $$;
