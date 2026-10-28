import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import {
  collection,
  query,
  where,
  onSnapshot,
  doc,
  setDoc,
  updateDoc,
  deleteDoc,
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { useAuth } from './AuthContext';
import { loadLocalData, saveLocalData } from '../lib/storage';
import {
  LearningModule,
  Exercise,
  ScheduleActivity,
  StudySession,
  DailyReview,
  SubjectId,
  ModuleStatus,
  ExerciseStatus
} from '../types';

interface DataContextType {
  modules: LearningModule[];
  exercises: Exercise[];
  activities: ScheduleActivity[];
  sessions: StudySession[];
  reviews: DailyReview[];
  isLoadingData: boolean;
  isSyncing: boolean;
  syncError: string | null;

  // Module actions
  saveModule: (moduleData: Partial<LearningModule> & { subject: SubjectId; title: string }) => Promise<string>;
  deleteModule: (moduleId: string) => Promise<void>;
  updateModuleStatus: (moduleId: string, status: ModuleStatus) => Promise<void>;

  // Exercise actions
  saveExercise: (exerciseData: Partial<Exercise> & { subject: SubjectId; moduleId: string; title: string }) => Promise<string>;
  deleteExercise: (exerciseId: string) => Promise<void>;
  updateExerciseStatus: (exerciseId: string, status: ExerciseStatus) => Promise<void>;

  // Activity actions
  saveActivity: (activityData: Partial<ScheduleActivity> & { title: string; date: string; startTime: string; endTime: string }) => Promise<string>;
  deleteActivity: (activityId: string) => Promise<void>;
  toggleActivityComplete: (activityId: string) => Promise<void>;
  applyReorganizedSchedule: (newActivities: ScheduleActivity[]) => Promise<void>;

  // Study session actions
  logStudySession: (sessionData: Omit<StudySession, 'id' | 'userId' | 'createdAt'>) => Promise<string>;

  // Daily review actions
  saveDailyReview: (reviewData: Omit<DailyReview, 'id' | 'userId' | 'createdAt'>) => Promise<string>;

  // Initial starter data seeding
  seedInitialDataIfEmpty: () => Promise<void>;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export const DataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading: authLoading } = useAuth();

  // Initialize state immediately from localStorage so data NEVER vanishes on refresh
  const initialLocalData = useRef(loadLocalData(user?.uid)).current;
  const [modules, setModules] = useState<LearningModule[]>(initialLocalData.modules);
  const [exercises, setExercises] = useState<Exercise[]>(initialLocalData.exercises);
  const [activities, setActivities] = useState<ScheduleActivity[]>(initialLocalData.activities);
  const [sessions, setSessions] = useState<StudySession[]>(initialLocalData.sessions);
  const [reviews, setReviews] = useState<DailyReview[]>(initialLocalData.reviews);

  const [isLoadingData, setIsLoadingData] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncError, setSyncError] = useState<string | null>(null);

  // Sync to local storage whenever state changes
  useEffect(() => {
    saveLocalData(user?.uid, { modules, exercises, activities, sessions, reviews });
  }, [modules, exercises, activities, sessions, reviews, user?.uid]);

  // Firestore real-time subscriptions & sync
  useEffect(() => {
    // If auth state is still loading, wait before changing listeners
    if (authLoading) return;

    if (!user) {
      // Unauthenticated / offline mode: reload local data safely
      const local = loadLocalData(null);
      setModules(local.modules);
      setExercises(local.exercises);
      setActivities(local.activities);
      setSessions(local.sessions);
      setReviews(local.reviews);
      setIsLoadingData(false);
      return;
    }

    setIsLoadingData(true);
    setSyncError(null);

    // 1. Modules subscription
    const modulesCol = 'modules';
    const modulesQuery = query(collection(db, modulesCol), where('userId', '==', user.uid));
    const unsubModules = onSnapshot(
      modulesQuery,
      (snapshot) => {
        const items: LearningModule[] = [];
        snapshot.forEach((docSnap) => {
          const data = docSnap.data();
          let parsedResources = [];
          if (typeof data.resources === 'string') {
            try { parsedResources = JSON.parse(data.resources); } catch (_) {}
          } else if (Array.isArray(data.resources)) {
            parsedResources = data.resources;
          }
          items.push({
            id: docSnap.id,
            ...data,
            resources: parsedResources,
          } as LearningModule);
        });
        items.sort((a, b) => (a.order || 0) - (b.order || 0));
        setModules(items);
        saveLocalData(user.uid, { modules: items });
        setIsLoadingData(false);
      },
      (error) => {
        console.warn('Modules listener warning:', error);
        // Do not crash, keep local data
        setIsLoadingData(false);
      }
    );

    // 2. Exercises subscription
    const exercisesCol = 'exercises';
    const exercisesQuery = query(collection(db, exercisesCol), where('userId', '==', user.uid));
    const unsubExercises = onSnapshot(
      exercisesQuery,
      (snapshot) => {
        const items: Exercise[] = [];
        snapshot.forEach((docSnap) => {
          items.push({ id: docSnap.id, ...docSnap.data() } as Exercise);
        });
        setExercises(items);
        saveLocalData(user.uid, { exercises: items });
      },
      (error) => {
        console.warn('Exercises listener warning:', error);
      }
    );

    // 3. Activities subscription
    const activitiesCol = 'activities';
    const activitiesQuery = query(collection(db, activitiesCol), where('userId', '==', user.uid));
    const unsubActivities = onSnapshot(
      activitiesQuery,
      (snapshot) => {
        const items: ScheduleActivity[] = [];
        snapshot.forEach((docSnap) => {
          items.push({ id: docSnap.id, ...docSnap.data() } as ScheduleActivity);
        });
        items.sort((a, b) => (a.startTime || '').localeCompare(b.startTime || ''));
        setActivities(items);
        saveLocalData(user.uid, { activities: items });
      },
      (error) => {
        console.warn('Activities listener warning:', error);
      }
    );

    // 4. Sessions subscription
    const sessionsCol = 'sessions';
    const sessionsQuery = query(collection(db, sessionsCol), where('userId', '==', user.uid));
    const unsubSessions = onSnapshot(
      sessionsQuery,
      (snapshot) => {
        const items: StudySession[] = [];
        snapshot.forEach((docSnap) => {
          items.push({ id: docSnap.id, ...docSnap.data() } as StudySession);
        });
        items.sort((a, b) => (b.completedAt || '').localeCompare(a.completedAt || ''));
        setSessions(items);
        saveLocalData(user.uid, { sessions: items });
      },
      (error) => {
        console.warn('Sessions listener warning:', error);
      }
    );

    // 5. Reviews subscription
    const reviewsCol = 'reviews';
    const reviewsQuery = query(collection(db, reviewsCol), where('userId', '==', user.uid));
    const unsubReviews = onSnapshot(
      reviewsQuery,
      (snapshot) => {
        const items: DailyReview[] = [];
        snapshot.forEach((docSnap) => {
          items.push({ id: docSnap.id, ...docSnap.data() } as DailyReview);
        });
        items.sort((a, b) => b.date.localeCompare(a.date));
        setReviews(items);
        saveLocalData(user.uid, { reviews: items });
      },
      (error) => {
        console.warn('Reviews listener warning:', error);
      }
    );

    return () => {
      unsubModules();
      unsubExercises();
      unsubActivities();
      unsubSessions();
      unsubReviews();
    };
  }, [user, authLoading]);

  // Actions: Module
  const saveModule = async (moduleData: Partial<LearningModule> & { subject: SubjectId; title: string }): Promise<string> => {
    setIsSyncing(true);
    const id = moduleData.id || `mod_${Date.now()}`;
    const now = new Date().toISOString();
    const payload: LearningModule = {
      id,
      userId: user?.uid || 'local',
      subject: moduleData.subject,
      title: moduleData.title.trim(),
      order: moduleData.order ?? modules.filter(m => m.subject === moduleData.subject).length + 1,
      objective: moduleData.objective || '',
      status: moduleData.status || 'not_started',
      notes: moduleData.notes || '',
      resources: moduleData.resources || [],
      createdAt: moduleData.createdAt || now,
      updatedAt: now,
    };

    // Update state & localStorage immediately
    setModules((prev) => {
      const idx = prev.findIndex((m) => m.id === id);
      const next = idx >= 0 ? prev.map((m, i) => (i === idx ? payload : m)) : [...prev, payload];
      saveLocalData(user?.uid, { modules: next });
      return next;
    });

    if (user) {
      try {
        const firestorePayload = {
          ...payload,
          resources: JSON.stringify(payload.resources || []),
        };
        await setDoc(doc(db, 'modules', id), firestorePayload, { merge: true });
      } catch (error) {
        console.warn('Failed to sync module to Firestore:', error);
      }
    }

    setIsSyncing(false);
    return id;
  };

  const deleteModule = async (moduleId: string): Promise<void> => {
    setIsSyncing(true);
    setModules((prev) => {
      const next = prev.filter((m) => m.id !== moduleId);
      saveLocalData(user?.uid, { modules: next });
      return next;
    });

    if (user) {
      try {
        await deleteDoc(doc(db, 'modules', moduleId));
      } catch (error) {
        console.warn('Failed to delete module from Firestore:', error);
      }
    }
    setIsSyncing(false);
  };

  const updateModuleStatus = async (moduleId: string, status: ModuleStatus): Promise<void> => {
    const now = new Date().toISOString();
    setModules((prev) => {
      const next = prev.map((m) => (m.id === moduleId ? { ...m, status, updatedAt: now } : m));
      saveLocalData(user?.uid, { modules: next });
      return next;
    });

    if (user) {
      try {
        await updateDoc(doc(db, 'modules', moduleId), {
          status,
          updatedAt: now,
        });
      } catch (error) {
        console.warn('Failed to update module status in Firestore:', error);
      }
    }
  };

  // Actions: Exercise
  const saveExercise = async (exerciseData: Partial<Exercise> & { subject: SubjectId; moduleId: string; title: string }): Promise<string> => {
    setIsSyncing(true);
    const id = exerciseData.id || `ex_${Date.now()}`;
    const now = new Date().toISOString();
    const payload: Exercise = {
      id,
      userId: user?.uid || 'local',
      subject: exerciseData.subject,
      moduleId: exerciseData.moduleId,
      title: exerciseData.title.trim(),
      description: exerciseData.description || '',
      statement: exerciseData.statement || '',
      link: exerciseData.link || '',
      driveFileId: exerciseData.driveFileId || '',
      driveFileName: exerciseData.driveFileName || '',
      solutionNotes: exerciseData.solutionNotes || '',
      difficulty: exerciseData.difficulty || 'facile',
      estimatedMinutes: Number(exerciseData.estimatedMinutes) || 30,
      status: exerciseData.status || 'not_started',
      scheduledActivityId: exerciseData.scheduledActivityId || '',
      createdAt: exerciseData.createdAt || now,
      updatedAt: now,
    };

    setExercises((prev) => {
      const idx = prev.findIndex((e) => e.id === id);
      const next = idx >= 0 ? prev.map((e, i) => (i === idx ? payload : e)) : [...prev, payload];
      saveLocalData(user?.uid, { exercises: next });
      return next;
    });

    if (user) {
      try {
        await setDoc(doc(db, 'exercises', id), payload, { merge: true });
      } catch (error) {
        console.warn('Failed to sync exercise to Firestore:', error);
      }
    }

    setIsSyncing(false);
    return id;
  };

  const deleteExercise = async (exerciseId: string): Promise<void> => {
    setIsSyncing(true);
    setExercises((prev) => {
      const next = prev.filter((e) => e.id !== exerciseId);
      saveLocalData(user?.uid, { exercises: next });
      return next;
    });

    if (user) {
      try {
        await deleteDoc(doc(db, 'exercises', exerciseId));
      } catch (error) {
        console.warn('Failed to delete exercise from Firestore:', error);
      }
    }
    setIsSyncing(false);
  };

  const updateExerciseStatus = async (exerciseId: string, status: ExerciseStatus): Promise<void> => {
    const now = new Date().toISOString();
    setExercises((prev) => {
      const next = prev.map((e) => (e.id === exerciseId ? { ...e, status, updatedAt: now } : e));
      saveLocalData(user?.uid, { exercises: next });
      return next;
    });

    if (user) {
      try {
        await updateDoc(doc(db, 'exercises', exerciseId), {
          status,
          updatedAt: now,
        });
      } catch (error) {
        console.warn('Failed to update exercise status in Firestore:', error);
      }
    }
  };

  // Actions: Activities
  const saveActivity = async (activityData: Partial<ScheduleActivity> & { title: string; date: string; startTime: string; endTime: string }): Promise<string> => {
    setIsSyncing(true);
    const id = activityData.id || `act_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const now = new Date().toISOString();
    const startMinutes = parseTimeToMinutes(activityData.startTime);
    const endMinutes = parseTimeToMinutes(activityData.endTime);
    const duration = Math.max(10, endMinutes - startMinutes);

    const payload: ScheduleActivity = {
      id,
      userId: user?.uid || 'local',
      title: activityData.title.trim(),
      type: activityData.type || 'study_session',
      subject: activityData.subject,
      moduleId: activityData.moduleId,
      exerciseId: activityData.exerciseId,
      date: activityData.date,
      startTime: activityData.startTime,
      endTime: activityData.endTime,
      durationMinutes: duration,
      isFixed: Boolean(activityData.isFixed),
      isCompleted: Boolean(activityData.isCompleted),
      notes: activityData.notes || '',
      aiProposed: Boolean(activityData.aiProposed),
      aiRationale: activityData.aiRationale || '',
      createdAt: activityData.createdAt || now,
      updatedAt: now,
    };

    setActivities((prev) => {
      const idx = prev.findIndex((a) => a.id === id);
      const next = idx >= 0 ? prev.map((a, i) => (i === idx ? payload : a)) : [...prev, payload];
      next.sort((a, b) => (a.startTime || '').localeCompare(b.startTime || ''));
      saveLocalData(user?.uid, { activities: next });
      return next;
    });

    if (user) {
      try {
        await setDoc(doc(db, 'activities', id), payload, { merge: true });
      } catch (error) {
        console.warn('Failed to sync activity to Firestore:', error);
      }
    }

    setIsSyncing(false);
    return id;
  };

  const deleteActivity = async (activityId: string): Promise<void> => {
    setIsSyncing(true);
    setActivities((prev) => {
      const next = prev.filter((a) => a.id !== activityId);
      saveLocalData(user?.uid, { activities: next });
      return next;
    });

    if (user) {
      try {
        await deleteDoc(doc(db, 'activities', activityId));
      } catch (error) {
        console.warn('Failed to delete activity from Firestore:', error);
      }
    }
    setIsSyncing(false);
  };

  const toggleActivityComplete = async (activityId: string): Promise<void> => {
    const act = activities.find(a => a.id === activityId);
    if (!act) return;
    const now = new Date().toISOString();
    const nextCompleted = !act.isCompleted;

    setActivities((prev) => {
      const next = prev.map((a) => (a.id === activityId ? { ...a, isCompleted: nextCompleted, updatedAt: now } : a));
      saveLocalData(user?.uid, { activities: next });
      return next;
    });

    if (user) {
      try {
        await updateDoc(doc(db, 'activities', activityId), {
          isCompleted: nextCompleted,
          updatedAt: now,
        });
      } catch (error) {
        console.warn('Failed to toggle activity in Firestore:', error);
      }
    }
  };

  const applyReorganizedSchedule = async (newActivities: ScheduleActivity[]): Promise<void> => {
    setIsSyncing(true);
    const now = new Date().toISOString();

    const preparedActivities = newActivities.map((act) => ({
      ...act,
      id: act.id || `act_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      userId: user?.uid || 'local',
      updatedAt: now,
      createdAt: act.createdAt || now,
    }));

    // Identify target dates affected
    const targetDates = Array.from(new Set(preparedActivities.map((a) => a.date)));

    setActivities((prev) => {
      // Keep activities from other dates
      const preservedOtherDates = prev.filter((a) => !targetDates.includes(a.date));
      // For target dates, keep fixed activities if not present in newActivities
      const fixedToKeep = prev.filter((a) => 
        targetDates.includes(a.date) && 
        a.isFixed && 
        !preparedActivities.some((na) => na.id === a.id)
      );

      const next = [...preservedOtherDates, ...fixedToKeep, ...preparedActivities];
      next.sort((a, b) => (a.startTime || '').localeCompare(b.startTime || ''));
      saveLocalData(user?.uid, { activities: next });
      return next;
    });

    if (user) {
      try {
        for (const act of preparedActivities) {
          await setDoc(doc(db, 'activities', act.id), act, { merge: true });
        }
      } catch (error) {
        console.warn('Failed to sync batch reorganized activities to Firestore:', error);
      }
    }

    setIsSyncing(false);
  };

  // Actions: Sessions (Focus / Chrono)
  const logStudySession = async (sessionData: Omit<StudySession, 'id' | 'userId' | 'createdAt'>): Promise<string> => {
    setIsSyncing(true);
    const id = `sess_${Date.now()}`;
    const now = new Date().toISOString();
    const payload: StudySession = {
      ...sessionData,
      id,
      userId: user?.uid || 'local',
      createdAt: now,
    };

    setSessions((prev) => {
      const next = [payload, ...prev];
      saveLocalData(user?.uid, { sessions: next });
      return next;
    });

    if (user) {
      try {
        await setDoc(doc(db, 'sessions', id), payload);
      } catch (error) {
        console.warn('Failed to sync session to Firestore:', error);
      }
    }

    setIsSyncing(false);
    return id;
  };

  // Actions: Reviews
  const saveDailyReview = async (reviewData: Omit<DailyReview, 'id' | 'userId' | 'createdAt'>): Promise<string> => {
    setIsSyncing(true);
    const id = `rev_${reviewData.date}`;
    const now = new Date().toISOString();
    const payload: DailyReview = {
      ...reviewData,
      id,
      userId: user?.uid || 'local',
      createdAt: now,
    };

    setReviews((prev) => {
      const idx = prev.findIndex((r) => r.id === id);
      const next = idx >= 0 ? prev.map((r, i) => (i === idx ? payload : r)) : [payload, ...prev];
      saveLocalData(user?.uid, { reviews: next });
      return next;
    });

    if (user) {
      try {
        await setDoc(doc(db, 'reviews', id), payload, { merge: true });
      } catch (error) {
        console.warn('Failed to sync review to Firestore:', error);
      }
    }

    setIsSyncing(false);
    return id;
  };

  // Helper: Seed foundational roadmap modules if collection is completely empty
  const seedInitialDataIfEmpty = async () => {
    if (modules.length > 0) return;

    const initialModules: Array<{ subject: SubjectId; title: string; objective: string; order: number }> = [
      // C
      { subject: 'c', title: '1. Variables & Types de base', objective: 'Maîtriser les types scalaires (int, char, float), la portée et la mémoire.', order: 1 },
      { subject: 'c', title: '2. Conditions & Opérateurs logiques', objective: 'Comprendre if/else, switch et les évaluations booléennes en C.', order: 2 },
      { subject: 'c', title: '3. Boucles & Itérations', objective: 'Pratiquer for, while, do-while et les conditions de sortie.', order: 3 },
      { subject: 'c', title: '4. Fonctions & Passage de paramètres', objective: 'Découper son code, prototypes, pile d’exécution.', order: 4 },
      { subject: 'c', title: '5. Tableaux & Pointeurs élémentaires', objective: 'Arithmétique des pointeurs, chaînes de caractères (char*), mémoire contiguë.', order: 5 },
      // C++
      { subject: 'cpp', title: '1. Références & Syntaxe moderne C++', objective: 'Passage par référence, constness, auto et std::string.', order: 1 },
      { subject: 'cpp', title: '2. Classes & Encapsulation (POO)', objective: 'Constructeurs, destructeurs, accesseurs et modificateurs.', order: 2 },
      { subject: 'cpp', title: '3. Conteneurs STL (vector, map, set)', objective: 'Utiliser la bibliothèque standard pour manipuler des collections avec performance.', order: 3 },
      // Python
      { subject: 'python', title: '1. Structures de données (Listes, Dicts, Tuples)', objective: 'Manipuler efficacement les collections Python et les compréhensions de listes.', order: 1 },
      { subject: 'python', title: '2. Fonctions & Arguments (*args, **kwargs)', objective: 'Écrire des fonctions modulaires, lambdas et documentation.', order: 2 },
      { subject: 'python', title: '3. Fichiers & Gestion des exceptions', objective: 'Lecture/écriture de fichiers avec context managers (with) et try/except.', order: 3 },
      // SQL
      { subject: 'sql', title: '1. Requêtes SELECT & Filtrage (WHERE, ORDER BY)', objective: 'Extraire des colonnes ciblées et appliquer des filtres précis.', order: 1 },
      { subject: 'sql', title: '2. Jointures relationnelles (INNER, LEFT, RIGHT JOIN)', objective: 'Associer des tables à travers des clés primaires et étrangères.', order: 2 },
      { subject: 'sql', title: '3. Agrégations & Regroupements (GROUP BY, HAVING)', objective: 'Calculer des métriques synthétiques (COUNT, SUM, AVG) sur des sous-ensembles.', order: 3 },
    ];

    for (const m of initialModules) {
      await saveModule({
        subject: m.subject,
        title: m.title,
        objective: m.objective,
        order: m.order,
        status: 'not_started',
        resources: [],
        notes: '',
      });
    }
  };

  return (
    <DataContext.Provider
      value={{
        modules,
        exercises,
        activities,
        sessions,
        reviews,
        isLoadingData,
        isSyncing,
        syncError,
        saveModule,
        deleteModule,
        updateModuleStatus,
        saveExercise,
        deleteExercise,
        updateExerciseStatus,
        saveActivity,
        deleteActivity,
        toggleActivityComplete,
        applyReorganizedSchedule,
        logStudySession,
        saveDailyReview,
        seedInitialDataIfEmpty,
      }}
    >
      {children}
    </DataContext.Provider>
  );
};

export const useData = () => {
  const context = useContext(DataContext);
  if (!context) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
};

function parseTimeToMinutes(timeStr: string): number {
  if (!timeStr || !timeStr.includes(':')) return 0;
  const [h, m] = timeStr.split(':').map(Number);
  return (h || 0) * 60 + (m || 0);
}
