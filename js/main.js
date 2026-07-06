/* ================================================================
   VNK://PORTFOLIO v2 — COMMAND DECK ENGINE
   ================================================================ */
const REDUCED = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const TOUCH   = window.matchMedia('(hover: none)').matches;
const MOBILE  = window.innerWidth < 768;

document.addEventListener('DOMContentLoaded', () => {
  if (REDUCED) {
    // Static experience: no boot, no motion, one rendered frame.
    initNav();
    initYear();
    initScene3D({ static: true });
    return;
  }
  initBoot();
});

/* ================================================================
   BOOT SEQUENCE
   ================================================================ */
function initBoot() {
  const boot  = document.getElementById('boot');
  const bar   = document.getElementById('boot-bar');
  const count = document.getElementById('boot-count');
  const log   = document.getElementById('boot-log');

  const lines = [
    'loading typefaces ............... <span class="ok">OK</span>',
    'compiling 3D scene .............. <span class="ok">OK</span>',
    'calibrating camera rig .......... <span class="ok">OK</span>',
    'binding scroll choreography ..... <span class="ok">OK</span>',
    'finalizing interface ............ <span class="ok">OK</span>',
    'READY — WELCOME',
  ];
  let lineIdx = 0;

  let progress = 0;
  const interval = setInterval(() => {
    progress = Math.min(progress + Math.random() * 9 + 3, 100);
    bar.style.width = progress + '%';
    count.textContent = Math.floor(progress);

    const want = Math.floor((progress / 100) * lines.length);
    while (lineIdx < want && lineIdx < lines.length) {
      const p = document.createElement('div');
      p.innerHTML = lines[lineIdx++];
      log.appendChild(p);
      log.scrollTop = log.scrollHeight;
    }

    if (progress >= 100) {
      clearInterval(interval);
      setTimeout(dismiss, 420);
    }
  }, 70);

  function dismiss() {
    boot.style.transition = 'clip-path 0.9s cubic-bezier(0.87,0,0.13,1)';
    boot.style.clipPath = 'inset(0 0 100% 0)';
    let launched = false;
    const go = () => {
      if (launched) return;
      launched = true;
      boot.style.display = 'none';
      launchApp();
    };
    boot.addEventListener('transitionend', go, { once: true });
    setTimeout(go, 1100); // fallback if transitionend never fires
  }
}

/* ================================================================
   APP LAUNCH
   ================================================================ */
function launchApp() {
  gsap.registerPlugin(ScrollTrigger);
  initLenis();
  initCursor();
  initNav();
  initScene3D({ static: false });
  initHeroIntro();
  initTypewriter();
  initScramble();
  initReveals();
  initCounters();
  initHorizontalScroll();
  initCameraRig();
  initTilt();
  initMagnetic();
  initYear();
  ScrollTrigger.refresh();
}

function initYear() {
  const y = document.getElementById('year');
  if (y) y.textContent = new Date().getFullYear();
}

/* ================================================================
   LENIS SMOOTH SCROLL
   ================================================================ */
let lenis;
function initLenis() {
  lenis = new Lenis({
    duration: 1.6,
    easing: t => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
    smooth: true,
    smoothTouch: false,
  });
  lenis.on('scroll', ScrollTrigger.update);
  gsap.ticker.add(time => lenis.raf(time * 1000));
  gsap.ticker.lagSmoothing(0);

  // Anchor links route through lenis
  document.querySelectorAll('a[href^="#"]').forEach(a => {
    a.addEventListener('click', e => {
      const target = document.querySelector(a.getAttribute('href'));
      if (!target) return;
      e.preventDefault();
      lenis.scrollTo(target, { offset: 0 });
      document.getElementById('nav-links')?.classList.remove('open');
      document.getElementById('nav-burger')?.classList.remove('open');
    });
  });
}

/* ================================================================
   CURSOR — crosshair + rotated ring
   ================================================================ */
