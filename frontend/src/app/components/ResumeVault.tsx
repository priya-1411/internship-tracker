import React, { useState, useRef, useCallback } from 'react';
import {
  FileText, Upload, Trash2, Download, ExternalLink, Plus,
  Loader2, Search, Filter, Clock, HardDrive, Tag, StickyNote,
  CheckCircle, AlertCircle, X, FolderOpen, ChevronDown
} from 'lucide-react';
import { useStore } from '../store';
import { Resume } from '../../types';

// ── Helpers ────────────────────────────────────────────────────────────────────

function formatBytes(bytes: number) {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function fileIcon(filename: string) {
  const ext = filename.split('.').pop()?.toLowerCase();
  if (ext === 'pdf') return '📄';
  if (ext === 'doc' || ext === 'docx') return '📝';
  return '📎';
}

// ── Upload Modal ───────────────────────────────────────────────────────────────

function UploadModal({
  appId,
  companyName,
  onClose,
  onUploaded,
}: {
  appId: string;
  companyName: string;
  onClose: () => void;
  onUploaded: (r: Resume) => void;
}) {
  const { uploadResume } = useStore();
  const [file, setFile] = useState<File | null>(null);
  const [version, setVersion] = useState('v1');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const ALLOWED = ['application/pdf', 'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];

  const handleFile = (f: File) => {
    if (!ALLOWED.includes(f.type)) { setError('Only PDF and Word documents are accepted.'); return; }
    if (f.size > 10 * 1024 * 1024) { setError('File must be under 10 MB.'); return; }
    setFile(f);
    setError(null);
  };

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const f = e.dataTransfer.files[0];
    if (f) handleFile(f);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) { setError('Please select a file.'); return; }
    setLoading(true);
    setError(null);
    try {
      const resume = await uploadResume(appId, file, version, notes);
      onUploaded(resume);
      onClose();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div>
            <h3 className="font-semibold text-gray-900">Upload Resume</h3>
            <p className="text-xs text-gray-400 mt-0.5">For {companyName}</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <X className="w-4 h-4 text-gray-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Drop zone */}
          <div
            onClick={() => fileRef.current?.click()}
            onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
            onDragLeave={() => setDragging(false)}
            onDrop={onDrop}
            className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-colors ${
              dragging ? 'border-indigo-400 bg-indigo-50' : file ? 'border-emerald-300 bg-emerald-50' : 'border-gray-200 hover:border-indigo-300 hover:bg-gray-50'
            }`}
          >
            <input
              ref={fileRef}
              type="file"
              accept=".pdf,.doc,.docx"
              className="hidden"
              onChange={(e) => { if (e.target.files?.[0]) handleFile(e.target.files[0]); }}
            />
            {file ? (
              <>
                <CheckCircle className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
                <p className="text-sm font-medium text-emerald-700">{file.name}</p>
                <p className="text-xs text-emerald-500 mt-1">{formatBytes(file.size)}</p>
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); setFile(null); }}
                  className="mt-2 text-xs text-gray-400 hover:text-red-500"
                >
                  Remove
                </button>
              </>
            ) : (
              <>
                <Upload className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                <p className="text-sm font-medium text-gray-600">Click or drag to upload</p>
                <p className="text-xs text-gray-400 mt-1">PDF, DOC, DOCX · Max 10 MB</p>
              </>
            )}
          </div>

          {error && (
            <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
              <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
              <p className="text-xs text-red-700">{error}</p>
            </div>
          )}

          {/* Version + Notes */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Version Label</label>
              <input
                value={version}
                onChange={(e) => setVersion(e.target.value)}
                placeholder="e.g. v2, SWE-Focused"
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Notes</label>
              <input
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="e.g. Tailored for ML"
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          <div className="flex gap-3 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 border border-gray-200 text-gray-700 rounded-xl py-2.5 text-sm font-medium hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !file}
              className="flex-1 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-xl py-2.5 text-sm font-medium flex items-center justify-center gap-2 transition-colors"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
              {loading ? 'Uploading…' : 'Upload'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Resume Card ────────────────────────────────────────────────────────────────

function ResumeCard({
  resume,
  companyName,
  jobTitle,
  onDelete,
}: {
  resume: Resume;
  companyName: string;
  jobTitle: string;
  onDelete: () => void;
}) {
  const { getResumeUrl } = useStore();
  const [urlLoading, setUrlLoading] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(false);

  const handleDownload = async () => {
    setUrlLoading(true);
    try {
      const url = await getResumeUrl(resume.appId, resume.id);
      window.open(url, '_blank');
    } catch (e) {
      console.error('Failed to get download URL:', e);
    } finally {
      setUrlLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 hover:shadow-md transition-shadow">
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 bg-violet-100 rounded-xl flex items-center justify-center text-xl flex-shrink-0">
          {fileIcon(resume.filename)}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-gray-900 truncate" title={resume.filename}>
            {resume.filename}
          </p>
          <p className="text-xs text-gray-500 mt-0.5 truncate">
            {companyName} · {jobTitle}
          </p>
          <div className="flex flex-wrap items-center gap-2 mt-2">
            <span className="inline-flex items-center gap-1 text-[10px] bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-full font-medium">
              <Tag className="w-2.5 h-2.5" /> {resume.version}
            </span>
            <span className="inline-flex items-center gap-1 text-[10px] text-gray-400">
              <HardDrive className="w-2.5 h-2.5" /> {formatBytes(resume.size)}
            </span>
            <span className="inline-flex items-center gap-1 text-[10px] text-gray-400">
              <Clock className="w-2.5 h-2.5" /> {formatDate(resume.uploadedAt)}
            </span>
          </div>
          {resume.notes && (
            <p className="text-[10px] text-gray-400 mt-1.5 flex items-center gap-1">
              <StickyNote className="w-2.5 h-2.5 flex-shrink-0" />
              <span className="truncate">{resume.notes}</span>
            </p>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2 mt-3 pt-3 border-t border-gray-50">
        <button
          onClick={handleDownload}
          disabled={urlLoading}
          className="flex-1 flex items-center justify-center gap-1.5 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-lg text-xs font-medium transition-colors disabled:opacity-50"
        >
          {urlLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <ExternalLink className="w-3.5 h-3.5" />}
          Open
        </button>
        {deleteConfirm ? (
          <>
            <button
              onClick={onDelete}
              className="flex-1 flex items-center justify-center gap-1 py-1.5 bg-red-500 text-white rounded-lg text-xs font-medium hover:bg-red-600 transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" /> Confirm Delete
            </button>
            <button
              onClick={() => setDeleteConfirm(false)}
              className="py-1.5 px-3 bg-gray-100 text-gray-600 rounded-lg text-xs hover:bg-gray-200 transition-colors"
            >
              Cancel
            </button>
          </>
        ) : (
          <button
            onClick={() => setDeleteConfirm(true)}
            className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
            title="Delete"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    </div>
  );
}

// ── Main Vault ─────────────────────────────────────────────────────────────────

export function ResumeVault() {
  const { applications, resumes, resumesLoading, deleteResume, refreshResumes } = useStore();
  const [search, setSearch] = useState('');
  const [filterAppId, setFilterAppId] = useState<string>('all');
  const [uploadTarget, setUploadTarget] = useState<{ appId: string; company: string } | null>(null);
  const [justUploaded, setJustUploaded] = useState<Resume | null>(null);

  const appMap = Object.fromEntries(applications.map((a) => [a.id, a]));

  const filtered = resumes.filter((r) => {
    const app = appMap[r.appId];
    const text = `${r.filename} ${r.version} ${r.notes} ${app?.company ?? ''} ${app?.jobTitle ?? ''}`.toLowerCase();
    const matchSearch = search === '' || text.includes(search.toLowerCase());
    const matchFilter = filterAppId === 'all' || r.appId === filterAppId;
    return matchSearch && matchFilter;
  });

  // Group by application
  const grouped = filtered.reduce((acc, r) => {
    if (!acc[r.appId]) acc[r.appId] = [];
    acc[r.appId].push(r);
    return acc;
  }, {} as Record<string, Resume[]>);

  const totalSize = resumes.reduce((sum, r) => sum + r.size, 0);

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="px-8 py-6 border-b border-gray-100 bg-white">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-violet-100 rounded-xl flex items-center justify-center">
              <FileText className="w-5 h-5 text-violet-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Resume Vault</h1>
              <p className="text-sm text-gray-400">
                {resumes.length} file{resumes.length !== 1 ? 's' : ''} · {formatBytes(totalSize)} used
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={refreshResumes}
              disabled={resumesLoading}
              className="flex items-center gap-1.5 px-3 py-2 bg-gray-50 border border-gray-200 text-gray-600 rounded-xl text-sm hover:bg-gray-100 transition-colors disabled:opacity-50"
            >
              <Loader2 className={`w-4 h-4 ${resumesLoading ? 'animate-spin' : 'hidden'}`} />
              Refresh
            </button>
            {applications.length > 0 && (
              <div className="relative">
                <select
                  value={uploadTarget?.appId ?? ''}
                  onChange={(e) => {
                    const app = applications.find((a) => a.id === e.target.value);
                    if (app) setUploadTarget({ appId: app.id, company: app.company });
                  }}
                  className="appearance-none pl-4 pr-8 py-2 bg-violet-600 text-white rounded-xl text-sm font-medium focus:outline-none cursor-pointer hover:bg-violet-700 transition-colors"
                >
                  <option value="" disabled>Upload for Application…</option>
                  {applications.map((a) => (
                    <option key={a.id} value={a.id}>{a.company} — {a.jobTitle}</option>
                  ))}
                </select>
                <Upload className="w-4 h-4 text-white absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            )}
          </div>
        </div>

        {/* Search + filter row */}
        <div className="flex items-center gap-3 mt-4">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search resumes…"
              className="w-full pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            <select
              value={filterAppId}
              onChange={(e) => setFilterAppId(e.target.value)}
              className="appearance-none pl-9 pr-8 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="all">All Applications</option>
              {applications.map((a) => (
                <option key={a.id} value={a.id}>{a.company}</option>
              ))}
            </select>
            <ChevronDown className="w-4 h-4 text-gray-400 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-8">
        {resumesLoading ? (
          <div className="flex flex-col items-center justify-center h-48">
            <Loader2 className="w-8 h-8 text-violet-400 animate-spin mb-3" />
            <p className="text-gray-400 text-sm">Loading your resumes…</p>
          </div>
        ) : resumes.length === 0 ? (
          /* Empty state */
          <div className="flex flex-col items-center justify-center h-64 text-center">
            <div className="w-20 h-20 bg-violet-100 rounded-2xl flex items-center justify-center mb-4">
              <FolderOpen className="w-10 h-10 text-violet-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-700 mb-1">Your Resume Vault is empty</h3>
            <p className="text-sm text-gray-400 mb-4 max-w-xs">
              Upload tailored resumes for each application and track different versions.
            </p>
            {applications.length === 0 ? (
              <p className="text-xs text-gray-400">Add an application first, then upload resumes for it.</p>
            ) : (
              <button
                onClick={() => {
                  const a = applications[0];
                  setUploadTarget({ appId: a.id, company: a.company });
                }}
                className="flex items-center gap-2 px-4 py-2 bg-violet-600 text-white rounded-xl text-sm font-medium hover:bg-violet-700 transition-colors"
              >
                <Upload className="w-4 h-4" /> Upload First Resume
              </button>
            )}
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48">
            <Search className="w-8 h-8 text-gray-200 mb-3" />
            <p className="text-gray-400 text-sm">No resumes match your search.</p>
          </div>
        ) : (
          <div className="space-y-8">
            {Object.entries(grouped).map(([appId, appResumes]) => {
              const app = appMap[appId];
              if (!app) return null;
              return (
                <div key={appId}>
                  {/* Section header */}
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 bg-indigo-600 rounded-lg flex items-center justify-center">
                        <span className="text-white text-xs font-bold">{app.company.charAt(0)}</span>
                      </div>
                      <div>
                        <span className="text-sm font-semibold text-gray-900">{app.company}</span>
                        <span className="text-xs text-gray-400 ml-2">{app.jobTitle}</span>
                      </div>
                      <span className="text-xs bg-violet-100 text-violet-700 px-2 py-0.5 rounded-full font-medium">
                        {appResumes.length} file{appResumes.length > 1 ? 's' : ''}
                      </span>
                    </div>
                    <button
                      onClick={() => setUploadTarget({ appId, company: app.company })}
                      className="flex items-center gap-1 text-xs text-indigo-600 hover:text-indigo-700 font-medium"
                    >
                      <Plus className="w-3.5 h-3.5" /> Add version
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                    {appResumes.map((r) => (
                      <ResumeCard
                        key={r.id}
                        resume={r}
                        companyName={app.company}
                        jobTitle={app.jobTitle}
                        onDelete={() => deleteResume(r.appId, r.id)}
                      />
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Upload Modal */}
      {uploadTarget && (
        <UploadModal
          appId={uploadTarget.appId}
          companyName={uploadTarget.company}
          onClose={() => setUploadTarget(null)}
          onUploaded={(r) => { setJustUploaded(r); setUploadTarget(null); }}
        />
      )}
    </div>
  );
}
