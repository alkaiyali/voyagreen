# How to use the hackathon harness

A 4-hour, 3-person runbook. The harness owns the phase state and **refuses to
advance until the artifacts are real**, so you always know what's next.

---

## Just want it done? One prompt.

Once per machine, make `/hackathon` available in every Claude Code session:

```bash
node ~/repos/hackathon/harness.mjs install
```

Then, from wherever you keep projects, open Claude Code and give it the idea,
the context, or both:

```
/hackathon class suspension alerts for Metro Manila students @notes.md @rubric.pdf
```

Autopilot sets up the project, builds the intake from your words and files,
builds the app, deck, and script, and loops each phase until its gates pass. It
asks at most one round of questions, and only when your context doesn't say
what the idea, the user, or the core feature is. It stops at rehearse and writes
**`HANDOFF.md`**: what's ready, and the few things only you can do (record the
backup video, run the poll, put the agent-written lines in your own voice,
rehearse out loud). It never force-skips a gate and never invents numbers.

Unattended (no questions at all — it decides and logs instead):

```bash
claude -p "/hackathon autopilot: <idea> — context in ./notes" \
  --allowedTools "Bash(node:*) Bash(python3:*) Bash(git:*) Bash(npm:*) Bash(npx:*) Read Edit Write Glob Grep"
```

Prefer to set it up yourself first? `node ~/repos/hackathon/harness.mjs start
../my-idea --context notes.md`, then `/hackathon autopilot` inside `../my-idea`.

The rest of this runbook is the manual path, and what autopilot does under the hood.

---

## 0. Setup — once, before the clock starts

```bash
cd ~/repos/hackathon
node harness.mjs bootstrap ../my-idea
```

That creates `../my-idea/`, installs the skill into it, and `git init`s it. The
project is now self-contained — commit it and all three of you have the same
harness.

> Prefer one repo with several ideas? Skip bootstrap and pass the project dir:
> `HACKATHON_DIR=../my-idea node harness.mjs init my-idea`

From here on, every command runs **from inside the project dir**, in the same
form on every OS and every shell — no aliases, no wrappers, no `.cmd` files:

```bash
cd ../my-idea
node harness.mjs status
```

(`bootstrap` writes that `harness.mjs` next to your project. It is two lines that
load the skill — pure Node, identical on Windows, macOS, and Linux.)

---

## 1. Ask first (minute 0–10)

The idea phase **cannot pass without recorded answers**, so start here — even if
you think you know the idea.

```bash
node harness.mjs ask --json     # the schema, for your agent's question tool
node harness.mjs ask            # the same questions, numbered, for a human
node harness.mjs ask --pending  # only what is still missing or thin
```

Let the **agent run the interview** with its own question tool — the `--json`
array carries `id/header/type/options/required/why`, so it renders natively and
can phrase questions for the user. Capture answers **verbatim**; never invent
them. Only three are required: the idea, who it's for, and the one core feature.
The optional ones decide how good the pitch is:

