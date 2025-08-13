import {
  users,
  appointments,
  reminderTemplates,
  calendarIntegrations,
  type User,
  type UpsertUser,
  type Appointment,
  type InsertAppointment,
  type ReminderTemplate,
  type InsertReminderTemplate,
  type CalendarIntegration,
  type InsertCalendarIntegration,
} from "@shared/schema";
import { db } from "./db";
import { eq, and, desc, gte, lte, sql } from "drizzle-orm";

// Interface for storage operations
export interface IStorage {
  // User operations
  // (IMPORTANT) these user operations are mandatory for Replit Auth.
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;

  // Appointment operations
  getAppointments(userId: string, startDate?: Date, endDate?: Date): Promise<Appointment[]>;
  getAppointment(id: string, userId: string): Promise<Appointment | undefined>;
  createAppointment(appointment: InsertAppointment): Promise<Appointment>;
  updateAppointment(id: string, userId: string, updates: Partial<InsertAppointment>): Promise<Appointment | undefined>;
  deleteAppointment(id: string, userId: string): Promise<boolean>;
  getAppointmentStats(userId: string): Promise<{
    todayAppointments: number;
    remindersSent: number;
    confirmationRate: number;
    noShowRate: number;
  }>;

  // Reminder template operations
  getReminderTemplates(userId: string): Promise<ReminderTemplate[]>;
  createReminderTemplate(template: InsertReminderTemplate): Promise<ReminderTemplate>;
  updateReminderTemplate(id: string, userId: string, updates: Partial<InsertReminderTemplate>): Promise<ReminderTemplate | undefined>;
  deleteReminderTemplate(id: string, userId: string): Promise<boolean>;

  // Calendar integration operations
  getCalendarIntegrations(userId: string): Promise<CalendarIntegration[]>;
  createCalendarIntegration(integration: InsertCalendarIntegration): Promise<CalendarIntegration>;
  updateCalendarIntegration(id: string, userId: string, updates: Partial<InsertCalendarIntegration>): Promise<CalendarIntegration | undefined>;
  deleteCalendarIntegration(id: string, userId: string): Promise<boolean>;
}

