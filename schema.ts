import { pgTable, text, uuid, timestamp, integer, boolean, jsonb, date, doublePrecision } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

// Existing agencies table remains unchanged
export const agencies = pgTable("agencies", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull(),
  jurisdiction: text("jurisdiction"),
  populationServed: integer("population_served"),
  operationalEnvironment: text("operational_environment"),
  swatClassification: text("swat_classification"),
  address: text("address"),
  contactName: text("contact_name"),
  contactPosition: text("contact_position"),
  contactEmail: text("contact_email").notNull().unique(),
  contactPhone: text("contact_phone"),
  website: text("website"),
  liaisonName: text("liaison_name"),
  liaisonContact: text("liaison_contact"),
  swornOfficers: integer("sworn_officers"),
  supportStaff: integer("support_staff"),
  totalSwatPersonnel: integer("total_swat_personnel"),
  departmentStructure: text("department_structure"),
  personnelGaps: text("personnel_gaps"),
  missionCapabilities: jsonb("mission_capabilities"),
  equipmentStatus: text("equipment_status"),
  requiredEquipment: jsonb("required_equipment"),
  trainingStatus: jsonb("training_status"),
  trainingGaps: text("training_gaps"),
  accessStatus: boolean("access_status").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  lastAssessmentDate: timestamp("last_assessment_date"),
  evaluationSummary: text("evaluation_summary"),
  paidStatus: boolean("paid_status").default(false), // Add paid status for tracking interface access
  tierLevel: integer("tier_level") // Store the agency's SWAT tier level (1-4)
});

// Update the users table with proper types
export const users = pgTable("users", {
  id: uuid("id").defaultRandom().primaryKey(),
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  role: text("role", { enum: ["admin", "agency"] }).notNull(),
  agencyId: uuid("agency_id").references(() => agencies.id, { onDelete: "set null" }),
  permissions: jsonb("permissions").$type<{
    read: boolean;
    write: boolean;
    edit: boolean;
    delete: boolean;
  }>().default({
    read: true,
    write: false,
    edit: false,
    delete: false
  }),
  interfaceType: text("interface_type", { enum: ["assessment", "tracking"] }).default("assessment"),
  notes: text("notes"),
  preferences: text("preferences"), // Add preferences field to store user preferences as JSON string
  profilePictureUrl: text("profile_picture_url"), // Add profile picture URL field
  premiumAccess: boolean("premium_access").default(false), // Add premium access field for controlling premium features
  createdAt: timestamp("created_at").defaultNow()
});

// Question Categories table
export const questionCategories = pgTable("question_categories", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  orderIndex: integer("order_index").notNull(),
  createdAt: timestamp("created_at").defaultNow()
});

// Questions table
export const questions = pgTable("questions", {
  id: uuid("id").defaultRandom().primaryKey(),
  categoryId: uuid("category_id").references(() => questionCategories.id, { onDelete: "cascade" }).notNull(),
  text: text("text").notNull(),
  description: text("description"),
  orderIndex: integer("order_index").notNull(),
  impactsTier: boolean("impacts_tier").default(true),
  questionType: text("question_type", { enum: ["boolean", "text", "numeric", "select"] }).default("boolean"),
  validationRules: jsonb("validation_rules").$type<{
    min?: number;
    max?: number;
    pattern?: string;
    options?: string[];
  }>().default({}),
  createdAt: timestamp("created_at").defaultNow()
});

