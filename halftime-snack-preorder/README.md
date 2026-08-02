# Halftime Snack Preorder — Falcon Football Academy

A tiny, no-build web app that fixes the Saturday halftime stampede at snack time.

## The idea

Instead of 60 players deciding *and* grabbing snacks in the same 10-minute
window, players (or their parents) preorder their snack + drink any time
before the match. At halftime, staff just hand out bags that are already
made and labeled — no deciding, no digging through a pile, no queue.

## How to run it

No build step, no dependencies. Just open `index.html` in a browser, or serve
the folder with any static server:

```bash
cd halftime-snack-preorder
python3 -m http.server 8000
# then open http://localhost:8000
```

## How it works

- **Preorder tab** — a player picks their name, team, one snack, one drink,
  and an optional allergy note. Submitting reserves their bag.
- **Halftime Pickup tab** — staff see every reserved bag sorted alphabetically
  by name, with a search box to jump straight to a player and a button to
  mark a bag as collected. A counter shows bags remaining so staff know when
  the line is done.
- **Reset for next Saturday** clears the list so the next match day starts
  fresh.

Orders are stored in the browser's `localStorage`, so this demo works
entirely offline on one device (e.g. the snack table's tablet/laptop). A real
deployment would move that storage to a shared backend so parents can order
from home and staff see the same list at the field — see "What could still
go wrong" in the mission report.
