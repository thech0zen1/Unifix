# Architectural Decisions

## Design Choices

### 1. Modular Monorepo Structure
**Decision**: Use workspaces for shared packages and separate apps/services
**Rationale**: 
- Clear separation of concerns
- Reusable types and schemas
- Shared configuration
- Independent deployment potential
**Alternatives Considered**: 
- Single package structure (rejected due to complexity)
- Micro-frontends (too early for this stage)

### 2. Authentication Architecture
**Decision**: 
- JWT for access tokens
- Refresh token rotation with pepper
- Campus-scoped sessions
- Rate-limited identity verification
**Rationale**: 
- Standard industry practice
- Supports mobile and web
- Allows session management
- Handles anonymous reporting use case
**Alternatives Considered**: 
- Session-based (rejected for scalability)
- OAuth-only (rejected for custom campus needs)

### 3. Ticket Lifecycle Model
**Decision**: 
- Stage-based progression (New → Acknowledged → In Progress → Resolved → Closed)
- Time-based escalation at each stage
- Configurable stage durations
- Historical status tracking
**Rationale**: 
- Clear progression for management
- Enables automated escalation
- Supports reporting needs
- Maintains audit trail
**Alternatives Considered**: 
- Simple status model (rejected for lack of progression tracking)
- Event sourcing (too complex for initial version)

### 4. AI Integration Strategy
**Decision**: 
- Provider adapter pattern (OpenAI-compatible interface)
- Mock provider for development
- Structured response schemas
- User confirmation requirement for ticket creation
**Rationale**: 
- Vendor flexibility
- Works without real API
- Controlled behavior
- Safety requirement met
**Alternatives Considered**: 
- Direct OpenAI integration (rejected for flexibility)
- No AI abstraction (rejected for testing)

### 5. Database Structure
**Decision**: 
- Campus as base entity
- Users belong to campuses
- Tickets belong to campuses
- All queries campus-filtered at DB level
**Rationale**: 
- Strong isolation guarantee
- Performance benefits
- Clear data ownership
**Alternatives Considered**: 
- Multi-tenancy via schema (complex for SQL)
- Application-level filtering (security risk)

## Implementation Details

### Shared Types Package
- Location: `packages/shared-types`
- Contains: Base interfaces, enums, type definitions
- Exported: User, Campus, Ticket, Notifications, AIResponse

### Shared Schemas Package
- Location: `packages/shared-schemas`
- Contains: Zod validation schemas
- Exported: UserSchema, TicketSchema, CommentSchema, etc.

### Authentication Contracts
- Token structure: { access_token, refresh_token, expires_in, campus_ids }
- Session data: { user_id, campus_id, roles, anonymous: boolean }
- Rate limiting: 5 attempts per phone/email per hour

### API Conventions
- Version: v1 prefix
- Path: /api/v1/resource
- Methods: RESTful where possible
- Error format: { error, message, code, details? }
- Response: { data?, error?, metadata: { pagination?, timings? } }

### Data Model Highlights
- Campus → User (many-to-many via CampusMembership)
- Campus → Ticket (one-to-many)
- Ticket → Comment (one-to-many)
- Ticket → Attachment (one-to-many)
- Ticket → StatusHistory (one-to-many)
- Ticket → EscalationEvent (one-to-many)
- EscalationEvent → Notification (one-to-many)

## Rejected Decisions

### 1. GraphQL API
**Rejected**: REST chosen for simplicity and caching
**Reason**: Overhead doesn't justify benefits for this use case

### 2. Real-time WebSockets
**Rejected**: Polling and server-sent events for notifications
**Reason**: Complexity vs. actual real-time needs

### 3. Monolithic Backend
**Rejected**: Service-oriented structure
**Reason**: Need for independent scaling potential

### 4. Client-side Filtering
**Rejected**: Server-side campus isolation required
**Reason**: Security risk with unrestricted data

## Outstanding Design Questions

1. **OTP Verification**: Should we build simulation or integrate real provider early?
   - Pending: Need clarity on production verification provider

2. **File Storage**: Should attachments use Supabase Storage or external provider?
   - Pending: Storage cost analysis needed

3. **AI Model Selection**: Should we standardize on specific OpenAI model?
   - Pending: Cost and capability assessment

4. **Analytics Storage**: Should we use PostgreSQL or specialized DB?
   - Pending: Data volume projection

## Technology Choices

- **Frontend**: React Native (mobile), React (web)
- **Backend**: Node.js/Express/TypeScript
- **Database**: PostgreSQL via Prisma
- **Auth**: JWT with refresh tokens
- **Storage**: Supabase Storage (private bucket)
- **Testing**: Manual verification with controlled data
- **Build**: TypeScript compiler + native toolchains

## Migration Strategy

- Schema migrations via Prisma migrations
- Zero-downtime preferred where possible
- Rollback plans documented
- Test data provided for verification
