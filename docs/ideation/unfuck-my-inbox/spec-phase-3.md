# Implementation Spec: Unfuck My Inbox - Phase 3

**PRD**: ./prd-phase-3.md
**Estimated Effort**: M (Medium)

## Technical Approach

Phase 3 executes the approved cleanup: creating Gmail labels, applying them to emails, trashing noise, and creating filters. All operations use Gmail API batch requests for efficiency.

**Key principle**: WorkOS remains the source of truth for users. All database tables reference `workos_user_id` directly. User preferences (including protected senders) are fetched using the WorkOS user ID.

Safety is paramount. We implement a protection layer that checks Gmail's importance signals, starred status, and user-defined protected senders before any destructive action. Every action is logged to WorkOS Audit Logs for compliance and undo capability.

The execution pipeline:
1. Create Gmail labels matching taxonomy
2. Apply labels to emails (batched)
3. Trash noise emails (with protection checks)
4. Create Gmail filters for ongoing maintenance
5. Log everything to Audit Logs

## File Changes

### New Files

| File Path | Purpose |
|-----------|---------|
| `src/lib/gmail/labels.ts` | Label creation and management |
| `src/lib/gmail/batch.ts` | Batch operations helper |
| `src/lib/gmail/filters.ts` | Filter creation |
| `src/lib/execution/executor.ts` | Cleanup execution orchestrator |
| `src/lib/execution/protection.ts` | Safety checks for destructive actions |
| `src/lib/execution/types.ts` | Execution type definitions |
| `src/app/dashboard/execute/page.tsx` | Execution page |
| `src/app/api/execute/start/route.ts` | Start execution endpoint |
| `src/app/api/execute/status/route.ts` | Execution status |
| `src/app/api/execute/pause/route.ts` | Pause execution |
| `src/app/api/execute/undo/route.ts` | Undo recent action |
| `src/components/execution-progress.tsx` | Real-time execution progress |
| `src/components/dry-run-preview.tsx` | Dry run results display |
| `src/components/filter-preview.tsx` | Filter creation preview |

### Modified Files

| File Path | Changes |
|-----------|---------|
| `src/lib/db/schema.ts` | Add execution and action log tables (using workos_user_id) |
| `src/lib/audit.ts` | Add execution-related audit events |

## Implementation Details

### Gmail Label Management

**Overview**: Create and manage Gmail labels matching the approved taxonomy.

```typescript
// src/lib/gmail/labels.ts
import { gmail_v1 } from 'googleapis';

export async function createLabel(
  gmail: gmail_v1.Gmail,
  name: string,
  options?: {
    backgroundColor?: string;
    textColor?: string;
  }
): Promise<gmail_v1.Schema$Label> {
  const response = await gmail.users.labels.create({
    userId: 'me',
    requestBody: {
      name,
      labelListVisibility: 'labelShow',
      messageListVisibility: 'show',
      color: options ? {
        backgroundColor: options.backgroundColor,
        textColor: options.textColor,
      } : undefined,
    },
  });

  return response.data;
}

export async function getOrCreateLabel(
  gmail: gmail_v1.Gmail,
  name: string
): Promise<string> {
  // List existing labels
  const { data } = await gmail.users.labels.list({ userId: 'me' });
  const existing = data.labels?.find(l => l.name === name);

  if (existing) {
    return existing.id!;
  }

  // Create new label
  const created = await createLabel(gmail, name);
  return created.id!;
}

export async function createTaxonomyLabels(
  gmail: gmail_v1.Gmail,
  taxonomy: TaxonomyNode[]
): Promise<Map<string, string>> {
  const labelMap = new Map<string, string>(); // node ID -> Gmail label ID

  const processNode = async (node: TaxonomyNode, parentName?: string) => {
    if (node.action !== 'label') return;

    const fullName = parentName ? `${parentName}/${node.name}` : node.name;
    const labelId = await getOrCreateLabel(gmail, fullName);
    labelMap.set(node.id, labelId);

    for (const child of node.children) {
      await processNode(child, fullName);
    }
  };

  for (const node of taxonomy) {
    await processNode(node);
  }

  return labelMap;
}
```

