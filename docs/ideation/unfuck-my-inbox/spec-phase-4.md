# Implementation Spec: Unfuck My Inbox - Phase 4

**PRD**: ./prd-phase-4.md
**Estimated Effort**: M (Medium)

## Technical Approach

Phase 4 completes the user experience with a dashboard, triage UI, and ongoing maintenance features. The dashboard aggregates data from executions and WorkOS Audit Logs. The triage UI provides a fast, keyboard-navigable interface for handling uncertain emails.

**Key principle**: WorkOS remains the source of truth for users. All database tables reference `workos_user_id` directly. UI uses Radix Themes for consistent styling.

Scheduled scans use Vercel Cron (or Inngest for more complex job orchestration). Email digests use WorkOS Email or a transactional email service.

Key technical decisions:
- Server Components for dashboard data fetching
- Client Components with optimistic updates for triage
- Radix Themes for all UI components
- Keyboard event handling with focus management for accessibility

## File Changes

### New Files

| File Path | Purpose |
|-----------|---------|
| `src/app/dashboard/page.tsx` | Main dashboard with stats |
| `src/app/dashboard/activity/page.tsx` | Activity log page |
| `src/app/dashboard/triage/page.tsx` | Batch triage UI |
| `src/app/dashboard/settings/page.tsx` | User settings |
| `src/app/dashboard/filters/page.tsx` | Filter management |
| `src/app/api/dashboard/stats/route.ts` | Dashboard statistics |
| `src/app/api/activity/route.ts` | Paginated activity log |
| `src/app/api/triage/route.ts` | Triage queue operations |
| `src/app/api/settings/route.ts` | User preferences CRUD |
| `src/app/api/cron/scan/route.ts` | Scheduled scan endpoint |
| `src/components/dashboard/stats-card.tsx` | Statistics display card |
| `src/components/dashboard/time-saved.tsx` | Time saved calculator |
| `src/components/dashboard/activity-feed.tsx` | Recent activity widget |
| `src/components/triage/triage-card.tsx` | Individual triage item |
| `src/components/triage/triage-queue.tsx` | Full triage interface |
| `src/components/triage/keyboard-hints.tsx` | Keyboard shortcut guide |
| `src/components/settings/aggressiveness-slider.tsx` | Aggressiveness control |
| `src/components/settings/protected-senders.tsx` | Sender protection list |
| `src/lib/metrics/time-saved.ts` | Time calculation logic |
| `src/lib/scheduling/cron.ts` | Scheduled job helpers |

### Modified Files

| File Path | Changes |
|-----------|---------|
| `src/lib/db/schema.ts` | Add scheduled_scans table |
| `src/lib/audit.ts` | Add query helpers for audit logs |
| `vercel.json` | Add cron configuration |

## Implementation Details

### Dashboard Statistics

**Overview**: Server component that fetches and displays key metrics.

```typescript
// src/app/dashboard/page.tsx
import { withAuth } from '@workos-inc/authkit-nextjs';
import { Box, Heading, Grid } from '@radix-ui/themes';
import { db } from '@/lib/db';
import { StatsCard } from '@/components/dashboard/stats-card';
import { TimeSaved } from '@/components/dashboard/time-saved';
import { ActivityFeed } from '@/components/dashboard/activity-feed';
import { eq, desc, sql, and } from 'drizzle-orm';

export default async function DashboardPage() {
  const { user } = await withAuth({ ensureSignedIn: true });

  // Aggregate stats from latest execution
  const stats = await db.select({
    totalLabeled: sql<number>`SUM(emails_labeled)`,
    totalTrashed: sql<number>`SUM(emails_trashed)`,
    totalFilters: sql<number>`SUM(filters_created)`,
  })
  .from(executions)
  .where(eq(executions.workosUserId, user.id));

  // Get triage queue count
  const triageCount = await db.select({ count: sql<number>`COUNT(*)` })
    .from(emailCategorizations)
    .where(
      and(
        eq(emailCategorizations.action, 'triage'),
        eq(emailCategorizations.executed, false)
      )
    );

  return (
    <Box p="6">
      <Heading size="8" mb="6">Dashboard</Heading>

      <Grid columns={{ initial: '1', md: '4' }} gap="4" mb="6">
        <StatsCard
          title="Emails Labeled"
          value={stats[0].totalLabeled ?? 0}
          icon="tag"
        />
        <StatsCard
          title="Emails Trashed"
          value={stats[0].totalTrashed ?? 0}
          icon="trash"
        />
        <StatsCard
          title="Filters Created"
          value={stats[0].totalFilters ?? 0}
          icon="filter"
        />
        <StatsCard
          title="Needs Triage"
          value={triageCount[0].count}
          icon="help"
          href="/dashboard/triage"
        />
      </Grid>

      <TimeSaved
        labeled={stats[0].totalLabeled ?? 0}
        trashed={stats[0].totalTrashed ?? 0}
        filters={stats[0].totalFilters ?? 0}
      />

      <Box mt="6">
        <ActivityFeed userId={user.id} limit={10} />
      </Box>
    </Box>
  );
}
```

