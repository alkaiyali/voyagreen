export type Slot = 'am' | 'pm' | 'eve';
export type Activity = { t: string; tags: string[]; slot: Slot };
export type Destination = {
  name: string; province: string; vibe: string[]; blurb: string;
  indicators: Record<'density' | 'capacity' | 'environment' | 'peak', number>;
  alt?: string; activities: Activity[];
};

// Seeded demo data. Pressure indicators are ILLUSTRATIVE, not measured —
// the UI labels them "demo data". Activities are a curated sample list.
// Indicator scale: 0 (no pressure) – 100 (severe pressure).

export const INTERESTS = [
  { id: 'beach', label: 'Beach' },
  { id: 'snorkeling', label: 'Snorkeling' },
  { id: 'food', label: 'Food' },
  { id: 'hiking', label: 'Hiking' },
  { id: 'culture', label: 'Culture' },
  { id: 'surfing', label: 'Surfing' },
  { id: 'nature', label: 'Nature' },
  { id: 'nightlife', label: 'Nightlife' },
];

export const INDICATORS = [
  { id: 'density', label: 'Visitor density', hint: 'tourists per resident at peak', weight: 0.3 },
  { id: 'capacity', label: 'Carrying capacity used', hint: 'arrivals vs. what the place can absorb', weight: 0.3 },
  { id: 'environment', label: 'Environmental strain', hint: 'reef, water and waste load', weight: 0.25 },
  { id: 'peak', label: 'Peak-season crowding', hint: 'how concentrated visits are', weight: 0.15 },
];