// Assessment Responses table
export const assessmentResponses = pgTable("assessment_responses", {
  id: uuid("id").defaultRandom().primaryKey(),
  assessmentId: uuid("assessment_id").references(() => assessments.id, { onDelete: "cascade" }).notNull(),
  questionId: uuid("question_id").references(() => questions.id, { onDelete: "cascade" }).notNull(),
  response: boolean("response"),
  textResponse: text("text_response"),
  numericResponse: doublePrecision("numeric_response"),
  selectResponse: text("select_response"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at")
});

// Update assessments table to include progress tracking
export const assessments = pgTable("assessments", {
  id: uuid("id").defaultRandom().primaryKey(),
  agencyId: uuid("agency_id").references(() => agencies.id, { onDelete: "cascade" }).notNull(),
  name: text("name"),
  assessmentType: text("assessment_type", { enum: ["tier-assessment", "gap-analysis"] }).default("tier-assessment"),
  tierLevel: integer("tier_level"),
  status: text("status", { enum: ["in_progress", "completed"] }).default("in_progress"),
  progressPercentage: integer("progress_percentage").default(0),
  startedAt: timestamp("started_at").defaultNow(),
  completedAt: timestamp("completed_at"),
  missionProfile: text("mission_profile"),
  equipmentAssessment: jsonb("equipment_assessment"),
  completionStatus: boolean("completion_status").default(false),
  gapAnalysis: text("gap_analysis"),
  recommendations: text("recommendations"),
  createdAt: timestamp("created_at").defaultNow()
});

// Add reports table 
export const reports = pgTable("reports", {
  id: uuid("id").defaultRandom().primaryKey(),
  assessmentId: uuid("assessment_id").references(() => assessments.id, { onDelete: "cascade" }).notNull(),
  reportType: text("report_type").default("tier-assessment"), // 'tier-assessment' or 'gap-analysis'
  tierLevel: integer("tier_level"),
  reportUrl: text("report_url"),
  generatedAt: timestamp("generated_at").notNull(),
  summary: text("summary"),
  createdAt: timestamp("created_at").defaultNow()
});

// Enhanced Personnel Table for SWAT Tracking
export const personnel = pgTable("personnel", {
  id: uuid("id").defaultRandom().primaryKey(),
  agencyId: uuid("agency_id").references(() => agencies.id, { onDelete: "cascade" }).notNull(),
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  badgeNumber: text("badge_number").notNull().unique(),
  email: text("email"),
  phone: text("phone"),
  team: text("team"),
  role: text("role"), // primary role in the team
  secondaryRole: text("secondary_role"),
  status: text("status", { enum: ["available", "on-duty", "off-duty", "leave", "training"] }).default("available"),
  certifications: jsonb("certifications").$type<string[]>().default([]),
  specialties: jsonb("specialties").$type<string[]>().default([]),
  fitnessScore: integer("fitness_score"),
  lastEvaluation: timestamp("last_evaluation"),
  nextEvaluation: timestamp("next_evaluation"),
  assignedEquipment: jsonb("assigned_equipment").$type<string[]>().default([]),
  emergencyContacts: jsonb("emergency_contacts").$type<{
    name: string;
    relationship: string;
    phone: string;
    email?: string;
    address?: string;
    isPrimary: boolean;
  }[]>().default([]),
  notes: text("notes"),
  activeStatus: boolean("active_status").default(true),
  teamLeader: boolean("team_leader").default(false),
  createdAt: timestamp("created_at").defaultNow()
});

// Enhanced Equipment Table for SWAT Tracking - replaces original equipment table
export const swatEquipment = pgTable("equipment", {
  id: uuid("id").defaultRandom().primaryKey(),
  agencyId: uuid("agency_id").references(() => agencies.id, { onDelete: "cascade" }).notNull(),
  name: text("name").notNull(),
  serialNumber: text("serial_number").notNull(),
  category: text("category").notNull(),
  manufacturer: text("manufacturer"),
  model: text("model"),
  location: text("location"),
  assignedToId: uuid("assigned_to_id").references(() => personnel.id, { onDelete: "set null" }),
  purchaseDate: timestamp("purchase_date"),
  condition: text("condition", { enum: ["excellent", "good", "fair", "poor"] }).default("good"),
  lastMaintenance: timestamp("last_maintenance"),
  nextMaintenance: timestamp("next_maintenance"),
  warrantyExpiration: timestamp("warranty_expiration"),
  status: text("status", { enum: ["operational", "maintenance", "service_due", "repair", "retired"] }).default("operational"),
  notes: text("notes"),
  photoUrl: text("photo_url"),
  createdAt: timestamp("created_at").defaultNow()
});

// Enhanced Events Table for Calendar and Activity Tracking
export const events = pgTable("events", {
  id: uuid("id").defaultRandom().primaryKey(),
  title: text("title").notNull(),
  description: text("description"),
  startDate: timestamp("start_date").notNull(),
  endDate: timestamp("end_date"),
  startTime: text("start_time"),
  endTime: text("end_time"),
  location: text("location"),
  eventType: text("event_type", { enum: ["training", "maintenance", "certification", "meeting", "deployment", "other"] }),
  priority: text("priority", { enum: ["low", "medium", "high"] }).default("medium"),
  status: text("status", { enum: ["scheduled", "in-progress", "completed", "cancelled"] }).default("scheduled"),
  participants: jsonb("participants").$type<string[]>().default([]), // Personnel IDs
  requiredEquipment: jsonb("required_equipment").$type<string[]>().default([]), // Equipment IDs
  trainingObjectives: jsonb("training_objectives").$type<string[]>().default([]),
  agencyId: uuid("agency_id").references(() => agencies.id, { onDelete: "cascade" }),
  userId: uuid("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  createdAt: timestamp("created_at").defaultNow()
});

// Training & Certifications Table
export const trainings = pgTable("trainings", {
  id: uuid("id").defaultRandom().primaryKey(),
  agencyId: uuid("agency_id").references(() => agencies.id, { onDelete: "cascade" }).notNull(),
  title: text("title").notNull(),
  description: text("description"),
  trainingType: text("training_type", { 
    enum: ["tactical", "firearms", "medical", "physical", "technical", "certification", "other"]
  }).notNull(),
  startDate: timestamp("start_date").notNull(),
  endDate: timestamp("end_date"),
  startTime: text("start_time"),
  endTime: text("end_time"),
  location: text("location"),
  instructor: text("instructor"),
  participants: jsonb("participants").$type<string[]>().default([]), // Personnel IDs
  requiredEquipment: jsonb("required_equipment").$type<string[]>().default([]), // Equipment IDs
  trainingObjectives: jsonb("training_objectives").$type<string[]>().default([]),
  prerequisites: jsonb("prerequisites").$type<string[]>().default([]),
  priority: text("priority", { enum: ["low", "medium", "high"] }).default("medium"),
  status: text("status", { enum: ["scheduled", "in-progress", "completed", "cancelled"] }).default("scheduled"),
  completionStatus: jsonb("completion_status").$type<{
    personnelId: string;
    status: "completed" | "failed" | "absent";
    score?: number;
    notes?: string;
  }[]>().default([]),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow()
});

// Certifications Table
export const certifications = pgTable("certifications", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  issuingAuthority: text("issuing_authority"),
  requiredTraining: jsonb("required_training").$type<string[]>().default([]), // Training IDs
  validityPeriod: integer("validity_period"), // in months
  renewalRequirements: text("renewal_requirements"),
  agencyId: uuid("agency_id").references(() => agencies.id, { onDelete: "cascade" }).notNull(),
  createdAt: timestamp("created_at").defaultNow()
});

// Personnel Certifications (junction table)
export const personnelCertifications = pgTable("personnel_certifications", {
  id: uuid("id").defaultRandom().primaryKey(),
  personnelId: uuid("personnel_id").references(() => personnel.id, { onDelete: "cascade" }).notNull(),
  certificationId: uuid("certification_id").references(() => certifications.id, { onDelete: "cascade" }).notNull(),
  issueDate: timestamp("issue_date").notNull(),
  expiryDate: timestamp("expiry_date"),
  status: text("status", { enum: ["active", "expired", "revoked", "renewal_required"] }).default("active"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow()
});

// Missions Table
export const missions = pgTable("missions", {
  id: uuid("id").defaultRandom().primaryKey(),
  agencyId: uuid("agency_id").references(() => agencies.id, { onDelete: "cascade" }).notNull(),
  title: text("title").notNull(),
  missionType: text("mission_type", { 
    enum: ["high-risk-warrant", "barricade", "hostage", "surveillance", "vip-protection", "training", "other"]
  }).notNull(),
  description: text("description"),
  location: text("location"),
  latitude: text("latitude"), // Added for map functionality
  longitude: text("longitude"), // Added for map functionality
  startDate: timestamp("start_date").notNull(),
  endDate: timestamp("end_date"),
  priority: text("priority", { enum: ["low", "medium", "high"] }).default("medium"),
  riskLevel: text("risk_level", { enum: ["low", "medium", "high"] }).default("medium"),
  status: text("status", { enum: ["planned", "active", "completed", "aborted"] }).default("planned"),
  teamSize: integer("team_size"),
  teamLead: uuid("team_lead").references(() => personnel.id, { onDelete: "set null" }),
  team: jsonb("team").$type<string[]>().default([]), // Personnel IDs
  equipment: jsonb("equipment").$type<string[]>().default([]), // Equipment IDs
  objectives: jsonb("objectives").$type<string[]>().default([]),
  tacticalPlan: text("tactical_plan"),
  contingencyPlans: jsonb("contingency_plans").$type<string[]>().default([]), // Changed to array for multiple plans
  attachments: jsonb("attachments").$type<{
    name: string;
    url: string;
    type: string;
  }[]>().default([]),
  notes: text("notes"),
  afterActionReport: text("after_action_report"),
  responseTime: integer("response_time"), // in minutes
  createdAt: timestamp("created_at").defaultNow()
});

// Corrective Actions Table
export const correctiveActions = pgTable("corrective_actions", {
  id: uuid("id").defaultRandom().primaryKey(),
  agencyId: uuid("agency_id").references(() => agencies.id, { onDelete: "cascade" }).notNull(),
  title: text("title").notNull(),
  description: text("description"),
  category: text("category", { 
    enum: ["training", "equipment", "personnel", "policy", "other"]
  }).notNull(),
  dateIdentified: timestamp("date_identified").notNull(),
  targetCompletionDate: timestamp("target_completion_date"),
  responsibleParty: uuid("responsible_party").references(() => personnel.id, { onDelete: "set null" }),
  priority: text("priority", { enum: ["low", "medium", "high"] }).default("medium"),
  status: text("status", { enum: ["open", "in-progress", "completed", "cancelled"] }).default("open"),
  actionPlan: jsonb("action_plan").$type<string[]>().default([]),
  progress: integer("progress").default(0), // percentage
  completionDate: timestamp("completion_date"),
  verificationMethod: text("verification_method"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow()
});

// Resources Library Table
export const resources = pgTable("resources", {
  id: uuid("id").defaultRandom().primaryKey(),
  agencyId: uuid("agency_id").references(() => agencies.id, { onDelete: "cascade" }).notNull(),
  title: text("title").notNull(),
  description: text("description"),
  category: text("category", { 
    enum: ["policy", "sop", "training", "template", "external", "other"]
  }).notNull(),
  fileUrl: text("file_url"),
  fileType: text("file_type"),
  uploadedBy: uuid("uploaded_by").references(() => users.id, { onDelete: "set null" }),
  uploadDate: timestamp("upload_date").defaultNow(),
  lastUpdated: timestamp("last_updated"),
  version: text("version"),
  tags: jsonb("tags").$type<string[]>().default([]),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow()
});

// Messages Table - Preliminary declaration to resolve circular reference
const messagesConfig = {
  id: uuid("id").defaultRandom().primaryKey(),
  senderId: uuid("sender_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  recipientId: uuid("recipient_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  subject: text("subject").notNull(),
  content: text("content").notNull(),
  read: boolean("read").default(false),
  sentAt: timestamp("sent_at").defaultNow(),
  readAt: timestamp("read_at"),
  attachmentUrl: text("attachment_url"),
  priority: text("priority", { enum: ["low", "medium", "high", "urgent"] }).default("medium"),
  category: text("category", { enum: ["general", "assessment", "training", "equipment", "personnel", "support"] }).default("general"),
  archived: boolean("archived").default(false),
  agencyId: uuid("agency_id").references(() => agencies.id, { onDelete: "set null" })
};

// Define a temporary messages table first
export const messagesTemp = pgTable("messages", {
  id: uuid("id").primaryKey().defaultRandom(),
  subject: text("subject").notNull(),
  content: text("content").notNull(),
  senderId: uuid("sender_id").references(() => users.id, { onDelete: "cascade" }),
  recipientId: uuid("recipient_id").references(() => users.id, { onDelete: "set null" }),
  sentAt: timestamp("sent_at").defaultNow().notNull(),
  read: boolean("read").default(false),
  readAt: timestamp("read_at"),
  category: text("category", { enum: ["general", "assessment", "training", "equipment", "personnel", "support"] }).default("general"),
  priority: text("priority", { enum: ["low", "medium", "high", "urgent"] }).default("medium"),
  archived: boolean("archived").default(false),
  agencyId: uuid("agency_id").references(() => agencies.id, { onDelete: "set null" }),
  parentMessageId: uuid("parent_message_id")
});

// Re-export as messages
export const messages = messagesTemp;

// Define relations
export const agenciesRelations = relations(agencies, ({ many }) => ({
  users: many(users),
  assessments: many(assessments),
  swatEquipment: many(swatEquipment, { relationName: "equipment" }),
  personnel: many(personnel),
  events: many(events),
  trainings: many(trainings),
  certifications: many(certifications),
  missions: many(missions),
  correctiveActions: many(correctiveActions),
  resources: many(resources),
  messages: many(messages)
}));

export const personnelRelations = relations(personnel, ({ one, many }) => ({
  agency: one(agencies, {
    fields: [personnel.agencyId],
    references: [agencies.id]
  }),
  assignedEquipment: many(swatEquipment)
}));

export const swatEquipmentRelations = relations(swatEquipment, ({ one }) => ({
  agency: one(agencies, {
    fields: [swatEquipment.agencyId],
    references: [agencies.id]
  }),
  assignedTo: one(personnel, {
    fields: [swatEquipment.assignedToId],
    references: [personnel.id]
  })
}));

export const usersRelations = relations(users, ({ many, one }) => ({
  events: many(events),
  agency: one(agencies, {
    fields: [users.agencyId],
    references: [agencies.id]
  }),
  uploadedResources: many(resources, {
    relationName: "uploadedBy"
  }),
  sentMessages: many(messages, {
    relationName: "sender"
  }),
  receivedMessages: many(messages, {
    relationName: "recipient"
  })
}));

// Messages relations
export const messagesRelations = relations(messages, ({ one, many }) => ({
  sender: one(users, {
    fields: [messages.senderId],
    references: [users.id]
  }),
  recipient: one(users, {
    fields: [messages.recipientId],
    references: [users.id]
  }),
  childMessages: many(messages, { relationName: "parent" }),
  agency: one(agencies, {
    fields: [messages.agencyId],
    references: [agencies.id]
  })
}));

export const questionCategoriesRelations = relations(questionCategories, ({ many }) => ({
  questions: many(questions)
}));

export const questionsRelations = relations(questions, ({ one, many }) => ({
  category: one(questionCategories, {
    fields: [questions.categoryId],
    references: [questionCategories.id]
  }),
  responses: many(assessmentResponses)
}));

export const assessmentResponsesRelations = relations(assessmentResponses, ({ one }) => ({
  assessment: one(assessments, {
    fields: [assessmentResponses.assessmentId],
    references: [assessments.id]
  }),
  question: one(questions, {
    fields: [assessmentResponses.questionId],
    references: [questions.id]
  })
}));

export const assessmentsRelations = relations(assessments, ({ one, many }) => ({
  agency: one(agencies, {
    fields: [assessments.agencyId],
    references: [agencies.id]
  }),
  responses: many(assessmentResponses),
  reports: many(reports)
}));

// Add reports relations
export const reportsRelations = relations(reports, ({ one }) => ({
  assessment: one(assessments, {
    fields: [reports.assessmentId],
    references: [assessments.id]
  })
}));


// Create insert schemas
export const createUserSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  role: z.enum(["admin", "agency"]),
  agencyId: z.string().uuid().nullish(),
  permissions: z.object({
    read: z.boolean(),
    write: z.boolean(),
    edit: z.boolean(),
    delete: z.boolean()
  }).default({
    read: true,
    write: false,
    edit: false,
    delete: false
  }),
  notes: z.string().optional(),
  interfaceType: z.enum(["assessment", "tracking"]).optional().default("assessment"),
  premiumAccess: z.boolean().default(false),
  preferences: z.string().optional(),
  profilePictureUrl: z.string().optional()
});

export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
  passwordHash: true
}).extend({
  permissions: z.object({
    read: z.boolean(),
    write: z.boolean(),
    edit: z.boolean(),
    delete: z.boolean()
  }).default({
    read: true,
    write: false,
    edit: false,
    delete: false
  })
});

