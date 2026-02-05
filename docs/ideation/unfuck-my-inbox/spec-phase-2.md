# Implementation Spec: Unfuck My Inbox - Phase 2

**PRD**: ./prd-phase-2.md
**Estimated Effort**: L (Large)

## Technical Approach

Phase 2 implements inbox analysis and taxonomy generation. The Gmail API client uses access tokens from Pipes to fetch email metadata in batches. An AI service (Claude API) analyzes patterns and suggests categories.

**Key principle**: WorkOS remains the source of truth for users. All database tables reference `workos_user_id` directly rather than a local users table.

The analysis pipeline:
1. Fetch email metadata (not full bodies for privacy)
2. Extract features: sender domain, subject patterns, existing labels, list-IDs
3. Cluster emails by sender and pattern
4. Use Claude to categorize clusters and propose taxonomy
5. Store results for user review

The taxonomy review UI uses Radix Themes components for consistent styling with Phase 1.

## File Changes

### New Files

| File Path | Purpose |
|-----------|---------|
| `src/lib/gmail/client.ts` | Gmail API client wrapper |
| `src/lib/gmail/types.ts` | Gmail API type definitions |
| `src/lib/gmail/fetch.ts` | Email fetching with pagination |
| `src/lib/analysis/categorize.ts` | AI categorization logic |
| `src/lib/analysis/taxonomy.ts` | Taxonomy generation |
| `src/lib/analysis/types.ts` | Analysis type definitions |
| `src/lib/db/schema-phase2.ts` | Additional schema for scans |
| `src/app/dashboard/scan/page.tsx` | Scan initiation page |
| `src/app/dashboard/taxonomy/page.tsx` | Taxonomy review page |
| `src/app/api/scan/start/route.ts` | Start scan endpoint |
| `src/app/api/scan/status/route.ts` | Scan status endpoint |
| `src/app/api/scan/cancel/route.ts` | Cancel scan endpoint |
| `src/app/api/taxonomy/route.ts` | Get/update taxonomy |
| `src/app/api/taxonomy/approve/route.ts` | Approve taxonomy |
| `src/components/scan-progress.tsx` | Real-time scan progress |
| `src/components/taxonomy-tree.tsx` | Editable taxonomy tree |
| `src/components/email-preview.tsx` | Sample email display |

### Modified Files

| File Path | Changes |
|-----------|---------|
| `src/lib/db/schema.ts` | Add scan and categorization tables |
| `src/app/dashboard/page.tsx` | Add scan status and CTA |

## Implementation Details

### Gmail API Client

**Overview**: Type-safe Gmail API wrapper with rate limiting and pagination.

```typescript
// src/lib/gmail/client.ts
import { google } from 'googleapis';

export function createGmailClient(accessToken: string) {
  const auth = new google.auth.OAuth2();
  auth.setCredentials({ access_token: accessToken });

  return google.gmail({ version: 'v1', auth });
}

export async function* fetchEmailsIterator(
  gmail: ReturnType<typeof google.gmail>,
  options: { maxResults?: number; query?: string } = {}
) {
  let pageToken: string | undefined;
  const maxResults = options.maxResults ?? 100;

  do {
    const response = await gmail.users.messages.list({
      userId: 'me',
      maxResults,
      pageToken,
      q: options.query,
    });

    const messages = response.data.messages ?? [];

    for (const message of messages) {
      const full = await gmail.users.messages.get({
        userId: 'me',
        id: message.id!,
        format: 'metadata',
        metadataHeaders: ['From', 'To', 'Subject', 'Date', 'List-Id', 'List-Unsubscribe'],
      });

      yield full.data;
    }

    pageToken = response.data.nextPageToken ?? undefined;
  } while (pageToken);
}
```

```typescript
// src/lib/gmail/types.ts
export interface EmailMetadata {
  id: string;
  threadId: string;
  from: string;
  to: string;
  subject: string;
  date: Date;
  snippet: string;
  labelIds: string[];
  listId?: string;
  hasListUnsubscribe: boolean;
  sizeEstimate: number;
}

export interface GmailLabel {
  id: string;
  name: string;
  type: 'system' | 'user';
}
```

**Key decisions**:
- Use metadata format, not full content (privacy + speed)
- Generator pattern for memory-efficient pagination
- Extract List-Id header for newsletter detection

