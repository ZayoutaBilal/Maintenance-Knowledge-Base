import bcrypt from "bcrypt";
import crypto from "crypto";

export async function verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
    return bcrypt.compare(password, hashedPassword);
}

export const generatePassword = (length: number = 12) => {
    return crypto.randomBytes(length)
        .toString("base64")
        .slice(0, length);
};

export async function hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, 10);
}