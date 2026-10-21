// Data layer: everything is kept in the browser's localStorage.
// The tables mirror the ER design in Chapter 3 (users, vehicles, drivers, trips, locations, maintenance).

const DB_KEY = "fleettrack_db_v1";

// Approximate points around the University of Ibadan campus (for simulation only).
const CAMPUS_ROUTE = [
  [7.4433, 3.8998], // Main gate area
  [7.4446, 3.8975],
  [7.4462, 3.8952], // Towards Faculty area
  [7.4480, 3.8931],
  [7.4497, 3.8912], // Kenneth Dike Library area
  [7.4512, 3.8935],
  [7.4505, 3.8961],
  [7.4489, 3.8984], // Halls of residence area
  [7.4470, 3.9003],
  [7.4451, 3.9010],
];

const CAMPUS_CENTER = [7.4470, 3.8960];
const SPEED_LIMIT_KMH = 40; // campus speed limit used for over-speed alerts

function seedData() {
  const today = new Date();
  const daysAgo = (n) => new Date(today.getTime() - n * 86400000).toISOString().slice(0, 10);
  const daysAhead = (n) => new Date(today.getTime() + n * 86400000).toISOString().slice(0, 10);

  return {
    users: [
      // Demo only. A real system must hash passwords on a server (see README).
      { user_id: 1, username: "admin", password: "admin123", name: "Admin User", role: "Fleet Manager" },
    ],
    vehicles: [
      { vehicle_id: 1, plate_number: "UI-BUS-001", model: "Toyota Coaster", type: "Bus", status: "Active", odometer: 48210 },
      { vehicle_id: 2, plate_number: "UI-BUS-002", model: "Toyota Coaster", type: "Bus", status: "Active", odometer: 51877 },
      { vehicle_id: 3, plate_number: "UI-BUS-003", model: "Mercedes Sprinter", type: "Bus", status: "Active", odometer: 39540 },
      { vehicle_id: 4, plate_number: "UI-VAN-011", model: "Toyota Hiace", type: "Van", status: "Active", odometer: 72330 },
      { vehicle_id: 5, plate_number: "UI-UTL-021", model: "Toyota Hilux", type: "Utility", status: "Active", odometer: 88412 },
      { vehicle_id: 6, plate_number: "UI-CAR-031", model: "Toyota Corolla", type: "Car", status: "Idle", odometer: 60215 },
      { vehicle_id: 7, plate_number: "UI-AMB-041", model: "Toyota Hiace Ambulance", type: "Ambulance", status: "Idle", odometer: 31002 },
      { vehicle_id: 8, plate_number: "UI-TRK-051", model: "Isuzu NPR", type: "Truck", status: "Maintenance", odometer: 120544 },
    ],
    drivers: [
      { driver_id: 1, name: "Adewale Ogunbiyi", phone: "08031234567", licence_number: "OYO-12345AB", vehicle_id: 1 },
      { driver_id: 2, name: "Funke Adeyemi", phone: "08029876543", licence_number: "OYO-22871CD", vehicle_id: 2 },
      { driver_id: 3, name: "Musa Bello", phone: "07061112233", licence_number: "OYO-33910EF", vehicle_id: 3 },
      { driver_id: 4, name: "Chinedu Okafor", phone: "08134445566", licence_number: "OYO-44120GH", vehicle_id: 4 },
      { driver_id: 5, name: "Tunde Bakare", phone: "09057778899", licence_number: "OYO-55302IJ", vehicle_id: 5 },
      { driver_id: 6, name: "Grace Olawale", phone: "08160001122", licence_number: "OYO-66781KL", vehicle_id: null },
    ],
    trips: [
      { trip_id: 1, vehicle_id: 1, driver_id: 1, start_time: daysAgo(1) + "T07:30", end_time: daysAgo(1) + "T08:10", start_location: "Main Gate", end_location: "Faculty of Science", distance_km: 6.2 },
      { trip_id: 2, vehicle_id: 2, driver_id: 2, start_time: daysAgo(1) + "T09:00", end_time: daysAgo(1) + "T09:35", start_location: "Indy Hall", end_location: "Kenneth Dike Library", distance_km: 4.1 },
      { trip_id: 3, vehicle_id: 4, driver_id: 4, start_time: daysAgo(2) + "T11:15", end_time: daysAgo(2) + "T12:40", start_location: "Bursary", end_location: "UCH Ibadan", distance_km: 14.8 },
      { trip_id: 4, vehicle_id: 5, driver_id: 5, start_time: daysAgo(3) + "T13:00", end_time: daysAgo(3) + "T13:50", start_location: "Works Dept.", end_location: "Zoological Garden", distance_km: 5.5 },
      { trip_id: 5, vehicle_id: 3, driver_id: 3, start_time: daysAgo(4) + "T15:20", end_time: daysAgo(4) + "T16:00", start_location: "Main Gate", end_location: "Agbowo Gate", distance_km: 7.3 },
      { trip_id: 6, vehicle_id: 1, driver_id: 1, start_time: daysAgo(5) + "T07:45", end_time: daysAgo(5) + "T08:20", start_location: "Main Gate", end_location: "Trenchard Hall", distance_km: 5.9 },
    ],
    locations: [],
    maintenance: [
      { maintenance_id: 1, vehicle_id: 8, service_date: daysAgo(2), description: "Gearbox repair", next_due_date: daysAhead(5), cost: 185000 },
      { maintenance_id: 2, vehicle_id: 1, service_date: daysAgo(40), description: "Oil and filter change", next_due_date: daysAhead(3), cost: 35000 },
      { maintenance_id: 3, vehicle_id: 4, service_date: daysAgo(70), description: "Brake pads replaced", next_due_date: daysAgo(4), cost: 48000 },
      { maintenance_id: 4, vehicle_id: 6, service_date: daysAgo(15), description: "Tyre rotation", next_due_date: daysAhead(60), cost: 12000 },
    ],
  };
}

