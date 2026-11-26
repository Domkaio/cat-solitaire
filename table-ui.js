'use strict';

(() => {
  const $ = getElement;
  /* ===== Dica com seta animada ===== */
  const layer = document.createElement('div');
  layer.id = 'hintlayer';
  document.body.append(layer);
  let ht;
  const clearHint = () => layer.replaceChildren();
  const drawHint = () => {
    clearHint();
    if (!selected || hintColumn < 0) return;
    const bd = $('board'),
      src = bd.children[selected.a]?.children[selected.i],
      pile = bd.children[hintColumn];
    if (!src || !pile) return;
    const s = src.getBoundingClientRect(),
      d = pile.lastElementChild?.getBoundingClientRect() || pile.getBoundingClientRect();
    const sx = s.left + s.width / 2,
      sy = s.top + s.height * .3,
      ex = d.left + d.width / 2,
      ey = pile.lastElementChild ? d.top + d.height * .55 : d.top + d.height * .35;
    const path = `M${sx} ${sy} Q${(sx + ex) / 2} ${Math.min(sy, ey) - 110} ${ex} ${ey}`;
    layer.innerHTML = `<svg><defs><linearGradient id="hg" gradientUnits="userSpaceOnUse" x1="${sx}" y1="${sy}" x2="${ex}" y2="${ey}"><stop stop-color="#aeeaff"/><stop offset="1" stop-color="#ffd98a"/></linearGradient></defs><path class="hpath" d="${path}"/><circle r="6" fill="#fff"><animateMotion dur="1s" repeatCount="indefinite" path="${path}"/></circle></svg><i class="hring" style="left:${sx}px;top:${sy}px"></i><i class="hring dst" style="left:${ex}px;top:${ey}px"></i>`;
    FX.burst(ex, ey, 10, ['#ffd98a', '#aeeaff'], .6);
  };
  const oh = $('hint').onclick;
  $('hint').onclick = () => {
    oh();
    requestAnimationFrame(drawHint);
    clearTimeout(ht);
    ht = setTimeout(clearHint, 4500);
  };
  $('board').addEventListener('pointerdown', clearHint);
  /* toast: some sozinho */
  let nt;
  new MutationObserver(() => {
    clearTimeout(nt);
    const n = $('note');
    if (n.textContent) nt = setTimeout(() => n.textContent = '', 3800);
  }).observe($('note'), {
    childList: true,
    characterData: true,
    subtree: true
  });
  /* ===== HUD: cartas de progresso ===== */
  const pips = document.createElement('div');
  pips.className = 'pips';
  pips.innerHTML = '<i></i>'.repeat(8);
  document.querySelector('.metrics').append(pips);
  const updPips = () => [...pips.children].forEach((p, i) => p.classList.toggle('on', i < game.done.length));
  new MutationObserver(updPips).observe($('progress'), {
    childList: true,
    characterData: true,
    subtree: true
  });
  updPips();
  /* ===== Menu de modos ===== */
  const op = $('play').onclick;
  $('play').onclick = () => {
    op();
    const recs = readStoredValue(recordKey, []);
    const info = {
      1: ['Casual', 'Relaxe e aprenda o jogo.', 1],
      2: ['Estratégico', 'Alterne espadas e copas a cada carta.', 2],
      4: ['Especialista', 'O desafio máximo para veteranos.', 3]
    };
    article.querySelectorAll('.mode-option').forEach(b => {
      const n = +b.dataset.n,
        [name, desc, lv] = info[n],
        rows = recs.filter(x => x.n === n);
      const best = rows.length ? `Melhor: ${Math.max(...rows.map(x => x.points))} pts · ${formatTime(Math.min(...rows.map(x => x.time)))}` : 'Nenhuma vitória ainda';
      b.innerHTML = `<span class="mode-art">${suits.slice(0, n === 1 ? 1 : n).map(s => `<span class="${s === '♥' || s === '♦' ? 'r' : ''}">${s}</span>`).join('')}</span><span class="mode-txt"><b>${name}</b><em>${desc}</em><small>${best}</small></span><span class="mode-lvl">${'●'.repeat(lv)}${'○'.repeat(3 - lv)}</span>`;
    });
  };
})();