export const insertAgencySchema = createInsertSchema(agencies).omit({
  id: true,
  createdAt: true
});

export const insertAssessmentSchema = createInsertSchema(assessments).omit({
  id: true,
  createdAt: true,
  completedAt: true,
  progressPercentage: true,
  startedAt: true // Omit startedAt to use the defaultNow() value from the schema
});

export const insertSwatEquipmentSchema = createInsertSchema(swatEquipment).omit({
  id: true,
  createdAt: true
});

export const insertPersonnelSchema = createInsertSchema(personnel).omit({
  id: true,
  createdAt: true
});

export const insertEventSchema = createInsertSchema(events).omit({
  id: true,
  createdAt: true
});

export const insertQuestionCategorySchema = createInsertSchema(questionCategories).omit({
  id: true,
  createdAt: true
});

export const insertQuestionSchema = createInsertSchema(questions).omit({
  id: true,
  createdAt: true
});

export const insertAssessmentResponseSchema = createInsertSchema(assessmentResponses).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});

// Add reports insert schema
export const insertReportSchema = createInsertSchema(reports, {
  reportType: z.enum(['tier-assessment', 'gap-analysis']).default('tier-assessment'),
}).omit({
  id: true,
  createdAt: true
}).extend({
  // Allow string ISO dates for generated timestamps
  generatedAt: z.string().or(z.date())
});

