const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const app = express();
const port = 3000;
const cors = require('cors');
const bodyParser = require('body-parser');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Import Models
const User = require('./models/User');
const Product = require('./models/Product');
const PurchaseHistory = require('./models/PurchaseHistory');
const UserInfo = require('./models/UserInfo');

// Import Routes
const adminRoutes = require('./routes/adminRoutes');
const productRoutes = require('./routes/productRoutes');
const orderRoutes = require('./routes/orderRoutes');
const customerRoutes = require('./routes/customerRoutes');

// Import Middlewares
const { authenticateAdmin } = require('./middlewares/auth');

// ================================
// MIDDLEWARE & SETUP
// ================================

// ใช้ memoryStorage เก็บไฟล์ใน memory แล้วแปลงเป็น base64 เก็บใน DB
const upload = multer({ 
    storage: multer.memoryStorage(),
    limits: {
        fileSize: 5 * 1024 * 1024 // 5MB
    },
    fileFilter: (req, file, cb) => {
        // ยอมรับไฟล์รูปทั้งหมด
        if (file.mimetype.startsWith('image/')) {
            cb(null, true);
        } else {
            cb(new Error('ต้องเป็นไฟล์รูปภาพเท่านั้น'), false);
        }
    }
});

// Multer error handler middleware
const handleMulterError = (err, req, res, next) => {
    if (err instanceof multer.MulterError) {
        console.error('❌ Multer error:', err.message);
        return res.status(400).json({ 
            success: false, 
            message: 'Upload error: ' + err.message 
        });
    } else if (err) {
        console.error('❌ File validation error:', err.message);
        return res.status(400).json({ 
            success: false, 
            message: err.message 
        });
    }
    next();
};

// Middleware
app.use(cors());

// Serve static files — Vercel serverless fix: ใช้ sendFile แทน express.static
app.get('*.html', (req, res, next) => {
    const filePath = path.join(__dirname, 'public', req.path);
    if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
        return res.sendFile(filePath);
    }
    next();
});
app.get('*.css', (req, res, next) => {
    const filePath = path.join(__dirname, 'public', req.path);
    if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
        res.setHeader('Content-Type', 'text/css');
        return res.sendFile(filePath);
    }
    next();
});
app.get('*.js', (req, res, next) => {
    // ข้าม API routes
    if (req.path.startsWith('/api/')) return next();
    const filePath = path.join(__dirname, 'public', req.path);
    if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
        res.setHeader('Content-Type', 'application/javascript');
        return res.sendFile(filePath);
    }
    next();
});
app.get('*', (req, res, next) => {
    // ข้าม API routes
    if (req.path.startsWith('/api/') || req.path.startsWith('/search-products') || req.path.startsWith('/uploads')) return next();
    const filePath = path.join(__dirname, 'public', req.path);
    if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
        return res.sendFile(filePath);
    }
    // ลอง index.html
    if (req.path === '/' || req.path === '') {
        const indexPath = path.join(__dirname, 'public', 'index.html');
        if (fs.existsSync(indexPath)) return res.sendFile(indexPath);
    }
    next();
});

app.use(express.static(path.join(__dirname, 'public')));
// multer routes ต้องไป BEFORE body parser
// เพราะ body parser จะ consume body ก่อน multer ได้
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ================================
// MONGODB CONNECTION (Serverless-compatible)
// ================================

const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/easyshop';
console.log('🔗 MONGO_URI set:', !!process.env.MONGO_URI, mongoUri.includes('mongodb+srv') ? 'Atlas' : 'Local');

// Cache connection สำหรับ Vercel serverless
let isConnected = false;

async function connectDB() {
    if (isConnected && mongoose.connection.readyState === 1) {
        return;
    }
    try {
        await mongoose.connect(mongoUri, {
            serverSelectionTimeoutMS: 10000,
            socketTimeoutMS: 45000,
            connectTimeoutMS: 10000,
            maxPoolSize: 10,
        });
        isConnected = true;
        console.log('✅ Connected to MongoDB successfully');
    } catch (err) {
        isConnected = false;
        console.error('❌ MongoDB connection error:', err.message);
        throw err;
    }
}