function initCursor() {
  if (TOUCH) return;
  const cross = document.getElementById('cursor-cross');
  const ring  = document.getElementById('cursor-ring');
  if (!cross || !ring) return;

  let mx = -200, my = -200, rx = -200, ry = -200;
  document.addEventListener('mousemove', e => { mx = e.clientX; my = e.clientY; });

  (function tick() {
    rx += (mx - rx) * 0.12;
    ry += (my - ry) * 0.12;
    cross.style.left = mx + 'px';
    cross.style.top  = my + 'px';
    ring.style.left  = rx + 'px';
    ring.style.top   = ry + 'px';
    requestAnimationFrame(tick);
  })();

  document.querySelectorAll('a, button, .chips li, .deploy, .panel').forEach(el => {
    el.addEventListener('mouseenter', () => ring.classList.add('is-hover'));
    el.addEventListener('mouseleave', () => ring.classList.remove('is-hover'));
  });
  document.addEventListener('mousedown', () => ring.classList.add('is-clicking'));
  document.addEventListener('mouseup',   () => ring.classList.remove('is-clicking'));
}

/* ================================================================
   NAV
   ================================================================ */
function initNav() {
  const nav    = document.getElementById('nav');
  const burger = document.getElementById('nav-burger');
  const links  = document.getElementById('nav-links');

  window.addEventListener('scroll', () => {
    nav.classList.toggle('scrolled', window.scrollY > 40);
  }, { passive: true });

  burger?.addEventListener('click', () => {
    const open = links.classList.toggle('open');
    burger.classList.toggle('open', open);
    burger.setAttribute('aria-expanded', String(open));
  });

  // Active link tracking
  const sections = ['about', 'skills', 'experience', 'projects', 'contact'];
  const anchors  = [...links.querySelectorAll('a')];
  window.addEventListener('scroll', () => {
    let current = '';
    sections.forEach(id => {
      const el = document.getElementById(id);
      if (el && el.getBoundingClientRect().top < window.innerHeight * 0.4) current = id;
    });
    anchors.forEach(a => a.classList.toggle('active', a.getAttribute('href') === '#' + current));
  }, { passive: true });
}

/* ================================================================
   3D SCENE — a continuous journey along -Z, one monument per section
   ================================================================ */
const rig = { x: 0, y: 2, z: 16, sway: 0, arcGlow: 1, beacon: 0 };
let sceneAPI = null;

