# Handoff — voyagreen

Phase **rehearse** (7/7).

## Ready

- **App** — `present/app/` · `node harness.mjs smoke` starts it
- **Deck** — `present/deck/slides.html` (open in a browser, `f` for fullscreen)
- **Script** — `present/script.md` (operator cue sheet at the top)

## Only you can do these

1. Poll 20–30 people who have the problem, then: node harness.mjs intake --proof "23 of 30 … | how you asked"  and regenerate deck + script  
   _real local proof beats any statistic — and it must not be invented_
2. Add event and team for the title slide: node harness.mjs intake --event "…" --team "…", then regenerate the deck  
   _only you know these_
3. Read and rewrite in your own voice: who, core, demo, domainObject, stack, pain, character, painPoints, hook, closer, qa, pitch30, next, how, hardPart (agent-written, see .hackathon/answers.json)  
   _you are the one saying it on stage_
4. The named person is a composite from your context — swap in someone real you know, or present them as an example, never as a real user  
   _everything you say has to be true_
5. Screen-record the 3-step demo path as present/demo-backup.mp4 (15s+)  
   _live demos fail; video does not_
6. Run the full pitch out loud, timed, with a teammate playing the judge who probes  
   _confidence and energy cannot be generated_

## Then

```bash
node harness.mjs done      # rehearse -> done, once the video exists
node harness.mjs verify    # every gate, one last time
```
