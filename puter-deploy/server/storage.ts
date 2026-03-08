import { users, type User, type InsertUser } from "@shared/schema";

// modify the interface with any CRUD methods
// you might need

export interface IStorage {
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  getDb(): any; // Return database instance for leaderboard operations
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  currentId: number;
  private db: any = null;

  constructor() {
    this.users = new Map();
    this.currentId = 1;
    this.initializeDb();
  }

  private async initializeDb() {
    try {
      // Check if we have database environment variables
      if (process.env.DATABASE_URL) {
        const { drizzle } = await import("drizzle-orm/neon-http");
        const { neon } = await import("@neondatabase/serverless");
        
        const sql = neon(process.env.DATABASE_URL);
        this.db = drizzle(sql);
        
        console.log("Database connected successfully");
      } else {
        console.log("No DATABASE_URL found, using in-memory storage only");
      }
    } catch (error) {
      console.error("Database connection failed:", error);
    }
  }

  getDb() {
    return this.db;
  }

  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentId++;
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }
}

export const storage = new MemStorage();
