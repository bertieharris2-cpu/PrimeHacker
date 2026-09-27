/* PRIMENET sound. Every sound is synthesised with the Web Audio API, so there are no
   audio files to lose. Games call PNSound.play("name"). One on/off switch and volume
   (saved in this browser) covers the whole game. Teacher controls have a sound check. */
(function(){
  "use strict";

  const KEY = "primenet_sound_v1";
  let settings = { on: true, volume: 0.7 };
  try{ Object.assign(settings, JSON.parse(localStorage.getItem(KEY) || "{}")); }catch(e){}

  let ctx = null, master = null, dry = null, wet = null;
  const last = {};   // throttling for rapid-fire sounds

  function save(){ try{ localStorage.setItem(KEY, JSON.stringify(settings)); }catch(e){} }

  function ensure(){
    if(ctx) return ctx;
    const AC = window.AudioContext || window.webkitAudioContext;
    if(!AC) return null;
    ctx = new AC();
    master = ctx.createGain();
    master.gain.value = settings.volume;
    const comp = ctx.createDynamicsCompressor();
    comp.threshold.value = -14; comp.ratio.value = 4;
    master.connect(comp); comp.connect(ctx.destination);
    // A small generated "room" so chimes ring instead of clicking off
    dry = ctx.createGain(); dry.gain.value = 1; dry.connect(master);
    const verb = ctx.createConvolver();
    const len = Math.floor(ctx.sampleRate * 1.1), ir = ctx.createBuffer(2, len, ctx.sampleRate);
    for(let c = 0; c < 2; c++){ const d = ir.getChannelData(c); for(let i = 0; i < len; i++) d[i] = (Math.random()*2-1) * Math.pow(1 - i/len, 3); }
    verb.buffer = ir;
    wet = ctx.createGain(); wet.gain.value = 0.16;
    verb.connect(wet); wet.connect(master);
    dry.verb = verb;
    return ctx;
  }

  function out(){ return dry; }

  // One oscillator voice with an attack/decay envelope, optional pitch slide and filter
  function tone({ f=440, to=null, type="sine", at=0, dur=0.15, vol=0.2, attack=0.004, lp=null, verb=true }){
    const c = ctx, t = c.currentTime + at;
    const o = c.createOscillator(), g = c.createGain();
    o.type = type; o.frequency.setValueAtTime(f, t);
    if(to) o.frequency.exponentialRampToValueAtTime(Math.max(20, to), t + dur);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(vol, t + attack);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    let node = o;
    if(lp){ const fl = c.createBiquadFilter(); fl.type = "lowpass"; fl.frequency.value = lp; o.connect(fl); node = fl; }
    node.connect(g); g.connect(out()); if(verb) g.connect(dry.verb);
    o.start(t); o.stop(t + dur + 0.05);
  }

  // A burst of filtered noise: knocks, thumps, whooshes
  function noise({ at=0, dur=0.06, vol=0.2, type="bandpass", freq=1200, to=null, q=1.2 }){
    const c = ctx, t = c.currentTime + at;
    const len = Math.max(1, Math.floor(c.sampleRate * dur));
    const buf = c.createBuffer(1, len, c.sampleRate), d = buf.getChannelData(0);
    for(let i = 0; i < len; i++) d[i] = Math.random()*2 - 1;
    const src = c.createBufferSource(); src.buffer = buf;
    const fl = c.createBiquadFilter(); fl.type = type; fl.frequency.setValueAtTime(freq, t); fl.Q.value = q;
    if(to) fl.frequency.exponentialRampToValueAtTime(to, t + dur);
    const g = c.createGain();
    g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    src.connect(fl); fl.connect(g); g.connect(out());
    src.start(t); src.stop(t + dur + 0.02);
  }

  // A bell: a note plus quieter overtones, long ring
  function bell(f, at=0, vol=0.18, dur=0.7){
    tone({ f, at, dur, vol, attack: 0.003 });
    tone({ f: f*2.0, at, dur: dur*0.6, vol: vol*0.35 });
    tone({ f: f*3.01, at, dur: dur*0.35, vol: vol*0.15 });
  }

  // Mechanical parts for the big moments: a metal latch, a motor, a burst of air
  function latch(at=0, vol=0.3){
    noise({ at, dur: 0.03, vol, freq: 2600, q: 5 });
    tone({ f: 700, type:"square", at, dur: 0.03, vol: vol * 0.16, lp: 2200, verb:false });
  }
  function servo(at=0, dur=0.35, vol=0.05){ tone({ f: 95, type:"sawtooth", at, dur, vol, lp: 700, attack: 0.03 }); noise({ at, dur, vol: vol * 0.6, freq: 900, q: 2 }); }
  function thunk(at=0, vol=0.5){ tone({ f: 70, to: 55, at, dur: 0.18, vol }); noise({ at, dur: 0.1, vol: vol * 0.7, type:"lowpass", freq: 420 }); }
  function hiss(at=0, dur=0.55, vol=0.05){ noise({ at, dur, vol, type:"highpass", freq: 2800, q: 0.5 }); }

  const LADDER = [523.3, 587.3, 659.3, 784.0, 880.0, 1046.5, 1174.7, 1318.5, 1568.0];   // pentatonic, rising

  const SOUNDS = {
    /* Feedback 4: nothing slides in pitch or rings like a bell (they sounded "bouncy").
       Everything is a click, a relay, a flat electronic tone, static or a mechanical thunk. */
    // Interface
    click(){ tone({ f: 2100, type:"triangle", dur: 0.025, vol: 0.06, verb:false }); noise({ dur: 0.015, vol: 0.04, type:"highpass", freq: 4000 }); },
    key(){ tone({ f: 1300 + Math.random()*400, type:"square", dur: 0.012, vol: 0.018, lp: 3200, verb:false }); },
    tag(){ noise({ dur: 0.02, vol: 0.12, freq: 3200, q: 4 }); tone({ f: 1180, type:"square", dur: 0.045, vol: 0.035, lp: 2600, verb:false }); },   // select: a click and a short flat beep
    untag(){ noise({ dur: 0.02, vol: 0.08, freq: 1800, q: 4 }); tone({ f: 620, type:"square", dur: 0.035, vol: 0.025, lp: 1800, verb:false }); },

    // Answers
    correct(i=0){   // sound board pick (round 7): two short flat confirm tones, the pair a step higher for each correct answer in a row
      const f = [440, 494, 523, 587, 659, 698, 784, 880, 988][Math.min(i, 8)];
      tone({ f, type:"triangle", dur: 0.08, vol: 0.07, lp: 1600, verb:false });
      tone({ f: f * 1.5, type:"triangle", at: 0.09, dur: 0.12, vol: 0.07, lp: 1600, verb:false });
    },
    wrong(){ noise({ dur: 0.06, vol: 0.24, type:"lowpass", freq: 500 }); tone({ f: 140, type:"square", dur: 0.22, vol: 0.06, lp: 700 }); },   // a flat low buzz

    // Big moments
    lock(){   // the "checkmate": a heavy clunk, then a soft low chord
      latch(0, 0.25);
      thunk(0.05, 0.5);
      [261.6, 329.6, 392.0].forEach((f, k) => tone({ f, type:"triangle", at: 0.12 + k*0.03, dur: 1.0, vol: 0.07, lp: 1100 }));
    },
    success(){   // stage complete: a motor, three bolts latch, the door thunks, air vents, power hums
      servo(0, 0.4);
      [0.32, 0.44, 0.56].forEach(at => latch(at));
      thunk(0.7);
      hiss(0.8);
      [110, 164.8, 220].forEach(f => tone({ f, type:"sawtooth", at: 0.85, dur: 1.3, vol: 0.035, lp: 700, attack: 0.25 }));
    },
    start(){   // start / accept mission: a switch throws, relays click in, a low power hum
      latch(0, 0.28); latch(0.07, 0.18); latch(0.12, 0.14);
      thunk(0.16, 0.35);
      [110, 164.8].forEach(f => tone({ f, type:"sawtooth", at: 0.2, dur: 0.9, vol: 0.035, lp: 600, attack: 0.15 }));
    },
    newlock(){ latch(0, 0.2); latch(0.08, 0.14); tone({ f: 110, type:"sawtooth", at: 0.1, dur: 0.45, vol: 0.05, lp: 500, attack: 0.08 }); },   // relays, then the lock powers up
    denied(){ tone({ f: 180, type:"square", dur: 0.16, vol: 0.06, lp: 900 }); tone({ f: 180, type:"square", at: 0.2, dur: 0.16, vol: 0.06, lp: 900 }); },   // two flat buzzes

    // Vault Grid and Blueprint
    laser(){ noise({ dur: 0.35, vol: 0.06, freq: 2600, q: 8 }); tone({ f: 190, type:"sawtooth", dur: 0.35, vol: 0.035, lp: 1200, attack: 0.03 }); },   // an electric hum, no zap
    fill(i=0){ tone({ f: 900 + (i % 3) * 40, type:"triangle", dur: 0.03, vol: 0.035, verb:false }); },   // a steady tick, not a rising scale
    seal(){ noise({ dur: 0.025, vol: 0.1, freq: 3000, q: 3 }); tone({ f: 1000, type:"triangle", dur: 0.04, vol: 0.05, verb:false }); },
    rise(){ noise({ dur: 1.0, vol: 0.14, type:"lowpass", freq: 500 }); tone({ f: 70, type:"sawtooth", dur: 1.0, vol: 0.06, lp: 300, attack: 0.3 }); },   // a low rumble
    pop(i=0){ noise({ dur: 0.02, vol: 0.1, freq: 2400, q: 3 }); tone({ f: 700, type:"triangle", dur: 0.035, vol: 0.04, verb:false }); },

    // Prime Hack
    cash(){ [0, 0.05, 0.1, 0.15].forEach(at => noise({ at, dur: 0.02, vol: 0.12, freq: 3500, q: 5 })); thunk(0.2, 0.2); },   // a counting machine
    ready(){ latch(0, 0.18); tone({ f: 880, type:"triangle", at: 0.04, dur: 0.1, vol: 0.06, verb:false }); },
    commit(){ noise({ dur: 0.06, vol: 0.3, type:"lowpass", freq: 600 }); tone({ f: 660, type:"triangle", at: 0.03, dur: 0.08, vol: 0.06, verb:false }); },
    alarm(){ [0, 0.25, 0.5, 0.75].forEach((at, k) => tone({ f: k % 2 ? 420 : 560, type:"sawtooth", at, dur: 0.22, vol: 0.07, lp: 1500 })); },
    chatter(){ noise({ dur: 0.012, vol: 0.03, type:"highpass", freq: 5000 }); },

    // Whole game
    glitch(){ noise({ dur: 0.22, vol: 0.16, freq: 2400, q: 0.6 }); noise({ at: 0.05, dur: 0.05, vol: 0.14, type:"highpass", freq: 3500 }); noise({ at: 0.12, dur: 0.08, vol: 0.1, type:"highpass", freq: 5000 }); },
    comms(){ noise({ dur: 0.03, vol: 0.2, type:"highpass", freq: 2500 }); noise({ at: 0.03, dur: 0.2, vol: 0.05, freq: 1800, q: 0.7 }); noise({ at: 0.22, dur: 0.02, vol: 0.12, type:"highpass", freq: 3000 }); },   // radio key-up click and crackle
    badge(){ latch(0, 0.2); latch(0.09, 0.2); thunk(0.14, 0.3); [196, 293.7, 392].forEach((f, k) => tone({ f, type:"triangle", at: 0.2 + k * 0.06, dur: 0.9, vol: 0.06, lp: 1200 })); },
    engine(){ tone({ f: 60, type:"sawtooth", dur: 0.9, vol: 0.06, lp: 400, attack: 0.08 }); noise({ dur: 0.9, vol: 0.05, type:"lowpass", freq: 300 }); },
    siren(){ [0, 0.3].forEach((at, k) => tone({ f: k ? 740 : 988, type:"triangle", at, dur: 0.28, vol: 0.04, lp: 2200 })); },   // flat two-tone, far away
    dock(){ servo(0, 0.25, 0.04); latch(0.22, 0.3); thunk(0.26, 0.45); hiss(0.34, 0.4, 0.04); },
    holo(){   // feedback: "a higher pitched beep, like a zoomed sound": a very quick rise, then a short high beep
      tone({ f: 700, to: 2200, type:"sine", dur: 0.07, vol: 0.035, verb:false });
      tone({ f: 2200, type:"square", at: 0.07, dur: 0.05, vol: 0.02, lp: 5000, verb:false });
      noise({ dur: 0.08, vol: 0.03, type:"highpass", freq: 5000 });
    },
    drone(sec=5){ tone({ f: 55, type:"sawtooth", dur: sec, vol: 0.04, lp: 260, attack: 0.4 }); tone({ f: 82.4, type:"sawtooth", dur: sec, vol: 0.025, lp: 380, attack: 0.8 }); },
    data(){ noise({ dur: 0.018, vol: 0.05, freq: 1500 + Math.random() * 3500, q: 6 }); },
    hum(i=0){ tone({ f: 110, type:"sawtooth", dur: 0.09, vol: 0.035, lp: 500 + i * 20, verb:false }); },   // fingerprint scanner: brighter, not higher
    // Round 6: a soft scanner pass (steady filtered air and a low flat hum), a quiet plotter tick, and a motor for the route
    scan(dur=3.6){ noise({ dur, vol: 0.035, freq: 1600, q: 0.8 }); tone({ f: 110, type:"sine", dur, vol: 0.05, lp: 400, attack: 0.3 }); },
    plot(){ noise({ dur: 0.018, vol: 0.035, freq: 2400, q: 3 }); },
    route(){ servo(0, 0.6, 0.035); },
    // Sound board picks (round 7)
    trickle(dur=1.4){ for(let i = 0; i < Math.round(dur * 11); i++) tone({ f: 1300 + Math.random() * 500, type:"square", at: Math.random() * dur, dur: 0.012, vol: 0.012, lp: 3000, verb:false }); },   // a room filling with power
    clamp(){ thunk(0, 0.35); hiss(0.05, 0.25, 0.03); },   // a room locking in
    verified(){ latch(0, 0.22); latch(0.1, 0.22); tone({ f: 330, type:"triangle", at: 0.14, dur: 0.3, vol: 0.07, lp: 1200 }); },
  };

  const THROTTLE = { data: 30, holo: 60, hum: 60, key: 15, fill: 28, chatter: 45, laser: 120, pop: 40, seal: 50, click: 30 };

  function play(name, arg){
    if(!settings.on || !SOUNDS[name]) return;
    const now = performance.now();
    if(THROTTLE[name] && last[name] && now - last[name] < THROTTLE[name]) return;
    last[name] = now;
    if(!ensure()) return;
    if(ctx.state === "suspended"){ ctx.resume().catch(()=>{}); }
    try{ SOUNDS[name](arg); }catch(e){}
  }

  // Browsers only allow sound after the student presses something on the page.
  // Pages that start with an animation wait for that press, so the sound isn't lost.
  function whenUnlocked(onNeedGesture){
    if(!settings.on || !ensure()) return Promise.resolve();
    if(ctx.state === "running") return Promise.resolve();
    return new Promise(resolve => {
      ctx.resume().then(() => { if(ctx.state === "running") resolve(); }).catch(()=>{});
      setTimeout(() => {
        if(ctx.state === "running"){ resolve(); return; }
        const hide = typeof onNeedGesture === "function" ? onNeedGesture() : null;
        const go = () => {
          ctx.resume().finally(() => {
            ["pointerdown","keydown"].forEach(ev => document.removeEventListener(ev, go, true));
            if(typeof hide === "function") hide();
            resolve();
          });
        };
        ["pointerdown","keydown"].forEach(ev => document.addEventListener(ev, go, true));
      }, 120);
    });
  }

  // Any press on any page wakes the audio, so later sounds play
  ["pointerdown","keydown"].forEach(ev => document.addEventListener(ev, () => { if(settings.on && ensure() && ctx.state === "suspended") ctx.resume().catch(()=>{}); }, true));

  window.PNSound = {
    play,
    whenUnlocked,
    list: () => Object.keys(SOUNDS),
    isOn: () => settings.on,
    setOn(v){ settings.on = !!v; save(); },
    getVolume: () => settings.volume,
    setVolume(v){ settings.volume = Math.max(0, Math.min(1, v)); save(); if(master) master.gain.value = settings.volume; },
  };
})();
