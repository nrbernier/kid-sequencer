import React, { useState, useRef, useEffect, useCallback } from "react";
import * as Tone from "tone";

/* ============================================================
   RHYTHM RUNNERS — music sequencing for kids
   4 characters race across an invisible 16-step grid.
   Objects placed on their paths shake & play when reached.
   Everything stays in C-major pentatonic. Three worlds,
   three very different soundscapes:
     🌊 dark, muted, long underwater tones
     🌴 bright, dry, woody hits (marimba / kalimba)
     🪐 pure square-wave bips, 8-bit chiptune vibes
   ============================================================ */

const STEPS = 16;
const THEME_ORDER = ["aqua", "jungle", "space", "city"];

/* ---------- SVG objects: aquatic ---------- */
const Shell = ({ color }) => (
  <svg viewBox="0 0 24 24" width="100%" height="100%">
    <path d="M12 21 C5 21 2.5 14 2.5 10.5 A9.5 9.5 0 0 1 21.5 10.5 C21.5 14 19 21 12 21 Z"
      fill={color} stroke="rgba(0,0,0,.25)" strokeWidth="1" />
    <path d="M12 21 L12 4 M12 21 L6 6.5 M12 21 L18 6.5" stroke="rgba(255,255,255,.55)" strokeWidth="1.4" fill="none" strokeLinecap="round"/>
  </svg>
);
const Starfish = ({ color }) => (
  <svg viewBox="0 0 24 24" width="100%" height="100%">
    <path d="M12 2 L14.6 8.6 L21.8 9.2 L16.4 13.9 L18 21 L12 17.2 L6 21 L7.6 13.9 L2.2 9.2 L9.4 8.6 Z"
      fill={color} stroke="rgba(0,0,0,.25)" strokeWidth="1.4" strokeLinejoin="round" />
    <circle cx="12" cy="11.6" r="1.6" fill="rgba(255,255,255,.6)" />
  </svg>
);
const Rock = () => (
  <svg viewBox="0 0 24 24" width="100%" height="100%">
    <path d="M4 18 C2 14 4 8 9 7 C12 4 19 6 20 10 C23 13 21 18 17 19 C13 21 6 21 4 18 Z"
      fill="#8d7b8e" stroke="rgba(0,0,0,.3)" strokeWidth="1" />
    <path d="M8 12 L11 14 M14 10 L16 12" stroke="rgba(255,255,255,.35)" strokeWidth="1.4" strokeLinecap="round" />
  </svg>
);
const Coral = () => (
  <svg viewBox="0 0 24 24" width="100%" height="100%">
    <path d="M12 21 V10 M12 13 C8 12 6 9 6 5 M12 11 C16 10 18 7 18 4 M12 17 C9 17 8 15 8 13"
      stroke="#ff9776" strokeWidth="3.4" fill="none" strokeLinecap="round" />
  </svg>
);
const Bubble = () => (
  <svg viewBox="0 0 24 24" width="100%" height="100%">
    <circle cx="12" cy="12" r="8.5" fill="rgba(190,235,255,.85)" stroke="rgba(255,255,255,.9)" strokeWidth="1.6" />
    <circle cx="9" cy="9" r="2.4" fill="rgba(255,255,255,.9)" />
  </svg>
);
const Urchin = () => (
  <svg viewBox="0 0 24 24" width="100%" height="100%">
    <g stroke="#5d5a88" strokeWidth="1.8" strokeLinecap="round">
      {Array.from({ length: 10 }).map((_, i) => {
        const a = (i / 10) * Math.PI * 2;
        return <line key={i} x1={12 + Math.cos(a) * 4} y1={12 + Math.sin(a) * 4}
          x2={12 + Math.cos(a) * 10} y2={12 + Math.sin(a) * 10} />;
      })}
    </g>
    <circle cx="12" cy="12" r="5" fill="#7a76b8" />
  </svg>
);
/* ---------- SVG objects: jungle ---------- */
const Log = () => (
  <svg viewBox="0 0 24 24" width="100%" height="100%">
    <rect x="2" y="8" width="18" height="9" rx="4.5" fill="#8a5a33" stroke="rgba(0,0,0,.3)" strokeWidth="1"/>
    <ellipse cx="20" cy="12.5" rx="2.6" ry="4.5" fill="#c99b6a" stroke="rgba(0,0,0,.3)" strokeWidth="1"/>
    <ellipse cx="20" cy="12.5" rx="1.1" ry="2" fill="#8a5a33"/>
    <path d="M5 10.5 h8 M5 14.5 h6" stroke="rgba(0,0,0,.2)" strokeWidth="1.2" strokeLinecap="round"/>
  </svg>
);
const Drum = () => (
  <svg viewBox="0 0 24 24" width="100%" height="100%">
    <path d="M5 8 L8 20 H16 L19 8 Z" fill="#c96f3b" stroke="rgba(0,0,0,.3)" strokeWidth="1"/>
    <ellipse cx="12" cy="8" rx="7" ry="3" fill="#f3e0c0" stroke="rgba(0,0,0,.3)" strokeWidth="1"/>
    <path d="M6.5 11 L10 17 M17.5 11 L14 17 M12 11.5 V17.5" stroke="rgba(0,0,0,.25)" strokeWidth="1.1"/>
  </svg>
);
const Coconut = () => (
  <svg viewBox="0 0 24 24" width="100%" height="100%">
    <circle cx="12" cy="13" r="8.5" fill="#7a4f2a" stroke="rgba(0,0,0,.3)" strokeWidth="1"/>
    <circle cx="9.5" cy="10.5" r="1.1" fill="#4a2e15"/>
    <circle cx="13.5" cy="9.8" r="1.1" fill="#4a2e15"/>
    <circle cx="11.8" cy="13" r="1.1" fill="#4a2e15"/>
    <path d="M5 16 C8 18 16 18 19 16" stroke="rgba(255,255,255,.2)" strokeWidth="1.4" fill="none"/>
  </svg>
);
const SeedPod = () => (
  <svg viewBox="0 0 24 24" width="100%" height="100%">
    <path d="M12 3 C7 8 6 14 12 21 C18 14 17 8 12 3 Z" fill="#a9c15a" stroke="rgba(0,0,0,.3)" strokeWidth="1"/>
    <circle cx="12" cy="9" r="1.2" fill="#6d8430"/>
    <circle cx="12" cy="13" r="1.2" fill="#6d8430"/>
    <circle cx="12" cy="17" r="1.2" fill="#6d8430"/>
  </svg>
);
const Fruit = ({ color }) => (
  <svg viewBox="0 0 24 24" width="100%" height="100%">
    <circle cx="12" cy="14" r="8" fill={color} stroke="rgba(0,0,0,.25)" strokeWidth="1"/>
    <path d="M12 6 C12 4 13 3 15 2.5" stroke="#5a7a2e" strokeWidth="1.8" fill="none" strokeLinecap="round"/>
    <path d="M12 5.5 C14.5 5 16.5 6 17 8 C14.5 8.5 12.5 7.5 12 5.5 Z" fill="#7bb544"/>
    <circle cx="9" cy="11.5" r="2" fill="rgba(255,255,255,.35)"/>
  </svg>
);
const Flower = ({ color }) => (
  <svg viewBox="0 0 24 24" width="100%" height="100%">
    <g fill={color} stroke="rgba(0,0,0,.2)" strokeWidth="0.8">
      {Array.from({ length: 6 }).map((_, i) => {
        const a = (i / 6) * Math.PI * 2 - Math.PI / 2;
        return <ellipse key={i} cx={12 + Math.cos(a) * 5.5} cy={12 + Math.sin(a) * 5.5}
          rx="4" ry="4" />;
      })}
    </g>
    <circle cx="12" cy="12" r="3.4" fill="#ffe066" stroke="rgba(0,0,0,.25)" strokeWidth="1"/>
  </svg>
);
/* ---------- SVG objects: space ---------- */
const Asteroid = () => (
  <svg viewBox="0 0 24 24" width="100%" height="100%">
    <path d="M5 16 C3 12 5 6 10 5 C14 3 20 6 20.5 11 C22 14 19 19 15 19.5 C11 21 6.5 19.5 5 16 Z"
      fill="#9aa3b2" stroke="rgba(0,0,0,.35)" strokeWidth="1"/>
    <circle cx="9" cy="10" r="1.8" fill="#6c7686"/>
    <circle cx="15" cy="14" r="2.3" fill="#6c7686"/>
    <circle cx="14" cy="8.5" r="1" fill="#6c7686"/>
  </svg>
);
const Satellite = () => (
  <svg viewBox="0 0 24 24" width="100%" height="100%">
    <rect x="1.5" y="9" width="6" height="6" rx="1" fill="#4d7cc9" stroke="rgba(0,0,0,.3)" strokeWidth="1"/>
    <rect x="16.5" y="9" width="6" height="6" rx="1" fill="#4d7cc9" stroke="rgba(0,0,0,.3)" strokeWidth="1"/>
    <rect x="8.5" y="8" width="7" height="8" rx="2" fill="#cfd6e4" stroke="rgba(0,0,0,.3)" strokeWidth="1"/>
    <path d="M4.5 10.5 v3 M19.5 10.5 v3" stroke="rgba(0,0,0,.25)" strokeWidth="1"/>
    <circle cx="12" cy="12" r="1.6" fill="#ff6b6b"/>
    <path d="M12 8 V5 M10.5 5 h3" stroke="#cfd6e4" strokeWidth="1.4" strokeLinecap="round" fill="none"/>
  </svg>
);
const Laser = () => (
  <svg viewBox="0 0 24 24" width="100%" height="100%">
    <path d="M13.5 2 L6 13 h4.5 L9 22 L18 10 h-5 Z" fill="#ffe14d" stroke="#e8a300" strokeWidth="1.2" strokeLinejoin="round"/>
  </svg>
);
const Sparkle = () => (
  <svg viewBox="0 0 24 24" width="100%" height="100%">
    <path d="M12 2 C13 8 15 10 21 12 C15 14 13 16 12 22 C11 16 9 14 3 12 C9 10 11 8 12 2 Z"
      fill="#bde3ff" stroke="rgba(255,255,255,.8)" strokeWidth="1"/>
  </svg>
);
const Planet = ({ color }) => (
  <svg viewBox="0 0 24 24" width="100%" height="100%">
    <circle cx="12" cy="12" r="7" fill={color} stroke="rgba(0,0,0,.3)" strokeWidth="1"/>
    <ellipse cx="12" cy="12.5" rx="11" ry="3.4" fill="none" stroke="rgba(255,255,255,.75)" strokeWidth="1.6"
      transform="rotate(-16 12 12)"/>
    <circle cx="9.5" cy="9.5" r="2" fill="rgba(255,255,255,.3)"/>
  </svg>
);
const StarIcon = ({ color }) => (
  <svg viewBox="0 0 24 24" width="100%" height="100%">
    <path d="M12 2.5 L14.7 8.9 L21.5 9.5 L16.3 14 L17.9 20.8 L12 17.2 L6.1 20.8 L7.7 14 L2.5 9.5 L9.3 8.9 Z"
      fill={color} stroke="rgba(0,0,0,.25)" strokeWidth="1" strokeLinejoin="round"/>
  </svg>
);
const Comet = ({ color }) => (
  <svg viewBox="0 0 24 24" width="100%" height="100%">
    <path d="M22 3 C16 6 11 9 8.5 12 L13 16 C15.5 13 19 8.5 22 3 Z" fill="rgba(255,255,255,.45)"/>
    <path d="M22 2.5 C17 4 12 7 9.5 9.5 L15 14.5 C17 11.5 20 7 22 2.5 Z" fill={color} opacity=".6"/>
    <circle cx="9" cy="15" r="5.5" fill={color} stroke="rgba(0,0,0,.3)" strokeWidth="1"/>
    <circle cx="7.4" cy="13.4" r="1.7" fill="rgba(255,255,255,.5)"/>
  </svg>
);
/* ---------- SVG objects: city ---------- */
const Anvil = () => (
  <svg viewBox="0 0 24 24" width="100%" height="100%">
    <path d="M3 7 H21 C21 10 18 12 14.5 12.5 L14.5 16 H17 V19 H7 V16 H9.5 L9.5 12.5 C6 12.5 3.5 10.5 3 7 Z"
      fill="#7c8494" stroke="rgba(0,0,0,.35)" strokeWidth="1" strokeLinejoin="round"/>
    <path d="M4.5 8.2 H19" stroke="rgba(255,255,255,.3)" strokeWidth="1.2" strokeLinecap="round"/>
  </svg>
);
const Barrel = () => (
  <svg viewBox="0 0 24 24" width="100%" height="100%">
    <rect x="6" y="4" width="12" height="17" rx="2" fill="#4d7cc9" stroke="rgba(0,0,0,.35)" strokeWidth="1"/>
    <path d="M6 9 H18 M6 14 H18 M6 17.5 H18" stroke="rgba(0,0,0,.3)" strokeWidth="1.4"/>
    <ellipse cx="12" cy="4.5" rx="6" ry="1.6" fill="#6f9be0" stroke="rgba(0,0,0,.3)" strokeWidth="1"/>
  </svg>
);
const Lid = () => (
  <svg viewBox="0 0 24 24" width="100%" height="100%">
    <ellipse cx="12" cy="14" rx="9.5" ry="4.6" fill="#9aa3b2" stroke="rgba(0,0,0,.35)" strokeWidth="1"/>
    <ellipse cx="12" cy="12.6" rx="9.5" ry="4.6" fill="#c2c9d4" stroke="rgba(0,0,0,.35)" strokeWidth="1"/>
    <path d="M9.5 10.5 C9.5 8.8 14.5 8.8 14.5 10.5" stroke="#5d6570" strokeWidth="1.8" fill="none" strokeLinecap="round"/>
  </svg>
);
const Hydrant = () => (
  <svg viewBox="0 0 24 24" width="100%" height="100%">
    <path d="M8.5 9 C8.5 6 10 4.5 12 4.5 C14 4.5 15.5 6 15.5 9 L15.5 19 H8.5 Z"
      fill="#e94f4f" stroke="rgba(0,0,0,.3)" strokeWidth="1"/>
    <rect x="7" y="19" width="10" height="2.4" rx="1" fill="#c23a3a"/>
    <rect x="10.4" y="2.6" width="3.2" height="2.4" rx="1" fill="#c23a3a"/>
    <circle cx="12" cy="12" r="2" fill="#ffd9d9" stroke="rgba(0,0,0,.25)" strokeWidth="0.8"/>
    <rect x="4.5" y="10.5" width="4" height="3" rx="1.4" fill="#c23a3a"/>
    <rect x="15.5" y="10.5" width="4" height="3" rx="1.4" fill="#c23a3a"/>
  </svg>
);
const Sign = ({ color }) => (
  <svg viewBox="0 0 24 24" width="100%" height="100%">
    <rect x="11.2" y="12" width="1.6" height="10" fill="#8d949f"/>
    <circle cx="12" cy="8" r="6.5" fill={color} stroke="#f2f5fa" strokeWidth="1.8"/>
    <circle cx="12" cy="8" r="6.5" fill="none" stroke="rgba(0,0,0,.25)" strokeWidth="0.8"/>
    <circle cx="10" cy="6.2" r="1.7" fill="rgba(255,255,255,.35)"/>
  </svg>
);
const Boombox = ({ color }) => (
  <svg viewBox="0 0 24 24" width="100%" height="100%">
    <path d="M8 6 C8.5 4 15.5 4 16 6" stroke="#3a3f4a" strokeWidth="1.6" fill="none"/>
    <rect x="2.5" y="6.5" width="19" height="12" rx="2.4" fill={color} stroke="rgba(0,0,0,.3)" strokeWidth="1"/>
    <circle cx="7.5" cy="12.5" r="3.4" fill="#2c303a" stroke="rgba(255,255,255,.4)" strokeWidth="1"/>
    <circle cx="16.5" cy="12.5" r="3.4" fill="#2c303a" stroke="rgba(255,255,255,.4)" strokeWidth="1"/>
    <circle cx="7.5" cy="12.5" r="1.2" fill="#7d8596"/>
    <circle cx="16.5" cy="12.5" r="1.2" fill="#7d8596"/>
    <rect x="10.6" y="9" width="2.8" height="1.6" rx="0.6" fill="rgba(255,255,255,.5)"/>
  </svg>
);
const Vinyl = ({ color }) => (
  <svg viewBox="0 0 24 24" width="100%" height="100%">
    <circle cx="12" cy="12" r="9.5" fill="#23262e" stroke="rgba(0,0,0,.4)" strokeWidth="1"/>
    <circle cx="12" cy="12" r="7" fill="none" stroke="rgba(255,255,255,.14)" strokeWidth="0.8"/>
    <circle cx="12" cy="12" r="5" fill="none" stroke="rgba(255,255,255,.14)" strokeWidth="0.8"/>
    <circle cx="12" cy="12" r="3.4" fill={color} stroke="rgba(0,0,0,.3)" strokeWidth="0.8"/>
    <circle cx="12" cy="12" r="0.9" fill="#23262e"/>
  </svg>
);

