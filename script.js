(function () {
  var spacer = document.getElementById('intro-spacer');
  var photoLayer = document.getElementById('photo-layer');
  var logoLayer = document.getElementById('logo-layer');
  var logoImg = document.getElementById('logo-img');
  var brandLayer = document.getElementById('brand-layer');
  var brandName = document.getElementById('brand-name');
  var scanlines = document.querySelector('.scanlines');
  var slices = document.querySelectorAll('.glitch-slice');
  var scrollHint = document.getElementById('scroll-hint');

  var TARGET_TEXT = 'FinalVault';
  var SCRAMBLE_CHARS = 'アイウエオカキクケコ01#$%&*<>/\\{}[]?!ΞΩΨΔ日本語암호화';

  var prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // ---- Decrypt-text effect: as `revealFraction` (0..1) increases, more
  // characters from the left lock into their real letter; the rest cycle
  // through random scramble characters each animation frame. ----
  var scrambleFrame = 0;
  function renderBrandText(revealFraction) {
    var revealCount = Math.floor(TARGET_TEXT.length * revealFraction);
    var out = '';
    for (var i = 0; i < TARGET_TEXT.length; i++) {
      if (i < revealCount) {
        out += TARGET_TEXT[i];
      } else {
        out += SCRAMBLE_CHARS[Math.floor(Math.random() * SCRAMBLE_CHARS.length)];
      }
    }
    brandName.textContent = out;
  }

  var currentRevealFraction = 0;
  var scrambling = false;
  function scrambleLoop() {
    if (!scrambling) return;
    renderBrandText(currentRevealFraction);
    scrambleFrame = requestAnimationFrame(scrambleLoop);
  }
  function startScramble() {
    if (scrambling) return;
    scrambling = true;
    scrambleLoop();
  }
  function stopScramble(finalText) {
    scrambling = false;
    if (scrambleFrame) cancelAnimationFrame(scrambleFrame);
    if (finalText !== undefined) brandName.textContent = finalText;
  }

  function applyProgress(p) {
    var progress = Math.max(0, Math.min(1, p));

    // ---- Phase A: photo -> logo, roughly 0 to 0.45 ----
    var phaseA = Math.max(0, Math.min(1, progress / 0.45));
    photoLayer.style.opacity = String(1 - phaseA);
    logoLayer.style.opacity = String(phaseA);

    // Glitch intensity peaks in the middle of phase A, fades at both ends.
    var glitchIntensity = phaseA < 0.5
      ? phaseA / 0.5
      : (1 - phaseA) / 0.5;
    scanlines.style.opacity = String(0.6 * glitchIntensity);
    slices.forEach(function (slice, i) {
      var active = glitchIntensity > 0.15;
      slice.style.opacity = active ? String(0.35 * glitchIntensity) : '0';
      var jitter = active ? (Math.sin(progress * 400 + i * 37) * 10 * glitchIntensity) : 0;
      slice.style.transform = 'translateX(' + jitter + 'px)';
    });

    // ---- Phase B: logo shrinks + moves up, brand name decrypts in, 0.45 to 0.85 ----
    var phaseB = Math.max(0, Math.min(1, (progress - 0.45) / 0.4));
    var logoScale = 1 - 0.55 * phaseB; // shrinks to 45% size
    var logoLift = -14 * phaseB; // moves up (vh)
    logoImg.style.transform = 'scale(' + logoScale + ') translateY(' + logoLift + 'vh)';

    brandLayer.style.opacity = String(Math.min(1, phaseB / 0.3));

    if (phaseB > 0 && phaseB < 1) {
      startScramble();
      currentRevealFraction = phaseB;
    } else if (phaseB >= 1) {
      stopScramble(TARGET_TEXT);
    } else {
      stopScramble('');
    }

    scrollHint.style.opacity = String(progress > 0.05 && progress < 0.35 ? 1 : 0);
  }

  function update() {
    var rect = spacer.getBoundingClientRect();
    var spacerHeight = spacer.offsetHeight;
    var viewportHeight = window.innerHeight;
    var scrolledInto = -rect.top;
    var scrollableDistance = spacerHeight - viewportHeight;
    var progress = scrollableDistance > 0 ? scrolledInto / scrollableDistance : 1;
    applyProgress(progress);
  }

  var ticking = false;
  function onScroll() {
    if (!ticking) {
      window.requestAnimationFrame(function () {
        update();
        ticking = false;
      });
      ticking = true;
    }
    updateActiveTab();
  }

  if (prefersReducedMotion) {
    photoLayer.style.opacity = '0';
    logoLayer.style.opacity = '1';
    logoImg.style.transform = 'scale(0.45) translateY(-14vh)';
    brandLayer.style.opacity = '1';
    brandName.textContent = TARGET_TEXT;
    spacer.style.height = '100vh';
  } else {
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', update);
    update();
  }

  // ---------- Reveal-on-scroll for sections after the intro ----------
  var revealEls = document.querySelectorAll('.reveal-block');
  if ('IntersectionObserver' in window) {
    var observer = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) entry.target.classList.add('visible');
        });
      },
      { threshold: 0.15 }
    );
    revealEls.forEach(function (el) { observer.observe(el); });
  } else {
    revealEls.forEach(function (el) { el.classList.add('visible'); });
  }

  // ---------- Tab bar active-state tracking ----------
  var tabItems = document.querySelectorAll('.tab-item');
  var tabTargets = Array.prototype.map.call(tabItems, function (item) {
    var id = item.getAttribute('href').replace('#', '');
    return { item: item, el: document.getElementById(id) };
  }).filter(function (t) { return t.el; });

  function updateActiveTab() {
    var pos = window.scrollY + window.innerHeight * 0.4;
    var current = tabTargets[0];
    tabTargets.forEach(function (t) {
      if (t.el.offsetTop <= pos) current = t;
    });
    tabItems.forEach(function (item) { item.classList.remove('active'); });
    if (current) current.item.classList.add('active');
  }
  updateActiveTab();
})();
