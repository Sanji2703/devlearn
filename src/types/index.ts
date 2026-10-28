export type SubjectId = 'c' | 'cpp' | 'python' | 'sql';

export interface SubjectMeta {
  id: SubjectId;
  name: string;
  shortName: string;
  tagline: string;
  color: string;
  borderColor: string;
  bgColor: string;
  textColor: string;
  badgeBg: string;
}

export const SUBJECTS: Record<SubjectId, SubjectMeta> = {
  c: {
    id: 'c',
    name: 'Langage C',
    shortName: 'C',
    tagline: 'Systèmes, pointeurs et allocation mémoire',
    color: '#1E2538',
    borderColor: 'border-[#B7C9D6]',
    bgColor: 'bg-[#D9E8F4]',
    textColor: 'text-[#1E2538]',
    badgeBg: 'bg-[#D9E8F4] text-[#1E2538] border border-[#B7C9D6]',
  },
  cpp: {
    id: 'cpp',
    name: 'C++',
    shortName: 'C++',
    tagline: 'POO, templates, STL et haute performance',
    color: '#1E2538',
    borderColor: 'border-[#B7C9D6]',
    bgColor: 'bg-[#D9E8F4]',
    textColor: 'text-[#1E2538]',
    badgeBg: 'bg-[#D9E8F4] text-[#1E2538] border border-[#B7C9D6]',
  },
  python: {
    id: 'python',
    name: 'Python',
    shortName: 'Python',
    tagline: 'Scripts, structures de données et automatisation',
    color: '#1E2538',
    borderColor: 'border-[#B7C9D6]',
    bgColor: 'bg-[#D9E8F4]',
    textColor: 'text-[#1E2538]',
    badgeBg: 'bg-[#D9E8F4] text-[#1E2538] border border-[#B7C9D6]',
  },
  sql: {
    id: 'sql',
    name: 'SQL',
    shortName: 'SQL',
    tagline: 'Modélisation relationnelle, requêtes et indexation',
    color: '#1E2538',
    borderColor: 'border-[#B7C9D6]',
    bgColor: 'bg-[#D9E8F4]',
    textColor: 'text-[#1E2538]',
    badgeBg: 'bg-[#D9E8F4] text-[#1E2538] border border-[#B7C9D6]',
  },
};

export type ModuleStatus = 'not_started' | 'in_progress' | 'completed' | 'needs_review' | 'mastered';

export const MODULE_STATUS_LABELS: Record<ModuleStatus, { label: string; color: string }> = {
  not_started: { label: 'Non commencé', color: 'bg-[#F4F7F9] text-[#9BA7B8] border border-[#B7C9D6]' },
  in_progress: { label: 'En cours', color: 'bg-[#C5D9E9] text-[#1E2538] border border-[#B7C9D6] font-medium' },
  completed: { label: 'Terminé', color: 'bg-[#D9E8F4] text-[#1E2538] border border-[#B7C9D6] font-medium' },
  needs_review: { label: 'À revoir', color: 'bg-[#C5D9E9] text-[#1E2538] border border-[#B7C9D6]' },
  mastered: { label: 'Maîtrisé ⭐', color: 'bg-[#1E2538] text-white border border-[#1E2538] font-medium' },
};

export type ExerciseStatus = 'not_started' | 'in_progress' | 'completed' | 'needs_review';

export const EXERCISE_STATUS_LABELS: Record<ExerciseStatus, { label: string; color: string }> = {
  not_started: { label: 'Non commencé', color: 'bg-[#F4F7F9] text-[#9BA7B8] border border-[#B7C9D6]' },
  in_progress: { label: 'En cours', color: 'bg-[#C5D9E9] text-[#1E2538] border border-[#B7C9D6] font-medium' },
  completed: { label: 'Terminé', color: 'bg-[#D9E8F4] text-[#1E2538] border border-[#B7C9D6] font-medium' },
  needs_review: { label: 'À revoir', color: 'bg-[#C5D9E9] text-[#1E2538] border border-[#B7C9D6]' },
};

