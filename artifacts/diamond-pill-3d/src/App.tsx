import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';

function makeShadowTexture(): any {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const context = canvas.getContext('2d');

  if (!context) {
    return new THREE.CanvasTexture(canvas);
  }

  const gradient = context.createRadialGradient(128, 128, 0, 128, 128, 128);
  gradient.addColorStop(0, 'rgba(255,255,255,0.13)');
  gradient.addColorStop(0.35, 'rgba(160,200,255,0.055)');
  gradient.addColorStop(1, 'rgba(0,0,0,0)');
  context.fillStyle = gradient;
  context.fillRect(0, 0, 256, 256);

  return new THREE.CanvasTexture(canvas);
}

function makeSparkleTexture(): any {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const context = canvas.getContext('2d');

  if (!context) {
    return new THREE.CanvasTexture(canvas);
  }

  context.translate(128, 128);

  const radial = context.createRadialGradient(0, 0, 0, 0, 0, 45);
  radial.addColorStop(0, 'rgba(255,255,255,1)');
  radial.addColorStop(0.15, 'rgba(255,255,255,0.9)');
  radial.addColorStop(0.45, 'rgba(170,210,255,0.35)');
  radial.addColorStop(1, 'rgba(0,0,0,0)');
  context.fillStyle = radial;
  context.beginPath();
  context.arc(0, 0, 45, 0, Math.PI * 2);
  context.fill();

  const line = context.createLinearGradient(-128, 0, 128, 0);
  line.addColorStop(0, 'rgba(255,255,255,0)');
  line.addColorStop(0.5, 'rgba(255,255,255,0.95)');
  line.addColorStop(1, 'rgba(255,255,255,0)');
  context.fillStyle = line;
  context.fillRect(-128, -1.5, 256, 3);
  context.rotate(Math.PI / 2);
  context.fillRect(-128, -1.5, 256, 3);

  return new THREE.CanvasTexture(canvas);
}