### Time Saved Calculator

**Overview**: Calculate estimated time saved using action weights.

```typescript
// src/lib/metrics/time-saved.ts
const ACTION_WEIGHTS = {
  trash: 10, // seconds
  label: 20, // seconds
  archive: 15, // seconds
  filter: 300, // 5 minutes saved per filter over time
} as const;

export interface TimeSavedMetrics {
  totalSeconds: number;
  breakdown: {
    action: string;
    count: number;
    seconds: number;
  }[];
  formatted: string;
}

export function calculateTimeSaved(stats: {
  labeled: number;
  trashed: number;
  archived?: number;
  filters: number;
}): TimeSavedMetrics {
  const breakdown = [
    { action: 'Labeling', count: stats.labeled, seconds: stats.labeled * ACTION_WEIGHTS.label },
    { action: 'Trashing', count: stats.trashed, seconds: stats.trashed * ACTION_WEIGHTS.trash },
    { action: 'Filters', count: stats.filters, seconds: stats.filters * ACTION_WEIGHTS.filter },
  ];

  if (stats.archived) {
    breakdown.push({
      action: 'Archiving',
      count: stats.archived,
      seconds: stats.archived * ACTION_WEIGHTS.archive,
    });
  }

  const totalSeconds = breakdown.reduce((sum, b) => sum + b.seconds, 0);

  return {
    totalSeconds,
    breakdown,
    formatted: formatDuration(totalSeconds),
  };
}

function formatDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);

  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }
  return `${minutes} minutes`;
}
```

```typescript
// src/components/dashboard/time-saved.tsx
'use client';

import { calculateTimeSaved } from '@/lib/metrics/time-saved';
import { Box, Card, Flex, Grid, Heading, Text } from '@radix-ui/themes';
import { ClockIcon } from '@radix-ui/react-icons';

interface TimeSavedProps {
  labeled: number;
  trashed: number;
  filters: number;
}

export function TimeSaved({ labeled, trashed, filters }: TimeSavedProps) {
  const metrics = calculateTimeSaved({ labeled, trashed, filters });

  return (
    <Card size="3" style={{ background: 'var(--green-9)' }}>
      <Flex align="center" gap="3" mb="4">
        <ClockIcon width="32" height="32" color="white" />
        <Heading size="5" style={{ color: 'white' }}>Time Saved</Heading>
      </Flex>

      <Text size="8" weight="bold" style={{ color: 'white' }} mb="4">
        {metrics.formatted}
      </Text>

      <Grid columns="3" gap="4">
        {metrics.breakdown.map(b => (
          <Box key={b.action}>
            <Text size="2" weight="medium" style={{ color: 'rgba(255,255,255,0.9)' }}>
              {b.action}
            </Text>
            <Text size="2" style={{ color: 'rgba(255,255,255,0.8)' }}>
              {b.count.toLocaleString()} emails
            </Text>
          </Box>
        ))}
      </Grid>
    </Card>
  );
}
```

### Batch Triage UI

**Overview**: Keyboard-navigable interface for quick email decisions.

