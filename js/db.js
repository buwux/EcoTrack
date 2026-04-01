/* ============================================
   EcoTrack BIST — Supabase Database Layer
   Supabase project: ecotrackbase
   ============================================ */

const SUPABASE_URL  = 'https://qcmvqlrsfwodbxawyysi.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFjbXZxbHJzZndvZGJ4YXd5eXNpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzUwMDU3NDksImV4cCI6MjA5MDU4MTc0OX0.jybN9RDx0Dw8dvLwgphaViEA61Hu2NGwr0h8WGbFpmQ'; // ← Paste from Supabase → Settings → API → anon public

const db = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ─── Auth ─────────────────────────────────────────────────────────────────────

async function dbSignUp(email, password, name, house, yearGroup) {
  return await db.auth.signUp({
    email,
    password,
    options: { data: { name, house, year_group: yearGroup } }
  });
}

async function dbSignIn(email, password) {
  return await db.auth.signInWithPassword({ email, password });
}

async function dbSignOut() {
  return await db.auth.signOut();
}

async function dbGetSession() {
  const { data: { session } } = await db.auth.getSession();
  return session;
}

// ─── Profiles ─────────────────────────────────────────────────────────────────

async function dbGetProfile(userId) {
  const { data, error } = await db
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();
  return { data, error };
}

async function dbUpdateProfile(userId, updates) {
  const { data, error } = await db
    .from('profiles')
    .update(updates)
    .eq('id', userId)
    .select()
    .single();
  return { data, error };
}

async function dbGetAllProfiles() {
  const { data, error } = await db
    .from('profiles')
    .select('*')
    .order('points', { ascending: false });
  return { data: data || [], error };
}

// ─── Challenges ───────────────────────────────────────────────────────────────

async function dbGetParticipations(userId) {
  const { data, error } = await db
    .from('challenge_participations')
    .select('*')
    .eq('user_id', userId);
  return { data: data || [], error };
}

async function dbGetChallengeCounts() {
  const { data } = await db
    .from('challenge_participations')
    .select('challenge_id');
  const counts = {};
  (data || []).forEach(row => {
    counts[row.challenge_id] = (counts[row.challenge_id] || 0) + 1;
  });
  return counts;
}

async function dbJoinChallenge(userId, challengeId) {
  return await db
    .from('challenge_participations')
    .upsert(
      { user_id: userId, challenge_id: challengeId, progress: 0 },
      { onConflict: 'user_id,challenge_id' }
    );
}

async function dbLogProgress(userId, challengeId, newProgress) {
  return await db
    .from('challenge_participations')
    .update({
      progress: newProgress,
      last_log: new Date().toISOString().split('T')[0]
    })
    .eq('user_id', userId)
    .eq('challenge_id', challengeId);
}

async function dbCompleteChallenge(userId, challengeId) {
  return await db
    .from('challenge_participations')
    .update({ completed: true, completed_at: new Date().toISOString(), progress: 100 })
    .eq('user_id', userId)
    .eq('challenge_id', challengeId);
}

async function dbAddPoints(userId, points) {
  return await db.rpc('increment_points', { uid: userId, delta: points });
}

// ─── Carbon Logs ──────────────────────────────────────────────────────────────

async function dbSaveCarbonLog(userId, totalKgCo2) {
  return await db
    .from('carbon_logs')
    .insert({ user_id: userId, total_kg_co2: totalKgCo2 });
}

// ─── Realtime leaderboard ─────────────────────────────────────────────────────

function dbSubscribeLeaderboard(onChange) {
  return db
    .channel('leaderboard-live')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles' }, onChange)
    .subscribe();
}

// ─── Auth UI ──────────────────────────────────────────────────────────────────

function showAuthModal() {
  document.getElementById('auth-overlay').classList.add('open');
}

function hideAuthModal() {
  document.getElementById('auth-overlay').classList.remove('open');
}

function switchAuthTab(tab) {
  document.getElementById('auth-login-form').style.display  = tab === 'login'  ? '' : 'none';
  document.getElementById('auth-signup-form').style.display = tab === 'signup' ? '' : 'none';
  document.getElementById('tab-login').classList.toggle('active',  tab === 'login');
  document.getElementById('tab-signup').classList.toggle('active', tab === 'signup');
  document.getElementById('auth-error').textContent = '';
}

function setAuthError(msg) {
  document.getElementById('auth-error').textContent = msg;
}

function setAuthLoading(btn, loading) {
  btn.disabled = loading;
  btn.textContent = loading ? 'Please wait…' : btn.dataset.label;
}

