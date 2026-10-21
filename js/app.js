// Shared app shell: login check, sidebar, and small helpers used by every page.

const SESSION_KEY = "fleettrack_session";

const NAV = [
  { page: "dashboard", href: "dashboard.html", icon: "▦", label: "Dashboard" },
  { page: "vehicles", href: "vehicles.html", icon: "🚌", label: "Vehicles" },
  { page: "tracking", href: "tracking.html", icon: "📍", label: "Live Tracking" },
  { page: "drivers", href: "drivers.html", icon: "👤", label: "Drivers" },
  { page: "trips", href: "trips.html", icon: "⇄", label: "Trip Records" },
  { page: "maintenance", href: "maintenance.html", icon: "🔧", label: "Maintenance" },
  { page: "reports", href: "reports.html", icon: "📄", label: "Reports" },
];

function currentUser() {
  try { return JSON.parse(sessionStorage.getItem(SESSION_KEY)); } catch (e) { return null; }
}

function login(username, password) {
  const data = DB.load();
  const user = data.users.find((u) => u.username === username && u.password === password);
  if (!user) return false;
  sessionStorage.setItem(SESSION_KEY, JSON.stringify({ user_id: user.user_id, name: user.name, role: user.role }));
  return true;
}

function logout() {
  sessionStorage.removeItem(SESSION_KEY);
  location.href = "index.html";
}

// Protected pages call this first. Not real security: anyone can edit
// browser storage. A production system must check the session on a server.
function requireLogin() {
  const user = currentUser();
  if (!user) location.href = "index.html";
  return user;
}

function renderShell() {
  const user = requireLogin();
  if (!user) return;
  const page = document.body.dataset.page;
  const initials = user.name.split(" ").map((p) => p[0]).join("").slice(0, 2).toUpperCase();
  document.getElementById("sidebar").innerHTML = `
    <div class="brand"><div class="brand-logo">▣</div><div><b>FleetTrack</b><small>Telematics</small></div></div>
    <div class="nav-label">Workspace</div>
    <nav class="nav">
      ${NAV.map((n) => `<a href="${n.href}" class="${n.page === page ? "active" : ""}"><span>${n.icon}</span>${n.label}</a>`).join("")}
    </nav>
    <div class="sidebar-user">
      <div class="avatar">${esc(initials)}</div>
      <div><div style="color:#fff;font-weight:600">${esc(user.name)}</div><div class="muted" style="color:#8ea2c8">${esc(user.role)}</div></div>
      <button onclick="logout()">Log out</button>
    </div>`;
  const menu = document.querySelector(".menu-btn");
  if (menu) menu.onclick = () => document.getElementById("sidebar").classList.toggle("open");
}

// ---------- Helpers ----------

// Escape text before putting it into HTML (prevents script injection from form input).
function esc(value) {
  return String(value ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}

function fmtDate(value) {
  if (!value) return "—";
  const d = new Date(value);
  return isNaN(d) ? value : d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

function fmtDateTime(value) {
  if (!value) return "—";
  const d = new Date(value);
  return isNaN(d) ? value : d.toLocaleString("en-GB", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });
}

function naira(n) {
  return "₦" + Number(n || 0).toLocaleString("en-NG");
}

function statusBadge(status) {
  const colour = { Active: "green", Idle: "blue", Maintenance: "amber", Overdue: "red", "Due soon": "amber", Scheduled: "blue", "Off duty": "blue", Assigned: "green" }[status] || "blue";
  return `<span class="badge ${colour}">${esc(status)}</span>`;
}

function vehicleLabel(data, id) {
  const v = data.vehicles.find((x) => x.vehicle_id === Number(id));
  return v ? v.plate_number : "—";
}

function driverLabel(data, id) {
  const d = data.drivers.find((x) => x.driver_id === Number(id));
  return d ? d.name : "Unassigned";
}

function vehicleOptions(data, selected) {
  return data.vehicles.map((v) => `<option value="${v.vehicle_id}" ${v.vehicle_id === Number(selected) ? "selected" : ""}>${esc(v.plate_number)} — ${esc(v.model)}</option>`).join("");
}

function driverOptions(data, selected, allowNone) {
  return (allowNone ? `<option value="">Unassigned</option>` : "") +
    data.drivers.map((d) => `<option value="${d.driver_id}" ${d.driver_id === Number(selected) ? "selected" : ""}>${esc(d.name)}</option>`).join("");
}

// Maintenance status from the next due date.
function maintenanceStatus(record) {
  const days = (new Date(record.next_due_date) - new Date(new Date().toDateString())) / 86400000;
  if (days < 0) return "Overdue";
  if (days <= 7) return "Due soon";
  return "Scheduled";
}

function greeting() {
  const h = new Date().getHours();
  return h < 12 ? "Good morning" : h < 17 ? "Good afternoon" : "Good evening";
}

// Read a <form> into a plain object.
function formData(form) {
  return Object.fromEntries(new FormData(form).entries());
}

document.addEventListener("DOMContentLoaded", () => {
  if (document.getElementById("sidebar")) renderShell();
});
