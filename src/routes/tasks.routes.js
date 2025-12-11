import express from 'express';
import {
    createTask,
    listTasks,
    getTaskById,
    updateTask,
    deleteTask,
} from '../controllers/tasks.controller.js';
import authMiddleware from '../middleware/authMiddleware.js';

const router = express.Router();

// All task routes require authentication
router.use(authMiddleware);

router.post('/', createTask);

router.get('/', listTasks);
router.get('/:taskId', getTaskById);
router.put('/:taskId', updateTask);
router.delete('/:taskId', deleteTask);

export default router;
