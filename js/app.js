/* ============================================
   EcoTrack BIST v2.0 — Application Logic
   Bromsgrove International School Thailand
   Built by BuBu & Shokun — Taylor House
   ============================================ */
'use strict';

// ─── Settings & Persistence ───────────────────
const SETTINGS_KEY = 'ecotrack_bist_settings';
const CHALLENGES_KEY = 'ecotrack_challenges';
const NOTIFS_KEY = 'ecotrack_notifs';

const defaultSettings = {
  name: 'BIST Student',
  house: 'Taylor',
  yearGroup: 'Year 11',
  darkMode: false,
  notifications: true,
  distanceUnit: 'km',
  accentColor: '#1A7A4A',
  dataRefresh: '30'
};

function loadSettings() {
  try { return { ...defaultSettings, ...JSON.parse(localStorage.getItem(SETTINGS_KEY) || '{}') }; }
  catch { return { ...defaultSettings }; }
}

function persistSettings(s) {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(s));
}

function loadChallengeState() {
  try {
    const d = JSON.parse(localStorage.getItem(CHALLENGES_KEY) || '{}');
    return {
      joined: new Set(d.joined || [1, 5]),
      completed: new Set(d.completed || [4]),
      progress: d.progress || { 1: 60, 5: 85 },
      lastLog: d.lastLog || {}
    };
  } catch {
    return { joined: new Set([1, 5]), completed: new Set([4]), progress: { 1: 60, 5: 85 }, lastLog: {} };
  }
}

function persistChallengeState() {
  localStorage.setItem(CHALLENGES_KEY, JSON.stringify({
    joined: [...state.challengeState.joined],
    completed: [...state.challengeState.completed],
    progress: state.challengeState.progress,
    lastLog: state.challengeState.lastLog
  }));
}

// ─── Application State ────────────────────────
const state = {
  currentUserId: null,  // set by db.js after auth
  dbProfiles: null,     // live profiles from Supabase
  currentView: 'dashboard',
  settings: loadSettings(),
  challengeState: loadChallengeState(),
  challengeFilter: 'all',
  charts: {},
  notifications: [
    { id: 1, icon: '☀️', iconBg: '#FEF9C3', title: 'Solar peak output!', sub: '94.2 kWh generated — best day this month', time: '9 min ago', read: false },
    { id: 2, icon: '🌿', iconBg: '#DCFCE7', title: 'Taylor House leads!', sub: 'Taylor earned 120 eco points from Lights Out', time: '1 hr ago', read: false },
    { id: 3, icon: '⚡', iconBg: '#FEF3C7', title: 'Energy alert resolved', sub: 'Main building AC now on 25°C schedule', time: '3 hr ago', read: true },
    { id: 4, icon: '📋', iconBg: '#E0F2FE', title: 'March report ready', sub: 'Your monthly sustainability report is available', time: 'Yesterday', read: true }
  ],
  challenges: [
    { id: 1, title: 'Lights Out Protocol', category: 'Energy', categoryColor: '#FEF3C7', categoryTextColor: '#92400E', bannerColor: 'linear-gradient(90deg,#F59E0B,#FCD34D)', desc: 'Turn off all classroom lights and fans when the last person leaves. Log your classroom each day for 5 days.', points: 150, deadline: 'Apr 5', participants: 38, avatarColors: ['#16A34A','#0369A1','#D97706'] },
    { id: 2, title: 'Bottle Up Challenge', category: 'Waste', categoryColor: '#DCFCE7', categoryTextColor: '#166534', bannerColor: 'linear-gradient(90deg,#16A34A,#4ADE80)', desc: 'Ditch single-use plastic bottles for one full week. Use only your personal reusable bottle on campus.', points: 100, deadline: 'Apr 8', participants: 72, avatarColors: ['#7C3AED','#DC2626','#D97706'] },
    { id: 3, title: 'Green Commute Week', category: 'Transport', categoryColor: '#E0F2FE', categoryTextColor: '#075985', bannerColor: 'linear-gradient(90deg,#0369A1,#38BDF8)', desc: 'Walk, cycle, or take the school bus instead of a private car for your commute every day this week.', points: 200, deadline: 'Apr 12', participants: 24, avatarColors: ['#16A34A','#0369A1'] },
    { id: 4, title: 'Meatless Monday', category: 'Food', categoryColor: '#F3E8FF', categoryTextColor: '#6B21A8', bannerColor: 'linear-gradient(90deg,#7C3AED,#A78BFA)', desc: 'Choose a vegetarian or vegan option at the canteen every Monday for this month. Photograph your meal!', points: 80, deadline: 'Apr 28', participants: 55, avatarColors: ['#D97706','#16A34A','#DC2626','#0369A1'] },
    { id: 5, title: 'Digital Assignment Sprint', category: 'Paper', categoryColor: '#DCFCE7', categoryTextColor: '#166534', bannerColor: 'linear-gradient(90deg,#15803D,#16A34A)', desc: 'Submit all assignments digitally for one week. No printing unless absolutely essential — go paperless.', points: 120, deadline: 'Apr 10', participants: 91, avatarColors: ['#7C3AED','#DC2626'] },
    { id: 6, title: 'Power-Down Pledge', category: 'Energy', categoryColor: '#FEF3C7', categoryTextColor: '#92400E', bannerColor: 'linear-gradient(90deg,#D97706,#FCD34D)', desc: 'Shut down computers fully at end of day (no sleep/standby). Check your lab and log it for two weeks.', points: 130, deadline: 'Apr 18', participants: 44, avatarColors: ['#0369A1','#16A34A','#D97706'] }
  ],
  houses: [
    { name: 'Taylor House', emoji: '🔵', color: '#1D4ED8', bg: '#DBEAFE', textColor: '#1E40AF', points: 3840, change: +120, members: 68 },
    { name: 'Walter House', emoji: '🟢', color: '#15803D', bg: '#DCFCE7', textColor: '#166534', points: 3290, change: +65,  members: 65 },
    { name: 'Edward House', emoji: '🔴', color: '#B91C1C', bg: '#FEE2E2', textColor: '#991B1B', points: 3100, change: -40,  members: 70 }
  ],
  individuals: [
    { name: 'BuBu',        house: 'Taylor', houseColor: '#1D4ED8', pts: 480, initials: 'BB', isMe: true },
    { name: 'Shokun',      house: 'Taylor', houseColor: '#1D4ED8', pts: 445, initials: 'SK', isMe: true },
    { name: 'Supawit T.',  house: 'Taylor', houseColor: '#1D4ED8', pts: 410, initials: 'ST' },
    { name: 'Malai P.',    house: 'Walter', houseColor: '#15803D', pts: 395, initials: 'MP' },
    { name: 'Naree K.',    house: 'Walter', houseColor: '#15803D', pts: 380, initials: 'NK' },
    { name: 'James O.',    house: 'Edward', houseColor: '#B91C1C', pts: 360, initials: 'JO' },
    { name: 'Thida R.',    house: 'Edward', houseColor: '#B91C1C', pts: 345, initials: 'TR' },
    { name: 'Priya S.',    house: 'Walter', houseColor: '#15803D', pts: 330, initials: 'PS' }
  ]
};

// ─── Helpers ──────────────────────────────────
const $ = (sel, ctx = document) => ctx.querySelector(sel);
const $$ = (sel, ctx = document) => [...ctx.querySelectorAll(sel)];
const clamp = (v, mn, mx) => Math.min(Math.max(v, mn), mx);
const formatNum = (n, d = 0) => n.toLocaleString('en-US', { minimumFractionDigits: d, maximumFractionDigits: d });

function today() {
  return new Date().toDateString();
}

// ─── Toast ────────────────────────────────────
function showToast(title, sub = '', type = 'success', icon = '✅') {
  if (!state.settings.notifications && type !== 'info') return;
  const container = $('#toast-container');
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.innerHTML = `<span class="toast-icon">${icon}</span>
    <div class="toast-text">
      <div class="toast-title">${title}</div>
      ${sub ? `<div class="toast-sub">${sub}</div>` : ''}
    </div>`;
  container.appendChild(toast);
  requestAnimationFrame(() => requestAnimationFrame(() => toast.classList.add('show')));
  setTimeout(() => { toast.classList.remove('show'); setTimeout(() => toast.remove(), 350); }, 3800);
}

// ─── Live Clock ───────────────────────────────
function updateLiveClock() {
  const el = $('#live-time');
  if (el) el.textContent = new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
}

// ─── Dark Mode ────────────────────────────────
function applyDarkMode(dark) {
  document.documentElement.classList.toggle('dark', dark);
}

// ─── Notifications ────────────────────────────
function showNotificationsPanel() {
  $('#notif-overlay').classList.add('open');
  $('#notif-panel').classList.add('open');
  renderNotifications();
}

function closeNotificationsPanel() {
  $('#notif-overlay').classList.remove('open');
  $('#notif-panel').classList.remove('open');
}

function markAllRead() {
  state.notifications.forEach(n => n.read = true);
  updateNotifBadge();
  renderNotifications();
}

function updateNotifBadge() {
  const unread = state.notifications.filter(n => !n.read).length;
  const dot = $('#notif-dot');
  if (dot) dot.style.display = unread > 0 ? 'block' : 'none';
}

function renderNotifications() {
  const list = $('#notif-list');
  if (!list) return;
  if (state.notifications.length === 0) {
    list.innerHTML = `<div class="notif-empty"><div class="notif-empty-icon">🔔</div>No notifications</div>`;
    return;
  }
  list.innerHTML = state.notifications.map(n => `
    <div class="notif-item ${n.read ? '' : 'unread'}" onclick="readNotif(${n.id})">
      <div class="notif-item-icon" style="background:${n.iconBg}">${n.icon}</div>
      <div class="notif-item-text">
        <div class="notif-item-title">${n.title}</div>
        <div class="notif-item-sub">${n.sub}</div>
        <div class="notif-item-time">${n.time}</div>
      </div>
    </div>`).join('');
}

