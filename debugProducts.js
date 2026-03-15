const mongoose = require('mongoose');
const Product = require('./models/Product');

async function debugProducts() {
    try {
        await mongoose.connect('mongodb://localhost:27017/easyshop');
        console.log('✅ Connected to MongoDB\n');

        const products = await Product.find({ isActive: true });
        
        console.log('All Products in Database:');
        console.log('='.repeat(80));
        products.forEach(product => {
            console.log(`
Product Name: ${product.product_name}
  _id: ${product._id}
  category_id: ${product.category_id}
  category_ids: [${product.category_ids.join(', ')}]
  isActive: ${product.isActive}
  image: ${product.product_image_url}
`);
        });

        console.log('\n' + '='.repeat(80));
        console.log('Testing MongoDB Query: category_ids contains 3\n');
        
        const test3 = await Product.find({ category_ids: { $in: [3] }, isActive: true });
        console.log(`Query: Product.find({ category_ids: { $in: [3] } })`);
        console.log(`Result: ${test3.length} products found`);
        test3.forEach(p => console.log(`  • ${p.product_name}`));

        console.log('\n' + '='.repeat(80));
        console.log('Testing MongoDB Query: category_ids contains 4\n');
        
        const test4 = await Product.find({ category_ids: { $in: [4] }, isActive: true });
        console.log(`Query: Product.find({ category_ids: { $in: [4] } })`);
        console.log(`Result: ${test4.length} products found`);
        test4.forEach(p => console.log(`  • ${p.product_name}`));

        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error.message);
        process.exit(1);
    }
}

debugProducts();
