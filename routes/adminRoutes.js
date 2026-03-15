const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { authenticateAdmin, validateAdminRole } = require('../middlewares/auth');

// ไม่ต้องการ token
router.post('/login', adminController.adminLogin);

// ต้องการ token
router.post('/logout', authenticateAdmin, adminController.adminLogout);
router.get('/verify', authenticateAdmin, adminController.verifyToken);

module.exports = router;
