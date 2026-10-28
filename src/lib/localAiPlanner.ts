import { ScheduleActivity, LearningModule, Exercise, SubjectId } from '../types';

export interface ReorganizeResult {
  explanation: string;
  clarificationNeeded?: string | null;
  activities: ScheduleActivity[];
  postponedExercises?: string[];
}

export function localAiReorganize(
  prompt: string,
  currentActivities: ScheduleActivity[],
  modules: LearningModule[],
  pendingExercises: Exercise[],
  currentDate: string
): ReorganizeResult {
  const lowerPrompt = prompt.toLowerCase();
  const date = currentDate || new Date().toISOString().split('T')[0];

  // Keep all fixed activities unless explicitly instructed to cancel
  const preservedFixed = currentActivities.filter(a => a.isFixed);

  // Analyze prompt keywords
  const isCanceledCourse = lowerPrompt.includes('annulé') || lowerPrompt.includes('cours annulé') || lowerPrompt.includes('pas cours');
  const mentionsMorning = lowerPrompt.includes('matin');
  const mentionsAfternoon = lowerPrompt.includes('après-midi') || lowerPrompt.includes('aprem');
  const mentionsEvening = lowerPrompt.includes('soir') || lowerPrompt.includes('soirée') || lowerPrompt.includes('20h') || lowerPrompt.includes('21h');

  // Detect requested subjects
  const targetSubjects: SubjectId[] = [];
  if (lowerPrompt.includes('python')) targetSubjects.push('python');
  if (lowerPrompt.includes('sql')) targetSubjects.push('sql');
  if (lowerPrompt.includes('c++') || lowerPrompt.includes('cpp')) targetSubjects.push('cpp');
  if (/\bc\b/i.test(lowerPrompt) || lowerPrompt.includes('langage c')) targetSubjects.push('c');
  if (targetSubjects.length === 0) {
    targetSubjects.push('c', 'cpp', 'python', 'sql');
  }

  // Filter relevant pending exercises
  const candidateExercises = pendingExercises.filter(e => targetSubjects.includes(e.subject));
  const pool = candidateExercises.length > 0 ? candidateExercises : pendingExercises;

  const newActivities: ScheduleActivity[] = [...preservedFixed];
  const now = new Date().toISOString();

  // Helper to check collision with existing activities
  const hasCollision = (start: string, end: string) => {
    return newActivities.some(a => {
      return (start < a.endTime && end > a.startTime);
    });
  };

  // Determine available slots based on prompt context
  const defaultSlots = [
    { start: '09:00', end: '10:00', duration: 60, tag: 'morning' },
    { start: '10:15', end: '11:15', duration: 60, tag: 'morning' },
    { start: '14:30', end: '15:30', duration: 60, tag: 'afternoon' },
    { start: '16:00', end: '17:00', duration: 60, tag: 'afternoon' },
    { start: '20:00', end: '21:00', duration: 60, tag: 'evening' },
    { start: '21:15', end: '22:00', duration: 45, tag: 'evening' },
  ];

  let selectedSlots = defaultSlots;
  if (mentionsEvening && !mentionsMorning) {
    selectedSlots = defaultSlots.filter(s => s.tag === 'evening');
  } else if (mentionsMorning && !mentionsEvening) {
    selectedSlots = defaultSlots.filter(s => s.tag === 'morning');
  } else if (mentionsAfternoon) {
    selectedSlots = defaultSlots.filter(s => s.tag === 'afternoon');
  }

  let exerciseIdx = 0;
  let plannedStudyCount = 0;

  for (const slot of selectedSlots) {
    if (!hasCollision(slot.start, slot.end) && plannedStudyCount < 3) {
      const ex = pool[exerciseIdx % (pool.length || 1)];
      const subj = ex ? ex.subject : targetSubjects[plannedStudyCount % targetSubjects.length];
      const mod = modules.find(m => m.subject === subj);

      const title = ex
        ? `Séance : ${ex.title}`
        : `Étude ${subj.toUpperCase()} : ${mod ? mod.title : 'Pratique et révision'}`;

      newActivities.push({
        id: `act_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        userId: 'local',
        title,
        type: 'study_session',
        subject: subj,
        moduleId: ex ? ex.moduleId : mod?.id,
        exerciseId: ex?.id,
        date,
        startTime: slot.start,
        endTime: slot.end,
        durationMinutes: slot.duration,
        isFixed: false,
        isCompleted: false,
        notes: `Planifié selon votre demande : "${prompt.slice(0, 50)}..."`,
        aiProposed: true,
        aiRationale: `Créneau optimisé de ${slot.duration} min avec pause intermédiaire pour maintenir la concentration.`,
        createdAt: now,
        updatedAt: now,
      });

      exerciseIdx++;
      plannedStudyCount++;
    }
  }

  // Sort activities chronologically
  newActivities.sort((a, b) => a.startTime.localeCompare(b.startTime));

  const explanation = plannedStudyCount > 0
    ? `Planning actualisé avec succès pour le ${date} : ${plannedStudyCount} créneaux d'étude équilibrés ont été planifiés (${targetSubjects.map(s => s.toUpperCase()).join(', ')}), en préservant vos engagements fixes.`
    : `Planning réajusté en conservant vos événements obligatoires fixes pour le ${date}.`;

  return {
    explanation,
    clarificationNeeded: null,
    activities: newActivities,
    postponedExercises: pool.slice(plannedStudyCount).map(e => e.title),
  };
}
