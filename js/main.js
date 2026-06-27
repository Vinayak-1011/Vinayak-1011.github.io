/* ================================================================
   ENTRY
   ================================================================ */
document.addEventListener('DOMContentLoaded', () => {
  initPreloader();
});

/* ================================================================
   PRELOADER
   ================================================================ */
function initPreloader() {
  const preloader = document.getElementById('preloader');
  const bar       = document.getElementById('preloader-bar');
  const count     = document.getElementById('preloader-count');

  let progress = 0;
  const interval = setInterval(() => {
    const step = Math.random() * 7 + 2;
    progress = Math.min(progress + step, 100);
    bar.style.width = progress + '%';
    count.textContent = Math.floor(progress);
    if (progress >= 100) {
      clearInterval(interval);
      setTimeout(dismissPreloader, 350);
    }
  }, 55);

  function dismissPreloader() {
    // Slide preloader up
    preloader.style.transition = 'transform 1s cubic-bezier(0.87,0,0.13,1)';
    preloader.style.transform = 'translateY(-100%)';
    preloader.addEventListener('transitionend', () => {
      preloader.style.display = 'none';
      launchApp();
    }, { once: true });
  }
}

/* ================================================================
   APP LAUNCH (after preloader)
   ================================================================ */
function launchApp() {
  gsap.registerPlugin(ScrollTrigger);
  initLenis();
  initCursor();
  initNav();
  initHero3D();
  initHeroAnimations();
  initTypewriter();
  initScrollAnimations();
  initHorizontalScroll();
  initTerminalAnimation();
  initCounters();
  initMagneticButtons();
  initScrollBackground();
  document.getElementById('year').textContent = new Date().getFullYear();
}

/* ================================================================
   LENIS SMOOTH SCROLL
   ================================================================ */
let lenis;
function initLenis() {
  lenis = new Lenis({
    duration: 1.35,
    easing: t => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
    smooth: true,
    smoothTouch: false,
  });

  lenis.on('scroll', ScrollTrigger.update);

  gsap.ticker.add(time => lenis.raf(time * 1000));
  gsap.ticker.lagSmoothing(0);
}

/* ================================================================
   CUSTOM CURSOR
   ================================================================ */
function initCursor() {
  if (window.matchMedia('(hover: none)').matches) return;

  const dot  = document.getElementById('cursor-dot');
  const ring = document.getElementById('cursor-ring');
  if (!dot || !ring) return;

  let mx = -200, my = -200;
  let rx = -200, ry = -200;

  document.addEventListener('mousemove', e => { mx = e.clientX; my = e.clientY; });

  (function tick() {
    rx += (mx - rx) * 0.1;
    ry += (my - ry) * 0.1;
    dot.style.left  = mx + 'px';
    dot.style.top   = my + 'px';
    ring.style.left = rx + 'px';
    ring.style.top  = ry + 'px';
    requestAnimationFrame(tick);
  })();

  document.querySelectorAll('a, button, .tags li, .project-card, .job, .terminal').forEach(el => {
    el.addEventListener('mouseenter', () => ring.classList.add('is-hover'));
    el.addEventListener('mouseleave', () => ring.classList.remove('is-hover'));
  });
  document.addEventListener('mousedown', () => ring.classList.add('is-clicking'));
  document.addEventListener('mouseup',   () => ring.classList.remove('is-clicking'));
}

/* ================================================================
   NAV — scroll state + active links + mobile
   ================================================================ */
function initNav() {
  const nav    = document.getElementById('nav');
  const burger = document.getElementById('nav-burger');
  const links  = document.getElementById('nav-links');
  const navAs  = links.querySelectorAll('a');

  // Scrolled state
  const onScroll = () => nav.classList.toggle('scrolled', window.scrollY > 40);
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });

  // Mobile toggle
  burger.addEventListener('click', () => {
    const open = !links.classList.contains('open');
    links.classList.toggle('open', open);
    burger.classList.toggle('open', open);
    burger.setAttribute('aria-expanded', String(open));
  });
  navAs.forEach(a => a.addEventListener('click', () => {
    links.classList.remove('open');
    burger.classList.remove('open');
    burger.setAttribute('aria-expanded', 'false');
  }));

  // Active link via IntersectionObserver
  const sections = document.querySelectorAll('section[id], main > section[id]');
  const io = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        navAs.forEach(a => a.classList.remove('active'));
        const a = links.querySelector(`a[href="#${e.target.id}"]`);
        if (a) a.classList.add('active');
      }
    });
  }, { threshold: 0.35, rootMargin: '-80px 0px -35% 0px' });
  sections.forEach(s => io.observe(s));
}