/* ---------- themes ----------
   percussion item: { id, label, icon, sound }
   melodic item:    { id, label, icon, kind:'note'|'soft'|'chord', voice, note|notes } */
const THEMES = {
  aqua: {
    title: "Reef",
    icon: "🌊",
    sceneClass: "aqua",
    amb: "bubble",
    lanes: [
      { id: "crab",   emoji: "🦀", color: "#ff7a6b", flip: false },
      { id: "puffer", emoji: "🐡", color: "#ffd166", flip: true  },
      { id: "fish",   emoji: "🐠", color: "#5be3d6", flip: true  },
      { id: "turtle", emoji: "🐢", color: "#9ef0a8", flip: true  },
    ],
    items: {
      crab: [
        { id: "rock",  label: "Boom", icon: <Rock />,  sound: "deepboom" },
        { id: "coral", label: "Tom",  icon: <Coral />, sound: "deeptom" },
      ],
      puffer: [
        { id: "bubble", label: "Blub", icon: <Bubble />, sound: "blub" },
        { id: "urchin", label: "Shh",  icon: <Urchin />, sound: "wash" },
      ],
      fish: [
        { id: "sh-c", label: "Do",  icon: <Shell color="#ff8fa3" />, kind: "note", voice: "deepPluck", note: "C4" },
        { id: "sh-d", label: "Re",  icon: <Shell color="#ffc36b" />, kind: "note", voice: "deepPluck", note: "D4" },
        { id: "sh-e", label: "Mi",  icon: <Shell color="#ffe86b" />, kind: "note", voice: "deepPluck", note: "E4" },
        { id: "sh-g", label: "Sol", icon: <Shell color="#7be38b" />, kind: "note", voice: "deepPluck", note: "G4" },
        { id: "sh-a", label: "La",  icon: <Shell color="#7bc8ff" />, kind: "note", voice: "deepPluck", note: "A4" },
      ],
      turtle: [
        { id: "sh-c5", label: "Do",   icon: <Shell color="#d9a7ff" />, kind: "soft", voice: "pad", note: "C5" },
        { id: "sh-g5", label: "Sol",  icon: <Shell color="#a7c4ff" />, kind: "soft", voice: "pad", note: "G4" },
        { id: "st-c",  label: "Do M", icon: <Starfish color="#ffcf5c" />, kind: "chord", voice: "pad", notes: ["C3","G3","E4","C5"] },
        { id: "st-am", label: "La m", icon: <Starfish color="#ff9fb6" />, kind: "chord", voice: "pad", notes: ["A2","E3","C4","A4"] },
        { id: "st-f",  label: "Fa M", icon: <Starfish color="#8fd7ff" />, kind: "chord", voice: "pad", notes: ["F2","C3","A3","F4"] },
      ],
    },
    start: () => {
      const g = {};
      [0, 4, 8, 12].forEach((s) => (g[`crab-${s}`] = "rock"));
      [2, 6, 10, 14].forEach((s) => (g[`puffer-${s}`] = "bubble"));
      g["fish-0"] = "sh-c"; g["fish-3"] = "sh-e"; g["fish-6"] = "sh-g"; g["fish-10"] = "sh-a"; g["fish-12"] = "sh-g";
      g["turtle-0"] = "st-c"; g["turtle-8"] = "st-am";
      return g;
    },
    defaultSel: { lane: "fish", item: "sh-c" },
  },

  jungle: {
    title: "Jungle",
    icon: "🌴",
    sceneClass: "jungle",
    amb: "leaf",
    lanes: [
      { id: "gorilla", emoji: "🦍", color: "#c9915e", flip: true },
      { id: "parrot",  emoji: "🦜", color: "#ff5d8f", flip: true },
      { id: "monkey",  emoji: "🐒", color: "#ffc94d", flip: true },
      { id: "sloth",   emoji: "🦥", color: "#8bd3dd", flip: true },
    ],
    items: {
      gorilla: [
        { id: "log",  label: "Boom", icon: <Log />,  sound: "log" },
        { id: "drum", label: "Tum",  icon: <Drum />, sound: "djembe" },
      ],
      parrot: [
        { id: "coco", label: "Tock", icon: <Coconut />, sound: "block" },
        { id: "pod",  label: "Chh", icon: <SeedPod />, sound: "shakerpod" },
      ],
      monkey: [
        { id: "fr-c", label: "Do",  icon: <Fruit color="#ff6b6b" />, kind: "note", voice: "marimba", note: "C4" },
        { id: "fr-d", label: "Re",  icon: <Fruit color="#ff9f43" />, kind: "note", voice: "marimba", note: "D4" },
        { id: "fr-e", label: "Mi",  icon: <Fruit color="#fdd54f" />, kind: "note", voice: "marimba", note: "E4" },
        { id: "fr-g", label: "Sol", icon: <Fruit color="#7bd15c" />, kind: "note", voice: "marimba", note: "G4" },
        { id: "fr-a", label: "La",  icon: <Fruit color="#b58cff" />, kind: "note", voice: "marimba", note: "A4" },
      ],
      sloth: [
        { id: "ka-c", label: "Do",   icon: <Fruit color="#ff8fc0" />, kind: "soft", voice: "kalimba", note: "C5" },
        { id: "ka-g", label: "Sol",  icon: <Fruit color="#8fd7ff" />, kind: "soft", voice: "kalimba", note: "G5" },
        { id: "fl-c",  label: "Do M", icon: <Flower color="#ff7096" />, kind: "chord", voice: "kalimba", notes: ["C4","E4","G4","C5"] },
        { id: "fl-am", label: "La m", icon: <Flower color="#b48cf2" />, kind: "chord", voice: "kalimba", notes: ["A3","C4","E4","A4"] },
        { id: "fl-f",  label: "Fa M", icon: <Flower color="#5cc9e8" />, kind: "chord", voice: "kalimba", notes: ["F3","A3","C4","F4"] },
      ],
    },
    start: () => {
      const g = {};
      [0, 4, 8, 12].forEach((s) => (g[`gorilla-${s}`] = "log"));
      [2, 6, 10, 14].forEach((s) => (g[`parrot-${s}`] = "coco"));
      g["monkey-0"] = "fr-c"; g["monkey-2"] = "fr-e"; g["monkey-5"] = "fr-g"; g["monkey-8"] = "fr-a"; g["monkey-11"] = "fr-g"; g["monkey-14"] = "fr-e";
      g["sloth-0"] = "fl-c"; g["sloth-8"] = "fl-f";
      return g;
    },
    defaultSel: { lane: "monkey", item: "fr-c" },
  },

  space: {
    title: "Space",
    icon: "🪐",
    sceneClass: "space",
    amb: "star",
    lanes: [
      { id: "rocket", emoji: "🚀", color: "#ff6b8a", flip: false },
      { id: "alien",  emoji: "👽", color: "#7bff9e", flip: false },
      { id: "ufo",    emoji: "🛸", color: "#7bc8ff", flip: false },
      { id: "robot",  emoji: "🤖", color: "#ffd166", flip: false },
    ],
    items: {
      rocket: [
        { id: "ast", label: "Boom", icon: <Asteroid />,  sound: "boom8" },
        { id: "sat", label: "Ksh",  icon: <Satellite />, sound: "snare8" },
      ],
      alien: [
        { id: "laser", label: "Pew", icon: <Laser />,   sound: "zap" },
        { id: "spark", label: "Tick",  icon: <Sparkle />, sound: "tick8" },
      ],
      ufo: [
        { id: "pl-c", label: "Do",  icon: <Planet color="#ff6b6b" />, kind: "note", voice: "chip", note: "C5" },
        { id: "pl-d", label: "Re",  icon: <Planet color="#ff9f43" />, kind: "note", voice: "chip", note: "D5" },
        { id: "pl-e", label: "Mi",  icon: <Planet color="#ffe14d" />, kind: "note", voice: "chip", note: "E5" },
        { id: "pl-g", label: "Sol", icon: <Planet color="#7bd15c" />, kind: "note", voice: "chip", note: "G5" },
        { id: "pl-a", label: "La",  icon: <Planet color="#b58cff" />, kind: "note", voice: "chip", note: "A5" },
      ],
      robot: [
        { id: "st-c6", label: "Do",   icon: <StarIcon color="#ffe98a" />, kind: "soft", voice: "pulse", note: "C6" },
        { id: "st-g5", label: "Sol",  icon: <StarIcon color="#a7c4ff" />, kind: "soft", voice: "pulse", note: "G5" },
        { id: "cm-c",  label: "Do M", icon: <Comet color="#ffb35c" />, kind: "chord", voice: "pulse", notes: ["C4","G4","E5","C6"] },
        { id: "cm-am", label: "La m", icon: <Comet color="#ff8fb0" />, kind: "chord", voice: "pulse", notes: ["A3","E4","C5","A5"] },
        { id: "cm-f",  label: "Fa M", icon: <Comet color="#7cd4ff" />, kind: "chord", voice: "pulse", notes: ["F3","C4","A4","F5"] },
      ],
    },
    start: () => {
      const g = {};
      g["rocket-0"] = "ast"; g["rocket-8"] = "ast"; g["rocket-4"] = "sat"; g["rocket-12"] = "sat";
      [2, 6, 10, 14].forEach((s) => (g[`alien-${s}`] = "spark"));
      g["alien-7"] = "laser";
      g["ufo-0"] = "pl-c"; g["ufo-2"] = "pl-e"; g["ufo-4"] = "pl-g"; g["ufo-6"] = "pl-e";
      g["ufo-8"] = "pl-a"; g["ufo-10"] = "pl-g"; g["ufo-12"] = "pl-e"; g["ufo-14"] = "pl-d";
      g["robot-0"] = "cm-c"; g["robot-8"] = "cm-am";
      return g;
    },
    defaultSel: { lane: "ufo", item: "pl-c" },
  },

  city: {
    title: "City",
    icon: "🏙️",
    sceneClass: "city",
    amb: "window",
    lanes: [
      { id: "worker",  emoji: "👷", color: "#ffb020", flip: true },
      { id: "runner",  emoji: "🏃", color: "#ff5d7a", flip: true },
      { id: "cyclist", emoji: "🚴", color: "#5bd0ff", flip: true },
      { id: "dancer",  emoji: "🕺", color: "#c58bff", flip: false },
    ],
    items: {
      worker: [
        { id: "anvil",  label: "Clang", icon: <Anvil />,  sound: "anvil" },
        { id: "barrel", label: "Boom",  icon: <Barrel />, sound: "barrel" },
      ],
      runner: [
        { id: "lid",     label: "Chak", icon: <Lid />,     sound: "lid" },
        { id: "hydrant", label: "Pssh",  icon: <Hydrant />, sound: "hiss" },
      ],
      cyclist: [
        { id: "sg-c", label: "Do",  icon: <Sign color="#ff6b6b" />, kind: "note", voice: "bell", note: "C5" },
        { id: "sg-d", label: "Re",  icon: <Sign color="#ff9f43" />, kind: "note", voice: "bell", note: "D5" },
        { id: "sg-e", label: "Mi",  icon: <Sign color="#ffe14d" />, kind: "note", voice: "bell", note: "E5" },
        { id: "sg-g", label: "Sol", icon: <Sign color="#7bd15c" />, kind: "note", voice: "bell", note: "G5" },
        { id: "sg-a", label: "La",  icon: <Sign color="#b58cff" />, kind: "note", voice: "bell", note: "A5" },
      ],
      dancer: [
        { id: "vn-c", label: "Do",   icon: <Vinyl color="#ff8fc0" />, kind: "soft", voice: "keys", note: "C4" },
        { id: "vn-g", label: "Sol",  icon: <Vinyl color="#8fd7ff" />, kind: "soft", voice: "keys", note: "G4" },
        { id: "bb-c",  label: "Do M", icon: <Boombox color="#ff7096" />, kind: "chord", voice: "keys", notes: ["C3","G3","E4","C5"] },
        { id: "bb-am", label: "La m", icon: <Boombox color="#b48cf2" />, kind: "chord", voice: "keys", notes: ["A2","E3","C4","A4"] },
        { id: "bb-f",  label: "Fa M", icon: <Boombox color="#5cc9e8" />, kind: "chord", voice: "keys", notes: ["F2","C3","A3","F4"] },
      ],
    },
    start: () => {
      const g = {};
      g["worker-0"] = "barrel"; g["worker-8"] = "barrel"; g["worker-4"] = "anvil"; g["worker-12"] = "anvil";
      [2, 6, 10, 14].forEach((s) => (g[`runner-${s}`] = "lid"));
      g["runner-15"] = "hydrant";
      g["cyclist-0"] = "sg-c"; g["cyclist-3"] = "sg-e"; g["cyclist-6"] = "sg-g"; g["cyclist-10"] = "sg-a"; g["cyclist-13"] = "sg-g";
      g["dancer-0"] = "bb-c"; g["dancer-8"] = "bb-f";
      return g;
    },
    defaultSel: { lane: "cyclist", item: "sg-c" },
  },
};

