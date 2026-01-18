import { sql } from "drizzle-orm";
import {pgTable, text, varchar, timestamp, integer, jsonb, boolean} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const UserRole = {
  VISITOR: "visitor",
  EDITOR: "editor",
  SUPERVISOR: "supervisor",
  ADMIN: "admin",
} as const;

export type UserRoleType = typeof UserRole[keyof typeof UserRole];

export const users = pgTable("users", {
  id: varchar("id", { length: 36 }).primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  role: text("role").notNull().default(UserRole.VISITOR),
  isDeleted: boolean("is_deleted").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  createdBy: text("created_by"),
});

export const problems = pgTable("problems", {
  id: varchar("id", { length: 36 }).primaryKey().default(sql`gen_random_uuid()`),
  problem: text("problem").notNull(),
  solution: text("solution").notNull(),
  machinePart: text("machine_part"),
  tags: text("tags").array().default(sql`ARRAY[]::text[]`),
  date: timestamp("date").defaultNow().notNull(),
  photos: text("photos").array().default(sql`ARRAY[]::text[]`),
  createdBy: varchar("created_by", { length: 36 }).references(() => users.id),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  embedding: jsonb("embedding"),
});

export const insertUserSchema = createInsertSchema(users)
    .pick({
      username: true,
      email: true,
      password: true,
      role: true
    })
    .extend({
      email: z.string().email("Invalid email address"),
      password: z.string().min(6, "Password must be at least 6 characters"),
      role: z
          .enum([UserRole.VISITOR, UserRole.EDITOR, UserRole.SUPERVISOR, UserRole.ADMIN])
          .optional(),
      createdBy: z.string().optional(),
      isDeleted: z.boolean().optional(),
    });

export const loginSchema = z.object({
  username: z.string().min(1, "Username is required"),
  password: z.string().min(1, "Password is required"),
});

export const updatePasswordSchema = z.object({
  currentPassword: z.string().min(1, "Current password is required"),
  newPassword: z.string().min(6, "New password must be at least 6 characters"),
});

export const resetPasswordSchema = z.object({
  userId: z.string().min(1, "User ID is required"),
  newPassword: z.string().min(6, "New password must be at least 6 characters"),
});

export const insertProblemSchema = createInsertSchema(problems).pick({
  problem: true,
  solution: true,
  machinePart: true,
  tags: true,
  photos: true,
}).extend({
  problem: z.string().min(1, "Problem description is required"),
  solution: z.string().min(1, "Solution is required"),
  machinePart: z.string().optional(),
  tags: z.array(z.string()).optional(),
  photos: z.array(z.string()).optional(),
});

export const updateProblemSchema = insertProblemSchema.partial();

export const problemFilterSchema = z.object({
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  tags: z.array(z.string()).optional(),
  machinePart: z.string().optional(),
  createdBy: z.string().optional(),
  search: z.string().optional(),
  page: z.coerce.number().optional(),
  limit: z.coerce.number().optional(),
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type SafeUser = Omit<User, "password">;

export type InsertProblem = z.infer<typeof insertProblemSchema>;
export type UpdateProblem = z.infer<typeof updateProblemSchema>;
export type Problem = typeof problems.$inferSelect;
export type ProblemFilter = z.infer<typeof problemFilterSchema>;

export type LoginInput = z.infer<typeof loginSchema>;
export type UpdatePasswordInput = z.infer<typeof updatePasswordSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
