import React, { useState, useMemo } from 'react';
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Plus,
  Sparkles,
  Lock,
  CheckCircle2,
  Trash2,
  Play
} from 'lucide-react';
import { useData } from '../context/DataContext';
import {
  ACTIVITY_TYPE_LABELS,
  SUBJECTS,
  SubjectId
} from '../types';

interface PlanningViewProps {
  onOpenReorganize: () => void;
  onOpenAvailability: () => void;
  onStartFocus: (subject?: SubjectId, moduleId?: string, exerciseId?: string) => void;
}

export const PlanningView: React.FC<PlanningViewProps> = ({
  onOpenReorganize,
  onOpenAvailability,
  onStartFocus,
}) => {
  const {
    activities,
    toggleActivityComplete,
    deleteActivity,
  } = useData();

  // Current selected date (YYYY-MM-DD)
  const [selectedDate, setSelectedDate] = useState(() => new Date().toISOString().split('T')[0]);

  // Navigate date
  const changeDate = (deltaDays: number) => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() + deltaDays);
    setSelectedDate(d.toISOString().split('T')[0]);
  };

  const setToday = () => {
    setSelectedDate(new Date().toISOString().split('T')[0]);
  };

  // Formatted date string in French
  const formattedDate = useMemo(() => {
    const d = new Date(selectedDate + 'T12:00:00');
    const str = new Intl.DateTimeFormat('fr-FR', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }).format(d);
    return str.charAt(0).toUpperCase() + str.slice(1);
  }, [selectedDate]);

  // Activities for this date sorted by start time
  const dayActivities = useMemo(() => {
    return activities
      .filter((a) => a.date === selectedDate)
      .sort((a, b) => a.startTime.localeCompare(b.startTime));
  }, [activities, selectedDate]);

  // Summary stats for the day
  const studyActivities = dayActivities.filter((a) => a.type === 'study_session');
  const totalStudyMinutes = studyActivities.reduce((acc, c) => acc + (c.durationMinutes || 0), 0);
  const completedStudyMinutes = studyActivities
    .filter((a) => a.isCompleted)
    .reduce((acc, c) => acc + (c.durationMinutes || 0), 0);

  return (
    <div className="space-y-6 pb-12">
      
      {/* Top Header & Day Navigation */}
      <div className="p-5 sm:p-6 rounded-xl bg-white border border-[#B7C9D6] shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#D9E8F4] text-[#1E2538] border border-[#B7C9D6] text-xs font-semibold uppercase tracking-wider mb-2">
            <CalendarIcon className="w-3.5 h-3.5" />
            <span>Planning dynamique & intelligent</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-[#1E2538] tracking-tight">
            Emploi du temps adaptatif
          </h1>
          <p className="text-xs sm:text-sm text-[#9BA7B8] mt-1">
            Flexible et synchronisé entre votre ordinateur et votre mobile Android.
          </p>
        </div>

        {/* Action buttons */}
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={onOpenReorganize}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#1E2538] hover:bg-[#2C3652] text-white font-medium text-xs sm:text-sm shadow-xs transition-all cursor-pointer"
          >
            <Sparkles className="w-4 h-4 text-[#C5D9E9]" />
            <span>Réorganiser ma journée</span>
          </button>

          <button
            type="button"
            onClick={onOpenAvailability}
            className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-[#D9E8F4] hover:bg-[#C5D9E9] text-[#1E2538] font-medium text-xs sm:text-sm border border-[#B7C9D6] shadow-xs transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4 text-[#1E2538]" />
            <span>Ajouter une activité</span>
          </button>
        </div>
      </div>

      {/* Date Navigator Bar */}
      <div className="p-3 sm:p-4 rounded-xl bg-white border border-[#B7C9D6] shadow-xs flex items-center justify-between gap-3">
        <button
          onClick={() => changeDate(-1)}
          className="p-2 rounded-xl bg-[#F4F7F9] hover:bg-[#D9E8F4] text-[#1E2538] border border-[#B7C9D6] transition-colors cursor-pointer"
          title="Jour précédent"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>

        <div className="flex items-center gap-2 sm:gap-3">
          <span className="font-bold text-sm sm:text-base text-[#1E2538] text-center">
            {formattedDate}
          </span>
          <button
            onClick={setToday}
            className="px-2.5 py-1 rounded-lg bg-[#D9E8F4] text-[#1E2538] border border-[#B7C9D6] text-xs font-semibold hover:bg-[#C5D9E9] transition-colors cursor-pointer"
          >
            Aujourd'hui
          </button>
        </div>

        <button
          onClick={() => changeDate(1)}
          className="p-2 rounded-xl bg-[#F4F7F9] hover:bg-[#D9E8F4] text-[#1E2538] border border-[#B7C9D6] transition-colors cursor-pointer"
          title="Jour suivant"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* Day summary stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
        <div className="p-3.5 rounded-xl bg-white border border-[#B7C9D6] shadow-xs">
          <span className="text-[#9BA7B8] block text-[11px]">Total activités</span>
          <span className="text-base font-bold text-[#1E2538] font-mono mt-0.5 block">
            {dayActivities.length}
          </span>
        </div>
        <div className="p-3.5 rounded-xl bg-white border border-[#B7C9D6] shadow-xs">
          <span className="text-[#9BA7B8] block text-[11px]">Séances d'étude</span>
          <span className="text-base font-bold text-[#1E2538] font-mono mt-0.5 block">
            {studyActivities.length}
          </span>
        </div>
        <div className="p-3.5 rounded-xl bg-white border border-[#B7C9D6] shadow-xs">
          <span className="text-[#9BA7B8] block text-[11px]">Temps d'étude prévu</span>
          <span className="text-base font-bold text-[#1E2538] font-mono mt-0.5 block">
            {totalStudyMinutes} min
          </span>
        </div>
        <div className="p-3.5 rounded-xl bg-white border border-[#B7C9D6] shadow-xs">
          <span className="text-[#9BA7B8] block text-[11px]">Temps réalisé</span>
          <span className="text-base font-bold text-[#1E2538] font-mono mt-0.5 block">
            {completedStudyMinutes} min
          </span>
        </div>
      </div>

      {/* Timeline List */}
      <div className="space-y-3">
        {dayActivities.length === 0 ? (
          <div className="text-center py-12 px-4 rounded-xl bg-white border border-[#B7C9D6] space-y-3 shadow-xs">
            <CalendarIcon className="w-10 h-10 text-[#9BA7B8] mx-auto" />
            <h3 className="text-sm font-semibold text-[#1E2538]">
              Aucune activité enregistrée pour cette journée
            </h3>
            <p className="text-xs text-[#9BA7B8] max-w-sm mx-auto">
              Ajoutez vos cours, rendez-vous, déplacements ou périodes d'apprentissage, ou utilisez l'IA pour préparer la journée.
            </p>
            <div className="flex flex-wrap justify-center gap-2 pt-1">
              <button
                onClick={onOpenAvailability}
                className="px-4 py-2 rounded-xl bg-[#1E2538] hover:bg-[#2C3652] text-white font-medium text-xs shadow-xs cursor-pointer"
              >
                + Ajouter une activité
              </button>
              <button
                onClick={onOpenReorganize}
                className="px-4 py-2 rounded-xl bg-[#D9E8F4] hover:bg-[#C5D9E9] text-[#1E2538] font-medium text-xs border border-[#B7C9D6] cursor-pointer flex items-center gap-1.5"
              >
                <Sparkles className="w-3.5 h-3.5 text-[#1E2538]" />
                <span>Organiser avec l'IA</span>
              </button>
            </div>
          </div>
        ) : (
          dayActivities.map((act) => {
            const typeMeta = ACTIVITY_TYPE_LABELS[act.type] || ACTIVITY_TYPE_LABELS.study_session;
            const subjMeta = act.subject ? SUBJECTS[act.subject as SubjectId] : null;

            return (
              <div
                key={act.id}
                className={`p-4 rounded-xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs ${
                  act.isCompleted
                    ? 'bg-[#F4F7F9] border-[#B7C9D6] opacity-60'
                    : act.aiProposed
                    ? 'bg-[#D9E8F4]/30 border-[#B7C9D6]'
                    : 'bg-white border-[#B7C9D6]'
                }`}
              >
                {/* Left: Time badge & Info */}
                <div className="flex items-start sm:items-center gap-3">
                  
                  {/* Completion check */}
                  <button
                    type="button"
                    onClick={() => toggleActivityComplete(act.id)}
                    className={`w-6 h-6 rounded-lg border flex items-center justify-center transition-all cursor-pointer mt-0.5 sm:mt-0 shrink-0 ${
                      act.isCompleted
                        ? 'bg-[#1E2538] border-[#1E2538] text-white'
                        : 'border-[#B7C9D6] hover:border-[#1E2538] text-transparent'
                    }`}
                    title={act.isCompleted ? 'Marquer non terminée' : 'Marquer comme terminée'}
                  >
                    <CheckCircle2 className="w-4 h-4" />
                  </button>

                  {/* Time Range */}
                  <div className="font-mono text-xs font-bold text-[#1E2538] bg-[#D9E8F4] border border-[#B7C9D6] px-2.5 py-1 rounded-lg shrink-0">
                    {act.startTime} - {act.endTime}
                  </div>

                  {/* Main Details */}
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`font-semibold text-sm ${act.isCompleted ? 'line-through text-[#9BA7B8]' : 'text-[#1E2538]'}`}>
                        {act.title}
                      </span>

                      {/* Type badge */}
                      <span className={`text-[10px] px-2 py-0.5 rounded border ${typeMeta.color}`}>
                        {typeMeta.label}
                      </span>

                      {/* Subject tag */}
                      {subjMeta && (
                        <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-[#C5D9E9] text-[#1E2538] border border-[#B7C9D6]">
                          {subjMeta.shortName}
                        </span>
                      )}

                      {/* Fixed badge */}
                      {act.isFixed && (
                        <span className="flex items-center gap-1 text-[10px] px-2 py-0.5 rounded bg-[#D9E8F4] text-[#1E2538] border border-[#B7C9D6]" title="Activité fixe protégée">
                          <Lock className="w-2.5 h-2.5" />
                          Fixe
                        </span>
                      )}

                      {/* AI proposed badge */}
                      {act.aiProposed && (
                        <span className="flex items-center gap-1 text-[10px] px-2 py-0.5 rounded bg-[#C5D9E9] text-[#1E2538] border border-[#B7C9D6]">
                          <Sparkles className="w-2.5 h-2.5" />
                          IA
                        </span>
                      )}
                    </div>

                    {/* AI rationale or notes */}
                    {act.aiRationale && (
                      <div className="text-[11px] text-[#1E2538]/80 italic mt-1">
                        💡 {act.aiRationale}
                      </div>
                    )}
                    {act.notes && (
                      <div className="text-[11px] text-[#9BA7B8] mt-0.5">
                        📝 {act.notes}
                      </div>
                    )}
                  </div>
                </div>

                {/* Right: Duration, Action & Delete */}
                <div className="flex items-center gap-3 shrink-0 self-end sm:self-center">
                  <span className="text-xs text-[#9BA7B8] font-medium">
                    {act.durationMinutes} min
                  </span>

                  {act.type === 'study_session' && !act.isCompleted && (
                    <button
                      onClick={() => onStartFocus(act.subject, act.moduleId, act.exerciseId)}
                      className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-[#1E2538] hover:bg-[#2C3652] text-white text-xs font-medium shadow-xs transition-all cursor-pointer"
                    >
                      <Play className="w-3.5 h-3.5 fill-current" />
                      <span>Démarrer</span>
                    </button>
                  )}

                  <button
                    onClick={() => {
                      if (confirm(`Supprimer l'activité "${act.title}" ?`)) {
                        deleteActivity(act.id);
                      }
                    }}
                    className="p-1.5 text-[#9BA7B8] hover:text-rose-600 hover:bg-[#D9E8F4] rounded-lg transition-colors cursor-pointer"
                    title="Supprimer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

              </div>
            );
          })
        )}
      </div>

    </div>
  );
};
