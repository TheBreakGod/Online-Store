const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

// Middleware ตรวจสอบ Admin Token
const authenticateAdmin = (req, res, next) => {
    try {
        // รับ token จาก header Authorization: Bearer <token>
        const authHeader = req.headers.authorization;
        const token = authHeader && authHeader.split(' ')[1];

        if (!token) {
            return res.status(401).json({ error: 'Token not found' });
        }

        // ตรวจสอบและ decode token
        const decoded = jwt.verify(token, JWT_SECRET);
        req.admin = decoded;
        next();
    } catch (error) {
        return res.status(403).json({ error: 'Invalid or expired token' });
    }
};

// Middleware สำหรับ logout
const validateAdminRole = (req, res, next) => {
    if (req.admin && req.admin.role === 'admin') {
        next();
    } else {
        res.status(403).json({ error: 'Admin access required' });
    }
};

module.exports = {
    authenticateAdmin,
    validateAdminRole,
    JWT_SECRET
};
