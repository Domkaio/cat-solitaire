'use strict';
(() => {
  const $ = (id) => document.getElementById(id);
  const RM = matchMedia('(prefers-reduced-motion: reduce)').matches;
  /* ===== Sons sintetizados ===== */
  const AC = window.AudioContext || window.webkitAudioContext;
  let ac, mg;
  const ctx = () => {
    if (!ac) {
      ac = new AC(); mg = ac.createGain(); mg.connect(ac.destination);
      const d = ac.createDelay(); d.delayTime.value = .13; const f = ac.createGain(); f.gain.value = .3;
      const lp = ac.createBiquadFilter(); lp.frequency.value = 2600;
      mg.connect(d); d.connect(lp); lp.connect(f); f.connect(d); lp.connect(ac.destination);
    }
    if (ac.state === 'suspended') ac.resume();
    mg.gain.value = Number(level.value) / 100 * 1.3; return ac;
  };
  const tone = (f, t, d, type = 'sine', v = .2, f2) => {
    const c = ctx(), o = c.createOscillator(), g = c.createGain(), s = c.currentTime + t;
    o.type = type; o.frequency.setValueAtTime(f, s); if (f2) o.frequency.exponentialRampToValueAtTime(f2, s + d);
    g.gain.setValueAtTime(0, s); g.gain.linearRampToValueAtTime(v, s + .008); g.gain.exponentialRampToValueAtTime(.0001, s + d);
    o.connect(g); g.connect(mg); o.start(s); o.stop(s + d + .05);
  };
  const noise = (t, d, f0, f1, v = .15) => {
    const c = ctx(), n = c.sampleRate * d | 0, b = c.createBuffer(1, n, c.sampleRate), a = b.getChannelData(0);
    for (let i = 0; i < n; i++) a[i] = Math.random() * 2 - 1;
    const s = c.createBufferSource(); s.buffer = b; const bp = c.createBiquadFilter(); bp.type = 'bandpass'; bp.Q.value = 1.2;
    const g = c.createGain(), st = c.currentTime + t;
    bp.frequency.setValueAtTime(f0, st); bp.frequency.exponentialRampToValueAtTime(f1, st + d);
    g.gain.setValueAtTime(0, st); g.gain.linearRampToValueAtTime(v, st + d * .3); g.gain.exponentialRampToValueAtTime(.0001, st + d);
    s.connect(bp); bp.connect(g); g.connect(mg); s.start(st);
  };
  const arp = (notes, gap, type = 'triangle', v = .14, len = .5) => notes.forEach((n, i) => { tone(n, i * gap, len, type, v); tone(n * 2, i * gap, len * .7, 'sine', v * .35); });
  const S = {
    pick: () => { noise(0, .05, 3000, 1200, .08); tone(620, 0, .05, 'triangle', .07, 420); },
    menu: () => { tone(660, 0, .09, 'sine', .1); tone(990, .05, .12, 'sine', .07); },
    place: () => { noise(0, .07, 1800, 700, .12); tone(180, 0, .09, 'sine', .18, 90); },
    tick: () => { tone(1300 + Math.random() * 500, 0, .03, 'square', .035); noise(0, .04, 4000, 2000, .05); },
    deal: () => noise(0, .4, 500, 5200, .11),
    open: () => { noise(0, .9, 400, 6000, .1); arp([392, 494, 587, 784], .09, 'triangle', .1, .4); },
    hint: () => { tone(1175, 0, .5, 'sine', .12); tone(1760, .09, .6, 'sine', .09); tone(2349, .2, .7, 'sine', .05); },
    undo: () => tone(500, 0, .14, 'sine', .1, 300),
    seq: () => arp([523, 659, 784, 1047, 1319], .08, 'triangle', .14),
    win: () => { arp([523, 659, 784, 1047, 784, 1047, 1319, 1568], .12, 'triangle', .15, .8); [523, 659, 784].forEach((n) => tone(n, 1, 1.6, 'sine', .08)); },
  };
  const names = { toque: 'pick', menu: 'menu', compra: 'deal', dica: 'hint', abertura: 'open' };
  let lastBtn = '';
  document.addEventListener('pointerdown', (e) => { lastBtn = e.target.closest('button')?.id || ''; }, true);
  const sfx = (n) => { if (!muted) try { S[n](); } catch {} };
  playCard = (name) => {
    if (name === 'menu' && ['deal', 'hint', 'undo', 'rewind'].includes(lastBtn)) return;
    if (name === 'toque' && lastBtn === 'undo') return sfx('undo');
    sfx(names[name] || 'menu');
  };
  const f0 = finishTurn;
  finishTurn = () => {
    const d = game.done.length, st = game.stock.length;
    f0();
    if (game.done.length > d) sfx('seq'); else if (game.stock.length === st) sfx('place');
    if (game.done.length === 8) setTimeout(() => sfx('win'), 600);
  };
  /* ===== Voo das cartas (compra e distribuição) ===== */
  const fly2 = (el, o, delay, big) => {
    if (!el || RM) return;
    el.classList.remove('arrival');
    const b = el.getBoundingClientRect(), dx = o.left - b.left, dy = o.top - b.top, rot = big ? Math.random() * 40 - 20 : -8, dur = big ? 640 : 420;
    el.animate([
      { transform: `translate(${dx}px,${dy}px) scale(.62) rotate(${rot}deg)`, opacity: 0, offset: 0 },
      { opacity: 1, offset: .12 },
      { transform: `translate(${dx * .45}px,${dy * .45 + (big ? -90 : -40)}px) scale(1.12) rotate(${-rot / 2}deg)`, filter: 'drop-shadow(0 18px 14px #0008)', offset: .55 },
      { transform: 'none', offset: 1 },
    ], { delay, duration: dur, fill: 'backwards', easing: 'cubic-bezier(.3,.8,.3,1)' });
    setTimeout(() => { const r = el.getBoundingClientRect(); FX.burst(r.left + r.width / 2, r.bottom, big ? 4 : 7, ['#aeeaff', '#d9c8ff'], .5); }, delay + dur);
  };
  fly = (el, o, delay) => fly2(el, o, delay, false);
  dealFlight = (opening) => {
    const d = $('deal'), o = d.getBoundingClientRect();
    d.classList.remove('kick'); void d.offsetWidth; d.classList.add('kick');
    Array.from($('board').children).forEach((pile, col) => {
      if (opening) Array.from(pile.children).forEach((el, row) => {
        const dl = (row * 10 + col) * 22; fly2(el, o, dl, true);
        if ((row * 10 + col) % 4 === 0) setTimeout(S.tick, dl + 480);
      });
      else { fly2(pile.lastElementChild, o, col * 55, true); setTimeout(() => sfx('tick'), col * 55 + 520); }
    });
  };
  /* ===== Dica com seta animada ===== */
  const layer = document.createElement('div'); layer.id = 'hintlayer'; document.body.append(layer);
  let ht;
  const clearHint = () => layer.replaceChildren();
  const drawHint = () => {
    clearHint();
    if (!selected || hintColumn < 0) return;
    const bd = $('board'), src = bd.children[selected.a]?.children[selected.i], pile = bd.children[hintColumn];
    if (!src || !pile) return;
    const s = src.getBoundingClientRect(), d = pile.lastElementChild?.getBoundingClientRect() || pile.getBoundingClientRect();
    const sx = s.left + s.width / 2, sy = s.top + s.height * .3, ex = d.left + d.width / 2, ey = pile.lastElementChild ? d.top + d.height * .55 : d.top + d.height * .35;
    const path = `M${sx} ${sy} Q${(sx + ex) / 2} ${Math.min(sy, ey) - 110} ${ex} ${ey}`;
    layer.innerHTML = `<svg><defs><linearGradient id="hg" gradientUnits="userSpaceOnUse" x1="${sx}" y1="${sy}" x2="${ex}" y2="${ey}"><stop stop-color="#aeeaff"/><stop offset="1" stop-color="#ffd98a"/></linearGradient></defs><path class="hpath" d="${path}"/><circle r="6" fill="#fff"><animateMotion dur="1s" repeatCount="indefinite" path="${path}"/></circle></svg><i class="hring" style="left:${sx}px;top:${sy}px"></i><i class="hring dst" style="left:${ex}px;top:${ey}px"></i>`;
    FX.burst(ex, ey, 10, ['#ffd98a', '#aeeaff'], .6);
  };
  const oh = $('hint').onclick;
  $('hint').onclick = () => { oh(); requestAnimationFrame(drawHint); clearTimeout(ht); ht = setTimeout(clearHint, 4500); };
  $('board').addEventListener('pointerdown', clearHint);
  /* toast: some sozinho */
  let nt; new MutationObserver(() => {
    clearTimeout(nt); const n = $('note'); if (n.textContent) nt = setTimeout(() => (n.textContent = ''), 3800);
  }).observe($('note'), { childList: true, characterData: true, subtree: true });
  /* ===== HUD: cartas de progresso ===== */
  const pips = document.createElement('div'); pips.className = 'pips'; pips.innerHTML = '<i></i>'.repeat(8);
  document.querySelector('.metrics').append(pips);
  const updPips = () => [...pips.children].forEach((p, i) => p.classList.toggle('on', i < game.done.length));
  new MutationObserver(updPips).observe($('progress'), { childList: true, characterData: true, subtree: true }); updPips();
  /* ===== Menu de modos ===== */
  const op = $('play').onclick;
  $('play').onclick = () => {
    op();
    const recs = readStoredValue(recordKey, []);
    const info = { 1: ['Casual', 'Relaxe e aprenda o jogo.', 1], 2: ['Estratégico', 'Exige planejamento a cada jogada.', 2], 4: ['Especialista', 'O desafio máximo para veteranos.', 3] };
    article.querySelectorAll('.mode-option').forEach((b) => {
      const n = +b.dataset.n, [name, desc, lv] = info[n], rows = recs.filter((x) => x.n === n);
      const best = rows.length ? `Melhor: ${Math.max(...rows.map((x) => x.points))} pts · ${formatTime(Math.min(...rows.map((x) => x.time)))}` : 'Nenhuma vitória ainda';
      b.innerHTML = `<span class="mode-art">${suits.slice(0, n === 1 ? 1 : n).map((s) => `<span class="${s === '♥' || s === '♦' ? 'r' : ''}">${s}</span>`).join('')}</span><span class="mode-txt"><b>${name}</b><em>${desc}</em><small>${best}</small></span><span class="mode-lvl">${'●'.repeat(lv)}${'○'.repeat(3 - lv)}</span>`;
    });
  };
})();
