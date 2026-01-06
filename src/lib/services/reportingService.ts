/**
 * Automated Reporting Service
 * Google/Meta-level intelligent report generation
 */

import { supabase } from "@/integrations/supabase/client";

export interface GeneratedReport {
  id: string;
  user_id: string;
  template_id?: string;
  report_type: string;
  title: string;
  summary?: string;
  sections: any[];
  visualizations?: any[];
  insights?: any[];
  recommendations?: any[];
  data_sources?: any;
  time_range?: any;
  metrics?: any;
  status: string;
  auto_generated: boolean;
  generated_at: string;
  generation_duration_ms?: number;
  file_path?: string;
  views_count: number;
}

export interface ReportInsight {
  id: string;
  report_id: string;
  insight_type: string;
  title: string;
  description: string;
  severity?: string;
  confidence_score?: number;
  actionable: boolean;
  action_items?: string[];
}

export interface ReportPreferences {
  id: string;
  user_id: string;
  auto_generate_enabled: boolean;
  report_frequency: string;
  preferred_templates?: string[];
  delivery_methods: any;
  notification_settings?: any;
}

/**
 * Generate device stream report
 */
export async function generateDeviceStreamReport(
  userId: string,
  streamId: string,
  hours: number = 24
): Promise<string> {
  const { data, error } = await supabase.rpc('generate_device_stream_report', {
    p_user_id: userId,
    p_stream_id: streamId,
    p_time_range_hours: hours
  });

  if (error) throw error;
  return data; // Returns report ID
}

/**
 * Generate dataset quality report
 */
export async function generateDatasetQualityReport(
  userId: string,
  datasetId: string
): Promise<string> {
  const { data, error } = await supabase.rpc('generate_dataset_quality_report', {
    p_user_id: userId,
    p_dataset_id: datasetId
  });

  if (error) throw error;
  return data;
}

/**
 * Generate daily executive summary
 */
export async function generateDailyExecutiveSummary(
  userId: string
): Promise<string> {
  const { data, error } = await supabase.rpc('generate_daily_executive_summary', {
    p_user_id: userId
  });

  if (error) throw error;
  return data;
}

/**
 * Get user reports
 */
export async function getUserReports(
  userId: string,
  limit: number = 10
): Promise<GeneratedReport[]> {
  const { data, error } = await supabase
    .from('generated_reports')
    .select('*')
    .eq('user_id', userId)
    .order('generated_at', { ascending: false })
    .limit(limit);

  if (error) throw error;
  return data || [];
}

/**
 * Get report with insights
 */
export async function getReportWithInsights(
  reportId: string,
  userId: string
): Promise<{ report: GeneratedReport; insights: ReportInsight[] }> {
  const { data, error } = await supabase.rpc('get_report_with_insights', {
    p_report_id: reportId,
    p_user_id: userId
  });

  if (error) throw error;
  return data;
}

/**
 * Get report insights
 */
export async function getReportInsights(reportId: string): Promise<ReportInsight[]> {
  const { data, error } = await supabase
    .from('report_insights')
    .select('*')
    .eq('report_id', reportId)
    .order('severity', { ascending: false });

  if (error) throw error;
  return data || [];
}

/**
 * Get user report preferences
 */
export async function getReportPreferences(userId: string): Promise<ReportPreferences | null> {
  const { data, error } = await supabase
    .from('report_preferences')
    .select('*')
    .eq('user_id', userId)
    .single();

  if (error && error.code !== 'PGRST116') throw error; // Ignore "not found" error
  return data;
}

/**
 * Update report preferences
 */
export async function updateReportPreferences(
  userId: string,
  preferences: Partial<ReportPreferences>
): Promise<void> {
  const { error } = await supabase
    .from('report_preferences')
    .upsert({
      user_id: userId,
      ...preferences,
      updated_at: new Date().toISOString()
    });

  if (error) throw error;
}

/**
 * Subscribe to real-time report generation
 */
export function subscribeToReports(
  userId: string,
  onReport: (report: GeneratedReport) => void
) {
  const channel = supabase
    .channel(`reports_${userId}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'generated_reports',
        filter: `user_id=eq.${userId}`
      },
      (payload) => {
        onReport(payload.new as GeneratedReport);
      }
    )
    .subscribe();

  return () => channel.unsubscribe();
}

/**
 * Export report as PDF (placeholder - implement with jsPDF or similar)
 */
export async function exportReportAsPDF(report: GeneratedReport): Promise<Blob> {
  // TODO: Implement PDF generation
  // For now, return HTML representation
  const htmlContent = generateReportHTML(report);
  return new Blob([htmlContent], { type: 'text/html' });
}

/**
 * Generate HTML representation of report
 */
function generateReportHTML(report: GeneratedReport): string {
  let html = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>${report.title}</title>
      <style>
        body { font-family: Arial, sans-serif; margin: 40px; }
        h1 { color: #333; }
        .section { margin: 20px 0; padding: 20px; border: 1px solid #ddd; border-radius: 8px; }
        .insight { background: #f0f9ff; padding: 15px; margin: 10px 0; border-left: 4px solid #0ea5e9; }
        .metric { display: inline-block; margin: 10px 20px 10px 0; }
        .metric-label { font-size: 12px; color: #666; }
        .metric-value { font-size: 24px; font-weight: bold; color: #333; }
      </style>
    </head>
    <body>
      <h1>${report.title}</h1>
      <p><em>${report.summary || ''}</em></p>
      <p><small>Generated: ${new Date(report.generated_at).toLocaleString()}</small></p>
      <hr>
  `;

  // Add sections
  if (report.sections && Array.isArray(report.sections)) {
    report.sections.forEach((section: any) => {
      html += `<div class="section">`;
      html += `<h2>${section.title || section.type}</h2>`;

      if (section.content) {
        if (typeof section.content === 'object') {
          html += '<div class="metrics">';
          Object.entries(section.content).forEach(([key, value]) => {
            html += `
              <div class="metric">
                <div class="metric-label">${key.replace(/_/g, ' ').toUpperCase()}</div>
                <div class="metric-value">${value}</div>
              </div>
            `;
          });
          html += '</div>';
        } else {
          html += `<p>${section.content}</p>`;
        }
      }

      html += `</div>`;
    });
  }

  // Add insights
  if (report.insights && Array.isArray(report.insights)) {
    html += '<h2>Insights</h2>';
    report.insights.forEach((insight: any) => {
      html += `
        <div class="insight">
          <h3>${insight.title}</h3>
          <p>${insight.description}</p>
          ${insight.severity ? `<span style="background: #fef2f2; padding: 4px 8px; border-radius: 4px; color: #dc2626;">${insight.severity}</span>` : ''}
        </div>
      `;
    });
  }

  html += `
    </body>
    </html>
  `;

  return html;
}

/**
 * Share report with users
 */
export async function shareReport(
  reportId: string,
  userIds: string[]
): Promise<void> {
  const { error } = await supabase
    .from('generated_reports')
    .update({
      shared_with: userIds
    })
    .eq('id', reportId);

  if (error) throw error;
}

/**
 * Delete report
 */
export async function deleteReport(reportId: string): Promise<void> {
  const { error } = await supabase
    .from('generated_reports')
    .delete()
    .eq('id', reportId);

  if (error) throw error;
}

/**
 * Get report templates
 */
export async function getReportTemplates(): Promise<any[]> {
  const { data, error } = await supabase
    .from('report_templates')
    .select('*')
    .eq('is_active', true)
    .order('priority', { ascending: false });

  if (error) throw error;
  return data || [];
}
