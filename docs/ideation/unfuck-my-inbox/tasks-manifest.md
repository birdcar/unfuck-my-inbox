# Tasks Manifest

**Project:** Unfuck My Inbox
**Created:** 2026-02-05

## Quick Start

Start a fresh Claude session and run:

```bash
/execute-spec docs/ideation/unfuck-my-inbox/spec-phase-1.md
```

## Phases

| Phase | Focus | Effort | Spec File | Status |
|-------|-------|--------|-----------|--------|
| 1 | Foundation & Auth | M | spec-phase-1.md | pending |
| 2 | Analysis & Taxonomy | L | spec-phase-2.md | blocked |
| 3 | Cleanup Execution | M | spec-phase-3.md | blocked |
| 4 | Dashboard & Triage | M | spec-phase-4.md | blocked |

## Dependencies

```
Phase 1 (Foundation)
    │
    ├── AuthKit integration
    ├── Pipes Gmail connection
    ├── Database schema
    └── Audit Logs setup
         │
         ▼
Phase 2 (Analysis)
    │
    ├── Gmail API client
    ├── Email fetching
    ├── AI categorization
    └── Taxonomy UI
         │
         ▼
Phase 3 (Execution)
    │
    ├── Label creation
    ├── Batch operations
    ├── Protection layer
    └── Filter creation
         │
         ▼
Phase 4 (Dashboard)
    │
    ├── Stats dashboard
    ├── Triage UI
    ├── Settings
    └── Scheduled scans
```

## Execution Instructions

### Phase 1

```bash
/execute-spec docs/ideation/unfuck-my-inbox/spec-phase-1.md
```

**Prerequisites:**
- WorkOS account with AuthKit enabled
- WorkOS Pipes with Google provider configured
- Neon (or similar) PostgreSQL database
- Vercel account for deployment

**Validation:**
1. User can sign up/sign in via AuthKit
2. Gmail connection works via Pipes Widget
3. Access token retrieval succeeds
4. Audit events logged in WorkOS Dashboard

### Phase 2

```bash
/execute-spec docs/ideation/unfuck-my-inbox/spec-phase-2.md
```

**Prerequisites:**
- Phase 1 complete
- Claude API key (or OpenAI for categorization)

**Validation:**
1. Inbox scan completes
2. Taxonomy proposed
3. User can edit labels
4. Sample emails display correctly

### Phase 3

```bash
/execute-spec docs/ideation/unfuck-my-inbox/spec-phase-3.md
```

**Prerequisites:**
- Phase 2 complete with approved taxonomy

**Validation:**
1. Labels created in Gmail
2. Emails labeled correctly
3. Noise trashed (important protected)
4. Filters visible in Gmail settings

### Phase 4

```bash
/execute-spec docs/ideation/unfuck-my-inbox/spec-phase-4.md
```

**Prerequisites:**
- Phase 3 complete

**Validation:**
1. Dashboard shows accurate stats
2. Triage keyboard shortcuts work
3. Settings persist
4. Scheduled scan runs

## Environment Variables

```bash
# WorkOS
WORKOS_API_KEY=sk_...
WORKOS_CLIENT_ID=client_...
WORKOS_COOKIE_PASSWORD=<32+ char password>
NEXT_PUBLIC_WORKOS_REDIRECT_URI=http://localhost:3000/callback

# Database
DATABASE_URL=postgres://...

# AI (Phase 2+)
ANTHROPIC_API_KEY=sk-ant-...

# Cron (Phase 4)
CRON_SECRET=<random string>
```

## Tech Stack Summary

| Layer | Technology |
|-------|------------|
| Framework | Next.js 14+ (App Router) |
| Language | TypeScript (strict) |
| Auth | WorkOS AuthKit |
| OAuth Tokens | WorkOS Pipes |
| Audit | WorkOS Audit Logs |
| User UI | WorkOS Widgets |
| Database | PostgreSQL (Neon) |
| ORM | Drizzle |
| UI | Radix Themes (no Tailwind) |
| AI | Claude API (Sonnet) |
| Deployment | Vercel |
| Email API | Gmail API |

## Data Model Simplification

WorkOS is the single source of truth for:
- **Users** - via AuthKit (no local users table)
- **Gmail connections** - via Pipes (no local connections table)

Local database only stores app-specific data:
- `user_preferences` - keyed by `workos_user_id`
- `scans`, `taxonomies`, `executions` - all reference `workos_user_id` directly

## Artifacts Index

```
docs/ideation/unfuck-my-inbox/
├── contract.md          # Problem, goals, success criteria, scope
├── prd-phase-1.md       # Foundation & Auth requirements
├── prd-phase-2.md       # Analysis & Taxonomy requirements
├── prd-phase-3.md       # Cleanup Execution requirements
├── prd-phase-4.md       # Dashboard & Triage requirements
├── spec-phase-1.md      # Foundation implementation spec
├── spec-phase-2.md      # Analysis implementation spec
├── spec-phase-3.md      # Execution implementation spec
├── spec-phase-4.md      # Dashboard implementation spec
└── tasks-manifest.md    # This file
```
