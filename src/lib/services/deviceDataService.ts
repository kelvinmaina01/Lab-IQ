/**
 * Device Data Service
 * Complete integration: Device → Dataset → Experiments → ML → Workflows → AI
 *
 * This service handles all device data processing and integration across the platform
 */

import { supabase } from "@/integrations/supabase/client";
import { eventBus, EventTypes, DatasetUploadedPayload } from '@/lib/events';

export interface DeviceDataPoint {
  id: string;
  stream_id: string;
  payload: Record<string, any>;
  created_at: string;
  timestamp?: string;
  experiment_id?: string;
  is_valid: boolean;
  validation_errors?: any;
}

export interface DeviceStream {
  id: string;
  user_id: string;
  name: string;
  stream_type: string;
  status: string;
  connection_config: any;
  last_data_received?: string;
  data_points_count: number;
  metadata?: any;
}

export interface DatasetFromDevice {
  id: string;
  name: string;
  source_type: string;
  source_id: string;
  row_count: number;
  created_at: string;
}

export interface DeviceContext {
  active_streams: any[];
  total_active_streams: number;
  total_data_points_today: number;
  data_quality_summary: {
    valid_points: number;
    invalid_points: number;
    validation_rate: number;
  };
}

/**
 * Get all datasets created from device streams
 */
export async function getDeviceDatasets(userId: string): Promise<DatasetFromDevice[]> {
  const { data, error } = await supabase
    .from('datasets')
    .select('*')
    .eq('user_id', userId)
    .eq('source_type', 'device_stream')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
}

/**
 * Export device data as CSV
 */
export async function exportDeviceDataAsCSV(
  streamId: string,
  limit: number = 1000
): Promise<string> {
  const { data, error } = await supabase.rpc('export_device_data_as_csv', {
    p_stream_id: streamId,
    p_limit: limit
  });

  if (error) throw error;
  return data;
}

/**
 * Get aggregated device data for visualization
 */
export async function getAggregatedDeviceData(
  streamId: string,
  interval: string = '1 hour',
  startTime?: Date,
  endTime?: Date
) {
  const { data, error } = await supabase.rpc('aggregate_device_data', {
    p_stream_id: streamId,
    p_interval: interval,
    p_start_time: startTime?.toISOString() || new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    p_end_time: endTime?.toISOString() || new Date().toISOString()
  });

  if (error) throw error;
  return data;
}

/**
 * Get device context for AI assistant
 */
export async function getDeviceContextForAI(
  userId: string,
  limit: number = 100
): Promise<DeviceContext> {
  const { data, error } = await supabase.rpc('get_device_context_for_ai', {
    p_user_id: userId,
    p_limit: limit
  });

  if (error) throw error;
  return data;
}

/**
 * Prepare device data for ML model training
 */
export async function prepareMLTrainingData(
  streamId: string,
  targetColumn: string,
  featureColumns: string[],
  trainTestSplit: number = 0.8
) {
  const { data, error } = await supabase.rpc('prepare_ml_training_data', {
    p_stream_id: streamId,
    p_target_column: targetColumn,
    p_feature_columns: featureColumns,
    p_train_test_split: trainTestSplit
  });

  if (error) throw error;
  return data;
}

/**
 * Trigger a workflow from device data
 */
export async function triggerWorkflowFromDevice(
  streamId: string,
  workflowId: string,
  triggerCondition: string = 'always'
): Promise<string> {
  const { data, error } = await supabase.rpc('trigger_workflow_from_device_data', {
    p_stream_id: streamId,
    p_workflow_id: workflowId,
    p_trigger_condition: triggerCondition
  });

  if (error) throw error;
  return data; // Returns execution_id
}

/**
 * Get device stream statistics
 */
export async function getDeviceStreamStats(userId: string) {
  const { data, error } = await supabase
    .from('v_device_stream_stats')
    .select('*')
    .eq('user_id', userId);

  if (error) throw error;
  return data;
}

/**
 * Get enriched device data (with stream info)
 */
