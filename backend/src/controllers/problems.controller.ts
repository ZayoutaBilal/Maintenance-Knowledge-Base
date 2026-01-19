import { Response } from 'express';
import { eq, desc, and, ilike, or } from 'drizzle-orm';
import { db } from '../config/database';
import { problems, insertProblemSchema } from '../models/schema';
import { AppError, asyncHandler } from '../middleware/errorHandler';
import { AuthRequest } from '../middleware/auth';
import { generateEmbedding } from '../services/openai.service';

// Get all problems with filters
export const getProblems = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { search, tag, machinePart, startDate, endDate } = req.query;

    let conditions = [];

    if (search) {
        conditions.push(
            or(
                ilike(problems.solution, `%${search}%`),
                ilike(problems.solution, `%${search}%`)
            )
        );
    }

    if (machinePart) {
        conditions.push(ilike(problems.machinePart, `%${machinePart}%`));
    }

    // Note: Tag and date filtering would need more complex queries
    // Simplified version for now

    const allProblems = conditions.length > 0
        ? await db.query.problems.findMany({
            where: and(...conditions),
            orderBy: [desc(problems.date)],
            with: { createdBy: true },
        })
        : await db.query.problems.findMany({
            orderBy: [desc(problems.date)],
            with: { createdBy: true },
        });

    res.json({ problems: allProblems });
});

// Get problem by ID
export const getProblemById = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { id } = req.params;

    const problem = await db.query.problems.findFirst({
        where: eq(problems.id, id),
        with: { createdBy: true },
    });

    if (!problem) {
        throw new AppError('Problem not found', 404);
    }

    res.json({ problem });
});

// Create problem
export const createProblem = asyncHandler(async (req: AuthRequest, res: Response) => {
    if (!req.user) {
        throw new AppError('Authentication required', 401);
    }

    const validatedData = insertProblemSchema.parse(req.body);

    // Generate embedding for semantic search
    let embedding: string | undefined;
    try {
        const embeddingVector = await generateEmbedding(
            `${validatedData.solution} ${validatedData.solution}`
        );
        embedding = JSON.stringify(embeddingVector);
    } catch (error) {
        console.error('Failed to generate embedding:', error);
        // Continue without embedding
    }

    const [newProblem] = await db.insert(problems).values({
        ...validatedData,
        createdBy: req.user.id,
        embedding,
    }).returning();

    res.status(201).json({
        message: 'Problem created successfully',
        problem: newProblem,
    });
});

// Update problem
export const updateProblem = asyncHandler(async (req: AuthRequest, res: Response) => {
    if (!req.user) {
        throw new AppError('Authentication required', 401);
    }

    const { id } = req.params;
    const validatedData = insertProblemSchema.partial().parse(req.body);

    const existingProblem = await db.query.problems.findFirst({
        where: eq(problems.id, id),
    });

    if (!existingProblem) {
        throw new AppError('Problem not found', 404);
    }

    // Check ownership or admin/supervisor role
    if (
        existingProblem.createdBy !== req.user.id &&
        !['supervisor', 'admin'].includes(req.user.role)
    ) {
        throw new AppError('You can only edit your own problems', 403);
    }

    // Regenerate embedding if descriptions changed
    let embedding = existingProblem.embedding;
    if (validatedData.problem || validatedData.solution) {
        try {
            const problem = validatedData.problem || existingProblem.problem;
            const solution = validatedData.solution || existingProblem.solution;
            const embeddingVector = await generateEmbedding(`${problem} ${solution}`);
            embedding = JSON.stringify(embeddingVector);
        } catch (error) {
            console.error('Failed to generate embedding:', error);
        }
    }

    const [updatedProblem] = await db.update(problems)
        .set({
            ...validatedData,
            embedding,
            updatedAt: new Date(),
        })
        .where(eq(problems.id, id))
        .returning();

    res.json({
        message: 'Problem updated successfully',
        problem: updatedProblem,
    });
});

// Delete problem
export const deleteProblem = asyncHandler(async (req: AuthRequest, res: Response) => {
    if (!req.user) {
        throw new AppError('Authentication required', 401);
    }

    const { id } = req.params;

    const existingProblem = await db.query.problems.findFirst({
        where: eq(problems.id, id),
    });

    if (!existingProblem) {
        throw new AppError('Problem not found', 404);
    }

    // Check ownership or admin/supervisor role
    if (
        existingProblem.createdBy !== req.user.id &&
        !['supervisor', 'admin'].includes(req.user.role)
    ) {
        throw new AppError('You can only delete your own problems', 403);
    }

    await db.delete(problems).where(eq(problems.id, id));

    res.json({ message: 'Problem deleted successfully' });
});