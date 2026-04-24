/* ============================================================
   DEGLORA — customize.js
   Interactive blend builder — ingredient selection + live bottle preview
   ============================================================ */

(function () {
  const addInColors = {
    chocolate: '#3d1a0e',
    honey:     '#c9a84c',
    nuts:      '#8b6035',
    protein:   '#a0522d',
    coconut:   '#e8ddc8',
    seeds:     '#5c7a3e'
  };

  const addInNames = {
    chocolate: 'Dark Chocolate',
    honey:     'Wild Honey',
    nuts:      'Mixed Nuts',
    protein:   'Plant Protein',
    coconut:   'Coconut Flakes',
    seeds:     'Super Seeds'
  };

  const selected = new Set();

  const pbFill       = document.getElementById('pbFill');
  const pbAddinLayers = document.getElementById('pbAddinLayers');
  const blendName    = document.getElementById('blendName');
  const blendSummary = document.getElementById('blendSummary');
  const blendAdditions = document.getElementById('blendAdditions');
  const orderBtn     = document.getElementById('orderBlendBtn');

  function buildBlendName(items) {
    if (items.length === 0) return 'Original';
    if (items.length === 1) return addInNames[items[0]];
    if (items.length === 2) return `${addInNames[items[0]]} & ${addInNames[items[1]]}`;
    return 'Custom Blend';
  }

  function updatePreview() {
    // Clear addin layers
    pbAddinLayers.innerHTML = '';

    // Animate fill height
    const fillPct = 70 + selected.size * 3;
    pbFill.style.height = `${Math.min(fillPct, 88)}%`;

    // Add layers with GSAP
    selected.forEach((id, idx) => {
      const layer = document.createElement('div');
      layer.className = 'pb-addin-layer';
      layer.style.background = addInColors[id];
      layer.style.opacity = '0';
      layer.style.transform = 'scaleX(0)';
      pbAddinLayers.appendChild(layer);

      gsap.to(layer, {
        opacity: 0.85,
        scaleX: 1,
        duration: 0.35,
        delay: idx * 0.06,
        ease: 'back.out(1.4)',
        transformOrigin: 'left center'
      });
    });

    // Update bottle label
    const items = Array.from(selected);
    blendName.textContent = buildBlendName(items);

    // Update summary
    if (items.length === 0) {
      blendAdditions.textContent = '';
    } else {
      blendAdditions.textContent = items.map(id => addInNames[id]).join(' · ');
    }
  }

  function addRipple(card, e) {
    const rect = card.getBoundingClientRect();
    const ripple = document.createElement('span');
    ripple.className = 'ripple-effect';
    ripple.style.left = `${e.clientX - rect.left}px`;
    ripple.style.top  = `${e.clientY - rect.top}px`;
    ripple.style.width = ripple.style.height = '20px';
    ripple.style.marginLeft = ripple.style.marginTop = '-10px';
    card.appendChild(ripple);
    setTimeout(() => ripple.remove(), 500);
  }

  // Wire up addin cards
  document.querySelectorAll('.addin-card').forEach(card => {
    card.addEventListener('click', e => {
      const id = card.dataset.id;

      if (selected.has(id)) {
        selected.delete(id);
        card.classList.remove('selected');
        gsap.fromTo(card, { scale: 0.96 }, { scale: 1, duration: 0.2, ease: 'back.out(2)' });
      } else {
        selected.add(id);
        card.classList.add('selected');
        gsap.fromTo(card, { scale: 1.04 }, { scale: 1, duration: 0.3, ease: 'back.out(2)' });
        addRipple(card, e);
      }

      updatePreview();
    });
  });

  // Order button
  if (orderBtn) {
    orderBtn.addEventListener('click', () => {
      const items = Array.from(selected);
      const name = buildBlendName(items);

      // Animate button
      gsap.timeline()
        .to(orderBtn, { scale: 0.96, duration: 0.1 })
        .to(orderBtn, { scale: 1, duration: 0.2, ease: 'back.out(2)' });

      // Show toast
      showToast(`"${name}" added to cart! 🛒`);
    });
  }

  function showToast(msg) {
    const toast = document.createElement('div');
    toast.style.cssText = `
      position: fixed; bottom: 2rem; left: 50%; transform: translateX(-50%);
      background: var(--burgundy-deep); color: var(--cream);
      padding: 1rem 2rem; font-family: var(--font-body); font-size: 0.85rem;
      font-weight: 300; letter-spacing: 0.08em; z-index: 9000;
      border: 1px solid rgba(201,168,76,0.3); opacity: 0;
    `;
    toast.textContent = msg;
    document.body.appendChild(toast);

    gsap.timeline({ onComplete: () => toast.remove() })
      .to(toast, { opacity: 1, y: -8, duration: 0.35, ease: 'power2.out' })
      .to(toast, { opacity: 0, y: -20, duration: 0.35, ease: 'power2.in', delay: 2.2 });
  }

  // Expose showToast globally for other modules
  window.showToast = showToast;

})();
