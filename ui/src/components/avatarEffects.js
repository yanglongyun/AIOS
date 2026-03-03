import { ref } from 'vue';
import { on } from '../ws.js';

const request = async (url, options = {}) => {
  const res = await fetch(url, options);
  return res.json().catch(() => ({}));
};

export const useAvatarEffects = () => {
  const avatarPanelOpen = ref(false);
  const avatarEmoji = ref('🙂');
  const avatarBurst = ref('');
  const avatarName = ref('AIOS');
  const enableAvatarEmoji = ref(true);
  const enableAvatarSound = ref(false);
  const unsubs = [];
  let audioCtx = null;

  const loadUiSettings = async () => {
    const data = await request('/api/settings');
    avatarName.value = String(data.avatarName || 'AIOS');
    enableAvatarEmoji.value = data.enableAvatarEmoji !== false;
    enableAvatarSound.value = data.enableAvatarSound === true;
  };

  const saveUiPrefs = async (partial = {}) => {
    const rawName = partial.avatarName ?? avatarName.value ?? 'AIOS';
    const next = {
      avatarName: String(rawName).trim().slice(0, 24) || 'AIOS',
      enableAvatarEmoji: partial.enableAvatarEmoji ?? enableAvatarEmoji.value,
      enableAvatarSound: partial.enableAvatarSound ?? enableAvatarSound.value
    };
    await request('/api/settings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(next)
    });
    avatarName.value = next.avatarName;
    enableAvatarEmoji.value = next.enableAvatarEmoji;
    enableAvatarSound.value = next.enableAvatarSound;
  };

  const playSound = (kind = 'pop') => {
    if (!enableAvatarSound.value) return;
    const Ctx = window.AudioContext || window.webkitAudioContext;
    if (!Ctx) return;
    if (!audioCtx) audioCtx = new Ctx();
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    const now = audioCtx.currentTime;
    const freq = kind === 'ding' ? 740 : kind === 'success' ? 620 : 520;
    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, now);
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(0.08, now + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.25);
    osc.connect(gain).connect(audioCtx.destination);
    osc.start(now);
    osc.stop(now + 0.26);
  };

  const applyUiEffect = (event) => {
    if (!event || !event.effect) return;
    if (event.effect === 'emoji' && enableAvatarEmoji.value) {
      const e = String(event.payload?.emoji || '').trim();
      if (e) {
        avatarEmoji.value = e;
        avatarBurst.value = e;
        const ms = Math.max(400, Math.min(6000, Number(event.payload?.durationMs) || 1200));
        setTimeout(() => { avatarBurst.value = ''; }, ms);
      }
    }
    if (event.effect === 'sound') {
      playSound(String(event.payload?.sound || 'pop'));
    }
  };

  const fireEmoji = async (emoji) => {
    await request('/api/avatar', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ effect: 'emoji', emoji })
    });
  };

  const fireSound = async (sound) => {
    await request('/api/avatar', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ effect: 'sound', sound })
    });
  };

  const start = () => {
    loadUiSettings();
    unsubs.push(on('ui_effect', applyUiEffect));
    unsubs.push(on('settings_changed', loadUiSettings));
  };

  const stop = () => {
    while (unsubs.length) {
      const off = unsubs.pop();
      if (typeof off === 'function') off();
    }
  };

  return {
    avatarPanelOpen,
    avatarEmoji,
    avatarBurst,
    avatarName,
    enableAvatarEmoji,
    enableAvatarSound,
    saveUiPrefs,
    fireEmoji,
    fireSound,
    start,
    stop
  };
};
