const AuditLog = require('../models/AuditLog');

// Get audit logs with filters
exports.getAuditLogs = async (req, res) => {
  try {
    const { entityType, entityId, userId, startDate, endDate, page = 1, limit = 50 } = req.query;

    const query = {};
    if (entityType) query.entityType = entityType;
    if (entityId) query.entityId = entityId;
    if (userId) query.userId = userId;
    if (startDate || endDate) {
      query.timestamp = {};
      if (startDate) query.timestamp.$gte = new Date(startDate);
      if (endDate) query.timestamp.$lte = new Date(endDate);
    }

    const logs = await AuditLog.find(query)
      .sort({ timestamp: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await AuditLog.countDocuments(query);

    res.json({
      success: true,
      logs,
      totalPages: Math.ceil(total / limit),
      currentPage: page
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// Get device timeline
exports.getDeviceTimeline = async (req, res) => {
  try {
    const logs = await AuditLog.find({
      entityType: 'device',
      entityId: req.params.imei
    }).sort({ timestamp: 1 });

    res.json({ success: true, timeline: logs });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};