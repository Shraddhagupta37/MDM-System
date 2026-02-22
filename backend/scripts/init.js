const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const User = require('../models/User');
const AppVersion = require('../models/AppVersion');

async function initialize() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/mdm_system');
    console.log('✅ Connected to MongoDB');

    // Create admin user if not exists
    const adminExists = await User.findOne({ email: 'admin@moveinsync.com' });
    if (!adminExists) {
      const admin = new User({
        name: 'System Administrator',
        email: 'admin@moveinsync.com',
        password: 'Admin@123456',
        role: 'admin'
      });
      await admin.save();
      console.log('✅ Admin user created');
      console.log('   Email: admin@moveinsync.com');
      console.log('   Password: Admin@123456');
    } else {
      console.log('✅ Admin user already exists');
    }

    // Create initial app version if not exists
    const versionExists = await AppVersion.findOne({ versionCode: 1 });
    if (!versionExists) {
      const version = new AppVersion({
        versionCode: 1,
        versionName: '1.0.0',
        releaseDate: new Date(),
        supportedOSRange: { min: 'Android 10', max: 'Android 14' },
        isMandatory: false,
        isActive: true,
        releaseNotes: 'Initial release',
        downloadUrl: 'https://example.com/app-v1.0.0.apk'
      });
      await version.save();
      console.log('✅ Initial app version created');
    }

    console.log('✅ Database initialization complete');
    process.exit(0);
  } catch (error) {
    console.error('❌ Initialization failed:', error);
    process.exit(1);
  }
}

initialize();