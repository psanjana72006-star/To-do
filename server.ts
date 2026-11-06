import express from 'express';
import http from 'http';
import { WebSocketServer, WebSocket } from 'ws';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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
  priority: 'low' | 'medium' | 'high' | 'urgent';
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

// In-memory data store with file persistence
const dataDir = path.resolve(__dirname, 'data');
const dataFilePath = path.resolve(dataDir, 'rooms-data.json');

const rooms: Map<string, RoomState> = new Map();

// Helper to seed default rooms
function seedDefaultRooms() {
  const defaultTasks: Task[] = [
    {
      id: 'task-1',
      roomId: 'main',
      title: 'Sync across phone & laptop',
      description: 'Scan the QR code or open this link on another device to test live real-time synchronization!',
      completed: false,
      priority: 'urgent',
      category: 'Work',
      dueDate: new Date(Date.now() + 86400000 * 2).toISOString().slice(0, 10),
      subtasks: [
        { id: 'sub-1-1', title: 'Open QR Code modal', completed: true },
        { id: 'sub-1-2', title: 'Open URL on mobile phone or second browser tab', completed: false },
        { id: 'sub-1-3', title: 'Check a task on one device and watch it tick instantly on the other', completed: false }
      ],
      tags: ['Sync', 'Realtime', 'Demo'],
      createdByDeviceId: 'system',
      createdByName: 'SyncEngine',
      createdAt: new Date(Date.now() - 3600000).toISOString(),
      updatedAt: new Date(Date.now() - 3600000).toISOString()
    },
    {
      id: 'task-2',
      roomId: 'main',
      title: 'Finalize quarterly product launch deck',
      description: 'Include Q3 sprint metrics, user feedback survey, and product roadmap milestones.',
      completed: false,
      priority: 'high',
      category: 'Work',
      dueDate: new Date(Date.now() + 86400000).toISOString().slice(0, 10),
      subtasks: [
        { id: 'sub-2-1', title: 'Draft key metrics slide', completed: true },
        { id: 'sub-2-2', title: 'Embed customer testimonial quotes', completed: true },
        { id: 'sub-2-3', title: 'Review with engineering leads', completed: false }
      ],
      tags: ['Presentation', 'Launch'],
      createdByDeviceId: 'system',
      createdByName: 'Team Alpha',
      createdAt: new Date(Date.now() - 7200000).toISOString(),
      updatedAt: new Date(Date.now() - 7200000).toISOString()
    },
    {
      id: 'task-3',
      roomId: 'main',
      title: 'Farmers market groceries',
      description: 'Get fresh organic produce for dinner tonight.',
      completed: false,
      priority: 'medium',
      category: 'Personal',
      dueDate: new Date().toISOString().slice(0, 10),
      subtasks: [
        { id: 'sub-3-1', title: 'Sourdough loaf', completed: true },
        { id: 'sub-3-2', title: 'Honeycrisp apples', completed: false },
        { id: 'sub-3-3', title: 'Fresh rosemary & basil', completed: false }
      ],
      tags: ['Groceries', 'Cooking'],
      createdByDeviceId: 'system',
      createdByName: 'Home Sync',
      createdAt: new Date(Date.now() - 14400000).toISOString(),
      updatedAt: new Date(Date.now() - 14400000).toISOString()
    },
    {
      id: 'task-4',
      roomId: 'main',
      title: 'Set up automated data backup workflow',
      description: 'Verify encryption keys and verify cold-storage integrity.',
      completed: true,
      completedAt: new Date(Date.now() - 1800000).toISOString(),
      priority: 'low',
      category: 'Tech',
      subtasks: [],
      tags: ['DevOps', 'Security'],
      createdByDeviceId: 'system',
      createdByName: 'DevOps Bot',
      createdAt: new Date(Date.now() - 86400000).toISOString(),
      updatedAt: new Date(Date.now() - 1800000).toISOString()
    }
  ];

  rooms.set('main', {
    id: 'main',
    name: 'General Tasks',
    createdAt: new Date().toISOString(),
    tasks: defaultTasks,
    activity: [
      {
        id: 'act-1',
        deviceId: 'system',
        deviceName: 'SyncEngine',
        action: 'created task',
        taskTitle: 'Sync across phone & laptop',
        timestamp: new Date(Date.now() - 3600000).toISOString()
      },
      {
        id: 'act-2',
        deviceId: 'system',
        deviceName: 'DevOps Bot',
        action: 'completed task',
        taskTitle: 'Set up automated data backup workflow',
        timestamp: new Date(Date.now() - 1800000).toISOString()
      }
    ]
  });
}

