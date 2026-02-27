import React, { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router';
import {
  LayoutDashboard, Network, BarChart3, GraduationCap, Plus,
  ChevronRight, Menu, X, LogOut, RefreshCw, User,
  FileText, Bell, BellOff, Home
} from 'lucide-react';
import { useStore } from '../store';
import { ApplicationModal } from './ApplicationModal';
import { STATUS_CONFIG } from '../utils';
import { ApplicationStatus } from '../../types';

const NAV_ITEMS = [
  { to: '/', icon: Home, label: 'Home', end: true },
  { to: '/kanban', icon: LayoutDashboard, label: 'Kanban Board', end: true },
  { to: '/networking', icon: Network, label: 'Shadow Networking', end: false },
  { to: '/analytics', icon: BarChart3, label: 'Analytics', end: false },
  { to: '/vault', icon: FileText, label: 'Resume Vault', end: false },
];

const STATUS_ORDER: ApplicationStatus[] = ['to-apply', 'applied', 'interviewing', 'offer', 'rejected'];

export function Layout() {
  const {
    applications, signOut, user, dataLoading, refreshApplications,
    pushSubscribed, pushPermission,
  } = useStore();
  const navigate = useNavigate();
  const [showModal, setShowModal] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const counts = STATUS_ORDER.reduce((acc, s) => {
    acc[s] = applications.filter(a => a.status === s).length;
    return acc;
  }, {} as Record<ApplicationStatus, number>);

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      {/* Sidebar */}
      <aside
        className={`${sidebarOpen ? 'w-64' : 'w-16'} flex-shrink-0 bg-gradient-to-b from-slate-900 via-indigo-950 to-slate-900 flex flex-col transition-all duration-300 overflow-hidden`}
      >
        {/* Logo */}
        <div className="flex items-center justify-between px-4 py-5 border-b border-white/10">
          {sidebarOpen && (
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-8 h-8 bg-indigo-500 rounded-lg flex items-center justify-center flex-shrink-0">
                <GraduationCap className="w-4 h-4 text-white" />
              </div>
              <div className="min-w-0">
                <p className="text-white font-bold text-sm leading-tight">InternTrack</p>
                <p className="text-indigo-400 text-xs">Application Manager</p>
              </div>
            </div>
          )}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-1.5 text-indigo-300 hover:text-white hover:bg-white/10 rounded-lg transition-colors flex-shrink-0"
          >
            {sidebarOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
          </button>
        </div>

        {/* Add Button */}
        <div className="px-3 py-4">
          <button
            onClick={() => { navigate('/kanban'); setShowModal(true); }}
            className="w-full bg-indigo-500 hover:bg-indigo-400 text-white rounded-xl py-2.5 flex items-center justify-center gap-2 transition-colors text-sm font-medium shadow-lg shadow-indigo-500/20"
          >
            <Plus className="w-4 h-4 flex-shrink-0" />
            {sidebarOpen && <span>Add Application</span>}
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 space-y-1 overflow-y-auto">
          {sidebarOpen && (
            <p className="text-indigo-400/60 text-[10px] font-semibold uppercase tracking-wider px-2 mb-2">Navigation</p>
          )}
          {NAV_ITEMS.map(({ to, icon: Icon, label, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all ${isActive
                  ? 'bg-indigo-500/20 text-white border border-indigo-500/30'
                  : 'text-indigo-200/70 hover:bg-white/5 hover:text-indigo-100'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <Icon className={`w-4 h-4 flex-shrink-0 ${isActive ? 'text-indigo-400' : ''}`} />
                  {sidebarOpen && (
                    <>
                      <span className="flex-1 font-medium">{label}</span>
                      {isActive && <ChevronRight className="w-3.5 h-3.5 text-indigo-400" />}
                    </>
                  )}
                </>
              )}
            </NavLink>
          ))}

          {/* Status Summary */}
          {sidebarOpen && (
            <div className="mt-6">
              <p className="text-indigo-400/60 text-[10px] font-semibold uppercase tracking-wider px-2 mb-2">Pipeline</p>
              <div className="space-y-1">
                {STATUS_ORDER.map(status => {
                  const config = STATUS_CONFIG[status];
                  return (
                    <div key={status} className="flex items-center justify-between px-3 py-1.5 rounded-lg hover:bg-white/5 transition-colors">
                      <div className="flex items-center gap-2">
                        <span className={`w-2 h-2 rounded-full ${config.dot}`} />
                        <span className="text-xs text-indigo-200/60">{config.label.replace(' 🎉', '')}</span>
                      </div>
                      <span className="text-xs font-bold text-indigo-300 bg-white/10 px-1.5 py-0.5 rounded-md">
                        {counts[status]}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </nav>

        {/* Footer */}
        {sidebarOpen ? (
          <div className="px-4 py-4 border-t border-white/10 space-y-3">
            {/* User info */}
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 bg-indigo-500/30 rounded-full flex items-center justify-center flex-shrink-0">
                <User className="w-3.5 h-3.5 text-indigo-300" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-white text-xs font-medium truncate">
                  {user?.name || user?.email?.split('@')[0] || 'User'}
                </p>
                <p className="text-indigo-400 text-[10px] truncate">{user?.email}</p>
              </div>
              {/* Push status badge */}
              {pushPermission !== 'unsupported' && (
                <div title={pushSubscribed ? 'Push notifications on' : 'Push notifications off'}>
                  {pushSubscribed
                    ? <Bell className="w-3.5 h-3.5 text-indigo-400" />
                    : <BellOff className="w-3.5 h-3.5 text-indigo-600/40" />}
                </div>
              )}
            </div>
            {/* Actions */}
            <div className="flex items-center gap-2">
              <button
                onClick={refreshApplications}
                disabled={dataLoading}
                className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-indigo-300 hover:bg-white/10 transition-colors text-xs disabled:opacity-50"
                title="Sync from server"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${dataLoading ? 'animate-spin' : ''}`} />
                {dataLoading ? 'Syncing…' : 'Sync'}
              </button>
              <button
                onClick={signOut}
                className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-indigo-300 hover:bg-red-500/20 hover:text-red-300 transition-colors text-xs"
                title="Sign out"
              >
                <LogOut className="w-3.5 h-3.5" />
                Sign Out
              </button>
            </div>
          </div>
        ) : (
          <div className="px-2 py-4 border-t border-white/10 flex flex-col gap-2">
            <button
              onClick={refreshApplications}
              disabled={dataLoading}
              className="p-2 rounded-lg text-indigo-300 hover:bg-white/10 transition-colors flex items-center justify-center disabled:opacity-50"
              title="Sync"
            >
              <RefreshCw className={`w-4 h-4 ${dataLoading ? 'animate-spin' : ''}`} />
            </button>
            <button
              onClick={signOut}
              className="p-2 rounded-lg text-indigo-300 hover:bg-red-500/20 hover:text-red-300 transition-colors flex items-center justify-center"
              title="Sign out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        )}
      </aside>

      {/* Main */}
      <main className="flex-1 overflow-hidden">
        <Outlet />
      </main>

      {showModal && <ApplicationModal onClose={() => setShowModal(false)} />}
    </div>
  );
}
