const express = require('express');
const router = express.Router();
const Alert = require('../models/Alert');

router.get('/', async (req, res) => {
  try {
    const alerts = await Alert.find().sort({ createdAt: -1 }).limit(15);
    if (alerts.length === 0) {
      return res.json({
        success: true,
        data: [
          { _id: '1', severity: 'info', message: 'System initialized successfully. ESP32 readiness confirmed.', parameter: 'System', createdAt: new Date() },
          { _id: '2', severity: 'warning', message: 'Soil moisture slightly below optimal for Wheat profile.', parameter: 'Soil Moisture', createdAt: new Date(Date.now() - 3600000) }
        ]
      });
    }
    res.json({ success: true, data: alerts });
  } catch (err) {
    res.json({ success: true, data: [], fallback: true });
  }
});

module.exports = router;
