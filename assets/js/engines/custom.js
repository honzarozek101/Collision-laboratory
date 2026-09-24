// Vlastní kolize hrubou silou: koule proti orientovaným kvádrům (OBB).
import * as THREE from 'three';
import { STATIC } from '../static-world.js';
import { makeSphereSim } from './sphere-sim.js';

export default {
  name: 'Vlastní', kind: 'hrubá síla · OBB', color: '#7C8591', boxes: false,
  info: {
    what: 'Ručně napsaná detekce: střed koule se převede do lokálního prostoru každého kvádru, najde se nejbližší bod a z něj normála a hloubka průniku.',
    broad: 'Žádná. Každá koule se testuje proti všem kvádrům i všem ostatním koulím',
    dyn: 'Jen koule, stejný integrátor jako režim Octree',
    note: 'Nejjednodušší možný systém, asi 30 řádků. Pro malou hru s pár objekty úplně stačí a dobře ukazuje, co enginy dělají uvnitř.'
  },
  async create() {
    const boxes = STATIC.map(s => {
      const m = new THREE.Matrix4().compose(new THREE.Vector3(...s.p), s.q, new THREE.Vector3(1, 1, 1));
      return { m, inv: m.clone().invert(), h: s.h };
    });
    const lp = new THREE.Vector3(), cp = new THREE.Vector3(), d = new THREE.Vector3();
    const out = { normal: new THREE.Vector3(), depth: 0 };
    const clamp = THREE.MathUtils.clamp;
    return makeSphereSim((c, r) => {
      let best = null;
      for (const b of boxes) {
        lp.copy(c).applyMatrix4(b.inv);                       // střed koule v lokálním prostoru kvádru
        cp.set(clamp(lp.x, -b.h[0], b.h[0]), clamp(lp.y, -b.h[1], b.h[1]), clamp(lp.z, -b.h[2], b.h[2]));
        if (cp.equals(lp)) {                                  // střed uvnitř: vytlač po nejmělčí ose
          const ex = b.h[0] - Math.abs(lp.x), ey = b.h[1] - Math.abs(lp.y), ez = b.h[2] - Math.abs(lp.z);
          if (ex < ey && ex < ez) cp.x = Math.sign(lp.x) * b.h[0]; else if (ey < ez) cp.y = Math.sign(lp.y) * b.h[1]; else cp.z = Math.sign(lp.z) * b.h[2];
          cp.applyMatrix4(b.m); d.subVectors(cp, c);
          out.normal.copy(d).normalize(); out.depth = d.length() + r; best = out; continue;
        }
        cp.applyMatrix4(b.m); d.subVectors(c, cp);            // nejbližší bod zpět do světa
        const dist2 = d.lengthSq();
        if (dist2 < r * r) {
          const dist = Math.sqrt(dist2), depth = r - dist;
          if (!best || depth > best.depth) { out.normal.copy(d).divideScalar(dist || 1); out.depth = depth; best = out; }
        }
      }
      return best;
    });
  }
};
