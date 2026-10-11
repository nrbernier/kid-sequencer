import React from "react";

/* ============================================================
   PIXEL ART — every character, object and icon is a tiny grid.
   One letter = one pixel; "." is transparent. Each sprite has
   its own palette. All sprites sit on a shared 12×12 canvas so
   pixels are the same size everywhere on screen.
   Recolorable sprites use m (main), d (dark), l (light).
   ============================================================ */

const INK = "#1b1d2e"; // outline colour, shared by everything

/* lighten (amt > 0) or darken (amt < 0) a hex colour */
const shade = (hex, amt) => {
  const n = parseInt(hex.slice(1), 16);
  const f = (v) => Math.round(amt < 0 ? v * (1 + amt) : v + (255 - v) * amt);
  return "#" + [n >> 16, (n >> 8) & 255, n & 255].map((v) => f(v).toString(16).padStart(2, "0")).join("");
};
const tones = (c) => ({ m: c, d: shade(c, -0.32), l: shade(c, 0.5) });

export function Sprite({ grid, pal, canvas = 12 }) {
  const h = grid.length;
  const w = Math.max(...grid.map((r) => r.length));
  const S = Math.max(canvas, w, h);
  const ox = Math.floor((S - w) / 2);
  const oy = Math.floor((S - h) / 2);
  const rects = [];
  grid.forEach((row, y) => {
    // merge horizontal runs of the same colour into one rect
    let x = 0;
    while (x < row.length) {
      const c = row[x];
      let run = 1;
      while (x + run < row.length && row[x + run] === c) run++;
      const fill = c === "k" && !pal.k ? INK : pal[c];
      if (c !== "." && fill)
        rects.push(<rect key={`${x}-${y}`} x={x + ox} y={y + oy} width={run + 0.04} height={1.04} fill={fill} />);
      x += run;
    }
  });
  return (
    <svg viewBox={`0 0 ${S} ${S}`} width="100%" height="100%" shapeRendering="crispEdges" style={{ display: "block" }}>
      {rects}
    </svg>
  );
}

