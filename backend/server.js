const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');

require('dotenv').config({
  path: path.join(__dirname, '.env.example')
});

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI;

if (!MONGO_URI) {
  console.error('MONGO_URI is missing from backend/.env');
  process.exit(1);
}

app.use('/api/crops', require('./routes/cropRoutes'));
app.use('/api/sensors', require('./routes/sensorRoutes'));
app.use('/api/irrigation', require('./routes/irrigationRoutes'));
app.use('/api/alerts', require('./routes/alertRoutes'));

app.get('/', (req, res) => {
  res.json({
    project: 'IoT-Based Adaptive Crop Health Monitoring',
    status: 'Running'
  });
});

async function startServer() {
  try {
    await mongoose.connect(MONGO_URI);

    console.log('MongoDB connected successfully');
    console.log('Database:', mongoose.connection.name);

    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error('MongoDB connection failed:', error.message);
    process.exit(1);
  }
}

startServer();