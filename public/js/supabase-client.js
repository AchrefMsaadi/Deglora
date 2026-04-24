/* ============================================================
   DEGLORA — supabase-client.js
   Initialises the Supabase client.
   REPLACE the key below with your actual service-role or
   anon key from your Supabase project settings.
   ============================================================ */

// ↓ Set this to your Supabase Project URL (Dashboard → Settings → API → Project URL)
const SUPABASE_URL  = 'https://YOUR_PROJECT_REF.supabase.co';
// ↓ Replace with your publishable / anon key
const SUPABASE_KEY  = 'sb_publishable_k-4meuDkhCyHmTQ5WuZdmw_GcVmlbgs';

/* The global supabase object is provided by the CDN script loaded
   before this file in index.html. We alias it for convenience. */
let _supabaseReady = false;
let _supaClient    = null;

(function initSupabase() {
  try {
    if (typeof window.supabase === 'undefined' || !window.supabase.createClient) {
      console.warn('[Deglora] Supabase CDN not loaded yet — retrying in 200ms');
      setTimeout(initSupabase, 200);
      return;
    }
    _supaClient   = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
    _supabaseReady = true;
    window.dispatchEvent(new Event('supabase:ready'));
    console.log('[Deglora] Supabase client initialised ✓');
  } catch (err) {
    console.error('[Deglora] Supabase init failed:', err.message);
  }
})();

/* Helper — returns the client or throws if not ready */
function getSupabase() {
  if (!_supaClient) throw new Error('Supabase not initialised');
  return _supaClient;
}

/* ---- TABLE HELPERS -------------------------------------------------- */

/* Upsert a user profile row after sign-up / sign-in */
async function upsertUserProfile(user) {
  try {
    const sb = getSupabase();
    const { error } = await sb.from('profiles').upsert({
      id:          user.id,
      email:       user.email,
      full_name:   user.user_metadata?.full_name || '',
      points:      0,
      created_at:  new Date().toISOString(),
    }, { onConflict: 'id', ignoreDuplicates: true });

    if (error) console.warn('[Deglora] upsertUserProfile:', error.message);
  } catch (e) {
    console.warn('[Deglora] upsertUserProfile exception:', e.message);
  }
}

/* Fetch profile row */
async function fetchUserProfile(userId) {
  try {
    const sb = getSupabase();
    const { data, error } = await sb
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();
    if (error) return null;
    return data;
  } catch { return null; }
}

/* Update points in DB */
async function addPointsToDB(userId, delta) {
  try {
    const sb = getSupabase();
    // Use RPC so points are incremented atomically
    const { error } = await sb.rpc('increment_points', {
      user_id: userId,
      delta:   delta
    });
    if (error) {
      // Fallback: read-then-write
      const profile = await fetchUserProfile(userId);
      if (!profile) return;
      await sb.from('profiles').update({ points: (profile.points || 0) + delta }).eq('id', userId);
    }
  } catch (e) {
    console.warn('[Deglora] addPointsToDB:', e.message);
  }
}

/* Save an order to the orders table */
async function saveOrder(userId, orderData) {
  try {
    const sb = getSupabase();
    const { data, error } = await sb.from('orders').insert({
      user_id:     userId,
      items:       JSON.stringify(orderData.items),
      total_tnd:   orderData.total,
      shipping:    JSON.stringify(orderData.shipping),
      payment:     orderData.payment,
      pts_earned:  orderData.ptsEarned,
      status:      'pending',
      created_at:  new Date().toISOString(),
    }).select().single();
    if (error) console.warn('[Deglora] saveOrder:', error.message);
    return data;
  } catch (e) {
    console.warn('[Deglora] saveOrder exception:', e.message);
    return null;
  }
}

/* Save a QR scan event */
async function saveQrScan(userId, qrCode, ptsEarned) {
  try {
    const sb = getSupabase();
    await sb.from('qr_scans').insert({
      user_id:    userId,
      qr_code:    qrCode,
      pts_earned: ptsEarned,
      scanned_at: new Date().toISOString(),
    });
  } catch (e) {
    console.warn('[Deglora] saveQrScan:', e.message);
  }
}

/* Expose globally */
window.DegloDB = {
  getClient:         getSupabase,
  upsertUserProfile,
  fetchUserProfile,
  addPointsToDB,
  saveOrder,
  saveQrScan,
  isReady: () => _supabaseReady,
};