**Implementation steps**:
1. Install googleapis package
2. Create client factory with token injection
3. Implement paginated fetcher with rate limiting
4. Parse headers into EmailMetadata structure

### Email Analysis Pipeline

**Overview**: Process emails through clustering and AI categorization.

```typescript
// src/lib/analysis/categorize.ts
import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic();

interface EmailCluster {
  id: string;
  senderDomain: string;
  subjectPattern: string;
  count: number;
  samples: EmailMetadata[];
  isNewsletter: boolean;
  isAutomated: boolean;
}

export async function categorizeCluster(cluster: EmailCluster): Promise<{
  category: string;
  subcategory?: string;
  action: 'label' | 'trash' | 'archive' | 'triage';
  confidence: number;
  reasoning: string;
}> {
  const prompt = `Analyze this email cluster and suggest categorization:

Sender Domain: ${cluster.senderDomain}
Email Count: ${cluster.count}
Is Newsletter: ${cluster.isNewsletter}
Is Automated: ${cluster.isAutomated}

Sample Subjects:
${cluster.samples.slice(0, 5).map(e => `- ${e.subject}`).join('\n')}

Respond with JSON:
{
  "category": "top-level category name",
  "subcategory": "optional subcategory",
  "action": "label" | "trash" | "archive" | "triage",
  "confidence": 0.0-1.0,
  "reasoning": "brief explanation"
}`;

  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 500,
    messages: [{ role: 'user', content: prompt }],
  });

  const text = response.content[0].type === 'text' ? response.content[0].text : '';
  return JSON.parse(text);
}
```

```typescript
// src/lib/analysis/taxonomy.ts
interface TaxonomyNode {
  id: string;
  name: string;
  children: TaxonomyNode[];
  emailCount: number;
  action: 'label' | 'trash' | 'archive';
  clusters: string[]; // cluster IDs
}

export function buildTaxonomy(
  categorizations: Array<{ clusterId: string; category: string; subcategory?: string; action: string }>
): TaxonomyNode[] {
  const tree = new Map<string, TaxonomyNode>();

  for (const cat of categorizations) {
    if (!tree.has(cat.category)) {
      tree.set(cat.category, {
        id: crypto.randomUUID(),
        name: cat.category,
        children: [],
        emailCount: 0,
        action: cat.action as any,
        clusters: [],
      });
    }

    const parent = tree.get(cat.category)!;
    parent.clusters.push(cat.clusterId);

    if (cat.subcategory) {
      let child = parent.children.find(c => c.name === cat.subcategory);
      if (!child) {
        child = {
          id: crypto.randomUUID(),
          name: cat.subcategory,
          children: [],
          emailCount: 0,
          action: cat.action as any,
          clusters: [],
        };
        parent.children.push(child);
      }
      child.clusters.push(cat.clusterId);
    }
  }

  return Array.from(tree.values());
}
```

**Key decisions**:
- Cluster by sender domain first, then refine
- Use Claude Sonnet for cost efficiency
- Batch clusters to reduce API calls
- Store confidence for triage queue threshold

**Implementation steps**:
1. Implement email clustering algorithm
2. Create Claude categorization prompts
3. Build taxonomy tree from categorizations
4. Calculate email counts per node

### Database Schema Additions