function DiamondScene() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return undefined;

    document.title = 'Diamond Pill';

    const renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      alpha: false,
      powerPreference: 'high-performance',
    });
    const pixelRatio = () => Math.min(window.devicePixelRatio || 1, 2);
    renderer.setPixelRatio(pixelRatio());
    renderer.setSize(window.innerWidth, window.innerHeight, false);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.25;
    renderer.setClearColor(0x000000, 1);

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x000000);

    const camera = new THREE.PerspectiveCamera(
      36,
      window.innerWidth / window.innerHeight,
      0.1,
      100,
    );
    camera.position.set(0, 0.15, 7.2);

    const pmrem = new THREE.PMREMGenerator(renderer);
    const room = new RoomEnvironment(renderer);
    scene.environment = pmrem.fromScene(room, 0.03).texture;
    room.dispose();
    pmrem.dispose();

    const composer = new EffectComposer(renderer);
    composer.addPass(new RenderPass(scene, camera));
    const bloom = new UnrealBloomPass(
      new THREE.Vector2(window.innerWidth, window.innerHeight),
      0.85,
      0.7,
      0.9,
    );
    composer.addPass(bloom);

    const pill = new THREE.Group();
    scene.add(pill);

    const bodyGeometry = new THREE.CapsuleGeometry(1.05, 2.35, 10, 20);
    bodyGeometry.rotateZ(Math.PI / 2);
    const diamondMaterial = new THREE.MeshPhysicalMaterial({
      color: 0xffffff,
      metalness: 0,
      roughness: 0.035,
      transmission: 1,
      thickness: 1.6,
      ior: 2.38,
      clearcoat: 1,
      clearcoatRoughness: 0.02,
      envMapIntensity: 3,
      iridescence: 1,
      iridescenceIOR: 1.35,
      iridescenceThicknessRange: [120, 850],
      dispersion: 0.95,
      transparent: true,
      opacity: 0.98,
      flatShading: true,
    });
    const body = new THREE.Mesh(bodyGeometry, diamondMaterial);
    pill.add(body);

    const ringGeometry = new THREE.TorusGeometry(1.055, 0.035, 10, 48);
    ringGeometry.rotateY(Math.PI / 2);
    const ringMaterial = new THREE.MeshPhysicalMaterial({
      color: 0xffffff,
      metalness: 0.35,
      roughness: 0.04,
      transmission: 0.5,
      thickness: 0.25,
      ior: 2.1,
      clearcoat: 1,
      envMapIntensity: 3.5,
    });
    const ring = new THREE.Mesh(ringGeometry, ringMaterial);
    pill.add(ring);

    const coreGeometry = new THREE.CapsuleGeometry(0.58, 1.75, 8, 16);
    coreGeometry.rotateZ(Math.PI / 2);
    const coreMaterial = new THREE.MeshBasicMaterial({
      color: 0x9fdfff,
      transparent: true,
      opacity: 0.028,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    const core = new THREE.Mesh(coreGeometry, coreMaterial);
    pill.add(core);

    pill.rotation.set(-0.22, 0.35, -0.58);
    pill.position.y = 0.12;

    const keyLight = new THREE.PointLight(0xffffff, 150, 30, 1.5);
    keyLight.position.set(4.5, 4, 5);
    scene.add(keyLight);
    const rimLight = new THREE.PointLight(0x8bc7ff, 120, 25, 1.8);
    rimLight.position.set(-4.5, -1.5, 3.5);
    scene.add(rimLight);
    const warmLight = new THREE.PointLight(0xffb15a, 105, 25, 1.7);
    warmLight.position.set(1.5, -4, 2.5);
    scene.add(warmLight);
    const violetLight = new THREE.PointLight(0xa76dff, 85, 20, 1.8);
    violetLight.position.set(-2.5, 3.2, 1);
    scene.add(violetLight);

    const floorMaterial = new THREE.MeshPhysicalMaterial({
      color: 0x050505,
      metalness: 0.25,
      roughness: 0.22,
      transparent: true,
      opacity: 0.42,
      clearcoat: 1,
      clearcoatRoughness: 0.1,
    });
    const floor = new THREE.Mesh(new THREE.PlaneGeometry(18, 18), floorMaterial);
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = -2;
    scene.add(floor);

    const glow = new THREE.Mesh(
      new THREE.PlaneGeometry(5.4, 2.7),
      new THREE.MeshBasicMaterial({
        map: makeShadowTexture(),
        transparent: true,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        opacity: 0.8,
      }),
    );
    glow.rotation.x = -Math.PI / 2;
    glow.position.y = -1.97;
    scene.add(glow);

    const sparkleTexture = makeSparkleTexture();
    const sparklePositions = [
      [-1.75, 0.65, 0.95],
      [1.8, 0.65, 0.8],
      [0.55, 1.18, 0.65],
      [-0.65, -0.85, 0.72],
      [1.15, -0.3, 0.95],
    ];
    const sparkles = sparklePositions.map((position, index) => {
      const material = new THREE.SpriteMaterial({
        map: sparkleTexture,
        color: 0xffffff,
        transparent: true,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        opacity: 0.9,
      });
      const sprite = new THREE.Sprite(material);
      sprite.position.set(position[0], position[1], position[2]);
      const size = 0.28 + index * 0.025;
      sprite.scale.set(size, size, 1);
      pill.add(sprite);
      return sprite;
    });

    let pointerX = 0;
    let pointerY = 0;
    let targetX = 0;
    let targetY = 0;
    const onPointerMove = (event: PointerEvent) => {
      targetX = (event.clientX / window.innerWidth - 0.5) * 2;
      targetY = (event.clientY / window.innerHeight - 0.5) * 2;
    };
    window.addEventListener('pointermove', onPointerMove, { passive: true });

    const clock = new THREE.Clock();
    let frame = 0;
    const animate = () => {
      const time = clock.getElapsedTime();
      pointerX += (targetX - pointerX) * 0.035;
      pointerY += (targetY - pointerY) * 0.035;

      pill.rotation.x = -0.22 + Math.sin(time * 0.38) * 0.06 + pointerY * 0.08;
      pill.rotation.y = 0.35 + time * 0.22 + pointerX * 0.12;
      pill.rotation.z = -0.58 + Math.sin(time * 0.26) * 0.08;
      pill.position.y = 0.12 + Math.sin(time * 0.85) * 0.12;

      keyLight.position.x = 4.5 + Math.sin(time * 0.7) * 1.4;
      keyLight.position.y = 3.8 + Math.cos(time * 0.5) * 1;
      rimLight.position.y = -1.4 + Math.sin(time * 0.6 + 1.5) * 1.6;
      warmLight.position.x = 1.5 + Math.cos(time * 0.45) * 2.2;
      violetLight.position.x = -2.5 + Math.sin(time * 0.55) * 1.5;

      sparkles.forEach((sprite, index) => {
        const pulse =
          0.65 + Math.sin(time * (2.2 + index * 0.18) + index) * 0.35;
        sprite.material.opacity = Math.max(0.08, pulse);
        const size =
          (0.26 + index * 0.022) * (0.88 + pulse * 0.26);
        sprite.scale.set(size, size, 1);
      });

      glow.material.opacity = 0.62 + Math.sin(time * 0.9) * 0.1;
      composer.render();
      frame = requestAnimationFrame(animate);
    };
    animate();

    const onResize = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;
      renderer.setSize(width, height, false);
      renderer.setPixelRatio(pixelRatio());
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      composer.setSize(width, height);
    };
    window.addEventListener('resize', onResize, { passive: true });

    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('resize', onResize);
      composer.dispose();
      renderer.dispose();
      sparkleTexture.dispose();
      glow.material.dispose();
      glow.geometry.dispose();
      bodyGeometry.dispose();
      diamondMaterial.dispose();
      ringGeometry.dispose();
      ringMaterial.dispose();
      coreGeometry.dispose();
      coreMaterial.dispose();
      floor.geometry.dispose();
      floorMaterial.dispose();
      sparkles.forEach((sprite) => sprite.material.dispose());
      scene.clear();
    };
  }, []);

  return (
    <main className="scene-shell" aria-label="Diamond Pill">
      <canvas ref={canvasRef} className="scene-canvas" id="scene" />
    </main>
  );
}

function App() {
  return <DiamondScene />;
}

export default App;