import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { aiService } from "./ai-service";
import { z } from "zod";
import { insertUserSchema, insertMessageSchema, type ChatModel } from "@shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
  // put application routes here
  // prefix all routes with /api

  // Register or login user
  app.post("/api/auth", async (req: Request, res: Response) => {
    try {
      const validation = insertUserSchema.safeParse(req.body);
      
      if (!validation.success) {
        return res.status(400).json({ message: "Invalid user data" });
      }
      
      const { username, password } = validation.data;
      
      // Check if user exists
      let user = await storage.getUserByUsername(username);
      
      if (!user) {
        // Create new user
        user = await storage.createUser({ username, password });
      } else {
        // Check password for existing user (simple check)
        if (user.password !== password) {
          return res.status(401).json({ message: "Invalid credentials" });
        }
      }
      
      // Return user without password
      const { password: _, ...userWithoutPassword } = user;
      res.status(200).json(userWithoutPassword);
    } catch (error: any) {
      console.error("Auth error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Get chat messages
  app.get("/api/messages/:userId?", async (req: Request, res: Response) => {
    try {
      // If userId is not provided, return empty array
      if (!req.params.userId) {
        return res.status(200).json([]);
      }
      
      const userId = parseInt(req.params.userId);
      
      if (isNaN(userId)) {
        return res.status(400).json({ message: "Invalid user ID" });
      }
      
      const messages = await storage.getMessagesByUserId(userId);
      res.status(200).json(messages);
    } catch (error: any) {
      console.error("Get messages error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Send message to AI and get response
  app.post("/api/chat", async (req: Request, res: Response) => {
    try {
      const messageSchema = z.object({
        userId: z.number(),
        content: z.string().min(1),
        model: z.enum(["gemini"]) // Only allow gemini model
      });
      
      const validation = messageSchema.safeParse(req.body);
      
      if (!validation.success) {
        return res.status(400).json({ message: "Invalid message data" });
      }
      
      const { userId, content } = validation.data;
      const model = "gemini"; // Always use gemini
      
      // Get user
      const user = await storage.getUser(userId);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Generate AI response using only Gemini
      const aiResponse = await aiService.generateResponse(content, user.username);
      
      // Save message to storage
      const savedMessage = await storage.saveMessage({
        userId,
        content,
        aiResponse,
        model
      });
      
      res.status(200).json({
        id: savedMessage.id,
        userMessage: content,
        aiResponse,
        timestamp: savedMessage.timestamp,
        model
      });
    } catch (error: any) {
      console.error("Chat error:", error);
      if (error.message?.includes("API key not configured")) {
        return res.status(503).json({ message: "Gemini API key not configured" });
      }
      res.status(500).json({ message: "Error processing your request" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
