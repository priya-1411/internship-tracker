import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
  ReactNode,
} from 'react';
import { toast } from 'sonner';
import { Application, ApplicationStatus, Resume, ReminderPrefs } from '../types';
import * as api from './api';

interface UserData {
  _id: string;
  id?: string;
  email: string;
  name: string;
  role: 'user' | 'admin';
}

// ── Push helpers ──────────────────────────────────────────────────────────────

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = atob(base64);
  return Uint8Array.from(rawData, (c) => c.charCodeAt(0));
}

// ── Token helpers ─────────────────────────────────────────────────────────────

function getStoredToken(): string | null {
  return localStorage.getItem('interntrack_token');
}

function storeToken(token: string) {
  localStorage.setItem('interntrack_token', token);
}

function clearToken() {
  localStorage.removeItem('interntrack_token');
}

// ── Context ───────────────────────────────────────────────────────────────────

interface StoreContextType {
  // Auth
  user: UserData | null;
  token: string | null;
  authLoading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, name: string, role?: 'user' | 'admin') => Promise<void>;
  signOut: () => Promise<void>;

  // Applications
  applications: Application[];
  dataLoading: boolean;
  addApplication: (app: Omit<Application, 'id' | 'createdAt'>) => Promise<void>;
  updateApplication: (id: string, updates: Partial<Application>) => Promise<void>;
  deleteApplication: (id: string) => Promise<void>;
  updateStatus: (id: string, status: ApplicationStatus) => Promise<void>;
  refreshApplications: () => Promise<void>;

  // Push notifications
  pushPermission: NotificationPermission | 'unsupported';
  pushSubscribed: boolean;
  requestPushPermission: () => Promise<void>;
  unsubscribePush: () => Promise<void>;

  // Email reminders
  reminderPrefs: ReminderPrefs;
  setReminderPrefs: (prefs: ReminderPrefs) => Promise<void>;
  sendRemindersNow: () => Promise<void>;

  // Resume vault
  resumes: Resume[];
  resumesLoading: boolean;
  uploadResume: (appId: string, file: File, version: string, notes: string) => Promise<Resume>;
  deleteResume: (appId: string, resumeId: string) => Promise<void>;
  getResumeUrl: (appId: string, resumeId: string) => Promise<string>;
  refreshResumes: () => Promise<void>;
}

const StoreContext = createContext<StoreContextType | null>(null);

// ── Provider ──────────────────────────────────────────────────────────────────

