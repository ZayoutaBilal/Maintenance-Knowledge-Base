import {Router} from 'express';
import {
    createProblem,
    deleteProblem,
    getProblemById,
    getProblems,
    updateProblem,
} from '../controllers/problems.controller';
import {authenticate, authorize} from '../middleware/auth';
import {Role} from "../models/schema";

const router = Router();

router.get('/', authenticate, getProblems);
router.get('/:id', authenticate, getProblemById);
router.post('/', authenticate, authorize(Role.ADMIN,Role.SUPERVISOR,Role.EDITOR), createProblem);
router.put('/:id', authenticate, authorize(Role.ADMIN,Role.SUPERVISOR,Role.EDITOR), updateProblem);
router.delete('/:id', authenticate, authorize(Role.ADMIN,Role.SUPERVISOR), deleteProblem);

export default router;