// เชื่อมต่อตอน startup
connectDB().catch(err => console.error('Initial connection failed:', err.message));

// Health check endpoint สำหรับเช็คสถานะ (ต้องอยู่ก่อน DB middleware)
app.get('/api/health', async (req, res) => {
    const dbState = mongoose.connection.readyState;
    const states = { 0: 'disconnected', 1: 'connected', 2: 'connecting', 3: 'disconnecting' };
    
    const uriPreview = mongoUri ? mongoUri.replace(/:([^@]+)@/, ':***@').substring(0, 80) : 'not set';
    
    let testResult = 'not tested';
    let connectionError = null;
    
    if (dbState !== 1) {
        try {
            await mongoose.disconnect().catch(() => {});
            await mongoose.connect(mongoUri, {
                serverSelectionTimeoutMS: 8000,
                connectTimeoutMS: 8000,
            });
            testResult = 'reconnected OK';
        } catch (e) {
            connectionError = e.message;
            testResult = 'connection failed';
        }
    }
    
    if (mongoose.connection.readyState === 1) {
        try {
            const count = await mongoose.connection.db.collection('users').countDocuments();
            testResult = `OK - ${count} users found`;
        } catch (e) {
            testResult = `DB Error: ${e.message}`;
        }
    }
    
    const finalState = mongoose.connection.readyState;
    res.json({
        status: states[finalState] || 'unknown',
        dbState: finalState,
        mongoUriSet: !!process.env.MONGO_URI,
        mongoUriType: mongoUri.includes('mongodb+srv') ? 'Atlas' : 'Local',
        uriPreview,
        testResult,
        connectionError,
        env: process.env.NODE_ENV || 'not set'
    });
});

// Debug: เช็คว่า file อยู่ไหนบน Vercel
app.get('/api/debug-files', (req, res) => {
    const publicDir = path.join(__dirname, 'public');
    const adminDir = path.join(__dirname, 'public', 'admin');
    let publicExists = fs.existsSync(publicDir);
    let adminExists = fs.existsSync(adminDir);
    let publicFiles = publicExists ? fs.readdirSync(publicDir) : [];
    let adminFiles = adminExists ? fs.readdirSync(adminDir) : [];
    res.json({
        __dirname,
        publicDir,
        publicExists,
        publicFiles,
        adminDir,
        adminExists,
        adminFiles
    });
});

// Middleware: ตรวจสอบ DB connection ก่อนทุก API request
app.use(async (req, res, next) => {
    // ข้าม static files
    if (!req.path.startsWith('/api') && !req.path.startsWith('/search-products')) {
        return next();
    }
    try {
        await connectDB();
        next();
    } catch (err) {
        res.status(503).json({ error: 'Database connection failed', detail: err.message });
    }
});

// ================================
// AUTHENTICATION ROUTES
// ================================

