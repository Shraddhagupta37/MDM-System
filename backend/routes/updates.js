const express = require('express');
const router = express.Router();
const UpdateJob = require('../models/UpdateJob');
const Device = require('../models/Device');
const UpdateSchedule = require('../models/UpdateSchedule');
const auth = require('../middleware/auth');
const AuditLog = require('../models/AuditLog');

// Update job status (called by device)
router.post('/job/:jobId/status', async (req, res) => {
  try {
    const { jobId } = req.params;
    const { state, progress, metadata } = req.body;

    const job = await UpdateJob.findById(jobId);
    if (!job) {
      return res.status(404).json({ success: false, error: 'Job not found' });
    }

    // Update job state
    job.updateState(state, metadata);

    if (progress) {
      if (state.includes('download')) {
        job.progress.downloadProgress = progress;
      } else if (state.includes('installation')) {
        job.progress.installationProgress = progress;
      }
    }

    await job.save();

    // Update schedule stats
    const schedule = await UpdateSchedule.findById(job.scheduleId);
    if (schedule) {
      if (state === 'installation_completed') {
        schedule.stats.completedDevices += 1;
        
        // Update device version
        await Device.findOneAndUpdate(
          { imei: job.deviceImei },
          { 
            appVersionCode: job.toVersionCode,
            $inc: { 'metadata.updateCount': 1 }
          }
        );
      } else if (state === 'failed') {
        schedule.stats.failedDevices += 1;
        job.retryCount += 1;
        
        // Schedule retry if under limit
        if (job.retryCount < job.maxRetries) {
          setTimeout(() => retryJob(job._id), 5 * 60 * 1000); // 5 minutes
        }
      } else if (['notified', 'download_started', 'installation_started'].includes(state)) {
        schedule.stats.inProgressDevices += 1;
      }
      
      await schedule.save();
    }

    res.json({ success: true, job });
  } catch (error) {
    console.error('Update job status error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get device pending jobs (called by device)
router.get('/device/:imei/pending', async (req, res) => {
  try {
    const jobs = await UpdateJob.find({
      deviceImei: req.params.imei,
      currentState: { $in: ['scheduled', 'notified', 'download_started', 'installation_started'] }
    }).populate('scheduleId');

    res.json({ 
      success: true, 
      jobs: jobs.map(job => ({
        jobId: job._id,
        fromVersion: job.fromVersionCode,
        toVersion: job.toVersionCode,
        state: job.currentState,
        progress: job.progress,
        schedule: {
          name: job.scheduleId?.name,
          type: job.scheduleId?.scheduleType
        }
      }))
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get job details
router.get('/job/:jobId', auth, async (req, res) => {
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
});

// Get device update history
router.get('/device/:imei/history', auth, async (req, res) => {
  try {
    const jobs = await UpdateJob.find({ deviceImei: req.params.imei })
      .sort({ createdAt: -1 })
      .populate('scheduleId');

    res.json({ success: true, jobs });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Retry failed job
async function retryJob(jobId) {
  try {
    const job = await UpdateJob.findById(jobId);
    if (job && job.currentState === 'failed') {
      job.updateState('scheduled', { reason: 'Retry' });
      await job.save();
      console.log(`Job ${jobId} scheduled for retry`);
    }
  } catch (error) {
    console.error('Error retrying job:', error);
  }
}

// Simulate update progress (for demo purposes)
router.post('/simulate/:jobId', auth, async (req, res) => {
  try {
    const { jobId } = req.params;
    const { action } = req.body;
    
    const job = await UpdateJob.findById(jobId);
    if (!job) {
      return res.status(404).json({ success: false, error: 'Job not found' });
    }

    const states = {
      'start_download': {
        state: 'download_started',
        progress: { downloadProgress: 10, installationProgress: 0 },
        message: 'Download started'
      },
      'progress_download': {
        state: 'download_started',
        progress: { downloadProgress: 50, installationProgress: 0 },
        message: 'Download in progress'
      },
      'complete_download': {
        state: 'download_completed',
        progress: { downloadProgress: 100, installationProgress: 0 },
        message: 'Download completed'
      },
      'start_install': {
        state: 'installation_started',
        progress: { downloadProgress: 100, installationProgress: 10 },
        message: 'Installation started'
      },
      'progress_install': {
        state: 'installation_started',
        progress: { downloadProgress: 100, installationProgress: 50 },
        message: 'Installation in progress'
      },
      'complete_install': {
        state: 'installation_completed',
        progress: { downloadProgress: 100, installationProgress: 100 },
        message: 'Installation completed'
      },
      'fail': {
        state: 'failed',
        progress: { downloadProgress: 30, installationProgress: 0 },
        message: 'Update failed'
      }
    };

    const sim = states[action];
    if (!sim) {
      return res.status(400).json({ success: false, error: 'Invalid simulation action' });
    }

    job.currentState = sim.state;
    job.progress = sim.progress;
    job.timeline.push({
      state: sim.state,
      timestamp: new Date(),
      metadata: { progress: sim.progress, simulated: true }
    });

    if (sim.state === 'installation_completed') {
      // Update device version
      await Device.findOneAndUpdate(
        { imei: job.deviceImei },
        { 
          appVersionCode: job.toVersionCode,
          $inc: { 'metadata.updateCount': 1 }
        }
      );
    }

    if (sim.state === 'failed') {
      job.failureStage = 'download';
      job.failureReason = 'Simulated failure';
      job.retryCount += 1;
    }

    await job.save();

    // Update schedule stats
    const schedule = await UpdateSchedule.findById(job.scheduleId);
    if (schedule) {
      const jobs = await UpdateJob.find({ scheduleId: schedule._id });
      schedule.stats = {
        totalDevices: jobs.length,
        completedDevices: jobs.filter(j => j.currentState === 'installation_completed').length,
        failedDevices: jobs.filter(j => j.currentState === 'failed').length,
        inProgressDevices: jobs.filter(j => 
          ['scheduled', 'notified', 'download_started', 'download_completed', 'installation_started'].includes(j.currentState)
        ).length
      };
      await schedule.save();
    }

    res.json({ 
      success: true, 
      job,
      message: sim.message
    });
  } catch (error) {
    console.error('Simulation error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;