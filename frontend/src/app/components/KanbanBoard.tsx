import React, { useState } from 'react';
import { DndProvider, useDrop } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { Plus, Search, Filter, GripVertical, Loader2, RefreshCw } from 'lucide-react';
import { ApplicationStatus } from '../../types';
import { useStore } from '../store';
import { ApplicationCard } from './ApplicationCard';
import { ApplicationModal } from './ApplicationModal';
import { STATUS_CONFIG } from '../utils';

const COLUMNS: ApplicationStatus[] = ['to-apply', 'applied', 'interviewing', 'offer', 'rejected'];

function KanbanColumn({
  status,
  onAddClick,
}: {
  status: ApplicationStatus;
  onAddClick: (status: ApplicationStatus) => void;
}) {
  const { applications, updateStatus, user } = useStore();
  const config = STATUS_CONFIG[status];
  const cards = applications.filter(a => a.status === status);

  const isAdmin = user?.role === 'admin';

  const [{ isOver }, drop] = useDrop(() => ({
    accept: 'APPLICATION',
    canDrop: () => isAdmin,
    drop: (item: { id: string; status: string }) => {
      if (isAdmin && item.status !== status) {
        updateStatus(item.id, status);
      }
    },
    collect: monitor => ({ isOver: monitor.isOver() }),
  }), [isAdmin, status, updateStatus]);

  return (
    <div className="flex flex-col w-72 flex-shrink-0">
      {/* Column Header */}
      <div className={`flex items-center justify-between px-4 py-3 rounded-xl mb-3 ${config.headerBg} border ${config.border}`}>
        <div className="flex items-center gap-2">
          <span className={`w-2.5 h-2.5 rounded-full ${config.dot}`} />
          <h3 className={`text-sm font-semibold ${config.color}`}>{config.label}</h3>
          <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${config.badge}`}>
            {cards.length}
          </span>
        </div>
        {isAdmin && (
          <button
            onClick={() => onAddClick(status)}
            className={`p-1 rounded-lg hover:bg-white/60 transition-colors ${config.color}`}
          >
            <Plus className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Drop Zone */}
      <div
        ref={drop as any}
        className={`flex-1 space-y-3 min-h-[200px] rounded-xl p-2 transition-colors ${isOver ? `${config.bg} border-2 border-dashed ${config.border}` : 'bg-transparent'
          }`}
      >
        {cards.map(app => (
          <ApplicationCard key={app.id} application={app} />
        ))}
        {cards.length === 0 && !isOver && (
          <div className="flex flex-col items-center justify-center h-32 text-center">
            <GripVertical className="w-6 h-6 text-gray-200 mb-2" />
            <p className="text-xs text-gray-300">Drag cards here</p>
          </div>
        )}
      </div>
    </div>
  );
}

export function KanbanBoard() {
  const { applications, dataLoading, refreshApplications, user } = useStore();
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [defaultStatus, setDefaultStatus] = useState<ApplicationStatus>('to-apply');

  const isAdmin = user?.role === 'admin';

  const totalApps = applications.length;
  const offerCount = applications.filter(a => a.status === 'offer').length;
  const interviewCount = applications.filter(a => a.status === 'interviewing').length;

  const handleAddClick = (status: ApplicationStatus) => {
    if (!isAdmin) return;
    setDefaultStatus(status);
    setShowModal(true);
  };

  return (
    <DndProvider backend={HTML5Backend}>
      <div className="h-full flex flex-col">
        {/* Header */}
        <div className="px-8 py-6 border-b border-gray-100 bg-white">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Kanban Board</h1>
              <p className="text-sm text-gray-500 mt-0.5">
                {isAdmin
                  ? 'Drag cards between columns to update status'
                  : 'View your internship applications and status'
                }
              </p>
            </div>
            {isAdmin && (
              <button
                onClick={() => { setDefaultStatus('to-apply'); setShowModal(true); }}
                className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2.5 rounded-xl text-sm font-medium transition-colors shadow-sm"
              >
                <Plus className="w-4 h-4" />
                Add Application
              </button>
            )}
          </div>

          {/* Stats Row */}
          <div className="flex items-center gap-6 mb-4">
            <StatChip label="Total Applications" value={totalApps} color="text-indigo-600" />
            <StatChip label="Interviewing" value={interviewCount} color="text-violet-600" />
            <StatChip label="Offers" value={offerCount} color="text-green-600" />
            <StatChip
              label="Conversion Rate"
              value={`${totalApps > 0 ? Math.round((interviewCount / totalApps) * 100) : 0}%`}
              color="text-blue-600"
            />
          </div>

          {/* Search */}
          <div className="flex items-center gap-3">
            <div className="relative max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search applications..."
                className="w-full pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <button
              onClick={refreshApplications}
              disabled={dataLoading}
              className="flex items-center gap-1.5 px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-600 hover:bg-gray-100 transition-colors disabled:opacity-50"
              title="Refresh from server"
            >
              <RefreshCw className={`w-4 h-4 ${dataLoading ? 'animate-spin' : ''}`} />
              {dataLoading ? 'Syncing…' : 'Refresh'}
            </button>
          </div>
        </div>

        {/* Kanban Columns */}
        <div className="flex-1 overflow-x-auto relative">
          {dataLoading && applications.length === 0 && (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-50/80 backdrop-blur-sm z-10">
              <div className="text-center">
                <Loader2 className="w-8 h-8 text-indigo-500 animate-spin mx-auto mb-3" />
                <p className="text-gray-600 text-sm font-medium">Loading your applications…</p>
              </div>
            </div>
          )}
          <div className="flex gap-5 p-8 min-w-max h-full">
            {COLUMNS.map(status => (
              <KanbanColumn key={status} status={status} onAddClick={handleAddClick} />
            ))}
          </div>
        </div>
      </div>

      {showModal && (
        <ApplicationModal
          onClose={() => setShowModal(false)}
          editApp={null}
        />
      )}
    </DndProvider>
  );
}

function StatChip({ label, value, color }: { label: string; value: string | number; color: string }) {
  return (
    <div className="flex items-center gap-2">
      <span className={`text-xl font-bold ${color}`}>{value}</span>
      <span className="text-xs text-gray-500">{label}</span>
    </div>
  );
}