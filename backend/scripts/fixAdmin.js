const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const User = require('../models/User');

async function fixAdmin() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/mdm_system');
    console.log('✅ Connected to MongoDB');

    // Generate a fresh hash
    const password = 'Admin@123456';
    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(password, salt);
    
    console.log('New hash generated:', hash);
    
    // Test the hash immediately
    const testMatch = await bcrypt.compare(password, hash);
    console.log('Self-test - password matches:', testMatch);
    
    // Update or create admin
    const result = await User.findOneAndUpdate(
      { email: 'admin@moveinsync.com' },
      {
        name: 'System Administrator',
        email: 'admin@moveinsync.com',
        password: hash,
        role: 'admin',
        isActive: true,
        permissions: ['*'],
        updatedAt: new Date()
      },
      { upsert: true, new: true }
    );
    
    console.log('✅ Admin user fixed/created');
    console.log('Email: admin@moveinsync.com');
    console.log('Password: Admin@123456');
    console.log('Stored hash:', result.password.substring(0, 30) + '...');
    
    // Verify the stored password works
    const verifyMatch = await bcrypt.compare(password, result.password);
    console.log('Verification - password matches stored hash:', verifyMatch);
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Failed:', error);
    process.exit(1);
  }
}

fixAdmin();