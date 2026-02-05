# Implementation Spec: Unfuck My Inbox - Phase 1

**PRD**: ./prd-phase-1.md
**Estimated Effort**: M (Medium)

## Technical Approach

Phase 1 establishes the application foundation using Next.js 14+ App Router with TypeScript. Authentication is handled entirely by WorkOS AuthKit using the `@workos-inc/authkit-nextjs` SDK, which provides middleware-based route protection and session management.

**Key simplification**: WorkOS is the single source of truth for user data and Gmail connections:
- **Users**: Managed by WorkOS AuthKit (no local users table)
- **Gmail connections**: Managed by WorkOS Pipes (no local connections table)
- **Local database**: Only stores app-specific data (preferences, scan results, etc.)

Gmail connectivity is managed through WorkOS Pipes, which handles OAuth token storage and refresh. The app retrieves access tokens server-side via `workos.pipes.getAccessToken()`.

UI uses WorkOS Widgets + Radix Themes for a polished, consistent look with minimal custom styling. WorkOS Audit Logs track all auth and connection events for compliance.

## File Changes

### New Files

| File Path | Purpose |
|-----------|---------|
| `package.json` | Project dependencies |
| `tsconfig.json` | TypeScript configuration |
| `next.config.ts` | Next.js configuration |
| `.env.local` | Environment variables (gitignored) |
| `.env.example` | Environment variable template |
| `drizzle.config.ts` | Drizzle ORM configuration |
| `src/app/layout.tsx` | Root layout with AuthKitProvider + Radix Theme |
| `src/app/page.tsx` | Landing page |
| `src/app/login/route.ts` | Initiate login endpoint |
| `src/app/callback/route.ts` | AuthKit callback handler |
| `src/app/dashboard/page.tsx` | Protected dashboard page |
| `src/app/dashboard/layout.tsx` | Dashboard layout |
| `src/app/dashboard/settings/page.tsx` | Settings with WorkOS Widgets |
| `src/app/api/gmail/status/route.ts` | Gmail connection status via Pipes |
| `src/app/api/gmail/token/route.ts` | Gmail access token retrieval |
| `src/components/header.tsx` | App header with user info |
| `src/components/gmail-connect.tsx` | Gmail connection UI |
| `src/lib/workos.ts` | WorkOS client initialization |
| `src/lib/db/index.ts` | Database client |
| `src/lib/db/schema.ts` | Drizzle schema definitions |
| `src/lib/audit.ts` | Audit log helper functions |
| `middleware.ts` | AuthKit middleware |

### Modified Files

None - this is a greenfield project.

## Implementation Details

### Project Setup

**Overview**: Initialize Next.js with App Router, TypeScript strict mode, and Radix Themes.

```bash
bunx create-next-app@latest unfuck-my-inbox --typescript --eslint --app --src-dir --no-tailwind
cd unfuck-my-inbox

# Core dependencies
bun add @workos-inc/authkit-nextjs @workos-inc/node @workos-inc/widgets
bun add @radix-ui/themes @tanstack/react-query
bun add drizzle-orm @neondatabase/serverless
bun add -d drizzle-kit @types/node
```

**Key decisions**:
- Bun for package management and speed
- Radix Themes for styling (required by WorkOS Widgets, provides complete design system)
- No Tailwind - Radix Themes handles all styling
- Drizzle ORM for type-safe database queries
- Neon for serverless PostgreSQL
- WorkOS as single source of truth for users and connections

### Radix Themes Setup

**Overview**: Configure Radix Themes as the styling foundation.

```typescript
// src/app/layout.tsx
import '@radix-ui/themes/styles.css';
import '@workos-inc/widgets/styles.css';
import { Theme } from '@radix-ui/themes';
import { AuthKitProvider } from '@workos-inc/authkit-nextjs';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const queryClient = new QueryClient();

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <AuthKitProvider>
          <QueryClientProvider client={queryClient}>
            <Theme accentColor="blue" grayColor="slate" radius="medium">
              {children}
            </Theme>
          </QueryClientProvider>
        </AuthKitProvider>
      </body>
    </html>
  );
}
```