// Load data if available
try {
  if (fs.existsSync(dataFilePath)) {
    const raw = fs.readFileSync(dataFilePath, 'utf-8');
    const parsed = JSON.parse(raw);
    for (const key of Object.keys(parsed)) {
      rooms.set(key, parsed[key]);
    }
  }
} catch (err) {
  console.warn('Could not load saved room data, initializing defaults', err);
}

if (!rooms.has('main')) {
  seedDefaultRooms();
}

function saveRoomsToDisk() {
  try {
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
    const obj: Record<string, RoomState> = {};
    rooms.forEach((val, key) => {
      obj[key] = val;
    });
    fs.writeFileSync(dataFilePath, JSON.stringify(obj, null, 2), 'utf-8');
  } catch (err) {
    console.error('Failed to save room data to disk:', err);
  }
}

function getOrCreateRoom(roomId: string, roomName?: string): RoomState {
  const normalizedId = roomId.trim().toLowerCase() || 'main';
  let room = rooms.get(normalizedId);
  if (!room) {
    room = {
      id: normalizedId,
      name: roomName || (normalizedId === 'main' ? 'General Tasks' : `List ${normalizedId}`),
      createdAt: new Date().toISOString(),
      tasks: [],
      activity: []
    };
    rooms.set(normalizedId, room);
    saveRoomsToDisk();
  }
  return room;
}

// WebSocket Connection Tracker
interface ClientSession {
  ws: WebSocket;
  roomId: string;
  deviceId: string;
  deviceName: string;
  deviceType: 'mobile' | 'desktop' | 'tablet';
  color: string;
  lastSeen: number;
  editingTaskId?: string | null;
}

const clients = new Map<WebSocket, ClientSession>();

function getActiveDevicesForRoom(roomId: string): ActiveDevice[] {
  const list: ActiveDevice[] = [];
  const seenDeviceIds = new Set<string>();

  for (const session of clients.values()) {
    if (session.roomId === roomId && !seenDeviceIds.has(session.deviceId)) {
      seenDeviceIds.add(session.deviceId);
      list.push({
        deviceId: session.deviceId,
        deviceName: session.deviceName,
        deviceType: session.deviceType,
        color: session.color,
        lastSeen: new Date(session.lastSeen).toISOString(),
        editingTaskId: session.editingTaskId
      });
    }
  }
  return list;
}

function broadcastToRoom(roomId: string, message: object, excludeWs?: WebSocket) {
  const payload = JSON.stringify(message);
  for (const [ws, session] of clients.entries()) {
    if (session.roomId === roomId && ws.readyState === WebSocket.OPEN && ws !== excludeWs) {
      try {
        ws.send(payload);
      } catch (err) {
        console.error('WebSocket send error:', err);
      }
    }
  }
}

function broadcastPresence(roomId: string) {
  const activeDevices = getActiveDevicesForRoom(roomId);
  broadcastToRoom(roomId, {
    type: 'presence:update',
    roomId,
    activeDevices
  });
}

