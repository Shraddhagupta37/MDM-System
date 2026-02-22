const mongoose = require('mongoose');

const versionCompatibilitySchema = new mongoose.Schema({
  fromVersionCode: {
    type: Number,
    required: true
  },
  toVersionCode: {
    type: Number,
    required: true
  },
  allowed: {
    type: Boolean,
    default: true
  },
  requiresIntermediate: [Number], // Array of version codes that must be installed first
  osRestrictions: {
    type: Map,
    of: String
  },
  minBatteryLevel: {
    type: Number,
    default: 30 // Minimum battery % required for update
  },
  requiredStorage: Number, // MB required
  createdAt: {
    type: Date,
    default: Date.now
  }
});

versionCompatibilitySchema.index({ fromVersionCode: 1, toVersionCode: 1 }, { unique: true });

module.exports = mongoose.model('VersionCompatibility', versionCompatibilitySchema);