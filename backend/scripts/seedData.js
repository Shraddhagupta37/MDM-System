const mongoose = require('mongoose');
// require('dotenv').config();
const path = require('path');

require('dotenv').config({
  path: path.resolve(__dirname, '../.env')
});
console.log("Using URI:", process.env.MONGODB_URI);

// Import models
const Device = require('../models/Device');
const AppVersion = require('../models/AppVersion');
const UpdateSchedule = require('../models/UpdateSchedule');
const UpdateJob = require('../models/UpdateJob');
const User = require('../models/User');
const AuditLog = require('../models/AuditLog');

// Generate random IMEI
const generateIMEI = () => {
  return Array(15).fill(0).map(() => Math.floor(Math.random() * 10)).join('');
};

// Generate random date within last 90 days
const randomDate = (daysAgo = 90) => {
  const date = new Date();
  date.setDate(date.getDate() - Math.floor(Math.random() * daysAgo));
  return date;
};

// Cities and regions data
const locations = [
  { city: 'Bangalore', region: 'India', lat: 12.9716, lng: 77.5946 },
  { city: 'Mumbai', region: 'India', lat: 19.0760, lng: 72.8777 },
  { city: 'Delhi', region: 'India', lat: 28.6139, lng: 77.2090 },
  { city: 'Chennai', region: 'India', lat: 13.0827, lng: 80.2707 },
  { city: 'Hyderabad', region: 'India', lat: 17.3850, lng: 78.4867 },
  { city: 'Pune', region: 'India', lat: 18.5204, lng: 73.8567 },
  { city: 'New York', region: 'USA', lat: 40.7128, lng: -74.0060 },
  { city: 'San Francisco', region: 'USA', lat: 37.7749, lng: -122.4194 },
  { city: 'London', region: 'UK', lat: 51.5074, lng: -0.1278 },
  { city: 'Singapore', region: 'Singapore', lat: 1.3521, lng: 103.8198 },
];

// Device models
const deviceModels = [
  { model: 'Samsung Galaxy S23', os: 'Android 13' },
  { model: 'Samsung Galaxy S22', os: 'Android 12' },
  { model: 'iPhone 14 Pro', os: 'iOS 16' },
  { model: 'iPhone 13', os: 'iOS 15' },
  { model: 'Google Pixel 7', os: 'Android 13' },
  { model: 'OnePlus 11', os: 'Android 13' },
  { model: 'Xiaomi 13 Pro', os: 'Android 12' },
  { model: 'Nothing Phone 2', os: 'Android 13' },
];

// Network types
const networkTypes = ['5G', '4G LTE', 'WiFi', '5G', '4G LTE'];

// App versions
const appVersions = [
  { code: 40, name: '4.0.0', releaseDate: '2024-01-15' },
  { code: 41, name: '4.1.0', releaseDate: '2024-02-01' },
  { code: 42, name: '4.2.0', releaseDate: '2024-02-15' },
  { code: 43, name: '4.3.0', releaseDate: '2024-03-01' },
];

