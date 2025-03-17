import type { Express, Request, Response, NextFunction } from "express";
import express from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { db } from "./db";
import { 
  createUserSchema, 
  insertAgencySchema, 
  insertAssessmentSchema, 
  insertSwatEquipmentSchema, 
  insertPersonnelSchema, 
  insertEventSchema, 
  insertAssessmentResponseSchema, 
  insertReportSchema,
  insertTrainingSchema,
  insertCertificationSchema,
  insertPersonnelCertificationSchema,
  insertMissionSchema,
  insertCorrectiveActionSchema,
  insertResourceSchema
} from "@shared/schema";
import { z } from "zod";
import { isAuthenticated, isAdmin, hasAgencyAccess } from "./middleware/auth";
import passport from 'passport';
import bcrypt from 'bcrypt';
import { hashPassword } from "./auth";
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import PDFDocument from 'pdfkit';
import multer from 'multer';
import { v4 as uuidv4 } from 'uuid';

// Configure multer storage for file uploads
const reportsStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    // Get the reports directory path
    const filePath = fileURLToPath(import.meta.url);
    const dirPath = path.dirname(filePath);
    const reportsDir = path.join(dirPath, '..', 'reports');
    
    // Create directory if it doesn't exist
    if (!fs.existsSync(reportsDir)) {
      fs.mkdirSync(reportsDir, { recursive: true });
    }
    cb(null, reportsDir);
  },
  filename: function (req, file, cb) {
    // Create a unique filename with appropriate extension
    const assessmentType = req.body.assessmentType || 'report';
    const agencyId = req.params.agencyId || 'unknown';
    const timestamp = Date.now();
    const fileExt = path.extname(file.originalname) || '.pdf';
    
    const filename = `${assessmentType}_report_${agencyId}_${timestamp}${fileExt}`;
    cb(null, filename);
  }
});

// Create multer upload middleware for reports
const reportUpload = multer({
  storage: reportsStorage,
  fileFilter: (req, file, cb) => {
    // Accept only PDF, DOCX, DOC, and TXT files
    const allowedTypes = [
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/msword',
      'text/plain'
    ];
    
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      // Pass null as first param and false as second to reject file without throwing error
      cb(null, false);
      // Return an error message
      return new Error('Invalid file type. Only PDF, DOCX, DOC, and TXT files are allowed.');
    }
  },
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB max file size
  }
});

// Helper function to format assessment responses with debugging for special cases
function formatAssessmentResponse(response: any, question: any, reportType: 'tier-assessment' | 'gap-analysis') {
  let responseText = '';
  
  // Special debug logging for supervisor-to-operator ratio questions
  if (question.text.toLowerCase().includes('supervisor-to-operator ratio')) {
    console.log(`Found supervisor-to-operator ratio question in ${reportType} report:`, {
      questionId: question.id,
      questionText: question.text,
      booleanResponse: response.response,
      textResponse: response.textResponse,
      numericResponse: response.numericResponse,
      selectResponse: response.selectResponse
    });
  }
  
  // Format the response based on its type - handle all possible field names
  if (response.response === true || response.booleanResponse === true) {
    responseText = 'Yes';
  } else if (response.response === false || response.booleanResponse === false) {
    responseText = 'No';
  } else if (response.textResponse) {
    responseText = response.textResponse;
  } else if (response.numericResponse !== null && response.numericResponse !== undefined) {
    responseText = response.numericResponse.toString();
  } else if (response.selectResponse) {
    responseText = response.selectResponse;
  } else {
    responseText = 'Not specified';
  }
  
  return responseText;
}

// Define custom types for passport
declare global {
  namespace Express {
    interface User {
      id: string;
      email: string;
      role: "admin" | "agency";
      agencyId: string | null;
      preferences?: string; // Add preferences field
      profilePictureUrl?: string; // Add profile picture URL field
    }
  }
}

