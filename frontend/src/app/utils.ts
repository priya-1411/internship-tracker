import { Application } from '../types';

export function calculateMatchScore(app: Application): {
  total: number;
  skillScore: number;
  gpaScore: number;
  referralScore: number;
  matchedSkills: string[];
} {
  // Skills match (40 points)
  const matchedSkills = app.skills.filter(s =>
    app.requiredSkills.map(r => r.toLowerCase()).includes(s.toLowerCase())
  );
  const skillScore =
    app.requiredSkills.length > 0
      ? Math.round((matchedSkills.length / app.requiredSkills.length) * 40)
      : 20;

  // GPA score (30 points)
  const gpaScore = Math.round(Math.min(app.gpa / 4.0, 1) * 30);

  // Referral score (30 points)
  const referralScore = app.hasReferral ? 30 : 0;

  const total = Math.min(100, skillScore + gpaScore + referralScore);

  return { total, skillScore, gpaScore, referralScore, matchedSkills };
}

export function getDaysSinceContact(lastContactDate: string): number {
  if (!lastContactDate) return -1;
  const last = new Date(lastContactDate);
  const now = new Date();
  return Math.floor((now.getTime() - last.getTime()) / (1000 * 60 * 60 * 24));
}

export function getGhostingInfo(days: number): {
  label: string;
  color: string;
  bgColor: string;
  barColor: string;
  percent: number;
} {
  if (days < 0) return { label: 'No contact yet', color: 'text-gray-400', bgColor: 'bg-gray-100', barColor: 'bg-gray-300', percent: 0 };
  const percent = Math.min((days / 30) * 100, 100);
  if (days <= 7) return { label: `${days}d ago`, color: 'text-green-600', bgColor: 'bg-green-50', barColor: 'bg-green-500', percent };
  if (days <= 14) return { label: `${days}d ago`, color: 'text-yellow-600', bgColor: 'bg-yellow-50', barColor: 'bg-yellow-500', percent };
  if (days <= 21) return { label: `${days}d ago`, color: 'text-orange-600', bgColor: 'bg-orange-50', barColor: 'bg-orange-500', percent };
  return { label: `${days}d ago – GHOST RISK`, color: 'text-red-600', bgColor: 'bg-red-50', barColor: 'bg-red-500', percent };
}

export function getMatchScoreColor(score: number): string {
  if (score >= 81) return 'text-green-600';
  if (score >= 61) return 'text-yellow-600';
  if (score >= 41) return 'text-orange-600';
  return 'text-red-600';
}

export function getMatchScoreBg(score: number): string {
  if (score >= 81) return 'bg-green-100 text-green-700';
  if (score >= 61) return 'bg-yellow-100 text-yellow-700';
  if (score >= 41) return 'bg-orange-100 text-orange-700';
  return 'bg-red-100 text-red-700';
}

export function generateOutreachMessage(
  contactName: string,
  contactRole: string,
  company: string,
  jobTitle: string
): string {
  const firstName = contactName.split(' ')[0];
  return `Hi ${firstName},

I hope you're doing well! My name is [Your Name], and I'm a [Year] student studying [Major] at [University].

I came across the ${jobTitle} internship at ${company} and was immediately drawn to the opportunity. Your work as ${contactRole} at ${company} is impressive, and I'd love to learn more about your experience there.

I'm particularly excited about ${company}'s mission and believe my skills in [Your Top Skill] would allow me to make meaningful contributions to your team.

Would you be open to a 15-minute coffee chat at your convenience? I'd truly appreciate any insights you could share about the role and your journey at ${company}.

Thank you for considering my request!

Best regards,
[Your Name]
[LinkedIn] | [Email]`;
}

export const STATUS_CONFIG = {
  'to-apply': {
    label: 'To Apply',
    color: 'text-slate-700',
    bg: 'bg-slate-100',
    border: 'border-slate-300',
    dot: 'bg-slate-500',
    headerBg: 'bg-slate-50',
    badge: 'bg-slate-200 text-slate-700',
  },
  applied: {
    label: 'Applied',
    color: 'text-blue-700',
    bg: 'bg-blue-50',
    border: 'border-blue-200',
    dot: 'bg-blue-500',
    headerBg: 'bg-blue-50',
    badge: 'bg-blue-200 text-blue-700',
  },
  interviewing: {
    label: 'Interviewing',
    color: 'text-violet-700',
    bg: 'bg-violet-50',
    border: 'border-violet-200',
    dot: 'bg-violet-500',
    headerBg: 'bg-violet-50',
    badge: 'bg-violet-200 text-violet-700',
  },
  offer: {
    label: 'Offer 🎉',
    color: 'text-green-700',
    bg: 'bg-green-50',
    border: 'border-green-200',
    dot: 'bg-green-500',
    headerBg: 'bg-green-50',
    badge: 'bg-green-200 text-green-700',
  },
  rejected: {
    label: 'Rejected',
    color: 'text-red-700',
    bg: 'bg-red-50',
    border: 'border-red-200',
    dot: 'bg-red-500',
    headerBg: 'bg-red-50',
    badge: 'bg-red-200 text-red-700',
  },
};
