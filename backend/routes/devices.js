const express = require('express');
const router = express.Router();
const Device = require('../models/Device');
const AppVersion = require('../models/AppVersion');
const UpdateSchedule = require('../models/UpdateSchedule');
const UpdateJob = require('../models/UpdateJob');
const auth = require('../middleware/auth');
const AuditLog = require('../models/AuditLog');

// Get all devices with filters
router.get('/', auth, async (req, res) => {
  try {
    const { 
      region, 
      version, 
      status, 
      search, 
      osVersions,
      batteryLevel,
      lastSeenDays,
      page = 1, 
      limit = 20 
    } = req.query;
    
    const query = {};
    
    // Status filter - handle 'all' case properly
    if (status && status !== 'all' && status !== 'undefined' && status !== 'null' && status !== '') {
      query.status = status;
    }
    
    // Region filter
    if (region && region !== 'all' && region !== '') {
      query['location.region'] = region;
    }
    
    // Version filter
    if (version && version !== 'all' && version !== '') {
      query.appVersion = version;
    }
    
    // OS Versions filter
    if (osVersions && osVersions !== '') {
      const osList = osVersions.split(',').filter(os => os.trim() !== '');
      if (osList.length > 0) {
        // Use regex for partial matching
        query.deviceOS = { 
          $in: osList.map(os => new RegExp(os, 'i'))
        };
      }
    }
    
    // Battery level filter
    if (batteryLevel && batteryLevel !== 'all' && batteryLevel !== '') {
      switch(batteryLevel) {
        case 'critical':
          query['metadata.batteryLevel'] = { $lt: 15 };
          break;
        case 'low':
          query['metadata.batteryLevel'] = { $gte: 15, $lte: 30 };
          break;
        case 'good':
          query['metadata.batteryLevel'] = { $gte: 30, $lte: 60 };
          break;
        case 'excellent':
          query['metadata.batteryLevel'] = { $gt: 60 };
          break;
      }
    }
    
    // Last seen filter
    if (lastSeenDays && lastSeenDays !== 'all' && lastSeenDays !== '') {
      const daysAgo = new Date();
      daysAgo.setDate(daysAgo.getDate() - parseInt(lastSeenDays));
      query.lastOpenTime = { $gte: daysAgo };
    }
    
    // Search filter - improved to handle multiple fields
    if (search && search !== '') {
      const searchRegex = new RegExp(search, 'i');
      query.$or = [
        { imei: searchRegex },
        { deviceModel: searchRegex },
        { deviceOS: searchRegex },
        { 'location.city': searchRegex },
        { 'location.region': searchRegex },
        { appVersion: searchRegex }
      ];
    }

    console.log('Device query:', JSON.stringify(query, null, 2)); // Debug log

    // Get total count for pagination
    const total = await Device.countDocuments(query);

    // Get paginated devices
    const devices = await Device.find(query)
      .sort({ lastOpenTime: -1 })
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit));

    // Get statistics
    const totalActive = await Device.countDocuments({ status: 'active' });
    const totalInactive = await Device.countDocuments({ status: 'inactive' });
    const totalBlocked = await Device.countDocuments({ status: 'blocked' });
    
    // Version distribution
    const versionDistribution = await Device.aggregate([
      { $group: { _id: '$appVersion', count: { $sum: 1 } } },
      { $sort: { _id: -1 } }
    ]);

    // Region distribution
    const regionWise = await Device.aggregate([
      { $match: { 'location.region': { $ne: null } } },
      { $group: { _id: '$location.region', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);

    // Inactive devices (30+ days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const inactiveDevices = await Device.countDocuments({
      lastOpenTime: { $lt: thirtyDaysAgo }
    });

    // Latest version
    const latestVersionDoc = await AppVersion.findOne().sort({ versionCode: -1 });
    const latestVersion = latestVersionDoc?.versionCode || 0;

    const stats = {
      totalActive,
      totalInactive,
      totalBlocked,
      versionDistribution,
      regionWise,
      inactiveDevices,
      latestVersion
    };

    res.json({
      success: true,
      devices,
      stats,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Get devices error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Device heartbeat (public endpoint)
router.post('/heartbeat', async (req, res) => {
  try {
    const { imei, appVersion, appVersionCode, deviceOS, deviceModel, location, batteryLevel, networkType } = req.body;

    if (!imei || !appVersion || !appVersionCode || !deviceOS) {
      return res.status(400).json({ 
        success: false, 
        error: 'Missing required fields: imei, appVersion, appVersionCode, deviceOS' 
      });
    }

    let device = await Device.findOne({ imei });

    if (device) {
      device.appVersion = appVersion;
      device.appVersionCode = appVersionCode;
      device.deviceOS = deviceOS;
      device.deviceModel = deviceModel || device.deviceModel;
      device.lastOpenTime = new Date();
      device.location = location || device.location;
      device.metadata = { 
        batteryLevel: batteryLevel || device.metadata?.batteryLevel,
        networkType: networkType || device.metadata?.networkType 
      };
      device.status = 'active';
    } else {
      device = new Device({
        imei,
        appVersion,
        appVersionCode,
        deviceOS,
        deviceModel,
        location,
        metadata: { batteryLevel, networkType }
      });
    }

    await device.save();

    const latestVersion = await AppVersion.findOne().sort({ versionCode: -1 });
    
    let updateInfo = { available: false };
    if (latestVersion && latestVersion.versionCode > device.appVersionCode) {
      updateInfo = {
        available: true,
        versionCode: latestVersion.versionCode,
        versionName: latestVersion.versionName,
        mandatory: latestVersion.isMandatory,
        downloadUrl: latestVersion.downloadUrl,
        releaseNotes: latestVersion.releaseNotes,
        fileSize: latestVersion.fileSize
      };
    }

    res.json({
      success: true,
      device: {
        imei: device.imei,
        status: device.status,
        lastSync: device.lastOpenTime
      },
      updateInfo
    });
  } catch (error) {
    console.error('Heartbeat error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get device details
router.get('/:imei', auth, async (req, res) => {
  try {
    const device = await Device.findOne({ imei: req.params.imei });
    if (!device) {
      return res.status(404).json({ success: false, error: 'Device not found' });
    }
    
    const UpdateJob = require('../models/UpdateJob');
    const updateHistory = await UpdateJob.find({ deviceImei: device.imei })
      .sort({ createdAt: -1 })
      .limit(10);
    
    res.json({ 
      success: true, 
      device,
      updateHistory 
    });
  } catch (error) {
    console.error('Get device details error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Block device
router.post('/:imei/block', auth, async (req, res) => {
  try {
    const device = await Device.findOneAndUpdate(
      { imei: req.params.imei },
      { status: 'blocked' },
      { new: true }
    );
    
    if (!device) {
      return res.status(404).json({ success: false, error: 'Device not found' });
    }

    await AuditLog.create({
      action: 'DEVICE_BLOCKED',
      entityType: 'device',
      entityId: device.imei,
      userId: req.user.id,
      userName: req.user.name,
      changes: { status: 'blocked' }
    });
    
    res.json({ success: true, device });
  } catch (error) {
    console.error('Block device error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Bulk update devices
router.post('/bulk-update', auth, async (req, res) => {
  try {
    const { deviceIds, targetVersionCode } = req.body;
    
    if (!deviceIds || !deviceIds.length || !targetVersionCode) {
      return res.status(400).json({ 
        success: false, 
        error: 'Device IDs and target version are required' 
      });
    }

    const targetVersion = await AppVersion.findOne({ versionCode: targetVersionCode });
    if (!targetVersion) {
      return res.status(404).json({ 
        success: false, 
        error: 'Target version not found' 
      });
    }

    const devices_list = await Device.find({ 
      imei: { $in: deviceIds },
      status: { $ne: 'blocked' }
    });

    if (devices_list.length === 0) {
      return res.status(400).json({ 
        success: false, 
        error: 'No valid devices found for update' 
      });
    }

    const schedule = new UpdateSchedule({
      name: `Bulk Update - ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}`,
      description: `Bulk update of ${devices_list.length} devices to version ${targetVersion.versionName}`,
      fromVersionCode: 0,
      toVersionCode: targetVersionCode,
      targetCriteria: {
        deviceIds: deviceIds,
        percentage: 100
      },
      scheduleType: 'immediate',
      status: 'approved',
      createdBy: {
        userId: req.user.id,
        userName: req.user.name
      },
      stats: {
        totalDevices: devices_list.length,
        completedDevices: 0,
        failedDevices: 0,
        inProgressDevices: devices_list.length
      }
    });

    await schedule.save();

    const jobs = [];
    for (const device of devices_list) {
      const existingJob = await UpdateJob.findOne({
        deviceImei: device.imei,
        currentState: { $in: ['scheduled', 'notified', 'download_started', 'installation_started'] }
      });

      if (existingJob) {
        console.log(`Device ${device.imei} already has a pending job`);
        continue;
      }

      const job = new UpdateJob({
        deviceImei: device.imei,
        scheduleId: schedule._id,
        fromVersionCode: device.appVersionCode,
        toVersionCode: targetVersionCode,
        currentState: 'scheduled',
        progress: {
          downloadProgress: 0,
          installationProgress: 0
        },
        timeline: [{
          state: 'scheduled',
          timestamp: new Date(),
          metadata: { source: 'bulk_update' }
        }]
      });
      
      await job.save();
      jobs.push(job);
    }

    schedule.stats.totalDevices = jobs.length;
    schedule.stats.inProgressDevices = jobs.length;
    await schedule.save();

    await AuditLog.create({
      action: 'BULK_UPDATE_SCHEDULED',
      entityType: 'schedule',
      entityId: schedule._id,
      userId: req.user.id,
      userName: req.user.name,
      changes: { 
        deviceCount: jobs.length, 
        targetVersion: targetVersionCode 
      }
    });

    res.json({
      success: true,
      message: `Scheduled updates for ${jobs.length} devices`,
      scheduleId: schedule._id,
      jobCount: jobs.length,
      skippedCount: devices_list.length - jobs.length
    });
  } catch (error) {
    console.error('Bulk update error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;