/* ======================= grids ======================= */
export const G = {
  /* ---------- reef ---------- */
  crab: [
    ".kk......kk.",
    "krrk....krrk",
    "kr.kk..kk.rk",
    ".krrk..krrk.",
    "..kkkkkkkk..",
    ".krwkrrkwrk.",
    "krrrrrrrrrrk",
    "krrlrrrrlrrk",
    ".kkrrrrrrkk.",
    "k.k.kkkk.k.k",
  ],
  puffer: [
    "....k..k....",
    "..kkkkkkk...",
    ".kyyyyyyyk.k",
    "kyyyyyywwyk.",
    "kyyyyyywkyyk",
    "kyyyyyyyyyok",
    "kydyyyyyyyk.",
    ".kdddyyyyyk.",
    "..kkkkkkkk.k",
    "...k..k.....",
  ],
  fish: [
    "...kkkkkk...",
    "k.koowooook.",
    "kokoowoowkok",
    "kooowwoooook",
    "kokoowoooook",
    "k.koowoooak.",
    "...kkkkkk...",
  ],
  turtle: [
    "..kkkkk.....",
    ".kgGgGgk.kk.",
    "kgGgGgGgkssk",
    "kGgGgGgGksek",
    "kkkkkkkkkssk",
    ".ks.ks.ksk..",
    ".kk.kk.kk...",
  ],
  rock: [
    "...kkkkk....",
    "..kllrrrkk..",
    ".klrrrrrrrk.",
    "krrrrrrdrrrk",
    "krrdrrrrrrdk",
    "kdrrrrrrrddk",
    ".kddddddddk.",
    "..kkkkkkkk..",
  ],
  coral: [
    ".k...k...k.",
    "kck.kck.kck",
    "kck.kck.kck",
    "kcckkck.kck",
    ".kcccckkcck",
    "..kkcccccck",
    "....kcckkk.",
    "....kcck...",
    "....kcck...",
    "...kkcckk..",
  ],
  bubble: [
    "...kkkk...",
    ".kkbbbbkk.",
    ".kwwbbbbk.",
    "kwwbbbbbbk",
    "kwbbbbbbbk",
    "kbbbbbbbbk",
    "kbbbbbbbdk",
    ".kbbbbbdk.",
    ".kkbbddkk.",
    "...kkkk...",
  ],
  urchin: [
    "k....k....k",
    ".k...k...k.",
    "..kkpppkk..",
    "..kpllpppk.",
    "kkpllppppkk",
    "..kpppppdk.",
    "..kkpppdkk.",
    ".k...k...k.",
    "k....k....k",
  ],
  shell: [
    "..kkkkkk..",
    ".kmlmmlmk.",
    "kmmlmmlmmk",
    "kmmlmmlmmk",
    "kmmlmmlmmk",
    ".kmlmmlmk.",
    "..kmllmk..",
    ".kkddddkk.",
    ".kddkkddk.",
  ],
  starfish: [
    ".....k.....",
    "....kmk....",
    "...kmmmk...",
    "kkkkmlmkkkk",
    "kmmmmmmmmmk",
    ".kmmmlmmmk.",
    "..kmmmmmk..",
    ".kmmmkmmmk.",
    ".kmmk.kmmk.",
    "kmmk...kmmk",
    "kkk.....kkk",
  ],

  /* ---------- jungle ---------- */
  gorilla: [
    "...kkkkkk...",
    "..kbbbbbbk..",
    ".kbffffffbk.",
    ".kfwkffkwfk.",
    ".kbfffffffbk",
    "..kbfkkfbk..",
    ".kbbbffbbbk.",
    "kbbbbbbbbbbk",
    "kbfkbbbbkfbk",
    "kffkbbbbkffk",
    ".kk.kbbk.kk.",
    "....kkkk....",
  ],
  parrot: [
    "...kkkk...",
    "..krrrrk..",
    ".krrrwekk.",
    ".krrrrknnk",
    ".krrrrrknk",
    "kyrrrrrrk.",
    "kyyrrrrrk.",
    "kuyyrrrk..",
    "kuuyyrrk..",
    ".kuuuuk...",
    "..kuuk....",
    "...kk.....",
  ],
  monkey: [
    "...kkkkkk...",
    "..kbbbbbbk..",
    "kkbttttttbkk",
    "ktbtkttktbtk",
    "kkbttttttbkk",
    "..kttkkttk..",
    "...kbttbk...",
    "..kbbttbbk..",
    ".kbbbttbbbk.",
    ".kbkbbbbkbk.",
    ".kk.kbbk.kk.",
    "....kk.kk...",
  ],
  sloth: [
    "...kkkkkk...",
    "..kggggggk..",
    ".kgffffffgk.",
    "kgfmmffmmfgk",
    "kgfmkffkmfgk",
    "kgffffffffgk",
    ".kgffkkffgk.",
    "..kggggggk..",
    ".kggggggggk.",
    ".kk.k..k.kk.",
  ],
  log: [
    ".kkkkkkkkkk.",
    "kwwwwwwwkrrk",
    "kwddwwdwkrdk",
    "kwwwwwwwkrrk",
    "kwwwddwwkrrk",
    ".kkkkkkkkkk.",
  ],
  drum: [
    ".kkkkkkkk.",
    "kssssssssk",
    "kkkkkkkkkk",
    ".kooddook.",
    ".kodoodok.",
    "..kdoodk..",
    "..koddok..",
    "..kodook..",
    "..kkkkkk..",
  ],
  coconut: [
    "...kkkk...",
    ".kkcccckk.",
    ".kldcdcck.",
    "kllcccccck",
    "klccccdcck",
    "kcccccccck",
    "kcccccccdk",
    ".kccccddk.",
    ".kkcdddkk.",
    "...kkkk...",
  ],
  pod: [
    "...kk...",
    "..kggk..",
    ".kgldgk.",
    ".kglggk.",
    "kgggdggk",
    "kglgggdk",
    "kggdgggk",
    "kglggdgk",
    ".kgdggk.",
    ".kgggdk.",
    "..kggk..",
    "...kk...",
  ],
  fruit: [
    ".....kkk..",
    "....kkggk.",
    "..kkkmkk..",
    ".kmlmmmmk.",
    "kmllmmmmmk",
    "kmlmmmmmmk",
    "kmmmmmmmmk",
    "kmmmmmmmdk",
    ".kmmmmmdk.",
    ".kkddddkk.",
    "...kkkk...",
  ],
  flower: [
    "....kkk....",
    "...kmlmk...",
    ".kkkmmmkkk.",
    "kmmmkkkmmmk",
    "kmlkyyykmlk",
    "kmmkyyykmmk",
    "kmmmkkkmmmk",
    ".kkkmmmkkk.",
    "...kmmmk...",
    "....kkk....",
  ],

  /* ---------- space ---------- */
  rocket: [
    "..kkk.......",
    ".krrkkkkkk..",
    "kfkwwwwwwkk.",
    "ffkwwbbwwwrk",
    "ffkwwbbwwwrk",
    "kfkwwwwwwkk.",
    ".krrkkkkkk..",
    "..kkk.......",
  ],
  alien: [
    "..k....k..",
    "...k..k...",
    "..kkkkkk..",
    ".kggggggk.",
    "kgwkggwkgk",
    "kgkkggkkgk",
    ".kggggggk.",
    "..kgkkgk..",
    "..kggggk..",
    ".kgkggkgk.",
    ".kk.kk.kk.",
  ],
  ufo: [
    "....kkkk....",
    "...kbbwbk...",
    "..kbbbbbbk..",
    ".kkkkkkkkkk.",
    "kmmymmymmymk",
    ".kkkkkkkkkk.",
    "....kkkk....",
  ],
  robot: [
    ".....r.....",
    ".....k.....",
    ".kkkkkkkkk.",
    ".kmmmmmmmk.",
    ".kmbbmbbmk.",
    ".kmmkkkmmk.",
    ".kkkkkkkkk.",
    "kmkbbbbbkmk",
    "kmkbrbybkmk",
    "kkkbbbbbkkk",
    "..kkkkkkk..",
    "..kk...kk..",
  ],
  satellite: [
    ".....kk.....",
    "kkkk.kk.kkkk",
    "kbbkkmmkkbbk",
    "kbbkmmrmkbbk",
    "kbbkkmmkkbbk",
    "kkkk.kk.kkkk",
  ],
  laser: [
    "....kkkk",
    "...kyyok",
    "..kyyok.",
    ".kyyok..",
    "kyyyykkk",
    "kkkyyyyk",
    "..kyyok.",
    ".kyyok..",
    "kyyok...",
    "kkk.....",
  ],
  sparkle: [
    "....k....",
    "...kbk...",
    "...kwk...",
    "kkkbwbkkk",
    "kbwwwwwbk",
    "kkkbwbkkk",
    "...kwk...",
    "...kbk...",
    "....k....",
  ],
  planet: [
    "....kkkk....",
    "..kkmlmmkk..",
    ".kmllmmmmmk.",
    ".kmlmmmmmmk.",
    "rrrrrrrrrrrr",
    ".kmmmmmmmdk.",
    "..kkmmmdkk..",
    "....kkkk....",
  ],
  comet: [
    "..........kk",
    "........kktk",
    "......kkttk.",
    "..kkkkkttk..",
    ".kmlmmktk...",
    "kmllmmmkk...",
    "kmlmmmmmk...",
    "kmmmmmmdk...",
    ".kmmmmdk....",
    "..kkkkk.....",
  ],

  /* ---------- city ---------- */
  worker: [
    "..kkkkkk..",
    ".khhhhhhk.",
    "kkkkkkkkkk",
    ".kssssssk.",
    ".kskssksk.",
    ".kssssssk.",
    "..kkkkkk..",
    ".kooyoook.",
    "kooooyoook",
    "ksoooooosk",
    ".kbbkkbbk.",
    ".kkk..kkk.",
  ],
  runner: [
    "...kkkk...",
    "..khhhhk..",
    "..khsssk..",
    "..ksskssk.",
    "...kssk...",
    "..kpppppk.",
    ".kspppppsk",
    "..kpppppk.",
    "..kbbbbbk.",
    ".ksk..ksk.",
    "ksk....ksk",
    "kk......kk",
  ],
  cyclist: [
    "......kkk...",
    ".....kuuuk..",
    ".....kssk...",
    "....kgggk...",
    "...kgggggkk.",
    "....kgggk.k.",
    "....kbbk..k.",
    ".kkk.kbk.kkk",
    "k...kkkkk..k",
    "k...k..k...k",
    ".kkk....kkk.",
  ],
  dancer: [
    "k...kkk...k",
    "sk.khhhk.ks",
    ".skkssskks.",
    "..ksksksk..",
    "...kvvvk...",
    "..kvvvvvk..",
    "..kvvyvvk..",
    "...kbbbk...",
    "..kbk.kbk..",
    ".kbk...kbk.",
    ".kk.....kk.",
  ],
  anvil: [
    "kkkkkkkkkkk.",
    "kllllllllmk.",
    ".kkmmmmmmmk.",
    "...kmmmmk...",
    "...kmmdmk...",
    "..kmmmmddk..",
    ".kkkkkkkkkk.",
  ],
  barrel: [
    ".kkkkkkkk.",
    "kllluuuuuk",
    "kkkkkkkkkk",
    "kluuuuuudk",
    "kluuuuuudk",
    "kddddddddk",
    "kluuuuuudk",
    "kluuuuuudk",
    "kddddddddk",
    "kluuuuuudk",
    ".kkkkkkkk.",
  ],
  lid: [
    ".....kk.....",
    "....kddk....",
    "..kkkkkkkk..",
    ".kllllmmmmk.",
    "kmmmmmmmmmdk",
    ".kkkkkkkkkk.",
  ],
  hydrant: [
    "...kkkk...",
    "..krrrrk..",
    ".kkkkkkkk.",
    "..krlrrk..",
    "kkkrlrrkkk",
    "krkrlrrkrk",
    "kkkrlrrkkk",
    "..krlrrk..",
    "..krlrdk..",
    ".kkkkkkkk.",
    ".kddddddk.",
    ".kkkkkkkk.",
  ],
  sign: [
    "..kkkk..",
    ".kwwwwk.",
    "kwmmmmwk",
    "kwmlmmwk",
    "kwmmmmwk",
    ".kwwwwk.",
    "..kkkk..",
    "...kpk..",
    "...kpk..",
    "...kpk..",
    "..kkkkk.",
  ],
  vinyl: [
    "...kkkk...",
    ".kkddddkk.",
    ".kgddddgk.",
    "kgddmmddgk",
    "kdmmkkmmdk",
    "kdmmkkmmdk",
    "kgddmmddgk",
    ".kgddddgk.",
    ".kkddddkk.",
    "...kkkk...",
  ],
  boombox: [
    "...kkkkkk...",
    "..k......k..",
    "kkkkkkkkkkkk",
    "kmmmmmmmmmmk",
    "kmkkkmmkkkmk",
    "kmkdkmmkdkmk",
    "kmkkkmmkkkmk",
    "kmmmmmmmmmmk",
    "kkkkkkkkkkkk",
  ],

  /* ---------- UI icons (single colour "x") ---------- */
  play: ["x.......", "xxx.....", "xxxxx...", "xxxxxxx.", "xxxxxxx.", "xxxxx...", "xxx.....", "x......."],
  pause: ["xx..xx", "xx..xx", "xx..xx", "xx..xx", "xx..xx", "xx..xx", "xx..xx"],
  full: ["xxx...xxx", "x.......x", "x.......x", ".........", ".........", ".........", "x.......x", "x.......x", "xxx...xxx"],
  unfull: ["..x...x..", "..x...x..", "xxx...xxx", ".........", ".........", ".........", "xxx...xxx", "..x...x..", "..x...x.."],
  eraser: [".kkkkkkkk.", "kppppbbbbk", "kppppbbbbk", "kddddeeeek", ".kkkkkkkk."],
  trash: ["...kk...", "kkkkkkkk", "kllllllk", "kkkkkkkk", ".kmmmmk.", ".kmdmdk.", ".kmdmdk.", ".kmdmdk.", ".kmmmmk.", "..kkkk.."],
};

