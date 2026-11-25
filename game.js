'use strict';

const getElement = (id) => document.getElementById(id);
const dialog = document.querySelector('dialog');
const article = dialog.querySelector('article');
const ranks = ['', 'A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];
const suits = ['♠', '♥', '♣', '♦'];
const storageKey = 'noctis.spider.v1';
const recordKey = storageKey + '.records';

function readStoredValue(key, fallback) {
  try {
    return JSON.parse(localStorage.getItem(key)) ?? fallback;
  } catch {
    return fallback;
  }
}

function storeValue(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    getElement('note').textContent = 'Armazenamento indisponível neste navegador.';
  }
}

function createGame(suitCount) {
  const deck = [];
  for (let pack = 0; pack < 8; pack++) {
    for (let rank = 1; rank <= 13; rank++) {
      deck.push({ r: rank, s: pack % suitCount, up: false });
    }
  }

  for (let index = deck.length - 1; index > 0; index--) {
    const other = Math.floor(Math.random() * (index + 1));
    [deck[index], deck[other]] = [deck[other], deck[index]];
  }

  const piles = Array.from({ length: 10 }, (_, column) => {
    const pile = deck.splice(0, column < 4 ? 6 : 5);
    pile.at(-1).up = true;
    return pile;
  });

  return {
    n: suitCount,
    piles,
    stock: deck,
    done: [],
    moves: 0,
    seconds: 0,
    id: Date.now(),
    history: [],
  };
}
let savedGame = readStoredValue(storageKey, null);
let game = savedGame || createGame(1);
let selected = null;
let hintColumn = -1;
let animatedColumns = [];
let dragSource = null;
const save = () => {
  if (savedGame) storeValue(storageKey, game);
};
const formatTime = (t) => Math.floor(t / 60) + ':' + String(t % 60).padStart(2, '0');
const getScore = () => 500 + 100 * game.done.length - game.moves;

function isMovableSequence(pile, startIndex) {
  const firstCard = pile[startIndex];
  if (!firstCard?.up) return false;

  for (let index = startIndex + 1; index < pile.length; index++) {
    const card = pile[index];
    const previous = pile[index - 1];
    if (!card.up || card.s !== firstCard.s || previous.r !== card.r + 1) {
      return false;
    }
  }
  return true;
}

function canMove(fromColumn, startIndex, toColumn) {
  const source = game.piles[fromColumn];
  const destination = game.piles[toColumn];
  return (
    fromColumn !== toColumn &&
    isMovableSequence(source, startIndex) &&
    (!destination.length || destination.at(-1).r === source[startIndex].r + 1)
  );
}

function saveUndoState() {
  game.history.push(JSON.stringify([game.piles, game.stock, game.done]));
  if (game.history.length > 80) game.history.shift();
}

function finishTurn() {
  const previousCount = game.done.length;
  const flights = [];
  const landing = animatedColumns.at(-1);
  lastTap = null;
  for (const [column, p] of game.piles.entries()) {
    while (p.length) {
      p.at(-1).up = true;
      if (p.length < 13 || !isMovableSequence(p, p.length - 13)) break;
      if (!flights.length) renderBoard();
      const start = p.length - 13;
      const cards = Array.from(getElement('board').children[column].children).slice(start, p.length);
      flights.push(collectSequence(cards, p.slice(start), game.done.length, flights.length));
      game.done.push(p.at(-1).s);
      p.splice(-13);
      getElement('note').textContent = 'Sequência completa! +100 pontos ✧';
    }
  }
  selected = null;
  hintColumn = -1;
  game.moves++;
  save();
  renderBoard();
  showSparks(landing);
  FX.finishTurn(game.done.length - previousCount);
  cardAudio.play(game.done.length > previousCount ? 'seq' : 'place');
  if (game.done.length === 8) {
    setTimeout(() => cardAudio.play('win'), 600);
    let list = readStoredValue(recordKey, []);
    if (!list.some((x) => x.id === game.id)) {
      list.push({
        id: game.id,
        n: game.n,
        points: getScore(),
        time: game.seconds,
      });
      storeValue(recordKey, list);
    }
    const winningGame = game;
    Promise.all(flights).then(() => {
      if (game !== winningGame || getElement('table').hidden) return;
      show(
      '<h2>Mesa completa ✧</h2><p>' +
        getScore() +
        ' pontos em ' +
        formatTime(game.seconds) +
        '. Seu resultado entrou nos recordes locais.</p>',
      );
    });
  }
}