// Add insert schemas for SWAT tracking entities
export const insertTrainingSchema = createInsertSchema(trainings).omit({
  id: true,
  createdAt: true
});

export const insertCertificationSchema = createInsertSchema(certifications).omit({
  id: true,
  createdAt: true
});

export const insertPersonnelCertificationSchema = createInsertSchema(personnelCertifications).omit({
  id: true,
  createdAt: true
});

export const insertMissionSchema = createInsertSchema(missions).omit({
  id: true,
  createdAt: true
});

export const insertCorrectiveActionSchema = createInsertSchema(correctiveActions).omit({
  id: true,
  createdAt: true
});

export const insertResourceSchema = createInsertSchema(resources).omit({
  id: true,
  createdAt: true
});

// Message insert schema
export const insertMessageSchema = createInsertSchema(messages).omit({
  id: true,
  sentAt: true,
  read: true,
  readAt: true
});

// Export types
export type InsertAgency = z.infer<typeof insertAgencySchema>;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type InsertAssessment = z.infer<typeof insertAssessmentSchema>;
export type InsertEquipment = z.infer<typeof insertSwatEquipmentSchema>;
export type InsertPersonnel = z.infer<typeof insertPersonnelSchema>;
export type CreateUser = z.infer<typeof createUserSchema>;
export type InsertEvent = z.infer<typeof insertEventSchema>;
export type QuestionCategory = typeof questionCategories.$inferSelect;
export type Question = typeof questions.$inferSelect;
export type AssessmentResponse = typeof assessmentResponses.$inferSelect;
export type InsertQuestionCategory = z.infer<typeof insertQuestionCategorySchema>;
export type InsertQuestion = z.infer<typeof insertQuestionSchema>;
export type InsertAssessmentResponse = z.infer<typeof insertAssessmentResponseSchema>;
export type InsertReport = z.infer<typeof insertReportSchema>;
export type InsertTraining = z.infer<typeof insertTrainingSchema>;
export type InsertCertification = z.infer<typeof insertCertificationSchema>;
export type InsertPersonnelCertification = z.infer<typeof insertPersonnelCertificationSchema>;
export type InsertMission = z.infer<typeof insertMissionSchema>;
export type InsertCorrectiveAction = z.infer<typeof insertCorrectiveActionSchema>;
export type InsertResource = z.infer<typeof insertResourceSchema>;

export type Agency = typeof agencies.$inferSelect;
export type User = typeof users.$inferSelect;
export type Assessment = typeof assessments.$inferSelect;
export type Equipment = typeof swatEquipment.$inferSelect;
export type Personnel = typeof personnel.$inferSelect;
export type Event = typeof events.$inferSelect;
export type Report = typeof reports.$inferSelect;
export type Training = typeof trainings.$inferSelect;
export type Certification = typeof certifications.$inferSelect;
export type PersonnelCertification = typeof personnelCertifications.$inferSelect;
export type Mission = typeof missions.$inferSelect;
export type CorrectiveAction = typeof correctiveActions.$inferSelect;
export type Resource = typeof resources.$inferSelect;
export type Message = typeof messages.$inferSelect;
export type InsertMessage = z.infer<typeof insertMessageSchema>;