**Implementation steps**:
1. Implement label CRUD operations
2. Handle hierarchical naming (Parent/Child format)
3. Check for existing labels before creating
4. Build label ID mapping for execution

### Batch Operations

**Overview**: Efficient batch requests to Gmail API.

```typescript
// src/lib/gmail/batch.ts
import { gmail_v1 } from 'googleapis';

const BATCH_SIZE = 100; // Gmail API limit

export async function batchModifyMessages(
  gmail: gmail_v1.Gmail,
  messageIds: string[],
  modifications: {
    addLabelIds?: string[];
    removeLabelIds?: string[];
  }
): Promise<{ success: string[]; failed: string[] }> {
  const results = { success: [] as string[], failed: [] as string[] };

  // Process in batches
  for (let i = 0; i < messageIds.length; i += BATCH_SIZE) {
    const batch = messageIds.slice(i, i + BATCH_SIZE);

    try {
      await gmail.users.messages.batchModify({
        userId: 'me',
        requestBody: {
          ids: batch,
          ...modifications,
        },
      });
      results.success.push(...batch);
    } catch (error) {
      // On batch failure, try individual messages
      for (const id of batch) {
        try {
          await gmail.users.messages.modify({
            userId: 'me',
            id,
            requestBody: modifications,
          });
          results.success.push(id);
        } catch {
          results.failed.push(id);
        }
      }
    }
  }

  return results;
}

export async function batchTrashMessages(
  gmail: gmail_v1.Gmail,
  messageIds: string[]
): Promise<{ success: string[]; failed: string[] }> {
  const results = { success: [] as string[], failed: [] as string[] };

  // Gmail doesn't have batch trash, so we use batchModify with TRASH label
  for (let i = 0; i < messageIds.length; i += BATCH_SIZE) {
    const batch = messageIds.slice(i, i + BATCH_SIZE);

    try {
      await gmail.users.messages.batchModify({
        userId: 'me',
        requestBody: {
          ids: batch,
          addLabelIds: ['TRASH'],
          removeLabelIds: ['INBOX'],
        },
      });
      results.success.push(...batch);
    } catch (error) {
      for (const id of batch) {
        try {
          await gmail.users.messages.trash({ userId: 'me', id });
          results.success.push(id);
        } catch {
          results.failed.push(id);
        }
      }
    }
  }

  return results;
}
```

### Protection Layer

**Overview**: Safety checks to prevent trashing important emails.

```typescript
// src/lib/execution/protection.ts
import { gmail_v1 } from 'googleapis';

interface ProtectionResult {
  allowed: boolean;
  reason?: string;
}

const PROTECTED_LABELS = [
  'IMPORTANT',
  'STARRED',
  'CATEGORY_PERSONAL',
];

export async function checkProtection(
  gmail: gmail_v1.Gmail,
  messageId: string,
  protectedSenders: string[]
): Promise<ProtectionResult> {
  const { data: message } = await gmail.users.messages.get({
    userId: 'me',
    id: messageId,
    format: 'metadata',
    metadataHeaders: ['From'],
  });

  const labels = message.labelIds ?? [];

  // Check Gmail importance signals
  for (const protected of PROTECTED_LABELS) {
    if (labels.includes(protected)) {
      return {
        allowed: false,
        reason: `Email has ${protected} label`,
      };
    }
  }

  // Check protected senders
  const fromHeader = message.payload?.headers?.find(h => h.name === 'From')?.value ?? '';
  const senderEmail = extractEmail(fromHeader);

  if (protectedSenders.some(p => senderEmail.includes(p.toLowerCase()))) {
    return {
      allowed: false,
      reason: `Sender ${senderEmail} is in protected list`,
    };
  }

  return { allowed: true };
}

function extractEmail(fromHeader: string): string {
  const match = fromHeader.match(/<([^>]+)>/);
  return (match ? match[1] : fromHeader).toLowerCase();
}

export async function filterProtectedMessages(
  gmail: gmail_v1.Gmail,
  messageIds: string[],
  protectedSenders: string[]
): Promise<{
  allowed: string[];
  protected: Array<{ id: string; reason: string }>;
}> {
  const results = { allowed: [] as string[], protected: [] as Array<{ id: string; reason: string }> };

  for (const id of messageIds) {
    const check = await checkProtection(gmail, id, protectedSenders);
    if (check.allowed) {
      results.allowed.push(id);
    } else {
      results.protected.push({ id, reason: check.reason! });
    }
  }

  return results;
}
```

