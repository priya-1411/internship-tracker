import React, { useState } from 'react';
import { useNavigate } from 'react-router';
import {
  GraduationCap, Plus, Briefcase, TrendingUp, Trophy, XCircle,
  Clock, Bell, BellOff, Mail, MailCheck, FileText, ChevronRight,
  AlertTriangle, CheckCircle, Loader2, Zap, RefreshCw, Settings,
  Send, Shield, ToggleLeft, ToggleRight, Info, Calendar
} from 'lucide-react';
import { useStore } from '../store';
import { ApplicationStatus } from '../../types';
import { STATUS_CONFIG } from '../utils';

const STATUS_PIPELINE: { status: ApplicationStatus; icon: React.ReactNode; color: string; bg: string }[] = [
  { status: 'to-apply', icon: <Briefcase className="w-3.5 h-3.5" />, color: 'text-slate-600', bg: 'bg-slate-500' },
  { status: 'applied', icon: <Send className="w-3.5 h-3.5" />, color: 'text-blue-600', bg: 'bg-blue-500' },
  { status: 'interviewing', icon: <Zap className="w-3.5 h-3.5" />, color: 'text-violet-600', bg: 'bg-violet-500' },
  { status: 'offer', icon: <Trophy className="w-3.5 h-3.5" />, color: 'text-emerald-600', bg: 'bg-emerald-500' },
  { status: 'rejected', icon: <XCircle className="w-3.5 h-3.5" />, color: 'text-red-500', bg: 'bg-red-400' },
];

function greeting(name: string) {
  const h = new Date().getHours();
  const time = h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening';
  return `${time}, ${name}! 👋`;
}

