# Demo script — voyagreen

**Presenter** speaks. **Operator** advances. 4 slides, 8 beats, ~78s (196 spoken words).

> Operator: keep this open on the slide deck machine. Advance only when you hear the trigger.

## Operator cue sheet

| Beat | Screen | Slide title | Cue |
|------|--------|-------------|-----|
| 1 | Slide 1 | VoyaGreen | ▶ ADVANCE to Slide 2 after "...else is already going." |
| 2 | Slide 2 | The problem | ▶ ADVANCE to Slide 3 after "...pressure on the place" |
| 3 | Slide 3 | What we built | ⇄ SWITCH to the app after "...show you it working" |
| 4 | **App** | What we built | HOLD — stay on the app |
| 5 | **App** | What we built | HOLD — stay on the app |
| 6 | **App** | What we built | ⇄ SWITCH back to the deck, Slide 3, after "...pressure; Save this trip." |
| 7 | Slide 3 | What we built | ▶ ADVANCE to Slide 4 after "...from your own interests." |
| 8 | Slide 4 | Travel greener, not less | END — stop on this slide |

## Beats

### Beat 1 · Slide 1 — VoyaGreen
**Say:** "Kyla has three days, a barkada, and one question: where do we go? Every app she opens gives her the same answer — the place everyone else is already going."
**Do:** Stand still. Tell it like a story, not a feature list. Team name comes later, if at all.
**Operator:** ▶ ADVANCE to Slide 2 after "...else is already going."

### Beat 2 · Slide 2 — The problem
**Say:** "Every traveler gets sent to the same few famous spots, so those places get overcrowded and strained, and nobody sees the pressure their choice adds. Recommendations rank by popularity, price and distance, never by the pressure on the place"
**Do:** Point at the headline.
**Operator:** ▶ ADVANCE to Slide 3 after "...pressure on the place"

### Beat 3 · Slide 3 — What we built
**Say:** "Let me show you it working."
**Do:** Turn to the app screen.
**Operator:** ⇄ SWITCH to the app after "...show you it working"

### Beat 4 · Slide 3 — What we built
**Screen:** the app (the deck waits on this slide)
**Say:** "Get started, and setup already has beach, food, snorkeling and 3 days picked; tap Continue."
**Click:** Get started, and setup already has beach, food, snorkeling and 3 days picked; tap Continue
**Operator:** HOLD — stay on the app

### Beat 5 · Slide 3 — What we built
**Screen:** the app (the deck waits on this slide)
**Say:** "On Plan, pick Boracay and tap Check Boracay: 87 out of 100, High pressure, packed past what it can absorb, and Carabao Island first among the greener options, 67% less pressure."
**Click:** On Plan, pick Boracay and tap Check Boracay: 87 out of 100, High pressure, packed past what it can absorb, and Carabao Island first among the greener options, 67% less pressure
**Operator:** HOLD — stay on the app

### Beat 6 · Slide 3 — What we built
**Screen:** the app (the deck waits on this slide)
**Say:** "And here's the moment that matters: Tap Go with Carabao Island: a 3-day itinerary 58 points lower in pressure; Save this trip."
**Click:** Tap Go with Carabao Island: a 3-day itinerary 58 points lower in pressure; Save this trip
**Do:** Pause. Let them look at the result.
**Operator:** ⇄ SWITCH back to the deck, Slide 3, after "...pressure; Save this trip."

### Beat 7 · Slide 3 — What we built
**Say:** "We built it with React Native with Expo; the hard part was making the swap feel like the same trip: same vibe, and every day built from your own interests."
**Do:** One line per bullet, no lingering.
**Operator:** ▶ ADVANCE to Slide 4 after "...from your own interests."

### Beat 8 · Slide 4 — Travel greener, not less
**Say:** "VoyaGreen won't tell you to stay home. It shows you somewhere just as good that the crowd hasn't found. Travel greener, not less."
**Do:** Land the closing line. Stop talking. Do not say "thank you, any questions" — let the line hang.
**Operator:** END — stop on this slide

## 30-second short version

"Travel apps send everyone to the same famous places, and those places pay for it. VoyaGreen checks a destination's tourism pressure before you go. If it's crowded, it finds a lower-pressure place with the same vibe and builds your itinerary there. Same great trip, less strain."

Do this one if the timer is already red: say it over Slides 1, 2 and the last slide.

## Likely Q&A

1. **Q:** Where does the pressure score come from?
   **A:** The pressure scores are seeded and illustrative, and the app labels them demo data. Each one combines visitor density, carrying-capacity use, environmental strain and peak-season crowding. Next to it, an estimated occupancy for today moves with real open signals: Wikipedia pageviews, Philippine holidays, the weather forecast and air quality. The app labels that an estimate.

2. **Q:** Is the itinerary AI-generated?
   **A:** No. In this MVP it's assembled from a curated activity list per destination, matched to your interests and trip length. There's no live AI call, so it never fails on stage.

3. **Q:** What doesn't work yet?
   **A:** The pressure scores are illustrative, not measured, and there's no official tourism-arrival feed behind them yet. The occupancy estimate uses open proxies, not real headcounts. There's no booking, no accounts and no real map. Those are next.

4. **Q:** Won't this just move the crowd to the alternative?
   **A:** It could, and that's the right worry. It isn't built yet, but crowd rotation is next on our list: once scores are live, alternatives rotate as their own pressure rises, so we spread visitors out instead of relocating the crowd.
