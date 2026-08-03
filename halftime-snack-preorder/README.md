# Halftime Order Kiosk — Falcon Football Academy

A tiny, no-build web app for taking halftime food orders one customer at a
time on a shared kiosk (tablet/laptop at the snack table).

## How to run it

No build step, no dependencies. Just open `index.html` in a browser, or serve
the folder with any static server:

```bash
cd halftime-snack-preorder
python3 -m http.server 8000
# then open http://localhost:8000
```

## How it works

The kiosk walks through the same three steps for every customer, then loops
back for the next one:

1. **Ask for a name** — the customer types their name and continues.
2. **Show the menu** — food, drinks, and snacks are shown as checkboxes so a
   customer can pick as many items as they want:
   - **Food** (20 options): Laban, Salad, Healthy Chips, Grilled Chicken,
     Chicken Shawarma Wrap, Hummus with Veggies, Falafel Wrap, Quinoa Bowl,
     Grilled Fish, Turkey Sandwich, Veggie Wrap, Brown Rice Bowl, Lentil
     Soup, Stuffed Grape Leaves, Baked Sweet Potato, Chickpea Salad, Greek
     Salad, Tabbouleh, Grilled Shrimp Skewers, Egg White Omelette Wrap.
   - **Drinks** (20 options): Water, Coconut Water, Fresh Orange Juice,
     Watermelon Juice, Green Smoothie, Mint Lemonade, Cucumber Mint Water,
     Pomegranate Juice, Electrolyte Sports Drink, Herbal Iced Tea, Kombucha,
     Beet Juice, Carrot Ginger Juice, Sparkling Water, Almond Milk, Protein
     Shake, Detox Water, Apple Juice, Berry Smoothie, Chia Fresca.
   - **Snacks** (10 options): Protein Bar, Mixed Nuts, Trail Mix, Rice
     Cakes, Fruit Cup, Veggie Sticks with Hummus, Greek Yogurt Cup, Popcorn
     (Air-Popped), Dried Fruit Mix, Roasted Chickpeas.
3. **Confirm** — the kiosk says "Ok, thank you Mr {name}!" followed by "Your
   order should be here by half time!", then saves the order.
4. **Next Customer** — tapping the button clears the screen and starts over
   at step 1 for the next person in line.

A counter in the header tracks orders taken today (e.g. `Orders today: 12 /
100`). The kiosk can take up to **100 orders** before it shows an "Order
Limit Reached" screen.

### Staff view

Tap **Staff view** in the footer to open a list of every order placed today
(searchable by name), plus a **Reset all orders** button to clear the list
and start fresh for the next game day.

Orders are stored in the browser's `localStorage`, so this demo works
entirely offline on one device. A real deployment would move that storage to
a shared backend so multiple kiosks/staff can see the same order list.