export class DatabaseStorage implements IStorage {
  // User operations
  // (IMPORTANT) these user operations are mandatory for Replit Auth.

  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }

  // Appointment operations
  async getAppointments(userId: string, startDate?: Date, endDate?: Date): Promise<Appointment[]> {
    let query = db.select().from(appointments).where(eq(appointments.userId, userId));

    if (startDate && endDate) {
      return db.select()
        .from(appointments)
        .where(
          and(
            eq(appointments.userId, userId),
            gte(appointments.appointmentDate, startDate),
            lte(appointments.appointmentDate, endDate)
          )
        )
        .orderBy(desc(appointments.appointmentDate));
    }

    return query.orderBy(desc(appointments.appointmentDate));
  }

  async getAppointment(id: string, userId: string): Promise<Appointment | undefined> {
    const [appointment] = await db
      .select()
      .from(appointments)
      .where(and(eq(appointments.id, id), eq(appointments.userId, userId)));
    return appointment;
  }

  async createAppointment(appointment: InsertAppointment): Promise<Appointment> {
    const [newAppointment] = await db
      .insert(appointments)
      .values(appointment)
      .returning();
    return newAppointment;
  }

  async updateAppointment(id: string, userId: string, updates: Partial<InsertAppointment>): Promise<Appointment | undefined> {
    const [updatedAppointment] = await db
      .update(appointments)
      .set({ ...updates, updatedAt: new Date() })
      .where(and(eq(appointments.id, id), eq(appointments.userId, userId)))
      .returning();
    return updatedAppointment;
  }

  async deleteAppointment(id: string, userId: string): Promise<boolean> {
    const result = await db
      .delete(appointments)
      .where(and(eq(appointments.id, id), eq(appointments.userId, userId)));
    return (result.rowCount || 0) > 0;
  }

  async getAppointmentStats(userId: string): Promise<{
    todayAppointments: number;
    remindersSent: number;
    confirmationRate: number;
    noShowRate: number;
  }> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Get today's appointments
    const [todayResult] = await db
      .select({ count: sql<number>`count(*)` })
      .from(appointments)
      .where(
        and(
          eq(appointments.userId, userId),
          gte(appointments.appointmentDate, today),
          lte(appointments.appointmentDate, tomorrow)
        )
      );

    // Get reminders sent this week
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    const [reminderResult] = await db
      .select({ count: sql<number>`count(*)` })
      .from(appointments)
      .where(
        and(
          eq(appointments.userId, userId),
          eq(appointments.reminderSent, true),
          gte(appointments.reminderSentAt, weekAgo)
        )
      );

    // Get confirmation rate (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const [totalResult] = await db
      .select({ count: sql<number>`count(*)` })
      .from(appointments)
      .where(
        and(
          eq(appointments.userId, userId),
          gte(appointments.createdAt, thirtyDaysAgo)
        )
      );

    const [confirmedResult] = await db
      .select({ count: sql<number>`count(*)` })
      .from(appointments)
      .where(
        and(
          eq(appointments.userId, userId),
          eq(appointments.status, "confirmed"),
          gte(appointments.createdAt, thirtyDaysAgo)
        )
      );

    const [noShowResult] = await db
      .select({ count: sql<number>`count(*)` })
      .from(appointments)
      .where(
        and(
          eq(appointments.userId, userId),
          eq(appointments.status, "no_show"),
          gte(appointments.createdAt, thirtyDaysAgo)
        )
      );

    const totalAppointments = totalResult.count || 0;
    const confirmedAppointments = confirmedResult.count || 0;
    const noShows = noShowResult.count || 0;

    return {
      todayAppointments: todayResult.count || 0,
      remindersSent: reminderResult.count || 0,
      confirmationRate: totalAppointments > 0 ? Math.round((confirmedAppointments / totalAppointments) * 100) : 0,
      noShowRate: totalAppointments > 0 ? Math.round((noShows / totalAppointments) * 100) : 0,
    };
  }

  // Reminder template operations
  async getReminderTemplates(userId: string): Promise<ReminderTemplate[]> {
    return db
      .select()
      .from(reminderTemplates)
      .where(eq(reminderTemplates.userId, userId))
      .orderBy(desc(reminderTemplates.createdAt));
  }

  async createReminderTemplate(template: InsertReminderTemplate): Promise<ReminderTemplate> {
    const [newTemplate] = await db
      .insert(reminderTemplates)
      .values(template)
      .returning();
    return newTemplate;
  }

  async updateReminderTemplate(id: string, userId: string, updates: Partial<InsertReminderTemplate>): Promise<ReminderTemplate | undefined> {
    const [updatedTemplate] = await db
      .update(reminderTemplates)
      .set({ ...updates, updatedAt: new Date() })
      .where(and(eq(reminderTemplates.id, id), eq(reminderTemplates.userId, userId)))
      .returning();
    return updatedTemplate;
  }

  async deleteReminderTemplate(id: string, userId: string): Promise<boolean> {
    const result = await db
      .delete(reminderTemplates)
      .where(and(eq(reminderTemplates.id, id), eq(reminderTemplates.userId, userId)));
    return (result.rowCount || 0) > 0;
  }

  // Calendar integration operations
  async getCalendarIntegrations(userId: string): Promise<CalendarIntegration[]> {
    return db
      .select()
      .from(calendarIntegrations)
      .where(eq(calendarIntegrations.userId, userId))
      .orderBy(desc(calendarIntegrations.createdAt));
  }

  async createCalendarIntegration(integration: InsertCalendarIntegration): Promise<CalendarIntegration> {
    const [newIntegration] = await db
      .insert(calendarIntegrations)
      .values(integration)
      .returning();
    return newIntegration;
  }

  async updateCalendarIntegration(id: string, userId: string, updates: Partial<InsertCalendarIntegration>): Promise<CalendarIntegration | undefined> {
    const [updatedIntegration] = await db
      .update(calendarIntegrations)
      .set({ ...updates, updatedAt: new Date() })
      .where(and(eq(id, id), eq(userId, userId)))
      .returning();
    return updatedIntegration;
  }

  async deleteCalendarIntegration(id: string, userId: string): Promise<boolean> {
    const result = await db
      .delete(calendarIntegrations)
      .where(and(eq(calendarIntegrations.id, id), eq(calendarIntegrations.userId, userId)));
    return (result.rowCount || 0) > 0;
  }
}

export const storage = new DatabaseStorage();