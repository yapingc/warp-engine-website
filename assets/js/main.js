/* ============================================================
   曲速引擎 - Product Website Scripts
   Pure vanilla JS, no GSAP, no frameworks
   ============================================================ */

(function () {
  'use strict';

  // Disable browser scroll restoration — always start from top on reload
  if ('scrollRestoration' in history) {
    history.scrollRestoration = 'manual';
  }

  // ==========================================================
  // 1. Init
  // ==========================================================
  function initHeroReveal() {
    revealHeroText();
    startOrbitAnimation();
  }

  // ==========================================================
  // 2. Hero Text Reveal (character-by-character)
  // ==========================================================
  function revealHeroText() {
    var elements = document.querySelectorAll('[data-reveal]');
    elements.forEach(function (el, elIdx) {
      var text = el.textContent.trim();
      el.innerHTML = '';
      el.classList.add('char-reveal');

      var chars = text.split('');
      chars.forEach(function (char, i) {
        var span = document.createElement('span');
        span.textContent = char === ' ' ? ' ' : char;
        span.style.transitionDelay = (i * 0.04) + 's';
        el.appendChild(span);
      });

      setTimeout(function () {
        el.classList.add('revealed');
      }, 300 + elIdx * 100);
    });
  }

  // ==========================================================
  // 3. Orbit System — DCC tools orbiting around Warp Core
  // ==========================================================
  var orbitNodes = [];
  var orbitTargetX = 0, orbitTargetY = 0;
  var orbitCurrentX = 0, orbitCurrentY = 0;
  var orbitSystem;
  var orbitRAF = null;

  // DCC tool labels that orbit the core
  var dccTools = [
    { label: 'Maya',        orbit: 130, speed: 12,  size: 1.0 },
    { label: 'Blender',     orbit: 190, speed: 19,  size: 0.9 },
    { label: 'Unity',       orbit: 250, speed: 28,  size: 0.85 },
    { label: 'Unreal',      orbit: 320, speed: 38,  size: 0.8 },
    { label: 'Photoshop',   orbit: 400, speed: 50,  size: 0.75 },
    { label: 'Substance',   orbit: 480, speed: 65,  size: 0.7 },
    { label: 'Houdini',     orbit: 560, speed: 80,  size: 0.65 },
    { label: 'ZBrush',      orbit: 640, speed: 95,  size: 0.6 },
  ];

  function getOrbitCenter() {
    var cx = window.innerWidth / 2 + orbitCurrentY * 5;
    var cy = window.innerHeight * 0.4 + orbitCurrentX * 5 - 40;
    return { cx: cx, cy: cy };
  }

  function createOrbitSystem() {
    orbitSystem = document.getElementById('orbitSystem');
    if (!orbitSystem) {
      console.warn('Orbit system element not found');
      return;
    }

    // Create orbit rings
    dccTools.forEach(function (tool) {
      var ring = document.createElement('div');
      ring.className = 'orbit-ring';
      ring.style.width = (tool.orbit * 2) + 'px';
      ring.style.height = (tool.orbit * 2) + 'px';
      ring.style.opacity = tool.orbit > 300 ? '0.85' : '1';
      orbitSystem.appendChild(ring);
    });

    // Position rings initially at center (CSS already handles translate(-50%,-50%))
    // Create orbiting nodes
    dccTools.forEach(function (tool, i) {
      var node = document.createElement('div');
      node.className = 'orbit-node';
      node.textContent = tool.label;
      // Randomize initial angle
      node.dataset.angle = (Math.random() * 360).toFixed(2);
      node.dataset.orbit = tool.orbit;
      node.dataset.speed = tool.speed;
      orbitSystem.appendChild(node);
      orbitNodes.push(node);
    });

    // Don't start animation yet — wait for loading to finish
    // (wrapper is display:none during loading, hero rect would be 0)

    // Mouse interaction for 3D tilt (throttled via RAF)
    var orbitMouseRAF = false;
    var pendingX = 0, pendingY = 0;
    document.addEventListener('mousemove', function (e) {
      var centerX = window.innerWidth / 2;
      var centerY = window.innerHeight / 2;
      pendingX = -((e.clientY - centerY) / centerY) * 80;
      pendingY = ((e.clientX - centerX) / centerX) * 80;
      if (!orbitMouseRAF) {
        orbitMouseRAF = true;
        requestAnimationFrame(function () {
          orbitTargetX = pendingX;
          orbitTargetY = pendingY;
          orbitMouseRAF = false;
        });
      }
    });

    document.addEventListener('mouseleave', function () {
      orbitTargetX = 0;
      orbitTargetY = 0;
    });

    // Recalculate center on resize
    window.addEventListener('resize', function () {
      updateNodePositions();
    });
  }

  function startOrbitTick() {
    if (!orbitSystem || orbitNodes.length === 0) return;
    if (orbitRAF) cancelAnimationFrame(orbitRAF);

    var lastTime = performance.now();

    function tick(now) {
      var dt = Math.min((now - lastTime) / 1000, 0.1);
      lastTime = now;

      // Idle drift + mouse tilt
      var idleDriftX = Math.sin(now * 0.0004) * 10;
      var idleDriftY = Math.cos(now * 0.0006) * 10;
      orbitCurrentX += (orbitTargetX + idleDriftX - orbitCurrentX) * 0.08;
      orbitCurrentY += (orbitTargetY + idleDriftY - orbitCurrentY) * 0.08;

      // Apply 3D tilt
      orbitSystem.style.animation = 'none';
      orbitSystem.style.transform =
        'rotateX(' + orbitCurrentX.toFixed(2) + 'deg) ' +
        'rotateY(' + orbitCurrentY.toFixed(2) + 'deg)';

      // Move core pulse to match orbit center (use transform for GPU compositing)
      var core = orbitSystem.querySelector('.orbit-core');
      if (core) {
        var center = getOrbitCenter();
        core.style.transform = 'translate(' + center.cx.toFixed(1) + 'px, ' + center.cy.toFixed(1) + 'px)';
      }

      updateNodePositions();

      orbitRAF = requestAnimationFrame(tick);
    }

    orbitRAF = requestAnimationFrame(tick);
  }

  function updateNodePositions() {
    var center = getOrbitCenter();
    orbitNodes.forEach(function (node) {
      var angle = parseFloat(node.dataset.angle);
      var orbit = parseFloat(node.dataset.orbit);
      var speed = parseFloat(node.dataset.speed);
      // Update angle on each call
      angle = (angle + speed * 0.016) % 360; // ~60fps step
      node.dataset.angle = angle.toFixed(2);

      var rad = angle * Math.PI / 180;
      var x = center.cx + orbit * Math.cos(rad);
      var y = center.cy + orbit * Math.sin(rad) * 0.5;

      // Use transform instead of left/top — compositor-only, no layout trigger
      node.style.transform = 'translate(' + x.toFixed(1) + 'px, ' + y.toFixed(1) + 'px)';
    });
  }

  // Called after loading screen fades out
  function startOrbitAnimation() {
    // Start the RAF tick loop and position nodes correctly now that
    // the hero section has real dimensions
    updateNodePositions();
    startOrbitTick();
  }

  // ==========================================================
  // 4. Hero Video — jaimru zoom-out + scroll away
  // ==========================================================
  function initHeroVideoScroll() {
    var videoStage = document.getElementById('heroVideoStage');
    if (!videoStage) return;

    var ticking = false;

    function update() {
      var rect = videoStage.getBoundingClientRect();
      var viewH = window.innerHeight;

      // Padding: start effect earlier and end later
      var pad = viewH * 1.5;
      var progress = (viewH + pad - rect.top) / (viewH + pad + rect.height + pad);
      progress = Math.max(0, Math.min(1, progress));

      // Asymmetric curve: fast snap to center, high resistance to leave
      var t = (progress - 0.5) * 2; // -1 (bottom) → 0 (center) → 1 (top)
      var shaped;
      if (t < 0) {
        // Entering: fast rise
        shaped = -Math.pow(Math.abs(t), 0.3);
      } else {
        // Leaving: very slow fall (power 6 → strong resistance)
        shaped = Math.pow(t, 6);
      }
      var scale = 1 - Math.abs(shaped) * 0.15;

      videoStage.style.transform = 'scale(' + scale.toFixed(3) + ')';
      ticking = false;
    }

    window.addEventListener('scroll', function () {
      if (!ticking) {
        requestAnimationFrame(update);
        ticking = true;
      }
    }, { passive: true });

    update();
  }


  // ==========================================================
  // 4.5. Intro Image Scroll Zoom (same as hero video)
  // ==========================================================
  function initIntroImageScroll() {
    var imgWrap = document.getElementById('introImage');
    if (!imgWrap) return;

    var ticking = false;

    function update() {
      var rect = imgWrap.getBoundingClientRect();
      var viewH = window.innerHeight;

      var pad = viewH * 1.5;
      var progress = (viewH + pad - rect.top) / (viewH + pad + rect.height + pad);
      progress = Math.max(0, Math.min(1, progress));

      // Asymmetric curve: fast snap to center, high resistance to leave
      var t = (progress - 0.5) * 2;
      var shaped;
      if (t < 0) {
        shaped = -Math.pow(Math.abs(t), 0.3);
      } else {
        shaped = Math.pow(t, 6);
      }
      var scale = 1 - Math.abs(shaped) * 0.12;

      imgWrap.style.transform = 'scale(' + scale.toFixed(3) + ')';
      ticking = false;
    }

    window.addEventListener('scroll', function () {
      if (!ticking) {
        requestAnimationFrame(update);
        ticking = true;
      }
    }, { passive: true });

    update();
  }


  function initSpotlight() {
    var mask = document.getElementById('spotlightMask');
    if (!mask) return;

    var mx = window.innerWidth / 2;
    var my = window.innerHeight / 2;
    var cx = mx, cy = my;
    var rafId = null;
    var idleTimer = null;
    var IDLE_TIMEOUT = 150; // stop RAF after 150ms of no mouse movement

    function startLoop() {
      if (rafId) return; // already running
      function animate() {
        cx += (mx - cx) * 0.05;
        cy += (my - cy) * 0.05;
        mask.style.background =
          'radial-gradient(circle 300px at ' + cx.toFixed(0) + 'px ' + cy.toFixed(0) + 'px, ' +
          'transparent 0%, rgba(0,0,0,0.55) 50%, rgba(0,0,0,0.85) 100%)';
        rafId = requestAnimationFrame(animate);
      }
      rafId = requestAnimationFrame(animate);
    }

    function stopLoop() {
      if (rafId) {
        cancelAnimationFrame(rafId);
        rafId = null;
      }
    }

    window.addEventListener('mousemove', function (e) {
      mx = e.clientX;
      my = e.clientY;
      // Restart RAF if it was stopped
      if (!rafId) startLoop();
      // Reset idle timer
      clearTimeout(idleTimer);
      idleTimer = setTimeout(stopLoop, IDLE_TIMEOUT);
    });

    // Start initially
    startLoop();
    idleTimer = setTimeout(stopLoop, IDLE_TIMEOUT);
  }

  // ==========================================================
  // 5. Section Title Scroll Reveal (alessioatzeni-style perspective)
  // ==========================================================
  function initTitleReveal() {
    var titles = document.querySelectorAll('.section-title');
    titles.forEach(function (title) {
      title.classList.add('split-reveal');
      var words = title.textContent.trim().split(/\s+/);
      title.innerHTML = '';
      words.forEach(function (word, wi) {
        var wordSpan = document.createElement('span');
        wordSpan.className = 'word';
        // small gap between words
        if (wi > 0) {
          var gap = document.createTextNode(' ');
          title.appendChild(gap);
        }
        word.split('').forEach(function (char, ci) {
          var charSpan = document.createElement('span');
          charSpan.className = 'char';
          charSpan.textContent = char;
          charSpan.style.transitionDelay = (wi * 0.1 + ci * 0.03) + 's';
          wordSpan.appendChild(charSpan);
        });
        title.appendChild(wordSpan);
      });
    });

    // Observe and reveal
    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('revealed');
        }
      });
    }, { threshold: 0.3, rootMargin: '0px 0px -60px 0px' });

    titles.forEach(function (t) { observer.observe(t); });
  }
  function initFadeIn() {
    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
        }
      });
    }, { threshold: 0.15, rootMargin: '0px 0px -40px 0px' });

    document.querySelectorAll('.fade-in').forEach(function (el) {
      observer.observe(el);
    });
  }

  // ==========================================================
  // 6. Review Cards — staggered 2-column scroll reveal
  // ==========================================================
  function initReviewGrid() {
    var cards = document.querySelectorAll('.review-card');
    if (cards.length === 0) return;

    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          var idx = parseInt(entry.target.dataset.review);
          entry.target.style.transitionDelay = (idx * 0.12) + 's';
          entry.target.classList.add('visible');
        }
      });
    }, { threshold: 0.15, rootMargin: '0px 0px -30px 0px' });

    cards.forEach(function (card) { observer.observe(card); });
  }

  // ==========================================================
  // 7. Toolchain Scroll-Replace (Wireflow-style)
  //    Scroll through 400vh stage, modules swap in-place
  // ==========================================================
  function initToolchainScroll() {
    var stage = document.getElementById('toolchainStage');
    var tabs = document.querySelectorAll('.tc-stage-tab');
    var bgVideos = document.querySelectorAll('.tc-bg-video');
    var modules = document.querySelectorAll('.tc-module');
    if (!stage || tabs.length === 0) return;

    var MODULE_COUNT = 4;
    var currentModule = 0;
    var loadedModules = {}; // track which modules have been loaded
    var switchTimer = null; // pending transition timer

    function lazyLoadModule(index) {
      if (loadedModules[index]) return;
      loadedModules[index] = true;

      // Load background video
      var bgVideo = bgVideos[index];
      var bgSource = bgVideo && bgVideo.querySelector('source');
      if (bgSource && bgSource.dataset.src) {
        bgSource.src = bgSource.dataset.src;
        bgVideo.load();
      }

      // Load foreground video
      var fgVideo = modules[index] && modules[index].querySelector('.tc-fg-video');
      var fgSource = fgVideo && fgVideo.querySelector('source');
      if (fgSource && fgSource.dataset.src) {
        fgSource.src = fgSource.dataset.src;
        fgVideo.load();
      }
    }

    // Load module 0 immediately (it's the active one)
    lazyLoadModule(0);

    // Pause all bg videos except index 0 on init
    bgVideos.forEach(function (v) {
      if (parseInt(v.dataset.tc) !== 0) v.pause();
    });

    // Use IntersectionObserver to load other modules when they get close to viewport
    if ('IntersectionObserver' in window) {
      var rootMargin = window.innerHeight * 1.5 + 'px'; // preload when within 1.5 viewport heights
      var observer = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            var idx = parseInt(entry.target.dataset.tc);
            if (!isNaN(idx)) lazyLoadModule(idx);
            observer.unobserve(entry.target);
          }
        });
      }, { rootMargin: rootMargin + ' 0px' });

      // Observe each module
      modules.forEach(function (mod) {
        var idx = parseInt(mod.dataset.tc);
        if (idx !== 0) observer.observe(mod);
      });
    } else {
      // Fallback for browsers without IntersectionObserver
      setTimeout(function () { lazyLoadModule(1); }, 1000);
      setTimeout(function () { lazyLoadModule(2); }, 2500);
      setTimeout(function () { lazyLoadModule(3); }, 4500);
    }

    function switchToModule(index) {
      if (index === currentModule) return;

      if (switchTimer) { clearTimeout(switchTimer); switchTimer = null; }

      var prevIndex = currentModule;
      currentModule = index;

      // Pause previous module's foreground video
      var prevFgVideo = modules[prevIndex].querySelector('.tc-fg-video');
      if (prevFgVideo) prevFgVideo.pause();

      // Lazy-load this module's videos if not yet loaded
      lazyLoadModule(index);

      // Background videos — switch immediately (1s CSS transition handles it)
      bgVideos.forEach(function (v) {
        var isActive = parseInt(v.dataset.tc) === index;
        v.classList.toggle('active', isActive);
        if (isActive) {
          v.play();
        } else {
          v.pause();
        }
      });

      // Sidebar tabs — update immediately for responsiveness
      tabs.forEach(function (t) {
        t.classList.toggle('active', parseInt(t.dataset.tc) === index);
      });

      // Exit previous module: scale-up + fade out
      modules[prevIndex].classList.remove('active');
      modules[prevIndex].classList.add('tc-exiting');

      // Enter new module after delay for clear out→in sequence
      switchTimer = setTimeout(function () {
        modules.forEach(function (m) { m.classList.remove('active', 'tc-exiting'); });
        modules[index].classList.add('active');

        var fgVideo = modules[index].querySelector('.tc-fg-video');
        if (fgVideo) {
          fgVideo.currentTime = 0;
          fgVideo.play();
        }
        switchTimer = null;
      }, 220);
    }

    // Click sidebar tabs to jump to that module
    tabs.forEach(function (tab) {
      tab.addEventListener('click', function () {
        var idx = parseInt(tab.dataset.tc);
        switchToModule(idx);
      });
    });

    // ---- Wheel interception: one scroll notch = one module, no skipping ----
    var snapLocked = false;
    var snapWheelAccum = 0;

    function getModuleSnapPositions() {
      var stageTop = stage.getBoundingClientRect().top + window.scrollY;
      var totalScroll = stage.offsetHeight - window.innerHeight;
      var positions = [];
      for (var i = 0; i < MODULE_COUNT; i++) {
        // Midpoint of each module's scroll range → always maps to correct module
        positions.push(Math.round(stageTop + totalScroll * (i + 0.5) / MODULE_COUNT));
      }
      return positions;
    }

    window.addEventListener('wheel', function (e) {
      var rect = stage.getBoundingClientRect();
      // Only intercept while sticky inner is actively pinned
      if (rect.top > 0 || rect.bottom < window.innerHeight) return;

      var goingDown = e.deltaY > 0;
      var goingUp   = e.deltaY < 0;

      // At first module scrolling up or last module scrolling down → let through
      if (goingUp   && currentModule === 0)                 return;
      if (goingDown && currentModule === MODULE_COUNT - 1)  return;

      e.preventDefault();

      if (snapLocked) return;

      snapWheelAccum += e.deltaY;
      if (Math.abs(snapWheelAccum) < 80) return; // need ~1 notch before switching

      var direction = snapWheelAccum > 0 ? 1 : -1;
      snapWheelAccum = 0;
      snapLocked = true;

      var targetModule = Math.max(0, Math.min(MODULE_COUNT - 1, currentModule + direction));
      window.scrollTo({ top: getModuleSnapPositions()[targetModule], behavior: 'smooth' });

      setTimeout(function () { snapLocked = false; snapWheelAccum = 0; }, 750);
    }, { passive: false });
    // -----------------------------------------------------------------------

    // Scroll-driven switching
    var ticking = false;
    window.addEventListener('scroll', function () {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(function () {
        var rect = stage.getBoundingClientRect();
        var stageHeight = stage.offsetHeight;
        var viewportHeight = window.innerHeight;

        // How far into the stage are we (as a fraction)?
        // stage starts at rect.top, we want to know how much has scrolled past
        var scrolledPast = -rect.top;
        var totalScroll = stageHeight - viewportHeight;
        var progress = Math.max(0, Math.min(1, scrolledPast / totalScroll));

        // Map progress (0→1) to module index (0→3)
        var idx = Math.floor(progress * MODULE_COUNT);
        if (idx >= MODULE_COUNT) idx = MODULE_COUNT - 1;

        switchToModule(idx);
        ticking = false;
      });
    }, { passive: true });
  }

  // ==========================================================
  // 8. Parallax on Hero section
  // ==========================================================
  function initParallax() {
    var heroCircles = document.querySelector('.hero-circles');
    if (!heroCircles) return;

    var ticking = false;
    var lastScrollY = window.scrollY;

    function update() {
      var scrollY = window.scrollY;
      var hero = document.getElementById('hero');
      if (!hero) return;

      var heroHeight = hero.offsetHeight;
      var heroTop = hero.offsetTop;
      var relativeScroll = scrollY - heroTop;

      if (relativeScroll > 0 && relativeScroll < heroHeight) {
        var progress = relativeScroll / heroHeight;
        heroCircles.style.transform =
          'translate(-50%, calc(-50% + ' + (progress * 60) + 'px))';
        heroCircles.style.opacity = 1 - progress;
      }

      ticking = false;
    }

    window.addEventListener('scroll', function () {
      if (!ticking) {
        requestAnimationFrame(update);
        ticking = true;
      }
    }, { passive: true });
  }

  // ==========================================================
  // 9. Nav hide/show on scroll
  // ==========================================================
  function initNavScroll() {
    var nav = document.getElementById('nav');
    if (!nav) return;

    var lastScrollY = 0;
    var ticking = false;

    function update() {
      var scrollY = window.scrollY;
      if (scrollY > 300 && scrollY > lastScrollY + 5) {
        nav.classList.add('hidden');
      } else if (scrollY < lastScrollY - 5) {
        nav.classList.remove('hidden');
      }
      lastScrollY = scrollY;
      ticking = false;
    }

    window.addEventListener('scroll', function () {
      if (!ticking) {
        requestAnimationFrame(update);
        ticking = true;
      }
    }, { passive: true });
  }

  // ==========================================================
  // 10. Initialize everything on DOM ready
  // ==========================================================

  // ==========================================================
  // 11. Custom Cursor (alessioatzeni-style circle cursor)
  // ==========================================================
  function initCustomCursor() {
    var dot = document.getElementById('cursorDot');
    var ring = document.getElementById('cursorRing');
    var cursor = document.getElementById('customCursor');
    if (!dot || !ring) return;

    document.body.classList.add('custom-cursor');

    var mouseX = 0, mouseY = 0;
    var ringX = 0, ringY = 0;

    document.addEventListener('mousemove', function (e) {
      mouseX = e.clientX;
      mouseY = e.clientY;
      // Update dot immediately on own RAF to avoid layout thrashing
      if (!dotRAF) {
        dotRAF = true;
        requestAnimationFrame(function () {
          dot.style.transform = 'translate(' + mouseX + 'px, ' + mouseY + 'px)';
          dotRAF = false;
        });
      }
    });

    var dotRAF = false;
    var animateLoop = function () {
      ringX += (mouseX - ringX) * 0.6;
      ringY += (mouseY - ringY) * 0.6;
      var tx = 'translate(' + ringX.toFixed(1) + 'px, ' + ringY.toFixed(1) + 'px)';
      ring.style.transform = tx;
      requestAnimationFrame(animateLoop);
    };
    animateLoop();

    var hoverTargets = document.querySelectorAll('a, button, .btn, [data-modal], .tc-stage-tab, .back-to-top');
    hoverTargets.forEach(function (el) {
      el.addEventListener('mouseenter', function () { cursor.classList.add('hover'); });
      el.addEventListener('mouseleave', function () { cursor.classList.remove('hover'); });
    });

    document.addEventListener('mouseleave', function () { cursor.style.opacity = '0'; });
    document.addEventListener('mouseenter', function () { cursor.style.opacity = '1'; });
  }


  // ==========================================================
  // 6. Capability Cards Slide-in from Right
  // ==========================================================
  function initCapSlideIn() {
    var cards = document.querySelectorAll('.cap-card');
    if (!cards.length) return;
    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('slide-in');
        }
      });
    }, { threshold: 0.2, rootMargin: '0px 0px -40px 0px' });
    cards.forEach(function (card) { observer.observe(card); });
  }

  // ==========================================================
  // Triangle Statement Animation
  // ==========================================================
  function initMeteorAnim() {
    var svg = document.querySelector('.triangle-svg');
    if (!svg || svg._meteorStarted) return;
    svg._meteorStarted = true;

    var tailGlow = document.getElementById('meteorTailGlowEl');
    var tailCore = document.getElementById('meteorTailCoreEl');
    var headEl   = document.getElementById('meteorHeadEl');
    var grad     = document.getElementById('meteorGrad');
    if (!tailGlow || !tailCore || !headEl || !grad) return;

    // Path: Top(150,20) → Left(20,240) → Right(280,240) → Top  (perimeter ≈ 770.98)
    var L1 = 255.49 / 770.98; // 0.3314 — fraction at left vertex
    var L2 = 515.49 / 770.98; // 0.6686 — fraction at right vertex

    // Key times / key points (4 s glow cycle)
    var KT = [0, 0.1, 0.4, 0.7, 1.0];
    var KP = [0, 0,   L1,  L2,  1.0];

    var CYCLE     = 4000;
    var TAIL_FRAC = 0.07;  // 7 % of perimeter
    var TAIL_PTS  = 24;

    function tfToFrac(tf) {
      for (var i = 0; i < KT.length - 1; i++) {
        if (tf <= KT[i + 1]) {
          var s = (tf - KT[i]) / (KT[i + 1] - KT[i]);
          return KP[i] + s * (KP[i + 1] - KP[i]);
        }
      }
      return 1;
    }

    function fracToPos(f) {
      f = ((f % 1) + 1) % 1;
      if (f <= L1) {
        var t = f / L1;
        return { x: 150 - t * 130, y: 20 + t * 220 };
      } else if (f <= L2) {
        var t = (f - L1) / (L2 - L1);
        return { x: 20 + t * 260, y: 240 };
      } else {
        var t = (f - L2) / (1 - L2);
        return { x: 280 - t * 130, y: 240 - t * 220 };
      }
    }

    var startTime = null;

    function frame(ts) {
      if (!startTime) startTime = ts;
      var timeFrac = ((ts - startTime) % CYCLE) / CYCLE;
      var headFrac = tfToFrac(timeFrac);
      var headPos  = fracToPos(headFrac);

      // Tail length ramps up 0.1→0.15 when particle departs top vertex
      var tailLen;
      if (timeFrac < 0.1) {
        tailLen = 0;
      } else if (timeFrac < 0.16) {
        tailLen = ((timeFrac - 0.1) / 0.06) * TAIL_FRAC;
      } else {
        tailLen = TAIL_FRAC;
      }

      // Build polyline points: tail end (i=0) → head (i=TAIL_PTS)
      var pts = [];
      for (var i = 0; i <= TAIL_PTS; i++) {
        var f = headFrac - ((TAIL_PTS - i) / TAIL_PTS) * tailLen;
        pts.push(fracToPos(f));
      }
      var pStr = pts.map(function (p) {
        return p.x.toFixed(1) + ',' + p.y.toFixed(1);
      }).join(' ');

      tailGlow.setAttribute('points', pStr);
      tailCore.setAttribute('points', pStr);

      // Gradient: tail end (transparent) → head (opaque)
      var te = pts[0];
      grad.setAttribute('x1', te.x.toFixed(1));
      grad.setAttribute('y1', te.y.toFixed(1));
      grad.setAttribute('x2', headPos.x.toFixed(1));
      grad.setAttribute('y2', headPos.y.toFixed(1));

      headEl.setAttribute('cx', headPos.x.toFixed(1));
      headEl.setAttribute('cy', headPos.y.toFixed(1));

      requestAnimationFrame(frame);
    }

    requestAnimationFrame(frame);
  }

  function initTriangleAnimation() {
    var triangle = document.getElementById('triangleStatement');
    if (!triangle) return;
    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('triangle-animated');
          initMeteorAnim();
        }
      });
    }, { threshold: 0.3, rootMargin: '0px 0px -40px 0px' });
    observer.observe(triangle);
  }

  // ==========================================================
  // 12. Back to Top Button
  // ==========================================================
  function initBackToTop() {
    var btn = document.getElementById('backToTop');
    if (!btn) return;

    var ticking = false;

    function update() {
      var scrolled = window.scrollY;
      var viewH = window.innerHeight;

      if (scrolled > viewH) {
        btn.classList.add('visible');
      } else {
        btn.classList.remove('visible');
      }
      ticking = false;
    }

    window.addEventListener('scroll', function () {
      if (!ticking) {
        requestAnimationFrame(update);
        ticking = true;
      }
    }, { passive: true });

    btn.addEventListener('click', function () {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

  function init() {
    // Always start from top
    window.scrollTo(0, 0);

    createOrbitSystem();
    initHeroVideoScroll();
    initIntroImageScroll();
    initSpotlight();
    initFadeIn();
    initTitleReveal();
    initCapSlideIn();
    initTriangleAnimation();
    initReviewGrid();
    initToolchainScroll();
    initParallax();
    initCustomCursor();
    initBackToTop();
    initHeroReveal();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
