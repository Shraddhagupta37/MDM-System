const mongoose = require('mongoose');

const updateJobSchema = new mongoose.Schema({
  deviceImei: {
    type: String,
    required: true,
    index: true
  },
  scheduleId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'UpdateSchedule',
    required: true
  },
  fromVersionCode: Number,
  toVersionCode: Number,
  currentState: {
    type: String,
    enum: [
      'scheduled',
      'notified',
      'download_started',
      'download_completed',
      'installation_started',
      'installation_completed',
      'failed',
      'cancelled'
    ],
    default: 'scheduled'
  },
  failureStage: String,
  failureReason: String,
  retryCount: {
    type: Number,
    default: 0
  },
  maxRetries: {
    type: Number,
    default: 3
  },
  progress: {
    downloadProgress: {
      type: Number,
      default: 0,
      min: 0,
      max: 100
    },
    installationProgress: {
      type: Number,
      default: 0,
      min: 0,
      max: 100
    }
  },
  timeline: [{
    state: String,
    timestamp: {
      type: Date,
      default: Date.now
    },
    metadata: mongoose.Schema.Types.Mixed
  }],
  notifiedAt: Date,
  downloadStartedAt: Date,
  downloadCompletedAt: Date,
  installationStartedAt: Date,
  installationCompletedAt: Date,
  failedAt: Date,
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

updateJobSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Add method to update state
updateJobSchema.methods.updateState = function(state, metadata = {}) {
  this.currentState = state;
  this.timeline.push({
    state,
    timestamp: new Date(),
    metadata
  });

  // Set specific timestamps
  const now = new Date();
  switch(state) {
    case 'notified':
      this.notifiedAt = now;
      break;
    case 'download_started':
      this.downloadStartedAt = now;
      break;
    case 'download_completed':
      this.downloadCompletedAt = now;
      break;
    case 'installation_started':
      this.installationStartedAt = now;
      break;
    case 'installation_completed':
      this.installationCompletedAt = now;
      break;
    case 'failed':
      this.failedAt = now;
      this.failureStage = metadata.stage;
      this.failureReason = metadata.reason;
      break;
  }
};

module.exports = mongoose.model('UpdateJob', updateJobSchema);