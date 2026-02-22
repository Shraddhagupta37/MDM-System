const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

// Import models
const Device = require('../models/Device');
const AppVersion = require('../models/AppVersion');
const UpdateSchedule = require('../models/UpdateSchedule');
const UpdateJob = require('../models/UpdateJob');
const User = require('../models/User');
const AuditLog = require('../models/AuditLog');

// Helper function to generate random IMEI
const generateIMEI = () => {
  return Array(15).fill(0).map(() => Math.floor(Math.random() * 10)).join('');
};

// Helper function to generate dates within range
const randomDate = (start, end) => {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
};

// Cities and regions with realistic distribution
const locations = [
  // India - Major Tech Hubs
  { city: 'Bangalore', region: 'India', count: 150, lat: 12.9716, lng: 77.5946 },
  { city: 'Mumbai', region: 'India', count: 120, lat: 19.0760, lng: 72.8777 },
  { city: 'Delhi NCR', region: 'India', count: 100, lat: 28.6139, lng: 77.2090 },
  { city: 'Hyderabad', region: 'India', count: 80, lat: 17.3850, lng: 78.4867 },
  { city: 'Chennai', region: 'India', count: 70, lat: 13.0827, lng: 80.2707 },
  { city: 'Pune', region: 'India', count: 60, lat: 18.5204, lng: 73.8567 },
  { city: 'Kolkata', region: 'India', count: 40, lat: 22.5726, lng: 88.3639 },
  
  // USA
  { city: 'New York', region: 'USA', count: 90, lat: 40.7128, lng: -74.0060 },
  { city: 'San Francisco', region: 'USA', count: 70, lat: 37.7749, lng: -122.4194 },
  { city: 'Chicago', region: 'USA', count: 50, lat: 41.8781, lng: -87.6298 },
  { city: 'Austin', region: 'USA', count: 45, lat: 30.2672, lng: -97.7431 },
  
  // UK/Europe
  { city: 'London', region: 'UK', count: 85, lat: 51.5074, lng: -0.1278 },
  { city: 'Manchester', region: 'UK', count: 40, lat: 53.4808, lng: -2.2426 },
  { city: 'Berlin', region: 'Germany', count: 55, lat: 52.5200, lng: 13.4050 },
  { city: 'Paris', region: 'France', count: 50, lat: 48.8566, lng: 2.3522 },
  
  // Asia Pacific
  { city: 'Singapore', region: 'Singapore', count: 65, lat: 1.3521, lng: 103.8198 },
  { city: 'Sydney', region: 'Australia', count: 45, lat: -33.8688, lng: 151.2093 },
  { city: 'Tokyo', region: 'Japan', count: 60, lat: 35.6762, lng: 139.6503 },
  { city: 'Seoul', region: 'South Korea', count: 55, lat: 37.5665, lng: 126.9780 },
];

