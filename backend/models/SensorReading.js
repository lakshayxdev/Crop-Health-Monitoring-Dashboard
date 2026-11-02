const mongoose = require('mongoose');

const sensorReadingSchema = new mongoose.Schema({
  device_id: { type: String, default: 'ESP32_FIELD_01' },
  soil_moisture: { type: Number, required: true },
  temperature: { type: Number, required: true },
  humidity: { type: Number, required: true },
  weather_condition: { type: String, default: 'Clear' },
  rain_forecast: { type: Boolean, default: false },
  status: { type: String, enum: ['Healthy/Suitable', 'Attention Required', 'Critical'], default: 'Healthy/Suitable' },
  pump_status: { type: Boolean, default: false },
  is_simulated: { type: Boolean, default: true }
}, { timestamps: true });

module.exports = mongoose.model('SensorReading', sensorReadingSchema);
