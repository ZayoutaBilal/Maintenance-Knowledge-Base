import { Response } from 'express';
import {AuthRequest} from "../middleware/auth";

const tokenName = "auth_token"

export const setAuthCookie = (res: Response, token: string) => {
    res.cookie(tokenName, token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });
};

export const clearCookie = (res: Response) => {
    res.clearCookie(tokenName);
}

export const getTokenFromCookies = (req: AuthRequest) => {
    return req.cookies[tokenName];
}