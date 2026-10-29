import {
  WebGLRenderer, Scene, PerspectiveCamera, Group, BufferGeometry, BufferAttribute,
  Points, ShaderMaterial, Line, LineBasicMaterial, Mesh, SphereGeometry,
  MeshBasicMaterial, RingGeometry, Color, Vector3, AdditiveBlending,
} from './vendor/three.min.js';
import { sampleLand, toVec, HOME, VIEW, CITIES, arcPoint, angleBetween } from './globe-land.js';

const CYAN = new Color('#54c8da');
const DOT = new Color('#9fd0ff');
const ARC_STEPS = 80;
const CYCLE_MS = 5200;

// Square points, like the pixels trailing off the logo's K. Dots facing the
// camera are brighter and larger; the dark sphere hides the far side.
const dotShader = {
  vertexShader: `
    uniform float uSize;
    uniform float uPx;
    varying float vFacing;
    void main() {
      vec4 mv = modelViewMatrix * vec4(position, 1.0);
      vFacing = normalize(normalMatrix * position).z;
      gl_PointSize = uSize * uPx / -mv.z * (0.55 + 0.45 * max(vFacing, 0.0));
      gl_Position = projectionMatrix * mv;
    }`,
  fragmentShader: `
    uniform vec3 uColor;
    varying float vFacing;
    void main() {
      gl_FragColor = vec4(uColor, 0.1 + 0.85 * smoothstep(0.0, 0.6, vFacing));
    }`,
};

const sparkShader = {
  vertexShader: `
    attribute float aAlpha;
    attribute float aSize;
    uniform float uPx;
    varying float vAlpha;
    void main() {
      vec4 mv = modelViewMatrix * vec4(position, 1.0);
      vAlpha = aAlpha;
      gl_PointSize = aSize * uPx / -mv.z;
      gl_Position = projectionMatrix * mv;
    }`,
  fragmentShader: `
    uniform vec3 uColor;
    varying float vAlpha;
    void main() {
      if (vAlpha < 0.01) discard;
      gl_FragColor = vec4(uColor, vAlpha);
    }`,
};

const rimShader = {
  vertexShader: `
    varying vec3 vN;
    void main() {
      vN = normalize(normalMatrix * normal);
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }`,
  fragmentShader: `
    uniform vec3 uColor;
    varying vec3 vN;
    void main() {
      float rim = pow(clamp(0.7 - vN.z, 0.0, 1.0), 4.0);
      gl_FragColor = vec4(uColor, rim * 0.28);
    }`,
};