/* tempo icons: 1, 2 or 3 pixel chevrons */
const CHEV = ["x...", "xx..", ".xx.", "..xx", ".xx.", "xx..", "x..."];
G.speed1 = CHEV;
G.speed2 = CHEV.map((r) => r + "." + r);
G.speed3 = CHEV.map((r) => r + "." + r + "." + r);

/* ======================= palettes ======================= */
const P = {
  crab: { r: "#ff6b5b", l: "#ffb09f", w: "#ffffff" },
  puffer: { y: "#ffd166", d: "#e0a63a", w: "#ffffff", o: "#ff8a5c" },
  fish: { o: "#ff8c3a", w: "#ffffff", a: "#c4561a" },
  turtle: { g: "#5fbf6a", G: "#2f7d44", s: "#b6e88a", e: INK },
  gorilla: { b: "#4a4054", f: "#9a8a9e", w: "#ffffff" },
  parrot: { r: "#ff4d5e", y: "#ffd23f", u: "#3fa8ff", w: "#ffffff", e: INK, n: "#3a3a46" },
  monkey: { b: "#a0612e", t: "#f2c69a" },
  sloth: { g: "#9c8a72", f: "#efe0c2", m: "#5a4a3a" },
  rocket: { r: "#ff4d5e", w: "#eef2f8", b: "#3fa8ff", f: "#ffb020" },
  alien: { g: "#6ee77a", w: "#ffffff" },
  ufo: { b: "#8fd7ff", w: "#ffffff", m: "#b6bccb", y: "#ffe14d" },
  robot: { m: "#b6bccb", b: "#3fa8ff", r: "#ff4d5e", y: "#ffe14d" },
  worker: { h: "#ffcc22", s: "#f2c69a", o: "#ff8a1f", y: "#fff27a", b: "#3d6bd6" },
  runner: { h: "#3a2a22", s: "#f2c69a", p: "#ff5d7a", b: "#3d3f55" },
  cyclist: { u: "#3fa8ff", s: "#f2c69a", g: "#52c46b", b: "#3d3f55" },
  dancer: { h: "#3a2a22", s: "#c98f62", v: "#a46bff", y: "#ffe14d", b: "#3d3f55" },
};