```typescript
// src/app/dashboard/triage/page.tsx
import { withAuth } from '@workos-inc/authkit-nextjs';
import { db } from '@/lib/db';
import { TriageQueue } from '@/components/triage/triage-queue';

export default async function TriagePage() {
  const { user } = await withAuth({ ensureSignedIn: true });

  const queue = await db.query.emailCategorizations.findMany({
    where: and(
      eq(emailCategorizations.action, 'triage'),
      eq(emailCategorizations.executed, false)
    ),
    limit: 50,
    orderBy: desc(emailCategorizations.confidence),
  });

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Triage Queue</h1>
      <TriageQueue initialItems={queue} />
    </div>
  );
}
```

```typescript
// src/components/triage/triage-queue.tsx
'use client';

import { useState, useEffect, useCallback } from 'react';
import { Box, Button, Flex, Text } from '@radix-ui/themes';
import { BookmarkIcon, TrashIcon, DoubleArrowRightIcon, StarIcon } from '@radix-ui/react-icons';
import { TriageCard } from './triage-card';
import { KeyboardHints } from './keyboard-hints';

interface TriageItem {
  id: string;
  gmailMessageId: string;
  confidence: number;
  suggestedAction: string;
  suggestedLabel?: string;
  emailMetadata: {
    from: string;
    subject: string;
    snippet: string;
    date: string;
  };
}

interface TriageQueueProps {
  initialItems: TriageItem[];
}

export function TriageQueue({ initialItems }: TriageQueueProps) {
  const [items, setItems] = useState(initialItems);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [processing, setProcessing] = useState(false);

  const currentItem = items[currentIndex];
  const remaining = items.length - currentIndex;

  const handleAction = useCallback(async (action: 'label' | 'trash' | 'skip' | 'keep') => {
    if (!currentItem || processing) return;

    setProcessing(true);

    try {
      await fetch('/api/triage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: currentItem.id,
          action,
          gmailMessageId: currentItem.gmailMessageId,
        }),
      });

      // Optimistic update - move to next item
      setCurrentIndex(prev => prev + 1);
    } finally {
      setProcessing(false);
    }
  }, [currentItem, processing]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement) return;

      switch (e.key.toLowerCase()) {
        case 'l':
          handleAction('label');
          break;
        case 't':
          handleAction('trash');
          break;
        case 's':
          handleAction('skip');
          break;
        case 'k':
          handleAction('keep');
          break;
        case 'j':
          setCurrentIndex(prev => Math.min(prev + 1, items.length - 1));
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleAction, items.length]);

  if (!currentItem) {
    return (
      <Box py="9" style={{ textAlign: 'center' }}>
        <Text size="5" weight="medium" mb="2">All caught up!</Text>
        <Text color="gray">No more emails to triage.</Text>
      </Box>
    );
  }

  return (
    <Box>
      <Flex justify="between" align="center" mb="4">
        <Text size="2" color="gray">{remaining} remaining</Text>
        <KeyboardHints />
      </Flex>

      <TriageCard
        item={currentItem}
        onAction={handleAction}
        disabled={processing}
      />

      <Flex justify="center" gap="3" mt="4">
        <Button
          size="3"
          onClick={() => handleAction('label')}
          disabled={processing}
        >
          <BookmarkIcon />
          Label (L)
        </Button>
        <Button
          size="3"
          color="red"
          onClick={() => handleAction('trash')}
          disabled={processing}
        >
          <TrashIcon />
          Trash (T)
        </Button>
        <Button
          size="3"
          variant="soft"
          color="gray"
          onClick={() => handleAction('skip')}
          disabled={processing}
        >
          <DoubleArrowRightIcon />
          Skip (S)
        </Button>
        <Button
          size="3"
          color="orange"
          onClick={() => handleAction('keep')}
          disabled={processing}
        >
          <StarIcon />
          Keep (K)
        </Button>
      </Flex>
    </Box>
  );
}
```

### Settings Page

**Overview**: User preferences and configuration.

