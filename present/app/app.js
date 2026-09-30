(() => {
  if (/still=1/.test(location.search)) document.documentElement.classList.add('still');
  const D = window.VG_DESTINATIONS, IND = window.VG_INDICATORS;
  const $ = (s) => document.querySelector(s);
  const state = { dest: null, days: 3, interests: new Set(), chosen: null };

  // ── scoring ────────────────────────────────────────────────────────────
  const score = (d) => Math.round(IND.reduce((s, i) => s + d.indicators[i.id] * i.weight, 0));
  const level = (n) => n >= 65 ? { id: 'high', label: 'High pressure', tone: 'danger' }
    : n >= 45 ? { id: 'mod', label: 'Moderate pressure', tone: 'warning' }
    : { id: 'low', label: 'Low pressure', tone: 'success' };
  const tone = (n) => level(n).tone;

  // ── screen 1 ───────────────────────────────────────────────────────────
  const destList = $('#destList');
  window.VG_PICKS.forEach((id) => {
    const d = D[id];
    const b = document.createElement('button');
    b.type = 'button'; b.className = 'dest'; b.dataset.id = id;
    b.setAttribute('role', 'radio'); b.setAttribute('aria-checked', 'false');
    b.innerHTML = `<svg class="dest-pin"><use href="#pin"/></svg>
      <span class="dest-text"><span class="dest-name">${d.name}</span><span class="dest-prov">${d.province}</span></span>
      <span class="dest-vibe">${d.vibe.slice(0, 2).join(' · ')}</span>`;
    b.onclick = () => { state.dest = id; syncPlan(); };
    destList.appendChild(b);
  });

  const chips = $('#interests');
  window.VG_INTERESTS.forEach(({ id, label }) => {
    const c = document.createElement('button');
    c.type = 'button'; c.className = 'chip'; c.dataset.id = id; c.textContent = label;
    c.setAttribute('aria-pressed', 'false');
    c.onclick = () => { state.interests.has(id) ? state.interests.delete(id) : state.interests.add(id); syncPlan(); };
    chips.appendChild(c);
  });

  $('#dMinus').onclick = () => { state.days = Math.max(1, state.days - 1); syncPlan(); };
  $('#dPlus').onclick = () => { state.days = Math.min(5, state.days + 1); syncPlan(); };

  function syncPlan() {
    destList.querySelectorAll('.dest').forEach((b) => b.setAttribute('aria-checked', String(b.dataset.id === state.dest)));
    chips.querySelectorAll('.chip').forEach((c) => c.setAttribute('aria-pressed', String(state.interests.has(c.dataset.id))));
    $('#days').textContent = state.days;
    $('#checkBtn').disabled = !state.dest;
  }

  $('#checkBtn').onclick = () => { renderPressure(); go('pressure'); };

  // ── screen 2 ───────────────────────────────────────────────────────────
  function renderPressure() {
    const d = D[state.dest], s = score(d), lv = level(s);
    const alt = d.alt && D[d.alt];
    $('#scoreCard').className = `score-card tone-${lv.tone}`;
    $('#scoreCard').innerHTML = `
      <div class="score-top">
        <div><div class="sc-name">${d.name}</div><div class="sc-prov">${d.province}</div></div>
        <div class="pill tone-${lv.tone}"><svg class="ico"><use href="#${lv.id === 'low' ? 'i-check' : 'i-alert'}"/></svg>${lv.label}</div>
      </div>
      <div class="gauge" style="--v:${s}">
        <div class="gauge-num"><span class="count" data-to="${s}">0</span><small>/100</small></div>
        <div class="gauge-track"><div class="gauge-fill"></div><div class="gauge-mark" style="left:45%"></div><div class="gauge-mark" style="left:65%"></div></div>
        <div class="gauge-scale"><span>Low</span><span>Moderate</span><span>High</span></div>
      </div>`;
    $('#indList').innerHTML = IND.map((i) => {
      const v = d.indicators[i.id];
      return `<div class="ind"><div class="ind-top"><span>${i.label}</span><span class="ind-v tone-${tone(v)}">${v}</span></div>
        <div class="ind-track"><div class="ind-fill tone-${tone(v)}" style="--v:${v}"></div></div>
        <div class="ind-hint">${i.hint}</div></div>`;
    }).join('');

    if (alt && s >= 45) {
      const as = score(alt), shared = alt.vibe.filter((v) => d.vibe.includes(v));
      const match = matchPct(alt);
      $('#altCard').hidden = false; $('.alt-head').hidden = false;
      $('#altCard').innerHTML = `
        <svg class="alt-pin"><use href="#pin"/></svg>
        <div class="alt-body">
          <div class="alt-name">${alt.name}</div>
          <div class="alt-prov">${alt.province}</div>
          <div class="alt-blurb">${alt.blurb}</div>
          <div class="alt-tags">${shared.map((t) => `<span class="tag">${t}</span>`).join('')}</div>
        </div>
        <div class="alt-side">
          <div class="alt-score tone-success">${as}</div>
          <div class="alt-lvl">${level(as).label.replace(' pressure', '')}</div>
          <div class="alt-match">${match}% match</div>
        </div>
        <div class="alt-cta">Plan my ${state.days}-day trip here <svg class="ico"><use href="#i-arrow"/></svg></div>`;
      $('#altCard').onclick = () => { state.chosen = d.alt; renderTrip(); go('trip'); };
      $('#keepBtn').textContent = `Keep ${d.name} anyway`;
    } else {
      $('#altCard').hidden = true; $('.alt-head').hidden = true;
      $('#keepBtn').textContent = `Plan my trip to ${d.name}`;
    }
    $('#keepBtn').onclick = () => { state.chosen = state.dest; renderTrip(); go('trip'); };
    countUp();
  }

  function matchPct(dest) {
    const want = state.interests.size ? [...state.interests] : D[state.dest].vibe;
    const hit = want.filter((w) => dest.vibe.includes(w) || dest.activities.some((a) => a.tags.includes(w))).length;
    return Math.round((hit / want.length) * 100);
  }

  // ── screen 3 ───────────────────────────────────────────────────────────
  function buildItinerary(dest) {
    const want = state.interests;
    const rank = (a) => a.tags.filter((t) => want.has(t)).length;
    const used = new Set(), slots = ['am', 'pm', 'eve'];
    const days = [];
    for (let day = 0; day < state.days; day++) {
      days.push(slots.map((slot) => {
        const pool = dest.activities.filter((a) => a.slot === slot && !used.has(a));
        const pick = pool.sort((a, b) => rank(b) - rank(a))[0]
          || dest.activities.filter((a) => !used.has(a)).sort((a, b) => rank(b) - rank(a))[0];
        if (!pick) return { slot, t: slot === 'eve' ? 'Slow evening — dinner wherever the locals eat' : 'Free time — explore at your own pace', tags: [] };
        used.add(pick); return { slot, ...pick };
      }));
    }
    return days;
  }

  function renderTrip() {
    const orig = D[state.dest], dest = D[state.chosen];
    const so = score(orig), sd = score(dest), swapped = state.chosen !== state.dest;
    $('#tripTitle').textContent = `${dest.name} · ${state.days} day${state.days > 1 ? 's' : ''}`;
    $('#compare').innerHTML = swapped ? `
      <div class="cmp">
        <div class="cmp-col"><div class="cmp-name">${orig.name}</div><div class="cmp-score tone-${tone(so)}">${so}</div><div class="cmp-bar"><i class="tone-${tone(so)}" style="--v:${so}"></i></div></div>
        <svg class="cmp-arrow"><use href="#i-arrow"/></svg>
        <div class="cmp-col"><div class="cmp-name">${dest.name}</div><div class="cmp-score tone-${tone(sd)}">${sd}</div><div class="cmp-bar"><i class="tone-${tone(sd)}" style="--v:${sd}"></i></div></div>
      </div>
      <div class="cmp-big"><span class="count" data-to="${so - sd}">0</span><span class="cmp-unit">points lower<br>tourism pressure</span></div>` : `
      <div class="cmp-keep tone-${tone(so)}"><svg class="ico"><use href="#i-alert"/></svg> ${orig.name} is under ${level(so).label.toLowerCase()}. Your trip follows the low-impact tips below.</div>`;

    const icons = { am: 'i-sun', pm: 'i-cloud', eve: 'i-moon' }, names = { am: 'Morning', pm: 'Afternoon', eve: 'Evening' };
    $('#days-list').innerHTML = buildItinerary(dest).map((slots, i) => `
      <article class="day" style="--i:${i}">
        <div class="day-head"><svg class="day-pin"><use href="#pin"/></svg><span>Day ${i + 1}</span></div>
        ${slots.map((s) => `<div class="slot"><svg class="ico slot-ico"><use href="#${icons[s.slot]}"/></svg>
          <div><div class="slot-when">${names[s.slot]}</div><div class="slot-what">${s.t}</div>
          ${s.tags.filter((t) => state.interests.has(t)).map((t) => `<span class="tag tag-on">${t}</span>`).join('')}</div></div>`).join('')}
        <div class="tip"><svg class="ico"><use href="#i-leaf"/></svg>${window.VG_TIPS[i % window.VG_TIPS.length]}</div>
      </article>`).join('');
    countUp();
  }

  // ── nav + motion ───────────────────────────────────────────────────────
  function go(name) {
    document.querySelectorAll('.screen').forEach((s) => { s.hidden = s.dataset.screen !== name; });
    $('#app').scrollTop = 0;
    if (location.hash.slice(1) !== name) history.replaceState(null, '', '#' + name);
  }
  document.querySelectorAll('[data-go]').forEach((b) => { b.onclick = () => go(b.dataset.go); });

  function countUp() {
    const still = matchMedia('(prefers-reduced-motion: reduce)').matches || /still=1/.test(location.search);
    document.querySelectorAll('.count').forEach((el) => {
      const to = +el.dataset.to;
      if (still) { el.textContent = to; return; }
      const t0 = performance.now(), dur = 900;
      const step = (t) => { const p = Math.min(1, (t - t0) / dur); el.textContent = Math.round(to * (1 - Math.pow(1 - p, 3))); if (p < 1) requestAnimationFrame(step); };
      requestAnimationFrame(step);
    });
  }

  // Deep links for rehearsal and screenshots: #pressure / #trip preload the demo path.
  const hash = location.hash.slice(1);
  if (hash === 'pressure' || hash === 'trip') {
    state.dest = 'boracay'; ['beach', 'food', 'snorkeling'].forEach((i) => state.interests.add(i));
    syncPlan(); renderPressure();
    if (hash === 'trip') { state.chosen = 'carabao'; renderTrip(); }
    go(hash);
  } else syncPlan();
})();
