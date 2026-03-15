const cloudinary = require('cloudinary').v2;
const path = require('path');
const mongoose = require('mongoose');
const Product = require('./models/Product');

cloudinary.config({
    cloud_name: 'dmd7udtgm',
    api_key: '925632611297211',
    api_secret: 'bN5tBKZ2iv0ll04QVUq0CGnPIL8'
});

const ATLAS_URI = 'mongodb+srv://chinakit1111_db_user:z6UTHxj90NhRLFYI@online-shop.wc55vgg.mongodb.net/easyshop?retryWrites=true&w=majority';

async function migrate() {
    await mongoose.connect(ATLAS_URI);
    console.log('Connected to Atlas');

    const products = await Product.find({ product_image_url: /^\/uploads\// });
    console.log('Products to migrate:', products.length);

    for (const p of products) {
        const localPath = path.join(__dirname, 'uploads', path.basename(p.product_image_url));
        
        // ถ้าไฟล์ local ไม่มี ให้อัปโหลดรูป placeholder
        let uploadPath = localPath;
        const fs = require('fs');
        if (!fs.existsSync(localPath)) {
            console.log('File not found locally:', localPath);
            // ใช้รูปแรกที่มีใน uploads แทน
            const files = fs.readdirSync(path.join(__dirname, 'uploads')).filter(f => f.endsWith('.jpg') || f.endsWith('.png'));
            if (files.length > 0) {
                uploadPath = path.join(__dirname, 'uploads', files[0]);
                console.log('Using fallback image:', uploadPath);
            } else {
                console.log('No local images found, skipping');
                continue;
            }
        }
        
        console.log('Uploading:', uploadPath);
        try {
            const result = await cloudinary.uploader.upload(uploadPath, { folder: 'easyshop' });
            console.log('Uploaded:', result.secure_url);
            p.product_image_url = result.secure_url;
            await p.save();
            console.log('Updated:', p.product_name, '->', result.secure_url);
        } catch (e) {
            console.error('Error uploading', p.product_name, ':', e.message);
        }
    }

    await mongoose.disconnect();
    console.log('Done!');
}

migrate().catch(e => console.error(e));