function recordActivity(room: RoomState, deviceId: string, deviceName: string, action: string, taskTitle: string) {
  const activityItem: ActivityItem = {
    id: `act-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    deviceId,
    deviceName,
    action,
    taskTitle,
    timestamp: new Date().toISOString()
  };
  room.activity.unshift(activityItem);
  if (room.activity.length > 50) {
    room.activity.pop();
  }
  saveRoomsToDisk();
  broadcastToRoom(room.id, {
    type: 'activity:new',
    activity: activityItem
  });
}

const app = express();
app.use(express.json());

// API Endpoints
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

// Get room details
app.get('/api/rooms/:roomId', (req, res) => {
  const roomId = req.params.roomId;
  const room = getOrCreateRoom(roomId);
  const activeDevices = getActiveDevicesForRoom(room.id);
  res.json({
    room,
    activeDevices
  });
});

// Create task via HTTP (optional alternative to WS)
app.post('/api/rooms/:roomId/tasks', (req, res) => {
  const { roomId } = req.params;
  const room = getOrCreateRoom(roomId);
  const taskData = req.body;

  const newTask: Task = {
    id: taskData.id || `task-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    roomId: room.id,
    title: taskData.title?.trim() || 'Untitled Task',
    description: taskData.description || '',
    completed: !!taskData.completed,
    priority: taskData.priority || 'medium',
    category: taskData.category || 'General',
    dueDate: taskData.dueDate || undefined,
    subtasks: Array.isArray(taskData.subtasks) ? taskData.subtasks : [],
    tags: Array.isArray(taskData.tags) ? taskData.tags : [],
    createdByDeviceId: taskData.createdByDeviceId || 'anonymous',
    createdByName: taskData.createdByName || 'Anonymous Device',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  room.tasks.unshift(newTask);
  saveRoomsToDisk();

  recordActivity(room, newTask.createdByDeviceId, newTask.createdByName, 'created task', newTask.title);

  broadcastToRoom(room.id, {
    type: 'task:created',
    task: newTask
  });

  res.status(201).json(newTask);
});

// Update task via HTTP
app.patch('/api/rooms/:roomId/tasks/:taskId', (req, res) => {
  const { roomId, taskId } = req.params;
  const room = getOrCreateRoom(roomId);
  const taskIndex = room.tasks.findIndex(t => t.id === taskId);

  if (taskIndex === -1) {
    return res.status(404).json({ error: 'Task not found' });
  }

  const existingTask = room.tasks[taskIndex];
  const updates = req.body;
  const deviceName = updates.editedByName || 'Device';
  const deviceId = updates.editedByDeviceId || 'device';

  // Check state transitions for activity log
  if (updates.completed !== undefined && updates.completed !== existingTask.completed) {
    if (updates.completed) {
      updates.completedAt = new Date().toISOString();
      recordActivity(room, deviceId, deviceName, 'completed task', existingTask.title);
    } else {
      updates.completedAt = undefined;
      recordActivity(room, deviceId, deviceName, 'reopened task', existingTask.title);
    }
  }

  const updatedTask: Task = {
    ...existingTask,
    ...updates,
    updatedAt: new Date().toISOString()
  };

  room.tasks[taskIndex] = updatedTask;
  saveRoomsToDisk();

  broadcastToRoom(room.id, {
    type: 'task:updated',
    task: updatedTask
  });

  res.json(updatedTask);
});

// Delete task via HTTP
app.delete('/api/rooms/:roomId/tasks/:taskId', (req, res) => {
  const { roomId, taskId } = req.params;
  const room = getOrCreateRoom(roomId);
  const taskIndex = room.tasks.findIndex(t => t.id === taskId);

  if (taskIndex === -1) {
    return res.status(404).json({ error: 'Task not found' });
  }

  const [removedTask] = room.tasks.splice(taskIndex, 1);
  saveRoomsToDisk();

  const deviceId = (req.query.deviceId as string) || 'device';
  const deviceName = (req.query.deviceName as string) || 'Device';
  recordActivity(room, deviceId, deviceName, 'deleted task', removedTask.title);

  broadcastToRoom(room.id, {
    type: 'task:deleted',
    taskId: removedTask.id
  });

  res.json({ success: true, taskId });
});

