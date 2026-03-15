const mongoose = require('mongoose');
const Product = require('./models/Product');

const ATLAS_URI = 'mongodb+srv://chinakit1111_db_user:z6UTHxj90NhRLFYI@online-shop.wc55vgg.mongodb.net/easyshop?retryWrites=true&w=majority';

const sampleProducts = [
    // 1. ซูเปอร์มาร์เก็ต
    { product_name: 'ข้าวหอมมะลิ 5 กก.', price: 189, category_id: 1 },
    { product_name: 'น้ำมันพืช 1 ลิตร', price: 55, category_id: 1 },
    { product_name: 'บะหมี่กึ่งสำเร็จรูป แพ็ค 10', price: 65, category_id: 1 },

    // 2. หนังสือ นิตยสาร เครื่องเขียน
    { product_name: 'ปากกาลูกลื่น 12 ด้าม', price: 45, category_id: 2 },
    { product_name: 'สมุดโน้ต A5', price: 35, category_id: 2 },
    { product_name: 'หนังสือเรียน Python เบื้องต้น', price: 299, category_id: 2 },

    // 3. แม่และเด็ก
    { product_name: 'ผ้าอ้อมเด็ก แพ็ค 50 ชิ้น', price: 399, category_id: 3 },
    { product_name: 'ขวดนมเด็ก 8 oz', price: 199, category_id: 3 },
    { product_name: 'ของเล่นเสริมพัฒนาการ', price: 259, category_id: 3 },

    // 4. สุขภาพ ออกกำลังกาย
    { product_name: 'ดัมเบล 5 กก. (คู่)', price: 590, category_id: 4 },
    { product_name: 'เสื่อโยคะ', price: 350, category_id: 4 },
    { product_name: 'วิตามินซี 1000mg 60 เม็ด', price: 290, category_id: 4 },

    // 5. เครื่องใช้ไฟฟ้า
    { product_name: 'หม้อทอดไร้น้ำมัน 4.5L', price: 1990, category_id: 5 },
    { product_name: 'พัดลมตั้งโต๊ะ 12 นิ้ว', price: 590, category_id: 5 },
    { product_name: 'เครื่องปั่นน้ำผลไม้', price: 890, category_id: 5 },

    // 6. บ้านและสวน
    { product_name: 'กระถางต้นไม้ เซรามิก', price: 199, category_id: 6 },
    { product_name: 'ชุดเครื่องมือช่าง 20 ชิ้น', price: 459, category_id: 6 },
    { product_name: 'ไฟ LED ตกแต่ง 10 เมตร', price: 179, category_id: 6 },

    // 7. ความงาม
    { product_name: 'ครีมกันแดด SPF50+', price: 350, category_id: 7 },
    { product_name: 'เซรั่มวิตามินซี 30ml', price: 490, category_id: 7 },
    { product_name: 'ลิปสติก เนื้อแมท', price: 259, category_id: 7 },

    // 8. แฟชั่น
    { product_name: 'เสื้อยืดคอกลม Cotton 100%', price: 199, category_id: 8 },
    { product_name: 'กางเกงยีนส์ Slim Fit', price: 690, category_id: 8 },
    { product_name: 'รองเท้าผ้าใบ', price: 890, category_id: 8 },

    // 9. มือถือ แกดเจ็ต
    { product_name: 'หูฟังบลูทูธ TWS', price: 599, category_id: 9 },
    { product_name: 'สายชาร์จ USB-C 1 เมตร', price: 129, category_id: 9 },
    { product_name: 'เคสมือถือ iPhone กันกระแทก', price: 299, category_id: 9 },

    // 10. สัตว์เลี้ยง
    { product_name: 'อาหารแมว 3 กก.', price: 359, category_id: 10 },
    { product_name: 'อาหารสุนัข 3 กก.', price: 329, category_id: 10 },
    { product_name: 'ของเล่นสัตว์เลี้ยง เซ็ต 5 ชิ้น', price: 199, category_id: 10 },
];

async function addProducts() {
    await mongoose.connect(ATLAS_URI);
    console.log('Connected to Atlas');

    for (const item of sampleProducts) {
        const product = new Product({
            product_name: item.product_name,
            price: item.price,
            category_id: item.category_id,
            category_ids: [item.category_id],
            product_image_url: null,
            isActive: true
        });
        await product.save();
        console.log('✅ Added:', item.product_name, '(cat:', item.category_id + ')');
    }

    console.log('\nDone! Total added:', sampleProducts.length);
    await mongoose.disconnect();
}

addProducts().catch(e => console.error(e));
