import {Request, Response} from 'express';
import {insertUserSchema, loginSchema, resetPasswordSchema} from '../models/schema';
import { AppError, asyncHandler } from '../middleware/errorHandler';
import {storage} from "../config/storage";
import {generatePassword, verifyPassword} from "../helpers/passwordHelper";
import {generateToken} from "../helpers/jwtHelper";
import {clearCookie, setAuthCookie} from "../helpers/cookiesHelper";
import {sendNewPassword} from "../services/mailSenderService";

// Register
export const register = asyncHandler(async (req: Request, res: Response) => {

    const validatedData = insertUserSchema.parse(req.body);

    // Check if user exists
    let existingUser = await storage.getUserByEmail(validatedData.email);

    if (existingUser) {
        throw new AppError('Email already registered', 400);
    }

    existingUser = await storage.getUserByUsername(validatedData.username);

    if (existingUser) {
        throw new AppError('Username already registered', 400);
    }

    // Create user
    const userWithoutPassword = await storage.createUser(validatedData);

    // Generate token
    const token = generateToken(userWithoutPassword);
    setAuthCookie(res, token);

    res.status(201).json({
        message: 'User registered successfully',
        user: userWithoutPassword,
    });
});

// Login
export const login = asyncHandler(async (req: Request, res: Response) => {

    const { login, password } = loginSchema.parse(req.body);

    const user = await storage.getUserByUsernameOrEmail(login);

    if (!user) {
        throw new AppError('Invalid username or password', 401);
    }

    const isValid = await verifyPassword(password, user.password);

    if (!isValid) {
        throw new AppError('Invalid username or password', 401);
    }

    const { password: _, ...safeUser } = user;

    const token = generateToken(safeUser);
    setAuthCookie(res, token);

    return res.json({ user: safeUser });
});

// Logout
export const logout = asyncHandler(async (req: Request, res: Response) => {
    clearCookie(res);
    res.json({ message: 'Logout successful' });
});

// Get current user
export const getCurrentUser = asyncHandler(async (req: Request, res: Response) => {

    if (!req.user) {
        throw new AppError('Not authenticated', 401);
    }

    const user = await storage.getUser(req.user.id);

    if (!user) {
        throw new AppError('User not found', 404);
    }

    const { password, ...userWithoutPassword } = user;
    res.json({ user: userWithoutPassword });
});

export const resetPassword = asyncHandler(async (req: Request, res: Response) => {

    const { email } = resetPasswordSchema.parse(req.body);

    const user = await storage.getUserByEmail(email);

    if (!user) {
        throw new AppError("Invalid email", 401);
    }

    const newPassword = generatePassword();

    await storage.updateUserPassword(user.id, newPassword);
    await sendNewPassword(user.username, newPassword, user.email);

    res.json({
        message: "Password updated successfully, check your email",
    });
});