export function StoreProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserData | null>(null);
  const [token, setToken] = useState<string | null>(getStoredToken());
  const [authLoading, setAuthLoading] = useState(true);

  const [applications, setApplications] = useState<Application[]>([]);
  const [dataLoading, setDataLoading] = useState(false);

  const [pushPermission, setPushPermission] = useState<NotificationPermission | 'unsupported'>('default');
  const [pushSubscribed, setPushSubscribed] = useState(false);
  const swRegRef = useRef<ServiceWorkerRegistration | null>(null);
  const currentSubRef = useRef<PushSubscription | null>(null);

  const [reminderPrefs, setReminderPrefsState] = useState<ReminderPrefs>({ enabled: true, daysThreshold: 7 });

  const [resumes, setResumes] = useState<Resume[]>([]);
  const [resumesLoading, setResumesLoading] = useState(false);

  // ── Load data ────────────────────────────────────────────────────────────────

  const loadApplications = useCallback(async (accessToken: string) => {
    setDataLoading(true);
    try {
      const apps = await api.fetchApplications(accessToken);
      setApplications(apps);
    } catch (e) {
      console.error('Failed to load applications:', e);
      toast.error('Could not load your applications.');
    } finally {
      setDataLoading(false);
    }
  }, []);

  const loadResumes = useCallback(async (accessToken: string) => {
    setResumesLoading(true);
    try {
      const r = await api.fetchAllResumes(accessToken);
      setResumes(r);
    } catch (e) {
      console.error('Failed to load resumes:', e);
    } finally {
      setResumesLoading(false);
    }
  }, []);

  const loadReminderPrefs = useCallback(async (accessToken: string) => {
    try {
      const prefs = await api.fetchReminderPrefs(accessToken);
      setReminderPrefsState(prefs);
    } catch (e) {
      console.error('Failed to load reminder prefs:', e);
    }
  }, []);

  // ── Service worker + Push init ────────────────────────────────────────────────

  const initServiceWorker = useCallback(async () => {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      setPushPermission('unsupported');
      return;
    }

    try {
      const reg = await navigator.serviceWorker.register('/sw.js');
      swRegRef.current = reg;
      console.log('Service worker registered');

      setPushPermission(Notification.permission);

      // Check if already subscribed
      const existing = await reg.pushManager.getSubscription();
      if (existing) {
        currentSubRef.current = existing;
        setPushSubscribed(true);
      }
    } catch (e) {
      console.error('Service worker registration failed:', e);
    }
  }, []);

  // ── Auto-check reminders on login ─────────────────────────────────────────────

  const autoCheckReminders = useCallback((accessToken: string, prefs: ReminderPrefs) => {
    if (!prefs.enabled) return;
    const key = 'interntrack_last_reminder';
    const last = parseInt(localStorage.getItem(key) ?? '0', 10);
    const now = Date.now();
    if (now - last < 24 * 60 * 60 * 1000) return; // Once per 24 h
    api.checkReminders(accessToken, prefs.daysThreshold).then((res) => {
      if (res.sent) {
        toast.success(`📅 Deadline reminder sent to your email!`, { duration: 5000 });
        localStorage.setItem(key, String(now));
      }
    }).catch(console.error);
  }, []);

  // ── Auth state: restore session from stored token ─────────────────────────────

  useEffect(() => {
    initServiceWorker();

    const storedToken = getStoredToken();
    if (storedToken) {
      // Verify the token is still valid
      api.getMe(storedToken)
        .then(async (data) => {
          const userData = data.user as UserData;
          setUser(userData);
          setToken(storedToken);

          await loadApplications(storedToken);
          await loadResumes(storedToken);
          const prefs = await api.fetchReminderPrefs(storedToken).catch(() => ({ enabled: true, daysThreshold: 7 }));
          setReminderPrefsState(prefs);
          autoCheckReminders(storedToken, prefs);
        })
        .catch(() => {
          // Token is invalid, clear it
          clearToken();
          setUser(null);
          setToken(null);
        })
        .finally(() => {
          setAuthLoading(false);
        });
    } else {
      setAuthLoading(false);
    }
  }, [initServiceWorker, loadApplications, loadResumes, loadReminderPrefs, autoCheckReminders]);

  // ── Auth ──────────────────────────────────────────────────────────────────────

  const signIn = async (email: string, password: string) => {
    const data = await api.signIn(email, password);
    const accessToken = data.session.access_token;
    storeToken(accessToken);
    setToken(accessToken);
    setUser(data.user as UserData);

    // Load data
    await loadApplications(accessToken);
    await loadResumes(accessToken);
    const prefs = await api.fetchReminderPrefs(accessToken).catch(() => ({ enabled: true, daysThreshold: 7 }));
    setReminderPrefsState(prefs);
    autoCheckReminders(accessToken, prefs);
  };

  const signUp = async (email: string, password: string, name: string, role: 'user' | 'admin' = 'user') => {
    const data = await api.signUp(email, password, name, role);
    const accessToken = data.session.access_token;
    storeToken(accessToken);
    setToken(accessToken);
    setUser(data.user as UserData);

    // Load data
    await loadApplications(accessToken);
    await loadResumes(accessToken);
  };

  const signOut = async () => {
    // Unsubscribe push before signing out
    if (currentSubRef.current && token) {
      try {
        await api.removePushSubscription(currentSubRef.current.endpoint, token);
        await currentSubRef.current.unsubscribe();
      } catch (_) { }
    }
    clearToken();
    setToken(null);
    setUser(null);
    setApplications([]);
    setResumes([]);
    setPushSubscribed(false);
  };

  const refreshApplications = useCallback(async () => {
    if (!token) return;
    await loadApplications(token);
  }, [token, loadApplications]);

  // ── Push notifications ────────────────────────────────────────────────────────

  const requestPushPermission = async () => {
    if (!swRegRef.current) throw new Error('Service worker not registered');
    if (!token) throw new Error('Not authenticated');

    const perm = await Notification.requestPermission();
    setPushPermission(perm);

    if (perm !== 'granted') {
      toast.error('Notification permission denied. Please allow notifications in your browser settings.');
      return;
    }

    try {
      const publicKey = await api.fetchVapidPublicKey(token);
      const sub = await swRegRef.current.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(publicKey),
      });
      currentSubRef.current = sub;
      await api.savePushSubscription(sub.toJSON(), token);
      setPushSubscribed(true);
      toast.success('Push notifications enabled! You\'ll be notified of status changes.');
    } catch (e) {
      console.error('Push subscribe failed:', e);
      toast.error(`Failed to enable push: ${(e as Error).message}`);
      throw e;
    }
  };

  const unsubscribePush = async () => {
    if (!currentSubRef.current || !token) return;
    try {
      await api.removePushSubscription(currentSubRef.current.endpoint, token);
      await currentSubRef.current.unsubscribe();
      currentSubRef.current = null;
      setPushSubscribed(false);
      toast.success('Push notifications disabled.');
    } catch (e) {
      toast.error(`Failed to disable push: ${(e as Error).message}`);
    }
  };

  // ── Reminder prefs ────────────────────────────────────────────────────────────

  const setReminderPrefs = async (prefs: ReminderPrefs) => {
    if (!token) return;
    setReminderPrefsState(prefs);
    await api.saveReminderPrefs(prefs, token);
    toast.success('Reminder preferences saved.');
  };

  const sendRemindersNow = async () => {
    if (!token) return;
    try {
      const res = await api.checkReminders(token, reminderPrefs.daysThreshold);
      if (res.sent) {
        toast.success(`📧 Reminder sent for ${res.count} application${(res.count ?? 0) > 1 ? 's' : ''}!`);
        localStorage.setItem('interntrack_last_reminder', String(Date.now()));
      } else if (res.skipped) {
        toast.info('Email reminders are disabled. Enable them in settings.');
      } else {
        toast.info(res.reason === 'already sent today' ? 'Already sent a reminder today.' : 'No upcoming deadlines to remind about.');
      }
    } catch (e) {
      toast.error(`Failed to send reminders: ${(e as Error).message}`);
    }
  };

  // ── Applications CRUD ─────────────────────────────────────────────────────────

  const addApplication = async (appData: Omit<Application, 'id' | 'createdAt'>) => {
    if (!token) throw new Error('Not authenticated');
    const tempId = `temp-${crypto.randomUUID()}`;
    const tempApp: Application = { ...appData, id: tempId, createdAt: new Date().toISOString() };
    setApplications((prev) => [...prev, tempApp]);
    try {
      const created = await api.createApplication(appData, token);
      setApplications((prev) => prev.map((a) => (a.id === tempId ? created : a)));
      toast.success(`${appData.company} added!`);
    } catch (e) {
      setApplications((prev) => prev.filter((a) => a.id !== tempId));
      toast.error(`Failed to save: ${(e as Error).message}`);
      throw e;
    }
  };

  const updateApplication = async (id: string, updates: Partial<Application>) => {
    if (!token) throw new Error('Not authenticated');
    const prev = applications.find((a) => a.id === id);
    setApplications((apps) => apps.map((a) => (a.id === id ? { ...a, ...updates } : a)));
    try {
      await api.updateApplication(id, updates, token);
    } catch (e) {
      if (prev) setApplications((apps) => apps.map((a) => (a.id === id ? prev : a)));
      toast.error(`Failed to update: ${(e as Error).message}`);
      throw e;
    }
  };

  const deleteApplication = async (id: string) => {
    if (!token) throw new Error('Not authenticated');
    const removed = applications.find((a) => a.id === id);
    setApplications((prev) => prev.filter((a) => a.id !== id));
    try {
      await api.deleteApplication(id, token);
      toast.success('Application removed.');
    } catch (e) {
      if (removed) setApplications((prev) => [...prev, removed]);
      toast.error(`Failed to delete: ${(e as Error).message}`);
      throw e;
    }
  };

  const updateStatus = async (id: string, status: ApplicationStatus) => updateApplication(id, { status });

  // ── Resume vault ──────────────────────────────────────────────────────────────

  const uploadResume = async (appId: string, file: File, version: string, notes: string): Promise<Resume> => {
    if (!token) throw new Error('Not authenticated');
    try {
      const resume = await api.uploadResume(appId, file, version, notes, token);
      setResumes((prev) => [resume, ...prev]);
      toast.success(`${file.name} uploaded!`);
      return resume;
    } catch (e) {
      toast.error(`Upload failed: ${(e as Error).message}`);
      throw e;
    }
  };

  const deleteResume = async (appId: string, resumeId: string) => {
    if (!token) throw new Error('Not authenticated');
    const removed = resumes.find((r) => r.id === resumeId);
    setResumes((prev) => prev.filter((r) => r.id !== resumeId));
    try {
      await api.deleteResume(appId, resumeId, token);
      toast.success('Resume deleted.');
    } catch (e) {
      if (removed) setResumes((prev) => [removed, ...prev]);
      toast.error(`Delete failed: ${(e as Error).message}`);
      throw e;
    }
  };

  const getResumeUrl = async (appId: string, resumeId: string): Promise<string> => {
    if (!token) throw new Error('Not authenticated');
    return api.getResumeDownloadUrl(appId, resumeId, token);
  };

  const refreshResumes = useCallback(async () => {
    if (!token) return;
    await loadResumes(token);
  }, [token, loadResumes]);

  return (
    <StoreContext.Provider
      value={{
        user, token, authLoading, signIn, signUp, signOut,
        applications, dataLoading, addApplication, updateApplication,
        deleteApplication, updateStatus, refreshApplications,
        pushPermission, pushSubscribed, requestPushPermission, unsubscribePush,
        reminderPrefs, setReminderPrefs, sendRemindersNow,
        resumes, resumesLoading, uploadResume, deleteResume, getResumeUrl, refreshResumes,
      }}
    >
      {children}
    </StoreContext.Provider>
  );
}

export function useStore() {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error('useStore must be used within StoreProvider');
  return ctx;
}
