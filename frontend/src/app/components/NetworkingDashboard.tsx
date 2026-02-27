import React, { useState } from 'react';
import {
  Network, Copy, Check, Star, Users, Clock, TrendingUp, Zap,
  ChevronDown, ChevronUp, ExternalLink, AlertTriangle, MessageSquare, Loader2
} from 'lucide-react';
import { useStore } from '../store';
import { Application } from '../../types';
import {
  calculateMatchScore,
  getDaysSinceContact,
  getGhostingInfo,
  getMatchScoreBg,
  getMatchScoreColor,
  generateOutreachMessage,
  STATUS_CONFIG,
} from '../utils';

function MatchScoreGauge({ score }: { score: number }) {
  const color = score >= 81 ? '#22c55e' : score >= 61 ? '#eab308' : score >= 41 ? '#f97316' : '#ef4444';
  const strokeDasharray = `${(score / 100) * 220} 220`;
  return (
    <div className="relative w-20 h-20">
      <svg className="w-20 h-20 -rotate-90" viewBox="0 0 80 80">
        <circle cx="40" cy="40" r="35" fill="none" stroke="#f3f4f6" strokeWidth="8" />
        <circle
          cx="40" cy="40" r="35" fill="none"
          stroke={color} strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={strokeDasharray}
          strokeDashoffset="0"
          style={{ transition: 'stroke-dasharray 0.8s ease' }}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="text-center">
          <span className="text-lg font-bold" style={{ color }}>{score}</span>
        </div>
      </div>
    </div>
  );
}

function GhostingBar({ lastContactDate }: { lastContactDate: string }) {
  const days = getDaysSinceContact(lastContactDate);
  const info = getGhostingInfo(days);
  return (
    <div className="space-y-1">
      <div className="flex justify-between items-center">
        <span className="text-xs text-gray-500 flex items-center gap-1"><Clock className="w-3 h-3" /> Last Contact</span>
        <span className={`text-xs font-semibold ${info.color}`}>{info.label}</span>
      </div>
      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
        <div className={`h-full rounded-full ${info.barColor} transition-all`} style={{ width: `${info.percent}%` }} />
      </div>
    </div>
  );
}

