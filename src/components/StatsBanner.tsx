import React from 'react';
import { Task } from '../types';
import { CheckCircle2, Clock, AlertTriangle, Layers, Flame } from 'lucide-react';

interface StatsBannerProps {
  tasks: Task[];
}

export const StatsBanner: React.FC<StatsBannerProps> = ({ tasks }) => {
  const total = tasks.length;
  const completed = tasks.filter((t) => t.completed).length;
  const pending = total - completed;
  const progressPercent = total === 0 ? 0 : Math.round((completed / total) * 100);

  const overdueCount = tasks.filter(
    (t) =>
      !t.completed &&
      t.dueDate &&
      new Date(t.dueDate + 'T23:59:59').getTime() < Date.now()
  ).length;

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
      {/* Total Card */}
      <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs flex items-center gap-3">
        <div className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
          <Layers className="w-5 h-5" />
        </div>
        <div>
          <div className="text-xl font-bold text-slate-900 dark:text-white leading-none">
            {total}
          </div>
          <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">Total Tasks</div>
        </div>
      </div>

      {/* In Progress */}
      <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs flex items-center gap-3">
        <div className="p-2.5 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400">
          <Clock className="w-5 h-5" />
        </div>
        <div>
          <div className="text-xl font-bold text-slate-900 dark:text-white leading-none">
            {pending}
          </div>
          <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">In Progress</div>
        </div>
      </div>

      {/* Completed */}
      <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs flex items-center gap-3">
        <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400">
          <CheckCircle2 className="w-5 h-5" />
        </div>
        <div>
          <div className="text-xl font-bold text-slate-900 dark:text-white leading-none">
            {completed}
          </div>
          <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">Completed</div>
        </div>
      </div>

      {/* Completion rate / Overdue */}
      <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col justify-center">
        <div className="flex items-center justify-between text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
          <span>Progress</span>
          <span className="text-indigo-600 dark:text-indigo-400">{progressPercent}%</span>
        </div>
        <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
          <div
            className="bg-indigo-600 h-full rounded-full transition-all duration-500 ease-out"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
        {overdueCount > 0 ? (
          <div className="text-[10px] text-rose-500 font-medium mt-1.5 flex items-center gap-1">
            <AlertTriangle className="w-3 h-3" />
            <span>{overdueCount} task overdue</span>
          </div>
        ) : (
          <div className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium mt-1.5 flex items-center gap-1">
            <Flame className="w-3 h-3 text-amber-500" />
            <span>On track!</span>
          </div>
        )}
      </div>
    </div>
  );
};
