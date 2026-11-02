
const mongoose = require('mongoose');

const cropProfileSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  display_name: { type: String, required: true },
  description: { type: String },
  optimal_moisture_min: { type: Number, required: true },
  optimal_moisture_max: { type: Number, required: true },
  optimal_temp_min: { type: Number, required: true },
  optimal_temp_max: { type: Number, required: true },
  optimal_humidity_min: { type: Number, required: true },
  optimal_humidity_max: { type: Number, required: true },
  is_provisional_demo: { type: Boolean, default: true }
}, { timestamps: true });

module.exports = mongoose.model('CropProfile', cropProfileSchema);
