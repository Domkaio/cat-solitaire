const cardAudio = (() => {
  const AudioContextClass = window.AudioContext || window.webkitAudioContext;
  let audioContext, mix, output;
  const ctx = () => {
    if (!audioContext) {
      audioContext = new AudioContextClass();
      mix = audioContext.createGain();
      output = audioContext.createGain();
      mix.connect(output);
      output.connect(audioContext.destination);
      const d = audioContext.createDelay();
      d.delayTime.value = .13;
      const f = audioContext.createGain();
      f.gain.value = .3;
      const lp = audioContext.createBiquadFilter();
      lp.frequency.value = 2600;
      mix.connect(d);
      d.connect(lp);
      lp.connect(f);
      f.connect(d);
      lp.connect(output);
    }
    if (audioContext.state === 'suspended') audioContext.resume();
    updateVolume();
    return audioContext;
  };
  const tone = (f, t, d, type = 'sine', v = .2, f2) => {
    const c = ctx(),
      o = c.createOscillator(),
      g = c.createGain(),
      s = c.currentTime + t;
    o.type = type;
    o.frequency.setValueAtTime(f, s);
    if (f2) o.frequency.exponentialRampToValueAtTime(f2, s + d);
    g.gain.setValueAtTime(0, s);
    g.gain.linearRampToValueAtTime(v, s + .008);
    g.gain.exponentialRampToValueAtTime(.0001, s + d);
    o.connect(g);
    g.connect(mix);
    o.start(s);
    o.stop(s + d + .05);
  };
  const noise = (t, d, f0, f1, v = .15) => {
    const c = ctx(),
      n = c.sampleRate * d | 0,
      b = c.createBuffer(1, n, c.sampleRate),
      a = b.getChannelData(0);
    for (let i = 0; i < n; i++) a[i] = Math.random() * 2 - 1;
    const s = c.createBufferSource();
    s.buffer = b;
    const bp = c.createBiquadFilter();
    bp.type = 'bandpass';
    bp.Q.value = 1.2;
    const g = c.createGain(),
      st = c.currentTime + t;
    bp.frequency.setValueAtTime(f0, st);
    bp.frequency.exponentialRampToValueAtTime(f1, st + d);
    g.gain.setValueAtTime(0, st);
    g.gain.linearRampToValueAtTime(v, st + d * .3);
    g.gain.exponentialRampToValueAtTime(.0001, st + d);
    s.connect(bp);
    bp.connect(g);
    g.connect(mix);
    s.start(st);
  };
  const arpeggio = (notes, gap, type = 'triangle', v = .14, len = .5) => notes.forEach((n, i) => {
    tone(n, i * gap, len, type, v);
    tone(n * 2, i * gap, len * .7, 'sine', v * .35);
  });
  const effects = {
    pick: () => {
      noise(0, .05, 3000, 1200, .08);
      tone(620, 0, .05, 'triangle', .07, 420);
    },
    menu: () => {
      tone(660, 0, .09, 'sine', .1);
      tone(990, .05, .12, 'sine', .07);
    },
    place: () => {
      noise(0, .07, 1800, 700, .12);
      tone(180, 0, .09, 'sine', .18, 90);
    },
    tick: () => {
      tone(1300 + Math.random() * 500, 0, .03, 'square', .035);
      noise(0, .04, 4000, 2000, .05);
    },
    deal: () => noise(0, .4, 500, 5200, .11),
    open: () => {
      noise(0, .9, 400, 6000, .1);
      arpeggio([392, 494, 587, 784], .09, 'triangle', .1, .4);
    },
    hint: () => {
      tone(1175, 0, .5, 'sine', .12);
      tone(1760, .09, .6, 'sine', .09);
      tone(2349, .2, .7, 'sine', .05);
    },
    undo: () => tone(500, 0, .14, 'sine', .1, 300),
    seq: () => arpeggio([523, 659, 784, 1047, 1319], .08, 'triangle', .14),
    win: () => {
      arpeggio([523, 659, 784, 1047, 784, 1047, 1319, 1568], .12, 'triangle', .15, .8);
      [523, 659, 784].forEach(n => tone(n, 1, 1.6, 'sine', .08));
    }
  };
  function updateVolume() {
    if (output) output.gain.value = muted ? 0 : Number(level.value) / 100 * 1.3;
  }
  function play(name) {
    if (muted || !AudioContextClass) return;
    effects[name]();
  }
  return {
    play,
    updateVolume
  };
})();
