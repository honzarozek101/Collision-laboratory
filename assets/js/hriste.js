// Hřiště: scéna, ovládání a hlavní smyčka.
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { STATIC } from './static-world.js';
import { ENGINES } from './engines/index.js';

const MAX = 900;

/* ---------- Scene ---------- */
const canvas = document.getElementById('c');
const vp = document.getElementById('viewport');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x1B2027);
scene.fog = new THREE.Fog(0x1B2027, 45, 90);
const camera = new THREE.PerspectiveCamera(50, 1.6, 0.1, 200);
camera.position.set(22, 18, 26);
const controls = new OrbitControls(camera, canvas);
controls.target.set(0, 2, 0);
controls.enableDamping = true;
controls.maxPolarAngle = Math.PI * 0.49;

scene.add(new THREE.HemisphereLight(0xcfd8ff, 0x2a2420, 1.1));
const sun = new THREE.DirectionalLight(0xffffff, 2.2);
sun.position.set(14, 26, 10);
sun.castShadow = true;
sun.shadow.mapSize.set(2048, 2048);
Object.assign(sun.shadow.camera, { left: -24, right: 24, top: 24, bottom: -24, near: 1, far: 70 });
scene.add(sun);

const staticGroup = new THREE.Group();
const matGround = new THREE.MeshStandardMaterial({ color: 0x39414C, roughness: 0.95 });
const matStatic = new THREE.MeshStandardMaterial({ color: 0x5B6674, roughness: 0.8 });
for (const s of STATIC) {
  const m = new THREE.Mesh(new THREE.BoxGeometry(s.h[0] * 2, s.h[1] * 2, s.h[2] * 2), s.ground ? matGround : matStatic);
  m.position.set(...s.p); m.quaternion.copy(s.q);
  m.castShadow = !s.ground; m.receiveShadow = true;
  staticGroup.add(m);
}
const grid = new THREE.GridHelper(40, 20, 0x4A5462, 0x424B57);
grid.position.y = 0.01; staticGroup.add(grid);
scene.add(staticGroup);
staticGroup.updateMatrixWorld(true);

// Dynamic instanced meshes
const sphereMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.45, metalness: 0.05 });
const boxMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.6 });
const spheresIM = new THREE.InstancedMesh(new THREE.IcosahedronGeometry(1, 3), sphereMat, MAX);
const boxesIM = new THREE.InstancedMesh(new THREE.BoxGeometry(1, 1, 1), boxMat, MAX);
for (const im of [spheresIM, boxesIM]) { im.castShadow = true; im.receiveShadow = true; im.count = 0; im.instanceMatrix.setUsage(THREE.DynamicDrawUsage); scene.add(im); }

/* ---------- State ---------- */
let engineKey = 'rapier', engine = null, loading = false, token = 0;
let bodies = []; // {kind, size, id, im, slot}
const statusEl = document.getElementById('status');
function status(msg) { statusEl.hidden = !msg; statusEl.textContent = msg || ''; }

let seed = 1;
function rnd() { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; }

const col = new THREE.Color();
function addBody(kind, p, v, size, fast) {
  if (!engine || bodies.length >= MAX) return;
  if (kind === 'box' && !ENGINES[engineKey].boxes) return;
  const id = engine.add(kind, p, v, size, fast);
  const im = kind === 'sphere' ? spheresIM : boxesIM;
  const slot = im.count++;
  col.set(ENGINES[engineKey].color).offsetHSL((rnd() - 0.5) * 0.06, 0, (rnd() - 0.5) * 0.22);
  im.setColorAt(slot, col); im.instanceColor.needsUpdate = true;
  bodies.push({ kind, size, id, im, slot });
}
function rain(n, kind) {
  for (let i = 0; i < n; i++) {
    const p = new THREE.Vector3((rnd() - 0.5) * 30, 10 + rnd() * 14, (rnd() - 0.5) * 30);
    const size = kind === 'sphere' ? 0.35 + rnd() * 0.35 : 0.7 + rnd() * 0.7;
    addBody(kind, p, new THREE.Vector3(0, 0, 0), size);
  }
}
function shoot() {
  const dir = new THREE.Vector3(); camera.getWorldDirection(dir);
  const p = camera.position.clone().addScaledVector(dir, 2);
  addBody('sphere', p, dir.multiplyScalar(32), 0.5, true);
}

async function setEngine(key, preset) {
  const my = ++token;
  engineKey = key; renderEngineButtons(); renderInfo();
  if (engine) engine.dispose();
  engine = null; bodies = []; spheresIM.count = 0; boxesIM.count = 0;
  loading = true; status('Načítám ' + ENGINES[key].name + '…');
  try {
    const e = await ENGINES[key].create();
    if (my !== token) { e.dispose(); return; }
    engine = e; status('');
    hist.length = 0; stepAvg = 0;
    if (preset === 'bench') { seed = 42; rain(400, 'sphere'); }
    else { seed = 7; rain(60, 'sphere'); if (ENGINES[key].boxes) rain(25, 'box'); }
  } catch (err) {
    if (my === token) status('Systém ' + ENGINES[key].name + ' se nepodařilo načíst: ' + (err && err.message || err));
    console.error(err);
  }
  loading = false; updateButtons();
}

