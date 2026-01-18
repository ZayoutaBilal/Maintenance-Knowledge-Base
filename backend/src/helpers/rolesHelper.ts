import {Role} from "../models/schema";

export const canEdit = (role: Role): boolean => {
    return [Role.EDITOR, Role.SUPERVISOR, Role.ADMIN].includes(role);
};

export const canManage = (role: Role): boolean => {
    return [Role.SUPERVISOR, Role.ADMIN].includes(role);
};

export const isAdmin = (role: Role): boolean => {
    return role === Role.ADMIN;
};