export async function getEnrichedDeviceData(
  streamId: string,
  limit: number = 100,
  validOnly: boolean = false
) {
  let query = supabase
    .from('v_device_data_enriched')
    .select('*')
    .eq('stream_id', streamId)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (validOnly) {
    query = query.eq('is_valid', true);
  }

  const { data, error } = await query;

  if (error) throw error;
  return data;
}

/**
 * Get experiments linked to device stream
 */
export async function getDeviceExperiments(streamId: string) {
  // First get all experiment IDs from device data
  const { data: expData, error: expError } = await supabase
    .from('device_stream_data')
    .select('experiment_id')
    .eq('stream_id', streamId)
    .not('experiment_id', 'is', null);

  if (expError) throw expError;

  const experimentIds = [...new Set(expData.map(d => d.experiment_id))];

  if (experimentIds.length === 0) return [];

  // Get full experiment details
  const { data: experiments, error: detailError } = await supabase
    .from('experiments')
    .select('*')
    .in('name', experimentIds);

  if (detailError) throw detailError;
  return experiments;
}

/**
 * Create dataset from device stream manually
 */
export async function createDatasetFromStream(
  streamId: string,
  datasetName?: string
): Promise<string> {
  const { data: stream } = await supabase
    .from('device_streams')
    .select('*')
    .eq('id', streamId)
    .single();

  if (!stream) throw new Error('Stream not found');

  // Get all data from stream
  const { data: streamData } = await supabase
    .from('device_stream_data')
    .select('*')
    .eq('stream_id', streamId)
    .eq('is_valid', true)
    .order('created_at', { ascending: false })
    .limit(10000);

  if (!streamData || streamData.length === 0) {
    throw new Error('No data available in stream');
  }

  // Export as CSV
  const csvData = await exportDeviceDataAsCSV(streamId, streamData.length);

  // Create blob and file
  const blob = new Blob([csvData], { type: 'text/csv' });
  const fileName = `${datasetName || stream.name}_${Date.now()}.csv`;
  const filePath = `${stream.user_id}/${fileName}`;

  // Upload to storage
  const { error: uploadError } = await supabase.storage
    .from('datasets')
    .upload(filePath, blob);

  if (uploadError) throw uploadError;

  // Get column info from first data point
  const firstPoint = streamData[0];
  const columns_info: Record<string, string> = {};
  Object.keys(firstPoint.payload).forEach(key => {
    const value = firstPoint.payload[key];
    if (typeof value === 'number') {
      columns_info[key] = 'numeric';
    } else if (typeof value === 'boolean') {
      columns_info[key] = 'boolean';
    } else {
      columns_info[key] = 'string';
    }
  });

  // Create dataset record
  const { data: dataset, error: insertError } = await supabase
    .from('datasets')
    .insert({
      user_id: stream.user_id,
      name: datasetName || `${stream.name} - ${new Date().toLocaleDateString()}`,
      description: `Dataset created from device stream: ${stream.name}`,
      file_name: fileName,
      file_path: filePath,
      row_count: streamData.length,
      column_count: Object.keys(columns_info).length,
      columns_info,
      file_size_mb: (blob.size / 1024 / 1024).toFixed(2),
      status: 'ready',
      source_type: 'device_stream',
      source_id: streamId
    })
    .select()
    .single();

  if (insertError) throw insertError;

  // Create metadata
  await supabase
    .from('dataset_metadata')
    .insert({
      dataset_id: dataset.id,
      quality_score: 95.0,
      completeness_score: 100.0,
      consistency_score: 98.0
    });

  // Emit DATASET_UPLOADED event for automation
  eventBus.emit<DatasetUploadedPayload>(
    EventTypes.DATASET_UPLOADED,
    {
      datasetId: dataset.id,
      name: datasetName || stream.name,
      rowCount: streamData.length,
      columnCount: Object.keys(columns_info).length,
      fileType: 'csv',
      domain: 'device_stream',
    },
    {
      source: 'deviceDataService',
      userId: stream.user_id,
      metadata: { streamId, sourceType: 'device_stream' },
    }
  );

  return dataset.id;
}

