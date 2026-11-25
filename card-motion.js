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
