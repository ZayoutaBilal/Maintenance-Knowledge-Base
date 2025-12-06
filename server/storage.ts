import { db } from "./db";
import { users, problems } from "@shared/schema";
import type { User, InsertUser, SafeUser, Problem, InsertProblem, UpdateProblem, ProblemFilter } from "@shared/schema";
import { eq, and, gte, lte, ilike, arrayContains, desc, sql } from "drizzle-orm";
import bcrypt from "bcrypt";

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  getAllUsers(): Promise<SafeUser[]>;
  createUser(user: InsertUser): Promise<SafeUser>;
  updateUser(id: string, data: Partial<InsertUser>): Promise<SafeUser | undefined>;
  deleteUser(id: string): Promise<boolean>;
  updateUserPassword(id: string, hashedPassword: string): Promise<boolean>;

  getProblem(id: string): Promise<Problem | undefined>;
  getAllProblems(filter?: ProblemFilter): Promise<Problem[]>;
  createProblem(problem: InsertProblem, createdBy: string): Promise<Problem>;
  updateProblem(id: string, data: UpdateProblem): Promise<Problem | undefined>;
  deleteProblem(id: string): Promise<boolean>;
  updateProblemEmbedding(id: string, embedding: number[]): Promise<boolean>;
  
  getStats(): Promise<{ totalProblems: number; totalUsers: number; recentProblems: number; totalTags: number; totalMachineParts: number }>;
  getUniqueTags(): Promise<string[]>;
  getUniqueMachineParts(): Promise<string[]>;
  getAllProblemsWithPagination(filter?: ProblemFilter): Promise<{ problems: Problem[]; total: number; page: number; totalPages: number }>;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id)).limit(1);
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username)).limit(1);
    return user;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email)).limit(1);
    return user;
  }

  async getAllUsers(): Promise<SafeUser[]> {
    const allUsers = await db.select({
      id: users.id,
      username: users.username,
      email: users.email,
      role: users.role,
      createdAt: users.createdAt,
      updatedAt: users.updatedAt,
    }).from(users).orderBy(desc(users.createdAt));
    return allUsers;
  }

  async createUser(user: InsertUser): Promise<SafeUser> {
    const hashedPassword = await bcrypt.hash(user.password, 10);
    const [newUser] = await db.insert(users).values({
      ...user,
      password: hashedPassword,
      role: user.role || "visitor",
    }).returning();
    
    const { password: _, ...safeUser } = newUser;
    return safeUser;
  }

  async updateUser(id: string, data: Partial<InsertUser>): Promise<SafeUser | undefined> {
    const updateData: Record<string, any> = { ...data, updatedAt: new Date() };
    
    if (data.password) {
      updateData.password = await bcrypt.hash(data.password, 10);
    }

    const [updated] = await db.update(users)
      .set(updateData)
      .where(eq(users.id, id))
      .returning();

    if (!updated) return undefined;
    const { password: _, ...safeUser } = updated;
    return safeUser;
  }

  async deleteUser(id: string): Promise<boolean> {
    const result = await db.delete(users).where(eq(users.id, id)).returning();
    return result.length > 0;
  }

  async updateUserPassword(id: string, hashedPassword: string): Promise<boolean> {
    const result = await db.update(users)
      .set({ password: hashedPassword, updatedAt: new Date() })
      .where(eq(users.id, id))
      .returning();
    return result.length > 0;
  }

  async getProblem(id: string): Promise<Problem | undefined> {
    const [problem] = await db.select().from(problems).where(eq(problems.id, id)).limit(1);
    return problem;
  }

  async getAllProblems(filter?: ProblemFilter): Promise<Problem[]> {
    let query = db.select().from(problems);
    
    const conditions: any[] = [];
    
    if (filter?.startDate) {
      conditions.push(gte(problems.date, new Date(filter.startDate)));
    }
    if (filter?.endDate) {
      conditions.push(lte(problems.date, new Date(filter.endDate)));
    }
    if (filter?.machinePart) {
      conditions.push(eq(problems.machinePart, filter.machinePart));
    }
    if (filter?.createdBy) {
      conditions.push(eq(problems.createdBy, filter.createdBy));
    }
    if (filter?.search) {
      conditions.push(
        sql`(${problems.problem} ILIKE ${'%' + filter.search + '%'} OR ${problems.solution} ILIKE ${'%' + filter.search + '%'})`
      );
    }
    if (filter?.tags && filter.tags.length > 0) {
      conditions.push(arrayContains(problems.tags, filter.tags));
    }

    if (conditions.length > 0) {
      return await db.select().from(problems).where(and(...conditions)).orderBy(desc(problems.date));
    }

    return await db.select().from(problems).orderBy(desc(problems.date));
  }

  async createProblem(problem: InsertProblem, createdBy: string): Promise<Problem> {
    const [newProblem] = await db.insert(problems).values({
      ...problem,
      createdBy,
      tags: problem.tags || [],
      photos: problem.photos || [],
    }).returning();
    return newProblem;
  }

  async updateProblem(id: string, data: UpdateProblem): Promise<Problem | undefined> {
    const [updated] = await db.update(problems)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(problems.id, id))
      .returning();
    return updated;
  }

  async deleteProblem(id: string): Promise<boolean> {
    const result = await db.delete(problems).where(eq(problems.id, id)).returning();
    return result.length > 0;
  }

  async updateProblemEmbedding(id: string, embedding: number[]): Promise<boolean> {
    const result = await db.update(problems)
      .set({ embedding })
      .where(eq(problems.id, id))
      .returning();
    return result.length > 0;
  }

  async getStats(): Promise<{ totalProblems: number; totalUsers: number; recentProblems: number; totalTags: number; totalMachineParts: number }> {
    const [problemCount] = await db.select({ count: sql<number>`count(*)::int` }).from(problems);
    const [userCount] = await db.select({ count: sql<number>`count(*)::int` }).from(users);
    
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const [recentCount] = await db.select({ count: sql<number>`count(*)::int` })
      .from(problems)
      .where(gte(problems.date, sevenDaysAgo));

    const tags = await this.getUniqueTags();
    const machineParts = await this.getUniqueMachineParts();

    return {
      totalProblems: problemCount?.count || 0,
      totalUsers: userCount?.count || 0,
      recentProblems: recentCount?.count || 0,
      totalTags: tags.length,
      totalMachineParts: machineParts.length,
    };
  }

  async getUniqueTags(): Promise<string[]> {
    const result = await db.select({ tags: problems.tags }).from(problems);
    const allTags = new Set<string>();
    result.forEach(row => {
      if (row.tags) {
        row.tags.forEach(tag => allTags.add(tag));
      }
    });
    return Array.from(allTags).sort();
  }

  async getUniqueMachineParts(): Promise<string[]> {
    const result = await db.selectDistinct({ machinePart: problems.machinePart })
      .from(problems)
      .where(sql`${problems.machinePart} IS NOT NULL`);
    return result.map(r => r.machinePart!).filter(Boolean).sort();
  }

  async getAllProblemsWithPagination(filter?: ProblemFilter): Promise<{ problems: Problem[]; total: number; page: number; totalPages: number }> {
    const page = filter?.page || 1;
    const limit = filter?.limit || 12;
    const offset = (page - 1) * limit;
    
    const conditions: any[] = [];
    
    if (filter?.startDate) {
      conditions.push(gte(problems.date, new Date(filter.startDate)));
    }
    if (filter?.endDate) {
      conditions.push(lte(problems.date, new Date(filter.endDate)));
    }
    if (filter?.machinePart) {
      conditions.push(eq(problems.machinePart, filter.machinePart));
    }
    if (filter?.createdBy) {
      conditions.push(eq(problems.createdBy, filter.createdBy));
    }
    if (filter?.search) {
      conditions.push(
        sql`(${problems.problem} ILIKE ${'%' + filter.search + '%'} OR ${problems.solution} ILIKE ${'%' + filter.search + '%'})`
      );
    }
    if (filter?.tags && filter.tags.length > 0) {
      conditions.push(arrayContains(problems.tags, filter.tags));
    }

    let whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const [countResult] = await db.select({ count: sql<number>`count(*)::int` })
      .from(problems)
      .where(whereClause);

    const total = countResult?.count || 0;
    const totalPages = Math.ceil(total / limit);

    const results = await db.select()
      .from(problems)
      .where(whereClause)
      .orderBy(desc(problems.date))
      .limit(limit)
      .offset(offset);

    return {
      problems: results,
      total,
      page,
      totalPages,
    };
  }
}

export const storage = new DatabaseStorage();
