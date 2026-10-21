requireLogin();
document.getElementById("limit").textContent = SPEED_LIMIT_KMH;

let data = DB.load();
let selectedId = null;
let map = null;
const markers = {};
const trails = {};

if (window.L) {
  map = L.map("map").setView(CAMPUS_CENTER, 16);
  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", { attribution: "© OpenStreetMap" }).addTo(map);
} else {
  document.getElementById("map").innerHTML = '<div class="empty">The map needs an internet connection. Vehicle data below still updates.</div>';
}

function renderMap() {
  if (!map) return;
  const showTrail = document.getElementById("trail").checked;
  data.vehicles.forEach((v) => {
    const points = data.locations.filter((l) => l.vehicle_id === v.vehicle_id).map((l) => [l.latitude, l.longitude]);
    if (!points.length) return;
    const last = points[points.length - 1];
    if (markers[v.vehicle_id]) markers[v.vehicle_id].setLatLng(last);
    else markers[v.vehicle_id] = L.marker(last).addTo(map).bindTooltip(v.plate_number).on("click", () => select(v.vehicle_id));

    if (trails[v.vehicle_id]) map.removeLayer(trails[v.vehicle_id]);
    trails[v.vehicle_id] = null;
    if (showTrail && (selectedId === null || selectedId === v.vehicle_id)) {
      trails[v.vehicle_id] = L.polyline(points.slice(-20), { color: v.vehicle_id === selectedId ? "#2f6bff" : "#94a3b8", weight: 3 }).addTo(map);
    }
  });
  if (selectedId && markers[selectedId]) map.panTo(markers[selectedId].getLatLng());
}

function renderList() {
  document.getElementById("vehicleList").innerHTML = data.vehicles.map((v) => {
    const loc = latestLocation(data, v.vehicle_id);
    const info = loc ? `${loc.speed_kmh} km/h` : "No signal";
    const speeding = loc && v.status === "Active" && loc.speed_kmh > SPEED_LIMIT_KMH;
    return `<div class="vehicle-pick ${v.vehicle_id === selectedId ? "selected" : ""}" data-id="${v.vehicle_id}">
      <div style="display:flex;justify-content:space-between"><b>${esc(v.plate_number)}</b>${speeding ? '<span class="badge red">Over speed</span>' : statusBadge(v.status)}</div>
      <div class="muted">${esc(v.model)} · ${info}</div></div>`;
  }).join("");
}

function renderDetail() {
  const el = document.getElementById("detail");
  const v = data.vehicles.find((x) => x.vehicle_id === selectedId);
  if (!v) { el.innerHTML = ""; return; }
  const loc = latestLocation(data, v.vehicle_id);
  const driver = data.drivers.find((d) => d.vehicle_id === v.vehicle_id);
  el.innerHTML = `<div class="card" style="background:var(--blue-soft);border:none">
    <h2>${esc(v.plate_number)}</h2>
    <div class="muted">Driver: ${esc(driver ? driver.name : "Unassigned")}</div>
    ${loc ? `<div class="muted">Lat/Lng: ${loc.latitude}, ${loc.longitude}</div>
             <div class="muted">Speed: ${loc.speed_kmh} km/h</div>
             <div class="muted">Last update: ${fmtDateTime(loc.recorded_at)}</div>` : '<div class="muted">No location received yet.</div>'}
    <button class="btn ghost sm" style="margin-top:8px" onclick="select(null)">Show all</button></div>`;
}

function select(id) {
  selectedId = id;
  renderList(); renderDetail(); renderMap();
}

document.getElementById("vehicleList").onclick = (e) => {
  const item = e.target.closest(".vehicle-pick");
  if (item) select(Number(item.dataset.id));
};
document.getElementById("trail").onchange = renderMap;

function refresh() {
  data = DB.load();
  simulateTick(data);
  renderList(); renderDetail(); renderMap();
}

refresh();
setInterval(refresh, 5000);
