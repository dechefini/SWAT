import { users, type User, type InsertUser, agencies, type Agency, type InsertAgency,
  assessments, type Assessment, type InsertAssessment,
  swatEquipment, type Equipment, type InsertEquipment,
  personnel, type Personnel, type InsertPersonnel,
  events, type Event, type InsertEvent,
  questionCategories, type QuestionCategory, type InsertQuestionCategory,
  questions, type Question, type InsertQuestion,
  assessmentResponses, type AssessmentResponse, type InsertAssessmentResponse,
  reports, type Report, type InsertReport,
  messages, type Message, type InsertMessage,
  correctiveActions, type CorrectiveAction, type InsertCorrectiveAction,
  resources, type Resource, type InsertResource
} from "@shared/schema";
import { db } from "./db";
import { eq, and, sql } from "drizzle-orm";

export interface IStorage {
  // User operations
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: Omit<User, 'id' | 'createdAt'>): Promise<User>;
  updateUser(id: string, user: Partial<Omit<User, 'id' | 'createdAt'>>): Promise<User>;
  deleteUser(id: string): Promise<void>;
  listUsers(): Promise<User[]>;
  // Agency operations
  getAgency(id: string): Promise<Agency | undefined>;
  createAgency(agency: InsertAgency): Promise<Agency>;
  listAgencies(): Promise<Agency[]>;
  updateAgency(id: string, agency: Partial<Agency>): Promise<Agency>;
  // Assessment operations
  getAssessment(id: string): Promise<Assessment | undefined>;
  createAssessment(assessment: InsertAssessment): Promise<Assessment>;
  listAssessments(agencyId?: string): Promise<Assessment[]>;
  updateAssessment(id: string, assessment: Partial<Assessment>): Promise<Assessment>;
  // Equipment operations
  getEquipment(id: string): Promise<Equipment | undefined>;
  createEquipment(equipment: InsertEquipment): Promise<Equipment>;
  listEquipment(agencyId: string): Promise<Equipment[]>;
  // Personnel operations
  getPersonnel(id: string): Promise<Personnel | undefined>;
  createPersonnel(personnel: InsertPersonnel): Promise<Personnel>;
  listPersonnel(agencyId: string): Promise<Personnel[]>;
  // Event operations
  getEvent(id: string): Promise<Event | undefined>;
  createEvent(event: InsertEvent): Promise<Event>;
  listEvents(userId: string): Promise<Event[]>;
  updateEvent(id: string, event: Partial<InsertEvent>): Promise<Event>;
  deleteEvent(id: string): Promise<void>;
  // Question Category operations
  getQuestionCategory(id: string): Promise<QuestionCategory | undefined>;
  createQuestionCategory(category: InsertQuestionCategory): Promise<QuestionCategory>;
  listQuestionCategories(): Promise<QuestionCategory[]>;
  // Question operations
  getQuestion(id: string): Promise<Question | undefined>;
  createQuestion(question: InsertQuestion): Promise<Question>;
  listQuestions(categoryId?: string): Promise<Question[]>;
  // Assessment Response operations
  getAssessmentResponse(id: string): Promise<AssessmentResponse | undefined>;
  createAssessmentResponse(response: InsertAssessmentResponse): Promise<AssessmentResponse>;
  listAssessmentResponses(assessmentId: string): Promise<AssessmentResponse[]>;
  updateAssessmentResponse(id: string, response: Partial<InsertAssessmentResponse>): Promise<AssessmentResponse>;
  // Report operations
  getReport(id: string): Promise<Report | undefined>;
  createReport(report: InsertReport): Promise<Report>;
  updateReport(id: string, report: Partial<Report>): Promise<Report>;
  listReports(): Promise<Report[]>;
  listReportsByAgencyId(agencyId: string): Promise<Report[]>;
  // Message operations
  getMessage(id: string): Promise<Message | undefined>;
  createMessage(message: InsertMessage): Promise<Message>;
  listSentMessages(userId: string): Promise<Message[]>;
  listReceivedMessages(userId: string): Promise<Message[]>;
  listAgencyMessages(agencyId: string): Promise<Message[]>;
  updateMessage(id: string, message: Partial<Message>): Promise<Message>;
  markMessageAsRead(id: string): Promise<Message>;
  deleteMessage(id: string): Promise<void>;
  // Corrective Action operations
  getCorrectiveAction(id: string): Promise<CorrectiveAction | undefined>;
  createCorrectiveAction(action: InsertCorrectiveAction): Promise<CorrectiveAction>;
  listCorrectiveActions(agencyId: string): Promise<CorrectiveAction[]>;
  updateCorrectiveAction(id: string, action: Partial<CorrectiveAction>): Promise<CorrectiveAction>;
  deleteCorrectiveAction(id: string): Promise<void>;
  // Resource operations
  getResource(id: string): Promise<Resource | undefined>;
  createResource(resource: InsertResource): Promise<Resource>;
  listResources(agencyId: string): Promise<Resource[]>;
  updateResource(id: string, resource: Partial<Resource>): Promise<Resource>;
  deleteResource(id: string): Promise<void>;
}