/* ======================= characters ======================= */
const CHAR_GRID = {
  crab: "crab", puffer: "puffer", fish: "fish", turtle: "turtle",
  gorilla: "gorilla", parrot: "parrot", monkey: "monkey", sloth: "sloth",
  rocket: "rocket", alien: "alien", ufo: "ufo", robot: "robot",
  worker: "worker", runner: "runner", cyclist: "cyclist", dancer: "dancer",
};
export const CharSprite = ({ id }) => <Sprite grid={G[CHAR_GRID[id]]} pal={P[id]} />;

/* world buttons use one character from each world */
export const WORLD_ICON = { aqua: "fish", jungle: "parrot", space: "alien", city: "worker" };

/* ======================= objects (same names as before) ======================= */
export const Rock = () => <Sprite grid={G.rock} pal={{ r: "#8d7b8e", d: "#5f5062", l: "#b9a8ba" }} />;
export const Coral = () => <Sprite grid={G.coral} pal={{ c: "#ff8a6b" }} />;
export const Bubble = () => <Sprite grid={G.bubble} pal={{ k: "#2a6b9a", b: "#bfe9ff", w: "#ffffff", d: "#86c6ea" }} />;
export const Urchin = () => <Sprite grid={G.urchin} pal={{ k: "#3a3768", p: "#7a76b8", l: "#a9a5e0", d: "#56529a" }} />;
export const Shell = ({ color }) => <Sprite grid={G.shell} pal={tones(color)} />;
export const Starfish = ({ color }) => <Sprite grid={G.starfish} pal={tones(color)} />;

