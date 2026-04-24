/* ============================================================
   DEGLORA — cart.js
   Shopping cart state, modal, order flow
   ============================================================ */

(function () {

  /* ---- State ---- */
  const PRICE_BASE   = 29;   // TND
  const PRICE_ADDON  = 5;    // per add-in

  let cartItems = [];
  let cartCount = 0;

  /* ---- Elements ---- */
  const cartModal     = document.getElementById('cartModal');
  const cartBtn       = document.getElementById('cartBtn');
  const cartClose     = document.getElementById('cartClose');
  const cartBadge     = document.getElementById('cartBadge');
  const cartBody      = document.getElementById('cartBody');
  const cartItemsEl   = document.getElementById('cartItems');
  const cartEmptyEl   = document.getElementById('cartEmpty');
  const cartFooter    = document.getElementById('cartFooter');
  const cartTotalAmt  = document.getElementById('cartTotalAmt');
  const checkoutBtn   = document.getElementById('checkoutBtn');
  const cartConBtn    = document.getElementById('cartContinueBtn');

  /* ---- Open / Close ---- */
  function openCart() {
    cartModal.classList.add('open');
    document.body.style.overflow = 'hidden';
  }
  function closeCart() {
    cartModal.classList.remove('open');
    document.body.style.overflow = '';
  }

  if (cartBtn)   cartBtn.addEventListener('click', openCart);
  if (cartClose) cartClose.addEventListener('click', closeCart);
  if (cartConBtn) cartConBtn.addEventListener('click', closeCart);

  // Close on backdrop click
  cartModal?.addEventListener('click', e => {
    if (e.target === cartModal) closeCart();
  });

  /* ---- Add to Cart ---- */
  function addToCart(name, addins) {
    const price = PRICE_BASE + addins.length * PRICE_ADDON;
    const id = Date.now();

    cartItems.push({ id, name, addins, price });
    cartCount++;

    updateCartUI();
    animateBadge();

    if (window.showToast) window.showToast(`"${name}" added to cart! 🛒`);
  }

  function removeFromCart(id) {
    cartItems = cartItems.filter(item => item.id !== id);
    cartCount = cartItems.length;
    updateCartUI();
  }

  function updateCartUI() {
    // Badge
    if (cartBadge) {
      cartBadge.textContent = cartCount;
      if (cartCount > 0) cartBadge.classList.add('visible');
      else cartBadge.classList.remove('visible');
    }

    if (!cartItemsEl) return;
    cartItemsEl.innerHTML = '';

    if (cartItems.length === 0) {
      cartEmptyEl.style.display = 'flex';
      cartFooter.style.display = 'none';
    } else {
      cartEmptyEl.style.display = 'none';
      cartFooter.style.display = 'block';

      let total = 0;
      cartItems.forEach(item => {
        total += item.price;
        const el = document.createElement('div');
        el.className = 'cart-item';
        el.innerHTML = `
          <div class="cart-item-img">🫙</div>
          <div class="cart-item-info">
            <div class="cart-item-name">${item.name}</div>
            <div class="cart-item-addins">${
              item.addins.length > 0
                ? item.addins.join(' · ')
                : 'Base blend only'
            }</div>
            <div class="cart-item-price">${item.price} TND</div>
          </div>
          <button class="cart-item-remove" data-id="${item.id}">✕</button>
        `;
        el.querySelector('.cart-item-remove').addEventListener('click', () => {
          gsap.to(el, {
            opacity: 0, x: 30, height: 0, padding: 0,
            duration: 0.3, ease: 'power2.in',
            onComplete: () => removeFromCart(item.id)
          });
        });
        cartItemsEl.appendChild(el);
      });

      cartTotalAmt.textContent = total;
    }
  }

  function animateBadge() {
    if (!cartBadge) return;
    gsap.fromTo(cartBadge,
      { scale: 1.5 },
      { scale: 1, duration: 0.4, ease: 'back.out(3)' }
    );
    gsap.fromTo(cartBtn,
      { scale: 1.1 },
      { scale: 1, duration: 0.35, ease: 'back.out(2)' }
    );
  }


  /* ---- Checkout → Payment Page ---- */
  if (checkoutBtn) {
    checkoutBtn.addEventListener('click', () => {
      if (cartItems.length === 0) return;
      closeCart();
      // Payment.js will handle the page; pass a snapshot of current items
      setTimeout(() => {
        if (window.openPaymentPage) {
          window.openPaymentPage([...cartItems]);
        }
      }, 300);
    });
  }

  /* ---- Newsletter ---- */
  const newsletterForm = document.getElementById('newsletterForm');
  if (newsletterForm) {
    newsletterForm.addEventListener('submit', e => {
      e.preventDefault();
      const input = newsletterForm.querySelector('.newsletter-input');
      const email = input.value.trim();
      if (!email) return;

      input.value = '';
      if (window.showToast) window.showToast(`✓ You're on the list, ${email.split('@')[0]}!`);

      gsap.fromTo(newsletterForm,
        { scale: 1 },
        { scale: 0.98, duration: 0.1, yoyo: true, repeat: 1 }
      );
    });
  }

  /* ---- Wire order buttons ---- */
  // "Order This Blend" in customize section
  const orderBlendBtn = document.getElementById('orderBlendBtn');
  if (orderBlendBtn) {
    orderBlendBtn.addEventListener('click', () => {
      const name = document.getElementById('blendName')?.textContent || 'Custom Blend';
      const addins = document.getElementById('blendAdditions')?.textContent
        .split(' · ').filter(Boolean) || [];
      addToCart(name, addins);
    });
  }

  // "Order Your Formula" in AI section
  const orderAiBtn = document.getElementById('orderAiBtn');
  if (orderAiBtn) {
    orderAiBtn.addEventListener('click', () => {
      const name = document.getElementById('resultName')?.textContent || 'AI Formula';
      const tags = [...document.querySelectorAll('#resultMix .mix-tag')]
        .map(t => t.textContent).filter(t => t !== 'Granola Base' && t !== 'Date Jam');
      addToCart(name, tags);
    });
  }

  // "Customise & Order" CTA
  document.querySelectorAll('a[href="#customize"]').forEach(link => {
    link.addEventListener('click', () => {
      // Small nudge — handled by GSAP smooth scroll
    });
  });

  /* ---- Back to Top ---- */
  const backToTop = document.getElementById('backToTop');
  if (backToTop) {
    ScrollTrigger?.create({
      start: 'top -300',
      onEnter: () => backToTop.classList.add('visible'),
      onLeaveBack: () => backToTop.classList.remove('visible')
    });

    backToTop.addEventListener('click', () => {
      gsap.to(window, { scrollTo: 0, duration: 1.2, ease: 'power3.inOut' });
    });
  }

  // Expose globally
  function clearCart() {
    cartItems = [];
    cartCount = 0;
    updateCartUI();
  }
  window.cartAPI = { addToCart, clearCart };

})();
