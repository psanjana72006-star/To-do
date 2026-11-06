export type Priority = 'low' | 'medium' | 'high' | 'urgent';

export interface Subtask {
  id: string;
  title: string;
  completed: boolean;
}

export interface Task {
  id: string;
  roomId: string;
  title: string;
  description?: string;
  completed: boolean;
  completedAt?: string;
  priority: Priority;
  category: string;
  dueDate?: string;
  subtasks: Subtask[];
  tags: string[];
  createdByDeviceId: string;
  createdByName: string;
  createdAt: string;
  updatedAt: string;
  lastEditedBy?: string;
}

export interface ActiveDevice {
  deviceId: string;
  deviceName: string;
  deviceType: 'mobile' | 'desktop' | 'tablet';
  color: string;
  lastSeen: string;
  editingTaskId?: string | null;
}

export interface ActivityItem {
  id: string;
  deviceId: string;
  deviceName: string;
  action: string;
  taskTitle: string;
  timestamp: string;
}

export interface RoomState {
  id: string;
  name: string;
  createdAt: string;
  tasks: Task[];
  activity: ActivityItem[];
}

export interface DeviceProfile {
  deviceId: string;
  deviceName: string;
  deviceType: 'mobile' | 'desktop' | 'tablet';
  color: string;
}

export type SyncStatus = 'connecting' | 'connected' | 'reconnecting' | 'offline';
export type FilterStatus = 'all' | 'active' | 'completed';
export type SortOption = 'created' | 'priority' | 'dueDate' | 'alphabetical';
