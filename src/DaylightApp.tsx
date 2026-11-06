import { FormEvent, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ArrowDownUp, CalendarDays, Check, CheckCircle2, Circle, Clock3, Languages, ListTodo, LogOut, Plus, Search, Sparkles, Target, Trash2, X } from 'lucide-react';

type Language = 'en' | 'kn' | 'hi' | 'te' | 'ta';
type Status = 'todo' | 'in_progress' | 'completed';
type Priority = 'low' | 'medium' | 'high' | 'urgent';
type View = 'today' | 'upcoming' | 'all' | 'completed' | 'overdue';

interface User {
  id: string;
  name: string;
  email: string;
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

interface TaskForm {
  title: string;
  description: string;
  category: string;
  priority: Priority;
  status: Status;
  dueDate: string;
}

interface ApiResponse<T> {
  data?: T;
  error?: string;
}

const SESSION_KEY = 'daylight-session';
const languageChoices: Array<{ code: Language; label: string }> = [
  { code: 'en', label: 'English' },
  { code: 'kn', label: 'ಕನ್ನಡ' },
  { code: 'hi', label: 'हिन्दी' },
  { code: 'te', label: 'తెలుగు' },
  { code: 'ta', label: 'தமிழ்' },
];
const priorities: Priority[] = ['low', 'medium', 'high', 'urgent'];
const priorityWeight: Record<Priority, number> = { low: 1, medium: 2, high: 3, urgent: 4 };
const blankForm: TaskForm = { title: '', description: '', category: 'General', priority: 'medium', status: 'todo', dueDate: '' };

async function request<T>(path: string, token?: string, init: RequestInit = {}): Promise<T> {
  const response = await fetch(path, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...init.headers,
    },
  });
  const body = await response.json().catch(() => ({})) as ApiResponse<T> & T;
  if (!response.ok) throw new Error(body.error || 'Request failed.');
  return body as T;
}

function localDate(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
}

function shortDate(value: string | undefined, language: string): string {
  if (!value) return '';
  const date = new Date(`${value}T12:00:00`);
  return new Intl.DateTimeFormat(language, { month: 'short', day: 'numeric' }).format(date);
}

function messageFrom(error: unknown): string {
  return error instanceof Error ? error.message : 'Something went wrong.';
}

