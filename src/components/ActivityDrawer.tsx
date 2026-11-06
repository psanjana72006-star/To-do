import React from 'react';
import { ActivityItem } from '../types';
import { X, Activity, Clock, CheckCircle2, PlusCircle, Trash2, Edit } from 'lucide-react';

interface ActivityDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  activity: ActivityItem[];
}

function timeAgo(dateString: string): string {
  const diffMs = Date.now() - new Date(dateString).getTime();
  const diffSec = Math.floor(diffMs / 1000);
  if (diffSec < 10) return 'just now';
  if (diffSec < 60) return `${diffSec}s ago`;
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHours = Math.floor(diffMin / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  return `${Math.floor(diffHours / 24)}d ago`;
}

export const ActivityDrawer: React.FC<ActivityDrawerProps> = ({
  isOpen,
  onClose,
  activity,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/40 backdrop-blur-xs animate-in fade-in">
      <div className="w-full max-w-sm h-full bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
          <div className="flex items-center gap-2">
            <Activity className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            <h3 className="font-semibold text-slate-900 dark:text-white text-base">
              Sync Activity Log
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Stream */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {activity.length === 0 ? (
            <div className="text-center py-12 text-slate-400 text-sm">
              No recent sync activity yet. Actions on any device appear here in real-time!
            </div>
          ) : (
            activity.map((item) => {
              const isComplete = item.action.includes('complete');
              const isCreate = item.action.includes('create');
              const isDelete = item.action.includes('delete');

              return (
                <div
                  key={item.id}
                  className="p-3 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 text-xs"
                >
                  <div className="flex items-start gap-2.5">
                    <div className="mt-0.5">
                      {isComplete ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                      ) : isCreate ? (
                        <PlusCircle className="w-4 h-4 text-indigo-500" />
                      ) : isDelete ? (
                        <Trash2 className="w-4 h-4 text-rose-500" />
                      ) : (
                        <Edit className="w-4 h-4 text-amber-500" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-slate-800 dark:text-slate-200 font-medium">
                        <span className="font-semibold text-indigo-600 dark:text-indigo-400">
                          {item.deviceName}
                        </span>{' '}
                        {item.action}:
                      </div>
                      <div className="text-slate-600 dark:text-slate-300 font-medium truncate mt-0.5">
                        "{item.taskTitle}"
                      </div>
                      <div className="text-[10px] text-slate-400 mt-1 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        <span>{timeAgo(item.timestamp)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 text-center text-xs text-slate-500 dark:text-slate-400">
          Syncs continuously across all active websockets
        </div>
      </div>
    </div>
  );
};
