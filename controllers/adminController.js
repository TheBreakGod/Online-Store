const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { JWT_SECRET } = require('../middlewares/auth');

const adminLogin = async (req, res) => {
    try {
        const { username, password } = req.body;

        // ตรวจสอบ input
        if (!username || !password) {
            return res.status(400).json({ error: 'Username and password are required' });
        }

        // ค้นหา user ที่มี username และ role = admin
        const user = await User.findOne({ username });

        if (!user) {
            return res.status(401).json({ error: 'Invalid username or password' });
        }

        if (user.role !== 'admin') {
            return res.status(403).json({ error: 'Not an admin user' });
        }

        // ตรวจสอบรหัสผ่าน
        const isPasswordValid = await bcrypt.compare(password, user.password);

        if (!isPasswordValid) {
            return res.status(401).json({ error: 'Invalid username or password' });
        }

        // สร้าง JWT token
        const token = jwt.sign(
            {
                userId: user._id,
                username: user.username,
                role: user.role,
                name: user.name
            },
            JWT_SECRET,
            { expiresIn: '24h' }
        );

        res.json({
            success: true,
            token,
            user: {
                id: user._id,
                username: user.username,
                name: user.name,
                email: user.email
            }
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Server error during login' });
    }
};

const adminLogout = (req, res) => {
    // Token หมดอายุแล้ว client จะลบ localStorage เอง
    res.json({ success: true, message: 'Logged out successfully' });
};

const verifyToken = (req, res) => {
    // ถ้าผ่าน middleware authenticateAdmin มา ได้ใช้งาน token ได้
    res.json({
        success: true,
        admin: req.admin
    });
};

module.exports = {
    adminLogin,
    adminLogout,
    verifyToken
};
