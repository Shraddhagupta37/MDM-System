const express = require('express');
const router = express.Router();
const AppVersion = require('../models/AppVersion');
const auth = require('../middleware/auth');
const UpdateSchedule = require('../models/UpdateSchedule');
const Device = require('../models/Device');
const AuditLog = require('../models/AuditLog');

// Create new app version
router.post('/', auth, async (req, res) => {
  try {
    const versionData = req.body;
    
    // Check if version code already exists
    const existingVersion = await AppVersion.findOne({ versionCode: versionData.versionCode });
    if (existingVersion) {
      return res.status(400).json({ success: false, error: 'Version code already exists' });
    }

    const version = new AppVersion(versionData);
    await version.save();

    res.json({ success: true, version });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get all versions
router.get('/', auth, async (req, res) => {
  try {
    const versions = await AppVersion.find().sort({ versionCode: -1 });
    res.json({ success: true, versions });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get latest version
router.get('/latest', auth, async (req, res) => {
  try {
    const version = await AppVersion.findOne().sort({ versionCode: -1 });
    res.json({ success: true, version });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Update version
router.put('/:versionCode', auth, async (req, res) => {
  try {
    const version = await AppVersion.findOneAndUpdate(
      { versionCode: req.params.versionCode },
      req.body,
      { new: true }
    );
    
    if (!version) {
      return res.status(404).json({ success: false, error: 'Version not found' });
    }
    
    res.json({ success: true, version });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Delete version
router.delete('/:versionCode', auth, async (req, res) => {
  try {
    const versionCode = parseInt(req.params.versionCode);
    
    // Find the version first
    const version = await AppVersion.findOne({ versionCode });
    if (!version) {
      return res.status(404).json({ 
        success: false, 
        error: 'Version not found' 
      });
    }

    // Check if version is used in any schedules
    const scheduleCount = await UpdateSchedule.countDocuments({
      $or: [
        { fromVersionCode: versionCode },
        { toVersionCode: versionCode }
      ]
    });

    if (scheduleCount > 0) {
      return res.status(400).json({ 
        success: false, 
        error: `Cannot delete version that is used in ${scheduleCount} schedule(s). Please delete the schedules first.` 
      });
    }

    // Check if any devices are running this version
    const deviceCount = await Device.countDocuments({ appVersionCode: versionCode });
    if (deviceCount > 0) {
      return res.status(400).json({ 
        success: false, 
        error: `Cannot delete version that is installed on ${deviceCount} device(s)` 
      });
    }

    // Store version info before deletion
    const versionInfo = {
      versionCode: version.versionCode,
      versionName: version.versionName
    };

    await version.deleteOne();

    // Try to create audit log, but don't fail if it errors
    try {
      await AuditLog.create({
        action: 'VERSION_DELETED',
        entityType: 'version',
        entityId: version._id,
        userId: req.user.id,
        userName: req.user.name,
        changes: versionInfo
      });
    } catch (auditError) {
      console.error('Audit log error (non-critical):', auditError.message);
      // Continue even if audit log fails
    }

    res.json({ 
      success: true, 
      message: 'Version deleted successfully' 
    });
  } catch (error) {
    console.error('Delete version error:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

module.exports = router;