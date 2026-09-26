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

  const LADDER = [523.3, 587.3, 659.3, 784.0, 880.0, 1046.5, 1174.7, 1318.5, 1568.0];   // pentatonic, rising

  const SOUNDS = {
    // Interface
    click(){ tone({ f: 2100, type:"triangle", dur: 0.03, vol: 0.07, verb:false }); noise({ dur: 0.015, vol: 0.04, type:"highpass", freq: 4000 }); },
    key(){ tone({ f: 1300 + Math.random()*400, type:"square", dur: 0.014, vol: 0.02, lp: 3200, verb:false }); },
    tag(){ tone({ f: 620, to: 930, dur: 0.09, vol: 0.2 }); tone({ f: 1240, to: 1860, dur: 0.06, vol: 0.04, type:"triangle" }); },
    untag(){ tone({ f: 800, to: 480, dur: 0.08, vol: 0.14 }); },

    // Answers
    correct(i=0){   // a wooden knock and a bell that climbs with each correct answer
      noise({ dur: 0.045, vol: 0.32, freq: 900, q: 1.5 });
      bell(LADDER[Math.min(i, LADDER.length-1)], 0.012, 0.2, 0.6);
    },
    wrong(){
      noise({ dur: 0.07, vol: 0.28, type:"lowpass", freq: 500 });
      tone({ f: 196, to: 130, dur: 0.16, vol: 0.28 });
      tone({ f: 150, to: 98, at: 0.11, dur: 0.18, vol: 0.24 });
    },

    // Big moments
    lock(){   // the "checkmate": a heavy clunk, then a chord that blooms
      tone({ f: 110, to: 52, dur: 0.28, vol: 0.5 });
      noise({ dur: 0.09, vol: 0.4, type:"lowpass", freq: 700 });
      [523.3, 659.3, 784.0, 1046.5].forEach((f, k) => tone({ f, type:"triangle", at: 0.06 + k*0.035, dur: 1.1, vol: 0.12 }));
      tone({ f: 2093, at: 0.22, dur: 0.35, vol: 0.05 });
    },
    success(){   // stage complete: clunk, rising arpeggio, held chord
      tone({ f: 98, to: 49, dur: 0.35, vol: 0.5 });
      noise({ dur: 0.1, vol: 0.35, type:"lowpass", freq: 600 });
      [523.3, 659.3, 784.0, 1046.5, 1318.5].forEach((f, k) => bell(f, 0.05 + k*0.075, 0.15, 0.9));
      [261.6, 329.6, 392.0].forEach(f => tone({ f, type:"triangle", at: 0.42, dur: 1.4, vol: 0.09 }));
    },
    start(){   // start mission
      tone({ f: 180, to: 720, type:"sawtooth", dur: 0.35, vol: 0.06, lp: 1800 });
      [392.0, 523.3, 784.0].forEach((f, k) => bell(f, 0.28 + k*0.08, 0.14, 0.7));
    },
    newlock(){   // a new lock comes online
      tone({ f: 110, to: 220, type:"sawtooth", dur: 0.4, vol: 0.07, lp: 500 });
      tone({ f: 660, at: 0.05, dur: 0.08, vol: 0.16 });
      tone({ f: 990, at: 0.15, dur: 0.12, vol: 0.16 });
    },
    denied(){
      tone({ f: 330, to: 220, type:"triangle", dur: 0.25, vol: 0.18 });
      tone({ f: 262, to: 175, type:"triangle", at: 0.15, dur: 0.3, vol: 0.16 });
    },

    // Vault Grid and Blueprint
    laser(){ tone({ f: 220, to: 1400, type:"sawtooth", dur: 0.45, vol: 0.05, lp: 1800 }); tone({ f: 1800, at: 0.4, dur: 0.12, vol: 0.035 }); },
    fill(i=0){ tone({ f: Math.min(1700, 300 * Math.pow(2, i/24)), dur: 0.05, vol: 0.06, verb:false }); },
    seal(){ tone({ f: 1200, type:"triangle", dur: 0.07, vol: 0.1 }); noise({ dur: 0.02, vol: 0.06, type:"highpass", freq: 3000 }); },
    rise(){ noise({ dur: 1.0, vol: 0.16, freq: 200, to: 1400, q: 0.8 }); tone({ f: 70, to: 150, dur: 1.0, vol: 0.22 }); },
    pop(i=0){ tone({ f: 420 + i*40, to: 640 + i*40, dur: 0.07, vol: 0.12 }); },

    // Prime Hack
    cash(){ tone({ f: 1568, type:"triangle", dur: 0.08, vol: 0.14 }); tone({ f: 2093, type:"triangle", at: 0.07, dur: 0.4, vol: 0.14 }); },
    ready(){ tone({ f: 1320, dur: 0.07, vol: 0.14 }); tone({ f: 1760, at: 0.07, dur: 0.12, vol: 0.14 }); },
    commit(){ noise({ dur: 0.06, vol: 0.3, type:"lowpass", freq: 600 }); tone({ f: 880, at: 0.03, dur: 0.12, vol: 0.14 }); },
    alarm(){ [0, 0.25, 0.5, 0.75].forEach((at, k) => tone({ f: k % 2 ? 420 : 560, type:"sawtooth", at, dur: 0.22, vol: 0.08, lp: 1500 })); },
    chatter(){ noise({ dur: 0.012, vol: 0.03, type:"highpass", freq: 5000 }); },

    // Whole game
    glitch(){   // stage change: a burst of static and a falling blip
      noise({ dur: 0.22, vol: 0.2, freq: 2400, to: 300, q: 0.6 });
      noise({ at: 0.05, dur: 0.05, vol: 0.18, type:"highpass", freq: 3500 });
      tone({ f: 1400, to: 90, type:"square", dur: 0.2, vol: 0.05, lp: 2400, verb:false });
    },
    comms(){   // the handler's radio opens: a click, crackle, two soft pips
      noise({ dur: 0.03, vol: 0.2, type:"highpass", freq: 2500 });
      noise({ at: 0.03, dur: 0.18, vol: 0.05, freq: 1800, q: 0.7 });
      tone({ f: 1760, at: 0.08, dur: 0.06, vol: 0.07, verb:false });
      tone({ f: 2349, at: 0.16, dur: 0.08, vol: 0.07, verb:false });
    },
    hum(i=0){ tone({ f: 110 + i*6, type:"sawtooth", dur: 0.09, vol: 0.035, lp: 700, verb:false }); },   // fingerprint scanner
    verified(){ tone({ f: 988, dur: 0.1, vol: 0.14 }); tone({ f: 1319, at: 0.1, dur: 0.1, vol: 0.14 }); tone({ f: 1976, at: 0.2, dur: 0.35, vol: 0.12 }); },
  };

  const THROTTLE = { hum: 60, key: 15, fill: 28, chatter: 45, laser: 120, pop: 40, seal: 50, click: 30 };

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