function OutreachCard({ app }: { app: Application }) {
  const [expanded, setExpanded] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);

  const copyMessage = async (contactName: string, contactRole: string, text: string) => {
    await navigator.clipboard.writeText(text);
    setCopied(contactName);
    setTimeout(() => setCopied(null), 2000);
  };

  const score = calculateMatchScore(app);
  const config = STATUS_CONFIG[app.status];

  const companyColors = [
    'bg-indigo-500', 'bg-blue-500', 'bg-violet-500', 'bg-emerald-500',
    'bg-rose-500', 'bg-amber-500', 'bg-cyan-500', 'bg-pink-500',
  ];
  const colorIndex = app.company.charCodeAt(0) % companyColors.length;

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="p-5">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className={`w-12 h-12 rounded-xl ${companyColors[colorIndex]} flex items-center justify-center text-white font-bold text-lg flex-shrink-0`}>
              {app.company.charAt(0)}
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">{app.company}</h3>
              <p className="text-sm text-gray-500">{app.jobTitle}</p>
              <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full mt-1 font-medium ${config.badge}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${config.dot}`} />
                {config.label}
              </span>
            </div>
          </div>
          <MatchScoreGauge score={score.total} />
        </div>
      </div>

      {/* Match Score Breakdown */}
      <div className="px-5 pb-4">
        <div className="bg-gray-50 rounded-xl p-4 space-y-2">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3 flex items-center gap-1.5">
            <TrendingUp className="w-3.5 h-3.5" /> Match Score Breakdown
          </p>
          <ScoreBreakdownRow label="Skills Match" value={score.skillScore} max={40} color="bg-blue-500" hint={`${score.matchedSkills.length}/${app.requiredSkills.length} skills matched`} />
          <ScoreBreakdownRow label="GPA Score" value={score.gpaScore} max={30} color="bg-violet-500" hint={`GPA: ${app.gpa}/4.0`} />
          <ScoreBreakdownRow label="Referral Bonus" value={score.referralScore} max={30} color="bg-emerald-500" hint={app.hasReferral ? 'Referral confirmed' : 'No referral'} />
          <div className="border-t border-gray-200 pt-2 flex justify-between items-center">
            <span className="text-xs font-semibold text-gray-700">Total Score</span>
            <span className={`text-base font-bold ${getMatchScoreColor(score.total)}`}>{score.total}/100</span>
          </div>
        </div>
      </div>

      {/* Ghosting Timer */}
      {app.lastContactDate && (
        <div className="px-5 pb-4">
          <GhostingBar lastContactDate={app.lastContactDate} />
        </div>
      )}

      {/* Networking Contacts & Outreach */}
      {app.networkingContacts.length > 0 && (
        <div className="border-t border-gray-50">
          <button
            onClick={() => setExpanded(!expanded)}
            className="w-full flex items-center justify-between px-5 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
          >
            <span className="flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-indigo-500" />
              AI Outreach Messages ({app.networkingContacts.length} contact{app.networkingContacts.length > 1 ? 's' : ''})
            </span>
            {expanded ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
          </button>

          {expanded && (
            <div className="px-5 pb-5 space-y-4">
              {app.networkingContacts.map(contact => {
                const message = generateOutreachMessage(contact.name, contact.role, app.company, app.jobTitle);
                const isCopied = copied === contact.name;
                return (
                  <div key={contact.id} className="border border-indigo-100 rounded-xl overflow-hidden">
                    <div className="bg-indigo-50 px-4 py-3 flex items-center justify-between">
                      <div>
                        <p className="text-sm font-semibold text-indigo-900">{contact.name}</p>
                        <p className="text-xs text-indigo-600">{contact.role}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        {contact.linkedinUrl && (
                          <a
                            href={contact.linkedinUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1.5 bg-white rounded-lg text-indigo-600 hover:bg-indigo-100 transition-colors"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </a>
                        )}
                        <button
                          onClick={() => copyMessage(contact.name, contact.role, message)}
                          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                            isCopied ? 'bg-green-500 text-white' : 'bg-indigo-600 text-white hover:bg-indigo-700'
                          }`}
                        >
                          {isCopied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                          {isCopied ? 'Copied!' : 'Copy'}
                        </button>
                      </div>
                    </div>
                    <div className="p-4">
                      <div className="flex items-center gap-1.5 mb-2">
                        <Zap className="w-3.5 h-3.5 text-amber-500" />
                        <span className="text-xs font-semibold text-gray-600 uppercase tracking-wide">AI-Generated LinkedIn Message</span>
                      </div>
                      <pre className="text-xs text-gray-700 whitespace-pre-wrap font-sans leading-relaxed bg-gray-50 rounded-lg p-3 max-h-40 overflow-y-auto">
                        {message}
                      </pre>
                      {contact.notes && (
                        <p className="mt-2 text-xs text-gray-500 italic">Note: {contact.notes}</p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {app.networkingContacts.length === 0 && (
        <div className="border-t border-gray-50 px-5 py-4">
          <p className="text-xs text-gray-400 flex items-center gap-2">
            <Users className="w-3.5 h-3.5" />
            No contacts yet. Add networking contacts in the application to get AI outreach messages.
          </p>
        </div>
      )}
    </div>
  );
}

function ScoreBreakdownRow({ label, value, max, color, hint }: { label: string; value: number; max: number; color: string; hint: string }) {
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between">
        <span className="text-xs text-gray-600">{label}</span>
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-400">{hint}</span>
          <span className="text-xs font-semibold text-gray-700">{value}/{max}</span>
        </div>
      </div>
      <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${(value / max) * 100}%` }} />
      </div>
    </div>
  );
}

export function NetworkingDashboard() {
  const { applications, dataLoading } = useStore();
  const [filter, setFilter] = useState<'all' | 'ghost-risk' | 'high-score' | 'has-contacts'>('all');

  const filtered = applications.filter(app => {
    if (filter === 'ghost-risk') {
      const days = getDaysSinceContact(app.lastContactDate);
      return days > 14;
    }
    if (filter === 'high-score') return calculateMatchScore(app).total >= 70;
    if (filter === 'has-contacts') return app.networkingContacts.length > 0;
    return true;
  });

  const ghostRiskCount = applications.filter(a => getDaysSinceContact(a.lastContactDate) > 14).length;
  const totalContacts = applications.reduce((sum, a) => sum + a.networkingContacts.length, 0);
  const highScoreCount = applications.filter(a => calculateMatchScore(a).total >= 70).length;
  const avgScore = applications.length > 0
    ? Math.round(applications.reduce((sum, a) => sum + calculateMatchScore(a).total, 0) / applications.length)
    : 0;

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="px-8 py-6 border-b border-gray-100 bg-white">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-8 h-8 bg-indigo-100 rounded-lg flex items-center justify-center">
            <Network className="w-4 h-4 text-indigo-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Shadow Networking</h1>
        </div>
        <p className="text-sm text-gray-500 mb-6">AI outreach suggestions, match scores, and ghosting alerts</p>

        {/* Stats */}
        <div className="grid grid-cols-4 gap-4 mb-6">
          <StatCard icon={<Star className="w-4 h-4 text-amber-500" />} label="Avg Match Score" value={`${avgScore}`} sub="out of 100" color="bg-amber-50" />
          <StatCard icon={<TrendingUp className="w-4 h-4 text-blue-500" />} label="High Scores (70+)" value={`${highScoreCount}`} sub={`of ${applications.length} apps`} color="bg-blue-50" />
          <StatCard icon={<Users className="w-4 h-4 text-violet-500" />} label="Total Contacts" value={`${totalContacts}`} sub="in your network" color="bg-violet-50" />
          <StatCard icon={<AlertTriangle className="w-4 h-4 text-red-500" />} label="Ghost Risk" value={`${ghostRiskCount}`} sub="14+ days no contact" color="bg-red-50" />
        </div>

        {/* Filters */}
        <div className="flex gap-2">
          {(['all', 'ghost-risk', 'high-score', 'has-contacts'] as const).map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
                filter === f
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {f === 'all' ? 'All' : f === 'ghost-risk' ? '⚠️ Ghost Risk' : f === 'high-score' ? '🏆 High Score' : '👥 Has Contacts'}
            </button>
          ))}
        </div>
      </div>

      {/* Cards Grid */}
      <div className="flex-1 overflow-y-auto p-8">
        {dataLoading && applications.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 text-center">
            <Loader2 className="w-8 h-8 text-indigo-400 animate-spin mb-3" />
            <p className="text-gray-400 text-sm">Loading your network data…</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 text-center">
            <Network className="w-12 h-12 text-gray-200 mb-3" />
            <p className="text-gray-400">No applications match this filter.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {filtered.map(app => (
              <OutreachCard key={app.id} app={app} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({ icon, label, value, sub, color }: { icon: React.ReactNode; label: string; value: string; sub: string; color: string }) {
  return (
    <div className={`${color} rounded-xl p-4`}>
      <div className="flex items-center gap-2 mb-2">
        {icon}
        <span className="text-xs font-medium text-gray-600">{label}</span>
      </div>
      <p className="text-2xl font-bold text-gray-900">{value}</p>
      <p className="text-xs text-gray-500 mt-0.5">{sub}</p>
    </div>
  );
}