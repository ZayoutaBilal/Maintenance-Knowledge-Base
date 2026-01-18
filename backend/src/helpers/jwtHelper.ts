// Generate JWT token
import jwt from "jsonwebtoken";
import {Role, SafeUser} from "../models/schema";

const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

export const generateToken = (user: SafeUser): string => {

    return jwt.sign(
        {
            id: user.id,
            username: user.username,
            email: user.email,
            role: user.role
        },
        JWT_SECRET,
        { expiresIn: JWT_EXPIRES_IN }
    );
};

export const verify = (token:string) => {
    return jwt.verify(token, JWT_SECRET) as {
        id: string;
        username: string;
        email: string;
        role: Role;
    };
}

