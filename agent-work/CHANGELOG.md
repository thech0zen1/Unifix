# Unifix Changelog

## [0.4.0] - 2026-10-31 - Phase 2 to Phase 6 Complete
### Added
- **Complete Relational Prisma Schema**: 13 models synchronized to Supabase PostgreSQL (Campus, CampusAuthorizedIdentity, Department, Building, Location, Category, User, CampusMembership, RefreshSession, Ticket, TicketAssignment, Comment, Attachment, Endorsement, StatusHistory, PriorityHistory, TicketProgressEvent, EscalationEvent, Notification, AuditLog, AIAnalysis).
- **Development Database Fixtures**: `prisma/seed.ts` seeding 3 campuses (PSTC, MADI, HVU), departments, buildings, locations, categories, pre-authorized identities, manager/tech/student users, and sample tickets.
- **Full Authentication Subsystem**:
  - `POST /api/v1/auth/request-otp` checking `CampusAuthorizedIdentity` registry with development OTP code generation.
  - `POST /api/v1/auth/verify-otp` generating 15-minute JWT access tokens and opaque refresh tokens.
  - `POST /api/v1/auth/refresh` with rotation, cryptographic HMAC-SHA256 hashing in `RefreshSession`, and session reuse mitigation.
  - `POST /api/v1/auth/logout` revoking server-side refresh sessions.
  - `GET /api/v1/auth/me` returning current user and campus memberships.
- **Campus Registry API**:
  - `GET /api/v1/campuses` listing active campuses.
  - `GET /api/v1/campuses/:id` returning departments, buildings, locations, and categories.
  - `POST /api/v1/campuses/:id/check-eligibility` for non-disclosing onboarding verification.
- **Core Ticket System**:
  - `POST /api/v1/tickets` creating tickets with initial status history and optional attachments.
  - `GET /api/v1/tickets` with campus isolation, search, filtering, and role-aware privacy serialization (ordinary users see "Anonymous Reporter"; managers see true identity).
  - `GET /api/v1/tickets/:id` with full detail view and audit trail.
  - `POST /api/v1/tickets/:id/endorse` ensuring 1 unique endorsement per user per ticket.
  - `POST /api/v1/tickets/:id/comments` supporting internal vs public visibility.
  - Management triage endpoints: acknowledge, assign, override priority with reason, resolve with summary, reopen, and mark duplicate.
- **Ticket Lifecycle & 3-Week Escalation Engine**:
  - `TicketProgressEvent` tracking meaningful progress vs generic comments.
  - Background scheduler (`startEscalationScheduler`) running 21-day stage monitoring (and 48h critical timers).
  - Idempotent `EscalationEvent` creation and manager notification alerts.
  - `POST /api/v1/operational/escalation-check` endpoint for manual or cron invocation.
- **In-App Notification Subsystem**:
  - `GET /api/v1/notifications`, `PATCH /api/v1/notifications/:id/read`, `POST /api/v1/notifications/read-all`.
- **AI Adapter Subsystem**:
  - `IAIProvider` contract with deterministic `MockAIProvider` and `OpenAICompatibleProvider`.
  - `POST /api/v1/ai/parse` extracting title, category, location, severity, and clarification questions.
  - `POST /api/v1/ai/similarity` detecting potential duplicate tickets within campus boundaries.
  - `GET /api/v1/ai/insights` generating management insights.
- **Comprehensive Integration Suite**: `services/api/src/smokeTest.ts` verifying all 13 core flows against live Supabase PostgreSQL.

### Fixed
- Fixed missing `baseSchema` and duplicate `Campus` type in `packages/shared-schemas`.
- Fixed JWT `SignOptions` overload typing in `authController`.
- Fixed Express route registration order in `app.ts` so API routes are mounted before the 404 handler.
- Fixed symlinks for `node`, `npm`, and `npx` in execution environment.

## [0.2.0] - Phase 1 Complete
### Added
- Shared packages: `packages/shared-types`, `packages/shared-schemas`, `packages/shared-config`.
- Architecture specification and decisions documentation.

## [0.1.0] - Initial Setup
### Added
- Monorepo workspace structure, git repository initialized.
