# Spec

## Elevator pitch
VoyaGreen is a mobile-first travel recommender that scores a destination's tourism pressure, suggests a lower-pressure alternative with a similar vibe when it's overcrowded, and builds a day-by-day itinerary from the traveler's interests and trip length.

## Core feature
The pressure check and swap: pick a destination, see its tourism-pressure score with the indicators behind it, and get a greener alternative with a personalized itinerary.
This is the one thing that must work live.

## Demo path
1. Open the app with the the pressure check and swap: pick a destination, see its tourism-pressure score with the indicators behind it, and get a greener alternative with a personalized itinerary. flow ready
2. The pressure check and swap: pick a destination, see its tourism-pressure score with the indicators behind it, and get a greener alternative with a personalized itinerary.
3. See the result on screen, live

## Stack
Single-file static HTML + vanilla JS (fastest to demo). Add a backend only if the wow moment needs it.

## Design
- **Domain object**: a leaf-shaped map pin — the same object, repeated at different crops, scales and angles across the UI and the deck. One object reads as identity; a family reads as stock.
- **One accent colour**, emphasis only — never a blue→purple gradient.
- **Type**: Lane A (default) **Satoshi** + **Azeret Mono** · Lane B (dense/technical) **IBM Plex Sans** + **IBM Plex Mono**. Never Inter, Roboto, JetBrains Mono or a bare system font.
- **Icons**: inline SVG, never a downloaded default pack (Lucide, Heroicons, Feather, Font Awesome, Material, Bootstrap, Phosphor, Tabler). Lane A: **Mynaui** (MIT) · Lane B: **Fluent** (MIT, regular + filled for active states).

## Cut list (non-goals)
- Auth, accounts, persistence
- Deployment polish
- Tests beyond the demo path
