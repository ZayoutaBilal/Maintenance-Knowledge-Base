// Generate JWT token
import jwt from "jsonwebtoken";
import {Role, SafeUser} from "../models/schema";

const JWT_SECRET = process.env.JWT_SECRET as string;
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN as jwt.SignOptions['expiresIn'];

export const generateToken = (user: SafeUser): string => {

    const payload = {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role
    };

    return jwt.sign(
        payload,
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