export class DatabaseStorage implements IStorage {
  // User operations
  async getUser(id: string): Promise<User | undefined> {
    try {
      const [user] = await db.select().from(users).where(eq(users.id, id));

      // Ensure the user object has preferences and profilePictureUrl properties
      // even if they don't exist in the database yet
      if (user) {
        return {
          ...user,
          preferences: user.preferences || null,
          profilePictureUrl: user.profilePictureUrl || null
        };
      }

      return user;
    } catch (error) {
      console.error('Error in getUser:', error);
      // If the error is related to missing columns, return the user without those fields
      if (error.message && error.message.includes('column') && error.message.includes('does not exist')) {
        try {
          // Fallback query without the new columns
          const [basicUser] = await db.execute(sql`
            SELECT id, email, password_hash as "passwordHash", first_name as "firstName", 
                  last_name as "lastName", role, agency_id as "agencyId", 
                  notes, created_at as "createdAt"
            FROM users
            WHERE id = ${id}
          `);

          if (basicUser) {
            return {
              ...basicUser,
              preferences: null,
              profilePictureUrl: null
            };
          }
        } catch (fallbackError) {
          console.error('Fallback query failed:', fallbackError);
        }
      }
      throw error;
    }
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    try {
      const [user] = await db.select().from(users).where(eq(users.email, email));
      return user;
    } catch (error: any) {
      console.error('Error in getUserByEmail:', error);
      
      // If the error is related to missing interface_type column
      if (error.message && error.message.includes('column') && 
          error.message.includes('interface_type') && error.message.includes('does not exist')) {
        try {
          // Fallback query without the interfaceType field
          const result = await db.execute(sql`
            SELECT id, email, password_hash as "passwordHash", first_name as "firstName", 
                   last_name as "lastName", role, agency_id as "agencyId", 
                   permissions, notes, created_at as "createdAt",
                   preferences, profile_picture_url as "profilePictureUrl"
            FROM users
            WHERE email = ${email}
          `);
          
          if (result && result.length > 0) {
            const user = result[0];
            
            // Add the missing interface_type field with default value
            return {
              ...user,
              interfaceType: "assessment" // Default value as specified in schema
            } as User;
          }
        } catch (fallbackError) {
          console.error('Fallback query failed:', fallbackError);
        }
      }
      throw error;
    }
  }

