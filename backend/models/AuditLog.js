const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema({
  action: {
    type: String,
    required: true,
    enum: [
      'DEVICE_REGISTERED',
      'DEVICE_UPDATED',
      'DEVICE_BLOCKED',
      'VERSION_CREATED',
      'VERSION_UPDATED',
      'VERSION_DELETED',
      'SCHEDULE_CREATED',
      'SCHEDULE_APPROVED',
      'SCHEDULE_STARTED',
      'SCHEDULE_COMPLETED',
      'SCHEDULE_CANCELLED',
      'SCHEDULE_DELETED',
      'UPDATE_STARTED',
      'UPDATE_COMPLETED',
      'UPDATE_FAILED',
      'USER_LOGIN',
      'USER_LOGOUT',
      'USER_CREATED',
      'USER_UPDATED',
      'BULK_UPDATE_SCHEDULED'
    ]
  },
  entityType: {
    type: String,
    enum: ['device', 'version', 'schedule', 'job', 'user', 'system'],
    required: true
  },
  entityId: String,
  entityName: String,
  userId: String,
  userName: String,
  userRole: String,
  changes: mongoose.Schema.Types.Mixed,
  metadata: {
    ipAddress: String,
    userAgent: String,
    location: String,
    timestamp: Date
  },
  status: {
    type: String,
    enum: ['success', 'failure', 'pending'],
    default: 'success'
  },
  errorMessage: String,
  timestamp: {
    type: Date,
    default: Date.now,
    index: true
  }
});

// For efficient querying
auditLogSchema.index({ entityType: 1, entityId: 1, timestamp: -1 });
auditLogSchema.index({ userId: 1, timestamp: -1 });
auditLogSchema.index({ action: 1, timestamp: -1 });

module.exports = mongoose.model('AuditLog', auditLogSchema);