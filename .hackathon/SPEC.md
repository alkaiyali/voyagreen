# Spec

## Elevator pitch
VoyaGreen is a mobile-first travel recommender that scores a destination's tourism pressure, suggests a lower-pressure alternative with a similar vibe when it's overcrowded, and builds a day-by-day itinerary from the traveler's interests and trip length.

## Core feature
The pressure check and swap: pick a destination, see its tourism-pressure score with the indicators behind it, and get a greener alternative with a personalized itinerary.
This is the one thing that must work live.

## Demo path
1. Get started, and setup already has beach, food, snorkeling and 3 days picked; tap Continue
2. On Plan, pick Boracay and tap Check Boracay: 87 out of 100, High pressure, packed past what it can absorb, and Carabao Island first among the greener options, 67% less pressure
3. Tap Go with Carabao Island: a 3-day itinerary 58 points lower in pressure; Save this trip

## Domain model
- **Destination**: name, province, vibe tags (beach, island, mountain, food, diving, surf, heritage), pressure score 0–100, level (Low / Moderate / High), indicators, alternative id.
- **Indicators** (seeded, illustrative — labelled "demo data" in the UI): visitor density, carrying-capacity use, environmental strain (reef / water / waste), peak-season crowding.
- **Itinerary**: days × (morning / afternoon / evening) slots filled from a curated activity list per destination, filtered by the traveler's interests.
- Seeded destinations (20): Boracay → Carabao Island · El Nido → Port Barton · Siargao → Bucas Grande · Baguio → Atok · Panglao → Anda · Coron → Linapacan · Vigan → Paoay · Banaue → Batad · Camiguin → Mantigue · Baler → Dingalan.

## Stack
React Native + Expo SDK 57 (Expo Router) in `present/app/`. Screens: welcome → setup → tabs (Plan, Trips, Profile) → destination/[id] (pressure check) → trip/[id] (itinerary). In-memory state, no backend. Runs on phones via Expo Go; the projector demo uses the static web export (`npx expo export -p web`), shown inside a phone frame. Colours from `palette.js` (same tokens as the deck).

## Design
- **Domain object**: a leaf-shaped map pin — app icon, destination markers, empty state, the deck hero.
- **Accent**: deep teal (sea + leaf), emphasis only. Pressure levels use status tokens: High → `--danger`, Moderate → `--warning`, Low → `--success`, always with a text label.
- **Type**: Lane A — Satoshi + Azeret Mono. Inline SVG icons only.

## Live data (added after build)
- Destination photos resolve live from the Wikimedia Commons API (curated file per destination, search fallback), with CC attribution in the UI; the gradient + leaf pin is the offline fallback.
- The "Live signals" panel estimates today's occupancy from open, keyless APIs: Wikipedia pageviews (search interest, 12 months), Nager.Date (PH holidays / long weekends) and Open-Meteo (rain, air quality). It is always labelled an estimate — never a measurement — and falls back to an offline model.

## Cut list (non-goals)
- Measured tourism / environmental data (seeded scores are illustrative; live signals are estimates from open data)
- AI-generated itineraries (itineraries are assembled from a curated activity list)
- Booking, payments
- Real maps / geolocation
- Accounts and persistence (onboarding is local; trips live in memory)
- Crowd rotation between alternatives
- Destinations outside the twenty seeded ones
