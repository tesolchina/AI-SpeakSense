import { db } from "./db";
import { eq, desc, and } from "drizzle-orm";
import {
  practiceTemplates,
  interviewerPersonas,
  practiceSessions,
  sessionMessages,
  sessionFeedback,
  userPreferences,
  type PracticeTemplate,
  type InsertPracticeTemplate,
  type InterviewerPersona,
  type InsertInterviewerPersona,
  type PracticeSession,
  type InsertPracticeSession,
  type SessionMessage,
  type InsertSessionMessage,
  type SessionFeedback,
  type InsertSessionFeedback,
  type UserPreferences,
  type InsertUserPreferences,
} from "@shared/schema";

export interface IStorage {
  getTemplates(): Promise<PracticeTemplate[]>;
  getTemplate(id: number): Promise<PracticeTemplate | undefined>;
  createTemplate(template: InsertPracticeTemplate): Promise<PracticeTemplate>;
  
  getPersonas(): Promise<InterviewerPersona[]>;
  getPersona(id: number): Promise<InterviewerPersona | undefined>;
  createPersona(persona: InsertInterviewerPersona): Promise<InterviewerPersona>;
  
  getSessions(userId: string): Promise<PracticeSession[]>;
  getSession(id: number): Promise<PracticeSession | undefined>;
  createSession(session: InsertPracticeSession): Promise<PracticeSession>;
  updateSession(id: number, updates: Partial<PracticeSession>): Promise<PracticeSession | undefined>;
  deleteSession(id: number): Promise<void>;
  
  getSessionMessages(sessionId: number): Promise<SessionMessage[]>;
  createSessionMessage(message: InsertSessionMessage): Promise<SessionMessage>;
  
  getSessionFeedback(sessionId: number): Promise<SessionFeedback | undefined>;
  createSessionFeedback(feedback: InsertSessionFeedback): Promise<SessionFeedback>;
  
  getUserPreferences(userId: string): Promise<UserPreferences | undefined>;
  upsertUserPreferences(prefs: InsertUserPreferences): Promise<UserPreferences>;
}

export class DatabaseStorage implements IStorage {
  async getTemplates(): Promise<PracticeTemplate[]> {
    return db.select().from(practiceTemplates);
  }

  async getTemplate(id: number): Promise<PracticeTemplate | undefined> {
    const [template] = await db.select().from(practiceTemplates).where(eq(practiceTemplates.id, id));
    return template;
  }

  async createTemplate(template: InsertPracticeTemplate): Promise<PracticeTemplate> {
    const [created] = await db.insert(practiceTemplates).values(template).returning();
    return created;
  }

  async getPersonas(): Promise<InterviewerPersona[]> {
    return db.select().from(interviewerPersonas);
  }

  async getPersona(id: number): Promise<InterviewerPersona | undefined> {
    const [persona] = await db.select().from(interviewerPersonas).where(eq(interviewerPersonas.id, id));
    return persona;
  }

  async createPersona(persona: InsertInterviewerPersona): Promise<InterviewerPersona> {
    const [created] = await db.insert(interviewerPersonas).values(persona).returning();
    return created;
  }

  async getSessions(userId: string): Promise<PracticeSession[]> {
    return db.select().from(practiceSessions).where(eq(practiceSessions.userId, userId)).orderBy(desc(practiceSessions.createdAt));
  }

  async getSession(id: number): Promise<PracticeSession | undefined> {
    const [session] = await db.select().from(practiceSessions).where(eq(practiceSessions.id, id));
    return session;
  }

  async createSession(session: InsertPracticeSession): Promise<PracticeSession> {
    const [created] = await db.insert(practiceSessions).values(session).returning();
    return created;
  }

  async updateSession(id: number, updates: Partial<PracticeSession>): Promise<PracticeSession | undefined> {
    const [updated] = await db.update(practiceSessions).set(updates).where(eq(practiceSessions.id, id)).returning();
    return updated;
  }

  async deleteSession(id: number): Promise<void> {
    await db.delete(practiceSessions).where(eq(practiceSessions.id, id));
  }

  async getSessionMessages(sessionId: number): Promise<SessionMessage[]> {
    return db.select().from(sessionMessages).where(eq(sessionMessages.sessionId, sessionId)).orderBy(sessionMessages.createdAt);
  }

  async createSessionMessage(message: InsertSessionMessage): Promise<SessionMessage> {
    const [created] = await db.insert(sessionMessages).values(message).returning();
    return created;
  }

  async getSessionFeedback(sessionId: number): Promise<SessionFeedback | undefined> {
    const [feedback] = await db.select().from(sessionFeedback).where(eq(sessionFeedback.sessionId, sessionId));
    return feedback;
  }

  async createSessionFeedback(feedback: InsertSessionFeedback): Promise<SessionFeedback> {
    const [created] = await db.insert(sessionFeedback).values(feedback).returning();
    return created;
  }

  async getUserPreferences(userId: string): Promise<UserPreferences | undefined> {
    const [prefs] = await db.select().from(userPreferences).where(eq(userPreferences.userId, userId));
    return prefs;
  }

  async upsertUserPreferences(prefs: InsertUserPreferences): Promise<UserPreferences> {
    const [created] = await db
      .insert(userPreferences)
      .values(prefs)
      .onConflictDoUpdate({
        target: userPreferences.userId,
        set: { ...prefs, updatedAt: new Date() },
      })
      .returning();
    return created;
  }
}

export const storage = new DatabaseStorage();