### Execution Orchestrator

**Overview**: Coordinates the full cleanup execution.

```typescript
// src/lib/execution/executor.ts
import { db } from '@/lib/db';
import { emitAuditEvent } from '@/lib/audit';

interface ExecutionOptions {
  dryRun: boolean;
  taxonomyId: string;
  userId: string;
  organizationId: string;
}

export async function executeCleanup(
  gmail: gmail_v1.Gmail,
  options: ExecutionOptions
): AsyncGenerator<ExecutionProgress> {
  const taxonomy = await db.query.taxonomies.findFirst({
    where: eq(taxonomies.id, options.taxonomyId),
  });

  const categorizations = await db.query.emailCategorizations.findMany({
    where: eq(emailCategorizations.scanId, taxonomy.scanId),
  });

  // Phase 1: Create labels
  yield { phase: 'labels', status: 'starting' };
  const labelMap = options.dryRun
    ? new Map()
    : await createTaxonomyLabels(gmail, taxonomy.tree);
  yield { phase: 'labels', status: 'complete', created: labelMap.size };

  // Phase 2: Apply labels
  const toLabel = categorizations.filter(c => c.action === 'label');
  yield { phase: 'labeling', status: 'starting', total: toLabel.length };

  let labeled = 0;
  for (const cat of toLabel) {
    if (!options.dryRun) {
      const labelId = labelMap.get(cat.taxonomyNodeId!);
      if (labelId) {
        await gmail.users.messages.modify({
          userId: 'me',
          id: cat.gmailMessageId,
          requestBody: { addLabelIds: [labelId] },
        });

        await emitAuditEvent('email.labeled', options.userId, options.organizationId, [
          { type: 'email', id: cat.gmailMessageId },
          { type: 'label', id: labelId },
        ]);
      }
    }
    labeled++;
    yield { phase: 'labeling', status: 'progress', processed: labeled, total: toLabel.length };
  }

  // Phase 3: Trash noise
  const toTrash = categorizations.filter(c => c.action === 'trash');
  yield { phase: 'trashing', status: 'starting', total: toTrash.length };

  const prefs = await db.query.userPreferences.findFirst({
    where: eq(userPreferences.workosUserId, options.userId),
  });
  const protectedSenders = (prefs?.protectedSenders as string[]) ?? [];

  // Filter out protected emails
  const { allowed, protected: protectedEmails } = await filterProtectedMessages(
    gmail,
    toTrash.map(c => c.gmailMessageId),
    protectedSenders
  );

  yield {
    phase: 'trashing',
    status: 'filtered',
    allowed: allowed.length,
    protected: protectedEmails.length
  };

  if (!options.dryRun) {
    const trashResult = await batchTrashMessages(gmail, allowed);

    for (const id of trashResult.success) {
      await emitAuditEvent('email.trashed', options.userId, options.organizationId, [
        { type: 'email', id },
      ]);
    }
  }

  yield { phase: 'trashing', status: 'complete', trashed: allowed.length };

  // Phase 4: Create filters
  yield { phase: 'filters', status: 'starting' };
  if (!options.dryRun) {
    const filtersCreated = await createFiltersFromTaxonomy(gmail, taxonomy.tree, labelMap);

    for (const filter of filtersCreated) {
      await emitAuditEvent('filter.created', options.userId, options.organizationId, [
        { type: 'filter', id: filter.id },
      ]);
    }

    yield { phase: 'filters', status: 'complete', created: filtersCreated.length };
  }

  yield { phase: 'complete', status: 'done' };
}
```

