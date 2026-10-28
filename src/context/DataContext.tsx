import React, { createContext, useContext, useEffect, useState, useMemo } from 'react';
import {
  collection,
  query,
  where,
  onSnapshot,
  doc,
  setDoc,
  updateDoc,
  deleteDoc,
  getDocs
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { useAuth } from './AuthContext';
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
  const { user } = useAuth();

  const [modules, setModules] = useState<LearningModule[]>([]);
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [activities, setActivities] = useState<ScheduleActivity[]>([]);
  const [sessions, setSessions] = useState<StudySession[]>([]);
  const [reviews, setReviews] = useState<DailyReview[]>([]);

  const [isLoadingData, setIsLoadingData] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncError, setSyncError] = useState<string | null>(null);

  // Firestore real-time subscriptions
  useEffect(() => {
    if (!user) {
      // Clear or load empty state
      setModules([]);
      setExercises([]);
      setActivities([]);
      setSessions([]);
      setReviews([]);
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
        setIsLoadingData(false);
      },
      (error) => {
        console.error('Modules listener error:', error);
        setSyncError('Erreur de synchronisation des modules');
        handleFirestoreError(error, OperationType.GET, modulesCol);
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
      },
      (error) => {
        console.error('Exercises listener error:', error);
        setSyncError('Erreur de synchronisation des exercices');
        handleFirestoreError(error, OperationType.GET, exercisesCol);
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
      },
      (error) => {
        console.error('Activities listener error:', error);
        setSyncError('Erreur de synchronisation du planning');
        handleFirestoreError(error, OperationType.GET, activitiesCol);
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
      },
      (error) => {
        console.error('Sessions listener error:', error);
        handleFirestoreError(error, OperationType.GET, sessionsCol);
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
      },
      (error) => {
        console.error('Reviews listener error:', error);
        handleFirestoreError(error, OperationType.GET, reviewsCol);
      }
    );

    return () => {
      unsubModules();
      unsubExercises();
      unsubActivities();
      unsubSessions();
      unsubReviews();
    };
  }, [user]);

  // Actions: Module
  const saveModule = async (moduleData: Partial<LearningModule> & { subject: SubjectId; title: string }): Promise<string> => {
    if (!user) throw new Error('Authentification requise pour enregistrer un module');
    setIsSyncing(true);
    const id = moduleData.id || `mod_${Date.now()}`;
    const path = `modules/${id}`;
    try {
      const now = new Date().toISOString();
      const payload: any = {
        id,
        userId: user.uid,
        subject: moduleData.subject,
        title: moduleData.title.trim(),
        order: moduleData.order ?? modules.filter(m => m.subject === moduleData.subject).length + 1,
        objective: moduleData.objective || '',
        status: moduleData.status || 'not_started',
        notes: moduleData.notes || '',
        resources: JSON.stringify(moduleData.resources || []),
        updatedAt: now,
      };
      if (!moduleData.id) {
        payload.createdAt = now;
      }
      await setDoc(doc(db, 'modules', id), payload, { merge: true });
      return id;
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, path);
      throw error;
    } finally {
      setIsSyncing(false);
    }
  };

  const deleteModule = async (moduleId: string): Promise<void> => {
    if (!user) throw new Error('Authentification requise');
    setIsSyncing(true);
    const path = `modules/${moduleId}`;
    try {
      await deleteDoc(doc(db, 'modules', moduleId));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, path);
      throw error;
    } finally {
      setIsSyncing(false);
    }
  };

  const updateModuleStatus = async (moduleId: string, status: ModuleStatus): Promise<void> => {
    if (!user) throw new Error('Authentification requise');
    const path = `modules/${moduleId}`;
    try {
      await updateDoc(doc(db, 'modules', moduleId), {
        status,
        updatedAt: new Date().toISOString(),
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, path);
      throw error;
    }
  };

  // Actions: Exercise
  const saveExercise = async (exerciseData: Partial<Exercise> & { subject: SubjectId; moduleId: string; title: string }): Promise<string> => {
    if (!user) throw new Error('Authentification requise pour enregistrer un exercice');
    setIsSyncing(true);
    const id = exerciseData.id || `ex_${Date.now()}`;
    const path = `exercises/${id}`;
    try {
      const now = new Date().toISOString();
      const payload: any = {
        id,
        userId: user.uid,
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
        updatedAt: now,
      };
      if (!exerciseData.id) {
        payload.createdAt = now;
      }
      await setDoc(doc(db, 'exercises', id), payload, { merge: true });
      return id;
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, path);
      throw error;
    } finally {
      setIsSyncing(false);
    }
  };

  const deleteExercise = async (exerciseId: string): Promise<void> => {
    if (!user) throw new Error('Authentification requise');
    setIsSyncing(true);
    const path = `exercises/${exerciseId}`;
    try {
      await deleteDoc(doc(db, 'exercises', exerciseId));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, path);
      throw error;
    } finally {
      setIsSyncing(false);
    }
  };

  const updateExerciseStatus = async (exerciseId: string, status: ExerciseStatus): Promise<void> => {
    if (!user) throw new Error('Authentification requise');
    const path = `exercises/${exerciseId}`;
    try {
      await updateDoc(doc(db, 'exercises', exerciseId), {
        status,
        updatedAt: new Date().toISOString(),
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, path);
      throw error;
    }
  };

  // Actions: Activities
  const saveActivity = async (activityData: Partial<ScheduleActivity> & { title: string; date: string; startTime: string; endTime: string }): Promise<string> => {
    if (!user) throw new Error('Authentification requise pour enregistrer une activité');
    setIsSyncing(true);
    const id = activityData.id || `act_${Date.now()}`;
    const path = `activities/${id}`;
    try {
      const now = new Date().toISOString();
      const startMinutes = parseTimeToMinutes(activityData.startTime);
      const endMinutes = parseTimeToMinutes(activityData.endTime);
      const duration = Math.max(10, endMinutes - startMinutes);

      const payload: any = {
        id,
        userId: user.uid,
        title: activityData.title.trim(),
        type: activityData.type || 'study_session',
        subject: activityData.subject || '',
        moduleId: activityData.moduleId || '',
        exerciseId: activityData.exerciseId || '',
        date: activityData.date,
        startTime: activityData.startTime,
        endTime: activityData.endTime,
        durationMinutes: duration,
        isFixed: Boolean(activityData.isFixed),
        isCompleted: Boolean(activityData.isCompleted),
        notes: activityData.notes || '',
        aiProposed: Boolean(activityData.aiProposed),
        aiRationale: activityData.aiRationale || '',
        updatedAt: now,
      };
      if (!activityData.id) {
        payload.createdAt = now;
      }
      await setDoc(doc(db, 'activities', id), payload, { merge: true });
      return id;
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, path);
      throw error;
    } finally {
      setIsSyncing(false);
    }
  };

  const deleteActivity = async (activityId: string): Promise<void> => {
    if (!user) throw new Error('Authentification requise');
    setIsSyncing(true);
    const path = `activities/${activityId}`;
    try {
      await deleteDoc(doc(db, 'activities', activityId));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, path);
      throw error;
    } finally {
      setIsSyncing(false);
    }
  };

  const toggleActivityComplete = async (activityId: string): Promise<void> => {
    if (!user) throw new Error('Authentification requise');
    const act = activities.find(a => a.id === activityId);
    if (!act) return;
    const path = `activities/${activityId}`;
    try {
      await updateDoc(doc(db, 'activities', activityId), {
        isCompleted: !act.isCompleted,
        updatedAt: new Date().toISOString(),
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, path);
      throw error;
    }
  };

  const applyReorganizedSchedule = async (newActivities: ScheduleActivity[]): Promise<void> => {
    if (!user) throw new Error('Authentification requise');
    setIsSyncing(true);
    try {
      for (const act of newActivities) {
        const id = act.id || `act_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
        await setDoc(doc(db, 'activities', id), {
          ...act,
          id,
          userId: user.uid,
          updatedAt: new Date().toISOString(),
          createdAt: act.createdAt || new Date().toISOString(),
        }, { merge: true });
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'activities/batch');
      throw error;
    } finally {
      setIsSyncing(false);
    }
  };

  // Actions: Sessions (Focus / Chrono)
  const logStudySession = async (sessionData: Omit<StudySession, 'id' | 'userId' | 'createdAt'>): Promise<string> => {
    if (!user) throw new Error('Authentification requise');
    setIsSyncing(true);
    const id = `sess_${Date.now()}`;
    const path = `sessions/${id}`;
    try {
      const now = new Date().toISOString();
      const payload = {
        ...sessionData,
        id,
        userId: user.uid,
        createdAt: now,
      };
      await setDoc(doc(db, 'sessions', id), payload);
      return id;
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, path);
      throw error;
    } finally {
      setIsSyncing(false);
    }
  };

  // Actions: Reviews
  const saveDailyReview = async (reviewData: Omit<DailyReview, 'id' | 'userId' | 'createdAt'>): Promise<string> => {
    if (!user) throw new Error('Authentification requise');
    setIsSyncing(true);
    const id = `rev_${reviewData.date}`;
    const path = `reviews/${id}`;
    try {
      const now = new Date().toISOString();
      const payload = {
        ...reviewData,
        id,
        userId: user.uid,
        createdAt: now,
      };
      await setDoc(doc(db, 'reviews', id), payload, { merge: true });
      return id;
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, path);
      throw error;
    } finally {
      setIsSyncing(false);
    }
  };

  // Helper: Seed foundational roadmap modules if collection is completely empty
  const seedInitialDataIfEmpty = async () => {
    if (!user) return;
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
