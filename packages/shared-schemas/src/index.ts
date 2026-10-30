// Shared Zod validation schemas for Unifix
// These schemas validate API requests and responses

import { z } from 'zod';
// These are the base types shared across the entire application

type BaseEntity = {
  id: string;
  createdAt: Date | string;
  updatedAt: Date | string;
};

type Campus = Campus & BaseEntity;


// ========== CAMPUS SCHEMAS ==========

/** Schema for creating a new campus */
export const createCampusSchema = z.object({
  name: z.string().min(2).max(100),
  code: z.string().min(2).max(10).toUpperCase(),
  isActive: z.boolean().default(true),
  address: z.string().optional(),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
  timezone: z.string().optional(),
});

/** Schema for updating campus */
export const updateCampusSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  isActive: z.boolean().optional(),
  address: z.string().optional(),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
  timezone: z.string().optional(),
});

/** Campus response schema */
export const campusSchema = baseSchema.extend({
  name: z.string(),
  code: z.string(),
  isActive: z.boolean(),
  address: z.string().optional(),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
  timezone: z.string().optional(),
});

// ========== USER SCHEMAS ==========

/** Schema for creating an anonymous user */
export const createAnonymousUserSchema = z.object({
  isAnonymous: z.literal(true),
  phone: z.string().optional(), // Can be empty for truly anonymous
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  campusId: z.string().uuid(),
});

/** Schema for creating an authenticated user */
export const createAuthenticatedUserSchema = z.object({
  isAnonymous: z.literal(false),
  email: z.string().email(),
  phone: z.string().optional(),
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  password: z.string().min(8),
  campusId: z.string().uuid(),
});

/** Schema for updating user profile */
export const updateUserSchema = z.object({
  firstName: z.string().min(1).optional(),
  lastName: z.string().min(1).optional(),
  avatarUrl: z.string().url().optional(),
});

/** User response schema */
export const userSchema = baseSchema.extend({
  email: z.string().email().optional(),
  phone: z.string().optional(),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  avatarUrl: z.string().url().optional(),
  isActive: z.boolean(),
  isAnonymous: z.boolean(),
  emailVerified: z.coerce.date().optional(),
  phoneVerified: z.coerce.date().optional(),
  lastLogin: z.coerce.date().optional(),
});

// ========== CAMPUS MEMBERSHIP SCHEMAS ==========

export const campusMembershipRoleSchema = z.enum([
  'REPORTER',
  'MANAGEMENT',
  'SUPERMANAGEMENT',
]);

/** Schema for adding user to campus */
export const createCampusMembershipSchema = z.object({
  userId: z.string().uuid(),
  campusId: z.string().uuid(),
  role: campusMembershipRoleSchema,
  isActive: z.boolean().default(true),
});

/** Campus membership response schema */
export const campusMembershipSchema = baseSchema.extend({
  userId: z.string(),
  campusId: z.string(),
  role: campusMembershipRoleSchema,
  isActive: z.boolean(),
});

// ========== TICKET SCHEMAS ==========

/** Ticket status enum */
export const ticketStatusSchema = z.enum([
  'NEW',
  'ACKNOWLEDGED',
  'IN_PROGRESS',
  'RESOLVED',
  'CLOSED',
]);

/** Progress stage enum */
export const progressStageSchema = z.enum([
  'REPORTED',
  'ACKNOWLEDGED',
  'ACTIVE',
  'RESOLVING',
  'COMPLETED',
]);

/** Ticket priority enum */
export const ticketPrioritySchema = z.enum([
  'LOW',
  'MEDIUM',
  'HIGH',
  'CRITICAL',
]);

/** Schema for creating a new ticket */
export const createTicketSchema = z.object({
  title: z.string().min(3).max(200),
  description: z.string().min(10).max(5000),
  campusId: z.string().uuid(),
  location: z.string().optional(),
  category: z.string().optional(),
  isCritical: z.boolean().default(false),
  isAnonymous: z.boolean(),
  attachments: z.array(
    z.object({
      filename: z.string(),
      filepath: z.string(),
      mimeType: z.string(),
      size: z.number(),
    })
  ).optional(),
});

