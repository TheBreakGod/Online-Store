const path = require('path');
const fs = require('fs');
const mongoose = require('mongoose');
const Product = require('./models/Product');

const ATLAS_URI = 'mongodb+srv://chinakit1111_db_user:z6UTHxj90NhRLFYI@online-shop.wc55vgg.mongodb.net/easyshop?retryWrites=true&w=majority';

async function migrate() {
    await mongoose.connect(ATLAS_URI);
    console.log('Connected to Atlas');

    // หาสินค้าที่ยังใช้ /uploads/ (ไม่ใช่ base64)
    const products = await Product.find({ 
        product_image_url: { $not: /^data:/ }
    });
    console.log('Products to migrate:', products.length);

    for (const p of products) {
        if (!p.product_image_url) {
            console.log('Skipping', p.product_name, '- no image');
            continue;
        }
        
        // หาไฟล์ local
        const filename = path.basename(p.product_image_url);
        const localPath = path.join(__dirname, 'uploads', filename);
        
        let uploadPath = localPath;
        if (!fs.existsSync(localPath)) {
            console.log('File not found:', localPath);
            // ใช้รูปแรกที่มีใน uploads แทน
            const files = fs.readdirSync(path.join(__dirname, 'uploads')).filter(f => /\.(jpg|jpeg|png|gif|webp)$/i.test(f));
            if (files.length > 0) {
                uploadPath = path.join(__dirname, 'uploads', files[0]);
                console.log('Using fallback:', files[0]);
            } else {
                console.log('No images found, skipping');
                continue;
            }
        }

        // แปลงเป็น base64
        const buffer = fs.readFileSync(uploadPath);
        const ext = path.extname(uploadPath).toLowerCase().replace('.', '');
        const mimeMap = { jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png', gif: 'image/gif', webp: 'image/webp' };
        const mime = mimeMap[ext] || 'image/jpeg';
        const base64 = `data:${mime};base64,${buffer.toString('base64')}`;
        
        p.product_image_url = base64;
        await p.save();
        console.log('Updated:', p.product_name, '-> base64 (' + Math.round(buffer.length / 1024) + 'KB)');
    }

    await mongoose.disconnect();
    console.log('Done!');
}

migrate().catch(e => console.error(e));
