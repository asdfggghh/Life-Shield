/* ============================================================
   SANJEEVANI SMART-SHIELD — SHARED APP LOGIC
   ============================================================ */

'use strict';

// ── Language System ──────────────────────────────────────────
const TRANSLATIONS = {
  en: {
    'nav.home':        'Home',
    'nav.register':    'Register',
    'nav.dashboard':   'Dashboard',
    'nav.hotspot':     'Hotspot Map',
    'sos.button':      '🚨 SEND SOS',
    'sos.sending':     'Sending Alert...',
    'sos.sent':        '✅ SOS Sent! Help is on the way.',
    'sos.offline':     '📡 Offline — SOS queued for when network returns.',
    'voice.greeting':  'Please stay calm. Emergency contacts have been notified. Keep the patient still and comfortable.',
    'hospital.finding':'Finding nearest trauma center...',
    'hospital.found':  'Nearest hospital found!',
    'scan.title':      'Emergency Medical ID',
    'scan.subtitle':   'This person has been in an accident. Please help them.',
    'register.title':  'Create Your SmartShield Profile',
    'register.save':   'Save & Generate QR Code',
  },
  hi: {
    'nav.home':        'होम',
    'nav.register':    'रजिस्टर',
    'nav.dashboard':   'डैशबोर्ड',
    'nav.hotspot':     'हॉटस्पॉट मैप',
    'sos.button':      '🚨 SOS भेजें',
    'sos.sending':     'अलर्ट भेजा जा रहा है...',
    'sos.sent':        '✅ SOS भेजा गया! मदद आ रही है।',
    'sos.offline':     '📡 ऑफलाइन — नेटवर्क आने पर SOS भेजा जाएगा।',
    'voice.greeting':  'घबराइए मत। इमरजेंसी कॉन्टैक्ट को सूचित कर दिया गया है। मरीज को शांत रखें।',
    'hospital.finding':'नजदीकी अस्पताल खोजा जा रहा है...',
    'hospital.found':  'नजदीकी अस्पताल मिल गया!',
    'scan.title':      'आपातकालीन चिकित्सा पहचान',
    'scan.subtitle':   'यह व्यक्ति दुर्घटना में है। कृपया इनकी मदद करें।',
    'register.title':  'अपनी SmartShield प्रोफ़ाइल बनाएं',
    'register.save':   'सेव करें और QR कोड बनाएं',
  }
};

class LanguageManager {
  constructor() {
    this.current = localStorage.getItem('snj_lang') || 'en';
    this.listeners = [];
  }

  t(key) {
    return TRANSLATIONS[this.current][key] || key;
  }

  toggle() {
    this.current = this.current === 'en' ? 'hi' : 'en';
    localStorage.setItem('snj_lang', this.current);
    this.applyTranslations();
    this.listeners.forEach(fn => fn(this.current));
  }

  set(lang) {
    this.current = lang;
    localStorage.setItem('snj_lang', lang);
    this.applyTranslations();
  }

  applyTranslations() {
    document.querySelectorAll('[data-i18n]').forEach(el => {
      const key = el.dataset.i18n;
      el.textContent = this.t(key);
    });
    document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
      el.placeholder = this.t(el.dataset.i18nPlaceholder);
    });
    // Update lang toggles
    document.querySelectorAll('.lang-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.lang === this.current);
    });
    document.documentElement.lang = this.current === 'hi' ? 'hi-IN' : 'en-IN';
  }

  onChange(fn) { this.listeners.push(fn); }
}

// ── Toast Notifications ──────────────────────────────────────
class Toast {
  static container = null;

  static init() {
    if (!this.container) {
      this.container = document.createElement('div');
      this.container.className = 'toast-container';
      document.body.appendChild(this.container);
    }
  }

  static show(message, type = 'info', duration = 4000) {
    this.init();
    const icons = { success: '✅', error: '❌', info: 'ℹ️', warning: '⚠️' };
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `<span style="font-size:1.2rem">${icons[type]}</span><span style="flex:1;font-size:0.9rem">${message}</span>`;
    this.container.appendChild(toast);

    // Auto-remove
    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateX(120%)';
      toast.style.transition = 'all 0.3s ease';
      setTimeout(() => toast.remove(), 300);
    }, duration);
  }

  static success(msg, d) { this.show(msg, 'success', d); }
  static error(msg, d)   { this.show(msg, 'error', d); }
  static info(msg, d)    { this.show(msg, 'info', d); }
  static warning(msg, d) { this.show(msg, 'warning', d); }
}

