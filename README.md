# IoT-Based Adaptive Crop Health Monitoring and Precision Irrigation System
**BTech ECE Minor Project**
**Developer:** Lakshay

## Project Overview
A complete full-stack agricultural SaaS prototype featuring real-time sensor monitoring, crop-specific rule engine diagnostics, smart weather-aware irrigation scheduling, and hardware simulation controls for ESP32 microcontrollers.

## Tech Stack
- **Frontend:** React, Vite, Tailwind CSS, Recharts, Lucide Icons
- **Backend:** Node.js, Express.js, Mongoose
- **Database:** MongoDB Atlas / Local MongoDB with automatic demo fallback

## Quick Start & Installation

### Backend Setup
```bash
cd backend
npm install
npm start
```

### Frontend Setup
```bash
cd frontend
npm install
npm run dev
```

## Project Defence Demonstration Sequence
1. **Dashboard Overview:** Present live telemetry and overall health status.
2. **Crop Profile Switching:** Switch between Wheat and Paddy Rice to demonstrate dynamic threshold recalculation.
3. **Rule Engine Diagnostics:** Trigger drought preset to show critical warnings and automated pump actuation.
4. **Weather Deferral:** Trigger rain preset to show irrigation suspension.
5. **Hardware Readiness:** Present ESP32 GPIO wiring and REST API endpoints.
