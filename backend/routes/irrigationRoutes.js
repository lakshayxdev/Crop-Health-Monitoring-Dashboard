const express = require('express');
const router = express.Router();

let currentPumpMode = 'automatic';
let simulatedPumpState = false;

router.get('/status', (req, res) => {
  res.json({
    success: true,
    data: {
      mode: currentPumpMode,
      pump_running: simulatedPumpState
    }
  });
});

router.post('/control', (req, res) => {
  const { mode, pump_running } = req.body;
  if (mode) currentPumpMode = mode;
  if (pump_running !== undefined) simulatedPumpState = pump_running;

  res.json({
    success: true,
    message: 'Irrigation control updated successfully',
    data: {
      mode: currentPumpMode,
      pump_running: simulatedPumpState
    }
  });
});

module.exports = router;
