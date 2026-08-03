const STORAGE_KEY = "falconfa.halftime.orders";
const MAX_ORDERS = 100;

const FOOD_ITEMS = [
  "Laban", "Salad", "Healthy Chips", "Grilled Chicken",
  "Chicken Shawarma Wrap", "Hummus with Veggies", "Falafel Wrap", "Quinoa Bowl",
  "Grilled Fish", "Turkey Sandwich", "Veggie Wrap", "Brown Rice Bowl",
  "Lentil Soup", "Stuffed Grape Leaves", "Baked Sweet Potato", "Chickpea Salad",
  "Greek Salad", "Tabbouleh", "Grilled Shrimp Skewers", "Egg White Omelette Wrap",
];

const DRINK_ITEMS = [
  "Water", "Coconut Water", "Fresh Orange Juice", "Watermelon Juice",
  "Green Smoothie", "Mint Lemonade", "Cucumber Mint Water", "Pomegranate Juice",
  "Electrolyte Sports Drink", "Herbal Iced Tea", "Kombucha", "Beet Juice",
  "Carrot Ginger Juice", "Sparkling Water", "Almond Milk", "Protein Shake",
  "Detox Water", "Apple Juice", "Berry Smoothie", "Chia Fresca",
];

const SNACK_ITEMS = [
  "Protein Bar", "Mixed Nuts", "Trail Mix", "Rice Cakes",
  "Fruit Cup", "Veggie Sticks with Hummus", "Greek Yogurt Cup", "Popcorn (Air-Popped)",
  "Dried Fruit Mix", "Roasted Chickpeas",
];

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

function escapeHtml(str) {
  const div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
}

// ---------- Screen navigation ----------
function showScreen(id) {
  document.querySelectorAll(".screen").forEach((s) => s.classList.remove("active"));
  document.getElementById(id).classList.add("active");
}

function updateOrderCounter() {
  const count = loadOrders().length;
  document.getElementById("order-counter").textContent = `Orders today: ${count} / ${MAX_ORDERS}`;
  return count;
}

// ---------- Build menu options ----------
function buildOptions(containerId, items, groupName) {
  const container = document.getElementById(containerId);
  container.innerHTML = "";
  items.forEach((item, i) => {
    const id = `${groupName}-${i}`;
    const label = document.createElement("label");
    label.className = "option";
    label.innerHTML = `<input type="checkbox" id="${id}" name="${groupName}" value="${escapeHtml(item)}"><span>${escapeHtml(item)}</span>`;
    container.appendChild(label);
  });
}

function resetMenuSelections() {
  document.querySelectorAll('#screen-menu input[type="checkbox"]').forEach((cb) => (cb.checked = false));
  document.getElementById("menu-error").hidden = true;
}

buildOptions("food-options", FOOD_ITEMS, "food");
buildOptions("drink-options", DRINK_ITEMS, "drink");
buildOptions("snack-options", SNACK_ITEMS, "snack");

// ---------- Step 1: Name ----------
const inputName = document.getElementById("input-name");
const nameError = document.getElementById("name-error");
let currentName = "";

function goToNameScreen() {
  currentName = "";
  inputName.value = "";
  nameError.hidden = true;
  resetMenuSelections();

  const count = updateOrderCounter();
  if (count >= MAX_ORDERS) {
    showScreen("screen-full");
    return;
  }
  showScreen("screen-name");
  inputName.focus();
}

document.getElementById("btn-name-next").addEventListener("click", () => {
  const count = updateOrderCounter();
  if (count >= MAX_ORDERS) {
    showScreen("screen-full");
    return;
  }

  const name = inputName.value.trim();
  if (!name) {
    nameError.hidden = false;
    nameError.textContent = "Please enter your name to continue.";
    return;
  }
  nameError.hidden = true;
  currentName = name;
  document.getElementById("menu-greeting").textContent = `What do you want at halftime, ${name}?`;
  showScreen("screen-menu");
});

inputName.addEventListener("keydown", (e) => {
  if (e.key === "Enter") document.getElementById("btn-name-next").click();
});

// ---------- Step 2: Menu ----------
document.getElementById("btn-place-order").addEventListener("click", () => {
  const food = Array.from(document.querySelectorAll('input[name="food"]:checked')).map((el) => el.value);
  const drinks = Array.from(document.querySelectorAll('input[name="drink"]:checked')).map((el) => el.value);
  const snacks = Array.from(document.querySelectorAll('input[name="snack"]:checked')).map((el) => el.value);
  const menuError = document.getElementById("menu-error");

  if (food.length + drinks.length + snacks.length === 0) {
    menuError.hidden = false;
    menuError.textContent = "Please pick at least one item for your order.";
    return;
  }
  menuError.hidden = true;

  const orders = loadOrders();
  if (orders.length >= MAX_ORDERS) {
    showScreen("screen-full");
    return;
  }

  const order = {
    id: crypto.randomUUID ? crypto.randomUUID() : String(Date.now()) + Math.random(),
    name: currentName,
    food,
    drinks,
    snacks,
    createdAt: Date.now(),
  };
  orders.push(order);
  saveOrders(orders);
  updateOrderCounter();

  document.getElementById("confirm-thanks").textContent = `Ok, thank you Mr ${currentName}!`;
  showScreen("screen-confirm");
});

// ---------- Step 3: Confirmation -> loop back ----------
document.getElementById("btn-new-order").addEventListener("click", goToNameScreen);

// ---------- Staff view ----------
const staffModal = document.getElementById("staff-modal");
const staffList = document.getElementById("staff-list");
const staffSearch = document.getElementById("staff-search");

function renderStaffList() {
  const orders = loadOrders().slice().sort((a, b) => b.createdAt - a.createdAt);
  const query = staffSearch.value.trim().toLowerCase();
  const filtered = query ? orders.filter((o) => o.name.toLowerCase().includes(query)) : orders;

  document.getElementById("staff-count").textContent = `${orders.length} order${orders.length === 1 ? "" : "s"} today (max ${MAX_ORDERS})`;

  staffList.innerHTML = "";
  if (filtered.length === 0) {
    const li = document.createElement("li");
    li.className = "empty-state";
    li.textContent = orders.length === 0 ? "No orders placed yet." : "No orders match your search.";
    staffList.appendChild(li);
    return;
  }

  filtered.forEach((order) => {
    const li = document.createElement("li");
    li.className = "pickup-item";
    const items = [...order.food, ...order.drinks, ...order.snacks].join(", ") || "—";
    li.innerHTML = `<div class="pickup-info"><strong>${escapeHtml(order.name)}</strong><span>${escapeHtml(items)}</span></div>`;
    staffList.appendChild(li);
  });
}

document.getElementById("btn-staff").addEventListener("click", () => {
  staffModal.hidden = false;
  renderStaffList();
});

document.getElementById("btn-close-staff").addEventListener("click", () => {
  staffModal.hidden = true;
});

staffSearch.addEventListener("input", renderStaffList);

document.getElementById("btn-reset-all").addEventListener("click", () => {
  if (!confirm("Clear all orders and start fresh for the next game day?")) return;
  saveOrders([]);
  renderStaffList();
  updateOrderCounter();
});

// ---------- Init ----------
goToNameScreen();
