function evaluateCropHealth(reading, profile) {
  const issues = [];
  let status = 'Healthy/Suitable';

  if (!reading || reading.soil_moisture === undefined) {
    return { status: 'Unavailable', issues: ['Sensor reading unavailable or stale.'] };
  }

  if (reading.soil_moisture < profile.optimal_moisture_min) {
    issues.push(`Soil moisture (${reading.soil_moisture}%) is below optimal range (${profile.optimal_moisture_min}% - ${profile.optimal_moisture_max}%). Risk of drought stress.`);
  } else if (reading.soil_moisture > profile.optimal_moisture_max) {
    issues.push(`Soil moisture (${reading.soil_moisture}%) is above optimal range (${profile.optimal_moisture_min}% - ${profile.optimal_moisture_max}%). Risk of root waterlogging.`);
  }

  if (reading.temperature < profile.optimal_temp_min) {
    issues.push(`Temperature (${reading.temperature}°C) is below optimal range (${profile.optimal_temp_min}°C - ${profile.optimal_temp_max}°C). Growth rate slowed.`);
  } else if (reading.temperature > profile.optimal_temp_max) {
    issues.push(`Temperature (${reading.temperature}°C) exceeds optimal range (${profile.optimal_temp_min}°C - ${profile.optimal_temp_max}°C). Heat stress detected.`);
  }

  if (reading.humidity < profile.optimal_humidity_min) {
    issues.push(`Humidity (${reading.humidity}%) is below optimal range (${profile.optimal_humidity_min}% - ${profile.optimal_humidity_max}%). High transpiration rate.`);
  } else if (reading.humidity > profile.optimal_humidity_max) {
    issues.push(`Humidity (${reading.humidity}%) is above optimal range (${profile.optimal_humidity_min}% - ${profile.optimal_humidity_max}%). Fungal disease risk.`);
  }

  if (issues.length >= 2 || reading.soil_moisture < profile.optimal_moisture_min - 15 || reading.temperature > profile.optimal_temp_max + 8) {
    status = 'Critical';
  } else if (issues.length === 1) {
    status = 'Attention Required';
  } else {
    status = 'Healthy/Suitable';
  }

  return { status, issues };
}

function evaluateIrrigation(reading, profile) {
  if (!reading || reading.soil_moisture === undefined) {
    return { recommendation: 'Unavailable', reason: 'Sensor data unavailable.' };
  }

  if (reading.rain_forecast) {
    return {
      recommendation: 'Deferred (Rain Expected)',
      reason: `Rain is forecasted in the area. Irrigation deferred to prevent waterlogging and conserve groundwater.`
    };
  }

  if (reading.soil_moisture < profile.optimal_moisture_min) {
    return {
      recommendation: 'Recommended',
      reason: `Soil moisture (${reading.soil_moisture}%) has dropped below optimal threshold (${profile.optimal_moisture_min}%).`
    };
  }

  return {
    recommendation: 'Not Required',
    reason: `Soil moisture (${reading.soil_moisture}%) is within healthy limits.`
  };
}

module.exports = { evaluateCropHealth, evaluateIrrigation };
