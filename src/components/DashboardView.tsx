import React, { useMemo } from 'react';
import {
  Calendar,
  Sparkles,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Play,
  ArrowRight,
  BookOpen,
  Layers,
  ChevronRight,
  ClipboardCheck
} from 'lucide-react';
import { useData } from '../context/DataContext';
import { useAuth } from '../context/AuthContext';
import { SUBJECTS, SubjectId, ACTIVITY_TYPE_LABELS, DIFFICULTY_LABELS } from '../types';
import { GoogleSignInButton } from './GoogleSignInButton';

interface DashboardViewProps {
  onOpenReorganize: () => void;
  onOpenAvailability: () => void;
  onOpenDailyReview: () => void;
  onSelectSubject: (subject: SubjectId) => void;
  onNavigateToExercises: () => void;
  onNavigateToPlanning: () => void;
  onNavigateToFocus: (subject?: SubjectId, moduleId?: string, exerciseId?: string) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  onOpenReorganize,
  onOpenAvailability,
  onOpenDailyReview,
  onSelectSubject,
  onNavigateToExercises,
  onNavigateToPlanning,
  onNavigateToFocus,
}) => {
  const { user } = useAuth();
  const {
    modules,
    exercises,
    activities,
    sessions,
    toggleActivityComplete,
    seedInitialDataIfEmpty,
    isLoadingData,
  } = useData();

  // Current date formatted in French
  const today = new Date();
  const todayStr = today.toISOString().split('T')[0];
  const dateFormatted = new Intl.DateTimeFormat('fr-FR', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(today);
  const capitalizedDate = dateFormatted.charAt(0).toUpperCase() + dateFormatted.slice(1);

  // Today's activities
  const todayActivities = useMemo(() => {
    return activities.filter((a) => a.date === todayStr);
  }, [activities, todayStr]);

  // Next upcoming activity
  const nextActivities = useMemo(() => {
    const nowHours = today.getHours();
    const nowMinutes = today.getMinutes();
    const nowTotal = nowHours * 60 + nowMinutes;

    return todayActivities
      .filter((a) => {
        const [h, m] = a.endTime.split(':').map(Number);
        return h * 60 + m >= nowTotal;
      })
      .sort((a, b) => a.startTime.localeCompare(b.startTime));
  }, [todayActivities, today]);

  // Planned study sessions today
  const plannedStudySessions = useMemo(() => {
    return todayActivities.filter((a) => a.type === 'study_session');
  }, [todayActivities]);

  // Planned study time today (in minutes)
  const plannedMinutesToday = useMemo(() => {
    return plannedStudySessions.reduce((acc, curr) => acc + (curr.durationMinutes || 0), 0);
  }, [plannedStudySessions]);

  // Actual study time today (logged sessions + completed study activities)
  const actualMinutesToday = useMemo(() => {
    const sessionMins = sessions
      .filter((s) => s.completedAt && s.completedAt.startsWith(todayStr))
      .reduce((acc, curr) => acc + (curr.durationMinutes || 0), 0);

    const completedActMins = plannedStudySessions
      .filter((a) => a.isCompleted)
      .reduce((acc, curr) => acc + (curr.durationMinutes || 0), 0);

    return Math.max(sessionMins, completedActMins);
  }, [sessions, plannedStudySessions, todayStr]);

  // Pending exercises
  const remainingExercises = useMemo(() => {
    return exercises.filter((e) => e.status !== 'completed');
  }, [exercises]);

  // Priority exercises
  const priorityExercises = useMemo(() => {
    return remainingExercises
      .filter((e) => e.status === 'in_progress' || e.status === 'needs_review' || e.difficulty === 'difficile')
      .slice(0, 4);
  }, [remainingExercises]);

  // Overdue activities
  const overdueActivities = useMemo(() => {
    return activities.filter((a) => a.date < todayStr && !a.isCompleted && a.type === 'study_session');
  }, [activities, todayStr]);

  // Per-subject statistics
  const subjectStats = useMemo(() => {
    const list: SubjectId[] = ['c', 'cpp', 'python', 'sql'];
    return list.map((subId) => {
      const subModules = modules.filter((m) => m.subject === subId);
      const subExercises = exercises.filter((e) => e.subject === subId);
      const completedExercises = subExercises.filter((e) => e.status === 'completed');
      const masteredModules = subModules.filter((m) => m.status === 'mastered');
      const completedModules = subModules.filter((m) => m.status === 'completed' || m.status === 'mastered');
      const progressPercent = subModules.length > 0
        ? Math.round((completedModules.length / subModules.length) * 100)
        : 0;

      return {
        id: subId,
        meta: SUBJECTS[subId],
        moduleCount: subModules.length,
        masteredCount: masteredModules.length,
        completedCount: completedModules.length,
        exerciseCount: subExercises.length,
        completedExerciseCount: completedExercises.length,
        progressPercent,
      };
    });
  }, [modules, exercises]);

  return (
    <div className="space-y-6 pb-12">
      
      {/* Top Banner & Quick Actions */}
      <div className="p-5 sm:p-6 rounded-xl bg-white border border-[#B7C9D6] shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#D9E8F4] text-[#1E2538] border border-[#B7C9D6] text-xs font-semibold uppercase tracking-wider mb-2">
              <Calendar className="w-3.5 h-3.5" />
              <span>{capitalizedDate}</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-[#1E2538] tracking-tight">
              Tableau de bord d'apprentissage
            </h1>
            <p className="text-xs sm:text-sm text-[#9BA7B8] mt-1">
              Organisation calme et adaptation intelligente de votre parcours C, C++, Python & SQL.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-2.5">
            <button
              type="button"
              onClick={onOpenReorganize}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#1E2538] hover:bg-[#2C3652] text-white font-medium text-xs sm:text-sm shadow-xs transition-all active:scale-[0.98] cursor-pointer"
            >
              <Sparkles className="w-4 h-4 text-[#C5D9E9]" />
              <span>Réorganiser ma journée</span>
            </button>

            <button
              type="button"
              onClick={onOpenAvailability}
              className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-[#D9E8F4] hover:bg-[#C5D9E9] text-[#1E2538] font-medium text-xs sm:text-sm border border-[#B7C9D6] transition-all cursor-pointer"
            >
              <Clock className="w-4 h-4 text-[#1E2538]" />
              <span>Mettre à jour mes disponibilités</span>
            </button>

            <button
              type="button"
              onClick={onOpenDailyReview}
              className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-[#D9E8F4] hover:bg-[#C5D9E9] text-[#1E2538] font-medium text-xs sm:text-sm border border-[#B7C9D6] transition-all cursor-pointer"
            >
              <ClipboardCheck className="w-4 h-4 text-[#1E2538]" />
              <span>Bilan du jour</span>
            </button>
          </div>

        </div>

        {/* Sync Prompt if not logged in */}
        {!user && (
          <div className="mt-4 pt-4 border-t border-[#B7C9D6] flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#D9E8F4]/60 p-3.5 rounded-xl border border-[#B7C9D6]">
            <div className="text-xs text-[#1E2538]">
              <span className="font-bold">Synchronisation automatique Android & PC : </span>
              Connectez-vous avec Google pour enregistrer et retrouver vos modules et votre planning en temps réel.
            </div>
            <GoogleSignInButton className="text-xs py-1.5 shrink-0" />
          </div>
        )}

        {/* Starter Template prompt if empty */}
        {user && modules.length === 0 && !isLoadingData && (
          <div className="mt-4 pt-4 border-t border-[#B7C9D6] flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#D9E8F4]/60 p-3.5 rounded-xl border border-[#B7C9D6]">
            <div className="text-xs text-[#1E2538]">
              <span className="font-bold">Votre espace est prêt ! </span>
              Vous pouvez initialiser les modules de base suggérés pour C, C++, Python et SQL en 1 clic.
            </div>
            <button
              type="button"
              onClick={() => seedInitialDataIfEmpty()}
              className="px-3.5 py-1.5 rounded-xl bg-[#1E2538] hover:bg-[#2C3652] text-white font-medium text-xs shrink-0 cursor-pointer shadow-xs"
            >
              Initialiser les modules de départ
            </button>
          </div>
        )}
      </div>

      {/* Overview Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Planned vs Real Study Time */}
        <div className="p-4 rounded-xl bg-white border border-[#B7C9D6] shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-[#9BA7B8]">Temps d'étude aujourd'hui</span>
            <Clock className="w-4 h-4 text-[#1E2538]" />
          </div>
          <div className="my-2">
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold text-[#1E2538] font-mono">{actualMinutesToday} min</span>
              <span className="text-xs text-[#9BA7B8]">/ {plannedMinutesToday} min prévues</span>
            </div>
            {/* Progress bar */}
            <div className="w-full bg-[#D9E8F4] rounded-full h-2 mt-2 overflow-hidden">
              <div
                className="bg-[#1E2538] h-2 rounded-full transition-all duration-500"
                style={{
                  width: `${plannedMinutesToday > 0 ? Math.min(100, Math.round((actualMinutesToday / plannedMinutesToday) * 100)) : (actualMinutesToday > 0 ? 100 : 0)}%`,
                }}
              />
            </div>
          </div>
          <div className="text-[11px] text-[#9BA7B8]">
            {plannedMinutesToday === 0
              ? 'Aucun créneau planifié aujourd’hui'
              : actualMinutesToday >= plannedMinutesToday
              ? 'Objectif de la journée atteint !'
              : `Encore ${plannedMinutesToday - actualMinutesToday} min d’apprentissage prévues`}
          </div>
        </div>

        {/* Next Activities Today */}
        <div className="p-4 rounded-xl bg-white border border-[#B7C9D6] shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-[#9BA7B8]">Prochaine activité</span>
            <Calendar className="w-4 h-4 text-[#1E2538]" />
          </div>
          <div className="my-2">
            {nextActivities.length > 0 ? (
              <div>
                <div className="font-semibold text-[#1E2538] text-sm truncate">
                  {nextActivities[0].title}
                </div>
                <div className="text-xs text-[#1E2538] font-mono mt-0.5">
                  {nextActivities[0].startTime} - {nextActivities[0].endTime} ({nextActivities[0].durationMinutes} min)
                </div>
              </div>
            ) : (
              <div className="text-sm font-medium text-[#9BA7B8]">
                Aucune activité restante aujourd'hui
              </div>
            )}
          </div>
          <button
            onClick={onNavigateToPlanning}
            className="text-[11px] text-[#1E2538] hover:underline font-semibold flex items-center gap-1 cursor-pointer"
          >
            Voir tout le planning <ChevronRight className="w-3 h-3 text-[#9BA7B8]" />
          </button>
        </div>

        {/* Remaining Exercises */}
        <div className="p-4 rounded-xl bg-white border border-[#B7C9D6] shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-[#9BA7B8]">Exercices en attente</span>
            <BookOpen className="w-4 h-4 text-[#1E2538]" />
          </div>
          <div className="my-2">
            <div className="text-2xl font-bold text-[#1E2538] font-mono">{remainingExercises.length}</div>
            <div className="text-xs text-[#9BA7B8] mt-0.5">
              sur {exercises.length} exercices au total
            </div>
          </div>
          <button
            onClick={onNavigateToExercises}
            className="text-[11px] text-[#1E2538] hover:underline font-semibold flex items-center gap-1 cursor-pointer"
          >
            Gérer mes exercices <ChevronRight className="w-3 h-3 text-[#9BA7B8]" />
          </button>
        </div>

        {/* Overdue / Priorities count */}
        <div className="p-4 rounded-xl bg-white border border-[#B7C9D6] shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-[#9BA7B8]">Tâches en retard / À revoir</span>
            {overdueActivities.length > 0 ? (
              <AlertTriangle className="w-4 h-4 text-[#1E2538]" />
            ) : (
              <CheckCircle2 className="w-4 h-4 text-[#1E2538]" />
            )}
          </div>
          <div className="my-2">
            <div className="text-2xl font-bold font-mono text-[#1E2538]">
              {overdueActivities.length}
            </div>
            <div className="text-xs text-[#9BA7B8] mt-0.5">
              {overdueActivities.length > 0
                ? 'Séances non réalisées à reporter'
                : 'Aucune tâche en retard'}
            </div>
          </div>
          {overdueActivities.length > 0 ? (
            <button
              onClick={onOpenReorganize}
              className="text-[11px] text-[#1E2538] hover:underline font-semibold flex items-center gap-1 cursor-pointer"
            >
              Reporter avec l'IA <ChevronRight className="w-3 h-3 text-[#9BA7B8]" />
            </button>
          ) : (
            <span className="text-[11px] text-[#1E2538] font-medium">À jour sur le planning</span>
          )}
        </div>

      </div>

      {/* 4 Technologies Progress Overview */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-base font-bold text-[#1E2538] flex items-center gap-2">
            <Layers className="w-4 h-4 text-[#1E2538]" />
            <span>Avancement par technologie</span>
          </h2>
          <span className="text-xs text-[#9BA7B8]">
            C, C++, Python et SQL exclusivement
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {subjectStats.map((item) => {
            const meta = item.meta;
            return (
              <div
                key={item.id}
                onClick={() => onSelectSubject(item.id)}
                className="p-4 rounded-xl bg-white border border-[#B7C9D6] hover:bg-[#D9E8F4]/30 hover:border-[#9BA7B8] transition-all cursor-pointer shadow-xs flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-md bg-[#D9E8F4] text-[#1E2538] border border-[#B7C9D6]">
                      {meta.shortName}
                    </span>
                    <span className="text-xs font-bold text-[#1E2538] font-mono">
                      {item.progressPercent}%
                    </span>
                  </div>

                  <h3 className="font-bold text-[#1E2538] text-sm">{meta.name}</h3>
                  <p className="text-[11px] text-[#9BA7B8] line-clamp-1 mt-0.5">{meta.tagline}</p>

                  {/* Progress bar */}
                  <div className="w-full bg-[#D9E8F4] rounded-full h-1.5 my-3 overflow-hidden">
                    <div
                      className="h-1.5 rounded-full transition-all duration-500 bg-[#1E2538]"
                      style={{
                        width: `${item.progressPercent}%`,
                      }}
                    />
                  </div>
                </div>

                <div className="pt-2 border-t border-[#B7C9D6] grid grid-cols-2 gap-2 text-[11px]">
                  <div>
                    <span className="text-[#9BA7B8] block">Modules</span>
                    <span className="font-medium text-[#1E2538]">
                      {item.completedCount}/{item.moduleCount} ({item.masteredCount} ⭐)
                    </span>
                  </div>
                  <div>
                    <span className="text-[#9BA7B8] block">Exercices</span>
                    <span className="font-medium text-[#1E2538]">
                      {item.completedExerciseCount}/{item.exerciseCount}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Two Column Section: Today's Schedule & Priority Exercises */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Left: Today's Schedule */}
        <div className="p-5 rounded-xl bg-white border border-[#B7C9D6] shadow-xs flex flex-col">
          <div className="flex items-center justify-between pb-3 border-b border-[#B7C9D6]">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-[#1E2538]" />
              <h3 className="font-bold text-[#1E2538] text-sm">Planning de la journée</h3>
            </div>
            <button
              onClick={onNavigateToPlanning}
              className="text-xs text-[#1E2538] hover:underline font-semibold flex items-center gap-1 cursor-pointer"
            >
              Gérer <ArrowRight className="w-3.5 h-3.5 text-[#9BA7B8]" />
            </button>
          </div>

          <div className="mt-4 space-y-2.5 flex-1">
            {todayActivities.length === 0 ? (
              <div className="text-center py-8 text-xs text-[#9BA7B8]">
                <Calendar className="w-8 h-8 mx-auto text-[#9BA7B8] mb-2" />
                Aucune activité prévue pour aujourd'hui.
                <div className="mt-2">
                  <button
                    onClick={onOpenAvailability}
                    className="text-[#1E2538] font-semibold hover:underline"
                  >
                    Ajouter une activité ou disponibilité
                  </button>
                </div>
              </div>
            ) : (
              todayActivities.map((act) => {
                const typeMeta = ACTIVITY_TYPE_LABELS[act.type] || ACTIVITY_TYPE_LABELS.study_session;
                return (
                  <div
                    key={act.id}
                    className={`p-3 rounded-xl border transition-all flex items-center justify-between gap-3 ${
                      act.isCompleted
                        ? 'bg-[#F4F7F9] border-[#B7C9D6] opacity-60'
                        : 'bg-[#D9E8F4]/40 border-[#B7C9D6]'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={() => toggleActivityComplete(act.id)}
                        className={`w-5 h-5 rounded-md border flex items-center justify-center transition-all cursor-pointer ${
                          act.isCompleted
                            ? 'bg-[#1E2538] border-[#1E2538] text-white'
                            : 'border-[#B7C9D6] hover:border-[#1E2538] text-transparent'
                        }`}
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                      </button>

                      <div>
                        <div className="flex items-center gap-2">
                          <span className={`font-semibold ${act.isCompleted ? 'line-through text-[#9BA7B8]' : 'text-[#1E2538]'}`}>
                            {act.title}
                          </span>
                          <span className={`text-[10px] px-1.5 py-0.2 rounded border ${typeMeta.color}`}>
                            {typeMeta.label}
                          </span>
                          {act.subject && (
                            <span className="text-[10px] uppercase font-mono px-1 py-0.2 rounded bg-[#C5D9E9] text-[#1E2538] border border-[#B7C9D6]">
                              {act.subject}
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-[#9BA7B8] font-mono mt-0.5">
                          {act.startTime} - {act.endTime} ({act.durationMinutes} min)
                        </div>
                      </div>
                    </div>

                    {act.type === 'study_session' && !act.isCompleted && (
                      <button
                        type="button"
                        onClick={() => onNavigateToFocus(act.subject, act.moduleId, act.exerciseId)}
                        className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#1E2538] hover:bg-[#2C3652] text-white transition-all text-[11px] font-medium shrink-0 cursor-pointer"
                        title="Lancer le chronomètre de concentration"
                      >
                        <Play className="w-3 h-3 fill-current" />
                        <span>Démarrer</span>
                      </button>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right: Priority / Upcoming Exercises */}
        <div className="p-5 rounded-xl bg-white border border-[#B7C9D6] shadow-xs flex flex-col">
          <div className="flex items-center justify-between pb-3 border-b border-[#B7C9D6]">
            <div className="flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-[#1E2538]" />
              <h3 className="font-bold text-[#1E2538] text-sm">Exercices prioritaires à réaliser</h3>
            </div>
            <button
              onClick={onNavigateToExercises}
              className="text-xs text-[#1E2538] hover:underline font-semibold flex items-center gap-1 cursor-pointer"
            >
              Tous les exercices <ArrowRight className="w-3.5 h-3.5 text-[#9BA7B8]" />
            </button>
          </div>

          <div className="mt-4 space-y-2.5 flex-1">
            {priorityExercises.length === 0 ? (
              <div className="text-center py-8 text-xs text-[#9BA7B8]">
                <CheckCircle2 className="w-8 h-8 mx-auto text-[#1E2538] mb-2" />
                Aucun exercice urgent en attente !
                <div className="mt-2">
                  <button
                    onClick={onNavigateToExercises}
                    className="text-[#1E2538] font-semibold hover:underline"
                  >
                    Ajouter un exercice
                  </button>
                </div>
              </div>
            ) : (
              priorityExercises.map((ex) => {
                const subMeta = SUBJECTS[ex.subject];
                const diffMeta = DIFFICULTY_LABELS[ex.difficulty];
                return (
                  <div
                    key={ex.id}
                    className="p-3 rounded-xl bg-[#D9E8F4]/40 border border-[#B7C9D6] text-xs flex items-center justify-between gap-3"
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-mono font-bold px-1.5 py-0.2 rounded bg-[#C5D9E9] text-[#1E2538] border border-[#B7C9D6]">
                          {subMeta.shortName}
                        </span>
                        <span className="font-semibold text-[#1E2538] truncate">{ex.title}</span>
                      </div>
                      <div className="flex items-center gap-2 mt-1 text-[11px] text-[#9BA7B8]">
                        <span className={`px-1.5 py-0.2 rounded border text-[10px] ${diffMeta.color}`}>
                          {diffMeta.label}
                        </span>
                        <span>•</span>
                        <span>~{ex.estimatedMinutes} min</span>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => onNavigateToFocus(ex.subject, ex.moduleId, ex.id)}
                      className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#1E2538] hover:bg-[#2C3652] text-white transition-all text-[11px] font-medium shrink-0 cursor-pointer"
                    >
                      <Play className="w-3 h-3 fill-current" />
                      <span>Faire</span>
                    </button>
                  </div>
                );
              })
            )}
          </div>
        </div>

      </div>

    </div>
  );
};
