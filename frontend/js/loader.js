/* ============================================================
   DEGLORA — loader.js
   Page loader with progress bar + graceful exit
   ============================================================ */

(function () {
  const loader    = document.getElementById('loader');
  const barFill   = document.getElementById('loaderBarFill');

  if (!loader) return;

  // Prevent scroll during load
  document.body.style.overflow = 'hidden';

  let progress = 0;
  const steps = [
    { to: 30, delay: 100 },
    { to: 55, delay: 350 },
    { to: 75, delay: 600 },
    { to: 90, delay: 900 },
    { to: 100, delay: 1100 },
  ];

  steps.forEach(step => {
    setTimeout(() => {
      if (barFill) barFill.style.width = step.to + '%';
    }, step.delay);
  });

  // Hide loader
  setTimeout(() => {
    document.body.style.overflow = '';
    loader.classList.add('hidden');

    // Remove from DOM after transition
    setTimeout(() => loader.remove(), 800);
  }, 1400);

})();