export function registerRoutes(app: Express): Server {
  // Prefix all routes with /api
  const router = express.Router();
  app.use('/api', router);

  // Get current user information
  router.get('/user', (req: Request, res: Response) => {
    // If the user is authenticated, return the user data
    if (req.isAuthenticated()) {
      return res.json(req.user);
    }
    // If not authenticated, return null
    return res.json(null);
  });
  
  // Alternative endpoint for current user (for compatibility)
  router.get('/users/me', (req: Request, res: Response) => {
    // If the user is authenticated, return the user data
    if (req.isAuthenticated()) {
      return res.json(req.user);
    }
    // If not authenticated, return 401 status
    return res.status(401).json({ message: 'Not authenticated' });
  });

  // Authentication Routes
  router.post('/login', (req: Request, res: Response, next: NextFunction) => {
    // Extract the interfaceType from the request body
    const { interfaceType } = req.body;
    console.log('Login request with interfaceType:', interfaceType);
    
    passport.authenticate('local', (err: Error | null, user: Express.User | false, info: { message: string } | undefined) => {
      if (err) {
        console.error('Authentication error:', err);
        return next(err);
      }
      if (!user) {
        console.log('Authentication failed:', info?.message);
        return res.status(401).json({ message: info?.message || 'Authentication failed' });
      }
      
      req.logIn(user, async (err) => {
        if (err) {
          console.error('Login error:', err);
          return next(err);
        }
        
        // Update the user's interface preference if provided
        if (interfaceType && ['assessment', 'tracking'].includes(interfaceType)) {
          try {
            // For admin users, always grant access to tracking interface
            if (user.role === 'admin' && interfaceType === 'tracking') {
              console.log('Admin user requesting tracking interface - granting access');
              await storage.updateUser(user.id, { interfaceType, premiumAccess: true });
              user.interfaceType = interfaceType;
              user.premiumAccess = true;
              return res.json(user);
            }
            
            // For agency users requesting tracking interface
            if (interfaceType === 'tracking' && user.agencyId) {
              const agency = await storage.getAgency(user.agencyId);
              
              // For this test version, we'll allow all agency users to access tracking
              // In production, uncomment the check for paid status
              // if (agency && agency.paidStatus !== true) {
              //   console.log('Premium feature requested for non-premium agency:', user.agencyId);
              //   return res.status(403).json({ 
              //     message: 'SWAT Tracking requires a premium subscription. Please contact your administrator.'
              //   });
              // }
              
              // Set premiumAccess flag for all agency users with tracking interface
              console.log('Setting premium access for agency user with tracking interface');
              await storage.updateUser(user.id, { interfaceType, premiumAccess: true });
              user.interfaceType = interfaceType;
              user.premiumAccess = true;
              return res.json(user);
            }
            
            // If requesting assessment interface
            if (interfaceType === 'assessment') {
              // We'll keep premiumAccess true for all users for testing
              // In production, you might want to set it based on agency status
              await storage.updateUser(user.id, { interfaceType, premiumAccess: true });
              user.interfaceType = interfaceType;
              user.premiumAccess = true;
              return res.json(user);
            }
          } catch (error) {
            console.error('Error updating interface preference:', error);
            // Continue with login even if interface preference update fails
          }
        }
        
        console.log('Login successful for user:', user.email, 'Interface:', user.interfaceType);
        return res.json(user);
      });
    })(req, res, next);
  });

  router.post('/logout', (req: Request, res: Response, next) => {
    req.logout((err) => {
      if (err) {
        console.error('Logout error:', err);
        return next(err);
      }
      res.json({ message: 'Logged out successfully' });
    });
  });

  // User Routes
  router.post('/users', isAdmin, async (req: Request, res: Response) => {
    try {
      console.log('User creation request received:', { ...req.body, password: '****' });
      
      // Validate input with schema
      const userInput = createUserSchema.parse(req.body);
      console.log('Hashing new password');
      const passwordHash = await hashPassword(userInput.password);

      // Create complete user object with all fields that the storage interface expects
      const newUser = {
        firstName: userInput.firstName,
        lastName: userInput.lastName,
        email: userInput.email,
        passwordHash,
        role: userInput.role,
        agencyId: userInput.agencyId ?? null,
        permissions: userInput.permissions,
        notes: userInput.notes ?? null,
        interfaceType: userInput.interfaceType as "assessment" | "tracking" ?? 'assessment',
        premiumAccess: userInput.premiumAccess ?? false,
        preferences: null,
        profilePictureUrl: null
      };

      console.log('Processed user data:', { ...newUser, passwordHash: '****' });
      
      const user = await storage.createUser(newUser);
      const { passwordHash: _, ...userResponse } = user;
      res.status(201).json(userResponse);
    } catch (error) {
      console.error('Failed to create user:', error);
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: error.errors });
      } else if (error instanceof Error) {
        res.status(500).json({ error: error.message || 'Failed to create user' });
      } else {
        res.status(500).json({ error: 'Failed to create user' });
      }
    }
  });

  router.get('/users/:id', isAuthenticated, async (req: Request, res: Response) => {
    try {
      const user = await storage.getUser(req.params.id);
      if (!user) {
        res.status(404).json({ error: 'User not found' });
        return;
      }
      // Remove passwordHash from response
      const { passwordHash: _, ...userResponse } = user;
      res.json(userResponse);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch user' });
    }
  });

  // Additional route handlers for users list and management
  router.get('/users', isAdmin, async (req: Request, res: Response) => {
    try {
      const users = await storage.listUsers();
      // Remove sensitive data before sending
      const sanitizedUsers = users.map(({ passwordHash, ...user }) => user);
      res.json(sanitizedUsers);
    } catch (error) {
      console.error('Failed to fetch users:', error);
      res.status(500).json({ error: 'Failed to fetch users' });
    }
  });

  router.patch('/users/:id', isAdmin, async (req: Request, res: Response) => {
    try {
      const userId = req.params.id;
      const updateData = req.body;

      // Prevent updating sensitive fields directly
      delete updateData.passwordHash;

      // If email is being updated, check for uniqueness
      if (updateData.email) {
        const existingUser = await storage.getUserByEmail(updateData.email);
        if (existingUser && existingUser.id !== userId) {
          return res.status(400).json({ error: 'Email address is already in use' });
        }
      }

      const user = await storage.updateUser(userId, updateData);
      const { passwordHash, ...sanitizedUser } = user;
      res.json(sanitizedUser);
    } catch (error) {
      console.error('Failed to update user:', error);
      res.status(500).json({ error: 'Failed to update user' });
    }
  });

  router.delete('/users/:id', isAdmin, async (req: Request, res: Response) => {
    try {
      const userId = req.params.id;
      await storage.deleteUser(userId);
      res.status(204).send();
    } catch (error) {
      console.error('Failed to delete user:', error);
      res.status(500).json({ error: 'Failed to delete user' });
    }
  });


  // Update user password
  router.post('/users/:id/password', isAuthenticated, async (req: Request, res: Response) => {
    try {
      const userId = req.params.id;

      // Ensure the user can only change their own password (or admin can change anyone's)
      if (req.user?.id !== userId && req.user?.role !== 'admin') {
        return res.status(403).json({ error: 'Not authorized to change this user\'s password' });
      }

      const { currentPassword, newPassword } = req.body;

      // Get the user
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      // Verify current password
      const isPasswordValid = await bcrypt.compare(currentPassword, user.passwordHash);
      if (!isPasswordValid) {
        return res.status(401).json({ error: 'Current password is incorrect' });
      }

      // Hash the new password
      const passwordHash = await hashPassword(newPassword);

      // Update user with new password
      await storage.updateUser(userId, { passwordHash });

      res.status(200).json({ message: 'Password updated successfully' });
    } catch (error) {
      console.error('Failed to update password:', error);
      res.status(500).json({ error: 'Failed to update password' });
    }
  });

  // Update user preferences
  router.patch('/users/:id/preferences', isAuthenticated, async (req: Request, res: Response) => {
    try {
      const userId = req.params.id;

      // Ensure the user can only update their own preferences (or admin can update anyone's)
      if (req.user?.id !== userId && req.user?.role !== 'admin') {
        return res.status(403).json({ error: 'Not authorized to update this user\'s preferences' });
      }

      // Get the user
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      // Update preferences
      // Store preferences as JSON in the user record
      const currentPreferences = user.preferences ? JSON.parse(user.preferences as string) : {};
      const updatedPreferences = JSON.stringify({
        ...currentPreferences,
        ...req.body
      });

      const updatedUser = await storage.updateUser(userId, { preferences: updatedPreferences });

      res.status(200).json({ 
        message: 'Preferences updated successfully',
        preferences: JSON.parse(updatedUser.preferences as string || '{}')
      });
    } catch (error) {
      console.error('Failed to update preferences:', error);
      res.status(500).json({ error: 'Failed to update preferences' });
    }
  });

  // Upload profile picture
  router.post('/users/:id/profile-picture', isAuthenticated, async (req: Request, res: Response) => {
    try {
      const userId = req.params.id;

      // Ensure the user can only update their own profile picture (or admin can update anyone's)
      if (req.user?.id !== userId && req.user?.role !== 'admin') {
        return res.status(403).json({ error: 'Not authorized to update this user\'s profile picture' });
      }

      // In a real implementation, this would handle file uploads
      // For now, we'll just update a profile picture URL in the user record
      const { profilePictureUrl } = req.body;

      if (!profilePictureUrl) {
        return res.status(400).json({ error: 'Profile picture URL is required' });
      }

      const updatedUser = await storage.updateUser(userId, { profilePictureUrl });

      res.status(200).json({ 
        message: 'Profile picture updated successfully',
        profilePictureUrl: updatedUser.profilePictureUrl
      });
    } catch (error) {
      console.error('Failed to update profile picture:', error);
      res.status(500).json({ error: 'Failed to update profile picture' });
    }
  });

  // Agency Routes
  // Modified agencies endpoint to handle issues with authentication
  router.get('/agencies', async (req: Request, res: Response) => {
    try {
      console.log('GET /agencies - Fetching all agencies');
      console.log('Authentication status:', {
        session: !!req.session,
        isAuthenticated: req.isAuthenticated(),
        user: req.user ? { id: req.user.id, role: req.user.role } : 'No user'
      });
      
      // Check if user is authenticated, but don't block request
      // This allows the client to still receive agencies even if auth is having issues
      if (!req.isAuthenticated()) {
        console.warn('User not authenticated, but proceeding with agencies fetch for client-side handling');
      }
      
      const agencies = await storage.listAgencies();
      console.log(`Agencies retrieved: ${agencies.length} agencies`);
      console.log('First agency (if exists):', agencies[0] || 'No agencies found');
      
      // Set appropriate headers to prevent caching
      res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
      res.setHeader('Pragma', 'no-cache');
      res.setHeader('Expires', '0');
      res.setHeader('Content-Type', 'application/json');
      
      // Return successfully with agencies
      return res.json(agencies);
    } catch (error) {
      console.error('Failed to fetch agencies:', error);
      res.status(500).json({
        error: 'Failed to fetch agencies',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  router.post('/agencies', isAdmin, async (req: Request, res: Response) => {
    try {
      console.log('POST /agencies - Creating new agency. User:', (req as any).user?.email);
      console.log('Request body:', JSON.stringify(req.body, null, 2));
      
      // Validate the agency data with Zod
      const agencyData = insertAgencySchema.parse(req.body);
      console.log('Parsed agency data:', JSON.stringify(agencyData, null, 2));
      
      // Create the agency in the database
      const agency = await storage.createAgency(agencyData);
      console.log('Agency created successfully:', JSON.stringify(agency, null, 2));
      
      res.status(201).json(agency);
    } catch (error) {
      console.error('Failed to create agency:', error);
      
      if (error instanceof z.ZodError) {
        console.error('Validation errors:', JSON.stringify(error.errors, null, 2));
        res.status(400).json({ 
          error: 'Validation failed', 
          details: error.errors 
        });
      } else {
        console.error('Error details:', error instanceof Error ? error.message : 'Unknown error');
        console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace');
        
        res.status(500).json({
          error: 'Failed to create agency',
          details: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }
  });

  router.patch('/agencies/:id', isAdmin, async (req: Request, res: Response) => {
    try {
      console.log(`PATCH /agencies/${req.params.id} - Request body:`, req.body);

      const agency = await storage.getAgency(req.params.id);
      if (!agency) {
        console.log('Agency not found');
        return res.status(404).json({ error: 'Agency not found' });
      }

      const updatedAgency = await storage.updateAgency(req.params.id, req.body);
      console.log('Agency updated successfully:', updatedAgency);
      res.json(updatedAgency);
    } catch (error) {
      console.error('Failed to update agency:', error);
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: error.errors });
      } else {
        res.status(500).json({
          error: 'Failed to update agency',
          details: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }
  });

  // Assessment Routes
  router.post('/agencies/:agencyId/assessments', hasAgencyAccess, async (req: Request, res: Response) => {
    try {
      console.log('Assessment creation request:', {
        ...req.body,
        agencyId: req.params.agencyId
      });
      
      // Ensure we're using the agencyId from the URL parameter
      const assessmentData = insertAssessmentSchema.parse({
        ...req.body,
        agencyId: req.params.agencyId
      });
      
      console.log('Parsed assessment data:', assessmentData);
      
      const assessment = await storage.createAssessment(assessmentData);
      console.log('Assessment created successfully:', assessment.id);
      
      res.status(201).json(assessment);
    } catch (error) {
      console.error('Assessment creation error:', error);
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: error.errors });
      } else if (error instanceof Error) {
        res.status(500).json({ error: error.message || 'Failed to create assessment' });
      } else {
        res.status(500).json({ error: 'Failed to create assessment' });
      }
    }
  });

  router.get('/agencies/:agencyId/assessments', hasAgencyAccess, async (req: Request, res: Response) => {
    try {
      const assessments = await storage.listAssessments(req.params.agencyId);
      res.json(assessments);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch assessments' });
    }
  });
  
  // Get a specific assessment by ID
  router.get('/agencies/:agencyId/assessment/:assessmentId', hasAgencyAccess, async (req: Request, res: Response) => {
    try {
      const assessmentId = req.params.assessmentId;
      console.log(`Fetching specific assessment by ID: ${assessmentId}`);
      
      const assessment = await storage.getAssessment(assessmentId);
      
      if (!assessment) {
        console.log(`Assessment not found: ${assessmentId}`);
        return res.status(404).json({ error: 'Assessment not found' });
      }
      
      // For security, verify the assessment belongs to this agency unless the user is an admin
      if (req.user?.role !== 'admin' && assessment.agencyId !== req.params.agencyId) {
        console.log('Unauthorized assessment access attempt', {
          userId: req.user?.id,
          userAgencyId: req.params.agencyId,
          assessmentAgencyId: assessment.agencyId
        });
        return res.status(403).json({ error: 'You do not have permission to access this assessment' });
      }
      
      console.log(`Successfully fetched assessment: ${assessmentId}`);
      res.json(assessment);
    } catch (error) {
      console.error('Failed to fetch assessment:', error);
      res.status(500).json({ error: 'Failed to fetch assessment' });
    }
  });
  
  // Admin-only endpoint to get any assessment by ID
  router.get('/agencies/admin/assessment/:assessmentId', isAdmin, async (req: Request, res: Response) => {
    try {
      const assessmentId = req.params.assessmentId;
      console.log(`Admin fetching assessment by ID: ${assessmentId}`);
      
      const assessment = await storage.getAssessment(assessmentId);
      
      if (!assessment) {
        console.log(`Assessment not found: ${assessmentId}`);
        return res.status(404).json({ error: 'Assessment not found' });
      }
      
      console.log(`Successfully fetched assessment for admin: ${assessmentId}`);
      res.json(assessment);
    } catch (error) {
      console.error('Failed to fetch assessment:', error);
      res.status(500).json({ error: 'Failed to fetch assessment' });
    }
  });
  
  // Get all assessments (for admin users)
  router.get('/assessments', isAdmin, async (req: Request, res: Response) => {
    try {
      console.log('Admin requesting all assessments');
      const assessments = await storage.listAssessments();
      console.log(`Returning ${assessments.length} assessments to admin`);
      res.json(assessments);
    } catch (error) {
      console.error('Failed to fetch all assessments:', error);
      res.status(500).json({ error: 'Failed to fetch all assessments' });
    }
  });

  // Equipment Routes
  router.post('/agencies/:agencyId/equipment', hasAgencyAccess, async (req: Request, res: Response) => {
    try {
      const equipmentData = insertSwatEquipmentSchema.parse({
        ...req.body,
        agencyId: req.params.agencyId
      });
      const equipment = await storage.createEquipment(equipmentData);
      res.status(201).json(equipment);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: error.errors });
      } else {
        res.status(500).json({ error: 'Failed to create equipment' });
      }
    }
  });

  router.get('/agencies/:agencyId/equipment', hasAgencyAccess, async (req: Request, res: Response) => {
    try {
      const equipment = await storage.listEquipment(req.params.agencyId);
      res.json(equipment);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch equipment' });
    }
  });

  // Personnel Routes
  router.post('/agencies/:agencyId/personnel', hasAgencyAccess, async (req: Request, res: Response) => {
    try {
      const personnelData = insertPersonnelSchema.parse({
        ...req.body,
        agencyId: req.params.agencyId
      });
      const personnel = await storage.createPersonnel(personnelData);
      res.status(201).json(personnel);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: error.errors });
      } else {
        res.status(500).json({ error: 'Failed to create personnel' });
      }
    }
  });

  router.get('/agencies/:agencyId/personnel', hasAgencyAccess, async (req: Request, res: Response) => {
    try {
      const personnel = await storage.listPersonnel(req.params.agencyId);
      res.json(personnel);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch personnel' });
    }
  });

  // Event Routes
  router.post('/events', isAuthenticated, async (req: Request, res: Response) => {
    try {
      console.log('POST /events - Request body:', req.body);
      console.log('Authenticated user:', req.user);

      // Use storage interface to create the event
      // Convert the date and time into a proper timestamp
      const date = req.body.date;
      const time = req.body.time || '00:00';
      
      // Parse the date components for better timezone handling
      const [year, month, day] = date.split('-').map(Number);
      const [hours, minutes] = time.split(':').map(Number);
      
      // Create date in UTC to avoid timezone issues
      const startDate = new Date(Date.UTC(year, month - 1, day, hours, minutes));
      console.log(`Created event date: ${startDate.toISOString()} from components: year=${year}, month=${month-1}, day=${day}, hours=${hours}, minutes=${minutes}`);
      
      const eventData = {
        title: req.body.title,
        description: req.body.description,
        startDate: startDate,
        location: req.body.location,
        userId: req.user!.id,
        // Add any other fields from req.body that might be needed
      };

      const event = await storage.createEvent(eventData);
      console.log('Event created successfully:', event);
      res.status(201).json(event);
    } catch (error) {
      console.error('Failed to create event:', error);
      res.status(500).json({ error: 'Failed to create event' });
    }
  });

  router.get('/events', isAuthenticated, async (req: Request, res: Response) => {
    try {
      console.log('GET /events - Fetching events for user:', req.user!.id);
      
      // Use the storage.listEvents method instead of direct db query
      const events = await storage.listEvents(req.user!.id);
      console.log('Events retrieved:', events);
      res.json(events);
    } catch (error) {
      console.error('Failed to fetch events:', error);
      res.status(500).json({ error: 'Failed to fetch events' });
    }
  });

  router.put('/events/:id', isAuthenticated, async (req: Request, res: Response) => {
    try {
      console.log(`PUT /events/${req.params.id} - Request body:`, req.body);

      // First check if event exists
      const event = await storage.getEvent(req.params.id);
      
      if (!event) {
        console.log('Event not found');
        return res.status(404).json({ error: 'Event not found' });
      }
      
      // Check if the user owns this event
      if (event.userId !== req.user!.id) {
        console.log('Unauthorized update attempt');
        return res.status(403).json({ error: 'Not authorized to update this event' });
      }

      // Update the event using the storage interface
      const updatedEvent = await storage.updateEvent(req.params.id, req.body);
      
      console.log('Event updated successfully:', updatedEvent);
      res.json(updatedEvent);
    } catch (error) {
      console.error('Failed to update event:', error);
      res.status(500).json({ error: 'Failed to update event' });
    }
  });

  router.delete('/events/:id', isAuthenticated, async (req: Request, res: Response) => {
    try {
      console.log(`DELETE /events/${req.params.id} - Request from user:`, req.user!.id);

      // First check if event exists
      const event = await storage.getEvent(req.params.id);
      
      if (!event) {
        console.log('Event not found');
        return res.status(404).json({ error: 'Event not found' });
      }
      
      // Check if the user owns this event
      if (event.userId !== req.user!.id) {
        console.log('Unauthorized deletion attempt');
        return res.status(403).json({ error: 'Not authorized to delete this event' });
      }

      // Delete the event using the storage interface
      await storage.deleteEvent(req.params.id);
      
      console.log('Event deleted successfully');
      res.status(204).send();
    } catch (error) {
      console.error('Failed to delete event:', error);
      res.status(500).json({ error: 'Failed to delete event' });
    }
  });

  // Question Category Routes
  router.get('/question-categories', isAuthenticated, async (req: Request, res: Response) => {
    try {
      const categories = await storage.listQuestionCategories();
      res.json(categories);
    } catch (error) {
      console.error('Failed to fetch question categories:', error);
      res.status(500).json({ error: 'Failed to fetch question categories' });
    }
  });

  // Questions Routes
  router.get('/questions', isAuthenticated, async (req: Request, res: Response) => {
    try {
      const categoryId = req.query.categoryId as string | undefined;
      const questions = await storage.listQuestions(categoryId);
      res.json(questions);
    } catch (error) {
      console.error('Failed to fetch questions:', error);
      res.status(500).json({ error: 'Failed to fetch questions' });
    }
  });

  // Assessment Response Routes
  router.post('/assessment-responses', isAuthenticated, async (req: Request, res: Response) => {
    try {
      const responseData = insertAssessmentResponseSchema.parse(req.body);
      
      // Check if the assessment exists and belongs to user's agency (if agency user)
      const assessment = await storage.getAssessment(responseData.assessmentId);
      if (!assessment) {
        return res.status(404).json({ error: 'Assessment not found' });
      }
      
      // If user is agency, verify they have access to this assessment's agency
      if (req.user?.role === 'agency' && req.user.agencyId !== assessment.agencyId) {
        console.log('Unauthorized assessment response attempt', {
          userId: req.user.id,
          userAgencyId: req.user.agencyId,
          assessmentAgencyId: assessment.agencyId
        });
        return res.status(403).json({ error: 'You do not have permission to submit responses for this assessment' });
      }
      
      // Check if the question exists
      const question = await storage.getQuestion(responseData.questionId);
      if (!question) {
        return res.status(404).json({ error: 'Question not found' });
      }
      
      console.log('Creating assessment response:', {
        assessmentId: responseData.assessmentId,
        questionId: responseData.questionId,
        response: responseData.response
      });
      
      // Check if response already exists for this question in this assessment
      const existingResponses = await storage.listAssessmentResponses(responseData.assessmentId);
      const existingResponse = existingResponses.find(resp => resp.questionId === responseData.questionId);
      
      let response;
      if (existingResponse) {
        // Update existing response
        console.log('Updating existing response:', existingResponse.id);
        response = await storage.updateAssessmentResponse(existingResponse.id, {
          response: responseData.response,
          textResponse: responseData.textResponse,
          numericResponse: responseData.numericResponse,
          selectResponse: responseData.selectResponse,
          notes: responseData.notes
        });
      } else {
        // Create new response
        response = await storage.createAssessmentResponse(responseData);
      }

      // Update assessment progress
      const allResponses = await storage.listAssessmentResponses(responseData.assessmentId);
      const allQuestions = await storage.listQuestions();
      const progressPercentage = Math.round((allResponses.length / allQuestions.length) * 100);
      
      console.log('Updating assessment progress:', {
        assessmentId: responseData.assessmentId,
        responsesCount: allResponses.length,
        questionsCount: allQuestions.length,
        progressPercentage
      });

      await storage.updateAssessment(responseData.assessmentId, {
        progressPercentage,
        status: progressPercentage === 100 ? 'completed' : 'in_progress'
      });

      res.status(201).json(response);
    } catch (error) {
      console.error('Failed to create assessment response:', error);
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: error.errors });
      } else {
        res.status(500).json({ error: 'Failed to create assessment response' });
      }
    }
  });

  // Get all assessment responses (for admin view)
  router.get('/assessment-responses', isAdmin, async (req: Request, res: Response) => {
    try {
      console.log('Admin requesting all assessment responses');
      // Get all agencies first
      const agencies = await storage.listAgencies();
      
      // Collect responses for all assessments across all agencies
      const allResponses = [];
      
      // For each agency, get all their assessments and responses
      for (const agency of agencies) {
        try {
          // Get assessments for this agency
          const agencyAssessments = await storage.listAssessments(agency.id);
          
          // Get responses for each assessment
          for (const assessment of agencyAssessments) {
            try {
              const responses = await storage.listAssessmentResponses(assessment.id);
              allResponses.push(...responses);
            } catch (assessmentError) {
              console.warn(`Error fetching responses for assessment ${assessment.id}:`, assessmentError);
              // Continue with other assessments
            }
          }
        } catch (agencyError) {
          console.warn(`Error fetching assessments for agency ${agency.id}:`, agencyError);
          // Continue with other agencies
        }
      }
      
      res.json(allResponses);
    } catch (error) {
      console.error('Failed to fetch all assessment responses:', error);
      res.status(500).json({ error: 'Failed to fetch all assessment responses' });
    }
  });

  // Get responses for a specific assessment
  router.get('/assessment-responses/:assessmentId', isAuthenticated, async (req: Request, res: Response) => {
    try {
      // Get the assessment to check permissions
      const assessment = await storage.getAssessment(req.params.assessmentId);
      
      if (!assessment) {
        return res.status(404).json({ error: 'Assessment not found' });
      }
      
      // Check if user has access to this assessment
      if (req.user?.role !== 'admin' && req.user?.agencyId !== assessment.agencyId) {
        console.log('Unauthorized assessment response access attempt', {
          userId: req.user?.id,
          userAgencyId: req.user?.agencyId,
          assessmentAgencyId: assessment.agencyId
        });
        return res.status(403).json({ error: 'You do not have permission to access responses for this assessment' });
      }
      
      console.log(`Fetching responses for assessment ${req.params.assessmentId} by user ${req.user?.id}`);
      const responses = await storage.listAssessmentResponses(req.params.assessmentId);
      console.log(`Found ${responses.length} responses for assessment ${req.params.assessmentId}`);
      
      res.json(responses);
    } catch (error) {
      console.error('Failed to fetch assessment responses:', error);
      res.status(500).json({ error: 'Failed to fetch assessment responses' });
    }
  });

  // Reports Routes
  router.get('/reports', isAuthenticated, async (req: Request, res: Response) => {
    try {
      console.log('GET /reports - Fetching reports');

      // If user is admin, get all reports, otherwise filter by agency
      let reports;
      if (req.user?.role === 'admin') {
        reports = await storage.listReports();
      } else if (req.user?.agencyId) {
        reports = await storage.listReportsByAgencyId(req.user.agencyId);
      } else {
        return res.status(403).json({ error: 'Unauthorized access to reports' });
      }

      // Enrich reports with agency information
      const enrichedReports = await Promise.all(
        reports.map(async (report) => {
          console.log(`Processing report: ${report.id}, assessmentId: ${report.assessmentId}`);
          
          const assessment = await storage.getAssessment(report.assessmentId);
          console.log(`Found assessment: ${assessment ? 'Yes' : 'No'}${assessment ? ', agencyId: ' + assessment.agencyId : ''}`);
          
          let agency = null;
          if (assessment && assessment.agencyId) {
            agency = await storage.getAgency(assessment.agencyId);
            console.log(`Found agency: ${agency ? 'Yes' : 'No'}${agency ? ', name: ' + agency.name : ''}`);
          }
          
          return {
            ...report,
            agencyId: assessment?.agencyId || null,
            agencyName: agency?.name || 'Unknown Agency',
            assessmentName: assessment?.name || 'Unknown Assessment',
            assessmentType: assessment?.assessmentType || report.reportType || 'tier-assessment',
            assessmentDate: assessment?.startedAt || null,
            tierClassification: report.tierLevel || (assessment?.tierLevel || 0)
          };
        })
      );

      console.log('Reports retrieved:', enrichedReports.length);
      res.json(enrichedReports);
    } catch (error) {
      console.error('Failed to fetch reports:', error);
      res.status(500).json({ error: 'Failed to fetch reports' });
    }
  });

  // TIER ASSESSMENT REPORT GENERATION
  router.post('/reports/:assessmentId/generate-tier-report', isAuthenticated, async (req: Request, res: Response) => {
    try {
      console.log(`POST /reports/${req.params.assessmentId}/generate-tier-report`);

      // Get the assessment
      const assessment = await storage.getAssessment(req.params.assessmentId);
      if (!assessment) {
        return res.status(404).json({ error: 'Assessment not found' });
      }

      // Check user authorization
      if (req.user?.role !== 'admin' && req.user?.agencyId !== assessment.agencyId) {
        return res.status(403).json({ error: 'Not authorized to generate reports for this assessment' });
      }

      // Check if the assessment is complete enough
      if (assessment.progressPercentage && assessment.progressPercentage < 90) {
        return res.status(400).json({ error: 'Assessment must be at least 90% complete to generate a tier report' });
      }

      // Get all assessment responses
      const responses = await storage.listAssessmentResponses(assessment.id);
      const questions = await storage.listQuestions();

      // Calculate tier level based on responses
      let tierLevel = 1;
      // Since impactsTier might not be in our schema yet, we'll assume all questions impact the tier
      const tierImpactingQuestions = questions;
      const positiveResponses = responses.filter(r => 
        r.response === true && 
        tierImpactingQuestions.some(q => q.id === r.questionId)
      );

      const positiveResponsePercentage = 
        (positiveResponses.length / tierImpactingQuestions.length) * 100;

      if (positiveResponsePercentage >= 90) tierLevel = 1;
      else if (positiveResponsePercentage >= 75) tierLevel = 2;
      else if (positiveResponsePercentage >= 50) tierLevel = 3;
      else tierLevel = 4;

      // Update assessment with tier level
      await storage.updateAssessment(assessment.id, { tierLevel });

      // Generate report summary
      const agency = await storage.getAgency(assessment.agencyId);
      // Format date safely
      const assessmentDate = assessment.startedAt 
        ? new Date(assessment.startedAt).toLocaleDateString() 
        : 'Not set';
        
      const summary = `
SWAT Team Tier Assessment Report
Agency: ${agency?.name}
Tier Classification: ${tierLevel}
Assessment Date: ${assessmentDate}
Completion: ${assessment.progressPercentage}%

Summary:
This assessment has determined that the ${agency?.name} SWAT team meets the criteria for a Tier ${tierLevel} classification. The team has successfully demonstrated compliance with ${positiveResponses.length} out of ${tierImpactingQuestions.length} critical capability requirements.

Recommendations:
${tierLevel > 1 ? `To achieve a higher tier classification, focus on the following areas:
${tierImpactingQuestions
  .filter(q => !positiveResponses.some(r => r.questionId === q.id))
  .slice(0, 3)
  .map(q => `- ${q.text}`)
  .join('\n')}` : 'Maintain current capabilities and continue regular training to sustain Tier 1 status.'}
      `;

      // Create a dummy report file for demo purposes
      // In a real implementation, this would generate a PDF using a library
      const reportFilename = `tier_report_${assessment.id}_${Date.now()}.pdf`;
      
      // Use fileURLToPath and dirname from 'path' to get the directory path in ESM
      const filePath = fileURLToPath(import.meta.url);
      const dirPath = path.dirname(filePath);
      
      const reportPath = path.join(dirPath, '../reports', reportFilename);

      // Make sure the reports directory exists
      const reportsDir = path.join(dirPath, '../reports');
      if (!fs.existsSync(reportsDir)) {
        fs.mkdirSync(reportsDir, { recursive: true });
      }

      // Create a proper PDF document using PDFKit
      const doc = new PDFDocument();
      // Create a write stream for the PDF file
      const writeStream = fs.createWriteStream(reportPath);
      doc.pipe(writeStream);
      
      // Add title and header
      doc.fontSize(20).text('SWAT TIER LEVEL ASSESSMENT REPORT', { align: 'center' });
      doc.moveDown();
      doc.fontSize(16).text(`Agency: ${agency?.name || 'Unknown Agency'}`, { align: 'left' });
      doc.moveDown();
      doc.fontSize(14).text(`Assessment Date: ${new Date().toLocaleDateString()}`, { align: 'left' });
      doc.fontSize(14).text(`Tier Level: ${tierLevel || 'Not determined'}`, { align: 'left' });
      doc.moveDown(2);
      
      // Assessment summary
      doc.fontSize(16).text('Assessment Summary', { align: 'left', underline: true });
      doc.moveDown();
      doc.fontSize(12).text(summary || 'No summary provided');
      doc.moveDown(2);
      
      // Add assessment details if available
      doc.fontSize(16).text('Assessment Details', { align: 'left', underline: true });
      doc.moveDown();
      
      // Get the categories and organize questions by category
      const categories = await storage.listQuestionCategories();
      
      // Sort categories by orderIndex for proper display
      const sortedCategories = categories.sort((a, b) => a.orderIndex - b.orderIndex);
      
      // Filter questions to include only Tier Assessment questions
      // Define a comprehensive list of Gap Analysis categories to exclude
      const gapAnalysisCategories = [
        'Team Structure and Chain of Command', 
        'Supervisor-to-Operator Ratio', 
        'Span of Control Adjustments for Complex Operations',
        'Training and Evaluation of Leadership',
        'Equipment Procurement and Allocation',
        'Equipment Maintenance and Inspection',
        'Equipment Inventory Management',
        'Standard Operating Guidelines (SOGs)'
      ];
      
      // Filter categories to exclude Gap Analysis categories by exact name match
      const tierCategories = sortedCategories.filter(cat => 
        !gapAnalysisCategories.includes(cat.name) && 
        !cat.name.includes('Gap Analysis')
      );
      
      // For each category, add section with questions and responses
      for (const category of tierCategories) {
        // Get questions for this category
        const categoryQuestions = questions.filter(q => q.categoryId === category.id);
        
        if (categoryQuestions.length === 0) continue;
        
        // Add category header
        doc.fontSize(14).text(category.name, { align: 'left', underline: true });
        doc.moveDown();
        
        // Add questions and responses for this category
        for (const question of categoryQuestions) {
          const response = responses.find(r => r.questionId === question.id);
          
          // Only include questions that have been answered
          if (response) {
            doc.fontSize(12).text(question.text, { align: 'left' });
            
            // Format the response based on its type
            let responseText = '';
            
            // Log details for supervisor-to-operator ratio questions for debugging
            if (question.text.toLowerCase().includes('supervisor-to-operator ratio')) {
              console.log('Found supervisor-to-operator ratio question in tier report:', {
                questionId: question.id,
                questionText: question.text,
                response: response.response,
                textResponse: response.textResponse,
                numericResponse: response.numericResponse,
                selectResponse: response.selectResponse
              });
            }
            
            if (response.response === true) responseText = 'Yes';
            else if (response.response === false) responseText = 'No';
            else if (response.textResponse) responseText = response.textResponse;
            else if (response.numericResponse !== null && response.numericResponse !== undefined) responseText = response.numericResponse.toString();
            else if (response.selectResponse) responseText = response.selectResponse;
            else responseText = 'Not specified';
            
            doc.fontSize(12).text(`○ ${responseText}`, { align: 'left', indent: 20 });
            
            // Add notes if available
            if (response.notes) {
              doc.fontSize(10).text(`Notes: ${response.notes}`, { align: 'left', indent: 20 });
            }
            
            doc.moveDown();
          }
        }
        
        doc.moveDown();
      }
      
      // Finalize the PDF
      doc.end();
      
      // Wait for the file to finish writing
      await new Promise<void>((resolve, reject) => {
        writeStream.on('finish', () => resolve());
        writeStream.on('error', reject);
      });

      // Create report record in database
      const report = await storage.createReport({
        assessmentId: assessment.id,
        reportType: 'tier-assessment',
        tierLevel,
        reportUrl: `/reports/${reportFilename}`,
        generatedAt: new Date().toISOString(), // Use string for date
        summary
      });

      console.log('Tier Assessment Report generated successfully:', report);
      res.status(201).json(report);
    } catch (error) {
      console.error('Failed to generate tier assessment report:', error);
      res.status(500).json({ 
        error: 'Failed to generate tier assessment report',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });
  
  // GAP ANALYSIS REPORT GENERATION
  router.post('/reports/:assessmentId/generate-gap-report', isAuthenticated, async (req: Request, res: Response) => {
    try {
      console.log(`POST /reports/${req.params.assessmentId}/generate-gap-report`);

      // Get the assessment
      const assessment = await storage.getAssessment(req.params.assessmentId);
      if (!assessment) {
        return res.status(404).json({ error: 'Assessment not found' });
      }

      // Check user authorization
      if (req.user?.role !== 'admin' && req.user?.agencyId !== assessment.agencyId) {
        return res.status(403).json({ error: 'Not authorized to generate gap reports for this assessment' });
      }

      // Check if the assessment is complete enough
      if (assessment.progressPercentage && assessment.progressPercentage < 75) {
        return res.status(400).json({ error: 'Assessment must be at least 75% complete to generate a gap analysis report' });
      }

      // Get all assessment responses
      const responses = await storage.listAssessmentResponses(assessment.id);
      console.log(`Found ${responses.length} responses for assessment ${assessment.id}`);
      
      const questions = await storage.listQuestions();
      console.log(`Found ${questions.length} total questions in the system`);
      
      const categories = await storage.listQuestionCategories();
      console.log(`Found ${categories.length} question categories`);
      
      const agency = await storage.getAgency(assessment.agencyId);
      
      // Current date in format [Month Day, Year]
      const currentDate = new Date().toLocaleDateString('en-US', {
        month: 'long',
        day: 'numeric',
        year: 'numeric'
      });

      // Format report header
      let reportContent = `SWAT GAP ANALYSIS REPORT\n`;
      reportContent += `Prepared for: ${agency?.name}\n`;
      reportContent += `Date: ${currentDate}\n`;
      reportContent += `Assessed By: SWAT Accreditation Platform\n\n`;

      // Group questions and responses by category
      const categorizedQuestionsAndResponses: Record<string, Array<{question: string, response: string, notes: string}>> = {};
      
      // Define Gap Analysis categories by exact name
      const gapAnalysisCategoryNames = [
        'Team Structure and Chain of Command', 
        'Supervisor-to-Operator Ratio', 
        'Span of Control Adjustments for Complex Operations',
        'Training and Evaluation of Leadership',
        'Equipment Procurement and Allocation',
        'Equipment Maintenance and Inspection',
        'Equipment Inventory Management',
        'Standard Operating Guidelines (SOGs)'
      ];
      
      // Filter categories to include only Gap Analysis categories using exact name matching
      const gapAnalysisCategories = categories.filter(cat => 
        gapAnalysisCategoryNames.includes(cat.name)
      );
      
      console.log(`Found ${gapAnalysisCategories.length} Gap Analysis categories out of ${categories.length} total categories`);
      
      // Sort the categories by their orderIndex
      gapAnalysisCategories.sort((a, b) => a.orderIndex - b.orderIndex);
      
      // Process each Gap Analysis category and its questions
      for (const category of gapAnalysisCategories) {
        console.log(`Processing Gap Analysis category: ${category.name} (ID: ${category.id})`);
        
        const categoryQuestions = questions.filter(q => q.categoryId === category.id);
        console.log(`Category ${category.name} has ${categoryQuestions.length} questions`);
        
        if (categoryQuestions.length === 0) continue;
        
        // Create category section in report
        categorizedQuestionsAndResponses[category.name] = [];
        
        // Add questions and responses for this category
        for (const question of categoryQuestions) {
          const response = responses.find(r => r.questionId === question.id);
          
          // If this question was answered, add it to the report
          if (response) {
            console.log(`Adding question to report: ${question.text.substring(0, 30)}...`);
            
            let responseValue = "Not Specified";
            
            // Log details for supervisor-to-operator ratio questions for debugging
            if (question.text.toLowerCase().includes('supervisor-to-operator ratio')) {
              console.log('Found supervisor-to-operator ratio question:', {
                questionId: question.id,
                questionText: question.text,
                response: response.response,
                textResponse: response.textResponse,
                numericResponse: response.numericResponse,
                selectResponse: response.selectResponse
              });
            }
            
            // Handle different response types
            if (response.response === true) {
              responseValue = "Yes";
            } else if (response.response === false) {
              responseValue = "No";
            } else if (response.textResponse) {
              responseValue = response.textResponse;
            } else if (response.numericResponse !== null && response.numericResponse !== undefined) {
              responseValue = response.numericResponse.toString();
            } else if (response.selectResponse) {
              responseValue = response.selectResponse;
            }
            
            categorizedQuestionsAndResponses[category.name].push({
              question: question.text,
              response: responseValue,
              notes: response?.notes || ""
            });
          } else {
            console.log(`Question not answered: ${question.text.substring(0, 30)}...`);
          }
        }
        
        // If no questions were answered in this category, remove it
        if (categorizedQuestionsAndResponses[category.name].length === 0) {
          console.log(`No answered questions in category ${category.name}, removing from report`);
          delete categorizedQuestionsAndResponses[category.name];
        }
      }

      // Build the formatted report content
      for (const [categoryName, questionResponses] of Object.entries(categorizedQuestionsAndResponses)) {
        // Add category header
        reportContent += `${categoryName}\n`;
        
        // Add questions and responses
        for (const item of questionResponses as Array<{question: string, response: string, notes: string}>) {
          reportContent += `${item.question}\n`;
          reportContent += `○ ${item.response}\n`;
          if (item.notes) {
            reportContent += `Notes: ${item.notes}\n`;
          }
        }
        
        reportContent += "\n"; // Add space between categories
      }

      // Add closing note
      reportContent += `This ${agency?.name} SWAT Gap Analysis Report contains only the questions and answers as requested.`;

      // Create a report file
      const reportFilename = `gap_report_${assessment.id}_${Date.now()}.pdf`;
      
      // Use fileURLToPath and dirname from 'path' to get the directory path in ESM
      const filePath = fileURLToPath(import.meta.url);
      const dirPath = path.dirname(filePath);
      
      const reportPath = path.join(dirPath, '../reports', reportFilename);

      // Make sure the reports directory exists
      const reportsDir = path.join(dirPath, '../reports');
      if (!fs.existsSync(reportsDir)) {
        fs.mkdirSync(reportsDir, { recursive: true });
      }

      // Create a proper PDF document using PDFKit
      const doc = new PDFDocument();
      // Create a write stream for the PDF file
      const writeStream = fs.createWriteStream(reportPath);
      doc.pipe(writeStream);
      
      // Add title and header
      doc.fontSize(20).text('SWAT GAP ANALYSIS REPORT', { align: 'center' });
      doc.moveDown();
      doc.fontSize(16).text(`Prepared for: ${agency?.name || 'Unknown Agency'}`, { align: 'left' });
      doc.moveDown();
      doc.fontSize(14).text(`Date: ${currentDate}`, { align: 'left' });
      doc.fontSize(14).text(`Assessed By: SWAT Accreditation Platform`, { align: 'left' });
      doc.moveDown(2);
      
      // Add categorized questions and responses
      for (const [categoryName, questionResponses] of Object.entries(categorizedQuestionsAndResponses)) {
        // Add category header
        doc.fontSize(16).text(categoryName, { align: 'left', underline: true });
        doc.moveDown();
        
        // Add questions and responses
        for (const item of questionResponses as Array<{question: string, response: string, notes: string}>) {
          doc.fontSize(12).text(item.question, { align: 'left' });
          doc.fontSize(12).text(`○ ${item.response}`, { align: 'left', indent: 20 });
          if (item.notes) {
            doc.fontSize(10).text(`Notes: ${item.notes}`, { align: 'left', indent: 20 });
          }
          doc.moveDown();
        }
        
        doc.moveDown();
      }
      
      // Add closing note
      doc.moveDown();
      doc.fontSize(12).text(`This ${agency?.name} SWAT Gap Analysis Report contains only the questions and answers as requested.`);
      
      // Finalize the PDF
      doc.end();
      
      // Wait for the file to finish writing
      await new Promise<void>((resolve, reject) => {
        writeStream.on('finish', () => resolve());
        writeStream.on('error', reject);
      });

      // Create report record in database
      const report = await storage.createReport({
        assessmentId: assessment.id,
        reportType: 'gap-analysis',
        tierLevel: assessment.tierLevel || null,
        reportUrl: `/reports/${reportFilename}`,
        generatedAt: new Date().toISOString(),
        summary: `Gap Analysis Report for ${agency?.name}` // Simplified summary
      });

      console.log('Gap Analysis Report generated successfully:', report);
      res.status(201).json(report);
    } catch (error) {
      console.error('Failed to generate gap analysis report:', error);
      res.status(500).json({ 
        error: 'Failed to generate gap analysis report',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // Helper function to find a valid path for a report file
  function findReportFilePath(reportUrl: string): string | null {
    // Try all possible paths for the report file
    const possiblePaths = [];
    
    // Try the absolute path first
    possiblePaths.push(reportUrl);
    
    // Try the path relative to the current directory
    possiblePaths.push(path.join(process.cwd(), reportUrl));
    
    // Try the path relative to the reports directory
    possiblePaths.push(path.join(process.cwd(), 'reports', path.basename(reportUrl)));
    
    // Get the server directory path and try there
    const filePath = fileURLToPath(import.meta.url);
    const dirPath = path.dirname(filePath);
    possiblePaths.push(path.join(dirPath, '..', reportUrl));
    
    // Try finding the file in one of these paths
    for (const possiblePath of possiblePaths) {
      console.log(`Checking if report file exists at: ${possiblePath}`);
      if (fs.existsSync(possiblePath)) {
        console.log(`Found report file at: ${possiblePath}`);
        return possiblePath;
      }
    }
    
    return null;
  }

  // Helper function to stream report file to response
  function streamReportFile(reportPath: string, report: Report, res: Response) {
    try {
      const fileExt = path.extname(reportPath).toLowerCase();
      const contentType = fileExt === '.pdf' ? 'application/pdf' : 
                         fileExt === '.docx' ? 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' : 
                         'application/octet-stream';
      
      res.setHeader('Content-Type', contentType);
      res.setHeader('Content-Disposition', `attachment; filename="report_${report.id}${fileExt || '.pdf'}"`);
      
      console.log(`Streaming report file from ${reportPath} with content type ${contentType}`);
      const fileStream = fs.createReadStream(reportPath);
      
      fileStream.on('error', (err) => {
        console.error(`Error streaming file: ${err.message}`);
        if (!res.headersSent) {
          res.status(500).json({ 
            error: 'Failed to stream report file',
            details: err.message
          });
        }
      });
      
      fileStream.pipe(res);
      return true;
    } catch (streamError) {
      console.error('Error in streamReportFile:', streamError);
      if (!res.headersSent) {
        res.status(500).json({ 
          error: 'Failed to prepare report file for download',
          details: streamError instanceof Error ? streamError.message : 'Unknown error'
        });
      }
      return false;
    }
  }

  router.get('/reports/:reportId/download', isAuthenticated, async (req: Request, res: Response) => {
    try {
      console.log(`GET /reports/${req.params.reportId}/download - User: ${req.user?.id}, Role: ${req.user?.role}`);

      // Get the report
      const report = await storage.getReport(req.params.reportId);
      console.log('Report found:', report ? 'Yes' : 'No', report?.id);
      if (!report) {
        return res.status(404).json({ error: 'Report not found' });
      }

      // Check user authorization
      const assessment = await storage.getAssessment(report.assessmentId);
      if (!assessment) {
        return res.status(404).json({ error: 'Associated assessment not found' });
      }

      const agency = await storage.getAgency(assessment.agencyId);
      console.log(`Report download - Assessment: ${assessment.id}, Agency: ${assessment.agencyId}, User agency: ${req.user?.agencyId}, User role: ${req.user?.role}`);

      // Allow admin to download any report, but agency users can only download their own
      if (req.user?.role !== 'admin' && req.user?.agencyId !== assessment.agencyId) {
        console.error('Unauthorized report download attempt:', {
          reportId: report.id,
          userRole: req.user?.role,
          userAgencyId: req.user?.agencyId,
          reportAgencyId: assessment.agencyId
        });
        return res.status(403).json({ error: 'Not authorized to download this report' });
      }

      // Check if report file exists
      console.log('Report URL:', report.reportUrl);
      if (!report.reportUrl) {
        return res.status(404).json({ error: 'Report file not found' });
      }

      // Try all possible paths for the report file
      const possiblePaths = [];
      
      // Try the absolute path first
      possiblePaths.push(report.reportUrl);
      
      // Try the path relative to the current directory
      possiblePaths.push(path.join(process.cwd(), report.reportUrl));
      
      // Try the path relative to the reports directory
      possiblePaths.push(path.join(process.cwd(), 'reports', path.basename(report.reportUrl)));
      
      // Get the server directory path and try there
      const filePath = fileURLToPath(import.meta.url);
      const dirPath = path.dirname(filePath);
      possiblePaths.push(path.join(dirPath, '..', report.reportUrl));
      
      // Try finding the file in one of these paths
      let reportPath = '';
      
      for (const possiblePath of possiblePaths) {
        console.log(`Checking if report file exists at: ${possiblePath}`);
        if (fs.existsSync(possiblePath)) {
          reportPath = possiblePath;
          console.log(`Found report file at: ${reportPath}`);
          break;
        }
      }
      
      // If the file is found, stream it to the response
      if (reportPath && fs.existsSync(reportPath)) {
        const fileExt = path.extname(reportPath).toLowerCase();
        const contentType = fileExt === '.pdf' ? 'application/pdf' : 
                           fileExt === '.docx' ? 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' : 
                           'application/octet-stream';
        
        res.setHeader('Content-Type', contentType);
        res.setHeader('Content-Disposition', `attachment; filename="report_${report.id}${fileExt || '.pdf'}"`);
        
        const fileStream = fs.createReadStream(reportPath);
        
        fileStream.on('error', (err) => {
          console.error(`Error streaming file: ${err.message}`);
          if (!res.headersSent) {
            res.status(500).json({ 
              error: 'Failed to stream report file',
              details: err.message
            });
          }
        });
        
        return fileStream.pipe(res);
      } else {
        // If the file doesn't exist, create a proper PDF file
        console.log(`Report file not found, creating a replacement PDF`);
        
        // Make sure the reports directory exists
        const reportsDir = path.join(process.cwd(), 'reports');
        if (!fs.existsSync(reportsDir)) {
          fs.mkdirSync(reportsDir, { recursive: true });
        }
        
        // Create a new report path
        reportPath = path.join(reportsDir, `report_${report.id}_${Date.now()}.pdf`);

        // Create a proper PDF document using PDFKit
        const doc = new PDFDocument();
        const writeStream = fs.createWriteStream(reportPath);
        doc.pipe(writeStream);
        
        // Get all assessment responses, questions, and categories
        const responses = await storage.listAssessmentResponses(assessment.id);
        const questions = await storage.listQuestions();
        const categories = await storage.listQuestionCategories();
        
        if (report.reportType === 'tier-assessment') {
          // Add title and header for Tier Assessment
          doc.fontSize(20).text('SWAT TIER LEVEL ASSESSMENT REPORT', { align: 'center' });
          doc.moveDown();
          doc.fontSize(16).text(`Agency: ${agency?.name || 'Unknown Agency'}`, { align: 'left' });
          doc.moveDown();
          doc.fontSize(14).text(`Replacement Report Generated: ${new Date().toLocaleDateString()}`, { align: 'left' });
          doc.fontSize(14).text(`Tier Level: ${report.tierLevel || 'Not determined'}`, { align: 'left' });
          doc.moveDown(2);
          
          // Note about replacement
          doc.fontSize(12).text('Note: This is a replacement report. The original report file was not found in the system.', { align: 'left' });
          doc.moveDown();
            
          // Add summary if available
          if (report.summary) {
            doc.fontSize(16).text('Assessment Summary', { align: 'left', underline: true });
            doc.moveDown();
            doc.fontSize(12).text(report.summary);
            doc.moveDown(2);
          }
          
          // Add assessment details section with questions and answers
          doc.fontSize(16).text('Assessment Details', { align: 'left', underline: true });
          doc.moveDown();
          
          // Sort categories by orderIndex for proper display
          const sortedCategories = categories.sort((a, b) => a.orderIndex - b.orderIndex);
          
          // Define known Gap Analysis categories to exclude from Tier Assessment report
          const gapAnalysisCategoryIds = ['team-leadership', 'supervisor-ratio', 'span-control', 'training-leadership', 'equipment-procurement', 'equipment-maintenance', 'equipment-inventory', 'sogs'];
          
          // Filter categories to exclude Gap Analysis categories
          const tierCategories = sortedCategories.filter(cat => 
            !gapAnalysisCategoryIds.includes(cat.id) && 
            !cat.name.includes('Gap Analysis')
          );
          
          // For each category, add section with questions and responses
          for (const category of tierCategories) {
            // Get questions for this category
            const categoryQuestions = questions.filter(q => q.categoryId === category.id);
            
            if (categoryQuestions.length === 0) continue;
            
            // Add category header
            doc.fontSize(14).text(category.name, { align: 'left', underline: true });
            doc.moveDown();
              
            // Add questions and responses for this category
            for (const question of categoryQuestions) {
              const response = responses.find(r => r.questionId === question.id);
              
              // Only include questions that have been answered
              if (response) {
                doc.fontSize(12).text(question.text, { align: 'left' });
                
                // Format the response based on its type
                let responseText = '';
                if (response.response === true) responseText = 'Yes';
                else if (response.response === false) responseText = 'No';
                else if (response.textResponse) responseText = response.textResponse;
                else if (response.numericResponse !== null) responseText = response.numericResponse.toString();
                else if (response.selectResponse) responseText = response.selectResponse;
                else responseText = 'Not specified';
                
                doc.fontSize(12).text(`○ ${responseText}`, { align: 'left', indent: 20 });
                
                // Add notes if available
                if (response.notes) {
                  doc.fontSize(10).text(`Notes: ${response.notes}`, { align: 'left', indent: 20 });
                }
                
                doc.moveDown();
              }
            }
            
            doc.moveDown();
          }
        } else {
          // Add title and header for Gap Analysis
          doc.fontSize(20).text('SWAT GAP ANALYSIS REPORT', { align: 'center' });
          doc.moveDown();
          doc.fontSize(16).text(`Prepared for: ${agency?.name || 'Unknown Agency'}`, { align: 'left' });
          doc.moveDown();
          doc.fontSize(14).text(`Replacement Report Generated: ${new Date().toLocaleDateString()}`, { align: 'left' });
          doc.fontSize(14).text(`Assessed By: SWAT Accreditation Platform`, { align: 'left' });
          doc.moveDown(2);
          
          // Note about replacement
          doc.fontSize(12).text('Note: This is a replacement report. The original report file was not found in the system.', { align: 'left' });
          doc.moveDown();
          
          // Add summary if available
          if (report.summary) {
            doc.fontSize(16).text('Assessment Summary', { align: 'left', underline: true });
            doc.moveDown();
            doc.fontSize(12).text(report.summary);
            doc.moveDown(2);
          }
          
          // Add assessment details section with questions and answers
          doc.fontSize(16).text('Gap Analysis Details', { align: 'left', underline: true });
          doc.moveDown();
          
          // Sort categories by orderIndex for proper display
          const sortedCategories = categories.sort((a, b) => a.orderIndex - b.orderIndex);
          
          // Define Gap Analysis categories by exact name
          const gapAnalysisCategoryNames = [
            'Team Structure and Chain of Command', 
            'Supervisor-to-Operator Ratio', 
            'Span of Control Adjustments for Complex Operations',
            'Training and Evaluation of Leadership',
            'Equipment Procurement and Allocation',
            'Equipment Maintenance and Inspection',
            'Equipment Inventory Management',
            'Standard Operating Guidelines (SOGs)'
          ];
          
          // Filter categories to include only Gap Analysis categories using exact name matching
          const gapAnalysisCategories = sortedCategories.filter(cat => 
            gapAnalysisCategoryNames.includes(cat.name)
          );
          
          // For each category, add section with questions and responses
          for (const category of gapAnalysisCategories) {
            // Get questions for this category
            const categoryQuestions = questions.filter(q => q.categoryId === category.id);
            
            if (categoryQuestions.length === 0) continue;
            
            // Add category header
            doc.fontSize(14).text(category.name, { align: 'left', underline: true });
            doc.moveDown();
            
            // Add questions and responses for this category
            for (const question of categoryQuestions) {
              const response = responses.find(r => r.questionId === question.id);
              
              // Only include questions that have been answered
              if (response) {
                doc.fontSize(12).text(question.text, { align: 'left' });
                
                // Format the response based on its type
                let responseText = '';
                if (response.response === true) responseText = 'Yes';
                else if (response.response === false) responseText = 'No';
                else if (response.textResponse) responseText = response.textResponse;
                else if (response.numericResponse !== null) responseText = response.numericResponse.toString();
                else if (response.selectResponse) responseText = response.selectResponse;
                else responseText = 'Not specified';
                
                doc.fontSize(12).text(`○ ${responseText}`, { align: 'left', indent: 20 });
                
                // Add notes if available
                if (response.notes) {
                  doc.fontSize(10).text(`Notes: ${response.notes}`, { align: 'left', indent: 20 });
                }
                
                doc.moveDown();
              }
            }
            
            doc.moveDown();
          }
        }
        
        // Finalize the PDF
        doc.end();
        
        // Wait for the file to finish writing
        await new Promise<void>((resolve, reject) => {
          writeStream.on('finish', () => resolve());
          writeStream.on('error', reject);
        });
        
        // Stream the newly generated PDF
        if (fs.existsSync(reportPath)) {
          res.setHeader('Content-Type', 'application/pdf');
          res.setHeader('Content-Disposition', `attachment; filename="report_${report.id}.pdf"`);
          const fileStream = fs.createReadStream(reportPath);
          fileStream.on('error', (err) => {
            console.error(`Error streaming generated file: ${err.message}`);
            if (!res.headersSent) {
              res.status(500).json({ 
                error: 'Failed to stream generated report file',
                details: err.message
              });
            }
          });
          return fileStream.pipe(res);
        } else {
          return res.status(500).json({ error: 'Failed to generate report file' });
        }
      }
    } catch (error) {
      console.error('Failed to download report:', error);
      res.status(500).json({ 
        error: 'Failed to download report',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // Update an existing report (metadata and/or content)
  router.patch('/reports/:reportId', isAuthenticated, async (req: Request, res: Response) => {
    try {
      console.log(`PATCH /reports/${req.params.reportId} - User: ${req.user?.id}, Role: ${req.user?.role}`);
      
      // Get the report
      const report = await storage.getReport(req.params.reportId);
      if (!report) {
        return res.status(404).json({ error: 'Report not found' });
      }
      
      // Check user authorization
      const assessment = await storage.getAssessment(report.assessmentId);
      if (!assessment) {
        return res.status(404).json({ error: 'Associated assessment not found' });
      }
      
      // Allow admin to update any report, but agency users can only update their own
      if (req.user?.role !== 'admin' && req.user?.agencyId !== assessment.agencyId) {
        console.error('Unauthorized report update attempt:', {
          reportId: report.id,
          userRole: req.user?.role,
          userAgencyId: req.user?.agencyId,
          reportAgencyId: assessment.agencyId
        });
        return res.status(403).json({ error: 'Not authorized to update this report' });
      }
      
      // Extract update data
      const { summary, tierLevel, reportType } = req.body;
      
      // Validate update data
      if (!summary && tierLevel === undefined && !reportType) {
        return res.status(400).json({ error: 'No update data provided' });
      }
      
      // Update the report
      const updatedReport = await storage.updateReport(req.params.reportId, {
        summary,
        tierLevel, 
        reportType
      });
      
      console.log('Report updated successfully:', updatedReport);
      res.status(200).json(updatedReport);
    } catch (error) {
      console.error('Failed to update report:', error);
      res.status(500).json({ 
        error: 'Failed to update report',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });
  
  // Upload a new report file
  router.post('/reports/:reportId/upload', isAuthenticated, async (req: Request, res: Response) => {
    try {
      console.log(`POST /reports/${req.params.reportId}/upload - User: ${req.user?.id}, Role: ${req.user?.role}`);
      
      // Get the report
      const report = await storage.getReport(req.params.reportId);
      if (!report) {
        return res.status(404).json({ error: 'Report not found' });
      }
      
      // Check user authorization
      const assessment = await storage.getAssessment(report.assessmentId);
      if (!assessment) {
        return res.status(404).json({ error: 'Associated assessment not found' });
      }
      
      // Allow admin to update any report, but agency users can only update their own
      if (req.user?.role !== 'admin' && req.user?.agencyId !== assessment.agencyId) {
        console.error('Unauthorized report upload attempt:', {
          reportId: report.id,
          userRole: req.user?.role,
          userAgencyId: req.user?.agencyId,
          reportAgencyId: assessment.agencyId
        });
        return res.status(403).json({ error: 'Not authorized to upload to this report' });
      }
      
      // Check if file data is in the request
      if (!req.body.fileData) {
        return res.status(400).json({ error: 'No file data provided' });
      }
      
      // Parse file data (base64 encoded)
      const fileData = req.body.fileData.split(',')[1]; // Remove data URL prefix if present
      if (!fileData) {
        return res.status(400).json({ error: 'Invalid file data format' });
      }
      
      // Get file extension
      const fileExt = req.body.fileType === 'application/pdf' ? '.pdf' : 
                     req.body.fileType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ? '.docx' : 
                     '.txt';
      
      // Create a new report URL with timestamp
      const timestamp = Date.now();
      const reportType = report.reportType || 'report';
      const newReportUrl = `/reports/${reportType}_${report.assessmentId}_${timestamp}${fileExt}`;
      
      // Get the actual file path
      const filePath = fileURLToPath(import.meta.url);
      const dirPath = path.dirname(filePath);
      const newReportPath = path.join(dirPath, '..', newReportUrl);
      
      // Make sure the reports directory exists
      const reportsDir = path.dirname(newReportPath);
      if (!fs.existsSync(reportsDir)) {
        fs.mkdirSync(reportsDir, { recursive: true });
      }
      
      // Write the file data
      fs.writeFileSync(newReportPath, Buffer.from(fileData, 'base64'));
      
      // Update the report with the new URL
      const updatedReport = await storage.updateReport(req.params.reportId, {
        reportUrl: newReportUrl
      });
      
      console.log('Report file uploaded successfully:', updatedReport);
      res.status(200).json(updatedReport);
    } catch (error) {
      console.error('Failed to upload report file:', error);
      res.status(500).json({ 
        error: 'Failed to upload report file',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // Direct Report Upload for Agency
  router.post('/agencies/:agencyId/reports/upload', isAdmin, reportUpload.single('reportFile'), async (req: Request, res: Response) => {
    try {
      console.log(`POST /agencies/${req.params.agencyId}/reports/upload - User: ${req.user?.id}, Role: ${req.user?.role}`);
      
      // Get the agency
      const agency = await storage.getAgency(req.params.agencyId);
      if (!agency) {
        return res.status(404).json({ error: 'Agency not found' });
      }
      
      // Check if file was uploaded
      if (!req.file) {
        return res.status(400).json({ error: 'No file was uploaded. Please select a file to upload.' });
      }
      
      // Validate request body
      if (!req.body.assessmentType) {
        return res.status(400).json({ error: 'Missing required field: assessmentType' });
      }
      
      // Tier level is only required for tier assessments
      if (req.body.assessmentType === 'tier-assessment' && !req.body.tierLevel) {
        return res.status(400).json({ error: 'Missing required field: tierLevel (required for tier assessments)' });
      }
      
      // Validate assessment type
      const assessmentType = req.body.assessmentType;
      if (assessmentType !== 'tier-assessment' && assessmentType !== 'gap-analysis') {
        return res.status(400).json({ error: 'Invalid assessment type. Must be tier-assessment or gap-analysis' });
      }
      
      // Get report URL from the uploaded file
      const reportUrl = `/reports/${req.file.filename}`;
      console.log('Report file saved:', { path: req.file.path, filename: req.file.filename, size: req.file.size });
      
      // Create a placeholder assessment if needed
      const assessmentName = req.body.assessmentName || `${agency.name} ${assessmentType === 'tier-assessment' ? 'Tier Assessment' : 'Gap Analysis'} ${new Date().toLocaleDateString()}`;
      
      // Check if we need to create a new assessment
      let assessmentId = req.body.assessmentId;
      
      if (!assessmentId) {
        // Create a new assessment - with or without tier level depending on assessment type
        const assessmentData: any = {
          agencyId: req.params.agencyId,
          name: assessmentName,
          status: 'completed',
          assessmentType: assessmentType as 'tier-assessment' | 'gap-analysis'
        };
        
        // Only add tier level for tier assessments
        if (assessmentType === 'tier-assessment' && req.body.tierLevel) {
          assessmentData.tierLevel = parseInt(req.body.tierLevel);
        }
        
        const newAssessment = await storage.createAssessment(assessmentData);
        
        assessmentId = newAssessment.id;
        console.log('Created assessment for uploaded report:', {
          assessmentId: newAssessment.id,
          name: assessmentName,
          assessmentType
        });
      } else {
        // Update the existing assessment
        const updateData: any = {
          status: 'completed'
        };
        
        // Only update tier level for tier assessments
        if (assessmentType === 'tier-assessment' && req.body.tierLevel) {
          updateData.tierLevel = parseInt(req.body.tierLevel);
        }
        
        await storage.updateAssessment(assessmentId, updateData);
        
        console.log('Updated existing assessment with report upload:', {
          assessmentId,
          assessmentType
        });
      }
      
      // Create the report
      const reportData: any = {
        assessmentId: assessmentId,
        reportType: assessmentType,
        reportUrl: reportUrl,
        generatedAt: new Date().toISOString(),
        summary: req.body.summary || `Official ${assessmentType === 'tier-assessment' ? 'Tier Assessment' : 'Gap Analysis'} Report for ${agency.name}`
      };
      
      // Only include tier level for tier assessment reports
      if (assessmentType === 'tier-assessment' && req.body.tierLevel) {
        reportData.tierLevel = parseInt(req.body.tierLevel);
      }
      
      const report = await storage.createReport(reportData);
      
      // Update agency with the tier level information
      if (assessmentType === 'tier-assessment') {
        await storage.updateAgency(req.params.agencyId, {
          tierLevel: parseInt(req.body.tierLevel)
        });
        
        console.log(`Updated agency ${agency.name} tier level to ${req.body.tierLevel}`);
      }
      
      console.log('Report uploaded successfully:', {
        reportId: report.id,
        agencyId: req.params.agencyId,
        assessmentId: assessmentId,
        reportUrl: reportUrl
      });
      
      res.status(201).json({
        report,
        message: 'Report uploaded successfully'
      });
    } catch (error) {
      console.error('Failed to upload agency report:', error);
      res.status(500).json({ 
        error: 'Failed to upload agency report',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // SWAT Training Routes
  router.post('/agencies/:agencyId/trainings', hasAgencyAccess, async (req: Request, res: Response) => {
    try {
      const trainingData = insertTrainingSchema.parse({
        ...req.body,
        agencyId: req.params.agencyId
      });
      
      // Store the training in the database
      // In a real application, you would get the training storage module
      // For now, we'll just return a success message
      res.status(201).json({
        id: 'training-' + Date.now(),
        ...trainingData
      });
    } catch (error) {
      console.error('Failed to create training:', error);
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: error.errors });
      } else {
        res.status(500).json({ error: 'Failed to create training' });
      }
    }
  });

  router.get('/agencies/:agencyId/trainings', hasAgencyAccess, async (req: Request, res: Response) => {
    try {
      // In a real application, you would get trainings from the database
      // For now, we'll just return a sample training
      res.json([
        {
          id: 'training-1',
          title: 'Tactical Response Training',
          description: 'Annual tactical response training for all SWAT team members',
          trainingType: 'tactical',
          startDate: new Date().toISOString(),
          endDate: new Date(Date.now() + 86400000).toISOString(),
          status: 'scheduled',
          agencyId: req.params.agencyId
        }
      ]);
    } catch (error) {
      console.error('Failed to fetch trainings:', error);
      res.status(500).json({ error: 'Failed to fetch trainings' });
    }
  });

  // SWAT Certification Routes
  router.post('/agencies/:agencyId/certifications', hasAgencyAccess, async (req: Request, res: Response) => {
    try {
      const certificationData = insertCertificationSchema.parse({
        ...req.body,
        agencyId: req.params.agencyId
      });
      
      // Store the certification in the database
      res.status(201).json({
        id: 'cert-' + Date.now(),
        ...certificationData
      });
    } catch (error) {
      console.error('Failed to create certification:', error);
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: error.errors });
      } else {
        res.status(500).json({ error: 'Failed to create certification' });
      }
    }
  });

  router.get('/agencies/:agencyId/certifications', hasAgencyAccess, async (req: Request, res: Response) => {
    try {
      res.json([
        {
          id: 'cert-1',
          name: 'Firearms Proficiency',
          description: 'Annual firearms proficiency certification',
          issuingAuthority: 'State Police Academy',
          validityPeriod: 12, // months
          agencyId: req.params.agencyId
        }
      ]);
    } catch (error) {
      console.error('Failed to fetch certifications:', error);
      res.status(500).json({ error: 'Failed to fetch certifications' });
    }
  });

  // Personnel-Certification Routes
  router.post('/personnel/:personnelId/certifications', isAuthenticated, async (req: Request, res: Response) => {
    try {
      const { personnelId } = req.params;
      const certificationData = insertPersonnelCertificationSchema.parse({
        ...req.body,
        personnelId
      });
      
      res.status(201).json({
        id: 'personnel-cert-' + Date.now(),
        ...certificationData
      });
    } catch (error) {
      console.error('Failed to assign certification to personnel:', error);
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: error.errors });
      } else {
        res.status(500).json({ error: 'Failed to assign certification to personnel' });
      }
    }
  });

  router.get('/personnel/:personnelId/certifications', isAuthenticated, async (req: Request, res: Response) => {
    try {
      res.json([
        {
          id: 'personnel-cert-1',
          personnelId: req.params.personnelId,
          certificationId: 'cert-1',
          issueDate: new Date().toISOString(),
          expiryDate: new Date(Date.now() + 31536000000).toISOString(), // 1 year later
          status: 'active'
        }
      ]);
    } catch (error) {
      console.error('Failed to fetch personnel certifications:', error);
      res.status(500).json({ error: 'Failed to fetch personnel certifications' });
    }
  });

  // SWAT Mission Routes
  router.post('/agencies/:agencyId/missions', hasAgencyAccess, async (req: Request, res: Response) => {
    try {
      const missionData = insertMissionSchema.parse({
        ...req.body,
        agencyId: req.params.agencyId
      });
      
      res.status(201).json({
        id: 'mission-' + Date.now(),
        ...missionData
      });
    } catch (error) {
      console.error('Failed to create mission:', error);
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: error.errors });
      } else {
        res.status(500).json({ error: 'Failed to create mission' });
      }
    }
  });

  router.get('/agencies/:agencyId/missions', hasAgencyAccess, async (req: Request, res: Response) => {
    try {
      res.json([
        {
          id: 'mission-1',
          title: 'High-risk warrant service',
          missionType: 'high-risk-warrant',
          description: 'Service of search warrant at suspected drug distribution location',
          location: '123 Main St',
          startDate: new Date().toISOString(),
          status: 'planned',
          riskLevel: 'high',
          agencyId: req.params.agencyId
        }
      ]);
    } catch (error) {
      console.error('Failed to fetch missions:', error);
      res.status(500).json({ error: 'Failed to fetch missions' });
    }
  });

  // Corrective Actions Routes
  router.post('/agencies/:agencyId/corrective-actions', hasAgencyAccess, async (req: Request, res: Response) => {
    try {
      console.log(`POST /agencies/${req.params.agencyId}/corrective-actions - Creating new corrective action`);
      
      const actionData = insertCorrectiveActionSchema.parse({
        ...req.body,
        agencyId: req.params.agencyId
      });
      
      const correctiveAction = await storage.createCorrectiveAction(actionData);
      console.log('Corrective action created successfully:', correctiveAction);
      
      res.status(201).json(correctiveAction);
    } catch (error) {
      console.error('Failed to create corrective action:', error);
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: error.errors });
      } else {
        res.status(500).json({ error: 'Failed to create corrective action' });
      }
    }
  });

  router.get('/agencies/:agencyId/corrective-actions', hasAgencyAccess, async (req: Request, res: Response) => {
    try {
      console.log(`GET /agencies/${req.params.agencyId}/corrective-actions - Fetching corrective actions`);
      
      const correctiveActions = await storage.listCorrectiveActions(req.params.agencyId);
      console.log(`Retrieved ${correctiveActions.length} corrective actions`);
      
      res.json(correctiveActions);
    } catch (error) {
      console.error('Failed to fetch corrective actions:', error);
      res.status(500).json({ error: 'Failed to fetch corrective actions' });
    }
  });
  
  router.patch('/agencies/:agencyId/corrective-actions/:id', hasAgencyAccess, async (req: Request, res: Response) => {
    try {
      console.log(`PATCH /agencies/${req.params.agencyId}/corrective-actions/${req.params.id} - Updating corrective action`);
      
      // First, verify the corrective action exists and belongs to this agency
      const existingAction = await storage.getCorrectiveAction(req.params.id);
      if (!existingAction) {
        return res.status(404).json({ error: 'Corrective action not found' });
      }
      
      if (existingAction.agencyId !== req.params.agencyId) {
        return res.status(403).json({ error: 'Access denied' });
      }
      
      // Update the corrective action
      const updatedAction = await storage.updateCorrectiveAction(req.params.id, req.body);
      console.log('Corrective action updated successfully:', updatedAction);
      
      res.json(updatedAction);
    } catch (error) {
      console.error('Failed to update corrective action:', error);
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: error.errors });
      } else {
        res.status(500).json({ error: 'Failed to update corrective action' });
      }
    }
  });
  
  router.delete('/agencies/:agencyId/corrective-actions/:id', hasAgencyAccess, async (req: Request, res: Response) => {
    try {
      console.log(`DELETE /agencies/${req.params.agencyId}/corrective-actions/${req.params.id} - Deleting corrective action`);
      
      // First, verify the corrective action exists and belongs to this agency
      const existingAction = await storage.getCorrectiveAction(req.params.id);
      if (!existingAction) {
        return res.status(404).json({ error: 'Corrective action not found' });
      }
      
      if (existingAction.agencyId !== req.params.agencyId) {
        return res.status(403).json({ error: 'Access denied' });
      }
      
      // Delete the corrective action
      await storage.deleteCorrectiveAction(req.params.id);
      console.log('Corrective action deleted successfully');
      
      res.status(204).send();
    } catch (error) {
      console.error('Failed to delete corrective action:', error);
      res.status(500).json({ error: 'Failed to delete corrective action' });
    }
  });

  // Resources Library Routes
  router.post('/agencies/:agencyId/resources', hasAgencyAccess, async (req: Request, res: Response) => {
    try {
      console.log(`POST /agencies/${req.params.agencyId}/resources - Creating new resource`);

      const resourceData = insertResourceSchema.parse({
        ...req.body,
        agencyId: req.params.agencyId,
        uploadedBy: req.user!.id,
        uploadDate: new Date().toISOString()
      });
      
      const resource = await storage.createResource(resourceData);
      console.log('Resource created successfully:', resource);
      
      res.status(201).json(resource);
    } catch (error) {
      console.error('Failed to create resource:', error);
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: error.errors });
      } else {
        res.status(500).json({ error: 'Failed to create resource' });
      }
    }
  });

  router.get('/agencies/:agencyId/resources', hasAgencyAccess, async (req: Request, res: Response) => {
    try {
      console.log(`GET /agencies/${req.params.agencyId}/resources - Fetching resources`);
      
      const resources = await storage.listResources(req.params.agencyId);
      console.log(`Retrieved ${resources.length} resources`);
      
      res.json(resources);
    } catch (error) {
      console.error('Failed to fetch resources:', error);
      res.status(500).json({ error: 'Failed to fetch resources' });
    }
  });
  
  router.patch('/agencies/:agencyId/resources/:id', hasAgencyAccess, async (req: Request, res: Response) => {
    try {
      console.log(`PATCH /agencies/${req.params.agencyId}/resources/${req.params.id} - Updating resource`);
      
      // First, verify the resource exists and belongs to this agency
      const existingResource = await storage.getResource(req.params.id);
      if (!existingResource) {
        return res.status(404).json({ error: 'Resource not found' });
      }
      
      if (existingResource.agencyId !== req.params.agencyId) {
        return res.status(403).json({ error: 'Access denied' });
      }
      
      // Update the resource
      const updatedResource = await storage.updateResource(req.params.id, req.body);
      console.log('Resource updated successfully:', updatedResource);
      
      res.json(updatedResource);
    } catch (error) {
      console.error('Failed to update resource:', error);
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: error.errors });
      } else {
        res.status(500).json({ error: 'Failed to update resource' });
      }
    }
  });
  
  router.delete('/agencies/:agencyId/resources/:id', hasAgencyAccess, async (req: Request, res: Response) => {
    try {
      console.log(`DELETE /agencies/${req.params.agencyId}/resources/${req.params.id} - Deleting resource`);
      
      // First, verify the resource exists and belongs to this agency
      const existingResource = await storage.getResource(req.params.id);
      if (!existingResource) {
        return res.status(404).json({ error: 'Resource not found' });
      }
      
      if (existingResource.agencyId !== req.params.agencyId) {
        return res.status(403).json({ error: 'Access denied' });
      }
      
      // Delete the resource
      await storage.deleteResource(req.params.id);
      console.log('Resource deleted successfully');
      
      res.status(204).send();
    } catch (error) {
      console.error('Failed to delete resource:', error);
      res.status(500).json({ error: 'Failed to delete resource' });
    }
  });

  // Message Routes
  router.post('/messages', isAuthenticated, async (req: Request, res: Response) => {
    try {
      console.log('POST /messages - Request body:', req.body);
      console.log('Authenticated user:', req.user);

      const isAgencyUser = req.user!.role === 'agency';
      const isAdminUser = req.user!.role === 'admin';
      
      // Check if this is a reply to an existing message
      let isReplyToAdmin = false;
      if (req.body.parentMessageId && isAgencyUser) {
        // Get the parent message
        const parentMessage = await storage.getMessage(req.body.parentMessageId);
        
        if (parentMessage) {
          // Get the sender of the parent message
          const parentSender = parentMessage.senderId ? await storage.getUser(parentMessage.senderId) : null;
          
          // Check if the parent message was from an admin to this agency
          isReplyToAdmin = parentSender?.role === 'admin' && 
                          (parentMessage.recipientId === req.user!.id || 
                           parentMessage.agencyId === req.user!.agencyId);
          
          console.log('Reply validation:', {
            parentSenderId: parentMessage.senderId,
            parentSenderRole: parentSender?.role,
            isReplyToAdmin: isReplyToAdmin,
            userId: req.user!.id,
            agencyId: req.user!.agencyId
          });
        }
      }
      
      // Enforce agency users can only message admins or reply to admin messages
      if (isAgencyUser) {
        // Get the recipient user if a recipientId is provided
        let recipientIsAdmin = false;
        
        if (req.body.recipientId) {
          const recipientUser = await storage.getUser(req.body.recipientId);
          recipientIsAdmin = recipientUser?.role === 'admin';
          
          console.log('Recipient validation:', {
            recipientId: req.body.recipientId,
            recipientRole: recipientUser?.role,
            recipientIsAdmin
          });
        }
        
        // If agency user is not replying to an admin and the recipient is not an admin
        if (!isReplyToAdmin && !recipientIsAdmin) {
          console.log('Messaging restriction enforced: Agency user tried to message non-admin');
          return res.status(403).json({ 
            error: 'Agency users can only send messages to admin users or reply to messages from admin users' 
          });
        }
      }

      // Create message using the storage interface
      const messageData = {
        ...req.body,
        senderId: req.user!.id,
        agencyId: req.user!.agencyId || null
      };

      // Use storage interface to create the message
      const message = await storage.createMessage(messageData);

      // If no specific recipient is provided and the sender is an admin
      // This is a broadcast message to all agencies
      if (!messageData.recipientId && isAdminUser) {
        console.log('Broadcasting message to all agencies');
      }

      console.log('Message created successfully:', message);
      res.status(201).json(message);
    } catch (error) {
      console.error('Failed to create message:', error);
      res.status(500).json({ error: 'Failed to create message' });
    }
  });

  router.get('/messages/sent', isAuthenticated, async (req: Request, res: Response) => {
    try {
      console.log('GET /messages/sent - Fetching sent messages for user:', req.user!.id);
      
      // Use storage interface for fetching sent messages
      const messages = await storage.listSentMessages(req.user!.id);
      
      console.log('Sent messages retrieved:', messages.length);
      res.json(messages);
    } catch (error) {
      console.error('Failed to fetch sent messages:', error);
      res.status(500).json({ error: 'Failed to fetch sent messages' });
    }
  });

  router.get('/messages/received', isAuthenticated, async (req: Request, res: Response) => {
    try {
      console.log('GET /messages/received - Fetching received messages for user/agency:', req.user!.id, req.user!.agencyId);
      
      // Use storage interface for fetching received messages
      const messages = await storage.listReceivedMessages(req.user!.id);
      
      console.log('Received messages retrieved:', messages.length);
      res.json(messages);
    } catch (error) {
      console.error('Failed to fetch received messages:', error);
      res.status(500).json({ error: 'Failed to fetch received messages' });
    }
  });

  router.patch('/messages/:id/read', isAuthenticated, async (req: Request, res: Response) => {
    try {
      console.log(`PATCH /messages/${req.params.id}/read - Marking message as read`);
      
      // First get the message to validate access
      const message = await storage.getMessage(req.params.id);
      
      if (!message) {
        return res.status(404).json({ error: 'Message not found' });
      }
      
      // Check if user has access to this message
      const hasAccess = 
        message.recipientId === req.user!.id || 
        (message.agencyId === req.user!.agencyId && message.recipientId === null) ||
        (message.recipientId === null && message.agencyId === null && req.user!.role === 'agency');
      
      if (!hasAccess) {
        return res.status(403).json({ error: 'Access denied' });
      }
      
      // Mark message as read using storage interface
      const updatedMessage = await storage.markMessageAsRead(req.params.id);
      
      console.log('Message marked as read:', updatedMessage);
      res.json(updatedMessage);
    } catch (error) {
      console.error('Failed to mark message as read:', error);
      res.status(500).json({ error: 'Failed to mark message as read' });
    }
  });

  router.delete('/messages/:id', isAuthenticated, async (req: Request, res: Response) => {
    try {
      console.log(`DELETE /messages/${req.params.id} - Deleting message`);
      
      // First get the message to validate access
      const message = await storage.getMessage(req.params.id);
      
      if (!message) {
        return res.status(404).json({ error: 'Message not found' });
      }
      
      // Check if user has access to this message (sender, recipient, or agency admin)
      const hasAccess = 
        message.senderId === req.user!.id || 
        message.recipientId === req.user!.id || 
        (message.agencyId === req.user!.agencyId && message.recipientId === null) ||
        (message.recipientId === null && message.agencyId === null && req.user!.role === 'agency');
      
      if (!hasAccess) {
        return res.status(403).json({ error: 'Access denied' });
      }
      
      // Delete the message using storage interface
      await storage.deleteMessage(req.params.id);
      
      console.log('Message deleted successfully');
      res.status(204).send();
    } catch (error) {
      console.error('Failed to delete message:', error);
      res.status(500).json({ error: 'Failed to delete message' });
    }
  });

  // API Config endpoint
  router.get('/config', isAuthenticated, (req: Request, res: Response) => {
    // Return only the configuration keys that are safe to expose to the frontend
    res.json({
      googleMapsApiKey: process.env.GOOGLE_MAPS_API_KEY || ''
    });
  });

  const httpServer = createServer(app);
  return httpServer;
}