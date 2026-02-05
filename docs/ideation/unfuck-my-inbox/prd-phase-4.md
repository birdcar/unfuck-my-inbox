# PRD: Unfuck My Inbox - Phase 4

**Contract**: ./contract.md
**Phase**: 4 of 4
**Focus**: Dashboard, Triage UI & Ongoing Maintenance

## Phase Overview

Phase 4 completes the user experience with a comprehensive dashboard showing what was done, how much time was saved, and ongoing inbox health. It also implements the batch triage UI for handling emails the AI was uncertain about.

This phase is sequenced last because it depends on cleanup execution data and triage queue from Phase 3. It transforms the app from a one-time tool into an ongoing inbox management solution.

After Phase 4, users have full visibility into their inbox health, can quickly triage uncertain emails, configure settings, and trigger periodic re-scans to maintain organization.

## User Stories

1. As a user, I want to see what the app did so that I can verify it worked correctly.
2. As a user, I want to see time saved so that I can appreciate the value.
3. As a user, I want to triage uncertain emails so that they get properly categorized.
4. As a user, I want to schedule re-scans so that my inbox stays organized.
5. As a user, I want to adjust my settings so that future cleanups match my preferences.

## Functional Requirements

### Dashboard Overview

- **FR-4.1**: Display summary statistics: emails processed, labeled, trashed, filtered.
- **FR-4.2**: Calculate and display estimated time saved using action weights:
  - Trash: 10 seconds
  - Label: 20 seconds
  - Filter created: 5 minutes ongoing savings
- **FR-4.3**: Show inbox health score (percentage organized, noise level).
- **FR-4.4**: Display recent activity feed from Audit Logs.
- **FR-4.5**: Show connected Gmail account info and connection health.

### Activity Log

- **FR-4.6**: Paginated list of all actions taken, fetched from WorkOS Audit Logs.
- **FR-4.7**: Filter by action type (labeled, trashed, filter created).
- **FR-4.8**: Search by email subject or sender.
- **FR-4.9**: Show action details (email metadata, timestamp, confidence score).
- **FR-4.10**: Undo button for reversible actions (restore from trash, remove label).

### Batch Triage UI

- **FR-4.11**: Queue display of emails with confidence below threshold.
- **FR-4.12**: Swipe-style or button-based quick actions: Label, Trash, Skip, Keep.
- **FR-4.13**: Keyboard shortcuts for power users (j/k navigation, l/t/s/k actions).
- **FR-4.14**: Show AI's suggested action with reasoning.
- **FR-4.15**: Learn from triage decisions to improve future categorization.
- **FR-4.16**: Progress indicator (X of Y remaining).
- **FR-4.17**: Batch "apply all suggestions" for confident users.

### Settings & Configuration

- **FR-4.18**: Aggressiveness slider (conservative → moderate → aggressive).
- **FR-4.19**: Protected senders list (never trash emails from these addresses).
- **FR-4.20**: Label management: rename, merge, delete, create new.
- **FR-4.21**: Filter management: view, edit, delete created filters.
- **FR-4.22**: Notification preferences (in-app, email summaries).
- **FR-4.23**: Data retention settings (how long to keep analysis data).

### Ongoing Maintenance

- **FR-4.24**: Manual re-scan trigger with options (full scan, incremental since last).
- **FR-4.25**: Scheduled periodic scans (daily, weekly, monthly).
- **FR-4.26**: Background job processing for scheduled scans.
- **FR-4.27**: Email digest summarizing periodic scan results.
- **FR-4.28**: Webhook/notification when triage queue has items.

## Non-Functional Requirements

- **NFR-4.1**: Dashboard loads in under 1 second.
- **NFR-4.2**: Triage UI responds to actions in under 200ms.
- **NFR-4.3**: Activity log supports 100k+ entries with pagination.
- **NFR-4.4**: Accessible: WCAG 2.1 AA compliance for triage UI.

## Dependencies

### Prerequisites

- Phase 3 complete (cleanup executed, triage queue populated)
- Background job infrastructure (Vercel Cron, Inngest, or similar)
- WorkOS Audit Logs queryable

### Outputs for Next Phase

- N/A - This is the final phase.

## Acceptance Criteria

- [ ] Dashboard displays accurate summary statistics
- [ ] Time saved calculation uses action weights
- [ ] Activity log shows all actions with undo capability
- [ ] Triage UI processes uncertain emails efficiently
- [ ] Keyboard shortcuts work in triage UI
- [ ] Settings persist and affect future scans
- [ ] Manual re-scan works (full and incremental)
- [ ] Scheduled scans execute on schedule
- [ ] Email digest sent after scheduled scans
- [ ] All UI accessible (keyboard navigable, screen reader compatible)

## Open Questions

- None - requirements clarified during contract formation.
