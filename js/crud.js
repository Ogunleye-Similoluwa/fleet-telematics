// Reusable "register" page: a searchable table plus an add/edit form in a dialog.
// Vehicles, Drivers, Trips and Maintenance pages all use this.
//
// config = {
//   table: "vehicles", key: "vehicle_id", noun: "vehicle",
//   columns: [{ label, render(row, data) }],
//   searchText(row, data) -> string,
//   formHtml(row, data) -> string,      // fields inside the dialog
//   parse(values, data) -> row | string // return an error message string if invalid
//   canDelete(row, data) -> true | string
// }

function crudPage(config) {
  const body = document.getElementById("rows");
  const search = document.getElementById("search");
  const dialog = document.getElementById("editDialog");
  const form = document.getElementById("editForm");
  const error = document.getElementById("formError");
  let editingId = null;

  function render() {
    const data = DB.load();
    const q = (search.value || "").toLowerCase();
    const rows = data[config.table].filter((r) => config.searchText(r, data).toLowerCase().includes(q));
    document.getElementById("count").textContent = `${rows.length} ${config.noun}${rows.length === 1 ? "" : "s"}`;
    body.innerHTML = rows.length
      ? rows.map((r) => `<tr>${config.columns.map((c) => `<td>${c.render(r, data)}</td>`).join("")}
          <td><button class="btn ghost sm" data-edit="${r[config.key]}">Edit</button>
              <button class="btn danger sm" data-del="${r[config.key]}">Delete</button></td></tr>`).join("")
      : `<tr><td colspan="${config.columns.length + 1}" class="empty">No ${config.noun}s found.</td></tr>`;
  }

  function open(row) {
    editingId = row ? row[config.key] : null;
    document.getElementById("dialogTitle").textContent = (row ? "Edit " : "Add ") + config.noun;
    form.querySelector(".fields").innerHTML = config.formHtml(row || {}, DB.load());
    error.textContent = "";
    dialog.showModal();
  }

  document.getElementById("addBtn").onclick = () => open(null);
  document.getElementById("cancelBtn").onclick = () => dialog.close();
  search.oninput = render;

  body.onclick = (e) => {
    const data = DB.load();
    const editId = e.target.dataset.edit;
    const delId = e.target.dataset.del;
    if (editId) open(data[config.table].find((r) => r[config.key] === Number(editId)));
    if (delId) {
      const row = data[config.table].find((r) => r[config.key] === Number(delId));
      const allowed = config.canDelete ? config.canDelete(row, data) : true;
      if (allowed !== true) return alert(allowed);
      if (!confirm(`Delete this ${config.noun}?`)) return;
      data[config.table] = data[config.table].filter((r) => r !== row);
      DB.save(data);
      render();
    }
  };

  form.onsubmit = (e) => {
    e.preventDefault();
    const data = DB.load();
    const result = config.parse(formData(form), data, editingId);
    if (typeof result === "string") { error.textContent = result; return; }
    if (editingId) {
      const idx = data[config.table].findIndex((r) => r[config.key] === editingId);
      data[config.table][idx] = { ...data[config.table][idx], ...result };
    } else {
      data[config.table].push({ [config.key]: DB.nextId(data[config.table], config.key), ...result });
    }
    DB.save(data);
    dialog.close();
    render();
  };

  render();
}

// Shared page markup for register pages (keeps each HTML file short).
function registerMarkup(title, crumb, noun) {
  return `
    <button class="btn ghost menu-btn">☰ Menu</button>
    <div class="crumb">Fleet management / ${crumb}</div>
    <h1>${title}</h1>
    <div class="card">
      <div class="toolbar">
        <input id="search" placeholder="Search ${noun}s…">
        <span class="muted" id="count"></span>
        <span class="spacer"></span>
        <button class="btn" id="addBtn">+ Add ${noun}</button>
      </div>
      <div class="table-wrap"><table><thead id="head"></thead><tbody id="rows"></tbody></table></div>
    </div>
    <dialog id="editDialog">
      <form id="editForm">
        <h2 id="dialogTitle" style="margin-bottom:14px"></h2>
        <div class="fields"></div>
        <div class="error" id="formError"></div>
        <div class="dialog-actions"><button type="button" class="btn ghost" id="cancelBtn">Cancel</button><button class="btn">Save</button></div>
      </form>
    </dialog>`;
}

function setupRegister(title, crumb, config) {
  document.querySelector("main").innerHTML = registerMarkup(title, crumb, config.noun);
  document.getElementById("head").innerHTML = `<tr>${config.columns.map((c) => `<th>${c.label}</th>`).join("")}<th></th></tr>`;
  crudPage(config);
}
