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

    // Mouse interaction for 3D tilt
    document.addEventListener('mousemove', function (e) {
      var centerX = window.innerWidth / 2;
      var centerY = window.innerHeight / 2;
      var xRatio = (e.clientX - centerX) / centerX;
      var yRatio = (e.clientY - centerY) / centerY;
      orbitTargetX = -yRatio * 80;
      orbitTargetY = xRatio * 80;
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

      // Move core pulse to match orbit center
      var core = orbitSystem.querySelector('.orbit-core');
      if (core) {
        var center = getOrbitCenter();
        core.style.left = center.cx + 'px';
        core.style.top = center.cy + 'px';
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

      node.style.left = x + 'px';
      node.style.top = y + 'px';
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

    window.addEventListener('mousemove', function (e) {
      mx = e.clientX;
      my = e.clientY;
    });

    function animate() {
      cx += (mx - cx) * 0.05;
      cy += (my - cy) * 0.05;
      mask.style.background =
        'radial-gradient(circle 300px at ' + cx.toFixed(0) + 'px ' + cy.toFixed(0) + 'px, ' +
        'transparent 0%, rgba(0,0,0,0.55) 50%, rgba(0,0,0,0.85) 100%)';
      requestAnimationFrame(animate);
    }
    animate();
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

    function switchToModule(index) {
      if (index === currentModule) return;

      // Pause previous module's foreground video
      var prevFgVideo = modules[currentModule].querySelector('.tc-fg-video');
      if (prevFgVideo) prevFgVideo.pause();

      currentModule = index;

      // Background videos (low opacity)
      bgVideos.forEach(function (v) {
        v.classList.toggle('active', parseInt(v.dataset.tc) === index);
      });

      // Sidebar tabs
      tabs.forEach(function (t) {
        t.classList.toggle('active', parseInt(t.dataset.tc) === index);
      });

      // Content modules
      modules.forEach(function (m) {
        m.classList.toggle('active', parseInt(m.dataset.tc) === index);
      });

      // Play current module's foreground video
      var fgVideo = modules[index].querySelector('.tc-fg-video');
      if (fgVideo) {
        fgVideo.currentTime = 0;
        fgVideo.play();
      }
    }

    // Click sidebar tabs to jump to that module
    tabs.forEach(function (tab) {
      tab.addEventListener('click', function () {
        var idx = parseInt(tab.dataset.tc);
        switchToModule(idx);
      });
    });

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
      dot.style.transform = 'translate(' + mouseX + 'px, ' + mouseY + 'px)';
    });

    var animateLoop = function () {
      ringX += (mouseX - ringX) * 0.5;
      ringY += (mouseY - ringY) * 0.5;
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
  function initTriangleAnimation() {
    var triangle = document.getElementById('triangleStatement');
    if (!triangle) return;
    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('triangle-animated');
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
