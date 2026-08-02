const STORAGE_KEY = "falconfa.halftime.orders";
const MY_ORDER_KEY = "falconfa.halftime.myOrderId";

function loadOrders() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
  } catch {
    return [];
  }
}

function saveOrders(orders) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(orders));
}

function getMyOrderId() {
  return localStorage.getItem(MY_ORDER_KEY);
}

function setMyOrderId(id) {
  localStorage.setItem(MY_ORDER_KEY, id);
}

function clearMyOrderId() {
  localStorage.removeItem(MY_ORDER_KEY);
}

// ---------- Tabs ----------
document.querySelectorAll(".tab-btn").forEach((btn) => {
  btn.addEventListener("click", () => {
    document.querySelectorAll(".tab-btn").forEach((b) => b.classList.remove("active"));
    document.querySelectorAll(".tab-panel").forEach((p) => p.classList.remove("active"));
    btn.classList.add("active");
    document.getElementById(btn.dataset.tab).classList.add("active");
    if (btn.dataset.tab === "pickup") renderPickupList();
  });
});

// ---------- Preorder form ----------
const orderForm = document.getElementById("order-form");
const orderConfirm = document.getElementById("order-confirm");

orderForm.addEventListener("submit", (e) => {
  e.preventDefault();

  const name = document.getElementById("player-name").value.trim();
  const team = document.getElementById("player-team").value;
  const snack = orderForm.querySelector('input[name="snack"]:checked')?.value;
  const drink = orderForm.querySelector('input[name="drink"]:checked')?.value;
  const allergy = document.getElementById("allergy-note").value.trim();

  if (!name || !team || !snack || !drink) return;

  const orders = loadOrders();
  const order = {
    id: crypto.randomUUID ? crypto.randomUUID() : String(Date.now()),
    name,
    team,
    snack,
    drink,
    allergy,
    pickedUp: false,
    createdAt: Date.now(),
  };
  orders.push(order);
  saveOrders(orders);
  setMyOrderId(order.id);

  orderConfirm.hidden = false;
  orderConfirm.textContent = `Bag reserved for ${name}! Look for your name at the pickup table — no queue needed.`;

  orderForm.reset();
  renderMyOrder();
});

function renderMyOrder() {
  const summaryEl = document.getElementById("my-order-summary");
  const cancelBtn = document.getElementById("cancel-order");
  const myId = getMyOrderId();
  const order = myId && loadOrders().find((o) => o.id === myId);

  if (!order) {
    summaryEl.textContent = "No order saved on this device yet.";
    summaryEl.hidden = false;
    cancelBtn.hidden = true;
    return;
  }

  summaryEl.hidden = false;
  summaryEl.innerHTML = `<strong>${escapeHtml(order.name)}</strong> (${escapeHtml(order.team)}) — ${escapeHtml(order.snack)} + ${escapeHtml(order.drink)}${order.allergy ? ` — ⚠️ ${escapeHtml(order.allergy)}` : ""}${order.pickedUp ? " — ✅ picked up" : ""}`;
  cancelBtn.hidden = false;
}

document.getElementById("cancel-order").addEventListener("click", () => {
  const myId = getMyOrderId();
  if (!myId) return;
  const orders = loadOrders().filter((o) => o.id !== myId);
  saveOrders(orders);
  clearMyOrderId();
  orderConfirm.hidden = true;
  renderMyOrder();
});

// ---------- Pickup list ----------
const pickupList = document.getElementById("pickup-list");
const pickupSearch = document.getElementById("pickup-search");
const hidePickedCheckbox = document.getElementById("hide-picked");

function renderPickupList() {
  const orders = loadOrders().slice().sort((a, b) => a.name.localeCompare(b.name));
  const query = pickupSearch.value.trim().toLowerCase();
  const hidePicked = hidePickedCheckbox.checked;

  const filtered = orders.filter((o) => {
    if (hidePicked && o.pickedUp) return false;
    if (query && !o.name.toLowerCase().includes(query)) return false;
    return true;
  });

  document.getElementById("stat-total").textContent = `${orders.length} bag${orders.length === 1 ? "" : "s"}`;
  document.getElementById("stat-remaining").textContent = `${orders.filter((o) => !o.pickedUp).length} remaining`;

  pickupList.innerHTML = "";

  if (filtered.length === 0) {
    const li = document.createElement("li");
    li.className = "empty-state";
    li.textContent = orders.length === 0
      ? "No preorders yet — players reserve their bag on the Preorder tab."
      : "No bags match your search.";
    pickupList.appendChild(li);
    return;
  }

  filtered.forEach((order) => {
    const li = document.createElement("li");
    li.className = "pickup-item" + (order.pickedUp ? " picked" : "");

    const info = document.createElement("div");
    info.className = "pickup-info";
    info.innerHTML = `<strong>${escapeHtml(order.name)}</strong><span>${escapeHtml(order.team)} · ${escapeHtml(order.snack)} + ${escapeHtml(order.drink)}${order.allergy ? ` · ⚠️ ${escapeHtml(order.allergy)}` : ""}</span>`;

    const toggle = document.createElement("button");
    toggle.className = "pickup-toggle " + (order.pickedUp ? "picked" : "not-picked");
    toggle.textContent = order.pickedUp ? "Picked up" : "Grab bag";
    toggle.addEventListener("click", () => {
      const orders = loadOrders();
      const target = orders.find((o) => o.id === order.id);
      if (target) {
        target.pickedUp = !target.pickedUp;
        saveOrders(orders);
        renderPickupList();
        renderMyOrder();
      }
    });

    li.appendChild(info);
    li.appendChild(toggle);
    pickupList.appendChild(li);
  });
}

pickupSearch.addEventListener("input", renderPickupList);
hidePickedCheckbox.addEventListener("change", renderPickupList);

document.getElementById("reset-day").addEventListener("click", () => {
  if (!confirm("Clear all preorders and start fresh for next Saturday?")) return;
  saveOrders([]);
  clearMyOrderId();
  renderPickupList();
  renderMyOrder();
});

function escapeHtml(str) {
  const div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
}

// ---------- Init ----------
renderMyOrder();
renderPickupList();
