const mongoose = require('mongoose');
const Product = require('./models/Product');

async function deleteProduct() {
    try {
        await mongoose.connect('mongodb://localhost:27017/easyshop');
        console.log('Connected to MongoDB');

        // Find the product named "Heee"
        const product = await Product.findOne({ product_name: 'Heee' });

        if (product) {
            console.log('Found product:');
            console.log('  ID:', product._id);
            console.log('  Name:', product.product_name);
            console.log('  Price:', product.price);
            console.log('  Category:', product.category_id);

            // Delete it
            const result = await Product.deleteOne({ _id: product._id });
            console.log('✅ Product deleted successfully!');
            console.log('   Deleted count:', result.deletedCount);
        } else {
            console.log('❌ Product "Heee" not found');
        }

        process.exit(0);
    } catch (error) {
        console.error('Error:', error.message);
        process.exit(1);
    }
}

deleteProduct();