/**
 * Set validation rules for device stream
 */
export async function setStreamValidationRules(
  streamId: string,
  validationRules: Record<string, {
    min?: number;
    max?: number;
    required?: boolean;
    type?: string;
  }>
) {
  const { data: stream } = await supabase
    .from('device_streams')
    .select('connection_config')
    .eq('id', streamId)
    .single();

  if (!stream) throw new Error('Stream not found');

  const updatedConfig = {
    ...stream.connection_config,
    validation_rules: validationRules
  };

  const { error } = await supabase
    .from('device_streams')
    .update({ connection_config: updatedConfig })
    .eq('id', streamId);

  if (error) throw error;
}

/**
 * Get data quality metrics for stream
 */
export async function getDataQualityMetrics(streamId: string) {
  const { data, error } = await supabase
    .from('device_stream_data')
    .select('is_valid, validation_errors')
    .eq('stream_id', streamId);

  if (error) throw error;

  const totalPoints = data.length;
  const validPoints = data.filter(d => d.is_valid).length;
  const invalidPoints = totalPoints - validPoints;
  const validationRate = totalPoints > 0 ? (validPoints / totalPoints) * 100 : 0;

  // Group validation errors
  const errorTypes: Record<string, number> = {};
  data.forEach(point => {
    if (!point.is_valid && point.validation_errors) {
      point.validation_errors.forEach((err: any) => {
        const errorType = err.error || 'unknown';
        errorTypes[errorType] = (errorTypes[errorType] || 0) + 1;
      });
    }
  });

  return {
    totalPoints,
    validPoints,
    invalidPoints,
    validationRate: validationRate.toFixed(2),
    errorTypes,
    topErrors: Object.entries(errorTypes)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
  };
}

/**
 * Get device data for specific time range
 */
export async function getDeviceDataByTimeRange(
  streamId: string,
  startTime: Date,
  endTime: Date,
  validOnly: boolean = false
) {
  let query = supabase
    .from('device_stream_data')
    .select('*')
    .eq('stream_id', streamId)
    .gte('created_at', startTime.toISOString())
    .lte('created_at', endTime.toISOString())
    .order('created_at', { ascending: false });

  if (validOnly) {
    query = query.eq('is_valid', true);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data;
}

/**
 * Calculate real-time statistics for numeric fields
 */
export function calculateFieldStatistics(data: DeviceDataPoint[], fieldName: string) {
  const values = data
    .map(point => point.payload[fieldName])
    .filter(val => typeof val === 'number' && !isNaN(val)) as number[];

  if (values.length === 0) {
    return null;
  }

  const sorted = [...values].sort((a, b) => a - b);
  const sum = values.reduce((a, b) => a + b, 0);
  const mean = sum / values.length;
  const variance = values.reduce((acc, val) => acc + Math.pow(val - mean, 2), 0) / values.length;
  const stddev = Math.sqrt(variance);

  return {
    count: values.length,
    min: sorted[0],
    max: sorted[sorted.length - 1],
    mean: parseFloat(mean.toFixed(4)),
    median: sorted[Math.floor(sorted.length / 2)],
    stddev: parseFloat(stddev.toFixed(4)),
    q25: sorted[Math.floor(sorted.length * 0.25)],
    q75: sorted[Math.floor(sorted.length * 0.75)]
  };
}

/**
 * Detect anomalies in device data using simple statistical method
 */
export function detectAnomalies(
  data: DeviceDataPoint[],
  fieldName: string,
  threshold: number = 3 // Standard deviations
) {
  const stats = calculateFieldStatistics(data, fieldName);
  if (!stats) return [];

  const anomalies = data.filter(point => {
    const value = point.payload[fieldName];
    if (typeof value !== 'number') return false;

    const zScore = Math.abs((value - stats.mean) / stats.stddev);
    return zScore > threshold;
  });

  return anomalies.map(point => ({
    ...point,
    anomaly_score: Math.abs((point.payload[fieldName] - stats.mean) / stats.stddev)
  }));
}
