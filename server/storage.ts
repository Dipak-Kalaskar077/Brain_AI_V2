import { 
  users, type User, type InsertUser,
  messages, type Message, type InsertMessage
} from "@shared/schema";

// modify the interface with any CRUD methods
// you might need

export interface IStorage {
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  saveMessage(message: InsertMessage): Promise<Message>;
  getMessagesByUserId(userId: number, limit?: number): Promise<Message[]>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private messages: Map<number, Message>;
  private userIdCounter: number;
  private messageIdCounter: number;

  constructor() {
    this.users = new Map();
    this.messages = new Map();
    this.userIdCounter = 1;
    this.messageIdCounter = 1;
  }

  async getUser(id: number): Promise<User | undefined> {
    // Just return the user without auto-creation - we'll handle creation in the routes
    const user = this.users.get(id);
    if (!user) {
      console.log(`User with ID ${id} not found in storage`);
      return undefined;
    }
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.userIdCounter++;
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }

  async saveMessage(insertMessage: InsertMessage): Promise<Message> {
    const id = this.messageIdCounter++;
    const message: Message = { 
      ...insertMessage, 
      id, 
      timestamp: new Date() 
    };
    this.messages.set(id, message);
    return message;
  }

  async getMessagesByUserId(userId: number, limit: number = 100): Promise<Message[]> {
    // Filter messages by user ID
    const userMessages = Array.from(this.messages.values())
      .filter(message => message.userId === userId);
    
    // Sort by timestamp (newest first for queries, oldest first for display)
    const sortedMessages = userMessages.sort((a, b) => 
      // For API/UI: sort by descending to get most recent first (newest on top)
      b.timestamp.getTime() - a.timestamp.getTime()
    );
    
    // Return limited number of messages 
    return sortedMessages.slice(0, limit);
  }
}

export const storage = new MemStorage();