async function seedDatabase() {
  try {
    // await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/mdm_system');
    await mongoose.connect(process.env.MONGODB_URI, {
      dbName: "mdm_system"
    });
    
    console.log('✅ Connected to MongoDB');

    console.log("Connected DB:", mongoose.connection.name);
    console.log("Host:", mongoose.connection.host);

    // Clear existing data
    console.log('Clearing existing data...');
    await Device.deleteMany({});
    await AppVersion.deleteMany({});
    await UpdateSchedule.deleteMany({});
    await UpdateJob.deleteMany({});
    await AuditLog.deleteMany({});
    console.log('✅ Existing data cleared');

    // Create admin user
    console.log('Creating admin user...');
    const adminExists = await User.findOne({ email: 'admin@moveinsync.com' });
    if (!adminExists) {
    const bcrypt = require('bcryptjs');
    const hashedPassword = await bcrypt.hash('Admin@123456', 10);
    
    const admin = new User({
        name: 'System Administrator',
        email: 'admin@moveinsync.com',
        password: hashedPassword,
        role: 'admin',
        isActive: true,
        permissions: ['*'],
        createdAt: new Date(),
    });
    
    await admin.save();
    console.log('✅ Admin user created');
    } else {
    console.log('✅ Admin user already exists');
    }

    // Create app versions
    console.log('Creating app versions...');
    const createdVersions = [];
    for (const v of appVersions) {
      const version = new AppVersion({
        versionCode: v.code,
        versionName: v.name,
        releaseDate: new Date(v.releaseDate),
        supportedOSRange: { min: 'Android 11', max: 'Android 14' },
        isMandatory: v.code === 43,
        isActive: true,
        releaseNotes: `Version ${v.name} includes bug fixes and performance improvements.`,
        downloadUrl: `https://cdn.moveinsync.com/app-v${v.name}.apk`,
        fileSize: 45 + Math.floor(Math.random() * 20),
        createdAt: randomDate(60),
      });
      await version.save();
      createdVersions.push(version);
    }
    console.log(`✅ Created ${createdVersions.length} app versions`);

    // Create devices
    console.log('Creating devices...');
    const devices = [];
    const statuses = ['active', 'active', 'active', 'inactive', 'blocked'];
    
    for (let i = 0; i < 200; i++) {
      const location = locations[Math.floor(Math.random() * locations.length)];
      const deviceModel = deviceModels[Math.floor(Math.random() * deviceModels.length)];
      const versionIndex = Math.floor(Math.random() * createdVersions.length);
      const version = createdVersions[versionIndex];
      const status = statuses[Math.floor(Math.random() * statuses.length)];
      const lastOpen = randomDate(status === 'active' ? 7 : 45);
      
      const device = new Device({
        imei: generateIMEI(),
        appVersion: version.versionName,
        appVersionCode: version.versionCode,
        deviceOS: deviceModel.os,
        deviceModel: deviceModel.model,
        lastOpenTime: lastOpen,
        location: {
          region: location.region,
          city: location.city,
          lastKnownLatitude: location.lat + (Math.random() - 0.5) * 0.1,
          lastKnownLongitude: location.lng + (Math.random() - 0.5) * 0.1,
        },
        clientCustomization: Math.random() > 0.7 ? 'enterprise' : 'default',
        status: status,
        metadata: {
          batteryLevel: Math.floor(Math.random() * 100),
          storageAvailable: 64 + Math.floor(Math.random() * 128),
          networkType: networkTypes[Math.floor(Math.random() * networkTypes.length)],
        },
        createdAt: randomDate(180),
        updatedAt: lastOpen,
      });
      
      await device.save();
      devices.push(device);
    }
    console.log(`✅ Created ${devices.length} devices`);

    // Create update schedules
    console.log('Creating update schedules...');
    const schedules = [];
    const scheduleNames = [
      'Bangalore Q1 Rollout',
      'Mumbai 4.2 Update',
      'Enterprise Security Patch',
      'North America Phased Release',
      'Europe Mandatory Update',
      'Asia Pacific Staged Rollout',
      'Critical Security Fix',
      'Performance Optimization Release',
    ];

    for (let i = 0; i < 8; i++) {
      const fromVersion = createdVersions[Math.floor(Math.random() * (createdVersions.length - 1))];
      const toVersion = createdVersions[createdVersions.length - 1];
      const statuses = ['completed', 'in_progress', 'approved', 'pending_approval', 'cancelled'];
      const status = statuses[Math.floor(Math.random() * statuses.length)];
      
      const targetRegions = [];
      const numRegions = Math.floor(Math.random() * 3) + 1;
      for (let j = 0; j < numRegions; j++) {
        const region = locations[Math.floor(Math.random() * locations.length)].region;
        if (!targetRegions.includes(region)) targetRegions.push(region);
      }

      const schedule = new UpdateSchedule({
        name: scheduleNames[i % scheduleNames.length],
        description: `Scheduled update from v${fromVersion.versionName} to v${toVersion.versionName}`,
        fromVersionCode: fromVersion.versionCode,
        toVersionCode: toVersion.versionCode,
        targetCriteria: {
          regions: targetRegions,
          cities: [],
          percentage: Math.floor(Math.random() * 30) + 70,
        },
        scheduleType: ['immediate', 'scheduled', 'phased'][Math.floor(Math.random() * 3)],
        scheduledTime: randomDate(30),
        phasedConfig: {
          batchSize: 50,
          batchInterval: 60,
          currentBatch: Math.floor(Math.random() * 5),
          totalBatches: 10,
        },
        status: status,
        stats: {
          totalDevices: 0,
          completedDevices: 0,
          failedDevices: 0,
          inProgressDevices: 0,
        },
        createdBy: {
          userId: 'system',
          userName: 'System Admin',
        },
        createdAt: randomDate(60),
      });

      await schedule.save();
      schedules.push(schedule);
    }
    console.log(`✅ Created ${schedules.length} update schedules`);

    // Create update jobs for each schedule
    console.log('Creating update jobs...');
    const jobStates = [
      'scheduled', 'notified', 'download_started', 'download_completed',
      'installation_started', 'installation_completed', 'failed'
    ];
    
    let jobCount = 0;
    for (const schedule of schedules) {
      let targetDevices = devices;
      if (schedule.targetCriteria.regions.length > 0) {
        targetDevices = devices.filter(d => 
          schedule.targetCriteria.regions.includes(d.location.region)
        );
      }
      
      targetDevices = targetDevices.slice(0, 30);
      
      for (const device of targetDevices) {
        const stateIndex = Math.floor(Math.random() * jobStates.length);
        const state = jobStates[stateIndex];
        const progress = state.includes('completed') ? 100 : 
                        state.includes('started') ? Math.floor(Math.random() * 50) + 30 :
                        state === 'failed' ? Math.floor(Math.random() * 80) : 0;
        
        const timeline = [];
        const startDate = randomDate(15);
        timeline.push({
          state: 'scheduled',
          timestamp: startDate,
        });

        if (state !== 'scheduled') {
          timeline.push({
            state: 'notified',
            timestamp: new Date(startDate.getTime() + 5 * 60000),
          });
        }

        if (state.includes('download')) {
          timeline.push({
            state: 'download_started',
            timestamp: new Date(startDate.getTime() + 10 * 60000),
            metadata: { progress: 0 },
          });
        }

        if (state === 'download_completed' || state.includes('installation')) {
          timeline.push({
            state: 'download_completed',
            timestamp: new Date(startDate.getTime() + 15 * 60000),
            metadata: { progress: 100 },
          });
        }

        if (state.includes('installation')) {
          timeline.push({
            state: 'installation_started',
            timestamp: new Date(startDate.getTime() + 20 * 60000),
            metadata: { progress: 0 },
          });
        }

        if (state === 'installation_completed') {
          timeline.push({
            state: 'installation_completed',
            timestamp: new Date(startDate.getTime() + 30 * 60000),
            metadata: { progress: 100 },
          });
        }

        if (state === 'failed') {
          timeline.push({
            state: 'failed',
            timestamp: new Date(startDate.getTime() + 25 * 60000),
            metadata: { 
              stage: 'download',
              reason: 'Network timeout',
              progress: progress,
            },
          });
        }

        const job = new UpdateJob({
          deviceImei: device.imei,
          scheduleId: schedule._id,
          fromVersionCode: schedule.fromVersionCode,
          toVersionCode: schedule.toVersionCode,
          currentState: state,
          progress: {
            downloadProgress: state.includes('download') ? progress : state === 'installation_completed' ? 100 : 0,
            installationProgress: state.includes('installation') ? progress : state === 'installation_completed' ? 100 : 0,
          },
          retryCount: state === 'failed' ? Math.floor(Math.random() * 2) + 1 : 0,
          maxRetries: 3,
          timeline: timeline,
          createdAt: startDate,
          updatedAt: new Date(),
        });

        await job.save();
        jobCount++;
      }
    }
    console.log(`✅ Created ${jobCount} update jobs`);

    // Create audit logs
    console.log('Creating audit logs...');
    const actions = [
      'DEVICE_REGISTERED', 'DEVICE_UPDATED', 'DEVICE_BLOCKED',
      'VERSION_CREATED', 'VERSION_UPDATED',
      'SCHEDULE_CREATED', 'SCHEDULE_APPROVED', 'SCHEDULE_STARTED', 'SCHEDULE_COMPLETED', 'SCHEDULE_CANCELLED',
      'UPDATE_STARTED', 'UPDATE_COMPLETED', 'UPDATE_FAILED',
      'USER_LOGIN',
    ];

    // Valid entity types from your model
    const validEntityTypes = ['device', 'version', 'schedule', 'job', 'user', 'system'];

    for (let i = 0; i < 500; i++) {
      const action = actions[Math.floor(Math.random() * actions.length)];
      
      // Map action to valid entity type
      let entityType;
      if (action.includes('DEVICE')) entityType = 'device';
      else if (action.includes('VERSION')) entityType = 'version';
      else if (action.includes('SCHEDULE')) entityType = 'schedule';
      else if (action.includes('UPDATE')) entityType = 'job';
      else if (action.includes('USER')) entityType = 'user';
      else entityType = 'system';
      
      const device = devices[Math.floor(Math.random() * devices.length)];
      const schedule = schedules[Math.floor(Math.random() * schedules.length)];
      const version = createdVersions[Math.floor(Math.random() * createdVersions.length)];
      
      let entityId, entityName;
      switch (entityType) {
        case 'device':
          entityId = device.imei;
          entityName = device.deviceModel;
          break;
        case 'schedule':
          entityId = schedule._id.toString();
          entityName = schedule.name;
          break;
        case 'version':
          entityId = version._id.toString();
          entityName = version.versionName;
          break;
        case 'job':
          entityId = `job_${Math.floor(Math.random() * 1000)}`;
          entityName = `Update Job`;
          break;
        case 'user':
          entityId = 'system';
          entityName = 'System Admin';
          break;
        default:
          entityId = 'system';
          entityName = 'System';
      }

      const log = new AuditLog({
        action,
        entityType,
        entityId: entityId || 'unknown',
        entityName: entityName || 'Unknown',
        userId: 'system',
        userName: 'System Admin',
        userRole: 'admin',
        changes: { timestamp: new Date() },
        metadata: {
          ipAddress: `192.168.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`,
          userAgent: 'Mozilla/5.0',
        },
        status: Math.random() > 0.9 ? 'failure' : 'success',
        errorMessage: Math.random() > 0.9 ? 'Connection timeout' : undefined,
        timestamp: randomDate(30),
      });

      await log.save();
    }
    console.log(`✅ Created audit logs`);

    console.log('\n🎉 Database seeding completed successfully!');
    console.log('📊 Summary:');
    console.log(`   - ${devices.length} devices`);
    console.log(`   - ${createdVersions.length} app versions`);
    console.log(`   - ${schedules.length} update schedules`);
    console.log(`   - ${jobCount} update jobs`);
    console.log('   - 500+ audit logs');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  }
}

seedDatabase();