function readNotif(id) {
  const n = state.notifications.find(x => x.id === id);
  if (n) n.read = true;
  updateNotifBadge();
  renderNotifications();
}

// ─── Refresh ──────────────────────────────────
function refreshData() {
  showToast('Data refreshed', 'All live feeds updated', 'info', '🔄');
  const n = { id: Date.now(), icon: '🔄', iconBg: '#E0F2FE', title: 'Data refreshed', sub: 'Live campus data updated', time: 'Just now', read: false };
  state.notifications.unshift(n);
  updateNotifBadge();
}

// ─── Navigation ───────────────────────────────
const PAGE_META = {
  dashboard:   { title: 'Dashboard',          sub: 'Real-time sustainability overview — Bromsgrove International School Thailand' },
  energy:      { title: 'Energy Monitor',     sub: 'Track electricity, water and solar generation across campus' },
  calculator:  { title: 'Carbon Calculator',  sub: 'Estimate and reduce your personal carbon footprint' },
  challenges:  { title: 'Eco Challenges',     sub: 'Join sustainability missions and earn points for your house' },
  leaderboard: { title: 'Leaderboard',        sub: 'House and individual eco-point rankings — March 2026' },
  info:        { title: 'How to Use',         sub: 'A complete guide to every feature in EcoTrack BIST' },
  credits:     { title: 'Credits',            sub: 'The team behind EcoTrack BIST' },
  reports:     { title: 'Reports & Insights', sub: 'Monthly sustainability performance and school achievements' },
  settings:    { title: 'Settings',           sub: 'Personalise your EcoTrack experience' },
  help:        { title: 'Help & Support',     sub: 'Frequently asked questions and contact information' }
};

function navigate(view) {
  if (state.currentView === view) return;
  state.currentView = view;
  $$('.nav-item').forEach(el => el.classList.toggle('active', el.dataset.view === view));
  $$('.view').forEach(el => el.classList.toggle('active', el.id === `view-${view}`));
  const meta = PAGE_META[view];
  if (meta) { $('#topbar-title').textContent = meta.title; $('#topbar-sub').textContent = meta.sub; }
  setTimeout(() => initViewCharts(view), 60);
}

// ─── Charts ───────────────────────────────────
const chartBase = {
  responsive: true, maintainAspectRatio: true,
  plugins: {
    legend: { display: false },
    tooltip: { backgroundColor: '#0D1B12', titleColor: '#fff', bodyColor: '#9CA3AF', borderColor: '#1C2E1F', borderWidth: 1, padding: 10, cornerRadius: 8, titleFont: { size: 12, weight: '700' }, bodyFont: { size: 12 } }
  },
  scales: {
    x: { grid: { display: false }, border: { display: false }, ticks: { color: '#7A9688', font: { size: 11 } } },
    y: { grid: { color: '#EEF3F0' }, border: { display: false }, ticks: { color: '#7A9688', font: { size: 11 } } }
  }
};

function destroyChart(id) { if (state.charts[id]) { state.charts[id].destroy(); delete state.charts[id]; } }

function initViewCharts(view) {
  if (view === 'dashboard') initDashboardCharts();
  if (view === 'energy')    initEnergyCharts();
}

function initDashboardCharts() {
  destroyChart('weeklyEnergy');
  const c1 = $('#chart-weekly-energy');
  if (!c1) return;
  const consumed = [1840, 1720, 1950, 1680, 1590, 480, 320];
  const target   = [1600, 1600, 1600, 1600, 1600, 600, 400];
  state.charts.weeklyEnergy = new Chart(c1, {
    type: 'bar',
    data: {
      labels: ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'],
      datasets: [
        { label: 'Consumed (kWh)', data: consumed, backgroundColor: consumed.map((v,i) => v > target[i] ? '#FCA5A5' : '#BBF7D0'), borderRadius: 6, borderSkipped: false, order: 1 },
        { label: 'Target', data: target, type: 'line', borderColor: '#1A7A4A', borderWidth: 2, borderDash: [5,4], pointRadius: 0, fill: false, tension: 0.3, order: 0 }
      ]
    },
    options: { ...chartBase, plugins: { ...chartBase.plugins, legend: { display: true, position: 'top', align: 'end', labels: { boxWidth: 12, boxHeight: 12, borderRadius: 4, font: { size: 11, weight: '600' }, color: '#4A6558' } } }, scales: { ...chartBase.scales, y: { ...chartBase.scales.y, ticks: { ...chartBase.scales.y.ticks, callback: v => v + ' kWh' } } } }
  });

  destroyChart('co2Trend');
  const c2 = $('#chart-co2');
  if (!c2) return;
  state.charts.co2Trend = new Chart(c2, {
    type: 'line',
    data: {
      labels: ['Oct','Nov','Dec','Jan','Feb','Mar'],
      datasets: [{ label: 'CO₂ (tonnes)', data: [14.2,13.8,15.1,12.9,12.1,11.4], borderColor: '#0369A1', backgroundColor: 'rgba(3,105,161,0.08)', borderWidth: 2.5, pointBackgroundColor: '#0369A1', pointRadius: 4, fill: true, tension: 0.4 }]
    },
    options: { ...chartBase, scales: { ...chartBase.scales, y: { ...chartBase.scales.y, ticks: { ...chartBase.scales.y.ticks, callback: v => v + 't' } } } }
  });
}

function initEnergyCharts() {
  destroyChart('energyMonthly');
  const c1 = $('#chart-energy-monthly');
  if (!c1) return;
  state.charts.energyMonthly = new Chart(c1, {
    type: 'line',
    data: {
      labels: ['Sep','Oct','Nov','Dec','Jan','Feb','Mar'],
      datasets: [
        { label: 'This Year (kWh)', data: [12400,13100,12800,14200,11900,11500,10800], borderColor: '#1A7A4A', backgroundColor: 'rgba(26,122,74,0.08)', fill: true, tension: 0.4, borderWidth: 2.5, pointRadius: 4, pointBackgroundColor: '#1A7A4A' },
        { label: 'Last Year', data: [13200,14100,13800,15400,13100,12900,12200], borderColor: '#9CA3AF', borderWidth: 1.5, borderDash: [4,4], pointRadius: 0, fill: false, tension: 0.4 }
      ]
    },
    options: { ...chartBase, plugins: { ...chartBase.plugins, legend: { display: true, position: 'top', align: 'end', labels: { boxWidth: 12, font: { size: 11, weight: '600' }, color: '#4A6558' } } }, scales: { ...chartBase.scales, y: { ...chartBase.scales.y, ticks: { ...chartBase.scales.y.ticks, callback: v => (v/1000).toFixed(1)+'k' } } } }
  });

  destroyChart('waterChart');
  const c2 = $('#chart-water');
  if (!c2) return;
  state.charts.waterChart = new Chart(c2, {
    type: 'bar',
    data: { labels: ['Sep','Oct','Nov','Dec','Jan','Feb','Mar'], datasets: [{ label: 'Water (m³)', data: [620,580,590,640,540,510,490], backgroundColor: 'rgba(3,105,161,0.65)', borderRadius: 6, borderSkipped: false }] },
    options: { ...chartBase, scales: { ...chartBase.scales, y: { ...chartBase.scales.y, ticks: { ...chartBase.scales.y.ticks, callback: v => v+' m³' } } } }
  });
}