**Key decisions**:
- Radix Themes provides complete component library (Button, Card, Text, etc.)
- QueryClient required for WorkOS Widgets
- Theme customization via props, not CSS

### AuthKit Integration

**Pattern to follow**: WorkOS AuthKit Next.js documentation

**Overview**: Implement hosted authentication flow with middleware-based route protection.

```typescript
// middleware.ts
import { authkitMiddleware } from '@workos-inc/authkit-nextjs';

export default authkitMiddleware();

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|api/health).*)',
  ],
};
```

```typescript
// src/app/dashboard/page.tsx
import { withAuth } from '@workos-inc/authkit-nextjs';
import { Box, Heading, Text, Card } from '@radix-ui/themes';
import { GmailConnect } from '@/components/gmail-connect';

export default async function DashboardPage() {
  const { user } = await withAuth({ ensureSignedIn: true });

  return (
    <Box p="6">
      <Heading size="8" mb="4">Welcome, {user.firstName}</Heading>
      <Card size="3">
        <GmailConnect userId={user.id} />
      </Card>
    </Box>
  );
}
```

**Implementation steps**:
1. Add environment variables to `.env.local`
2. Create middleware.ts with authkitMiddleware
3. Wrap layout with AuthKitProvider + Theme
4. Create login and callback routes
5. Implement protected dashboard with withAuth

### WorkOS Pipes Integration

**Overview**: Connect Gmail using Pipes and retrieve access tokens. Connection state is managed entirely by WorkOS.

```typescript
// src/lib/workos.ts
import { WorkOS } from '@workos-inc/node';

export const workos = new WorkOS(process.env.WORKOS_API_KEY!);
```

```typescript
// src/app/api/gmail/status/route.ts
import { NextResponse } from 'next/server';
import { withAuth } from '@workos-inc/authkit-nextjs';
import { workos } from '@/lib/workos';

export async function GET() {
  const { user } = await withAuth({ ensureSignedIn: true });

  // Check if user has a valid Gmail connection via Pipes
  const { accessToken, error } = await workos.pipes.getAccessToken({
    provider: 'google',
    userId: user.id,
  });

  return NextResponse.json({
    isConnected: !error && !!accessToken,
    error: error ?? null,
  });
}
```

```typescript
// src/app/api/gmail/token/route.ts
import { NextResponse } from 'next/server';
import { withAuth } from '@workos-inc/authkit-nextjs';
import { workos } from '@/lib/workos';

export async function GET() {
  const { user } = await withAuth({ ensureSignedIn: true });

  const { accessToken, error, missingScopes } = await workos.pipes.getAccessToken({
    provider: 'google',
    userId: user.id,
  });

  if (error) {
    return NextResponse.json({ error, missingScopes }, { status: 401 });
  }

  return NextResponse.json({ accessToken });
}
```

