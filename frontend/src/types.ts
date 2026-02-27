export interface NetworkingContact {
  id: string;
  name: string;
  role: string;
  company: string;
  linkedinUrl: string;
  lastContactDate: string;
  notes: string;
}

export type ApplicationStatus = 'to-apply' | 'applied' | 'interviewing' | 'offer' | 'rejected';

export interface Resume {
  id: string;
  appId: string;
  filename: string;
  storagePath: string;
  uploadedAt: string;
  size: number;
  version: string;
  notes: string;
}

export interface ReminderPrefs {
  enabled: boolean;
  daysThreshold: number;
}

export interface Application {
  id: string;
  company: string;
  jobTitle: string;
  location: string;
  salary: string;
  deadline: string;
  status: ApplicationStatus;
  skills: string[];
  requiredSkills: string[];
  gpa: number;
  hasReferral: boolean;
  lastContactDate: string;
  appliedDate: string;
  networkingContacts: NetworkingContact[];
  notes: string;
  createdAt: string;
}