// ─── Dashboard ────────────────────────────────
function renderDashboard() {
  $('#view-dashboard').innerHTML = `
<div class="metrics-grid">
  ${[
    { color:'green', icon:'⚡', label:'Energy Today', value:'1,284', unit:' kWh', change:'−8.2%', ct:'positive', detail:'vs 1,398 kWh yesterday' },
    { color:'blue',  icon:'🌥', label:'CO₂ Saved (Mar)', value:'2.4', unit:' tonnes', change:'+18%', ct:'positive', detail:'vs February target' },
    { color:'amber', icon:'☀️', label:'Solar Generated', value:'94.2', unit:' kWh', change:'+12%', ct:'positive', detail:'from 48 rooftop panels' },
    { color:'purple',icon:'🏆', label:'Eco Score', value:'73', unit:'/100', change:'+5 pts', ct:'positive', detail:'B+ rating · above average' }
  ].map(m => `
  <div class="metric-card ${m.color}">
    <div class="metric-icon ${m.color}" style="font-size:20px">${m.icon}</div>
    <div class="metric-label">${m.label}</div>
    <div class="metric-value">${m.value}<span class="metric-unit">${m.unit}</span></div>
    <div class="metric-change positive">↑ ${m.change}</div>
    <div class="metric-detail">${m.detail}</div>
  </div>`).join('')}
</div>

<div class="dash-grid mb-20">
  <div class="card">
    <div class="card-header" style="padding-bottom:16px">
      <div><div class="card-title">Weekly Energy Consumption</div><div class="card-subtitle">kWh · red bars = over daily target</div></div>
    </div>
    <div class="card-body" style="padding-top:0"><div class="chart-wrap"><canvas id="chart-weekly-energy"></canvas></div></div>
  </div>
  <div style="display:flex;flex-direction:column;gap:16px">
    <div class="card" style="flex:1">
      <div class="card-header"><div class="card-title">Sustainability Goals</div></div>
      <div class="card-body">
        <div class="goals-list">
          ${[
            { name:'Reduce energy 15% vs 2025', pct:73, color:'green', detail:'10.9% achieved · 4.1% remaining' },
            { name:'Carbon neutral by 2028', pct:34, color:'blue', detail:'Phase 1 of 3 complete' },
            { name:'Solar covers 20% of demand', pct:37, color:'amber', detail:'7.4% currently · 48 panels active' },
            { name:'Zero single-use plastic', pct:68, color:'green', detail:'Canteen & events phase done' }
          ].map(g => `
          <div class="goal-item">
            <div class="goal-header"><span class="goal-name">${g.name}</span><span class="goal-value">${g.pct}%</span></div>
            <div class="progress-bar"><div class="progress-fill ${g.color}" style="width:${g.pct}%"></div></div>
            <div class="goal-meta">${g.detail}</div>
          </div>`).join('')}
        </div>
      </div>
    </div>
  </div>
</div>

<div class="dash-grid-3">
  <div class="card">
    <div class="card-header"><div class="card-title">CO₂ Trend</div><div class="card-subtitle">tonnes/month</div></div>
    <div class="card-body" style="padding-top:12px"><div class="chart-wrap"><canvas id="chart-co2" style="max-height:160px"></canvas></div></div>
  </div>
  <div class="card">
    <div class="card-header"><div class="card-title">Solar Generation</div></div>
    <div class="card-body" style="padding-top:0">
      <div class="solar-display">
        <div class="solar-ring">
          <svg viewBox="0 0 36 36">
            <circle cx="18" cy="18" r="15.9" fill="none" stroke="#EEF3F0" stroke-width="3"/>
            <circle cx="18" cy="18" r="15.9" fill="none" stroke="#F59E0B" stroke-width="3" stroke-dasharray="37 63" stroke-linecap="round"/>
          </svg>
          <div class="solar-ring-text"><span class="solar-pct">37%</span><span class="solar-pct-label">of demand</span></div>
        </div>
        <div class="solar-label">Solar Coverage Today</div>
        <div class="solar-sub">94.2 kWh generated<br>from 48 rooftop panels</div>
      </div>
    </div>
  </div>
  <div class="card">
    <div class="card-header"><div class="card-title">Recent Activity</div></div>
    <div class="card-body" style="padding-top:8px">
      <div class="activity-list">
        ${[
          { icon:'⚡', bg:'#FEF3C7', title:'AC optimisation complete', desc:'Building A thermostats set to 25°C schedule', time:'9 min ago' },
          { icon:'🌿', bg:'#DCFCE7', title:'Taylor House takes the lead', desc:'Earned 120 eco pts from Lights Out challenge', time:'1 hr ago' },
          { icon:'🚰', bg:'#E0F2FE', title:'Water usage alert resolved', desc:'Science lab leak fixed — saving ~40 L/hr', time:'3 hr ago' },
          { icon:'☀️', bg:'#FEF9C3', title:'Solar peak output recorded', desc:'94.2 kWh generated — best day this month', time:'5 hr ago' }
        ].map(a => `
        <div class="activity-item">
          <div class="activity-icon" style="background:${a.bg}"><span style="font-size:14px">${a.icon}</span></div>
          <div class="activity-text"><div class="activity-title">${a.title}</div><div class="activity-desc">${a.desc}</div></div>
          <div class="activity-time">${a.time}</div>
        </div>`).join('')}
      </div>
    </div>
  </div>
</div>`;
  setTimeout(() => initDashboardCharts(), 60);
}

// ─── Energy ───────────────────────────────────
function renderEnergy() {
  $('#view-energy').innerHTML = `
<div class="energy-grid">
  ${[
    { name:'Electricity', dot:'#1A7A4A', value:'10,840', unit:'kWh', label:'March total', trend:'−6.4% vs Feb', tt:'down', fill:'#1A7A4A', pct:73 },
    { name:'Water',       dot:'#0369A1', value:'490',    unit:'m³',  label:'March total', trend:'−4.1% vs Feb', tt:'down', fill:'#0369A1', pct:55 },
    { name:'Solar Gen.',  dot:'#D97706', value:'2,640',  unit:'kWh', label:'March total', trend:'+12% vs Feb',  tt:'up',   fill:'#D97706', pct:37 }
  ].map(s => `
  <div class="energy-source-card">
    <div class="energy-source-header">
      <div class="source-badge"><span class="dot" style="background:${s.dot}"></span>${s.name}</div>
      <span class="source-trend trend-${s.tt}">${s.trend}</span>
    </div>
    <div class="source-value">${s.value} <span class="source-unit">${s.unit}</span></div>
    <div class="source-label">${s.label}</div>
    <div class="source-mini-bar"><div class="source-mini-fill" style="width:${s.pct}%;background:${s.fill}"></div></div>
  </div>`).join('')}
</div>
<div class="dash-grid mb-20">
  <div class="card">
    <div class="card-header" style="padding-bottom:16px"><div><div class="card-title">Electricity Consumption</div><div class="card-subtitle">Monthly kWh vs previous year</div></div></div>
    <div class="card-body" style="padding-top:0"><div class="chart-wrap"><canvas id="chart-energy-monthly"></canvas></div></div>
  </div>
  <div class="card">
    <div class="card-header"><div class="card-title">Energy by Building</div><div class="card-subtitle">March 2026</div></div>
    <div class="card-body">
      <div class="building-list">
        ${[
          { name:'Main Building', val:'3,840 kWh', pct:100 },
          { name:'Science Block', val:'2,290 kWh', pct:60 },
          { name:'Sports Centre', val:'1,980 kWh', pct:52 },
          { name:'Library',       val:'1,420 kWh', pct:37 },
          { name:'Boarding House',val:'820 kWh',   pct:21 },
          { name:'Admin Block',   val:'490 kWh',   pct:13 }
        ].map(b => `
        <div class="building-item">
          <span class="building-name">${b.name}</span>
          <div class="building-bar-wrap"><div class="building-bar" style="width:${b.pct}%"></div></div>
          <span class="building-val">${b.val}</span>
        </div>`).join('')}
      </div>
    </div>
  </div>
</div>
<div class="dash-grid-3">
  <div class="card">
    <div class="card-header"><div class="card-title">Water Usage</div><div class="card-subtitle">Monthly m³</div></div>
    <div class="card-body" style="padding-top:12px"><div class="chart-wrap"><canvas id="chart-water" style="max-height:170px"></canvas></div></div>
  </div>
  <div class="card">
    <div class="card-header"><div class="card-title">Energy Tips</div></div>
    <div class="card-body">
      ${[
        { e:'❄️', tip:'Set AC to 25°C', save:'Saves ~18% cooling energy' },
        { e:'💡', tip:'Switch to LED lighting', save:'80% less than fluorescent' },
        { e:'🔌', tip:'Unplug idle electronics', save:'Standby uses up to 10%' },
        { e:'🌿', tip:'Use natural ventilation', save:'Shaded rooms stay 3–4°C cooler' }
      ].map(t => `
      <div style="display:flex;align-items:center;gap:10px;padding:9px 0;border-bottom:1px solid var(--border-light)">
        <span style="font-size:18px">${t.e}</span>
        <div><div style="font-size:12.5px;font-weight:700;color:var(--text)">${t.tip}</div><div style="font-size:11px;color:var(--text-muted)">${t.save}</div></div>
      </div>`).join('')}
    </div>
  </div>
  <div class="card">
    <div class="card-header"><div class="card-title">Campus Highlights</div></div>
    <div class="card-body">
      ${[
        { label:'Peak demand hour', value:'10–11 AM', icon:'⏰' },
        { label:'Lowest demand', value:'Weekend nights', icon:'🌙' },
        { label:'Top consumer', value:'Main Building AC', icon:'❄️' },
        { label:'Most improved', value:'Science Block −14%', icon:'🔬' },
        { label:'Solar surplus days', value:'8 days this month', icon:'☀️' }
      ].map(h => `
      <div style="display:flex;align-items:center;justify-content:space-between;padding:9px 0;border-bottom:1px solid var(--border-light)">
        <div style="display:flex;align-items:center;gap:8px;font-size:12.5px;color:var(--text-muted)"><span>${h.icon}</span>${h.label}</div>
        <span style="font-size:12.5px;font-weight:700;color:var(--text)">${h.value}</span>
      </div>`).join('')}
    </div>
  </div>
</div>`;
  setTimeout(() => initEnergyCharts(), 60);
}