function initScene3D(opts) {
  if (typeof THREE === 'undefined') return;
  const canvas = document.getElementById('scene');
  if (!canvas) return;

  const scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2(0x04060c, 0.016);

  const camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.1, 400);
  camera.position.set(rig.x, rig.y, rig.z);

  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.75));
  renderer.setClearColor(0x04060c, 1);

  const CYAN  = 0x00e5ff;
  const AMBER = 0xffc857;
  const DEEP  = 0x0a3a55;

  // ---- 01 · GLOBE — hero / about ----
  const globe = new THREE.Group();
  globe.position.set(8, 0, -14);
  scene.add(globe);

  const R = 7;

  // Fibonacci point sphere
  const N = MOBILE ? 380 : 750;
  const pts = new Float32Array(N * 3);
  const golden = Math.PI * (3 - Math.sqrt(5));
  for (let i = 0; i < N; i++) {
    const y = 1 - (i / (N - 1)) * 2;
    const rad = Math.sqrt(1 - y * y);
    const th = golden * i;
    pts[i * 3]     = Math.cos(th) * rad * R;
    pts[i * 3 + 1] = y * R;
    pts[i * 3 + 2] = Math.sin(th) * rad * R;
  }
  const ptsGeo = new THREE.BufferGeometry();
  ptsGeo.setAttribute('position', new THREE.BufferAttribute(pts, 3));
  const ptsMat = new THREE.PointsMaterial({
    color: CYAN, size: 0.055, transparent: true, opacity: 0.85,
    blending: THREE.AdditiveBlending, depthWrite: false, sizeAttenuation: true,
  });
  globe.add(new THREE.Points(ptsGeo, ptsMat));

  // Wireframe shell
  const shellMat = new THREE.MeshBasicMaterial({
    color: DEEP, wireframe: true, transparent: true, opacity: 0.22,
  });
  globe.add(new THREE.Mesh(new THREE.IcosahedronGeometry(R, 2), shellMat));

  // Inner core
  const coreMat = new THREE.MeshBasicMaterial({
    color: CYAN, wireframe: true, transparent: true, opacity: 0.06,
  });
  const core = new THREE.Mesh(new THREE.IcosahedronGeometry(R * 0.45, 1), coreMat);
  globe.add(core);

  // ---- Orbital rings (LineLoop) ----
  function makeRing(radius, color, opacity, tiltX, tiltZ) {
    const seg = 128;
    const arr = new Float32Array(seg * 3);
    for (let i = 0; i < seg; i++) {
      const a = (i / seg) * Math.PI * 2;
      arr[i * 3] = Math.cos(a) * radius;
      arr[i * 3 + 2] = Math.sin(a) * radius;
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(arr, 3));
    const m = new THREE.LineBasicMaterial({ color, transparent: true, opacity });
    const ring = new THREE.LineLoop(g, m);
    ring.rotation.x = tiltX;
    ring.rotation.z = tiltZ;
    return ring;
  }
  const ring1 = makeRing(R * 1.5,  CYAN,  0.28, Math.PI / 2.4, 0.3);
  const ring2 = makeRing(R * 1.75, AMBER, 0.16, Math.PI / 1.9, -0.5);
  const ring3 = makeRing(R * 2.1,  DEEP,  0.35, Math.PI / 2.1, 0.9);
  globe.add(ring1, ring2, ring3);

  // ---- Attack arcs ----
  const arcs = [];
  const arcCount = MOBILE ? 6 : 14;
  function surfacePoint() {
    const theta = 2 * Math.PI * Math.random();
    const phi = Math.acos(2 * Math.random() - 1);
    return new THREE.Vector3(
      Math.sin(phi) * Math.cos(theta),
      Math.cos(phi),
      Math.sin(phi) * Math.sin(theta)
    ).multiplyScalar(R);
  }
  for (let i = 0; i < arcCount; i++) {
    const a = surfacePoint(), b = surfacePoint();
    const mid = a.clone().add(b).multiplyScalar(0.5).normalize()
      .multiplyScalar(R + a.distanceTo(b) * 0.45);
    const curve = new THREE.QuadraticBezierCurve3(a, mid, b);
    const g = new THREE.BufferGeometry().setFromPoints(curve.getPoints(40));
    const m = new THREE.LineBasicMaterial({
      color: i % 3 === 0 ? AMBER : CYAN,
      transparent: true, opacity: 0,
      blending: THREE.AdditiveBlending, depthWrite: false,
    });
    const line = new THREE.Line(g, m);
    globe.add(line);
    arcs.push({ mat: m, phase: Math.random() * Math.PI * 2, speed: 0.28 + Math.random() * 0.5 });
  }

  // ---- Journey corridor: floor grids ----
  function makeGrid(divs, colA, colB, opacity) {
    const g = new THREE.GridHelper(640, divs, colA, colB);
    (Array.isArray(g.material) ? g.material : [g.material]).forEach(m => {
      m.transparent = true; m.opacity = opacity;
    });
    g.position.set(0, -7, -160);
    return g;
  }
  scene.add(makeGrid(128, CYAN, 0x0a1a2a, 0.13));
  scene.add(makeGrid(48, DEEP, 0x081420, 0.22));

  // shared wire materials for monuments
  const wCyan  = new THREE.MeshBasicMaterial({ color: CYAN,  wireframe: true, transparent: true, opacity: 0.16 });
  const wDeep  = new THREE.MeshBasicMaterial({ color: DEEP,  wireframe: true, transparent: true, opacity: 0.4 });
  const wAmber = new THREE.MeshBasicMaterial({ color: AMBER, wireframe: true, transparent: true, opacity: 0.22 });

  // ---- 02 · LATTICE — skills (z −78, left) ----
  const lattice = new THREE.Group();
  for (let ix = 0; ix < 4; ix++) for (let iy = 0; iy < 3; iy++) for (let iz = 0; iz < 3; iz++) {
    const amber = (ix + iy + iz) % 5 === 0;
    const cube = new THREE.Mesh(new THREE.BoxGeometry(1.5, 1.5, 1.5), amber ? wAmber : wCyan);
    cube.position.set((ix - 1.5) * 2.4, (iy - 1) * 2.4, (iz - 1) * 2.4);
    lattice.add(cube);
  }
  lattice.position.set(-10, 3, -78);
  scene.add(lattice);

  // ---- 03 · MISSION NODES — experience (z −118, right) ----
  const nodes = new THREE.Group();
  {
    const lineGeo = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(-9, 0, 0), new THREE.Vector3(9, 0, 0),
    ]);
    nodes.add(new THREE.Line(lineGeo, new THREE.LineBasicMaterial({
      color: CYAN, transparent: true, opacity: 0.4,
    })));
    for (let i = 0; i < 4; i++) {
      const oct = new THREE.Mesh(
        new THREE.OctahedronGeometry(0.9 + (3 - i) * 0.18, 0),
        i === 0 ? wAmber : wCyan
      );
      oct.position.x = -6.6 + i * 4.4;
      nodes.add(oct);
    }
  }
  nodes.position.set(10, 2.5, -118);
  scene.add(nodes);

  // ---- 04 · CONSTELLATION — projects fly-through (z −145 … −180) ----
  const field = [];
  const FIELD_N = MOBILE ? 8 : 16;
  for (let i = 0; i < FIELD_N; i++) {
    const geo = i % 2 ? new THREE.TetrahedronGeometry(1.1 + Math.random() * 1.2, 0)
                      : new THREE.OctahedronGeometry(0.9 + Math.random() * 1.1, 0);
    const mesh = new THREE.Mesh(geo, i % 4 === 0 ? wAmber : (i % 3 === 0 ? wDeep : wCyan));
    mesh.position.set(
      (Math.random() - 0.5) * 34,
      Math.random() * 12 - 2,
      -145 - Math.random() * 36
    );
    scene.add(mesh);
    field.push({ mesh, rx: 0.1 + Math.random() * 0.25, ry: 0.1 + Math.random() * 0.25 });
  }

  // ---- 05 · STACK — education (z −208, left) ----
  const stack = new THREE.Group();
  [[7, 0], [5.2, 1.6], [3.4, 3.2]].forEach(([w, y], i) => {
    const slab = new THREE.Mesh(new THREE.BoxGeometry(w, 0.7, w * 0.7), i === 1 ? wAmber : wCyan);
    slab.position.y = y;
    stack.add(slab);
  });
  const orbiter = new THREE.Mesh(new THREE.SphereGeometry(0.4, 10, 10), wAmber);
  stack.add(orbiter);
  stack.position.set(-9, -1, -208);
  scene.add(stack);

  // ---- 06 · BEACON — contact (z −248, center) ----
  const beacon = new THREE.Group();
  const pylon = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 1.1, 24, 8, 6, true), wCyan);
  pylon.position.y = 5;
  beacon.add(pylon);
  const bRing1 = new THREE.Mesh(new THREE.TorusGeometry(5, 0.06, 10, 80),
    new THREE.MeshBasicMaterial({ color: CYAN, transparent: true, opacity: 0.3, blending: THREE.AdditiveBlending, depthWrite: false }));
  bRing1.rotation.x = Math.PI / 2;
  bRing1.position.y = 4;
  const bRing2 = new THREE.Mesh(new THREE.TorusGeometry(7.2, 0.05, 10, 80),
    new THREE.MeshBasicMaterial({ color: AMBER, transparent: true, opacity: 0.18, blending: THREE.AdditiveBlending, depthWrite: false }));
  bRing2.rotation.x = Math.PI / 2;
  bRing2.position.y = 9;
  beacon.add(bRing1, bRing2);
  beacon.position.set(0, -2, -248);
  scene.add(beacon);

  // ---- Ambient particles along the whole corridor ----
  const PC = MOBILE ? 350 : 900;
  const pArr = new Float32Array(PC * 3);
  for (let i = 0; i < PC; i++) {
    pArr[i * 3]     = (Math.random() - 0.5) * 120;
    pArr[i * 3 + 1] = (Math.random() - 0.5) * 60 + 8;
    pArr[i * 3 + 2] = 25 - Math.random() * 300;
  }
  const pGeo = new THREE.BufferGeometry();
  pGeo.setAttribute('position', new THREE.BufferAttribute(pArr, 3));
  const pMat = new THREE.PointsMaterial({
    color: CYAN, size: 0.05, transparent: true, opacity: 0.35,
    blending: THREE.AdditiveBlending, depthWrite: false,
  });
  const particles = new THREE.Points(pGeo, pMat);
  scene.add(particles);

  // ---- Mouse parallax (lerped for smoothness) ----
  let tx = 0, ty = 0, smx = 0, smy = 0;
  if (!TOUCH) {
    document.addEventListener('mousemove', e => {
      tx = (e.clientX / window.innerWidth - 0.5) * 2;
      ty = (e.clientY / window.innerHeight - 0.5) * 2;
    });
  }

  window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  });

  let paused = false;
  document.addEventListener('visibilitychange', () => { paused = document.hidden; });

  const clock = new THREE.Clock();
  function render() {
    const t = clock.getElapsedTime();

    // 01 globe
    globe.rotation.y = t * 0.055;
    globe.rotation.x = Math.sin(t * 0.08) * 0.05;
    core.rotation.y = -t * 0.18;
    core.rotation.x = t * 0.1;
    ring1.rotation.y = t * 0.09;
    ring2.rotation.y = -t * 0.065;
    ring3.rotation.y = t * 0.04;
    arcs.forEach(a => {
      a.mat.opacity = Math.max(0, Math.sin(t * a.speed + a.phase)) * 0.55 * rig.arcGlow;
    });

    // 02–06 monuments
    lattice.rotation.y = t * 0.08;
    nodes.rotation.y = Math.sin(t * 0.14) * 0.12;
    nodes.children.forEach((c, i) => {
      if (c.isMesh) c.rotation.y = t * (0.2 + i * 0.04);
    });
    field.forEach(f => {
      f.mesh.rotation.x = t * f.rx;
      f.mesh.rotation.y = t * f.ry;
    });
    stack.rotation.y = t * 0.06;
    orbiter.position.set(Math.cos(t * 0.5) * 5.4, 1.8 + Math.sin(t * 0.9) * 1.4, Math.sin(t * 0.5) * 5.4);
    bRing1.rotation.z = t * 0.25;
    bRing2.rotation.z = -t * 0.18;
    const pulse = 0.5 + Math.sin(t * 1.6) * 0.5;
    bRing1.material.opacity = 0.12 + rig.beacon * pulse * 0.5;
    bRing2.material.opacity = 0.08 + rig.beacon * pulse * 0.32;
    bRing1.scale.setScalar(1 + rig.beacon * pulse * 0.25);

    particles.rotation.y = t * 0.004;

    // camera dolly
    smx += (tx - smx) * 0.045;
    smy += (ty - smy) * 0.045;
    camera.position.set(rig.x + smx * 1.4, rig.y - smy * 1.0, rig.z);
    camera.lookAt(rig.x * 0.4 + rig.sway, rig.y - 0.6, rig.z - 20);

    renderer.render(scene, camera);
  }

  if (opts.static) { render(); return; }

  (function loop() {
    if (!paused) render();
    requestAnimationFrame(loop);
  })();

  sceneAPI = { scene, camera, renderer };
}

