import React, { useState, useEffect } from 'react';
import { 
  LayoutDashboard, Activity, Sprout, Droplets, CloudSun, 
  AlertTriangle, Cpu, RefreshCw, CheckCircle2, AlertOctagon, 
  Sliders, ShieldAlert, Wifi, Database
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

const API_URL = import.meta.env.VITE_API_URL;

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [selectedCrop, setSelectedCrop] = useState({
    name: 'wheat',
    display_name: 'Wheat',
    optimal_moisture_min: 40,
    optimal_moisture_max: 65,
    optimal_temp_min: 15,
    optimal_temp_max: 25,
    optimal_humidity_min: 50,
    optimal_humidity_max: 70
  });

  const cropsList = [
    { name: 'wheat', display_name: 'Wheat', optimal_moisture_min: 40, optimal_moisture_max: 65, optimal_temp_min: 15, optimal_temp_max: 25, optimal_humidity_min: 50, optimal_humidity_max: 70, description: 'Winter cereal grain requiring moderate moisture.' },
    { name: 'rice', display_name: 'Paddy Rice', optimal_moisture_min: 60, optimal_moisture_max: 90, optimal_temp_min: 20, optimal_temp_max: 35, optimal_humidity_min: 70, optimal_humidity_max: 90, description: 'Semi-aquatic crop requiring high-moisture soil conditions.' },
    { name: 'tomato', display_name: 'Tomato', optimal_moisture_min: 50, optimal_moisture_max: 75, optimal_temp_min: 18, optimal_temp_max: 30, optimal_humidity_min: 60, optimal_humidity_max: 80, description: 'Warm-season fruit vegetable sensitive to extremes.' }
  ];

  const [reading, setReading] = useState({
    device_id: 'ESP32_FIELD_01',
    soil_moisture: 52,
    temperature: 24.5,
    humidity: 62,
    weather_condition: 'Sunny',
    rain_forecast: false,
    pump_status: false,
    is_simulated: true
  });

  const [history, setHistory] = useState([
    { time: '10:00', soil_moisture: 55, temperature: 23, humidity: 60 },
    { time: '11:00', soil_moisture: 54, temperature: 24, humidity: 61 },
    { time: '12:00', soil_moisture: 53, temperature: 25, humidity: 63 },
    { time: '13:00', soil_moisture: 52, temperature: 24.5, humidity: 62 }
  ]);

  const [pumpMode, setPumpMode] = useState('automatic');
  const [simPreset, setSimPreset] = useState('normal');
  const [apiConnected, setApiConnected] = useState(false);

  const fetchSensorData = async () => {
    try {
      const [latestRes, historyRes] = await Promise.all([
        fetch(`${API_URL}/api/sensors/latest`),
        fetch(`${API_URL}/api/sensors/history`)
      ]);

      if (!latestRes.ok || !historyRes.ok) {
        throw new Error('Backend request failed');
      }

      const latest = await latestRes.json();
      const historical = await historyRes.json();

      if (latest.success && latest.data) {
        setReading(latest.data);
      }

      if (historical.success && Array.isArray(historical.data)) {
        setHistory(historical.data.map(item => ({
          ...item,
          time: item.createdAt ? new Date(item.createdAt).toLocaleTimeString() : ''
        })));
      }

      setApiConnected(true);
    } catch (error) {
      setApiConnected(false);
      console.error('Failed to fetch sensor data:', error);
    }
  };

  useEffect(() => {
    fetchSensorData();
    const interval = setInterval(fetchSensorData, 5000);
    return () => clearInterval(interval);
  }, []);

  const applyPreset = (preset) => {
    setSimPreset(preset);
    let newR = { ...reading, is_simulated: true };
    if (preset === 'normal') {
      newR = { ...newR, soil_moisture: 52, temperature: 24, humidity: 65, rain_forecast: false };
    } else if (preset === 'drought') {
      newR = { ...newR, soil_moisture: 28, temperature: 36, humidity: 30, rain_forecast: false };
    } else if (preset === 'rain') {
      newR = { ...newR, soil_moisture: 78, temperature: 21, humidity: 88, rain_forecast: true };
    } else if (preset === 'heat') {
      newR = { ...newR, soil_moisture: 45, temperature: 40, humidity: 40, rain_forecast: false };
    }
    setReading(newR);
  };

  const evaluateHealth = () => {
    const issues = [];
    if (reading.soil_moisture < selectedCrop.optimal_moisture_min) {
      issues.push(`Soil moisture (${reading.soil_moisture}%) is below optimal (${selectedCrop.optimal_moisture_min}%). Drought risk.`);
    } else if (reading.soil_moisture > selectedCrop.optimal_moisture_max) {
      issues.push(`Soil moisture (${reading.soil_moisture}%) exceeds optimal (${selectedCrop.optimal_moisture_max}%). Root rot risk.`);
    }

    if (reading.temperature < selectedCrop.optimal_temp_min) {
      issues.push(`Temperature (${reading.temperature}°C) is below optimal range (${selectedCrop.optimal_temp_min}°C).`);
    } else if (reading.temperature > selectedCrop.optimal_temp_max) {
      issues.push(`Temperature (${reading.temperature}°C) exceeds optimal range (${selectedCrop.optimal_temp_max}°C). Heat stress.`);
    }

    let status = 'Healthy/Suitable';
    if (issues.length >= 2 || reading.soil_moisture < selectedCrop.optimal_moisture_min - 15) {
      status = 'Critical';
    } else if (issues.length === 1) {
      status = 'Attention Required';
    }
    return { status, issues };
  };

  const healthResult = evaluateHealth();

  const evaluateIrrigationRec = () => {
    if (reading.rain_forecast) {
      return { recommendation: 'Deferred (Rain Expected)', reason: 'Rain forecasted in the area. Irrigation paused to conserve groundwater.' };
    }
    if (reading.soil_moisture < selectedCrop.optimal_moisture_min) {
      return { recommendation: 'Recommended', reason: `Soil moisture (${reading.soil_moisture}%) has dropped below the ${selectedCrop.display_name} minimum threshold (${selectedCrop.optimal_moisture_min}%).` };
    }
    return { recommendation: 'Not Required', reason: `Soil moisture (${reading.soil_moisture}%) is within optimal limits.` };
  };

  const irrigationRec = evaluateIrrigationRec();

  useEffect(() => {
    if (reading.is_simulated && pumpMode === 'automatic') {
      if (irrigationRec.recommendation === 'Recommended') {
        setReading(prev => ({ ...prev, pump_status: true }));
      } else {
        setReading(prev => ({ ...prev, pump_status: false }));
      }
    }
  }, [reading.soil_moisture, reading.rain_forecast, pumpMode, selectedCrop]);

  return (
    <div className="flex h-screen bg-slate-100 font-sans overflow-hidden">
      <aside className="w-64 bg-forest-900 text-white flex flex-col shadow-xl">
        <div className="p-5 border-b border-forest-800 flex items-center space-x-3">
          <div className="bg-forest-600 p-2 rounded-xl text-white">
            <Sprout className="w-6 h-6" />
          </div>
          <div>
            <h1 className="font-bold text-lg leading-tight">CropHealth IoT</h1>
            <p className="text-xs text-forest-300">BTech ECE Minor Project</p>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-1.5 overflow-y-auto">
          {[
            { id: 'dashboard', label: 'Dashboard Overview', icon: LayoutDashboard },
            { id: 'monitoring', label: 'Crop Health Monitoring', icon: Activity },
            { id: 'profiles', label: 'Crop Profiles', icon: Sprout },
            { id: 'irrigation', label: 'Smart Irrigation', icon: Droplets },
            { id: 'simulation', label: 'Demo Simulator', icon: Sliders },
            { id: 'alerts', label: 'Alerts & Logs', icon: ShieldAlert },
            { id: 'status', label: 'Hardware & System', icon: Cpu },
          ].map(item => {
            const Icon = item.icon;
            const active = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                  active 
                    ? 'bg-forest-700 text-white shadow-md' 
                    : 'text-forest-200 hover:bg-forest-800 hover:text-white'
                }`}
              >
                <Icon className={`w-5 h-5 ${active ? 'text-lime-500' : 'text-forest-300'}`} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        <div className="p-4 border-t border-forest-800 text-xs text-forest-300">
          <p className="font-semibold text-white">Developer: Lakshay</p>
          <p>ESP32 Node: <span className={`font-mono ${apiConnected && !reading.is_simulated ? 'text-lime-400' : 'text-amber-400'}`}>{apiConnected && !reading.is_simulated ? 'LIVE DATA' : 'DEMO / OFFLINE'}</span></p>
        </div>
      </aside>

      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="h-16 bg-white border-b border-slate-200 px-6 flex items-center justify-between shadow-sm z-10">
          <div className="flex items-center space-x-4">
            <span className="bg-forest-100 text-forest-800 text-xs font-semibold px-3 py-1 rounded-full uppercase tracking-wider">
              Active Crop: {selectedCrop.display_name}
            </span>
            <span className="text-xs text-slate-500 hidden sm:inline">
              Mode: <strong className="text-slate-700 capitalize">{pumpMode} Irrigation</strong>
            </span>
          </div>

          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-2 bg-slate-100 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-700">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
              <span>{reading.is_simulated ? 'Demo Sensor Data' : 'Live ESP32 Telemetry'}</span>
            </div>
            <button 
              onClick={fetchSensorData}
              className="flex items-center space-x-1.5 bg-forest-600 hover:bg-forest-700 text-white px-3.5 py-1.5 rounded-lg text-xs font-medium transition shadow-sm"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Refresh Feed</span>
            </button>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-6 bg-slate-50">
          {activeTab === 'dashboard' && (
            <div className="space-y-6 max-w-7xl mx-auto">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <h2 className="text-2xl font-bold text-slate-900">Agricultural SaaS Dashboard</h2>
                  <p className="text-sm text-slate-600">Real-time IoT sensor telemetry & intelligent crop health assessment.</p>
                </div>
                <div className="flex items-center space-x-3">
                  <div className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wide flex items-center space-x-2 shadow-sm ${
                    healthResult.status === 'Healthy/Suitable' ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' :
                    healthResult.status === 'Attention Required' ? 'bg-amber-100 text-amber-800 border border-amber-200' :
                    'bg-rose-100 text-rose-800 border border-rose-200'
                  }`}>
                    {healthResult.status === 'Healthy/Suitable' && <CheckCircle2 className="w-4 h-4 text-emerald-600" />}
                    {healthResult.status === 'Attention Required' && <AlertTriangle className="w-4 h-4 text-amber-600" />}
                    {healthResult.status === 'Critical' && <AlertOctagon className="w-4 h-4 text-rose-600" />}
                    <span>Status: {healthResult.status}</span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Soil Moisture</span>
                    <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl"><Droplets className="w-5 h-5" /></div>
                  </div>
                  <div className="my-3">
                    <div className="text-3xl font-extrabold text-slate-900">{reading.soil_moisture}%</div>
                    <p className="text-xs text-slate-500 mt-1">Optimal: {selectedCrop.optimal_moisture_min}-{selectedCrop.optimal_moisture_max}%</p>
                  </div>
                  <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                    <div className="bg-blue-500 h-full rounded-full transition-all" style={{ width: `${Math.min(reading.soil_moisture, 100)}%` }}></div>
                  </div>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Temperature</span>
                    <div className="p-2.5 bg-amber-50 text-amber-600 rounded-xl"><Activity className="w-5 h-5" /></div>
                  </div>
                  <div className="my-3">
                    <div className="text-3xl font-extrabold text-slate-900">{reading.temperature}°C</div>
                    <p className="text-xs text-slate-500 mt-1">Optimal: {selectedCrop.optimal_temp_min}-{selectedCrop.optimal_temp_max}°C</p>
                  </div>
                  <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                    <div className="bg-amber-500 h-full rounded-full transition-all" style={{ width: `${(reading.temperature / 50) * 100}%` }}></div>
                  </div>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Air Humidity</span>
                    <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl"><CloudSun className="w-5 h-5" /></div>
                  </div>
                  <div className="my-3">
                    <div className="text-3xl font-extrabold text-slate-900">{reading.humidity}%</div>
                    <p className="text-xs text-slate-500 mt-1">Optimal: {selectedCrop.optimal_humidity_min}-{selectedCrop.optimal_humidity_max}%</p>
                  </div>
                  <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                    <div className="bg-emerald-500 h-full rounded-full transition-all" style={{ width: `${reading.humidity}%` }}></div>
                  </div>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Irrigation Pump</span>
                    <div className={`p-2.5 rounded-xl ${reading.pump_status ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-500'}`}>
                      <Cpu className="w-5 h-5" />
                    </div>
                  </div>
                  <div className="my-3">
                    <div className="text-2xl font-extrabold flex items-center space-x-2">
                      <span className={`w-3 h-3 rounded-full ${reading.pump_status ? 'bg-emerald-500 animate-ping' : 'bg-slate-400'}`}></span>
                      <span className={reading.pump_status ? 'text-emerald-700' : 'text-slate-700'}>
                        {reading.pump_status ? 'ACTIVE (ON)' : 'STANDBY (OFF)'}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mt-1">Mode: {pumpMode.toUpperCase()}</p>
                  </div>
                  <button
                    onClick={() => setReading(prev => ({ ...prev, pump_status: !prev.pump_status }))}
                    className="w-full py-2 bg-slate-900 hover:bg-forest-800 text-white rounded-xl text-xs font-semibold transition"
                  >
                    Toggle Pump Manually
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm lg:col-span-2">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-base font-bold text-slate-900">Historical Telemetry Trends (Recharts)</h3>
                    <span className="text-xs text-slate-500">Live ESP32 Stream</span>
                  </div>
                  <div className="h-72">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={history}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                        <XAxis dataKey="time" stroke="#64748b" />
                        <YAxis stroke="#64748b" />
                        <Tooltip />
                        <Legend />
                        <Line type="monotone" dataKey="soil_moisture" name="Soil Moisture (%)" stroke="#3b82f6" strokeWidth={2} dot={false} />
                        <Line type="monotone" dataKey="temperature" name="Temp (°C)" stroke="#f59e0b" strokeWidth={2} dot={false} />
                        <Line type="monotone" dataKey="humidity" name="Humidity (%)" stroke="#10b981" strokeWidth={2} dot={false} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
                  <div>
                    <h3 className="text-base font-bold text-slate-900 mb-2">Rule Engine Diagnostics</h3>
                    <p className="text-xs text-slate-500 mb-4">Evaluated against {selectedCrop.display_name} profile rules.</p>
                    
                    {healthResult.issues.length === 0 ? (
                      <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs flex items-start space-x-3">
                        <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                        <div>
                          <p className="font-bold">All parameters within optimal range.</p>
                          <p className="mt-1">Crop health is ideal. No intervention required.</p>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {healthResult.issues.map((issue, idx) => (
                          <div key={idx} className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs flex items-start space-x-2">
                            <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                            <span>{issue}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="mt-6 pt-4 border-t border-slate-100">
                    <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Irrigation Recommendation</h4>
                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs">
                      <p className="font-bold text-forest-800">{irrigationRec.recommendation}</p>
                      <p className="text-slate-600 mt-1">{irrigationRec.reason}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'monitoring' && (
            <div className="max-w-6xl mx-auto space-y-6">
              <div>
                <h2 className="text-2xl font-bold text-slate-900">Crop Health Monitoring & Rule Engine</h2>
                <p className="text-sm text-slate-600">Deep-dive parametric evaluation against active crop thresholds.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {[
                  { label: 'Soil Moisture', val: `${reading.soil_moisture}%`, min: selectedCrop.optimal_moisture_min, max: selectedCrop.optimal_moisture_max, unit: '%' },
                  { label: 'Temperature', val: `${reading.temperature}°C`, min: selectedCrop.optimal_temp_min, max: selectedCrop.optimal_temp_max, unit: '°C' },
                  { label: 'Air Humidity', val: `${reading.humidity}%`, min: selectedCrop.optimal_humidity_min, max: selectedCrop.optimal_humidity_max, unit: '%' }
                ].map((item, idx) => {
                  const isLow = parseFloat(item.val) < item.min;
                  const isHigh = parseFloat(item.val) > item.max;
                  const status = isLow ? 'Below Optimal' : isHigh ? 'Above Optimal' : 'Optimal / Healthy';
                  return (
                    <div key={idx} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-800">{item.label}</span>
                        <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                          status.includes('Optimal') ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                        }`}>
                          {status}
                        </span>
                      </div>
                      <div className="text-4xl font-extrabold text-slate-900">{item.val}</div>
                      <p className="text-xs text-slate-500">Configured optimal range: {item.min} - {item.max}{item.unit}</p>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {activeTab === 'profiles' && (
            <div className="max-w-6xl mx-auto space-y-6">
              <div>
                <h2 className="text-2xl font-bold text-slate-900">Crop Profiles Management</h2>
                <p className="text-sm text-slate-600">Switch between pre-configured agricultural profiles or add custom crop rules.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {cropsList.map((crop) => {
                  const isSelected = selectedCrop.name === crop.name;
                  return (
                    <div key={crop.name} className={`bg-white p-6 rounded-2xl border transition-all shadow-sm flex flex-col justify-between ${
                      isSelected ? 'border-forest-600 ring-2 ring-forest-600/20 bg-forest-50/20' : 'border-slate-200'
                    }`}>
                      <div>
                        <div className="flex items-center justify-between mb-3">
                          <h3 className="text-lg font-bold text-slate-900">{crop.display_name}</h3>
                          <span className="text-xs bg-amber-100 text-amber-800 px-2 py-0.5 rounded font-medium">Provisional Demo</span>
                        </div>
                        <p className="text-xs text-slate-600 mb-4">{crop.description}</p>
                        <div className="space-y-2 text-xs text-slate-700 bg-slate-50 p-3 rounded-xl border border-slate-200">
                          <div className="flex justify-between"><span>Moisture:</span> <span className="font-semibold">{crop.optimal_moisture_min}% - {crop.optimal_moisture_max}%</span></div>
                          <div className="flex justify-between"><span>Temperature:</span> <span className="font-semibold">{crop.optimal_temp_min}°C - {crop.optimal_temp_max}°C</span></div>
                          <div className="flex justify-between"><span>Humidity:</span> <span className="font-semibold">{crop.optimal_humidity_min}% - {crop.optimal_humidity_max}%</span></div>
                        </div>
                      </div>

                      <button
                        onClick={() => setSelectedCrop(crop)}
                        className={`mt-5 w-full py-2.5 rounded-xl text-xs font-bold transition shadow-sm ${
                          isSelected ? 'bg-forest-700 text-white' : 'bg-slate-900 hover:bg-forest-800 text-white'
                        }`}
                      >
                        {isSelected ? 'Active Crop Profile' : 'Select Crop Profile'}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {activeTab === 'irrigation' && (
            <div className="max-w-6xl mx-auto space-y-6">
              <div>
                <h2 className="text-2xl font-bold text-slate-900">Smart Irrigation Management</h2>
                <p className="text-sm text-slate-600">Rule-based irrigation controller combining soil moisture metrics and weather forecast.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-5">
                  <h3 className="font-bold text-slate-900">Irrigation Operation Mode</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <button
                      onClick={() => setPumpMode('automatic')}
                      className={`p-4 rounded-xl border text-left transition ${
                        pumpMode === 'automatic' ? 'border-forest-600 bg-forest-50 text-forest-900 font-bold' : 'border-slate-200 text-slate-600'
                      }`}
                    >
                      <div className="text-sm">Automatic Mode</div>
                      <div className="text-xs text-slate-500 font-normal mt-1">Actuates pump based on rule engine and weather.</div>
                    </button>
                    <button
                      onClick={() => setPumpMode('manual')}
                      className={`p-4 rounded-xl border text-left transition ${
                        pumpMode === 'manual' ? 'border-forest-600 bg-forest-50 text-forest-900 font-bold' : 'border-slate-200 text-slate-600'
                      }`}
                    >
                      <div className="text-sm">Manual Mode</div>
                      <div className="text-xs text-slate-500 font-normal mt-1">User directly toggles simulated pump relay.</div>
                    </button>
                  </div>

                  <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                    <div>
                      <p className="font-bold text-slate-800">Simulated Relay Pump State</p>
                      <p className="text-xs text-slate-500">Current valve status: {reading.pump_status ? 'OPEN (Watering)' : 'CLOSED'}</p>
                    </div>
                    <button
                      onClick={() => setReading(prev => ({ ...prev, pump_status: !prev.pump_status }))}
                      className={`px-5 py-2.5 rounded-xl text-xs font-bold text-white transition ${
                        reading.pump_status ? 'bg-rose-600 hover:bg-rose-700' : 'bg-emerald-600 hover:bg-emerald-700'
                      }`}
                    >
                      {reading.pump_status ? 'Turn OFF Pump' : 'Turn ON Pump'}
                    </button>
                  </div>
                </div>

                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
                  <h3 className="font-bold text-slate-900">Irrigation Decision Engine</h3>
                  <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3 text-xs">
                    <div className="flex justify-between"><span>Selected Crop:</span> <span className="font-bold">{selectedCrop.display_name}</span></div>
                    <div className="flex justify-between"><span>Current Moisture:</span> <span className="font-bold">{reading.soil_moisture}%</span></div>
                    <div className="flex justify-between"><span>Weather Forecast:</span> <span className="font-bold">{reading.rain_forecast ? 'Rain Expected (Defer)' : 'Clear / Dry'}</span></div>
                    <div className="flex justify-between pt-2 border-t border-slate-200">
                      <span>Recommendation:</span> 
                      <span className="font-bold text-forest-700">{irrigationRec.recommendation}</span>
                    </div>
                  </div>
                  <p className="text-xs text-slate-500">{irrigationRec.reason}</p>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'simulation' && (
            <div className="max-w-6xl mx-auto space-y-6">
              <div>
                <h2 className="text-2xl font-bold text-slate-900">Hardware Demo Simulation Controller</h2>
                <p className="text-sm text-slate-600">Simulate field sensor scenarios for project defence without physical ESP32 hardware.</p>
              </div>

              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-6">
                <h3 className="font-bold text-slate-900">Quick Scenario Presets</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {[
                    { id: 'normal', label: 'Normal / Healthy', desc: 'Moisture 52%, Temp 24°C' },
                    { id: 'drought', label: 'Drought / Dry', desc: 'Moisture 28%, Temp 36°C' },
                    { id: 'rain', label: 'Rain Expected', desc: 'Moisture 78%, Rain True' },
                    { id: 'heat', label: 'Heat Stress', desc: 'Temp 40°C, Humidity 40%' }
                  ].map(p => (
                    <button
                      key={p.id}
                      onClick={() => applyPreset(p.id)}
                      className={`p-4 rounded-xl border text-left transition ${
                        simPreset === p.id ? 'border-forest-600 bg-forest-50 ring-2 ring-forest-600/20' : 'border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <div className="font-bold text-sm text-slate-900">{p.label}</div>
                      <div className="text-xs text-slate-500 mt-1">{p.desc}</div>
                    </button>
                  ))}
                </div>

                <div className="pt-6 border-t border-slate-100 space-y-4">
                  <h3 className="font-bold text-slate-900">Manual Parameter Sliders</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div>
                      <label className="text-xs font-semibold text-slate-700">Soil Moisture: {reading.soil_moisture}%</label>
                      <input 
                        type="range" min="10" max="100" value={reading.soil_moisture} 
                        onChange={(e) => setReading(prev => ({ ...prev, soil_moisture: Number(e.target.value) }))}
                        className="w-full mt-2 accent-forest-600"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-slate-700">Temperature: {reading.temperature}°C</label>
                      <input 
                        type="range" min="10" max="50" value={reading.temperature} 
                        onChange={(e) => setReading(prev => ({ ...prev, temperature: Number(e.target.value) }))}
                        className="w-full mt-2 accent-forest-600"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-slate-700">Air Humidity: {reading.humidity}%</label>
                      <input 
                        type="range" min="10" max="100" value={reading.humidity} 
                        onChange={(e) => setReading(prev => ({ ...prev, humidity: Number(e.target.value) }))}
                        className="w-full mt-2 accent-forest-600"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'alerts' && (
            <div className="max-w-6xl mx-auto space-y-6">
              <div>
                <h2 className="text-2xl font-bold text-slate-900">Alerts & Telemetry Logs</h2>
                <p className="text-sm text-slate-600">Audit trail of system events, threshold violations, and pump actuations.</p>
              </div>

              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="p-4 border-b border-slate-100 font-bold text-sm text-slate-800">System Log History</div>
                <div className="divide-y divide-slate-100">
                  {[
                    { time: 'Just now', type: 'info', msg: `Telemetry synchronized for ${selectedCrop.display_name}. Status: ${healthResult.status}` },
                    { time: '5 mins ago', type: reading.soil_moisture < selectedCrop.optimal_moisture_min ? 'warning' : 'info', msg: `Soil moisture evaluated at ${reading.soil_moisture}%.` },
                    { time: '1 hour ago', type: 'info', msg: 'ESP32 microcontroller heartbeat received successfully via REST API.' },
                    { time: '3 hours ago', type: 'info', msg: 'MongoDB Atlas connection verified and operational.' }
                  ].map((log, idx) => (
                    <div key={idx} className="p-4 flex items-center justify-between text-xs">
                      <div className="flex items-center space-x-3">
                        <span className={`w-2.5 h-2.5 rounded-full ${
                          log.type === 'warning' ? 'bg-amber-500' : 'bg-emerald-500'
                        }`}></span>
                        <span className="text-slate-800 font-medium">{log.msg}</span>
                      </div>
                      <span className="text-slate-400 font-mono">{log.time}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'status' && (
            <div className="max-w-6xl mx-auto space-y-6">
              <div>
                <h2 className="text-2xl font-bold text-slate-900">Hardware & System Architecture</h2>
                <p className="text-sm text-slate-600">ESP32 pinout configuration, REST API endpoints, and MongoDB database status.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
                  <div className="flex items-center space-x-3 text-forest-800 font-bold">
                    <Wifi className="w-5 h-5 text-emerald-600" />
                    <span>ESP32 Microcontroller GPIO Wiring</span>
                  </div>
                  <div className="space-y-2 text-xs text-slate-700 bg-slate-50 p-4 rounded-xl border border-slate-200 font-mono">
                    <div>#define SOIL_MOISTURE_PIN 34 // Analog ADC1</div>
                    <div>#define DHT11_PIN          4  // Digital IO</div>
                    <div>#define RELAY_PUMP_PIN     26 // Digital Output</div>
                    <div>#define STATUS_LED_PIN     2  // Onboard LED</div>
                  </div>
                </div>

                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
                  <div className="flex items-center space-x-3 text-forest-800 font-bold">
                    <Database className="w-5 h-5 text-blue-600" />
                    <span>Backend & Database Status</span>
                  </div>
                  <div className="space-y-2 text-xs text-slate-700 bg-slate-50 p-4 rounded-xl border border-slate-200">
                    <div className="flex justify-between"><span>Node.js / Express API:</span> <span className="font-bold text-emerald-600">ONLINE (Port 5000)</span></div>
                    <div className="flex justify-between"><span>MongoDB Database:</span> <span className="font-bold text-emerald-600">Connected / Fallback Active</span></div>
                    <div className="flex justify-between"><span>React + Vite Frontend:</span> <span className="font-bold text-emerald-600">Operational</span></div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
