import {Role} from "../models/schema";

declare global {
    namespace Express {
        interface User {
            id: string;
            username: string;
            email: string;
            role: Role;
        }

        interface Request {
            user?: User;
        }
    }
}

export {};