function moveCards(fromColumn, startIndex, toColumn) {
  if (!canMove(fromColumn, startIndex, toColumn)) return false;
  const origin =
    getElement('board').children[fromColumn].children[startIndex].getBoundingClientRect();
  const cards = game.piles[fromColumn].slice(startIndex);
  saveUndoState();
  game.piles[toColumn].push(...game.piles[fromColumn].splice(startIndex));
  animatedColumns = [toColumn];
  finishTurn();
  cards.forEach((c, k) => {
    const index = game.piles[toColumn].indexOf(c);
    if (index >= 0)
      fly(getElement('board').children[toColumn].children[index], origin, 0);
  });
  return true;
}
const sizeControl = getElement('size');
const savedSize = String(readStoredValue(storageKey + '.size', 100));
sizeControl.value = ['80', '100', '125'].includes(savedSize) ? savedSize : '100';

function applySize() {
  getElement('board').style.width = sizeControl.value + '%';
  renderBoard();
}
sizeControl.onchange = () => {
  storeValue(storageKey + '.size', Number(sizeControl.value));
  applySize();
};

function renderBoard() {
  getElement('score').textContent = getScore();
  getElement('time').textContent = formatTime(game.seconds);
  const rows = game.stock.length / 10;
  getElement('count').textContent =
    rows === 0
      ? 'Reserva vazia'
      : rows + (rows === 1 ? ' fileira restante' : ' fileiras restantes');
  getElement('deal').disabled = !game.stock.length;
  getElement('progress').textContent = game.done.length + '/8';
  getElement('undo').disabled = !game.history.length || game.done.length === 8;
  const board = getElement('board');
  board.style.width = sizeControl.value + '%';
  board.replaceChildren();
  let max = 0;
  game.piles.forEach((p, a) => {
    const col = document.createElement('div');
    col.className = 'pile' + (a === hintColumn ? ' target' : '');
    col.dataset.a = a;
    board.append(col);
    let top = 0;
    p.forEach((c, i) => {
      const el = document.createElement('div');
      el.className =
        'card ' +
        (!c.up ? 'back' : c.s % 2 ? 'red' : '') +
        (selected?.a === a && i >= selected.i ? ' picked' : '') +
        (animatedColumns.includes(a) && i === p.length - 1 ? ' arrival' : '');
      el.style.top = top + 'px';
      el.dataset.i = i;
      if (c.up) {
        el.innerHTML =
          ranks[c.r] +
          '<em>' +
          suits[c.s] +
          '</em><span class="pip">' +
          suits[c.s] +
          '</span><span class="corner">' +
          ranks[c.r] +
          '</span>';
        el.draggable = isMovableSequence(p, i);
      }
      col.append(el);
      if (i < p.length - 1)
        top += c.up
          ? Math.max(18, col.clientWidth * 0.25)
          : Math.max(6, Math.min(13, innerWidth * 0.011));
    });
    max = Math.max(max, top + col.clientWidth / 0.71);
  });
  board.style.height = Math.ceil(max + 12) + 'px';
  animatedColumns = [];
  updateStall();
}

function getCardPosition(event) {
  const column = event.target.closest('.pile');
  return column
    ? {
        a: +column.dataset.a,
        i: +(event.target.closest('.card')?.dataset.i ?? -1),
      }
    : null;
}
let lastTap = null;

