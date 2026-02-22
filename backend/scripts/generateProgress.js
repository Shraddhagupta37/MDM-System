const mongoose = require('mongoose');
require('dotenv').config();

const UpdateJob = require('../models/UpdateJob');
const UpdateSchedule = require('../models/UpdateSchedule');
const Device = require('../models/Device');

async function generateProgress() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/mdm_system');
    console.log('✅ Connected to MongoDB');

    // Get all in-progress schedules
    const schedules = await UpdateSchedule.find({ status: 'in_progress' });
    
    for (const schedule of schedules) {
      const jobs = await UpdateJob.find({ scheduleId: schedule._id });
      
      // Distribute jobs across different states
      for (let i = 0; i < jobs.length; i++) {
        const job = jobs[i];
        const rand = Math.random();
        
        if (rand < 0.3) {
          // 30% completed
          job.currentState = 'installation_completed';
          job.progress = { downloadProgress: 100, installationProgress: 100 };
          job.timeline.push({
            state: 'installation_completed',
            timestamp: new Date(),
            metadata: { progress: 100 }
          });
        } else if (rand < 0.5) {
          // 20% failed
          job.currentState = 'failed';
          job.progress = { downloadProgress: 45, installationProgress: 0 };
          job.failureStage = 'download';
          job.failureReason = 'Network timeout';
          job.timeline.push({
            state: 'failed',
            timestamp: new Date(),
            metadata: { stage: 'download', reason: 'Network timeout' }
          });
        } else if (rand < 0.7) {
          // 20% downloading
          job.currentState = 'download_started';
          job.progress = { downloadProgress: Math.floor(Math.random() * 70) + 20, installationProgress: 0 };
          job.timeline.push({
            state: 'download_started',
            timestamp: new Date(),
            metadata: { progress: job.progress }
          });
        } else {
          // 30% installing
          job.currentState = 'installation_started';
          job.progress = { downloadProgress: 100, installationProgress: Math.floor(Math.random() * 70) + 20 };
          job.timeline.push({
            state: 'installation_started',
            timestamp: new Date(),
            metadata: { progress: job.progress }
          });
        }
        
        await job.save();
      }
      
      // Update schedule stats
      await schedule.calculateStats();
      console.log(`✅ Updated ${jobs.length} jobs for schedule ${schedule.name}`);
    }

    console.log('\n🎉 Progress data generated successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Failed:', error);
    process.exit(1);
  }
}

generateProgress();