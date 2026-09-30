# resources/

Brand assets that go on **every** deck this skill generates.

- `logos/` — school / org / sponsor logos (`.png`, `.jpg`, `.svg`, `.webp`).
  `deck --init` copies every file here to `present/deck/assets/logos/` and puts
  them on the cover slide, in filename order. Currently: `wesschoollogo.png`
  (Wesleyan University-Philippines).

A project can add its own in `<project>/resources/logos/` — those are used too,
and a file with the same name overrides the skill's copy.