const findItem = (themeId, laneId, itemId) =>
  THEMES[themeId].items[laneId]?.find((i) => i.id === itemId);

export default function RhythmRunners() {
  const [theme, setTheme] = useState("aqua");
  const [grids, setGrids] = useState(() => ({
    aqua: THEMES.aqua.start(),
    jungle: THEMES.jungle.start(),
    space: THEMES.space.start(),
    city: THEMES.city.start(),
  }));
  const [selected, setSelected] = useState(THEMES.aqua.defaultSel);
  const [eraser, setEraser] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [tempo, setTempo] = useState(104);
  const [step, setStep] = useState(-1);
  const [shakes, setShakes] = useState({});

  const T = THEMES[theme];
  const grid = grids[theme];

  const gridRef = useRef(grid);
  gridRef.current = grid;
  const themeRef = useRef(theme);
  themeRef.current = theme;
  const audio = useRef(null);
  const fishRefs = useRef({});
  const rafRef = useRef(null);

  /* ============================================================
     AUDIO ENGINE — one output bus per world:
     🌊 lowpass filter → slow chorus → long, wet reverb  (dark & watery)
     🌴 nearly dry, short bright reverb                  (woody & close)
     🪐 bitcrusher → tempo-synced echo → touch of verb   (8-bit arcade)
     ============================================================ */
  const buildAudio = useCallback(async () => {
    if (audio.current) return audio.current;
    await Tone.start();

    /* --- master chain: gentle glue compression + brickwall limiter.
       Prevents clipping when several long/low sounds land on the same step --- */
    const masterLimiter = new Tone.Limiter(-1).toDestination();
    const masterComp = new Tone.Compressor({ threshold: -14, ratio: 3, attack: 0.004, release: 0.18 });
    masterComp.connect(masterLimiter);

    /* --- buses --- */
    const aquaVerb = new Tone.Reverb({ decay: 5.5, wet: 0.4 });
    const aquaChorus = new Tone.Chorus({ frequency: 0.6, delayTime: 4, depth: 0.5, wet: 0.5 }).start();
    const aquaBus = new Tone.Filter(950, "lowpass");
    aquaBus.chain(aquaChorus, aquaVerb, masterComp);

    const jungleVerb = new Tone.Reverb({ decay: 0.9, wet: 0.1 });
    const jungleBus = new Tone.Gain(1);
    jungleBus.chain(jungleVerb, masterComp);

    const spaceVerb = new Tone.Reverb({ decay: 1.4, wet: 0.12 });
    const spaceEcho = new Tone.FeedbackDelay({ delayTime: "8n", feedback: 0.22, wet: 0.16 });
    const spaceBus = new Tone.BitCrusher(5);
    spaceBus.wet.value = 0.4;
    spaceBus.chain(spaceEcho, spaceVerb, masterComp);

    const cityVerb = new Tone.Reverb({ decay: 1.8, wet: 0.18 });
    const citySlap = new Tone.FeedbackDelay({ delayTime: "16n", feedback: 0.15, wet: 0.12 });
    const cityBus = new Tone.Distortion(0.3);
    cityBus.wet.value = 0.25;
    cityBus.chain(citySlap, cityVerb, masterComp);

    await Promise.all([aquaVerb.ready, jungleVerb.ready, spaceVerb.ready, cityVerb.ready]);

    /* --- 🌊 aquatic voices: dark, muted, long --- */
    const deepboom = new Tone.MembraneSynth({
      octaves: 5, pitchDecay: 0.08,
      envelope: { attack: 0.002, decay: 0.7, sustain: 0.01, release: 0.6 },
    }).connect(aquaBus);
    deepboom.volume.value = -7;
    const deeptom = new Tone.MembraneSynth({
      octaves: 2.5, pitchDecay: 0.12,
      envelope: { attack: 0.004, decay: 0.55, sustain: 0.01, release: 0.5 },
    }).connect(aquaBus);
    deeptom.volume.value = -9;
    const blub = new Tone.Synth({
      oscillator: { type: "sine" },
      envelope: { attack: 0.01, decay: 0.35, sustain: 0, release: 0.25 },
    }).connect(aquaBus);
    blub.volume.value = -9;
    const wash = new Tone.NoiseSynth({
      noise: { type: "brown" },
      envelope: { attack: 0.02, decay: 0.35, sustain: 0, release: 0.3 },
    }).connect(aquaBus);
    wash.volume.value = -11;
    const deepPluck = new Tone.PolySynth(Tone.AMSynth, {
      harmonicity: 1.5,
      oscillator: { type: "sine" },
      modulation: { type: "sine" },
      envelope: { attack: 0.02, decay: 0.9, sustain: 0.12, release: 1.6 },
      modulationEnvelope: { attack: 0.4, decay: 0.6, sustain: 0.2, release: 1.2 },
    }).connect(aquaBus);
    deepPluck.volume.value = -8;
    const pad = new Tone.PolySynth(Tone.Synth, {
      oscillator: { type: "sine" },
      envelope: { attack: 0.15, decay: 0.8, sustain: 0.3, release: 2.4 },
    }).connect(aquaBus);
    pad.volume.value = -11;

    /* --- 🌴 jungle voices: bright, dry, woody --- */
    const log = new Tone.MembraneSynth({
      octaves: 2, pitchDecay: 0.025,
      envelope: { attack: 0.001, decay: 0.18, sustain: 0 },
    }).connect(jungleBus);
    log.volume.value = -7;
    const djembe = new Tone.MembraneSynth({
      octaves: 3.5, pitchDecay: 0.015,
      envelope: { attack: 0.001, decay: 0.12, sustain: 0 },
    }).connect(jungleBus);
    djembe.volume.value = -9;
    const block = new Tone.MembraneSynth({
      octaves: 1.2, pitchDecay: 0.005,
      envelope: { attack: 0.001, decay: 0.045, sustain: 0 },
    }).connect(jungleBus);
    block.volume.value = -8;
    const shakerpod = new Tone.NoiseSynth({
      noise: { type: "pink" },
      envelope: { attack: 0.001, decay: 0.04, sustain: 0 },
    }).connect(jungleBus);
    shakerpod.volume.value = -14;
    /* marimba body: partials tuned like a real bar (modes near 1, 4 and 10) */
    const marimba = new Tone.PolySynth(Tone.Synth, {
      oscillator: { partials: [1, 0, 0, 0.5, 0, 0, 0, 0, 0, 0.22] },
      envelope: { attack: 0.001, decay: 0.5, sustain: 0, release: 0.45 },
    }).connect(jungleBus);
    marimba.volume.value = -9;
    /* marimba resonator: warm short-lived low emphasis, like the tube under the bar */
    const marimbaBody = new Tone.PolySynth(Tone.Synth, {
      oscillator: { type: "sine" },
      envelope: { attack: 0.002, decay: 0.22, sustain: 0, release: 0.2 },
    }).connect(jungleBus);
    marimbaBody.volume.value = -16;
    /* mallet strike: tiny band-passed noise click at the attack */
    const malletFilter = new Tone.Filter(2400, "bandpass", -12);
    malletFilter.Q.value = 1.2;
    malletFilter.connect(jungleBus);
    const mallet = new Tone.NoiseSynth({
      noise: { type: "white" },
      envelope: { attack: 0.001, decay: 0.014, sustain: 0 },
    }).connect(malletFilter);
    mallet.volume.value = -16;
    const kalimba = new Tone.PolySynth(Tone.FMSynth, {
      harmonicity: 8, modulationIndex: 2,
      oscillator: { type: "sine" },
      envelope: { attack: 0.001, decay: 0.7, sustain: 0, release: 0.7 },
      modulation: { type: "square" },
      modulationEnvelope: { attack: 0.002, decay: 0.2, sustain: 0, release: 0.2 },
    }).connect(jungleBus);
    kalimba.volume.value = -12;

    /* --- 🪐 space voices: pure square-wave 8-bit bips --- */
    const boom8 = new Tone.MembraneSynth({
      octaves: 8, pitchDecay: 0.02,
      oscillator: { type: "square" },
      envelope: { attack: 0.001, decay: 0.14, sustain: 0 },
    }).connect(spaceBus);
    boom8.volume.value = -8;
    const snare8 = new Tone.NoiseSynth({
      noise: { type: "white" },
      envelope: { attack: 0.001, decay: 0.08, sustain: 0 },
    }).connect(spaceBus);
    snare8.volume.value = -13;
    const zap = new Tone.MembraneSynth({
      octaves: 4.5, pitchDecay: 0.12,
      oscillator: { type: "square" },
      envelope: { attack: 0.001, decay: 0.16, sustain: 0 },
    }).connect(spaceBus);
    zap.volume.value = -14;
    const tick8 = new Tone.NoiseSynth({
      noise: { type: "white" },
      envelope: { attack: 0.001, decay: 0.02, sustain: 0 },
    }).connect(spaceBus);
    tick8.volume.value = -16;
    const chip = new Tone.PolySynth(Tone.Synth, {
      oscillator: { type: "square" },
      envelope: { attack: 0.001, decay: 0.1, sustain: 0.4, release: 0.03 },
    }).connect(spaceBus);
    chip.volume.value = -14;
    const pulse = new Tone.PolySynth(Tone.Synth, {
      oscillator: { type: "pulse", width: 0.25 },
      envelope: { attack: 0.001, decay: 0.08, sustain: 0.35, release: 0.03 },
    }).connect(spaceBus);
    pulse.volume.value = -15;

    /* --- 🏙️ city voices: industrial metal + street melodies --- */
    /* anvil clang: inharmonic FM ratio = metallic ring */
    const anvil = new Tone.FMSynth({
      harmonicity: 5.07, modulationIndex: 24,
      oscillator: { type: "sine" },
      envelope: { attack: 0.001, decay: 0.4, sustain: 0, release: 0.3 },
      modulation: { type: "square" },
      modulationEnvelope: { attack: 0.001, decay: 0.2, sustain: 0, release: 0.15 },
    }).connect(cityBus);
    anvil.volume.value = -14;
    /* oil barrel: hollow low thud */
    const barrel = new Tone.MembraneSynth({
      octaves: 4, pitchDecay: 0.05,
      envelope: { attack: 0.001, decay: 0.35, sustain: 0.01, release: 0.25 },
    }).connect(cityBus);
    barrel.volume.value = -8;
    /* trash-can lid: short bright clank */
    const lid = new Tone.FMSynth({
      harmonicity: 7.4, modulationIndex: 30,
      oscillator: { type: "sine" },
      envelope: { attack: 0.001, decay: 0.09, sustain: 0, release: 0.06 },
      modulation: { type: "square" },
      modulationEnvelope: { attack: 0.001, decay: 0.06, sustain: 0, release: 0.04 },
    }).connect(cityBus);
    lid.volume.value = -18;
    /* steam hiss: high-passed white noise (fire hydrant / vapor vent) */
    const hissFilter = new Tone.Filter(3200, "highpass").connect(cityBus);
    const hiss = new Tone.NoiseSynth({
      noise: { type: "white" },
      envelope: { attack: 0.005, decay: 0.2, sustain: 0, release: 0.12 },
    }).connect(hissFilter);
    hiss.volume.value = -13;
    /* bicycle bell: shimmering, slightly inharmonic ding */
    const bell = new Tone.PolySynth(Tone.FMSynth, {
      harmonicity: 3.9, modulationIndex: 12,
      oscillator: { type: "sine" },
      envelope: { attack: 0.001, decay: 0.55, sustain: 0, release: 0.4 },
      modulation: { type: "sine" },
      modulationEnvelope: { attack: 0.001, decay: 0.3, sustain: 0, release: 0.2 },
    }).connect(cityBus);
    bell.volume.value = -13;
    /* street keys: mellow electric-piano chords from the boombox */
    const keys = new Tone.PolySynth(Tone.FMSynth, {
      harmonicity: 1, modulationIndex: 3.5,
      oscillator: { type: "sine" },
      envelope: { attack: 0.004, decay: 0.5, sustain: 0.18, release: 0.6 },
      modulation: { type: "sine" },
      modulationEnvelope: { attack: 0.002, decay: 0.3, sustain: 0.05, release: 0.4 },
    }).connect(cityBus);
    keys.volume.value = -12;

    Tone.Transport.loop = true;
    Tone.Transport.loopStart = 0;
    Tone.Transport.loopEnd = "1m";
    Tone.Transport.bpm.value = tempo;

    Tone.Transport.scheduleRepeat((time) => {
      const s = Math.round(Tone.Transport.getTicksAtTime(time) / (Tone.Transport.PPQ / 4)) % STEPS;
      const th = themeRef.current;
      const g = gridRef.current;
      const hits = [];
      THEMES[th].lanes.forEach((lane) => {
        const itemId = g[`${lane.id}-${s}`];
        if (!itemId) return;
        const item = findItem(th, lane.id, itemId);
        if (!item) return;
        hits.push(`${lane.id}-${s}`);
        playItem(audio.current, item, time, th);
      });
      Tone.Draw.schedule(() => {
        setStep(s);
        if (hits.length)
          setShakes((prev) => {
            const nx = { ...prev };
            hits.forEach((k) => (nx[k] = (nx[k] || 0) + 1));
            return nx;
          });
      }, time);
    }, "16n");

    audio.current = {
      deepboom, deeptom, blub, wash, deepPluck, pad,
      log, djembe, block, shakerpod, marimba, marimbaBody, mallet, kalimba,
      boom8, snare8, zap, tick8, chip, pulse,
      anvil, barrel, lid, hiss, bell, keys,
    };
    return audio.current;
  }, [tempo]);

  /* one trigger routine used by sequencer + previews */
  const playItem = (A, item, time, th) => {
    if (!A) return;
    switch (item.sound) {
      /* aquatic */
      case "deepboom": return A.deepboom.triggerAttackRelease("C1", "4n", time);
      case "deeptom":  return A.deeptom.triggerAttackRelease("E2", "4n", time);
      case "blub":     return A.blub.triggerAttackRelease("C5", "8n", time);
      case "wash":     return A.wash.triggerAttackRelease("4n", time);
      /* jungle */
      case "log":       return A.log.triggerAttackRelease("G1", "8n", time);
      case "djembe":    return A.djembe.triggerAttackRelease("A2", "8n", time);
      case "block":     return A.block.triggerAttackRelease("G4", "16n", time);
      case "shakerpod": return A.shakerpod.triggerAttackRelease("16n", time);
      /* space */
      case "boom8":  return A.boom8.triggerAttackRelease("C1", "8n", time);
      case "snare8": return A.snare8.triggerAttackRelease("16n", time);
      case "zap":    return A.zap.triggerAttackRelease("C6", "8n", time);
      case "tick8":  return A.tick8.triggerAttackRelease("32n", time);
      /* city */
      case "anvil":  return A.anvil.triggerAttackRelease("E3", "8n", time);
      case "barrel": return A.barrel.triggerAttackRelease("C2", "8n", time);
      case "lid":    return A.lid.triggerAttackRelease("A5", "16n", time);
      case "hiss":   return A.hiss.triggerAttackRelease("8n", time);
      default: break;
    }
    /* melodic: note length matches each world's character */
    const dur = th === "aqua" ? "4n" : th === "space" ? "16n" : "8n";
    if (item.kind === "note" || item.kind === "soft") {
      if (item.voice === "marimba") {
        /* humanize: every strike gets a slightly different force and micro-detune */
        const vel = 0.72 + Math.random() * 0.28;
        const f = Tone.Frequency(item.note).toFrequency() * (1 + (Math.random() - 0.5) * 0.004);
        A.mallet.triggerAttackRelease("32n", time, vel);        /* woody click */
        A.marimbaBody.triggerAttackRelease(f, "16n", time, vel * 0.8); /* resonator warmth */
        return A.marimba.triggerAttackRelease(f, dur, time, vel);      /* the bar itself */
      }
      return A[item.voice].triggerAttackRelease(item.note, dur, time);
    }
    if (item.kind === "chord") {
      /* arpeggio speed: dreamy underwater, medium jungle, rapid-fire chiptune */
      const dt = Tone.Time(th === "aqua" ? "16n" : th === "space" ? "64n" : "32n").toSeconds();
      item.notes.forEach((n, i) => A[item.voice].triggerAttackRelease(n, dur, time + i * dt));
    }
  };

  const preview = async (item) => {
    const A = await buildAudio();
    playItem(A, item, Tone.now(), themeRef.current);
  };

  const togglePlay = async () => {
    await buildAudio();
    if (playing) {
      Tone.Transport.pause();
      setPlaying(false);
    } else {
      Tone.Transport.start("+0.05");
      setPlaying(true);
    }
  };

  const switchTheme = (next) => {
    setTheme(next);
    setSelected(THEMES[next].defaultSel);
    setEraser(false);
    setShakes({});
  };

  useEffect(() => {
    if (audio.current) Tone.Transport.bpm.rampTo(tempo, 0.2);
  }, [tempo]);

  /* ---------- characters follow the transport ---------- */
  useEffect(() => {
    const loop = () => {
      const p = playing ? Tone.Transport.progress : 0;
      const x = ((p * STEPS + 0.5) % STEPS) / STEPS;
      THEMES[themeRef.current].lanes.forEach((lane) => {
        const el = fishRefs.current[lane.id];
        if (el) el.style.left = `${x * 100}%`;
      });
      rafRef.current = requestAnimationFrame(loop);
    };
    rafRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(rafRef.current);
  }, [playing, theme]);

  /* ---------- grid interaction ---------- */
  const tapCell = (laneId, s) => {
    const key = `${laneId}-${s}`;
    setGrids((all) => {
      const g = { ...all[theme] };
      if (eraser) {
        delete g[key];
      } else if (selected.lane !== laneId) {
        if (g[key]) delete g[key]; // tapping an object in another lane removes it
      } else if (g[key] === selected.item) {
        delete g[key];
      } else {
        g[key] = selected.item;
        const item = findItem(theme, laneId, selected.item);
        if (item) preview(item);
      }
      return { ...all, [theme]: g };
    });
  };

  const clearAll = () => setGrids((all) => ({ ...all, [theme]: {} }));

  /* ---------- render ---------- */
  return (
    <div className={`rr-root ${T.sceneClass}`}>
      <style>{css}</style>

      <header className="rr-header">
        <h1>{T.icon} Rhythm Runners <span className="rr-sub">{T.title}</span></h1>
        <div className="rr-controls">
          <div className="rr-theme">
            {THEME_ORDER.map((id) => (
              <button key={id} className={theme === id ? "cur" : ""} onClick={() => switchTheme(id)} title={THEMES[id].title}>
                {THEMES[id].icon}
              </button>
            ))}
          </div>
          <button className={`rr-play ${playing ? "on" : ""}`} onClick={togglePlay}>
            {playing ? "❚❚" : "▶"}
          </button>
          <div className="rr-tempo">
            {[{ t: 80, e: "🐌" }, { t: 104, e: "🐟" }, { t: 132, e: "🚀" }].map((o) => (
              <button key={o.t} className={tempo === o.t ? "sel" : ""} onClick={() => setTempo(o.t)} title={`${o.t} bpm`}>
                {o.e}
              </button>
            ))}
          </div>
          <button className={`rr-tool ${eraser ? "sel" : ""}`} onClick={() => setEraser(!eraser)} title="Eraser">
            🧽
          </button>
          <button className="rr-tool" onClick={clearAll} title="Clear all">🗑️</button>
        </div>
      </header>

      <div className={`rr-scene ${T.sceneClass}`}>
        <div className="rr-rays" />
        {T.amb === "bubble" &&
          [...Array(9)].map((_, i) => (
            <span key={`b${i}`} className="rr-amb" style={{ left: `${(i * 11 + 4) % 100}%`, animationDelay: `${i * 1.7}s`, animationDuration: `${7 + (i % 4) * 2}s` }} />
          ))}
        {T.amb === "leaf" &&
          [...Array(9)].map((_, i) => (
            <span key={`l${i}`} className="rr-leaf" style={{ left: `${(i * 13 + 3) % 100}%`, animationDelay: `${i * 2.1}s`, animationDuration: `${9 + (i % 4) * 2.5}s` }}>🍃</span>
          ))}
        {T.amb === "star" &&
          [...Array(22)].map((_, i) => (
            <span key={`s${i}`} className="rr-star" style={{
              left: `${(i * 17 + 7) % 100}%`,
              top: `${(i * 23 + 5) % 92}%`,
              animationDelay: `${(i % 7) * 0.6}s`,
              width: `${2 + (i % 3)}px`,
              height: `${2 + (i % 3)}px`,
            }} />
          ))}

        {T.amb === "window" && (
          <>
            <div className="rr-skyline" />
            {[...Array(18)].map((_, i) => (
              <span key={`w${i}`} className="rr-window" style={{
                left: `${(i * 19 + 6) % 100}%`,
                bottom: `${8 + ((i * 13) % 55)}%`,
                animationDelay: `${(i % 6) * 0.9}s`,
              }} />
            ))}
          </>
        )}

        {T.lanes.map((lane, li) => (
          <div key={lane.id} className={`rr-lane ${selected.lane === lane.id && !eraser ? "hot" : ""}`}>
            <div className="rr-lane-tint" style={{ background: lane.color }} />
            {Array.from({ length: STEPS }).map((_, s) => {
              const key = `${lane.id}-${s}`;
              const itemId = grid[key];
              const item = itemId ? findItem(theme, lane.id, itemId) : null;
              return (
                <button key={s} className={`rr-cell ${s === step ? "now" : ""} ${s % 4 === 0 ? "beat" : ""}`} onPointerDown={() => tapCell(lane.id, s)}>
                  {item && (
                    <span key={shakes[key] || 0} className={`rr-obj ${shakes[key] ? "shake" : ""}`}>
                      {item.icon}
                    </span>
                  )}
                </button>
              );
            })}
            <div className="rr-swimmer" ref={(el) => (fishRefs.current[lane.id] = el)}>
              <span className={`rr-fish ${playing ? "swim" : ""}`} style={{ transform: lane.flip ? "scaleX(-1)" : "none", animationDelay: `${li * 0.3}s` }}>
                {lane.emoji}
              </span>
            </div>
          </div>
        ))}
        <div className={`rr-ground ${T.sceneClass}`} />
      </div>

      <footer className="rr-palette">
        {T.lanes.map((lane) => (
          <div key={lane.id} className="rr-group" style={{ "--lc": lane.color }}>
            <span className="rr-group-tag">{lane.emoji}</span>
            {T.items[lane.id].map((item) => {
              const isSel = !eraser && selected.lane === lane.id && selected.item === item.id;
              return (
                <button
                  key={item.id}
                  className={`rr-pal ${isSel ? "sel" : ""}`}
                  onClick={() => {
                    setEraser(false);
                    setSelected({ lane: lane.id, item: item.id });
                    preview(item);
                  }}
                >
                  <span className="rr-pal-ic">{item.icon}</span>
                  <span className="rr-pal-lb">{item.label}</span>
                </button>
              );
            })}
          </div>
        ))}
      </footer>
    </div>
  );
}