const DB = {
  load() {
    try {
      const raw = localStorage.getItem(DB_KEY);
      if (raw) return JSON.parse(raw);
    } catch (e) { /* storage unavailable or corrupt: fall back to seed data */ }
    const data = seedData();
    this.save(data);
    return data;
  },
  save(data) {
    try { localStorage.setItem(DB_KEY, JSON.stringify(data)); } catch (e) { /* ignore */ }
  },
  reset() {
    localStorage.removeItem(DB_KEY);
    return this.load();
  },
  nextId(rows, key) {
    return rows.reduce((max, r) => Math.max(max, r[key]), 0) + 1;
  },
};

// ---------- GPS simulation ----------
// Each "Active" vehicle moves along the campus route. Every tick stores a
// location record (vehicle_id, latitude, longitude, speed, recorded_at),
// just like a real GPS tracker would send to the server.

const MAX_POINTS_PER_VEHICLE = 100;

function simulateTick(data) {
  const now = new Date().toISOString();
  data.vehicles.filter((v) => v.status === "Active").forEach((v) => {
    const history = data.locations.filter((l) => l.vehicle_id === v.vehicle_id);
    const last = history[history.length - 1];
    const step = last ? (last.route_index + 1) % CAMPUS_ROUTE.length : (v.vehicle_id * 3) % CAMPUS_ROUTE.length;
    const [lat, lng] = CAMPUS_ROUTE[step];
    const jitter = () => (Math.random() - 0.5) * 0.0004;
    const speed = Math.round(15 + Math.random() * 35); // 15–50 km/h
    const reading = { lat: +(lat + jitter()).toFixed(6), lng: +(lng + jitter()).toFixed(6) };
    if (!isValidCoordinate(reading.lat, reading.lng)) return; // reject bad readings
    data.locations.push({
      location_id: DB.nextId(data.locations, "location_id"),
      vehicle_id: v.vehicle_id,
      latitude: reading.lat,
      longitude: reading.lng,
      speed_kmh: speed,
      route_index: step,
      recorded_at: now,
    });
    v.odometer += Math.round(speed / 60); // rough distance per tick
    if (history.length + 1 > MAX_POINTS_PER_VEHICLE) {
      const oldest = history[0];
      data.locations = data.locations.filter((l) => l !== oldest);
    }
  });
  DB.save(data);
}

function latestLocation(data, vehicleId) {
  for (let i = data.locations.length - 1; i >= 0; i--) {
    if (data.locations[i].vehicle_id === vehicleId) return data.locations[i];
  }
  return null;
}

// Validation used before storing a location (Chapter 3, section 3.8).
function isValidCoordinate(lat, lng) {
  return typeof lat === "number" && typeof lng === "number" && lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180;
}