/* ================================================================
   CAMERA RIG — one continuous dolly through the corridor
   ================================================================ */
function initCameraRig() {
  const tl = gsap.timeline({
    scrollTrigger: {
      trigger: document.body,
      start: 'top top',
      end: 'bottom bottom',
      scrub: 2.4,
    },
  });
  // hero → about: pass the globe on the right
  tl.to(rig, { z: -34,  x: -3.5, sway: 2.5, ease: 'none' }, 0)
    // about → skills: lattice emerges on the left
    .to(rig, { z: -74,  x: 4,    sway: -3,  ease: 'none' }, 1)
    // skills → experience: mission nodes on the right
    .to(rig, { z: -114, x: -4,   sway: 3,   ease: 'none' }, 2)
    // experience → projects: straight through the constellation
    .to(rig, { z: -158, x: 0,    sway: 0,   y: 3.5, arcGlow: 0.4, ease: 'none' }, 3)
    // projects → education: stack on the left
    .to(rig, { z: -204, x: 4,    sway: -3,  y: 2,   ease: 'none' }, 4)
    // education → contact: approach the beacon head-on
    .to(rig, { z: -240, x: 0,    sway: 0,   y: 2.8, beacon: 1, arcGlow: 1.5, ease: 'none' }, 5);
}

/* ================================================================
   HERO INTRO
   ================================================================ */
