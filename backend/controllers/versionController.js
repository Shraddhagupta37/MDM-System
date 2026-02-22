const AppVersion = require('../models/AppVersion');
const VersionCompatibility = require('../models/VersionCompatibility');
const AuditLog = require('../models/AuditLog');

// Create new app version
exports.createVersion = async (req, res) => {
  try {
    const versionData = req.body;
    
    // Check if version code already exists
    const existingVersion = await AppVersion.findOne({ versionCode: versionData.versionCode });
    if (existingVersion) {
      return res.status(400).json({ success: false, error: 'Version code already exists' });
    }

    const version = new AppVersion(versionData);
    await version.save();

    // Create compatibility entries
    const latestVersions = await AppVersion.find({ isActive: true })
      .sort({ versionCode: -1 })
      .limit(5);

    for (const oldVersion of latestVersions) {
      if (oldVersion.versionCode !== version.versionCode) {
        await VersionCompatibility.create({
          fromVersionCode: oldVersion.versionCode,
          toVersionCode: version.versionCode,
          allowed: true,
          osRestrictions: {}
        });
      }
    }

    await AuditLog.create({
      action: 'CREATE_VERSION',
      entityType: 'version',
      entityId: version._id,
      userId: req.user.id,
      userName: req.user.name,
      changes: versionData
    });

    res.json({ success: true, version });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// Get all versions
exports.getVersions = async (req, res) => {
  try {
    const versions = await AppVersion.find().sort({ versionCode: -1 });
    res.json({ success: true, versions });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// Update version compatibility
exports.updateCompatibility = async (req, res) => {
  try {
    const { fromVersionCode, toVersionCode, allowed, requiresIntermediate, osRestrictions } = req.body;

    // Validate versions exist
    const fromVersion = await AppVersion.findOne({ versionCode: fromVersionCode });
    const toVersion = await AppVersion.findOne({ versionCode: toVersionCode });

    if (!fromVersion || !toVersion) {
      return res.status(404).json({ success: false, error: 'Version not found' });
    }

    // Check downgrade
    if (toVersionCode < fromVersionCode) {
      return res.status(400).json({ success: false, error: 'Downgrades are not allowed' });
    }

    const compatibility = await VersionCompatibility.findOneAndUpdate(
      { fromVersionCode, toVersionCode },
      { allowed, requiresIntermediate, osRestrictions },
      { upsert: true, new: true }
    );

    await AuditLog.create({
      action: 'UPDATE_COMPATIBILITY',
      entityType: 'version',
      entityId: compatibility._id,
      userId: req.user.id,
      userName: req.user.name,
      changes: req.body
    });

    res.json({ success: true, compatibility });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// Validate upgrade path
exports.validateUpgradePath = async (req, res) => {
  try {
    const { fromVersionCode, toVersionCode } = req.body;

    // Check if direct upgrade is allowed
    const compatibility = await VersionCompatibility.findOne({
      fromVersionCode,
      toVersionCode
    });

    if (!compatibility || !compatibility.allowed) {
      // Check if intermediate upgrades are required
      return res.json({
        success: false,
        allowed: false,
        message: 'Direct upgrade not allowed',
        suggestedPath: await findUpgradePath(fromVersionCode, toVersionCode)
      });
    }

    res.json({
      success: true,
      allowed: true,
      compatibility
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// Helper function to find upgrade path
async function findUpgradePath(fromCode, toCode) {
  const path = [];
  let currentCode = fromCode;
  
  while (currentCode < toCode) {
    const nextCompatibility = await VersionCompatibility.findOne({
      fromVersionCode: currentCode,
      allowed: true
    }).sort({ toVersionCode: 1 });
    
    if (!nextCompatibility) break;
    
    path.push(nextCompatibility.toVersionCode);
    currentCode = nextCompatibility.toVersionCode;
  }
  
  return path;
}