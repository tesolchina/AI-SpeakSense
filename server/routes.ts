import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import OpenAI from "openai";
import { storage } from "./storage";
import { setupAuth, registerAuthRoutes, isAuthenticated } from "./replit_integrations/auth";
import { createGoogleAuthRouter } from "../google-auth-module/src/server/router";
import {
  insertPracticeSessionSchema,
  insertSessionMessageSchema,
  insertUserPreferencesSchema,
} from "@shared/schema";

const openai = new OpenAI({
  apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY,
  baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
});

const DEFAULT_TEMPLATES = [
  {
    name: "Behavioral Interview",
    category: "behavioral",
    description: "Practice answering questions about past experiences using the STAR method.",
    rubricItems: ["Clear situation context", "Specific actions taken", "Measurable results", "Active listening"],
    defaultQuestions: [
      "Tell me about yourself.",
      "Describe a challenging situation at work and how you handled it.",
      "Give an example of a time you showed leadership.",
      "Tell me about a time you failed and what you learned.",
    ],
    difficulty: "medium",
  },
  {
    name: "Technical Interview",
    category: "technical",
    description: "Explain your technical skills, projects, and problem-solving approach.",
    rubricItems: ["Technical accuracy", "Clear explanations", "Structured thinking", "Problem-solving approach"],
    defaultQuestions: [
      "Walk me through a technical project you're proud of.",
      "How do you approach debugging a complex issue?",
      "Explain a technical concept to me as if I'm non-technical.",
      "What technologies are you most excited about learning?",
    ],
    difficulty: "hard",
  },
  {
    name: "General Interview",
    category: "behavioral",
    description: "A mix of common interview questions to help you prepare broadly.",
    rubricItems: ["Communication clarity", "Confidence", "Relevance of answers", "Enthusiasm"],
    defaultQuestions: [
      "Why are you interested in this role?",
      "What are your greatest strengths?",
      "Where do you see yourself in 5 years?",
      "Do you have any questions for me?",
    ],
    difficulty: "easy",
  },
];

const DEFAULT_PERSONAS = [
  {
    name: "Alex",
    style: "friendly",
    description: "A supportive interviewer who helps you feel comfortable and provides encouragement.",
    systemPrompt: "You are Alex, a friendly and supportive interviewer. Your goal is to help the candidate feel comfortable while still conducting a professional interview. Be encouraging, ask follow-up questions when appropriate, and provide a positive interview experience. Keep responses conversational and under 150 words.",
  },
  {
    name: "Jordan",
    style: "professional",
    description: "A balanced, straightforward interviewer focused on evaluating qualifications.",
    systemPrompt: "You are Jordan, a professional and balanced interviewer. Your goal is to fairly evaluate the candidate's qualifications through thoughtful questions. Be direct but respectful, ask clarifying questions, and maintain a neutral tone. Keep responses concise and under 150 words.",
  },
  {
    name: "Morgan",
    style: "challenging",
    description: "A rigorous interviewer who asks follow-up questions and pushes you to be specific.",
    systemPrompt: "You are Morgan, a challenging interviewer who pushes candidates to give their best. Ask probing follow-up questions, request specific examples, and challenge vague answers. Be professional but demanding. Keep responses focused and under 150 words.",
  },
];

