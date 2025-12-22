-- Device Stream Data Table - Stores incoming data from devices
-- Run this in Supabase SQL Editor AFTER running CREATE_DEVICE_STREAMS_TABLE.sql

CREATE TABLE IF NOT EXISTS device_stream_data (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  stream_id UUID NOT NULL REFERENCES device_streams(id) ON DELETE CASCADE,

  -- Data payload (flexible JSONB)
  payload JSONB NOT NULL,

  -- Metadata
  received_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),

  -- Optional: Extract common fields for indexing/querying
  timestamp TIMESTAMPTZ, -- Device timestamp (if provided)
  experiment_id VARCHAR(255), -- Optional experiment reference

  -- Quality metrics
  is_valid BOOLEAN DEFAULT true,
  validation_errors JSONB
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_device_data_stream_id ON device_stream_data(stream_id);
CREATE INDEX IF NOT EXISTS idx_device_data_created ON device_stream_data(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_device_data_timestamp ON device_stream_data(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_device_data_experiment ON device_stream_data(experiment_id);

-- GIN index for JSONB payload querying
CREATE INDEX IF NOT EXISTS idx_device_data_payload ON device_stream_data USING GIN (payload);

-- Row Level Security (RLS)
ALTER TABLE device_stream_data ENABLE ROW LEVEL SECURITY;

-- Policies
-- Users can only see data from their own device streams
CREATE POLICY "Users can view own device data"
ON device_stream_data FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM device_streams
    WHERE device_streams.id = device_stream_data.stream_id
    AND device_streams.user_id = auth.uid()
  )
);

-- Allow INSERT from public (devices send data)
-- But we'll validate stream_id exists
CREATE POLICY "Allow insert device data"
ON device_stream_data FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM device_streams
    WHERE device_streams.id = device_stream_data.stream_id
  )
);

-- Users can delete their own device data
CREATE POLICY "Users can delete own device data"
ON device_stream_data FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM device_streams
    WHERE device_streams.id = device_stream_data.stream_id
    AND device_streams.user_id = auth.uid()
  )
);

-- Function to update device_streams counters when new data arrives
CREATE OR REPLACE FUNCTION update_device_stream_counters()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE device_streams
  SET
    data_points_count = data_points_count + 1,
    last_data_received = NOW(),
    status = 'active'
  WHERE id = NEW.stream_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to call the function
DROP TRIGGER IF EXISTS device_stream_data_counter_trigger ON device_stream_data;
CREATE TRIGGER device_stream_data_counter_trigger
AFTER INSERT ON device_stream_data
FOR EACH ROW
EXECUTE FUNCTION update_device_stream_counters();

-- Function to clean up old data (optional - for data retention)
CREATE OR REPLACE FUNCTION cleanup_old_device_data(days_to_keep INT DEFAULT 90)
RETURNS void AS $$
BEGIN
  DELETE FROM device_stream_data
  WHERE created_at < NOW() - INTERVAL '1 day' * days_to_keep;
END;
$$ LANGUAGE plpgsql;

-- Grant permissions
GRANT ALL ON device_stream_data TO authenticated;
GRANT ALL ON device_stream_data TO anon; -- Allow public inserts (validated by policy)

-- Comments
COMMENT ON TABLE device_stream_data IS 'Stores incoming data from laboratory device streams';
COMMENT ON COLUMN device_stream_data.payload IS 'Flexible JSONB field containing device measurements';
COMMENT ON COLUMN device_stream_data.is_valid IS 'Whether data passed validation checks';

-- Example queries:

-- Get recent data for a stream:
-- SELECT * FROM device_stream_data
-- WHERE stream_id = 'your-stream-id'
-- ORDER BY created_at DESC
-- LIMIT 50;

-- Query specific fields in payload:
-- SELECT payload->>'temperature', payload->>'humidity'
-- FROM device_stream_data
-- WHERE stream_id = 'your-stream-id'
-- AND (payload->>'temperature')::numeric > 25;

-- Get data rate (points per minute):
-- SELECT COUNT(*) as points_per_minute
-- FROM device_stream_data
-- WHERE stream_id = 'your-stream-id'
-- AND created_at > NOW() - INTERVAL '1 minute';
