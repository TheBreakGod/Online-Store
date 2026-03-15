const path = require('path');
const fs = require('fs');
const mongoose = require('mongoose');
const sharp = require('sharp');
const Product = require('./models/Product');

const ATLAS_URI = 'mongodb+srv://chinakit1111_db_user:z6UTHxj90NhRLFYI@online-shop.wc55vgg.mongodb.net/easyshop?retryWrites=true&w=majority';

async function migrate() {
    await mongoose.connect(ATLAS_URI);
    console.log('Connected to Atlas');

    // หาสินค้าที่มี base64 ขนาดใหญ่ (> 100KB)
    const products = await Product.find();
    console.log('Total products:', products.length);

    for (const p of products) {
        if (!p.product_image_url) continue;
        
        const imgSize = p.product_image_url.length;
        console.log(p.product_name, '| current size:', Math.round(imgSize/1024), 'KB');
        
        if (imgSize > 100 * 1024) { // > 100KB
            try {
                // แยก base64 data
                const matches = p.product_image_url.match(/^data:([^;]+);base64,(.+)$/);
                if (!matches) {
                    console.log('  Not base64, skipping');
                    continue;
                }
                const buffer = Buffer.from(matches[2], 'base64');
                
                // บีบด้วย sharp
                const compressed = await sharp(buffer)
                    .resize(400, 400, { fit: 'inside', withoutEnlargement: true })
                    .jpeg({ quality: 70 })
                    .toBuffer();
                
                p.product_image_url = `data:image/jpeg;base64,${compressed.toString('base64')}`;
                await p.save();
                console.log('  Compressed:', Math.round(imgSize/1024), 'KB ->', Math.round(p.product_image_url.length/1024), 'KB');
            } catch (e) {
                console.error('  Error:', e.message);
            }
        } else {
            console.log('  Already small, skipping');
        }
    }

    await mongoose.disconnect();
    console.log('Done!');
}

migrate().catch(e => console.error(e));
