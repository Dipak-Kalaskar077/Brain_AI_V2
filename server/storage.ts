import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import {
  users, type User, type InsertUser,
  messages, type Message, type InsertMessage
} from "@shared/schema";
import { db } from "./db";

export class DbStorage {

  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.username, username.toLowerCase()));
    return user;
  }

  async createUser(user: InsertUser): Promise<User> {
    const existingUser = await this.getUserByUsername(user.username);
    if (existingUser) {
      throw new Error("Username already exists");
    }

    const hashedPassword = await bcrypt.hash(user.password, 10);

    const [newUser] = await db
      .insert(users)
      .values({
        username: user.username.toLowerCase(),
        password: hashedPassword,
      })
      .returning();

    return newUser;
  }

  async saveMessage(message: InsertMessage): Promise<Message> {
    const [newMessage] = await db
      .insert(messages)
      .values(message)
      .returning();

    return newMessage;
  }

  async getMessagesByUserId(
    userId: number,
    limit: number = 100
  ): Promise<Message[]> {
    return await db
      .select()
      .from(messages)
      .where(eq(messages.userId, userId))
      .orderBy(messages.timestamp)
      .limit(limit);
  }
}

export const storage = new DbStorage();
