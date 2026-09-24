// Jednoduchý integrátor koulí pro režimy bez fyzikálního enginu
// (stejné schéma jako oficiální three.js demo games_fps).
// worldHit(center, radius) vrací { normal, depth } nebo null/false.
import * as THREE from 'three';
import { G } from '../static-world.js';

export function makeSphereSim(worldHit) {
  const S = [];
  const n = new THREE.Vector3(), v1 = new THREE.Vector3(), v2 = new THREE.Vector3();
  const SUB = 5, REST = 0.35;
  return {
    add(kind, p, v, r) { S.push({ c: p.clone(), v: v.clone(), r }); return S.length - 1; },
    step(dt) {
      const h = dt / SUB;
      for (let k = 0; k < SUB; k++) {
        // 1) gravitace, pohyb a kolize se statickým světem
        for (const s of S) {
          s.v.y -= G * h;
          s.v.multiplyScalar(Math.exp(-0.15 * h));
          s.c.addScaledVector(s.v, h);
          const hit = worldHit(s.c, s.r);
          if (hit) {
            const vn = hit.normal.dot(s.v);
            if (vn < 0) {
              s.v.addScaledVector(hit.normal, -vn * (1 + REST));
              // hrubé tření na tečné složce rychlosti
              v1.copy(hit.normal).multiplyScalar(hit.normal.dot(s.v));
              v2.subVectors(s.v, v1).multiplyScalar(1 - 2.5 * h);
              s.v.copy(v1).add(v2);
            }
            s.c.addScaledVector(hit.normal, hit.depth);
          }
        }
        // 2) koule proti kouli, každá s každou (O(n²))
        for (let i = 0; i < S.length; i++) {
          const a = S[i];
          for (let j = i + 1; j < S.length; j++) {
            const b = S[j];
            n.subVectors(a.c, b.c);
            const rr = a.r + b.r, d2 = n.lengthSq();
            if (d2 < rr * rr && d2 > 1e-9) {
              const d = Math.sqrt(d2); n.divideScalar(d);
              const va = n.dot(a.v), vb = n.dot(b.v);
              if (va - vb < 0) {
                v1.copy(n).multiplyScalar(va); v2.copy(n).multiplyScalar(vb);
                a.v.add(v2).sub(v1); b.v.add(v1).sub(v2);
                a.v.multiplyScalar(0.98); b.v.multiplyScalar(0.98);
              }
              const push = (rr - d) / 2;
              a.c.addScaledVector(n, push); b.c.addScaledVector(n, -push);
            }
          }
        }
      }
    },
    read(i, pos, q) { pos.copy(S[i].c); q.identity(); },
    dispose() {}
  };
}
