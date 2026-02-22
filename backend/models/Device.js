const mongoose = require('mongoose');

const deviceSchema = new mongoose.Schema({
  imei: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  appVersion: {
    type: String,
    required: true
  },
  appVersionCode: {
    type: Number,
    required: true
  },
  deviceOS: {
    type: String,
    required: true
  },
  deviceModel: String,
  lastOpenTime: {
    type: Date,
    default: Date.now
  },
  location: {
    region: String,
    city: String,
    lastKnownLatitude: Number,
    lastKnownLongitude: Number
  },
  clientCustomization: {
    type: String,
    default: 'default'
  },
  status: {
    type: String,
    enum: ['active', 'inactive', 'blocked'],
    default: 'active'
  },
  metadata: {
    batteryLevel: Number,
    storageAvailable: Number,
    networkType: String
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

// Update the updatedAt timestamp on save
deviceSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('Device', deviceSchema);