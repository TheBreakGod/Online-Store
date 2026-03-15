const express = require('express');
const router = express.Router();
const orderController = require('../controllers/orderController');
const { authenticateAdmin } = require('../middlewares/auth');

// ทั้งหมด require admin auth
router.get('/', authenticateAdmin, orderController.getAllOrders);
router.get('/stats/summary', authenticateAdmin, orderController.getOrderStats);
router.get('/:id', authenticateAdmin, orderController.getOrderDetail);
router.put('/:id/status', authenticateAdmin, orderController.updateOrderStatus);

module.exports = router;
