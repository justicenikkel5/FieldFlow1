import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { 
  insertAppointmentSchema,
  insertReminderTemplateSchema,
  insertCalendarIntegrationSchema 
} from "@shared/schema";
import { z, ZodError } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth middleware
  await setupAuth(app);

  // Sign-in route
  app.post('/api/signin', async (req, res) => {
    try {
      const { email, password } = req.body;
      
      if (!email || !password) {
        return res.status(400).json({ message: "Email and password are required" });
      }
      
      // For now, this is a placeholder - you'll need to implement actual password verification
      // In a real app, you'd verify the password against a hash stored in the database
      const user = await storage.getUserByEmail(email);
      
      if (!user) {
        return res.status(401).json({ message: "Invalid email or password" });
      }
      
      // TODO: Implement password verification
      // For now, we'll just check if the user exists
      
      // Set up session or JWT token here
      res.json({ 
        message: "Sign in successful", 
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName
        }
      });
    } catch (error) {
      console.error("Error during sign-in:", error);
      res.status(500).json({ message: "Sign in failed" });
    }
  });

  // Auth routes
  app.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      let user = await storage.getUser(userId);
      
      // If user doesn't exist, create them with registration data if available
      if (!user) {
        const userData = {
          id: userId,
          email: req.user.claims.email || '',
          firstName: req.user.claims.firstName || '',
          lastName: req.user.claims.lastName || ''
        };
        user = await storage.createUser(userData);
      }
      
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Appointment routes
  app.get('/api/appointments', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const startDate = req.query.startDate ? new Date(req.query.startDate as string) : undefined;
      const endDate = req.query.endDate ? new Date(req.query.endDate as string) : undefined;
      
      const appointments = await storage.getAppointments(userId, startDate, endDate);
      res.json(appointments);
    } catch (error) {
      console.error("Error fetching appointments:", error);
      res.status(500).json({ message: "Failed to fetch appointments" });
    }
  });

  app.post('/api/appointments', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const appointmentData = insertAppointmentSchema.parse({
        ...req.body,
        userId,
      });
      
      const appointment = await storage.createAppointment(appointmentData);
      res.status(201).json(appointment);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid appointment data", errors: error.errors });
      }
      console.error("Error creating appointment:", error);
      res.status(500).json({ message: "Failed to create appointment" });
    }
  });

  app.put('/api/appointments/:id', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const appointmentId = req.params.id;
      const updates = req.body;
      
      const appointment = await storage.updateAppointment(appointmentId, userId, updates);
      if (!appointment) {
        return res.status(404).json({ message: "Appointment not found" });
      }
      
      res.json(appointment);
    } catch (error) {
      console.error("Error updating appointment:", error);
      res.status(500).json({ message: "Failed to update appointment" });
    }
  });

  app.delete('/api/appointments/:id', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const appointmentId = req.params.id;
      
      const success = await storage.deleteAppointment(appointmentId, userId);
      if (!success) {
        return res.status(404).json({ message: "Appointment not found" });
      }
      
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting appointment:", error);
      res.status(500).json({ message: "Failed to delete appointment" });
    }
  });

  // Stats route
  app.get('/api/stats', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const stats = await storage.getAppointmentStats(userId);
      res.json(stats);
    } catch (error) {
      console.error("Error fetching stats:", error);
      res.status(500).json({ message: "Failed to fetch stats" });
    }
  });

  // Reminder template routes
  app.get('/api/reminder-templates', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const templates = await storage.getReminderTemplates(userId);
      res.json(templates);
    } catch (error) {
      console.error("Error fetching reminder templates:", error);
      res.status(500).json({ message: "Failed to fetch reminder templates" });
    }
  });

  app.post('/api/reminder-templates', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const templateData = insertReminderTemplateSchema.parse({
        ...req.body,
        userId,
      });
      
      const template = await storage.createReminderTemplate(templateData);
      res.status(201).json(template);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid template data", errors: error.errors });
      }
      console.error("Error creating reminder template:", error);
      res.status(500).json({ message: "Failed to create reminder template" });
    }
  });

  // Calendar integration routes
  app.get('/api/calendar-integrations', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const integrations = await storage.getCalendarIntegrations(userId);
      res.json(integrations);
    } catch (error) {
      console.error("Error fetching calendar integrations:", error);
      res.status(500).json({ message: "Failed to fetch calendar integrations" });
    }
  });

  app.post('/api/calendar-integrations', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const integrationData = insertCalendarIntegrationSchema.parse({
        ...req.body,
        userId,
      });
      
      const integration = await storage.createCalendarIntegration(integrationData);
      res.status(201).json(integration);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid integration data", errors: error.errors });
      }
      console.error("Error creating calendar integration:", error);
      res.status(500).json({ message: "Failed to create calendar integration" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