```typescript
// src/app/dashboard/settings/page.tsx
import { withAuth } from '@workos-inc/authkit-nextjs';
import { Box, Card, Heading, Text } from '@radix-ui/themes';
import { UserProfile, UserSecurity } from '@workos-inc/widgets';
import { WorkOSWidgets } from '@workos-inc/widgets';
import { db } from '@/lib/db';
import { AggressivenessSlider } from '@/components/settings/aggressiveness-slider';
import { ProtectedSenders } from '@/components/settings/protected-senders';
import { ScheduleSettings } from '@/components/settings/schedule-settings';

export default async function SettingsPage() {
  const { user, accessToken } = await withAuth({ ensureSignedIn: true });

  const prefs = await db.query.userPreferences.findFirst({
    where: eq(userPreferences.workosUserId, user.id),
  });

  return (
    <Box p="6" style={{ maxWidth: '42rem', margin: '0 auto' }}>
      <Heading size="8" mb="6">Settings</Heading>

      {/* WorkOS Widgets for profile management */}
      <Card size="3" mb="4">
        <Heading size="5" mb="3">Profile</Heading>
        <WorkOSWidgets>
          <UserProfile accessToken={accessToken} />
        </WorkOSWidgets>
      </Card>

      <Card size="3" mb="4">
        <Heading size="5" mb="3">Security</Heading>
        <WorkOSWidgets>
          <UserSecurity accessToken={accessToken} />
        </WorkOSWidgets>
      </Card>

      {/* App-specific settings */}
      <Card size="3" mb="4">
        <Heading size="5" mb="3">Cleanup Aggressiveness</Heading>
        <AggressivenessSlider
          value={prefs?.aggressiveness ?? 'aggressive'}
        />
      </Card>

      <Card size="3" mb="4">
        <Heading size="5" mb="3">Protected Senders</Heading>
        <Text size="2" color="gray" mb="3">
          Emails from these addresses will never be trashed.
        </Text>
        <ProtectedSenders
          senders={(prefs?.protectedSenders as string[]) ?? []}
        />
      </Card>

      <Card size="3">
        <Heading size="5" mb="3">Scheduled Scans</Heading>
        <ScheduleSettings userId={user.id} />
      </Card>
    </Box>
  );
}
```

### Scheduled Scans (Vercel Cron)

**Overview**: Periodic inbox scans for ongoing maintenance.

```typescript
// src/app/api/cron/scan/route.ts
import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { workos } from '@/lib/workos';

export async function GET(request: Request) {
  // Verify cron secret
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Get users with scheduled scans due
  const dueScans = await db.query.scheduledScans.findMany({
    where: and(
      eq(scheduledScans.enabled, true),
      lte(scheduledScans.nextRunAt, new Date())
    ),
  });

  for (const scan of dueScans) {
    try {
      // Get Gmail token via Pipes
      const { accessToken, error } = await workos.pipes.getAccessToken({
        provider: 'google',
        userId: scan.userId,
      });

      if (error) {
        // Token expired, disable scheduled scan
        await db.update(scheduledScans)
          .set({ enabled: false, error: 'Token expired' })
          .where(eq(scheduledScans.id, scan.id));
        continue;
      }

      // Run incremental scan
      await runIncrementalScan(scan.userId, accessToken);

      // Update next run time
      const nextRun = calculateNextRun(scan.frequency);
      await db.update(scheduledScans)
        .set({ nextRunAt: nextRun, lastRunAt: new Date() })
        .where(eq(scheduledScans.id, scan.id));

    } catch (error) {
      console.error(`Scheduled scan failed for user ${scan.userId}:`, error);
    }
  }

  return NextResponse.json({ processed: dueScans.length });
}

function calculateNextRun(frequency: 'daily' | 'weekly' | 'monthly'): Date {
  const now = new Date();
  switch (frequency) {
    case 'daily':
      return new Date(now.getTime() + 24 * 60 * 60 * 1000);
    case 'weekly':
      return new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    case 'monthly':
      return new Date(now.setMonth(now.getMonth() + 1));
  }
}
```

```json
// vercel.json
{
  "crons": [
    {
      "path": "/api/cron/scan",
      "schedule": "0 6 * * *"
    }
  ]
}
```