// ─── Calculator ───────────────────────────────
function renderCalculator() {
  const unit = state.settings.distanceUnit;
  $('#view-calculator').innerHTML = `
<div class="calc-layout">
  <div>
    <div class="section-heading">Your Carbon Footprint</div>
    <div class="section-sub">Fill in your typical habits to calculate your annual CO₂e footprint.</div>
    <div class="card">
      <div class="card-body">
        <div class="calc-section">
          <div class="calc-section-title">🚗 Getting to School</div>
          <div class="field-group">
            <label class="field-label">How do you usually travel to school?</label>
            <div class="radio-group" id="transport-group">
              ${[['car_alone','🚗','Private car (alone)'],['car_shared','🚙','Private car (carpool)'],['bus','🚌','School bus'],['walk_bike','🚶','Walk or cycle']].map((o,i) => `
              <label class="radio-option ${i===0?'selected':''}" data-val="${o[0]}">
                <input type="radio" name="transport"><span class="radio-dot"></span><span class="radio-icon">${o[1]}</span>${o[2]}
              </label>`).join('')}
            </div>
          </div>
          <div class="field-group">
            <label class="field-label">Distance home to school (${unit}, one way)</label>
            <input class="field-input" type="number" id="distance" value="8" min="1" max="200">
            <div class="field-hint">School is at Min Buri, Bangkok — adjust to your home distance</div>
          </div>
        </div>
        <div class="divider"></div>
        <div class="calc-section" style="margin-top:20px">
          <div class="calc-section-title">🍱 Food Choices</div>
          <div class="field-group">
            <label class="field-label">What best describes your diet?</label>
            <div class="radio-group" id="food-group">
              ${[['heavy_meat','🥩','Meat with most meals'],['mixed','🍱','Mixed (meat a few times/week)'],['vegetarian','🥗','Vegetarian'],['vegan','🌱','Vegan']].map((o,i) => `
              <label class="radio-option ${i===1?'selected':''}" data-val="${o[0]}">
                <input type="radio" name="food"><span class="radio-dot"></span><span class="radio-icon">${o[1]}</span>${o[2]}
              </label>`).join('')}
            </div>
          </div>
        </div>
        <div class="divider"></div>
        <div class="calc-section" style="margin-top:20px">
          <div class="calc-section-title">🏠 Home Energy</div>
          <div class="field-group">
            <label class="field-label">Home electricity usage</label>
            <select class="field-select" id="home-energy">
              <option value="low">Low — small apartment, minimal AC</option>
              <option value="medium" selected>Medium — house with regular AC use</option>
              <option value="high">High — large house, AC always on</option>
            </select>
          </div>
          <div class="field-group">
            <label class="field-label">Solar panels at home?</label>
            <select class="field-select" id="home-solar">
              <option value="no" selected>No solar panels</option>
              <option value="partial">Partial solar coverage</option>
              <option value="full">Mostly solar-powered</option>
            </select>
          </div>
        </div>
        <button class="btn-primary" style="width:100%;justify-content:center;padding:12px;margin-top:4px" onclick="calculateCarbon()">
          Calculate My Footprint
        </button>
      </div>
    </div>
  </div>
  <div>
    <div class="result-card">
      <div class="result-label">Your Annual CO₂ Footprint</div>
      <div class="result-value" id="result-value">—<span class="result-unit"> tonnes CO₂e</span></div>
      <div class="result-comparison" id="result-comparison" style="display:none">
        <div class="comparison-row"><span class="comparison-label">You</span><div class="comparison-bar-wrap"><div class="comparison-fill" id="bar-you" style="background:#4ADE80"></div></div><span class="comparison-val" id="val-you">—</span></div>
        <div class="comparison-row"><span class="comparison-label">Thailand avg.</span><div class="comparison-bar-wrap"><div class="comparison-fill" style="width:70%;background:#94A3B8"></div></div><span class="comparison-val">3.5 t</span></div>
        <div class="comparison-row"><span class="comparison-label">Global avg.</span><div class="comparison-bar-wrap"><div class="comparison-fill" style="width:85%;background:#64748B"></div></div><span class="comparison-val">4.7 t</span></div>
        <div class="comparison-row"><span class="comparison-label">1.5°C target</span><div class="comparison-bar-wrap"><div class="comparison-fill" style="width:24%;background:#F59E0B"></div></div><span class="comparison-val">1.2 t</span></div>
      </div>
      <div class="result-rating" id="result-rating" style="display:none">
        <span class="rating-emoji" id="rating-emoji">🌱</span>
        <div class="rating-text"><div class="rating-title" id="rating-title">—</div><div class="rating-desc" id="rating-desc">Fill in the form and click Calculate</div></div>
      </div>
    </div>
    <div style="margin-bottom:16px">
      <div class="section-heading" style="font-size:15px;margin-bottom:12px">Ways to reduce your impact</div>
      <div class="tips-list">
        ${[
          { title:'Take the school bus', desc:'Switching from a solo car trip to the school bus cuts your commute emissions by up to 75%.', saving:'Save ~0.4 t CO₂e/yr' },
          { title:'Eat less red meat', desc:'Replacing 3 meat meals per week with plant-based alternatives is one of the highest-impact dietary changes.', saving:'Save ~0.5 t CO₂e/yr' },
          { title:'Optimise your AC at home', desc:'Setting your AC to 25–26°C and using ceiling fans reduces home cooling energy significantly.', saving:'Save ~0.3 t CO₂e/yr' }
        ].map(t => `
        <div class="tip-item">
          <div class="tip-icon" style="background:var(--primary-light);color:var(--primary)"><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" style="width:14px;height:14px"><path stroke-linecap="round" stroke-linejoin="round" d="M12 18.75a6 6 0 006-6v-1.5m-6 7.5a6 6 0 01-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 01-3-3V4.5a3 3 0 116 0v8.25a3 3 0 01-3 3z"/></svg></div>
          <div class="tip-text"><div class="tip-title">${t.title}</div><div class="tip-desc">${t.desc}</div><span class="tip-saving">${t.saving}</span></div>
        </div>`).join('')}
      </div>
    </div>
  </div>
</div>`;
}

function calculateCarbon() {
  const transport = $('#transport-group .radio-option.selected')?.dataset.val || 'car_alone';
  const food      = $('#food-group .radio-option.selected')?.dataset.val || 'mixed';
  const dist      = parseFloat($('#distance')?.value || 8);
  const unit      = state.settings.distanceUnit;
  const km        = unit === 'miles' ? dist * 1.60934 : dist;
  const homeE     = $('#home-energy')?.value || 'medium';
  const solar     = $('#home-solar')?.value || 'no';

  const tFactor  = { car_alone: 0.192, car_shared: 0.096, bus: 0.045, walk_bike: 0 };
  const fCO2     = { heavy_meat: 2.5, mixed: 1.5, vegetarian: 0.9, vegan: 0.5 };
  const hBase    = { low: 0.8, medium: 1.4, high: 2.2 };
  const sDisc    = { no: 1.0, partial: 0.7, full: 0.35 };

  const total = (tFactor[transport] * km * 2 * 195 / 1000) + fCO2[food] + (hBase[homeE] * sDisc[solar]);
  const rounded = Math.round(total * 10) / 10;

  const ratings = [
    [1.5, '🌟', 'Climate Champion', 'Your footprint is well below the 1.5°C pathway — outstanding!'],
    [2.5, '🌿', 'Eco Aware', 'Below the Thai average — you\'re making a real difference!'],
    [3.5, '🟡', 'Room to Improve', 'Around the Thai average. A few changes could take you well below it.'],
    [Infinity, '🔴', 'High Impact', 'Above average — transport and diet are the biggest levers to pull.']
  ];
  const [, emoji, title, desc] = ratings.find(([threshold]) => rounded <= threshold);

  $('#result-value').innerHTML = `${rounded}<span class="result-unit"> tonnes CO₂e/yr</span>`;
  $('#result-comparison').style.display = 'flex';
  $('#result-rating').style.display = 'flex';
  const pct = clamp((rounded / 5) * 100, 5, 100);
  $('#bar-you').style.cssText = `width:${pct}%;background:${rounded <= 2 ? '#4ADE80' : rounded <= 3.5 ? '#FCD34D' : '#F87171'}`;
  $('#val-you').textContent = rounded + ' t';
  $('#rating-emoji').textContent = emoji;
  $('#rating-title').textContent = title;
  $('#rating-desc').textContent = desc;
  showToast('Footprint calculated!', `${rounded} tonnes CO₂e per year`, 'success', '🌍');
  if (state.currentUserId) dbSaveCarbonLog(state.currentUserId, rounded);
}

// ─── Challenges ───────────────────────────────
function renderChallenges() {
  const cs = state.challengeState;
  const available = state.challenges.filter(c => !cs.joined.has(c.id) && !cs.completed.has(c.id));
  const active    = state.challenges.filter(c => cs.joined.has(c.id));
  const done      = state.challenges.filter(c => cs.completed.has(c.id));

  const filtered = state.challengeFilter === 'active' ? active
    : state.challengeFilter === 'done' ? done
    : state.challenges;

  const activeCount = active.length;
  $('#challenge-count-badge').textContent = activeCount || state.challenges.length;

  $('#view-challenges').innerHTML = `
<div class="challenges-header">
  <div>
    <div class="section-heading">Eco Challenges</div>
    <div class="section-sub" style="margin-bottom:0">${active.length} active · ${done.length} completed · ${available.length} available to join</div>
  </div>
  <div class="filter-tabs">
    <button class="filter-tab ${state.challengeFilter==='all'?'active':''}" onclick="filterChallenges('all')">All</button>
    <button class="filter-tab ${state.challengeFilter==='active'?'active':''}" onclick="filterChallenges('active')">My Active (${active.length})</button>
    <button class="filter-tab ${state.challengeFilter==='done'?'active':''}" onclick="filterChallenges('done')">Completed (${done.length})</button>
  </div>
</div>
<div class="challenges-grid">
  ${filtered.length === 0 ? `<div class="card" style="grid-column:1/-1"><div class="empty-state"><div class="empty-icon">🌱</div><div class="empty-title">Nothing here yet</div><div class="empty-desc">Join challenges from the "All" tab to get started!</div></div></div>` :
  filtered.map(c => {
    const isJoined = cs.joined.has(c.id);
    const isDone   = cs.completed.has(c.id);
    const progress = cs.progress[c.id] || 0;
    const loggedToday = cs.lastLog[c.id] === today();
    return `
  <div class="challenge-card">
    <div class="challenge-banner" style="background:${c.bannerColor}"></div>
    <div class="challenge-body">
      <div class="challenge-meta">
        <span class="challenge-category" style="background:${c.categoryColor};color:${c.categoryTextColor}">${c.category}</span>
        <span class="challenge-points">⭐ ${c.points} pts</span>
      </div>
      <div class="challenge-title">${c.title}</div>
      <div class="challenge-desc">${c.desc}</div>
      ${isJoined && !isDone ? `
      <div class="challenge-progress" style="margin-top:12px">
        <div class="challenge-progress-label"><span>Progress</span><span>${progress}%</span></div>
        <div class="progress-bar"><div class="progress-fill green" style="width:${progress}%"></div></div>
      </div>` : ''}
      <div class="challenge-footer">
        <div class="challenge-deadline">📅 Ends ${c.deadline}</div>
        <div class="challenge-participants">
          <div class="participants-avatars">${c.avatarColors.map(col => `<div class="participant-avatar" style="background:${col}">•</div>`).join('')}</div>
          +${c.participants}
        </div>
      </div>
      ${isDone
        ? `<div class="challenge-btn done">✓ Completed · ${c.points} pts earned</div>`
        : isJoined
          ? `<button class="log-btn" ${loggedToday?'disabled':''} onclick="logProgress(${c.id})">${loggedToday ? '✓ Logged today' : '+ Log today\'s action'}</button>
             <button class="challenge-btn active-btn" onclick="completeChallenge(${c.id})">Mark as Completed</button>`
          : `<button class="challenge-btn join" onclick="joinChallenge(${c.id})">Join Challenge</button>`
      }
    </div>
  </div>`}).join('')}
</div>`;
}

