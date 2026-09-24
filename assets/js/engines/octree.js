// Octree z three/addons: akcelerace kolizí koulí se statickými trojúhelníky.
import * as THREE from 'three';
import { STATIC } from '../static-world.js';
import { makeSphereSim } from './sphere-sim.js';

export default {
  name: 'Octree', kind: 'three.js addon', color: '#7A5FD0', boxes: false,
  info: {
    what: 'Třída Octree z three/addons rozdělí trojúhelníky statického světa do stromu. Dynamiku (gravitaci, odraz) píše sám programátor, přesně jako v demu games_fps.',
    broad: 'Octree nad trojúhelníky světa; koule proti sobě naivně každá s každou (n²)',
    dyn: 'Jen koule, bez rotace a tření, 5 podkroků na snímek',
    note: 'Proti statickému světu je to rychlé, ale párové kolize koulí rostou kvadraticky. Při 400 koulích uvidíš, jak čas kroku vyletí.'
  },
  async create() {
    const { Octree } = await import('three/addons/math/Octree.js');
    const oct = new Octree();
    const tmp = new THREE.Group();
    for (const s of STATIC) {
      const m = new THREE.Mesh(new THREE.BoxGeometry(s.h[0] * 2, s.h[1] * 2, s.h[2] * 2));
      m.position.set(...s.p); m.quaternion.copy(s.q); tmp.add(m);
    }
    tmp.updateMatrixWorld(true);
    oct.fromGraphNode(tmp);
    const sph = new THREE.Sphere();
    return makeSphereSim((c, r) => { sph.set(c, r); return oct.sphereIntersect(sph); });
  }
};
