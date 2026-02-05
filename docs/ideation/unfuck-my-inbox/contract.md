# Unfuck My Inbox Contract

**Created**: 2026-02-05
**Confidence Score**: 96/100
**Status**: Draft

## Problem Statement

Email overload is a universal productivity drain. Most people have inboxes with thousands of unread messages, a mix of legitimate correspondence buried under newsletters, promotional emails, automated notifications, and outright spam that slipped through filters. The cognitive load of manually sorting, labeling, and unsubscribing is so high that most people simply ignore it, leading to missed important emails and persistent low-grade anxiety.

The problem compounds over time. Without proper labeling and filtering, the same types of unwanted emails keep arriving. Users who attempt manual cleanup face hours of tedious work that feels endless. Existing "inbox zero" tools either require significant upfront configuration or use overly simplistic rules that miss nuance.

App builders and developers—who live in their inboxes—are particularly affected. They need a tool built by someone who understands their workflow, one that aggressively cleans without fear, learns their patterns, and surfaces only what matters.

## Goals

1. **Achieve inbox zero state** - Reduce unread/unlabeled emails to zero through intelligent categorization, aggressive trash/archive of noise, and creation of Gmail filters to prevent recurrence.

2. **Create a learned label taxonomy** - Analyze the user's actual email patterns and propose a custom hierarchical label structure (using Gmail's `parent/child` naming convention) that reflects how they work.

3. **Automate ongoing maintenance** - Generate Gmail filters that automatically apply labels, archive, or trash incoming mail based on learned patterns, preventing inbox regression.

4. **Provide visibility into actions** - Show users exactly what was done (trashed, labeled, filtered) with action-weighted time savings metrics and the ability to audit/undo.

5. **Handle ambiguity gracefully** - Queue emails the AI is uncertain about into a batch triage interface where users can make quick decisions that train future behavior.

## Success Criteria

- [ ] User can authenticate via WorkOS AuthKit and connect Gmail via WorkOS Pipes
- [ ] Initial inbox scan completes and proposes a custom label taxonomy
- [ ] User can review, edit, and approve proposed labels before application
- [ ] Emails are categorized and labeled according to approved taxonomy
- [ ] Noise emails are trashed (aggressive mode: anything not from contacts or marked important)
- [ ] Gmail filters are created programmatically to maintain organization
- [ ] Dashboard displays: emails processed, actions taken, estimated time saved (action-weighted)
- [ ] Batch triage UI allows quick decisions on uncertain emails
- [ ] Activity is logged to WorkOS Audit Logs for compliance and undo capability
- [ ] Gmail's "important" and "personal" category signals are respected to avoid trashing legitimate mail

## Scope Boundaries

### In Scope

- WorkOS AuthKit for application authentication
- WorkOS Pipes for Gmail OAuth token management
- WorkOS Audit Logs for activity tracking
- Gmail API integration (read, label, trash, create filters)
- AI-powered email categorization and taxonomy generation
- Custom label taxonomy learned from user's email patterns
- Automatic Gmail filter creation
- Dashboard with metrics and activity log
- Batch triage UI for uncertain categorizations
- Label configuration/editing interface
- Respecting Gmail's importance signals
- Next.js 14+ App Router with TypeScript
- Radix UI + Tailwind CSS for components
- Hybrid model: initial deep cleanup + periodic re-scans

### Out of Scope

- Automatic web-scraping unsubscribe - Gmail handles list-unsubscribe headers natively
- Email providers other than Gmail - Gmail only for v1
- Google Workspace service accounts - Pipes OAuth only, no domain-wide delegation
- Mobile native apps - Web-only for v1
- Email composition or sending - Read and organize only
- Calendar or other Google services - Gmail inbox only
- Real-time streaming - Batch processing with periodic re-scans

### Future Considerations

- Support for Outlook/Microsoft 365
- Mobile app (React Native)
- Team/organization shared label taxonomies
- Advanced analytics and trends over time
- Integration with task management tools
- Auto-unsubscribe via headless browser for stubborn senders

---

*This contract was generated from brain dump input. Review and approve before proceeding to PRD generation.*
