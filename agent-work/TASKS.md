# Unifix Development Task List

## Phase 0 - Inspect, Plan, and Checkpoint ✅ COMPLETED
- [x] Inspect current directory structure
- [x] Check Git status and remote
- [x] Verify Node.js version
- [x] Create agent-work directory
- [x] Create CURRENT_STATE.md
- [x] Create TASKS.md
- [x] Create DECISIONS.md
- [x] Create CHANGELOG.md
- [x] Identify missing prerequisites

## Phase 1 - Architecture and Contracts ✅ COMPLETED
- [x] Define shared type contracts (User, Campus, Ticket, ProgressEvent, Escalation, AI)
- [x] Create Zod validation schemas (Requests, Responses, Entities)
- [x] Define authentication architecture (JWT + Opaque Refresh Sessions)
- [x] Design Prisma data model with UUIDs, indexes, and relations
- [x] Establish API conventions (REST /api/v1, structured errors, field-level privacy)
- [x] Document architectural decisions

## Phase 2 - Database and Backend Foundation ✅ COMPLETED
- [x] Express application setup with Helmet, CORS, and Winston logging
- [x] TypeScript configuration across monorepo packages
- [x] Prisma setup with PostgreSQL connection on Supabase
- [x] Push schema to Supabase and generate Prisma Client
- [x] Seed database with fictional multi-campus fixtures, departments, categories, users, tickets
- [x] Centralized configuration package (`@unifix/shared-config`)
- [x] Error handling middleware and structured logging
- [x] Health check endpoint (`GET /api/v1/health`)

## Phase 3 - Authentication and Campus Registry ✅ COMPLETED
- [x] Campus registry models and endpoints (`GET /api/v1/campuses`, `GET /api/v1/campuses/:id`)
- [x] Authorized identity registry (`CampusAuthorizedIdentity`)
- [x] Eligibility verification endpoint (`POST /api/v1/campuses/:id/check-eligibility`)
- [x] Simulated OTP request and verification (`POST /api/v1/auth/request-otp`, `verify-otp`)
- [x] Token issuance (15-min JWT access token)
- [x] Server-side refresh token storage in `RefreshSession` table
- [x] Refresh token rotation and session reuse attack mitigation (`POST /api/v1/auth/refresh`)
- [x] Session revocation and logout (`POST /api/v1/auth/logout`)
- [x] Campus and role-based authorization middleware (`authenticate`, `authorize`, `ensureCampusAccess`)

## Phase 4 - Core Ticket System ✅ COMPLETED
- [x] Ticket models, relationships, and indexes in Prisma
- [x] Manual ticket reporting (`POST /api/v1/tickets`)
- [x] Campus-isolated ticket listing with search, filtering, and pagination (`GET /api/v1/tickets`)
- [x] Field-level anonymous reporter privacy serialization (management sees real reporter, ordinary users do not)
- [x] Unique endorsement handling ("I have this issue too", `POST /api/v1/tickets/:id/endorse`)
- [x] Comments with internal vs public visibility (`POST /api/v1/tickets/:id/comments`)
- [x] Management triage actions (acknowledge, assign, override priority with reason)
- [x] Ticket resolution with mandatory summary (`POST /api/v1/tickets/:id/resolve`)
- [x] Ticket reopening workflow for reporter and management (`POST /api/v1/tickets/:id/reopen`)
- [x] Duplicate marking with canonical ticket relationship (`POST /api/v1/tickets/:id/duplicate`)

## Phase 5 - Ticket Lifecycle and Escalation ✅ COMPLETED
- [x] Progress event model (`TicketProgressEvent`) tracking meaningful progress vs generic comments
- [x] Stage timers (21-day window for standard issues, 48-hour window for critical safety issues)
- [x] Background escalation scheduler (`services/api/src/lib/escalationEngine.ts`)
- [x] Idempotent escalation event generation (`EscalationEvent`)
- [x] Automated notification alerts for campus managers upon stage expiration
- [x] Manual / cron escalation trigger endpoint (`POST /api/v1/operational/escalation-check`)
- [x] In-app notification system (`GET /api/v1/notifications`, `PATCH /api/v1/notifications/:id/read`, `read-all`)

## Phase 6 - AI Adapter and Reporting ✅ COMPLETED
- [x] Generic AI provider interface (`IAIProvider`)
- [x] Deterministic development mock provider (`MockAIProvider`) with keyword analysis
- [x] OpenAI-compatible provider (`OpenAICompatibleProvider`) with timeouts, retries, and fallback
- [x] AI-assisted issue parsing endpoint (`POST /api/v1/ai/parse`)
- [x] AI clarification questions & missing information detection
- [x] Campus-scoped duplicate & similarity detection (`POST /api/v1/ai/similarity`)
- [x] Management insights generation (`GET /api/v1/ai/insights`)

## Phase 7 - Web Management Application (Next Up)
- [ ] Management app setup (React + TypeScript + Vite / Tailwind)
- [ ] Login and OTP auth screens
- [ ] Campus triage dashboard (counts, critical queue, overdue queue)
- [ ] Ticket queue with search, filtering by status, category, department, priority
- [ ] Ticket detail view with full audit history and progress updates
- [ ] Assignment and priority override controls
- [ ] Historical ticket archive search

## Phase 8 - Supermanagement and Analytics
- [ ] Global multi-campus overview
- [ ] Cross-campus ticket comparisons
- [ ] Global AI insights dashboard
- [ ] Administrative campus configuration controls

## Phase 9 - Mobile Application
- [ ] React Native / Expo application setup
- [ ] Clean modern onboarding & campus selection
- [ ] Manual issue reporting form with camera/file attachments
- [ ] AI-assisted natural language reporting conversation
- [ ] Ticket tracking and endorsement ("I have this issue too")
- [ ] In-app notification inbox

## Phase 10 - Integration, Testing, and Deployment
- [ ] Cross-campus isolation verification tests
- [ ] Build & packaging checks
- [ ] Comprehensive documentation