### Gmail Filter Creation

**Overview**: Create Gmail filters for ongoing maintenance.

```typescript
// src/lib/gmail/filters.ts
import { gmail_v1 } from 'googleapis';

interface FilterRule {
  from?: string;
  to?: string;
  subject?: string;
  hasWords?: string;
  listId?: string;
}

interface FilterAction {
  addLabelIds?: string[];
  removeLabelIds?: string[];
  archive?: boolean;
  trash?: boolean;
  markRead?: boolean;
}

export async function createFilter(
  gmail: gmail_v1.Gmail,
  rule: FilterRule,
  action: FilterAction
): Promise<gmail_v1.Schema$Filter> {
  const criteria: gmail_v1.Schema$FilterCriteria = {};

  if (rule.from) criteria.from = rule.from;
  if (rule.to) criteria.to = rule.to;
  if (rule.subject) criteria.subject = rule.subject;
  if (rule.hasWords) criteria.query = rule.hasWords;

  // List-Id requires query syntax
  if (rule.listId) {
    criteria.query = `list:${rule.listId}`;
  }

  const filterAction: gmail_v1.Schema$FilterAction = {};

  if (action.addLabelIds) filterAction.addLabelIds = action.addLabelIds;
  if (action.removeLabelIds) filterAction.removeLabelIds = action.removeLabelIds;

  // Archive = remove INBOX label
  if (action.archive) {
    filterAction.removeLabelIds = [...(filterAction.removeLabelIds ?? []), 'INBOX'];
  }

  // Trash = add TRASH label
  if (action.trash) {
    filterAction.addLabelIds = [...(filterAction.addLabelIds ?? []), 'TRASH'];
  }

  if (action.markRead) {
    filterAction.removeLabelIds = [...(filterAction.removeLabelIds ?? []), 'UNREAD'];
  }

  const response = await gmail.users.settings.filters.create({
    userId: 'me',
    requestBody: {
      criteria,
      action: filterAction,
    },
  });

  return response.data;
}

export async function createFiltersFromTaxonomy(
  gmail: gmail_v1.Gmail,
  taxonomy: TaxonomyNode[],
  labelMap: Map<string, string>
): Promise<gmail_v1.Schema$Filter[]> {
  const created: gmail_v1.Schema$Filter[] = [];

  // Get clusters for pattern extraction
  // ... implementation to extract sender domains and list-ids from clusters

  // Create filters based on learned patterns
  // For each high-confidence cluster, create a filter

  return created;
}
```

## Data Model

### Schema Changes

```sql
-- Execution runs
-- Note: All tables use workos_user_id directly - no local users table
CREATE TABLE executions (
  id TEXT PRIMARY KEY,
  workos_user_id TEXT NOT NULL,
  taxonomy_id TEXT REFERENCES taxonomies(id) NOT NULL,
  status TEXT NOT NULL, -- pending | running | paused | completed | failed
  dry_run BOOLEAN DEFAULT FALSE,
  emails_labeled INTEGER DEFAULT 0,
  emails_trashed INTEGER DEFAULT 0,
  emails_protected INTEGER DEFAULT 0,
  filters_created INTEGER DEFAULT 0,
  started_at TIMESTAMP,
  completed_at TIMESTAMP,
  error TEXT,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Individual action log (for undo capability)
CREATE TABLE action_log (
  id TEXT PRIMARY KEY,
  execution_id TEXT REFERENCES executions(id) NOT NULL,
  gmail_message_id TEXT NOT NULL,
  action TEXT NOT NULL, -- labeled | trashed | archived
  label_id TEXT,
  undone BOOLEAN DEFAULT FALSE,
  undone_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Created filters
CREATE TABLE created_filters (
  id TEXT PRIMARY KEY,
  execution_id TEXT REFERENCES executions(id) NOT NULL,
  gmail_filter_id TEXT NOT NULL,
  rule JSONB NOT NULL,
  action JSONB NOT NULL,
  deleted BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL
);

CREATE INDEX idx_executions_user ON executions(workos_user_id);
CREATE INDEX idx_action_log_execution ON action_log(execution_id);
CREATE INDEX idx_action_log_gmail ON action_log(gmail_message_id);
```

