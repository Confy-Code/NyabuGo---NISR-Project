# NyabuGo — Smart Intercity Transit & Predictive Fleet Platform

NyabuGo is a full-stack prototype that digitalises intercity bus travel from **Nyabugogo Bus Station, Kigali**. It combines a public booking portal, a driver/regulator ticket scanner, and an operator dashboard that blends **live ticket demand** with the **NISR Rwanda Labour Force Survey 2025** mobility baseline.

The project has two apps in one repository:

| App | Stack | Default URL |
| --- | --- | --- |
| Passenger / operator web app | React 18, Vite, Tailwind CSS, Recharts | `http://localhost:5173` |
| REST API | Node.js, Express, built-in `node:sqlite` | `http://localhost:4000` |

> **No PostgreSQL is used.** All operational data is stored in a local SQLite file at `server/data/nyabugo.db`. User login profiles are cached in the browser's `localStorage` and do not touch any database.

---

## Quick start

```bash
# 1. Install workspace dependencies
npm install

# 2. Start API and web app together
npm run dev
```

Open `http://localhost:5173`. The API runs on port 4000 and Vite proxies `/api` requests to it.

### Other useful commands

| Command | What it does |
| --- | --- |
| `npm run dev` | Runs the API and web client together |
| `npm run dev:server` | Runs only the Express API with file watching |
| `npm run dev:client` | Runs only the Vite client |
| `npm run seed` | Seeds the database if it has no upcoming buses |
| `npm run seed:force` | Wipes and re-seeds all demo data |
| `npm run build` | Builds the production client into `client/dist` |
| `npm start` | Serves the built client and API from port 4000 |

**Requirements:** Node.js 22.5 or newer (the project uses the built-in `node:sqlite` module; developed on Node 22.17). Copy `server/.env.example` to `server/.env` if you want to configure secrets or optional AI tokens.

---

## What data the application uses

NyabuGo uses four categories of data.

### 1. NISR national baseline — `RW_LFS2025`

The dashboard is grounded in the **Rwanda Labour Force Survey 2025**, published by the **National Institute of Statistics of Rwanda (NISR)**. The sample contains **31,256 respondents**.

| Variable | Category | Indicator | Value | Valid N |
| --- | --- | --- | --- | --- |
| D23A | Means of transportation to work | Public buses / cars / taxis | **4.1%** | 1,280 |
| D23A | Means of transportation to work | Walking | **83.7%** | 26,169 |
| D23A | Means of transportation to work | Private motorbike / bicycle / other | **12.2%** | 3,807 |
| D23 | Location of work / business | Fixed office / shop / factory | **22.2%** | 7,702 |
| D23 | Location of work / business | Construction sites | **6.9%** | 2,391 |
| D23 | Location of work / business | Market stalls | **5.1%** | 1,775 |

The **4.1% public-transport share from D23A** is used as the `NISR_Commute_Weight` in the demand model. District-level mobility is then adjusted with a regional multiplier.

