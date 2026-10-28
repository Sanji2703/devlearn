import React, { useState } from 'react';
import {
  X,
  Sparkles,
  AlertTriangle,
  CheckCircle2,
  Lock
} from 'lucide-react';
import { useData } from '../context/DataContext';
import { ScheduleActivity, SUBJECTS, SubjectId } from '../types';
import { localAiReorganize } from '../lib/localAiPlanner';

interface ReorganizeModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedDate: string;
}

export const ReorganizeModal: React.FC<ReorganizeModalProps> = ({
  isOpen,
  onClose,
  selectedDate,
}) => {
  const {
    activities,
    modules,
    exercises,
    applyReorganizedSchedule,
  } = useData();

  const [prompt, setPrompt] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [proposal, setProposal] = useState<{
    explanation: string;
    clarificationNeeded?: string | null;
    activities: ScheduleActivity[];
    postponedExercises?: string[];
  } | null>(null);

  if (!isOpen) return null;

  // Filter activities for the selected date
  const dayActivities = activities.filter((a) => a.date === selectedDate);
  const pendingExercises = exercises.filter((e) => e.status !== 'completed');

  const presetPrompts = [
    "Mon cours de 10h à 12h est annulé, utilise ce temps pour avancer mes exercices.",
    "Je dois sortir plus tôt, je ne dispose finalement que de 45 minutes ce matin.",
    "J'ai un imprévu personnel de 14h à 15h30, décale mes séances d'apprentissage sans surcharger la soirée.",
    "Je suis disponible 2 heures ce soir de 20h à 22h, prévois du Python et du SQL avec une pause de 15 minutes."
  ];

  const handleGenerateProposal = async () => {
    if (!prompt.trim()) {
      setError('Veuillez décrire votre situation ou changement de disponibilité.');
      return;
    }

    setIsLoading(true);
    setError(null);
    setProposal(null);

    try {
      const response = await fetch('/api/ai/reorganize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: prompt.trim(),
          currentActivities: dayActivities,
          availableModules: modules,
          pendingExercises: pendingExercises,
          currentDate: selectedDate,
        }),
      });

      if (!response.ok) {
        throw new Error(`API status ${response.status}`);
      }

      const data = await response.json();
      if (!data || !data.activities) {
        throw new Error('Réponse invalide');
      }
      setProposal(data);
    } catch (err: any) {
      console.warn('Backend AI unavailable, using intelligent local planner:', err);
      // Seamless local planner fallback
      try {
        const localResult = localAiReorganize(
          prompt.trim(),
          dayActivities,
          modules,
          pendingExercises,
          selectedDate
        );
        setProposal(localResult);
      } catch (fallbackErr: any) {
        setError('Impossible d’effectuer la réorganisation automatique.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleApplyChanges = async () => {
    if (!proposal || !proposal.activities) return;
    try {
      setIsLoading(true);
      await applyReorganizedSchedule(proposal.activities);
      onClose();
    } catch (err: any) {
      setError('Erreur lors de l’application du planning.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#1E2538]/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white border border-[#B7C9D6] rounded-xl max-w-2xl w-full p-6 shadow-xl relative my-8 text-[#1E2538]">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-[#B7C9D6]">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-[#D9E8F4] text-[#1E2538] border border-[#B7C9D6]">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-[#1E2538]">Réorganiser ma journée avec l'IA</h2>
              <p className="text-xs text-[#9BA7B8]">
                Ajustement dynamique pour le {selectedDate} basé sur vos contraintes réelles
              </p>
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
        <div className="mt-5 space-y-4">
          
          {/* Situation description input */}
          <div>
            <label className="block text-xs font-semibold text-[#1E2538] uppercase tracking-wider mb-1.5">
              Que s'est-il passé ? (Imprévu, cours annulé, temps libre supplémentaire...)
            </label>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Ex: Mon cours de 10h à 12h est annulé... ou Je n'ai finalement que 45 minutes disponibles..."
              className="w-full h-24 px-3.5 py-2.5 bg-[#F4F7F9] border border-[#B7C9D6] focus:border-[#1E2538] rounded-xl text-xs text-[#1E2538] placeholder-[#9BA7B8] resize-none outline-none"
            />
          </div>

          {/* Preset chips */}
          <div>
            <span className="text-[11px] font-semibold text-[#9BA7B8] block mb-1.5">
              Exemples rapides :
            </span>
            <div className="flex flex-wrap gap-1.5">
              {presetPrompts.map((p, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setPrompt(p)}
                  className="text-[11px] text-left px-2.5 py-1 rounded-lg bg-[#D9E8F4] hover:bg-[#C5D9E9] text-[#1E2538] border border-[#B7C9D6] transition-all cursor-pointer"
                >
                  {p}
                </button>
              ))}
            </div>
          </div>

          {/* Current fixed commitments notice */}
          <div className="p-3 rounded-xl bg-[#D9E8F4]/50 border border-[#B7C9D6] flex items-start gap-2.5">
            <Lock className="w-4 h-4 text-[#1E2538] shrink-0 mt-0.5" />
            <div className="text-xs text-[#1E2538]">
              <span className="font-bold">Règle de protection stricte : </span>
              L'IA préserve obligatoirement vos événements marqués comme fixes (cours, rendez-vous). Seules les séances d'apprentissage sont réorganisées de manière réaliste.
            </div>
          </div>

          {error && (
            <div className="p-3 rounded-xl bg-[#D9E8F4] border border-[#B7C9D6] text-[#1E2538] text-xs flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0 text-[#1E2538]" />
              <span>{error}</span>
            </div>
          )}

          {/* Button trigger */}
          {!proposal && (
            <div className="pt-2">
              <button
                type="button"
                onClick={handleGenerateProposal}
                disabled={isLoading}
                className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-[#1E2538] hover:bg-[#2C3652] text-white font-medium text-xs sm:text-sm shadow-xs transition-all cursor-pointer disabled:opacity-50"
              >
                {isLoading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                    <span>Analyse de votre planning par Gemini...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 text-[#C5D9E9]" />
                    <span>Calculer la proposition de réorganisation</span>
                  </>
                )}
              </button>
            </div>
          )}

          {/* Proposal results view */}
          {proposal && (
            <div className="mt-4 pt-4 border-t border-[#B7C9D6] space-y-4">
              
              {/* Explanation Card */}
              <div className="p-4 rounded-xl bg-[#D9E8F4]/50 border border-[#B7C9D6]">
                <div className="flex items-center gap-2 text-[#1E2538] text-xs font-bold uppercase tracking-wider mb-1">
                  <CheckCircle2 className="w-4 h-4 text-[#1E2538]" />
                  Proposition de l'assistant Gemini
                </div>
                <p className="text-xs text-[#1E2538] leading-relaxed">
                  {proposal.explanation}
                </p>
                {proposal.clarificationNeeded && (
                  <div className="mt-2.5 p-2 rounded-lg bg-white border border-[#B7C9D6] text-[#1E2538] text-xs">
                    ⚠️ Précision : {proposal.clarificationNeeded}
                  </div>
                )}
              </div>

              {/* Proposed Activities list */}
              <div>
                <h4 className="text-xs font-bold text-[#1E2538] uppercase tracking-wider mb-2">
                  Nouveau planning suggéré ({proposal.activities.length} activités) :
                </h4>
                <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                  {proposal.activities.map((act, index) => {
                    const subj = act.subject ? SUBJECTS[act.subject as SubjectId] : null;
                    return (
                      <div
                        key={act.id || index}
                        className={`p-3 rounded-xl border text-xs flex items-center justify-between gap-3 ${
                          act.isFixed
                            ? 'bg-[#F4F7F9] border-[#B7C9D6] text-[#1E2538]'
                            : 'bg-white border-[#B7C9D6] text-[#1E2538] shadow-xs'
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <div className="font-mono text-xs font-bold text-[#1E2538] bg-[#D9E8F4] px-2 py-0.5 rounded-md border border-[#B7C9D6]">
                            {act.startTime} - {act.endTime}
                          </div>
                          <div>
                            <div className="font-semibold text-[#1E2538] flex items-center gap-1.5">
                              {act.title}
                              {act.isFixed && (
                                <span title="Activité fixe">
                                  <Lock className="w-3 h-3 text-[#9BA7B8]" />
                                </span>
                              )}
                              {subj && (
                                <span className="text-[10px] px-1.5 py-0.2 rounded bg-[#C5D9E9] text-[#1E2538] border border-[#B7C9D6]">
                                  {subj.shortName}
                                </span>
                              )}
                            </div>
                            {act.aiRationale && (
                              <div className="text-[11px] text-[#1E2538]/80 italic mt-0.5">
                                💡 {act.aiRationale}
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="text-[#9BA7B8] text-[11px] shrink-0 font-medium">
                          {act.durationMinutes} min
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Postponed exercises alert if any */}
              {proposal.postponedExercises && proposal.postponedExercises.length > 0 && (
                <div className="p-3 rounded-xl bg-[#F4F7F9] border border-[#B7C9D6] text-xs">
                  <span className="font-bold text-[#1E2538]">Exercices reportés sans culpabilité : </span>
                  <span className="text-[#9BA7B8]">{proposal.postponedExercises.join(', ')}</span>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setProposal(null)}
                  className="px-3.5 py-2 rounded-xl text-xs font-medium text-[#9BA7B8] hover:text-[#1E2538] hover:bg-[#D9E8F4] transition-colors"
                >
                  Recommencer
                </button>
                <button
                  type="button"
                  onClick={handleApplyChanges}
                  disabled={isLoading}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#1E2538] hover:bg-[#2C3652] text-white font-medium text-xs shadow-xs transition-all cursor-pointer"
                >
                  <CheckCircle2 className="w-4 h-4 text-[#C5D9E9]" />
                  <span>Appliquer ce planning</span>
                </button>
              </div>

            </div>
          )}

        </div>

      </div>
    </div>
  );
};