/** Schema for creating a manual ticket (management use) */
export const createManualTicketSchema = createTicketSchema.extend({
  reporterId: z.string().uuid(),
  phone: z.string().optional(),
  priority: ticketPrioritySchema.default('MEDIUM'),
});

/** Schema for updating ticket */
export const updateTicketSchema = z.object({
  title: z.string().min(3).max(200).optional(),
  description: z.string().min(10).max(5000).optional(),
  location: z.string().optional(),
  category: z.string().optional(),
  priority: ticketPrioritySchema.optional(),
  status: ticketStatusSchema.optional(),
  isCritical: z.boolean().optional(),
});

/** Schema for acknowledging a ticket */
export const acknowledgeTicketSchema = z.object({
  status: z.literal('ACKNOWLEDGED'),
  priority: ticketPrioritySchema.optional(),
  notes: z.string().optional(),
});

/** Schema for assigning a ticket */
export const assignTicketSchema = z.object({
  assigneeId: z.string().uuid(),
  status: z.literal('IN_PROGRESS'),
  notes: z.string().optional(),
});

/** Schema for resolving a ticket */
export const resolveTicketSchema = z.object({
  status: z.literal('RESOLVED'),
  resolutionNotes: z.string().min(10),
});

/** Schema for closing a ticket */
export const closeTicketSchema = z.object({
  status: z.literal('CLOSED'),
  closureNotes: z.string().min(10),
});

/** Schema for reopening a ticket */
export const reopenTicketSchema = z.object({
  status: z.literal('NEW'),
  reason: z.string().min(10),
});

/** Ticket response schema */
export const ticketSchema = baseSchema.extend({
  title: z.string(),
  description: z.string(),
  status: ticketStatusSchema,
  priority: ticketPrioritySchema,
  campusId: z.string(),
  reporterId: z.string().optional(),
  assigneeId: z.string().optional(),
  location: z.string().optional(),
  category: z.string().optional(),
  isCritical: z.boolean(),
  isAnonymous: z.boolean(),
  escalationCount: z.number(),
  currentStage: progressStageSchema,
  stageStartTime: z.coerce.date(),
  stageDuration: z.number(),
  closedAt: z.coerce.date().optional(),
  resolvedAt: z.coerce.date().optional(),
});

// ========== COMMENT SCHEMAS ==========

/** Schema for creating a comment */
export const createCommentSchema = z.object({
  ticketId: z.string().uuid(),
  content: z.string().min(1).max(2000),
  isInternal: z.boolean().default(false),
  authorName: z.string().min(1),
});

/** Comment response schema */
export const commentSchema = baseSchema.extend({
  ticketId: z.string(),
  userId: z.string(),
  content: z.string(),
  isInternal: z.boolean(),
  authorName: z.string(),
});

// ========== ATTACHMENT SCHEMAS ==========

/** Schema for uploading attachment */
export const uploadAttachmentSchema = z.object({
  ticketId: z.string().uuid(),
  filename: z.string(),
  filepath: z.string(),
  mimeType: z.string(),
  size: z.number().positive(),
});

/** Attachment response schema */
export const attachmentSchema = baseSchema.extend({
  ticketId: z.string(),
  userId: z.string(),
  filename: z.string(),
  filepath: z.string(),
  mimeType: z.string(),
  size: z.number(),
  isApproved: z.boolean(),
  uploadedBy: z.string(),
});

// ========== ENDORSEMENT SCHEMAS ==========

/** Schema for endorsing a duplicate ticket */
export const createEndorsementSchema = z.object({
  ticketId: z.string().uuid(),
  relatedTicketId: z.string().uuid(),
});

/** Endorsement response schema */
export const endorsementSchema = baseSchema.extend({
  ticketId: z.string(),
  endorserId: z.string(),
  relatedTicketId: z.string(),
  isConfirmed: z.boolean(),
});

// ========== STATUS HISTORY SCHEMAS ==========

