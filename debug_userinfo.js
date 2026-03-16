const mongoose = require('mongoose');
const PurchaseHistory = require('./models/PurchaseHistory');
const UserInfo = require('./models/UserInfo');

mongoose.connect('mongodb+srv://chinakit1111_db_user:z6UTHxj90NhRLFYI@online-shop.wc55vgg.mongodb.net/easyshop')
.then(async () => {
    // ดู order ล่าสุด
    const order = await PurchaseHistory.findOne().sort({ created_at: -1 });
    console.log('Order user_id:', order.user_id, '| type:', typeof order.user_id);

    // ดู UserInfo ทั้งหมด
    const allUserInfo = await UserInfo.find();
    console.log('\nAll UserInfo:');
    allUserInfo.forEach(u => {
        console.log('  user_id:', u.user_id, '| type:', typeof u.user_id, '| name:', u.name);
    });

    // ลองหาด้วย string ตรงๆ
    const info1 = await UserInfo.findOne({ user_id: order.user_id });
    console.log('\nFind by string:', info1 ? info1.name : 'NOT FOUND');

    // ลองหาด้วย ObjectId
    if (mongoose.Types.ObjectId.isValid(order.user_id)) {
        const info2 = await UserInfo.findOne({ user_id: new mongoose.Types.ObjectId(order.user_id) });
        console.log('Find by ObjectId:', info2 ? info2.name : 'NOT FOUND');
    }

    mongoose.disconnect();
}).catch(e => console.error(e));
