const express = require('express');
const router = express.Router();
const customerController = require('../controllers/customerController');
const { authenticateAdmin } = require('../middlewares/auth');

// ทั้งหมด require admin auth
router.get('/', authenticateAdmin, customerController.getAllCustomers);
router.get('/stats/summary', authenticateAdmin, customerController.getCustomerStats);
router.get('/:id', authenticateAdmin, customerController.getCustomerDetail);
router.get('/:id/purchases', authenticateAdmin, customerController.getCustomerPurchases);
router.put('/:id', authenticateAdmin, customerController.updateCustomer);

module.exports = router;
