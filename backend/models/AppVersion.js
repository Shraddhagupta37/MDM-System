const mongoose = require('mongoose');

const appVersionSchema = new mongoose.Schema({
  versionCode: {
    type: Number,
    required: true,
    unique: true
  },
  versionName: {
    type: String,
    required: true
  },
  releaseDate: {
    type: Date,
    required: true
  },
  supportedOSRange: {
    min: String,
    max: String
  },
  customizationTag: {
    type: String,
    default: 'global'
  },
  isMandatory: {
    type: Boolean,
    default: false
  },
  isActive: {
    type: Boolean,
    default: true
  },
  downloadUrl: String,
  releaseNotes: String,
  fileSize: Number,
  checksum: String,
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('AppVersion', appVersionSchema);