function initHeroIntro() {
  const name = document.getElementById('hero-name');
  if (name) {
    const text = name.textContent;
    name.textContent = '';
    [...text].forEach(ch => {
      const s = document.createElement('span');
      s.className = 'ltr';
      s.textContent = ch;
      name.appendChild(s);
    });
    gsap.from(name.querySelectorAll('.ltr'), {
      yPercent: 110, opacity: 0, duration: 1.4, ease: 'expo.out',
      stagger: 0.06, delay: 0.15,
    });
  }
  gsap.from('.hero [data-reveal]', {
    y: 22, autoAlpha: 0, duration: 1.15, ease: 'power2.out',
    stagger: 0.13, delay: 0.6,
  });
  gsap.from('.hero__hud', { autoAlpha: 0, duration: 1.6, delay: 1.5 });
}

/* ================================================================
   TYPEWRITER
   ================================================================ */
function initTypewriter() {
  const el = document.getElementById('typewriter');
  if (!el) return;
  const phrases = [
    'GRC & COMPLIANCE AUTOMATION',
    'SOC OPERATIONS & SIEM',
    'SECURING SYSTEMS WITH CODE',
    'ETHICAL HACKING',
    'BUILDING SECURE SOFTWARE',
  ];
  let pi = 0, ci = 0, deleting = false;

  (function type() {
    const phrase = phrases[pi];
    el.textContent = phrase.slice(0, ci);
    let delay = deleting ? 34 : 62;
    if (!deleting && ci === phrase.length) { delay = 2100; deleting = true; }
    else if (deleting && ci === 0) { deleting = false; pi = (pi + 1) % phrases.length; delay = 420; }
    else ci += deleting ? -1 : 1;
    setTimeout(type, delay);
  })();
}

