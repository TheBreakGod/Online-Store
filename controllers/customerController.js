const User = require('../models/User');
const UserInfo = require('../models/UserInfo');
const PurchaseHistory = require('../models/PurchaseHistory');

// GET /api/admin/customers - ดูข้อมูลลูกค้าทั้งหมด
const getAllCustomers = async (req, res) => {
    try {
        const { page = 1, limit = 10, search } = req.query;
        const skip = (page - 1) * limit;

        // สร้าง filter
        const filter = { role: 'user' };

        if (search) {
            filter.$or = [
                { username: { $regex: search, $options: 'i' } },
                { email: { $regex: search, $options: 'i' } },
                { name: { $regex: search, $options: 'i' } }
            ];
        }

        // ดึงข้อมูล customers
        const customers = await User.find(filter)
            .select('-password') // ไม่ส่ง password
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(parseInt(limit));

        const total = await User.countDocuments(filter);

        res.json({
            success: true,
            data: customers,
            pagination: {
                total,
                page: parseInt(page),
                limit: parseInt(limit),
                pages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        console.error('Get customers error:', error);
        res.status(500).json({ error: 'Failed to fetch customers' });
    }
};

// GET /api/admin/customers/:id - ดูข้อมูลลูกค้าเดียว
const getCustomerDetail = async (req, res) => {
    try {
        const { id } = req.params;

        if (!id.match(/^[0-9a-fA-F]{24}$/)) {
            return res.status(400).json({ error: 'Invalid customer ID' });
        }

        const customer = await User.findById(id)
            .select('-password');

        if (!customer || customer.role !== 'user') {
            return res.status(404).json({ error: 'Customer not found' });
        }

        // ดึงข้อมูล customer info
        const customerInfo = await UserInfo.findOne({ user_id: id });

        // ดึงประวัติการซื้อ
        const purchaseHistory = await PurchaseHistory.find({ user_id: id })
            .populate('product_id', 'product_name price')
            .sort({ created_at: -1 });

        res.json({
            success: true,
            data: {
                customer,
                customerInfo,
                purchaseHistory
            }
        });
    } catch (error) {
        console.error('Get customer detail error:', error);
        res.status(500).json({ error: 'Failed to fetch customer details' });
    }
};

// GET /api/admin/customers/:id/purchases - ดูประวัติการซื้อของลูกค้า
const getCustomerPurchases = async (req, res) => {
    try {
        const { id } = req.params;
        const { page = 1, limit = 10 } = req.query;
        const skip = (page - 1) * limit;

        if (!id.match(/^[0-9a-fA-F]{24}$/)) {
            return res.status(400).json({ error: 'Invalid customer ID' });
        }

        // ตรวจสอบว่า customer มีอยู่
        const customer = await User.findById(id);
        if (!customer) {
            return res.status(404).json({ error: 'Customer not found' });
        }

        const purchases = await PurchaseHistory.find({ user_id: id })
            .populate('product_id', 'product_name price')
            .sort({ created_at: -1 })
            .skip(skip)
            .limit(parseInt(limit));

        const total = await PurchaseHistory.countDocuments({ user_id: id });

        res.json({
            success: true,
            data: purchases,
            pagination: {
                total,
                page: parseInt(page),
                limit: parseInt(limit),
                pages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        console.error('Get customer purchases error:', error);
        res.status(500).json({ error: 'Failed to fetch customer purchases' });
    }
};

// PUT /api/admin/customers/:id - แก้ไขข้อมูลลูกค้า
const updateCustomer = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, email, phone, address, district, province, postal_code } = req.body;

        if (!id.match(/^[0-9a-fA-F]{24}$/)) {
            return res.status(400).json({ error: 'Invalid customer ID' });
        }

        // อัพเดต User info
        if (name || email) {
            const updateUserData = {};
            if (name) updateUserData.name = name;
            if (email) updateUserData.email = email;

            await User.findByIdAndUpdate(id, updateUserData);
        }

        // อัพเดต UserInfo
        if (phone || address || district || province || postal_code) {
            const updateUserInfoData = {};
            if (phone) updateUserInfoData.phone = phone;
            if (address) updateUserInfoData.address = address;
            if (district) updateUserInfoData.district = district;
            if (province) updateUserInfoData.province = province;
            if (postal_code) updateUserInfoData.postal_code = postal_code;

            await UserInfo.findOneAndUpdate(
                { user_id: id },
                updateUserInfoData,
                { new: true, upsert: true }
            );
        }

        // ดึงข้อมูลที่อัพเดต
        const customer = await User.findById(id).select('-password');
        const customerInfo = await UserInfo.findOne({ user_id: id });

        res.json({
            success: true,
            message: 'Customer updated successfully',
            data: {
                customer,
                customerInfo
            }
        });
    } catch (error) {
        console.error('Update customer error:', error);
        res.status(500).json({ error: 'Failed to update customer' });
    }
};

// GET /api/admin/customers/stats/summary - สรุปสถิติ customers
const getCustomerStats = async (req, res) => {
    try {
        const totalCustomers = await User.countDocuments({ role: 'user' });
        
        // ดึงสถิติการซื้อ
        const purchaseStats = await PurchaseHistory.aggregate([
            {
                $group: {
                    _id: '$user_id',
                    totalSpent: { $sum: '$total_price' },
                    orderCount: { $sum: 1 }
                }
            },
            {
                $sort: { totalSpent: -1 }
            }
        ]);

        // Top customers ที่ซื้อมากที่สุด
        const topCustomers = await Promise.all(
            purchaseStats.slice(0, 5).map(async (stat) => {
                const user = await User.findById(stat._id).select('name email');
                return {
                    ...stat,
                    user
                };
            })
        );

        res.json({
            success: true,
            data: {
                totalCustomers,
                topCustomers,
                totalPurchases: purchaseStats.length
            }
        });
    } catch (error) {
        console.error('Get customer stats error:', error);
        res.status(500).json({ error: 'Failed to fetch customer statistics' });
    }
};

module.exports = {
    getAllCustomers,
    getCustomerDetail,
    getCustomerPurchases,
    updateCustomer,
    getCustomerStats
};
