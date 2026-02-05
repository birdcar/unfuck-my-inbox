# PRD: Unfuck My Inbox - Phase 1

**Contract**: ./contract.md
**Phase**: 1 of 4
**Focus**: Foundation, Authentication & Gmail Connection

## Phase Overview

Phase 1 establishes the foundational infrastructure for the application. This includes project scaffolding with Next.js 14+ App Router, integrating WorkOS AuthKit for user authentication, and connecting Gmail via WorkOS Pipes.

This phase is sequenced first because all subsequent functionality depends on having authenticated users with valid Gmail access tokens. Without this foundation, we cannot read emails, apply labels, or track activity.

After Phase 1, users can sign up, log in, and authorize Gmail access. The app will be able to fetch their Gmail access token via Pipes, confirming the integration works end-to-end.

## User Stories

1. As a new user, I want to sign up for an account so that I can use the inbox cleanup service.
2. As a returning user, I want to sign in quickly so that I can access my dashboard.
3. As a user, I want to connect my Gmail account so that the app can read and organize my inbox.
4. As a user, I want to see my connection status so that I know Gmail is properly linked.

## Functional Requirements

### Authentication (AuthKit)

- **FR-1.1**: Implement WorkOS AuthKit with `@workos-inc/authkit-nextjs` for hosted authentication flow.
- **FR-1.2**: Configure redirect URI and initiate login URL in WorkOS Dashboard.
- **FR-1.3**: Implement protected routes using AuthKit middleware.
- **FR-1.4**: Display authenticated user info (email, name) in app header.
- **FR-1.5**: Implement sign-out flow with proper session cleanup.

### Gmail Connection (Pipes)

- **FR-1.6**: Configure Google provider in WorkOS Pipes Dashboard with Gmail API scopes.
- **FR-1.7**: Implement Pipes Widget for users to connect their Gmail account.
- **FR-1.8**: Store connection status in database (connected/disconnected/error).
- **FR-1.9**: Implement backend endpoint to retrieve Gmail access token via `workos.pipes.getAccessToken()`.
- **FR-1.10**: Handle token refresh failures gracefully with re-authorization prompt.

### Database Schema

- **FR-1.11**: Create User model linked to WorkOS user ID.
- **FR-1.12**: Create GmailConnection model tracking connection status and metadata.
- **FR-1.13**: Create UserPreferences model for future label/cleanup configuration.

### Audit Logging

- **FR-1.14**: Configure WorkOS Audit Logs with initial event schemas (user.signed_in, gmail.connected, gmail.disconnected).
- **FR-1.15**: Emit audit events on authentication and Gmail connection changes.

## Non-Functional Requirements

- **NFR-1.1**: Page load time under 2s on 3G connection.
- **NFR-1.2**: All secrets stored in environment variables, never in code.
- **NFR-1.3**: TypeScript strict mode enabled throughout.
- **NFR-1.4**: Responsive design supporting mobile viewports.

## Dependencies

### Prerequisites

- WorkOS account with AuthKit and Pipes enabled
- Google Cloud project with Gmail API enabled
- Vercel or similar hosting platform
- PostgreSQL database (Neon, Supabase, or similar)

### Outputs for Next Phase

- Authenticated user context available throughout app
- Gmail access token retrieval working via Pipes
- Database models for user data persistence
- Audit logging infrastructure in place

## Acceptance Criteria

- [ ] User can sign up via AuthKit hosted flow
- [ ] User can sign in and access protected dashboard route
- [ ] User can connect Gmail via Pipes Widget
- [ ] App successfully retrieves Gmail access token from Pipes
- [ ] Connection status displayed in UI
- [ ] Audit events logged for auth and connection events
- [ ] Sign out clears session and returns to landing page
- [ ] All TypeScript compiles with no errors
- [ ] Basic test coverage for auth flows

## Open Questions

- None - all requirements clarified during contract formation.
