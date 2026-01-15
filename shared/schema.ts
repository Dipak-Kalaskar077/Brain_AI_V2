import { mysqlTable, varchar, int, timestamp } from "drizzle-orm/mysql-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = mysqlTable("users", {
  id: int("id").primaryKey().autoincrement(),
  username: varchar("username", { length: 255 }).notNull().unique(),
  password: varchar("password", { length: 255 }).notNull(),
});

export const messages = mysqlTable("messages", {
  id: int("id").primaryKey().autoincrement(),
  userId: int("user_id").notNull(),
  content: varchar("content", { length: 1000 }).notNull(),
  aiResponse: varchar("ai_response", { length: 1000 }).notNull(),
  model: varchar("model", { length: 50 }).notNull(),
  timestamp: timestamp("timestamp").defaultNow().notNull(),
});

export const insertUserSchema = createInsertSchema(users).extend({
  username: z.string().min(2, "Username must be at least 2 characters"),
  password: z.string().min(4, "Password must be at least 4 characters")
});

export const insertMessageSchema = createInsertSchema(messages).pick({
  userId: true,
  content: true,
  aiResponse: true,
  model: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export type InsertMessage = z.infer<typeof insertMessageSchema>;
export type Message = typeof messages.$inferSelect;

export type ChatModel = "gemini";

export type ChatMessage = {
  id?: number;
  sender: "user" | "ai";
  content: string;
  timestamp: string;
  model?: ChatModel;
};
