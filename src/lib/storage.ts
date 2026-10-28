import {
  LearningModule,
  Exercise,
  ScheduleActivity,
  StudySession,
  DailyReview,
} from '../types';

const STORAGE_PREFIX = 'devlearn_data_v2_';

export interface LocalAppData {
  modules: LearningModule[];
  exercises: Exercise[];
  activities: ScheduleActivity[];
  sessions: StudySession[];
  reviews: DailyReview[];
}

function getStorageKey(userId?: string | null): string {
  return `${STORAGE_PREFIX}${userId || 'local'}`;
}

export function loadLocalData(userId?: string | null): LocalAppData {
  if (typeof window === 'undefined') {
    return { modules: [], exercises: [], activities: [], sessions: [], reviews: [] };
  }

  try {
    const raw = localStorage.getItem(getStorageKey(userId));
    if (raw) {
      const parsed = JSON.parse(raw);
      return {
        modules: Array.isArray(parsed.modules) ? parsed.modules : [],
        exercises: Array.isArray(parsed.exercises) ? parsed.exercises : [],
        activities: Array.isArray(parsed.activities) ? parsed.activities : [],
        sessions: Array.isArray(parsed.sessions) ? parsed.sessions : [],
        reviews: Array.isArray(parsed.reviews) ? parsed.reviews : [],
      };
    }

    // Check if there is guest/legacy data to migrate
    if (userId) {
      const guestRaw = localStorage.getItem(getStorageKey(null));
      if (guestRaw) {
        const parsedGuest = JSON.parse(guestRaw);
        return {
          modules: Array.isArray(parsedGuest.modules) ? parsedGuest.modules : [],
          exercises: Array.isArray(parsedGuest.exercises) ? parsedGuest.exercises : [],
          activities: Array.isArray(parsedGuest.activities) ? parsedGuest.activities : [],
          sessions: Array.isArray(parsedGuest.sessions) ? parsedGuest.sessions : [],
          reviews: Array.isArray(parsedGuest.reviews) ? parsedGuest.reviews : [],
        };
      }
    }
  } catch (err) {
    console.warn('Error reading from localStorage:', err);
  }

  return { modules: [], exercises: [], activities: [], sessions: [], reviews: [] };
}

export function saveLocalData(userId: string | null | undefined, data: Partial<LocalAppData>): void {
  if (typeof window === 'undefined') return;

  try {
    const current = loadLocalData(userId);
    const updated: LocalAppData = {
      modules: data.modules !== undefined ? data.modules : current.modules,
      exercises: data.exercises !== undefined ? data.exercises : current.exercises,
      activities: data.activities !== undefined ? data.activities : current.activities,
      sessions: data.sessions !== undefined ? data.sessions : current.sessions,
      reviews: data.reviews !== undefined ? data.reviews : current.reviews,
    };

    localStorage.setItem(getStorageKey(userId), JSON.stringify(updated));
  } catch (err) {
    console.warn('Error saving to localStorage:', err);
  }
}
