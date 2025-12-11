import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import pool from '../config/db.js';

const generateTokens = (userId) => {
    const accessToken = jwt.sign(
        { userId },
        process.env.ACCESS_TOKEN_SECRET,
        { expiresIn: '15m' }
    );

    const refreshToken = jwt.sign(
        { userId },
        process.env.REFRESH_TOKEN_SECRET,
        { expiresIn: '7d' }
    );

    return { accessToken, refreshToken };
};

const register = async (req, res) => {
    try {
        const { email, password, name } = req.body;

        if (!email || !password || !name) {
            return res.status(400).json({
                status: 'ERROR',
                message: 'Email, password, and name are required',
            });
        }

        const connection = await pool.getConnection();

        // Check if user exists
        const [existingUser] = await connection.query(
            'SELECT id FROM users WHERE email = ?',
            [email]
        );

        if (existingUser.length > 0) {
            connection.release();
            return res.status(409).json({
                status: 'ERROR',
                message: 'User already exists',
            });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Insert user
        const [result] = await connection.query(
            'INSERT INTO users (name, email, password) VALUES (?, ?, ?)',
            [name, email, hashedPassword]
        );

        const userId = result.insertId;
        connection.release();

        // Generate tokens
        const { accessToken, refreshToken } = generateTokens(userId);

        // Set refresh token as httpOnly cookie
        res.cookie('refreshToken', refreshToken, {
            httpOnly: true,
            secure: true,
            sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
            maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
        });

        res.status(201).json({
            status: 'OK',
            message: 'User registered successfully',
            accessToken,
        });
    } catch (error) {
        res.status(500).json({
            status: 'ERROR',
            message: 'Registration failed',
            error: error.message,
        });
    }
};

const login = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({
                status: 'ERROR',
                message: 'Email and password are required',
            });
        }

        const connection = await pool.getConnection();

        // Get user
        const [users] = await connection.query(
            'SELECT id, password FROM users WHERE email = ?',
            [email]
        );

        if (users.length === 0) {
            connection.release();
            return res.status(401).json({
                status: 'ERROR',
                message: 'Invalid credentials',
            });
        }

        const user = users[0];
        connection.release();

        // Check password
        const isPasswordValid = await bcrypt.compare(password, user.password);

        if (!isPasswordValid) {
            return res.status(401).json({
                status: 'ERROR',
                message: 'Invalid credentials',
            });
        }

        // Generate tokens
        const { accessToken, refreshToken } = generateTokens(user.id);

        // Set refresh token as httpOnly cookie
        res.cookie('refreshToken', refreshToken, {
            httpOnly: true,
            secure: true,
            sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
            maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
        });

        res.status(200).json({
            status: 'OK',
            message: 'Login successful',
            accessToken,
        });
    } catch (error) {
        res.status(500).json({
            status: 'ERROR',
            message: 'Login failed',
            error: error.message,
        });
    }
};

const refresh = async (req, res) => {
    try {
        const refreshToken = req.cookies.refreshToken;

        if (!refreshToken) {
            return res.status(401).json({
                status: 'ERROR',
                message: 'Refresh token not found',
            });
        }

        const decoded = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET);
        const { accessToken, refreshToken: newRefreshToken } = generateTokens(decoded.userId);

        // Update refresh token cookie
        res.cookie('refreshToken', newRefreshToken, {
            httpOnly: true,
            secure: true,
            sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
            maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
        });

        res.status(200).json({
            status: 'OK',
            message: 'Token refreshed',
            accessToken,
        });
    } catch (error) {
        res.status(403).json({
            status: 'ERROR',
            message: 'Invalid refresh token',
        });
    }
};

const logout = (req, res) => {
    res.clearCookie('refreshToken');
    res.status(200).json({
        status: 'OK',
        message: 'Logout successful',
    });
};

export {
    register,
    login,
    refresh,
    logout,
};