// Device models with realistic distribution
const deviceModels = [
  // Samsung
  { model: 'Samsung Galaxy S24 Ultra', os: 'Android 14', brand: 'Samsung', weight: 0.15 },
  { model: 'Samsung Galaxy S23 Ultra', os: 'Android 13', brand: 'Samsung', weight: 0.12 },
  { model: 'Samsung Galaxy S23', os: 'Android 13', brand: 'Samsung', weight: 0.10 },
  { model: 'Samsung Galaxy Z Fold5', os: 'Android 13', brand: 'Samsung', weight: 0.05 },
  
  // iPhone
  { model: 'iPhone 15 Pro Max', os: 'iOS 17', brand: 'Apple', weight: 0.14 },
  { model: 'iPhone 15 Pro', os: 'iOS 17', brand: 'Apple', weight: 0.12 },
  { model: 'iPhone 14 Pro', os: 'iOS 16', brand: 'Apple', weight: 0.10 },
  { model: 'iPhone 14', os: 'iOS 16', brand: 'Apple', weight: 0.08 },
  { model: 'iPhone 13', os: 'iOS 15', brand: 'Apple', weight: 0.06 },
  
  // Google Pixel
  { model: 'Google Pixel 8 Pro', os: 'Android 14', brand: 'Google', weight: 0.08 },
  { model: 'Google Pixel 8', os: 'Android 14', brand: 'Google', weight: 0.07 },
  { model: 'Google Pixel 7', os: 'Android 13', brand: 'Google', weight: 0.06 },
  
  // OnePlus
  { model: 'OnePlus 12', os: 'Android 14', brand: 'OnePlus', weight: 0.07 },
  { model: 'OnePlus 11', os: 'Android 13', brand: 'OnePlus', weight: 0.06 },
  
  // Xiaomi
  { model: 'Xiaomi 14 Pro', os: 'Android 14', brand: 'Xiaomi', weight: 0.06 },
  { model: 'Xiaomi 13 Pro', os: 'Android 13', brand: 'Xiaomi', weight: 0.05 },
  
  // Nothing
  { model: 'Nothing Phone 2', os: 'Android 13', brand: 'Nothing', weight: 0.03 },
  { model: 'Nothing Phone 1', os: 'Android 12', brand: 'Nothing', weight: 0.02 },
];

// Network types
const networkTypes = ['5G', '5G', '5G', '4G LTE', '4G LTE', 'WiFi', 'WiFi'];

// App versions with realistic release dates
const appVersions = [
  { 
    code: 40, 
    name: '4.0.0', 
    releaseDate: '2024-01-15', 
    mandatory: false,
    notes: 'Initial release with core features',
    osMin: 'Android 11',
    osMax: 'Android 14',
    size: 42.5
  },
  { 
    code: 41, 
    name: '4.1.0', 
    releaseDate: '2024-02-01', 
    mandatory: false,
    notes: 'Performance improvements and bug fixes',
    osMin: 'Android 11',
    osMax: 'Android 14',
    size: 43.2
  },
  { 
    code: 42, 
    name: '4.2.0', 
    releaseDate: '2024-02-15', 
    mandatory: false,
    notes: 'New features: Dark mode, offline sync',
    osMin: 'Android 11',
    osMax: 'Android 14',
    size: 45.8
  },
  { 
    code: 43, 
    name: '4.3.0', 
    releaseDate: '2024-03-01', 
    mandatory: true,
    notes: 'Security patch: Critical vulnerability fix',
    osMin: 'Android 11',
    osMax: 'Android 14',
    size: 46.3
  },
];

