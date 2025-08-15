import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { 
  insertAppointmentSchema,
  insertReminderTemplateSchema,
  insertCalendarIntegrationSchema 
} from "@shared/schema";
import { z } from "zod";
import { StripeService } from "./stripe";
import { Request } from "express";
import { google } from "googleapis";
import { mailgunService } from "./mailgun";

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

  // Handle post-registration calendar connection
  app.post('/api/auth/complete-registration', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { connectGoogleCalendar, connectCalendly } = req.body;
      
      if (connectGoogleCalendar) {
        // Generate Google OAuth URL with dynamic redirect URI
        const protocol = req.headers['x-forwarded-proto'] || req.protocol || 'https';
        const host = req.headers['x-forwarded-host'] || req.headers.host || req.get('host');
        const redirectUri = `${protocol}://${host}/api/auth/google/callback`;
        
        console.log(`Registration Google OAuth redirect URI: ${redirectUri}`);
        
        const oauth2Client = new google.auth.OAuth2(
          process.env.GOOGLE_CLIENT_ID,
          process.env.GOOGLE_CLIENT_SECRET,
          redirectUri
        );

        const scopes = [
          'https://www.googleapis.com/auth/calendar.readonly',
          'https://www.googleapis.com/auth/userinfo.email',
          'https://www.googleapis.com/auth/userinfo.profile'
        ];

        const authUrl = oauth2Client.generateAuthUrl({
          access_type: 'offline',
          scope: scopes,
          state: userId,
          prompt: 'consent'
        });

        res.json({ authUrl, redirectToDashboard: false });
      } else if (connectCalendly) {
        // Generate Calendly OAuth URL
        const authUrl = `https://auth.calendly.com/oauth/authorize?${new URLSearchParams({
          client_id: process.env.CALENDLY_CLIENT_ID!,
          response_type: 'code',
          redirect_uri: process.env.CALENDLY_REDIRECT_URL!,
          state: userId,
        })}`;

        res.json({ authUrl, redirectToDashboard: false });
      } else {
        // Skip calendar connection, go straight to dashboard
        res.json({ redirectToDashboard: true });
      }
    } catch (error) {
      console.error("Error completing registration:", error);
      res.status(500).json({ message: "Failed to complete registration" });
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
      
      // Send booking confirmation email
      try {
        const user = await storage.getUser(userId);
        if (user && user.email) {
          const appointmentDate = new Date(appointment.appointmentDate);
          await mailgunService.sendBookingConfirmation(
            user.email,
            `${user.firstName} ${user.lastName}`,
            {
              title: appointment.service,
              date: appointmentDate.toLocaleDateString(),
              time: appointmentDate.toLocaleTimeString(),
              location: appointment.notes || undefined,
              description: appointment.notes || undefined,
            }
          );
          console.log(`Booking confirmation sent to ${user.email}`);
        }
      } catch (emailError) {
        console.error("Error sending booking confirmation email:", emailError);
        // Don't fail the appointment creation if email fails
      }
      
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

  // Stripe payment routes
  app.post('/api/create-payment-intent', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { amount, appointmentId, description } = req.body;

      if (!amount || amount <= 0) {
        return res.status(400).json({ message: "Valid amount is required" });
      }

      // Get user information
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // Create or retrieve Stripe customer
      let customerId = user.stripeCustomerId;
      if (!customerId) {
        const customer = await StripeService.createCustomer({
          email: user.email || '',
          name: `${user.firstName} ${user.lastName}`,
          metadata: { userId }
        });
        customerId = customer.id;
        
        // Update user with Stripe customer ID
        await storage.updateUser(userId, { stripeCustomerId: customerId });
      }

      // Create payment intent
      const paymentIntent = await StripeService.createPaymentIntent({
        amount: Math.round(amount * 100), // Convert to cents
        customerId,
        description: description || 'Appointment booking',
        metadata: {
          userId,
          appointmentId: appointmentId || '',
        }
      });

      res.json({
        clientSecret: paymentIntent.client_secret,
        paymentIntentId: paymentIntent.id,
      });
    } catch (error) {
      console.error("Error creating payment intent:", error);
      res.status(500).json({ message: "Failed to create payment intent" });
    }
  });

  app.post('/api/confirm-payment', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { paymentIntentId, appointmentId } = req.body;

      if (!paymentIntentId) {
        return res.status(400).json({ message: "Payment intent ID is required" });
      }

      // Retrieve payment intent to verify status
      const paymentIntent = await StripeService.retrievePaymentIntent(paymentIntentId);
      
      if (paymentIntent.status === 'succeeded') {
        // Update appointment with payment information if appointmentId provided
        if (appointmentId) {
          await storage.updateAppointment(appointmentId, userId, {
            paymentStatus: 'paid',
            paymentIntentId: paymentIntentId,
            amountPaid: paymentIntent.amount / 100, // Convert from cents
          });
        }

        res.json({ 
          message: "Payment confirmed successfully",
          paymentIntent: {
            id: paymentIntent.id,
            status: paymentIntent.status,
            amount: paymentIntent.amount / 100,
          }
        });
      } else {
        res.status(400).json({ 
          message: "Payment not completed",
          status: paymentIntent.status 
        });
      }
    } catch (error) {
      console.error("Error confirming payment:", error);
      res.status(500).json({ message: "Failed to confirm payment" });
    }
  });

  app.post('/api/refund-payment', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { paymentIntentId, amount, appointmentId } = req.body;

      if (!paymentIntentId) {
        return res.status(400).json({ message: "Payment intent ID is required" });
      }

      // Verify the appointment belongs to the user
      if (appointmentId) {
        const appointment = await storage.getAppointmentById(appointmentId, userId);
        if (!appointment) {
          return res.status(404).json({ message: "Appointment not found" });
        }
      }

      // Create refund
      const refund = await StripeService.refundPayment(
        paymentIntentId, 
        amount ? Math.round(amount * 100) : undefined
      );

      // Update appointment status if appointmentId provided
      if (appointmentId) {
        await storage.updateAppointment(appointmentId, userId, {
          paymentStatus: 'refunded',
          refundId: refund.id,
          refundAmount: refund.amount / 100,
        });
      }

      res.json({
        message: "Refund processed successfully",
        refund: {
          id: refund.id,
          status: refund.status,
          amount: refund.amount / 100,
        }
      });
    } catch (error) {
      console.error("Error processing refund:", error);
      res.status(500).json({ message: "Failed to process refund" });
    }
  });

  // Google Calendar OAuth routes
  app.get('/api/auth/google', isAuthenticated, async (req: any, res) => {
    try {
      // Dynamic redirect URI based on current domain
      const protocol = req.headers['x-forwarded-proto'] || req.protocol || 'https';
      const host = req.headers['x-forwarded-host'] || req.headers.host || req.get('host');
      const redirectUri = `${protocol}://${host}/api/auth/google/callback`;
      
      console.log(`Google OAuth redirect URI: ${redirectUri}`);
      
      const oauth2Client = new google.auth.OAuth2(
        process.env.GOOGLE_CLIENT_ID,
        process.env.GOOGLE_CLIENT_SECRET,
        redirectUri
      );

      const scopes = [
        'https://www.googleapis.com/auth/calendar.readonly',
        'https://www.googleapis.com/auth/userinfo.email',
        'https://www.googleapis.com/auth/userinfo.profile'
      ];

      const authUrl = oauth2Client.generateAuthUrl({
        access_type: 'offline',
        scope: scopes,
        state: req.user.claims.sub, // Pass user ID in state
        prompt: 'consent'
      });

      res.json({ authUrl });
    } catch (error) {
      console.error("Error generating Google auth URL:", error);
      res.status(500).json({ message: "Failed to generate auth URL" });
    }
  });

  app.get('/api/auth/google/callback', async (req, res) => {
    try {
      const { code, state: userId } = req.query;
      
      if (!code || !userId) {
        return res.status(400).json({ message: "Missing authorization code or user ID" });
      }

      // Dynamic redirect URI based on current domain
      const protocol = req.headers['x-forwarded-proto'] || req.protocol || 'https';
      const host = req.headers['x-forwarded-host'] || req.headers.host || req.get('host');
      const redirectUri = `${protocol}://${host}/api/auth/google/callback`;
      
      console.log(`Google OAuth callback redirect URI: ${redirectUri}`);
      
      const oauth2Client = new google.auth.OAuth2(
        process.env.GOOGLE_CLIENT_ID,
        process.env.GOOGLE_CLIENT_SECRET,
        redirectUri
      );

      // Exchange code for tokens
      const { tokens } = await oauth2Client.getToken(code as string);
      oauth2Client.setCredentials(tokens);

      // Get user info from Google
      const oauth2 = google.oauth2({ version: 'v2', auth: oauth2Client });
      const userInfo = await oauth2.userinfo.get();

      // Save calendar integration
      const integrationData = {
        userId: userId as string,
        provider: 'google' as const,
        accountEmail: userInfo.data.email || '',
        accessToken: tokens.access_token || '',
        refreshToken: tokens.refresh_token || '',
        expiresAt: tokens.expiry_date ? new Date(tokens.expiry_date) : undefined,
        isActive: true
      };

      await storage.createCalendarIntegration(integrationData);

      // Redirect back to dashboard with success
      res.redirect('/?google_calendar=connected');
    } catch (error) {
      console.error("Error in Google OAuth callback:", error);
      res.redirect('/?google_calendar=error');
    }
  });

  app.get('/api/google-calendar/events', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { startDate, endDate } = req.query;

      // Get Google calendar integration
      const integrations = await storage.getCalendarIntegrations(userId);
      const googleIntegration = integrations.find(i => i.provider === 'google' && i.isActive);

      if (!googleIntegration) {
        return res.status(404).json({ message: "Google Calendar not connected" });
      }

      const oauth2Client = new google.auth.OAuth2(
        process.env.GOOGLE_CLIENT_ID,
        process.env.GOOGLE_CLIENT_SECRET,
        process.env.GOOGLE_REDIRECT_URI
      );

      oauth2Client.setCredentials({
        access_token: googleIntegration.accessToken,
        refresh_token: googleIntegration.refreshToken
      });

      const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

      // Fetch events
      const events = await calendar.events.list({
        calendarId: 'primary',
        timeMin: startDate ? new Date(startDate as string).toISOString() : new Date().toISOString(),
        timeMax: endDate ? new Date(endDate as string).toISOString() : undefined,
        maxResults: 50,
        singleEvents: true,
        orderBy: 'startTime'
      });

      const formattedEvents = events.data.items?.map(event => ({
        id: event.id,
        title: event.summary || 'Untitled',
        start: event.start?.dateTime || event.start?.date,
        end: event.end?.dateTime || event.end?.date,
        description: event.description,
        location: event.location,
        source: 'google'
      })) || [];

      res.json(formattedEvents);
    } catch (error) {
      console.error("Error fetching Google Calendar events:", error);
      res.status(500).json({ message: "Failed to fetch Google Calendar events" });
    }
  });

  app.delete('/api/calendar-integrations/:id', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const integrationId = req.params.id;

      const success = await storage.deleteCalendarIntegration(integrationId, userId);
      if (!success) {
        return res.status(404).json({ message: "Integration not found" });
      }

      res.status(204).send();
    } catch (error) {
      console.error("Error deleting calendar integration:", error);
      res.status(500).json({ message: "Failed to delete integration" });
    }
  });

  // Calendly OAuth routes
  app.get('/api/auth/calendly', isAuthenticated, async (req: any, res) => {
    try {
      const authUrl = `https://auth.calendly.com/oauth/authorize?${new URLSearchParams({
        client_id: process.env.CALENDLY_CLIENT_ID!,
        response_type: 'code',
        redirect_uri: process.env.CALENDLY_REDIRECT_URL!,
        state: req.user.claims.sub, // Pass user ID in state
      })}`;

      res.json({ authUrl });
    } catch (error) {
      console.error("Error generating Calendly auth URL:", error);
      res.status(500).json({ message: "Failed to generate auth URL" });
    }
  });

  app.get('/api/auth/calendly/callback', async (req, res) => {
    try {
      const { code, state: userId } = req.query;
      
      if (!code || !userId) {
        return res.status(400).json({ message: "Missing authorization code or user ID" });
      }

      // Exchange code for tokens
      const tokenResponse = await fetch('https://auth.calendly.com/oauth/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          client_id: process.env.CALENDLY_CLIENT_ID!,
          client_secret: process.env.CALENDLY_CLIENT_SECRET!,
          code: code as string,
          grant_type: 'authorization_code',
          redirect_uri: process.env.CALENDLY_REDIRECT_URL!,
        }),
      });

      const tokens = await tokenResponse.json();

      if (!tokenResponse.ok) {
        console.error('Calendly token exchange failed:', tokens);
        return res.redirect('/?calendly=error');
      }

      // Get user info from Calendly
      const userResponse = await fetch('https://api.calendly.com/users/me', {
        headers: {
          'Authorization': `Bearer ${tokens.access_token}`,
        },
      });

      const userData = await userResponse.json();

      if (!userResponse.ok) {
        console.error('Calendly user fetch failed:', userData);
        return res.redirect('/?calendly=error');
      }

      // Save calendar integration
      const integrationData = {
        userId: userId as string,
        provider: 'calendly' as const,
        accountEmail: userData.resource.email || '',
        accessToken: tokens.access_token || '',
        refreshToken: tokens.refresh_token || '',
        expiresAt: tokens.expires_in ? new Date(Date.now() + tokens.expires_in * 1000) : undefined,
        isActive: true
      };

      await storage.createCalendarIntegration(integrationData);

      // Redirect back to dashboard with success
      res.redirect('/?calendly=connected');
    } catch (error) {
      console.error("Error in Calendly OAuth callback:", error);
      res.redirect('/?calendly=error');
    }
  });

  app.get('/api/calendly/events', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { startDate, endDate } = req.query;

      // Get Calendly calendar integration
      const integrations = await storage.getCalendarIntegrations(userId);
      const calendlyIntegration = integrations.find(i => i.provider === 'calendly' && i.isActive);

      if (!calendlyIntegration) {
        return res.status(404).json({ message: "Calendly not connected" });
      }

      // Get user's organization URI first
      const userResponse = await fetch('https://api.calendly.com/users/me', {
        headers: {
          'Authorization': `Bearer ${calendlyIntegration.accessToken}`,
        },
      });

      const userData = await userResponse.json();

      if (!userResponse.ok) {
        console.error('Failed to get Calendly user data:', userData);
        return res.status(500).json({ message: "Failed to fetch user data from Calendly" });
      }

      const organizationUri = userData.resource.current_organization;

      // Fetch scheduled events
      const params = new URLSearchParams({
        organization: organizationUri,
        status: 'active'
      });

      if (startDate) {
        params.append('min_start_time', new Date(startDate as string).toISOString());
      }
      if (endDate) {
        params.append('max_start_time', new Date(endDate as string).toISOString());
      }

      const eventsResponse = await fetch(`https://api.calendly.com/scheduled_events?${params}`, {
        headers: {
          'Authorization': `Bearer ${calendlyIntegration.accessToken}`,
        },
      });

      const eventsData = await eventsResponse.json();

      if (!eventsResponse.ok) {
        console.error('Failed to fetch Calendly events:', eventsData);
        return res.status(500).json({ message: "Failed to fetch Calendly events" });
      }

      const formattedEvents = eventsData.collection?.map((event: any) => ({
        id: event.uri,
        title: event.name || 'Calendly Event',
        start: event.start_time,
        end: event.end_time,
        description: `Calendly event: ${event.event_type?.name || 'Unknown type'}`,
        location: event.location?.join_url || event.location?.location,
        source: 'calendly'
      })) || [];

      res.json(formattedEvents);
    } catch (error) {
      console.error("Error fetching Calendly events:", error);
      res.status(500).json({ message: "Failed to fetch Calendly events" });
    }
  });

  // Test endpoint to verify Mailgun configuration
  app.get('/api/test/mailgun-config', isAuthenticated, async (req, res) => {
    try {
      const hasApiKey = !!process.env.MAILGUN_API_KEY;
      const hasDomain = !!process.env.MAILGUN_DOMAIN;
      
      res.json({
        mailgunConfigured: hasApiKey && hasDomain,
        hasApiKey,
        hasDomain,
        domain: process.env.MAILGUN_DOMAIN // Safe to show domain
        // Note: Never expose the actual API key in responses
      });
    } catch (error) {
      console.error("Error checking Mailgun config:", error);
      res.status(500).json({ message: "Failed to check Mailgun configuration" });
    }
  });

  // Stripe webhook endpoint
  app.post('/api/stripe/webhook', async (req: Request, res) => {
    try {
      const signature = req.headers['stripe-signature'] as string;
      
      if (!signature) {
        return res.status(400).json({ message: "Missing Stripe signature" });
      }

      // Verify webhook signature
      const event = StripeService.verifyWebhookSignature(
        req.body as Buffer,
        signature
      );

      // Handle different event types
      switch (event.type) {
        case 'payment_intent.succeeded':
          const paymentIntent = event.data.object as any;
          console.log('Payment succeeded:', paymentIntent.id);
          
          // Update appointment status if metadata contains appointmentId
          if (paymentIntent.metadata?.appointmentId) {
            await storage.updateAppointment(
              paymentIntent.metadata.appointmentId,
              paymentIntent.metadata.userId,
              {
                paymentStatus: 'paid',
                paymentIntentId: paymentIntent.id,
                amountPaid: paymentIntent.amount / 100,
              }
            );
          }
          break;

        case 'payment_intent.payment_failed':
          const failedPayment = event.data.object as any;
          console.log('Payment failed:', failedPayment.id);
          
          // Update appointment status if metadata contains appointmentId
          if (failedPayment.metadata?.appointmentId) {
            await storage.updateAppointment(
              failedPayment.metadata.appointmentId,
              failedPayment.metadata.userId,
              {
                paymentStatus: 'failed',
                paymentIntentId: failedPayment.id,
              }
            );
          }
          break;

        case 'charge.dispute.created':
          const dispute = event.data.object as any;
          console.log('Dispute created:', dispute.id);
          // Handle dispute logic here
          break;

        default:
          console.log(`Unhandled event type: ${event.type}`);
      }

      res.json({ received: true });
    } catch (error) {
      console.error('Webhook error:', error);
      res.status(400).json({ message: "Webhook handler failed" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