/* ================================================================
   THREE.JS — MATRIX GRID HERO
   ================================================================ */
function initHero3D() {
  if (typeof THREE === 'undefined') return;
  const canvas = document.getElementById('hero-canvas');
  if (!canvas) return;

  // Scene
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x050505);
  scene.fog = new THREE.FogExp2(0x050505, 0.018);

  // Camera
  const camera = new THREE.PerspectiveCamera(55, canvas.clientWidth / canvas.clientHeight, 0.1, 250);
  camera.position.set(0, 5, 20);
  camera.lookAt(0, -1, -15);

  // Renderer
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
  renderer.setSize(canvas.clientWidth, canvas.clientHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

  const GREEN = 0x00ff41;

  // ---- GRID (the iconic matrix floor) ----
  function makeGrid(divs, size, colorA, colorB, opacity) {
    const g = new THREE.GridHelper(size, divs, colorA, colorB);
    const mats = Array.isArray(g.material) ? g.material : [g.material];
    mats.forEach(m => { m.transparent = true; m.opacity = opacity; });
    return g;
  }

  // Primary grid
  const grid1 = makeGrid(60, 250, GREEN, 0x003311, 0.35);
  grid1.position.y = -7;
  scene.add(grid1);

  // Finer secondary grid (slightly different speed → depth parallax)
  const grid2 = makeGrid(120, 250, GREEN, 0x001a08, 0.12);
  grid2.position.y = -7;
  scene.add(grid2);

  const CELL1 = 250 / 60;
  const CELL2 = 250 / 120;

  // ---- GLOWING SCAN LINE (sweeps across grid) ----
  const scanGeo = new THREE.PlaneGeometry(250, 1.2);
  const scanMat = new THREE.MeshBasicMaterial({ color: GREEN, transparent: true, opacity: 0.18, side: THREE.DoubleSide });
  const scanLine = new THREE.Mesh(scanGeo, scanMat);
  scanLine.rotation.x = -Math.PI / 2;
  scanLine.position.y = -6.95;
  scene.add(scanLine);

  // ---- PARTICLES ----
  const pCount = 500;
  const pPos   = new Float32Array(pCount * 3);
  const pSpeeds = new Float32Array(pCount);
  for (let i = 0; i < pCount; i++) {
    pPos[i * 3]     = (Math.random() - 0.5) * 120;
    pPos[i * 3 + 1] = Math.random() * 40 - 6;
    pPos[i * 3 + 2] = (Math.random() - 0.5) * 120;
    pSpeeds[i]      = 0.005 + Math.random() * 0.01;
  }
  const pGeo = new THREE.BufferGeometry();
  pGeo.setAttribute('position', new THREE.BufferAttribute(pPos, 3));
  const pMat = new THREE.PointsMaterial({ color: GREEN, size: 0.05, transparent: true, opacity: 0.55, sizeAttenuation: true });
  const particles = new THREE.Points(pGeo, pMat);
  scene.add(particles);

  // ---- WIREFRAME SHAPES (right side, behind text) ----
  const shapes = [];

  const icoGeo = new THREE.IcosahedronGeometry(5, 1);
  const wireMat = new THREE.MeshBasicMaterial({ color: GREEN, wireframe: true, transparent: true, opacity: 0.08 });
  const ico = new THREE.Mesh(icoGeo, wireMat);
  ico.position.set(18, 3, -8);
  scene.add(ico);
  shapes.push({ mesh: ico, rx: 0.008, ry: 0.013 });

  const toGeo = new THREE.TorusGeometry(8, 0.3, 14, 80);
  const toMat = new THREE.MeshBasicMaterial({ color: GREEN, wireframe: true, transparent: true, opacity: 0.04 });
  const torus = new THREE.Mesh(toGeo, toMat);
  torus.position.set(-16, -2, -14);
  torus.rotation.x = 0.5;
  scene.add(torus);
  shapes.push({ mesh: torus, rx: 0.005, ry: 0.009 });

  const octGeo = new THREE.OctahedronGeometry(3.5, 0);
  const octMat = new THREE.MeshBasicMaterial({ color: GREEN, wireframe: true, transparent: true, opacity: 0.07 });
  const oct = new THREE.Mesh(octGeo, octMat);
  oct.position.set(22, 12, -18);
  scene.add(oct);
  shapes.push({ mesh: oct, rx: 0.014, ry: 0.018 });

  // ---- MOUSE ----
  let mx = 0, my = 0;
  document.addEventListener('mousemove', e => {
    mx = (e.clientX / window.innerWidth) * 2 - 1;
    my = -(e.clientY / window.innerHeight) * 2 + 1;
  });

  // ---- PAUSE WHEN HERO OFF-SCREEN ----
  let active = true;
  const vis = new IntersectionObserver(([e]) => { active = e.isIntersecting; }, { threshold: 0 });
  vis.observe(document.querySelector('.hero'));

  // ---- ANIMATION ----
  let g1z = 0, g2z = 0, scanZ = -125, t = 0;

  (function animate() {
    requestAnimationFrame(animate);
    if (!active) return;
    t += 0.01;

    // Grid scrolls toward camera
    g1z = (g1z + 0.05) % CELL1;
    g2z = (g2z + 0.025) % CELL2;
    grid1.position.z = g1z;
    grid2.position.z = g2z;

    // Scan line
    scanZ += 0.4;
    if (scanZ > 125) scanZ = -125;
    scanLine.position.z = scanZ;
    scanMat.opacity = 0.08 + 0.12 * Math.abs(Math.sin(t * 0.8));

    // Shapes
    shapes.forEach(s => {
      s.mesh.rotation.x += s.rx;
      s.mesh.rotation.y += s.ry;
    });
    ico.position.y    = 3 + Math.sin(t * 0.4) * 2;
    oct.position.y    = 12 + Math.sin(t * 0.55 + 1) * 2.5;
    torus.position.y  = -2 + Math.sin(t * 0.3 + 2) * 1.5;

    // Particles drift
    particles.rotation.y = t * 0.012;

    // Camera parallax from mouse
    camera.position.x += (mx * 4 - camera.position.x) * 0.02;
    camera.position.y += (my * 2 + 5 - camera.position.y) * 0.02;
    camera.lookAt(0, -1, -15);

    renderer.render(scene, camera);
  })();

  // Resize
  window.addEventListener('resize', () => {
    camera.aspect = canvas.clientWidth / canvas.clientHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(canvas.clientWidth, canvas.clientHeight);
  });
}

