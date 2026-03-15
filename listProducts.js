const mongoose = require('mongoose');
const Product = require('./models/Product');

async function listAllProducts() {
    try {
        await mongoose.connect('mongodb://localhost:27017/easyshop');
        console.log('Connected to MongoDB\n');

        const products = await Product.find().limit(20);

        console.log(`Total products in database: ${products.length}\n`);

        products.forEach((product, index) => {
            console.log(`${index + 1}. ${product.product_name}`);
            console.log(`   ID: ${product._id}`);
            console.log(`   Price: ฿${product.price}`);
            console.log(`   Category: ${product.category_id}`);
            console.log(`   Active: ${product.isActive}`);
            console.log();
        });

        process.exit(0);
    } catch (error) {
        console.error('Error:', error.message);
        process.exit(1);
    }
}

listAllProducts();
