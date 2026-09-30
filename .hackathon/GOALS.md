# Goals — voyagreen

**Current goal: 2/7 · spec — Write the spec** (owner: all three).

Success looks like:
- [ ] pitch, core feature, demo path, stack, and cut list decided in SPEC.md
- [ ] demo path has 3 concrete ordered steps
- [ ] no unfilled placeholders

Verify with `node harness.mjs check spec`, advance with `node harness.mjs done`.

## All goals

- [x] **1 · idea — Lock the idea** · all three (done 12:15)
  - [x] intake recorded — idea, who, and core feature answered by the user
  - [x] HACKATHON.md exists with a 40+ character idea
  - [x] one core feature named
  - [x] no unfilled placeholders
- [ ] **2 · spec — Write the spec** · all three ← current
  - [ ] pitch, core feature, demo path, stack, and cut list decided in SPEC.md
  - [ ] demo path has 3 concrete ordered steps
  - [ ] no unfilled placeholders
- [ ] **3 · build — Build the demo path** · driver
  - [ ] app entry point present (single index.html is enough)
  - [ ] app starts and serves real content (>300 bytes, not an empty shell)
  - [ ] no template tokens in the served page
- [ ] **4 · ui — Make it demo-ready** · driver
  - [ ] no lorem ipsum or filler copy anywhere on the demo path
  - [ ] real-looking seed data so nothing is ever empty on stage
  - [ ] no generic fonts (Inter, Roboto, JetBrains Mono…) or downloaded icon packs
  - [ ] screenshot captured at .hackathon/evidence/ui.png
- [ ] **5 · deck — Build the deck** · pitcher
  - [ ] deck/slides.html exists, generated from the recorded answers
  - [ ] zero unfilled placeholders
  - [ ] no generic fonts or downloaded icon packs
  - [ ] 4–5 slides
  - [ ] numbers are measured with a source, or labelled a projection — never implied traction
  - [ ] nothing on the SPEC cut list is presented as built (only on What's next)
- [ ] **6 · script — Write the demo script** · pitcher
  - [ ] 100–340 spoken words (~2 minutes, memorizable)
  - [ ] at least 4 beats, plus a 30-second fallback and Q&A
  - [ ] every beat names a real slide and tells the operator when to advance
  - [ ] slide numbers cover the whole deck and only move forward
  - [ ] the live demo switches to the app and back to the same slide — never stranded on the app
  - [ ] opens on a named person and the problem — never a greeting or the team name
  - [ ] ends on the impact and a tagline — never "thank you, any questions"
  - [ ] nothing on the SPEC cut list is presented as built
- [ ] **7 · rehearse — Rehearse** · all three
  - [ ] backup recording (demo-backup.mp4) of the full demo path, 15s+
  - [ ] cold restart passes — the app survives being killed and restarted
  - [ ] deck and script gates still green after last-minute edits

_Regenerated 2026-09-30T04:15:05.831Z by the harness from the gate definitions. Don't hand-edit the checkboxes — run the gates._