/* ---------- UI ---------- */
const enginesEl = document.getElementById('engines');
function renderEngineButtons() {
  enginesEl.innerHTML = '';
  for (const [k, e] of Object.entries(ENGINES)) {
    const b = document.createElement('button');
    b.className = 'eng'; b.type = 'button'; b.id = 'eng-' + k;
    b.setAttribute('aria-pressed', String(k === engineKey));
    b.style.setProperty('--dot', e.color);
    b.innerHTML = `<span class="n"><i></i>${e.name}</span><span class="k">${e.kind}</span>`;
    b.onclick = () => { if (k !== engineKey) setEngine(k); };
    enginesEl.appendChild(b);
  }
}
function renderInfo() {
  const e = ENGINES[engineKey];
  document.getElementById('info').innerHTML = `
    <h3>${e.name}</h3>
    <p>${e.info.what}</p>
    <dl><dt>Hledání</dt><dd>${e.info.broad}</dd><dt>Umí</dt><dd>${e.info.dyn}</dd></dl>
    <p>${e.info.note}</p>`;
}
function updateButtons() {
  document.getElementById('b-boxes').disabled = !ENGINES[engineKey].boxes;
  document.getElementById('b-boxes').title = ENGINES[engineKey].boxes ? '' : 'Tento režim řeší jen koule';
}
document.getElementById('b-spheres').onclick = () => rain(50, 'sphere');
document.getElementById('b-boxes').onclick = () => rain(50, 'box');
document.getElementById('b-shoot').onclick = shoot;
document.getElementById('b-clear').onclick = () => setEngine(engineKey);
document.getElementById('b-bench').onclick = () => setEngine(engineKey, 'bench');
addEventListener('keydown', e => { if ((e.key === 'f' || e.key === 'F') && !e.repeat && !/INPUT|TEXTAREA/.test(document.activeElement.tagName)) shoot(); });

/* ---------- Loop ---------- */
const sparkC = document.getElementById('spark'), sctx = sparkC.getContext('2d');
const hist = [];
function drawSpark() {
  const w = sparkC.width, h = sparkC.height;
  sctx.clearRect(0, 0, w, h);
  const max = Math.max(4, ...hist) * 1.15;
  // 16.7 ms budget line
  const by = h - (16.7 / max) * h;
  if (by > 0) { sctx.strokeStyle = 'rgba(230,120,90,.6)'; sctx.setLineDash([6, 6]); sctx.beginPath(); sctx.moveTo(0, by); sctx.lineTo(w, by); sctx.stroke(); sctx.setLineDash([]); }
  sctx.beginPath();
  hist.forEach((v, i) => { const x = (i / 119) * w, y = h - (v / max) * h; i ? sctx.lineTo(x, y) : sctx.moveTo(x, y); });
  sctx.strokeStyle = ENGINES[engineKey].color; sctx.lineWidth = 2.5; sctx.stroke();
  sctx.lineTo(((hist.length - 1) / 119) * w, h); sctx.lineTo(0, h); sctx.closePath();
  sctx.globalAlpha = 0.18; sctx.fillStyle = ENGINES[engineKey].color; sctx.fill(); sctx.globalAlpha = 1;
  sctx.fillStyle = '#AEB6C1'; sctx.font = '20px JetBrains Mono, monospace'; sctx.fillText(max.toFixed(1) + ' ms', 6, 22);
}

function resize() {
  const r = vp.getBoundingClientRect();
  renderer.setSize(r.width, r.height, false);
  camera.aspect = r.width / r.height; camera.updateProjectionMatrix();
}
new ResizeObserver(resize).observe(vp);

const pos = new THREE.Vector3(), quat = new THREE.Quaternion(), scl = new THREE.Vector3(), mtx = new THREE.Matrix4();
let last = performance.now(), acc = 0, frames = 0, fpsT = last, stepAvg = 0;
const DT = 1 / 60;
function loop(now) {
  requestAnimationFrame(loop);
  const dt = Math.min(0.1, (now - last) / 1000); last = now;
  controls.update();
  if (engine) {
    acc += dt; let steps = 0; const t0 = performance.now();
    while (acc >= DT && steps < 3) { engine.step(DT); acc -= DT; steps++; }
    if (steps === 3) acc = 0;
    const ms = steps ? (performance.now() - t0) / steps : null;
    if (ms != null) { stepAvg = stepAvg * 0.9 + ms * 0.1; hist.push(ms); if (hist.length > 120) hist.shift(); }
    for (let i = bodies.length - 1; i >= 0; i--) {
      const b = bodies[i];
      engine.read(b.id, pos, quat);
      if (pos.y < -30) pos.set(0, -999, 0);
      scl.setScalar(b.kind === 'sphere' ? b.size : b.size);
      mtx.compose(pos, quat, scl); b.im.setMatrixAt(b.slot, mtx);
    }
    spheresIM.instanceMatrix.needsUpdate = true; boxesIM.instanceMatrix.needsUpdate = true;
    spheresIM.computeBoundingSphere(); boxesIM.computeBoundingSphere();
  }
  renderer.render(scene, camera);
  frames++;
  if (now - fpsT > 500) {
    document.getElementById('fps').textContent = Math.round(frames * 1000 / (now - fpsT));
    document.getElementById('stepms').textContent = engine ? stepAvg.toFixed(2) : '–';
    document.getElementById('count').textContent = bodies.length;
    frames = 0; fpsT = now; drawSpark();
  }
}
renderEngineButtons(); renderInfo(); updateButtons(); resize();
setEngine('rapier');
requestAnimationFrame(loop);
