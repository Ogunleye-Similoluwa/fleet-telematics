const user = requireLogin();
let data = DB.load();
document.getElementById("greet").textContent = `${greeting()}, ${user ? user.name.split(" ")[0] : ""} 👋`;

function renderStats() {
  const active = data.vehicles.filter((v) => v.status === "Active").length;
  const weekAgo = Date.now() - 7 * 86400000;
  const tripsWeek = data.trips.filter((t) => new Date(t.start_time) >= weekAgo).length;
  const due = data.maintenance.filter((m) => maintenanceStatus(m) !== "Scheduled").length;
  const cards = [
    ["Total vehicles", data.vehicles.length, "Fleet register"],
    ["Vehicles active", active, "On the road"],
    ["Trips this week", tripsWeek, "Last 7 days"],
    ["Drivers", data.drivers.length, "Registered drivers"],
    ["Maintenance due", due, "Overdue or due soon"],
  ];
  document.getElementById("stats").innerHTML = cards.map(([label, value, hint]) =>
    `<div class="card stat"><div class="label">${label}</div><div class="value">${value}</div><div class="hint">${hint}</div></div>`).join("");
}

function renderChart() {
  const days = [...Array(7)].map((_, i) => {
    const d = new Date(Date.now() - (6 - i) * 86400000);
    return { key: d.toISOString().slice(0, 10), label: d.toLocaleDateString("en-GB", { weekday: "short" }) };
  });
  const counts = days.map((d) => data.trips.filter((t) => t.start_time.slice(0, 10) === d.key).length);
  const max = Math.max(1, ...counts);
  document.getElementById("tripChart").innerHTML = days.map((d, i) =>
    `<div class="bar" title="${counts[i]} trip(s)"><b style="color:var(--text)">${counts[i]}</b><span style="height:${(counts[i] / max) * 100}%"></span>${d.label}</div>`).join("");
}

function renderAlerts() {
  const due = data.maintenance.filter((m) => maintenanceStatus(m) !== "Scheduled");
  document.getElementById("alerts").innerHTML = due.length
    ? due.map((m) => `<div class="list-item"><div><b>${esc(vehicleLabel(data, m.vehicle_id))}</b><div class="muted">${esc(m.description)} · due ${fmtDate(m.next_due_date)}</div></div>${statusBadge(maintenanceStatus(m))}</div>`).join("")
    : `<div class="empty">No maintenance due 🎉</div>`;
}

function renderRecent() {
  const rows = data.vehicles.map((v) => ({ v, loc: latestLocation(data, v.vehicle_id) })).filter((r) => r.loc);
  document.getElementById("recent").innerHTML = rows.length
    ? rows.map(({ v, loc }) => `<div class="list-item"><div><b>${esc(v.plate_number)}</b><div class="muted">${loc.speed_kmh} km/h · ${fmtDateTime(loc.recorded_at)}</div></div>${loc.speed_kmh > SPEED_LIMIT_KMH ? '<span class="badge red">Over speed</span>' : statusBadge(v.status)}</div>`).join("")
    : `<div class="empty">Waiting for GPS data…</div>`;
}

// Map (Leaflet). If the map library fails to load (no internet), the rest still works.
let map, markers = {};
if (window.L) {
  map = L.map("miniMap").setView(CAMPUS_CENTER, 15);
  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", { attribution: "© OpenStreetMap" }).addTo(map);
} else {
  document.getElementById("miniMap").innerHTML = '<div class="empty">Map needs an internet connection.</div>';
}

function renderMap() {
  if (!map) return;
  data.vehicles.forEach((v) => {
    const loc = latestLocation(data, v.vehicle_id);
    if (!loc) return;
    const pos = [loc.latitude, loc.longitude];
    if (markers[v.vehicle_id]) markers[v.vehicle_id].setLatLng(pos);
    else markers[v.vehicle_id] = L.marker(pos).addTo(map).bindTooltip(v.plate_number);
  });
}

function refresh() {
  data = DB.load();
  simulateTick(data);
  renderStats(); renderChart(); renderAlerts(); renderRecent(); renderMap();
}

refresh();
setInterval(refresh, 5000);