export const DESTINATIONS: Record<string, Destination> = {
  boracay: {
    name: 'Boracay', province: 'Aklan', vibe: ['beach', 'snorkeling', 'food', 'nightlife'],
    blurb: 'White Beach, sunsets, the country’s most famous island',
    indicators: { density: 92, capacity: 88, environment: 81, peak: 84 },
    alt: 'carabao',
    activities: [
      { t: 'Swim and sunbathe at White Beach Station 2', tags: ['beach'], slot: 'am' },
      { t: 'Island-hopping snorkel trip to Crystal Cove', tags: ['snorkeling', 'beach'], slot: 'am' },
      { t: 'Seafood paluto lunch at D’Talipapa market', tags: ['food'], slot: 'pm' },
      { t: 'Paddleboard at Bulabog Beach', tags: ['beach', 'nature'], slot: 'pm' },
      { t: 'Sunset paraw sailing', tags: ['beach', 'nature'], slot: 'eve' },
      { t: 'Beachfront bars along Station 1', tags: ['nightlife', 'food'], slot: 'eve' },
      { t: 'Hike up Mount Luho viewpoint', tags: ['hiking', 'nature'], slot: 'am' },
    ],
  },
  carabao: {
    name: 'Carabao Island', province: 'San Jose, Romblon', vibe: ['beach', 'snorkeling', 'food', 'nature'],
    blurb: 'Boracay’s quiet neighbour to the north — same white sand, a fraction of the crowd',
    indicators: { density: 24, capacity: 31, environment: 28, peak: 35 },
    activities: [
      { t: 'Morning swim at Lanas Beach — powdery sand, almost empty', tags: ['beach'], slot: 'am' },
      { t: 'Snorkel the reef off the west coast with a local boatman', tags: ['snorkeling', 'nature'], slot: 'am' },
      { t: 'Grilled catch-of-the-day lunch at a family-run carinderia', tags: ['food'], slot: 'pm' },
      { t: 'Cliff jump and swim at Cathedral Cave', tags: ['beach', 'nature'], slot: 'pm' },
      { t: 'Kayak around the coves at golden hour', tags: ['nature', 'beach'], slot: 'eve' },
      { t: 'Kinilaw and fresh buko by the shore', tags: ['food'], slot: 'eve' },
      { t: 'Hike the inland trail to the island viewpoint', tags: ['hiking', 'nature'], slot: 'am' },
      { t: 'Visit the San Jose town plaza and chapel', tags: ['culture'], slot: 'pm' },
      { t: 'Stargazing on the beach — no light pollution', tags: ['nature'], slot: 'eve' },
    ],
  },
  elnido: {
    name: 'El Nido', province: 'Palawan', vibe: ['beach', 'snorkeling', 'nature', 'nightlife'],
    blurb: 'Limestone lagoons and the famous Tours A–D',
    indicators: { density: 84, capacity: 86, environment: 79, peak: 80 },
    alt: 'portbarton',
    activities: [
      { t: 'Tour A: Big Lagoon and Secret Lagoon', tags: ['snorkeling', 'nature'], slot: 'am' },
      { t: 'Lunch at Las Cabañas beach', tags: ['food', 'beach'], slot: 'pm' },
      { t: 'Taraw Cliff climb', tags: ['hiking', 'nature'], slot: 'am' },
      { t: 'Sunset at Corong-Corong', tags: ['beach'], slot: 'eve' },
      { t: 'Town bars on Calle Hama', tags: ['nightlife'], slot: 'eve' },
    ],
  },
  portbarton: {
    name: 'Port Barton', province: 'San Vicente, Palawan', vibe: ['beach', 'snorkeling', 'nature', 'food'],
    blurb: 'Laid-back bay village with turtles, reefs and empty islands',
    indicators: { density: 33, capacity: 36, environment: 30, peak: 42 },
    activities: [
      { t: 'Island-hop to German Island and Twin Reef', tags: ['snorkeling', 'beach'], slot: 'am' },
      { t: 'Swim with sea turtles at Turtle Spot', tags: ['snorkeling', 'nature'], slot: 'am' },
      { t: 'Walk the jungle trail to Pamuayan Falls', tags: ['hiking', 'nature'], slot: 'pm' },
      { t: 'Lunch of grilled squid at the bayside eatery', tags: ['food'], slot: 'pm' },
      { t: 'Sunset from White Beach', tags: ['beach'], slot: 'eve' },
      { t: 'Dinner at a village family kitchen', tags: ['food', 'culture'], slot: 'eve' },
      { t: 'Kayak the mangroves', tags: ['nature'], slot: 'am' },
    ],
  },
  siargao: {
    name: 'Siargao', province: 'Surigao del Norte', vibe: ['surfing', 'beach', 'nightlife', 'nature'],
    blurb: 'Cloud 9 and the surf capital’s party strip',
    indicators: { density: 78, capacity: 82, environment: 70, peak: 76 },
    alt: 'bucasgrande',
    activities: [
      { t: 'Surf lesson at Cloud 9', tags: ['surfing', 'beach'], slot: 'am' },
      { t: 'Magpupungko rock pools', tags: ['nature', 'beach'], slot: 'pm' },
      { t: 'Island-hop Naked, Daku and Guyam', tags: ['beach', 'snorkeling'], slot: 'am' },
      { t: 'General Luna night market', tags: ['food', 'nightlife'], slot: 'eve' },
    ],
  },
  bucasgrande: {
    name: 'Bucas Grande', province: 'Socorro, Surigao del Norte', vibe: ['nature', 'snorkeling', 'beach', 'culture'],
    blurb: 'Sohoton Cove’s hidden lagoons, jellyfish sanctuary and stilt villages',
    indicators: { density: 22, capacity: 34, environment: 29, peak: 38 },
    activities: [
      { t: 'Paddle into Sohoton Cove at low tide', tags: ['nature'], slot: 'am' },
      { t: 'Swim in the stingless-jellyfish lagoon', tags: ['nature', 'snorkeling'], slot: 'am' },
      { t: 'Cliff jump at Magkukuob Cove', tags: ['beach', 'nature'], slot: 'pm' },
      { t: 'Lunch in a stilt-house fishing village', tags: ['food', 'culture'], slot: 'pm' },
      { t: 'Sunset paddle through the mangroves', tags: ['nature'], slot: 'eve' },
      { t: 'Home-cooked seafood with a host family', tags: ['food', 'culture'], slot: 'eve' },
    ],
  },
  baguio: {
    name: 'Baguio', province: 'Benguet', vibe: ['food', 'culture', 'hiking', 'nature'],
    blurb: 'Cool weather, strawberries and Session Road',
    indicators: { density: 80, capacity: 85, environment: 74, peak: 88 },
    alt: 'atok',
    activities: [
      { t: 'Burnham Park and the market', tags: ['culture', 'food'], slot: 'am' },
      { t: 'Strawberry farm in La Trinidad', tags: ['food', 'nature'], slot: 'am' },
      { t: 'Café hop on Session Road', tags: ['food'], slot: 'pm' },
      { t: 'Night market on Harrison Road', tags: ['food', 'nightlife'], slot: 'eve' },
    ],
  },
  atok: {
    name: 'Atok', province: 'Benguet', vibe: ['hiking', 'nature', 'food', 'culture'],
    blurb: 'Highland flower farms and sea-of-clouds ridges above the crowds',
    indicators: { density: 18, capacity: 27, environment: 32, peak: 45 },
    activities: [
      { t: 'Sunrise sea of clouds from the Northern Blossom ridge', tags: ['nature', 'hiking'], slot: 'am' },
      { t: 'Walk the flower and vegetable terraces', tags: ['nature', 'culture'], slot: 'am' },
      { t: 'Highland lunch — pinikpikan and fresh greens', tags: ['food', 'culture'], slot: 'pm' },
      { t: 'Trek toward the Timbac caves area with a local guide', tags: ['hiking', 'culture'], slot: 'pm' },
      { t: 'Bonfire and hot coffee at a farm homestay', tags: ['food'], slot: 'eve' },
      { t: 'Stargazing from the highest highway point', tags: ['nature'], slot: 'eve' },
    ],
  },
  panglao: {
    name: 'Panglao', province: 'Bohol', vibe: ['beach', 'snorkeling', 'food', 'culture'],
    blurb: 'Alona Beach resorts and Balicasag dive trips',
    indicators: { density: 68, capacity: 64, environment: 62, peak: 66 },
    alt: 'anda',
    activities: [
      { t: 'Dolphin watch and snorkel at Balicasag', tags: ['snorkeling', 'nature'], slot: 'am' },
      { t: 'Alona Beach afternoon', tags: ['beach'], slot: 'pm' },
      { t: 'Seafood dinner on Alona strip', tags: ['food', 'nightlife'], slot: 'eve' },
    ],
  },
  anda: {
    name: 'Anda', province: 'Bohol', vibe: ['beach', 'snorkeling', 'nature', 'culture'],
    blurb: 'Bohol’s quiet east coast — white sand, cave pools, no strip',
    indicators: { density: 26, capacity: 30, environment: 27, peak: 36 },
    activities: [
      { t: 'Swim at Quinale Beach at sunrise', tags: ['beach'], slot: 'am' },
      { t: 'Snorkel the house reef with a community-run guide', tags: ['snorkeling', 'nature'], slot: 'am' },
      { t: 'Dip in the Cabagnow Cave Pool', tags: ['nature'], slot: 'pm' },
      { t: 'See the red-ochre cave paintings at Bitoon', tags: ['culture'], slot: 'pm' },
      { t: 'Fresh kinilaw at a roadside eatery', tags: ['food'], slot: 'eve' },
      { t: 'Beach walk under the stars', tags: ['beach', 'nature'], slot: 'eve' },
    ],
  },
};

// Destinations a traveler can pick (the famous ones people default to).
export const PICKS = ['boracay', 'elnido', 'siargao', 'baguio', 'panglao'];

export const TIPS = [
  'Bring a refillable bottle — most island resorts refill for free.',
  'Book a locally owned homestay so the money stays on the island.',
  'Use reef-safe sunscreen before you snorkel.',
  'Carry your trash back out — small islands can’t process it.',
  'Hire local guides and boatmen directly.',
];
