const express = require('express');
const router = express.Router();
const AuditLog = require('../models/AuditLog');
const auth = require('../middleware/auth');

// Get audit logs with filters
router.get('/', auth, async (req, res) => {
  try {
    const { 
      entityType, 
      entityId, 
      userId, 
      action,
      startDate, 
      endDate, 
      page = 1, 
      limit = 50 
    } = req.query;

    const query = {};
    if (entityType) query.entityType = entityType;
    if (entityId) query.entityId = entityId;
    if (userId) query.userId = userId;
    if (action) query.action = action;
    if (startDate || endDate) {
      query.timestamp = {};
      if (startDate) query.timestamp.$gte = new Date(startDate);
      if (endDate) query.timestamp.$lte = new Date(endDate);
    }

    const logs = await AuditLog.find(query)
      .sort({ timestamp: -1 })
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit));

    const total = await AuditLog.countDocuments(query);

    // Get unique actions for filter dropdown
    const uniqueActions = await AuditLog.distinct('action');

    res.json({
      success: true,
      logs,
      filters: {
        actions: uniqueActions,
        entityTypes: ['device', 'version', 'schedule', 'job', 'user']
      },
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get device timeline
router.get('/device/:imei', auth, async (req, res) => {
  try {
    const logs = await AuditLog.find({
      entityType: 'device',
      entityId: req.params.imei
    }).sort({ timestamp: 1 });

    res.json({ success: true, timeline: logs });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get schedule timeline
router.get('/schedule/:scheduleId', auth, async (req, res) => {
  try {
    const logs = await AuditLog.find({
      entityType: 'schedule',
      entityId: req.params.scheduleId
    }).sort({ timestamp: 1 });

    res.json({ success: true, timeline: logs });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get summary statistics
router.get('/stats/summary', auth, async (req, res) => {
  try {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const stats = await AuditLog.aggregate([
      {
        $match: {
          timestamp: { $gte: thirtyDaysAgo }
        }
      },
      {
        $group: {
          _id: {
            action: '$action',
            date: { $dateToString: { format: '%Y-%m-%d', date: '$timestamp' } }
          },
          count: { $sum: 1 }
        }
      },
      {
        $sort: { '_id.date': -1 }
      }
    ]);

    res.json({ success: true, stats });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;