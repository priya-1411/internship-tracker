import React from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, Legend, RadarChart, Radar, PolarGrid, PolarAngleAxis,
} from 'recharts';
import { BarChart3, TrendingUp, Target, Award, Briefcase, CheckCircle, XCircle, Clock } from 'lucide-react';
import { useStore } from '../store';
import { calculateMatchScore, STATUS_CONFIG } from '../utils';
import { ApplicationStatus } from '../../types';

const STATUS_COLORS: Record<ApplicationStatus, string> = {
  'to-apply': '#94a3b8',
  'applied': '#3b82f6',
  'interviewing': '#8b5cf6',
  'offer': '#22c55e',
  'rejected': '#ef4444',
};

export function AnalyticsDashboard() {
  const { applications } = useStore();

  const total = applications.length;
  const applied = applications.filter(a => a.status !== 'to-apply').length;
  const interviewing = applications.filter(a => a.status === 'interviewing' || a.status === 'offer').length;
  const offers = applications.filter(a => a.status === 'offer').length;
  const rejected = applications.filter(a => a.status === 'rejected').length;

  const conversionData = [
    { stage: 'Applied', count: applied, fill: '#3b82f6' },
    { stage: 'Interviewing', count: interviewing, fill: '#8b5cf6' },
    { stage: 'Offer', count: offers, fill: '#22c55e' },
  ];

  const statusData = (['to-apply', 'applied', 'interviewing', 'offer', 'rejected'] as ApplicationStatus[]).map(s => ({
    name: STATUS_CONFIG[s].label.replace(' 🎉', ''),
    value: applications.filter(a => a.status === s).length,
    fill: STATUS_COLORS[s],
  })).filter(d => d.value > 0);

  // Match score distribution
  const scoreRanges = [
    { range: '0–20', count: 0, fill: '#ef4444' },
    { range: '21–40', count: 0, fill: '#f97316' },
    { range: '41–60', count: 0, fill: '#eab308' },
    { range: '61–80', count: 0, fill: '#84cc16' },
    { range: '81–100', count: 0, fill: '#22c55e' },
  ];
  applications.forEach(app => {
    const s = calculateMatchScore(app).total;
    if (s <= 20) scoreRanges[0].count++;
    else if (s <= 40) scoreRanges[1].count++;
    else if (s <= 60) scoreRanges[2].count++;
    else if (s <= 80) scoreRanges[3].count++;
    else scoreRanges[4].count++;
  });

  // Applications over time (by createdAt month)
  const monthMap: Record<string, number> = {};
  applications.forEach(app => {
    const d = new Date(app.createdAt);
    const key = d.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
    monthMap[key] = (monthMap[key] || 0) + 1;
  });
  const timelineData = Object.entries(monthMap)
    .map(([month, count]) => ({ month, count }))
    .sort((a, b) => new Date(a.month).getTime() - new Date(b.month).getTime());

  // Skills gap (average matched vs required)
  const skillsData = applications
    .filter(a => a.requiredSkills.length > 0)
    .map(app => {
      const s = calculateMatchScore(app);
      return {
        company: app.company,
        matched: s.matchedSkills.length,
        required: app.requiredSkills.length,
        gap: app.requiredSkills.length - s.matchedSkills.length,
      };
    })
    .slice(0, 6);

  const appToInterviewRate = applied > 0 ? Math.round((interviewing / applied) * 100) : 0;
  const interviewToOfferRate = interviewing > 0 ? Math.round((offers / interviewing) * 100) : 0;
  const avgScore = total > 0
    ? Math.round(applications.reduce((sum, a) => sum + calculateMatchScore(a).total, 0) / total)
    : 0;

  return (
    <div className="h-full overflow-y-auto">
      {/* Header */}
      <div className="px-8 py-6 border-b border-gray-100 bg-white sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-indigo-100 rounded-lg flex items-center justify-center">
            <BarChart3 className="w-4 h-4 text-indigo-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Analytics Dashboard</h1>
            <p className="text-sm text-gray-500">Track your application performance and conversion rates</p>
          </div>
        </div>
      </div>

      <div className="p-8 space-y-8">
        {/* KPI Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <KPICard
            icon={<Briefcase className="w-5 h-5 text-blue-500" />}
            label="Total Applications"
            value={total}
            sub="across all stages"
            color="bg-blue-50"
          />
          <KPICard
            icon={<TrendingUp className="w-5 h-5 text-violet-500" />}
            label="App → Interview Rate"
            value={`${appToInterviewRate}%`}
            sub={`${interviewing} interviews`}
            color="bg-violet-50"
          />
          <KPICard
            icon={<CheckCircle className="w-5 h-5 text-green-500" />}
            label="Interview → Offer Rate"
            value={`${interviewToOfferRate}%`}
            sub={`${offers} offer${offers !== 1 ? 's' : ''} received`}
            color="bg-green-50"
          />
          <KPICard
            icon={<Award className="w-5 h-5 text-amber-500" />}
            label="Avg Match Score"
            value={avgScore}
            sub="out of 100"
            color="bg-amber-50"
          />
        </div>

        {/* Conversion Funnel + Status Distribution */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Application-to-Interview Conversion */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <h2 className="text-base font-semibold text-gray-900 mb-1">Application Funnel</h2>
            <p className="text-xs text-gray-500 mb-6">Conversion across hiring stages</p>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={conversionData} barSize={40}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                <XAxis dataKey="stage" tick={{ fontSize: 12, fill: '#6b7280' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 12, fill: '#6b7280' }} axisLine={false} tickLine={false} allowDecimals={false} />
                <Tooltip
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)', fontSize: '12px' }}
                />
                <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                  {conversionData.map((entry, i) => (
                    <Cell key={i} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
            {/* Conversion rates */}
            <div className="mt-4 flex gap-4">
              <div className="flex-1 bg-violet-50 rounded-xl p-3 text-center">
                <p className="text-xl font-bold text-violet-700">{appToInterviewRate}%</p>
                <p className="text-xs text-violet-600">Applied → Interview</p>
              </div>
              <div className="flex-1 bg-green-50 rounded-xl p-3 text-center">
                <p className="text-xl font-bold text-green-700">{interviewToOfferRate}%</p>
                <p className="text-xs text-green-600">Interview → Offer</p>
              </div>
            </div>
          </div>

          {/* Status Distribution */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <h2 className="text-base font-semibold text-gray-900 mb-1">Status Distribution</h2>
            <p className="text-xs text-gray-500 mb-4">Applications by current status</p>
            <div className="flex items-center gap-4">
              <ResponsiveContainer width="55%" height={200}>
                <PieChart>
                  <Pie
                    data={statusData}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={85}
                    dataKey="value"
                    strokeWidth={2}
                  >
                    {statusData.map((entry, i) => (
                      <Cell key={i} fill={entry.fill} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)', fontSize: '12px' }} />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex-1 space-y-2">
                {statusData.map((d, i) => (
                  <div key={i} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: d.fill }} />
                      <span className="text-xs text-gray-600">{d.name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-16 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                        <div className="h-full rounded-full" style={{ width: `${total > 0 ? (d.value / total) * 100 : 0}%`, backgroundColor: d.fill }} />
                      </div>
                      <span className="text-xs font-semibold text-gray-700 w-4">{d.value}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Match Score Distribution + Timeline */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Match Score Distribution */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <h2 className="text-base font-semibold text-gray-900 mb-1">Match Score Distribution</h2>
            <p className="text-xs text-gray-500 mb-6">How well your applications match requirements</p>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={scoreRanges} barSize={32}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                <XAxis dataKey="range" tick={{ fontSize: 11, fill: '#6b7280' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#6b7280' }} axisLine={false} tickLine={false} allowDecimals={false} />
                <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)', fontSize: '12px' }} />
                <Bar dataKey="count" name="Applications" radius={[5, 5, 0, 0]}>
                  {scoreRanges.map((entry, i) => (
                    <Cell key={i} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Skills Gap Analysis */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <h2 className="text-base font-semibold text-gray-900 mb-1">Skills Gap Analysis</h2>
            <p className="text-xs text-gray-500 mb-6">Matched vs required skills per application</p>
            {skillsData.length === 0 ? (
              <div className="flex items-center justify-center h-48 text-gray-300 text-sm">Add skills to applications</div>
            ) : (
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={skillsData} layout="vertical" barSize={12}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" horizontal={false} />
                  <XAxis type="number" tick={{ fontSize: 11, fill: '#6b7280' }} axisLine={false} tickLine={false} />
                  <YAxis type="category" dataKey="company" tick={{ fontSize: 11, fill: '#6b7280' }} axisLine={false} tickLine={false} width={60} />
                  <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)', fontSize: '12px' }} />
                  <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: '11px' }} />
                  <Bar dataKey="matched" name="Skills Matched" fill="#6366f1" radius={[0, 4, 4, 0]} />
                  <Bar dataKey="gap" name="Skills Gap" fill="#fca5a5" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Applications Timeline */}
        {timelineData.length > 0 && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <h2 className="text-base font-semibold text-gray-900 mb-1">Application Timeline</h2>
            <p className="text-xs text-gray-500 mb-6">Number of applications added over time</p>
            <ResponsiveContainer width="100%" height={180}>
              <LineChart data={timelineData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                <XAxis dataKey="month" tick={{ fontSize: 12, fill: '#6b7280' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 12, fill: '#6b7280' }} axisLine={false} tickLine={false} allowDecimals={false} />
                <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)', fontSize: '12px' }} />
                <Line
                  type="monotone"
                  dataKey="count"
                  name="Applications"
                  stroke="#6366f1"
                  strokeWidth={2.5}
                  dot={{ fill: '#6366f1', strokeWidth: 2, r: 5 }}
                  activeDot={{ r: 7 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Rejection Analysis */}
        {rejected > 0 && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <h2 className="text-base font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <XCircle className="w-4 h-4 text-red-400" /> Rejection Analysis
            </h2>
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-red-50 rounded-xl p-4 text-center">
                <p className="text-2xl font-bold text-red-600">{rejected}</p>
                <p className="text-xs text-red-500 mt-1">Total Rejections</p>
              </div>
              <div className="bg-orange-50 rounded-xl p-4 text-center">
                <p className="text-2xl font-bold text-orange-600">
                  {applied > 0 ? Math.round((rejected / applied) * 100) : 0}%
                </p>
                <p className="text-xs text-orange-500 mt-1">Rejection Rate</p>
              </div>
              <div className="bg-amber-50 rounded-xl p-4 text-center">
                <p className="text-2xl font-bold text-amber-600">
                  {Math.round(
                    applications.filter(a => a.status === 'rejected').reduce((sum, a) => sum + calculateMatchScore(a).total, 0) /
                    (rejected || 1)
                  )}
                </p>
                <p className="text-xs text-amber-500 mt-1">Avg Match Score (Rejected)</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function KPICard({ icon, label, value, sub, color }: {
  icon: React.ReactNode; label: string; value: string | number; sub: string; color: string;
}) {
  return (
    <div className={`${color} rounded-2xl p-5`}>
      <div className="flex items-center gap-2 mb-3">
        {icon}
        <span className="text-xs font-medium text-gray-600">{label}</span>
      </div>
      <p className="text-3xl font-bold text-gray-900">{value}</p>
      <p className="text-xs text-gray-500 mt-1">{sub}</p>
    </div>
  );
}