/* ================================================================
   HERO ANIMATIONS (GSAP)
   ================================================================ */
function initHeroAnimations() {
  // Name scramble + slide-up
  const name = document.getElementById('hero-name');
  gsap.to(name, {
    y: '0%',
    duration: 1.4,
    ease: 'power4.out',
    delay: 0.15,
    onStart: () => scrambleText(name, 'VINAYAK', 1400),
  });

  // Staggered content reveal
  gsap.to('.hero__eyebrow', { opacity: 1, y: 0, duration: 0.9, ease: 'power3.out', delay: 0.6 });
  gsap.to('.hero__role',    { opacity: 1, duration: 0.8, ease: 'power3.out', delay: 0.9 });
  gsap.to('.hero__desc',    { opacity: 1, y: 0, duration: 0.8, ease: 'power3.out', delay: 1.0 });
  gsap.to('.hero__actions', { opacity: 1, y: 0, duration: 0.8, ease: 'power3.out', delay: 1.1 });
  gsap.to('.hero__socials', { opacity: 1, duration: 0.8, ease: 'power3.out', delay: 1.2 });

  gsap.from('.hero__corner', { opacity: 0, duration: 1, ease: 'power3.out', delay: 1.4, stagger: 0.1 });
  gsap.from('.nav', { y: -20, opacity: 0, duration: 1, ease: 'power3.out', delay: 0.4 });
}

