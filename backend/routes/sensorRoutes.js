const express = require('express');
const router = express.Router();
const SensorReading = require('../models/SensorReading');

router.get('/latest', async (req, res) => {
  try {
    const latest = await SensorReading.findOne().sort({ createdAt: -1 });
    const fallbackReading = latest || {
      device_id: 'ESP32_FIELD_01',
      soil_moisture: 52,
      temperature: 24.5,
      humidity: 62,
      weather_condition: 'Sunny',
      rain_forecast: false,
      pump_status: false,
      is_simulated: true,
      createdAt: new Date()
    };
    res.json({ success: true, data: fallbackReading });
  } catch (err) {
    res.json({
      success: true,
      data: {
        device_id: 'ESP32_FIELD_01',
        soil_moisture: 52,
        temperature: 24.5,
        humidity: 62,
        weather_condition: 'Sunny',
        rain_forecast: false,
        pump_status: false,
        is_simulated: true
      },
      fallback: true
    });
  }
});

router.post('/', async (req, res) => {
  try {
    const reading = new SensorReading(req.body);
    await reading.save();
    res.status(201).json({ success: true, data: reading });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

router.get('/history', async (req, res) => {
  try {
    const history = await SensorReading.find().sort({ createdAt: -1 }).limit(20);
    res.json({ success: true, data: history.reverse() });
  } catch (err) {
    res.json({ success: true, data: [], fallback: true });
  }
});

module.exports = router;
