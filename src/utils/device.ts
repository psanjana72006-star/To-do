import { DeviceProfile } from '../types';

const STORAGE_KEY = 'synctask_device_profile_v1';

const AVATAR_COLORS = [
  '#3b82f6', // Blue
  '#10b981', // Emerald
  '#8b5cf6', // Violet
  '#f59e0b', // Amber
  '#ec4899', // Pink
  '#06b6d4', // Cyan
  '#ef4444', // Red
  '#14b8a6', // Teal
];

function detectDeviceType(): 'mobile' | 'desktop' | 'tablet' {
  if (typeof window === 'undefined') return 'desktop';
  const ua = navigator.userAgent.toLowerCase();
  if (/(tablet|ipad|playbook|silk)|(android(?!.*mobi))/i.test(ua)) {
    return 'tablet';
  }
  if (/Mobile|iP(hone|od)|Android|BlackBerry|IEMobile|Kindle|Silk-Accelerated|(hpw|web)OS|Opera M(obi|ini)/.test(ua)) {
    return 'mobile';
  }
  return 'desktop';
}

function getDefaultDeviceName(type: 'mobile' | 'desktop' | 'tablet'): string {
  if (typeof window === 'undefined') return 'Desktop Device';
  const ua = navigator.userAgent;
  let os = 'Device';
  if (/iPhone/i.test(ua)) os = 'iPhone';
  else if (/iPad/i.test(ua)) os = 'iPad';
  else if (/Macintosh|Mac OS X/i.test(ua)) os = 'MacBook';
  else if (/Windows/i.test(ua)) os = 'Windows PC';
  else if (/Android/i.test(ua)) os = 'Android Device';
  else if (/Linux/i.test(ua)) os = 'Linux Station';

  const randomDigits = Math.floor(100 + Math.random() * 900);
  return `${os} #${randomDigits}`;
}

export function getStoredDeviceProfile(): DeviceProfile {
  if (typeof window === 'undefined') {
    return {
      deviceId: 'ssr-device',
      deviceName: 'Desktop Web',
      deviceType: 'desktop',
      color: AVATAR_COLORS[0],
    };
  }

  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && parsed.deviceId) {
        return parsed;
      }
    }
  } catch (err) {
    console.warn('Failed to parse stored device profile:', err);
  }

  const detectedType = detectDeviceType();
  const newProfile: DeviceProfile = {
    deviceId: `dev-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`,
    deviceName: getDefaultDeviceName(detectedType),
    deviceType: detectedType,
    color: AVATAR_COLORS[Math.floor(Math.random() * AVATAR_COLORS.length)],
  };

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newProfile));
  } catch (err) {
    console.warn('Failed to save device profile:', err);
  }

  return newProfile;
}

export function saveDeviceProfile(profile: DeviceProfile): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(profile));
  } catch (err) {
    console.warn('Failed to save updated device profile:', err);
  }
}

export { AVATAR_COLORS };
