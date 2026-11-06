import React from 'react';
import { FilterStatus, SortOption, Priority } from '../types';
import { Search, Filter, ArrowUpDown, Trash2, X } from 'lucide-react';

interface FilterBarProps {
  searchQuery: string;
  onSearchChange: (q: string) => void;
  statusFilter: FilterStatus;
  onStatusFilterChange: (s: FilterStatus) => void;
  selectedCategory: string;
  onCategoryChange: (cat: string) => void;
  availableCategories: string[];
  selectedPriority: Priority | 'all';
  onPriorityChange: (p: Priority | 'all') => void;
  sortBy: SortOption;
  onSortChange: (s: SortOption) => void;
  hasCompletedTasks: boolean;
  onClearCompleted: () => void;
}

export const FilterBar: React.FC<FilterBarProps> = ({
  searchQuery,
  onSearchChange,
  statusFilter,
  onStatusFilterChange,
  selectedCategory,
  onCategoryChange,
  availableCategories,
  selectedPriority,
  onPriorityChange,
  sortBy,
  onSortChange,
  hasCompletedTasks,
  onClearCompleted,
}) => {
  return (
    <div className="space-y-3 mb-5">
      {/* Search and Sort Row */}
      <div className="flex items-center gap-2.5 flex-wrap sm:flex-nowrap">
        {/* Search Input */}
        <div className="relative flex-1 min-w-[200px]">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search tasks, tags, notes..."
            className="w-full pl-9 pr-8 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-xs sm:text-sm focus:outline-hidden focus:ring-2 focus:ring-indigo-500 shadow-xs"
          />
          {searchQuery && (
            <button
              onClick={() => onSearchChange('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Sort Select */}
        <div className="flex items-center gap-1.5 shrink-0">
          <div className="relative">
            <select
              value={sortBy}
              onChange={(e) => onSortChange(e.target.value as SortOption)}
              className="appearance-none pl-8 pr-7 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 text-xs font-medium focus:outline-hidden focus:ring-2 focus:ring-indigo-500 shadow-xs cursor-pointer"
            >
              <option value="created">Recently Added</option>
              <option value="priority">Highest Priority</option>
              <option value="dueDate">Due Date</option>
              <option value="alphabetical">Title (A-Z)</option>
            </select>
            <ArrowUpDown className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>

          {/* Priority filter */}
          <div className="relative">
            <select
              value={selectedPriority}
              onChange={(e) => onPriorityChange(e.target.value as Priority | 'all')}
              className="appearance-none pl-7 pr-7 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 text-xs font-medium focus:outline-hidden focus:ring-2 focus:ring-indigo-500 shadow-xs cursor-pointer"
            >
              <option value="all">All Priorities</option>
              <option value="urgent">Urgent Only</option>
              <option value="high">High Only</option>
              <option value="medium">Medium Only</option>
              <option value="low">Low Only</option>
            </select>
            <Filter className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
        </div>
      </div>

      {/* Filter Tabs & Categories Row */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        {/* Status Pills */}
        <div className="flex items-center p-1 rounded-xl bg-slate-100 dark:bg-slate-800/80">
          {(['all', 'active', 'completed'] as const).map((status) => {
            const isActive = statusFilter === status;
            return (
              <button
                key={status}
                onClick={() => onStatusFilterChange(status)}
                className={`px-3 py-1 rounded-lg text-xs font-medium capitalize transition-all ${
                  isActive
                    ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                {status}
              </button>
            );
          })}
        </div>

        {/* Category Chips */}
        <div className="flex items-center gap-1.5 overflow-x-auto py-1 max-w-full">
          <button
            onClick={() => onCategoryChange('all')}
            className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors shrink-0 ${
              selectedCategory === 'all'
                ? 'bg-indigo-600 text-white'
                : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
            }`}
          >
            All
          </button>
          {availableCategories.map((cat) => {
            const isSelected = selectedCategory === cat;
            return (
              <button
                key={cat}
                onClick={() => onCategoryChange(cat)}
                className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors shrink-0 ${
                  isSelected
                    ? 'bg-indigo-600 text-white'
                    : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                }`}
              >
                {cat}
              </button>
            );
          })}
        </div>

        {/* Clear Completed action button */}
        {hasCompletedTasks && (
          <button
            onClick={onClearCompleted}
            className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium text-slate-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors ml-auto"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Clear Completed</span>
          </button>
        )}
      </div>
    </div>
  );
};