// Schedule templates for realistic demo
const scheduleTemplates = [
  {
    name: 'Bangalore Q1 2024 Rollout',
    description: 'Phased rollout of v4.3.0 to Bangalore devices',
    fromVersion: 42,
    toVersion: 43,
    type: 'phased',
    status: 'in_progress',
    regions: ['India'],
    cities: ['Bangalore'],
    percentage: 75,
    batchSize: 50,
    batchInterval: 120,
    createdAt: new Date('2024-03-01'),
  },
  {
    name: 'Mumbai 4.2 Update',
    description: 'Complete rollout of v4.2.0 to Mumbai region',
    fromVersion: 41,
    toVersion: 42,
    type: 'immediate',
    status: 'completed',
    regions: ['India'],
    cities: ['Mumbai'],
    percentage: 100,
    createdAt: new Date('2024-02-15'),
  },
  {
    name: 'North America Security Patch',
    description: 'Critical security update for US devices',
    fromVersion: 42,
    toVersion: 43,
    type: 'phased',
    status: 'pending_approval',
    regions: ['USA'],
    cities: [],
    percentage: 50,
    batchSize: 100,
    batchInterval: 60,
    createdAt: new Date('2024-03-10'),
  },
  {
    name: 'Europe Mandatory Update',
    description: 'Mandatory security update for European devices',
    fromVersion: 41,
    toVersion: 43,
    type: 'scheduled',
    status: 'approved',
    regions: ['UK', 'Germany', 'France'],
    cities: [],
    percentage: 100,
    scheduledTime: new Date('2024-03-20T02:00:00Z'),
    createdAt: new Date('2024-03-12'),
  },
  {
    name: 'Asia Pacific Staged Rollout',
    description: 'Gradual rollout across Asia Pacific region',
    fromVersion: 42,
    toVersion: 43,
    type: 'phased',
    status: 'in_progress',
    regions: ['Singapore', 'Japan', 'South Korea', 'Australia'],
    cities: [],
    percentage: 40,
    batchSize: 75,
    batchInterval: 180,
    createdAt: new Date('2024-03-05'),
  },
  {
    name: 'Hyderabad Pilot Program',
    description: 'Pilot rollout for testing',
    fromVersion: 42,
    toVersion: 43,
    type: 'phased',
    status: 'cancelled',
    regions: ['India'],
    cities: ['Hyderabad'],
    percentage: 10,
    batchSize: 25,
    batchInterval: 60,
    createdAt: new Date('2024-02-20'),
  },
  {
    name: 'Delhi NCR Enterprise Rollout',
    description: 'Enterprise-wide update for Delhi region',
    fromVersion: 40,
    toVersion: 43,
    type: 'phased',
    status: 'pending_approval',
    regions: ['India'],
    cities: ['Delhi NCR'],
    percentage: 100,
    batchSize: 200,
    batchInterval: 240,
    createdAt: new Date('2024-03-14'),
  },
  {
    name: 'Pune Performance Update',
    description: 'Performance optimization rollout',
    fromVersion: 41,
    toVersion: 42,
    type: 'immediate',
    status: 'completed',
    regions: ['India'],
    cities: ['Pune'],
    percentage: 100,
    createdAt: new Date('2024-02-10'),
  },
  {
    name: 'Chennai Bug Fix Rollout',
    description: 'Critical bug fix for Chennai devices',
    fromVersion: 42,
    toVersion: 43,
    type: 'immediate',
    status: 'approved',
    regions: ['India'],
    cities: ['Chennai'],
    percentage: 100,
    createdAt: new Date('2024-03-08'),
  },
  {
    name: 'UK Compliance Update',
    description: 'GDPR compliance update',
    fromVersion: 41,
    toVersion: 43,
    type: 'scheduled',
    status: 'in_progress',
    regions: ['UK'],
    cities: ['London', 'Manchester'],
    percentage: 60,
    scheduledTime: new Date('2024-03-15T01:00:00Z'),
    createdAt: new Date('2024-03-01'),
  },
];

