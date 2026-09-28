/* PRIMENET read-aloud. Uses the browser's own speech (Web Speech API), so it works offline with no audio files.
   On only when the pupil ticks "Read aloud" in Settings (Primenet prefs, per codename). PNVoice.speak(text) reads a
   line, turning the maths into words first (3 × 3 = 9 → "three times three equals nine", 3³ → "three cubed"). */
(function(){
  "use strict";
  const synth = window.speechSynthesis;
  let voice = null;
  function pickVoice(){
    if(!synth) return null;
    const vs = synth.getVoices();
    return vs.find(v => /en-GB/i.test(v.lang) && /female|libby|sonia|serena|kate|hazel/i.test(v.name)) || vs.find(v => /en-GB/i.test(v.lang)) || vs.find(v => /^en/i.test(v.lang)) || vs[0] || null;
  }
  if(synth){ voice = pickVoice(); synth.addEventListener && synth.addEventListener("voiceschanged", () => { voice = pickVoice(); }); }

  const ONES = ["zero","one","two","three","four","five","six","seven","eight","nine","ten","eleven","twelve","thirteen","fourteen","fifteen","sixteen","seventeen","eighteen","nineteen"];
  const TENS = ["","","twenty","thirty","forty","fifty","sixty","seventy","eighty","ninety"];
  function words(n){
    n = Math.floor(n);
    if(n < 0) return "minus " + words(-n);
    if(n < 20) return ONES[n];
    if(n < 100) return TENS[Math.floor(n / 10)] + (n % 10 ? "-" + ONES[n % 10] : "");
    if(n < 1000) return ONES[Math.floor(n / 100)] + " hundred" + (n % 100 ? " and " + words(n % 100) : "");
    if(n < 1e6) return words(Math.floor(n / 1000)) + " thousand" + (n % 1000 ? (n % 1000 < 100 ? " and " : " ") + words(n % 1000) : "");
    return words(Math.floor(n / 1e6)) + " million" + (n % 1e6 ? " " + words(n % 1e6) : "");
  }
  const SUP = { "⁰":0, "¹":1, "²":2, "³":3, "⁴":4, "⁵":5, "⁶":6, "⁷":7, "⁸":8, "⁹":9 };
  const power = (b, e) => e === 2 ? `${b} squared` : e === 3 ? `${b} cubed` : `${b} to the power ${e}`;
  // Maths and symbols into words a child would say
  function toSpeech(text){
    let t = String(text).replace(/<sup>(\d+)<\/sup>/g, "^$1").replace(/<[^>]+>/g, " ").replace(/&nbsp;/g, " ").replace(/&amp;/g, "and").replace(/\*/g, "");
    t = t.replace(/(\d+)([⁰¹²³⁴⁵⁶⁷⁸⁹]+)/g, (m, b, s) => power(b, +[...s].map(c => SUP[c]).join("")));
    t = t.replace(/(\d+)\s*\^\s*(\d+)/g, (m, b, e) => power(b, +e));
    t = t.replace(/£\s?([\d,]+)/g, (m, v) => `${v} pounds`);
    t = t.replace(/(\d),(\d{3})/g, "$1$2");
    t = t.replace(/\bL([123])\b/g, "level $1").replace(/\bN\s*=\s*/g, "N equals ");
    t = t.replace(/\s*×\s*/g, " times ").replace(/\s*÷\s*/g, " divided by ").replace(/\s*=\s*/g, " equals ").replace(/\s*\+\s*/g, " plus ").replace(/(\d)\s*−\s*(\d)/g, "$1 minus $2");
    t = t.replace(/\d+/g, d => words(+d));
    t = t.replace(/[▸⌂⤢⤡●✓✗›·…]/g, " ").replace(/\s+/g, " ").trim();
    return t;
  }
  const on = () => { try{ return !!(window.Primenet && Primenet.prefsFor && Primenet.prefsFor().voice); }catch(e){ return false; } };
  let last = "";
  function speak(text, { force = false, interrupt = true } = {}){
    if(!synth || (!on() && !force)) return;
    const say = toSpeech(text);
    if(!say || (say === last && synth.speaking)) return;
    last = say;
    if(interrupt) synth.cancel();
    const u = new SpeechSynthesisUtterance(say);
    if(voice) u.voice = voice;
    u.lang = (voice && voice.lang) || "en-GB"; u.rate = 0.95; u.pitch = 0.9;
    synth.speak(u);
  }
  function stop(){ if(synth) synth.cancel(); last = ""; }
  window.addEventListener("pagehide", stop);
  window.PNVoice = { speak, stop, on, toSpeech, words };
})();
