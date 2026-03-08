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
      // GAME_DATABASE_URL (helium parent DB) takes priority, then DATABASE_URL
      const url = process.env.GAME_DATABASE_URL || process.env.DATABASE_URL;
      if (url) {
        // Use node-postgres for standard PG (helium) and neon-http for Neon cloud
        if (url.includes('neon.tech') || url.includes('neondb')) {
          const { drizzle } = await import("drizzle-orm/neon-http");
          const { neon } = await import("@neondatabase/serverless");
          this.db = drizzle(neon(url));
        } else {
          const { drizzle } = await import("drizzle-orm/node-postgres");
          const { Pool } = await import("pg");
          const pool = new Pool({ connectionString: url, ssl: false });
          this.db = drizzle(pool);
        }
        const dbSource = process.env.GAME_DATABASE_URL ? 'helium (parent app)' : 'DATABASE_URL';
        console.log(`Database connected successfully [${dbSource}]`);
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
