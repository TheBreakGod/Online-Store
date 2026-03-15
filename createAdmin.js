const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const User = require('./models/User');

async function createAdminUser() {
    try {
        const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/easyshop';

        await mongoose.connect(mongoUri, {
            useNewUrlParser: true,
            useUnifiedTopology: true
        });

        console.log('✅ Connected to MongoDB');

        // Check if admin already exists
        const existingAdmin = await User.findOne({ username: 'admin', role: 'admin' });

        if (existingAdmin) {
            console.log('❌ Admin user already exists!');
            process.exit(0);
        }

        // Hash password
        const hashedPassword = await bcrypt.hash('admin123', 10);

        // Create admin user
        const adminUser = new User({
            username: 'admin',
            name: 'System Administrator',
            email: 'admin@easyshop.com',
            password: hashedPassword,
            role: 'admin'
        });

        await adminUser.save();

        console.log('✅ Admin user created successfully!');
        console.log('Username: admin');
        console.log('Password: admin123');
        console.log('Email: admin@easyshop.com');

        process.exit(0);
    } catch (error) {
        console.error('❌ Error creating admin user:', error);
        process.exit(1);
    }
}

createAdminUser();
