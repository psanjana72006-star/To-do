import React from 'react';
import { ActiveDevice, DeviceProfile } from '../types';
import { Laptop, Smartphone, Tablet, Wifi, QrCode } from 'lucide-react';

interface DevicePresenceBarProps {
  activeDevices: ActiveDevice[];
  currentProfile: DeviceProfile;
  onOpenQR: () => void;
  onOpenProfile: () => void;
}

export const DevicePresenceBar: React.FC<DevicePresenceBarProps> = ({
  activeDevices,
  currentProfile,
  onOpenQR,
  onOpenProfile,
}) => {
  // Ensure current device is included in display even if WS heartbeat is pending
  const displayDevices = [...activeDevices];
  if (!displayDevices.some((d) => d.deviceId === currentProfile.deviceId)) {
    displayDevices.unshift({
      deviceId: currentProfile.deviceId,
      deviceName: currentProfile.deviceName,
      deviceType: currentProfile.deviceType,
      color: currentProfile.color,
      lastSeen: new Date().toISOString(),
    });
  }

  const otherDevicesCount = displayDevices.filter((d) => d.deviceId !== currentProfile.deviceId).length;

  return (
    <div className="flex items-center justify-between py-2 px-3.5 sm:px-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs mb-6 flex-wrap gap-2">
      {/* Devices stack */}
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-xs font-medium text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
          <Wifi className="w-3.5 h-3.5 text-emerald-500 animate-pulse" />
          <span>Active Devices ({displayDevices.length}):</span>
        </span>

        <div className="flex items-center gap-1.5 flex-wrap">
          {displayDevices.map((device) => {
            const isMe = device.deviceId === currentProfile.deviceId;
            return (
              <button
                key={device.deviceId}
                onClick={isMe ? onOpenProfile : undefined}
                title={isMe ? `${device.deviceName} (This Device) - Click to customize` : `${device.deviceName} (Active now)`}
                className={`inline-flex items-center gap-1.5 py-1 px-2.5 rounded-full text-xs font-medium transition-all ${
                  isMe
                    ? 'bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-900 dark:text-white cursor-pointer ring-1 ring-slate-300 dark:ring-slate-700'
                    : 'bg-slate-50 dark:bg-slate-800/60 text-slate-700 dark:text-slate-300'
                }`}
              >
                <span
                  className="w-2 h-2 rounded-full ring-2 ring-white dark:ring-slate-900"
                  style={{ backgroundColor: device.color }}
                />
                <span className="text-slate-500">
                  {device.deviceType === 'mobile' ? (
                    <Smartphone className="w-3 h-3" />
                  ) : device.deviceType === 'tablet' ? (
                    <Tablet className="w-3 h-3" />
                  ) : (
                    <Laptop className="w-3 h-3" />
                  )}
                </span>
                <span className="truncate max-w-[120px] sm:max-w-[160px]">{device.deviceName}</span>
                {isMe && (
                  <span className="text-[10px] font-semibold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider ml-0.5">
                    (You)
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Quick QR Sync invite button */}
      <button
        onClick={onOpenQR}
        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 text-xs font-semibold transition-colors"
      >
        <QrCode className="w-3.5 h-3.5" />
        <span>Pair Phone / Second Device</span>
      </button>
    </div>
  );
};
