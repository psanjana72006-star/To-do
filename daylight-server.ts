import 'dotenv/config';
import express, { NextFunction, Request, Response } from 'express';
import crypto from 'crypto';
import fs from 'fs';
import http from 'http';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer } from 'vite';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dataDir = path.resolve(__dirname, 'data');
const dataFile = path.resolve(dataDir, 'daylight-store.json');

type Language = 'en' | 'kn' | 'hi' | 'te' | 'ta';
type Priority = 'low' | 'medium' | 'high' | 'urgent';
type Status = 'todo' | 'in_progress' | 'completed';

interface User {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
  language: Language;
  timezone: string;
  createdAt: string;
}

interface Task {
  id: string;
  userId: string;
  title: string;
  description: string;
  category: string;
  priority: Priority;
  status: Status;
  dueDate?: string;
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
}

interface Store {
  users: User[];
  tasks: Task[];
  sessions: Array<{ token: string; userId: string; createdAt: string }>;
}

const hashPassword = (password: string): string => {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.pbkdf2Sync(password, salt, 120000, 64, 'sha512').toString('hex');
  return `${salt}:${hash}`;
};

const matchesPassword = (password: string, value: string): boolean => {
  const [salt, expected] = value.split(':');
  if (!salt || !expected) return false;
  const actual = crypto.pbkdf2Sync(password, salt, 120000, 64, 'sha512');
  return crypto.timingSafeEqual(actual, Buffer.from(expected, 'hex'));
};

const createDefaultStore = (): Store => {
  const now = new Date().toISOString();
  const demo: User = {
    id: 'user-demo',
    name: 'Sanjana',
    email: 'demo@daylight.app',
    passwordHash: hashPassword('daylight123'),
    language: 'en',
    timezone: 'UTC',
    createdAt: now,
  };
  return {
    users: [demo],
    sessions: [],
    tasks: [
      { id: 'task-1', userId: demo.id, title: 'Finalize weekly planning brief', description: 'Review goals, blockers, and milestones for the next sprint.', category: 'Work', priority: 'high', status: 'in_progress', dueDate: new Date(Date.now() + 86400000).toISOString().slice(0, 10), createdAt: now, updatedAt: now },
      { id: 'task-2', userId: demo.id, title: 'Book a wellness check-in', description: 'Make a little room for a mindful break and a walk.', category: 'Health', priority: 'medium', status: 'todo', dueDate: new Date(Date.now() + 172800000).toISOString().slice(0, 10), createdAt: now, updatedAt: now },
      { id: 'task-3', userId: demo.id, title: 'Plan dinner with friends', description: 'Set the menu and confirm the grocery list.', category: 'Personal', priority: 'low', status: 'todo', dueDate: new Date(Date.now() - 86400000).toISOString().slice(0, 10), createdAt: now, updatedAt: now },
      { id: 'task-4', userId: demo.id, title: 'Send the design review', description: 'Share the presentation and collect feedback.', category: 'Design', priority: 'urgent', status: 'completed', createdAt: now, updatedAt: now, completedAt: now },
    ],
  };
};

let store = createDefaultStore();

function loadStore(): void {
  fs.mkdirSync(dataDir, { recursive: true });
  if (!fs.existsSync(dataFile)) {
    fs.writeFileSync(dataFile, JSON.stringify(store, null, 2), 'utf8');
    return;
  }
  try {
    const parsed = JSON.parse(fs.readFileSync(dataFile, 'utf8')) as Partial<Store>;
    store = {
      users: Array.isArray(parsed.users) && parsed.users.length ? parsed.users : store.users,
      tasks: Array.isArray(parsed.tasks) ? parsed.tasks : [],
      sessions: Array.isArray(parsed.sessions) ? parsed.sessions : [],
    };
  } catch (error) {
    console.error('Could not read Daylight data store.', error);
  }
}

function saveStore(): void {
  fs.mkdirSync(dataDir, { recursive: true });
  fs.writeFileSync(dataFile, JSON.stringify(store, null, 2), 'utf8');
}

function publicUser(user: User) {
  const { passwordHash, ...safeUser } = user;
  return safeUser;
}

type AuthRequest = Request & { user?: User };

function authenticate(req: AuthRequest, res: Response, next: NextFunction): void {
  const auth = req.headers.authorization;
  const token = auth?.startsWith('Bearer ') ? auth.slice(7) : '';
  const session = store.sessions.find((item) => item.token === token);
  const user = session && store.users.find((item) => item.id === session.userId);
  if (!user) {
    res.status(401).json({ error: 'Please sign in to continue.' });
    return;
  }
  req.user = user;
  next();
}

function tokenFor(userId: string): string {
  const token = crypto.randomBytes(32).toString('hex');
  store.sessions.push({ token, userId, createdAt: new Date().toISOString() });
  return token;
}

const app = express();
app.use(express.json({ limit: '100kb' }));

app.get('/api/health', (_req, res) => res.json({ ok: true, service: 'daylight' }));

app.post('/api/auth/register', (req, res) => {
  const name = String(req.body.name || '').trim();
  const email = String(req.body.email || '').trim().toLowerCase();
  const password = String(req.body.password || '');
  if (!name || !/^\S+@\S+\.\S+$/.test(email) || password.length < 8) {
    return res.status(400).json({ error: 'Enter a name, valid email, and password with at least 8 characters.' });
  }
  if (store.users.some((user) => user.email === email)) {
    return res.status(409).json({ error: 'An account with that email already exists.' });
  }
  const user: User = {
    id: `user-${crypto.randomUUID()}`,
    name,
    email,
    passwordHash: hashPassword(password),
    language: ['en', 'kn', 'hi', 'te', 'ta'].includes(req.body.language) ? req.body.language : 'en',
    timezone: String(req.body.timezone || 'UTC'),
    createdAt: new Date().toISOString(),
  };
  store.users.push(user);
  const token = tokenFor(user.id);
  saveStore();
  return res.status(201).json({ token, user: publicUser(user) });
});

