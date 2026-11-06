import React, { useState } from 'react';
import { Task, Priority, ActiveDevice } from '../types';
import confetti from 'canvas-confetti';
import {
  Check,
  Calendar,
  Clock,
  Trash2,
  Edit3,
  ChevronDown,
  ChevronUp,
  Tag,
  AlertCircle,
  MoreVertical,
  Laptop,
  Smartphone,
  Tablet,
  CheckCircle2,
  Circle,
  GripVertical
} from 'lucide-react';

interface TaskCardProps {
  task: Task;
  onUpdate: (taskId: string, updates: Partial<Task>) => void;
  onDelete: (taskId: string) => void;
  onOpenEditModal: (task: Task) => void;
  activeEditingDevices: ActiveDevice[];
  onStartInlineEdit?: () => void;
  onEndInlineEdit?: () => void;
  isDragOver?: boolean;
}

const PRIORITY_CONFIG: Record<Priority, { label: string; badgeClass: string }> = {
  urgent: {
    label: 'Urgent',
    badgeClass: 'bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-900',
  },
  high: {
    label: 'High',
    badgeClass: 'bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-900',
  },
  medium: {
    label: 'Medium',
    badgeClass: 'bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-900',
  },
  low: {
    label: 'Low',
    badgeClass: 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700',
  },
};