async function seedVideoDemo() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/mdm_system');
    console.log('✅ Connected to MongoDB');

    // Clear existing data
    console.log('\n🧹 Clearing existing data...');
    await Device.deleteMany({});
    await AppVersion.deleteMany({});
    await UpdateSchedule.deleteMany({});
    await UpdateJob.deleteMany({});
    await AuditLog.deleteMany({});
    await User.deleteMany({});
    console.log('✅ Database cleared');

    // Create admin user
    console.log('\n👤 Creating admin user...');
    const hashedPassword = await bcrypt.hash('Admin@123456', 10);
    const admin = new User({
      name: 'Sarah Chen',
      email: 'admin@moveinsync.com',
      password: hashedPassword,
      role: 'admin',
      isActive: true,
      lastLogin: new Date(),
      createdAt: new Date('2024-01-01'),
    });
    await admin.save();
    console.log('✅ Admin user created: sarah.chen@moveinsync.com / Admin@123456');

    // Create manager user
    const managerPassword = await bcrypt.hash('Manager@123456', 10);
    const manager = new User({
      name: 'Mike Johnson',
      email: 'manager@moveinsync.com',
      password: managerPassword,
      role: 'manager',
      isActive: true,
      lastLogin: new Date(),
      createdAt: new Date('2024-01-15'),
    });
    await manager.save();
    console.log('✅ Manager user created: manager@moveinsync.com / Manager@123456');

    // Create app versions
    console.log('\n📱 Creating app versions...');
    const createdVersions = [];
    for (const v of appVersions) {
      const version = new AppVersion({
        versionCode: v.code,
        versionName: v.name,
        releaseDate: new Date(v.releaseDate),
        supportedOSRange: { 
          min: v.osMin, 
          max: v.osMax 
        },
        isMandatory: v.mandatory,
        isActive: true,
        releaseNotes: v.notes,
        downloadUrl: `https://cdn.moveinsync.com/releases/v${v.name}/moveinsync-v${v.name}.apk`,
        fileSize: v.size * 1024 * 1024, // Convert to bytes
        createdAt: new Date(v.releaseDate),
      });
      await version.save();
      createdVersions.push(version);
      console.log(`  - Created v${v.name} (${v.mandatory ? 'mandatory' : 'optional'})`);
    }

    // Create devices
    console.log('\n📱 Creating 1000+ devices with realistic distribution...');
    let deviceCount = 0;
    const createdDevices = [];

    for (const location of locations) {
      for (let i = 0; i < location.count; i++) {
        // Weighted model selection based on brand popularity
        const modelIndex = Math.floor(Math.random() * deviceModels.length);
        const model = deviceModels[modelIndex];
        
        // Version distribution: 40% on latest, 30% on previous, 20% on older, 10% on oldest
        const rand = Math.random();
        let versionIndex;
        if (rand < 0.4) versionIndex = 3; // v4.3.0 (latest)
        else if (rand < 0.7) versionIndex = 2; // v4.2.0
        else if (rand < 0.9) versionIndex = 1; // v4.1.0
        else versionIndex = 0; // v4.0.0
        
        const version = createdVersions[versionIndex];
        
        // Status distribution: 85% active, 10% inactive, 5% blocked
        const statusRand = Math.random();
        let status = 'active';
        if (statusRand > 0.95) status = 'blocked';
        else if (statusRand > 0.85) status = 'inactive';
        
        // Last seen based on status
        const now = new Date();
        let lastOpenTime;
        if (status === 'active') {
          // Active devices seen in last 7 days
          lastOpenTime = new Date(now - Math.random() * 7 * 24 * 60 * 60 * 1000);
        } else if (status === 'inactive') {
          // Inactive devices not seen for 30+ days
          lastOpenTime = new Date(now - (30 + Math.random() * 30) * 24 * 60 * 60 * 1000);
        } else {
          // Blocked devices - could be recent or old
          lastOpenTime = new Date(now - Math.random() * 60 * 24 * 60 * 60 * 1000);
        }
        
        const batteryLevel = Math.floor(Math.random() * 100);
        const networkType = networkTypes[Math.floor(Math.random() * networkTypes.length)];
        
        const device = new Device({
          imei: generateIMEI(),
          appVersion: version.versionName,
          appVersionCode: version.versionCode,
          deviceOS: model.os,
          deviceModel: model.model,
          lastOpenTime: lastOpenTime,
          location: {
            region: location.region,
            city: location.city,
            lastKnownLatitude: location.lat + (Math.random() - 0.5) * 0.1,
            lastKnownLongitude: location.lng + (Math.random() - 0.5) * 0.1,
          },
          clientCustomization: model.brand === 'Enterprise' ? 'enterprise' : 'default',
          status: status,
          metadata: {
            batteryLevel: batteryLevel,
            storageAvailable: 32 + Math.floor(Math.random() * 224), // 32-256 GB
            networkType: networkType,
            updateCount: Math.floor(Math.random() * 10),
          },
          createdAt: new Date(now - Math.random() * 180 * 24 * 60 * 60 * 1000),
          updatedAt: lastOpenTime,
        });
        
        await device.save();
        createdDevices.push(device);
        deviceCount++;
        
        if (deviceCount % 100 === 0) {
          console.log(`  ... ${deviceCount} devices created`);
        }
      }
    }
    console.log(`✅ Created ${deviceCount} devices`);

    // Create schedules and jobs
    console.log('\n📅 Creating update schedules with realistic progress...');
    
    for (const template of scheduleTemplates) {
      const fromVersion = createdVersions.find(v => v.versionCode === template.fromVersion);
      const toVersion = createdVersions.find(v => v.versionCode === template.toVersion);
      
      // Find target devices based on criteria
      let targetDevices = createdDevices.filter(d => {
        if (template.regions && template.regions.length > 0) {
          if (!template.regions.includes(d.location.region)) return false;
        }
        if (template.cities && template.cities.length > 0) {
          if (!template.cities.includes(d.location.city)) return false;
        }
        return d.appVersionCode === template.fromVersion && d.status === 'active';
      });
      
      // Apply percentage filter
      const targetCount = Math.ceil(targetDevices.length * (template.percentage / 100));
      targetDevices = targetDevices.slice(0, targetCount);
      
      if (targetDevices.length === 0) continue;
      
      const schedule = new UpdateSchedule({
        name: template.name,
        description: template.description,
        fromVersionCode: template.fromVersion,
        toVersionCode: template.toVersion,
        targetCriteria: {
          regions: template.regions || [],
          cities: template.cities || [],
          percentage: template.percentage,
        },
        scheduleType: template.type,
        scheduledTime: template.scheduledTime || null,
        phasedConfig: template.batchSize ? {
          batchSize: template.batchSize,
          batchInterval: template.batchInterval,
          currentBatch: template.status === 'in_progress' ? Math.ceil(targetDevices.length / template.batchSize) : 0,
          totalBatches: Math.ceil(targetDevices.length / (template.batchSize || 100)),
        } : undefined,
        status: template.status,
        createdBy: {
          userId: admin._id,
          userName: admin.name,
        },
        createdAt: template.createdAt,
      });
      
      await schedule.save();
      
      // Create jobs based on status
      let completedCount = 0;
      let failedCount = 0;
      let inProgressCount = 0;
      
      for (let i = 0; i < targetDevices.length; i++) {
        const device = targetDevices[i];
        let jobState;
        let downloadProgress = 0;
        let installProgress = 0;
        
        if (template.status === 'completed') {
          jobState = 'installation_completed';
          downloadProgress = 100;
          installProgress = 100;
          completedCount++;
        } 
        else if (template.status === 'in_progress') {
          // Distribute jobs across different states for visual interest
          const rand = Math.random();
          if (i < targetDevices.length * 0.3) { // 30% completed
            jobState = 'installation_completed';
            downloadProgress = 100;
            installProgress = 100;
            completedCount++;
          } else if (i < targetDevices.length * 0.5) { // 20% failed
            jobState = 'failed';
            downloadProgress = Math.floor(Math.random() * 80) + 10;
            installProgress = 0;
            failedCount++;
          } else if (i < targetDevices.length * 0.7) { // 20% downloading
            jobState = 'download_started';
            downloadProgress = Math.floor(Math.random() * 70) + 20;
            installProgress = 0;
            inProgressCount++;
          } else { // 30% installing
            jobState = 'installation_started';
            downloadProgress = 100;
            installProgress = Math.floor(Math.random() * 70) + 20;
            inProgressCount++;
          }
        } 
        else if (template.status === 'approved') {
          jobState = 'scheduled';
          inProgressCount++;
        }
        else {
          jobState = 'scheduled';
        }
        
        const job = new UpdateJob({
          deviceImei: device.imei,
          scheduleId: schedule._id,
          fromVersionCode: template.fromVersion,
          toVersionCode: template.toVersion,
          currentState: jobState,
          progress: {
            downloadProgress,
            installationProgress: installProgress,
          },
          retryCount: jobState === 'failed' ? Math.floor(Math.random() * 3) + 1 : 0,
          maxRetries: 3,
          timeline: [
            {
              state: 'scheduled',
              timestamp: new Date(template.createdAt.getTime() + 1000 * 60 * 5), // 5 min after schedule
            }
          ],
          createdAt: new Date(template.createdAt.getTime() + 1000 * 60 * 5),
        });
        
        if (jobState !== 'scheduled') {
          job.timeline.push({
            state: 'notified',
            timestamp: new Date(template.createdAt.getTime() + 1000 * 60 * 10),
          });
        }
        
        if (jobState === 'download_started' || jobState === 'installation_started' || jobState === 'installation_completed') {
          job.timeline.push({
            state: 'download_started',
            timestamp: new Date(template.createdAt.getTime() + 1000 * 60 * 15),
          });
        }
        
        if (jobState === 'installation_started' || jobState === 'installation_completed') {
          job.timeline.push({
            state: 'download_completed',
            timestamp: new Date(template.createdAt.getTime() + 1000 * 60 * 20),
          });
          job.timeline.push({
            state: 'installation_started',
            timestamp: new Date(template.createdAt.getTime() + 1000 * 60 * 25),
          });
        }
        
        if (jobState === 'installation_completed') {
          job.timeline.push({
            state: 'installation_completed',
            timestamp: new Date(template.createdAt.getTime() + 1000 * 60 * 35),
          });
        }
        
        if (jobState === 'failed') {
          job.timeline.push({
            state: 'failed',
            timestamp: new Date(template.createdAt.getTime() + 1000 * 60 * 20),
            metadata: {
              stage: 'download',
              reason: 'Network timeout',
            },
          });
          job.failureStage = 'download';
          job.failureReason = 'Network timeout';
        }
        
        await job.save();
      }
      
      // Update schedule stats
      schedule.stats = {
        totalDevices: targetDevices.length,
        completedDevices: completedCount,
        failedDevices: failedCount,
        inProgressDevices: inProgressCount,
      };
      await schedule.save();
      
      console.log(`  - Created schedule "${template.name}" with ${targetDevices.length} jobs`);
    }

    // Create audit logs
    console.log('\n📋 Creating audit trail entries with chart-friendly data...');

    const actions = [
    'DEVICE_REGISTERED', 'DEVICE_UPDATED', 'DEVICE_BLOCKED',
    'VERSION_CREATED', 'VERSION_UPDATED',
    'SCHEDULE_CREATED', 'SCHEDULE_APPROVED', 'SCHEDULE_STARTED', 
    'SCHEDULE_COMPLETED', 'SCHEDULE_CANCELLED',
    'UPDATE_STARTED', 'UPDATE_COMPLETED', 'UPDATE_FAILED',
    'USER_LOGIN', 'BULK_UPDATE_SCHEDULED'
    ];

    const users = [admin, manager];

    // Create logs spread across the last 30 days with realistic patterns
    const today = new Date();
    let logCount = 0;

    // For each of the last 30 days, create a varying number of logs
    for (let day = 30; day >= 0; day--) {
    const currentDate = subDays(today, day);
    const dayStart = startOfDay(currentDate);
    const dayEnd = endOfDay(currentDate);
    
    // Vary the number of logs per day to create interesting chart patterns
    // Weekdays have more activity, weekends have less
    const isWeekend = currentDate.getDay() === 0 || currentDate.getDay() === 6;
    let logsPerDay;
    
    if (isWeekend) {
        logsPerDay = Math.floor(Math.random() * 10) + 5; // 5-15 logs on weekends
    } else {
        logsPerDay = Math.floor(Math.random() * 20) + 15; // 15-35 logs on weekdays
    }
    
    // Create a pattern where some days have spikes (release days)
    if (day === 15 || day === 7 || day === 3) {
        logsPerDay = Math.floor(Math.random() * 30) + 40; // 40-70 logs on release days
    }
    
    for (let i = 0; i < logsPerDay; i++) {
        // Distribute logs throughout the day
        const hour = Math.floor(Math.random() * 24);
        const minute = Math.floor(Math.random() * 60);
        const second = Math.floor(Math.random() * 60);
        
        const logDate = new Date(dayStart);
        logDate.setHours(hour, minute, second);
        
        // Select action based on type to create meaningful patterns
        let action;
        const rand = Math.random();
        
        if (rand < 0.4) {
        // Device-related actions
        const deviceActions = ['DEVICE_REGISTERED', 'DEVICE_UPDATED', 'DEVICE_BLOCKED'];
        action = deviceActions[Math.floor(Math.random() * deviceActions.length)];
        } else if (rand < 0.7) {
        // Update-related actions
        const updateActions = ['UPDATE_STARTED', 'UPDATE_COMPLETED', 'UPDATE_FAILED'];
        action = updateActions[Math.floor(Math.random() * updateActions.length)];
        } else if (rand < 0.9) {
        // Schedule-related actions
        const scheduleActions = ['SCHEDULE_CREATED', 'SCHEDULE_APPROVED', 'SCHEDULE_STARTED', 'SCHEDULE_COMPLETED'];
        action = scheduleActions[Math.floor(Math.random() * scheduleActions.length)];
        } else {
        // User actions
        action = 'USER_LOGIN';
        }
        
        const user = users[Math.floor(Math.random() * users.length)];
        const device = createdDevices[Math.floor(Math.random() * createdDevices.length)];
        
        const entityType = action.split('_')[0].toLowerCase();
        
        const log = new AuditLog({
        action,
        entityType: entityType === 'update' ? 'job' : entityType,
        entityId: device?.imei || `schedule_${Math.floor(Math.random() * 1000)}`,
        entityName: device?.deviceModel || 'System',
        userId: user._id,
        userName: user.name,
        userRole: user.role,
        changes: { 
            timestamp: logDate,
            details: `${action} performed`
        },
        metadata: {
            ipAddress: `192.168.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`,
            userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        },
        status: Math.random() > 0.92 ? 'failure' : 'success', // 8% failure rate
        timestamp: logDate,
        });
        
        await log.save();
        logCount++;
    }
    
    if (day % 5 === 0) {
        console.log(`  ... created logs for day ${30 - day + 1}/30`);
    }
    }

    console.log(`✅ Created ${logCount} audit log entries with chart-friendly distribution`);

    // Final summary
    console.log('\n' + '='.repeat(60));
    console.log('🎉 DEMO DATABASE READY FOR VIDEO PRESENTATION!');
    console.log('='.repeat(60));
    console.log('\n📊 DATABASE SUMMARY:');
    console.log(`   👤 Users: 2 (admin, manager)`);
    console.log(`   📱 Devices: ${deviceCount}`);
    console.log(`   📦 App Versions: ${createdVersions.length}`);
    console.log(`   📅 Update Schedules: ${scheduleTemplates.length}`);
    console.log(`   🔄 Update Jobs: ${await UpdateJob.countDocuments()}`);
    console.log(`   📋 Audit Logs: ${await AuditLog.countDocuments()}`);
    
    console.log('\n🔐 LOGIN CREDENTIALS:');
    console.log(`   👑 Admin: admin@moveinsync.com / Admin@123456`);
    console.log(`   👔 Manager: manager@moveinsync.com / Manager@123456`);
    
    console.log('\n📈 KEY METRICS FOR DEMO:');
    console.log(`   • Latest Version: v4.3.0 (mandatory security update)`);
    console.log(`   • In-Progress Rollouts: Bangalore, Asia Pacific, UK`);
    console.log(`   • Pending Approvals: North America, Delhi NCR`);
    console.log(`   • Success Rate: ~95% across all updates`);
    console.log(`   • Version Adoption: 40% on latest, 30% on v4.2.0`);
    
    console.log('\n✨ Your demo database is ready! Run:');
    console.log('   npm run dev (backend)');
    console.log('   npm start (frontend)');
    console.log('   Then login and record your video!\n');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Demo data creation failed:', error);
    process.exit(1);
  }
}

seedVideoDemo();