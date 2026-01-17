import type { Express, Request, Response } from "express";
import { z } from 'zod';
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { aiService } from "./ai-service"; // Import AIService class
import { insertUserSchema, type ChatModel } from "@shared/schema";
import bcrypt from 'bcryptjs';
import session from 'express-session';
import MemoryStore from 'memorystore';
import { apiLimiter, chatLimiter, validateAuth, validateChat } from './middleware';
import { detectOpenCommand, openApplication, openWebsite } from './system-commands';

const isDev = process.env.NODE_ENV !== "production";


const SessionStore = MemoryStore(session);


export async function registerRoutes(app: Express): Promise<Server> {
  // Session configuration
  // Generate a random secret in development if not provided
  // In production, SESSION_SECRET must be set
  let sessionSecret = process.env.SESSION_SECRET;
  if (!sessionSecret) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('SESSION_SECRET environment variable is required in production');
    }
    // Generate a random secret for development
    sessionSecret = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    console.warn('⚠️  WARNING: SESSION_SECRET not set. Using random secret for development only.');
  }

  app.use(session({
    store: new SessionStore({ checkPeriod: 86400000 }),
    secret: sessionSecret,
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: process.env.NODE_ENV === 'production',
      maxAge: 24 * 60 * 60 * 1000,
      sameSite: 'lax'
    }
  }));

  
  
  // Auth endpoint
  app.post("/api/auth", apiLimiter, validateAuth, async (req: Request, res: Response) => {
    try {
      const { username, password } = req.body;
      
      if (!username || !password) {
        return res.status(400).json({ message: "Username and password required" });
      }

      const normalizedUsername = username.toLowerCase();
      console.log(`[AUTH] Attempting authentication for username: ${normalizedUsername}`);

      const user = await storage.getUserByUsername(normalizedUsername);
      
      if (!user) {
        console.log(`[AUTH] User not found, creating new user: ${normalizedUsername}`);
        const hashedPassword = await bcrypt.hash(password, 10);
        const newUser = await storage.createUser({
          username: normalizedUsername,
          password: hashedPassword
        });
        console.log(`[AUTH] New user created: ${newUser.username} (ID: ${newUser.id})`);
        return res.json({ id: newUser.id, username: newUser.username });
      }

      console.log(`[AUTH] User found: ${user.username} (ID: ${user.id})`);
      const isValid = await bcrypt.compare(password, user.password);
      
      if (!isValid) {
        console.log(`[AUTH] Password mismatch for user: ${normalizedUsername}`);
        return res.status(401).json({ message: "Invalid credentials" });
      }

      console.log(`[AUTH] Authentication successful for user: ${normalizedUsername}`);
      res.json({ id: user.id, username: user.username });
      
    } catch (error) {
      console.error("Auth error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Logout user with proper session destruction
  app.post("/api/logout", (req: Request, res: Response) => {
    console.log('[LOGOUT] Logout request received');
    req.session.destroy((err) => {
      if (err) {
        console.error("[LOGOUT] Session destruction error:", err);
        // Still clear cookie and return success to prevent frontend issues
        res.clearCookie('connect.sid');
        return res.status(200).json({ message: "Logged out successfully" });
      }
      console.log('[LOGOUT] Session destroyed successfully');
      res.clearCookie('connect.sid');
      res.status(200).json({ message: "Logged out successfully" });
    });
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
      
      if (isDev) {
        return res.status(200).json([]);
      }
      
      const messages = await storage.getMessagesByUserId(userId);
      res.status(200).json(messages);
      
    } catch (error: any) {
      console.error("Get messages error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Send message to AI and get response
  app.post("/api/chat", chatLimiter, validateChat, async (req: Request, res: Response) => {
    console.log('[CHAT] Received chat request:', { 
      userId: req.body.userId, 
      username: req.body.username,
      contentLength: req.body.content?.length,
      contentPreview: req.body.content?.substring(0, 50) + '...',
      model: req.body.model
    });
    try {
      const messageSchema = z.object({
        userId: z.number(),
        username: z.string().optional(),
        content: z.string().min(1),
        model: z.enum(["gemini"]).optional() // Make model optional since it's always gemini
      });
      
      const validation = messageSchema.safeParse(req.body);
      
      if (!validation.success) {
        console.error('[CHAT] Validation failed:', validation.error.errors);
        return res.status(400).json({ 
          message: "Invalid message data",
          errors: validation.error.errors
        });
      }
      
      if (isDev) {
        // DEV MODE: no DB, no persistence
        const aiResponse = await aiService.generateResponse(
          validation.data.content,
          validation.data.username || "DevUser",
          []
        );
      
        return res.status(200).json({
          id: Date.now(),
          userMessage: validation.data.content,
          aiResponse,
          timestamp: new Date(),
          model: "gemini",
          devMode: true
        });
      }
      

      // Extract data including the username
      let { userId } = validation.data;
      const { username: clientUsername, content } = validation.data;
      const model = "gemini"; // Always use gemini
      
      // Get user
      let user = await storage.getUser(userId);
      
      if (!user) {
        console.log(`User ID ${userId} not found in storage`);
        // Use client-provided username if available, otherwise generate one
        const username = clientUsername || `User_${userId}`;
        console.log(`Creating new user with username: ${username}`);
        
        user = await storage.createUser({
          username,
          password: 'guest'
        });
        
        // Update userId to the new user's ID
        userId = user.id;
      }
      
      // Check if this is a system command (open app/website)
      const commandDetection = detectOpenCommand(content);
      if (commandDetection.isCommand) {
        console.log(`[CHAT] Detected system command:`, commandDetection);
        
        let commandResult;
        if (commandDetection.url) {
          // Open website
          commandResult = await openWebsite(commandDetection.url);
        } else if (commandDetection.appName) {
          // Open application
          commandResult = await openApplication(commandDetection.appName);
        }
        
        if (commandResult) {
          const aiResponse = commandResult.success 
            ? `I've ${commandResult.message.toLowerCase()}. ${commandResult.output || ''}`
            : `I'm sorry, I couldn't ${commandResult.message.toLowerCase()}. ${commandResult.error || 'Please try again.'}`;
          
          // Save message to storage
          const savedMessage = await storage.saveMessage({
            userId,
            content,
            aiResponse,
            model
          });
          
          return res.status(200).json({
            id: savedMessage.id,
            userMessage: content,
            aiResponse,
            timestamp: savedMessage.timestamp,
            model,
            systemCommand: true
          });
        }
      }
      
      // Get previous messages for this user ID if any
      console.log(`[CHAT] Getting previous messages for user ${userId}...`);
      const previousMessages = await storage.getMessagesByUserId(userId, 10);
      console.log(`[CHAT] Found ${previousMessages.length} previous messages`);
      
      // Generate AI response using Gemini with the actual username
      console.log(`[CHAT] Generating AI response...`);
      const aiResponse = await aiService.generateResponse(
        content, 
        user.username || clientUsername || `User_${userId}`,
        previousMessages
      );
      console.log(`[CHAT] AI response generated successfully (${aiResponse.length} chars)`);
      
      // Save message to storage
      console.log(`[CHAT] Saving message to database...`);
      const savedMessage = await storage.saveMessage({
        userId,
        content,
        aiResponse,
        model
      });
      console.log(`[CHAT] Message saved with ID: ${savedMessage.id}`);
      
      // Return response without error
      return res.status(200).json({
        id: savedMessage.id,
        userMessage: content,
        aiResponse,
        timestamp: savedMessage.timestamp,
        model
      });
    } catch (error: any) {
      console.error('[CHAT] Error processing chat request:', error);
      console.error('[CHAT] Error details:', {
        message: error.message,
        stack: error.stack,
        name: error.name
      });
      
      if (error.message?.includes('API key not configured') || error.message?.includes('Gemini API')) {
        return res.status(503).json({ 
          message: 'Gemini API key not configured or invalid',
          details: error.message
        });
      }
      
      if (error.message?.includes('Rate limit')) {
        return res.status(429).json({ 
          message: error.message
        });
      }
      
      return res.status(500).json({ 
        message: error.message || 'Internal server error',
        ...(process.env.NODE_ENV === 'development' && { details: error.stack })
      });
    }
  });

  // Create and return the HTTP server
  const server = createServer(app);
  return server;
}
