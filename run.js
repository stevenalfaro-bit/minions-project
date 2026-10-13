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
const LANES = [-2.2, 0, 2.2];
const scoreEl = document.getElementById("score");
const bestEl = document.getElementById("best");
const overlay = document.getElementById("overlay");
const titleEl = document.getElementById("title");
const textEl = document.getElementById("text");
const startBtn = document.getElementById("start");

let best = Number(localStorage.getItem("minionRunBestM") || 0);
bestEl.textContent = best;

// Renderer, camera, fog, lighting
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
renderer.setSize(innerWidth, innerHeight);
renderer.shadowMap.enabled = false;
document.body.appendChild(renderer.domElement);

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x0b1430);
scene.fog = new THREE.Fog(0x0b1430, 40, 260);

const camera = new THREE.PerspectiveCamera(70, innerWidth / innerHeight, 0.1, 500);
const EYE_Y = 1.7;

scene.add(new THREE.HemisphereLight(0x8fb4ff, 0x1a1a2e, 0.6));
const moon = new THREE.DirectionalLight(0xbfd6ff, 0.8);
moon.position.set(-30, 60, 20);
scene.add(moon);

// Road and sidewalks
const road = new THREE.Mesh(
  new THREE.PlaneGeometry(12, 1000),
  new THREE.MeshStandardMaterial({ color: 0x1b1f2a, roughness: 0.9 })
);
road.rotation.x = -Math.PI / 2;
road.position.z = -400;
scene.add(road);

const sidewalkMat = new THREE.MeshStandardMaterial({ color: 0x3a3f4f });
for (const side of [-1, 1]) {
  const walk = new THREE.Mesh(new THREE.BoxGeometry(6, 0.3, 1000), sidewalkMat);
  walk.position.set(side * 9, 0.15, -400);
  scene.add(walk);
}

// Lane stripes (glowing)
const stripeMat = new THREE.MeshBasicMaterial({ color: 0xf9d93d });
const stripes = [];
for (let i = 0; i < 60; i++) {
  for (const x of [-1.1, 1.1]) {
    const s = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.02, 3), stripeMat);
    s.position.set(x, 0.02, -i * 8);
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
// Buildings: glass towers with emissive window strips
const towerMats = [0x1e2a44, 0x243352, 0x1a2338, 0x2b3a5c];
const neonColors = [0x00e5ff, 0xff3da5, 0xf9d93d, 0x7cff6b];
const buildings = [];

function makeBuilding(z, side) {
  const h = 30 + Math.random() * 120;
  const w = 8 + Math.random() * 10;
  const d = 10 + Math.random() * 12;
  const group = new THREE.Group();
  const body = new THREE.Mesh(
    new THREE.BoxGeometry(w, h, d),
    new THREE.MeshStandardMaterial({
      color: towerMats[Math.floor(Math.random() * towerMats.length)],
      metalness: 0.6,
      roughness: 0.3,
    })
  );
  body.position.y = h / 2;
  group.add(body);
  const stripe = new THREE.Mesh(
    new THREE.BoxGeometry(w + 0.05, 0.4, d + 0.05),
    new THREE.MeshBasicMaterial({ color: 0xbfe9ff })
  );
  for (let y = 4; y < h; y += 6) {
    const band = stripe.clone();
    band.scale.set(1, 0.25, 1);
    band.position.y = y;
    group.add(band);
  }
  const sign = new THREE.Mesh(
    new THREE.BoxGeometry(0.2, 2.5, 3),
    new THREE.MeshBasicMaterial({ color: neonColors[Math.floor(Math.random() * neonColors.length)] })
  );
  sign.position.set(-side * (w / 2 + 0.1), 8 + Math.random() * 20, 0);
  group.add(sign);
  group.position.set(side * (14 + Math.random() * 6), 0, z);
  scene.add(group);
  return group;
}

for (let i = 0; i < 40; i++) {
  for (const side of [-1, 1]) buildings.push(makeBuilding(-i * 14, side));
}

// Obstacles: barriers (ground) and hover drones (air)
const obstacles = [];
const barrierMat = new THREE.MeshStandardMaterial({ color: 0xf6bf2d, emissive: 0x402a00 });
const droneMat = new THREE.MeshBasicMaterial({ color: 0xff3da5 });

function spawnObstacle(z) {
  const lane = LANES[Math.floor(Math.random() * LANES.length)];
  const isDrone = Math.random() < 0.4;
  let mesh;
  if (isDrone) {
    mesh = new THREE.Mesh(new THREE.SphereGeometry(0.7, 16, 12), droneMat);
    mesh.position.set(lane, 1.6 + Math.random() * 0.8, z);
    mesh.userData.kind = "drone";
  } else {
    mesh = new THREE.Mesh(new THREE.BoxGeometry(1.8, 1.1, 0.6), barrierMat);
    mesh.position.set(lane, 0.55, z);
    mesh.userData.kind = "barrier";
  }
  mesh.userData.lane = lane;
  scene.add(mesh);
  obstacles.push(mesh);
}

// Flying hover traffic lanes (decorative)
const hovers = [];
const hoverMat = new THREE.MeshBasicMaterial({ color: 0x00e5ff });
for (let i = 0; i < 14; i++) {
  const h = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.5, 1.2), hoverMat);
  h.position.set((Math.random() - 0.5) * 30, 14 + Math.random() * 16, -Math.random() * 200);
  h.userData.speed = 1 + Math.random() * 2;
  scene.add(h);
  hovers.push(h);
}

