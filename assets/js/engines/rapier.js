// Rapier: rigid-body engine v Rustu zkompilovaný do WebAssembly.
import { STATIC, G } from '../static-world.js';

export default {
  name: 'Rapier', kind: 'WASM · Rust', color: '#D9772B', boxes: true,
  info: {
    what: 'Plnohodnotný rigid-body engine zkompilovaný z Rustu do WebAssembly.',
    broad: 'BVH broadphase, narrowphase přes GJK/EPA a kontaktní manifoldy',
    dyn: 'Koule i kvádry, rotace, tření, spánek těles, CCD u střel',
    note: 'Všimni si stabilních hromad kvádrů a nízkého času kroku i při stovkách těles.'
  },
  async create() {
    const mod = await import('../../vendor/rapier/rapier.es.js');
    const R = mod.default ?? mod;
    await R.init();
    const world = new R.World({ x: 0, y: -G, z: 0 });
    world.timestep = 1 / 60;
    for (const s of STATIC) {
      world.createCollider(R.ColliderDesc.cuboid(...s.h).setTranslation(...s.p)
        .setRotation({ x: s.q.x, y: s.q.y, z: s.q.z, w: s.q.w }).setFriction(0.7));
    }
    const bodies = [];
    return {
      add(kind, p, v, size, fast) {
        const d = R.RigidBodyDesc.dynamic().setTranslation(p.x, p.y, p.z).setLinvel(v.x, v.y, v.z).setCcdEnabled(!!fast);
        const b = world.createRigidBody(d);
        const c = kind === 'sphere' ? R.ColliderDesc.ball(size) : R.ColliderDesc.cuboid(size / 2, size / 2, size / 2);
        world.createCollider(c.setRestitution(0.35).setFriction(0.6), b);
        bodies.push(b); return bodies.length - 1;
      },
      step() { world.step(); },
      read(i, pos, q) { const t = bodies[i].translation(), r = bodies[i].rotation(); pos.set(t.x, t.y, t.z); q.set(r.x, r.y, r.z, r.w); },
      dispose() { world.free(); }
    };
  }
};
