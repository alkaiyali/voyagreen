# Demo script — <PROJECT NAME>

**Presenter** speaks. **Operator** advances. <N> slides, <N> beats, ~<N>s.

> Operator: keep this open on the slide deck machine. Advance only when you hear the trigger.

## Operator cue sheet

| Beat | Slide | Slide title | Cue |
|------|-------|-------------|-----|
| 1 | 1 | <Slide 1 title> | ▶ ADVANCE to Slide 2 after "...<last 3-4 words>" |
| 2 | 2 | <Slide 2 title> | ▶ ADVANCE to Slide 3 after "...<last 3-4 words>" |
| 3 | 3 | <Slide 3 title> | HOLD — stay on Slide 3 |
| 4 | 4 | <Slide 4 title> | END — stop on this slide |

## Beats

### Beat 1 · Slide 1 — <Slide 1 title>
**Say:** "<Opening line, <= 12 words.>"
**Do:** <What the presenter does physically.>
**Operator:** ▶ ADVANCE to Slide 2 after "...<last 3-4 words of the line above>"

### Beat 2 · Slide 2 — <Slide 2 title>
**Say:** "<The pain, one sentence.>"
**Do:** <Gesture / point.>
**Operator:** ▶ ADVANCE to Slide 3 after "...<last 3-4 words>"

### Beat 3 · Slide 3 — <Slide 3 title>
**Say:** "<Lead into the live demo.>"
**Click:** <the exact control in the app>
**Operator:** HOLD — stay on Slide 3

### Beat 4 · Slide 4 — <Slide 4 title>
**Say:** "<The wow line. Verbatim.>"
**Do:** Point at <the big number / chart>.
**Operator:** END — stop on this slide

## 30-second short version

"<problem> ... <what it does> ... <the ask>."

Use this if the timer is already red.

## Likely Q&A

1. **Q:** <hardest question, e.g. "How is this different from X?">
   **A:** <one-sentence answer.>
2. **Q:** <"What about scale?">
   **A:** <one-sentence answer.>
3. **Q:** <"How did you build this so fast?">
   **A:** We used AI coding tools to move fast, and kept the scope to one feature.

---

## Rules for a script that survives the stage

- **Every beat names its slide**, exactly as it appears in the deck source
  (`present/deck/slides.html`). If you
  rename a slide in the deck, the sync gate fails until you update the script.
- **Every beat has one `**Operator:**` cue** — `ADVANCE`, `HOLD`, or `END`.
- **The advance trigger is the last 3–4 spoken words**, so the operator reacts to
  the line, not to a guess.
- **Slides only ever move forward.** No going back.
- **Every slide gets a beat.** A slide that appears with no narration is dead air.