export function mountGlobe(canvas, { labels = null, scroll = false } = {}) {
  let renderer;
  try {
    renderer = new WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'low-power' });
  } catch (e) {
    return null;
  }

  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const small = window.matchMedia('(max-width: 860px)').matches;
  const pixelRatio = Math.min(window.devicePixelRatio || 1, 1.5);
  renderer.setPixelRatio(pixelRatio);
  renderer.setClearColor(0x000000, 0);

  const scene = new Scene();
  const camera = new PerspectiveCamera(30, 1, 0.1, 50);
  const baseZ = 4.3;
  camera.position.set(0, 0, baseZ);

  const tilt = new Group();
  const spin = new Group();
  tilt.add(spin);
  scene.add(tilt);

  spin.add(new Mesh(new SphereGeometry(0.985, 64, 48), new MeshBasicMaterial({ color: 0x12467f })));

  const rim = new Mesh(
    new SphereGeometry(1.1, 64, 48),
    new ShaderMaterial({ ...rimShader, uniforms: { uColor: { value: CYAN } }, transparent: true, depthWrite: false, blending: AdditiveBlending, side: 1 }),
  );
  scene.add(rim);

  const pxUniform = { value: 1 };

  const land = new BufferGeometry();
  land.setAttribute('position', new BufferAttribute(sampleLand(small ? 2.5 : 1.7), 3));
  spin.add(new Points(land, new ShaderMaterial({
    ...dotShader,
    uniforms: { uSize: { value: 0.0105 }, uPx: pxUniform, uColor: { value: DOT } },
    transparent: true,
    depthWrite: false,
  })));

  const home = toVec(HOME.lat, HOME.lon);
  const homeV = new Vector3(...home);

  const ring = new Mesh(new RingGeometry(0.022, 0.03, 48), new MeshBasicMaterial({ color: CYAN, transparent: true, depthWrite: false }));
  ring.position.copy(homeV).multiplyScalar(1.004);
  ring.lookAt(homeV.clone().multiplyScalar(2));
  spin.add(ring);

  const routes = CITIES.map((c, i) => {
    const v = toVec(c.lat, c.lon);
    const omega = angleBetween(home, v);
    const pos = new Float32Array((ARC_STEPS + 1) * 3);
    for (let k = 0; k <= ARC_STEPS; k++) pos.set(arcPoint(home, v, omega, k / ARC_STEPS), k * 3);
    const geo = new BufferGeometry();
    geo.setAttribute('position', new BufferAttribute(pos, 3));
    geo.setDrawRange(0, 0);
    spin.add(new Line(geo, new LineBasicMaterial({ color: CYAN, transparent: true, opacity: 0.9, depthWrite: false })));
    return { ...c, v, omega, pos, geo, phase: i / CITIES.length };
  });

  // One vertex per route head, one per destination, one for home.
  const n = routes.length * 2 + 1;
  const sparkPos = new Float32Array(n * 3);
  const sparkAlpha = new Float32Array(n);
  const sparkSize = new Float32Array(n);
  routes.forEach((r, i) => {
    sparkPos.set(r.v, (routes.length + i) * 3);
    sparkSize[i] = 0.016;
    sparkSize[routes.length + i] = 0.02;
  });
  sparkPos.set(home, (n - 1) * 3);
  sparkSize[n - 1] = 0.03;
  sparkAlpha[n - 1] = 1;
  const sparks = new BufferGeometry();
  sparks.setAttribute('position', new BufferAttribute(sparkPos, 3));
  sparks.setAttribute('aAlpha', new BufferAttribute(sparkAlpha, 1));
  sparks.setAttribute('aSize', new BufferAttribute(sparkSize, 1));
  spin.add(new Points(sparks, new ShaderMaterial({
    ...sparkShader,
    uniforms: { uPx: pxUniform, uColor: { value: CYAN } },
    transparent: true,
    depthWrite: false,
  })));

  const tags = labels ? routes.map((c) => {
    const el = document.createElement('span');
    el.className = 'globe-label';
    el.textContent = c.name;
    labels.appendChild(el);
    return el;
  }) : [];

  const baseSpin = -VIEW.lon * Math.PI / 180;
  const baseTilt = VIEW.lat * Math.PI / 180;
  let spinOffset = 0;
  let px = 0, py = 0, tx = 0, ty = 0;
  let w = 0, h = 0;
  let raf = 0, last = 0, visible = true, alive = true, shown = false;
  const tmp = new Vector3();

  function resize() {
    const r = canvas.getBoundingClientRect();
    w = Math.max(1, r.width);
    h = Math.max(1, r.height);
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    pxUniform.value = h * pixelRatio;
    if (reduce) render(2600);
  }

  function update(time) {
    routes.forEach((r, i) => {
      const cyc = (time / CYCLE_MS + r.phase) % 1;
      const head = Math.min(1, cyc / 0.55);
      const eh = 1 - Math.pow(1 - head, 3);
      const tail = Math.max(0, (cyc - 0.5) / 0.5);
      const et = tail * tail;
      const a = Math.floor(et * ARC_STEPS);
      const b = Math.ceil(eh * ARC_STEPS);
      r.geo.setDrawRange(a, Math.max(0, b - a + 1));
      sparkPos.set(r.pos.subarray(b * 3, b * 3 + 3), i * 3);
      sparkAlpha[i] = head < 1 ? 1 : 0;
      sparkAlpha[routes.length + i] = head >= 1 ? 1 - tail : 0;
      r.reached = head >= 1 ? 1 - tail : 0;
    });
    sparks.attributes.position.needsUpdate = true;
    sparks.attributes.aAlpha.needsUpdate = true;

    const pulse = (time % 2400) / 2400;
    ring.scale.setScalar(1 + pulse * 2.2);
    ring.material.opacity = (1 - pulse) * 0.9;
  }

  function place() {
    spin.rotation.y = baseSpin + spinOffset + px * 0.35;
    tilt.rotation.x = baseTilt + py * 0.12;
    scene.updateMatrixWorld();
    if (!tags.length) return;
    routes.forEach((c, i) => {
      const v = c.v;
      tmp.set(v[0], v[1], v[2]).applyMatrix4(spin.matrixWorld);
      const facing = tmp.z;
      tmp.project(camera);
      const on = c.reached || 0;
      const el = tags[i];
      el.style.transform = `translate(${((tmp.x + 1) / 2) * w}px, ${((1 - tmp.y) / 2) * h}px)`;
      el.style.opacity = facing > 0.2 ? String(on * Math.min(1, (facing - 0.2) * 4)) : '0';
    });
  }

  function render(time) {
    update(time);
    place();
    renderer.render(scene, camera);
    if (!shown) {
      shown = true;
      canvas.parentElement.classList.add('is-live');
    }
  }

  function scrollAmount() {
    return Math.max(0, Math.min(1, window.scrollY / (window.innerHeight * 0.9)));
  }

  function frame(time) {
    if (!alive) return;
    raf = requestAnimationFrame(frame);
    const dt = last ? Math.min(64, time - last) : 16;
    last = time;
    let s = 0;
    if (scroll) {
      s = scrollAmount();
      camera.position.z = baseZ - s * 1.5;
      canvas.style.opacity = String(1 - s * 0.85);
    }
    if (!visible || document.hidden || s >= 1) return;
    spinOffset += dt * 0.00007;
    px += (tx - px) * 0.04;
    py += (ty - py) * 0.04;
    render(time);
  }

  function onPointer(e) {
    tx = (e.clientX / window.innerWidth - 0.5) * 2;
    ty = (e.clientY / window.innerHeight - 0.5) * 2;
  }

  const ro = new ResizeObserver(resize);
  ro.observe(canvas);
  const io = new IntersectionObserver((entries) => { visible = entries[0].isIntersecting; });
  io.observe(canvas);
  resize();

  if (reduce) {
    render(2600);
  } else {
    window.addEventListener('pointermove', onPointer, { passive: true });
    raf = requestAnimationFrame(frame);
  }

  return {
    destroy() {
      alive = false;
      cancelAnimationFrame(raf);
      ro.disconnect();
      io.disconnect();
      window.removeEventListener('pointermove', onPointer);
      renderer.dispose();
    },
  };
}
