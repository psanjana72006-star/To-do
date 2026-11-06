import { useState, useEffect, useRef, useCallback } from 'react';
import { Task, ActiveDevice, ActivityItem, RoomState, DeviceProfile, SyncStatus } from '../types';
import { getStoredDeviceProfile } from '../utils/device';

export type { SyncStatus };

interface UseRealtimeSyncProps {
  roomId: string;
  roomName?: string;
  deviceProfile: DeviceProfile;
}

export function useRealtimeSync({ roomId, roomName, deviceProfile }: UseRealtimeSyncProps) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [currentRoomName, setCurrentRoomName] = useState<string>(roomName || 'General Tasks');
  const [activeDevices, setActiveDevices] = useState<ActiveDevice[]>([]);
  const [activity, setActivity] = useState<ActivityItem[]>([]);
  const [syncStatus, setSyncStatus] = useState<SyncStatus>('connecting');
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null);
  const [syncPulse, setSyncPulse] = useState<boolean>(false);
  const [latencyMs, setLatencyMs] = useState<number>(0);

  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const heartbeatIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const pingStartRef = useRef<number>(0);
  const isIntentionalCloseRef = useRef<boolean>(false);

  // Trigger brief visual pulse on sync event
  const triggerPulse = useCallback(() => {
    setSyncPulse(true);
    setLastSyncTime(new Date());
    const timer = setTimeout(() => setSyncPulse(false), 600);
    return () => clearTimeout(timer);
  }, []);

  // Fetch full state via HTTP backup
  const fetchRoomState = useCallback(async (targetRoomId: string) => {
    try {
      const res = await fetch(`/api/rooms/${encodeURIComponent(targetRoomId)}`);
      if (res.ok) {
        const data = await res.json();
        if (data.room) {
          setTasks(data.room.tasks || []);
          setCurrentRoomName(data.room.name || 'General Tasks');
          setActivity(data.room.activity || []);
        }
        if (data.activeDevices) {
          setActiveDevices(data.activeDevices);
        }
        triggerPulse();
      }
    } catch (err) {
      console.warn('HTTP fallback room fetch failed:', err);
    }
  }, [triggerPulse]);

  // Connect WebSocket
  const connectWs = useCallback(() => {
    if (typeof window === 'undefined') return;

    if (wsRef.current && (wsRef.current.readyState === WebSocket.OPEN || wsRef.current.readyState === WebSocket.CONNECTING)) {
      return;
    }

    setSyncStatus(prev => (prev === 'connected' ? 'reconnecting' : 'connecting'));

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = window.location.host;
    const wsUrl = `${protocol}//${host}/api/ws`;

    try {
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        setSyncStatus('connected');
        triggerPulse();

        // Join room with device metadata
        const joinPayload = {
          type: 'join',
          roomId,
          roomName,
          deviceId: deviceProfile.deviceId,
          deviceName: deviceProfile.deviceName,
          deviceType: deviceProfile.deviceType,
          color: deviceProfile.color,
        };
        ws.send(JSON.stringify(joinPayload));

        // Start ping heartbeat
        if (heartbeatIntervalRef.current) clearInterval(heartbeatIntervalRef.current);
        heartbeatIntervalRef.current = setInterval(() => {
          if (ws.readyState === WebSocket.OPEN) {
            pingStartRef.current = performance.now();
            ws.send(JSON.stringify({ type: 'heartbeat' }));
          }
        }, 15000);
      };

      ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data);
          triggerPulse();

          if (pingStartRef.current > 0) {
            setLatencyMs(Math.round(performance.now() - pingStartRef.current));
            pingStartRef.current = 0;
          }

          switch (msg.type) {
            case 'init': {
              const room: RoomState = msg.room;
              if (room) {
                setTasks(room.tasks || []);
                setCurrentRoomName(room.name || 'General Tasks');
                setActivity(room.activity || []);
              }
              if (Array.isArray(msg.activeDevices)) {
                setActiveDevices(msg.activeDevices);
              }
              break;
            }

            case 'presence:update': {
              if (Array.isArray(msg.activeDevices)) {
                setActiveDevices(msg.activeDevices);
              }
              break;
            }

            case 'task:created': {
              const newTask: Task = msg.task;
              setTasks(prev => {
                if (prev.some(t => t.id === newTask.id)) return prev;
                return [newTask, ...prev];
              });
              break;
            }

            case 'task:updated': {
              const updatedTask: Task = msg.task;
              setTasks(prev =>
                prev.map(t => (t.id === updatedTask.id ? updatedTask : t))
              );
              break;
            }

            case 'task:deleted': {
              const { taskId } = msg;
              setTasks(prev => prev.filter(t => t.id !== taskId));
              break;
            }

            case 'task:reordered': {
              const { orderedIds } = msg;
              if (Array.isArray(orderedIds)) {
                setTasks(prev => {
                  const map = new Map(prev.map(t => [t.id, t]));
                  const next: Task[] = [];
                  for (const id of orderedIds) {
                    const item = map.get(id);
                    if (item) {
                      next.push(item);
                      map.delete(id);
                    }
                  }
                  map.forEach(item => next.push(item));
                  return next;
                });
              }
              break;
            }

            case 'tasks:cleared_completed': {
              if (Array.isArray(msg.tasks)) {
                setTasks(msg.tasks);
              } else {
                setTasks(prev => prev.filter(t => !t.completed));
              }
              break;
            }

            case 'room:renamed': {
              if (msg.name) {
                setCurrentRoomName(msg.name);
              }
              break;
            }

            case 'activity:new': {
              if (msg.activity) {
                setActivity(prev => [msg.activity, ...prev.slice(0, 49)]);
              }
              break;
            }
          }
        } catch (err) {
          console.error('Error processing server WS message:', err);
        }
      };

      ws.onclose = () => {
        if (heartbeatIntervalRef.current) clearInterval(heartbeatIntervalRef.current);
        if (!isIntentionalCloseRef.current) {
          setSyncStatus('reconnecting');
          // Try reconnecting in 2.5 seconds
          if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
          reconnectTimeoutRef.current = setTimeout(() => {
            connectWs();
          }, 2500);
        } else {
          setSyncStatus('offline');
        }
      };

      ws.onerror = (err) => {
        console.warn('WebSocket connection error, will reconnect:', err);
        ws.close();
      };
    } catch (err) {
      console.error('Failed to construct WebSocket:', err);
      setSyncStatus('offline');
      // Fallback: fetch via HTTP
      fetchRoomState(roomId);
    }
  }, [roomId, roomName, deviceProfile, triggerPulse, fetchRoomState]);

  // Handle roomId change or initial mount
  useEffect(() => {
    isIntentionalCloseRef.current = false;
    fetchRoomState(roomId);
    connectWs();

    const handleOnline = () => {
      fetchRoomState(roomId);
      connectWs();
    };
    const handleOffline = () => setSyncStatus('offline');

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      isIntentionalCloseRef.current = true;
      if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
      if (heartbeatIntervalRef.current) clearInterval(heartbeatIntervalRef.current);
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [roomId, connectWs, fetchRoomState]);

  // Helper to send WS message with HTTP fallback
  const sendWsMessage = useCallback((type: string, payload: Record<string, unknown>) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type, ...payload }));
      return true;
    }
    return false;
  }, []);

  // Task Mutations
  const createTask = useCallback((taskData: Partial<Task>): Task => {
    const id = taskData.id || `task-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const fullTask: Task = {
      id,
      roomId,
      title: (taskData.title || 'Untitled Task').trim(),
      description: taskData.description || '',
      completed: !!taskData.completed,
      priority: taskData.priority || 'medium',
      category: taskData.category || 'General',
      dueDate: taskData.dueDate,
      subtasks: taskData.subtasks || [],
      tags: taskData.tags || [],
      createdByDeviceId: deviceProfile.deviceId,
      createdByName: deviceProfile.deviceName,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // Optimistic local update
    setTasks(prev => [fullTask, ...prev]);
    triggerPulse();

    const sent = sendWsMessage('task:create', { task: fullTask });
    if (!sent) {
      // Fallback via HTTP
      fetch(`/api/rooms/${encodeURIComponent(roomId)}/tasks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(fullTask),
      }).catch(err => console.error('HTTP create task failed:', err));
    }

    return fullTask;
  }, [roomId, deviceProfile, sendWsMessage, triggerPulse]);

  const updateTask = useCallback((taskId: string, updates: Partial<Task>) => {
    // Optimistic local update
    setTasks(prev =>
      prev.map(t => {
        if (t.id === taskId) {
          const updated = {
            ...t,
            ...updates,
            updatedAt: new Date().toISOString(),
            lastEditedBy: deviceProfile.deviceName,
          };
          if (updates.completed !== undefined) {
            updated.completedAt = updates.completed ? new Date().toISOString() : undefined;
          }
          return updated;
        }
        return t;
      })
    );
    triggerPulse();

    const sent = sendWsMessage('task:update', { taskId, updates });
    if (!sent) {
      fetch(`/api/rooms/${encodeURIComponent(roomId)}/tasks/${encodeURIComponent(taskId)}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...updates,
          editedByDeviceId: deviceProfile.deviceId,
          editedByName: deviceProfile.deviceName,
        }),
      }).catch(err => console.error('HTTP update task failed:', err));
    }
  }, [roomId, deviceProfile, sendWsMessage, triggerPulse]);

  const deleteTask = useCallback((taskId: string) => {
    // Optimistic removal
    setTasks(prev => prev.filter(t => t.id !== taskId));
    triggerPulse();

    const sent = sendWsMessage('task:delete', { taskId });
    if (!sent) {
      fetch(`/api/rooms/${encodeURIComponent(roomId)}/tasks/${encodeURIComponent(taskId)}?deviceId=${encodeURIComponent(deviceProfile.deviceId)}&deviceName=${encodeURIComponent(deviceProfile.deviceName)}`, {
        method: 'DELETE',
      }).catch(err => console.error('HTTP delete task failed:', err));
    }
  }, [roomId, deviceProfile, sendWsMessage, triggerPulse]);

  const reorderTasks = useCallback((orderedIds: string[]) => {
    setTasks(prev => {
      const map = new Map(prev.map(t => [t.id, t]));
      const next: Task[] = [];
      for (const id of orderedIds) {
        const item = map.get(id);
        if (item) {
          next.push(item);
          map.delete(id);
        }
      }
      map.forEach(item => next.push(item));
      return next;
    });

    sendWsMessage('task:reorder', { orderedIds });
  }, [sendWsMessage]);

  const clearCompleted = useCallback(() => {
    setTasks(prev => prev.filter(t => !t.completed));
    triggerPulse();

    fetch(`/api/rooms/${encodeURIComponent(roomId)}/clear-completed`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        deviceId: deviceProfile.deviceId,
        deviceName: deviceProfile.deviceName,
      }),
    }).catch(err => console.error('HTTP clear completed failed:', err));
  }, [roomId, deviceProfile, triggerPulse]);

  const renameRoom = useCallback((newName: string) => {
    setCurrentRoomName(newName);
    sendWsMessage('room:rename', { name: newName });
  }, [sendWsMessage]);

  const setEditingTask = useCallback((taskId: string | null) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: 'heartbeat', editingTaskId: taskId }));
    }
  }, []);

  return {
    tasks,
    currentRoomName,
    activeDevices,
    activity,
    syncStatus,
    lastSyncTime,
    syncPulse,
    latencyMs,
    createTask,
    updateTask,
    deleteTask,
    reorderTasks,
    clearCompleted,
    renameRoom,
    setEditingTask,
    refresh: () => fetchRoomState(roomId),
  };
}
