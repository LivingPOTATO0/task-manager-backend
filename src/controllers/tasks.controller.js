import pool from '../config/db.js';

const createTask = async (req, res) => {
    try {
        const { inputText } = req.body;
        const userId = req.userId;

        if (!inputText) {
            return res.status(400).json({
                status: 'ERROR',
                message: 'inputText is required',
            });
        }

        const connection = await pool.getConnection();

        const [result] = await connection.query(
            'INSERT INTO tasks (userId, inputText, status) VALUES (?, ?, ?)',
            [userId, inputText, 'pending']
        );

        connection.release();

        res.status(201).json({
            status: 'OK',
            message: 'Task created successfully',
            data: {
                id: result.insertId,
            },
        });
    } catch (error) {
        res.status(500).json({
            status: 'ERROR',
            message: 'Failed to create task',
            error: error.message,
        });
    }
};

const listTasks = async (req, res) => {
    try {
        const userId = req.userId;

        const connection = await pool.getConnection();

        const [tasks] = await connection.query(
            'SELECT id, inputText, status, result, createdAt, updatedAt FROM tasks WHERE userId = ? ORDER BY createdAt DESC',
            [userId]
        );

        connection.release();

        res.status(200).json({
            status: 'OK',
            data: tasks,
        });
    } catch (error) {
        res.status(500).json({
            status: 'ERROR',
            message: 'Failed to fetch tasks',
            error: error.message,
        });
    }
};

const getTaskById = async (req, res) => {
    try {
        const { taskId } = req.params;
        const userId = req.userId;

        const connection = await pool.getConnection();

        const [tasks] = await connection.query(
            'SELECT id, inputText, status, result, createdAt, updatedAt FROM tasks WHERE id = ? AND userId = ?',
            [taskId, userId]
        );

        connection.release();

        if (tasks.length === 0) {
            return res.status(404).json({
                status: 'ERROR',
                message: 'Task not found',
            });
        }

        res.status(200).json({
            status: 'OK',
            data: tasks[0],
        });
    } catch (error) {
        res.status(500).json({
            status: 'ERROR',
            message: 'Failed to fetch task',
            error: error.message,
        });
    }
};

const updateTask = async (req, res) => {
    try {
        const { taskId } = req.params;
        const { status, result } = req.body;
        const userId = req.userId;

        const connection = await pool.getConnection();

        // Check if task exists and belongs to user
        const [tasks] = await connection.query(
            'SELECT id FROM tasks WHERE id = ? AND userId = ?',
            [taskId, userId]
        );

        if (tasks.length === 0) {
            connection.release();
            return res.status(404).json({
                status: 'ERROR',
                message: 'Task not found',
            });
        }

        // Update task
        const updateFields = [];
        const updateValues = [];

        if (status !== undefined) {
            updateFields.push('status = ?');
            updateValues.push(status);
        }
        if (result !== undefined) {
            updateFields.push('result = ?');
            updateValues.push(result);
        }

        if (updateFields.length === 0) {
            connection.release();
            return res.status(400).json({
                status: 'ERROR',
                message: 'No fields to update',
            });
        }

        updateValues.push(taskId);
        updateValues.push(userId);

        await connection.query(
            `UPDATE tasks SET ${updateFields.join(', ')} WHERE id = ? AND userId = ?`,
            updateValues
        );

        connection.release();

        res.status(200).json({
            status: 'OK',
            message: 'Task updated successfully',
        });
    } catch (error) {
        res.status(500).json({
            status: 'ERROR',
            message: 'Failed to update task',
            error: error.message,
        });
    }
};

const deleteTask = async (req, res) => {
    try {
        const { taskId } = req.params;
        const userId = req.userId;

        const connection = await pool.getConnection();

        const [result] = await connection.query(
            'DELETE FROM tasks WHERE id = ? AND userId = ?',
            [taskId, userId]
        );

        connection.release();

        if (result.affectedRows === 0) {
            return res.status(404).json({
                status: 'ERROR',
                message: 'Task not found',
            });
        }

        res.status(200).json({
            status: 'OK',
            message: 'Task deleted successfully',
        });
    } catch (error) {
        res.status(500).json({
            status: 'ERROR',
            message: 'Failed to delete task',
            error: error.message,
        });
    }
};

export {
    createTask,
    listTasks,
    getTaskById,
    updateTask,
    deleteTask,
};