function findAutoDestination(fromColumn, startIndex) {
  const card = game.piles[fromColumn][startIndex];
  if (!isMovableSequence(game.piles[fromColumn], startIndex)) return -1;
  const options = game.piles
    .map((pile, b) => ({
      pile,
      b,
    }))
    .filter(({ pile, b }) => pile.length && canMove(fromColumn, startIndex, b));
  function runLength(pile) {
    let i = pile.length - 1;
    while (i > 0 && pile[i - 1].up && pile[i - 1].r === pile[i].r + 1) i--;
    return pile.length - i;
  }
  options.sort(
    (x, y) =>
      runLength(y.pile) - runLength(x.pile) ||
      Number(y.pile.at(-1).s === card.s) - Number(x.pile.at(-1).s === card.s),
  );
  return options[0]?.b ?? -1;
}
getElement('board').onclick = (e) => {
  const t = getCardPosition(e);
  if (!t) return;
  getElement('note').textContent = '';
  const now = performance.now();
  if (lastTap && lastTap.a === t.a && lastTap.i === t.i && now - lastTap.time < 450) {
    lastTap = null;
    const b = findAutoDestination(t.a, t.i);
    if (b !== -1) {
      moveCards(t.a, t.i, b);
      return;
    }
    getElement('note').textContent = 'Nenhuma carta compatível para essa sequência.';
    return;
  }
  if (selected && moveCards(selected.a, selected.i, t.a)) {
    lastTap = null;
    return;
  }
  lastTap = {
    ...t,
    time: now,
  };
  selected = isMovableSequence(game.piles[t.a], t.i) ? t : null;
  hintColumn = -1;
  renderBoard();
};
getElement('board').ondragstart = (e) => {
  dragSource = getCardPosition(e);
  if (!dragSource) return;
  e.dataTransfer.setData('text/plain', 'carta');
  e.dataTransfer.effectAllowed = 'move';
};
getElement('board').ondragover = (e) => e.preventDefault();
getElement('board').ondrop = (e) => {
  e.preventDefault();
  const t = getCardPosition(e);
  if (dragSource && t) moveCards(dragSource.a, dragSource.i, t.a);
  dragSource = null;
};
getElement('board').ondragend = () => (dragSource = null);
getElement('deal').onclick = () => {
  if (!game.stock.length) return;
  if (game.piles.some((p) => !p.length)) {
    getElement('note').textContent = 'Preencha as colunas vazias antes de distribuir.';
    return;
  }
  saveUndoState();
  game.piles.forEach((p) => {
    const c = game.stock.pop();
    c.up = true;
    p.push(c);
  });
  animatedColumns = game.piles.map((_, i) => i);
  finishTurn();
  cardAudio.play('deal');
  dealFlight(false);
};
getElement('undo').onclick = () => {
  if (!game.history.length || game.done.length === 8) return;
  cancelCollectionFlights();
  [game.piles, game.stock, game.done] = JSON.parse(game.history.pop());
  lastTap = null;
  cardAudio.play('undo');
  game.moves++;
  selected = null;
  hintColumn = -1;
  getElement('note').textContent = 'Última jogada desfeita.';
  save();
  renderBoard();
};
getElement('hint').onclick = () => {
  cardAudio.play('hint');
  let best = null;
  game.piles.forEach((p, a) =>
    p.forEach((c, i) =>
      game.piles.forEach((q, b) => {
        if (!canMove(a, i, b) || (!i && !q.length)) return;
        const value =
          (q.at(-1)?.s === c.s ? 4 : 0) +
          (i && !p[i - 1].up ? 2 : 0) +
          (q.length ? 1 : 0);
        if (!best || value > best.value)
          best = {
            a,
            i,
            b,
            value,
          };
      }),
    ),
  );
  if (best) {
    selected = {
      a: best.a,
      i: best.i,
    };
    hintColumn = best.b;
    getElement('note').textContent =
      'Mova ' +
      ranks[game.piles[best.a][best.i].r] +
      suits[game.piles[best.a][best.i].s] +
      ' da coluna ' +
      (best.a + 1) +
      ' para a ' +
      (best.b + 1) +
      '.';
    renderBoard();
  } else
    getElement('note').textContent = game.stock.length
      ? 'Tente distribuir uma nova fileira.'
      : 'Tente desfazer uma jogada.';
};

function show(html) {
  getElement('preferences').hidden = true;
  article.innerHTML = html;
  if (!dialog.open) dialog.showModal();
}
getElement('close').onclick = () => dialog.close();
getElement('help').onclick = () =>
  show(
    '<h2>Como jogar</h2><p>Forme oito sequências do rei ao ás, todas do mesmo naipe. Coloque uma carta sobre outra de valor imediatamente maior. Uma coluna vazia aceita qualquer carta.</p><p>Dê dois cliques ou dois toques para encaixar automaticamente, priorizando a sequência aberta mais longa e, no empate, o mesmo naipe. Arraste com o mouse ou toque na carta e depois na coluna de destino. Um grupo só se move junto quando está em ordem e tem o mesmo naipe.</p><p>Cada jogada custa 1 ponto. Completar uma sequência rende 100. A reserva distribui uma carta por coluna.</p>',
  );