Source: `server/src/data/nisr.js` (seeded into the `nisr_metrics` table). Data dictionary: [RW_LFS2025](https://microdatabk.statistics.gov.rw/catalog/125/data-dictionary/F1?file_name=RW_LFS2025).

### 2. Live operational data — local SQLite

Created automatically on first run in `server/data/nyabugo.db`. No external database server is required.

| Table | What it holds |
| --- | --- |
| `routes` | 5 provincial routes, distance, duration, base fare, NISR weight, regional multiplier |
| `companies` | Bus operators and their price premiums |
| `buses` | Fleet departures, plate/bus numbers, capacity, fare, driver, departure/arrival times |
| `seats` | Per-bus seat inventory with `available` / `sold` status |
| `bookings` | Tickets, passenger, phone, mobile-money reference, seat list, amount, status, QR payload |
| `demand_history` | 14 days of hourly booking history per route, used for trends and forecasting |
| `nisr_metrics` | The NISR RW_LFS2025 indicators above |

Routes served from Nyabugogo:

| Destination | Province | Distance | Duration | Base fare |
| --- | --- | --- | --- | --- |
| Musanze | Northern | 105 km | 2h 00m | RWF 5,000 |
| Huye | Southern | 135 km | 2h 30m | RWF 6,000 |
| Rubavu | Western | 155 km | 2h 45m | RWF 6,500 |
| Rwamagana | Eastern | 55 km | 1h 00m | RWF 2,500 |
| Rusizi | Western | 245 km | 4h 20m | RWF 9,000 |

Operators: **Horizon Express**, **Ritco**, and **Volcano Express**. Premium operators add RWF 300–500 to the base fare.

### 3. Seeded demo data

`npm run seed` generates a realistic starting dataset so the app works immediately:

- 5 routes, 3 companies, 30 seats per bus, and departures for today and tomorrow.
- 14 days of hourly demand history (05:00–21:00) with morning/evening peaks.
- Sample bookings for already-sold seats, split between **MTN MoMo** (`078`/`079`) and **Airtel Money** (`072`/`073`) phone prefixes.
- Sample passenger names, driver names, and Rwandan phone numbers.

The database is re-seeded automatically when no upcoming departures remain, so the demo never runs dry.

### 4. Optional AI data

- **Local fallback (default):** a rules-based natural-language engine answers questions about schedules, fares, seats, routes, and tickets in English or Kinyarwanda. No external calls are made.
- **Hugging Face (optional):** setting `HF_TOKEN` in `server/.env` enables Kinyarwanda translation and Whisper speech recognition. The app falls back to local answers if the token is missing or inference fails.

### 5. User accounts and sessions — browser only

Login is intentionally a **local device cache**, not a database feature:

- Any name + email is accepted (no password, no server validation), and "Continue with Google" is a simulated account picker.
- The active session, a list of previously used accounts, and recent tickets are stored in `localStorage` under `nyabugo.auth.v1`, `nyabugo.accounts.v1`, and `nyabugo.tickets.v1`.
- This makes returning users feel recognised even when the database is unavailable. Clearing browser storage resets the account cache.

---

## What the application is trying to communicate

### Passenger portal (`/`)

- **Live seat visibility:** which departures are available today/tomorrow, how many seats remain, the fare, operator, bus number, and current status (`Scheduled`, `En route`, `Arrived`).
- **Transparency:** every fare is shown in RWF; sold-out or departed buses are filtered out.
- **Trust:** every ticket is described as HMAC-signed and valid for one boarding only.

### Booking flow (`/book/:busId`)

- A visual 30-seat map shows which seats are free.
- The passenger sees the selected seats, price per seat, and total before paying.
- Mobile-money method is detected from the phone prefix, and the app states that payment is a simulation.

### Digital ticket (`/ticket/:code`)

- Confirms payment success and communicates the boarding essentials: route, departure/arrival times, seats, bus, passenger, payment method, amount, and ticket code.
- Shows a scannable QR code that encodes the ticket code plus an HMAC signature.
- Supports printing and downloading the QR for offline use.

### Operator & regulator dashboard (`/admin`)

This is the main analytical view. It communicates **where demand is coming from, where capacity is about to run out, and what operators should do about it**.

- **Top-line KPIs:** tickets issued today, revenue collected, active buses en route, upcoming departures, average wait saved versus physical queues, and seat occupancy.
- **Predictive route demand:** a stacked bar chart separating live bookings (`×1.15`) from the NISR baseline for each destination.
- **Demand formula:** `Predicted_Demand = (Live_Bookings × 1.15) + (NISR_Commute_Weight_D23A × Regional_Multiplier × 4.18)`.
- **AI fleet recommender:** ranks routes by risk (`High`, `Watch`, `Low`), forecasts passengers at the next peak, compares that with available seats, and recommends how many extra buses to add.
- **Route demand heatmap:** average bookings for each route by hour over the last 14 days, colour-coded from low (green) to high (red).
- **7-day booking trend** and **today-by-hour** charts, showing historical and live demand patterns.
- **NISR ground truth panel:** exposes the exact D23/D23A percentages, valid sample sizes, and the formula so decisions are auditable.
- **Revenue by route** and a **route capacity table** with bookings, seats sold/capacity, load percentage, NISR signal, and a 0–100 demand index.

The dashboard refreshes automatically every **30 seconds** and can be refreshed manually.

### Driver / regulator scanner (`/scanner`)

- Communicates whether a boarding pass is genuinely valid.
- A valid first scan returns the passenger, route, seats, bus, amount, payment method, and departure time, and marks the ticket **used**.
- A second scan is rejected as `already_used`, preventing ticket sharing.
- Invalid signatures, unknown codes, and already-used tickets are explained in plain language.

### AI assistant (floating chat button)

- Answers questions in **Kinyarwanda or English** about departure times, prices, available seats, routes, and QR tickets.
- Reply cards can link directly to a bookable bus.
- It labels whether an answer came from local NLU or Hugging Face, so users can tell how the answer was produced.

---

## How users interact with what is displayed

### Book a seat

1. On the **Home** page, choose a destination, pick **Today** or **Tomorrow**, and press **Search** (or tap a popular route).
2. Review the bus cards: operator, departure/arrival time, status, fare, and remaining seats.
3. Press **Book** on a departure to open the seat map.
4. Toggle up to **4 seats**, enter the passenger name and an MTN/Airtel phone number, then press **Pay & generate ticket**.
5. The ticket page opens with the QR code. Print or download it, then show it at boarding.

### Validate a ticket

1. Open **Scanner** from the navbar.
2. Press **Start camera** and point it at the passenger's QR code, **or** paste the ticket code (`NG-XXXXXXXX`) into the manual box.
3. Read the result panel: green means valid and the ticket is now used; red explains why it was rejected.
4. Use **Load demo ticket** to try the flow without booking.

### Explore fleet intelligence

1. Open **Operations** (or the **Operator dashboard** button on the home page).
2. Hover chart bars, points, and heatmap cells for exact values and hour-level tooltips.
3. Read the **AI fleet recommender** cards from top to bottom — highest risk appears first.
4. Compare a route's load percentage with its NISR signal and demand index in the capacity table.
5. Use **Refresh** to pull the latest numbers, or let the page update every 30 seconds.

### Sign in and manage a profile

1. Press **Sign in** in the navbar.
2. Use any name/email, choose a suggested Google account, or enter a custom account. No password is required.
3. The session, cached accounts, and booked tickets appear under **My account**.
4. Previously used accounts are offered again on the login screen and in email autocomplete.
5. **Sign out** clears the active session but keeps the local account list for next time.

### Ask the assistant

1. Press the floating chat button in the bottom-right corner.
2. Type a question or tap a suggestion chip, e.g. “Bus ijya Musanze ihaguruka ryari?”.
3. Follow any bus option shown in a reply to jump straight to booking.
4. Use the microphone button for browser speech input where supported.

---

## API reference

All endpoints are served under `/api`.

| Method | Endpoint | Purpose |
| --- | --- | --- |
| `GET` | `/health` | Service status and seed summary |
| `GET` | `/meta` | Routes, companies, dates, NISR metrics, chat context, formula |
| `GET` | `/buses?destination=&date=` | Departures filtered by route and date |
| `GET` | `/buses/:id` | Single bus plus seat map |
| `POST` | `/bookings` | Create a booking and issue a signed QR ticket |
| `GET` | `/tickets/demo` | Latest unused ticket for scanner testing |
| `POST` | `/tickets/verify` | Validate a QR payload or ticket code and mark it used |
| `GET` | `/tickets/:code` | Retrieve a ticket and its QR image |
| `GET` | `/admin/overview` | Full dashboard payload (metrics, demand, recommendations, history, heatmap, NISR) |
| `GET` | `/admin/nisr` | NISR dataset metadata and metrics |
| `GET` | `/admin/recommendations` | Route demand and fleet recommendations |
| `GET` | `/ai/status` | AI configuration and sample questions |
| `POST` | `/ai/chat` | Chat assistant reply |
| `GET` | `/ai/forecast` | Forecast, recommendations, and heatmap snapshot |
| `POST` | `/ai/asr` | Optional Hugging Face speech-to-text |

---

## How the demand model works

```text
Predicted_Demand =
    (Live_Bookings × 1.15)
  + (NISR_Commute_Weight_D23A × Regional_Multiplier × 4.18)
```

- **Live_Bookings** is the number of tickets sold today for that route.
- **NISR_Commute_Weight_D23A** is the 4.1% national public-transport share.
- **Regional_Multiplier** adjusts for district mobility: Rubavu `1.4`, Musanze `1.35`, Rusizi `1.25`, Huye `1.2`, Rwamagana `1.1`.
- **4.18** scales the NISR signal into the same units as live bookings.

The forecast then compares predicted passengers with available seats to produce a risk level and an extra-bus recommendation. Peak demand is projected hour-by-hour over the next 10 hours using historical hourly averages and day-of-week factors.

---

## Project structure

```text
.
├── client/                  # React + Vite web app
│   └── src/
│       ├── components/      # Navbar, bus cards, seat map, chat, layout
│       ├── context/         # Local-cache auth provider
│       ├── lib/             # API client and formatters
│       └── pages/           # Home, Booking, Ticket, Scanner, Admin, Account, Login
├── server/                  # Express API
│   └── src/
│       ├── data/nisr.js     # NISR dataset, routes, companies, sample names
│       ├── lib/             # Ticket signing, serializers, time helpers
│       ├── routes/          # meta, buses, tickets, admin, ai
│       ├── services/        # Analytics, chat NLU, Hugging Face integration
│       ├── db.js            # SQLite schema and helpers
│       ├── seed.js          # Demo data generator
│       └── index.js         # API entry point
└── package.json             # Workspace scripts
```

---

## Configuration

Copy `server/.env.example` to `server/.env`. All values are optional for local development.

| Variable | Default | Purpose |
| --- | --- | --- |
| `PORT` | `4000` | API port |
| `TICKET_SECRET` | dev fallback | Secret used to HMAC-sign QR ticket payloads |
| `HF_TOKEN` | empty | Enables optional Hugging Face translation/speech |
| `HF_INFERENCE_URL` | Hugging Face router | Inference endpoint |
| `HF_CHAT_MODEL` | `mbazaNLP/Nllb_finetuned_general_en_kin` | Kinyarwanda translation model |
| `HF_ASR_MODEL` | `mbazaNLP/Whisper-Small-Kinyarwanda` | Speech recognition model |
| `HF_TRANSLATE_MODEL` | `facebook/nllb-200-distilled-600M` | Kinyarwanda → English translation |
| `HF_FORECAST_MODEL` | `huggingface/Time-Series-Transformer` | Forecast model label |

---

## Important notes

- This is a **prototype**. Mobile-money payments are simulated, and the Google sign-in is a local mock, not real OAuth.
- Login profiles and recent tickets are **device-local** and are not synchronised across browsers or reviewed by the server.
- Booking, seat inventory, and ticket validity are stored in SQLite and enforced server-side, including duplicate-seat prevention and single-use QR validation.
- `npm run seed:force` destroys all local bookings and regenerates the demo dataset.
- The application is designed for the five provincial routes listed above; route/fare data can be edited in `server/src/data/nisr.js` and re-seeded.