function filterChallenges(f) { state.challengeFilter = f; renderChallenges(); }

function joinChallenge(id) {
  state.challengeState.joined.add(id);
  state.challengeState.progress[id] = 0;
  persistChallengeState();
  const ch = state.challenges.find(c => c.id === id);
  showToast('Challenge joined!', `"${ch.title}" — good luck!`, 'success', '🏆');
  if (state.currentUserId) dbJoinChallenge(state.currentUserId, id);
  renderChallenges();
}

function logProgress(id) {
  const cs = state.challengeState;
  cs.lastLog[id] = today();
  cs.progress[id] = Math.min(100, (cs.progress[id] || 0) + 20);
  persistChallengeState();
  const ch = state.challenges.find(c => c.id === id);
  if (cs.progress[id] >= 100) {
    showToast('100% progress!', `Consider marking "${ch.title}" complete`, 'success', '🌟');
  } else {
    showToast('Action logged!', `Progress: ${cs.progress[id]}%`, 'success', '✅');
  }
  if (state.currentUserId) dbLogProgress(state.currentUserId, id, cs.progress[id]);
  renderChallenges();
}

function completeChallenge(id) {
  state.challengeState.joined.delete(id);
  state.challengeState.completed.add(id);
  persistChallengeState();
  const ch = state.challenges.find(c => c.id === id);
  const house = state.houses.find(h => h.name.startsWith(state.settings.house));
  if (house) house.points += ch.points;
  if (state.currentUserId) {
    dbCompleteChallenge(state.currentUserId, id);
    dbAddPoints(state.currentUserId, ch.points);
  }
  showToast('Challenge complete! 🎉', `+${ch.points} eco points for ${state.settings.house} House!`, 'success', '🌟');
  renderChallenges();
}

// ─── Leaderboard ──────────────────────────────
function renderLeaderboard() {
  const myHouse = state.settings.house;
  const sorted = [...state.houses].sort((a, b) => b.points - a.points);
  const podiumOrder = sorted.length >= 3 ? [sorted[1], sorted[0], sorted[2]] : sorted;

  $('#view-leaderboard').innerHTML = `
<div class="section-heading">House Rankings</div>
<div class="section-sub">March 2026 · Updated daily based on eco points earned</div>
<div class="leaderboard-layout">
  <div>
    <div class="card mb-20">
      <div class="card-body" style="padding:0">
        <div class="podium">
          ${podiumOrder.map((h, i) => {
            const actualRank = i === 0 ? 2 : i === 1 ? 1 : 3;
            const classes = ['second','first','third'];
            const heights = ['70px','100px','50px'];
            const isMyHouse = h.name.startsWith(myHouse);
            return `
          <div class="podium-slot">
            ${actualRank === 1 ? '<span class="podium-crown">👑</span>' : ''}
            <div class="podium-avatar" style="background:${h.color}">${h.emoji}</div>
            <div class="podium-name">${h.name.split(' ')[0]}${isMyHouse ? ' <span style="font-size:10px;background:#DBEAFE;color:#1E40AF;padding:1px 5px;border-radius:10px">You</span>' : ''}</div>
            <div class="podium-pts">${formatNum(h.points)} pts</div>
            <div class="podium-block ${classes[i]}" style="height:${heights[i]}">${actualRank}</div>
          </div>`;
          }).join('')}
        </div>
      </div>
      <div class="card-divider"></div>
      <div class="card-body" style="padding-top:12px">
        <table class="house-table">
          <thead><tr><th>#</th><th>House</th><th>Members</th><th>Points</th><th>Change</th></tr></thead>
          <tbody>
            ${sorted.map((h, i) => {
              const isMyHouse = h.name.startsWith(myHouse);
              return `<tr style="${isMyHouse ? 'background:rgba(29,78,216,0.05)' : ''}">
                <td><span class="house-rank ${i===0?'top':''}">${i+1}</span></td>
                <td>
                  <div style="display:flex;align-items:center;gap:10px">
                    <div class="house-color-dot" style="background:${h.bg}">${h.emoji}</div>
                    <span class="house-name-cell">${h.name}${isMyHouse ? '<span class="my-house-pill">My House</span>' : ''}</span>
                  </div>
                </td>
                <td style="color:var(--text-muted);font-size:13px">${h.members}</td>
                <td><span class="house-pts-cell">${formatNum(h.points)}</span></td>
                <td><span class="house-change ${h.change > 0 ? 'change-up' : 'change-down'}">${h.change > 0 ? '▲' : '▼'} ${Math.abs(h.change)}</span></td>
              </tr>`;
            }).join('')}
          </tbody>
        </table>
      </div>
    </div>
  </div>
  <div>
    <div class="card mb-16">
      <div class="card-header"><div class="card-title">Top Students</div><div class="card-subtitle">March 2026</div></div>
      <div class="card-body">
        <div class="individual-list">
          ${(state.dbProfiles || state.individuals).map((p, i) => `
          <div class="individual-item">
            <span class="individual-rank">${i+1}</span>
            <div class="individual-avatar" style="background:${p.houseColor}">${p.initials}</div>
            <div class="individual-info">
              <div class="individual-name">${p.name}${p.isMe ? ' <span style="font-size:10px;color:var(--primary);font-weight:700">You</span>' : ''}</div>
              <div class="individual-house">${p.house} House</div>
            </div>
            <span class="individual-pts">${p.pts}</span>
          </div>`).join('')}
        </div>
      </div>
    </div>
    <div class="card">
      <div class="card-header"><div class="card-title">How to Earn Points</div></div>
      <div class="card-body">
        ${[
          { a:'Complete an Eco Challenge', pts:'+80–200', e:'🏆' },
          { a:'Submit a green initiative idea', pts:'+50', e:'💡' },
          { a:'Reduce classroom energy use', pts:'+30/day', e:'⚡' },
          { a:'Go meatless for a day', pts:'+20', e:'🥗' },
          { a:'Use a reusable bottle all day', pts:'+10', e:'🍶' }
        ].map(a => `
        <div style="display:flex;align-items:center;justify-content:space-between;padding:8px 0;border-bottom:1px solid var(--border-light)">
          <div style="display:flex;align-items:center;gap:8px;font-size:12.5px;color:var(--text-secondary)"><span>${a.e}</span>${a.a}</div>
          <span style="font-size:12.5px;font-weight:800;color:var(--accent-amber)">${a.pts}</span>
        </div>`).join('')}
      </div>
    </div>
  </div>
</div>`;
}

// ─── Reports ──────────────────────────────────
function renderReports() {
  const reports = [
    { icon:'📊', bg:'#DCFCE7', ic:'#16A34A', title:'March 2026 Summary', period:'Full month sustainability report', e:'10,840', w:'490 m³', co2:'11.4t', id:'march2026' },
    { icon:'📅', bg:'#E0F2FE', ic:'#0369A1', title:'Q1 2026 Report', period:'January — March 2026', e:'34,200', w:'1,530 m³', co2:'35.8t', id:'q12026' },
    { icon:'🎓', bg:'#F3E8FF', ic:'#7C3AED', title:'Academic Year 2025/26', period:'Aug 2025 – Mar 2026 (partial)', e:'91,400', w:'4,100 m³', co2:'98.2t', id:'ay2526' }
  ];

  const badges = [
    { e:'🌱', n:'First Steps', earned:true }, { e:'⚡', n:'Power Saver', earned:true },
    { e:'💧', n:'Water Wise',  earned:true }, { e:'☀️', n:'Solar Pioneer', earned:true },
    { e:'🏆', n:'Eco Champion', earned:true },{ e:'🚌', n:'Green Commuter', earned:false },
    { e:'🌍', n:'Carbon Neutral', earned:false },{ e:'♻️', n:'Zero Waste', earned:false },
    { e:'🌳', n:'Tree Planter', earned:false },{ e:'🔋', n:'Energy Master', earned:false }
  ];

  $('#view-reports').innerHTML = `
<div class="section-heading">Reports & Insights</div>
<div class="section-sub">School-wide sustainability performance, trends, and achievements</div>
<div class="reports-grid mb-24">
  ${reports.map(r => `
  <div class="report-card">
    <div class="report-icon" style="background:${r.bg};color:${r.ic}"><span style="font-size:20px">${r.icon}</span></div>
    <div class="report-title">${r.title}</div>
    <div class="report-period">${r.period}</div>
    <div class="report-stats">
      <div class="report-stat-item"><div class="report-stat-val">${r.e}</div><div class="report-stat-label">kWh</div></div>
      <div class="report-stat-item"><div class="report-stat-val">${r.w}</div><div class="report-stat-label">Water</div></div>
      <div class="report-stat-item"><div class="report-stat-val">${r.co2}</div><div class="report-stat-label">CO₂e</div></div>
    </div>
    <button class="report-download-btn" id="dl-${r.id}" onclick="downloadReport('${r.title}','${r.period}','${r.e}','${r.w}','${r.co2}','${r.id}')">
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" style="width:14px;height:14px"><path stroke-linecap="round" stroke-linejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3"/></svg>
      Download PDF
    </button>
  </div>`).join('')}
</div>
<div class="card mb-20">
  <div class="card-header"><div class="card-title">Key Milestones — Academic Year 2025/26</div></div>
  <div class="card-body">
    <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:16px">
      ${[
        { val:'−12.8%', label:'Energy vs last year', color:'#16A34A' },
        { val:'2.8t',   label:'CO₂ saved this year', color:'#0369A1' },
        { val:'248',    label:'Challenges completed', color:'#D97706' },
        { val:'1,840',  label:'Eco points awarded',  color:'#7C3AED' }
      ].map(m => `
      <div style="text-align:center;padding:16px;background:var(--surface-2);border-radius:10px;border:1px solid var(--border-light)">
        <div style="font-size:26px;font-weight:800;color:${m.color};letter-spacing:-1px">${m.val}</div>
        <div style="font-size:11.5px;color:var(--text-muted);margin-top:4px;font-weight:500">${m.label}</div>
      </div>`).join('')}
    </div>
  </div>
</div>
<div class="card">
  <div class="card-header"><div class="card-title">School Sustainability Badges</div><div class="card-subtitle">Earned through verified milestones</div></div>
  <div class="card-body">
    <div class="badges-grid">
      ${badges.map(b => `<div class="badge-item ${b.earned?'earned':'locked'}"><span class="badge-emoji">${b.e}</span><span class="badge-name">${b.n}</span></div>`).join('')}
    </div>
  </div>
</div>`;
}

