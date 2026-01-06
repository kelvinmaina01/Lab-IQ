-- Migration: Event System Tables
-- Description: Tables for event logging and workflow automation rules
-- Date: 2025-12-26

-- ============================================
-- 1. EVENT LOG TABLE (Audit Trail)
-- ============================================

CREATE TABLE IF NOT EXISTS public.event_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_type TEXT NOT NULL,
    payload JSONB NOT NULL DEFAULT '{}'::jsonb,
    source TEXT,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    processed BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_event_log_type ON public.event_log(event_type);
CREATE INDEX IF NOT EXISTS idx_event_log_created ON public.event_log(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_event_log_processed ON public.event_log(processed) WHERE NOT processed;
CREATE INDEX IF NOT EXISTS idx_event_log_user ON public.event_log(user_id);

-- Enable RLS
ALTER TABLE public.event_log ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own events" ON public.event_log
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can insert their own events" ON public.event_log
    FOR INSERT WITH CHECK (user_id = auth.uid() OR user_id IS NULL);

-- ============================================
-- 2. WORKFLOW RULES TABLE (Automation Config)
-- ============================================

CREATE TABLE IF NOT EXISTS public.workflow_rules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    trigger_event TEXT NOT NULL,
    conditions JSONB NOT NULL DEFAULT '[]'::jsonb,
    actions JSONB NOT NULL DEFAULT '[]'::jsonb,
    priority INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    is_system BOOLEAN DEFAULT FALSE,
    execution_count INTEGER DEFAULT 0,
    last_executed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_workflow_rules_trigger ON public.workflow_rules(trigger_event);
CREATE INDEX IF NOT EXISTS idx_workflow_rules_active ON public.workflow_rules(is_active) WHERE is_active;
CREATE INDEX IF NOT EXISTS idx_workflow_rules_user ON public.workflow_rules(user_id);

-- Enable RLS
ALTER TABLE public.workflow_rules ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view system rules" ON public.workflow_rules
    FOR SELECT USING (is_system = TRUE OR user_id = auth.uid());

CREATE POLICY "Users can manage their own rules" ON public.workflow_rules
    FOR ALL USING (user_id = auth.uid() AND is_system = FALSE);

-- ============================================
-- 3. RULE EXECUTION LOG (Tracking)
-- ============================================

CREATE TABLE IF NOT EXISTS public.rule_execution_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    rule_id UUID REFERENCES public.workflow_rules(id) ON DELETE CASCADE,
    event_id UUID,
    triggered BOOLEAN DEFAULT FALSE,
    conditions_met BOOLEAN DEFAULT FALSE,
    action_results JSONB DEFAULT '[]'::jsonb,
    duration_ms INTEGER,
    error TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_rule_execution_rule ON public.rule_execution_log(rule_id);
CREATE INDEX IF NOT EXISTS idx_rule_execution_created ON public.rule_execution_log(created_at DESC);

-- Enable RLS
ALTER TABLE public.rule_execution_log ENABLE ROW LEVEL SECURITY;

-- RLS Policy
CREATE POLICY "Users can view executions of their rules" ON public.rule_execution_log
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.workflow_rules r 
            WHERE r.id = rule_execution_log.rule_id 
            AND (r.user_id = auth.uid() OR r.is_system = TRUE)
        )
    );

-- ============================================
-- 4. TRIGGER: Update workflow_rules timestamp
-- ============================================

CREATE OR REPLACE FUNCTION update_workflow_rules_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_workflow_rules_timestamp
    BEFORE UPDATE ON public.workflow_rules
    FOR EACH ROW
    EXECUTE FUNCTION update_workflow_rules_updated_at();

-- ============================================
-- 5. COMMENTS
-- ============================================

COMMENT ON TABLE public.event_log IS 'Audit trail of all system events for debugging and compliance';
COMMENT ON TABLE public.workflow_rules IS 'User-defined and system automation rules';
COMMENT ON TABLE public.rule_execution_log IS 'History of rule executions for monitoring';
