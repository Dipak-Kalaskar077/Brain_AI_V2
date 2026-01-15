import bcrypt from 'bcryptjs';
import { sql } from 'drizzle-orm';
import type { ResultSetHeader } from 'mysql2';
import { 
  users, type User, type InsertUser,
  messages, type Message, type InsertMessage
} from "@shared/schema";
import { getDb } from './db';
import { eq } from 'drizzle-orm';

export class DbStorage {
  async getUser(id: number): Promise<User | undefined> {
    try {
      const db = await getDb();
      const [user] = await db.select().from(users).where(eq(users.id, id));
      return user;
    } catch (error) {
      console.error('Error getting user by ID:', error);
      throw error;
    }
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    try {
      const db = await getDb();
      const [user] = await db.select().from(users)
        .where(eq(users.username, username.toLowerCase()));
      return user;
    } catch (error) {
      console.error('Error getting user by username:', error);
      throw error;
    }
  }

  async createUser(user: InsertUser): Promise<User> {
    try {
      // Check if username exists first
      const existingUser = await this.getUserByUsername(user.username);
      if (existingUser) {
        throw new Error('Username already exists');
      }

      const db = await getDb();
      const hashedPassword = await bcrypt.hash(user.password, 10);
      const result = await db.insert(users).values({
        username: user.username.toLowerCase(),
        password: hashedPassword
      });
      
      // Get the created user
      const [newUser] = await db.select().from(users).where(eq(users.username, user.username.toLowerCase()));
      return newUser;
    } catch (error) {
      console.error('Error creating user:', error);
      throw error;
    }
  }

  async saveMessage(message: InsertMessage): Promise<Message> {
    try {
      const db = await getDb();
      const result = await db.insert(messages).values(message) as unknown as ResultSetHeader;
      const [newMessage] = await db.select().from(messages).where(eq(messages.id, result.insertId));
      return { ...newMessage, timestamp: new Date() };
    } catch (error) {
      console.error('Error saving message:', error);
      throw error;
    }
  }

  async getMessagesByUserId(userId: number, limit: number = 100): Promise<Message[]> {
    try {
      const db = await getDb();
      return await db.select().from(messages)
        .where(eq(messages.userId, userId))
        .orderBy(messages.timestamp)
        .limit(limit);
    } catch (error) {
      console.error('Error getting messages:', error);
      throw error;
    }
  }
}

export const storage = new DbStorage();
