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
   3D SCENE — globe, arcs, rings, particles
   ================================================================ */
const rig = { camX: 0, camY: 1.5, camZ: 26, gX: 9, gYr: 0, scale: 1, arcGlow: 1 };
let sceneAPI = null;

function initScene3D(opts) {
  if (typeof THREE === 'undefined') return;
  const canvas = document.getElementById('scene');
  if (!canvas) return;

  const scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2(0x04060c, 0.014);

  const camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.1, 300);
  camera.position.set(rig.camX, rig.camY, rig.camZ);

  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.75));
  renderer.setClearColor(0x04060c, 1);

  const CYAN  = 0x00e5ff;
  const AMBER = 0xffc857;
  const DEEP  = 0x0a3a55;

  // ---- Globe group ----
  const globe = new THREE.Group();
  globe.position.set(rig.gX, 0, -4);
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

  // ---- Ambient particle field ----
  const PC = MOBILE ? 250 : 700;
  const pArr = new Float32Array(PC * 3);
  for (let i = 0; i < PC; i++) {
    pArr[i * 3]     = (Math.random() - 0.5) * 130;
    pArr[i * 3 + 1] = (Math.random() - 0.5) * 80;
    pArr[i * 3 + 2] = (Math.random() - 0.5) * 90 - 10;
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

    globe.rotation.y = rig.gYr + t * 0.055;
    globe.rotation.x = Math.sin(t * 0.08) * 0.05;
    globe.position.x = rig.gX;
    globe.scale.setScalar(rig.scale);
    core.rotation.y = -t * 0.18;
    core.rotation.x = t * 0.1;

    ring1.rotation.y = t * 0.09;
    ring2.rotation.y = -t * 0.065;
    ring3.rotation.y = t * 0.04;

    arcs.forEach(a => {
      a.mat.opacity = Math.max(0, Math.sin(t * a.speed + a.phase)) * 0.55 * rig.arcGlow;
    });

    particles.rotation.y = t * 0.006;

    smx += (tx - smx) * 0.045;
    smy += (ty - smy) * 0.045;
    camera.position.x = rig.camX + smx * 1.4;
    camera.position.y = rig.camY - smy * 1.0;
    camera.position.z = rig.camZ;
    camera.lookAt(rig.gX * 0.35, 0, -4);

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
   CAMERA RIG — scroll-driven scene choreography
   ================================================================ */
function initCameraRig() {
  const tl = gsap.timeline({
    scrollTrigger: {
      trigger: document.body,
      start: 'top top',
      end: 'bottom bottom',
      scrub: 2.2,
    },
  });
  // hero → identity: globe slides center, camera pushes in
  tl.to(rig, { gX: 0, camZ: 21, scale: 1.12, gYr: 1.2, ease: 'none' }, 0)
    // identity → arsenal/log: globe drifts left, pulls back
    .to(rig, { gX: -8.5, camZ: 25, scale: 1, gYr: 2.6, ease: 'none' }, 1)
    // log → deployments: globe recedes deep, arcs calm
    .to(rig, { gX: 0, camZ: 38, scale: 0.72, gYr: 4.2, arcGlow: 0.4, ease: 'none' }, 2)
    // deployments → transmit: dramatic close-up, arcs surge
    .to(rig, { camZ: 14.5, camY: 0.4, scale: 1.35, gYr: 6, arcGlow: 1.6, ease: 'none' }, 3);
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
  requestAnimationFrame(() => {
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
  });
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
