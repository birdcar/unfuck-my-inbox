# PRD: Unfuck My Inbox - Phase 2

**Contract**: ./contract.md
**Phase**: 2 of 4
**Focus**: Inbox Analysis & Taxonomy Generation

## Phase Overview

Phase 2 implements the core intelligence of the application: reading the user's Gmail inbox, analyzing email patterns, and generating a custom label taxonomy. This is the "brain" of the app that learns from the user's actual email landscape.

This phase is sequenced after authentication because we need valid Gmail access tokens to read emails. It comes before cleanup execution because users must approve the proposed taxonomy before any changes are made to their inbox.

After Phase 2, users can trigger an inbox scan, see analysis progress, review the proposed label taxonomy, and edit/approve labels before proceeding to cleanup.

## User Stories

1. As a user, I want to scan my inbox so that the app can understand my email patterns.
2. As a user, I want to see scan progress so that I know the analysis is working.
3. As a user, I want to review proposed labels so that I can approve the organization structure.
4. As a user, I want to edit suggested labels so that they match my mental model.
5. As a user, I want to see example emails for each category so that I understand the groupings.

## Functional Requirements

### Gmail API Integration

- **FR-2.1**: Implement Gmail API client using access token from Pipes.
- **FR-2.2**: Fetch email metadata (from, to, subject, labels, date, snippet) in batches.
- **FR-2.3**: Respect Gmail API rate limits with exponential backoff.
- **FR-2.4**: Fetch email importance signals (Gmail's `IMPORTANT` and `CATEGORY_PERSONAL` labels).
- **FR-2.5**: Store email metadata in database for analysis (not full content for privacy).

### Inbox Analysis

- **FR-2.6**: Implement email clustering algorithm based on sender domain, subject patterns, and existing labels.
- **FR-2.7**: Use AI (Claude API or similar) to categorize emails and suggest taxonomy.
- **FR-2.8**: Identify "noise" emails: bulk senders, unread promotional, automated notifications.
- **FR-2.9**: Identify "keeper" signals: emails from contacts, replied-to threads, starred, important.
- **FR-2.10**: Calculate confidence score for each email's categorization.

### Taxonomy Generation

- **FR-2.11**: Generate hierarchical label structure using Gmail's `Parent/Child` naming convention.
- **FR-2.12**: Propose 5-15 top-level categories based on user's email patterns.
- **FR-2.13**: Suggest sub-labels where clear patterns exist (e.g., `Finance/Banking`, `Finance/Invoices`).
- **FR-2.14**: Map noise categories to "Trash" or "Archive" actions rather than labels.

### Taxonomy Review UI

- **FR-2.15**: Display proposed taxonomy in editable tree view.
- **FR-2.16**: Allow renaming, merging, and deleting proposed labels.
- **FR-2.17**: Allow adding new custom labels.
- **FR-2.18**: Show sample emails (3-5) for each proposed category.
- **FR-2.19**: Show email count per category.
- **FR-2.20**: Highlight which categories will result in trash/archive vs labeling.
- **FR-2.21**: Require explicit approval before proceeding to cleanup phase.

### Progress & Status

- **FR-2.22**: Show real-time scan progress (emails scanned / total).
- **FR-2.23**: Allow canceling scan in progress.
- **FR-2.24**: Save scan results to database for review without re-scanning.
- **FR-2.25**: Allow re-scanning to update analysis.

## Non-Functional Requirements

- **NFR-2.1**: Initial scan of 10,000 emails completes within 5 minutes.
- **NFR-2.2**: AI categorization costs under $0.10 per 1,000 emails.
- **NFR-2.3**: Email metadata stored encrypted at rest.
- **NFR-2.4**: No full email body content stored (privacy).

## Dependencies

### Prerequisites

- Phase 1 complete (auth and Pipes working)
- AI/LLM API access (Claude or OpenAI) for categorization
- Database tables for scan results

### Outputs for Next Phase

- Approved label taxonomy stored in database
- Email categorization mapping (email ID → label + action)
- Confidence scores for triage queue
- Noise email list for trash/archive

## Acceptance Criteria

- [ ] User can initiate inbox scan from dashboard
- [ ] Progress indicator shows scan status
- [ ] Scan completes within 5 minutes for 10k emails
- [ ] Proposed taxonomy displays in tree view
- [ ] User can edit/rename/delete proposed labels
- [ ] Sample emails shown for each category
- [ ] Noise categories clearly marked for trash/archive
- [ ] User must explicitly approve taxonomy to proceed
- [ ] Scan results persist across sessions
- [ ] Re-scan updates existing analysis

## Open Questions

- None - requirements clarified during contract formation.
