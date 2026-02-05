# PRD: Unfuck My Inbox - Phase 3

**Contract**: ./contract.md
**Phase**: 3 of 4
**Focus**: Cleanup Execution & Filter Creation

## Phase Overview

Phase 3 executes the actual inbox cleanup based on the approved taxonomy from Phase 2. This is where the magic happens: emails get labeled, noise gets trashed, and Gmail filters are created to maintain organization going forward.

This phase is sequenced after taxonomy approval because we must not modify the user's inbox without their explicit consent on the organizational structure. It's the "do the thing" phase after all the analysis and planning.

After Phase 3, the user's inbox will be organized according to their approved taxonomy, noise will be trashed, and Gmail filters will prevent future inbox degradation.

## User Stories

1. As a user, I want to execute the cleanup so that my inbox gets organized.
2. As a user, I want to see cleanup progress so that I know it's working.
3. As a user, I want Gmail filters created so that future emails stay organized.
4. As a user, I want to see what was done so that I can verify the changes.
5. As a user, I want important emails protected so that I don't miss anything critical.

## Functional Requirements

### Label Application

- **FR-3.1**: Create Gmail labels matching approved taxonomy (if they don't exist).
- **FR-3.2**: Apply labels to emails based on categorization mapping.
- **FR-3.3**: Batch label operations for efficiency (Gmail API allows batch requests).
- **FR-3.4**: Track successful/failed label applications.

### Trash/Archive Execution

- **FR-3.5**: Move noise emails to trash (aggressive mode).
- **FR-3.6**: Respect Gmail's IMPORTANT label - never trash important emails.
- **FR-3.7**: Respect CATEGORY_PERSONAL - never trash personal emails.
- **FR-3.8**: Respect starred emails - never trash starred.
- **FR-3.9**: Respect emails from user's contacts - configurable protection.
- **FR-3.10**: Log every trash action to Audit Logs with email metadata.

### Gmail Filter Creation

- **FR-3.11**: Generate Gmail filter rules based on learned patterns.
- **FR-3.12**: Create filters for: sender domain, subject keywords, list-ID headers.
- **FR-3.13**: Filters should apply labels and optionally skip inbox or trash.
- **FR-3.14**: Preview filters before creation.
- **FR-3.15**: Create filters via Gmail API `users.settings.filters.create`.
- **FR-3.16**: Log filter creation to Audit Logs.

### Safety & Protection

- **FR-3.17**: Implement dry-run mode that shows what would happen without executing.
- **FR-3.18**: Queue low-confidence emails for triage (Phase 4) instead of acting.
- **FR-3.19**: Allow pause/resume of cleanup execution.
- **FR-3.20**: Implement undo capability for recent actions (via Audit Log + Gmail API).

### Progress Tracking

- **FR-3.21**: Show real-time cleanup progress (emails processed / total).
- **FR-3.22**: Show breakdown by action type (labeled, trashed, skipped).
- **FR-3.23**: Show errors/failures with retry option.
- **FR-3.24**: Send completion notification (in-app and optional email).

## Non-Functional Requirements

- **NFR-3.1**: Cleanup of 10,000 emails completes within 10 minutes.
- **NFR-3.2**: Zero false positives on "important" emails (never trash important).
- **NFR-3.3**: All destructive actions logged to Audit Logs.
- **NFR-3.4**: Undo available for actions within 30 days (Gmail trash retention).

## Dependencies

### Prerequisites

- Phase 2 complete (approved taxonomy and categorization mapping)
- Gmail API write permissions (modify, trash, filter creation)

### Outputs for Next Phase

- Cleanup execution log in database
- Summary statistics for dashboard
- Triage queue (low-confidence emails)
- Created filter list

## Acceptance Criteria

- [ ] Labels created in Gmail matching approved taxonomy
- [ ] Emails labeled according to categorization
- [ ] Noise emails moved to trash
- [ ] Important/personal/starred emails never trashed
- [ ] Gmail filters created and active
- [ ] All actions logged to WorkOS Audit Logs
- [ ] Dry-run mode shows preview without executing
- [ ] Progress indicator accurate during cleanup
- [ ] Cleanup completes without Gmail API errors
- [ ] Low-confidence emails queued for triage

## Open Questions

- None - requirements clarified during contract formation.
