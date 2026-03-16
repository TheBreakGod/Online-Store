const mongoose = require('mongoose');

const purchaseHistorySchema = new mongoose.Schema({
    user_id: {
        type: String,
        default: 'guest'
    },
    // สำหรับ backward compatibility (old format - single item)
    product_id: {
        type: String,
        default: null
    },
    product_name: {
        type: String,
        default: null
    },
    product_price: {
        type: Number,
        default: null
    },
    quantity: {
        type: Number,
        default: null
    },
    // New format: items array (multiple items per order)
    items: [{
        product_id: String,
        product_name: String,
        product_price: Number,
        quantity: {
            type: Number,
            min: 1
        }
    }],
    total_price: {
        type: Number,
        required: [true, 'Total price is required']
    },
    status: {
        type: String,
        enum: ['pending', 'processing', 'shipped', 'delivered', 'cancelled', 'cancel_requested'],
        default: 'pending'
    },
    customer_info: {
        name: String,
        email: String,
        phone: String,
        address: String,
        city: String,
        postal: String
    },
    shipping_address: {
        type: String,
        default: null
    },
    created_at: {
        type: Date,
        default: Date.now
    },
    updated_at: {
        type: Date,
        default: Date.now
    },
    purchase_date: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('PurchaseHistory', purchaseHistorySchema);