function downloadReport(title, period, energy, water, co2, id) {
  const btn = $(`#dl-${id}`);
  if (btn) btn.innerHTML = '<span class="spinner"></span> Generating…';

  setTimeout(() => {
    const html = `<!DOCTYPE html>
<html><head><meta charset="UTF-8"><title>${title} — EcoTrack BIST</title>
<style>
  body{font-family:sans-serif;max-width:800px;margin:40px auto;color:#111;padding:0 24px}
  h1{color:#1A7A4A;font-size:26px;margin-bottom:4px} .sub{color:#6B7280;font-size:14px;margin-bottom:32px}
  .grid{display:grid;grid-template-columns:repeat(3,1fr);gap:16px;margin:24px 0}
  .stat{text-align:center;padding:20px;border:1px solid #E5E7EB;border-radius:12px}
  .val{font-size:28px;font-weight:800;color:#1A7A4A} .lbl{font-size:12px;color:#6B7280;margin-top:4px}
  .section{margin:32px 0} h2{font-size:18px;color:#1A7A4A;border-bottom:2px solid #D1FAE5;padding-bottom:8px}
  table{width:100%;border-collapse:collapse;margin-top:12px} th,td{text-align:left;padding:10px;border-bottom:1px solid #F3F4F6;font-size:13px}
  th{font-weight:700;color:#6B7280;font-size:11px;text-transform:uppercase;letter-spacing:0.5px}
  .footer{margin-top:40px;padding-top:20px;border-top:1px solid #E5E7EB;font-size:12px;color:#9CA3AF;text-align:center}
  @media print{body{margin:20px}}
</style></head>
<body>
  <h1>EcoTrack BIST — ${title}</h1>
  <div class="sub">Bromsgrove International School Thailand · ${period}<br>55 Mu9 55/1 Soi Suwinthawong, Saen Saep, Min Buri, Bangkok 10510</div>
  <div class="grid">
    <div class="stat"><div class="val">${energy} kWh</div><div class="lbl">Electricity Consumed</div></div>
    <div class="stat"><div class="val">${water}</div><div class="lbl">Water Usage</div></div>
    <div class="stat"><div class="val">${co2}</div><div class="lbl">CO₂ Equivalent</div></div>
  </div>
  <div class="section">
    <h2>House Performance</h2>
    <table>
      <thead><tr><th>Rank</th><th>House</th><th>Eco Points</th><th>Challenges Completed</th></tr></thead>
      <tbody>
        <tr><td>1</td><td>Taylor House</td><td>3,840</td><td>42</td></tr>
        <tr><td>2</td><td>Walter House</td><td>3,290</td><td>35</td></tr>
        <tr><td>3</td><td>Edward House</td><td>3,100</td><td>31</td></tr>
      </tbody>
    </table>
  </div>
  <div class="section">
    <h2>Sustainability Highlights</h2>
    <table>
      <thead><tr><th>Metric</th><th>Value</th><th>vs. Previous Period</th></tr></thead>
      <tbody>
        <tr><td>Energy Intensity</td><td>12.4 kWh/student/day</td><td>−6.4%</td></tr>
        <tr><td>Solar Generation</td><td>2,640 kWh</td><td>+12.0%</td></tr>
        <tr><td>Water per Student</td><td>0.56 m³/student</td><td>−4.1%</td></tr>
        <tr><td>Eco Score</td><td>73/100 (B+)</td><td>+5 pts</td></tr>
      </tbody>
    </table>
  </div>
  <div class="footer">Generated by EcoTrack BIST v2.0 · Built by BuBu &amp; Shokun · ${new Date().toLocaleDateString('en-GB', { day:'numeric', month:'long', year:'numeric' })}</div>
</body></html>`;

    const blob = new Blob([html], { type: 'text/html' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href = url; a.download = `BIST-EcoTrack-${id}.html`; a.click();
    URL.revokeObjectURL(url);
    if (btn) btn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" style="width:14px;height:14px"><path stroke-linecap="round" stroke-linejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3"/></svg> Download PDF`;
    showToast('Report downloaded!', `${title} saved to your downloads`, 'success', '📥');
  }, 900);
}

// ─── Settings ─────────────────────────────────
function renderSettings() {
  const s = state.settings;
  $('#view-settings').innerHTML = `
<div class="section-heading">Settings</div>
<div class="section-sub">Personalise your EcoTrack experience — all changes are saved automatically</div>
<div style="display:flex;flex-direction:column;gap:20px;max-width:700px">

  <div class="settings-section">
    <div class="settings-section-header">
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z"/></svg>
      <div><div class="settings-section-title">Profile</div><div class="settings-row-desc">Your personal information and house affiliation</div></div>
    </div>
    <div class="settings-row">
      <div class="settings-row-label"><div class="settings-row-name">Display Name</div><div class="settings-row-desc">Shown on the leaderboard and throughout the app</div></div>
      <input class="settings-input" id="s-name" value="${s.name}" oninput="autoSaveSetting('name', this.value); updateSidebarUser()">
    </div>
    <div class="settings-row">
      <div class="settings-row-label"><div class="settings-row-name">House</div><div class="settings-row-desc">Your assigned Bromsgrove house</div></div>
      <select class="settings-select" id="s-house" onchange="autoSaveSetting('house', this.value); updateSidebarUser()">
        <option ${s.house==='Taylor'?'selected':''}>Taylor</option>
        <option ${s.house==='Walter'?'selected':''}>Walter</option>
        <option ${s.house==='Edward'?'selected':''}>Edward</option>
      </select>
    </div>
    <div class="settings-row">
      <div class="settings-row-label"><div class="settings-row-name">Year Group</div></div>
      <select class="settings-select" id="s-year" onchange="autoSaveSetting('yearGroup', this.value)">
        ${['Year 7','Year 8','Year 9','Year 10','Year 11','Year 12','Year 13','Staff'].map(y => `<option ${s.yearGroup===y?'selected':''}>${y}</option>`).join('')}
      </select>
    </div>
  </div>

  <div class="settings-section">
    <div class="settings-section-header">
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M4.098 19.902a3.75 3.75 0 005.304 0l6.401-6.402M6.75 21A3.75 3.75 0 013 17.25V4.125C3 3.504 3.504 3 4.125 3h5.25c.621 0 1.125.504 1.125 1.125v4.072M6.75 21a3.75 3.75 0 003.75-3.75V8.197M6.75 21h13.125c.621 0 1.125-.504 1.125-1.125v-5.25c0-.621-.504-1.125-1.125-1.125h-4.072M10.5 8.197l2.88-2.88c.438-.439 1.15-.439 1.59 0l3.712 3.713c.44.44.44 1.152 0 1.59l-2.879 2.88M6.75 17.25h.008v.008H6.75v-.008z"/></svg>
      <div><div class="settings-section-title">Appearance</div><div class="settings-row-desc">Theme and display preferences</div></div>
    </div>
    <div class="settings-row">
      <div class="settings-row-label"><div class="settings-row-name">Dark Mode</div><div class="settings-row-desc">Switch to a dark colour scheme</div></div>
      <label class="toggle-wrap">
        <input type="checkbox" id="s-dark" ${s.darkMode?'checked':''} onchange="toggleDarkMode(this.checked)">
        <div class="toggle-track"></div>
        <div class="toggle-thumb"></div>
      </label>
    </div>
  </div>

  <div class="settings-section">
    <div class="settings-section-header">
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0"/></svg>
      <div><div class="settings-section-title">Notifications</div><div class="settings-row-desc">Control alerts and toast messages</div></div>
    </div>
    <div class="settings-row">
      <div class="settings-row-label"><div class="settings-row-name">Enable Notifications</div><div class="settings-row-desc">Show alerts for challenges, energy updates, and house activity</div></div>
      <label class="toggle-wrap">
        <input type="checkbox" id="s-notif" ${s.notifications?'checked':''} onchange="autoSaveSetting('notifications', this.checked)">
        <div class="toggle-track"></div>
        <div class="toggle-thumb"></div>
      </label>
    </div>
  </div>

  <div class="settings-section">
    <div class="settings-section-header">
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M15.75 15.75V18m-7.5-6.75h.008v.008H8.25v-.008zm0 2.25h.008v.008H8.25v-.008zm0 2.25h.008v.008H8.25v-.008zm0 2.25h.008v.008H8.25V18zm2.498-6.75h.008v.008h-.008v-.008zm0 2.25h.008v.008h-.008v-.008zm0 2.25h.008v.008h-.008v-.008zm0 2.25h.008v.008h-.008V18zm2.504-6.75h.008v.008h-.008v-.008zm0 2.25h.008v.008h-.008v-.008zm0 2.25h.008v.008h-.008v-.008zm0 2.25h.008v.008h-.008V18zM8.25 6h7.5v2.25h-7.5V6zM12 2.25c-1.892 0-3.758.11-5.593.322C5.307 2.7 4.5 3.616 4.5 4.983V19.5a2.25 2.25 0 002.25 2.25h10.5a2.25 2.25 0 002.25-2.25V4.983c0-1.367-.807-2.283-1.907-2.41A41.146 41.146 0 0012 2.25z"/></svg>
      <div><div class="settings-section-title">Calculator</div><div class="settings-row-desc">Carbon calculator preferences</div></div>
    </div>
    <div class="settings-row">
      <div class="settings-row-label"><div class="settings-row-name">Distance Unit</div><div class="settings-row-desc">Unit used for commute distance in the calculator</div></div>
      <select class="settings-select" id="s-unit" onchange="autoSaveSetting('distanceUnit', this.value)">
        <option value="km" ${s.distanceUnit==='km'?'selected':''}>Kilometres (km)</option>
        <option value="miles" ${s.distanceUnit==='miles'?'selected':''}>Miles</option>
      </select>
    </div>
  </div>

  <div class="settings-section danger-zone">
    <div class="settings-section-header">
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" style="color:#DC2626"><path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"/></svg>
      <div><div class="settings-section-title" style="color:#DC2626">Danger Zone</div><div class="settings-row-desc">Irreversible actions — proceed with caution</div></div>
    </div>
    <div class="settings-row">
      <div class="settings-row-label"><div class="settings-row-name">Sign Out</div><div class="settings-row-desc">Sign out of your EcoTrack account on this device</div></div>
      <button class="auth-signout-btn" onclick="dbSignOut()">Sign Out</button>
    </div>
    <div class="settings-row">
      <div class="settings-row-label"><div class="settings-row-name">Reset All Data</div><div class="settings-row-desc">Clears all challenge progress, settings, and local data</div></div>
      <button class="btn-danger" onclick="resetAllData()">Reset Everything</button>
    </div>
  </div>

</div>`;
}

function autoSaveSetting(key, value) {
  state.settings[key] = value;
  persistSettings(state.settings);
  if (state.currentUserId && ['name', 'house', 'yearGroup'].includes(key)) {
    const dbKey = key === 'yearGroup' ? 'year_group' : key;
    dbUpdateProfile(state.currentUserId, { [dbKey]: value });
  }
}

function toggleDarkMode(dark) {
  state.settings.darkMode = dark;
  persistSettings(state.settings);
  applyDarkMode(dark);
  showToast(dark ? 'Dark mode on' : 'Light mode on', 'Theme updated', 'info', dark ? '🌙' : '☀️');
}

function updateSidebarUser() {
  const name  = state.settings.name || 'BIST Student';
  const house = state.settings.house || 'Taylor';
  const initials = name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
  const el = $('#sidebar-user-name');
  const hl = $('#sidebar-user-house');
  const av = $('#sidebar-user-avatar');
  if (el) el.textContent = name;
  if (hl) hl.textContent = `${house} House`;
  if (av) av.textContent = initials || 'B';
}

function resetAllData() {
  if (!confirm('This will clear all your challenge progress and settings. Are you sure?')) return;
  localStorage.removeItem(SETTINGS_KEY);
  localStorage.removeItem(CHALLENGES_KEY);
  state.settings = { ...defaultSettings };
  state.challengeState = { joined: new Set([1,5]), completed: new Set([4]), progress: {1:60, 5:85}, lastLog: {} };
  applyDarkMode(false);
  updateSidebarUser();
  renderSettings();
  showToast('Data reset', 'All settings cleared', 'warning', '⚠️');
}

// ─── Help ─────────────────────────────────────
function renderHelp() {
  const faqs = [
    { q:'What is EcoTrack BIST?', a:'EcoTrack BIST is Bromsgrove International School Thailand\'s sustainability platform. It helps students, teachers, and staff track the school\'s energy use, calculate personal carbon footprints, join eco challenges, and compete for house points.' },
    { q:'How do I join an Eco Challenge?', a:'Go to <strong>Eco Challenges</strong> in the sidebar. Browse available challenges and click <strong>"Join Challenge"</strong>. Once joined, you can log daily actions using the "+ Log today\'s action" button to track your progress. Mark it complete when you\'re done to earn house points.' },
    { q:'How are eco points calculated?', a:'Points are awarded for completing challenges (80–200 pts each), submitting green initiative ideas (+50), reducing classroom energy (+30/day), going meatless (+20), and using a reusable bottle (+10). Completed challenges automatically add points to your house total.' },
    { q:'How does the Carbon Calculator work?', a:'The calculator uses your commute method, distance, diet, and home energy habits to estimate your annual CO₂ footprint in tonnes CO₂e (carbon dioxide equivalent). It then compares you to the Thai average (3.5t), global average (4.7t), and the 1.5°C climate target (1.2t).' },
    { q:'What are the three houses at BIST?', a:'<strong>Taylor House</strong>, <strong>Walter House</strong>, and <strong>Edward House</strong>. You can set your house in Settings. Houses compete for eco points each term — Taylor House currently leads the March 2026 standings!' },
    { q:'Can I download sustainability reports?', a:'Yes! Go to the <strong>Reports</strong> page and click "Download PDF" on any report. This generates a formatted HTML report file saved to your downloads folder, which you can open in any browser and print as a PDF.' },
    { q:'How do I switch to dark mode?', a:'Go to <strong>Settings</strong> and toggle the "Dark Mode" switch under Appearance. Your preference is saved automatically and will persist when you reload the app.' },
    { q:'Is my data saved?', a:'Yes — all your settings, challenge progress, and preferences are saved to your browser\'s local storage. This means your data stays on this device. Clearing browser data will reset the app.' }
  ];

  $('#view-help').innerHTML = `
<div class="help-layout">
  <div>
    <div class="section-heading">Help & Support</div>
    <div class="section-sub">Frequently asked questions about EcoTrack BIST</div>
    <div class="help-search-wrap">
      <svg class="help-search-icon" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z"/></svg>
      <input class="help-search" placeholder="Search questions…" oninput="filterHelp(this.value)" id="help-search">
    </div>
    <div id="faq-container">
      ${faqs.map((f, i) => `
      <div class="help-item faq-item" data-q="${f.q.toLowerCase()}">
        <div class="acc-header" onclick="toggleAccordion('acc-${i}')">
          <span class="acc-question">${f.q}</span>
          <svg class="acc-arrow" id="arrow-${i}" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5"/></svg>
        </div>
        <div class="acc-content" id="acc-${i}">
          <p class="acc-answer">${f.a}</p>
        </div>
      </div>`).join('')}
    </div>
  </div>

  <div style="display:flex;flex-direction:column;gap:16px">
    <div class="contact-card">
      <div class="card-title" style="margin-bottom:12px">📍 Contact & Location</div>
      <div class="contact-row"><span class="contact-row-icon">🏫</span><span class="contact-row-label">School</span><span class="contact-row-val">Bromsgrove International School Thailand</span></div>
      <div class="contact-row"><span class="contact-row-icon">📮</span><span class="contact-row-label">Address</span><span class="contact-row-val">55 Mu9 55/1 Soi Suwinthawong<br>Saen Saep, Min Buri<br>Bangkok 10510</span></div>
      <div class="contact-row"><span class="contact-row-icon">🌐</span><span class="contact-row-label">App</span><span class="contact-row-val">EcoTrack BIST v2.0</span></div>
      <div class="contact-row"><span class="contact-row-icon">💌</span><span class="contact-row-label">Built by</span><span class="contact-row-val">BuBu &amp; Shokun<br>Taylor House</span></div>
    </div>

    <div class="card">
      <div class="card-header"><div class="card-title">Quick Navigation</div></div>
      <div class="card-body">
        <div class="quick-links">
          ${[
            ['dashboard',   '📊', 'Go to Dashboard'],
            ['energy',      '⚡', 'Energy Monitor'],
            ['calculator',  '🌍', 'Carbon Calculator'],
            ['challenges',  '🏆', 'Eco Challenges'],
            ['leaderboard', '🥇', 'Leaderboard'],
            ['settings',    '⚙️', 'Settings']
          ].map(([v, e, l]) => `
          <button class="quick-link-btn" onclick="navigate('${v}')">
            <span>${e}</span> ${l}
          </button>`).join('')}
        </div>
      </div>
    </div>
  </div>
</div>`;
}

function toggleAccordion(id) {
  const content = document.getElementById(id);
  const idx = id.split('-')[1];
  const arrow = document.getElementById(`arrow-${idx}`);
  const isOpen = content.classList.contains('open');
  $$('.acc-content').forEach(el => el.classList.remove('open'));
  $$('.acc-arrow').forEach(el => el.classList.remove('open'));
  if (!isOpen) {
    content.classList.add('open');
    arrow?.classList.add('open');
  }
}

function filterHelp(query) {
  const q = query.toLowerCase().trim();
  $$('.faq-item').forEach(el => {
    const text = el.dataset.q + ' ' + el.querySelector('.acc-answer').textContent.toLowerCase();
    el.style.display = (!q || text.includes(q)) ? '' : 'none';
  });
}

// ─── Info / How-to ────────────────────────────
function renderInfo() {
  $('#view-info').innerHTML = `
<div class="info-hero">
  <img src="assets/logo.png" alt="BIST" class="info-hero-logo"
       onerror="this.style.display='none';document.getElementById('info-logo-fb').style.display='flex'">
  <div class="info-hero-logo-fallback" id="info-logo-fb" style="display:none">🌿</div>
  <div class="info-hero-text">
    <div class="info-hero-title">Welcome to EcoTrack BIST</div>
    <div class="info-hero-desc">Your school's sustainability platform — track energy, calculate your carbon footprint, compete in eco challenges, and help Bromsgrove International School Thailand on its journey to a greener future.</div>
  </div>
</div>

<div class="section-heading" style="margin-bottom:8px">Getting Started</div>
<div class="section-sub">Follow these steps to make the most of EcoTrack</div>
<div class="info-steps-grid mb-24">
  ${[
    { n:1, title:'Set up your profile', desc:'Go to <strong>Settings</strong> and enter your name, select your house (Taylor, Walter, or Edward), and choose your year group. Your info appears on the leaderboard.' },
    { n:2, title:'Check the Dashboard', desc:'The <strong>Dashboard</strong> is your real-time overview — energy today, CO₂ saved, solar generation, and the school\'s sustainability goals all in one place.' },
    { n:3, title:'Calculate your footprint', desc:'Visit <strong>Carbon Calculator</strong> and fill in how you get to school, your diet, and home energy use. You\'ll see your annual CO₂e and how it compares to Thai and global averages.' },
    { n:4, title:'Join Eco Challenges', desc:'Head to <strong>Eco Challenges</strong>, pick a challenge that fits you, and click Join. Log your daily actions to build up progress. Completing challenges earns points for your house.' },
    { n:5, title:'Watch the Leaderboard', desc:'The <strong>Leaderboard</strong> shows house standings and top individual students. Complete challenges to move your house up the rankings — currently Taylor House leads!' },
    { n:6, title:'Download Reports', desc:'Go to <strong>Reports</strong> to view monthly and quarterly sustainability data. Click "Download PDF" to save a formatted report file you can share or print.' }
  ].map(s => `
  <div class="info-step">
    <div class="info-step-num">${s.n}</div>
    <div class="info-step-body">
      <div class="info-step-title">${s.title}</div>
      <div class="info-step-desc">${s.desc}</div>
    </div>
  </div>`).join('')}
</div>

<div class="section-heading" style="margin-bottom:8px">All Features</div>
<div class="section-sub">Everything EcoTrack BIST can do</div>
<div class="info-feature-grid">
  ${[
    { e:'📊', n:'Dashboard', d:'Live energy, CO₂, solar & eco score metrics with weekly trend charts' },
    { e:'⚡', n:'Energy Monitor', d:'Monthly electricity & water charts, building breakdown, energy tips' },
    { e:'🌍', n:'Carbon Calculator', d:'Personal CO₂ footprint using real emission factors for Thailand' },
    { e:'🏆', n:'Eco Challenges', d:'Join, log progress daily, and complete challenges to earn house points' },
    { e:'🥇', n:'Leaderboard', d:'Taylor, Walter and Edward house rankings with individual top scorers' },
    { e:'📋', n:'Reports', d:'Download formatted sustainability reports for any period' },
    { e:'ℹ️', n:'How to Use', d:'This guide — a full walkthrough of every feature in the app' },
    { e:'❤️', n:'Credits', d:'Meet the team who built EcoTrack BIST' },
    { e:'⚙️', n:'Settings', d:'Dark mode, profile, house, units — all saved automatically' },
    { e:'❓', n:'Help', d:'FAQ and contact information for Bromsgrove International School Thailand' },
    { e:'🔔', n:'Notifications', d:'Alerts for solar peaks, house rankings, and challenge updates' },
    { e:'🌙', n:'Dark Mode', d:'Full dark theme — toggle in Settings or tap the moon icon' }
  ].map(f => `
  <div class="info-feature">
    <div class="info-feature-icon">${f.e}</div>
    <div class="info-feature-name">${f.n}</div>
    <div class="info-feature-desc">${f.d}</div>
  </div>`).join('')}
</div>`;
}

// ─── Credits ──────────────────────────────────
function renderCredits() {
  $('#view-credits').innerHTML = `
<div class="credits-hero">
  <img src="assets/logo.png" alt="BIST" class="credits-school-logo"
       onerror="this.style.display='none';document.getElementById('cl-fb').style.display='flex'">
  <div class="credits-school-logo-fallback" id="cl-fb" style="display:none">B</div>
  <div class="credits-school-name">Bromsgrove International School</div>
  <div class="credits-school-sub">Thailand · Min Buri, Bangkok</div>
  <div class="credits-motto">Deo Regi Vicino — For God, King, and Neighbour</div>
</div>

<div class="section-heading" style="margin-bottom:20px">The Developers</div>
<div class="credits-developers">
  <div class="credits-card bubu">
    <div class="credits-avatar" style="background:linear-gradient(135deg,#1D4ED8,#60A5FA)">BB</div>
    <div class="credits-dev-name">BuBu</div>
    <div class="credits-dev-role">Lead Developer & Designer</div>
    <div class="credits-house-badge">🔵 Taylor House</div>
    <div class="credits-quote">"Making BIST greener, one line of code at a time. If the planet wins, we all win."</div>
  </div>
  <div class="credits-card shokun">
    <div class="credits-avatar" style="background:linear-gradient(135deg,#1D4ED8,#93C5FD)">SK</div>
    <div class="credits-dev-name">Shokun</div>
    <div class="credits-dev-role">Developer & Data Analyst</div>
    <div class="credits-house-badge">🔵 Taylor House</div>
    <div class="credits-quote">"Data is the foundation of every good decision. Let's use it to protect our planet."</div>
  </div>
</div>

<div class="card mb-20">
  <div class="card-header"><div class="card-title">About This Project</div></div>
  <div class="card-body" style="font-size:13.5px;color:var(--text-secondary);line-height:1.75">
    <p style="margin-bottom:12px">EcoTrack BIST was created as a practical sustainability tool for Bromsgrove International School Thailand. The platform monitors real campus energy data, empowers students to understand and reduce their personal carbon footprints, and gamifies eco-action through the school's house system.</p>
    <p style="margin-bottom:12px">The project was conceived and built by <strong style="color:var(--text)">BuBu</strong> and <strong style="color:var(--text)">Shokun</strong> — two Taylor House students passionate about climate action and technology. Every feature was designed with BIST's specific context in mind: Bangkok's heat, Thailand's energy mix, the school's solar panels, and the house competition system.</p>
    <p>Located at <strong style="color:var(--text)">55 Mu9 55/1 Soi Suwinthawong, Saen Saep, Min Buri, Bangkok 10510</strong>, BIST is uniquely positioned in tropical Thailand to lead on solar energy and climate education — and this platform is our contribution to that mission.</p>
  </div>
</div>

<div class="section-heading" style="font-size:15px;margin-bottom:16px">Built With</div>
<div class="credits-tech-grid">
  ${[
    { e:'🌐', n:'HTML5', d:'Structure & semantics' },
    { e:'🎨', n:'CSS3', d:'Design system & animations' },
    { e:'⚡', n:'Vanilla JS', d:'All interactivity & logic' },
    { e:'📊', n:'Chart.js', d:'Data visualisation' }
  ].map(t => `
  <div class="tech-card">
    <div class="tech-icon">${t.e}</div>
    <div class="tech-name">${t.n}</div>
    <div class="tech-desc">${t.d}</div>
  </div>`).join('')}
</div>

<div style="text-align:center;padding:32px;color:var(--text-muted);font-size:13px;margin-top:8px">
  Made with ❤️ for the planet · EcoTrack BIST v2.0 · © 2026 BuBu &amp; Shokun
</div>`;
}

// ─── Radio Groups ─────────────────────────────
document.addEventListener('click', e => {
  const opt = e.target.closest('.radio-option');
  if (!opt) return;
  const grp = opt.closest('.radio-group');
  if (!grp) return;
  grp.querySelectorAll('.radio-option').forEach(o => o.classList.remove('selected'));
  opt.classList.add('selected');
});

// ─── Render all & Boot ────────────────────────
function renderAll() {
  renderDashboard();
  renderEnergy();
  renderCalculator();
  renderChallenges();
  renderLeaderboard();
  renderReports();
  renderSettings();
  renderHelp();
  renderInfo();
  renderCredits();
}

document.addEventListener('DOMContentLoaded', () => {
  // Apply saved settings immediately
  applyDarkMode(state.settings.darkMode);
  updateSidebarUser();

  // Render all views
  renderAll();

  // Wire up nav
  $$('.nav-item').forEach(el => el.addEventListener('click', () => navigate(el.dataset.view)));

  // Activate dashboard
  navigate('dashboard');

  // Live clock
  updateLiveClock();
  setInterval(updateLiveClock, 1000);

  // Notification badge
  updateNotifBadge();

  // Welcome toast
  setTimeout(() => {
    const name = state.settings.name !== 'BIST Student' ? state.settings.name : 'BIST';
    showToast(`Welcome back, ${name}!`, `${state.settings.house} House · EcoTrack BIST`, 'success', '🌿');
  }, 700);

  // Initialise Supabase auth (shows login modal if not signed in)
  if (typeof initAuth === 'function') initAuth();
});
