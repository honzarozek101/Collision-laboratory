// cannon-es: rigid-body engine v čistém JavaScriptu.
import { STATIC, G } from '../static-world.js';

export default {
  name: 'cannon-es', kind: 'čistý JavaScript', color: '#2E9A8A', boxes: true,
  info: {
    what: 'Rigid-body engine napsaný celý v JavaScriptu, bez WebAssembly.',
    broad: 'SAP broadphase (sweep and prune), iterativní Gauss-Seidel solver',
    dyn: 'Koule i kvádry, rotace, tření, spánek těles, bez CCD',
    note: 'Při zátěžovém testu porovnej čas kroku s Rapierem. Rychlé střely mohou proletět tenkými deskami, protože engine nemá CCD.'
  },
  async create() {
    const C = await import('../../vendor/cannon-es/cannon-es.js');
    const world = new C.World({ gravity: new C.Vec3(0, -G, 0) });
    world.broadphase = new C.SAPBroadphase(world);
    world.allowSleep = true;
    world.defaultContactMaterial.friction = 0.4;
    world.defaultContactMaterial.restitution = 0.3;
    for (const s of STATIC) {
      const b = new C.Body({ mass: 0, shape: new C.Box(new C.Vec3(...s.h)) });
      b.position.set(...s.p); b.quaternion.set(s.q.x, s.q.y, s.q.z, s.q.w);
      world.addBody(b);
    }
    const bodies = [];
    return {
      add(kind, p, v, size) {
        const shape = kind === 'sphere' ? new C.Sphere(size) : new C.Box(new C.Vec3(size / 2, size / 2, size / 2));
        const b = new C.Body({ mass: 1, shape, position: new C.Vec3(p.x, p.y, p.z), velocity: new C.Vec3(v.x, v.y, v.z) });
        b.linearDamping = 0.01; b.angularDamping = 0.05; b.sleepSpeedLimit = 0.15;
        world.addBody(b); bodies.push(b); return bodies.length - 1;
      },
      step(dt) { world.step(dt); },
      read(i, pos, q) { const b = bodies[i]; pos.set(b.position.x, b.position.y, b.position.z); q.set(b.quaternion.x, b.quaternion.y, b.quaternion.z, b.quaternion.w); },
      dispose() {}
    };
  }
};