```typescript
// src/components/gmail-connect.tsx
'use client';

import { useState, useEffect } from 'react';
import { Button, Flex, Text, Callout } from '@radix-ui/themes';
import { CheckCircledIcon, CrossCircledIcon } from '@radix-ui/react-icons';

interface GmailConnectProps {
  userId: string;
}

export function GmailConnect({ userId }: GmailConnectProps) {
  const [status, setStatus] = useState<{ isConnected: boolean; error?: string } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/gmail/status')
      .then(res => res.json())
      .then(setStatus)
      .finally(() => setLoading(false));
  }, []);

  const handleConnect = () => {
    // Redirect to Pipes OAuth flow
    // The redirect URL is configured in WorkOS Dashboard
    window.location.href = `https://api.workos.com/pipes/authorize?provider=google&user_id=${userId}&redirect_uri=${encodeURIComponent(window.location.origin + '/dashboard')}&scope=${encodeURIComponent('https://www.googleapis.com/auth/gmail.readonly https://www.googleapis.com/auth/gmail.modify https://www.googleapis.com/auth/gmail.settings.basic')}`;
  };

  if (loading) {
    return <Text color="gray">Checking connection...</Text>;
  }

  if (status?.isConnected) {
    return (
      <Callout.Root color="green">
        <Callout.Icon>
          <CheckCircledIcon />
        </Callout.Icon>
        <Callout.Text>Gmail connected successfully</Callout.Text>
      </Callout.Root>
    );
  }

  return (
    <Flex direction="column" gap="3">
      {status?.error && (
        <Callout.Root color="red">
          <Callout.Icon>
            <CrossCircledIcon />
          </Callout.Icon>
          <Callout.Text>Connection error: {status.error}</Callout.Text>
        </Callout.Root>
      )}
      <Button size="3" onClick={handleConnect}>
        Connect Gmail
      </Button>
    </Flex>
  );
}
```

**Implementation steps**:
1. Configure Google provider in WorkOS Dashboard with required scopes
2. Create WorkOS client singleton
3. Implement connection status check via Pipes API
4. Create Gmail connect component with OAuth redirect
5. Create token retrieval API endpoint

### WorkOS Widgets Integration

**Overview**: Use WorkOS Widgets for user profile and settings UI.

```typescript
// src/app/dashboard/settings/page.tsx
import { withAuth, getSignOutUrl } from '@workos-inc/authkit-nextjs';
import { Box, Heading, Separator } from '@radix-ui/themes';
import { UserProfile, UserSecurity, UserSessions } from '@workos-inc/widgets';
import { WorkOSWidgets } from '@workos-inc/widgets';

export default async function SettingsPage() {
  const { user, accessToken } = await withAuth({ ensureSignedIn: true });

  return (
    <Box p="6">
      <Heading size="8" mb="6">Account Settings</Heading>

      <WorkOSWidgets theme={{ accentColor: 'blue' }}>
        <Box mb="6">
          <Heading size="5" mb="3">Profile</Heading>
          <UserProfile accessToken={accessToken} />
        </Box>

        <Separator size="4" my="6" />

        <Box mb="6">
          <Heading size="5" mb="3">Security</Heading>
          <UserSecurity accessToken={accessToken} />
        </Box>

        <Separator size="4" my="6" />

        <Box>
          <Heading size="5" mb="3">Active Sessions</Heading>
          <UserSessions accessToken={accessToken} />
        </Box>
      </WorkOSWidgets>
    </Box>
  );
}
```

**Implementation steps**:
1. Configure CORS in WorkOS Dashboard for your domain
2. Import WorkOS Widgets styles
3. Use widgets with access token from AuthKit

### Database Schema (Simplified)

**Overview**: Only app-specific data - no users or connections tables.

```typescript
// src/lib/db/schema.ts
import { pgTable, text, timestamp, boolean, jsonb } from 'drizzle-orm/pg-core';

