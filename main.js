import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';

const canvas = document.querySelector('#scene');

const renderer = new THREE.WebGLRenderer({
  canvas,
  antialias: true,
  alpha: false,
  powerPreference: 'high-performance'
});
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 0.78;
renderer.setClearColor(0x000000, 1);

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x000000);

const camera = new THREE.PerspectiveCamera(36, 1, 0.1, 100);
camera.position.set(0, 0.08, 7.8);

// Neutral environment is used only for crystal reflections. The page itself stays pure black.
const pmrem = new THREE.PMREMGenerator(renderer);
const room = new RoomEnvironment(renderer);
scene.environment = pmrem.fromScene(room, 0.02).texture;
room.dispose();
pmrem.dispose();

const composer = new EffectComposer(renderer);
composer.addPass(new RenderPass(scene, camera));
const bloom = new UnrealBloomPass(new THREE.Vector2(1, 1), 0.30, 0.34, 1.05);
composer.addPass(bloom);

const pill = new THREE.Group();
scene.add(pill);

// Faceted crystal capsule.
const bodyGeometry = new THREE.CapsuleGeometry(1.05, 2.35, 12, 24);
bodyGeometry.rotateZ(Math.PI / 2);

const diamondMaterial = new THREE.MeshPhysicalMaterial({
  color: 0xffffff,
  metalness: 0,
  roughness: 0.025,
  transmission: 1,
  thickness: 1.25,
  ior: 2.35,
  clearcoat: 1,
  clearcoatRoughness: 0.015,
  envMapIntensity: 1.65,
  iridescence: 0.72,
  iridescenceIOR: 1.32,
  iridescenceThicknessRange: [110, 520],
  dispersion: 0.42,
  transparent: true,
  opacity: 0.98,
  flatShading: true
});

const body = new THREE.Mesh(bodyGeometry, diamondMaterial);
pill.add(body);

// Thin crystalline seam.
const ringGeometry = new THREE.TorusGeometry(1.055, 0.026, 10, 56);
ringGeometry.rotateY(Math.PI / 2);
const ringMaterial = new THREE.MeshPhysicalMaterial({
  color: 0xffffff,
  metalness: 0.12,
  roughness: 0.025,
  transmission: 0.75,
  thickness: 0.18,
  ior: 2.0,
  clearcoat: 1,
  clearcoatRoughness: 0.015,
  envMapIntensity: 1.8
});
pill.add(new THREE.Mesh(ringGeometry, ringMaterial));

// Very faint internal color so the crystal never becomes a flat dark silhouette.
const coreGeometry = new THREE.CapsuleGeometry(0.53, 1.70, 10, 20);
coreGeometry.rotateZ(Math.PI / 2);
const coreMaterial = new THREE.MeshBasicMaterial({
  color: 0xb9e8ff,
  transparent: true,
  opacity: 0.012,
  blending: THREE.AdditiveBlending,
  depthWrite: false
});
pill.add(new THREE.Mesh(coreGeometry, coreMaterial));

pill.rotation.set(-0.18, 0.34, -0.52);
pill.position.set(0, 0.03, 0);

// Controlled studio lighting. Kept deliberately below clipping so facets stay visible.
const keyLight = new THREE.PointLight(0xffffff, 34, 30, 1.8);
keyLight.position.set(4.6, 3.8, 5.5);
scene.add(keyLight);

const coolLight = new THREE.PointLight(0x8ecbff, 20, 26, 2.0);
coolLight.position.set(-4.6, -1.5, 4.0);
scene.add(coolLight);

const warmLight = new THREE.PointLight(0xffc07a, 16, 25, 2.0);
warmLight.position.set(1.7, -3.8, 3.2);
scene.add(warmLight);

const violetLight = new THREE.PointLight(0xb38cff, 12, 22, 2.0);
violetLight.position.set(-2.6, 3.0, 2.0);
scene.add(violetLight);

function makeSparkleTexture() {
  const c = document.createElement('canvas');
  c.width = c.height = 192;
  const ctx = c.getContext('2d');
  ctx.translate(96, 96);

  const radial = ctx.createRadialGradient(0, 0, 0, 0, 0, 30);
  radial.addColorStop(0, 'rgba(255,255,255,1)');
  radial.addColorStop(0.18, 'rgba(255,255,255,0.72)');
  radial.addColorStop(0.52, 'rgba(160,205,255,0.18)');
  radial.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = radial;
  ctx.beginPath();
  ctx.arc(0, 0, 30, 0, Math.PI * 2);
  ctx.fill();

  const line = ctx.createLinearGradient(-96, 0, 96, 0);
  line.addColorStop(0, 'rgba(255,255,255,0)');
  line.addColorStop(0.5, 'rgba(255,255,255,0.6)');
  line.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = line;
  ctx.fillRect(-96, -0.8, 192, 1.6);
  ctx.rotate(Math.PI / 2);
  ctx.fillRect(-96, -0.8, 192, 1.6);

  return new THREE.CanvasTexture(c);
}

