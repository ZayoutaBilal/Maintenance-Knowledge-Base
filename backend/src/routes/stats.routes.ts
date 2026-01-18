import { Router } from 'express';
import { sql } from 'drizzle-orm';
import { db } from '../config/database';
import { problems, users } from '../models/schema';
import { authenticate } from '../middleware/auth';
import { asyncHandler } from '../middleware/errorHandler';

const router = Router();

router.get('/', authenticate, asyncHandler(async (req, res) => {
    const [totalProblems] = await db.select({ count: sql<number>`count(*)` }).from(problems);
    const [totalUsers] = await db.select({ count: sql<number>`count(*)` }).from(users);

    const recentProblems = await db.query.problems.findMany({
        orderBy: (problems, { desc }) => [desc(problems.date)],
        limit: 5,
        with: { createdBy: true },
    });

    res.json({
        stats: {
            totalProblems: Number(totalProblems.count),
            totalUsers: Number(totalUsers.count),
        },
        recentProblems,
    });
}));

export default router;