```typescript
// src/lib/db/schema.ts (additions)
// Note: All tables use workos_user_id directly - no local users table

export const scans = pgTable('scans', {
  id: text('id').primaryKey(),
  workosUserId: text('workos_user_id').notNull(), // Direct WorkOS user ID reference
  status: text('status').notNull(), // pending | running | completed | cancelled | failed
  totalEmails: integer('total_emails'),
  processedEmails: integer('processed_emails').default(0),
  startedAt: timestamp('started_at'),
  completedAt: timestamp('completed_at'),
  error: text('error'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const emailClusters = pgTable('email_clusters', {
  id: text('id').primaryKey(),
  scanId: text('scan_id').references(() => scans.id).notNull(),
  senderDomain: text('sender_domain').notNull(),
  subjectPattern: text('subject_pattern'),
  emailCount: integer('email_count').notNull(),
  isNewsletter: boolean('is_newsletter').default(false),
  isAutomated: boolean('is_automated').default(false),
  samples: jsonb('samples'), // EmailMetadata[]
  category: text('category'),
  subcategory: text('subcategory'),
  action: text('action'), // label | trash | archive | triage
  confidence: real('confidence'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const taxonomies = pgTable('taxonomies', {
  id: text('id').primaryKey(),
  workosUserId: text('workos_user_id').notNull(), // Direct WorkOS user ID reference
  scanId: text('scan_id').references(() => scans.id).notNull(),
  tree: jsonb('tree').notNull(), // TaxonomyNode[]
  status: text('status').notNull(), // draft | approved
  approvedAt: timestamp('approved_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const emailCategorizations = pgTable('email_categorizations', {
  id: text('id').primaryKey(),
  scanId: text('scan_id').references(() => scans.id).notNull(),
  gmailMessageId: text('gmail_message_id').notNull(),
  clusterId: text('cluster_id').references(() => emailClusters.id),
  taxonomyNodeId: text('taxonomy_node_id'),
  action: text('action').notNull(), // label | trash | archive | triage
  confidence: real('confidence').notNull(),
  executed: boolean('executed').default(false),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

CREATE INDEX idx_scans_user ON scans(workos_user_id);
CREATE INDEX idx_clusters_scan ON email_clusters(scan_id);
CREATE INDEX idx_categorizations_scan ON email_categorizations(scan_id);
CREATE INDEX idx_categorizations_action ON email_categorizations(action);
```

### Taxonomy Review UI

**Overview**: Interactive tree editor with sample previews.

```typescript
// src/components/taxonomy-tree.tsx
'use client';

import { useState } from 'react';
import { Box, Text, IconButton, Flex, Badge } from '@radix-ui/themes';
import * as Accordion from '@radix-ui/react-accordion';
import { ChevronDownIcon, TrashIcon, ArchiveIcon, BookmarkIcon, Pencil1Icon } from '@radix-ui/react-icons';

interface TaxonomyTreeProps {
  tree: TaxonomyNode[];
  onUpdate: (tree: TaxonomyNode[]) => void;
  onSelectNode: (node: TaxonomyNode) => void;
}

export function TaxonomyTree({ tree, onUpdate, onSelectNode }: TaxonomyTreeProps) {
  const [editingId, setEditingId] = useState<string | null>(null);

  const actionIcon = (action: string) => {
    switch (action) {
      case 'trash': return <TrashIcon color="red" />;
      case 'archive': return <ArchiveIcon color="orange" />;
      default: return <BookmarkIcon color="blue" />;
    }
  };

  const handleRename = (nodeId: string, newName: string) => {
    const updateNode = (nodes: TaxonomyNode[]): TaxonomyNode[] =>
      nodes.map(n => ({
        ...n,
        name: n.id === nodeId ? newName : n.name,
        children: updateNode(n.children),
      }));

    onUpdate(updateNode(tree));
    setEditingId(null);
  };

  const handleDelete = (nodeId: string) => {
    const removeNode = (nodes: TaxonomyNode[]): TaxonomyNode[] =>
      nodes.filter(n => n.id !== nodeId).map(n => ({
        ...n,
        children: removeNode(n.children),
      }));

    onUpdate(removeNode(tree));
  };

  return (
    <Accordion.Root type="multiple" className="space-y-2">
      {tree.map(node => (
        <TaxonomyNodeItem
          key={node.id}
          node={node}
          depth={0}
          editingId={editingId}
          onEdit={setEditingId}
          onRename={handleRename}
          onDelete={handleDelete}
          onSelect={onSelectNode}
          actionIcon={actionIcon}
        />
      ))}
    </Accordion.Root>
  );
}
```

**Implementation steps**:
1. Create TaxonomyTree component with Radix Accordion
2. Implement inline editing for node names
3. Add delete/merge actions
4. Show action icons (trash/archive/label)
5. Display email count badges

### Scan Progress UI

