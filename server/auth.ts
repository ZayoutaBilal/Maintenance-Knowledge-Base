import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import { storage } from "./storage";
import type { SafeUser, UserRoleType } from "@shared/schema";

const JWT_SECRET = process.env.SESSION_SECRET || "sec-key-AbCd020506";
const JWT_EXPIRY = "1d";

export interface AuthRequest extends Request {
  user?: SafeUser;
}

export function generateToken(user: SafeUser): string {
  return jwt.sign(
    { userId: user.id, username: user.username, role: user.role },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRY }
  );
}

export function verifyToken(token: string): { userId: string; username: string; role: string } | null {
  try {
    return jwt.verify(token, JWT_SECRET) as { userId: string; username: string; role: string };
  } catch {
    return null;
  }
}

export async function verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
  return bcrypt.compare(password, hashedPassword);
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

export function authMiddleware(req: AuthRequest, res: Response, next: NextFunction) {
  const token = req.cookies?.auth_token;

  if (!token) {
    return res.status(401).json({ message: "Authentication required" });
  }

  const decoded = verifyToken(token);
  if (!decoded) {
    res.clearCookie("auth_token");
    return res.status(401).json({ message: "Invalid or expired token" });
  }

  storage.getUser(decoded.userId).then(user => {
    if (!user) {
      res.clearCookie("auth_token");
      return res.status(401).json({ message: "User not found" });
    }

    const { password: _, ...safeUser } = user;
    req.user = safeUser;
    next();
  }).catch(() => {
    return res.status(500).json({ message: "Authentication error" });
  });
}

export function requireRole(...allowedRoles: UserRoleType[]) {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ message: "Authentication required" });
    }

    if (!allowedRoles.includes(req.user.role as UserRoleType)) {
      return res.status(403).json({ message: "Insufficient permissions" });
    }

    next();
  };
}

export function canEdit(req: AuthRequest, res: Response, next: NextFunction) {
  const editRoles: UserRoleType[] = ["editor", "supervisor", "admin"];
  return requireRole(...editRoles)(req, res, next);
}

export function canManage(req: AuthRequest, res: Response, next: NextFunction) {
  const manageRoles: UserRoleType[] = ["supervisor", "admin"];
  return requireRole(...manageRoles)(req, res, next);
}

export function isAdmin(req: AuthRequest, res: Response, next: NextFunction) {
  return requireRole("admin")(req, res, next);
}
