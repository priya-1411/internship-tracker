import React, { useState } from 'react';
import { useDrag } from 'react-dnd';
import {
  MapPin, DollarSign, Calendar, Clock, Star, Users, Pencil, Trash2, ChevronDown, ChevronUp, Award
} from 'lucide-react';
import { Application } from '../../types';
import { calculateMatchScore, getDaysSinceContact, getGhostingInfo, getMatchScoreBg } from '../utils';
import { ApplicationModal } from './ApplicationModal';
import { useStore } from '../store';

interface Props {
  application: Application;
}

export function ApplicationCard({ application }: Props) {
  const { deleteApplication } = useStore();
  const [showEdit, setShowEdit] = useState(false);
  const [expanded, setExpanded] = useState(false);

  const [{ isDragging }, drag] = useDrag(() => ({
    type: 'APPLICATION',
    item: { id: application.id, status: application.status },
    collect: monitor => ({ isDragging: monitor.isDragging() }),
  }));

  const score = calculateMatchScore(application);
  const days = getDaysSinceContact(application.lastContactDate);
  const ghosting = getGhostingInfo(days);
  const scoreBg = getMatchScoreBg(score.total);

  const companyInitial = application.company.charAt(0).toUpperCase();
  const companyColors = [
    'bg-indigo-500', 'bg-blue-500', 'bg-violet-500', 'bg-emerald-500',
    'bg-rose-500', 'bg-amber-500', 'bg-cyan-500', 'bg-pink-500',
  ];
  const colorIndex = application.company.charCodeAt(0) % companyColors.length;
  const avatarColor = companyColors[colorIndex];

  return (
    <>
      <div
        ref={drag as any}
        className={`bg-white rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-all cursor-grab active:cursor-grabbing ${
          isDragging ? 'opacity-40 scale-95' : 'opacity-100'
        }`}
      >
        {/* Card Header */}
        <div className="p-4">
          <div className="flex items-start justify-between gap-2 mb-3">
            <div className="flex items-center gap-3">
              <div className={`w-9 h-9 rounded-lg ${avatarColor} flex items-center justify-center text-white font-bold text-sm flex-shrink-0`}>
                {companyInitial}
              </div>
              <div className="min-w-0">
                <h4 className="font-semibold text-gray-900 text-sm leading-tight truncate">{application.company}</h4>
                <p className="text-xs text-gray-500 truncate">{application.jobTitle}</p>
              </div>
            </div>
            <div className={`flex-shrink-0 px-2 py-0.5 rounded-full text-xs font-bold ${scoreBg}`}>
              {score.total}
            </div>
          </div>

          {/* Key Info */}
          <div className="space-y-1.5 mb-3">
            {application.location && (
              <div className="flex items-center gap-1.5 text-xs text-gray-500">
                <MapPin className="w-3 h-3" />
                <span className="truncate">{application.location}</span>
              </div>
            )}
            {application.salary && (
              <div className="flex items-center gap-1.5 text-xs text-gray-500">
                <DollarSign className="w-3 h-3" />
                <span>{application.salary}</span>
              </div>
            )}
            {application.deadline && (
              <div className="flex items-center gap-1.5 text-xs text-gray-500">
                <Calendar className="w-3 h-3" />
                <span>Due {new Date(application.deadline).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
              </div>
            )}
          </div>

          {/* Ghosting Timer */}
          {days >= 0 && (
            <div className="mb-3">
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-1 text-xs text-gray-500">
                  <Clock className="w-3 h-3" />
                  <span>Last Contact</span>
                </div>
                <span className={`text-xs font-medium ${ghosting.color}`}>{ghosting.label}</span>
              </div>
              <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${ghosting.barColor}`}
                  style={{ width: `${ghosting.percent}%` }}
                />
              </div>
            </div>
          )}

          {/* Referral & Contacts badges */}
          <div className="flex items-center gap-2 flex-wrap">
            {application.hasReferral && (
              <span className="inline-flex items-center gap-1 text-xs bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-full font-medium">
                <Star className="w-2.5 h-2.5" /> Referral
              </span>
            )}
            {application.networkingContacts.length > 0 && (
              <span className="inline-flex items-center gap-1 text-xs bg-violet-50 text-violet-700 px-2 py-0.5 rounded-full font-medium">
                <Users className="w-2.5 h-2.5" /> {application.networkingContacts.length} Contact{application.networkingContacts.length > 1 ? 's' : ''}
              </span>
            )}
          </div>
        </div>

        {/* Expandable details */}
        {expanded && (
          <div className="border-t border-gray-50 px-4 pb-4 pt-3 space-y-3">
            {/* Match Score Breakdown */}
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2 flex items-center gap-1">
                <Award className="w-3 h-3" /> Match Score Breakdown
              </p>
              <div className="space-y-1.5">
                <ScoreBar label="Skills Match" value={score.skillScore} max={40} color="bg-blue-500" />
                <ScoreBar label="GPA Score" value={score.gpaScore} max={30} color="bg-violet-500" />
                <ScoreBar label="Referral Bonus" value={score.referralScore} max={30} color="bg-emerald-500" />
              </div>
            </div>

            {/* Skills */}
            {application.skills.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Your Skills</p>
                <div className="flex flex-wrap gap-1">
                  {application.skills.map(skill => {
                    const isMatch = score.matchedSkills.map(s => s.toLowerCase()).includes(skill.toLowerCase());
                    return (
                      <span
                        key={skill}
                        className={`text-xs px-2 py-0.5 rounded-full ${
                          isMatch ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
                        }`}
                      >
                        {skill}
                      </span>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Notes */}
            {application.notes && (
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Notes</p>
                <p className="text-xs text-gray-600 leading-relaxed">{application.notes}</p>
              </div>
            )}
          </div>
        )}

        {/* Card Footer */}
        <div className="border-t border-gray-50 px-4 py-2.5 flex items-center justify-between">
          <button
            onClick={() => setExpanded(!expanded)}
            className="text-xs text-gray-400 hover:text-gray-600 flex items-center gap-1 transition-colors"
          >
            {expanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            {expanded ? 'Less' : 'Details'}
          </button>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setShowEdit(true)}
              className="p-1.5 hover:bg-indigo-50 hover:text-indigo-600 text-gray-400 rounded-lg transition-colors"
            >
              <Pencil className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => {
                if (window.confirm(`Remove ${application.company} from tracker?`)) {
                  deleteApplication(application.id);
                }
              }}
              className="p-1.5 hover:bg-red-50 hover:text-red-500 text-gray-400 rounded-lg transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {showEdit && <ApplicationModal onClose={() => setShowEdit(false)} editApp={application} />}
    </>
  );
}

function ScoreBar({ label, value, max, color }: { label: string; value: number; max: number; color: string }) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-xs text-gray-500 w-24 flex-shrink-0">{label}</span>
      <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${(value / max) * 100}%` }} />
      </div>
      <span className="text-xs font-medium text-gray-700 w-10 text-right">{value}/{max}</span>
    </div>
  );
}