// ── GPS Location ─────────────────────────────────────────────
class LocationManager {
  static get(options = {}) {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocation not supported'));
        return;
      }
      const opts = {
        enableHighAccuracy: true,
        timeout: 8000,
        maximumAge: 30000,
        ...options
      };
      navigator.geolocation.getCurrentPosition(
        (pos) => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude, accuracy: pos.coords.accuracy }),
        (err) => reject(err),
        opts
      );
    });
  }

  static async getMapsLink(lat, lng) {
    return `https://maps.google.com/?q=${lat},${lng}`;
  }

  static async getNearestHospitals(lat, lng, apiKey) {
    const url = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${lat},${lng}&radius=5000&type=hospital&key=${apiKey}`;
    try {
      const res = await fetch(url);
      const data = await res.json();
      return data.results || [];
    } catch {
      // Return mock data if API unavailable
      return MOCK_HOSPITALS(lat, lng);
    }
  }
}

// Mock hospitals for demo/offline mode
function MOCK_HOSPITALS(lat, lng) {
  return [
    { name: 'Regency Hospital', vicinity: '2.1 km away', rating: 4.5, geometry: { location: { lat: lat + 0.01, lng: lng + 0.015 } } },
    { name: 'GSVM Medical College', vicinity: '3.4 km away', rating: 4.2, geometry: { location: { lat: lat - 0.02, lng: lng + 0.01 } } },
    { name: 'Ursula Hospital', vicinity: '4.8 km away', rating: 4.0, geometry: { location: { lat: lat + 0.025, lng: lng - 0.02 } } },
  ];
}

// ── SOS Manager ──────────────────────────────────────────────
class SOSManager {
  static async trigger(profileData, location) {
    const payload = {
      timestamp: new Date().toISOString(),
      profile: profileData,
      location: location,
      mapsLink: location ? await LocationManager.getMapsLink(location.lat, location.lng) : null,
    };

    // Try to send — queue if offline
    if (!navigator.onLine) {
      this.queue(payload);
      return { status: 'queued' };
    }

    try {
      // In production: POST to /api/sos (Firebase Cloud Function → Fast2SMS)
      // For demo — simulate
      await new Promise(r => setTimeout(r, 1500));
      console.log('[SOS] Alert sent:', payload);
      return { status: 'sent' };
    } catch (e) {
      this.queue(payload);
      return { status: 'queued' };
    }
  }

  static queue(payload) {
    const queue = JSON.parse(localStorage.getItem('snj_sos_queue') || '[]');
    queue.push({ ...payload, id: Date.now() });
    localStorage.setItem('snj_sos_queue', JSON.stringify(queue));

    // Register background sync
    if ('serviceWorker' in navigator && 'SyncManager' in window) {
      navigator.serviceWorker.ready.then(sw => sw.sync.register('sos-sync'));
    }
  }
}

// ── Voice Assistant ───────────────────────────────────────────
class VoiceAssistant {
  static synth = window.speechSynthesis;

  static speak(text, options = {}) {
    if (!this.synth) return;
    this.synth.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = options.lang || (lang.current === 'hi' ? 'hi-IN' : 'en-IN');
    utterance.rate = options.rate || 0.9;
    utterance.pitch = options.pitch || 1.1;
    utterance.volume = options.volume || 1;
    this.synth.speak(utterance);
  }

  static stop() { this.synth?.cancel(); }

  static guideFirstAid(profile) {
    const messages = {
      en: [
        `Please stay calm. My name is ${profile?.name || 'the patient'}. I have been in an accident.`,
        `My blood group is ${profile?.blood_group || 'unknown'}. My emergency contact is ${profile?.emergency_contact || 'unknown'}.`,
        profile?.allergies ? `Important: I am allergic to ${profile.allergies}. Please inform the doctor.` : '',
        profile?.conditions ? `I have a medical condition: ${profile.conditions}.` : '',
        'Please call an ambulance to 108 immediately. Do not move me unless I am in danger.',
      ].filter(Boolean).join(' '),
      hi: [
        `कृपया घबराइए मत। मेरा नाम ${profile?.name || 'मरीज'} है। मैं दुर्घटना में घायल हूं।`,
        `मेरा ब्लड ग्रुप ${profile?.blood_group || 'अज्ञात'} है। मेरा इमरजेंसी कॉन्टैक्ट ${profile?.emergency_contact_name || ''} है।`,
        profile?.allergies ? `महत्वपूर्ण: मुझे ${profile.allergies} से एलर्जी है। डॉक्टर को बताएं।` : '',
        'कृपया तुरंत 108 पर एम्बुलेंस बुलाएं। जब तक खतरा न हो, मुझे हिलाएं नहीं।',
      ].filter(Boolean).join(' ')
    };

    const msg = messages[lang.current] || messages.en;
    this.speak(msg, { lang: lang.current === 'hi' ? 'hi-IN' : 'en-IN' });
  }
}

// ── QR Code Generator ─────────────────────────────────────────
class QRManager {
  static generate(containerId, data, options = {}) {
    const container = document.getElementById(containerId);
    if (!container) return;

    // Use qrcode.js library (loaded via CDN)
    if (typeof QRCode !== 'undefined') {
      container.innerHTML = '';
      new QRCode(container, {
        text: typeof data === 'string' ? data : JSON.stringify(data),
        width: options.size || 200,
        height: options.size || 200,
        colorDark: options.dark || '#00d4aa',
        colorLight: options.light || '#040810',
        correctLevel: QRCode.CorrectLevel.H,
      });
    } else {
      // Fallback: use Google Charts API
      const encoded = encodeURIComponent(typeof data === 'string' ? data : JSON.stringify(data));
      const size = options.size || 200;
      container.innerHTML = `<img src="https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encoded}&bgcolor=040810&color=00d4aa&format=png" alt="QR Code" style="border-radius:12px;"/>`;
    }
  }

  static dataFromURL(url) {
    const params = new URLSearchParams(new URL(url).search);
    const encoded = params.get('d');
    if (!encoded) return null;
    try {
      return JSON.parse(atob(encoded));
    } catch {
      return null;
    }
  }

  static buildProfileURL(profile) {
    const base = window.location.origin + '/scan.html';
    const encoded = btoa(JSON.stringify(profile));
    return `${base}?d=${encoded}`;
  }
}

// ── Supabase DB Layer ──────────────────────────────────────────
// Reads keys from config.js (loaded before app.js in each HTML page).
// Falls back to localStorage automatically when keys are not set.

function _supabaseReady() {
  return (
    typeof supabase !== 'undefined' &&
    typeof SUPABASE_URL !== 'undefined' &&
    SUPABASE_URL !== 'https://YOUR_PROJECT_ID.supabase.co'
  );
}

let _sbClient = null;
function _sb() {
  if (!_sbClient && _supabaseReady()) {
    _sbClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  }
  return _sbClient;
}

const DB = {

  // ── Profiles ──────────────────────────────────────────────
  async saveProfile(profile) {
    // Always cache locally (offline support)
    const profiles = JSON.parse(localStorage.getItem('snj_profiles') || '[]');
    const idx = profiles.findIndex(p => p.id === profile.id);
    if (idx >= 0) profiles[idx] = profile; else profiles.push(profile);
    localStorage.setItem('snj_profiles', JSON.stringify(profiles));
    localStorage.setItem('snj_current_profile', JSON.stringify(profile));

    // Save to Supabase if configured
    if (_sb()) {
      const { error } = await _sb()
        .from('profiles')
        .upsert(profile, { onConflict: 'id' });
      if (error) console.warn('[Supabase] saveProfile:', error.message);
      else console.log('[Supabase] ✅ Profile saved to cloud:', profile.id);
    } else {
      console.info('[DB] Supabase not configured — using localStorage');
    }
    return profile;
  },

  async getProfile(id) {
    if (_sb()) {
      const { data, error } = await _sb()
        .from('profiles').select('*').eq('id', id).single();
      if (!error && data) return data;
    }
    const profiles = JSON.parse(localStorage.getItem('snj_profiles') || '[]');
    return profiles.find(p => p.id === id) || null;
  },

  async getCurrentProfile() {
    const raw = localStorage.getItem('snj_current_profile');
    if (!raw) return null;
    const local = JSON.parse(raw);
    // Re-fetch latest from cloud if online
    if (_sb() && local?.id) {
      const { data, error } = await _sb()
        .from('profiles').select('*').eq('id', local.id).single();
      if (!error && data) {
        localStorage.setItem('snj_current_profile', JSON.stringify(data));
        return data;
      }
    }
    return local;
  },

  async getAllProfiles() {
    if (_sb()) {
      const { data, error } = await _sb().from('profiles').select('*');
      if (!error && data) return data;
    }
    return JSON.parse(localStorage.getItem('snj_profiles') || '[]');
  },

  // ── Scan Events ───────────────────────────────────────────
  async logScan(lat, lng, profileId, accuracy) {
    const scans = JSON.parse(localStorage.getItem('snj_scans') || '[]');
    scans.push({ lat, lng, profileId, accuracy, timestamp: Date.now() });
    localStorage.setItem('snj_scans', JSON.stringify(scans));

    if (_sb()) {
      const { error } = await _sb().from('scans').insert({
        profile_id: profileId, lat, lng, accuracy,
        scanned_at: new Date().toISOString()
      });
      if (error) console.warn('[Supabase] logScan:', error.message);
      else console.log('[Supabase] ✅ Scan event logged');
    }
  },

  async getScans(profileId) {
    if (_sb()) {
      let query = _sb().from('scans').select('*').order('scanned_at', { ascending: false });
      if (profileId) query = query.eq('profile_id', profileId);
      const { data, error } = await query;
      if (!error && data) {
        return data.map(s => ({
          lat: s.lat, lng: s.lng,
          profileId: s.profile_id,
          timestamp: new Date(s.scanned_at).getTime()
        }));
      }
    }
    return JSON.parse(localStorage.getItem('snj_scans') || '[]');
  },

  // ── SOS Events ────────────────────────────────────────────
  async logSOS(profileId, lat, lng, mapsLink, status = 'sent') {
    if (_sb()) {
      const { error } = await _sb().from('sos_events').insert({
        profile_id: profileId, lat, lng,
        maps_link: mapsLink, status,
        triggered_at: new Date().toISOString()
      });
      if (error) console.warn('[Supabase] logSOS:', error.message);
      else console.log('[Supabase] ✅ SOS event logged');
    }
  },

  // ── All Scans (hotspot map) ───────────────────────────────
  async getAllScans() {
    if (_sb()) {
      const { data, error } = await _sb()
        .from('scans')
        .select('lat, lng, scanned_at, profile_id')
        .order('scanned_at', { ascending: false })
        .limit(1000);
      if (!error && data) return data;
    }
    return JSON.parse(localStorage.getItem('snj_scans') || '[]');
  }
};

// ── PWA Registration ──────────────────────────────────────────
function registerPWA() {
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('/sw.js')
        .then(reg => console.log('[PWA] SW registered:', reg.scope))
        .catch(err => console.warn('[PWA] SW registration failed:', err));
    });
  }
}

// ── Navbar Active Link ─────────────────────────────────────────
function initNavbar() {
  const current = window.location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.nav-links a').forEach(a => {
    const href = a.getAttribute('href');
    if (href === current || (current === '' && href === 'index.html')) {
      a.classList.add('active');
    }
  });

  // Mobile hamburger
  const toggle = document.getElementById('nav-toggle');
  const navLinks = document.getElementById('nav-links');
  if (toggle && navLinks) {
    toggle.addEventListener('click', () => navLinks.classList.toggle('open'));
  }
}

// ── Language Toggle Buttons ───────────────────────────────────
function initLangToggle() {
  document.querySelectorAll('.lang-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      lang.set(btn.dataset.lang);
    });
  });
  lang.applyTranslations();
}

// ── Intersection Observer for Animations ─────────────────────
function initScrollAnimations() {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.style.opacity = '1';
        entry.target.style.transform = 'translateY(0)';
      }
    });
  }, { threshold: 0.1 });

  document.querySelectorAll('.animate-on-scroll').forEach(el => {
    el.style.opacity = '0';
    el.style.transform = 'translateY(30px)';
    el.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
    observer.observe(el);
  });
}

// ── Global Init ───────────────────────────────────────────────
const lang = new LanguageManager();

document.addEventListener('DOMContentLoaded', () => {
  registerPWA();
  initNavbar();
  initLangToggle();
  initScrollAnimations();
  Toast.init();

  // Online / offline UI
  window.addEventListener('offline', () => Toast.warning('You are offline. Core features still work.'));
  window.addEventListener('online',  () => Toast.success('Connection restored!'));
});

// Export for module usage
if (typeof module !== 'undefined') {
  module.exports = { lang, Toast, LocationManager, SOSManager, VoiceAssistant, QRManager, DB };
}
