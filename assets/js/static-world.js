// Statická scéna sdílená všemi kolizními systémy.
// h = poloviční rozměry kvádru, p = pozice, r = rotace (Euler v radiánech)
import * as THREE from 'three';

export const G = 9.81;

export const STATIC = [
  { h: [20, 0.5, 20], p: [0, -0.5, 0], r: [0, 0, 0], ground: true },
  { h: [20, 1, 0.3], p: [0, 1, 20.3], r: [0, 0, 0] },
  { h: [20, 1, 0.3], p: [0, 1, -20.3], r: [0, 0, 0] },
  { h: [0.3, 1, 20], p: [20.3, 1, 0], r: [0, 0, 0] },
  { h: [0.3, 1, 20], p: [-20.3, 1, 0], r: [0, 0, 0] },
  { h: [6, 0.25, 3], p: [-8, 3.2, -4], r: [0, 0, -0.42] },
  { h: [5, 0.25, 2.5], p: [7, 4.5, -7], r: [0.3, 0.6, 0.25] },
  { h: [1.5, 1.5, 1.5], p: [3, 1.5, 4], r: [0, 0.5, 0] },
  { h: [1, 2.5, 1], p: [-3, 2.5, 7], r: [0, 0.2, 0] },
  { h: [3, 0.2, 3], p: [0, 6, 0], r: [0.15, 0, 0.1] },
];
// schody
for (let i = 0; i < 6; i++) STATIC.push({ h: [1.2, 0.3 * (i + 1), 3], p: [4 + i * 2.4, 0.3 * (i + 1), 10], r: [0, 0, 0] });

for (const s of STATIC) s.q = new THREE.Quaternion().setFromEuler(new THREE.Euler(...s.r));
