import * as THREE from "three";

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