/* ================================================================
   SCRAMBLE TEXT EFFECT
   ================================================================ */
function scrambleText(el, finalText, duration) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&';
  let frame = 0;
  const total = Math.round(duration / 16);
  const id = setInterval(() => {
    const progress = frame / total;
    const revealed = Math.floor(progress * finalText.length);
    el.textContent = finalText
      .split('')
      .map((ch, i) => i < revealed ? ch : chars[Math.floor(Math.random() * chars.length)])
      .join('');
    frame++;
    if (frame >= total) { clearInterval(id); el.textContent = finalText; }
  }, 16);
}

/* ================================================================
   TYPEWRITER — role cycling
   ================================================================ */
function initTypewriter() {
  const el = document.getElementById('typewriter');
  if (!el) return;

  const phrases = [
    'GRC & Compliance Automation',
    'SOC Operations & SIEM',
    'Securing systems with code',
    'Ethical Hacking Enthusiast',
    'Building secure software',
  ];

  let pi = 0, ci = 0, deleting = false;

  function tick() {
    const phrase = phrases[pi];
    if (deleting) {
      ci--;
      el.textContent = phrase.slice(0, ci);
      if (ci === 0) {
        deleting = false;
        pi = (pi + 1) % phrases.length;
        setTimeout(tick, 500);
        return;
      }
      setTimeout(tick, 38);
    } else {
      ci++;
      el.textContent = phrase.slice(0, ci);
      if (ci === phrase.length) {
        setTimeout(() => { deleting = true; tick(); }, 2200);
        return;
      }
      setTimeout(tick, 65);
    }
  }

  // Start after hero reveals
  setTimeout(tick, 1800);
}

/* ================================================================
   GSAP SCROLL ANIMATIONS
   ================================================================ */
function initScrollAnimations() {
  // --- About heading lines (slide up from clip) ---
  gsap.utils.toArray('.about-heading__line').forEach((line, i) => {
    gsap.from(line, {
      y: '105%',
      opacity: 0,
      duration: 1.1,
      delay: i * 0.13,
      ease: 'power4.out',
      scrollTrigger: { trigger: '.about-heading', start: 'top 82%' },
    });
  });

  gsap.from('.about-bio', {
    opacity: 0, y: 28, stagger: 0.14, duration: 1,
    ease: 'power3.out',
    scrollTrigger: { trigger: '.about-right', start: 'top 80%' },
  });

  gsap.from('.about-stats, .about-details', {
    opacity: 0, y: 24, stagger: 0.12, duration: 0.9,
    ease: 'power3.out',
    scrollTrigger: { trigger: '.about-stats', start: 'top 85%' },
  });

  // --- Section labels ---
  gsap.utils.toArray('.section__label').forEach(el => {
    gsap.from(el, {
      opacity: 0, x: -20, duration: 0.8, ease: 'power3.out',
      scrollTrigger: { trigger: el, start: 'top 88%' },
    });
  });

  // --- Terminal + skills ---
  gsap.from('.terminal', {
    opacity: 0, x: -36, duration: 1, ease: 'power3.out',
    scrollTrigger: { trigger: '.skills-section', start: 'top 78%' },
  });
  gsap.from('.skills-group', {
    opacity: 0, y: 22, stagger: 0.1, duration: 0.8, ease: 'power3.out',
    scrollTrigger: { trigger: '.skills-tags', start: 'top 80%' },
  });

  // --- Experience jobs ---
  gsap.utils.toArray('.job').forEach((job, i) => {
    gsap.from(job, {
      opacity: 0, y: 24, duration: 0.8, delay: i * 0.06, ease: 'power3.out',
      scrollTrigger: { trigger: job, start: 'top 88%' },
    });
  });

  // --- Contact heading ---
  gsap.utils.toArray('.contact-heading__line').forEach((line, i) => {
    gsap.from(line, {
      y: '110%',
      opacity: 0,
      duration: 1.2,
      delay: i * 0.16,
      ease: 'power4.out',
      scrollTrigger: { trigger: '.contact-section', start: 'top 72%' },
    });
  });

  gsap.from('.contact-cta, .contact-links', {
    opacity: 0, y: 24, stagger: 0.1, duration: 0.9, ease: 'power3.out',
    scrollTrigger: { trigger: '.contact-cta', start: 'top 85%' },
  });

  // --- Footer ---
  gsap.from('.footer', {
    opacity: 0, duration: 0.8, ease: 'power3.out',
    scrollTrigger: { trigger: '.footer', start: 'top 95%' },
  });
}