// User preferences - keyed by WorkOS user ID
export const userPreferences = pgTable('user_preferences', {
  workosUserId: text('workos_user_id').primaryKey(), // WorkOS user ID is the primary key
  aggressiveness: text('aggressiveness').default('aggressive').notNull(), // conservative | moderate | aggressive
  protectedSenders: jsonb('protected_senders').default([]).$type<string[]>(),
  notifyOnComplete: boolean('notify_on_complete').default(true),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Type exports for use in app
export type UserPreferences = typeof userPreferences.$inferSelect;
export type NewUserPreferences = typeof userPreferences.$inferInsert;
```

```typescript
// src/lib/db/index.ts
import { drizzle } from 'drizzle-orm/neon-serverless';
import { neon } from '@neondatabase/serverless';
import * as schema from './schema';

const sql = neon(process.env.DATABASE_URL!);
export const db = drizzle(sql, { schema });
```

**Implementation steps**:
1. Create drizzle.config.ts
2. Define minimal schema in src/lib/db/schema.ts
3. Run `bun drizzle-kit generate` to create migrations
4. Run `bun drizzle-kit migrate` to apply

### Audit Logging

**Overview**: Emit events to WorkOS Audit Logs for compliance tracking.

```typescript
// src/lib/audit.ts
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
  organizationId?: string;
  targets?: Array<{ type: string; id: string }>;
  metadata?: Record<string, unknown>;
}

export async function emitAuditEvent({
  action,
  actorId,
  organizationId,
  targets = [],
  metadata,
}: AuditEventParams) {
  // Skip if no organization (personal account)
  if (!organizationId) return;

  await workos.auditLogs.createEvent({
    organizationId,
    event: {
      action,
      occurredAt: new Date(),
      actor: {
        type: 'user',
        id: actorId,
      },
      targets,
      metadata,
    },
  });
}
```

**Implementation steps**:
1. Configure audit log event schemas in WorkOS Dashboard
2. Create audit helper with typed actions
3. Emit events on sign in/out and Gmail connection changes

## Data Model

### Schema Changes

```sql
-- User preferences only - no users or connections tables
-- WorkOS is the source of truth for user identity and Gmail connections

CREATE TABLE user_preferences (
  workos_user_id TEXT PRIMARY KEY,
  aggressiveness TEXT DEFAULT 'aggressive' NOT NULL,
  protected_senders JSONB DEFAULT '[]',
  notify_on_complete BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP DEFAULT NOW() NOT NULL
);
```

## API Design

### New Endpoints

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/gmail/status` | Check Gmail connection status via Pipes |
| `GET` | `/api/gmail/token` | Retrieve Gmail access token via Pipes |
| `GET` | `/api/preferences` | Get user preferences |
| `PUT` | `/api/preferences` | Update user preferences |

### Request/Response Examples

```typescript
// GET /api/gmail/status
// Response (connected)
{
  "isConnected": true,
  "error": null
}

// Response (not connected)
{
  "isConnected": false,
  "error": "not_connected"
}

// GET /api/gmail/token
// Response (success)
{
  "accessToken": "ya29.xxx..."
}

// Response (error)
{
  "error": "token_expired",
  "missingScopes": []
}

// GET /api/preferences
// Response
{
  "aggressiveness": "aggressive",
  "protectedSenders": ["boss@company.com"],
  "notifyOnComplete": true
}

// PUT /api/preferences
// Request
{
  "aggressiveness": "moderate",
  "protectedSenders": ["boss@company.com", "mom@family.com"]
}
```

## Testing Requirements

### Unit Tests

| Test File | Coverage |
|-----------|----------|
| `src/lib/__tests__/audit.test.ts` | Audit log helper functions |
| `src/lib/__tests__/db.test.ts` | Preferences CRUD |

**Key test cases**:
- Audit event emits with correct structure
- Preferences upsert on first access
- Preferences update correctly

### Integration Tests

| Test File | Coverage |
|-----------|----------|
| `e2e/auth.spec.ts` | Full authentication flow |

**Key scenarios**:
- User can sign up via AuthKit
- User can sign in and access dashboard
- Protected routes redirect unauthenticated users
- Gmail connection status reflects Pipes state

### Manual Testing

- [ ] Sign up flow completes successfully
- [ ] Sign in returns to dashboard
- [ ] Gmail connect button initiates OAuth
- [ ] After OAuth, connection status shows connected
- [ ] Access token retrieves successfully
- [ ] WorkOS Widgets render on settings page
- [ ] Sign out clears session

## Error Handling

| Error Scenario | Handling Strategy |
|----------------|-------------------|
| Pipes token retrieval fails | Show re-connect prompt |
| Database connection fails | Return 500 with generic error, log details |
| WorkOS API unavailable | Retry 3x with backoff, then show maintenance message |
| Invalid session | Redirect to login via middleware |

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

# Database migrations
bun drizzle-kit generate
bun drizzle-kit migrate

# Development server
bun run dev
```

## Rollout Considerations

- **Feature flag**: None needed for Phase 1
- **Monitoring**: Vercel Analytics for performance
- **Alerting**: WorkOS webhook for failed auth events
- **Rollback plan**: Redeploy previous commit via Vercel

## Open Items

- [ ] Confirm Pipes OAuth redirect URL format from WorkOS docs
- [ ] Set up Neon database and get connection string
- [ ] Configure CORS in WorkOS Dashboard
