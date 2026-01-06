-- Notebook AI Tables Migration
-- Creates tables for storing notebook analyses and cells
-- Generated: 2026-01-03

-- ============================================================================
-- NOTEBOOKS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS notebooks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  dataset_id UUID REFERENCES datasets(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  analysis_metadata JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for fetching user's notebooks
CREATE INDEX IF NOT EXISTS idx_notebooks_user_id ON notebooks(user_id);
CREATE INDEX IF NOT EXISTS idx_notebooks_dataset_id ON notebooks(dataset_id);
CREATE INDEX IF NOT EXISTS idx_notebooks_created_at ON notebooks(created_at DESC);

-- ============================================================================
-- NOTEBOOK_CELLS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS notebook_cells (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  notebook_id UUID NOT NULL REFERENCES notebooks(id) ON DELETE CASCADE,
  cell_id TEXT NOT NULL, -- AI-generated cell ID (e.g., "cell_1")
  cell_type TEXT NOT NULL CHECK (cell_type IN ('prompt', 'reasoning', 'metric', 'visualization', 'table', 'insight', 'suggestion')),
  title TEXT NOT NULL,
  content JSONB NOT NULL,
  dependencies TEXT[] DEFAULT '{}', -- Array of cell_ids
  ui_hints JSONB NOT NULL,
  execution_order INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Ensure unique cell_id within notebook
  UNIQUE(notebook_id, cell_id)
);

-- Index for fetching cells by notebook
CREATE INDEX IF NOT EXISTS idx_notebook_cells_notebook_id ON notebook_cells(notebook_id);
CREATE INDEX IF NOT EXISTS idx_notebook_cells_type ON notebook_cells(cell_type);
CREATE INDEX IF NOT EXISTS idx_notebook_cells_order ON notebook_cells(notebook_id, execution_order);

-- ============================================================================
-- PINNED_INSIGHTS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS pinned_insights (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  notebook_id UUID NOT NULL REFERENCES notebooks(id) ON DELETE CASCADE,
  cell_id TEXT NOT NULL, -- References notebook_cells.cell_id
  title TEXT NOT NULL, -- User's final title (editable)
  description TEXT NOT NULL, -- User's final description (editable)
  insight_data JSONB NOT NULL, -- Full InsightCellContent
  tags TEXT[] DEFAULT '{}', -- Array of PinTag values
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- User can only pin same insight once
  UNIQUE(user_id, notebook_id, cell_id)
);

-- Index for fetching user's pinned insights
CREATE INDEX IF NOT EXISTS idx_pinned_insights_user_id ON pinned_insights(user_id);
CREATE INDEX IF NOT EXISTS idx_pinned_insights_created_at ON pinned_insights(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_pinned_insights_tags ON pinned_insights USING GIN(tags);

-- ============================================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================================

-- Enable RLS
ALTER TABLE notebooks ENABLE ROW LEVEL SECURITY;
ALTER TABLE notebook_cells ENABLE ROW LEVEL SECURITY;
ALTER TABLE pinned_insights ENABLE ROW LEVEL SECURITY;

-- Notebooks: Users can only access their own notebooks
DROP POLICY IF EXISTS notebooks_select_own ON notebooks;
CREATE POLICY notebooks_select_own ON notebooks
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS notebooks_insert_own ON notebooks;
CREATE POLICY notebooks_insert_own ON notebooks
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS notebooks_update_own ON notebooks;
CREATE POLICY notebooks_update_own ON notebooks
  FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS notebooks_delete_own ON notebooks;
CREATE POLICY notebooks_delete_own ON notebooks
  FOR DELETE USING (auth.uid() = user_id);

-- Notebook Cells: Users can access cells for their notebooks
DROP POLICY IF EXISTS notebook_cells_select_own ON notebook_cells;
CREATE POLICY notebook_cells_select_own ON notebook_cells
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM notebooks
      WHERE notebooks.id = notebook_cells.notebook_id
      AND notebooks.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS notebook_cells_insert_own ON notebook_cells;
CREATE POLICY notebook_cells_insert_own ON notebook_cells
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM notebooks
      WHERE notebooks.id = notebook_cells.notebook_id
      AND notebooks.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS notebook_cells_delete_own ON notebook_cells;
CREATE POLICY notebook_cells_delete_own ON notebook_cells
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM notebooks
      WHERE notebooks.id = notebook_cells.notebook_id
      AND notebooks.user_id = auth.uid()
    )
  );

-- Pinned Insights: Users can only access their own pins
DROP POLICY IF EXISTS pinned_insights_select_own ON pinned_insights;
CREATE POLICY pinned_insights_select_own ON pinned_insights
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS pinned_insights_insert_own ON pinned_insights;
CREATE POLICY pinned_insights_insert_own ON pinned_insights
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS pinned_insights_update_own ON pinned_insights;
CREATE POLICY pinned_insights_update_own ON pinned_insights
  FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS pinned_insights_delete_own ON pinned_insights;
CREATE POLICY pinned_insights_delete_own ON pinned_insights
  FOR DELETE USING (auth.uid() = user_id);

-- ============================================================================
-- UPDATED_AT TRIGGER
-- ============================================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_notebooks_updated_at ON notebooks;
CREATE TRIGGER update_notebooks_updated_at
  BEFORE UPDATE ON notebooks
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
