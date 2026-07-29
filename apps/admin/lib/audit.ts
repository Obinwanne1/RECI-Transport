import { createAdminClient } from '@/lib/supabase/admin'

interface AuditParams {
  adminId: string
  adminEmail: string
  action: string
  resource?: string
  resourceId?: string
  details?: Record<string, unknown>
}

// Fire-and-forget — never throw, never block the response
export async function logAudit(params: AuditParams): Promise<void> {
  try {
    const admin = createAdminClient()
    await admin.from('admin_audit_log').insert({
      admin_id: params.adminId,
      admin_email: params.adminEmail,
      action: params.action,
      resource: params.resource ?? null,
      resource_id: params.resourceId ?? null,
      details: params.details ?? null,
    })
  } catch {
    // Audit failure must never break the primary action
  }
}