export const Log = () => <Sprite grid={G.log} pal={{ w: "#a8693a", d: "#7a4a24", r: "#e0b07a" }} />;
export const Drum = () => <Sprite grid={G.drum} pal={{ s: "#f3e0c0", o: "#d77a3f", d: "#9a4f22" }} />;
export const Coconut = () => <Sprite grid={G.coconut} pal={{ c: "#7a4f2a", d: "#4a2e15", l: "#a87a4f" }} />;
export const SeedPod = () => <Sprite grid={G.pod} pal={{ g: "#a9c15a", d: "#6d8430", l: "#d6e88a" }} />;
export const Fruit = ({ color }) => <Sprite grid={G.fruit} pal={{ ...tones(color), g: "#5fbf3a" }} />;
export const Flower = ({ color }) => <Sprite grid={G.flower} pal={{ ...tones(color), y: "#ffe14d" }} />;

export const Asteroid = () => <Sprite grid={G.rock} pal={{ r: "#9aa3b2", d: "#5f6878", l: "#c9d0dc" }} />;
export const Satellite = () => <Sprite grid={G.satellite} pal={{ b: "#3d6bd6", m: "#cfd6e4", r: "#ff4d5e" }} />;
export const Laser = () => <Sprite grid={G.laser} pal={{ y: "#ffe14d", o: "#ff9f1a", k: "#a35a00" }} />;
export const Sparkle = () => <Sprite grid={G.sparkle} pal={{ k: "#3a5a9a", b: "#8fd7ff", w: "#ffffff" }} />;
export const Planet = ({ color }) => <Sprite grid={G.planet} pal={{ ...tones(color), r: "#f2f5fa" }} />;
export const StarIcon = ({ color }) => <Sprite grid={G.starfish} pal={tones(color)} />;
export const Comet = ({ color }) => <Sprite grid={G.comet} pal={{ ...tones(color), t: "#e8f4ff" }} />;

