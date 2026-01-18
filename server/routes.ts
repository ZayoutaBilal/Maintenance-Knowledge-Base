import type { Express } from "express";
import nodemailer from "nodemailer";
import cookieParser from "cookie-parser";
import { storage } from "./storage";
import { 
  authMiddleware, 
  AuthRequest, 
  generateToken, 
  verifyPassword, 
  hashPassword,
  canEdit,
  canManage,
  isAdmin
} from "./auth";
import { generateEmbedding, semanticSearch } from "./openai";
import { 
  loginSchema, 
  insertUserSchema, 
  insertProblemSchema, 
  updateProblemSchema,
  problemFilterSchema,
  resetPasswordSchema,
  updatePasswordSchema
} from "@shared/schema";
import { ZodError } from "zod";
import crypto from "crypto";
import {renderToStaticMarkup} from "react-dom/server";
import NewPasswordTemplate from "../templates/NewPasswordTemplate.tsx";
import React from "react";
import WelcomeUserEmail from "../templates/WelcomeUserEmail.tsx";


const generatePassword = (length: number = 12) => {
  return crypto.randomBytes(length)
      .toString("base64")
      .slice(0, length);
};

const transporter = nodemailer.createTransport({
  service: process.env.SMTP_SERVICE,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

function handleZodError(error: ZodError) {
  return {
    message: "Validation error",
    errors: error.errors.map(e => ({ field: e.path.join("."), message: e.message }))
  };
}

export async function registerRoutes(app: Express){

  app.use(cookieParser());

  app.post("/api/auth/login", async (req, res) => {
    try {
      const { username, password } = loginSchema.parse(req.body);
      
      const user = await storage.getUserByUsername(username);
      if (!user) {
        return res.status(401).json({ message: "Invalid username or password" });
      }

      const isValid = await verifyPassword(password, user.password);
      if (!isValid) {
        return res.status(401).json({ message: "Invalid username or password" });
      }

      const { password: _, ...safeUser } = user;
      const token = generateToken(safeUser);

      res.cookie("auth_token", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 7 * 24 * 60 * 60 * 1000,
      });

      return res.json({ user: safeUser });
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json(handleZodError(error));
      }
      return res.status(500).json({ message: "Login g failed",error : error });
    }
  });

  app.post("/api/auth/logout", (req, res) => {
    res.clearCookie("auth_token");
    return res.json({ message: "Logged out successfully" });
  });

  app.get("/api/auth/me", authMiddleware, (req: AuthRequest, res) => {
    return res.json({ user: req.user });
  });


  app.post("/api/auth/reset-password",async (req, res) => {
    if (!req.body?.email) {
      return res.status(400).json({message: "Email is required"});
    }

    const user = await storage.getUserByEmail(req.body?.email);

    if(!user || user.email !== req.body?.email){
      return res.status(401).json({message: "Invalid email"});
    }

    const newPassword = generatePassword();

    try {

      const htmlContent = renderToStaticMarkup(
          React.createElement(NewPasswordTemplate, {
            name:user.username,newPassword:newPassword
          })
      );

      const mailOptions = {
        from: `Maintenance Knowledge Base`,
        to: user.email,
        subject: `📩 New Password`,
        html: htmlContent,
      };

      await transporter.sendMail(mailOptions);
      const hashedPassword = await hashPassword(newPassword);
      await storage.updateUserPassword(user.id, hashedPassword);

      res.status(200).json({ message: "Password updated successfully, check your email" });
    } catch (error) {
      console.error("Email Error:", error);
      res.status(500).json({ error: "Could not send email" });
    }
  });

  app.post("/api/auth/change-password", authMiddleware, async (req: AuthRequest, res) => {
    try {
      const { currentPassword, newPassword } = updatePasswordSchema.parse(req.body);
      
      const user = await storage.getUser(req.user!.id);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      const isValid = await verifyPassword(currentPassword, user.password);
      if (!isValid) {
        return res.status(401).json({ message: "Current password is incorrect" });
      }

      const hashedPassword = await hashPassword(newPassword);
      await storage.updateUserPassword(user.id, hashedPassword);

      return res.json({ message: "Password changed successfully" });
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json(handleZodError(error));
      }
      return res.status(500).json({ message: "Failed to change password" });
    }
  });

  app.get("/api/users", authMiddleware, isAdmin, async (req: AuthRequest, res) => {
    try {
      const users = await storage.getAllUsers();
      return res.json(users);
    } catch (error) {
      return res.status(500).json({ message: "Failed to fetch users" });
    }
  });

  app.post("/api/users", authMiddleware, isAdmin, async (req: AuthRequest, res) => {
    try {
      const newPassword = generatePassword();
      const userData = insertUserSchema.parse({...req.body,password:newPassword});
      
      const existingUsername = await storage.getUserByUsername(userData.username);
      if (existingUsername) {
        return res.status(400).json({ message: "Username already exists" });
      }

      const existingEmail = await storage.getUserByEmail(userData.email);
      if (existingEmail) {
        return res.status(400).json({ message: "Email already exists" });
      }

      const newUser = await storage.createUser(userData);

      try {
        const htmlContent = renderToStaticMarkup(
            React.createElement(WelcomeUserEmail, {
              username:userData.username,password:newPassword,
              role:userData.role?.toUpperCase() || "VISITOR",
              createdBy:userData.createdBy?.toLowerCase() || "A member",
              createdAt:Date.now().toString(),
              websiteUrl: process.env.WEBSITE_URL
            })
        );

        const mailOptions = {
          from: `Maintenance Knowledge Base`,
          to: userData.email,
          subject: `Your Account Has Been Created`,
          html: htmlContent,
        };
        await transporter.sendMail(mailOptions);
      }catch (error){}

      return res.status(201).json(newUser);
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json(handleZodError(error));
      }
      return res.status(500).json({ message: "Failed to create user" });
    }
  });

  app.get("/api/users/:id", authMiddleware, isAdmin, async (req: AuthRequest, res) => {
    try {
      const user = await storage.getUser(req.params.id);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      const { password: _, ...safeUser } = user;
      return res.json(safeUser);
    } catch (error) {
      return res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  app.put("/api/users/:id", authMiddleware, isAdmin, async (req: AuthRequest, res) => {
    try {
      const updateData = insertUserSchema.partial().parse(req.body);
      
      if (updateData.username) {
        const existing = await storage.getUserByUsername(updateData.username);
        if (existing && existing.id !== req.params.id) {
          return res.status(400).json({ message: "Username already exists" });
        }
      }

      if (updateData.email) {
        const existing = await storage.getUserByEmail(updateData.email);
        if (existing && existing.id !== req.params.id) {
          return res.status(400).json({ message: "Email already exists" });
        }
      }

      const updated = await storage.updateUser(req.params.id, updateData);
      if (!updated) {
        return res.status(404).json({ message: "User not found" });
      }

      return res.json(updated);
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json(handleZodError(error));
      }
      return res.status(500).json({ message: "Failed to update user" });
    }
  });

  app.delete("/api/users/:id", authMiddleware, isAdmin, async (req: AuthRequest, res) => {
    try {
      if (req.params.id === req.user!.id) {
        return res.status(400).json({ message: "Cannot delete your own account" });
      }

      const deleted = await storage.deleteUser(req.params.id);
      if (!deleted) {
        return res.status(404).json({ message: "User not found" });
      }

      return res.json({ message: "User deleted successfully" });
    } catch (error) {
      return res.status(500).json({ message: "Failed to delete user" });
    }
  });

  app.post("/api/users/:id/reset-password", authMiddleware, isAdmin, async (req: AuthRequest, res) => {
    try {
      const { newPassword } = resetPasswordSchema.omit({ userId: true }).parse(req.body);
      
      const hashedPassword = await hashPassword(newPassword);
      const updated = await storage.updateUserPassword(req.params.id, hashedPassword);
      
      if (!updated) {
        return res.status(404).json({ message: "User not found" });
      }

      return res.json({ message: "Password reset successfully" });
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json(handleZodError(error));
      }
      return res.status(500).json({ message: "Failed to reset password" });
    }
  });

  app.get("/api/problems", authMiddleware, async (req: AuthRequest, res) => {
    try {
      const filter = problemFilterSchema.parse(req.query);
      if (req.query.tags) {
        filter.tags = Array.isArray(req.query.tags) ? req.query.tags : [req.query.tags as string];
      }
      const result = await storage.getAllProblemsWithPagination(filter);
      return res.json(result);
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json(handleZodError(error));
      }
      return res.status(500).json({ message: "Failed to fetch problems" });
    }
  });

  app.post("/api/problems", authMiddleware, canEdit, async (req: AuthRequest, res) => {
    try {
      const problemData = insertProblemSchema.parse(req.body);
      const newProblem = await storage.createProblem(problemData, req.user!.id);

      if (process.env.OPENAI_API_KEY) {
        try {
          const textForEmbedding = `${newProblem.problem} ${newProblem.solution} ${newProblem.machinePart || ""} ${(newProblem.tags || []).join(" ")}`;
          const embedding = await generateEmbedding(textForEmbedding);
          await storage.updateProblemEmbedding(newProblem.id, embedding);
        } catch (embeddingError) {
          console.error("Failed to generate embedding:", embeddingError);
        }
      }

      return res.status(201).json(newProblem);
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json(handleZodError(error));
      }
      return res.status(500).json({ message: "Failed to create problem" });
    }
  });

  app.get("/api/problems/filters", authMiddleware, async (req: AuthRequest, res) => {
    try {
      const tags = await storage.getUniqueTags();
      const machineParts = await storage.getUniqueMachineParts();
      const users = await storage.getAllUsers();
      
      return res.json({
        tags,
        machineParts,
        users: users.map(u => ({ id: u.id, username: u.username })),
      });
    } catch (error) {
      return res.status(500).json({ message: "Failed to fetch filter options" });
    }
  });

  app.get("/api/problems/:id", authMiddleware, async (req: AuthRequest, res) => {
    try {
      const problem = await storage.getProblem(req.params.id);
      if (!problem) {
        return res.status(404).json({ message: "Problem not found" });
      }
      return res.json(problem);
    } catch (error) {
      return res.status(500).json({ message: "Failed to fetch problem" });
    }
  });

  app.put("/api/problems/:id", authMiddleware, canManage, async (req: AuthRequest, res) => {
    try {
      const updateData = updateProblemSchema.parse(req.body);
      const updated = await storage.updateProblem(req.params.id, updateData);
      
      if (!updated) {
        return res.status(404).json({ message: "Problem not found" });
      }

      if (process.env.OPENAI_API_KEY) {
        try {
          const textForEmbedding = `${updated.problem} ${updated.solution} ${updated.machinePart || ""} ${(updated.tags || []).join(" ")}`;
          const embedding = await generateEmbedding(textForEmbedding);
          await storage.updateProblemEmbedding(updated.id, embedding);
        } catch (embeddingError) {
          console.error("Failed to update embedding:", embeddingError);
        }
      }

      return res.json(updated);
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json(handleZodError(error));
      }
      return res.status(500).json({ message: "Failed to update problem" });
    }
  });

  app.delete("/api/problems/:id", authMiddleware, canManage, async (req: AuthRequest, res) => {
    try {
      const deleted = await storage.deleteProblem(req.params.id);
      if (!deleted) {
        return res.status(404).json({ message: "Problem not found" });
      }
      return res.json({ message: "Problem deleted successfully" });
    } catch (error) {
      return res.status(500).json({ message: "Failed to delete problem" });
    }
  });

  app.post("/api/problems/search", authMiddleware, async (req: AuthRequest, res) => {
    try {
      const { query } = req.body;
      if (!query || typeof query !== "string") {
        return res.status(400).json({ message: "Search query is required" });
      }

      if (!process.env.OPENAI_API_KEY) {
        return res.status(503).json({ message: "Semantic search is not available. OpenAI API key is not configured." });
      }

      const allProblems = await storage.getAllProblems();
      // const problemsWithEmbeddings = allProblems.map(p => ({
      //   id: p.id,
      //   problem: p.problem,
      //   solution: p.solution,
      //   embedding: p.embedding as number[] | null,
      // }));
      const problemsWithEmbeddings = await Promise.all(
          allProblems.map(async p => {
            let embedding = p.embedding as number[] | null;
            if (!embedding || !Array.isArray(embedding)) {
              embedding = await generateEmbedding(
                  `${p.problem} ${p.solution} ${p.tags?.join(" ") ?? ""}`
              );
            }
            return { id: p.id, problem: p.problem, solution: p.solution, embedding };
          })
      );

      const searchResults = await semanticSearch(query, problemsWithEmbeddings);

      const topResults = searchResults
          .filter(r => r.similarity > 0.5) // stricter threshold
          .slice(0, 10);

      const resultProblems = topResults.map(result => {
        const problem = allProblems.find(p => p.id === result.id);
        return {
          ...problem,
          similarity: result.similarity,
        };
      });

      return res.json(resultProblems);

    } catch (error) {
      console.error("Semantic search error:", error);
      return res.status(500).json({ message: "Search failed" });
    }
  });

  app.get("/api/stats", authMiddleware, async (req: AuthRequest, res) => {
    try {
      const stats = await storage.getStats();
      return res.json(stats);
    } catch (error) {
      return res.status(500).json({ message: "Failed to fetch stats" });
    }
  });
}