- `character` → one named person with the problem ("Bea, Grade 11, refreshing five
  Facebook pages at 5 AM") — leads the problem slide and the opening line
- `pain` + `painPoints` → the problem slide
- `hook` → your opening line
- `how` / `hardPart` → the how-it-works and what-we-built beats
- `proof` → numbers you measured yourselves, with how: `"23 of 30 students we asked … | hallway poll, Sep 30"`
- `closer` → your last line: the impact plus a tagline
- `qa` → the 3 questions you'll actually get — including what doesn't work yet
- `demo` → the 3 steps (if you skip this, the harness proposes one and **flags it**)
- `domainObject` → the ONE object to repeat across the UI and the deck (see Design, below)

Then record it and start the clock — and let the harness report what is still weak:

```bash
node harness.mjs init my-idea --hours 4 --deadline 18:00
node harness.mjs intake --answers .hackathon/intake.json --report   # { ok, gaps:[...] }
```

`--report` returns `missing` (blocking), `thin` (present but too vague), and
`recommended` (absent — it will cost you a slide or a beat). Re-ask only those
with `ask --pending`, then record again — `intake` **merges** over what is on
disk, so a second pass never wipes the first (`--fresh` resets). Only when the
blocking and thin gaps are gone is the intake actually done.

```bash
node harness.mjs intake --name my-idea \
  --idea "..." --who "..." --core "..." \
  --demo "step 1 → step 2 → step 3" \
  --pain "..." --painPoints "a,b,c" \
  --character "Bea, Grade 11, refreshing five pages at 5 AM" \
  --hook "..." --how "..." --hardPart "..." --pitch30 "..." \
  --proof "23 of 30 students we asked ...|hallway poll, Grade 11, Sep 30" \
  --closer "the impact. the tagline." \
  --qa "hardest question|one-line answer" \
  --domainObject "capsule" \
  --event "IRCite" --stack "Vite + React" --next "a,b" \
  --team "Alice driver, Bob pitcher, Cara runner"
```

`intake` writes `.hackathon/HACKATHON.md`, `.hackathon/SPEC.md`, and `.hackathon/answers.json`.

**Get local proof early.** The night before (or in the first hour), poll 20–30
people who have the problem — "How do you find out about X? Has Y ever happened
to you?" "Twenty-three of 30 students we asked…" is real, local, and beats any
national statistic. Record it with `intake --proof "result | how you asked"`.

**Quality in, quality out.** The deck and the script are generated from these
answers. A thin intake gives a thin pitch — the generators tell you what's missing.

**Stack defaults to single-file static HTML.** Zero install, fastest to a demo,
and everything the gates need (serve, screenshot) works with no tooling on any
OS. Only pick a framework if the idea needs multiple screens with shared state,
client-side routing, or an npm-only library — an `npm install` plus dev-server
wrangling costs 15–30 minutes of a 240-minute budget.

---

## 2. The loop

```bash
node harness.mjs status    # where we are, the clock, the gates, the single next action
node harness.mjs done      # run the gates; advance ONLY if they pass
```

That's the whole loop. `done` either advances, commits, and prints the next
action — or prints `✗` lines and stays put.

The loop is also visible as **goals, a timeline, and notes** — maintained by the
harness, so they can't drift from reality:

```bash
node harness.mjs goals      # current goal + owners + success criteria (also in .hackathon/GOALS.md)
node harness.mjs timeline   # phase windows against your deadline (also in .hackathon/TIMELINE.md)
node harness.mjs note "..." # decisions and learnings (appended to .hackathon/NOTES.md)
```

`.hackathon/GOALS.md` criteria come from the same definitions as the gates. Read it at the
start of every session instead of reconstructing the plan; write notes instead of
relying on memory. `done` is still the only thing that advances you.

| Phase | You do | The gate checks |
|---|---|---|
| idea | `intake` (above) | answers recorded, idea has substance |
| spec | refine `.hackathon/SPEC.md` | pitch, core feature, 3-step demo path, stack, cut list |
| build | build the demo path | **starts the app and fetches it** — an empty shell fails |
| ui | seed real data, make the wow loud | no lorem ipsum, screenshot captured, a domain object chosen |
| deck | `node harness.mjs deck --init --force` | zero placeholders, 4–5 slides, honest numbers |
| script | `node harness.mjs script --init --force` | 2-min length, beats, and **synced to the deck** |
| rehearse | record `present/demo-backup.mp4` | video present, **cold restart** passes |

### Design (applies to the UI *and* the deck)

See **Design rules** in `SKILL.md`. The short version: pick **one domain
object** and repeat it everywhere (hero, icon, empty states, favicon) at
different crops and scales; **one accent colour**, emphasis only, never a
blue→purple gradient; **light first** — projectors wash dark themes out, so
`palette` is light by default; **one vetted type + icon lane** — Lane A (default)
**Satoshi + Azeret Mono + Mynaui**, Lane B (technical) **IBM Plex + Fluent** —
never Inter, Roboto, JetBrains Mono, or a downloaded default pack; the
**real product is the hero image** — no stock photography, ever (`deck --init`
places the app screenshot for you); **procedural atmosphere**
(light, vignette, grain, one surface treatment); and **empty space is
allowed**. Record the object, the accent, and the type pairing in `.hackathon/SPEC.md` so
all three of you use the same ones.

### Generating the deck and script

```bash
node harness.mjs impact "Hours saved per week=5" "Blockers surfaced=3"   # after the app runs
node harness.mjs deck --init --force        # present/deck/slides.html from .hackathon/intake.json
node harness.mjs deck --images              # check it + one review PNG per slide
node harness.mjs script --init --force      # present/script.md, synced to the deck
```

**The deck is one HTML file.** `present/deck/slides.html` *is* the presentation: open it
in any browser, `f` for fullscreen, arrows to advance. No install, no render
step, no network — it works on venue wifi or none. Edit the HTML and CSS
directly; the script generator reads the same slide titles, so the two stay in
sync.

The generator supplies **structure and facts**. Any line it had to author is
stamped `**[DRAFT — rewrite in your own voice]**`, and the script gate **will not
pass while a draft remains**. Replace them — or supply `--hook/--how/--qa` and
regenerate. That's deliberate: generic filler must not reach the stage wearing
your voice.

---

## 3. Who does what (4 hours, 3 people)

| Time | Driver | Pitcher | Runner |
|---|---|---|---|
| 0:00–0:15 | all three: `ask` + `intake` | | |
| 0:15–2:15 | build the demo path | `deck --init`, then `script --init` from minute ~30 | seed content, watch the clock |
| 2:15–2:45 | UI polish | refine deck + script prose | |
| 2:45–3:00 | `node harness.mjs done` through the phases | | |
| 3:00–3:30 | **all three: rehearse** — timed run-through, `present/demo-backup.mp4` | | |
| 3:30–4:00 | buffer | | |

Deck and script outrank UI polish. Cut UI first, never the deck.

---

## 4. When something goes wrong

| Situation | Do |
|---|---|
| "You cannot advance" | the `✗` lines tell you exactly what's missing — fix those |
| Skipping a phase on purpose | `node harness.mjs done --force` records the skip in `.hackathon/log.jsonl`; `status` keeps showing it |
| Lost your place / new session | `node harness.mjs status` — it prints the phase and the next action |
| One gate failing oddly | `node harness.mjs check <phase>` runs just that gate |
| Everything, all at once | `node harness.mjs verify` runs every gate up to the current phase |
| App won't start for the gates | add `.hackathon/config.json` with `{"START_CMD": "npm run dev -- --port {PORT}", "PORT": 5173}` — `{PORT}` is replaced with the port the gate picked |
| Screenshots fail | install Chrome or Edge; the UI gate degrades to a warning without one |

Never hand-edit `.hackathon/state.json`. Use the harness.

---

## 5. On stage

The order: **Problem → Reveal (optional ~10 s video) → Live demo → Impact →
Close.** Drop a motion piece at `present/deck/assets/reveal.mp4` and `deck --init
--force` adds it after the problem — it plays muted and advances by itself.

- `present/script.md` — the operator keeps the **cue sheet** at the top open. Its Screen
  column says whether the deck or the **App** is up. Every beat says
  `▶ ADVANCE to Slide N after "..."`, `⇄ SWITCH to the app` / `⇄ SWITCH back to
  the deck`, `HOLD`, `AUTO` (the reveal video moves on by itself), or `END`.
- `present/deck/slides.html` — open in a browser, full screen.
- `present/demo-backup.mp4` — if the live demo dies, play this and keep talking.
- If asked how you built it: "we used AI coding tools." Transparency is the strategy.

**How the room actually decides.** Judges decide fast from a story, then use the
details to justify it — not because they're not sharp, but because everyone
works that way under time pressure. So:

- **Open on the person**, not the team name. Bea at 5 AM, then the problem.
- **Bring energy and calm.** Late in a long day, the team with energy stands
  out, and a smooth delivery earns the benefit of the doubt everywhere else.
- **Answer the probing judge truthfully.** There is always one. "Only 3 schools
  are wired up; the rest is seeded" said calmly beats any dodge.
- **End on the closer, then stop.** No "thank you, any questions?" — let the
  line hang; the moderator will open Q&A.
- **Persuade as hard as you can — but every claim must be true.** A great story
  about a real, working app is what should win. A great story about features
  that don't exist gets exposed in one question.
