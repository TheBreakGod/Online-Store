const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
    product_name: {
        type: String,
        required: [true, 'Product name is required'],
        trim: true
    },
    price: {
        type: Number,
        required: [true, 'Price is required'],
        min: 0
    },
    category_id: {
        type: Number,
        required: [true, 'Category ID is required']
    },
    // array of category IDs that this product belongs to (for supermarket consolidation)
    category_ids: {
        type: [Number],
        default: [1] // default to supermarket category
    },
    product_image_url: {
        type: String,
        default: null
    },
    isActive: {
        type: Boolean,
        default: true
    },
    deletedAt: {
        type: Date,
        default: null
    },
    created_at: {
        type: Date,
        default: Date.now
    },
    updated_at: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('Product', productSchema);
