// Shared type definitions for Unifix
// These are the base types shared across the entire application

/** 
 * Base entity with ID and timestamps
 */
export interface BaseEntity {
  id: string;
  createdAt: Date | string;
  updatedAt: Date | string;
}

/** 
 * Campus represents a physical campus location
 * Each campus is a security boundary
 */
export interface Campus extends BaseEntity {
  name: string;
  code: string; // Unique campus code (e.g., "MIT", "Stanford")
  isActive: boolean;
  address?: string;
  latitude?: number;
  longitude?: number;
  timezone?: string;
}

/** 
 * User represents an authenticated individual
 * Can be anonymous reporter or authorized campus user
 */
export interface User extends BaseEntity {
  email?: string;
  phone?: string;
  // For anonymous users, these may be null
  firstName?: string;
  lastName?: string;
  avatarUrl?: string;
  isActive: boolean;
  isAnonymous: boolean;
  // If not anonymous, these are required
  emailVerified?: Date | string;
  phoneVerified?: Date | string;
  lastLogin?: Date | string;
}

/** 
 * CampusMembership links users to campuses
 * Defines what roles a user has at a campus
 */
export interface CampusMembership extends BaseEntity {
  userId: string;
  campusId: string;
  role: 'REPORTER' | 'MANAGEMENT' | 'SUPERMANAGEMENT';
  isActive: boolean;
}

/** 
 * Ticket status in lifecycle
 */
export type TicketStatus =
  | 'NEW'
  | 'ACKNOWLEDGED'
  | 'IN_PROGRESS'
  | 'RESOLVED'
  | 'CLOSED';

/** 
 * Ticket progress stage for escalation
 */
export type ProgressStage =
  | 'REPORTED'
  | 'ACKNOWLEDGED'
  | 'ACTIVE'
  | 'RESOLVING'
  | 'COMPLETED';

/** 
 * Ticket priority level
 */
export type TicketPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

/** 
 * Ticket represents an reported issue
 */
export interface Ticket extends BaseEntity {
  title: string;
  description: string;
  status: TicketStatus;
  priority: TicketPriority;
  campusId: string;
  reporterId?: string; // May be null for anonymous
  assigneeId?: string;
  location?: string;
  category?: string;
  isCritical: boolean;
  isAnonymous: boolean;
  escalationCount: number;
  currentStage: ProgressStage;
  stageStartTime: Date | string;
  stageDuration: number; // in hours
  closedAt?: Date | string;
  resolvedAt?: Date | string;
}

/** 
 * Comment on a ticket
 */
export interface Comment extends BaseEntity {
  ticketId: string;
  userId: string;
  content: string;
  isInternal: boolean; // Only visible to management
  authorName: string; // For anonymous, use "Anonymous"
}

/** 
 * Attachment file metadata
 */
export interface Attachment extends BaseEntity {
  ticketId: string;
  userId: string;
  filename: string;
  filepath: string; // Storage path
  mimeType: string;
  size: number;
  isApproved: boolean;
  uploadedBy: string; // User ID of uploader
}

/** 
 * Ticket endorsement (duplicate marker)
 */
export interface Endorsement extends BaseEntity {
  ticketId: string;
  endorserId: string; // User who endorsed
  relatedTicketId: string; // The duplicate ticket
  isConfirmed: boolean;
}

/** 
 * Status history for audit trail
 */
export interface StatusHistory extends BaseEntity {
  ticketId: string;
  status: TicketStatus;
  priority: TicketPriority;
  changedById: string;
  previousStatus?: TicketStatus;
  previousPriority?: TicketPriority;
  notes?: string;
}

/** 
 * Escalation event record
 */
export interface EscalationEvent extends BaseEntity {
  ticketId: string;
  stage: ProgressStage;
  previousStage: ProgressStage;
  triggeredAt: Date | string;
  resolvedAt?: Date | string;
  duration: number; // in hours
  manualOverride: boolean;
  notifiedIds?: string[]; // Users who were notified
}

/** 
 * Notification for users
 */
export interface Notification extends BaseEntity {
  userId: string;
  title: string;
  message: string;
  type: 
    | 'TICKET_CREATED'
    | 'TICKET-assigned'
    | 'TICKET_STATUS_CHANGE'
    | 'TICKET_ESCALATED'
    | 'TICKET_RESOLVED'
    | 'TICKET_CLOSED'
    | 'COMMENT_ADDED'
    | 'SYSTEM_ALERT';
  isRead: boolean;
  metadata?: Record<string, unknown>;
  relatedTicketId?: string;
}

/** 
 * AI analysis record
 */
export interface AIAnalysis extends BaseEntity {
  ticketId: string;
  suggestedTitle?: string;
  suggestedCategory?: string;
  suggestedPriority?: TicketPriority;
  suggestedLocation?: string;
  similarTickets?: string[]; // Related ticket IDs
  confidence?: number; // 0-1
  modelUsed: string;
  tokensUsed?: number;
  durationMs?: number;
  // Store the AI's analysis for reference
  analysisText?: string;
}

/** 
 * Database connection configuration
 */
export interface DatabaseConfig {
  url: string;
  directUrl?: string;
  poolTimeout?: number;
  maxPoolSize?: number;
  minPoolSize?: number;
  idleTimeout?: number;
  acquireTimeout?: number;
}

/** 
 * Authentication token payload
 */
export interface TokenPayload {
  userId: string;
  campusIds: string[]; // Campuses user has access to
  roles: CampusMembership['role'][];
  isAnonymous: boolean;
  iat: number;
  exp: number;
}

/** 
 * API error response
 */
export interface ApiError {
  error: string;
  message: string;
  code?: string;
  details?: unknown;
}

/** 
 * Paginated response
 */
export interface PaginatedResponse<T> {
  data: T[];
  metadata: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}
