import React, { useState } from 'react';
import { DeviceProfile, SyncStatus } from '../types';
import {
  CheckSquare,
  Wifi,
  WifiOff,
  RefreshCw,
  QrCode,
  Activity,
  Laptop,
  Smartphone,
  Tablet,
  ChevronDown,
  Plus,
  FolderPlus,
  Moon,
  Sun,
  Share2
} from 'lucide-react';

interface NavbarProps {
  roomId: string;
  roomName: string;
  onSelectRoom: (newRoomId: string, newRoomName?: string) => void;
  syncStatus: SyncStatus;
  syncPulse: boolean;
  latencyMs: number;
  activeDevicesCount: number;
  currentProfile: DeviceProfile;
  onOpenQR: () => void;
  onOpenProfile: () => void;
  onToggleActivity: () => void;
  activityCount: number;
  isDarkMode: boolean;
  onToggleDarkMode: () => void;
}

const PRESET_ROOMS = [
  { id: 'main', name: 'General Tasks' },
  { id: 'sprint', name: 'Sprint Roadmap' },
  { id: 'groceries', name: 'Home & Grocery' },
  { id: 'ideas', name: 'Product Ideas' },
];

export const Navbar: React.FC<NavbarProps> = ({
  roomId,
  roomName,
  onSelectRoom,
  syncStatus,
  syncPulse,
  latencyMs,
  activeDevicesCount,
  currentProfile,
  onOpenQR,
  onOpenProfile,
  onToggleActivity,
  activityCount,
  isDarkMode,
  onToggleDarkMode,
}) => {
  const [showRoomDropdown, setShowRoomDropdown] = useState(false);
  const [newRoomInput, setNewRoomInput] = useState('');
  const [showNewRoomForm, setShowNewRoomForm] = useState(false);

  const handleCreateRoom = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRoomInput.trim()) return;
    const cleanId = newRoomInput.trim().toLowerCase().replace(/[^a-z0-9_-]/g, '-');
    onSelectRoom(cleanId, newRoomInput.trim());
    setNewRoomInput('');
    setShowNewRoomForm(false);
    setShowRoomDropdown(false);
  };

  return (
    <header className="sticky top-0 z-40 bg-white/85 dark:bg-slate-900/85 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800 transition-colors">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-3">
        {/* Brand & Room Switcher */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center text-white shadow-xs">
              <CheckSquare className="w-5 h-5 stroke-[2.5]" />
            </div>
            <div className="hidden sm:block">
              <div className="font-bold text-slate-900 dark:text-white text-base tracking-tight leading-none">
                SyncTask
              </div>
              <div className="text-[10px] text-slate-400 font-medium">Real-Time To-Do</div>
            </div>
          </div>

          <div className="h-5 w-px bg-slate-200 dark:bg-slate-700 hidden sm:block mx-1" />

          {/* Room Selector Dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowRoomDropdown(!showRoomDropdown)}
              className="flex items-center gap-1.5 py-1.5 px-3 rounded-xl bg-slate-100 dark:bg-slate-800/80 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-100 text-xs sm:text-sm font-semibold transition-colors"
            >
              <span className="truncate max-w-[130px] sm:max-w-[200px]">{roomName}</span>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
            </button>

            {showRoomDropdown && (
              <div className="absolute left-0 top-full mt-2 w-64 bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 p-2 z-50 animate-in fade-in zoom-in-95">
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-3 py-1.5">
                  Synchronized Lists
                </div>
                <div className="space-y-1">
                  {PRESET_ROOMS.map((r) => (
                    <button
                      key={r.id}
                      onClick={() => {
                        onSelectRoom(r.id, r.name);
                        setShowRoomDropdown(false);
                      }}
                      className={`w-full text-left px-3 py-2 rounded-xl text-xs font-medium flex items-center justify-between transition-colors ${
                        roomId === r.id
                          ? 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 font-semibold'
                          : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                      }`}
                    >
                      <span>{r.name}</span>
                      {roomId === r.id && (
                        <span className="w-1.5 h-1.5 rounded-full bg-indigo-600" />
                      )}
                    </button>
                  ))}
                </div>

                <div className="pt-2 mt-2 border-t border-slate-100 dark:border-slate-800">
                  {showNewRoomForm ? (
                    <form onSubmit={handleCreateRoom} className="p-1 space-y-2">
                      <input
                        type="text"
                        value={newRoomInput}
                        onChange={(e) => setNewRoomInput(e.target.value)}
                        placeholder="New list name..."
                        autoFocus
                        className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white outline-hidden focus:ring-1 focus:ring-indigo-500"
                      />
                      <div className="flex gap-1.5 justify-end">
                        <button
                          type="button"
                          onClick={() => setShowNewRoomForm(false)}
                          className="px-2 py-1 text-xs text-slate-500 hover:text-slate-700"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          className="px-2.5 py-1 bg-indigo-600 text-white rounded-lg text-xs font-medium"
                        >
                          Create
                        </button>
                      </div>
                    </form>
                  ) : (
                    <button
                      onClick={() => setShowNewRoomForm(true)}
                      className="w-full px-3 py-2 text-left rounded-xl text-xs font-medium text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 flex items-center gap-1.5"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Create New Synced List</span>
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Action Stack */}
        <div className="flex items-center gap-2">
          {/* Sync Status Badge */}
          <div
            className={`hidden md:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border transition-colors ${
              syncStatus === 'connected'
                ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-400'
                : syncStatus === 'reconnecting'
                ? 'bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-400'
                : 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-500'
            }`}
          >
            <span
              className={`w-2 h-2 rounded-full ${
                syncStatus === 'connected'
                  ? 'bg-emerald-500 animate-pulse'
                  : syncStatus === 'reconnecting'
                  ? 'bg-amber-500 animate-ping'
                  : 'bg-slate-400'
              }`}
            />
            <span>
              {syncStatus === 'connected'
                ? syncPulse
                  ? 'Syncing...'
                  : 'Real-Time Sync'
                : syncStatus === 'reconnecting'
                ? 'Reconnecting...'
                : 'Offline'}
            </span>
            {syncStatus === 'connected' && latencyMs > 0 && (
              <span className="text-[10px] opacity-75 font-mono">({latencyMs}ms)</span>
            )}
          </div>

          {/* Pair / QR Code Button */}
          <button
            onClick={onOpenQR}
            title="Scan QR Code or copy link to sync across devices"
            className="flex items-center gap-1.5 py-1.5 px-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-medium shadow-xs transition-colors"
          >
            <QrCode className="w-4 h-4" />
            <span className="hidden sm:inline">Sync Device</span>
          </button>

          {/* Activity Drawer Toggle */}
          <button
            onClick={onToggleActivity}
            title="View Real-Time Activity Log"
            className="relative p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <Activity className="w-4 h-4" />
            {activityCount > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-indigo-600" />
            )}
          </button>

          {/* Dark Mode Toggle */}
          <button
            onClick={onToggleDarkMode}
            title={isDarkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            className="p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            {isDarkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>

          {/* Device Profile Button */}
          <button
            onClick={onOpenProfile}
            title={`Current Device: ${currentProfile.deviceName}`}
            className="flex items-center gap-1.5 p-1 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <div
              className="w-7 h-7 rounded-lg flex items-center justify-center text-white text-xs shadow-xs"
              style={{ backgroundColor: currentProfile.color }}
            >
              {currentProfile.deviceType === 'mobile' ? (
                <Smartphone className="w-3.5 h-3.5" />
              ) : currentProfile.deviceType === 'tablet' ? (
                <Tablet className="w-3.5 h-3.5" />
              ) : (
                <Laptop className="w-3.5 h-3.5" />
              )}
            </div>
          </button>
        </div>
      </div>
    </header>
  );
};
