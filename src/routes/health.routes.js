import express from 'express';
import { getHealth, getHealthDB } from '../controllers/health.controller.js';

const router = express.Router();

router.get('/', getHealth);
router.get('/db', getHealthDB);

export default router;
