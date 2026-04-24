/* ============================================================
   DEGLORA — auth.js
   Supabase authentication: sign-up, sign-in, session management,
   nav points chip, user dropdown.
   ============================================================ */

(function () {
  'use strict';

  /* ---- DOM refs ---- */
  const navAuthBtn     = document.getElementById('navAuthBtn');
  const navPointsChip  = document.getElementById('navPointsChip');
  const navPointsVal   = document.getElementById('navPointsVal');
  const authModal      = document.getElementById('authModal');
  const authClose      = document.getElementById('authClose');
  const userDropdown   = document.getElementById('userDropdown');
  const udName         = document.getElementById('udName');
  const udEmail        = document.getElementById('udEmail');
  const udAvatar       = document.getElementById('udAvatar');
  const udPoints       = document.getElementById('udPoints');
  const udSignoutBtn   = document.getElementById('udSignoutBtn');

  /* ---- State ---- */
  let currentUser    = null;
  let currentProfile = null;
  let dropdownOpen   = false;

  /* ================================================================
     WAIT FOR SUPABASE READY
  ================================================================ */
  function whenReady(cb) {
    if (window.DegloDB && window.DegloDB.isReady()) { cb(); return; }
    window.addEventListener('supabase:ready', cb, { once: true });
    // Fallback in case event already fired
    setTimeout(() => { if (window.DegloDB?.isReady()) cb(); }, 500);
  }

  /* ================================================================
     SESSION LISTENER — runs on every page load
  ================================================================ */
  whenReady(async () => {
    const sb = window.DegloDB.getClient();

    // Restore existing session
    const { data: { session } } = await sb.auth.getSession();
    if (session?.user) await handleSignedIn(session.user);

    // Listen for auth state changes
    sb.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session?.user) {
        await handleSignedIn(session.user);
        closeAuthModal();
      } else if (event === 'SIGNED_OUT') {
        handleSignedOut();
      }
    });
  });

  /* ================================================================
     SIGNED-IN HANDLER
  ================================================================ */
  async function handleSignedIn(user) {
    currentUser = user;

    // Fetch / create profile
    currentProfile = await window.DegloDB.fetchUserProfile(user.id);
    if (!currentProfile) {
      await window.DegloDB.upsertUserProfile(user);
      currentProfile = { points: 0, full_name: user.user_metadata?.full_name || '', email: user.email };
    }

    const pts      = currentProfile.points || 0;
    const name     = currentProfile.full_name || user.email.split('@')[0];
    const initials = name.charAt(0).toUpperCase();

    // Nav — switch to avatar
    if (navAuthBtn) {
      navAuthBtn.textContent = initials;
      navAuthBtn.style.cssText = `
        width:34px;height:34px;border-radius:50%;background:var(--burgundy);
        color:var(--cream);font-size:0.85rem;font-weight:500;
        display:flex;align-items:center;justify-content:center;
        border:2px solid rgba(201,168,76,0.5);cursor:none;
      `;
    }

    // Points chip
    if (navPointsChip) {
      navPointsChip.classList.add('visible');
      updateNavPoints(pts);
    }

    // Dropdown data
    if (udName)   udName.textContent   = name;
    if (udEmail)  udEmail.textContent  = user.email;
    if (udAvatar) udAvatar.textContent = initials;
    if (udPoints) udPoints.textContent = pts;

    // Expose for other modules
    window.DeglAuth = { user: currentUser, profile: currentProfile, points: pts };

    // Show redeem block in payment if mounted
    const redeemBlock = document.getElementById('redeemBlock');
    if (redeemBlock && pts > 0) {
      redeemBlock.style.display = 'block';
      const avail = document.getElementById('redeemPtsAvail');
      const disc  = document.getElementById('redeemDiscount');
      if (avail) avail.textContent = pts;
      if (disc)  disc.textContent  = Math.floor(pts / 10); // 10 pts = 1 TND
    }
  }

  /* ================================================================
     SIGNED-OUT HANDLER
  ================================================================ */
  function handleSignedOut() {
    currentUser = null;
    currentProfile = null;
    window.DeglAuth = null;

    if (navAuthBtn) {
      navAuthBtn.textContent = 'Sign In';
      navAuthBtn.removeAttribute('style');
    }
    if (navPointsChip) navPointsChip.classList.remove('visible');
    closeDropdown();
  }

  /* ================================================================
     NAV POINTS UPDATER (called externally)
  ================================================================ */
  function updateNavPoints(pts) {
    if (navPointsVal) {
      const obj = { v: parseInt(navPointsVal.textContent) || 0 };
      gsap.to(obj, {
        v: pts,
        duration: 1,
        ease: 'power2.out',
        onUpdate: () => { navPointsVal.textContent = Math.round(obj.v); }
      });
    }
    if (udPoints) udPoints.textContent = pts;
    if (window.DeglAuth) window.DeglAuth.points = pts;
  }
  window.DeglAuth = window.DeglAuth || {};
  window.updateNavPoints = updateNavPoints;

  /* ================================================================
     AUTH MODAL — OPEN / CLOSE
  ================================================================ */
  function openAuthModal(tab) {
    authModal?.classList.add('open');
    document.body.style.overflow = 'hidden';
    if (tab) switchTab(tab);
    gsap.fromTo('#authPanel',
      { opacity: 0, scale: 0.94, y: 20 },
      { opacity: 1, scale: 1, y: 0, duration: 0.4, ease: 'back.out(1.6)' }
    );
  }
  function closeAuthModal() {
    authModal?.classList.remove('open');
    document.body.style.overflow = '';
    clearErrors();
  }

  authClose?.addEventListener('click', closeAuthModal);
  authModal?.addEventListener('click', e => { if (e.target === authModal) closeAuthModal(); });
  navAuthBtn?.addEventListener('click', () => {
    if (currentUser) toggleDropdown();
    else openAuthModal('signin');
  });

  /* ================================================================
     TAB SWITCHING
  ================================================================ */
  function switchTab(name) {
    document.querySelectorAll('.auth-tab').forEach(t => t.classList.toggle('active', t.dataset.tab === name));
    document.getElementById('signinForm')?.classList.toggle('active', name === 'signin');
    document.getElementById('signupForm')?.classList.toggle('active', name === 'signup');
    clearErrors();
  }
  document.querySelectorAll('.auth-tab').forEach(btn => {
    btn.addEventListener('click', () => switchTab(btn.dataset.tab));
  });
  document.querySelectorAll('.auth-switch').forEach(btn => {
    btn.addEventListener('click', () => switchTab(btn.dataset.to));
  });

  /* ================================================================
     SIGN IN
  ================================================================ */
  document.getElementById('signinBtn')?.addEventListener('click', async () => {
    const email    = document.getElementById('signinEmail')?.value.trim();
    const password = document.getElementById('signinPassword')?.value;
    const errEl    = document.getElementById('signinError');
    const spinner  = document.getElementById('signinSpinner');
    const btnText  = document.getElementById('signinBtnText');

    if (!email || !password) { showError(errEl, 'Please fill in all fields.'); return; }

    setLoading(spinner, btnText, true, 'Signing in…');
    whenReady(async () => {
      try {
        const sb = window.DegloDB.getClient();
        const { error } = await sb.auth.signInWithPassword({ email, password });
        if (error) showError(errEl, error.message);
      } catch (e) {
        showError(errEl, 'Connection error. Please try again.');
      } finally {
        setLoading(spinner, btnText, false, 'Sign In');
      }
    });
  });

  /* ================================================================
     SIGN UP
  ================================================================ */
  document.getElementById('signupBtn')?.addEventListener('click', async () => {
    const name     = document.getElementById('signupName')?.value.trim();
    const email    = document.getElementById('signupEmail')?.value.trim();
    const password = document.getElementById('signupPassword')?.value;
    const errEl    = document.getElementById('signupError');
    const spinner  = document.getElementById('signupSpinner');
    const btnText  = document.getElementById('signupBtnText');

    if (!name || !email || !password) { showError(errEl, 'Please fill in all fields.'); return; }
    if (password.length < 8)          { showError(errEl, 'Password must be at least 8 characters.'); return; }

    setLoading(spinner, btnText, true, 'Creating account…');
    whenReady(async () => {
      try {
        const sb = window.DegloDB.getClient();
        const { data, error } = await sb.auth.signUp({
          email,
          password,
          options: { data: { full_name: name } }
        });
        if (error) {
          showError(errEl, error.message);
        } else if (data?.user) {
          // Insert profile row immediately
          await window.DegloDB.upsertUserProfile(data.user);
          if (window.showToast) window.showToast('✓ Account created! Welcome to Deglora.');
          closeAuthModal();
        }
      } catch (e) {
        showError(errEl, 'Connection error. Please try again.');
      } finally {
        setLoading(spinner, btnText, false, 'Create Account');
      }
    });
  });

  /* ================================================================
     USER DROPDOWN
  ================================================================ */
  function toggleDropdown() {
    dropdownOpen = !dropdownOpen;
    if (dropdownOpen) {
      userDropdown.style.display = 'block';
      gsap.fromTo(userDropdown,
        { opacity: 0, y: -8, scale: 0.97 },
        { opacity: 1, y: 0, scale: 1, duration: 0.25, ease: 'power2.out' }
      );
    } else {
      closeDropdown();
    }
  }
  function closeDropdown() {
    dropdownOpen = false;
    if (userDropdown) userDropdown.style.display = 'none';
  }
  document.addEventListener('click', e => {
    if (!navAuthBtn?.contains(e.target) && !userDropdown?.contains(e.target)) closeDropdown();
  });

  udSignoutBtn?.addEventListener('click', async () => {
    closeDropdown();
    whenReady(async () => {
      const sb = window.DegloDB.getClient();
      await sb.auth.signOut();
    });
    if (window.showToast) window.showToast('Signed out. See you soon!');
  });

  /* ================================================================
     HELPERS
  ================================================================ */
  function showError(el, msg) {
    if (!el) return;
    el.textContent = msg;
    el.style.display = 'block';
    gsap.fromTo(el, { opacity: 0, y: -4 }, { opacity: 1, y: 0, duration: 0.25 });
  }
  function clearErrors() {
    document.querySelectorAll('.auth-error').forEach(el => {
      el.textContent = '';
      el.style.display = 'none';
    });
  }
  function setLoading(spinner, btnText, loading, text) {
    if (spinner) spinner.style.display = loading ? 'inline-block' : 'none';
    if (btnText) btnText.textContent   = text;
  }

  /* Expose openAuthModal for cart.js */
  window.openAuthModal = openAuthModal;

})();
