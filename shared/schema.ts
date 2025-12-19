import { sql, relations } from "drizzle-orm";
import { pgTable, text, varchar, serial, integer, timestamp, jsonb, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Re-export auth models
export * from "./models/auth";

// Practice session templates
export const practiceTemplates = pgTable("practice_templates", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  category: text("category").notNull(), // "behavioral", "technical", "sales", "presentation"
  rubricItems: text("rubric_items").array().notNull(),
  defaultQuestions: text("default_questions").array().notNull(),
  difficulty: text("difficulty").default("medium"), // "easy", "medium", "hard"
});

// Interviewer personas
export const interviewerPersonas = pgTable("interviewer_personas", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  style: text("style").notNull(), // "friendly", "professional", "challenging"
  description: text("description"),
  systemPrompt: text("system_prompt").notNull(),
  avatarUrl: text("avatar_url"),
});

// Practice sessions
export const practiceSessions = pgTable("practice_sessions", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull(),
  templateId: integer("template_id").references(() => practiceTemplates.id),
  personaId: integer("persona_id").references(() => interviewerPersonas.id),
  role: text("role"), // Job role being practiced for
  company: text("company"), // Target company
  status: text("status").notNull().default("setup"), // "setup", "in_progress", "completed"
  startedAt: timestamp("started_at"),
  completedAt: timestamp("completed_at"),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
});

// Session messages (the conversation)
export const sessionMessages = pgTable("session_messages", {
  id: serial("id").primaryKey(),
  sessionId: integer("session_id").notNull().references(() => practiceSessions.id, { onDelete: "cascade" }),
  role: text("role").notNull(), // "user" or "assistant"
  content: text("content").notNull(),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
});

// Session feedback/scores
export const sessionFeedback = pgTable("session_feedback", {
  id: serial("id").primaryKey(),
  sessionId: integer("session_id").notNull().references(() => practiceSessions.id, { onDelete: "cascade" }),
  overallScore: integer("overall_score"), // 1-100
  rubricScores: jsonb("rubric_scores"), // { "clarity": 85, "structure": 70, ... }
  strengths: text("strengths").array(),
  improvements: text("improvements").array(),
  summary: text("summary"),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
});

// User preferences (for onboarding)
export const userPreferences = pgTable("user_preferences", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().unique(),
  intent: text("intent"), // "interview", "sales", "presentation", "coaching"
  onboardingComplete: boolean("onboarding_complete").default(false),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
  updatedAt: timestamp("updated_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
});

// Relations
export const practiceSessionsRelations = relations(practiceSessions, ({ one, many }) => ({
  template: one(practiceTemplates, {
    fields: [practiceSessions.templateId],
    references: [practiceTemplates.id],
  }),
  persona: one(interviewerPersonas, {
    fields: [practiceSessions.personaId],
    references: [interviewerPersonas.id],
  }),
  messages: many(sessionMessages),
  feedback: one(sessionFeedback),
}));

export const sessionMessagesRelations = relations(sessionMessages, ({ one }) => ({
  session: one(practiceSessions, {
    fields: [sessionMessages.sessionId],
    references: [practiceSessions.id],
  }),
}));

export const sessionFeedbackRelations = relations(sessionFeedback, ({ one }) => ({
  session: one(practiceSessions, {
    fields: [sessionFeedback.sessionId],
    references: [practiceSessions.id],
  }),
}));

// Insert schemas
export const insertPracticeTemplateSchema = createInsertSchema(practiceTemplates).omit({ id: true });
export const insertInterviewerPersonaSchema = createInsertSchema(interviewerPersonas).omit({ id: true });
export const insertPracticeSessionSchema = createInsertSchema(practiceSessions).omit({ id: true, createdAt: true });
export const insertSessionMessageSchema = createInsertSchema(sessionMessages).omit({ id: true, createdAt: true });
export const insertSessionFeedbackSchema = createInsertSchema(sessionFeedback).omit({ id: true, createdAt: true });
export const insertUserPreferencesSchema = createInsertSchema(userPreferences).omit({ id: true, createdAt: true, updatedAt: true });

// Types
export type PracticeTemplate = typeof practiceTemplates.$inferSelect;
export type InsertPracticeTemplate = z.infer<typeof insertPracticeTemplateSchema>;
export type InterviewerPersona = typeof interviewerPersonas.$inferSelect;
export type InsertInterviewerPersona = z.infer<typeof insertInterviewerPersonaSchema>;
export type PracticeSession = typeof practiceSessions.$inferSelect;
export type InsertPracticeSession = z.infer<typeof insertPracticeSessionSchema>;
export type SessionMessage = typeof sessionMessages.$inferSelect;
export type InsertSessionMessage = z.infer<typeof insertSessionMessageSchema>;
export type SessionFeedback = typeof sessionFeedback.$inferSelect;
export type InsertSessionFeedback = z.infer<typeof insertSessionFeedbackSchema>;
export type UserPreferences = typeof userPreferences.$inferSelect;
export type InsertUserPreferences = z.infer<typeof insertUserPreferencesSchema>;
