const VersionCompatibility = require('../models/VersionCompatibility');
const AppVersion = require('../models/AppVersion');

// Validate version compliance for device
exports.validateVersionCompliance = async (device) => {
  try {
    const latestVersion = await AppVersion.findOne({ isActive: true })
      .sort({ versionCode: -1 });

    if (!latestVersion) {
      return { compliant: true };
    }

    // Check if device is on latest version
    if (device.appVersionCode >= latestVersion.versionCode) {
      return {
        compliant: true,
        currentVersion: device.appVersionCode,
        latestVersion: latestVersion.versionCode
      };
    }

    // Check if update is mandatory
    if (latestVersion.isMandatory) {
      // Check compatibility path
      const compatibility = await VersionCompatibility.findOne({
        fromVersionCode: device.appVersionCode,
        toVersionCode: latestVersion.versionCode
      });

      return {
        compliant: false,
        currentVersion: device.appVersionCode,
        latestVersion: latestVersion.versionCode,
        updateAvailable: true,
        mandatory: true,
        allowed: compatibility ? compatibility.allowed : false,
        upgradePath: compatibility ? null : await findUpgradePath(device.appVersionCode, latestVersion.versionCode)
      };
    }

    return {
      compliant: true,
      currentVersion: device.appVersionCode,
      latestVersion: latestVersion.versionCode,
      updateAvailable: true,
      mandatory: false
    };
  } catch (error) {
    console.error('Error validating version compliance:', error);
    return { compliant: true, error: error.message };
  }
};

// Find upgrade path
async function findUpgradePath(fromCode, toCode) {
  const path = [];
  let currentCode = fromCode;
  
  while (currentCode < toCode) {
    const compatibility = await VersionCompatibility.findOne({
      fromVersionCode: currentCode,
      allowed: true
    }).sort({ toVersionCode: 1 });
    
    if (!compatibility) break;
    
    path.push({
      from: currentCode,
      to: compatibility.toVersionCode
    });
    
    currentCode = compatibility.toVersionCode;
  }
  
  return path;
}

// Validate upgrade path
exports.validateUpgradePath = async (fromCode, toCode) => {
  const compatibility = await VersionCompatibility.findOne({
    fromVersionCode: fromCode,
    toVersionCode: toCode
  });

  if (!compatibility || !compatibility.allowed) {
    const path = await findUpgradePath(fromCode, toCode);
    return {
      allowed: false,
      directUpgrade: false,
      suggestedPath: path
    };
  }

  return {
    allowed: true,
    directUpgrade: true,
    compatibility
  };
};