async function handleSignIn() {
  const btn      = document.getElementById('auth-signin-btn');
  const email    = document.getElementById('auth-email').value.trim();
  const password = document.getElementById('auth-password').value;
  if (!email || !password) return setAuthError('Please fill in all fields.');
  setAuthLoading(btn, true);
  const { error } = await dbSignIn(email, password);
  setAuthLoading(btn, false);
  if (error) return setAuthError(error.message);
  hideAuthModal();
}

async function handleSignUp() {
  const btn      = document.getElementById('auth-signup-btn');
  const name     = document.getElementById('auth-name').value.trim();
  const email    = document.getElementById('auth-email-reg').value.trim();
  const password = document.getElementById('auth-password-reg').value;
  const house    = document.getElementById('auth-house').value;
  const year     = document.getElementById('auth-year').value;
  if (!name || !email || !password) return setAuthError('Please fill in all fields.');
  if (password.length < 6) return setAuthError('Password must be at least 6 characters.');
  setAuthLoading(btn, true);
  const { error } = await dbSignUp(email, password, name, house, year);
  setAuthLoading(btn, false);
  if (error) return setAuthError(error.message);
  setAuthError('');
  document.getElementById('auth-error').style.color = '#16A34A';
  document.getElementById('auth-error').textContent = 'Account created! Check your email to confirm, then sign in.';
  switchAuthTab('login');
}

// ─── Bootstrap ────────────────────────────────────────────────────────────────

async function initAuth() {
  // Listen for auth state changes
  db.auth.onAuthStateChange(async (event, session) => {
    if (session) {
      state.currentUserId = session.user.id;

      // Load this user's profile
      const { data: profile } = await dbGetProfile(session.user.id);
      if (profile) {
        // Sync profile → settings so name/house appear correctly
        state.settings.name      = profile.name;
        state.settings.house     = profile.house;
        state.settings.yearGroup = profile.year_group;
        persistSettings(state.settings);
        updateSidebarUser();
        // Re-render settings so form fields show DB values
        if (typeof renderSettings === 'function') renderSettings();
      }

      // Load challenge participations from DB
      const { data: parts } = await dbGetParticipations(session.user.id);
      if (parts && parts.length) {
        // Merge DB state into local state
        const cs = state.challengeState;
        cs.joined    = new Set();
        cs.completed = new Set();
        cs.progress  = {};
        cs.lastLog   = {};
        parts.forEach(p => {
          if (p.completed) {
            cs.completed.add(p.challenge_id);
          } else {
            cs.joined.add(p.challenge_id);
          }
          cs.progress[p.challenge_id] = p.progress || 0;
          if (p.last_log) cs.lastLog[p.challenge_id] = new Date(p.last_log).toDateString();
        });
        if (typeof renderChallenges === 'function') renderChallenges();
      }

      // Load real leaderboard data
      await refreshLeaderboardFromDB();

      // Subscribe to live leaderboard updates
      dbSubscribeLeaderboard(async () => {
        await refreshLeaderboardFromDB();
        if (state.currentView === 'leaderboard' && typeof renderLeaderboard === 'function') {
          renderLeaderboard();
        }
      });

      // Update challenge participant counts
      const counts = await dbGetChallengeCounts();
      state.challenges.forEach(c => {
        if (counts[c.id]) c.participants = counts[c.id];
      });
      if (typeof renderChallenges === 'function') renderChallenges();

    } else {
      state.currentUserId = null;
      showAuthModal();
    }
  });

  // Trigger initial check
  const session = await dbGetSession();
  if (!session) showAuthModal();
}

async function refreshLeaderboardFromDB() {
  const { data: profiles } = await dbGetAllProfiles();
  if (!profiles || profiles.length === 0) return;

  // Map DB profiles → individuals list format
  const houseColors = { Taylor: '#1D4ED8', Walter: '#15803D', Edward: '#B91C1C' };
  state.dbProfiles = profiles.map(p => ({
    id:         p.id,
    name:       p.name,
    house:      p.house,
    houseColor: houseColors[p.house] || '#6B7280',
    pts:        p.points,
    initials:   p.name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2),
    isMe:       p.id === state.currentUserId
  }));

  // Rebuild house totals from profiles
  const houseTotals = { Taylor: 0, Walter: 0, Edward: 0 };
  const houseMembers = { Taylor: 0, Walter: 0, Edward: 0 };
  profiles.forEach(p => {
    if (houseTotals[p.house] !== undefined) {
      houseTotals[p.house]  += p.points;
      houseMembers[p.house] += 1;
    }
  });

  state.houses.forEach(h => {
    const key = h.name.split(' ')[0];
    if (houseTotals[key] !== undefined) {
      h.points  = houseTotals[key];
      h.members = houseMembers[key];
    }
  });

  if (state.currentView === 'leaderboard' && typeof renderLeaderboard === 'function') {
    renderLeaderboard();
  }
}
