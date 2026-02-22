const UpdateSchedule = require('../models/UpdateSchedule');
const Device = require('../models/Device');
const UpdateJob = require('../models/UpdateJob');
const AuditLog = require('../models/AuditLog');
const { validateUpgradePath } = require('../services/versionService');

// Create update schedule
exports.createSchedule = async (req, res) => {
  try {
    const scheduleData = req.body;
    
    // Validate upgrade path
    const upgradeValidation = await validateUpgradePath(
      scheduleData.fromVersionCode,
      scheduleData.toVersionCode
    );

    if (!upgradeValidation.allowed) {
      return res.status(400).json({
        success: false,
        error: 'Invalid upgrade path',
        suggestedPath: upgradeValidation.suggestedPath
      });
    }

    // Check for downgrade
    if (scheduleData.toVersionCode < scheduleData.fromVersionCode) {
      return res.status(400).json({
        success: false,
        error: 'Downgrade schedules are not allowed'
      });
    }

    const schedule = new UpdateSchedule({
      ...scheduleData,
      createdBy: {
        adminId: req.user.id,
        adminName: req.user.name
      }
    });

    await schedule.save();

    await AuditLog.create({
      action: 'CREATE_SCHEDULE',
      entityType: 'schedule',
      entityId: schedule._id,
      userId: req.user.id,
      userName: req.user.name,
      changes: scheduleData
    });

    res.json({ success: true, schedule });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// Get all schedules
exports.getSchedules = async (req, res) => {
  try {
    const schedules = await UpdateSchedule.find()
      .sort({ createdAt: -1 });
    res.json({ success: true, schedules });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// Approve schedule
exports.approveSchedule = async (req, res) => {
  try {
    const schedule = await UpdateSchedule.findById(req.params.id);
    
    if (!schedule) {
      return res.status(404).json({ success: false, error: 'Schedule not found' });
    }

    schedule.status = 'approved';
    schedule.approvedBy = {
      adminId: req.user.id,
      adminName: req.user.name,
      approvedAt: new Date()
    };

    await schedule.save();

    // Create update jobs for target devices
    await createUpdateJobs(schedule);

    await AuditLog.create({
      action: 'APPROVE_SCHEDULE',
      entityType: 'schedule',
      entityId: schedule._id,
      userId: req.user.id,
      userName: req.user.name
    });

    res.json({ success: true, schedule });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// Execute schedule
exports.executeSchedule = async (req, res) => {
  try {
    const schedule = await UpdateSchedule.findById(req.params.id);
    
    if (!schedule) {
      return res.status(404).json({ success: false, error: 'Schedule not found' });
    }

    if (schedule.status !== 'approved') {
      return res.status(400).json({ success: false, error: 'Schedule must be approved first' });
    }

    schedule.status = 'in_progress';
    await schedule.save();

    // Trigger update process
    await triggerUpdates(schedule);

    res.json({ success: true, message: 'Schedule execution started' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// Helper function to create update jobs
async function createUpdateJobs(schedule) {
  const query = buildTargetQuery(schedule.targetCriteria);
  query.appVersionCode = schedule.fromVersionCode;

  const devices = await Device.find(query);
  
  for (const device of devices) {
    const existingJob = await UpdateJob.findOne({
      deviceImei: device.imei,
      scheduleId: schedule._id,
      currentState: { $nin: ['installation_completed', 'failed'] }
    });

    if (!existingJob) {
      await UpdateJob.create({
        deviceImei: device.imei,
        scheduleId: schedule._id,
        fromVersionCode: schedule.fromVersionCode,
        toVersionCode: schedule.toVersionCode,
        timeline: [{
          state: 'scheduled',
          timestamp: new Date()
        }]
      });
    }
  }
}

// Helper function to build target query
function buildTargetQuery(criteria) {
  const query = {};
  
  if (criteria.regions && criteria.regions.length > 0) {
    query['location.region'] = { $in: criteria.regions };
  }
  
  if (criteria.cities && criteria.cities.length > 0) {
    query['location.city'] = { $in: criteria.cities };
  }
  
  if (criteria.clientCustomizations && criteria.clientCustomizations.length > 0) {
    query.clientCustomization = { $in: criteria.clientCustomizations };
  }
  
  return query;
}

// Helper function to trigger updates
async function triggerUpdates(schedule) {
  const jobs = await UpdateJob.find({
    scheduleId: schedule._id,
    currentState: 'scheduled'
  }).limit(schedule.phasedConfig?.batchSize || 100);

  for (const job of jobs) {
    // Send push notification or silent command to device
    await notifyDeviceForUpdate(job);
  }
}

async function notifyDeviceForUpdate(job) {
  // Implementation for sending push notification to device
  // This would integrate with Firebase Cloud Messaging or similar
  console.log(`Notifying device ${job.deviceImei} for update`);
}