export const Anvil = () => <Sprite grid={G.anvil} pal={{ m: "#7c8494", l: "#b6bccb", d: "#4f5563" }} />;
export const Barrel = () => <Sprite grid={G.barrel} pal={{ u: "#4d7cc9", d: "#2f4f8a", l: "#8fb4ee" }} />;
export const Lid = () => <Sprite grid={G.lid} pal={{ m: "#9aa3b2", l: "#d4d9e2", d: "#5f6878" }} />;
export const Hydrant = () => <Sprite grid={G.hydrant} pal={{ r: "#e94f4f", l: "#ff9a9a", d: "#9a2a2a" }} />;
export const Sign = ({ color }) => <Sprite grid={G.sign} pal={{ ...tones(color), w: "#f2f5fa", p: "#8d949f" }} />;
export const Vinyl = ({ color }) => <Sprite grid={G.vinyl} pal={{ m: color, d: "#2a2c38", g: "#4a4d5e" }} />;
export const Boombox = ({ color }) => <Sprite grid={G.boombox} pal={{ ...tones(color), d: "#8d949f" }} />;

/* ======================= UI icons ======================= */
export const Icon = ({ name, color = "currentColor" }) => (
  <Sprite grid={G[name]} pal={{ x: color }} canvas={9} />
);
export const EraserIcon = () => <Sprite grid={G.eraser} pal={{ p: "#ff8fb0", b: "#5bb8ff", d: "#c45a7a", e: "#2f7fc4" }} canvas={10} />;
export const TrashIcon = () => <Sprite grid={G.trash} pal={{ l: "#d4d9e2", m: "#9aa3b2", d: "#5f6878" }} canvas={10} />;