## API Design

### New Endpoints

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/api/execute/start` | Start cleanup execution |
| `GET` | `/api/execute/status` | Get execution progress |
| `POST` | `/api/execute/pause` | Pause running execution |
| `POST` | `/api/execute/resume` | Resume paused execution |
| `POST` | `/api/execute/undo` | Undo specific action |

### Request/Response Examples

```typescript
// POST /api/execute/start
// Request
{
  "taxonomyId": "tax_xyz",
  "dryRun": false
}

// Response
{
  "executionId": "exec_abc123",
  "status": "running"
}

// GET /api/execute/status?id=exec_abc123
// Response
{
  "status": "running",
  "phase": "labeling",
  "progress": {
    "labeled": 2340,
    "toLabel": 5600,
    "trashed": 0,
    "toTrash": 4200,
    "protected": 0,
    "filtersCreated": 0
  }
}

// POST /api/execute/undo
// Request
{
  "actionId": "action_123"
}

// Response
{
  "success": true,
  "action": "untrash",
  "gmailMessageId": "msg_xyz"
}
```

## Testing Requirements

### Unit Tests

| Test File | Coverage |
|-----------|----------|
| `src/lib/execution/__tests__/protection.test.ts` | Protection layer logic |
| `src/lib/gmail/__tests__/batch.test.ts` | Batch operations |
| `src/lib/gmail/__tests__/filters.test.ts` | Filter creation |

**Key test cases**:
- Protection blocks emails with IMPORTANT label
- Protection blocks starred emails
- Protected senders list is respected
- Batch operations handle partial failures
- Filter criteria builds correctly

### Integration Tests

| Test File | Coverage |
|-----------|----------|
| `e2e/execute.spec.ts` | Full execution flow |

**Key scenarios**:
- Dry run shows preview without changes
- Labels created match taxonomy
- Protected emails not trashed
- Filters created and active
- Undo restores trashed email

### Manual Testing

- [ ] Dry run completes and shows accurate preview
- [ ] Execution creates all labels
- [ ] Emails receive correct labels
- [ ] Important/starred emails not trashed
- [ ] Filters appear in Gmail settings
- [ ] Undo restores email from trash

## Error Handling

| Error Scenario | Handling Strategy |
|----------------|-------------------|
| Gmail API rate limit | Pause execution, resume after backoff |
| Token expired | Pause, prompt re-auth, resume |
| Batch operation partial failure | Log failures, continue with successful |
| Filter creation fails | Log error, continue without filter |

## Validation Commands

```bash
# Type checking
bun run typecheck

# Linting
bun run lint

# Unit tests
bun run test

# Build
bun run build
```

## Rollout Considerations

- **Feature flag**: `ENABLE_EXECUTION` to disable in staging
- **Monitoring**: Track execution duration, failure rate, emails processed
- **Alerting**: Alert if protection layer bypassed (should never happen)
- **Rollback plan**: Disable execution endpoint, undo via audit log

## Open Items

- [ ] Confirm Gmail API batch limits (100 per request)
- [ ] Test filter creation with various criteria combinations