/* ================================================================
   HORIZONTAL SCROLL — Projects
   ================================================================ */
function initHorizontalScroll() {
  const track = document.getElementById('projects-track');
  if (!track) return;

  requestAnimationFrame(() => {
    const distance = track.scrollWidth - window.innerWidth;

    const horizontalTween = gsap.to(track, {
      x: -distance,
      ease: 'none',
      scrollTrigger: {
        trigger: '.projects-section',
        pin: '.projects-sticky',
        scrub: 1.1,
        start: 'top top',
        end: () => '+=' + distance,
        invalidateOnRefresh: true,
      },
    });

    // Card fade-ins keyed to the horizontal scroll progress
    gsap.utils.toArray('.project-card').forEach((card, i) => {
      gsap.from(card, {
        opacity: 0,
        y: 40,
        duration: 0.9,
        ease: 'power3.out',
        scrollTrigger: {
          trigger: card,
          containerAnimation: horizontalTween,
          start: 'left 90%',
          toggleActions: 'play none none none',
        },
      });
    });
  });
}

/* ================================================================
   TERMINAL ANIMATION
   ================================================================ */
function initTerminalAnimation() {
  const body = document.getElementById('terminal-body');
  if (!body) return;

  const lines = [
    { text: '{', cls: 't-punc' },
    { text: '  <span class="t-key">"languages"</span><span class="t-punc">:</span> <span class="t-punc">[</span><span class="t-str">"Python"</span><span class="t-punc">,</span> <span class="t-str">"JavaScript"</span><span class="t-punc">,</span> <span class="t-str">"SQL"</span><span class="t-punc">,</span> <span class="t-str">"Bash"</span><span class="t-punc">],</span>' },
    { text: '  <span class="t-key">"siem_soar"</span><span class="t-punc">:</span> <span class="t-punc">[</span><span class="t-str">"IBM QRadar"</span><span class="t-punc">,</span> <span class="t-str">"Securonix"</span><span class="t-punc">,</span> <span class="t-str">"FortiSoar"</span><span class="t-punc">],</span>' },
    { text: '  <span class="t-key">"grc"</span><span class="t-punc">:</span> <span class="t-punc">[</span><span class="t-str">"SOC 2"</span><span class="t-punc">,</span> <span class="t-str">"ISO 27001"</span><span class="t-punc">,</span> <span class="t-str">"MITRE ATT&amp;CK"</span><span class="t-punc">],</span>' },
    { text: '  <span class="t-key">"tools"</span><span class="t-punc">:</span> <span class="t-punc">[</span><span class="t-str">"Git"</span><span class="t-punc">,</span> <span class="t-str">"Linux"</span><span class="t-punc">,</span> <span class="t-str">"Docker"</span><span class="t-punc">,</span> <span class="t-str">"React"</span><span class="t-punc">]</span>' },
    { text: '}', cls: 't-punc' },
    { type: 'cmd', text: 'echo $CURRENT_ROLE' },
    { text: '<span class="t-str">"GRC Intern & Software Developer @ Raksha Technologies"</span>' },
    { type: 'cmd', text: 'cat certifications.txt' },
    { text: '<span class="t-comment">// Ethical Hacking Essentials · IBM QRadar SIEM Foundation</span>' },
  ];

  const io = new IntersectionObserver(([entry]) => {
    if (!entry.isIntersecting) return;
    io.disconnect();

    let delay = 900;
    lines.forEach(line => {
      setTimeout(() => {
        const div = document.createElement('div');
        if (line.type === 'cmd') {
          div.className = 'terminal__line';
          div.innerHTML = `<span class="t-prompt">vinayak@dev:~$</span><span class="t-cmd"> ${line.text}</span>`;
        } else {
          div.innerHTML = `<span class="t-out">${line.text}</span>`;
        }
        body.appendChild(div);
        body.scrollTop = body.scrollHeight;
      }, delay);
      delay += line.type === 'cmd' ? 380 : 140;
    });
  }, { threshold: 0.4 });

  const terminal = document.querySelector('.terminal');
  if (terminal) io.observe(terminal);
}

