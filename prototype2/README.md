# พร้อมปัน · Prototype 2

Prototype 2 is a minimal, mobile-first redesign of the public finder plus a responsive admin workspace.

## Run locally

From this directory run:

    python3 -m http.server 4173

Open http://localhost:4173/prototype2/.

The demo is in-memory only. Reloading the page resets the data.

## Admin demo

- Username: admin
- Password: admin

Admin routes are available from the “สำหรับผู้ดูแล” link:

- Dashboard with priority alerts and distribution summary
- Dispenser list, editor, and stock adjustment
- Eligibility recipients and CSV preview flow
- Activity log
- Device heartbeat, revision sync, and report simulator

Prototype 2 keeps public connectivity hidden from visitors, uses the minimum bundle count across enabled channels, and shows OpenStreetMap attribution on the detail map.
