const express = require('express');
const router = express.Router();
const UpdateSchedule = require('../models/UpdateSchedule');
const UpdateJob = require('../models/UpdateJob');
const Device = require('../models/Device');
const AppVersion = require('../models/AppVersion');
const auth = require('../middleware/auth');
const AuditLog = require('../models/AuditLog');

// Create new schedule
router.post('/', auth, async (req, res) => {
  try {
    const scheduleData = req.body;
    
    // Validate versions exist
    const fromVersion = await AppVersion.findOne({ versionCode: scheduleData.fromVersionCode });
    const toVersion = await AppVersion.findOne({ versionCode: scheduleData.toVersionCode });
    
    if (!fromVersion || !toVersion) {
      return res.status(400).json({ 
        success: false, 
        error: 'Invalid version codes' 
      });
    }

    // Check for downgrade
    if (toVersion.versionCode < fromVersion.versionCode) {
      return res.status(400).json({ 
        success: false, 
        error: 'Downgrade schedules are not allowed' 
      });
    }

    // Calculate total devices matching criteria
    const query = buildTargetQuery(scheduleData.targetCriteria);
    query.appVersionCode = scheduleData.fromVersionCode;
    const totalDevices = await Device.countDocuments(query);

    if (totalDevices === 0) {
      return res.status(400).json({ 
        success: false, 
        error: 'No devices match the target criteria' 
      });
    }

    // Calculate batches for phased rollout
    let totalBatches = 1;
    if (scheduleData.scheduleType === 'phased' && scheduleData.phasedConfig) {
      totalBatches = Math.ceil(
        (totalDevices * (scheduleData.targetCriteria.percentage || 100) / 100) / 
        scheduleData.phasedConfig.batchSize
      );
    }

    const schedule = new UpdateSchedule({
      ...scheduleData,
      status: 'pending_approval',
      stats: {
        totalDevices,
        completedDevices: 0,
        failedDevices: 0,
        inProgressDevices: 0
      },
      phasedConfig: {
        ...scheduleData.phasedConfig,
        totalBatches
      },
      createdBy: {
        userId: req.user.id,
        userName: req.user.name
      }
    });

    await schedule.save();

    // Create initial jobs for immediate or scheduled rollouts
    if (schedule.scheduleType === 'immediate' || schedule.scheduleType === 'scheduled') {
      await createUpdateJobs(schedule, query);
    }

    // Log the action
    await AuditLog.create({
      action: 'SCHEDULE_CREATED',
      entityType: 'schedule',
      entityId: schedule._id,
      userId: req.user.id,
      userName: req.user.name,
      changes: scheduleData
    });

    res.json({ 
      success: true, 
      schedule,
      stats: {
        totalDevices,
        totalBatches
      }
    });
  } catch (error) {
    console.error('Create schedule error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get all schedules
router.get('/', auth, async (req, res) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    
    const query = {};
    if (status) query.status = status;

    const schedules = await UpdateSchedule.find(query)
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit));

    // Calculate stats for each schedule
    const schedulesWithStats = await Promise.all(schedules.map(async (schedule) => {
      await schedule.calculateStats();
      return schedule;
    }));

    const total = await UpdateSchedule.countDocuments(query);

    res.json({
      success: true,
      schedules: schedulesWithStats,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Get schedules error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get schedule details
router.get('/:id', auth, async (req, res) => {
  try {
    const schedule = await UpdateSchedule.findById(req.params.id);
    if (!schedule) {
      return res.status(404).json({ success: false, error: 'Schedule not found' });
    }

    // Calculate fresh stats
    const stats = await schedule.calculateStats();

    // Get recent jobs with device details
    const jobs = await UpdateJob.find({ scheduleId: schedule._id })
      .sort({ updatedAt: -1 })
      .limit(20)
      .lean();

    // Get device details for each job
    const jobsWithDevices = await Promise.all(jobs.map(async (job) => {
      const device = await Device.findOne({ imei: job.deviceImei }).lean();
      return {
        ...job,
        device: device ? {
          model: device.deviceModel,
          os: device.deviceOS,
          location: device.location
        } : null
      };
    }));

    res.json({
      success: true,
      schedule: {
        ...schedule.toObject(),
        stats
      },
      recentJobs: jobsWithDevices
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Approve schedule
router.put('/:id/approve', auth, async (req, res) => {
  try {
    const schedule = await UpdateSchedule.findById(req.params.id);
    
    if (!schedule) {
      return res.status(404).json({ success: false, error: 'Schedule not found' });
    }

    if (schedule.status !== 'pending_approval' && schedule.status !== 'draft') {
      return res.status(400).json({ 
        success: false, 
        error: `Schedule cannot be approved in ${schedule.status} state` 
      });
    }

    schedule.status = 'approved';
    schedule.approvedBy = {
      userId: req.user.id,
      userName: req.user.name,
      approvedAt: new Date()
    };

    await schedule.save();

    // If immediate or scheduled, create jobs now
    if (schedule.scheduleType === 'immediate' || schedule.scheduleType === 'scheduled') {
      const query = buildTargetQuery(schedule.targetCriteria);
      query.appVersionCode = schedule.fromVersionCode;
      await createUpdateJobs(schedule, query);
      schedule.status = 'in_progress';
      await schedule.save();
    }

    await AuditLog.create({
      action: 'SCHEDULE_APPROVED',
      entityType: 'schedule',
      entityId: schedule._id,
      userId: req.user.id,
      userName: req.user.name
    });

    res.json({ success: true, schedule });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Execute next batch for phased rollout
router.post('/:id/next-batch', auth, async (req, res) => {
  try {
    const schedule = await UpdateSchedule.findById(req.params.id);
    
    if (!schedule) {
      return res.status(404).json({ success: false, error: 'Schedule not found' });
    }

    if (schedule.scheduleType !== 'phased' || schedule.status !== 'in_progress') {
      return res.status(400).json({ 
        success: false, 
        error: 'Not a phased rollout or not in progress' 
      });
    }

    const nextBatch = (schedule.phasedConfig.currentBatch || 0) + 1;
    if (nextBatch > schedule.phasedConfig.totalBatches) {
      return res.status(400).json({ 
        success: false, 
        error: 'All batches已完成' 
      });
    }

    // Get devices for this batch
    const query = buildTargetQuery(schedule.targetCriteria);
    query.appVersionCode = schedule.fromVersionCode;
    
    const devices = await Device.find(query)
      .skip((nextBatch - 1) * schedule.phasedConfig.batchSize)
      .limit(schedule.phasedConfig.batchSize);

    // Create jobs for this batch
    for (const device of devices) {
      const existingJob = await UpdateJob.findOne({
        deviceImei: device.imei,
        scheduleId: schedule._id
      });

      if (!existingJob) {
        const job = new UpdateJob({
          deviceImei: device.imei,
          scheduleId: schedule._id,
          fromVersionCode: schedule.fromVersionCode,
          toVersionCode: schedule.toVersionCode
        });
        job.updateState('scheduled');
        await job.save();
      }
    }

    schedule.phasedConfig.currentBatch = nextBatch;
    await schedule.save();

    res.json({ 
      success: true, 
      message: `Batch ${nextBatch} started`,
      devicesInBatch: devices.length
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Cancel schedule
router.put('/:id/cancel', auth, async (req, res) => {
  try {
    const schedule = await UpdateSchedule.findById(req.params.id);
    
    if (!schedule) {
      return res.status(404).json({ success: false, error: 'Schedule not found' });
    }

    if (schedule.status === 'completed') {
      return res.status(400).json({ 
        success: false, 
        error: 'Cannot cancel a completed schedule' 
      });
    }

    if (schedule.status === 'cancelled') {
      return res.status(400).json({ 
        success: false, 
        error: 'Schedule is already cancelled' 
      });
    }

    // Update schedule status
    schedule.status = 'cancelled';
    await schedule.save();

    // Cancel all pending jobs
    await UpdateJob.updateMany(
      { 
        scheduleId: schedule._id,
        currentState: { $in: ['scheduled', 'notified'] }
      },
      { 
        $set: { 
          currentState: 'cancelled',
          'timeline': {
            $push: {
              state: 'cancelled',
              timestamp: new Date(),
              metadata: { reason: 'Schedule cancelled by admin' }
            }
          }
        }
      }
    );

    await AuditLog.create({
      action: 'SCHEDULE_CANCELLED',
      entityType: 'schedule',
      entityId: schedule._id,
      userId: req.user.id,
      userName: req.user.name,
      changes: { name: schedule.name, status: 'cancelled' }
    });

    res.json({ 
      success: true, 
      message: 'Schedule cancelled successfully',
      schedule 
    });
  } catch (error) {
    console.error('Cancel schedule error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

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

  if (criteria.deviceModels && criteria.deviceModels.length > 0) {
    query.deviceModel = { $in: criteria.deviceModels };
  }
  
  return query;
}

// Helper function to create update jobs
async function createUpdateJobs(schedule, query) {
  const devices = await Device.find(query);
  
  // Apply percentage filter if needed
  let targetDevices = devices;
  if (schedule.targetCriteria.percentage && schedule.targetCriteria.percentage < 100) {
    const count = Math.ceil(devices.length * schedule.targetCriteria.percentage / 100);
    targetDevices = devices.slice(0, count);
  }

  for (const device of targetDevices) {
    const existingJob = await UpdateJob.findOne({
      deviceImei: device.imei,
      scheduleId: schedule._id,
      currentState: { $nin: ['installation_completed', 'failed', 'cancelled'] }
    });

    if (!existingJob) {
      const job = new UpdateJob({
        deviceImei: device.imei,
        scheduleId: schedule._id,
        fromVersionCode: schedule.fromVersionCode,
        toVersionCode: schedule.toVersionCode
      });
      job.updateState('scheduled');
      await job.save();
      
      // In production, trigger push notification here
      console.log(`Job created for device ${device.imei}`);
    }
  }
}

// Delete schedule
router.delete('/:id', auth, async (req, res) => {
  try {
    const schedule = await UpdateSchedule.findById(req.params.id);
    
    if (!schedule) {
      return res.status(404).json({ success: false, error: 'Schedule not found' });
    }

    // Check if schedule has any jobs in progress
    const activeJobs = await UpdateJob.countDocuments({
      scheduleId: schedule._id,
      currentState: { $in: ['in_progress', 'notified', 'download_started', 'installation_started'] }
    });

    if (activeJobs > 0) {
      return res.status(400).json({ 
        success: false, 
        error: 'Cannot delete schedule with active jobs' 
      });
    }

    // Delete all associated jobs
    await UpdateJob.deleteMany({ scheduleId: schedule._id });
    
    // Delete the schedule
    await schedule.deleteOne();

    await AuditLog.create({
      action: 'SCHEDULE_DELETED',
      entityType: 'schedule',
      entityId: schedule._id,
      userId: req.user.id,
      userName: req.user.name,
      changes: { name: schedule.name }
    });

    res.json({ success: true, message: 'Schedule deleted successfully' });
  } catch (error) {
    console.error('Delete schedule error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;