// Clear completed tasks
app.post('/api/rooms/:roomId/clear-completed', (req, res) => {
  const { roomId } = req.params;
  const room = getOrCreateRoom(roomId);
  const beforeCount = room.tasks.length;
  room.tasks = room.tasks.filter(t => !t.completed);
  const removedCount = beforeCount - room.tasks.length;
  saveRoomsToDisk();

  const deviceId = req.body.deviceId || 'device';
  const deviceName = req.body.deviceName || 'Device';
  if (removedCount > 0) {
    recordActivity(room, deviceId, deviceName, `cleared ${removedCount} completed tasks`, 'Multiple tasks');
  }

  broadcastToRoom(room.id, {
    type: 'tasks:cleared_completed',
    tasks: room.tasks
  });

  res.json({ success: true, removedCount });
});

// Server setup
const server = http.createServer(app);
const wss = new WebSocketServer({ noServer: true });

// Handle WebSocket connections
wss.on('connection', (ws: WebSocket, req) => {
  // Wait for client to send 'join' message
  ws.on('message', (data: string) => {
    try {
      const message = JSON.parse(data.toString());

      switch (message.type) {
        case 'join': {
          const { roomId = 'main', deviceId, deviceName, deviceType = 'desktop', color = '#3b82f6', roomName } = message;
          const room = getOrCreateRoom(roomId, roomName);

          const session: ClientSession = {
            ws,
            roomId: room.id,
            deviceId: deviceId || `device-${Math.random().toString(36).substring(2, 7)}`,
            deviceName: deviceName || 'Collaborator',
            deviceType,
            color,
            lastSeen: Date.now()
          };
          clients.set(ws, session);

          // Send initial state to the newly joined client
          ws.send(
            JSON.stringify({
              type: 'init',
              room,
              activeDevices: getActiveDevicesForRoom(room.id)
            })
          );

          // Broadcast presence update to everyone in this room
          broadcastPresence(room.id);
          break;
        }

        case 'heartbeat': {
          const session = clients.get(ws);
          if (session) {
            session.lastSeen = Date.now();
            session.editingTaskId = message.editingTaskId || null;
            broadcastPresence(session.roomId);
          }
          break;
        }

        case 'task:create': {
          const session = clients.get(ws);
          if (!session) return;
          const room = getOrCreateRoom(session.roomId);
          const taskData = message.task;

          // Check idempotency
          if (room.tasks.some(t => t.id === taskData.id)) {
            return;
          }

          const newTask: Task = {
            id: taskData.id || `task-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
            roomId: room.id,
            title: (taskData.title || 'New Task').trim(),
            description: taskData.description || '',
            completed: !!taskData.completed,
            priority: taskData.priority || 'medium',
            category: taskData.category || 'General',
            dueDate: taskData.dueDate || undefined,
            subtasks: Array.isArray(taskData.subtasks) ? taskData.subtasks : [],
            tags: Array.isArray(taskData.tags) ? taskData.tags : [],
            createdByDeviceId: session.deviceId,
            createdByName: session.deviceName,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          };

          room.tasks.unshift(newTask);
          saveRoomsToDisk();

          recordActivity(room, session.deviceId, session.deviceName, 'created task', newTask.title);

          // Broadcast to all clients in this room (including sender to confirm ID / timestamp)
          broadcastToRoom(room.id, {
            type: 'task:created',
            task: newTask
          });
          break;
        }

        case 'task:update': {
          const session = clients.get(ws);
          if (!session) return;
          const room = getOrCreateRoom(session.roomId);
          const { taskId, updates } = message;
          const taskIndex = room.tasks.findIndex(t => t.id === taskId);
          if (taskIndex === -1) return;

          const existing = room.tasks[taskIndex];

          // Activity check
          if (updates.completed !== undefined && updates.completed !== existing.completed) {
            if (updates.completed) {
              updates.completedAt = new Date().toISOString();
              recordActivity(room, session.deviceId, session.deviceName, 'completed task', existing.title);
            } else {
              updates.completedAt = undefined;
              recordActivity(room, session.deviceId, session.deviceName, 'reopened task', existing.title);
            }
          }

          const updatedTask: Task = {
            ...existing,
            ...updates,
            lastEditedBy: session.deviceName,
            updatedAt: new Date().toISOString()
          };

          room.tasks[taskIndex] = updatedTask;
          saveRoomsToDisk();

          broadcastToRoom(room.id, {
            type: 'task:updated',
            task: updatedTask
          });
          break;
        }

        case 'task:delete': {
          const session = clients.get(ws);
          if (!session) return;
          const room = getOrCreateRoom(session.roomId);
          const { taskId } = message;
          const idx = room.tasks.findIndex(t => t.id === taskId);
          if (idx !== -1) {
            const [deleted] = room.tasks.splice(idx, 1);
            saveRoomsToDisk();
            recordActivity(room, session.deviceId, session.deviceName, 'deleted task', deleted.title);
            broadcastToRoom(room.id, {
              type: 'task:deleted',
              taskId
            });
          }
          break;
        }

        case 'task:reorder': {
          const session = clients.get(ws);
          if (!session) return;
          const room = getOrCreateRoom(session.roomId);
          const { orderedIds } = message;
          if (Array.isArray(orderedIds)) {
            const taskMap = new Map(room.tasks.map(t => [t.id, t]));
            const reordered: Task[] = [];
            for (const id of orderedIds) {
              const t = taskMap.get(id);
              if (t) {
                reordered.push(t);
                taskMap.delete(id);
              }
            }
            // Append any remaining
            taskMap.forEach(t => reordered.push(t));
            room.tasks = reordered;
            saveRoomsToDisk();

            broadcastToRoom(
              room.id,
              {
                type: 'task:reordered',
                orderedIds
              },
              ws
            );
          }
          break;
        }

        case 'room:rename': {
          const session = clients.get(ws);
          if (!session) return;
          const room = getOrCreateRoom(session.roomId);
          if (message.name && message.name.trim()) {
            room.name = message.name.trim();
            saveRoomsToDisk();
            broadcastToRoom(room.id, {
              type: 'room:renamed',
              name: room.name
            });
          }
          break;
        }
      }
    } catch (err) {
      console.error('Error handling WebSocket message:', err);
    }
  });

  ws.on('close', () => {
    const session = clients.get(ws);
    if (session) {
      const roomId = session.roomId;
      clients.delete(ws);
      broadcastPresence(roomId);
    }
  });

  ws.on('error', (err) => {
    console.error('WebSocket client error:', err);
  });
});

// Periodic ping / cleanup dead connections
const heartbeatInterval = setInterval(() => {
  const now = Date.now();
  for (const [ws, session] of clients.entries()) {
    if (ws.readyState === WebSocket.OPEN) {
      // Send ping
      ws.ping();
      // If inactive for over 60 seconds
      if (now - session.lastSeen > 60000) {
        clients.delete(ws);
        broadcastPresence(session.roomId);
      }
    } else {
      clients.delete(ws);
    }
  }
}, 25000);

heartbeatInterval.unref();

// Upgrade handling for /api/ws
server.on('upgrade', (request, socket, head) => {
  try {
    const url = new URL(request.url || '', `http://${request.headers.host || 'localhost'}`);
    if (url.pathname === '/api/ws' || url.pathname === '/ws') {
      wss.handleUpgrade(request, socket, head, (ws) => {
        wss.emit('connection', ws, request);
      });
    } else {
      // In dev mode, Vite HMR may handle WebSocket upgrades
      // Do nothing to let Vite handle its own websocket if needed
    }
  } catch (err) {
    console.error('Upgrade error:', err);
    socket.destroy();
  }
});

// Mount Vite or static server
async function setupViteOrStatic() {
  const port = Number(process.env.PORT) || 3000;

  if (process.env.NODE_ENV === 'production' && fs.existsSync(path.resolve(__dirname, 'dist'))) {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  } else {
    const { createServer } = await import('vite');
    const vite = await createServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  }

  server.listen(port, '0.0.0.0', () => {
    console.log(`SyncTask Server running on http://0.0.0.0:${port}`);
  });
}

setupViteOrStatic().catch(err => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
