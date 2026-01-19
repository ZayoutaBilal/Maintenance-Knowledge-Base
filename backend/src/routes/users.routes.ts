import {eq} from 'drizzle-orm';
import {db} from '../config/database';
import {Role, users} from '../models/schema';
import {authenticate, authorize} from '../middleware/auth';
import {AppError, asyncHandler} from '../middleware/errorHandler';
import { Router, Request, Response } from 'express';
const router = Router();

// Get all users (admin only)
router.get('/', authenticate, authorize(Role.ADMIN), asyncHandler(async (req: Request, res: Response) => {
    const allUsers = await db.query.users.findMany({
        columns: { password: false },
    });
    res.json({ users: allUsers });
}));

// Update user role (admin only)
router.put('/:id/role', authenticate, authorize(Role.ADMIN), asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const { role } = req.body;

    if (!['visitor', 'editor', 'supervisor', 'admin'].includes(role)) {
        throw new AppError('Invalid role', 400);
    }

    const [updatedUser] = await db.update(users)
        .set({ role, updatedAt: new Date() })
        .where(eq(users.id, id))
        .returning();

    if (!updatedUser) {
        throw new AppError('User not found', 404);
    }

    const { password, ...userWithoutPassword } = updatedUser;
    res.json({ message: 'User role updated', user: userWithoutPassword });
}));

// Delete user (admin only)
router.delete(
    "/:id",
    authenticate,
    authorize(Role.ADMIN),
    asyncHandler(async (req: Request, res: Response) => {
        const { id } = req.params;

        await db.delete(users).where(eq(users.id, id));

        res.json({ message: "User deleted successfully" });
    })
);


export default router;