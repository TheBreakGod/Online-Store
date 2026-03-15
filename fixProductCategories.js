const mongoose = require('mongoose');
const Product = require('./models/Product');

async function fixProductCategories() {
    try {
        await mongoose.connect('mongodb://localhost:27017/easyshop');
        console.log('✅ Connected to MongoDB\n');

        // แก้ไขสินค้าที่มี category_id ไม่ตรงกับ category_ids
        const productsToFix = [
            { 
                productName: 'ฟหก',
                expectedCategoryIds: [1, 4]  // category_id: 4 (สุขภาพ)
            },
            { 
                productName: 'HEE YAI',
                expectedCategoryIds: [1, 3]  // category_id: 3 (แม่และเด็ก)
            },
            { 
                productName: 'gre2s',
                expectedCategoryIds: [1, 7]  // category_id: 7 (ความงาม)
            }
        ];

        for (const item of productsToFix) {
            const product = await Product.findOne({ product_name: item.productName });
            
            if (product) {
                const oldCategoryIds = product.category_ids;
                
                await Product.findByIdAndUpdate(
                    product._id,
                    { category_ids: item.expectedCategoryIds },
                    { new: true }
                );

                console.log(`✅ Updated: "${item.productName}"`);
                console.log(`   Old category_ids: [${oldCategoryIds.join(', ')}]`);
                console.log(`   New category_ids: [${item.expectedCategoryIds.join(', ')}]\n`);
            } else {
                console.log(`❌ Product not found: ${item.productName}`);
            }
        }

        console.log('✅ All products fixed!');
        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error.message);
        process.exit(1);
    }
}

fixProductCategories();