export type ExerciseDifficulty = 'facile' | 'moyen' | 'difficile';

export const DIFFICULTY_LABELS: Record<ExerciseDifficulty, { label: string; color: string }> = {
  facile: { label: 'Facile', color: 'text-[#1E2538] bg-[#D9E8F4] border border-[#B7C9D6]' },
  moyen: { label: 'Moyen', color: 'text-[#1E2538] bg-[#C5D9E9] border border-[#B7C9D6]' },
  difficile: { label: 'Difficile', color: 'text-white bg-[#1E2538] border border-[#1E2538]' },
};

export interface ResourceItem {
  id: string;
  title: string;
  type: 'link' | 'drive_file' | 'note' | 'doc';
  url?: string;
  driveFileId?: string;
  driveFileName?: string;
  content?: string;
}

export interface LearningModule {
  id: string;
  userId: string;
  subject: SubjectId;
  title: string;
  order: number;
  objective: string;
  status: ModuleStatus;
  resources: ResourceItem[];
  notes: string;
  createdAt: string;
  updatedAt: string;
}

export interface Exercise {
  id: string;
  userId: string;
  subject: SubjectId;
  moduleId: string;
  title: string;
  description: string;
  statement: string;
  link?: string;
  driveFileId?: string;
  driveFileName?: string;
  solutionNotes?: string;
  difficulty: ExerciseDifficulty;
  estimatedMinutes: number;
  status: ExerciseStatus;
  scheduledActivityId?: string;
  createdAt: string;
  updatedAt: string;
}

export type ActivityType = 
  | 'course' 
  | 'appointment' 
  | 'commute' 
  | 'personal' 
  | 'rest' 
  | 'study_available' 
  | 'study_session';

export const ACTIVITY_TYPE_LABELS: Record<ActivityType, { label: string; icon: string; color: string }> = {
  course: { label: 'Cours', icon: 'GraduationCap', color: 'bg-[#D9E8F4] text-[#1E2538] border border-[#B7C9D6]' },
  appointment: { label: 'Rendez-vous', icon: 'Calendar', color: 'bg-[#D9E8F4] text-[#1E2538] border border-[#B7C9D6]' },
  commute: { label: 'Déplacement', icon: 'Car', color: 'bg-[#F4F7F9] text-[#1E2538] border border-[#B7C9D6]' },
  personal: { label: 'Obligation perso', icon: 'Home', color: 'bg-[#F4F7F9] text-[#1E2538] border border-[#B7C9D6]' },
  rest: { label: 'Repos / Pause', icon: 'Coffee', color: 'bg-[#D9E8F4] text-[#1E2538] border border-[#B7C9D6]' },
  study_available: { label: 'Disponibilité libre', icon: 'Clock', color: 'bg-[#C5D9E9] text-[#1E2538] border border-[#B7C9D6]' },
  study_session: { label: 'Séance d’apprentissage', icon: 'BookOpen', color: 'bg-[#1E2538] text-white border border-[#1E2538]' },
};

export interface ScheduleActivity {
  id: string;
  userId: string;
  title: string;
  type: ActivityType;
  subject?: SubjectId;
  moduleId?: string;
  exerciseId?: string;
  date: string; // YYYY-MM-DD
  startTime: string; // HH:mm
  endTime: string; // HH:mm
  durationMinutes: number;
  isFixed: boolean;
  isCompleted: boolean;
  notes?: string;
  aiProposed?: boolean;
  aiRationale?: string;
  createdAt: string;
  updatedAt: string;
}

export interface StudySession {
  id: string;
  userId: string;
  subject: SubjectId;
  moduleId?: string;
  exerciseId?: string;
  targetMinutes: number;
  durationMinutes: number;
  completedAt: string;
  notes?: string;
  createdAt: string;
}

export interface DailyReview {
  id: string;
  userId: string;
  date: string;
  plannedMinutes: number;
  actualMinutes: number;
  completedCount: number;
  pendingCount: number;
  difficulties?: string;
  carryOverNotes?: string;
  createdAt: string;
}
