import { Router } from 'express';
import { db } from '../config/database';
import { problems } from '../models/schema';
import { authenticate } from '../middleware/auth';
import { asyncHandler } from '../middleware/errorHandler';
import { generateEmbedding, cosineSimilarity } from '../services/openai.service';

const router = Router();

router.post('/', authenticate, asyncHandler(async (req, res) => {
    const { query } = req.body;

    if (!query || query.trim().length === 0) {
        return res.status(400).json({ message: 'Query is required' });
    }

    try {
        // Generate embedding for search query
        const queryEmbedding = await generateEmbedding(query);

        // Get all problems with embeddings
        const allProblems = await db.query.problems.findMany({
            with: { createdBy: true },
        });

        // Calculate similarity scores
        const results = allProblems
            .filter(p => p.embedding)
            .map(problem => {
                const problemEmbedding = JSON.parse(problem.embedding!);
                const similarity = cosineSimilarity(queryEmbedding, problemEmbedding);
                return { ...problem, similarity };
            })
            .filter(r => r.similarity > 0.7) // Threshold for relevance
            .sort((a, b) => b.similarity - a.similarity)
            .slice(0, 10); // Top 10 results

        res.json({ results });
    } catch (error) {
        console.error('Search error:', error);
        res.status(500).json({ message: 'Search failed. Please try again.' });
    }
}));

export default router;