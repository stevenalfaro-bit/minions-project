import * as THREE from "three";

// ---------- constants ----------
const LANES = [-2.4, 0, 2.4];
const GRAVITY = 20;
const JUMP_V = 7.5;
const SLIDE_TIME = 0.8;
const STAND_H = 1.8;
const SLIDE_H = 0.9;
const SPAWN_Z = -140;

// ---------- DOM ----------
const $ = (id) => document.getElementById(id);
const scoreEl = $("score");
const bestEl = $("best");
const overlay = $("overlay");
const titleEl = $("title");
const textEl = $("text");

let best = Number(localStorage.getItem("minionRunBest") || 0);
bestEl.textContent = Math.floor(best);

// ---------- renderer / scene ----------
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
$("stage").appendChild(renderer.domElement);

const scene = new THREE.Scene();
scene.fog = new THREE.Fog(0x1d2748, 30, 190);

const camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 0.1, 400);
camera.position.set(0, 1.6, 0);

scene.add(new THREE.HemisphereLight(0x9fb8ff, 0x222233, 0.9));
const moon = new THREE.DirectionalLight(0xbfd4ff, 0.7);
moon.position.set(-30, 60, 20);
scene.add(moon);

// gradient sky dome that follows the camera
const sky = new THREE.Mesh(
  new THREE.SphereGeometry(300, 24, 16),
  new THREE.ShaderMaterial({
    side: THREE.BackSide,
    depthWrite: false,
    vertexShader: `
      varying vec3 vP;
      void main() { vP = position; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
    fragmentShader: `
      varying vec3 vP;
      void main() {
        float h = normalize(vP).y;
        vec3 top = vec3(0.03, 0.05, 0.14);
        vec3 horizon = vec3(0.85, 0.42, 0.3);
        gl_FragColor = vec4(mix(horizon, top, smoothstep(-0.05, 0.45, h)), 1.0);
      }`,
  })
);
scene.add(sky);

// ground and road
const ground = new THREE.Mesh(
  new THREE.PlaneGeometry(400, 1000),
  new THREE.MeshStandardMaterial({ color: 0x1a1f2e, roughness: 0.95 })
);
ground.rotation.x = -Math.PI / 2;
ground.position.z = -400;
scene.add(ground);

const road = new THREE.Mesh(
  new THREE.PlaneGeometry(13, 1000),
  new THREE.MeshStandardMaterial({ color: 0x262b3a, roughness: 0.6, metalness: 0.2 })
);
road.rotation.x = -Math.PI / 2;
road.position.set(0, 0.01, -400);
scene.add(road);

// glowing lane dividers that scroll toward the camera
const stripeGeo = new THREE.BoxGeometry(0.12, 0.02, 4);
const stripeMat = new THREE.MeshStandardMaterial({ color: 0x7fe7ff, emissive: 0x7fe7ff, emissiveIntensity: 1.2 });
const stripes = [];
for (let i = 0; i < 30; i++) {
  for (const x of [-1.2, 1.2]) {
    const s = new THREE.Mesh(stripeGeo, stripeMat);
    s.position.set(x, 0.03, -i * 10);
    scene.add(s);
    stripes.push(s);
  }
}

// ---------- city ----------
function makeWindowTexture(seed) {
  const c = document.createElement("canvas");
  c.width = c.height = 256;
  const g = c.getContext("2d");
  g.fillStyle = "#0d1426";
  g.fillRect(0, 0, 256, 256);
  let s = seed;
  const rnd = () => (s = (s * 16807) % 2147483647) / 2147483647;
  for (let r = 0; r < 8; r++) {
    for (let k = 0; k < 4; k++) {
      if (rnd() > 0.45) {
        g.fillStyle = rnd() > 0.5 ? "#ffe9a8" : "#7fe7ff";
        g.fillRect(k * 64 + 14, r * 32 + 10, 36, 14);
      }
    }
  }
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

const towerMats = [7, 42, 99].flatMap((seed) => {
  const map = makeWindowTexture(seed);
  return [0x9aa8c7, 0x6f86b8, 0xc9d2e6].map(
    (color) =>
      new THREE.MeshStandardMaterial({
        color,
        map,
        emissive: 0xffffff,
        emissiveMap: map,
        emissiveIntensity: 0.7,
        roughness: 0.4,
        metalness: 0.3,
      })
  );
});

const buildings = [];
for (const side of [-1, 1]) {
  for (let i = 0; i < 14; i++) {
    const w = 8 + Math.random() * 6;
    const d = 9 + Math.random() * 5;
    const h = 18 + Math.random() * Math.random() * 90;
    const m = new THREE.Mesh(
      new THREE.BoxGeometry(w, h, d),
      towerMats[(Math.random() * towerMats.length) | 0]
    );
    m.position.set(side * (12 + w / 2 + Math.random() * 3), h / 2, 10 - i * 20);
    scene.add(m);
    buildings.push(m);
  }
}

// flying light streaks in the sky lanes
const streaks = [];
const streakGeo = new THREE.BoxGeometry(0.1, 0.1, 6);
const streakMat = new THREE.MeshStandardMaterial({ color: 0xff9fe0, emissive: 0xff9fe0, emissiveIntensity: 1.5 });
for (let i = 0; i < 24; i++) {
  const s = new THREE.Mesh(streakGeo, streakMat);
  s.position.set((Math.random() - 0.5) * 60, 6 + Math.random() * 10, -Math.random() * 200);
  scene.add(s);
  streaks.push(s);
}

// ---------- obstacles ----------
const barrierGeo = new THREE.BoxGeometry(2.0, 0.8, 0.6);
const barrierMat = new THREE.MeshStandardMaterial({ color: 0xff7a1a, emissive: 0x552200 });
const gateGeo = new THREE.BoxGeometry(2.2, 1.4, 0.3);
const gateMat = new THREE.MeshStandardMaterial({ color: 0x35f2ff, emissive: 0x0a4a55, transparent: true, opacity: 0.8 });
const obstacles = [];

function spawnObstacle() {
  const lane = (Math.random() * 3) | 0;
  const gate = Math.random() < 0.4; // gates: slide under. barriers: jump over.
  const mesh = new THREE.Mesh(gate ? gateGeo : barrierGeo, gate ? gateMat : barrierMat);
  mesh.position.set(LANES[lane], gate ? 1.85 : 0.4, SPAWN_Z);
  scene.add(mesh);
  obstacles.push({ mesh, lane, bottom: gate ? 1.15 : 0, top: gate ? 2.55 : 0.8 });
}

// ---------- game state ----------
let state = "ready";
let laneIdx = 1;
let feetY = 0;
let vy = 0;
let sliding = 0;
let dist = 0;
let speed = 14;
let spawnT = 1;
let time = 0;

function showOverlay(title, text) {
  titleEl.textContent = title;
  textEl.textContent = text;
  overlay.classList.remove("hidden");
}

function start() {
  for (const o of obstacles) scene.remove(o.mesh);
  obstacles.length = 0;
  laneIdx = 1;
  feetY = 0;
  vy = 0;
  sliding = 0;
  dist = 0;
  speed = 14;
  spawnT = 1;
  state = "running";
  overlay.classList.add("hidden");
}

function die() {
  state = "over";
  const score = Math.floor(dist);
  if (score > best) {
    best = score;
    localStorage.setItem("minionRunBest", String(best));
    bestEl.textContent = best;
  }
  showOverlay("Wiped out!", `Distance ${score}. Press Enter, Space, or tap to run again.`);
}

function jump() {
  if (state === "running" && feetY <= 0) {
    vy = JUMP_V;
    sliding = 0;
  }
}

function slide() {
  if (state === "running" && feetY <= 0) sliding = SLIDE_TIME;
}

// ---------- input ----------
window.addEventListener("keydown", (e) => {
  if (["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown", "Space"].includes(e.code)) e.preventDefault();

  if (state !== "running") {
    if (e.code === "Enter" || e.code === "Space" || e.code === "ArrowUp") start();
    return;
  }

  switch (e.code) {
    case "ArrowLeft":
    case "KeyA":
      laneIdx = Math.max(0, laneIdx - 1);
      break;
    case "ArrowRight":
    case "KeyD":
      laneIdx = Math.min(2, laneIdx + 1);
      break;
    case "Space":
    case "ArrowUp":
    case "KeyW":
      jump();
      break;
    case "ArrowDown":
    case "KeyS":
      slide();
      break;
  }
});

// tap/click: start, or jump while running
window.addEventListener("pointerdown", () => {
  if (state === "running") jump();
  else start();
});

// ---------- loop ----------
function update(dt) {
  time += dt;
  const running = state === "running";

  if (running) {
    dist += speed * dt;
    speed = Math.min(40, 14 + dist * 0.02);
    scoreEl.textContent = Math.floor(dist);

    // jump physics
    vy -= GRAVITY * dt;
    feetY += vy * dt;
    if (feetY <= 0) {
      feetY = 0;
      vy = 0;
    }
    if (sliding > 0) sliding -= dt;

    // spawn
    spawnT -= dt;
    if (spawnT <= 0) {
      spawnObstacle();
      spawnT = 0.9 + Math.random() * 0.9;
    }

    // move obstacles and check collisions
    const pBottom = feetY;
    const pTop = feetY + (sliding > 0 ? SLIDE_H : STAND_H);
    for (let i = obstacles.length - 1; i >= 0; i--) {
      const o = obstacles[i];
      o.mesh.position.z += speed * dt;
      const z = o.mesh.position.z;
      if (o.lane === laneIdx && Math.abs(z) < 0.85 && pBottom < o.top && pTop > o.bottom) {
        die();
        break;
      }
      if (z > 5) {
        scene.remove(o.mesh);
        obstacles.splice(i, 1);
      }
    }
  }

  // ambient world drift (slow when not running)
  const drift = running ? speed : 4;
  for (const b of buildings) {
    b.position.z += drift * dt;
    if (b.position.z > 30) b.position.z -= 280;
  }
  for (const s of stripes) {
    s.position.z += drift * dt;
    if (s.position.z > 10) s.position.z -= 300;
  }
  for (const s of streaks) {
    s.position.z += drift * 1.6 * dt;
    if (s.position.z > 10) {
      s.position.z -= 220;
      s.position.x = (Math.random() - 0.5) * 60;
    }
  }

  // camera: lane smoothing, slide height, slight bob
  const eyeBase = sliding > 0 ? 0.9 : 1.6;
  camera.position.x += (LANES[laneIdx] - camera.position.x) * Math.min(1, dt * 12);
  camera.position.y = feetY + eyeBase + (feetY <= 0 && running ? Math.sin(time * 12) * 0.03 : 0);
  camera.lookAt(camera.position.x * 0.5, camera.position.y - 0.25, -12);
  sky.position.copy(camera.position);
}

let last = performance.now();
function frame(now) {
  const dt = Math.min(0.05, (now - last) / 1000);
  last = now;
  update(dt);
  renderer.render(scene, camera);
  requestAnimationFrame(frame);
}

window.addEventListener("resize", () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

showOverlay("Minion Run 3D", "Click or press Space to start. A/D or arrows change lanes, Space jumps, S slides.");
requestAnimationFrame(frame);

