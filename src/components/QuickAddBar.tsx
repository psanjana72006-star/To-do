import React, { useState } from 'react';
import { Priority, Task } from '../types';
import { Plus, SlidersHorizontal, Calendar, Tag, Sparkles } from 'lucide-react';

interface QuickAddBarProps {
  onQuickAdd: (taskData: Partial<Task>) => void;
  onOpenDetailedModal: () => void;
  defaultCategory: string;
}

export const QuickAddBar: React.FC<QuickAddBarProps> = ({
  onQuickAdd,
  onOpenDetailedModal,
  defaultCategory,
}) => {
  const [title, setTitle] = useState('');
  const [priority, setPriority] = useState<Priority>('medium');
  const [isFocused, setIsFocused] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    onQuickAdd({
      title: title.trim(),
      priority,
      category: defaultCategory !== 'all' ? defaultCategory : 'General',
    });

    setTitle('');
  };

  return (
    <form
      onSubmit={handleSubmit}
      className={`relative mb-6 rounded-2xl bg-white dark:bg-slate-900 border transition-all duration-200 shadow-sm ${
        isFocused
          ? 'border-indigo-500 ring-2 ring-indigo-500/20'
          : 'border-slate-200 dark:border-slate-800 hover:border-slate-300'
      }`}
    >
      <div className="flex items-center p-2 sm:p-2.5 gap-2">
        {/* Plus Icon / Submit Button */}
        <button
          type="submit"
          disabled={!title.trim()}
          className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all shrink-0 ${
            title.trim()
              ? 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs'
              : 'bg-slate-100 dark:bg-slate-800 text-slate-400'
          }`}
        >
          <Plus className="w-5 h-5 stroke-[2.5]" />
        </button>

        {/* Text Input */}
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          placeholder="Add a new task across all devices... (Press Enter)"
          className="flex-1 bg-transparent border-none text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-hidden"
        />

        {/* Priority Quick selector */}
        <div className="hidden sm:flex items-center gap-1 bg-slate-50 dark:bg-slate-800/60 p-1 rounded-xl">
          {(['low', 'medium', 'high', 'urgent'] as const).map((p) => {
            const isSelected = priority === p;
            return (
              <button
                key={p}
                type="button"
                onClick={() => setPriority(p)}
                className={`px-2 py-1 rounded-lg text-[11px] font-medium capitalize transition-all ${
                  isSelected
                    ? p === 'urgent'
                      ? 'bg-rose-500 text-white'
                      : p === 'high'
                      ? 'bg-amber-500 text-white'
                      : p === 'medium'
                      ? 'bg-blue-500 text-white'
                      : 'bg-slate-600 text-white'
                    : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                {p}
              </button>
            );
          })}
        </div>

        {/* Detailed Modal Trigger button */}
        <button
          type="button"
          onClick={onOpenDetailedModal}
          title="Open Full Task Details (Subtasks, Due Date, Tags)"
          className="p-2 rounded-xl text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-slate-800 transition-colors shrink-0"
        >
          <SlidersHorizontal className="w-4 h-4" />
        </button>
      </div>
    </form>
  );
};
