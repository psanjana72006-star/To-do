import React, { useState } from 'react';
import { DeviceProfile } from '../types';
import { AVATAR_COLORS, saveDeviceProfile } from '../utils/device';
import { X, Laptop, Smartphone, Tablet, Check, Sparkles } from 'lucide-react';

interface DeviceProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  profile: DeviceProfile;
  onProfileUpdate: (newProfile: DeviceProfile) => void;
}

export const DeviceProfileModal: React.FC<DeviceProfileModalProps> = ({
  isOpen,
  onClose,
  profile,
  onProfileUpdate,
}) => {
  const [name, setName] = useState(profile.deviceName);
  const [type, setType] = useState(profile.deviceType);
  const [color, setColor] = useState(profile.color);

  if (!isOpen) return null;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const updated: DeviceProfile = {
      ...profile,
      deviceName: name.trim() || 'My Device',
      deviceType: type,
      color,
    };
    saveDeviceProfile(updated);
    onProfileUpdate(updated);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
      <div className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
          <div>
            <h3 className="font-semibold text-slate-900 dark:text-white text-base">
              Device Identity
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              How other devices see your edits in real-time
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSave} className="p-6 space-y-5">
          {/* Device Preview Card */}
          <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 flex items-center gap-3.5">
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center text-white shadow-xs font-semibold text-lg"
              style={{ backgroundColor: color }}
            >
              {type === 'mobile' ? (
                <Smartphone className="w-6 h-6" />
              ) : type === 'tablet' ? (
                <Tablet className="w-6 h-6" />
              ) : (
                <Laptop className="w-6 h-6" />
              )}
            </div>
            <div>
              <div className="text-sm font-semibold text-slate-900 dark:text-white">
                {name || 'Device Name'}
              </div>
              <div className="text-xs text-slate-500 dark:text-slate-400 font-mono">
                ID: {profile.deviceId.slice(0, 14)}...
              </div>
            </div>
          </div>

          {/* Device Name Input */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
              Device Name / Label
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Sanjana's MacBook, iPhone 15 Pro"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
              maxLength={36}
              required
            />
          </div>

          {/* Device Type Selector */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
              Device Type
            </label>
            <div className="grid grid-cols-3 gap-2">
              {(['desktop', 'mobile', 'tablet'] as const).map((dType) => {
                const isSelected = type === dType;
                return (
                  <button
                    key={dType}
                    type="button"
                    onClick={() => setType(dType)}
                    className={`flex flex-col items-center gap-1.5 py-2.5 px-2 rounded-xl border text-xs font-medium capitalize transition-all ${
                      isSelected
                        ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 ring-2 ring-indigo-500/20'
                        : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    {dType === 'desktop' && <Laptop className="w-4 h-4" />}
                    {dType === 'mobile' && <Smartphone className="w-4 h-4" />}
                    {dType === 'tablet' && <Tablet className="w-4 h-4" />}
                    <span>{dType}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Color Picker */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
              Presence Avatar Color
            </label>
            <div className="flex items-center gap-2.5 flex-wrap">
              {AVATAR_COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  className={`w-8 h-8 rounded-full transition-transform flex items-center justify-center ${
                    color === c ? 'scale-110 ring-2 ring-offset-2 ring-indigo-500' : 'hover:scale-105'
                  }`}
                  style={{ backgroundColor: c }}
                >
                  {color === c && <Check className="w-4 h-4 text-white drop-shadow-xs" />}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 text-sm font-medium transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium shadow-sm transition-colors"
            >
              Save Device
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
