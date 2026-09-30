# Spec

## Elevator pitch
VoyaGreen is a mobile-first travel recommender that scores a destination's tourism pressure, suggests a lower-pressure alternative with a similar vibe when it's overcrowded, and builds a day-by-day itinerary from the traveler's interests and trip length.

## Core feature
The pressure check and swap: pick a destination, see its tourism-pressure score with the indicators behind it, and get a greener alternative with a personalized itinerary.
This is the one thing that must work live.

## Demo path
1. Open VoyaGreen: quick onboarding, then pick beach, food and snorkeling for a 3-day trip
2. Tap Boracay: its tourism-pressure score is High (87), with the indicators behind it and a greener pick with the same vibe, Carabao Island
3. Tap Carabao Island: a 3-day itinerary built on those interests, 58 points lower pressure, saved to My trips

## Domain model
- **Destination**: name, province, vibe tags (beach, island, mountain, food, diving, surf, heritage), pressure score 0–100, level (Low / Moderate / High), indicators, alternative id.
- **Indicators** (seeded, illustrative — labelled "demo data" in the UI): visitor density, carrying-capacity use, environmental strain (reef / water / waste), peak-season crowding.
- **Itinerary**: days × (morning / afternoon / evening) slots filled from a curated activity list per destination, filtered by the traveler's interests.
- Seeded destinations: Boracay → Carabao Island · El Nido → Port Barton · Siargao → Bucas Grande · Baguio → Atok · Panglao → Anda.

## Stack
React Native + Expo SDK 57 (Expo Router) in `present/app/`. Screens: onboarding (3 pages) → setup → tabs (Explore, Trips, Profile) → destination/[id] (pressure check) → trip/[id] (itinerary). In-memory state, no backend. Runs on phones via Expo Go; the projector demo uses the static web export (`npx expo export -p web`), shown inside a phone frame. Colours from `palette.js` (same tokens as the deck).

## Design
- **Domain object**: a leaf-shaped map pin — app icon, destination markers, empty state, the deck hero.
- **Accent**: deep teal (sea + leaf), emphasis only. Pressure levels use status tokens: High → `--danger`, Moderate → `--warning`, Low → `--success`, always with a text label.
- **Type**: Lane A — Satoshi + Azeret Mono. Inline SVG icons only.

## Cut list (non-goals)
- Live tourism / environmental data feeds (scores are seeded)
- AI-generated itineraries (itineraries are assembled from a curated activity list)
- Booking, payments, accounts, saved trips
- Real maps / geolocation
- Accounts and persistence (onboarding is local; trips live in memory)
- Crowd rotation between alternatives
- Destinations outside the five seeded ones
