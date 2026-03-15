const mongoose = require('mongoose');
const Product = require('./models/Product');

// Data URLs สำหรับรูปภาพ SVG
const dataURLs = {
  dishwash: 'data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%22200%22 height=%22200%22%3E%3Crect fill=%22%23ffd700%22 width=%22200%22 height=%22200%22/%3E%3Ctext x=%22100%22 y=%22100%22 font-size=%2220%22 fill=%22%23333%22 text-anchor=%22middle%22 dy=%22.3em%22%3Eน้ำยาล้างจาน%3C/text%3E%3C/svg%3E',
  book: 'data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%22200%22 height=%22200%22%3E%3Crect fill=%22%238b4513%22 width=%22200%22 height=%22200%22/%3E%3Ctext x=%22100%22 y=%22100%22 font-size=%2220%22 fill=%22%23fff%22 text-anchor=%22middle%22 dy=%22.3em%22%3Eหนังสือ%3C/text%3E%3C/svg%3E',
  diaper: 'data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%22200%22 height=%22200%22%3E%3Crect fill=%22%23ffb6c1%22 width=%22200%22 height=%22200%22/%3E%3Ctext x=%22100%22 y=%22100%22 font-size=%2220%22 fill=%22%23333%22 text-anchor=%22middle%22 dy=%22.3em%22%3Eผ้าอ้อมเด็ก%3C/text%3E%3C/svg%3E'
};

mongoose.connect('mongodb://localhost:27017/easyshop');

// ลบสินค้าเดิมที่มีรูปภาพ /uploads/
Product.deleteMany({product_image_url: {$regex: '/uploads/'}})
  .then(() => {
    console.log('✅ ลบสินค้าเดิมแล้ว');
    
    // เพิ่มสินค้าใหม่
    const products = [
      { product_name: 'น้ำยาล้างจาน', price: 35, category_id: 1, product_image_url: dataURLs.dishwash, isActive: true },
      { product_name: 'หนังสือภาษาไทย', price: 250, category_id: 2, product_image_url: dataURLs.book, isActive: true },
      { product_name: 'ผ้าอ้อมเด็ก', price: 180, category_id: 3, product_image_url: dataURLs.diaper, isActive: true }
    ];
    
    return Product.insertMany(products);
  })
  .then(() => {
    console.log('✅ เพิ่มสินค้าด้วยรูปภาพ Data URLs สำเร็จ');
    mongoose.connection.close();
  })
  .catch(e => {
    console.error('❌ Error:', e.message);
    mongoose.connection.close();
  });