app.post('/api/auth/login', (req, res) => {
  const email = String(req.body.email || '').trim().toLowerCase();
  const password = String(req.body.password || '');
  const user = store.users.find((item) => item.email === email);
  if (!user || !matchesPassword(password, user.passwordHash)) {
    return res.status(401).json({ error: 'Email or password is incorrect.' });
  }
  const token = tokenFor(user.id);
  saveStore();
  return res.json({ token, user: publicUser(user) });
});

app.post('/api/auth/logout', authenticate, (req: AuthRequest, res) => {
  const token = req.headers.authorization?.slice(7);
  store.sessions = store.sessions.filter((session) => session.token !== token);
  saveStore();
  res.json({ ok: true });
});

app.get('/api/auth/me', authenticate, (req: AuthRequest, res) => res.json({ user: publicUser(req.user as User) }));

app.patch('/api/auth/profile', authenticate, (req: AuthRequest, res) => {
  const user = req.user as User;
  const language = req.body.language;
  if (language && !['en', 'kn', 'hi', 'te', 'ta'].includes(language)) {
    return res.status(400).json({ error: 'Unsupported language.' });
  }
  user.name = typeof req.body.name === 'string' && req.body.name.trim() ? req.body.name.trim() : user.name;
  user.language = language || user.language;
  user.timezone = typeof req.body.timezone === 'string' ? req.body.timezone : user.timezone;
  saveStore();
  return res.json({ user: publicUser(user) });
});

app.get('/api/tasks', authenticate, (req: AuthRequest, res) => {
  const tasks = store.tasks
    .filter((task) => task.userId === req.user?.id)
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
  res.json({ tasks });
});

app.post('/api/tasks', authenticate, (req: AuthRequest, res) => {
  const title = String(req.body.title || '').trim();
  if (!title || title.length > 240) return res.status(400).json({ error: 'Task title is required and must be under 240 characters.' });
  const now = new Date().toISOString();
  const task: Task = {
    id: `task-${crypto.randomUUID()}`,
    userId: (req.user as User).id,
    title,
    description: String(req.body.description || '').slice(0, 5000),
    category: String(req.body.category || 'General').trim().slice(0, 80),
    priority: ['low', 'medium', 'high', 'urgent'].includes(req.body.priority) ? req.body.priority : 'medium',
    status: ['todo', 'in_progress', 'completed'].includes(req.body.status) ? req.body.status : 'todo',
    dueDate: /^\d{4}-\d{2}-\d{2}$/.test(String(req.body.dueDate || '')) ? req.body.dueDate : undefined,
    createdAt: now,
    updatedAt: now,
    completedAt: req.body.status === 'completed' ? now : undefined,
  };
  store.tasks.unshift(task);
  saveStore();
  return res.status(201).json(task);
});

app.patch('/api/tasks/:taskId', authenticate, (req: AuthRequest, res) => {
  const task = store.tasks.find((item) => item.id === req.params.taskId && item.userId === req.user?.id);
  if (!task) return res.status(404).json({ error: 'Task not found.' });
  if (req.body.title !== undefined) {
    const title = String(req.body.title).trim();
    if (!title || title.length > 240) return res.status(400).json({ error: 'Task title is required and must be under 240 characters.' });
    task.title = title;
  }
  if (req.body.description !== undefined) task.description = String(req.body.description).slice(0, 5000);
  if (req.body.category !== undefined) task.category = String(req.body.category).trim().slice(0, 80) || 'General';
  if (['low', 'medium', 'high', 'urgent'].includes(req.body.priority)) task.priority = req.body.priority;
  if (['todo', 'in_progress', 'completed'].includes(req.body.status)) {
    task.status = req.body.status;
    task.completedAt = task.status === 'completed' ? new Date().toISOString() : undefined;
  }
  if (req.body.dueDate === '' || req.body.dueDate === null) task.dueDate = undefined;
  else if (/^\d{4}-\d{2}-\d{2}$/.test(String(req.body.dueDate || ''))) task.dueDate = req.body.dueDate;
  task.updatedAt = new Date().toISOString();
  saveStore();
  return res.json(task);
});

app.delete('/api/tasks/:taskId', authenticate, (req: AuthRequest, res) => {
  const index = store.tasks.findIndex((item) => item.id === req.params.taskId && item.userId === req.user?.id);
  if (index < 0) return res.status(404).json({ error: 'Task not found.' });
  store.tasks.splice(index, 1);
  saveStore();
  return res.json({ ok: true });
});

app.post('/api/tasks/translate', authenticate, (_req, res) => {
  res.status(503).json({
    error: 'Task translation is not configured. Add a server-side translation provider before enabling translation.',
    configured: false,
  });
});

app.use((error: unknown, _req: Request, res: Response, _next: NextFunction) => {
  console.error('Request failed.', error);
  res.status(500).json({ error: 'An unexpected server error occurred.' });
});

const server = http.createServer(app);

async function start(): Promise<void> {
  const port = Number(process.env.PORT) || 3000;
  if (process.env.NODE_ENV === 'production' && fs.existsSync(path.resolve(__dirname, 'dist'))) {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req, res) => res.sendFile(path.resolve(__dirname, 'dist', 'index.html')));
  } else {
    const vite = await createServer({ server: { middlewareMode: true }, appType: 'spa' });
    app.use(vite.middlewares);
  }
  server.listen(port, '0.0.0.0', () => console.log(`Daylight running at http://localhost:${port}`));
}

loadStore();
void start().catch((error) => {
  console.error('Could not start Daylight.', error);
  process.exit(1);
});
