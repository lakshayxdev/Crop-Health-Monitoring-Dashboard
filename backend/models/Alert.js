const mongoose = require('mongoose');

const alertSchema = new mongoose.Schema({
  device_id: { type: String, default: 'ESP32_FIELD_01' },
  severity: { type: String, enum: ['info', 'warning', 'critical'], required: true },
  message: { type: String, required: true },
  parameter: { type: String },
  is_resolved: { type: Boolean, default: false }
}, { timestamps: true });

module.exports = mongoose.model('Alert', alertSchema);