// Game state
const state = { mode: "ready", distance: 0, speed: 0.6, lane: 1, targetX: 0, y: 0, vy: 0, slideT: 0, spawnZ: -40 };
let lastT = performance.now();
let runnerZ = 0;

function reset() {
  for (const o of obstacles) scene.remove(o);
  obstacles.length = 0;
  Object.assign(state, { distance: 0, speed: 0.6, lane: 1, targetX: 0, y: 0, vy: 0, slideT: 0, spawnZ: -40 });
  runnerZ = 0;
  camera.position.set(0, EYE_Y, 0);
  scoreEl.textContent = "0";
}

function start() {
  reset();
  state.mode = "running";
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
  state.mode = "over";
  const d = Math.floor(state.distance);
  if (d > best) {
    best = d;
    localStorage.setItem("minionRunBestM", String(best));
    bestEl.textContent = best;
  }
  titleEl.textContent = "Crashed!";
  textEl.textContent = `You ran ${d} m. Press R, Enter, or click to run again.`;
  startBtn.textContent = "Run again";
  overlay.classList.remove("hidden");
}

// Controls: keys, swipe
function changeLane(dir) {
  state.lane = Math.min(2, Math.max(0, state.lane + dir));
}
addEventListener("keydown", (e) => {
  if (state.mode !== "running") {
    if (e.key === "Enter" || e.key === "r" || e.key === "R" || e.key === " ") start();
    return;
  }
  if (e.key === "ArrowLeft" || e.key === "a" || e.key === "A") changeLane(-1);
  else if (e.key === "ArrowRight" || e.key === "d" || e.key === "D") changeLane(1);
  else if (e.key === " " || e.key === "ArrowUp" || e.key === "w" || e.key === "W") jump();
  else if (e.key === "ArrowDown" || e.key === "s" || e.key === "S") slide();
});

function jump() {
  if (state.y <= 0.001 && state.slideT <= 0) state.vy = 7.5;
}
function slide() {
  if (state.y <= 0.001) state.slideT = 0.6;
}

let touchX = null;
let touchY = null;
addEventListener("touchstart", (e) => {
  touchX = e.touches[0].clientX;
  touchY = e.touches[0].clientY;
});
addEventListener("touchend", (e) => {
  if (touchX === null) return;
  const dx = e.changedTouches[0].clientX - touchX;
  const dy = e.changedTouches[0].clientY - touchY;
  touchX = null;
  if (state.mode !== "running") return start();
  if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 30) changeLane(dx > 0 ? 1 : -1);
  else if (dy < -30) jump();
  else if (dy > 30) slide();
});
startBtn.addEventListener("click", start);
addEventListener("resize", () => {
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(innerWidth, innerHeight);
});

// Main loop
function frame(now) {
  requestAnimationFrame(frame);
  const dt = Math.min((now - lastT) / 1000, 0.05);
  lastT = now;

  if (state.mode === "running") {
    state.speed = Math.min(2.2, state.speed + dt * 0.02);
    const step = state.speed * 60 * dt;
    runnerZ -= step;
    state.distance += step;
    scoreEl.textContent = Math.floor(state.distance);

    state.vy -= 22 * dt;
    state.y = Math.max(0, state.y + state.vy * dt);
    if (state.y === 0) state.vy = 0;
    state.slideT = Math.max(0, state.slideT - dt);

    state.targetX = LANES[state.lane];
    camera.position.x += (state.targetX - camera.position.x) * Math.min(1, dt * 12);
    camera.position.y = EYE_Y + state.y - (state.slideT > 0 ? 0.9 : 0);
    camera.position.z = runnerZ;

    // Spawn obstacles ahead
    while (state.spawnZ > runnerZ - 120) {
      state.spawnZ -= 12 + Math.random() * 18;
      spawnObstacle(state.spawnZ);
    }

    // Collision
    for (let i = obstacles.length - 1; i >= 0; i--) {
      const o = obstacles[i];
      if (o.position.z > runnerZ + 2) {
        scene.remove(o);
        obstacles.splice(i, 1);
        continue;
      }
      const dz = Math.abs(o.position.z - runnerZ);
      const dx = Math.abs(o.userData.lane - camera.position.x);
      if (dz < 1.1 && dx < 1.0) {
        const isDrone = o.userData.kind === "drone";
        const clearedDrone = isDrone && state.y > 1.6;
        const clearedBarrier = !isDrone && state.y > 1.2;
        const duckedDrone = isDrone && state.slideT > 0 && state.y <= 0.001;
        if (!(clearedDrone || clearedBarrier || duckedDrone)) return die();
      }
    }
  }

  // Keep the city streaming past the runner
  for (const b of buildings) {
    if (b.position.z > runnerZ + 20) b.position.z -= 40 * 14;
  }
  for (const s of stripes) {
    if (s.position.z > runnerZ + 10) s.position.z -= 480;
  }
  for (const h of hovers) {
    h.position.z += h.userData.speed * 0.2;
    if (h.position.z > runnerZ + 20) h.position.z = runnerZ - 200;
  }

  renderer.render(scene, camera);
}

renderer.setAnimationLoop(null);
requestAnimationFrame(frame);

