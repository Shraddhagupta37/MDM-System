const express = require('express');
const router = express.Router();

router.get('/', (req, res) => {
  res.json({
    success: true,
    stats: {
      totalDevices: 150,
      activeDevices: 142,
      pendingUpdates: 23,
      successRate: 98.5
    }
  });
});

module.exports = router;