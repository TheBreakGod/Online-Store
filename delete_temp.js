const mongoose = require('mongoose');
const Product = require('./models/Product');

mongoose.connect('mongodb+srv://chinakit1111_db_user:z6UTHxj90NhRLFYI@online-shop.wc55vgg.mongodb.net/easyshop')
.then(async () => {
    const result = await Product.deleteMany({
        product_name: { $in: ['ข้าวหอมมะลิ 5 กก.', 'น้ำมันพืช 1 ลิตร', 'บะหมี่กึ่งสำเร็จรูป แพ็ค 10'] }
    });
    console.log('Deleted:', result.deletedCount, 'products');
    mongoose.disconnect();
}).catch(e => console.error(e));
