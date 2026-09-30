# Demo script — voyagreen

**Presenter** speaks. **Operator** advances. 5 slides, 9 beats, ~95s.

> Operator: keep this open on the slide deck machine. Advance only when you hear the trigger.
> Kyla, Migs and Jen are an example barkada, not real users — present them as "picture this", never as someone we interviewed.

## Operator cue sheet

| Beat | Screen | Slide title | Cue |
|------|--------|-------------|-----|
| 1 | Slide 1 | VoyaGreen | ▶ ADVANCE to Slide 2 after "...where do we go?" |
| 2 | Slide 2 | Sound familiar? | ▶ ADVANCE to Slide 3 after "...paying for it." |
| 3 | Slide 3 | The problem | ▶ ADVANCE to Slide 4 after "...pressure it adds." |
| 4 | Slide 4 | What we built | ⇄ SWITCH to the app after "...show you." |
| 5 | **App** | What we built | HOLD — stay on the app |
| 6 | **App** | What we built | HOLD — stay on the app |
| 7 | **App** | What we built | ⇄ SWITCH back to the deck, Slide 4, after "...Save this trip." |
| 8 | Slide 4 | What we built | ▶ ADVANCE to Slide 5 after "...your own interests." |
| 9 | Slide 5 | Travel greener, not less | END — stop on this slide |

## Beats

### Beat 1 · Slide 1 — VoyaGreen
**Say:** "Every summer, every barkada group chat has the same question: where do we go?"
**Do:** Stand still. Ask it like you've asked it yourself — you have.
**Operator:** ▶ ADVANCE to Slide 2 after "...where do we go?"

### Beat 2 · Slide 2 — Sound familiar?
**Say:** "Picture Kyla. She asks her barkada: three days, saan tayo? Migs says Boracay, it's all over his TikTok. Jen says, Boracay na lang ulit. Tara na. Then they get there: towels touching on White Beach, a line at every restaurant, and an island that's paying for it."
**Do:** Let the chat land — pause after "Boracay na lang ulit"; people will laugh or nod.
**Operator:** ▶ ADVANCE to Slide 3 after "...paying for it."

### Beat 3 · Slide 3 — The problem
**Say:** "It got so bad that in 2018, the government closed Boracay for six months. And yet every app still sends everyone to the same few spots, ranked by popularity and price — never by the pressure it adds."
**Do:** Point at the 2018 line. Slow down on "six months".
**Operator:** ▶ ADVANCE to Slide 4 after "...pressure it adds."

### Beat 4 · Slide 4 — What we built
**Say:** "So we built VoyaGreen. Let me show you."
**Do:** Turn to the app screen.
**Operator:** ⇄ SWITCH to the app after "...show you."

### Beat 5 · Slide 4 — What we built
**Screen:** the app (the deck waits on this slide)
**Say:** "Kyla's barkada wants beach, food and snorkeling, three days. That's already set — Continue."
**Click:** Get started → setup has beach, food, snorkeling, 3 days picked → Continue
**Operator:** HOLD — stay on the app

### Beat 6 · Slide 4 — What we built
**Screen:** the app (the deck waits on this slide)
**Say:** "She checks Boracay: 87 out of 100, high pressure — packed past what it can absorb. And right there, Carabao Island: same beach-and-snorkel vibe, 67% less pressure."
**Click:** On Plan, pick Boracay → Check Boracay → show Carabao Island at the top of greener options
**Operator:** HOLD — stay on the app

### Beat 7 · Slide 4 — What we built
**Screen:** the app (the deck waits on this slide)
**Say:** "One tap, and it's a full three-day trip built around what they wanted. Save this trip."
**Click:** Go with Carabao Island → itinerary → Save this trip
**Do:** Pause. Let them look at the itinerary.
**Operator:** ⇄ SWITCH back to the deck, Slide 4, after "...Save this trip."

### Beat 8 · Slide 4 — What we built
**Say:** "We built it in React Native with Expo. The hard part was making the swap feel like the same trip — same vibe, and every day built from your own interests."
**Do:** One line, no lingering.
**Operator:** ▶ ADVANCE to Slide 5 after "...your own interests."

### Beat 9 · Slide 5 — Travel greener, not less
**Say:** "VoyaGreen won't tell you to stay home. It shows you somewhere just as good that the crowd hasn't found. Travel greener, not less."
**Do:** Land the closing line. Stop talking. Do not say "thank you, any questions" — let the line hang.
**Operator:** END — stop on this slide

## 30-second short version

"Travel apps send everyone to the same famous places, and those places pay for it. VoyaGreen checks a destination's tourism pressure before you go. If it's crowded, it finds a lower-pressure place with the same vibe and builds your itinerary there. Same great trip, less strain."

Do this one if the timer is already red: say it over Slides 1, 3 and the last slide.

## Likely Q&A

1. **Q:** Where does the pressure score come from?
   **A:** The pressure scores are seeded and illustrative, and the app labels them demo data. Each one combines visitor density, carrying-capacity use, environmental strain and peak-season crowding. Next to it, an estimated occupancy for today moves with real open signals: Wikipedia pageviews, Philippine holidays, the weather forecast and air quality. The app labels that an estimate.

2. **Q:** Is the itinerary AI-generated?
   **A:** No. In this MVP it's assembled from a curated activity list per destination, matched to your interests and trip length. There's no live AI call, so it never fails on stage.

3. **Q:** What doesn't work yet?
   **A:** The pressure scores are illustrative, not measured, and there's no official tourism-arrival feed behind them yet. The occupancy estimate uses open proxies, not real headcounts. There's no booking, no accounts and no real map. Those are next.

4. **Q:** Won't this just move the crowd to the alternative?
   **A:** It could, and that's the right worry. It isn't built yet, but crowd rotation is next on our list: once scores are live, alternatives rotate as their own pressure rises, so we spread visitors out instead of relocating the crowd.
