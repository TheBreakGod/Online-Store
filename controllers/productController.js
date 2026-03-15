const Product = require('../models/Product');

// GET /api/admin/products - ดูสินค้าทั้งหมด (รวมที่ลบแล้ว)
const getAllProducts = async (req, res) => {
    try {
        const { page = 1, limit = 10, category, search, status = 'active' } = req.query;
        const skip = (page - 1) * limit;

        // สร้าง filter
        const filter = {};

        if (search) {
            filter.product_name = { $regex: search, $options: 'i' };
        }

        if (category) {
            filter.category_ids = { $in: [parseInt(category)] };
        }

        // Filter by status (active/inactive/all)
        if (status === 'active') {
            filter.isActive = true;
        } else if (status === 'inactive') {
            filter.isActive = false;
        }
        // ถ้า status = 'all' ไม่ต้อง filter

        // ดึงข้อมูล
        const products = await Product.find(filter)
            .sort({ created_at: -1 })
            .skip(skip)
            .limit(parseInt(limit));

        const total = await Product.countDocuments(filter);

        res.json({
            success: true,
            data: products,
            pagination: {
                total,
                page: parseInt(page),
                limit: parseInt(limit),
                pages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        console.error('Get products error:', error);
        res.status(500).json({ error: 'Failed to fetch products' });
    }
};

// GET /api/admin/products/:id - ดูรายละเอียด product เดียว
const getProductDetail = async (req, res) => {
    try {
        const { id } = req.params;

        if (!id.match(/^[0-9a-fA-F]{24}$/)) {
            return res.status(400).json({ error: 'Invalid product ID' });
        }

        const product = await Product.findById(id);

        if (!product) {
            return res.status(404).json({ error: 'Product not found' });
        }

        res.json({
            success: true,
            data: product
        });
    } catch (error) {
        console.error('Get product detail error:', error);
        res.status(500).json({ error: 'Failed to fetch product details' });
    }
};

// POST /api/admin/products - เพิ่มสินค้าใหม่
const createProduct = async (req, res) => {
    try {
        const { product_name, price, category_id, product_image_url } = req.body;

        // ตรวจสอบ required fields
        if (!product_name || !price || !category_id) {
            return res.status(400).json({
                error: 'Product name, price, and category are required'
            });
        }

        const parsedCategoryId = parseInt(category_id);
        // สร้าง category_ids array - ทุกสินค้าจะถูกเพิ่มเข้าซูเปอร์มาร์เก็ต (category 1) โดยอัตโนมัติ
        const categoryIds = [1]; // ซูเปอร์มาร์เก็ต
        if (parsedCategoryId !== 1 && !categoryIds.includes(parsedCategoryId)) {
            categoryIds.push(parsedCategoryId); // เพิ่มหมวดหมู่ที่เลือก
        }

        const newProduct = new Product({
            product_name,
            price: parseFloat(price),
            category_id: parsedCategoryId,
            category_ids: categoryIds,
            product_image_url: product_image_url || null,
            isActive: true
        });

        await newProduct.save();

        res.status(201).json({
            success: true,
            message: 'Product created successfully',
            data: newProduct
        });
    } catch (error) {
        console.error('Create product error:', error);
        res.status(500).json({ error: 'Failed to create product' });
    }
};

// PUT /api/admin/products/:id - แก้ไขสินค้า
const updateProduct = async (req, res) => {
    try {
        const { id } = req.params;
        const { product_name, price, category_id, product_image_url } = req.body;

        if (!id.match(/^[0-9a-fA-F]{24}$/)) {
            return res.status(400).json({ error: 'Invalid product ID' });
        }

        // เตรียม update data
        const updateData = {};
        if (product_name) updateData.product_name = product_name;
        if (price) updateData.price = parseFloat(price);
        if (category_id) {
            const parsedCategoryId = parseInt(category_id);
            updateData.category_id = parsedCategoryId;
            // อัปเดต category_ids array - ทุกสินค้าจะอยู่ในซูเปอร์มาร์เก็ตและในหมวดหมู่ที่เลือก
            const categoryIds = [1];
            if (parsedCategoryId !== 1) {
                categoryIds.push(parsedCategoryId);
            }
            updateData.category_ids = categoryIds;
        }
        if (product_image_url !== undefined) updateData.product_image_url = product_image_url;

        updateData.updated_at = new Date();

        const updatedProduct = await Product.findByIdAndUpdate(
            id,
            updateData,
            { new: true, runValidators: true }
        );

        if (!updatedProduct) {
            return res.status(404).json({ error: 'Product not found' });
        }

        res.json({
            success: true,
            message: 'Product updated successfully',
            data: updatedProduct
        });
    } catch (error) {
        console.error('Update product error:', error);
        res.status(500).json({ error: 'Failed to update product' });
    }
};

// DELETE /api/admin/products/:id - ลบสินค้า (soft delete)
const deleteProduct = async (req, res) => {
    try {
        const { id } = req.params;

        if (!id.match(/^[0-9a-fA-F]{24}$/)) {
            return res.status(400).json({ error: 'Invalid product ID' });
        }

        const product = await Product.findByIdAndUpdate(
            id,
            {
                isActive: false,
                deletedAt: new Date(),
                updated_at: new Date()
            },
            { new: true }
        );

        if (!product) {
            return res.status(404).json({ error: 'Product not found' });
        }

        res.json({
            success: true,
            message: 'Product deleted successfully',
            data: product
        });
    } catch (error) {
        console.error('Delete product error:', error);
        res.status(500).json({ error: 'Failed to delete product' });
    }
};

// PUT /api/admin/products/:id/restore - คืนสินค้าที่ลบแล้ว
const restoreProduct = async (req, res) => {
    try {
        const { id } = req.params;

        if (!id.match(/^[0-9a-fA-F]{24}$/)) {
            return res.status(400).json({ error: 'Invalid product ID' });
        }

        const product = await Product.findByIdAndUpdate(
            id,
            {
                isActive: true,
                deletedAt: null,
                updated_at: new Date()
            },
            { new: true }
        );

        if (!product) {
            return res.status(404).json({ error: 'Product not found' });
        }

        res.json({
            success: true,
            message: 'Product restored successfully',
            data: product
        });
    } catch (error) {
        console.error('Restore product error:', error);
        res.status(500).json({ error: 'Failed to restore product' });
    }
};

// GET /api/admin/products/stats/summary - สรุปสถิติ products
const getProductStats = async (req, res) => {
    try {
        const stats = await Product.aggregate([
            {
                $group: {
                    _id: '$category_id',
                    count: { $sum: 1 },
                    avgPrice: { $avg: '$price' }
                }
            }
        ]);

        const total = await Product.countDocuments({ isActive: true });
        const deleted = await Product.countDocuments({ isActive: false });

        res.json({
            success: true,
            data: {
                totalActive: total,
                totalDeleted: deleted,
                byCategory: stats
            }
        });
    } catch (error) {
        console.error('Get product stats error:', error);
        res.status(500).json({ error: 'Failed to fetch product statistics' });
    }
};

module.exports = {
    getAllProducts,
    getProductDetail,
    createProduct,
    updateProduct,
    deleteProduct,
    restoreProduct,
    getProductStats
};