/** Schema for status change */
export const createStatusHistorySchema = z.object({
  ticketId: z.string().uuid(),
  status: ticketStatusSchema,
  priority: ticketPrioritySchema,
  changedById: z.string().uuid(),
  previousStatus: ticketStatusSchema.optional(),
  previousPriority: ticketPrioritySchema.optional(),
  notes: z.string().optional(),
});

/** Status history response schema */
export const statusHistorySchema = baseSchema.extend({
  ticketId: z.string(),
  status: ticketStatusSchema,
  priority: ticketPrioritySchema,
  changedById: z.string(),
  previousStatus: ticketStatusSchema.optional(),
  previousPriority: ticketPrioritySchema.optional(),
  notes: z.string().optional(),
});

// ========== ESCALATION SCHEMAS ==========

/** Schema for escalation event */
export const createEscalationEventSchema = z.object({
  ticketId: z.string().uuid(),
  stage: progressStageSchema,
  previousStage: progressStageSchema,
  manualOverride: z.boolean().default(false),
  notifiedIds: z.array(z.string().uuid()).optional(),
});

/** Escalation event response schema */
export const escalationEventSchema = baseSchema.extend({
  ticketId: z.string(),
  stage: progressStageSchema,
  previousStage: progressStageSchema,
  triggeredAt: z.coerce.date(),
  resolvedAt: z.coerce.date().optional(),
  duration: z.number(),
  manualOverride: z.boolean(),
  notifiedIds: z.array(z.string()).optional(),
});

// ========== NOTIFICATION SCHEMAS ==========

/** Notification type enum */
export const notificationTypeSchema = z.enum([
  'TICKET_CREATED',
  'TICKET_ASSIGNED',
  'TICKET_STATUS_CHANGE',
  'TICKET_ESCALATED',
  'TICKET_RESOLVED',
  'TICKET_CLOSED',
  'COMMENT_ADDED',
  'SYSTEM_ALERT',
]);

/** Schema for creating notification */
export const createNotificationSchema = z.object({
  userId: z.string().uuid(),
  title: z.string().min(1).max(100),
  message: z.string().min(1).max(500),
  type: notificationTypeSchema,
  relatedTicketId: z.string().uuid().optional(),
  metadata: z.record(z.unknown()).optional(),
});

/** Notification response schema */
export const notificationSchema = baseSchema.extend({
  userId: z.string(),
  title: z.string(),
  message: z.string(),
  type: notificationTypeSchema,
  isRead: z.boolean(),
  metadata: z.record(z.unknown()).optional(),
  relatedTicketId: z.string().optional(),
});

// ========== AI ANALYSIS SCHEMAS ==========

export const aiModelSchema = z.enum([
  'gpt-4',
  'gpt-4-turbo',
  'gpt-3.5-turbo',
  'mock',
  'custom',
]);

/** Schema for AI analysis */
export const createAIAnalysisSchema = z.object({
  ticketId: z.string().uuid(),
  suggestedTitle: z.string().optional(),
  suggestedCategory: z.string().optional(),
  suggestedPriority: ticketPrioritySchema.optional(),
  suggestedLocation: z.string().optional(),
  similarTickets: z.array(z.string().uuid()).optional(),
  confidence: z.number().min(0).max(1).optional(),
  modelUsed: aiModelSchema,
  tokensUsed: z.number().optional(),
  durationMs: z.number().optional(),
  analysisText: z.string().optional(),
});

/** AI analysis response schema */
export const aiAnalysisSchema = baseSchema.extend({
  ticketId: z.string(),
  suggestedTitle: z.string().optional(),
  suggestedCategory: z.string().optional(),
  suggestedPriority: ticketPrioritySchema.optional(),
  suggestedLocation: z.string().optional(),
  similarTickets: z.array(z.string()).optional(),
  confidence: z.number().optional(),
  modelUsed: aiModelSchema,
  tokensUsed: z.number().optional(),
  durationMs: z.number().optional(),
  analysisText: z.string().optional(),
});

// ========== AUTHENTICATION SCHEMAS ==========

