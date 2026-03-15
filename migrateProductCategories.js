const mongoose = require('mongoose');
const Product = require('./models/Product');

async function migrateProducts() {
    try {
        await mongoose.connect('mongodb://localhost:27017/easyshop');
        console.log('✅ Connected to MongoDB\n');

        // หา products ทั้งหมดที่ยังไม่มี category_ids
        const productsWithoutCategoryIds = await Product.find({
            $or: [
                { category_ids: { $exists: false } },
                { category_ids: { $size: 0 } }
            ]
        });

        console.log(`📦 Found ${productsWithoutCategoryIds.length} products to migrate\n`);

        // อัปเดต category_ids สำหรับแต่ละ product
        for (const product of productsWithoutCategoryIds) {
            const categoryIds = [1]; // ซูเปอร์มาร์เก็ต (category 1)
            if (product.category_id !== 1) {
                categoryIds.push(product.category_id);
            }

            await Product.findByIdAndUpdate(
                product._id,
                { category_ids: categoryIds },
                { new: true }
            );

            console.log(`✅ Updated: ${product.product_name} - Categories: [${categoryIds.join(', ')}]`);
        }

        console.log(`\n✅ Migration completed! ${productsWithoutCategoryIds.length} products updated`);
        process.exit(0);
    } catch (error) {
        console.error('❌ Migration error:', error.message);
        process.exit(1);
    }
}

migrateProducts();
