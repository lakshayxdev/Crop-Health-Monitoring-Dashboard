const express = require('express');
const router = express.Router();
const CropProfile = require('../models/CropProfile');

const defaultProfiles = [
  { name: 'wheat', display_name: 'Wheat', optimal_moisture_min: 40, optimal_moisture_max: 65, optimal_temp_min: 15, optimal_temp_max: 25, optimal_humidity_min: 50, optimal_humidity_max: 70, description: 'Winter cereal grain requiring moderate moisture and cooler temperatures.' },
  { name: 'rice', display_name: 'Paddy Rice', optimal_moisture_min: 60, optimal_moisture_max: 90, optimal_temp_min: 20, optimal_temp_max: 35, optimal_humidity_min: 70, optimal_humidity_max: 90, description: 'Semi-aquatic crop requiring flooded or high-moisture soil conditions.' },
  { name: 'tomato', display_name: 'Tomato', optimal_moisture_min: 50, optimal_moisture_max: 75, optimal_temp_min: 18, optimal_temp_max: 30, optimal_humidity_min: 60, optimal_humidity_max: 80, description: 'Warm-season fruit vegetable sensitive to extreme drought and humidity.' }
];

router.get('/', async (req, res) => {
  try {
    let profiles = await CropProfile.find();
    if (profiles.length === 0) {
      profiles = await CropProfile.insertMany(defaultProfiles);
    }
    res.json({ success: true, data: profiles });
  } catch (err) {
    res.json({ success: true, data: defaultProfiles, fallback: true });
  }
});

router.post('/', async (req, res) => {
  try {
    const profile = new CropProfile(req.body);
    await profile.save();
    res.status(201).json({ success: true, data: profile });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

module.exports = router;