```typescript
// src/components/scan-progress.tsx
'use client';

import { useEffect, useState } from 'react';
import { Box, Text, Flex, Progress } from '@radix-ui/themes';

interface ScanProgressProps {
  scanId: string;
}

export function ScanProgress({ scanId }: ScanProgressProps) {
  const [status, setStatus] = useState<{
    status: string;
    processed: number;
    total: number;
  } | null>(null);

  useEffect(() => {
    const interval = setInterval(async () => {
      const res = await fetch(`/api/scan/status?id=${scanId}`);
      const data = await res.json();
      setStatus(data);

      if (data.status === 'completed' || data.status === 'failed') {
        clearInterval(interval);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [scanId]);

  if (!status) return <div>Loading...</div>;

  const progress = status.total > 0
    ? (status.processed / status.total) * 100
    : 0;

  return (
    <Box>
      <Flex justify="between" mb="2">
        <Text size="2" color="gray">Scanning inbox...</Text>
        <Text size="2" color="gray">
          {status.processed.toLocaleString()} / {status.total.toLocaleString()}
        </Text>
      </Flex>
      <Progress value={progress} size="2" />
    </Box>
  );
}
```

## API Design

### New Endpoints

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/api/scan/start` | Initiate inbox scan |
| `GET` | `/api/scan/status` | Get scan progress |
| `POST` | `/api/scan/cancel` | Cancel running scan |
| `GET` | `/api/taxonomy` | Get proposed taxonomy |
| `PUT` | `/api/taxonomy` | Update taxonomy (user edits) |
| `POST` | `/api/taxonomy/approve` | Approve taxonomy for execution |

### Request/Response Examples

```typescript
// POST /api/scan/start
// Request
{ "fullScan": true }

// Response
{
  "scanId": "scan_abc123",
  "status": "running"
}

// GET /api/scan/status?id=scan_abc123
// Response
{
  "status": "running",
  "processed": 4523,
  "total": 12000,
  "clustersFound": 156
}

// GET /api/taxonomy?scanId=scan_abc123
// Response
{
  "id": "tax_xyz",
  "status": "draft",
  "tree": [
    {
      "id": "node_1",
      "name": "Work",
      "emailCount": 3420,
      "action": "label",
      "children": [
        { "id": "node_1a", "name": "Notifications", "emailCount": 890, "action": "archive" }
      ]
    },
    {
      "id": "node_2",
      "name": "Newsletters",
      "emailCount": 5600,
      "action": "trash",
      "children": []
    }
  ]
}

// POST /api/taxonomy/approve
// Request
{ "taxonomyId": "tax_xyz" }

// Response
{ "success": true, "readyForExecution": true }
```

## Testing Requirements

### Unit Tests

| Test File | Coverage |
|-----------|----------|
| `src/lib/gmail/__tests__/client.test.ts` | Gmail client functions |
| `src/lib/analysis/__tests__/categorize.test.ts` | Categorization logic |
| `src/lib/analysis/__tests__/taxonomy.test.ts` | Taxonomy building |

**Key test cases**:
- Email clustering groups by sender domain
- Newsletter detection identifies List-Id headers
- Taxonomy tree builds correctly from flat categorizations
- Confidence scores filter triage candidates

### Integration Tests

| Test File | Coverage |
|-----------|----------|
| `e2e/scan.spec.ts` | Full scan flow |

**Key scenarios**:
- Scan completes and produces taxonomy
- User can edit taxonomy nodes
- Approval transitions to execution-ready state

### Manual Testing

- [ ] Scan initiates and shows progress
- [ ] Progress updates in real-time
- [ ] Taxonomy tree renders all categories
- [ ] Inline editing works
- [ ] Sample emails display correctly
- [ ] Approval button transitions state

## Error Handling

| Error Scenario | Handling Strategy |
|----------------|-------------------|
| Gmail API rate limit | Exponential backoff with max 5 retries |
| Claude API error | Retry 3x, then mark cluster for manual review |
| Token expired mid-scan | Pause scan, prompt re-auth, resume |
| Scan cancelled | Mark status, cleanup partial data |

## Validation Commands

```bash
# Type checking
bun run typecheck

# Linting
bun run lint

# Unit tests
bun run test

# Run specific test
bun run test src/lib/analysis

# Build
bun run build
```

## Rollout Considerations

- **Feature flag**: `ENABLE_AI_CATEGORIZATION` to disable Claude calls in dev
- **Monitoring**: Track scan duration, cluster count, categorization accuracy
- **Alerting**: Alert if scan failure rate > 5%
- **Rollback plan**: Disable scan endpoint, preserve existing data

## Open Items

- [ ] Determine Claude model (Sonnet vs Haiku) based on cost analysis
- [ ] Set confidence threshold for triage queue (0.7 suggested)
