// ============================================================================
//  ÖNLEJÁTSZÓ AJÁNLAT-MINTA - shared engine for the client pages.
//
//  The workshop tool's screen (autoszerviz-olajcsere), playing one job by
//  itself: the car is typed in, the job picked, the questions answered, the
//  parts chosen from the shop's brands, the quote built line by line, then
//  the printed sheet opens. Nothing is clickable, nothing calls a server.
//
//  A client page is DATA ONLY: it sets window.DEMO (see toth-garazs.html) and
//  loads this file plus ajanlat-demo.css. It builds its own markup.
//
//  Copy rules (2026-10-07): the car is typed, never read from a VIN; the tool
//  asks what splits the parts and never diagnoses; extras are the SHOP's rule;
//  no catalogue or supplier is named. All prices are sample figures, net.
// ============================================================================
(() => {
  const D = window.DEMO;
  const S = D.shop;
  const SPEED = /[?&]gyors\b/.test(location.search) ? 0.35 : 1;
  const REDUCED = matchMedia('(prefers-reduced-motion: reduce)').matches;

  const $ = (id) => document.getElementById(id);
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms * SPEED));
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const huf = (n) => Math.round(n).toLocaleString('hu-HU').replace(/ /g, ' ') + ' Ft';
  const qty = (n) => String(n).replace('.', ',');

  // A line may be written as { hours } - labour at the shop's own rate.
  const norm = (l) => l.hours != null
    ? { ...l, qty: l.hours, unit: 'óra', price: S.rate, sub: l.sub ?? `${qty(l.hours)} óra × ${huf(S.rate)}` }
    : l;

  // ------------------------------------------------------------------ markup
  function build() {
    document.title = `${S.name} · Árajánlat-segéd (minta)`;
    const logo = S.logo ? `<img class="brand-logo" src="${esc(S.logo)}" alt="${esc(S.name)} logó">` : '<span class="dot"></span>';
    const sheetLogo = S.logo ? `<img class="s-logo-img" src="${esc(S.logo)}" alt="">` : `<div class="s-logo">${esc(S.initials || S.name.slice(0, 2))}</div>`;
    document.body.innerHTML = `
<div class="banner" role="status">
  <div class="banner-in">
    <span class="pill">Minta</span>
    <span id="banner-text">${esc(D.intro)}</span>
    <button id="restart" class="linkbtn light" type="button">Újra elölről ↺</button>
  </div>
  <div class="play"><div id="play-bar"></div></div>
</div>
<header class="top">
  <div class="top-in">
    <div class="brand">${logo}<span>${esc(S.name)}<span class="sub">Árajánlat-segéd · a műhelynek</span></span></div>
    <nav class="tabs" aria-hidden="true"><span class="tab is-on">Új ajánlat</span><span class="tab">Korábbi ajánlatok</span></nav>
  </div>
</header>
<main class="wrap grid" aria-live="polite">
  <section class="col">
    <div class="card" id="c-car">
      <h2><span class="n">1</span> Autó</h2>
      <label class="lbl">Keresés: márka, típus, motor</label>
      <div class="inp fake" id="car-q"><span></span><span class="caret"></span></div>
      <div id="car-res" class="results"></div>
    </div>
    <div class="card" id="c-job" hidden>
      <h2><span class="n">2</span> Mi a munka?</h2>
      <div id="car-box" class="vehicle"></div>
      <div id="jobs" class="chips"></div>
    </div>
    <div class="card" id="c-checks" hidden>
      <h2><span class="n">3</span> ${esc(D.job.label)}: mit tartalmaz? <span class="src" id="checks-count"></span></h2>
      <p class="hint">Amit a szerelő az autón látott. Ezektől változnak a tételek.</p>
      <div id="checks"></div>
    </div>
    <h2 class="sec" id="parts-head" hidden><span class="n">4</span> Alkatrészek <span class="muted">· a kijelölt kerül az ajánlatba</span></h2>
    <div id="parts" class="col"></div>
    <div class="card" id="c-extras" hidden>
      <h2><span class="n">5</span> Mellé járó tételek <span class="src">a műhely beállítása szerint</span></h2>
      <div id="extras" class="oils"></div>
    </div>
  </section>
  <aside class="col">
    <div class="card quote" id="c-quote">
      <h2>Ajánlat <span id="timer" class="timer"></span></h2>
      <div id="q-empty" class="empty">Az autó és a munka után az ajánlat itt magától összeáll.</div>
      <div id="q-body" hidden>
        <div class="cust">
          <div><span class="lbl">Ügyfél</span><div class="inp fake sm" id="cust-name"><span></span><span class="caret"></span></div></div>
          <div><span class="lbl">Rendszám</span><div class="inp fake sm mono" id="cust-plate"><span></span><span class="caret"></span></div></div>
        </div>
        <table class="lines"><thead><tr><th>Tétel</th><th class="r">Menny.</th><th class="r">Egységár</th><th class="r">Nettó</th></tr></thead><tbody id="lines"></tbody></table>
        <div class="totals">
          <div><span>Nettó</span><b id="t-net">0 Ft</b></div>
          <div><span>ÁFA ${Math.round(S.vat * 100)}%</span><b id="t-vat">0 Ft</b></div>
          <div class="grand"><span>Fizetendő</span><b id="t-gross">0 Ft</b></div>
        </div>
        <div class="actions"><span class="btn" id="b-print">PDF / nyomtatás</span><span class="btn ghost">Szöveg másolása</span><span class="btn ghost">Új autó</span></div>
      </div>
    </div>
  </aside>
</main>
<div class="mini" id="mini" hidden><span>Ajánlat · <span id="mini-count"></span></span><b id="mini-total"></b></div>
<div class="sheet-wrap" id="sheet" hidden>
  <div class="sheet" role="dialog" aria-label="Kész árajánlat">
    <div class="s-head">
      <div class="s-brand">${sheetLogo}<div class="s-shop"><b>${esc(S.legalName || S.name)}</b><div>${esc(S.address)}</div><div>${esc(S.phone)}</div></div></div>
      <div class="s-meta"><h1>Árajánlat</h1><div>Szám: <b id="s-no"></b></div><div>Kelt: <span id="s-date"></span></div><div>Érvényes: <span id="s-until"></span></div></div>
    </div>
    <div class="s-info">
      <div class="s-box"><div class="l">Ügyfél</div><span id="s-cust"></span></div>
      <div class="s-box"><div class="l">Jármű</div><span id="s-car"></span></div>
    </div>
    <table class="s-table"><thead><tr><th>Tétel</th><th class="r">Mennyiség</th><th class="r">Egységár (nettó)</th><th class="r">Nettó</th></tr></thead><tbody id="s-lines"></tbody></table>
    <div class="s-tot">
      <div><span>Nettó</span><b id="s-net"></b></div>
      <div><span>ÁFA ${Math.round(S.vat * 100)}%</span><b id="s-vat"></b></div>
      <div class="g"><span>Fizetendő</span><span id="s-gross"></span></div>
    </div>
    <p class="s-note">Az ajánlat a fenti tételekre vonatkozik. Ha a munka során olyan hiba kerül elő, ami ebben nem szerepel, a javítás megkezdése előtt egyeztetünk.</p>
    <div class="s-sign"><span>${esc(S.legalName || S.name)}</span><span>Ügyfél</span></div>
  </div>
  <div class="end" hidden>
    <div class="end-k">Ez csak egy minta</div>
    <h2>${esc(D.cta.title)}</h2>
    <p>${esc(D.cta.text)}</p>
    <div class="end-actions">
      <a class="btn" href="${esc(D.cta.href)}" target="_blank" rel="noopener">${esc(D.cta.button)}</a>
      <button class="btn ghost" id="replay" type="button">Újra megnézem ↺</button>
    </div>
    <p class="end-foot">Készítette: <a href="https://landscale.agency/hu" target="_blank" rel="noopener">Landscale Agency</a> · Pirint Milán, ${esc(D.cta.phone)}</p>
  </div>
</div>`;
  }

  // ------------------------------------------------------------- machinery
  const lines = [];
  let step = 0;
  const TOTAL = 6 + D.checks.length + D.parts.length * 2;
  let started;

  function progress(text) {
    step++;
    $('play-bar').style.width = Math.min(100, (step / TOTAL) * 100) + '%';
    if (text) $('banner-text').textContent = text;
  }

  function focusOn(el) {
    if (!el) return;
    const r = el.getBoundingClientRect();
    if (r.top < 70 || r.bottom > innerHeight - 70) el.scrollIntoView({ block: 'center', behavior: REDUCED ? 'auto' : 'smooth' });
  }

  async function tap(el) {
    focusOn(el);
    await sleep(500);
    el.classList.remove('tap'); void el.offsetWidth; el.classList.add('tap');
    await sleep(250);
  }

  async function type(el, text, perChar = 75) {
    el.classList.add('focus');
    const out = el.querySelector('span');
    for (const ch of text) { out.textContent += ch; await sleep(perChar); }
    await sleep(250);
    el.classList.remove('focus');
  }

  function show(el) { el.hidden = false; el.classList.add('appear'); focusOn(el); }

  function setLine(raw) {
    const line = norm(raw);
    const i = lines.findIndex((l) => l.key === line.key);
    if (i >= 0) lines[i] = line; else lines.push(line);
    renderQuote(line.key);
  }

  function totals() {
    const net = lines.reduce((s, l) => s + Math.round(l.qty * l.price), 0);
    const vat = Math.round(net * S.vat);
    return { net, vat, gross: net + vat };
  }

  function renderQuote(flashKey) {
    $('q-empty').hidden = true;
    $('q-body').hidden = false;
    $('lines').innerHTML = lines.map((l) => `<tr${l.key === flashKey ? ' class="flash"' : ''}>
        <td><div class="lab">${esc(l.label)}</div>${l.sub ? `<div class="sub">${esc(l.sub)}</div>` : ''}</td>
        <td class="r">${qty(l.qty)} ${esc(l.unit)}</td><td class="r">${huf(l.price)}</td><td class="r">${huf(l.qty * l.price)}</td></tr>`).join('');
    const t = totals();
    $('t-net').textContent = huf(t.net);
    $('t-vat').textContent = huf(t.vat);
    $('t-gross').textContent = huf(t.gross);
    $('mini-total').textContent = huf(t.gross);
    $('mini-count').textContent = `${lines.length} tétel`;
    const mini = $('mini');
    mini.hidden = false;
    mini.classList.remove('tap'); void mini.offsetWidth; mini.classList.add('tap');
  }

  // ---------------------------------------------------------------- script
  async function play() {
    started = Date.now();
    await sleep(900);
    const C = D.car;

    // 1. Car, typed in.
    progress('1. Az autó: a szerelő begépeli, a lista felkínálja.');
    await type($('car-q'), C.query);
    $('car-res').innerHTML = C.results.map((r) => `<div class="res appear">
        <span class="t">${esc(r.t)}</span><span class="code">${esc(r.code)}</span><span class="m">${esc(r.m)}</span></div>`).join('');
    await sleep(1100);
    await tap($('car-res').children[C.pick]);
    [...$('car-res').children].forEach((el, i) => el.classList.add(i === C.pick ? 'on' : 'dim'));
    progress();
    await sleep(700);

    // 2. The job.
    $('car-box').innerHTML = `<div class="t">${esc(C.name)}</div><div class="m">${C.facts}</div>`;
    $('jobs').innerHTML = D.jobs.map((j) => `<div class="chip"><span class="ct">${esc(j.label)}</span><span class="m">${esc(j.m)}</span></div>`).join('');
    show($('c-job'));
    progress('2. A munka: egy koppintás.');
    await sleep(1200);
    const chip = $('jobs').children[D.jobs.findIndex((j) => j.pick)];
    await tap(chip);
    chip.classList.add('on');
    chip.querySelector('.ct').insertAdjacentHTML('afterbegin', '<span class="tick">✓</span>');
    (D.job.lines || []).forEach(setLine);
    await sleep(900);

    // 3. Questions about what he found.
    show($('c-checks'));
    progress('3. Pár kérdés arról, amit a szerelő az autón látott.');
    $('checks-count').textContent = `0/${D.checks.length} megválaszolva`;
    for (let c = 0; c < D.checks.length; c++) {
      const ch = D.checks[c];
      const box = document.createElement('div');
      box.className = 'ask appear';
      box.innerHTML = `<div class="qtext">${esc(ch.text)}</div><div class="hint">${esc(ch.why)}</div>
        <div class="opts">${ch.options.map((o) => `<span class="btn opt">${esc(o.label)}${o.plus ? `<span class="m">+ ${esc(o.plus)}</span>` : ''}</span>`).join('')}</div>`;
      $('checks').appendChild(box);
      focusOn(box);
      await sleep(1300);
      const opt = box.querySelectorAll('.opt')[ch.pick];
      await tap(opt);
      opt.classList.add('on');
      opt.insertAdjacentText('afterbegin', '✓ ');
      await sleep(500);
      const o = ch.options[ch.pick];
      const done = document.createElement('div');
      done.className = 'answered appear';
      done.innerHTML = `<span class="tick">✓</span><span class="q">${esc(ch.text)}</span><b>${esc(o.label)}</b>${o.plus ? `<span class="plus">+ ${esc(o.plus)}</span>` : ''}<span class="edit">módosít</span>`;
      box.replaceWith(done);
      $('checks-count').textContent = `${c + 1}/${D.checks.length} megválaszolva`;
      (o.lines || []).forEach(setLine);
      progress();
      await sleep(600);
    }
    $('checks-count').classList.add('ok');

    // 4. Parts, from the shop's own brands.
    show($('parts-head'));
    progress('4. Alkatrész a műhely saját márkáiból és árlistájából.');
    for (const p of D.parts) {
      const card = document.createElement('div');
      card.className = 'card part-card appear';
      $('parts').appendChild(card);
      const svg = ICONS[p.icon] || '';
      const head = (state) => `<div class="pc-head"><h2>${esc(p.label)} <span class="muted">· ${esc(p.qtyLabel)}</span></h2>${state}</div>`;
      const option = (a, on) => `<div class="oil part${on ? ' on' : ''}">
          <span class="thumb">${svg}</span>
          <span class="info"><span class="t">${esc(a.brand)} <span class="muted">${esc(a.name)}</span>${a.rec ? '<span class="badge rec-b">ajánlott</span>' : ''}${a.shop ? '<span class="badge">a műhely márkája</span>' : ''}</span>
          ${on ? '<span class="inq">✓ Az ajánlatban</span>' : ''}
          <span class="m">árlista: ${huf(a.price)}</span>
          <span class="specs">${a.specs.map((s, i) => `<span class="spec${i === 0 ? ' key' : ''}">${esc(s)}</span>`).join('')}</span></span></div>`;
      const list = (onIdx) => `<div class="rec-h"><span class="tag">Ajánlott</span><span class="hint">${esc(p.why)}</span></div>
          <div class="oils">${p.list.map((a, i) => option(a, i === onIdx)).join('')}</div>`;

      if (p.ask) {
        card.innerHTML = head('<span class="state ask-s">Kérdés vár</span>') + `<div class="ask">
            <div class="qtext">${esc(p.ask.text)}</div>
            <div class="hint">Ebben különböznek az erre az autóra illő cikkek. Ha nem tudja, a régi alkatrészen látszik.</div>
            <div class="opts">${p.ask.options.map((o) => `<span class="btn opt">${esc(o.v)}<span class="m">${o.n} cikk</span></span>`).join('')}</div></div>`;
        focusOn(card);
        await sleep(1400);
        const opt = card.querySelectorAll('.opt')[p.ask.pick];
        await tap(opt);
        opt.classList.add('on');
        await sleep(500);
      }
      const answered = p.ask ? `<div class="answers"><span class="ans">${esc(p.ask.text.replace(/\?$/, ''))}: <b>${esc(p.ask.options[p.ask.pick].v)}</b></span></div>` : '';
      card.innerHTML = head('<span class="state ask-s">Válasszon</span>') + answered + list(-1);
      focusOn(card);
      await sleep(1500);
      const recIdx = p.list.findIndex((a) => a.rec);
      await tap(card.querySelectorAll('.oil')[recIdx]);
      card.querySelector('.oils').outerHTML = `<div class="oils">${p.list.map((a, i) => option(a, i === recIdx)).join('')}</div>`;
      card.querySelector('.state').outerHTML = '<span class="state ok-s">✓ Az ajánlatban</span>';
      setLine(p.line);
      progress();
      await sleep(1100);

      const a = p.list[recIdx];
      card.innerHTML = head('<span class="state ok-s">✓ Az ajánlatban</span>') + `<div class="pc-sum">
          <span class="thumb">${svg}</span>
          <span class="info"><span class="t">${esc(a.brand)} <span class="muted">${esc(a.name)}</span></span>
          <span class="m"><span class="tag">Ajánlott</span> ${esc(p.why)}</span>
          <span class="specs">${a.specs.slice(0, 3).map((s) => `<span class="spec">${esc(s)}</span>`).join('')}</span></span>
          <span class="chg">Másik ▾<span class="fits">${p.fits} illik</span></span></div>`;
      await sleep(400);
    }

    // 5. The shop's own extras for this job.
    $('extras').innerHTML = D.extras.map((x) => `<div class="oil"><span class="box-ic"></span><span class="t">${esc(x.label)}</span><span class="m">${esc(x.m)}</span></div>`).join('');
    show($('c-extras'));
    progress(D.extrasBanner || '5. Ami ennél a műhelynél ehhez a munkához jár, magától bekerül.');
    await sleep(1100);
    const rows = $('extras').children;
    for (let i = 0; i < D.extras.length; i++) {
      if (!D.extras[i].on) continue;
      await tap(rows[i]);
      rows[i].classList.add('on');
      rows[i].querySelector('.box-ic').textContent = '✓';
      setLine(D.extras[i].line);
      await sleep(700);
    }
    await sleep(600);

    // 6. Customer + finished quote.
    progress('6. Ügyfél neve, rendszám, és kész az ajánlat.');
    focusOn($('c-quote'));
    await sleep(700);
    await type($('cust-name'), D.customer.name, 70);
    await type($('cust-plate'), D.customer.plate, 90);
    $('timer').textContent = `Kész: ${Math.round((Date.now() - started) / 1000)} mp alatt`;
    progress();
    await sleep(1400);
    await tap($('b-print'));
    openSheet();
  }

  function openSheet() {
    const today = new Date();
    const until = new Date(today.getTime() + 15 * 864e5);
    const d = (x) => x.toLocaleDateString('hu-HU');
    $('s-no').textContent = `Á-${today.getFullYear()}/${S.quoteNo || '0412'}`;
    $('s-date').textContent = d(today);
    $('s-until').textContent = d(until).replace(/\.$/, '') + '-ig';
    $('s-cust').textContent = D.customer.name;
    $('s-car').innerHTML = `${esc(D.car.name)}<br>Rendszám: <b>${esc(D.customer.plate)}</b>`;
    $('s-lines').innerHTML = lines.map((l) => `<tr><td>${esc(l.label)}${l.sub && l.unit !== 'óra' ? `<div class="no">${esc(l.sub)}</div>` : ''}</td>
        <td class="r">${qty(l.qty)} ${esc(l.unit)}</td><td class="r">${huf(l.price)}</td><td class="r">${huf(l.qty * l.price)}</td></tr>`).join('');
    const t = totals();
    $('s-net').textContent = huf(t.net);
    $('s-vat').textContent = huf(t.vat);
    $('s-gross').textContent = huf(t.gross);
    $('play-bar').style.width = '100%';
    $('banner-text').textContent = 'Ezt kapja az ügyfél: nyomtatva vagy PDF-ben.';
    $('mini').hidden = true;
    $('sheet').hidden = false;
    $('sheet').scrollTop = 0;
    setTimeout(() => {
      const end = document.querySelector('.end');
      end.hidden = false;
      end.classList.add('appear');
      end.scrollIntoView({ block: 'end', behavior: REDUCED ? 'auto' : 'smooth' });
    }, 3200 * SPEED);
  }

  const ICONS = {
    disc: '<svg viewBox="0 0 40 40" aria-hidden="true"><circle cx="20" cy="20" r="18" fill="#c9cdd2" stroke="#8a9096" stroke-width="1.5"/><circle cx="20" cy="20" r="9" fill="#e9ebed" stroke="#8a9096" stroke-width="1.5"/><circle cx="20" cy="20" r="2.6" fill="#8a9096"/><g fill="#8a9096"><circle cx="20" cy="14.5" r="1.2"/><circle cx="25.2" cy="18.3" r="1.2"/><circle cx="23.2" cy="24.4" r="1.2"/><circle cx="16.8" cy="24.4" r="1.2"/><circle cx="14.8" cy="18.3" r="1.2"/></g></svg>',
    pad: '<svg viewBox="0 0 40 40" aria-hidden="true"><path d="M5 14 Q20 4 35 14 L33 28 Q20 22 7 28 Z" fill="#8a9096"/><path d="M8 16 Q20 8 32 16 L31 25 Q20 20 9 25 Z" fill="#4b5057"/></svg>',
  };

  build();
  $('restart').addEventListener('click', () => location.reload());
  $('replay').addEventListener('click', () => location.reload());
  play();
})();
