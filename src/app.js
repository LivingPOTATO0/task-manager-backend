import 'dotenv/config.js';
import express from 'express';
import cookieParser from 'cookie-parser';
import corsMiddleware from './middleware/corsMiddleware.js';
import healthRoutes from './routes/health.routes.js';
import authRoutes from './routes/auth.routes.js';
import tasksRoutes from './routes/tasks.routes.js';

const app = express();

// Middleware
app.use(corsMiddleware);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Routes
app.use('/api/health', healthRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/tasks', tasksRoutes);

// 404 Handler
app.use((req, res) => {
    res.status(404).json({
        status: 'ERROR',
        message: 'Route not found',
    });
});

// Error Handler
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({
        status: 'ERROR',
        message: 'Internal server error',
        error: process.env.NODE_ENV === 'development' ? err.message : undefined,
    });
});

export default app;
