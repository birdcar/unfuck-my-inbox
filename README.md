# Unfuck My Inbox

Your inbox is a disaster. Thousands of unread emails, newsletters you forgot you signed up for, promo spam that somehow bypasses filters, and somewhere in that mess are actual important emails you keep missing.

You've tried inbox zero. You've tried filters. You've tried that thing where you just declare email bankruptcy and archive everything. None of it sticks because the same garbage keeps rolling in.

This app fixes that. It scans your Gmail, figures out what's noise vs. signal, creates a label taxonomy that actually makes sense for how *you* work, and sets up filters to keep it that way. When it's not sure about something, it asks you instead of guessing wrong.

Built for developers who live in their inbox and are tired of the cognitive load of sorting through crap.

## What it does

- **Scans your inbox** - Analyzes your email patterns to understand what matters
- **Creates smart labels** - Proposes a hierarchical label structure based on your actual usage
- **Aggressive cleanup** - Trashes obvious noise, archives the rest, keeps what's important
- **Sets up filters** - Creates Gmail filters so the organization sticks
- **Batch triage** - Queues uncertain emails for quick yes/no decisions
- **Tracks everything** - Full audit log so you can see what happened and undo if needed

## Tech stack

- Next.js 16 (App Router)
- WorkOS AuthKit (auth)
- WorkOS Pipes (Gmail OAuth)
- WorkOS Widgets (user settings UI)
- Drizzle ORM + Postgres
- Radix UI Themes

## Setup

### Prerequisites

- [Bun](https://bun.sh) (or npm/pnpm if you prefer)
- Docker (for local Postgres)
- A [WorkOS](https://workos.com) account
- A Google Cloud project with Gmail API enabled

### 1. Clone and install

```bash
git clone https://github.com/birdcar/unfuck-my-inbox.git
cd unfuck-my-inbox
bun install
```

### 2. Set up environment

Copy the example env file:

```bash
cp .env.example .env.local
```

Fill in your values:

```bash
# WorkOS (grab these from your WorkOS Dashboard)
WORKOS_API_KEY=sk_test_...
WORKOS_CLIENT_ID=client_...
WORKOS_COOKIE_PASSWORD=  # Generate a random 32+ char string

# Database
DATABASE_URL=postgres://postgres:postgres@localhost:5432/unfuck_inbox

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_WORKOS_REDIRECT_URI=http://localhost:3000/auth/v1/callback
```

### 3. Configure WorkOS

In your WorkOS Dashboard:

1. **AuthKit**: Add `http://localhost:3000/auth/v1/callback` as a redirect URI
2. **Pipes**: Set up a Google provider with your OAuth credentials and Gmail scopes

### 4. Set up the database

Start Postgres:

```bash
docker compose up -d
```

Run migrations:

```bash
bun run db:migrate
```

### 5. Run it

```bash
bun dev
```

Hit `http://localhost:3000`, sign up, connect your Gmail, and watch the magic happen.

## Development

```bash
bun dev          # Start dev server (webpack)
bun dev:turbo    # Start with Turbopack (faster, but newer)
bun run build    # Production build
bun run lint     # Run ESLint
bun run typecheck # Run TypeScript checks
```

## Project structure

```
src/
├── app/                    # Next.js App Router pages
│   ├── auth/v1/callback/   # WorkOS OAuth callback
│   ├── dashboard/          # Main app (protected)
│   │   └── settings/       # User settings (connections, profile, etc.)
│   └── api/                # API routes
├── components/             # React components
├── lib/                    # Utilities and helpers
└── proxy.ts                # Next.js 16 proxy (auth middleware)
```

## Status

This is early. Phase 1 (auth + Gmail connection) is done. The actual inbox scanning and cleanup logic is coming in phases 2-4. Check the `docs/ideation/` folder if you want to see the roadmap.

## License

MIT
