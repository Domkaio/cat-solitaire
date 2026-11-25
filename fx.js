'use strict';
(() => {
  const RM = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const $ = (id) => document.getElementById(id);
  const DPR = Math.min(devicePixelRatio || 1, 1.5);
  $('sky')?.remove();
  const mk = (id) => { const c = document.createElement('canvas'); c.id = id; c.setAttribute('aria-hidden', 'true'); document.body.prepend(c); return c; };
  const sky = mk('fxsky'), fx = mk('fxfx');
  const sc = sky.getContext('2d'), fc = fx.getContext('2d');
  let moonC, W = 0, H = 0, tx = 0, ty = 0, cx = 0, cy = 0, ridges = [], stars = [], dust = [], shoot = null;
  const R = Math.random;
  function setup() {
    W = innerWidth; H = innerHeight;
    for (const c of [sky, fx]) { c.width = W * DPR; c.height = H * DPR; c.getContext('2d').setTransform(DPR, 0, 0, DPR, 0, 0); }
    stars = Array.from({ length: Math.round(W * H / 5500) }, () => ({ x: R(), y: R() * .85, z: R() < .6 ? 0 : R() < .7 ? 1 : 2, p: R() * 6.28, s: .4 + R() * 1.4 }));
    dust = Array.from({ length: 26 }, () => ({ x: R(), y: R(), v: .02 + R() * .05, p: R() * 6.28, r: 1 + R() * 2 }));
    const mr = Math.max(38, Math.min(W, H) * .075), sz = mr * 2.8;
    moonC = document.createElement('canvas'); moonC.width = moonC.height = sz * DPR;
    const m = moonC.getContext('2d'); m.scale(DPR, DPR); m.translate(sz / 2, sz / 2);
    const ring = m.createRadialGradient(0, 0, mr * .9, 0, 0, mr * 1.35); ring.addColorStop(0, '#fff6d855'); ring.addColorStop(1, '#0000');
    m.fillStyle = ring; m.beginPath(); m.arc(0, 0, mr * 1.35, 0, 6.28); m.fill();
    const body = m.createRadialGradient(-mr * .3, -mr * .3, mr * .1, 0, 0, mr); body.addColorStop(0, '#fffdf2'); body.addColorStop(.7, '#f0e8d2'); body.addColorStop(1, '#cfc4b8');
    m.fillStyle = body; m.beginPath(); m.arc(0, 0, mr, 0, 6.28); m.fill();
    m.save(); m.beginPath(); m.arc(0, 0, mr, 0, 6.28); m.clip();
    for (const [x, y, r, o] of [[-.35, -.2, .32, .16], [.3, .25, .4, .14], [.1, -.45, .22, .12], [-.1, .5, .2, .12], [.55, -.1, .18, .1]]) { m.fillStyle = `rgba(120,110,140,${o})`; m.beginPath(); m.arc(x * mr, y * mr, r * mr, 0, 6.28); m.fill(); }
    for (const [x, y, r] of [[-.5, .3, .09], [.2, -.1, .07], [.45, .45, .1], [-.2, -.55, .06], [.6, -.3, .05]]) { m.strokeStyle = 'rgba(110,100,130,.35)'; m.beginPath(); m.arc(x * mr, y * mr, r * mr, 0, 6.28); m.stroke(); }
    const sh = m.createRadialGradient(-mr * .4, -mr * .4, mr * .4, mr * .2, mr * .2, mr * 1.3); sh.addColorStop(0, '#0000'); sh.addColorStop(1, '#2a1f5088');
    m.fillStyle = sh; m.fillRect(-mr, -mr, mr * 2, mr * 2); m.restore();
    const tree = (g, x, y, h, col) => { g.fillStyle = col; g.beginPath(); const w = h * .34; for (let k = 0; k < 4; k++) { const yy = y - h * k * .22, ww = w * (1 - k * .2); g.moveTo(x - ww, yy); g.lineTo(x, yy - h * .42); g.lineTo(x + ww, yy); } g.fill(); g.fillRect(x - 1.2, y - 2, 2.4, h * .12); };
    ridges = [0, 1, 2, 3].map((l) => {
      const c = document.createElement('canvas'); c.width = (W + 160) * DPR; c.height = H * DPR;
      const g = c.getContext('2d'); g.scale(DPR, DPR);
      const base = H * (.74 + l * .08), seed = l * 9 + 3, cols = ['#2a2354', '#181a42', '#0c1030', '#03051a'];
      const ry = (x) => base + Math.sin(x * .011 + seed) * 22 + Math.sin(x * .004 + seed * 2) * 38 + Math.sin(x * .03 + l) * 4;
      let q = l * 77 + 5; const rnd = () => (q = (q * 16807) % 2147483647) / 2147483647;
      if (l < 3) {
        g.beginPath(); g.moveTo(0, H);
        for (let x = 0; x <= W + 160; x += 6) g.lineTo(x, ry(x));
        g.lineTo(W + 160, H); g.closePath();
        const gr = g.createLinearGradient(0, base - 60, 0, H); gr.addColorStop(0, ['#3b2f6b', '#262457', '#14193a'][l]); gr.addColorStop(1, ['#1d1b45', '#12163a', '#090c22'][l]);
        g.fillStyle = gr; g.fill(); g.strokeStyle = ['#b8a2fa55', '#8fb0ff33', '#0000'][l]; g.lineWidth = 1.5; g.stroke();
        const st = [34, 24, 18][l];
        for (let x = 0; x <= W + 160; x += st * (.6 + rnd() * .8)) tree(g, x, ry(x) + 4, [34, 44, 58][l] * (.8 + rnd() * 1.1), cols[l]);
      } else for (let x = -20; x <= W + 160; x += 46 + rnd() * 40) {
        const e = Math.min(x, W + 160 - x) / (W + 160); if (e > .2) continue;
        tree(g, x, H + 30, H * (.3 + rnd() * .25) * (1 - e * 1.6), cols[3]);
      }
      return c;
    });
  }
  const bg = (t) => {
    const g = sc.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, '#04061a'); g.addColorStop(.55, '#161545'); g.addColorStop(1, '#3a2860');
    sc.fillStyle = g; sc.fillRect(0, 0, W, H);
    // nebulosas
    for (const [x, y, r, c, s] of [[.75, .3, .55, '#6a45c855', .00007], [.15, .5, .5, '#1f6fb855', .00005], [.5, .15, .4, '#c34aa033', .00006]]) {
      const ox = Math.sin(t * s * 3 + x * 9) * 40 + cx * -10, oy = Math.cos(t * s * 2 + y * 9) * 30 + cy * -8;
      const n = sc.createRadialGradient(x * W + ox, y * H + oy, 0, x * W + ox, y * H + oy, r * Math.max(W, H) * .6);
      n.addColorStop(0, c); n.addColorStop(1, '#0000'); sc.fillStyle = n; sc.fillRect(0, 0, W, H);
    }
    // lua
    const mx = W * .78 + cx * -14, my = H * .2 + cy * -10;
    const hg = sc.createRadialGradient(mx, my, 20, mx, my, Math.min(W, H) * .55); hg.addColorStop(0, '#cdbcff55'); hg.addColorStop(.4, '#7a5cd622'); hg.addColorStop(1, '#0000');
    sc.fillStyle = hg; sc.fillRect(0, 0, W, H);
    const pu = 1 + Math.sin(t * .0012) * .03; sc.save(); sc.translate(mx, my); sc.scale(pu, pu);
    sc.drawImage(moonC, -moonC.width / DPR / 2, -moonC.height / DPR / 2, moonC.width / DPR, moonC.height / DPR); sc.restore();
    // estrelas (3 camadas de parallax)
    for (const s of stars) {
      const d = [4, 9, 16][s.z], tw = .55 + .45 * Math.sin(t * .002 * s.s + s.p);
      const x = (s.x * W + cx * -d + W * 2) % W, y = s.y * H + cy * -d * .7;
      sc.fillStyle = `rgba(${s.z === 2 ? '174,234,255' : '215,210,255'},${tw * (.4 + s.z * .25)})`;
      const z = .6 + s.z * .6; sc.fillRect(x, y, z, z);
      if (s.z === 2 && tw > .9) { sc.fillRect(x - 4, y + .3, 9, .6); sc.fillRect(x + .3, y - 4, .6, 9); }
    }
    // estrela cadente
    if (!shoot && R() < .004) shoot = { x: R() * W, y: R() * H * .35, l: 0 };
    if (shoot) {
      shoot.l += 14; const a = shoot.x + shoot.l, b = shoot.y + shoot.l * .45;
      const sg = sc.createLinearGradient(a, b, a - 90, b - 40); sg.addColorStop(0, '#fff'); sg.addColorStop(1, '#0000');
      sc.strokeStyle = sg; sc.lineWidth = 2; sc.beginPath(); sc.moveTo(a, b); sc.lineTo(a - 90, b - 40); sc.stroke();
      if (shoot.l > 360) shoot = null;
    }
    // montanhas com parallax
    ridges.forEach((c, l) => sc.drawImage(c, -80 + cx * (6 + l * 14), cy * (3 + l * 8), W + 160, H));
    // vagalumes
    for (const d of dust) {
      const x = ((d.x + Math.sin(t * .0004 * d.v * 20 + d.p) * .04) * W + cx * 22), y = (((d.y - t * .000012 * d.v * 20) % 1 + 1) % 1) * H;
      sc.fillStyle = `rgba(255,226,160,${.25 + .35 * Math.sin(t * .003 + d.p)})`;
      sc.shadowColor = '#ffd98a'; sc.shadowBlur = 8; sc.beginPath(); sc.arc(x, y, d.r, 0, 6.28); sc.fill(); sc.shadowBlur = 0;
    }
  };
  // partículas
  let P = [];
  const burst = (x, y, n = 14, cols = ['#ffd98a', '#aeeaff', '#d9c8ff', '#fff'], pw = 1) => {
    if (RM) return;
    for (let i = 0; i < n; i++) { const a = R() * 6.28, v = (2 + R() * 5) * pw; P.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 1.5, l: 1, d: .02 + R() * .02, r: 1.5 + R() * 3, c: cols[i % cols.length], t: R() < .3 ? '✦' : 'o' }); }
  };
  const confetti = (n = 120) => {
    if (RM) return;
    for (let i = 0; i < n; i++) P.push({ x: R() * W, y: -20 - R() * 200, vx: R() * 4 - 2, vy: 2 + R() * 4, l: 1.6, d: .006, r: 4 + R() * 5, c: ['#ffd98a', '#aeeaff', '#d9c8ff', '#ff9ec7', '#9dffb8'][i % 5], t: 'r', rot: R() * 6, vr: R() * .3 - .15 });
  };
  const step = (t) => {
    if (document.hidden) return requestAnimationFrame(step);
    cx += (tx - cx) * .06; cy += (ty - cy) * .06;
    document.documentElement.style.setProperty('--px', cx.toFixed(3));
    document.documentElement.style.setProperty('--py', cy.toFixed(3));
    bg(t);
    fc.clearRect(0, 0, W, H);
    P = P.filter((p) => p.l > 0);
    for (const p of P) {
      p.x += p.vx; p.y += p.vy; p.vy += p.t === 'r' ? .04 : .12; p.vx *= .985; p.l -= p.d;
      fc.globalAlpha = Math.min(1, p.l); fc.fillStyle = p.c; fc.shadowColor = p.c; fc.shadowBlur = 8;
      if (p.t === 'r') { p.rot += p.vr; fc.save(); fc.translate(p.x, p.y); fc.rotate(p.rot); fc.fillRect(-p.r / 2, -p.r / 4, p.r, p.r / 2); fc.restore(); }
      else if (p.t === '✦') { fc.font = p.r * 4 + 'px serif'; fc.fillText('✦', p.x, p.y); }
      else { fc.beginPath(); fc.arc(p.x, p.y, p.r * Math.max(p.l, .2), 0, 6.28); fc.fill(); }
    }
    fc.globalAlpha = 1; fc.shadowBlur = 0;
    requestAnimationFrame(step);
  };
  // parallax: mouse + giroscópio
  addEventListener('pointermove', (e) => { if (!RM) { tx = e.clientX / W - .5; ty = e.clientY / H - .5; } }, { passive: true });
  addEventListener('deviceorientation', (e) => { if (!RM && e.gamma != null) { tx = Math.max(-.5, Math.min(.5, e.gamma / 60)); ty = Math.max(-.5, Math.min(.5, (e.beta - 45) / 90)); } }, { passive: true });
  addEventListener('resize', setup);
  // tilt holográfico nas cartas
  const board = $('board');
  board.addEventListener('pointermove', (e) => {
    const c = e.target.closest('.card[draggable="true"]'); if (!c || RM || e.pointerType === 'touch') return;
    const b = c.getBoundingClientRect(), x = (e.clientX - b.left) / b.width, y = (e.clientY - b.top) / b.height;
    c.style.setProperty('--ry', (x - .5) * 18 + 'deg'); c.style.setProperty('--rx', (.5 - y) * 14 + 'deg');
    c.style.setProperty('--mx', x * 100 + '%'); c.style.setProperty('--my', y * 100 + '%');
  });
  // efeitos de jogo (sobrescrevem funções do game.js)
  const origSparks = showSparks;
  showSparks = (col) => {
    const card = board.children[col]?.lastElementChild; if (!card) return;
    const b = card.getBoundingClientRect(); burst(b.left + b.width / 2, b.top + b.height / 2, 16);
    origSparks(col);
  };
  const origFinish = finishTurn;
  finishTurn = () => {
    const before = game.done.length, hadStock = game.stock.length;
    origFinish();
    if (game.done.length > before) {
      const s = $('score').getBoundingClientRect();
      const pop = document.createElement('div'); pop.className = 'popup'; pop.textContent = '+100 ✦';
      pop.style.left = s.left + s.width / 2 + 'px'; pop.style.top = s.bottom + 8 + 'px'; document.body.append(pop); setTimeout(() => pop.remove(), 1300);
      burst(innerWidth / 2, innerHeight * .4, 60, undefined, 1.6); confetti(50);
      for (const id of ['score', 'progress']) { const el = $(id); el.classList.remove('bump'); void el.offsetWidth; el.classList.add('bump'); }
      navigator.vibrate?.([30, 40, 60]);
    } else navigator.vibrate?.(8);
    if (game.stock.length < hadStock) { const d = $('deal').getBoundingClientRect(); burst(d.left + d.width / 2, d.top + d.height / 2, 24); }
    if (game.done.length === 8) { confetti(220); setTimeout(() => confetti(160), 900); setTimeout(() => confetti(160), 1800); }
  };
  // ripple nos botões
  document.addEventListener('pointerdown', (e) => {
    const b = e.target.closest('button'); if (!b || b.disabled || RM) return;
    const r = b.getBoundingClientRect(), s = Math.max(r.width, r.height) / 4, d = document.createElement('span');
    d.className = 'ripple'; d.style.cssText = `width:${s}px;height:${s}px;left:${e.clientX - r.left - s / 2}px;top:${e.clientY - r.top - s / 2}px`;
    b.append(d); setTimeout(() => d.remove(), 600);
  });
  window.FX = { burst, confetti }; setup(); requestAnimationFrame(step);
})();