getElement('play').onclick = () => {
  const modes = [
    [1, 'Casual', '♠'],
    [2, 'Estratégico', '♠ ♥'],
    [4, 'Especialista', '♠ ♥ ♣ ♦'],
  ];
  show(
    '<div class="mode-head"><img src="felisnoc.png" alt=""><div><h2>Nova partida</h2><p>Escolha seu baralho.</p></div></div><div class="mode-list">' +
      modes
        .map(
          ([n, name, icons]) =>
            '<button class="mode-option" data-n="' +
            n +
            '"><span class="mode-art">' +
            icons +
            '</span><span><b>' +
            name +
            '</b><small>' +
            n +
            (n === 1 ? ' naipe' : ' naipes') +
            '</small></span><span aria-hidden="true">›</span></button>',
        )
        .join('') +
      '</div>' +
      (game.moves && savedGame ? '<p>A escolha inicia uma nova mesa.</p>' : ''),
  );
  article.querySelectorAll('[data-n]').forEach(
    (button) =>
      (button.onclick = () => {
        game = createGame(Number(button.dataset.n));
        savedGame = game;
        selected = null;
        hintColumn = -1;
        animatedColumns = game.piles.map((_, i) => i);
        getElement('note').textContent = '';
        dialog.close();
        enterTable();
        cardAudio.play('open');
        dealFlight(true);
        save();
      }),
  );
};
getElement('records').onclick = () => {
  const list = readStoredValue(recordKey, []);
  show(
    '<h2>Recordes locais</h2>' +
      [1, 2, 4]
        .map((n) => {
          const rows = list.filter((x) => x.n === n);
          return (
            '<h3>' +
            n +
            (n === 1 ? ' naipe' : ' naipes') +
            '</h3><p>' +
            (rows.length
              ? 'Melhor pontuação · ' +
                Math.max(...rows.map((x) => x.points)) +
                '<br>Melhor tempo · ' +
                formatTime(Math.min(...rows.map((x) => x.time)))
              : 'Nenhuma vitória ainda.') +
            '</p>'
          );
        })
        .join(''),
  );
};
setInterval(() => {
  if (
    !getElement('table').hidden &&
    !document.hidden &&
    !dialog.open &&
    game.done.length < 8
  ) {
    game.seconds++;
    getElement('time').textContent = formatTime(game.seconds);
    if (game.seconds % 5 === 0) save();
  }
}, 1000);
addEventListener('pagehide', save);
document.addEventListener('visibilitychange', save);
const canvas = getElement('sky');
const ctx = canvas.getContext('2d');
let dx = 0;
let dy = 0;

function drawBackground() {
  const w = (canvas.width = innerWidth);
  const h = (canvas.height = innerHeight);
  ctx.clearRect(0, 0, w, h);
  let seed = 947;
  const rand = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  for (let i = 0; i < 220; i++) {
    let x = rand() * w + dx;
    let y = rand() * h + dy;
    let r = rand();
    ctx.fillStyle = 'rgba(193,194,255,' + (0.15 + r * 0.55) + ')';
    ctx.fillRect(x, y, r * 2 + 0.5, r * 2 + 0.5);
    if (r > 0.97) {
      ctx.fillRect(x - 3, y + 1, 8, 1);
      ctx.fillRect(x + 1, y - 3, 1, 8);
    }
  }
  for (let layer = 0; layer < 3; layer++) {
    ctx.beginPath();
    ctx.moveTo(-30, h);
    for (let x = -30; x <= w + 30; x += 8) {
      const base = h * (0.78 + layer * 0.085);
      const ridge = Math.sin(x * 0.013 + layer) * 20 + Math.cos(x * 0.005 + layer) * 32;
      ctx.lineTo(x + dx * layer, base + ridge - rand() * 7 + dy * layer);
    }
    ctx.lineTo(w + 40, h);
    ctx.closePath();
    ctx.fillStyle = ['#302852', '#201e43', '#131832'][layer];
    ctx.fill();
  }
}
addEventListener('resize', () => {
  renderBoard();
});
syncLobby();
let muted = readStoredValue(storageKey + '.muted', false);
let musicMuted = readStoredValue(storageKey + '.musicMuted', muted);

function updateAudioControls() {
  for (const [id, label, on] of [
    ['audioPref', 'Efeitos sonoros', !muted],
    ['musicPref', 'Música de fundo', !musicMuted],
  ]) {
    const button = getElement(id);
    button.textContent = label + (on ? ' · Ligado' : ' · Desligado');
    button.setAttribute('aria-pressed', String(on));
  }
}
const level = getElement('volume');
level.value = readStoredValue(storageKey + '.volume', 55);

level.oninput = () => {
  storeValue(storageKey + '.volume', Number(level.value));
  cardAudio.updateVolume();
};

