/* ============================================================
   DEGLORA — animations.js
   GSAP + ScrollTrigger setup, hero entrance, parallax
   ============================================================ */

(function () {
  // Register GSAP plugins
  gsap.registerPlugin(ScrollTrigger, ScrollToPlugin);

  /* ---- PAGE LOAD OVERLAY ---- */
  const overlay = document.createElement('div');
  overlay.className = 'page-overlay';
  document.body.appendChild(overlay);

  gsap.to(overlay, {
    opacity: 0,
    duration: 1.2,
    ease: 'power2.out',
    delay: 0.3,
    onComplete: () => overlay.remove()
  });

  /* ---- HERO ENTRANCE ---- */
  const tl = gsap.timeline({ delay: 0.8 });

  // Eyebrow
  tl.to('.hero-eyebrow', { opacity: 1, y: 0, duration: 0.7, ease: 'power2.out' }, 0)
  // Lines
  tl.to('.hero-headline .line', {
    opacity: 1,
    y: 0,
    duration: 0.9,
    ease: 'power3.out',
    stagger: 0.18
  }, 0.1)
  // Sub
  tl.to('.hero-sub', { opacity: 1, y: 0, duration: 0.8, ease: 'power2.out' }, 0.4)
  // Actions
  tl.to('.hero-actions', { opacity: 1, y: 0, duration: 0.7, ease: 'power2.out' }, 0.6)
  // Product bottle
  tl.to('.hero-product', {
    opacity: 1,
    x: 0,
    duration: 1.1,
    ease: 'power3.out'
  }, 0.5)
  // Scroll hint
  tl.to('.scroll-hint', { opacity: 1, y: 0, duration: 0.6, ease: 'power2.out' }, 1.1);

  // Set initial state for hero elements
  gsap.set('.hero-product', { x: 80 });

  /* ---- HERO BOTTLE FLOAT ---- */
  gsap.to('.bottle-wrapper', {
    y: -14,
    duration: 3.5,
    ease: 'sine.inOut',
    yoyo: true,
    repeat: -1
  });

  /* ---- NAVBAR SCROLL ---- */
  ScrollTrigger.create({
    start: 'top -60',
    onEnter: () => document.getElementById('navbar').classList.add('scrolled'),
    onLeaveBack: () => document.getElementById('navbar').classList.remove('scrolled')
  });

  /* ---- SCROLL REVEAL (IntersectionObserver) ---- */
  const revealObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          revealObserver.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.15, rootMargin: '0px 0px -60px 0px' }
  );

  document.querySelectorAll('.reveal-text, .reveal-card').forEach(el => {
    revealObserver.observe(el);
  });

  // Stagger siblings
  document.querySelectorAll('.concept-visual .reveal-card').forEach((el, i) => {
    el.style.transitionDelay = `${i * 0.12}s`;
  });
  document.querySelectorAll('.product-details .reveal-card').forEach((el, i) => {
    el.style.transitionDelay = `${i * 0.1}s`;
  });
  document.querySelectorAll('.rewards-flow .reveal-card').forEach((el, i) => {
    el.style.transitionDelay = `${i * 0.15}s`;
  });

  /* ---- GSAP PARALLAX ON HERO ORBS ---- */
  gsap.to('.orb-1', {
    y: -80,
    ease: 'none',
    scrollTrigger: {
      trigger: '#hero',
      start: 'top top',
      end: 'bottom top',
      scrub: 1.5
    }
  });
  gsap.to('.orb-2', {
    y: -40,
    ease: 'none',
    scrollTrigger: {
      trigger: '#hero',
      start: 'top top',
      end: 'bottom top',
      scrub: 2
    }
  });

  /* ---- SECTION TITLE PARALLAX ---- */
  gsap.utils.toArray('.section-title').forEach(title => {
    gsap.fromTo(title, { y: 20 }, {
      y: -20,
      ease: 'none',
      scrollTrigger: {
        trigger: title,
        start: 'top bottom',
        end: 'bottom top',
        scrub: 1.2
      }
    });
  });

  /* ---- CONCEPT CARD PARALLAX ---- */
  gsap.to('.card-1', {
    y: -30,
    ease: 'none',
    scrollTrigger: {
      trigger: '#concept',
      start: 'top bottom',
      end: 'bottom top',
      scrub: 1.5
    }
  });
  gsap.to('.card-2', {
    y: -15,
    ease: 'none',
    scrollTrigger: {
      trigger: '#concept',
      start: 'top bottom',
      end: 'bottom top',
      scrub: 2
    }
  });

  /* ---- PRODUCT BOTTLE ROTATION ON SCROLL ---- */
  gsap.to('#showcaseBottle .sb-bottle', {
    rotateY: 12,
    ease: 'none',
    scrollTrigger: {
      trigger: '#product',
      start: 'top bottom',
      end: 'bottom top',
      scrub: 2
    }
  });

  /* ---- CUSTOM CURSOR ---- */
  const dot = document.createElement('div');
  dot.className = 'cursor-dot';
  const ring = document.createElement('div');
  ring.className = 'cursor-ring';
  document.body.appendChild(dot);
  document.body.appendChild(ring);

  let mouseX = 0, mouseY = 0;
  let ringX = 0, ringY = 0;

  window.addEventListener('mousemove', e => {
    mouseX = e.clientX;
    mouseY = e.clientY;
    gsap.to(dot, { x: mouseX, y: mouseY, duration: 0.08, ease: 'none' });
  });

  // Smooth ring follow
  const followRing = () => {
    ringX += (mouseX - ringX) * 0.12;
    ringY += (mouseY - ringY) * 0.12;
    gsap.set(ring, { x: ringX, y: ringY });
    requestAnimationFrame(followRing);
  };
  followRing();

  // Hover states for interactive elements
  document.querySelectorAll('a, button, .addin-card, .quiz-opt, .concept-card').forEach(el => {
    el.addEventListener('mouseenter', () => {
      gsap.to(ring, { width: 56, height: 56, opacity: 0.8, duration: 0.25 });
      gsap.to(dot, { scale: 0.5, duration: 0.2 });
    });
    el.addEventListener('mouseleave', () => {
      gsap.to(ring, { width: 36, height: 36, opacity: 0.5, duration: 0.25 });
      gsap.to(dot, { scale: 1, duration: 0.2 });
    });
  });

  /* ---- MOBILE MENU ---- */
  const burger = document.getElementById('navBurger');
  let mobileMenu = null;

  if (burger) {
    mobileMenu = document.createElement('div');
    mobileMenu.className = 'mobile-menu';
    mobileMenu.innerHTML = `
      <button class="mobile-menu-close">✕</button>
      <a href="#concept" data-mobile>The Concept</a>
      <a href="#customize" data-mobile>Customize</a>
      <a href="#ai" data-mobile>AI Mix</a>
      <a href="#product" data-mobile>Product</a>
      <a href="#rewards" data-mobile>Rewards</a>
      <a href="#sustainability" data-mobile>Origin</a>
      <div class="mobile-menu-divider"></div>
      <button class="mobile-menu-signin" id="mobileSignIn">Sign In / Create Account</button>
    `;
    document.body.appendChild(mobileMenu);

    burger.addEventListener('click', () => {
      mobileMenu.classList.add('open');
      gsap.fromTo(mobileMenu.querySelectorAll('a, button:not(.mobile-menu-close)'),
        { opacity: 0, y: 20 },
        { opacity: 1, y: 0, duration: 0.4, stagger: 0.06, ease: 'power2.out', delay: 0.1 }
      );
    });
    mobileMenu.querySelector('.mobile-menu-close').addEventListener('click', () => mobileMenu.classList.remove('open'));
    mobileMenu.querySelectorAll('[data-mobile]').forEach(link => {
      link.addEventListener('click', () => mobileMenu.classList.remove('open'));
    });
    mobileMenu.querySelector('#mobileSignIn')?.addEventListener('click', () => {
      mobileMenu.classList.remove('open');
      if (window.openAuthModal) window.openAuthModal('signin');
    });
  }

  /* ---- SMOOTH SCROLL FOR NAV LINKS ---- */
  document.querySelectorAll('a[href^="#"]').forEach(link => {
    link.addEventListener('click', e => {
      const target = document.querySelector(link.getAttribute('href'));
      if (target) {
        e.preventDefault();
        gsap.to(window, {
          duration: 1.2,
          scrollTo: { y: target, offsetY: 80 },
          ease: 'power3.inOut'
        });
      }
    });
  });

})();
