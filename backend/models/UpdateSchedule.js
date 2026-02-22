const mongoose = require('mongoose');

const updateScheduleSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  description: String,
  fromVersionCode: {
    type: Number,
    required: true
  },
  toVersionCode: {
    type: Number,
    required: true
  },
  targetCriteria: {
    regions: [String],
    cities: [String],
    clientCustomizations: [String],
    deviceModels: [String],
    percentage: {
      type: Number,
      min: 1,
      max: 100,
      default: 100
    }
  },
  scheduleType: {
    type: String,
    enum: ['immediate', 'scheduled', 'phased'],
    required: true
  },
  scheduledTime: Date,
  phasedConfig: {
    batchSize: {
      type: Number,
      default: 100
    },
    batchInterval: {
      type: Number, // in minutes
      default: 60
    },
    currentBatch: {
      type: Number,
      default: 0
    },
    totalBatches: Number
  },
  status: {
    type: String,
    enum: ['draft', 'pending_approval', 'approved', 'in_progress', 'completed', 'cancelled', 'failed'],
    default: 'draft'
  },
  stats: {
    totalDevices: Number,
    completedDevices: {
      type: Number,
      default: 0
    },
    failedDevices: {
      type: Number,
      default: 0
    },
    inProgressDevices: {
      type: Number,
      default: 0
    }
  },
  createdBy: {
    userId: String,
    userName: String
  },
  approvedBy: {
    userId: String,
    userName: String,
    approvedAt: Date
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

updateScheduleSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

updateScheduleSchema.methods.calculateStats = async function() {
  const UpdateJob = mongoose.model('UpdateJob');
  
  const jobs = await UpdateJob.find({ scheduleId: this._id });
  
  const stats = {
    totalDevices: jobs.length,
    completedDevices: jobs.filter(j => j.currentState === 'installation_completed').length,
    failedDevices: jobs.filter(j => j.currentState === 'failed').length,
    inProgressDevices: jobs.filter(j => 
      ['scheduled', 'notified', 'download_started', 'download_completed', 'installation_started'].includes(j.currentState)
    ).length
  };
  
  this.stats = stats;
  await this.save();
  return stats;
};

module.exports = mongoose.model('UpdateSchedule', updateScheduleSchema);