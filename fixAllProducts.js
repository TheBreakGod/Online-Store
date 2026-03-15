const mongoose = require('mongoose');
const Product = require('./models/Product');

async function fixAllProducts() {
    try {
        await mongoose.connect('mongodb://localhost:27017/easyshop');
        console.log('✅ Connected to MongoDB\n');

        const products = await Product.find({ isActive: true });
        
        console.log('Fixing all products...\n');

        for (const product of products) {
            // สร้าง category_ids โดยป้อน [1] (ซูเปอร์มาร์เก็ต) + category_id ของ์ผลิตภัณฑ์
            const categoryIds = [1]; // ซูเปอร์มาร์เก็ต
            if (product.category_id !== 1 && !categoryIds.includes(product.category_id)) {
                categoryIds.push(product.category_id);
            }

            const oldCategoryIds = product.category_ids || [];
            
            await Product.findByIdAndUpdate(
                product._id,
                { category_ids: categoryIds },
                { new: true }
            );

            console.log(`✅ "${product.product_name}" (ID: ${product.category_id})`);
            console.log(`   Before: [${oldCategoryIds.join(', ')}]`);
            console.log(`   After:  [${categoryIds.join(', ')}]\n`);
        }

        console.log('✅ All products fixed!');
        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error.message);
        process.exit(1);
    }
}

fixAllProducts();
