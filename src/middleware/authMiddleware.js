import jwt from 'jsonwebtoken';

const authMiddleware = (req, res, next) => {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({
            status: 'ERROR',
            message: 'Missing or invalid authorization header',
        });
    }

    const token = authHeader.slice(7);

    try {
        const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
        req.userId = decoded.userId;
        next();
    } catch (error) {
        return res.status(403).json({
            status: 'ERROR',
            message: 'Invalid or expired token',
        });
    }
};

export default authMiddleware;
