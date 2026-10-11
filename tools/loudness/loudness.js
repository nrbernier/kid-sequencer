/* Loudness check for Rhythm Runners.
   Renders the same reference pattern in every world with Tone.Offline (no
   real-time jitter), then measures it with ITU-R BS.1770 K-weighting and
   gating (the method behind LUFS). Also measures through a "tablet speaker"
   high-pass, since kids mostly hear the game on a tablet or phone.
   Open tools/loudness/index.html after `npm run loudness:build`. */
import * as Tone from "tone";
import { createEngine, playItem } from "../../src/audioEngine.js";
import { THEMES } from "../../src/RhythmRunners.jsx";

const SR = 48000;
const BPM = 104;
const BARS = 4;
// (lane index, palette item index, steps): identical shape in every world
const PATTERN = [
  [0, 0, [0, 4, 8, 12]], [0, 1, [6, 14]],
  [1, 0, [2, 10]], [1, 1, [3, 7, 11, 15]],
  [2, 0, [0]], [2, 2, [3]], [2, 3, [6]], [2, 4, [10]], [2, 1, [13]],
  [3, 2, [0]], [3, 3, [8]], [3, 0, [4]], [3, 1, [12]],
];

/* ---- biquad helpers ---- */
function biquad(x, [b0, b1, b2, a1, a2]) {
  const y = new Float32Array(x.length);
  let x1 = 0, x2 = 0, y1 = 0, y2 = 0;
  for (let i = 0; i < x.length; i++) {
    const v = b0 * x[i] + b1 * x1 + b2 * x2 - a1 * y1 - a2 * y2;
    x2 = x1; x1 = x[i]; y2 = y1; y1 = v; y[i] = v;
  }
  return y;
}
// BS.1770 K-weighting coefficients at 48 kHz
const K_SHELF = [1.53512485958697, -2.69169618940638, 1.19839281085285, -1.69065929318241, 0.73248077421585];
const K_HP = [1.0, -2.0, 1.0, -1.99004745483398, 0.99007225036621];
function highpass(f, q = 0.7071) { // RBJ cookbook
  const w = (2 * Math.PI * f) / SR, c = Math.cos(w), a = Math.sin(w) / (2 * q), a0 = 1 + a;
  return [(1 + c) / 2 / a0, -(1 + c) / a0, (1 + c) / 2 / a0, (-2 * c) / a0, (1 - a) / a0];
}

/* ---- gated integrated loudness (BS.1770-4) ---- */
function loudness(channels, speakerHz = 0) {
  const k = channels.map((ch) => {
    let x = ch;
    if (speakerHz) x = biquad(biquad(x, highpass(speakerHz)), highpass(speakerHz)); // 24 dB/oct roll-off
    return biquad(biquad(x, K_SHELF), K_HP);
  });
  const block = Math.round(0.4 * SR), hop = Math.round(0.1 * SR);
  const ms = [];
  for (let s = 0; s + block <= k[0].length; s += hop) {
    let sum = 0;
    for (const ch of k) for (let i = s; i < s + block; i++) sum += ch[i] * ch[i];
    ms.push(sum / block);
  }
  const L = (z) => -0.691 + 10 * Math.log10(z + 1e-20);
  const abs = ms.filter((z) => L(z) > -70);
  const rel = L(abs.reduce((a, b) => a + b, 0) / abs.length) - 10;
  const gated = abs.filter((z) => L(z) > rel);
  const momentary = ms.map(L).sort((a, b) => a - b);
  return {
    integrated: L(gated.reduce((a, b) => a + b, 0) / gated.length),
    loud10: momentary[Math.floor(momentary.length * 0.9)],
  };
}

async function renderWorld(th, trims) {
  const step = 60 / BPM / 4;
  const dur = BARS * 16 * step + 3; // plus reverb tail
  const buf = await Tone.Offline(async ({ transport }) => {
    transport.bpm.value = BPM; // note lengths like "8n" follow the tempo
    const A = await createEngine(trims);
    const lanes = THEMES[th].lanes;
    for (let bar = 0; bar < BARS; bar++)
      for (const [lane, itemIdx, steps] of PATTERN) {
        const item = THEMES[th].items[lanes[lane].id][itemIdx];
        for (const s of steps) playItem(A, item, 0.05 + (bar * 16 + s) * step, th);
      }
  }, dur, 2, SR);
  return [buf.getChannelData(0), buf.getChannelData(1)];
}

export async function measure(trims) {
  const out = {};
  for (const th of Object.keys(THEMES)) {
    const ch = await renderWorld(th, trims);
    out[th] = { full: loudness(ch), tablet: loudness(ch, 250) };
  }
  return out;
}
window.measure = measure;
window.ready = true;
