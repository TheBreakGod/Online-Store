const mongoose = require('mongoose');
const Product = require('./models/Product');

mongoose.connect('mongodb+srv://chinakit1111_db_user:z6UTHxj90NhRLFYI@online-shop.wc55vgg.mongodb.net/easyshop')
.then(async () => {
    const products = await Product.find({ category_ids: { $in: [1] } });
    console.log('Products showing in category 1:', products.length);
    products.forEach(p => console.log('-', p.product_name, '| cat_id:', p.category_id, '| cat_ids:', JSON.stringify(p.category_ids)));
    
    console.log('\n--- Products with wrong category_ids (more than 1 entry) ---');
    const all = await Product.find({});
    let wrongCount = 0;
    all.forEach(p => {
        if (p.category_ids && p.category_ids.length > 1) {
            wrongCount++;
            console.log('-', p.product_name, '| cat_id:', p.category_id, '| cat_ids:', JSON.stringify(p.category_ids));
        }
    });
    console.log('Total with wrong category_ids:', wrongCount);
    
    mongoose.disconnect();
}).catch(e => console.error(e));
