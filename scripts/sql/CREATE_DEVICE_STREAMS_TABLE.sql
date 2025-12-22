-- Device Streams Table for Live Device Connections
-- This table stores configuration for real-time data ingestion from laboratory devices

CREATE TABLE IF NOT EXISTS device_streams (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Stream Configuration
  name VARCHAR(255) NOT NULL,
  stream_type VARCHAR(50) NOT NULL, -- 'mqtt', 'webhook', 'token_auth', 'edge_gateway'
  status VARCHAR(20) DEFAULT 'inactive', -- 'active', 'inactive', 'error'

  -- Connection Details (stored as JSONB for flexibility)
  connection_config JSONB DEFAULT '{}',

  -- Metadata
  last_data_received TIMESTAMPTZ,
  data_points_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Constraints
  CONSTRAINT valid_stream_type CHECK (stream_type IN ('mqtt', 'webhook', 'token_auth', 'edge_gateway')),
  CONSTRAINT valid_status CHECK (status IN ('active', 'inactive', 'error'))
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_device_streams_user_id ON device_streams(user_id);
CREATE INDEX IF NOT EXISTS idx_device_streams_status ON device_streams(status);
CREATE INDEX IF NOT EXISTS idx_device_streams_created ON device_streams(created_at DESC);

-- Row Level Security (RLS)
ALTER TABLE device_streams ENABLE ROW LEVEL SECURITY;

-- Policies
-- Users can only see their own device streams
CREATE POLICY "Users can view own device streams"
ON device_streams FOR SELECT
USING (auth.uid() = user_id);

-- Users can insert their own device streams
CREATE POLICY "Users can create own device streams"
ON device_streams FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can update their own device streams
CREATE POLICY "Users can update own device streams"
ON device_streams FOR UPDATE
USING (auth.uid() = user_id);

-- Users can delete their own device streams
CREATE POLICY "Users can delete own device streams"
ON device_streams FOR DELETE
USING (auth.uid() = user_id);

-- Function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_device_streams_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to call the function
DROP TRIGGER IF EXISTS device_streams_updated_at_trigger ON device_streams;
CREATE TRIGGER device_streams_updated_at_trigger
BEFORE UPDATE ON device_streams
FOR EACH ROW
EXECUTE FUNCTION update_device_streams_updated_at();

-- Grant necessary permissions
GRANT ALL ON device_streams TO authenticated;
GRANT USAGE ON SCHEMA public TO authenticated;

-- Comments for documentation
COMMENT ON TABLE device_streams IS 'Stores configuration for live laboratory device data streams';
COMMENT ON COLUMN device_streams.stream_type IS 'Type of connection: mqtt, webhook, token_auth, or edge_gateway';
COMMENT ON COLUMN device_streams.connection_config IS 'Flexible JSONB field for storing connection-specific configuration';
COMMENT ON COLUMN device_streams.status IS 'Current status of the device stream';

-- Example connection_config structures for different stream types:
/*
MQTT:
{
  "broker_url": "mqtt://broker.example.com:1883",
  "topic": "lab/device1/data",
  "username": "device_user",
  "password_encrypted": "...",
  "qos": 1
}

Webhook:
{
  "endpoint_url": "https://api.lab-iq.com/webhooks/abc123",
  "secret_key": "...",
  "retry_policy": {
    "max_retries": 3,
    "backoff": "exponential"
  }
}

Token Auth:
{
  "api_token": "...",
  "token_type": "Bearer",
  "refresh_url": "https://device.example.com/refresh"
}

Edge Gateway:
{
  "gateway_id": "gateway-001",
  "protocol": "modbus",
  "polling_interval": 30
}
*/
