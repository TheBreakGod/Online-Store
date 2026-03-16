const PurchaseHistory = require('../models/PurchaseHistory');
const User = require('../models/User');
const UserInfo = require('../models/UserInfo');
const Product = require('../models/Product');

// GET /api/admin/orders - ดูคำสั่งซื้อทั้งหมด
const getAllOrders = async (req, res) => {
    try {
        const { page = 1, limit = 10, status } = req.query;
        const skip = (page - 1) * limit;

        // สร้าง filter
        const filter = {};
        if (status) {
            filter.status = status;
        }

        // ดึงข้อมูล orders พร้อม populate user info
        const orders = await PurchaseHistory.find(filter)
            .populate('user_id', 'username email name')
            .sort({ created_at: -1 })
            .skip(skip)
            .limit(parseInt(limit));

        // ดึงชื่อลูกค้าจาก UserInfo
        const userIds = [...new Set(orders.map(o => o.user_id).filter(Boolean))];
        const userInfos = await UserInfo.find({ user_id: { $in: userIds } });
        const userInfoMap = {};
        userInfos.forEach(info => {
            userInfoMap[info.user_id.toString()] = info.name;
        });

        // แนบชื่อลูกค้าเข้า orders
        const ordersWithCustomer = orders.map(o => {
            const obj = o.toObject();
            obj.customer_name = userInfoMap[obj.user_id?.toString()] || null;
            return obj;
        });

        const total = await PurchaseHistory.countDocuments(filter);

        // ส่งข้อมูลกลับพร้อม pagination info
        res.json({
            success: true,
            data: ordersWithCustomer,
            pagination: {
                total,
                page: parseInt(page),
                limit: parseInt(limit),
                pages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        console.error('Get orders error:', error);
        res.status(500).json({ error: 'Failed to fetch orders' });
    }
};

// GET /api/admin/orders/:id - ดูรายละเอียด order เดียว
const getOrderDetail = async (req, res) => {
    try {
        const { id } = req.params;

        // ตรวจสอบ id validity
        if (!id.match(/^[0-9a-fA-F]{24}$/)) {
            return res.status(400).json({ error: 'Invalid order ID' });
        }

        const order = await PurchaseHistory.findById(id)
            .populate('user_id', 'username email name')
            .populate('product_id', 'product_name price');

        if (!order) {
            return res.status(404).json({ error: 'Order not found' });
        }

        // ดึงข้อมูล customer info
        let customerInfo = null;
        if (order.user_id) {
            customerInfo = await UserInfo.findOne({ user_id: order.user_id._id });
        }

        res.json({
            success: true,
            data: {
                order,
                customerInfo
            }
        });
    } catch (error) {
        console.error('Get order detail error:', error);
        res.status(500).json({ error: 'Failed to fetch order details' });
    }
};

// PUT /api/admin/orders/:id/status - เปลี่ยนสถานะ order
const updateOrderStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        // ตรวจสอบ status ที่ยอมรับ
        const validStatuses = ['pending', 'processing', 'shipped', 'delivered', 'cancelled', 'cancel_requested'];
        if (!validStatuses.includes(status)) {
            return res.status(400).json({
                error: `Invalid status. Must be one of: ${validStatuses.join(', ')}`
            });
        }

        // ตรวจสอบ id validity
        if (!id.match(/^[0-9a-fA-F]{24}$/)) {
            return res.status(400).json({ error: 'Invalid order ID' });
        }

        const order = await PurchaseHistory.findByIdAndUpdate(
            id,
            {
                status,
                updated_at: new Date()
            },
            { new: true }
        ).populate('user_id', 'username email name');

        if (!order) {
            return res.status(404).json({ error: 'Order not found' });
        }

        res.json({
            success: true,
            message: 'Order status updated successfully',
            data: order
        });
    } catch (error) {
        console.error('Update order status error:', error);
        res.status(500).json({ error: 'Failed to update order status' });
    }
};

// GET /api/admin/orders/stats/summary - สรุปสถิติ orders
const getOrderStats = async (req, res) => {
    try {
        const stats = await PurchaseHistory.aggregate([
            {
                $group: {
                    _id: '$status',
                    count: { $sum: 1 },
                    totalAmount: { $sum: '$total_price' }
                }
            }
        ]);

        const total = await PurchaseHistory.countDocuments();

        res.json({
            success: true,
            data: {
                total,
                byStatus: stats
            }
        });
    } catch (error) {
        console.error('Get order stats error:', error);
        res.status(500).json({ error: 'Failed to fetch order statistics' });
    }
};

module.exports = {
    getAllOrders,
    getOrderDetail,
    updateOrderStatus,
    getOrderStats
};
