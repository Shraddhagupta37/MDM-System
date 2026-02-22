const Device = require('../models/Device');
const AuditLog = require('../models/AuditLog');
const { validateVersionCompliance } = require('../services/versionService');

// Register or update device heartbeat
exports.heartbeat = async (req, res) => {
  try {
    const { imei, appVersion, appVersionCode, deviceOS, deviceModel, location, batteryLevel, networkType } = req.body;

    let device = await Device.findOne({ imei });

    if (device) {
      // Update existing device
      device.appVersion = appVersion;
      device.appVersionCode = appVersionCode;
      device.lastOpenTime = new Date();
      device.location = location || device.location;
      device.metadata = { batteryLevel, networkType };
    } else {
      // Register new device
      device = new Device({
        imei,
        appVersion,
        appVersionCode,
        deviceOS,
        deviceModel,
        location,
        metadata: { batteryLevel, networkType }
      });
    }

    await device.save();

    // Check version compliance
    const compliance = await validateVersionCompliance(device);

    res.json({
      success: true,
      device,
      compliance
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// Get device inventory with filters
exports.getDeviceInventory = async (req, res) => {
  try {
    const { region, version, status, page = 1, limit = 20 } = req.query;
    
    const query = {};
    if (region) query['location.region'] = region;
    if (version) query.appVersion = version;
    if (status) query.status = status;

    const devices = await Device.find(query)
      .sort({ lastOpenTime: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Device.countDocuments(query);

    // Get statistics
    const stats = {
      totalActive: await Device.countDocuments({ status: 'active' }),
      versionDistribution: await Device.aggregate([
        { $group: { _id: '$appVersion', count: { $sum: 1 } } }
      ]),
      regionWise: await Device.aggregate([
        { $group: { _id: '$location.region', count: { $sum: 1 } } }
      ]),
      inactiveDevices: await Device.countDocuments({
        lastOpenTime: { $lt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }
      })
    };

    res.json({
      success: true,
      devices,
      stats,
      totalPages: Math.ceil(total / limit),
      currentPage: page
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// Get device details
exports.getDeviceDetails = async (req, res) => {
  try {
    const device = await Device.findOne({ imei: req.params.imei });
    if (!device) {
      return res.status(404).json({ success: false, error: 'Device not found' });
    }
    res.json({ success: true, device });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};