/* ================================================================
   COUNTER ANIMATION (stats)
   ================================================================ */
function initCounters() {
  document.querySelectorAll('.stat__num[data-target]').forEach(el => {
    const target = parseInt(el.dataset.target, 10);
    const io = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting) return;
      io.disconnect();
      let current = 0;
      const step = target / 45;
      const id = setInterval(() => {
        current = Math.min(current + step, target);
        el.textContent = Math.floor(current);
        if (current >= target) clearInterval(id);
      }, 28);
    }, { threshold: 0.6 });
    io.observe(el);
  });
}

/* ================================================================
   MAGNETIC BUTTONS
   ================================================================ */
function initMagneticButtons() {
  if (window.matchMedia('(hover: none)').matches) return;
  document.querySelectorAll('.btn-primary, .btn-outline, .btn-sm').forEach(btn => {
    btn.addEventListener('mousemove', e => {
      const r = btn.getBoundingClientRect();
      const x = e.clientX - r.left - r.width / 2;
      const y = e.clientY - r.top  - r.height / 2;
      btn.style.transform = `translate(${x * 0.22}px, ${y * 0.22}px)`;
    });
    btn.addEventListener('mouseleave', () => {
      btn.style.transform = '';
    });
  });
}

/* ================================================================
   SCROLL-REACTIVE BACKGROUND
   ================================================================ */
function initScrollBackground() {
  const glow = document.querySelector('.section-glow');
  if (!glow) return;

  const root = document.documentElement;

  const palettes = [
    { id: 'top',        r: 0,   g: 255, b: 65,  px: 50, py: 5   },
    { id: 'about',      r: 0,   g: 210, b: 255, px: 20, py: 45  },
    { id: 'experience', r: 255, g: 130, b: 0,   px: 75, py: 30  },
    { id: 'projects',   r: 170, g: 0,   b: 255, px: 50, py: 60  },
    { id: 'education',  r: 30,  g: 120, b: 255, px: 25, py: 50  },
    { id: 'contact',    r: 0,   g: 255, b: 65,  px: 70, py: 85  },
  ];

  const state = { r: 0, g: 255, b: 65, px: 50, py: 5 };
  let activeTween = null;

  function tweenPalette(p) {
    if (activeTween) activeTween.kill();
    activeTween = gsap.to(state, {
      r: p.r, g: p.g, b: p.b, px: p.px, py: p.py,
      duration: 1.4,
      ease: 'power2.inOut',
      onUpdate() {
        const r = Math.round(state.r);
        const g = Math.round(state.g);
        const b = Math.round(state.b);
        const hex = '#' + [r, g, b].map(v => v.toString(16).padStart(2, '0')).join('');
        glow.style.background = `radial-gradient(ellipse 90% 55% at ${state.px.toFixed(1)}% ${state.py.toFixed(1)}%, rgba(${r},${g},${b},0.10) 0%, transparent 65%)`;
        root.style.setProperty('--green', hex);
      }
    });
  }

  palettes.forEach(p => {
    const el = document.getElementById(p.id);
    if (!el) return;
    ScrollTrigger.create({
      trigger: el,
      start: 'top center',
      onEnter: () => tweenPalette(p),
      onEnterBack: () => tweenPalette(p),
    });
  });
}
