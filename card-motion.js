function fly(card, origin, delay, dealing = false) {
  if (!card || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  card.classList.remove('arrival');
  const bounds = card.getBoundingClientRect(),
    dx = origin.left - bounds.left,
    dy = origin.top - bounds.top,
    rotation = dealing ? Math.random() * 40 - 20 : -8,
    duration = dealing ? 640 : 420;
  card.animate([{
    transform: `translate(${dx}px,${dy}px) scale(.62) rotate(${rotation}deg)`,
    opacity: 0,
    offset: 0
  }, {
    opacity: 1,
    offset: .12
  }, {
    transform: `translate(${dx * .45}px,${dy * .45 + (dealing ? -90 : -40)}px) scale(1.12) rotate(${-rotation / 2}deg)`,
    filter: 'drop-shadow(0 18px 14px #0008)',
    offset: .55
  }, {
    transform: 'none',
    offset: 1
  }], {
    delay,
    duration,
    fill: 'backwards',
    easing: 'cubic-bezier(.3,.8,.3,1)'
  });
  setTimeout(() => {
    const r = card.getBoundingClientRect();
    FX.burst(r.left + r.width / 2, r.bottom, dealing ? 4 : 7, ['#aeeaff', '#d9c8ff'], .5);
  }, delay + duration);
}
function dealFlight(opening) {
  const stockButton = getElement('deal'),
    origin = stockButton.getBoundingClientRect();
  stockButton.classList.remove('kick');
  void stockButton.offsetWidth;
  stockButton.classList.add('kick');
  const piles = Array.from(getElement('board').children);
  piles.forEach((pile, column) => {
    if (opening) {
      Array.from(pile.children).forEach((card, row) => {
        const position = row * piles.length + column;
        const delay = position * 22;
        fly(card, origin, delay, true);
        if (position % 4 === 0) {
          setTimeout(() => cardAudio.play('tick'), delay + 480);
        }
      });
    } else {
      const delay = column * 55;
      fly(pile.lastElementChild, origin, delay, true);
      setTimeout(() => cardAudio.play('tick'), delay + 520);
    }
  });
}

const collectionFlights = new Set();

function cancelCollectionFlights() {
  for (const flight of collectionFlights) flight.cancel();
}

async function collectSequence(cards, sequence, slot, batchIndex) {
  if (!cards.length || matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  const marker = document.querySelectorAll('.pips i')[slot];
  const target = marker?.getBoundingClientRect().width ? marker : getElement('progress');
  const destination = target.getBoundingClientRect();
  const endX = destination.left + destination.width / 2;
  const endY = destination.top + destination.height / 2;

  const arrivals = cards.map((source, index) => {
    const bounds = source.getBoundingClientRect();
    const face = source.cloneNode(true);
    const card = sequence[index];
    face.className = 'card collection-card' + (card.s % 2 ? ' red' : '');
    face.innerHTML = ranks[card.r] + '<em>' + suits[card.s] + '</em><span class="pip">' + suits[card.s] + '</span><span class="corner">' + ranks[card.r] + '</span>';
    face.setAttribute('aria-hidden', 'true');
    face.draggable = false;
    const style = getComputedStyle(source);
    Object.assign(face.style, {
      position: 'fixed', left: bounds.left + 'px', top: bounds.top + 'px',
      width: bounds.width + 'px', height: bounds.height + 'px',
      padding: style.padding, fontSize: style.fontSize
    });
    face.querySelector('.pip').style.fontSize = Math.min(100, Math.max(20, bounds.width * .52)) + 'px';
    document.body.append(face);

    const dx = endX - bounds.left - bounds.width / 2;
    const dy = endY - bounds.top - bounds.height / 2;
    const flight = face.animate([
      {transform: 'translate(0, 0) scale(1)', opacity: 1},
      {transform: 'translate(0, -9px) rotate(-4deg) scale(1.03)', offset: .17},
      {transform: `translate(${dx * .48}px, ${dy * .60 - 32}px) rotate(9deg) scale(.62)`, offset: .58},
      {transform: `translate(${dx}px, ${dy}px) rotate(-8deg) scale(.08)`, opacity: .35}
    ], {
      duration: 590, delay: batchIndex * 190 + (12 - index) * 32,
      easing: 'ease-in-out', fill: 'both'
    });
    collectionFlights.add(flight);
    return flight.finished.then(() => true, () => false).finally(() => {
      face.remove();
      collectionFlights.delete(flight);
    });
  });

  if ((await Promise.all(arrivals)).every(Boolean)) {
    target.animate([
      {filter: 'brightness(1)'},
      {filter: 'brightness(2) drop-shadow(0 0 5px #ffe6aa)', offset: .3},
      {filter: 'brightness(1)'}
    ], {duration: 480});
    FX.burst(endX, endY, 16, ['#ffe6aa', '#b8b1ff'], .65);
  }
}