export default function DaylightApp() {
  const { t, i18n } = useTranslation();
  const [token, setToken] = useState(() => localStorage.getItem(SESSION_KEY) || '');
  const [user, setUser] = useState<User | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [authForm, setAuthForm] = useState({ name: '', email: 'demo@daylight.app', password: 'daylight123' });
  const [notice, setNotice] = useState<{ text: string; tone: 'success' | 'error' } | null>(null);
  const [view, setView] = useState<View>('today');
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState<'all' | Priority>('all');
  const [sortBy, setSortBy] = useState<'date' | 'priority' | 'updated'>('date');
  const [quickTitle, setQuickTitle] = useState('');
  const [editorOpen, setEditorOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<TaskForm>(blankForm);

  const refreshTasks = async (activeToken = token) => {
    const response = await request<{ tasks: Task[] }>('/api/tasks', activeToken);
    setTasks(response.tasks);
  };

  useEffect(() => {
    if (!token) {
      setLoading(false);
      setUser(null);
      return;
    }
    let mounted = true;
    setLoading(true);
    Promise.all([
      request<{ user: User }>('/api/auth/me', token),
      request<{ tasks: Task[] }>('/api/tasks', token),
    ]).then(([profile, taskData]) => {
      if (!mounted) return;
      setUser(profile.user);
      setTasks(taskData.tasks);
      void i18n.changeLanguage(profile.user.language || 'en');
    }).catch(() => {
      if (!mounted) return;
      localStorage.removeItem(SESSION_KEY);
      setToken('');
      setUser(null);
      setTasks([]);
    }).finally(() => {
      if (mounted) setLoading(false);
    });
    return () => { mounted = false; };
  }, [token, i18n]);

  const today = localDate();
  const categories = useMemo(() => [...new Set(tasks.map((task) => task.category).filter(Boolean))].sort(), [tasks]);
  const counts = useMemo(() => {
    const done = tasks.filter((task) => task.status === 'completed').length;
    const dueToday = tasks.filter((task) => task.status !== 'completed' && task.dueDate === today).length;
    const overdue = tasks.filter((task) => task.status !== 'completed' && task.dueDate && task.dueDate < today).length;
    return { done, dueToday, overdue, total: tasks.length, progress: tasks.length ? Math.round((done / tasks.length) * 100) : 0 };
  }, [tasks, today]);

  const visibleTasks = useMemo(() => {
    const query = search.trim().toLocaleLowerCase();
    return [...tasks].filter((task) => {
      if (view === 'today' && (task.status === 'completed' || task.dueDate !== today)) return false;
      if (view === 'upcoming' && (task.status === 'completed' || !task.dueDate || task.dueDate <= today)) return false;
      if (view === 'completed' && task.status !== 'completed') return false;
      if (view === 'overdue' && (task.status === 'completed' || !task.dueDate || task.dueDate >= today)) return false;
      if (categoryFilter !== 'all' && task.category !== categoryFilter) return false;
      if (priorityFilter !== 'all' && task.priority !== priorityFilter) return false;
      if (query && !`${task.title} ${task.description} ${task.category}`.toLocaleLowerCase().includes(query)) return false;
      return true;
    }).sort((a, b) => {
      if (sortBy === 'priority') return priorityWeight[b.priority] - priorityWeight[a.priority];
      if (sortBy === 'updated') return b.updatedAt.localeCompare(a.updatedAt);
      return (a.dueDate || '9999-12-31').localeCompare(b.dueDate || '9999-12-31');
    });
  }, [tasks, view, today, categoryFilter, priorityFilter, search, sortBy]);

  const greetingKey = new Date().getHours() < 12 ? 'dashboard.morning' : new Date().getHours() < 18 ? 'dashboard.afternoon' : 'dashboard.evening';
  const dateLabel = new Intl.DateTimeFormat(i18n.language, { weekday: 'long', month: 'long', day: 'numeric' }).format(new Date());

  const showNotice = (text: string, tone: 'success' | 'error' = 'success') => {
    setNotice({ text, tone });
    window.setTimeout(() => setNotice(null), 4200);
  };

  const onAuthSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setBusy(true);
    try {
      const endpoint = authMode === 'login' ? '/api/auth/login' : '/api/auth/register';
      const payload = authMode === 'login'
        ? { email: authForm.email, password: authForm.password }
        : { name: authForm.name, email: authForm.email, password: authForm.password, language: i18n.language, timezone: Intl.DateTimeFormat().resolvedOptions().timeZone };
      const response = await request<{ token: string; user: User }>(endpoint, undefined, { method: 'POST', body: JSON.stringify(payload) });
      localStorage.setItem(SESSION_KEY, response.token);
      setToken(response.token);
      setUser(response.user);
      void i18n.changeLanguage(response.user.language || 'en');
      showNotice(t(authMode === 'login' ? 'message.signedIn' : 'message.registered'));
    } catch (error) {
      showNotice(messageFrom(error), 'error');
    } finally {
      setBusy(false);
    }
  };

  const changeLanguage = async (language: Language) => {
    if (!user) return;
    try {
      const response = await request<{ user: User }>('/api/auth/profile', token, {
        method: 'PATCH', body: JSON.stringify({ language }),
      });
      setUser(response.user);
      await i18n.changeLanguage(language);
    } catch (error) {
      showNotice(messageFrom(error), 'error');
    }
  };

  const submitTask = async (event: FormEvent) => {
    event.preventDefault();
    if (!form.title.trim()) {
      showNotice(t('message.titleRequired'), 'error');
      return;
    }
    setBusy(true);
    const payload = { ...form, title: form.title.trim(), dueDate: form.dueDate || undefined };
    try {
      if (editingId) {
        await request(`/api/tasks/${editingId}`, token, { method: 'PATCH', body: JSON.stringify(payload) });
        showNotice(t('message.updated'));
      } else {
        await request('/api/tasks', token, { method: 'POST', body: JSON.stringify(payload) });
        showNotice(t('message.created'));
      }
      setEditorOpen(false);
      setForm(blankForm);
      setEditingId(null);
      await refreshTasks();
    } catch (error) {
      showNotice(messageFrom(error), 'error');
    } finally {
      setBusy(false);
    }
  };

  const quickAdd = async (event: FormEvent) => {
    event.preventDefault();
    if (!quickTitle.trim()) return;
    try {
      await request('/api/tasks', token, { method: 'POST', body: JSON.stringify({ ...blankForm, title: quickTitle.trim() }) });
      setQuickTitle('');
      showNotice(t('message.created'));
      await refreshTasks();
    } catch (error) {
      showNotice(messageFrom(error), 'error');
    }
  };

  const toggleTask = async (task: Task) => {
    try {
      await request(`/api/tasks/${task.id}`, token, { method: 'PATCH', body: JSON.stringify({ status: task.status === 'completed' ? 'todo' : 'completed' }) });
      await refreshTasks();
    } catch (error) {
      showNotice(messageFrom(error), 'error');
    }
  };

  const deleteTask = async (task: Task) => {
    if (!window.confirm(t('task.confirmDelete'))) return;
    try {
      await request(`/api/tasks/${task.id}`, token, { method: 'DELETE' });
      showNotice(t('message.deleted'));
      await refreshTasks();
    } catch (error) {
      showNotice(messageFrom(error), 'error');
    }
  };

  const editTask = (task: Task) => {
    setEditingId(task.id);
    setForm({ title: task.title, description: task.description, category: task.category, priority: task.priority, status: task.status, dueDate: task.dueDate || '' });
    setEditorOpen(true);
  };

  const signOut = async () => {
    try {
      await request('/api/auth/logout', token, { method: 'POST' });
    } catch {
      // Clear local session even when the network is unavailable.
    }
    localStorage.removeItem(SESSION_KEY);
    setToken('');
    setUser(null);
    setTasks([]);
  };

  if (loading) {
    return <main className="min-h-screen grid place-items-center bg-[#FFFDF7]"><div className="daylight-loader"><Sparkles size={20} /><span>{t('auth.loading')}</span></div></main>;
  }

  if (!user) {
    return (
      <main className="auth-page">
        <section className="auth-shell">
          <div className="auth-art">
            <div className="brand-mark"><Sparkles size={17} /><span>{t('app')}</span></div>
            <p className="auth-eyebrow">{t('auth.eyebrow')}</p>
            <h1>{t('auth.title')}</h1>
            <p className="auth-copy">{t('auth.subtitle')}</p>
            <div className="auth-art-foot"><div className="sun-stamp"><Target size={23} /></div><span>Make today feel a little lighter.</span></div>
          </div>
          <div className="auth-form-panel">
            <div className="auth-locale">
              <Languages size={17} />
              <select aria-label={t('dashboard.language')} value={i18n.language} onChange={(event) => void i18n.changeLanguage(event.target.value)}>
                {languageChoices.map((choice) => <option key={choice.code} value={choice.code}>{choice.label}</option>)}
              </select>
            </div>
            <span className="section-kicker">DAYLIGHT / 01</span>
            <h2>{t(authMode === 'login' ? 'auth.login' : 'auth.register')}</h2>
            <p className="muted">A thoughtful little space for your everyday.</p>
            {notice && <div className={`notice ${notice.tone}`}>{notice.text}</div>}
            <form className="auth-fields" onSubmit={onAuthSubmit}>
              {authMode === 'register' && <label>{t('auth.name')}<input autoComplete="name" value={authForm.name} onChange={(event) => setAuthForm({ ...authForm, name: event.target.value })} required /></label>}
              <label>{t('auth.email')}<input type="email" autoComplete="email" value={authForm.email} onChange={(event) => setAuthForm({ ...authForm, email: event.target.value })} required /></label>
              <label>{t('auth.password')}<input type="password" autoComplete={authMode === 'login' ? 'current-password' : 'new-password'} minLength={authMode === 'register' ? 8 : 1} value={authForm.password} onChange={(event) => setAuthForm({ ...authForm, password: event.target.value })} required /></label>
              <button className="primary-button auth-submit" disabled={busy}>{busy ? t('auth.loading') : t(authMode === 'login' ? 'auth.submitLogin' : 'auth.submitRegister')}</button>
            </form>
            <button className="text-button auth-switch" onClick={() => { setAuthMode(authMode === 'login' ? 'register' : 'login'); setNotice(null); }}>{t(authMode === 'login' ? 'auth.switchRegister' : 'auth.switchLogin')}</button>
            <button className="demo-login" onClick={() => setAuthForm({ name: 'Sanjana', email: 'demo@daylight.app', password: 'daylight123' })}>{t('auth.demo')} <span>↗</span></button>
          </div>
        </section>
        {notice && <div className={`toast ${notice.tone}`}>{notice.text}</div>}
      </main>
    );
  }

  const navItems: Array<{ id: View; label: string; icon: typeof CalendarDays; count?: number }> = [
    { id: 'today', label: t('nav.today'), icon: CalendarDays, count: counts.dueToday },
    { id: 'upcoming', label: t('nav.upcoming'), icon: Clock3 },
    { id: 'all', label: t('nav.all'), icon: ListTodo, count: tasks.length },
    { id: 'completed', label: t('nav.completed'), icon: CheckCircle2, count: counts.done },
    { id: 'overdue', label: t('nav.overdue'), icon: CalendarDays, count: counts.overdue },
  ];

  return (
    <main className="app-frame">
      <aside className="sidebar">
        <a className="brand-mark sidebar-brand" href="#today"><span className="brand-icon"><Sparkles size={17} /></span><span>{t('app')}</span></a>
        <div className="workspace-label">{t('dashboard.profile')}</div>
        <div className="profile-chip"><span className="avatar">{user.name.slice(0, 1).toUpperCase()}</span><span><strong>{user.name}</strong><small>{user.email}</small></span></div>
        <div className="workspace-label nav-label">YOUR DAY</div>
        <nav className="side-nav" aria-label="Task views">
          {navItems.map(({ id, label, icon: Icon, count }) => <button key={id} className={view === id ? 'side-link active' : 'side-link'} onClick={() => setView(id)}><Icon size={17} /><span>{label}</span>{count !== undefined && <small>{count}</small>}</button>)}
        </nav>
        {categories.length > 0 && <><div className="workspace-label nav-label">{t('nav.categories')}</div><div className="category-list">{categories.map((category) => <button key={category} className={categoryFilter === category ? 'category-link selected' : 'category-link'} onClick={() => { setCategoryFilter(categoryFilter === category ? 'all' : category); setView('all'); }}><span className="category-dot" />{category}</button>)}</div></>}
        <div className="sidebar-bottom">
          <label className="language-setting"><span><Languages size={16} />{t('dashboard.language')}</span><select value={user.language} onChange={(event) => void changeLanguage(event.target.value as Language)} aria-label={t('dashboard.language')}>{languageChoices.map((choice) => <option key={choice.code} value={choice.code}>{choice.label}</option>)}</select></label>
          <button className="side-link signout" onClick={() => void signOut()}><LogOut size={17} /><span>{t('dashboard.logout')}</span></button>
        </div>
      </aside>

      <section className="main-panel">
        <header className="topbar"><div><span className="date-line">{dateLabel}</span><span className="topbar-dot" /> <span className="sync-caption">{t('dashboard.summary')}</span></div><button className="primary-button top-add" onClick={() => { setEditingId(null); setForm(blankForm); setEditorOpen(true); }}><Plus size={16} />{t('task.new')}</button></header>
        <div className="content-wrap">
          <div className="page-heading"><div><span className="section-kicker">{t('dashboard.yourDay')}</span><h1>{t(greetingKey)}, {user.name.split(' ')[0]}.</h1><p>{t('dashboard.summary')}</p></div><div className="heading-sun"><Sparkles size={21} /></div></div>

          <section className="overview-grid" aria-label={t('dashboard.yourDay')}>
            <div className="overview-card main-overview"><div className="overview-card-top"><div><span className="stat-label">{t('dashboard.progress')}</span><strong>{counts.progress}<small>%</small></strong></div><div className="progress-icon"><Target size={19} /></div></div><div className="progress-track"><span style={{ width: `${counts.progress}%` }} /></div><p>{counts.done} {t('dashboard.complete').toLocaleLowerCase()} / {counts.total} {t('nav.all').toLocaleLowerCase()}</p></div>
            <div className="overview-card"><span className="stat-label">{t('dashboard.tasksToday')}</span><strong>{counts.dueToday.toString().padStart(2, '0')}</strong><span className="stat-foot">{t('nav.today')}</span></div>
            <div className="overview-card"><span className="stat-label">{t('dashboard.open')}</span><strong>{(tasks.length - counts.done).toString().padStart(2, '0')}</strong><span className="stat-foot">{t('dashboard.upNext')}</span></div>
            <div className="overview-card overdue-stat"><span className="stat-label">{t('dashboard.overdue')}</span><strong>{counts.overdue.toString().padStart(2, '0')}</strong><span className="stat-foot">{t('nav.overdue')}</span></div>
          </section>

          <form className="quick-add" onSubmit={(event) => void quickAdd(event)}><span className="quick-add-icon"><Plus size={18} /></span><input aria-label={t('dashboard.quickAdd')} placeholder={t('dashboard.quickAdd')} value={quickTitle} onChange={(event) => setQuickTitle(event.target.value)} /><button type="submit" disabled={!quickTitle.trim()}>{t('task.add')} <span>↵</span></button></form>

          <section className="task-section">
            <div className="section-heading"><div><span className="section-kicker">{t('dashboard.upNext')}</span><h2>{t(`nav.${view}`)}</h2></div><div className="task-tools"><label className="search-box"><Search size={16} /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder={t('dashboard.search')} /></label><select aria-label={t('filter.priority')} value={priorityFilter} onChange={(event) => setPriorityFilter(event.target.value as 'all' | Priority)}><option value="all">{t('filter.priority')}</option>{priorities.map((priority) => <option key={priority} value={priority}>{t(`priority.${priority}`)}</option>)}</select><select aria-label={t('filter.dueSoon')} value={sortBy} onChange={(event) => setSortBy(event.target.value as 'date' | 'priority' | 'updated')}><option value="date">{t('filter.dueSoon')}</option><option value="priority">{t('filter.priority')}</option><option value="updated">{t('filter.recent')}</option></select><button className="icon-button" title={t('filter.dueSoon')} onClick={() => setSortBy(sortBy === 'date' ? 'priority' : 'date')}><ArrowDownUp size={16} /></button></div></div>

            {notice && <div className={`inline-notice ${notice.tone}`}>{notice.text}</div>}
            <div className="task-list">
              {visibleTasks.length === 0 ? <div className="empty-state"><span className="empty-icon"><Sparkles size={20} /></span><h3>{t('dashboard.noTasks')}</h3><p>{t('dashboard.noTasksHint')}</p></div> : visibleTasks.map((task) => {
                const overdue = task.status !== 'completed' && Boolean(task.dueDate && task.dueDate < today);
                return <article className={`task-row ${task.status === 'completed' ? 'is-complete' : ''}`} key={task.id}>
                  <button className="complete-button" aria-label={task.status === 'completed' ? t('status.todo') : t('status.completed')} onClick={() => void toggleTask(task)}>{task.status === 'completed' ? <CheckCircle2 size={20} /> : <Circle size={20} />}</button>
                  <button className="task-main" onClick={() => editTask(task)}><span className="task-title">{task.title}</span>{task.description && <span className="task-description">{task.description}</span>}<span className="task-meta"><span className="category-pill"><i />{task.category}</span><span className={`priority-pill ${task.priority}`}>{t(`priority.${task.priority}`)}</span><span className="status-pill">{t(`status.${task.status}`)}</span></span></button>
                  <div className={`task-date ${overdue ? 'late' : ''}`}>{task.dueDate ? <><CalendarDays size={14} /><span>{shortDate(task.dueDate, i18n.language)}</span></> : <span>{t('task.noDate')}</span>}</div>
                  <div className="task-actions"><button className="icon-button" title={t('task.translate')} onClick={() => void request('/api/tasks/translate', token, { method: 'POST', body: JSON.stringify({ taskId: task.id, targetLanguage: user.language }) }).catch((error) => showNotice(messageFrom(error), 'error'))}><Languages size={15} /></button><button className="icon-button delete-action" title={t('task.delete')} onClick={() => void deleteTask(task)}><Trash2 size={15} /></button></div>
                </article>;
              })}
            </div>
          </section>
          <footer className="app-footer"><span><span className="footer-sun">✳</span> A softer rhythm for getting things done.</span><span>{tasks.length} {t('nav.all').toLocaleLowerCase()}</span></footer>
        </div>
      </section>

      {editorOpen && <div className="modal-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) setEditorOpen(false); }}><section className="task-modal" role="dialog" aria-modal="true" aria-labelledby="task-modal-heading"><header><div><span className="section-kicker">DAYLIGHT / TASK</span><h2 id="task-modal-heading">{t(editingId ? 'task.edit' : 'task.new')}</h2></div><button className="icon-button" onClick={() => setEditorOpen(false)} aria-label={t('task.cancel')}><X size={18} /></button></header><form onSubmit={(event) => void submitTask(event)}><label>{t('task.title')}<input autoFocus maxLength={240} value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} required /></label><label>{t('task.description')}<textarea rows={3} value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} /></label><div className="form-two"><label>{t('task.category')}<input maxLength={80} value={form.category} onChange={(event) => setForm({ ...form, category: event.target.value })} /></label><label>{t('task.dueDate')}<input type="date" value={form.dueDate} onChange={(event) => setForm({ ...form, dueDate: event.target.value })} /></label></div><div className="form-two"><label>{t('task.priority')}<select value={form.priority} onChange={(event) => setForm({ ...form, priority: event.target.value as Priority })}>{priorities.map((priority) => <option key={priority} value={priority}>{t(`priority.${priority}`)}</option>)}</select></label><label>{t('task.status')}<select value={form.status} onChange={(event) => setForm({ ...form, status: event.target.value as Status })}>{(['todo', 'in_progress', 'completed'] as Status[]).map((status) => <option key={status} value={status}>{t(`status.${status}`)}</option>)}</select></label></div><footer><button type="button" className="secondary-button" onClick={() => setEditorOpen(false)}>{t('task.cancel')}</button><button className="primary-button" disabled={busy}><Check size={16} />{t('task.save')}</button></footer></form></section></div>}
      {notice && <div className={`toast ${notice.tone}`}>{notice.text}</div>}
    </main>
  );
}
