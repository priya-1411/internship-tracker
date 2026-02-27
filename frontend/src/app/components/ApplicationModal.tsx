import React, { useState, useEffect } from 'react';
import { X, Plus, Trash2, User } from 'lucide-react';
import { useStore } from '../store';
import { Application, ApplicationStatus, NetworkingContact } from '../../types';

interface Props {
  onClose: () => void;
  editApp?: Application | null;
}

const defaultForm = {
  company: '',
  jobTitle: '',
  location: '',
  salary: '',
  deadline: '',
  status: 'to-apply' as ApplicationStatus,
  skills: '',
  requiredSkills: '',
  gpa: '',
  hasReferral: false,
  lastContactDate: '',
  appliedDate: '',
  notes: '',
};

export function ApplicationModal({ onClose, editApp }: Props) {
  const { addApplication, updateApplication } = useStore();
  const [form, setForm] = useState(defaultForm);
  const [contacts, setContacts] = useState<Omit<NetworkingContact, 'id'>[]>([]);

  useEffect(() => {
    if (editApp) {
      setForm({
        company: editApp.company,
        jobTitle: editApp.jobTitle,
        location: editApp.location,
        salary: editApp.salary,
        deadline: editApp.deadline,
        status: editApp.status,
        skills: editApp.skills.join(', '),
        requiredSkills: editApp.requiredSkills.join(', '),
        gpa: String(editApp.gpa),
        hasReferral: editApp.hasReferral,
        lastContactDate: editApp.lastContactDate,
        appliedDate: editApp.appliedDate,
        notes: editApp.notes,
      });
      setContacts(editApp.networkingContacts.map(({ id, ...rest }) => rest));
    }
  }, [editApp]);

  const addContact = () => {
    setContacts(prev => [...prev, { name: '', role: '', company: form.company, linkedinUrl: '', lastContactDate: '', notes: '' }]);
  };

  const removeContact = (i: number) => {
    setContacts(prev => prev.filter((_, idx) => idx !== i));
  };

  const updateContact = (i: number, field: string, value: string) => {
    setContacts(prev => prev.map((c, idx) => idx === i ? { ...c, [field]: value } : c));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const appData = {
      company: form.company,
      jobTitle: form.jobTitle,
      location: form.location,
      salary: form.salary,
      deadline: form.deadline,
      status: form.status,
      skills: form.skills.split(',').map(s => s.trim()).filter(Boolean),
      requiredSkills: form.requiredSkills.split(',').map(s => s.trim()).filter(Boolean),
      gpa: parseFloat(form.gpa) || 0,
      hasReferral: form.hasReferral,
      lastContactDate: form.lastContactDate,
      appliedDate: form.appliedDate,
      networkingContacts: contacts.map(c => ({ ...c, id: crypto.randomUUID() })),
      notes: form.notes,
    };

    if (editApp) {
      updateApplication(editApp.id, appData);
    } else {
      addApplication(appData);
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between rounded-t-2xl z-10">
          <h2 className="text-lg font-semibold text-gray-900">
            {editApp ? 'Edit Application' : 'Add New Application'}
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Basic Info */}
          <div>
            <h3 className="text-sm font-semibold text-gray-700 mb-3 uppercase tracking-wide">Company & Role</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Company Name *</label>
                <input
                  required
                  value={form.company}
                  onChange={e => setForm(p => ({ ...p, company: e.target.value }))}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="e.g. Google"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Job Title *</label>
                <input
                  required
                  value={form.jobTitle}
                  onChange={e => setForm(p => ({ ...p, jobTitle: e.target.value }))}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="e.g. SWE Intern"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
                <input
                  value={form.location}
                  onChange={e => setForm(p => ({ ...p, location: e.target.value }))}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="e.g. San Francisco, CA"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Salary / Stipend</label>
                <input
                  value={form.salary}
                  onChange={e => setForm(p => ({ ...p, salary: e.target.value }))}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="e.g. $8,500/month"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Deadline</label>
                <input
                  type="date"
                  value={form.deadline}
                  onChange={e => setForm(p => ({ ...p, deadline: e.target.value }))}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                <select
                  value={form.status}
                  onChange={e => setForm(p => ({ ...p, status: e.target.value as ApplicationStatus }))}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="to-apply">To Apply</option>
                  <option value="applied">Applied</option>
                  <option value="interviewing">Interviewing</option>
                  <option value="offer">Offer</option>
                  <option value="rejected">Rejected</option>
                </select>
              </div>
            </div>
          </div>

          {/* Match Score Factors */}
          <div>
            <h3 className="text-sm font-semibold text-gray-700 mb-3 uppercase tracking-wide">Match Score Factors</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Your Skills (comma-separated)</label>
                <input
                  value={form.skills}
                  onChange={e => setForm(p => ({ ...p, skills: e.target.value }))}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="e.g. Python, React, Machine Learning"
                />
              </div>
              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Required Skills (comma-separated)</label>
                <input
                  value={form.requiredSkills}
                  onChange={e => setForm(p => ({ ...p, requiredSkills: e.target.value }))}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="e.g. Python, SQL, Algorithms"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">GPA (out of 4.0)</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  max="4.0"
                  value={form.gpa}
                  onChange={e => setForm(p => ({ ...p, gpa: e.target.value }))}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="e.g. 3.8"
                />
              </div>
              <div className="flex items-center gap-3 pt-6">
                <input
                  type="checkbox"
                  id="referral"
                  checked={form.hasReferral}
                  onChange={e => setForm(p => ({ ...p, hasReferral: e.target.checked }))}
                  className="w-4 h-4 accent-indigo-600"
                />
                <label htmlFor="referral" className="text-sm font-medium text-gray-700">Have a Referral (+30 pts)</label>
              </div>
            </div>
          </div>

          {/* Dates */}
          <div>
            <h3 className="text-sm font-semibold text-gray-700 mb-3 uppercase tracking-wide">Tracking Dates</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Applied Date</label>
                <input
                  type="date"
                  value={form.appliedDate}
                  onChange={e => setForm(p => ({ ...p, appliedDate: e.target.value }))}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Last Contact Date</label>
                <input
                  type="date"
                  value={form.lastContactDate}
                  onChange={e => setForm(p => ({ ...p, lastContactDate: e.target.value }))}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>
          </div>

          {/* Networking Contacts */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Networking Contacts</h3>
              <button
                type="button"
                onClick={addContact}
                className="flex items-center gap-1 text-xs text-indigo-600 hover:text-indigo-700 font-medium"
              >
                <Plus className="w-3.5 h-3.5" /> Add Contact
              </button>
            </div>
            <div className="space-y-3">
              {contacts.map((contact, i) => (
                <div key={i} className="bg-gray-50 rounded-xl p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4 text-indigo-500" />
                      <span className="text-sm font-medium text-gray-700">Contact {i + 1}</span>
                    </div>
                    <button type="button" onClick={() => removeContact(i)} className="text-red-400 hover:text-red-600">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <input
                      value={contact.name}
                      onChange={e => updateContact(i, 'name', e.target.value)}
                      placeholder="Full Name"
                      className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                    <input
                      value={contact.role}
                      onChange={e => updateContact(i, 'role', e.target.value)}
                      placeholder="Role / Title"
                      className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                    <input
                      value={contact.linkedinUrl}
                      onChange={e => updateContact(i, 'linkedinUrl', e.target.value)}
                      placeholder="LinkedIn URL"
                      className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                    <input
                      type="date"
                      value={contact.lastContactDate}
                      onChange={e => updateContact(i, 'lastContactDate', e.target.value)}
                      className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                    <input
                      value={contact.notes}
                      onChange={e => updateContact(i, 'notes', e.target.value)}
                      placeholder="Notes (how you met, etc.)"
                      className="col-span-2 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                </div>
              ))}
              {contacts.length === 0 && (
                <p className="text-sm text-gray-400 text-center py-3">No contacts added yet. Click "Add Contact" to start networking!</p>
              )}
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
            <textarea
              value={form.notes}
              onChange={e => setForm(p => ({ ...p, notes: e.target.value }))}
              rows={3}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
              placeholder="Any additional notes about this application..."
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 border border-gray-200 text-gray-700 rounded-xl py-2.5 text-sm font-medium hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl py-2.5 text-sm font-medium transition-colors"
            >
              {editApp ? 'Save Changes' : 'Add Application'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