/* ================================================================
   SCRAMBLE TEXT — section titles decode on entry
   ================================================================ */
function initScramble() {
  const CHARS = '!<>-_\\/[]{}—=+*^?#01';
  const els = document.querySelectorAll('[data-scramble]');
  const io = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      io.unobserve(entry.target);
      scramble(entry.target);
    });
  }, { threshold: 0.6 });
  els.forEach(el => io.observe(el));

  function scramble(el) {
    const final = el.dataset.finalText || el.textContent;
    el.dataset.finalText = final;
    let frame = 0;
    const total = final.length * 3 + 12;
    (function step() {
      let out = '';
      for (let i = 0; i < final.length; i++) {
        if (final[i] === ' ') { out += ' '; continue; }
        if (i < (frame - 8) / 2.4) out += final[i];
        else out += CHARS[Math.floor(Math.random() * CHARS.length)];
      }
      el.textContent = out;
      if (frame++ < total) requestAnimationFrame(step);
      else el.textContent = final;
    })();
  }
}

/* ================================================================
   SCROLL REVEALS
   ================================================================ */
function initReveals() {
  document.querySelectorAll('main [data-reveal]').forEach(el => {
    if (el.closest('.hero')) return; // hero handled by intro
    gsap.from(el, {
      y: 28, autoAlpha: 0, duration: 1.25, ease: 'power2.out',
      scrollTrigger: { trigger: el, start: 'top 88%', toggleActions: 'play none none none' },
    });
  });
}