function showSparks(col) {
  if (col == null || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const card = getElement('board').children[col]?.lastElementChild;
  if (!card) return;
  const box = card.getBoundingClientRect();
  FX.burst(box.left + box.width / 2, box.top + box.height / 2, 16);
  for (let i = 0; i < 6; i++) {
    const star = document.createElement('span');
    star.className = 'spark';
    star.textContent = '✦';
    star.style.left = box.left + box.width / 2 + 'px';
    star.style.top = box.top + box.height / 2 + 'px';
    const angle = (i * Math.PI) / 3;
    star.style.setProperty('--x', Math.cos(angle) * box.width * 0.65 + 'px');
    star.style.setProperty('--y', Math.sin(angle) * box.width * 0.65 + 'px');
    document.body.append(star);
    setTimeout(() => star.remove(), 700);
  }
}

function syncLobby() {
  getElement('resume').hidden = !savedGame || game.done.length === 8;
  getElement('play').firstChild.textContent = savedGame
    ? 'Nova partida '
    : 'Jogar agora ';
}

function enterTable() {
  lastTap = null;
  getElement('lobby').hidden = true;
  getElement('table').hidden = false;
  renderBoard();
}
getElement('resume').onclick = enterTable;
getElement('home').onclick = () => {
  cancelCollectionFlights();
  save();
  selected = null;
  hintColumn = -1;
  lastTap = null;
  getElement('lobby').hidden = false;
  getElement('table').hidden = true;
  syncLobby();
  scrollTo(0, 0);
};

getElement('settings').onclick = () => {
  show('');
  getElement('preferences').hidden = false;
  updateAudioControls();
  sizeControl.focus();
};
getElement('audioSettings').onclick = getElement('settings').onclick;
getElement('audioPref').onclick = () => {
  muted = !muted;
  storeValue(storageKey + '.muted', muted);
  storeValue(storageKey + '.musicMuted', musicMuted);
  cardAudio.updateVolume();
  if (!muted) cardAudio.play('menu');
  updateAudioControls();
};
getElement('musicPref').onclick = () => {
  musicMuted = !musicMuted;
  storeValue(storageKey + '.musicMuted', musicMuted);
  updateAudioControls();
  syncMusic();
};

function hasNextAction() {
  if (game.stock.length && game.piles.every((p) => p.length)) return true;
  return game.piles.some((p, a) =>
    p.some((_, i) => game.piles.some((q, b) => (q.length || i > 0) && canMove(a, i, b))),
  );
}

function updateStall() {
  const stalled = game.done.length < 8 && !hasNextAction();
  getElement('stalled').hidden = !stalled;
  getElement('rewind').disabled = !game.history.length;
}
getElement('rewind').onclick = () => getElement('undo').click();
getElement('restart').onclick = () => getElement('play').click();
let held = [];

function releaseCards() {
  held.forEach((el) => el.classList.remove('held'));
  held = [];
}
getElement('board').addEventListener('pointerdown', (e) => {
  releaseCards();
  const t = getCardPosition(e);
  if (e.button === 0 && t && game.piles[t.a][t.i]?.up) cardAudio.play('pick');
  if (e.button !== 0 || !t || !isMovableSequence(game.piles[t.a], t.i)) return;
  held = Array.from(getElement('board').children[t.a].children).slice(t.i);
  held.forEach((el) => el.classList.add('held'));
});
for (const event of ['pointerup', 'pointercancel', 'dragend', 'blur'])
  window.addEventListener(event, releaseCards);
const soundtrack = new Audio('audio/orbita.mp3');
soundtrack.loop = true;
const musicLevel = getElement('musicLevel');
musicLevel.value = readStoredValue(storageKey + '.musicVolume', 24);

function syncMusic() {
  soundtrack.volume = Number(musicLevel.value) / 100;
  if (musicMuted || document.hidden || !soundtrack.volume) soundtrack.pause();
  else if (soundtrack.paused) soundtrack.play().catch(() => {});
}
musicLevel.oninput = () => {
  storeValue(storageKey + '.musicVolume', Number(musicLevel.value));
  syncMusic();
};
document.addEventListener(
  'click',
  (event) => {
    if (!event.isTrusted) return;
    syncMusic();
    const button = event.target.closest('button');
    if (button && !button.disabled && !['deal', 'hint', 'undo', 'rewind', 'audioPref'].includes(button.id)) cardAudio.play('menu');
  },
  true,
);
document.addEventListener('visibilitychange', syncMusic);
syncMusic();
