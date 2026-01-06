import { supabase } from '@/integrations/supabase/client';

export interface AuditLog {
    id: string;
    action: string;
    actor_id: string;
    resource_type: string;
    resource_id: string;
    details?: any;
    created_at: string;
}

class AuditService {
    private static instance: AuditService;

    private constructor() { }

    public static getInstance(): AuditService {
        if (!AuditService.instance) {
            AuditService.instance = new AuditService();
        }
        return AuditService.instance;
    }

    /**
     * Log an action (Compliance Requirement)
     */
    public async logAction(
        action: string,
        resourceType: string,
        resourceId: string,
        details?: any
    ): Promise<void> {
        const { data: { user } } = await supabase.auth.getUser();
        const actorId = user ? user.id : 'system';

        const logEntry: AuditLog = {
            id: crypto.randomUUID(),
            action,
            actor_id: actorId,
            resource_type: resourceType,
            resource_id: resourceId,
            details,
            created_at: new Date().toISOString()
        };

        // In production, write to 'audit_logs' table
        // For V1, we log to console and could persist to a secure store
        console.log('🔒 [Audit Log]', logEntry);
    }

    /**
     * Get logs for a resource
     */
    public async getResourceLogs(resourceType: string, resourceId: string): Promise<AuditLog[]> {
        // Mock retrieval
        return [];
    }

    /**
     * Get system-wide logs (Admin only)
     */
    public async getSystemLogs(): Promise<AuditLog[]> {
        return [
            {
                id: '1',
                action: 'system_startup',
                actor_id: 'system',
                resource_type: 'system',
                resource_id: 'root',
                created_at: new Date().toISOString()
            }
        ];
    }
}

export const auditService = AuditService.getInstance();
