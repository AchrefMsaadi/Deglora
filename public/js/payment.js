/* ============================================================
   DEGLORA — payment.js
   3-step checkout: Shipping → Payment → Confirm → Order saved to Supabase
   ============================================================ */

(function () {
  'use strict';

  const SHIPPING_COST = 7; // TND

  /* ---- DOM refs ---- */
  const paymentOverlay = document.getElementById('paymentOverlay');
  const paymentBack    = document.getElementById('paymentBack');
  const pStep1         = document.getElementById('pStep1');
  const pStep2         = document.getElementById('pStep2');
  const pStep3         = document.getElementById('pStep3');
  const pStep1Next     = document.getElementById('pStep1Next');
  const pStep2Next     = document.getElementById('pStep2Next');
  const pStep2Back     = document.getElementById('pStep2Back');
  const pStep3Back     = document.getElementById('pStep3Back');
  const placeOrderBtn  = document.getElementById('placeOrderBtn');
  const psSummaryItems = document.getElementById('psSummaryItems');
  const psSubtotal     = document.getElementById('psSubtotal');
  const psTotal        = document.getElementById('psTotal');
  const psDiscountRow  = document.getElementById('psDiscountRow');
  const psDiscount     = document.getElementById('psDiscount');
  const cardFields     = document.getElementById('cardFields');

  let currentStep   = 1;
  let cartSnapshot  = [];
  let subtotal      = 0;
  let discountAmt   = 0;
  let selectedPayMethod = 'card';

  /* ================================================================
     OPEN / CLOSE PAYMENT PAGE
  ================================================================ */
  function openPayment(items) {
    cartSnapshot = items;
    subtotal     = items.reduce((s, i) => s + i.price, 0);
    discountAmt  = 0;

    paymentOverlay.classList.add('open');
    document.body.style.overflow = 'hidden';

    renderSummary();
    goToStep(1);

    // Pre-fill email if signed in
    const emailField = document.getElementById('pfEmail');
    if (emailField && window.DeglAuth?.user?.email) {
      emailField.value = window.DeglAuth.user.email;
    }
    const nameField = document.getElementById('pfFirstName');
    if (nameField && window.DeglAuth?.profile?.full_name) {
      const parts = (window.DeglAuth.profile.full_name || '').split(' ');
      document.getElementById('pfFirstName').value = parts[0] || '';
      document.getElementById('pfLastName').value  = parts.slice(1).join(' ') || '';
    }

    // Show redeem block if user has points
    const pts = window.DeglAuth?.points || 0;
    const redeemBlock = document.getElementById('redeemBlock');
    if (redeemBlock) {
      redeemBlock.style.display = pts > 0 ? 'block' : 'none';
      const avail = document.getElementById('redeemPtsAvail');
      const disc  = document.getElementById('redeemDiscount');
      if (avail) avail.textContent = pts;
      if (disc)  disc.textContent  = Math.floor(pts / 10);
    }
  }

  function closePayment() {
    paymentOverlay.classList.remove('open');
    document.body.style.overflow = '';
  }

  paymentBack?.addEventListener('click', () => {
    if (currentStep === 1) closePayment();
    else goToStep(currentStep - 1);
  });

  // Expose
  window.openPaymentPage = openPayment;

  /* ================================================================
     SUMMARY PANEL
  ================================================================ */
  function renderSummary() {
    if (!psSummaryItems) return;
    psSummaryItems.innerHTML = cartSnapshot.map(item => `
      <div class="ps-item">
        <span class="ps-item-icon">🫙</span>
        <div class="ps-item-info">
          <strong>${item.name}</strong>
          <small>${item.addins.length ? item.addins.join(', ') : 'Base blend'}</small>
        </div>
        <span class="ps-item-price">${item.price} TND</span>
      </div>
    `).join('');

    updateTotals();
  }

  function updateTotals() {
    const total = subtotal + SHIPPING_COST - discountAmt;
    if (psSubtotal) psSubtotal.textContent = `${subtotal} TND`;
    if (psTotal)    psTotal.textContent    = `${Math.max(total, 0)} TND`;
    if (psDiscountRow) psDiscountRow.style.display = discountAmt > 0 ? 'flex' : 'none';
    if (psDiscount)    psDiscount.textContent      = `-${discountAmt} TND`;
  }

  /* Redeem points toggle */
  document.getElementById('redeemToggle')?.addEventListener('change', e => {
    const pts  = window.DeglAuth?.points || 0;
    discountAmt = e.target.checked ? Math.floor(pts / 10) : 0;
    updateTotals();
    if (psDiscountRow) psDiscountRow.style.display = discountAmt > 0 ? 'flex' : 'none';
  });

  /* ================================================================
     PAYMENT METHOD SELECTION
  ================================================================ */
  document.querySelectorAll('.pm-option').forEach(label => {
    label.addEventListener('click', () => {
      document.querySelectorAll('.pm-option').forEach(l => l.classList.remove('active'));
      label.classList.add('active');
      selectedPayMethod = label.dataset.method;
      if (cardFields) {
        cardFields.style.display = selectedPayMethod === 'card' ? 'block' : 'none';
        if (selectedPayMethod === 'card') {
          gsap.fromTo(cardFields, { opacity: 0, y: 10 }, { opacity: 1, y: 0, duration: 0.3 });
        }
      }
    });
  });

  /* Card number formatting */
  document.getElementById('pfCardNum')?.addEventListener('input', e => {
    let v = e.target.value.replace(/\D/g, '').substring(0, 16);
    e.target.value = v.replace(/(.{4})/g, '$1 ').trim();
  });
  document.getElementById('pfExpiry')?.addEventListener('input', e => {
    let v = e.target.value.replace(/\D/g, '').substring(0, 4);
    if (v.length >= 2) v = v.substring(0, 2) + ' / ' + v.substring(2);
    e.target.value = v;
  });

  /* ================================================================
     STEP NAVIGATION
  ================================================================ */
  function goToStep(n) {
    currentStep = n;
    [pStep1, pStep2, pStep3].forEach((el, i) => {
      if (!el) return;
      el.classList.toggle('active', i + 1 === n);
    });
    document.querySelectorAll('.pstep').forEach(el => {
      const s = parseInt(el.dataset.step);
      el.classList.toggle('active', s === n);
      el.classList.toggle('done',   s < n);
    });

    // Animate in
    const active = [pStep1, pStep2, pStep3][n - 1];
    if (active) {
      gsap.fromTo(active, { opacity: 0, x: 30 }, { opacity: 1, x: 0, duration: 0.35, ease: 'power2.out' });
    }

    // Back button label
    if (paymentBack) {
      paymentBack.textContent = n === 1 ? '← Back to Cart' : '← Back';
    }

    clearPayErrors();
  }

  pStep1Next?.addEventListener('click', () => {
    if (!validateStep1()) return;
    goToStep(2);
  });

  pStep2Back?.addEventListener('click', () => goToStep(1));
  pStep2Next?.addEventListener('click', () => {
    if (!validateStep2()) return;
    buildConfirmSummary();
    goToStep(3);
  });

  pStep3Back?.addEventListener('click', () => goToStep(2));

  /* ================================================================
     VALIDATION
  ================================================================ */
  function validateStep1() {
    const required = ['pfFirstName','pfLastName','pfEmail','pfPhone','pfAddress','pfCity','pfPostal'];
    for (const id of required) {
      const el = document.getElementById(id);
      if (!el || !el.value.trim()) {
        showPayError('pStep1Error', 'Please fill in all required fields.');
        el?.focus();
        return false;
      }
    }
    const email = document.getElementById('pfEmail').value;
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      showPayError('pStep1Error', 'Please enter a valid email address.');
      return false;
    }
    return true;
  }

  function validateStep2() {
    if (selectedPayMethod === 'card') {
      const num  = document.getElementById('pfCardNum')?.value.replace(/\s/g,'');
      const exp  = document.getElementById('pfExpiry')?.value;
      const cvv  = document.getElementById('pfCvv')?.value;
      const name = document.getElementById('pfCardName')?.value.trim();
      if (!num || num.length < 16) { showPayError('pStep2Error', 'Please enter a valid card number.'); return false; }
      if (!exp || exp.length < 7)  { showPayError('pStep2Error', 'Please enter a valid expiry date.'); return false; }
      if (!cvv || cvv.length < 3)  { showPayError('pStep2Error', 'Please enter your CVV.'); return false; }
      if (!name)                    { showPayError('pStep2Error', 'Please enter the name on card.'); return false; }
    }
    return true;
  }

  /* ================================================================
     CONFIRM SUMMARY
  ================================================================ */
  function buildConfirmSummary() {
    const shipping = getShippingData();
    const cs = document.getElementById('confirmSummary');
    const css = document.getElementById('confirmShipping');

    if (cs) {
      cs.innerHTML = `
        <div class="confirm-block">
          <div class="confirm-label">Items (${cartSnapshot.length})</div>
          ${cartSnapshot.map(i => `<div class="confirm-item"><span>${i.name}</span><span>${i.price} TND</span></div>`).join('')}
          <div class="confirm-item total-line">
            <span>Total</span>
            <span>${Math.max(subtotal + SHIPPING_COST - discountAmt, 0)} TND</span>
          </div>
        </div>
      `;
    }
    if (css) {
      css.innerHTML = `
        <div class="confirm-block">
          <div class="confirm-label">Shipping to</div>
          <p style="font-size:0.88rem;color:var(--text-dark);line-height:1.6;">
            ${shipping.firstName} ${shipping.lastName}<br/>
            ${shipping.address}, ${shipping.city} ${shipping.postal}<br/>
            ${shipping.country} · ${shipping.phone}
          </p>
          <div class="confirm-label" style="margin-top:1rem">Payment</div>
          <p style="font-size:0.88rem;color:var(--text-dark)">
            ${selectedPayMethod === 'card' ? '💳 Credit / Debit Card' :
              selectedPayMethod === 'cash' ? '💵 Cash on Delivery' : '📱 D17 / Flouci'}
          </p>
        </div>
      `;
    }
  }

  function getShippingData() {
    return {
      firstName: document.getElementById('pfFirstName')?.value.trim() || '',
      lastName:  document.getElementById('pfLastName')?.value.trim()  || '',
      email:     document.getElementById('pfEmail')?.value.trim()     || '',
      phone:     document.getElementById('pfPhone')?.value.trim()     || '',
      address:   document.getElementById('pfAddress')?.value.trim()   || '',
      city:      document.getElementById('pfCity')?.value.trim()      || '',
      postal:    document.getElementById('pfPostal')?.value.trim()    || '',
      country:   document.getElementById('pfCountry')?.value          || 'TN',
      notes:     document.getElementById('pfNotes')?.value.trim()     || '',
    };
  }

  /* ================================================================
     PLACE ORDER
  ================================================================ */
  placeOrderBtn?.addEventListener('click', async () => {
    const termsCheck = document.getElementById('termsCheck');
    if (!termsCheck?.checked) {
      showPayError('pStep3Error', 'Please agree to the Terms & Conditions.');
      return;
    }

    const spinner  = document.getElementById('placeSpinner');
    const btnText  = document.getElementById('placeOrderText');
    if (spinner)  spinner.style.display = 'inline-block';
    if (btnText)  btnText.textContent   = 'Placing order…';
    placeOrderBtn.disabled = true;

    const ptsEarned = Math.floor(subtotal * 1.5); // 1.5 pts per TND spent
    const redeemed  = document.getElementById('redeemToggle')?.checked ? discountAmt * 10 : 0;

    try {
      // Save to Supabase if user is signed in
      if (window.DeglAuth?.user?.id && window.DegloDB?.isReady()) {
        const userId = window.DeglAuth.user.id;
        await window.DegloDB.saveOrder(userId, {
          items:     cartSnapshot,
          total:     Math.max(subtotal + SHIPPING_COST - discountAmt, 0),
          shipping:  getShippingData(),
          payment:   selectedPayMethod,
          ptsEarned,
        });
        // Add pts, deduct redeemed
        const netDelta = ptsEarned - redeemed;
        await window.DegloDB.addPointsToDB(userId, netDelta);

        // Update nav
        const newPts = (window.DeglAuth.points || 0) + netDelta;
        if (window.updateNavPoints) window.updateNavPoints(newPts);
      }

      // Close payment, show success
      closePayment();
      showOrderSuccess(ptsEarned);

      // Reset cart
      if (window.cartAPI?.clearCart) window.cartAPI.clearCart();

    } catch (err) {
      showPayError('pStep3Error', 'Something went wrong. Please try again.');
      console.error('[Payment] placeOrder error:', err);
    } finally {
      if (spinner)  spinner.style.display = 'none';
      if (btnText)  btnText.textContent   = 'Place Order';
      placeOrderBtn.disabled = false;
    }
  });

  function showOrderSuccess(pts) {
    const orderModal = document.getElementById('orderModal');
    const ptsEl      = document.getElementById('orderPtsEarned');
    if (ptsEl)  ptsEl.textContent = `+${pts} Degla Points earned on this order`;
    if (orderModal) {
      orderModal.classList.add('open');
      gsap.fromTo('#orderModal .order-modal',
        { scale: 0.9, opacity: 0, y: 30 },
        { scale: 1, opacity: 1, y: 0, duration: 0.5, ease: 'back.out(1.6)' }
      );
    }
  }

  document.getElementById('orderModalClose')?.addEventListener('click', () => {
    document.getElementById('orderModal')?.classList.remove('open');
  });
  document.getElementById('orderModal')?.addEventListener('click', e => {
    if (e.target.id === 'orderModal') e.target.classList.remove('open');
  });

  /* ================================================================
     HELPERS
  ================================================================ */
  function showPayError(id, msg) {
    const el = document.getElementById(id);
    if (!el) return;
    el.textContent = msg;
    el.style.display = 'block';
    gsap.fromTo(el, { opacity: 0, y: -4 }, { opacity: 1, y: 0, duration: 0.2 });
  }
  function clearPayErrors() {
    document.querySelectorAll('.pform-error').forEach(el => {
      el.textContent = '';
      el.style.display = 'none';
    });
  }

})();
