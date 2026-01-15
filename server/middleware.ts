import { Request, Response, NextFunction } from 'express';
import rateLimit from 'express-rate-limit';
import { z } from 'zod';

// Rate limiting middleware
export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.'
});

// Chat rate limiter - more strict for AI endpoints
export const chatLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10, // Limit each IP to 10 requests per minute
  message: 'Too many chat requests, please wait a minute.'
});

// Input validation schemas
const authSchema = z.object({
  username: z.string().min(3).max(50),
  password: z.string().min(6).max(100)
});

const chatSchema = z.object({
  userId: z.union([z.number(), z.string().transform(val => Number(val))]).pipe(z.number().positive()),
  content: z.string().min(1).max(1000),
  username: z.string().optional(),
  model: z.enum(['gemini']).optional()
});

// Validation middleware
export const validateAuth = (req: Request, res: Response, next: NextFunction) => {
  const result = authSchema.safeParse(req.body);
  if (!result.success) {
    return res.status(400).json({
      message: 'Invalid input',
      errors: result.error.errors
    });
  }
  next();
};

export const validateChat = (req: Request, res: Response, next: NextFunction) => {
  console.log('[VALIDATE] Validating chat request:', {
    userId: req.body.userId,
    userIdType: typeof req.body.userId,
    hasContent: !!req.body.content,
    contentLength: req.body.content?.length
  });
  
  const result = chatSchema.safeParse(req.body);
  if (!result.success) {
    console.error('[VALIDATE] Validation failed:', result.error.errors);
    return res.status(400).json({
      message: 'Invalid chat input',
      errors: result.error.errors
    });
  }
  
  // Transform userId to number if it was a string
  if (typeof req.body.userId === 'string') {
    req.body.userId = Number(req.body.userId);
  }
  
  console.log('[VALIDATE] Validation passed');
  next();
};

// Error handling middleware
export const errorHandler = (err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error(err.stack);
  res.status(500).json({
    message: 'Internal server error',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
};