/* ================================================================
   COUNTERS
   ================================================================ */
function initCounters() {
  document.querySelectorAll('.stat__num').forEach(el => {
    const target = +el.dataset.target;
    ScrollTrigger.create({
      trigger: el,
      start: 'top 88%',
      once: true,
      onEnter: () => {
        gsap.fromTo(el, { textContent: 0 }, {
          textContent: target, duration: 2, ease: 'power3.out',
          snap: { textContent: 1 },
        });
      },
    });
  });
}

/* ================================================================
   HORIZONTAL SCROLL — deployments
   ================================================================ */
function initHorizontalScroll() {
  const track = document.getElementById('deploys-track');
  if (!track) return;
  // Arm once layout is settled. document.fonts.ready resolves even in hidden
  // tabs, unlike requestAnimationFrame — a background-tab load must still pin.
  let armed = false;
  const arm = () => {
    if (armed) return;
    armed = true;
    const distance = track.scrollWidth - window.innerWidth;
    if (distance <= 0) return;
    const horizontalTween = gsap.to(track, {
      x: -distance,
      ease: 'none',
      scrollTrigger: {
        trigger: '.deploys',
        pin: '.deploys__sticky',
        scrub: 1.8,
        start: 'top top',
        end: () => '+=' + distance,
        invalidateOnRefresh: true,
      },
    });
    gsap.utils.toArray('.deploy').forEach(card => {
      gsap.from(card, {
        opacity: 0, y: 36, duration: 1.15, ease: 'power2.out',
        scrollTrigger: {
          trigger: card,
          containerAnimation: horizontalTween,
          start: 'left 92%',
          toggleActions: 'play none none none',
        },
      });
    });
    ScrollTrigger.refresh();
  };
  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(() => setTimeout(arm, 0));
  } else {
    requestAnimationFrame(arm);
  }
}

/* ================================================================
   3D TILT — deployment cards
   ================================================================ */
function initTilt() {
  if (TOUCH) return;
  document.querySelectorAll('[data-tilt]').forEach(card => {
    let raf = null;
    card.addEventListener('mousemove', e => {
      if (raf) return;
      raf = requestAnimationFrame(() => {
        const r = card.getBoundingClientRect();
        const px = (e.clientX - r.left) / r.width - 0.5;
        const py = (e.clientY - r.top) / r.height - 0.5;
        card.style.transform =
          `perspective(900px) rotateY(${px * 5}deg) rotateX(${-py * 5}deg) translateZ(4px)`;
        raf = null;
      });
    });
    card.addEventListener('mouseenter', () => {
      card.style.transition = 'transform 0.25s ease-out';
      setTimeout(() => { card.style.transition = ''; }, 250);
    });
    card.addEventListener('mouseleave', () => {
      card.style.transition = 'transform 0.8s cubic-bezier(0.16,1,0.3,1)';
      card.style.transform = '';
      setTimeout(() => { card.style.transition = ''; }, 800);
    });
  });
}

/* ================================================================
   MAGNETIC BUTTONS
   ================================================================ */
function initMagnetic() {
  if (TOUCH) return;
  document.querySelectorAll('.btn, .transmit__cta').forEach(btn => {
    const xTo = gsap.quickTo(btn, 'x', { duration: 0.5, ease: 'power3.out' });
    const yTo = gsap.quickTo(btn, 'y', { duration: 0.5, ease: 'power3.out' });
    btn.addEventListener('mousemove', e => {
      const r = btn.getBoundingClientRect();
      xTo((e.clientX - r.left - r.width / 2) * 0.16);
      yTo((e.clientY - r.top - r.height / 2) * 0.16);
    });
    btn.addEventListener('mouseleave', () => { xTo(0); yTo(0); });
  });
}
