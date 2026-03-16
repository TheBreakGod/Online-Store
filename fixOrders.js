// สคริปต์แก้ไขออเดอร์เก่า - เพิ่ม customer_info จาก UserInfo
const mongoose = require('mongoose');
const PurchaseHistory = require('./models/PurchaseHistory');
const UserInfo = require('./models/UserInfo');
const User = require('./models/User');

const MONGO_URI = 'mongodb+srv://chinakit1111_db_user:z6UTHxj90NhRLFYI@online-shop.wc55vgg.mongodb.net/easyshop';

async function fix() {
    await mongoose.connect(MONGO_URI);
    console.log('Connected to MongoDB');

    // หาออเดอร์ที่ไม่มี customer_info
    const orders = await PurchaseHistory.find({ 'customer_info.name': { $exists: false } });
    console.log(`พบออเดอร์ที่ไม่มี customer_info: ${orders.length} รายการ`);

    // ดึง UserInfo ทั้งหมด
    const allUserInfo = await UserInfo.find();
    console.log(`UserInfo ทั้งหมด: ${allUserInfo.length} รายการ`);

    let fixed = 0;
    for (const order of orders) {
        let info = null;

        // ลองหาจาก user_id
        if (order.user_id && order.user_id !== 'guest') {
            if (mongoose.Types.ObjectId.isValid(order.user_id)) {
                info = allUserInfo.find(u => u.user_id && u.user_id.toString() === order.user_id);
                if (!info) {
                    const user = await User.findById(order.user_id);
                    if (user) {
                        info = allUserInfo.find(u => u.email === user.email);
                    }
                }
            }
        }

        // ถ้ายังไม่เจอ และมี UserInfo แค่ 1 ให้ใช้อันนั้น (กรณีร้านเล็ก)
        if (!info && allUserInfo.length === 1) {
            info = allUserInfo[0];
        }

        if (info) {
            order.customer_info = {
                name: info.name,
                email: info.email,
                phone: info.phone,
                address: info.address,
                city: info.city,
                postal: info.postal
            };
            await order.save();
            console.log(`✅ ${order._id.toString().slice(-6)} → ${info.name}`);
            fixed++;
        } else {
            console.log(`❌ ${order._id.toString().slice(-6)} → ไม่พบข้อมูลลูกค้า`);
        }
    }

    console.log(`\nแก้ไขแล้ว ${fixed}/${orders.length} รายการ`);
    await mongoose.disconnect();
}

fix().catch(console.error);