/** OTP verification request */
export const verifyOTPSchema = z.object({
  phone: z.string(),
  code: z.string().length(6),
  campusId: z.string().uuid(),
  isAnonymous: z.boolean(),
});

/** Token request for login */
export const tokenRequestSchema = z.object({
  userId: z.string().uuid(),
  campusIds: z.array(z.string().uuid()),
  roles: z.array(campusMembershipRoleSchema),
  isAnonymous: z.boolean(),
});

// ========== API REQUEST/RESPONSE SCHEMAS ==========

/** Base API response */
export const apiResponseSchema = z.object({
  data: z.record(z.unknown()).or(z.array(z.record(z.unknown()))).optional(),
  error: z.record(z.unknown()).optional(),
  metadata: z.object({
    timings: z.record(z.number()).optional(),
    pagination: z.object({
      page: z.number(),
      limit: z.number(),
      total: z.number(),
      totalPages: z.number(),
    }).optional(),
  }).optional(),
});

/** API error response */
export const apiErrorSchema = z.object({
  error: z.string(),
  message: z.string(),
  code: z.string().optional(),
  details: z.unknown().optional(),
});

/** Pagination query params */
export const paginationSchema = z.object({
  page: z.number().min(1).default(1),
  limit: z.number().min(1).max(100).default(20),
});

// ========== TYPE INFERENCE ==========

/** Type inference for all schemas */
export type CreateCampus = z.infer<typeof createCampusSchema>;
export type UpdateCampus = z.infer<typeof updateCampusSchema>;
export type Campus = z.infer<typeof campusSchema>;

export type CreateAnonymousUser = z.infer<typeof createAnonymousUserSchema>;
export type CreateAuthenticatedUser = z.infer<typeof createAuthenticatedUserSchema>;
export type UpdateUser = z.infer<typeof updateUserSchema>;
export type User = z.infer<typeof userSchema>;

export type CreateCampusMembership = z.infer<typeof createCampusMembershipSchema>;
export type CampusMembership = z.infer<typeof campusMembershipSchema>;

export type CreateTicket = z.infer<typeof createTicketSchema>;
export type CreateManualTicket = z.infer<typeof createManualTicketSchema>;
export type UpdateTicket = z.infer<typeof updateTicketSchema>;
export type AcknowledgeTicket = z.infer<typeof acknowledgeTicketSchema>;
export type AssignTicket = z.infer<typeof assignTicketSchema>;
export type ResolveTicket = z.infer<typeof resolveTicketSchema>;
export type CloseTicket = z.infer<typeof closeTicketSchema>;
export type ReopenTicket = z.infer<typeof reopenTicketSchema>;
export type Ticket = z.infer<typeof ticketSchema>;

export type CreateComment = z.infer<typeof createCommentSchema>;
export type Comment = z.infer<typeof commentSchema>;

export type UploadAttachment = z.infer<typeof uploadAttachmentSchema>;
export type Attachment = z.infer<typeof attachmentSchema>;

export type CreateEndorsement = z.infer<typeof createEndorsementSchema>;
export type Endorsement = z.infer<typeof endorsementSchema>;

export type CreateStatusHistory = z.infer<typeof createStatusHistorySchema>;
export type StatusHistory = z.infer<typeof statusHistorySchema>;

export type CreateEscalationEvent = z.infer<typeof createEscalationEventSchema>;
export type EscalationEvent = z.infer<typeof escalationEventSchema>;

export type CreateNotification = z.infer<typeof createNotificationSchema>;
export type Notification = z.infer<typeof notificationSchema>;

export type CreateAIAnalysis = z.infer<typeof createAIAnalysisSchema>;
export type AIAnalysis = z.infer<typeof aiAnalysisSchema>;

export type VerifyOTP = z.infer<typeof verifyOTPSchema>;
export type TokenRequest = z.infer<typeof tokenRequestSchema>;
export type ApiResponse = z.infer<typeof apiResponseSchema>;
export type ApiError = z.infer<typeof apiErrorSchema>;
export type Pagination = z.infer<typeof paginationSchema>;
