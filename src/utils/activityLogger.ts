import { supabase } from '@/integrations/supabase/client';

export class ActivityLogger {
  static async log(
    labId: string,
    actionType: string,
    description: string,
    metadata?: any
  ): Promise<void> {
    try {
      const { data: { user } } = await supabase.auth.getUser();

      await supabase.from('collaboration_activity').insert({
        lab_id: labId,
        user_id: user?.id || null,
        action_type: actionType,
        description,
        metadata: metadata || {},
        created_at: new Date().toISOString()
      });
    } catch (error) {
      console.error('Failed to log activity:', error);
    }
  }

  // Specific loggers for common actions
  static async logMessageSent(labId: string, channelName: string, userId: string) {
    const { data: { user } } = await supabase.auth.getUser();
    const userName = user?.email?.split('@')[0] || 'User';

    await this.log(
      labId,
      'message',
      `sent a message in #${channelName}`,
      { channelName, userId, userName }
    );
  }

  static async logDatasetUploaded(labId: string, datasetName: string) {
    const { data: { user } } = await supabase.auth.getUser();
    const userName = user?.email?.split('@')[0] || 'User';

    await this.log(
      labId,
      'dataset_uploaded',
      `uploaded dataset: ${datasetName}`,
      { datasetName, userName }
    );
  }

  static async logExperimentCreated(labId: string, experimentName: string) {
    const { data: { user } } = await supabase.auth.getUser();
    const userName = user?.email?.split('@')[0] || 'User';

    await this.log(
      labId,
      'experiment_created',
      `created experiment: ${experimentName}`,
      { experimentName, userName }
    );
  }

  static async logReportGenerated(labId: string, reportName: string) {
    const { data: { user } } = await supabase.auth.getUser();
    const userName = user?.email?.split('@')[0] || 'User';

    await this.log(
      labId,
      'report_generated',
      `generated report: ${reportName}`,
      { reportName, userName }
    );
  }

  static async logFileShared(labId: string, fileName: string, channelName: string) {
    const { data: { user } } = await supabase.auth.getUser();
    const userName = user?.email?.split('@')[0] || 'User';

    await this.log(
      labId,
      'file_upload',
      `shared file ${fileName} in #${channelName}`,
      { fileName, channelName, userName }
    );
  }

  static async logMemberInvited(labId: string, email: string) {
    const { data: { user } } = await supabase.auth.getUser();
    const userName = user?.email?.split('@')[0] || 'User';

    await this.log(
      labId,
      'invite',
      `invited ${email} to the lab`,
      { email, invitedBy: userName }
    );
  }

  static async logChannelCreated(labId: string, channelName: string) {
    const { data: { user } } = await supabase.auth.getUser();
    const userName = user?.email?.split('@')[0] || 'User';

    await this.log(
      labId,
      'channel_created',
      `created channel #${channelName}`,
      { channelName, userName }
    );
  }

  static async logInsightGenerated(labId: string, topic: string) {
    await this.log(
      labId,
      'insight_generated',
      `AI generated insights for: ${topic}`,
      { topic, source: 'LabAI' }
    );
  }

  static async logWorkflowStarted(labId: string, workflowName: string) {
    await this.log(
      labId,
      'workflow_started',
      `started workflow: ${workflowName}`,
      { workflowName }
    );
  }

  static async logWorkflowCompleted(labId: string, workflowName: string, success: boolean) {
    await this.log(
      labId,
      success ? 'workflow_success' : 'workflow_warning',
      `workflow ${workflowName} ${success ? 'completed successfully' : 'completed with warnings'}`,
      { workflowName, success }
    );
  }
}
