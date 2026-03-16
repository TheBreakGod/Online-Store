// สคริปต์แก้ไข UserInfo ที่ไม่มี user_id โดยจับคู่ผ่าน email กับ User
const mongoose = require('mongoose');
const UserInfo = require('./models/UserInfo');
const User = require('./models/User');

const MONGO_URI = 'mongodb+srv://chinakit1111_db_user:z6UTHxj90NhRLFYI@online-shop.wc55vgg.mongodb.net/easyshop';

async function fix() {
    await mongoose.connect(MONGO_URI);
    console.log('Connected to MongoDB');

    // หา UserInfo ที่ไม่มี user_id
    const infosWithoutUserId = await UserInfo.find({ user_id: { $exists: false } });
    const infosWithNull = await UserInfo.find({ user_id: null });
    const allBroken = [...infosWithoutUserId, ...infosWithNull];

    console.log(`พบ UserInfo ที่ไม่มี user_id: ${allBroken.length} รายการ`);

    let fixed = 0;
    for (const info of allBroken) {
        if (info.email) {
            const user = await User.findOne({ email: info.email.toLowerCase() });
            if (user) {
                info.user_id = user._id;
                await info.save();
                console.log(`✅ แก้ไข: ${info.name} (${info.email}) → user_id: ${user._id}`);
                fixed++;
            } else {
                console.log(`❌ ไม่พบ User สำหรับ: ${info.name} (${info.email})`);
            }
        }
    }

    console.log(`\nแก้ไขแล้ว ${fixed}/${allBroken.length} รายการ`);
    await mongoose.disconnect();
}

fix().catch(console.error);
