/* ============================================================
   DEGLORA — main.js
   General interactions, stat counters, misc polish
   ============================================================ */

(function () {

  /* ---- CONCEPT STATS COUNTER ---- */
  const statsObserver = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;

      entry.target.querySelectorAll('.stat-num').forEach(el => {
        const raw = el.textContent.trim();
        if (raw === '0g' || raw === '100%' || raw === '∞') {
          // Just animate opacity + scale
          gsap.fromTo(el,
            { opacity: 0, scale: 0.85 },
            { opacity: 1, scale: 1, duration: 0.6, ease: 'back.out(2)' }
          );
        }
      });

      statsObserver.unobserve(entry.target);
    });
  }, { threshold: 0.6 });

  const statsEl = document.querySelector('.concept-stats');
  if (statsEl) statsObserver.observe(statsEl);

  /* ---- PRODUCT BOTTLE MOUSE PARALLAX ---- */
  const bottleStage = document.querySelector('.product-bottle-stage');
  const sbBottle = document.querySelector('.sb-bottle');

  if (bottleStage && sbBottle) {
    bottleStage.addEventListener('mousemove', e => {
      const rect = bottleStage.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      const dx = (e.clientX - cx) / rect.width;
      const dy = (e.clientY - cy) / rect.height;

      gsap.to(sbBottle, {
        rotateY: dx * 18,
        rotateX: -dy * 10,
        duration: 0.6,
        ease: 'power2.out',
        transformPerspective: 800
      });
    });

    bottleStage.addEventListener('mouseleave', () => {
      gsap.to(sbBottle, {
        rotateY: 0,
        rotateX: 0,
        duration: 0.8,
        ease: 'elastic.out(1, 0.5)'
      });
    });
  }

  /* ---- HERO PRODUCT MOUSE PARALLAX ---- */
  const heroSection = document.getElementById('hero');
  const heroProduct = document.querySelector('.hero-product');

  if (heroSection && heroProduct) {
    heroSection.addEventListener('mousemove', e => {
      const dx = (e.clientX / window.innerWidth - 0.5) * 20;
      const dy = (e.clientY / window.innerHeight - 0.5) * 10;
      gsap.to(heroProduct, {
        x: dx,
        y: dy,
        duration: 1,
        ease: 'power2.out'
      });
    });
  }

  /* ---- DATE ART ANIMATION ---- */
  gsap.to('.date-shape', {
    scale: 1.03,
    duration: 2.5,
    ease: 'sine.inOut',
    yoyo: true,
    repeat: -1
  });

  /* ---- GRANOLA CLUSTER ANIMATION ---- */
  document.querySelectorAll('.g-cluster').forEach((c, i) => {
    gsap.to(c, {
      y: -4,
      duration: 1.8 + i * 0.3,
      ease: 'sine.inOut',
      yoyo: true,
      repeat: -1,
      delay: i * 0.2
    });
  });

  /* ---- PALM TREE SWAY ---- */
  document.querySelectorAll('.palm-trunk').forEach((trunk, i) => {
    gsap.to(trunk, {
      rotateZ: i === 0 ? 2 : -2,
      duration: 3 + i,
      ease: 'sine.inOut',
      yoyo: true,
      repeat: -1,
      transformOrigin: 'bottom center'
    });
  });

  /* ---- FROND SWAY ---- */
  document.querySelectorAll('.frond').forEach((frond, i) => {
    gsap.to(frond, {
      rotateZ: `+=${2 + i * 0.5}`,
      duration: 2 + i * 0.4,
      ease: 'sine.inOut',
      yoyo: true,
      repeat: -1,
      delay: i * 0.15
    });
  });

  /* ---- BRAIN RING PULSE ---- */
  document.querySelectorAll('.brain-ring').forEach((ring, i) => {
    gsap.to(ring, {
      opacity: 0.2,
      duration: 1 + i * 0.3,
      ease: 'sine.inOut',
      yoyo: true,
      repeat: -1,
      delay: i * 0.2
    });
  });

  /* ---- FOOTER LOGO HOVER ---- */
  const footerLogo = document.querySelector('.footer-logo');
  if (footerLogo) {
    footerLogo.addEventListener('mouseenter', () => {
      gsap.to(footerLogo, { rotate: -3, scale: 1.05, duration: 0.3 });
    });
    footerLogo.addEventListener('mouseleave', () => {
      gsap.to(footerLogo, { rotate: 0, scale: 1, duration: 0.4, ease: 'back.out(2)' });
    });
  }

  /* ---- SECTION TRANSITIONS (background color) ---- */
  const sectionColors = {
    hero:           '#1a0e0a',
    concept:        '#fafaf0',
    customize:      '#1a0e0a',
    ai:             '#fafaf0',
    product:        '#ede8c8',
    rewards:        '#1a0e0a',
    sustainability: '#fafaf0',
    footer:         '#1a0e0a'
  };

  // Track active section
  const sectionIds = Object.keys(sectionColors);
  const sectionEls = sectionIds.map(id => document.getElementById(id)).filter(Boolean);

  const sectionObs = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting && entry.intersectionRatio > 0.4) {
        // Could trigger section-specific effects here
      }
    });
  }, { threshold: 0.4 });

  sectionEls.forEach(el => sectionObs.observe(el));

  /* ---- CONSOLE BRANDING ---- */
  console.log(
    '%c✦ DEGLORA %c— Rooted in Nature. Powered by Intelligence.',
    'color: #c9a84c; font-size: 1.2em; font-weight: bold;',
    'color: #722f37; font-size: 1em;'
  );

})();