const sparkleTexture = makeSparkleTexture();
const sparklePositions = [
  [-1.73, 0.55, 0.93],
  [1.72, 0.58, 0.84],
  [0.48, 1.05, 0.68],
  [-0.58, -0.76, 0.74]
];
const sparkles = sparklePositions.map((p, i) => {
  const material = new THREE.SpriteMaterial({
    map: sparkleTexture,
    color: 0xffffff,
    transparent: true,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    opacity: 0.32
  });
  const sprite = new THREE.Sprite(material);
  sprite.position.set(...p);
  const s = 0.15 + i * 0.012;
  sprite.scale.set(s, s, 1);
  pill.add(sprite);
  return sprite;
});

let pointerX = 0;
let pointerY = 0;
let targetX = 0;
let targetY = 0;

window.addEventListener('pointermove', (event) => {
  targetX = (event.clientX / window.innerWidth - 0.5) * 2;
  targetY = (event.clientY / window.innerHeight - 0.5) * 2;
}, { passive: true });

// Fit the entire pill on every screen, especially tall iPhone portrait viewports.
function resize() {
  const width = Math.max(1, window.innerWidth);
  const height = Math.max(1, window.innerHeight);
  const aspect = width / height;
  const dpr = Math.min(window.devicePixelRatio || 1, aspect < 0.8 ? 1.5 : 2);

  renderer.setPixelRatio(dpr);
  renderer.setSize(width, height, false);
  composer.setPixelRatio(dpr);
  composer.setSize(width, height);

  camera.aspect = aspect;

  if (aspect < 0.68) {
    // Tall phones: keep generous black negative space around the pill.
    camera.fov = 43;
    camera.position.z = 11.4;
    pill.scale.setScalar(0.80);
  } else if (aspect < 1.0) {
    camera.fov = 40;
    camera.position.z = 9.5;
    pill.scale.setScalar(0.88);
  } else if (aspect < 1.45) {
    camera.fov = 37;
    camera.position.z = 8.3;
    pill.scale.setScalar(0.96);
  } else {
    camera.fov = 35;
    camera.position.z = 7.7;
    pill.scale.setScalar(1.0);
  }

  camera.updateProjectionMatrix();
}

window.addEventListener('resize', resize, { passive: true });
window.addEventListener('orientationchange', () => setTimeout(resize, 120), { passive: true });
resize();

const clock = new THREE.Clock();

function animate() {
  const t = clock.getElapsedTime();

  pointerX += (targetX - pointerX) * 0.03;
  pointerY += (targetY - pointerY) * 0.03;

  pill.rotation.x = -0.18 + Math.sin(t * 0.34) * 0.045 + pointerY * 0.055;
  pill.rotation.y = 0.34 + t * 0.16 + pointerX * 0.085;
  pill.rotation.z = -0.52 + Math.sin(t * 0.23) * 0.055;
  pill.position.y = 0.03 + Math.sin(t * 0.72) * 0.085;

  // Small light movement gives diamond fire without washing the object out.
  keyLight.position.x = 4.6 + Math.sin(t * 0.55) * 0.7;
  keyLight.position.y = 3.8 + Math.cos(t * 0.42) * 0.55;
  coolLight.position.y = -1.5 + Math.sin(t * 0.48 + 1.2) * 0.75;
  warmLight.position.x = 1.7 + Math.cos(t * 0.38) * 0.9;
  violetLight.position.x = -2.6 + Math.sin(t * 0.41) * 0.7;

  sparkles.forEach((sprite, i) => {
    const pulse = 0.5 + Math.sin(t * (1.7 + i * 0.14) + i * 0.8) * 0.5;
    sprite.material.opacity = 0.08 + Math.max(0, pulse) * 0.24;
    const base = 0.14 + i * 0.012;
    const s = base * (0.9 + Math.max(0, pulse) * 0.18);
    sprite.scale.set(s, s, 1);
  });

  composer.render();
  requestAnimationFrame(animate);
}

animate();
