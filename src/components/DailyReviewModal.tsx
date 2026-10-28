import React, { useState } from 'react';
import {
  X,
  ClipboardCheck,
  CheckCircle2,
  Heart,
  Save
} from 'lucide-react';
import { useData } from '../context/DataContext';

interface DailyReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedDate: string;
}

export const DailyReviewModal: React.FC<DailyReviewModalProps> = ({
  isOpen,
  onClose,
  selectedDate,
}) => {
  const { activities, sessions, saveDailyReview, reviews } = useData();

  // Day's activities
  const dayActivities = activities.filter((a) => a.date === selectedDate);
  const studyActivities = dayActivities.filter((a) => a.type === 'study_session');
  const completedActivities = studyActivities.filter((a) => a.isCompleted);
  const uncompletedActivities = studyActivities.filter((a) => !a.isCompleted);

  const plannedMinutes = studyActivities.reduce((acc, c) => acc + (c.durationMinutes || 0), 0);
  const sessionMinutes = sessions
    .filter((s) => s.completedAt && s.completedAt.startsWith(selectedDate))
    .reduce((acc, c) => acc + (c.durationMinutes || 0), 0);
  const actualMinutes = Math.max(sessionMinutes, completedActivities.reduce((acc, c) => acc + (c.durationMinutes || 0), 0));

  // Existing review if any
  const existingReview = reviews.find((r) => r.date === selectedDate);

  const [difficulties, setDifficulties] = useState(existingReview?.difficulties || '');
  const [carryOverNotes, setCarryOverNotes] = useState(existingReview?.carryOverNotes || '');
  const [isSaving, setIsSaving] = useState(false);
  const [isSaved, setIsSaved] = useState(false);

  if (!isOpen) return null;

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await saveDailyReview({
        date: selectedDate,
        plannedMinutes,
        actualMinutes,
        completedCount: completedActivities.length,
        pendingCount: uncompletedActivities.length,
        difficulties: difficulties.trim(),
        carryOverNotes: carryOverNotes.trim(),
      });
      setIsSaved(true);
      setTimeout(() => {
        onClose();
      }, 1200);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#1E2538]/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white border border-[#B7C9D6] rounded-xl max-w-xl w-full p-6 shadow-xl relative my-8 text-[#1E2538]">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-[#B7C9D6]">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-[#D9E8F4] text-[#1E2538] border border-[#B7C9D6]">
              <ClipboardCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-[#1E2538]">Bilan de ma journée</h2>
              <p className="text-xs text-[#9BA7B8]">Réflexion & ajustement pour le {selectedDate}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-[#9BA7B8] hover:text-[#1E2538] rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSave} className="mt-4 space-y-4">
          
          {/* Benevolent Non-judgmental Message */}
          <div className="p-3.5 rounded-xl bg-[#D9E8F4]/50 border border-[#B7C9D6] flex items-start gap-2.5">
            <Heart className="w-4 h-4 text-[#1E2538] shrink-0 mt-0.5" />
            <p className="text-xs text-[#1E2538] leading-relaxed">
              Ce bilan sert à mieux adapter votre rythme de demain. Chaque journée a ses imprévus : l'important est la régularité sur le long terme sans culpabilisation.
            </p>
          </div>

          {/* Time & Task Summary */}
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="p-3 rounded-xl bg-[#F4F7F9] border border-[#B7C9D6]">
              <span className="text-[#9BA7B8] block text-[11px]">Temps d'apprentissage</span>
              <div className="mt-1 flex items-baseline gap-1">
                <span className="text-lg font-bold font-mono text-[#1E2538]">{actualMinutes} min</span>
                <span className="text-[#9BA7B8]">/ {plannedMinutes} min</span>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-[#F4F7F9] border border-[#B7C9D6]">
              <span className="text-[#9BA7B8] block text-[11px]">Séances d'étude</span>
              <div className="mt-1 flex items-baseline gap-1">
                <span className="text-lg font-bold font-mono text-[#1E2538]">{completedActivities.length}</span>
                <span className="text-[#9BA7B8]">réalisées, {uncompletedActivities.length} à reporter</span>
              </div>
            </div>
          </div>

          {/* Uncompleted tasks to carry over */}
          {uncompletedActivities.length > 0 && (
            <div className="p-3 rounded-xl bg-[#F4F7F9] border border-[#B7C9D6] text-xs space-y-1.5">
              <span className="font-bold text-[#1E2538] block">
                Séances non terminées aujourd'hui (à reporter sans stress) :
              </span>
              <ul className="list-disc list-inside text-[#9BA7B8] space-y-1">
                {uncompletedActivities.map((a) => (
                  <li key={a.id} className="truncate">
                    {a.title} ({a.durationMinutes} min)
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Difficulties encountered input */}
          <div>
            <label className="block text-xs font-semibold text-[#1E2538] mb-1">
              Difficultés rencontrées aujourd'hui (Facultatif)
            </label>
            <textarea
              rows={2}
              placeholder="Ex: La gestion des pointeurs C m'a pris plus de temps que prévu, fatigue après les cours..."
              value={difficulties}
              onChange={(e) => setDifficulties(e.target.value)}
              className="w-full px-3 py-2 bg-[#F4F7F9] border border-[#B7C9D6] rounded-xl text-xs text-[#1E2538] outline-none resize-none"
            />
          </div>

          {/* Notes for tomorrow */}
          <div>
            <label className="block text-xs font-semibold text-[#1E2538] mb-1">
              Priorités ou souhaits pour le lendemain
            </label>
            <textarea
              rows={2}
              placeholder="Ex: Reprendre l'exercice SQL au calme le matin, garder 1h pour C++..."
              value={carryOverNotes}
              onChange={(e) => setCarryOverNotes(e.target.value)}
              className="w-full px-3 py-2 bg-[#F4F7F9] border border-[#B7C9D6] rounded-xl text-xs text-[#1E2538] outline-none resize-none"
            />
          </div>

          {isSaved && (
            <div className="p-2.5 rounded-xl bg-[#D9E8F4] border border-[#B7C9D6] text-[#1E2538] text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-[#1E2538]" />
              <span>Bilan quotidien enregistré avec succès !</span>
            </div>
          )}

          {/* Buttons */}
          <div className="flex justify-end gap-2.5 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs text-[#9BA7B8] hover:text-[#1E2538]"
            >
              Fermer
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-[#1E2538] hover:bg-[#2C3652] text-white font-medium text-xs shadow-xs transition-all cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>{isSaving ? 'Enregistrement...' : 'Enregistrer mon bilan'}</span>
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};