## Data Model

### Schema Changes

```sql
-- Scheduled scans configuration
-- Note: Uses workos_user_id directly - no local users table
CREATE TABLE scheduled_scans (
  id TEXT PRIMARY KEY,
  workos_user_id TEXT NOT NULL UNIQUE,
  enabled BOOLEAN DEFAULT FALSE,
  frequency TEXT NOT NULL, -- daily | weekly | monthly
  next_run_at TIMESTAMP,
  last_run_at TIMESTAMP,
  error TEXT,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP DEFAULT NOW() NOT NULL
);

CREATE INDEX idx_scheduled_scans_next ON scheduled_scans(next_run_at) WHERE enabled = TRUE;
CREATE INDEX idx_scheduled_scans_user ON scheduled_scans(workos_user_id);
```

## API Design

### New Endpoints

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/dashboard/stats` | Dashboard statistics |
| `GET` | `/api/activity` | Paginated activity log |
| `GET` | `/api/triage` | Get triage queue |
| `POST` | `/api/triage` | Process triage action |
| `GET` | `/api/settings` | Get user preferences |
| `PUT` | `/api/settings` | Update user preferences |
| `GET` | `/api/cron/scan` | Scheduled scan (cron) |

### Request/Response Examples

```typescript
// GET /api/activity?page=0&limit=20
// Response
{
  "items": [
    {
      "id": "evt_123",
      "action": "email.trashed",
      "timestamp": "2026-02-05T10:30:00Z",
      "metadata": {
        "subject": "Newsletter #42",
        "from": "news@example.com"
      }
    }
  ],
  "hasMore": true,
  "total": 1523
}

// POST /api/triage
// Request
{
  "id": "cat_123",
  "action": "label",
  "gmailMessageId": "msg_xyz"
}

// Response
{
  "success": true,
  "remaining": 42
}

// PUT /api/settings
// Request
{
  "aggressiveness": "moderate",
  "protectedSenders": ["boss@company.com", "mom@family.com"],
  "scheduleFrequency": "weekly"
}

// Response
{
  "success": true
}
```

## Testing Requirements

### Unit Tests

| Test File | Coverage |
|-----------|----------|
| `src/lib/metrics/__tests__/time-saved.test.ts` | Time calculation |
| `src/components/triage/__tests__/triage-queue.test.tsx` | Triage component |

**Key test cases**:
- Time saved calculates correctly with all action types
- Keyboard shortcuts fire correct actions
- Triage queue handles empty state
- Settings save and load correctly

### Integration Tests

| Test File | Coverage |
|-----------|----------|
| `e2e/dashboard.spec.ts` | Dashboard flow |
| `e2e/triage.spec.ts` | Triage flow |

**Key scenarios**:
- Dashboard loads with correct stats
- Activity log paginates correctly
- Triage keyboard navigation works
- Settings persist across sessions

### Manual Testing

- [ ] Dashboard displays all statistics
- [ ] Time saved widget shows breakdown
- [ ] Activity feed updates after actions
- [ ] Triage keyboard shortcuts (L/T/S/K/J)
- [ ] Settings save correctly
- [ ] Scheduled scan runs on schedule

## Error Handling

| Error Scenario | Handling Strategy |
|----------------|-------------------|
| Activity log query fails | Show error message, retry button |
| Triage action fails | Keep item in queue, show error toast |
| Settings save fails | Revert to previous, show error |
| Cron job timeout | Log error, continue with next user |

## Validation Commands

```bash
# Type checking
bun run typecheck

# Linting
bun run lint

# Unit tests
bun run test

# E2E tests
bun run test:e2e

# Build
bun run build
```

## Rollout Considerations

- **Feature flag**: `ENABLE_SCHEDULED_SCANS` for cron functionality
- **Monitoring**: Track triage completion rate, scheduled scan success
- **Alerting**: Alert if scheduled scan failure rate > 10%
- **Rollback plan**: Disable cron endpoint, dashboard remains functional

## Open Items

- [ ] Determine email digest template and sending service
- [ ] Accessibility audit for triage keyboard navigation
