import {NextFunction, Request, RequestHandler, Response} from 'express';
import {Role} from '../models/schema';
import {verify} from "../helpers/jwtHelper";
import {getTokenFromCookies} from "../helpers/cookiesHelper";

export interface AuthRequest extends Request {
    user?: {
        id: string;
        username: string;
        email: string;
        role: Role;
    };
}

export const authenticate = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
) => {
    try {
        const token = getTokenFromCookies(req);

        if (!token) {
            return res.status(401).json({ message: 'Authentication required' });
        }

        req.user = verify(token);
        next();
    } catch (error) {
        return res.status(401).json({ message: 'Invalid or expired token' });
    }
};

export const authorize = (...allowedRoles: Role[]): RequestHandler => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({ message: 'Authentication required' });
        }

        if (!allowedRoles.includes(req.user.role)) {
            return res.status(403).json({ message: 'Insufficient permissions' });
        }

        next();
    };
};
