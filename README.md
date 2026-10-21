# FleetTrack — Fleet Telematics System

**Fleet Telematics System for Vehicle Tracking and Management — Case Study: University of Ibadan**
CSC 302 Group A60 prototype.

A front-end prototype built with plain **HTML, CSS and JavaScript** (no framework, no build step).

## Run it

Open `index.html` in a browser, or serve the folder:

```bash
python3 -m http.server 8000   # then open http://localhost:8000
```

Demo login: `admin` / `admin123`

## Pages (match Chapter 4 interface design)

| Page | What it does | Requirement (Ch. 3.4) |
| --- | --- | --- |
| Login (`index.html`) | Blocks protected pages until signed in | Authenticate users |
| Dashboard | Fleet totals, weekly trips chart, maintenance alerts, live mini-map | Display latest location, alerts |
| Vehicles | Add / edit / search / delete vehicles | Manage vehicle records |
| Live Tracking | Map of campus with moving vehicles, route trail, over-speed flag | Store + display location |
| Drivers | Driver records and vehicle assignment | Manage driver information |
| Trip Records | Log trips with validation | Record and retrieve trips |
| Maintenance | Service history, next due date, overdue status | Maintenance records & reminders |
| Reports | Per-vehicle report by date range, CSV export, print to PDF | Basic reports |

## How it works

- **Data** (`js/data.js`): tables match the ER design — users, vehicles, drivers, trips, locations, maintenance — saved in the browser's `localStorage`.
- **GPS simulation**: there is no tracking hardware, so every 5 seconds each *Active* vehicle gets a new location record (vehicle_id, latitude, longitude, speed, timestamp) along an approximate route around UI campus. This stands in for the GPS/GSM device described in Chapter 4.
- **Map**: [Leaflet](https://leafletjs.com) with CARTO tiles (OpenStreetMap data) (needs internet; everything else works offline).

## Limitations (be honest about these in Chapter 5)

- No server or real database: data lives only in one browser. Login is a demo check, **not real security** — a production system needs server-side password hashing, sessions and role checks (Chapter 3.11).
- Location data is simulated; campus coordinates are approximate.
- Future work: backend (PHP/Node.js + MySQL/PostgreSQL), real GPS tracker over MQTT/HTTP, geofencing, fuel-theft detection, driver RFID.

## Project structure

```
index.html  dashboard.html  vehicles.html  tracking.html
drivers.html  trips.html  maintenance.html  reports.html
css/style.css
js/data.js       data store, sample data, GPS simulation
js/app.js        login check, sidebar, helpers
js/crud.js       shared add/edit/search table logic
js/dashboard.js  js/tracking.js
```
