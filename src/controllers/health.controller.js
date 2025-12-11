import pool from '../config/db.js';

const getHealth = (req, res) => {
    res.status(200).json({
        status: 'OK',
        message: 'Server is running',
        timestamp: new Date().toISOString(),
    });
};

const getHealthDB = async (req, res) => {
    try {
        const connection = await pool.getConnection();
        await connection.ping();
        connection.release();

        res.status(200).json({
            status: 'OK',
            message: 'Database connection is healthy',
            database: process.env.DB_NAME,
            timestamp: new Date().toISOString(),
        });
    } catch (error) {
        res.status(503).json({
            status: 'ERROR',
            message: 'Database connection failed',
            error: error.message,
            timestamp: new Date().toISOString(),
        });
    }
};

export {
    getHealth,
    getHealthDB,
};
