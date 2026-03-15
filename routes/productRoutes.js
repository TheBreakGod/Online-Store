const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');
const { authenticateAdmin } = require('../middlewares/auth');

// ทั้งหมด require admin auth
router.get('/', authenticateAdmin, productController.getAllProducts);
router.get('/stats/summary', authenticateAdmin, productController.getProductStats);
router.post('/', authenticateAdmin, productController.createProduct);
router.get('/:id', authenticateAdmin, productController.getProductDetail);
router.put('/:id', authenticateAdmin, productController.updateProduct);
router.delete('/:id', authenticateAdmin, productController.deleteProduct);
router.put('/:id/restore', authenticateAdmin, productController.restoreProduct);

module.exports = router;