export const TaskCard: React.FC<TaskCardProps> = ({
  task,
  onUpdate,
  onDelete,
  onOpenEditModal,
  activeEditingDevices,
}) => {
  const [showSubtasks, setShowSubtasks] = useState(false);
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [titleDraft, setTitleDraft] = useState(task.title);

  const priorityMeta = PRIORITY_CONFIG[task.priority] || PRIORITY_CONFIG.medium;

  const handleToggleComplete = (e: React.MouseEvent) => {
    e.stopPropagation();
    const nextCompleted = !task.completed;
    onUpdate(task.id, { completed: nextCompleted });

    if (nextCompleted) {
      try {
        confetti({
          particleCount: 35,
          spread: 60,
          origin: { y: 0.8 },
          colors: ['#6366f1', '#10b981', '#3b82f6'],
        });
      } catch (err) {
        // ignore if canvas not supported
      }
    }
  };

  const handleTitleSubmit = () => {
    if (titleDraft.trim() && titleDraft !== task.title) {
      onUpdate(task.id, { title: titleDraft.trim() });
    } else {
      setTitleDraft(task.title);
    }
    setIsEditingTitle(false);
  };

  const handleToggleSubtask = (subtaskId: string) => {
    const nextSubtasks = task.subtasks.map((st) =>
      st.id === subtaskId ? { ...st, completed: !st.completed } : st
    );
    onUpdate(task.id, { subtasks: nextSubtasks });
  };

  // Check if due date is overdue
  const isOverdue =
    task.dueDate &&
    !task.completed &&
    new Date(task.dueDate + 'T23:59:59').getTime() < Date.now();

  const completedSubtasksCount = task.subtasks.filter((s) => s.completed).length;
  const totalSubtasks = task.subtasks.length;

  return (
    <div
      className={`group relative rounded-2xl border transition-all duration-200 bg-white dark:bg-slate-900 ${
        task.completed
          ? 'border-slate-200/80 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-900/40 opacity-75'
          : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 shadow-xs hover:shadow-md'
      }`}
    >
      {/* Active Remote Editing Indicator */}
      {activeEditingDevices.length > 0 && (
        <div className="absolute -top-3 right-4 z-10 flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium bg-amber-500 text-white shadow-xs animate-bounce">
          {activeEditingDevices[0].deviceType === 'mobile' ? (
            <Smartphone className="w-3 h-3" />
          ) : (
            <Laptop className="w-3 h-3" />
          )}
          <span>{activeEditingDevices[0].deviceName} is editing</span>
        </div>
      )}

      <div className="p-4 sm:p-5">
        <div className="flex items-start gap-3.5">
          {/* Custom Checkbox */}
          <button
            type="button"
            onClick={handleToggleComplete}
            aria-label={task.completed ? 'Mark task incomplete' : 'Mark task complete'}
            className={`mt-0.5 w-6 h-6 rounded-lg flex items-center justify-center transition-all shrink-0 cursor-pointer ${
              task.completed
                ? 'bg-emerald-500 text-white shadow-xs'
                : 'border-2 border-slate-300 dark:border-slate-600 hover:border-emerald-500 text-transparent hover:text-emerald-500/30'
            }`}
          >
            <Check className="w-4 h-4 stroke-[2.5]" />
          </button>

          {/* Task Info Body */}
          <div className="flex-1 min-w-0">
            {/* Title / Inline editing */}
            {isEditingTitle ? (
              <div className="flex items-center gap-2 mb-1.5">
                <input
                  type="text"
                  value={titleDraft}
                  onChange={(e) => setTitleDraft(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleTitleSubmit();
                    if (e.key === 'Escape') {
                      setTitleDraft(task.title);
                      setIsEditingTitle(false);
                    }
                  }}
                  onBlur={handleTitleSubmit}
                  autoFocus
                  className="w-full text-base font-semibold text-slate-900 dark:text-white px-2 py-1 rounded-lg border border-indigo-500 bg-white dark:bg-slate-800 outline-hidden focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>
            ) : (
              <h4
                onClick={() => setIsEditingTitle(true)}
                className={`text-base font-semibold leading-snug cursor-pointer transition-colors ${
                  task.completed
                    ? 'line-through text-slate-400 dark:text-slate-500'
                    : 'text-slate-800 dark:text-slate-100 hover:text-indigo-600 dark:hover:text-indigo-400'
                }`}
                title="Click to edit title"
              >
                {task.title}
              </h4>
            )}

            {/* Description */}
            {task.description && (
              <p
                className={`text-xs sm:text-sm mt-1 line-clamp-2 leading-relaxed ${
                  task.completed
                    ? 'text-slate-400 dark:text-slate-600'
                    : 'text-slate-600 dark:text-slate-400'
                }`}
              >
                {task.description}
              </p>
            )}

            {/* Meta tags and badges */}
            <div className="flex flex-wrap items-center gap-2 mt-3 text-xs">
              {/* Priority */}
              <span
                className={`inline-flex items-center px-2 py-0.5 rounded-md font-medium border ${priorityMeta.badgeClass}`}
              >
                {priorityMeta.label}
              </span>

              {/* Category */}
              {task.category && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md font-medium bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                  {task.category}
                </span>
              )}

              {/* Due Date */}
              {task.dueDate && (
                <span
                  className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md font-medium ${
                    isOverdue
                      ? 'bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-800'
                      : 'bg-slate-100 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300'
                  }`}
                >
                  {isOverdue ? (
                    <AlertCircle className="w-3.5 h-3.5 text-rose-500" />
                  ) : (
                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                  )}
                  <span>
                    {isOverdue ? 'Overdue: ' : 'Due: '}
                    {new Date(task.dueDate + 'T00:00:00').toLocaleDateString(undefined, {
                      month: 'short',
                      day: 'numeric',
                    })}
                  </span>
                </span>
              )}

              {/* Subtasks Progress Pill */}
              {totalSubtasks > 0 && (
                <button
                  type="button"
                  onClick={() => setShowSubtasks(!showSubtasks)}
                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md font-medium bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100 dark:hover:bg-indigo-900 transition-colors"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>
                    {completedSubtasksCount}/{totalSubtasks}
                  </span>
                  {showSubtasks ? (
                    <ChevronUp className="w-3 h-3 ml-0.5" />
                  ) : (
                    <ChevronDown className="w-3 h-3 ml-0.5" />
                  )}
                </button>
              )}

              {/* Tags */}
              {task.tags &&
                task.tags.map((tag) => (
                  <span
                    key={tag}
                    className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[11px] text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                  >
                    <Tag className="w-2.5 h-2.5" />
                    {tag}
                  </span>
                ))}
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-1 shrink-0 opacity-80 group-hover:opacity-100 transition-opacity">
            <button
              onClick={() => onOpenEditModal(task)}
              title="Edit Task Details"
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <Edit3 className="w-4 h-4" />
            </button>
            <button
              onClick={() => onDelete(task.id)}
              title="Delete Task"
              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Expandable Subtasks Checklist */}
        {totalSubtasks > 0 && showSubtasks && (
          <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 pl-9 space-y-2">
            <div className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2">
              Subtasks ({completedSubtasksCount}/{totalSubtasks})
            </div>
            {task.subtasks.map((st) => (
              <div
                key={st.id}
                onClick={() => handleToggleSubtask(st.id)}
                className="flex items-center gap-2.5 py-1 px-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/60 cursor-pointer transition-colors"
              >
                <div
                  className={`w-4 h-4 rounded flex items-center justify-center transition-colors shrink-0 ${
                    st.completed
                      ? 'bg-emerald-500 text-white'
                      : 'border border-slate-300 dark:border-slate-600'
                  }`}
                >
                  {st.completed && <Check className="w-3 h-3 stroke-[3]" />}
                </div>
                <span
                  className={`text-xs sm:text-sm ${
                    st.completed
                      ? 'line-through text-slate-400 dark:text-slate-500'
                      : 'text-slate-700 dark:text-slate-200'
                  }`}
                >
                  {st.title}
                </span>
              </div>
            ))}
          </div>
        )}

        {/* Device author footnote */}
        <div className="mt-3 pt-2 border-t border-slate-50 dark:border-slate-800/60 flex items-center justify-between text-[11px] text-slate-400 dark:text-slate-500">
          <span>
            Added by <strong className="font-medium text-slate-600 dark:text-slate-400">{task.createdByName}</strong>
          </span>
          {task.lastEditedBy && task.lastEditedBy !== task.createdByName && (
            <span>Last edit: {task.lastEditedBy}</span>
          )}
        </div>
      </div>
    </div>
  );
};
