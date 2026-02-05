import { workos } from './workos';

type AuditAction =
  | 'user.signed_in'
  | 'user.signed_out'
  | 'gmail.connected'
  | 'gmail.disconnected'
  | 'scan.started'
  | 'scan.completed'
  | 'cleanup.executed';

interface AuditEventParams {
  action: AuditAction;
  actorId: string;
  actorName?: string;
  organizationId?: string;
  targets?: Array<{ type: string; id: string; name?: string }>;
  metadata?: Record<string, string | number | boolean>;
}

export async function emitAuditEvent({
  action,
  actorId,
  actorName,
  organizationId,
  targets = [],
  metadata,
}: AuditEventParams) {
  // Skip if no organization (personal account)
  if (!organizationId) return;

  try {
    await workos.auditLogs.createEvent(organizationId, {
      action,
      occurredAt: new Date(),
      actor: {
        type: 'user',
        id: actorId,
        name: actorName,
      },
      targets: targets.map((t) => ({
        type: t.type,
        id: t.id,
        name: t.name,
      })),
      context: {
        location: '0.0.0.0',
        userAgent: 'unfuck-my-inbox',
      },
      metadata,
    });
  } catch (error) {
    // Log error but don't fail the request
    console.error('Failed to emit audit event:', error);
  }
}
