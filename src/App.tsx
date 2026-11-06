import React, { useState, useEffect, useMemo } from 'react';
import { Task, FilterStatus, SortOption, Priority, DeviceProfile } from './types';
import { getStoredDeviceProfile, saveDeviceProfile } from './utils/device';
import { useRealtimeSync } from './hooks/useRealtimeSync';
import { Navbar } from './components/Navbar';
import { DevicePresenceBar } from './components/DevicePresenceBar';
import { StatsBanner } from './components/StatsBanner';
import { QuickAddBar } from './components/QuickAddBar';
import { FilterBar } from './components/FilterBar';
import { TaskCard } from './components/TaskCard';
import { TaskFormModal } from './components/TaskFormModal';
import { QRCodeModal } from './components/QRCodeModal';
import { DeviceProfileModal } from './components/DeviceProfileModal';
import { ActivityDrawer } from './components/ActivityDrawer';
import { CheckCircle2, Inbox, Plus, Sparkles, RefreshCw, Smartphone } from 'lucide-react';

export default function App() {
  // Device profile
  const [deviceProfile, setDeviceProfile] = useState<DeviceProfile>(() => getStoredDeviceProfile());

  // Room state - read query param if present
  const [roomId, setRoomId] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const urlRoom = params.get('room');
      if (urlRoom) return urlRoom;
    }
    return 'main';
  });

  // Dark mode
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('synctask_theme');
      if (stored) return stored === 'dark';
      return window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    return false;
  });

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('synctask_theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('synctask_theme', 'light');
    }
  }, [isDarkMode]);

  // Modals state
  const [isQRModalOpen, setIsQRModalOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isActivityOpen, setIsActivityOpen] = useState(false);
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);

  // Filters state
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<FilterStatus>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedPriority, setSelectedPriority] = useState<Priority | 'all'>('all');
  const [sortBy, setSortBy] = useState<SortOption>('created');

  // Real-time synchronization hook
  const {
    tasks,
    currentRoomName,
    activeDevices,
    activity,
    syncStatus,
    syncPulse,
    latencyMs,
    createTask,
    updateTask,
    deleteTask,
    reorderTasks,
    clearCompleted,
    renameRoom,
    setEditingTask: notifyEditingTask,
    refresh,
  } = useRealtimeSync({
    roomId,
    deviceProfile,
  });

  // Keep URL updated with current room
  const handleSelectRoom = (newRoomId: string, newRoomName?: string) => {
    setRoomId(newRoomId);
    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href);
      url.searchParams.set('room', newRoomId);
      window.history.pushState({}, '', url.toString());
    }
  };

  // Derive unique categories from existing tasks
  const availableCategories = useMemo(() => {
    const set = new Set<string>();
    tasks.forEach((t) => {
      if (t.category && t.category.trim()) {
        set.add(t.category.trim());
      }
    });
    return Array.from(set);
  }, [tasks]);

  // Filtered & Sorted tasks
  const filteredTasks = useMemo(() => {
    return tasks
      .filter((task) => {
        // Status filter
        if (statusFilter === 'active' && task.completed) return false;
        if (statusFilter === 'completed' && !task.completed) return false;

        // Category filter
        if (selectedCategory !== 'all' && task.category !== selectedCategory) {
          return false;
        }

        // Priority filter
        if (selectedPriority !== 'all' && task.priority !== selectedPriority) {
          return false;
        }

        // Search Query
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const matchTitle = task.title.toLowerCase().includes(q);
          const matchDesc = task.description?.toLowerCase().includes(q);
          const matchTag = task.tags?.some((t) => t.toLowerCase().includes(q));
          const matchSubtask = task.subtasks?.some((s) => s.title.toLowerCase().includes(q));
          if (!matchTitle && !matchDesc && !matchTag && !matchSubtask) {
            return false;
          }
        }

        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'priority') {
          const rank: Record<Priority, number> = { urgent: 4, high: 3, medium: 2, low: 1 };
          return (rank[b.priority] || 0) - (rank[a.priority] || 0);
        }
        if (sortBy === 'dueDate') {
          if (!a.dueDate) return 1;
          if (!b.dueDate) return -1;
          return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
        }
        if (sortBy === 'alphabetical') {
          return a.title.localeCompare(b.title);
        }
        // default: created (newest first)
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      });
  }, [tasks, statusFilter, selectedCategory, selectedPriority, searchQuery, sortBy]);

  // Active editors map
  const activeEditingDevicesMap = useMemo(() => {
    const map = new Map<string, typeof activeDevices>();
    activeDevices.forEach((dev) => {
      if (dev.editingTaskId && dev.deviceId !== deviceProfile.deviceId) {
        const existing = map.get(dev.editingTaskId) || [];
        existing.push(dev);
        map.set(dev.editingTaskId, existing);
      }
    });
    return map;
  }, [activeDevices, deviceProfile.deviceId]);

  const handleOpenEditModal = (task: Task) => {
    setEditingTask(task);
    setIsTaskModalOpen(true);
  };

  const handleOpenNewTaskModal = () => {
    setEditingTask(null);
    setIsTaskModalOpen(true);
  };

  const handleSaveTask = (taskData: Partial<Task>) => {
    if (editingTask) {
      updateTask(editingTask.id, taskData);
    } else {
      createTask(taskData);
    }
  };

  const hasCompletedTasks = tasks.some((t) => t.completed);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors flex flex-col font-sans antialiased">
      {/* Top Navigation */}
      <Navbar
        roomId={roomId}
        roomName={currentRoomName}
        onSelectRoom={handleSelectRoom}
        syncStatus={syncStatus}
        syncPulse={syncPulse}
        latencyMs={latencyMs}
        activeDevicesCount={activeDevices.length}
        currentProfile={deviceProfile}
        onOpenQR={() => setIsQRModalOpen(true)}
        onOpenProfile={() => setIsProfileModalOpen(true)}
        onToggleActivity={() => setIsActivityOpen(!isActivityOpen)}
        activityCount={activity.length}
        isDarkMode={isDarkMode}
        onToggleDarkMode={() => setIsDarkMode(!isDarkMode)}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-4xl w-full mx-auto px-4 sm:px-6 py-6 sm:py-8">
        {/* Active Connected Devices Bar */}
        <DevicePresenceBar
          activeDevices={activeDevices}
          currentProfile={deviceProfile}
          onOpenQR={() => setIsQRModalOpen(true)}
          onOpenProfile={() => setIsProfileModalOpen(true)}
        />

        {/* Dashboard Statistics */}
        <StatsBanner tasks={tasks} />

        {/* Lightning Fast Task Quick Input */}
        <QuickAddBar
          onQuickAdd={createTask}
          onOpenDetailedModal={handleOpenNewTaskModal}
          defaultCategory={selectedCategory !== 'all' ? selectedCategory : 'General'}
        />

        {/* Filter and Search Bar */}
        <FilterBar
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          statusFilter={statusFilter}
          onStatusFilterChange={setStatusFilter}
          selectedCategory={selectedCategory}
          onCategoryChange={setSelectedCategory}
          availableCategories={availableCategories}
          selectedPriority={selectedPriority}
          onPriorityChange={setSelectedPriority}
          sortBy={sortBy}
          onSortChange={setSortBy}
          hasCompletedTasks={hasCompletedTasks}
          onClearCompleted={clearCompleted}
        />

        {/* Task List */}
        <div className="space-y-3">
          {filteredTasks.length === 0 ? (
            <div className="text-center py-16 px-4 bg-white dark:bg-slate-900 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800">
              <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 mx-auto flex items-center justify-center mb-3">
                <Inbox className="w-6 h-6" />
              </div>
              <h3 className="text-base font-semibold text-slate-800 dark:text-slate-200">
                {tasks.length === 0
                  ? 'No tasks in this list yet'
                  : 'No tasks match your current filter'}
              </h3>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-sm mx-auto mt-1 mb-4">
                {tasks.length === 0
                  ? 'Add your first task above or scan the QR code to sync tasks with your phone in real time.'
                  : 'Try clearing the search query or selecting a different status filter.'}
              </p>
              {tasks.length === 0 && (
                <button
                  onClick={handleOpenNewTaskModal}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-xs transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  <span>Create First Task</span>
                </button>
              )}
            </div>
          ) : (
            filteredTasks.map((task) => (
              <TaskCard
                key={task.id}
                task={task}
                onUpdate={updateTask}
                onDelete={deleteTask}
                onOpenEditModal={handleOpenEditModal}
                activeEditingDevices={activeEditingDevicesMap.get(task.id) || []}
              />
            ))
          )}
        </div>

        {/* Floating Quick Action for Mobile */}
        <div className="sm:hidden fixed bottom-6 right-6 z-30">
          <button
            onClick={handleOpenNewTaskModal}
            className="w-14 h-14 rounded-full bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg flex items-center justify-center text-2xl transition-transform active:scale-95"
            title="Create Task"
          >
            <Plus className="w-6 h-6" />
          </button>
        </div>
      </main>

      {/* Modals & Drawers */}
      <QRCodeModal
        isOpen={isQRModalOpen}
        onClose={() => setIsQRModalOpen(false)}
        roomId={roomId}
        roomName={currentRoomName}
      />

      <DeviceProfileModal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
        profile={deviceProfile}
        onProfileUpdate={(newProfile) => {
          setDeviceProfile(newProfile);
          saveDeviceProfile(newProfile);
        }}
      />

      <TaskFormModal
        isOpen={isTaskModalOpen}
        onClose={() => setIsTaskModalOpen(false)}
        onSave={handleSaveTask}
        initialTask={editingTask}
        defaultCategory={selectedCategory !== 'all' ? selectedCategory : 'General'}
        onStartEditing={(tId) => notifyEditingTask(tId || 'new')}
        onStopEditing={() => notifyEditingTask(null)}
      />

      <ActivityDrawer
        isOpen={isActivityOpen}
        onClose={() => setIsActivityOpen(false)}
        activity={activity}
      />
    </div>
  );
}
