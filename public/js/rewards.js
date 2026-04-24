/* ============================================================
   DEGLORA — rewards.js
   Points counter animation, QR scan demo
   ============================================================ */

(function () {
  const counter    = document.getElementById('pointsCounter');
  const barFill    = document.getElementById('pointsBarFill');
  const TARGET_PTS = 380;
  const MAX_PTS    = 500;
  let animated     = false;

  function animatePoints() {
    if (animated) return;
    animated = true;

    // Animate counter
    const obj = { val: 0 };
    gsap.to(obj, {
      val: TARGET_PTS,
      duration: 2.2,
      ease: 'power2.out',
      onUpdate: () => {
        if (counter) counter.textContent = Math.round(obj.val);
      }
    });

    // Animate bar
    const pct = (TARGET_PTS / MAX_PTS) * 100;
    gsap.to(barFill, {
      width: `${pct}%`,
      duration: 2.5,
      ease: 'power2.out',
      delay: 0.2
    });
  }

  // Trigger when points card is in view
  const pointsCard = document.querySelector('.points-card');
  if (pointsCard) {
    const obs = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting) {
        animatePoints();
        obs.disconnect();
      }
    }, { threshold: 0.5 });
    obs.observe(pointsCard);
  }

  /* ---- QR Scan Demo ---- */
  // Animate reward steps on scroll
  const rewardSteps = document.querySelectorAll('.reward-step');
  rewardSteps.forEach((step, i) => {
    step.style.transitionDelay = `${i * 0.15}s`;
  });

  /* ---- Reward step hover glow ---- */
  rewardSteps.forEach(step => {
    step.addEventListener('mouseenter', () => {
      gsap.to(step, {
        background: 'rgba(245,245,220,0.07)',
        borderColor: 'rgba(201,168,76,0.25)',
        duration: 0.25
      });
    });
    step.addEventListener('mouseleave', () => {
      gsap.to(step, {
        background: 'rgba(245,245,220,0.04)',
        borderColor: 'rgba(245,245,220,0.08)',
        duration: 0.25
      });
    });
  });

})();
