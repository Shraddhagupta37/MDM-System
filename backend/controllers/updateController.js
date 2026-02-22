const UpdateJob = require('../models/UpdateJob');
const Device = require('../models/Device');
const AuditLog = require('../models/AuditLog');

// Update job status
exports.updateJobStatus = async (req, res) => {
  try {
    const { jobId } = req.params;
    const { state, progress, failureReason } = req.body;

    const job = await UpdateJob.findById(jobId);
    if (!job) {
      return res.status(404).json({ success: false, error: 'Job not found' });
    }

    // Update job state
    job.currentState = state;
    job.timeline.push({
      state,
      timestamp: new Date(),
      metadata: { progress, failureReason }
    });

    if (progress) {
      if (state.includes('download')) {
        job.progress.downloadProgress = progress;
      } else if (state.includes('installation')) {
        job.progress.installationProgress = progress;
      }
    }

    if (state === 'failed') {
      job.failureStage = job.currentState;
      job.failureReason = failureReason;
      job.retryCount += 1;

      // Schedule retry if under limit
      if (job.retryCount < job.maxRetries) {
        setTimeout(() => retryJob(job._id), 5 * 60 * 1000); // Retry after 5 minutes
      }
    }

    if (state === 'installation_completed') {
      // Update device version
      await Device.findOneAndUpdate(
        { imei: job.deviceImei },
        {
          appVersionCode: job.toVersionCode,
          $inc: { 'metadata.updateCount': 1 }
        }
      );
    }

    await job.save();

    await AuditLog.create({
      action: 'UPDATE_JOB_STATUS',
      entityType: 'job',
      entityId: job._id,
      changes: { state, progress, failureReason }
    });

    res.json({ success: true, job });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// Get job details
exports.getJobDetails = async (req, res) => {
  try {
    const job = await UpdateJob.findById(req.params.jobId)
      .populate('scheduleId');
    
    if (!job) {
      return res.status(404).json({ success: false, error: 'Job not found' });
    }

    res.json({ success: true, job });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// Get device update history
exports.getDeviceUpdateHistory = async (req, res) => {
  try {
    const jobs = await UpdateJob.find({ deviceImei: req.params.imei })
      .sort({ createdAt: -1 })
      .populate('scheduleId');

    res.json({ success: true, jobs });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// Retry failed job
async function retryJob(jobId) {
  try {
    const job = await UpdateJob.findById(jobId);
    if (job && job.currentState === 'failed') {
      job.currentState = 'scheduled';
      job.timeline.push({
        state: 'retry_scheduled',
        timestamp: new Date()
      });
      await job.save();
      
      // Trigger notification again
      await notifyDeviceForUpdate(job);
    }
  } catch (error) {
    console.error('Error retrying job:', error);
  }
}