// สมัครสมาชิก
app.post('/api/register', async (req, res) => {
    try {
        const { username, name, email, password } = req.body;

        // ตรวจสอบข้อมูล
        if (!username || !email || !password) {
            return res.status(400).json({ 
                success: false, 
                message: 'กรุณากรอกข้อมูลให้ครบถ้วน' 
            });
        }

        // ตรวจสอบ username ซ้ำ
        const existingUsername = await User.findOne({ username });
        if (existingUsername) {
            return res.status(400).json({ 
                success: false, 
                message: 'ชื่อผู้ใช้นี้ถูกใช้งานแล้ว' 
            });
        }

        // ตรวจสอบ email ซ้ำ
        const existingEmail = await User.findOne({ email });
        if (existingEmail) {
            return res.status(400).json({ 
                success: false, 
                message: 'อีเมลนี้ถูกใช้งานแล้ว' 
            });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // สร้าง user ใหม่
        const newUser = new User({
            username,
            name: name || username,
            email,
            password: hashedPassword
        });

        await newUser.save();
        res.json({ success: true, message: 'สมัครสมาชิกสำเร็จ!' });
    } catch (error) {
        console.error('Register error:', error.message, error.stack);
        res.status(500).json({ error: 'Server error', detail: error.message });
    }
});

// ล็อกอิน
app.post('/api/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        // ค้นหา user จากอีเมล
        const user = await User.findOne({ email });
        
        if (!user) {
            return res.json({ success: false, message: 'ไม่พบผู้ใช้นี้ในระบบ' });
        }

        // ตรวจสอบรหัสผ่าน
        const isPasswordValid = await bcrypt.compare(password, user.password);
        
        if (!isPasswordValid) {
            return res.json({ success: false, message: 'รหัสผ่านไม่ถูกต้อง' });
        }

        res.json({
            success: true,
            message: 'รหัสผ่านถูกต้อง',
            user_id: user._id
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// รีเซ็ตรหัสผ่าน
app.post('/api/reset-password', async (req, res) => {
    try {
        const { email, newPassword } = req.body;

        if (!email || !newPassword) {
            return res.status(400).json({ 
                error: 'อีเมลและรหัสผ่านใหม่ต้องไม่เป็นค่าว่าง' 
            });
        }

        // ค้นหา user
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        // Hash รหัสผ่านใหม่
        const hashedPassword = await bcrypt.hash(newPassword, 10);

        // อัพเดต password
        user.password = hashedPassword;
        await user.save();

        res.json({ message: 'รหัสผ่านของคุณถูกรีเซ็ตเรียบร้อย' });
    } catch (error) {
        console.error('Reset password error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// ================================
// PRODUCT ROUTES
// ================================

// เพิ่มสินค้า
app.post('/api/products', async (req, res) => {
    try {
        const { product_name, price, category_id, product_image_url } = req.body;

        if (!product_name || !price || !category_id) {
            return res.status(400).json({ 
                success: false,
                message: "กรุณากรอกข้อมูลให้ครบ (ชื่อสินค้า, ราคา, หมวดหมู่)" 
            });
        }

        const newProduct = new Product({
            product_name,
            price: Number(price),
            category_id: Number(category_id),
            product_image_url: product_image_url || null
        });

        await newProduct.save();
        res.status(201).json({ 
            success: true,
            message: "เพิ่มสินค้าสำเร็จ",
            data: newProduct
        });
    } catch (error) {
        console.error("Error adding product:", error);
        res.status(500).json({ 
            success: false,
            message: "ไม่สามารถเพิ่มสินค้าได้",
            error: error.message
        });
    }
});

// ดึงรายการสินค้า (พร้อม pagination และ filtering)
app.get('/api/products', async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const category = req.query.category;
        const limit = 100;
        const offset = (page - 1) * limit;

        let query = { isActive: true };
        // ตรวจสอบ category ต้องเป็น number และมีค่า
        // ใช้ $in operator สำหรับค้นหาใน array category_ids
        if (category && !isNaN(category)) {
            query.category_ids = { $in: [parseInt(category)] };
        }

        const products = await Product.find(query).limit(limit).skip(offset);
        res.json(products);
    } catch (error) {
        console.error('Error fetching products:', error);
        res.status(500).json({ message: 'Database error' });
    }
});

// ดึงรายการสินค้าทั้งหมด (ไม่ pagination)
app.get('/products', async (req, res) => {
    try {
        const products = await Product.find({ isActive: true });
        res.status(200).json(products);
    } catch (error) {
        console.error('Error fetching products:', error);
        res.status(500).json({ message: 'เกิดข้อผิดพลาดในการดึงข้อมูลสินค้า' });
    }
});

// ค้นหาสินค้า
app.get('/search-products', async (req, res) => {
    try {
        const searchTerm = req.query.query || '';
        
        const results = await Product.find({
            product_name: { $regex: searchTerm, $options: 'i' },
            isActive: true
        }).sort({ product_name: 1 });

        res.json(results);
    } catch (error) {
        console.error('Error fetching data:', error);
        res.status(500).json({ error: 'Database error' });
    }
});

// แก้ไขสินค้า
app.put('/api/products/:id', async (req, res) => {
    try {
        const productId = req.params.id;
        const { product_name, price, category_id, product_image_url } = req.body;

        const updateData = {};
        if (product_name) updateData.product_name = product_name;
        if (price) updateData.price = price;
        if (category_id) {
            updateData.category_id = category_id;
            // อัปเดต category_ids - ทุกสินค้าจะอยู่ในซูเปอร์มาร์เก็ตและในหมวดหมู่ที่เลือก
            const categoryIds = [1];
            if (parseInt(category_id) !== 1) {
                categoryIds.push(parseInt(category_id));
            }
            updateData.category_ids = categoryIds;
        }
        if (product_image_url) updateData.product_image_url = product_image_url;

        if (Object.keys(updateData).length === 0) {
            return res.status(400).json({ message: "กรุณากรอกข้อมูลที่ต้องการแก้ไข" });
        }

        const product = await Product.findByIdAndUpdate(productId, updateData, { new: true });
        if (!product) {
            return res.status(404).json({ message: "ไม่พบสินค้า" });
        }

        res.status(200).json({ message: "แก้ไขสินค้าสำเร็จ" });
    } catch (error) {
        console.error("Error updating product:", error);
        res.status(500).json({ message: "ไม่สามารถแก้ไขสินค้าได้" });
    }
});

// ลบสินค้า
app.delete("/api/products/:id", async (req, res) => {
    try {
        const { id } = req.params;
        const product = await Product.findByIdAndDelete(id);
        
        if (!product) {
            return res.status(404).send("ไม่พบสินค้าที่ต้องการลบ");
        }

        res.json({ message: "ลบสินค้าสำเร็จ" });
    } catch (error) {
        console.error("Error deleting product:", error);
        res.status(500).send("เกิดข้อผิดพลาดในการลบสินค้า");
    }
});

// ================================
// ADMIN ENDPOINTS FOR PRODUCTS
// ================================

// ดึงรายการสินค้า (Admin)
app.get('/api/admin/products', async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;

        // Build filter query
        const filter = {};
        if (req.query.search) {
            filter.product_name = { $regex: req.query.search, $options: 'i' };
        }
        if (req.query.category) {
            filter.category_id = parseInt(req.query.category);
        }

        const products = await Product.find(filter).skip(skip).limit(limit);
        const total = await Product.countDocuments(filter);

        res.status(200).json({
            success: true,
            data: products,
            pagination: {
                total,
                page,
                limit,
                pages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        console.error("Error fetching products:", error);
        res.status(500).json({
            success: false,
            message: "ไม่สามารถดึงข้อมูลสินค้าได้",
            error: error.message
        });
    }
});

// ดึงสินค้าจาก ID (สำหรับการแก้ไขหรือดูรายละเอียด)
app.get('/api/admin/products/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const product = await Product.findById(id);
        
        if (!product) {
            return res.status(404).json({
                success: false,
                message: "ไม่พบสินค้า"
            });
        }

        res.status(200).json({
            success: true,
            data: product
        });
    } catch (error) {
        console.error("Error fetching product:", error);
        res.status(500).json({
            success: false,
            message: "ไม่สามารถดึงข้อมูลสินค้าได้",
            error: error.message
        });
    }
});

// เพิ่มสินค้า (Admin)
app.post('/api/admin/products', upload.single('image'), handleMulterError, async (req, res) => {
    try {
        console.log('=== POST /api/admin/products ===');
        console.log('Body:', req.body);
        console.log('File object:', {
            exists: !!req.file,
            filename: req.file?.filename,
            originalname: req.file?.originalname,
            size: req.file?.size,
            mimetype: req.file?.mimetype
        });
        
        const { product_name, price, category_id } = req.body;

        if (!product_name || !price || !category_id) {
            return res.status(400).json({ 
                success: false,
                message: "กรุณากรอกข้อมูลให้ครบ (ชื่อสินค้า, ราคา, หมวดหมู่)" 
            });
        }

        let product_image_url = null;
        if (req.file) {
            // แปลงเป็น base64 data URI เก็บใน DB
            const base64 = req.file.buffer.toString('base64');
            product_image_url = `data:${req.file.mimetype};base64,${base64}`;
            console.log('✅ Image saved as base64, size:', req.file.size, 'bytes');
        } else {
            console.log('⚠️  ไม่มีไฟล์อัปโหลด - product_image_url = null');
        }

        const catId = Number(category_id);
        const newProduct = new Product({
            product_name,
            price: Number(price),
            category_id: catId,
            category_ids: [catId],
            product_image_url
        });

        await newProduct.save();
        console.log('✅ สินค้าถูกบันทึก:', newProduct._id);
        
        res.status(201).json({ 
            success: true,
            message: "เพิ่มสินค้าสำเร็จ",
            data: newProduct
        });
    } catch (error) {
        console.error("Error adding product:", error);
        res.status(500).json({ 
            success: false,
            message: "ไม่สามารถเพิ่มสินค้าได้",
            error: error.message
        });
    }
});

// แก้ไขสินค้า (Admin)
app.put('/api/admin/products/:id', upload.single('image'), handleMulterError, async (req, res) => {
    try {
        const { id } = req.params;
        console.log('=== PUT /api/admin/products/:id ===');
        console.log('Product ID:', id);
        const { product_name, price, category_id, product_image_url } = req.body;

        const updateData = {};
        if (product_name) updateData.product_name = product_name;
        if (price) updateData.price = Number(price);
        if (category_id) {
            updateData.category_id = Number(category_id);
            updateData.category_ids = [Number(category_id)];
        }
        
        // ✅ ถ้า upload ไฟล์ใหม่ ให้ แปลงเป็น base64 แล้วเก็บใน DB
        if (req.file) {
            const base64 = req.file.buffer.toString('base64');
            updateData.product_image_url = `data:${req.file.mimetype};base64,${base64}`;
        } 
        // ✅ ถ้าส่ง product_image_url มาใน body ให้ update (รองรับ JSON request)
        else if (product_image_url !== undefined) {
            updateData.product_image_url = product_image_url;
        }
        // ✅ ถ้าไม่มี req.file และ product_image_url undefined จะไม่ update image URL (preserve existing)
        
        updateData.updated_at = new Date();

        const product = await Product.findByIdAndUpdate(id, updateData, { new: true });
        if (!product) {
            return res.status(404).json({ 
                success: false,
                message: "ไม่พบสินค้า" 
            });
        }

        res.status(200).json({ 
            success: true,
            message: "แก้ไขสินค้าสำเร็จ",
            data: product
        });
    } catch (error) {
        console.error("Error updating product:", error);
        res.status(500).json({ 
            success: false,
            message: "ไม่สามารถแก้ไขสินค้าได้",
            error: error.message
        });
    }
});

// ลบสินค้า (Admin)
app.delete('/api/admin/products/:id', async (req, res) => {
    try {
        const { id } = req.params;
        console.log('=== DELETE /api/admin/products/:id ===');
        console.log('Product ID:', id);
        const product = await Product.findByIdAndDelete(id);
        
        if (!product) {
            return res.status(404).json({
                success: false,
                message: "ไม่พบสินค้าที่ต้องการลบ"
            });
        }

        res.json({ 
            success: true,
            message: "ลบสินค้าสำเร็จ" 
        });
    } catch (error) {
        console.error("Error deleting product:", error);
        res.status(500).json({
            success: false,
            message: "เกิดข้อผิดพลาดในการลบสินค้า",
            error: error.message
        });
    }
});

// ================================
// PURCHASE HISTORY ROUTES
// ================================

// บันทึกประวัติการซื้อ (หลายรายการ)
app.post('/api/save-purchase-history', async (req, res) => {
    try {
        const { userId, cart } = req.body;

        if (!cart || cart.length === 0) {
            return res.status(400).json({ success: false, message: 'ตะกร้าว่างเปล่า' });
        }

        let totalPrice = 0;
        const purchaseRecords = [];

        cart.forEach(item => {
            totalPrice += item.price * item.quantity;
            purchaseRecords.push({
                user_id: userId,
                product_name: item.name,
                product_price: item.price,
                quantity: item.quantity,
                total_price: item.price * item.quantity
            });
        });

        await PurchaseHistory.insertMany(purchaseRecords);
        res.status(200).json({ success: true, message: 'บันทึกประวัติการซื้อสำเร็จ', totalPrice });
    } catch (error) {
        console.error('Error saving purchase history:', error);
        res.status(500).json({ success: false, message: 'เกิดข้อผิดพลาดในการบันทึกประวัติการซื้อ' });
    }
});

// บันทึกประวัติการซื้อ (รายการเดียว)
app.post('/api/purchase', async (req, res) => {
    try {
        const { user_id, items, total_price, status } = req.body;

        // Support both old format (single item) and new format (items array)
        let orderItems = [];
        let orderTotal = total_price || 0;

        // New format: items array
        if (items && Array.isArray(items) && items.length > 0) {
            orderItems = items;
            // Calculate total if not provided
            if (!orderTotal) {
                orderTotal = items.reduce((sum, item) => sum + (item.product_price * item.quantity), 0);
            }
        } 
        // Old format: single item (for backward compatibility)
        else {
            const { product_id, product_name, product_price, quantity } = req.body;
            if (!product_name || !product_price || !quantity) {
                return res.status(400).json({ error: 'Missing required fields' });
            }
            orderItems = [{
                product_id: product_id || null,
                product_name,
                product_price,
                quantity
            }];
            orderTotal = product_price * quantity;
        }

        // Validation
        if (orderItems.length === 0 || orderTotal <= 0) {
            return res.status(400).json({ error: 'Invalid order data' });
        }

        const newPurchase = new PurchaseHistory({
            user_id,
            items: orderItems,
            // Store first item info for backward compatibility
            product_id: orderItems[0].product_id || null,
            product_name: orderItems[0].product_name,
            product_price: orderItems[0].product_price,
            quantity: orderItems.length, // Store number of items
            total_price: orderTotal,
            status: status || 'pending'
        });

        await newPurchase.save();
        res.json({ success: true, message: 'บันทึกประวัติการซื้อสำเร็จ', data: newPurchase });
    } catch (error) {
        console.error('Error saving purchase:', error);
        res.status(500).json({ error: 'ไม่สามารถบันทึกประวัติการซื้อได้' });
    }
});

// ดึงประวัติการซื้อ
app.get('/api/purchase-history/:userId', async (req, res) => {
    try {
        const userId = req.params.userId;

        const history = await PurchaseHistory.find({ user_id: userId }).sort({ purchase_date: -1 });
        res.json({ success: true, history });
    } catch (error) {
        console.error('Error fetching purchase history:', error);
        res.status(500).json({ error: 'ไม่สามารถดึงประวัติการซื้อได้' });
    }
});

// ลูกค้าขอยกเลิก order
app.put('/api/purchase-history/:orderId/cancel-request', async (req, res) => {
    try {
        const { orderId } = req.params;

        if (!orderId.match(/^[0-9a-fA-F]{24}$/)) {
            return res.status(400).json({ success: false, error: 'Invalid order ID' });
        }

        const order = await PurchaseHistory.findById(orderId);
        if (!order) {
            return res.status(404).json({ success: false, error: 'Order not found' });
        }

        // อนุญาตให้ยกเลิกได้เฉพาะสถานะ pending หรือ processing
        if (!['pending', 'processing'].includes(order.status)) {
            return res.status(400).json({ success: false, error: 'ไม่สามารถยกเลิกออเดอร์ที่จัดส่งแล้วได้' });
        }

        order.status = 'cancel_requested';
        order.updated_at = new Date();
        await order.save();

        res.json({ success: true, message: 'ส่งคำขอยกเลิกสำเร็จ รอ Admin ตรวจสอบ' });
    } catch (error) {
        console.error('Error requesting cancel:', error);
        res.status(500).json({ success: false, error: 'เกิดข้อผิดพลาด' });
    }
});

// ================================
// CUSTOMER INFO ROUTES
// ================================

// บันทึกข้อมูลลูกค้า
app.post('/submit', async (req, res) => {
    try {
        const { name, email, phone, address, city, postal } = req.body;

        if (!name || !email || !phone || !address || !city || !postal) {
            return res.status(400).json({ success: false, message: 'กรุณากรอกข้อมูลให้ครบถ้วน' });
        }

        // ตรวจสอบว่า email มีในระบบหรือไม่
        const existingEmail = await UserInfo.findOne({ email });
        if (existingEmail) {
            return res.json({ success: false, message: 'อีเมลนี้มีอยู่ในระบบแล้ว' });
        }

        const newUserInfo = new UserInfo({
            name,
            email,
            phone,
            address,
            city,
            postal
        });

        await newUserInfo.save();
        res.json({ success: true, message: 'ข้อมูลถูกบันทึกเรียบร้อยแล้ว' });
    } catch (error) {
        console.error('Error saving customer info:', error);
        res.status(500).json({ success: false, message: 'เกิดข้อผิดพลาดในการบันทึกข้อมูล' });
    }
});

// บันทึกข้อมูลลูกค้ากับ user ID
app.post('/save-customer-info', async (req, res) => {
    try {
        const { userId, name, email, phone, address, city, postal } = req.body;

        const newUserInfo = new UserInfo({
            user_id: userId,
            name,
            email,
            phone,
            address,
            city,
            postal
        });

        await newUserInfo.save();
        res.json({ message: 'ข้อมูลลูกค้าถูกบันทึกเรียบร้อยแล้ว' });
    } catch (error) {
        console.error('Error saving customer info:', error);
        res.status(500).json({ message: 'เกิดข้อผิดพลาดในการบันทึกข้อมูล' });
    }
});

// ดึงข้อมูลลูกค้าทั้งหมด
app.get('/api/customers', async (req, res) => {
    try {
        const customers = await UserInfo.find();
        res.json(customers);
    } catch (error) {
        console.error('Error fetching customers:', error);
        res.status(500).json({ error: 'ไม่สามารถดึงข้อมูลได้' });
    }
});

// ดึงข้อมูลลูกค้าทั้งหมด (route อื่น)
app.get('/get-customers', async (req, res) => {
    try {
        const customers = await UserInfo.find({}, 'name email phone address city postal');
        res.json(customers);
    } catch (error) {
        console.error('Error fetching customers:', error);
        res.status(500).json({ message: 'ไม่สามารถดึงข้อมูลได้' });
    }
});

// ดึงข้อมูลลูกค้าตาม userId
app.get('/get-customer-info', async (req, res) => {
    try {
        const userId = req.query.userId;

        const customerInfo = await UserInfo.findOne({ user_id: userId });
        
        if (customerInfo) {
            res.json(customerInfo);
        } else {
            res.json({ message: 'ไม่มีข้อมูลลูกค้า' });
        }
    } catch (error) {
        console.error('Error fetching customer info:', error);
        res.status(500).json({ message: 'ไม่สามารถดึงข้อมูลได้' });
    }
});

// ตรวจสอบอีเมล
app.post('/check-email', async (req, res) => {
    try {
        const { email } = req.body;
        const customer = await UserInfo.findOne({ email });
        res.json({ exists: customer ? true : false });
    } catch (error) {
        console.error('Database error:', error);
        res.status(500).json({ success: false, message: 'เกิดข้อผิดพลาดในการเชื่อมต่อกับฐานข้อมูล' });
    }
});

// ================================
// ADMIN ROUTES
// ================================

// Admin Authentication
app.use('/api/admin', adminRoutes);

// Admin API Routes (Protected)
app.use('/api/admin/products', productRoutes);
app.use('/api/admin/orders', orderRoutes);
app.use('/api/admin/customers', customerRoutes);

// ================================
// PAGE ROUTES
// ================================

app.get('/customer-info', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'customer-info.html'));
});

app.get('/display-customer-info.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'display-customer-info.html'));
});

// ================================
// ERROR HANDLING & SERVER START
// ================================

// 404 handler — ลอง serve static file ก่อน (Vercel fix)
app.use((req, res) => {
    // ลอง serve จาก public folder
    const filePath = path.join(__dirname, 'public', req.path);
    if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
        return res.sendFile(filePath);
    }
    // ลอง serve index.html ถ้า path เป็น directory
    const indexPath = path.join(filePath, 'index.html');
    if (fs.existsSync(indexPath)) {
        return res.sendFile(indexPath);
    }
    res.status(404).json({ error: 'Not found' });
});

// Error handler
app.use((err, req, res, next) => {
    console.error('Error:', err);
    res.status(500).json({ error: 'Internal server error' });
});

// Start server
app.listen(port, () => {
    console.log(`🚀 เซิร์ฟเวอร์กำลังทำงานที่ http://localhost:${port}`);
});

module.exports = app;