/* ============================ styles ============================ */
const css = `
@import url('https://fonts.googleapis.com/css2?family=Fredoka:wght@500;700&display=swap');

.rr-root{
  font-family:'Fredoka',sans-serif;
  height:100vh; display:flex; flex-direction:column;
  color:#eaf6ff; user-select:none; -webkit-user-select:none; overflow:hidden;
  transition:background 1s;
}
.rr-root.aqua{background:linear-gradient(180deg,#062a52,#04203f);}
.rr-root.jungle{background:linear-gradient(180deg,#123020,#0a1f14);}
.rr-root.space{background:linear-gradient(180deg,#120b2e,#060314);}
.rr-root.city{background:linear-gradient(180deg,#241a36,#12101f);}

.rr-header{display:flex;align-items:center;justify-content:space-between;padding:8px 14px;gap:10px;flex-wrap:wrap;}
.rr-header h1{margin:0;font-size:clamp(16px,2.6vw,24px);font-weight:700;letter-spacing:.5px;text-shadow:0 2px 8px rgba(0,0,0,.4);}
.rr-controls{display:flex;align-items:center;gap:8px;}
.rr-sub{font-weight:500;opacity:.7;font-size:.75em;margin-left:4px;}
.rr-theme{
  display:flex;gap:2px;border-radius:999px;padding:4px;
  background:rgba(255,255,255,.1);
}
.rr-theme button{
  width:36px;height:36px;display:grid;place-items:center;font-size:18px;border-radius:999px;
  opacity:.45;transition:all .25s;border:none;background:transparent;cursor:pointer;
}
.rr-theme button.cur{opacity:1;background:rgba(255,255,255,.28);transform:scale(1.05);}
.rr-play{
  width:52px;height:52px;border-radius:50%;border:none;cursor:pointer;font-size:20px;
  background:linear-gradient(180deg,#ffd166,#ff9f43);color:#4a2c00;
  box-shadow:0 4px 0 #b96a12,0 6px 14px rgba(0,0,0,.4);transition:transform .1s;
}
.rr-play:active{transform:translateY(3px);box-shadow:0 1px 0 #b96a12;}
.rr-play.on{background:linear-gradient(180deg,#7be38b,#3cb964);color:#053;box-shadow:0 4px 0 #1d7a3c,0 6px 14px rgba(0,0,0,.4);}
.rr-tempo{display:flex;background:rgba(255,255,255,.1);border-radius:999px;padding:3px;gap:2px;}
.rr-tempo button,.rr-tool{
  border:none;background:transparent;font-size:19px;cursor:pointer;border-radius:999px;
  width:40px;height:40px;display:grid;place-items:center;transition:background .15s;
}
.rr-tempo button.sel{background:rgba(255,255,255,.28);}
.rr-tool{background:rgba(255,255,255,.1);}
.rr-tool.sel{background:#ffd166;box-shadow:0 0 0 3px rgba(255,209,102,.4);}

/* ---------- scene ---------- */
.rr-scene{
  flex:1;position:relative;margin:0 10px;border-radius:18px;overflow:hidden;
  box-shadow:inset 0 0 60px rgba(0,20,50,.45),0 10px 30px rgba(0,0,0,.35);
  display:flex;flex-direction:column;transition:background 1s;
}
.rr-scene.aqua{background:linear-gradient(180deg,#39c1e8 0%,#1b8ec9 34%,#0f5f9e 68%,#0a3d70 100%);}
.rr-scene.jungle{background:linear-gradient(180deg,#a8d97c 0%,#5aa354 30%,#2f7a44 66%,#1b4d30 100%);}
.rr-scene.space{background:linear-gradient(180deg,#3b2a7a 0%,#241a56 32%,#161038 66%,#0b0722 100%);}
.rr-scene.city{background:linear-gradient(180deg,#ff9e6b 0%,#c96a8a 26%,#6a4a8c 55%,#2b2350 100%);}
.rr-rays{
  position:absolute;inset:-20% -10%;pointer-events:none;opacity:.5;
  background:
    linear-gradient(115deg,transparent 20%,rgba(255,255,255,.14) 24%,transparent 30%),
    linear-gradient(115deg,transparent 46%,rgba(255,255,255,.1) 50%,transparent 57%),
    linear-gradient(115deg,transparent 70%,rgba(255,255,255,.12) 75%,transparent 82%);
  animation:rays 9s ease-in-out infinite alternate;
}
.rr-scene.space .rr-rays{opacity:.12;}
@keyframes rays{from{transform:translateX(-2%)}to{transform:translateX(2%)}}
.rr-amb{
  position:absolute;bottom:-14px;width:9px;height:9px;border-radius:50%;
  background:rgba(255,255,255,.35);border:1px solid rgba(255,255,255,.5);
  animation:rise linear infinite;pointer-events:none;
}
@keyframes rise{from{transform:translateY(0);opacity:.7}to{transform:translateY(-108vh);opacity:0}}
.rr-leaf{
  position:absolute;top:-30px;font-size:15px;pointer-events:none;
  animation:fall linear infinite;opacity:.8;
}
@keyframes fall{
  0%{transform:translateY(0) translateX(0) rotate(0);opacity:.85}
  50%{transform:translateY(54vh) translateX(26px) rotate(160deg)}
  100%{transform:translateY(108vh) translateX(-14px) rotate(320deg);opacity:.2}
}
.rr-star{
  position:absolute;border-radius:50%;background:#fff;pointer-events:none;
  box-shadow:0 0 6px 1px rgba(255,255,255,.7);
  animation:twinkle 2.8s ease-in-out infinite;
}
@keyframes twinkle{0%,100%{opacity:.25;transform:scale(.8)}50%{opacity:1;transform:scale(1.25)}}
.rr-scene.city .rr-rays{opacity:.18;}
.rr-skyline{
  position:absolute;left:0;right:0;bottom:0;top:0;pointer-events:none;opacity:.4;
  background-image:
    repeating-linear-gradient(90deg,#1a1430 0 48px,transparent 48px 82px),
    repeating-linear-gradient(90deg,#251c42 0 30px,transparent 30px 57px);
  background-size:100% 62%,100% 44%;
  background-position:bottom left 12px,bottom left 40px;
  background-repeat:no-repeat;
}
.rr-window{
  position:absolute;width:5px;height:6px;border-radius:1px;pointer-events:none;
  background:#ffd980;box-shadow:0 0 7px 1px rgba(255,200,90,.55);
  animation:twinkle 3.4s ease-in-out infinite;
}
.rr-ground{
  position:absolute;left:0;right:0;bottom:0;height:16px;pointer-events:none;
  opacity:.85;border-radius:50% 50% 0 0/100% 100% 0 0;
}
.rr-ground.aqua{background:radial-gradient(60% 140% at 50% 100%,#e8cf8f,#caa45f);}
.rr-ground.jungle{background:radial-gradient(60% 140% at 50% 100%,#6d8430,#3f5220);}
.rr-ground.space{background:radial-gradient(60% 140% at 50% 100%,#b8bfce,#6a7285);opacity:.6;}
.rr-ground.city{
  background:
    repeating-linear-gradient(90deg,transparent 0 26px,#ffd166 26px 44px,transparent 44px 70px) top/100% 2.4px no-repeat,
    linear-gradient(180deg,#4a4f5c,#33373f);
  border-radius:0;opacity:.9;
}

/* ---------- lanes & cells ---------- */
.rr-lane{flex:1;position:relative;display:flex;border-bottom:2px dashed rgba(255,255,255,.14);}
.rr-lane:last-child{border-bottom:none;}
.rr-lane-tint{position:absolute;inset:0;opacity:0;transition:opacity .25s;pointer-events:none;}
.rr-lane.hot .rr-lane-tint{opacity:.1;}
.rr-cell{
  flex:1;border:none;background:transparent;cursor:pointer;position:relative;padding:0;
}
.rr-cell.beat{border-left:1px solid rgba(255,255,255,.1);}
.rr-cell.now{background:rgba(255,255,255,.09);}
.rr-obj{
  position:absolute;inset:12% 8%;display:block;pointer-events:none;
  filter:drop-shadow(0 3px 4px rgba(0,0,0,.35));
}
.rr-obj.shake{animation:wob .38s ease;}
@keyframes wob{
  0%{transform:rotate(0) scale(1)}
  25%{transform:rotate(-14deg) scale(1.28)}
  55%{transform:rotate(11deg) scale(1.18)}
  100%{transform:rotate(0) scale(1)}
}

/* ---------- swimmers ---------- */
.rr-swimmer{
  position:absolute;top:50%;left:0;width:0;height:0;pointer-events:none;z-index:3;
}
.rr-fish{
  position:absolute;transform:translate(-50%,-50%);left:0;top:0;
  font-size:clamp(26px,4.6vh,42px);display:block;margin-left:-0.6em;margin-top:-0.55em;
  filter:drop-shadow(0 4px 6px rgba(0,0,0,.4));
}
.rr-fish.swim{animation:bob .55s ease-in-out infinite alternate;}
@keyframes bob{from{translate:0 -3px}to{translate:0 3px}}

/* ---------- palette ---------- */
.rr-palette{
  display:flex;gap:8px;padding:8px 10px 10px;overflow-x:auto;align-items:stretch;
}
.rr-group{
  display:flex;align-items:center;gap:5px;padding:5px 8px;border-radius:14px;
  background:rgba(255,255,255,.07);border:2px solid color-mix(in srgb,var(--lc) 55%,transparent);
  flex-shrink:0;
}
.rr-group-tag{font-size:20px;margin-right:2px;}
.rr-pal{
  border:none;cursor:pointer;border-radius:12px;padding:5px 6px 3px;
  background:rgba(255,255,255,.1);display:flex;flex-direction:column;align-items:center;gap:1px;
  transition:transform .12s,background .12s;min-width:50px;
}
.rr-pal:hover{background:rgba(255,255,255,.2);}
.rr-pal.sel{background:var(--lc);transform:scale(1.08);box-shadow:0 0 0 3px rgba(255,255,255,.55),0 4px 10px rgba(0,0,0,.35);}
.rr-pal.sel .rr-pal-lb{color:#08283f;font-weight:700;}
.rr-pal-ic{width:30px;height:30px;display:block;}
.rr-pal-lb{font-size:11px;color:#dff2ff;font-weight:500;}
`;