function daysUntil(dateStr: string) {
  const dl = new Date(dateStr);
  dl.setHours(0, 0, 0, 0);
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  return Math.ceil((dl.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
}

// ── Notification Panel ─────────────────────────────────────────────────────────

function NotificationPanel() {
  const {
    pushPermission, pushSubscribed, requestPushPermission, unsubscribePush,
    reminderPrefs, setReminderPrefs, sendRemindersNow,
  } = useStore();

  const [pushLoading, setPushLoading] = useState(false);
  const [reminderLoading, setReminderLoading] = useState(false);

  const handlePushToggle = async () => {
    setPushLoading(true);
    try {
      if (pushSubscribed) await unsubscribePush();
      else await requestPushPermission();
    } finally {
      setPushLoading(false);
    }
  };

  const handleSendNow = async () => {
    setReminderLoading(true);
    try { await sendRemindersNow(); } finally { setReminderLoading(false); }
  };

  const pushUnsupported = pushPermission === 'unsupported';
  const pushDenied = pushPermission === 'denied';

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-50 flex items-center gap-2">
        <Settings className="w-4 h-4 text-indigo-500" />
        <h2 className="font-semibold text-gray-900">Notification Settings</h2>
      </div>

      {/* Push notifications */}
      <div className="px-6 py-4 border-b border-gray-50">
        <div className="flex items-start justify-between gap-3 mb-2">
          <div className="flex items-center gap-3">
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${pushSubscribed ? 'bg-indigo-100' : 'bg-gray-100'}`}>
              {pushSubscribed
                ? <Bell className="w-4 h-4 text-indigo-600" />
                : <BellOff className="w-4 h-4 text-gray-400" />}
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-900">Push Notifications</p>
              <p className="text-xs text-gray-400 mt-0.5">Status changes on any device</p>
            </div>
          </div>

          <button
            onClick={handlePushToggle}
            disabled={pushLoading || pushUnsupported || pushDenied}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${pushSubscribed
              ? 'bg-indigo-50 text-indigo-700 hover:bg-red-50 hover:text-red-600'
              : 'bg-indigo-600 text-white hover:bg-indigo-700'
              }`}
          >
            {pushLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : (
              pushSubscribed
                ? <><ToggleRight className="w-3.5 h-3.5" /> Enabled</>
                : <><ToggleLeft className="w-3.5 h-3.5" /> Enable</>
            )}
          </button>
        </div>

        {pushDenied && (
          <div className="flex items-start gap-2 mt-2 p-2 bg-amber-50 rounded-lg">
            <Info className="w-3.5 h-3.5 text-amber-500 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-amber-700">
              Notifications are blocked. Allow them in your browser settings (click the lock icon in the address bar).
            </p>
          </div>
        )}
        {pushUnsupported && (
          <p className="text-xs text-gray-400 mt-1">Push notifications are not supported in this browser.</p>
        )}
        {pushSubscribed && (
          <div className="flex items-center gap-1.5 mt-2">
            <CheckCircle className="w-3.5 h-3.5 text-emerald-500" />
            <p className="text-xs text-emerald-600 font-medium">You'll be notified instantly when any application status changes.</p>
          </div>
        )}
      </div>

      {/* Email reminders */}
      <div className="px-6 py-4">
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex items-center gap-3">
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${reminderPrefs.enabled ? 'bg-emerald-100' : 'bg-gray-100'}`}>
              {reminderPrefs.enabled
                ? <MailCheck className="w-4 h-4 text-emerald-600" />
                : <Mail className="w-4 h-4 text-gray-400" />}
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-900">Email Deadline Reminders</p>
              <p className="text-xs text-gray-400 mt-0.5">Sent once daily when deadlines approach</p>
            </div>
          </div>
          <button
            onClick={() => setReminderPrefs({ ...reminderPrefs, enabled: !reminderPrefs.enabled })}
            className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${reminderPrefs.enabled
              ? 'bg-emerald-50 text-emerald-700 hover:bg-red-50 hover:text-red-600'
              : 'bg-gray-100 text-gray-600 hover:bg-emerald-50 hover:text-emerald-700'
              }`}
          >
            {reminderPrefs.enabled
              ? <><ToggleRight className="w-3.5 h-3.5" /> On</>
              : <><ToggleLeft className="w-3.5 h-3.5" /> Off</>}
          </button>
        </div>

        {reminderPrefs.enabled && (
          <div className="space-y-3">
            <div>
              <label className="text-xs font-medium text-gray-600 block mb-1.5">Remind me when deadline is within:</label>
              <div className="flex gap-2">
                {[1, 3, 7, 14].map((d) => (
                  <button
                    key={d}
                    onClick={() => setReminderPrefs({ ...reminderPrefs, daysThreshold: d })}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${reminderPrefs.daysThreshold === d
                      ? 'bg-indigo-600 text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                  >
                    {d}d
                  </button>
                ))}
              </div>
            </div>
            <button
              onClick={handleSendNow}
              disabled={reminderLoading}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-lg text-xs font-medium transition-colors disabled:opacity-50 w-full justify-center"
            >
              {reminderLoading
                ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                : <Send className="w-3.5 h-3.5" />}
              Send Test Reminder Now
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Deadlines Widget ───────────────────────────────────────────────────────────

function DeadlinesWidget() {
  const { applications } = useStore();
  const navigate = useNavigate();

  const upcoming = applications
    .filter((a) => a.deadline && !['offer', 'rejected'].includes(a.status))
    .map((a) => ({ ...a, daysLeft: daysUntil(a.deadline) }))
    .filter((a) => a.daysLeft >= 0 && a.daysLeft <= 14)
    .sort((a, b) => a.daysLeft - b.daysLeft)
    .slice(0, 6);

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-50 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-orange-500" />
          <h2 className="font-semibold text-gray-900">Upcoming Deadlines</h2>
        </div>
        <span className="text-xs text-gray-400">Next 14 days</span>
      </div>

      {upcoming.length === 0 ? (
        <div className="px-6 py-8 text-center">
          <CheckCircle className="w-10 h-10 text-emerald-300 mx-auto mb-2" />
          <p className="text-sm text-gray-400">No deadlines in the next 14 days.</p>
        </div>
      ) : (
        <div className="divide-y divide-gray-50">
          {upcoming.map((a) => {
            const urgency = a.daysLeft === 0
              ? { label: 'Today!', color: 'text-red-600', dot: 'bg-red-500', bar: 'bg-red-400' }
              : a.daysLeft <= 2
                ? { label: `${a.daysLeft}d left`, color: 'text-red-500', dot: 'bg-red-400', bar: 'bg-red-400' }
                : a.daysLeft <= 5
                  ? { label: `${a.daysLeft}d left`, color: 'text-amber-500', dot: 'bg-amber-400', bar: 'bg-amber-400' }
                  : { label: `${a.daysLeft}d left`, color: 'text-emerald-600', dot: 'bg-emerald-400', bar: 'bg-emerald-400' };

            return (
              <div key={a.id} className="px-6 py-3 flex items-center gap-3 hover:bg-gray-50 transition-colors">
                <span className={`w-2 h-2 rounded-full flex-shrink-0 ${urgency.dot}`} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{a.company}</p>
                  <p className="text-xs text-gray-400 truncate">{a.jobTitle}</p>
                </div>
                <span className={`text-xs font-semibold flex-shrink-0 ${urgency.color}`}>
                  {urgency.label}
                </span>
              </div>
            );
          })}
        </div>
      )}

      <div className="px-6 py-3 border-t border-gray-50">
        <button
          onClick={() => navigate('/kanban')}
          className="text-xs text-indigo-600 hover:text-indigo-700 font-medium flex items-center gap-1"
        >
          View all on Kanban <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}

// ── Pipeline Funnel ────────────────────────────────────────────────────────────

function PipelineFunnel() {
  const { applications } = useStore();
  const counts = STATUS_PIPELINE.reduce((acc, { status }) => {
    acc[status] = applications.filter((a) => a.status === status).length;
    return acc;
  }, {} as Record<ApplicationStatus, number>);

  const maxCount = Math.max(...Object.values(counts), 1);

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-50 flex items-center gap-2">
        <TrendingUp className="w-4 h-4 text-indigo-500" />
        <h2 className="font-semibold text-gray-900">Pipeline Overview</h2>
      </div>
      <div className="px-6 py-4 space-y-3">
        {STATUS_PIPELINE.map(({ status, bg }) => {
          const count = counts[status];
          const pct = (count / maxCount) * 100;
          const cfg = STATUS_CONFIG[status];
          return (
            <div key={status} className="flex items-center gap-3">
              <span className="text-xs text-gray-500 w-24 flex-shrink-0">{cfg.label.replace(' 🎉', '')}</span>
              <div className="flex-1 h-6 bg-gray-100 rounded-lg overflow-hidden">
                <div
                  className={`h-full ${bg} rounded-lg transition-all duration-700 flex items-center px-2`}
                  style={{ width: `${Math.max(pct, count > 0 ? 8 : 0)}%` }}
                >
                  {count > 0 && <span className="text-white text-xs font-bold">{count}</span>}
                </div>
              </div>
              {count === 0 && <span className="text-xs text-gray-300 w-4">0</span>}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Recent Activity ─────────────────────────────────────────────────────────────

function RecentActivity() {
  const { applications } = useStore();
  const recent = [...applications]
    .filter((a) => a.appliedDate || a.createdAt)
    .sort((a, b) => new Date(b.createdAt ?? b.appliedDate).getTime() - new Date(a.createdAt ?? a.appliedDate).getTime())
    .slice(0, 5);

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-50 flex items-center gap-2">
        <Clock className="w-4 h-4 text-violet-500" />
        <h2 className="font-semibold text-gray-900">Recent Applications</h2>
      </div>
      {recent.length === 0 ? (
        <div className="px-6 py-8 text-center">
          <Briefcase className="w-10 h-10 text-gray-200 mx-auto mb-2" />
          <p className="text-sm text-gray-400">No applications yet. Add your first one!</p>
        </div>
      ) : (
        <div className="divide-y divide-gray-50">
          {recent.map((a) => {
            const cfg = STATUS_CONFIG[a.status];
            return (
              <div key={a.id} className="px-6 py-3 flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-indigo-100 flex items-center justify-center flex-shrink-0">
                  <span className="text-indigo-700 font-bold text-xs">{a.company.charAt(0)}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{a.company}</p>
                  <p className="text-xs text-gray-400 truncate">{a.jobTitle}</p>
                </div>
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${cfg.badge}`}>
                  {cfg.label.replace(' 🎉', '')}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ── Main Home Component ────────────────────────────────────────────────────────

export function Home() {
  const { user, applications, resumes, dataLoading, refreshApplications } = useStore();
  const navigate = useNavigate();

  const fullName = user?.name || user?.email?.split('@')[0] || 'there';
  const name = fullName.split(' ')[0];

  const counts = {
    total: applications.length,
    active: applications.filter((a) => !['offer', 'rejected'].includes(a.status)).length,
    interviewing: applications.filter((a) => a.status === 'interviewing').length,
    offers: applications.filter((a) => a.status === 'offer').length,
    rejected: applications.filter((a) => a.status === 'rejected').length,
  };

  const conversionRate = counts.total > 0
    ? Math.round(((counts.interviewing + counts.offers) / counts.total) * 100)
    : 0;

  const urgentDeadlines = applications.filter((a) => {
    if (!a.deadline || ['offer', 'rejected'].includes(a.status)) return false;
    return daysUntil(a.deadline) <= 3 && daysUntil(a.deadline) >= 0;
  }).length;

  return (
    <div className="h-full overflow-y-auto bg-gray-50">
      <div className="max-w-6xl mx-auto px-6 py-8">

        {/* Header */}
        <div className="mb-8 flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-1">{greeting(name)}</h1>
            <p className="text-gray-500">
              {counts.total === 0
                ? 'Start tracking your internship applications below.'
                : `You have ${counts.active} active application${counts.active !== 1 ? 's' : ''} in your pipeline.`}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={refreshApplications}
              disabled={dataLoading}
              className="flex items-center gap-1.5 px-3 py-2 bg-white border border-gray-200 text-gray-600 rounded-xl text-sm hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${dataLoading ? 'animate-spin' : ''}`} />
              Sync
            </button>
            <button
              onClick={() => navigate('/kanban')}
              className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 text-white rounded-xl text-sm font-medium hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-200"
            >
              <Plus className="w-4 h-4" />
              Add Application
            </button>
          </div>
        </div>

        {/* Urgent banner */}
        {urgentDeadlines > 0 && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-xl px-4 py-3 flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0" />
            <p className="text-sm text-red-700 font-medium">
              {urgentDeadlines} application deadline{urgentDeadlines > 1 ? 's are' : ' is'} within 3 days — don't miss them!
            </p>
            <button
              onClick={() => navigate('/kanban')}
              className="ml-auto text-xs text-red-600 hover:text-red-800 font-semibold flex items-center gap-1"
            >
              View <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Stat Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
          <StatCard icon={<Briefcase className="w-5 h-5 text-indigo-500" />} label="Total Apps" value={counts.total} bg="bg-indigo-50" />
          <StatCard icon={<TrendingUp className="w-5 h-5 text-blue-500" />} label="Active" value={counts.active} bg="bg-blue-50" />
          <StatCard icon={<Zap className="w-5 h-5 text-violet-500" />} label="Interviewing" value={counts.interviewing} bg="bg-violet-50" />
          <StatCard icon={<Trophy className="w-5 h-5 text-emerald-500" />} label="Offers" value={counts.offers} bg="bg-emerald-50" />
          <StatCard icon={<Shield className="w-5 h-5 text-amber-500" />} label="Conversion" value={`${conversionRate}%`} bg="bg-amber-50" />
        </div>

        {/* Quick links */}
        <div className="grid grid-cols-3 gap-3 mb-8">
          {[
            { label: 'Kanban Board', icon: <Briefcase className="w-4 h-4" />, to: '/kanban', color: 'indigo' },
            {
              label: 'Resume Vault', icon: <FileText className="w-4 h-4" />, to: '/vault', color: 'violet',
              badge: resumes.length > 0 ? `${resumes.length} file${resumes.length > 1 ? 's' : ''}` : undefined
            },
            { label: 'Analytics', icon: <TrendingUp className="w-4 h-4" />, to: '/analytics', color: 'blue' },
          ].map(({ label, icon, to, color, badge }) => (
            <button
              key={to}
              onClick={() => navigate(to)}
              className={`flex items-center gap-2 px-4 py-3 bg-white border border-gray-100 rounded-xl text-sm font-medium text-gray-700 hover:border-${color}-200 hover:bg-${color}-50 hover:text-${color}-700 transition-all shadow-sm group`}
            >
              <span className={`group-hover:text-${color}-600`}>{icon}</span>
              {label}
              {badge && (
                <span className="ml-auto text-xs bg-violet-100 text-violet-700 px-1.5 py-0.5 rounded-full">{badge}</span>
              )}
              <ChevronRight className={`w-3.5 h-3.5 ml-auto text-gray-400 group-hover:text-${color}-500`} />
            </button>
          ))}
        </div>

        {/* Main grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left column: deadlines + pipeline */}
          <div className="lg:col-span-2 space-y-6">
            <DeadlinesWidget />
            <PipelineFunnel />
            <RecentActivity />
          </div>

          {/* Right column: notifications */}
          <div className="space-y-6">
            <NotificationPanel />

            {/* Resume vault summary */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-50 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-violet-500" />
                  <h2 className="font-semibold text-gray-900">Resume Vault</h2>
                </div>
                <button
                  onClick={() => navigate('/vault')}
                  className="text-xs text-indigo-600 hover:text-indigo-700 font-medium"
                >
                  Open →
                </button>
              </div>
              <div className="px-6 py-4">
                {resumes.length === 0 ? (
                  <div className="text-center py-4">
                    <FileText className="w-8 h-8 text-gray-200 mx-auto mb-2" />
                    <p className="text-xs text-gray-400">No resumes uploaded yet.</p>
                    <button
                      onClick={() => navigate('/vault')}
                      className="mt-2 text-xs text-indigo-600 font-medium hover:underline"
                    >
                      Upload your first resume →
                    </button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-gray-700 mb-3">{resumes.length} resume{resumes.length > 1 ? 's' : ''} stored</p>
                    {resumes.slice(0, 3).map((r) => (
                      <div key={r.id} className="flex items-center gap-2 text-xs text-gray-500">
                        <FileText className="w-3.5 h-3.5 text-violet-400 flex-shrink-0" />
                        <span className="truncate flex-1">{r.filename}</span>
                        <span className="text-gray-300 flex-shrink-0">{r.version}</span>
                      </div>
                    ))}
                    {resumes.length > 3 && (
                      <p className="text-xs text-gray-400 text-center mt-1">+{resumes.length - 3} more</p>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ icon, label, value, bg }: { icon: React.ReactNode; label: string; value: string | number; bg: string }) {
  return (
    <div className={`${bg} rounded-2xl p-4`}>
      <div className="flex items-center gap-2 mb-2">{icon}</div>
      <p className="text-2xl font-bold text-gray-900">{value}</p>
      <p className="text-xs text-gray-500 mt-0.5">{label}</p>
    </div>
  );
}