async function initializeDefaults() {
  try {
    const templates = await storage.getTemplates();
    if (templates.length === 0) {
      for (const template of DEFAULT_TEMPLATES) {
        await storage.createTemplate(template);
      }
      console.log("Default templates initialized");
    }

    const personas = await storage.getPersonas();
    if (personas.length === 0) {
      for (const persona of DEFAULT_PERSONAS) {
        await storage.createPersona(persona);
      }
      console.log("Default personas initialized");
    }
  } catch (error) {
    console.error("Error initializing defaults (non-fatal):", error);
  }
}

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  await setupAuth(app);
  registerAuthRoutes(app);

  // Google Sign-In (if credentials are configured)
  if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
    const appUrl = process.env.REPLIT_DEV_DOMAIN 
      ? `https://${process.env.REPLIT_DEV_DOMAIN}` 
      : process.env.APP_URL || "http://localhost:5000";
    
    const googleAuthRouter = createGoogleAuthRouter({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      redirectUri: `${appUrl}/api/google-auth/google/callback`,
      successRedirect: "/",
      failureRedirect: "/",
      scopes: ["openid", "email", "profile"],
      onUserAuthenticated: async (user) => {
        console.log("Google user authenticated:", user.email);
      },
    });
    
    app.use("/api/google-auth", googleAuthRouter);
    console.log("Google Sign-In enabled");
  }

  await initializeDefaults();

  app.get("/api/templates", async (req: Request, res: Response) => {
    try {
      const templates = await storage.getTemplates();
      res.json(templates);
    } catch (error) {
      console.error("Error fetching templates:", error);
      res.status(500).json({ error: "Failed to fetch templates" });
    }
  });

  app.get("/api/personas", async (req: Request, res: Response) => {
    try {
      const personas = await storage.getPersonas();
      res.json(personas);
    } catch (error) {
      console.error("Error fetching personas:", error);
      res.status(500).json({ error: "Failed to fetch personas" });
    }
  });

  app.get("/api/sessions", isAuthenticated, async (req: any, res: Response) => {
    try {
      const userId = req.user.claims.sub;
      const sessions = await storage.getSessions(userId);
      res.json(sessions);
    } catch (error) {
      console.error("Error fetching sessions:", error);
      res.status(500).json({ error: "Failed to fetch sessions" });
    }
  });

  app.get("/api/sessions/:id", isAuthenticated, async (req: any, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const session = await storage.getSession(id);
      if (!session) {
        return res.status(404).json({ error: "Session not found" });
      }
      const messages = await storage.getSessionMessages(id);
      const feedback = await storage.getSessionFeedback(id);
      res.json({ ...session, messages, feedback });
    } catch (error) {
      console.error("Error fetching session:", error);
      res.status(500).json({ error: "Failed to fetch session" });
    }
  });

  app.post("/api/sessions", isAuthenticated, async (req: any, res: Response) => {
    try {
      const userId = req.user.claims.sub;
      
      const parseResult = insertPracticeSessionSchema.safeParse({
        userId,
        templateId: req.body.templateId ? Number(req.body.templateId) : null,
        personaId: req.body.personaId ? Number(req.body.personaId) : null,
        role: req.body.role || null,
        company: req.body.company || null,
        status: "setup",
      });

      if (!parseResult.success) {
        return res.status(400).json({ error: "Invalid session data", details: parseResult.error.flatten() });
      }

      const session = await storage.createSession(parseResult.data);
      res.status(201).json(session);
    } catch (error) {
      console.error("Error creating session:", error);
      res.status(500).json({ error: "Failed to create session" });
    }
  });

  app.post("/api/sessions/:id/start", isAuthenticated, async (req: any, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const session = await storage.getSession(id);
      if (!session) {
        return res.status(404).json({ error: "Session not found" });
      }

      await storage.updateSession(id, { status: "in_progress", startedAt: new Date() });

      const template = session.templateId ? await storage.getTemplate(session.templateId) : null;
      const persona = session.personaId ? await storage.getPersona(session.personaId) : null;

      const systemPrompt = persona?.systemPrompt || DEFAULT_PERSONAS[0].systemPrompt;
      const questions = template?.defaultQuestions || DEFAULT_TEMPLATES[0].defaultQuestions;
      const firstQuestion = questions[Math.floor(Math.random() * questions.length)];

      const roleContext = session.role ? `The candidate is interviewing for a ${session.role} position.` : "";
      const companyContext = session.company ? `The interview is for ${session.company}.` : "";

      res.setHeader("Content-Type", "text/event-stream");
      res.setHeader("Cache-Control", "no-cache");
      res.setHeader("Connection", "keep-alive");

      const stream = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: `${systemPrompt}\n\n${roleContext} ${companyContext}\n\nStart the interview by greeting the candidate and asking this question: "${firstQuestion}"`,
          },
        ],
        stream: true,
        max_completion_tokens: 512,
      });

      let fullResponse = "";

      for await (const chunk of stream) {
        const content = chunk.choices[0]?.delta?.content || "";
        if (content) {
          fullResponse += content;
          res.write(`data: ${JSON.stringify({ content })}\n\n`);
        }
      }

      await storage.createSessionMessage({
        sessionId: id,
        role: "assistant",
        content: fullResponse,
      });

      res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
      res.end();
    } catch (error) {
      console.error("Error starting session:", error);
      if (!res.headersSent) {
        res.status(500).json({ error: "Failed to start session" });
      } else {
        res.write(`data: ${JSON.stringify({ error: "Failed to start session" })}\n\n`);
        res.end();
      }
    }
  });

  app.post("/api/sessions/:id/messages", isAuthenticated, async (req: any, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const content = req.body?.content;

      if (!content || typeof content !== "string" || content.trim().length === 0) {
        return res.status(400).json({ error: "Message content is required" });
      }

      const session = await storage.getSession(id);
      if (!session) {
        return res.status(404).json({ error: "Session not found" });
      }

      await storage.createSessionMessage({
        sessionId: id,
        role: "user",
        content,
      });

      const messages = await storage.getSessionMessages(id);
      const template = session.templateId ? await storage.getTemplate(session.templateId) : null;
      const persona = session.personaId ? await storage.getPersona(session.personaId) : null;

      const systemPrompt = persona?.systemPrompt || DEFAULT_PERSONAS[0].systemPrompt;
      const questions = template?.defaultQuestions || DEFAULT_TEMPLATES[0].defaultQuestions;

      const roleContext = session.role ? `The candidate is interviewing for a ${session.role} position.` : "";
      const companyContext = session.company ? `The interview is for ${session.company}.` : "";

      const chatMessages = [
        {
          role: "system" as const,
          content: `${systemPrompt}\n\n${roleContext} ${companyContext}\n\nAvailable questions to ask: ${questions.join(", ")}`,
        },
        ...messages.map((m) => ({
          role: m.role as "user" | "assistant",
          content: m.content,
        })),
      ];

      res.setHeader("Content-Type", "text/event-stream");
      res.setHeader("Cache-Control", "no-cache");
      res.setHeader("Connection", "keep-alive");

      const stream = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: chatMessages,
        stream: true,
        max_completion_tokens: 512,
      });

      let fullResponse = "";

      for await (const chunk of stream) {
        const responseContent = chunk.choices[0]?.delta?.content || "";
        if (responseContent) {
          fullResponse += responseContent;
          res.write(`data: ${JSON.stringify({ content: responseContent })}\n\n`);
        }
      }

      await storage.createSessionMessage({
        sessionId: id,
        role: "assistant",
        content: fullResponse,
      });

      res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
      res.end();
    } catch (error) {
      console.error("Error sending message:", error);
      if (!res.headersSent) {
        res.status(500).json({ error: "Failed to send message" });
      } else {
        res.write(`data: ${JSON.stringify({ error: "Failed to send message" })}\n\n`);
        res.end();
      }
    }
  });

  app.post("/api/sessions/:id/end", isAuthenticated, async (req: any, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const session = await storage.getSession(id);
      if (!session) {
        return res.status(404).json({ error: "Session not found" });
      }

      await storage.updateSession(id, { status: "completed", completedAt: new Date() });

      const messages = await storage.getSessionMessages(id);
      const template = session.templateId ? await storage.getTemplate(session.templateId) : null;
      const rubricItems = template?.rubricItems || ["Communication clarity", "Structure", "Relevance"];

      const userResponses = messages.filter((m) => m.role === "user").map((m) => m.content);

      if (userResponses.length > 0) {
        const feedbackPrompt = `Evaluate this interview candidate based on these criteria: ${rubricItems.join(", ")}.

Candidate responses:
${userResponses.join("\n\n")}

Provide feedback in this JSON format:
{
  "overallScore": <number 1-100>,
  "rubricScores": { ${rubricItems.map((r) => `"${r.toLowerCase().replace(/\s+/g, "_")}": <number 1-100>`).join(", ")} },
  "strengths": ["<strength 1>", "<strength 2>"],
  "improvements": ["<area 1>", "<area 2>"],
  "summary": "<brief summary>"
}`;

        const response = await openai.chat.completions.create({
          model: "gpt-4o",
          messages: [{ role: "user", content: feedbackPrompt }],
          response_format: { type: "json_object" },
          max_completion_tokens: 1024,
        });

        const feedbackData = JSON.parse(response.choices[0]?.message?.content || "{}");

        await storage.createSessionFeedback({
          sessionId: id,
          overallScore: feedbackData.overallScore,
          rubricScores: feedbackData.rubricScores,
          strengths: feedbackData.strengths,
          improvements: feedbackData.improvements,
          summary: feedbackData.summary,
        });
      }

      const updatedSession = await storage.getSession(id);
      const feedback = await storage.getSessionFeedback(id);
      res.json({ ...updatedSession, feedback });
    } catch (error) {
      console.error("Error ending session:", error);
      res.status(500).json({ error: "Failed to end session" });
    }
  });

  app.delete("/api/sessions/:id", isAuthenticated, async (req: any, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteSession(id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting session:", error);
      res.status(500).json({ error: "Failed to delete session" });
    }
  });

  app.get("/api/stats", isAuthenticated, async (req: any, res: Response) => {
    try {
      const userId = req.user.claims.sub;
      const sessions = await storage.getSessions(userId);
      const completed = sessions.filter((s) => s.status === "completed");

      let totalScore = 0;
      let scoreCount = 0;

      for (const session of completed) {
        const feedback = await storage.getSessionFeedback(session.id);
        if (feedback?.overallScore) {
          totalScore += feedback.overallScore;
          scoreCount++;
        }
      }

      res.json({
        totalSessions: sessions.length,
        completedSessions: completed.length,
        averageScore: scoreCount > 0 ? Math.round(totalScore / scoreCount) : null,
        streak: 0,
      });
    } catch (error) {
      console.error("Error fetching stats:", error);
      res.status(500).json({ error: "Failed to fetch stats" });
    }
  });

  app.get("/api/preferences", isAuthenticated, async (req: any, res: Response) => {
    try {
      const userId = req.user.claims.sub;
      const prefs = await storage.getUserPreferences(userId);
      res.json(prefs || { onboardingComplete: false });
    } catch (error) {
      console.error("Error fetching preferences:", error);
      res.status(500).json({ error: "Failed to fetch preferences" });
    }
  });

  app.post("/api/preferences", isAuthenticated, async (req: any, res: Response) => {
    try {
      const userId = req.user.claims.sub;
      const { intent, onboardingComplete } = req.body;

      const prefs = await storage.upsertUserPreferences({
        userId,
        intent,
        onboardingComplete,
      });

      res.json(prefs);
    } catch (error) {
      console.error("Error saving preferences:", error);
      res.status(500).json({ error: "Failed to save preferences" });
    }
  });

  return httpServer;
}