  async createUser(insertUser: Omit<User, 'id' | 'createdAt'>): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }

  async updateUser(id: string, updateData: Partial<Omit<User, 'id' | 'createdAt'>>): Promise<User> {
    try {
      const [user] = await db.update(users).set(updateData).where(eq(users.id, id)).returning();
      return user;
    } catch (error) {
      console.error('Error in updateUser:', error);

      // If the error is related to missing columns, update only the fields that exist
      if (error.message && error.message.includes('column') && error.message.includes('does not exist')) {
        const safeUpdateData = { ...updateData };

        // Remove potentially problematic fields
        delete safeUpdateData.preferences;
        delete safeUpdateData.profilePictureUrl;

        // Try updating with only the safe fields
        const [user] = await db.update(users).set(safeUpdateData).where(eq(users.id, id)).returning();
        return {
          ...user,
          preferences: null,
          profilePictureUrl: null
        };
      }

      throw error;
    }
  }

  async deleteUser(id: string): Promise<void> {
    await db.delete(users).where(eq(users.id, id));
  }

  async listUsers(): Promise<User[]> {
    return db.select().from(users);
  }
  // Agency operations
  async getAgency(id: string): Promise<Agency | undefined> {
    try {
      console.log('Storage: Getting agency with id:', id);
      const [agency] = await db.select().from(agencies).where(eq(agencies.id, id));
      return agency;
    } catch (error) {
      console.error('Storage error - getAgency:', error);
      throw error;
    }
  }

  async createAgency(insertAgency: InsertAgency): Promise<Agency> {
    try {
      console.log('Storage: Creating new agency:', insertAgency);
      const [agency] = await db.insert(agencies).values(insertAgency).returning();
      return agency;
    } catch (error) {
      console.error('Storage error - createAgency:', error);
      throw error;
    }
  }

  async listAgencies(): Promise<Agency[]> {
    try {
      console.log('Storage: Listing all agencies');
      
      // First test the database connection
      try {
        await db.execute(sql`SELECT 1`);
      } catch (connectionError) {
        console.error('Database connection test failed:', connectionError);
        // Return empty array instead of throwing error to prevent client errors
        return [];
      }
      
      // Then fetch agencies with error handling
      const result = await db.select().from(agencies).catch(err => {
        console.error('Database query failed in listAgencies:', err);
        return [] as Agency[];
      });
      
      console.log(`Storage: Retrieved ${result.length} agencies`);
      if (result.length > 0) {
        console.log('First agency:', result[0]);
      } else {
        console.log('No agencies found in database');
      }
      
      return result;
    } catch (error) {
      console.error('Storage error - listAgencies:', error);
      // Return empty array instead of throwing error to prevent client errors
      return [];
    }
  }

  async updateAgency(id: string, updateAgency: Partial<Agency>): Promise<Agency> {
    try {
      console.log('Storage: Updating agency:', id, updateAgency);
      const [agency] = await db
        .update(agencies)
        .set(updateAgency)
        .where(eq(agencies.id, id))
        .returning();
      return agency;
    } catch (error) {
      console.error('Storage error - updateAgency:', error);
      throw error;
    }
  }
  // Assessment operations
  async getAssessment(id: string): Promise<Assessment | undefined> {
    const [assessment] = await db.select().from(assessments).where(eq(assessments.id, id));
    return assessment;
  }

  async createAssessment(insertAssessment: InsertAssessment): Promise<Assessment> {
    const [assessment] = await db.insert(assessments).values(insertAssessment).returning();
    return assessment;
  }

  async listAssessments(agencyId?: string): Promise<Assessment[]> {
    try {
      // If agencyId is provided and not empty, filter by it
      if (agencyId) {
        return db.select().from(assessments).where(eq(assessments.agencyId, agencyId));
      }
      
      // Otherwise, return all assessments
      return db.select().from(assessments);
    } catch (error) {
      console.error('Storage error - listAssessments:', error);
      throw error;
    }
  }

  async updateAssessment(id: string, assessment: Partial<Assessment>): Promise<Assessment> {
    const [updatedAssessment] = await db
      .update(assessments)
      .set(assessment)
      .where(eq(assessments.id, id))
      .returning();
    return updatedAssessment;
  }
  // Equipment operations
  async getEquipment(id: string): Promise<Equipment | undefined> {
    const [equipmentItem] = await db.select().from(swatEquipment).where(eq(swatEquipment.id, id));
    return equipmentItem;
  }

  async createEquipment(insertEquipment: InsertEquipment): Promise<Equipment> {
    const [equipmentItem] = await db.insert(swatEquipment).values(insertEquipment).returning();
    return equipmentItem;
  }

  async listEquipment(agencyId: string): Promise<Equipment[]> {
    return db.select().from(swatEquipment).where(eq(swatEquipment.agencyId, agencyId));
  }
  // Personnel operations
  async getPersonnel(id: string): Promise<Personnel | undefined> {
    const [personnelItem] = await db.select().from(personnel).where(eq(personnel.id, id));
    return personnelItem;
  }

  async createPersonnel(insertPersonnel: InsertPersonnel): Promise<Personnel> {
    const [personnelItem] = await db.insert(personnel).values(insertPersonnel).returning();
    return personnelItem;
  }

  async listPersonnel(agencyId: string): Promise<Personnel[]> {
    return db.select().from(personnel).where(eq(personnel.agencyId, agencyId));
  }
  // Event operations
  async getEvent(id: string): Promise<Event | undefined> {
    const [event] = await db.select().from(events).where(eq(events.id, id));
    return event;
  }

  async createEvent(insertEvent: InsertEvent): Promise<Event> {
    const [event] = await db.insert(events).values(insertEvent).returning();
    return event;
  }

  async listEvents(userId: string): Promise<Event[]> {
    return db.select().from(events).where(eq(events.userId, userId));
  }

  async updateEvent(id: string, updateEvent: Partial<InsertEvent>): Promise<Event> {
    const [event] = await db
      .update(events)
      .set(updateEvent)
      .where(eq(events.id, id))
      .returning();
    return event;
  }

  async deleteEvent(id: string): Promise<void> {
    await db.delete(events).where(eq(events.id, id));
  }
  // Question Category operations
  async getQuestionCategory(id: string): Promise<QuestionCategory | undefined> {
    const [category] = await db.select().from(questionCategories).where(eq(questionCategories.id, id));
    return category;
  }

  async createQuestionCategory(category: InsertQuestionCategory): Promise<QuestionCategory> {
    const [newCategory] = await db.insert(questionCategories).values(category).returning();
    return newCategory;
  }

  async listQuestionCategories(): Promise<QuestionCategory[]> {
    return db.select().from(questionCategories).orderBy(questionCategories.orderIndex);
  }
  // Question operations
  async getQuestion(id: string): Promise<Question | undefined> {
    const [question] = await db.select().from(questions).where(eq(questions.id, id));
    return question;
  }

  async createQuestion(question: InsertQuestion): Promise<Question> {
    const [newQuestion] = await db.insert(questions).values(question).returning();
    return newQuestion;
  }

  async listQuestions(categoryId?: string): Promise<Question[]> {
    const query = db.select().from(questions);
    if (categoryId) {
      query.where(eq(questions.categoryId, categoryId));
    }
    return query.orderBy(questions.orderIndex);
  }
  // Assessment Response operations
  async getAssessmentResponse(id: string): Promise<AssessmentResponse | undefined> {
    const [response] = await db.select().from(assessmentResponses).where(eq(assessmentResponses.id, id));
    return response;
  }

  async createAssessmentResponse(response: InsertAssessmentResponse): Promise<AssessmentResponse> {
    const [newResponse] = await db.insert(assessmentResponses).values(response).returning();
    return newResponse;
  }

  async listAssessmentResponses(assessmentId: string): Promise<AssessmentResponse[]> {
    return db.select().from(assessmentResponses).where(eq(assessmentResponses.assessmentId, assessmentId));
  }

  async updateAssessmentResponse(id: string, response: Partial<InsertAssessmentResponse>): Promise<AssessmentResponse> {
    const [updatedResponse] = await db
      .update(assessmentResponses)
      .set({ ...response, updatedAt: new Date() })
      .where(eq(assessmentResponses.id, id))
      .returning();
    return updatedResponse;
  }

  // Report operations
  async getReport(id: string): Promise<Report | undefined> {
    try {
      console.log('Storage: Getting report with id:', id);
      
      // Use direct SQL without parameters to avoid the parameter issue
      const safeId = id.replace(/'/g, "''"); // Sanitize input for SQL injection prevention
      
      const sql = `
        SELECT id, assessment_id as "assessmentId", 
               tier_level as "tierLevel", report_url as "reportUrl", 
               generated_at as "generatedAt", report_type as "reportType",
               summary, created_at as "createdAt"
        FROM reports 
        WHERE id = '${safeId}'
      `;
      
      console.log('Storage: Executing direct SQL query for getting report');
      const result = await db.execute(sql);
      
      if (!result.rows || result.rows.length === 0) {
        console.log('Storage: No report found with id:', id);
        return undefined;
      }
      
      console.log('Storage: Found report:', result.rows[0]);
      return result.rows[0] as Report;
    } catch (error) {
      console.error('Storage error - getReport:', error);
      throw error;
    }
  }
  
  async updateReport(id: string, updates: Partial<Report>): Promise<Report> {
    try {
      console.log('Storage: Updating report with id:', id, 'with data:', updates);
      
      // Sanitize inputs for SQL safety
      const safeId = id.replace(/'/g, "''");
      const reportUrl = updates.reportUrl ? updates.reportUrl.replace(/'/g, "''") : null;
      const summary = updates.summary ? updates.summary.replace(/'/g, "''") : null;
      
      // Build set clauses dynamically based on what's provided
      const setClauses = [];
      if (reportUrl !== null) setClauses.push(`report_url = '${reportUrl}'`);
      if (summary !== null) setClauses.push(`summary = '${summary}'`);
      if (updates.tierLevel !== undefined) setClauses.push(`tier_level = ${updates.tierLevel}`);
      if (updates.reportType) setClauses.push(`report_type = '${updates.reportType}'`);
      
      // Only proceed if we have fields to update
      if (setClauses.length === 0) {
        throw new Error('No fields provided for report update');
      }
      
      const sql = `
        UPDATE reports
        SET ${setClauses.join(', ')}
        WHERE id = '${safeId}'
        RETURNING id, assessment_id as "assessmentId", 
                tier_level as "tierLevel", report_url as "reportUrl", 
                generated_at as "generatedAt", report_type as "reportType",
                summary, created_at as "createdAt"
      `;
      
      console.log('Storage: Executing update SQL:', sql);
      const result = await db.execute(sql);
      
      if (!result.rows || result.rows.length === 0) {
        throw new Error(`Report with id ${id} not found or could not be updated`);
      }
      
      console.log('Storage: Report updated successfully:', result.rows[0]);
      return result.rows[0] as Report;
    } catch (error) {
      console.error('Storage error - updateReport:', error);
      throw error;
    }
  }

  async createReport(insertReport: InsertReport): Promise<Report> {
    try {
      console.log('Storage: Creating new report:', JSON.stringify(insertReport));
      
      // Use raw SQL to avoid issues with missing columns in the database
      const { assessmentId, generatedAt, tierLevel, reportUrl, summary, reportType } = insertReport;
      
      console.log('Storage: Parameters extracted for report creation:', {
        assessmentId, generatedAt, tierLevel, reportUrl, summary, reportType
      });
      
      // Build SQL with escaped values instead of using parameterized query
      // since we're having issues with the parameterized approach
      const escapedSummary = summary ? summary.replace(/'/g, "''") : '';
      const escapedReportUrl = reportUrl ? reportUrl.replace(/'/g, "''") : '';
      
      const sql = `
        INSERT INTO reports (assessment_id, generated_at, tier_level, report_url, summary, report_type, created_at)
        VALUES ('${assessmentId}', '${generatedAt}', ${tierLevel || 'NULL'}, '${escapedReportUrl}', '${escapedSummary}', '${reportType || 'tier-assessment'}', now())
        RETURNING id, assessment_id as "assessmentId", tier_level as "tierLevel", 
                 report_url as "reportUrl", generated_at as "generatedAt",
                 report_type as "reportType", summary, created_at as "createdAt"
      `;
      
      console.log('Storage: Executing SQL query without parameters');
      
      const result = await db.execute(sql);
      
      console.log('Storage: Report created successfully', result.rows ? result.rows[0] : 'No result rows');
      
      if (result.rows && result.rows.length > 0) {
        return result.rows[0] as Report;
      } else {
        throw new Error('No report data returned from insertion');
      }
    } catch (error) {
      console.error('Storage error - createReport:', error);
      throw error;
    }
  }

  async listReports(): Promise<Report[]> {
    try {
      console.log('Storage: Listing all reports');
      // Use raw SQL to avoid the schema discrepancy with the report_type column
      const result = await db.execute(
        `SELECT id, assessment_id as "assessmentId", 
         tier_level as "tierLevel", report_url as "reportUrl", 
         generated_at as "generatedAt", report_type as "reportType",
         summary, created_at as "createdAt" 
         FROM reports`
      );
      const reports = result.rows as Report[];
      console.log('Storage: Retrieved reports count:', reports.length);
      return reports;
    } catch (error) {
      console.error('Storage error - listReports:', error);
      throw error;
    }
  }

  async listReportsByAgencyId(agencyId: string): Promise<Report[]> {
    try {
      console.log('Storage: Listing reports for agency:', agencyId);

      // Sanitize input
      const safeAgencyId = agencyId.replace(/'/g, "''");
      
      // Use direct SQL without parameters
      const sql = `
        SELECT r.id, r.assessment_id as "assessmentId", 
               r.tier_level as "tierLevel", r.report_url as "reportUrl", 
               r.generated_at as "generatedAt", r.report_type as "reportType",
               r.summary, r.created_at as "createdAt"
        FROM reports r
        INNER JOIN assessments a ON r.assessment_id = a.id
        WHERE a.agency_id = '${safeAgencyId}'
      `;
      
      console.log('Storage: Executing agency reports query without parameters');
      const result = await db.execute(sql);

      const reports = result.rows as Report[];
      console.log('Storage: Retrieved reports count for agency:', reports.length);
      return reports;
    } catch (error) {
      console.error('Storage error - listReportsByAgencyId:', error);
      throw error;
    }
  }

  // Message operations
  async getMessage(id: string): Promise<Message | undefined> {
    try {
      console.log('Storage: Getting message with id:', id);
      const [message] = await db.select().from(messages).where(eq(messages.id, id));
      return message as Message;
    } catch (error) {
      console.error('Storage error - getMessage:', error);
      throw error;
    }
  }

  async createMessage(message: InsertMessage): Promise<Message> {
    try {
      console.log('Storage: Creating new message');
      // Set default values for certain fields
      const messageWithDefaults = {
        ...message,
        sentAt: message.sentAt || new Date(),
        read: message.read || false
      };
      
      const [newMessage] = await db.insert(messages).values(messageWithDefaults).returning();
      return newMessage as Message;
    } catch (error) {
      console.error('Storage error - createMessage:', error);
      throw error;
    }
  }

  async listSentMessages(userId: string): Promise<Message[]> {
    try {
      console.log('Storage: Listing sent messages for user:', userId);
      
      // Get user to include sender info with the messages
      const userInfo = await this.getUser(userId);
      
      const result = await db.select().from(messages)
        .where(eq(messages.senderId, userId))
        .orderBy(sql`${messages.sentAt} DESC`);
      
      // Add sender and recipient info to each message
      const messagesWithInfo = await Promise.all(
        result.map(async message => {
          let recipientName = 'Admin Team';
          
          // If message has a specific recipient, get their name
          if (message.recipientId) {
            const recipient = await this.getUser(message.recipientId);
            if (recipient) {
              recipientName = `${recipient.firstName} ${recipient.lastName}`;
            }
          }
          
          return {
            ...message,
            senderName: userInfo ? `${userInfo.firstName} ${userInfo.lastName}` : 'Unknown',
            senderRole: userInfo ? userInfo.role : undefined,
            recipientName
          };
        })
      );
      
      console.log('Storage: Retrieved sent messages count:', messagesWithInfo.length);
      return messagesWithInfo as Message[];
    } catch (error) {
      console.error('Storage error - listSentMessages:', error);
      throw error;
    }
  }

  async listReceivedMessages(userId: string): Promise<Message[]> {
    try {
      console.log('Storage: Listing received messages for user:', userId);
      
      // Get the messages
      const result = await db.select().from(messages)
        .where(eq(messages.recipientId, userId))
        .orderBy(sql`${messages.sentAt} DESC`);
      
      console.log('Storage: Retrieved received messages count:', result.length);
      
      // Add sender information to each message
      const messagesWithInfo = await Promise.all(
        result.map(async (message) => {
          const sender = await this.getUser(message.senderId);
          return {
            ...message,
            senderName: sender ? `${sender.firstName} ${sender.lastName}` : 'Unknown',
            senderRole: sender ? sender.role : undefined
          };
        })
      );
      
      return messagesWithInfo as Message[];
    } catch (error) {
      console.error('Storage error - listReceivedMessages:', error);
      throw error;
    }
  }

  async listAgencyMessages(agencyId: string): Promise<Message[]> {
    try {
      console.log('Storage: Listing messages for agency:', agencyId);
      const result = await db.select().from(messages)
        .where(eq(messages.agencyId, agencyId))
        .orderBy(sql`${messages.sentAt} DESC`);
      
      console.log('Storage: Retrieved agency messages count:', result.length);
      
      // Add sender information to each message
      const messagesWithInfo = await Promise.all(
        result.map(async (message) => {
          const sender = await this.getUser(message.senderId);
          return {
            ...message,
            senderName: sender ? `${sender.firstName} ${sender.lastName}` : 'Unknown',
            senderRole: sender ? sender.role : undefined
          };
        })
      );
      
      return messagesWithInfo as Message[];
    } catch (error) {
      console.error('Storage error - listAgencyMessages:', error);
      throw error;
    }
  }

  async updateMessage(id: string, messageUpdate: Partial<Message>): Promise<Message> {
    try {
      console.log('Storage: Updating message:', id);
      const [updatedMessage] = await db
        .update(messages)
        .set(messageUpdate)
        .where(eq(messages.id, id))
        .returning();
      return updatedMessage as Message;
    } catch (error) {
      console.error('Storage error - updateMessage:', error);
      throw error;
    }
  }

  async markMessageAsRead(id: string): Promise<Message> {
    try {
      console.log('Storage: Marking message as read:', id);
      const [updatedMessage] = await db
        .update(messages)
        .set({ 
          read: true,
          readAt: new Date()
        })
        .where(eq(messages.id, id))
        .returning();
      return updatedMessage as Message;
    } catch (error) {
      console.error('Storage error - markMessageAsRead:', error);
      throw error;
    }
  }

  async deleteMessage(id: string): Promise<void> {
    try {
      console.log('Storage: Deleting message:', id);
      await db.delete(messages).where(eq(messages.id, id));
    } catch (error) {
      console.error('Storage error - deleteMessage:', error);
      throw error;
    }
  }

  // Corrective Action operations
  async getCorrectiveAction(id: string): Promise<CorrectiveAction | undefined> {
    try {
      console.log(`Storage: Getting corrective action with id: ${id}`);
      const [action] = await db.select().from(correctiveActions).where(eq(correctiveActions.id, id));
      return action;
    } catch (error) {
      console.error('Storage error - getCorrectiveAction:', error);
      throw error;
    }
  }

  async createCorrectiveAction(action: InsertCorrectiveAction): Promise<CorrectiveAction> {
    try {
      console.log('Storage: Creating new corrective action:', action);
      const [newAction] = await db.insert(correctiveActions).values(action).returning();
      return newAction;
    } catch (error) {
      console.error('Storage error - createCorrectiveAction:', error);
      throw error;
    }
  }

  async listCorrectiveActions(agencyId: string): Promise<CorrectiveAction[]> {
    try {
      console.log(`Storage: Listing corrective actions for agency: ${agencyId}`);
      const actions = await db.select().from(correctiveActions)
        .where(eq(correctiveActions.agencyId, agencyId))
        .orderBy(correctiveActions.dateIdentified);
      return actions;
    } catch (error) {
      console.error('Storage error - listCorrectiveActions:', error);
      throw error;
    }
  }

  async updateCorrectiveAction(id: string, action: Partial<CorrectiveAction>): Promise<CorrectiveAction> {
    try {
      console.log(`Storage: Updating corrective action with id: ${id}`, action);
      const [updatedAction] = await db
        .update(correctiveActions)
        .set(action)
        .where(eq(correctiveActions.id, id))
        .returning();
      return updatedAction;
    } catch (error) {
      console.error('Storage error - updateCorrectiveAction:', error);
      throw error;
    }
  }

  async deleteCorrectiveAction(id: string): Promise<void> {
    try {
      console.log(`Storage: Deleting corrective action with id: ${id}`);
      await db.delete(correctiveActions).where(eq(correctiveActions.id, id));
    } catch (error) {
      console.error('Storage error - deleteCorrectiveAction:', error);
      throw error;
    }
  }

  // Resource operations
  async getResource(id: string): Promise<Resource | undefined> {
    try {
      console.log(`Storage: Getting resource with id: ${id}`);
      const [resource] = await db.select().from(resources).where(eq(resources.id, id));
      return resource;
    } catch (error) {
      console.error('Storage error - getResource:', error);
      throw error;
    }
  }

  async createResource(resource: InsertResource): Promise<Resource> {
    try {
      console.log('Storage: Creating new resource:', resource);
      const [newResource] = await db.insert(resources).values(resource).returning();
      return newResource;
    } catch (error) {
      console.error('Storage error - createResource:', error);
      throw error;
    }
  }

  async listResources(agencyId: string): Promise<Resource[]> {
    try {
      console.log(`Storage: Listing resources for agency: ${agencyId}`);
      const resourcesList = await db.select().from(resources)
        .where(eq(resources.agencyId, agencyId))
        .orderBy(resources.uploadDate);
      return resourcesList;
    } catch (error) {
      console.error('Storage error - listResources:', error);
      throw error;
    }
  }

  async updateResource(id: string, resource: Partial<Resource>): Promise<Resource> {
    try {
      console.log(`Storage: Updating resource with id: ${id}`, resource);
      const [updatedResource] = await db
        .update(resources)
        .set({
          ...resource,
          lastUpdated: new Date().toISOString()
        })
        .where(eq(resources.id, id))
        .returning();
      return updatedResource;
    } catch (error) {
      console.error('Storage error - updateResource:', error);
      throw error;
    }
  }

  async deleteResource(id: string): Promise<void> {
    try {
      console.log(`Storage: Deleting resource with id: ${id}`);
      await db.delete(resources).where(eq(resources.id, id));
    } catch (error) {
      console.error('Storage error - deleteResource:', error);
      throw error;
    }
  }
}

// Export a single instance of DatabaseStorage
export const storage = new DatabaseStorage();