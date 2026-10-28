import React, { useState } from 'react';
import {
  X,
  Settings,
  Target,
  Clock,
  BookOpen,
  Volume2,
  Calendar,
  CheckCircle2,
  Smartphone
} from 'lucide-react';
import { useData } from '../context/DataContext';
import { SubjectId, SUBJECTS } from '../types';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose }) => {
  const { settings, updateSettings, isSyncing } = useData();

  const [dailyTarget, setDailyTarget] = useState(settings.dailyStudyTargetMinutes || 120);
  const [preferredSub, setPreferredSub] = useState<SubjectId | 'all'>(settings.preferredSubject || 'all');
  const [sessionDuration, setSessionDuration] = useState(settings.defaultSessionDuration || 30);
  const [soundEnabled, setSoundEnabled] = useState(settings.soundEnabled ?? true);
  const [autoPostpone, setAutoPostpone] = useState(settings.autoPostponeUnfinished ?? true);
  const [savedSuccess, setSavedSuccess] = useState(false);

  // Sync internal state if settings change from another device via onSnapshot
  React.useEffect(() => {
    if (isOpen) {
      setDailyTarget(settings.dailyStudyTargetMinutes || 120);
      setPreferredSub(settings.preferredSubject || 'all');
      setSessionDuration(settings.defaultSessionDuration || 30);
      setSoundEnabled(settings.soundEnabled ?? true);
      setAutoPostpone(settings.autoPostponeUnfinished ?? true);
    }
  }, [isOpen, settings]);

  if (!isOpen) return null;

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    await updateSettings({
      dailyStudyTargetMinutes: Number(dailyTarget),
      preferredSubject: preferredSub,
      defaultSessionDuration: Number(sessionDuration),
      soundEnabled,
      autoPostponeUnfinished: autoPostpone,
    });
    setSavedSuccess(true);
    setTimeout(() => {
      setSavedSuccess(false);
      onClose();
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-[#F4F7F9] border border-[#B7C9D6] rounded-2xl max-w-lg w-full shadow-xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="px-6 py-4 bg-white border-b border-[#B7C9D6] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#D9E8F4] text-[#1E2538] flex items-center justify-center border border-[#B7C9D6]">
              <Settings className="w-5 h-5 text-[#1E2538]" />
            </div>
            <div>
              <h2 className="font-bold text-base text-[#1E2538]">
                Paramètres & Préférences d'apprentissage
              </h2>
              <p className="text-xs text-[#9BA7B8]">
                Synchronisés automatiquement sur tous vos appareils
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-[#D9E8F4] text-[#9BA7B8] hover:text-[#1E2538] transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSave} className="p-6 space-y-5 overflow-y-auto flex-1">
          
          {savedSuccess && (
            <div className="p-3 rounded-xl bg-[#D9E8F4] text-[#1E2538] border border-[#B7C9D6] text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-[#1E2538]" />
              <span>Paramètres enregistrés et synchronisés sur le Cloud !</span>
            </div>
          )}

          {/* Daily Goal */}
          <div className="p-4 rounded-xl bg-white border border-[#B7C9D6] shadow-2xs space-y-2.5">
            <label className="text-xs font-bold text-[#1E2538] flex items-center gap-2">
              <Target className="w-4 h-4 text-[#1E2538]" />
              <span>Objectif d'étude quotidien (minutes)</span>
            </label>
            <p className="text-xs text-[#9BA7B8]">
              Définit la cible affichée sur le tableau de bord et le suivi de progression.
            </p>
            <div className="grid grid-cols-4 gap-2 pt-1">
              {[60, 90, 120, 180].map((mins) => (
                <button
                  key={mins}
                  type="button"
                  onClick={() => setDailyTarget(mins)}
                  className={`py-2 px-3 text-xs font-semibold rounded-lg border transition-all cursor-pointer ${
                    dailyTarget === mins
                      ? 'bg-[#1E2538] text-white border-[#1E2538]'
                      : 'bg-[#F4F7F9] text-[#1E2538] border-[#B7C9D6] hover:bg-[#D9E8F4]'
                  }`}
                >
                  {mins / 60} h ({mins}m)
                </button>
              ))}
            </div>
            <div className="pt-2 flex items-center gap-2">
              <span className="text-xs text-[#9BA7B8]">Ou personnalisé :</span>
              <input
                type="number"
                min="10"
                max="720"
                step="10"
                value={dailyTarget}
                onChange={(e) => setDailyTarget(Number(e.target.value))}
                className="w-24 px-2.5 py-1 text-xs border border-[#B7C9D6] rounded-lg bg-[#F4F7F9] text-[#1E2538] font-mono focus:outline-none focus:border-[#1E2538]"
              />
              <span className="text-xs text-[#9BA7B8]">minutes / jour</span>
            </div>
          </div>

          {/* Preferred Subject */}
          <div className="p-4 rounded-xl bg-white border border-[#B7C9D6] shadow-2xs space-y-2.5">
            <label className="text-xs font-bold text-[#1E2538] flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-[#1E2538]" />
              <span>Matière ou technologie prioritaire</span>
            </label>
            <p className="text-xs text-[#9BA7B8]">
              Utilisée par l'IA lors de la réorganisation dynamique de votre emploi du temps.
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-1">
              <button
                type="button"
                onClick={() => setPreferredSub('all')}
                className={`py-2 px-3 text-xs font-medium rounded-lg border transition-all cursor-pointer ${
                  preferredSub === 'all'
                    ? 'bg-[#1E2538] text-white border-[#1E2538]'
                    : 'bg-[#F4F7F9] text-[#1E2538] border-[#B7C9D6] hover:bg-[#D9E8F4]'
                }`}
              >
                Équilibré (Toutes)
              </button>
              {(Object.keys(SUBJECTS) as SubjectId[]).map((subId) => (
                <button
                  key={subId}
                  type="button"
                  onClick={() => setPreferredSub(subId)}
                  className={`py-2 px-3 text-xs font-medium rounded-lg border transition-all cursor-pointer ${
                    preferredSub === subId
                      ? 'bg-[#1E2538] text-white border-[#1E2538]'
                      : 'bg-[#F4F7F9] text-[#1E2538] border-[#B7C9D6] hover:bg-[#D9E8F4]'
                  }`}
                >
                  {SUBJECTS[subId].name}
                </button>
              ))}
            </div>
          </div>

          {/* Default Session Length */}
          <div className="p-4 rounded-xl bg-white border border-[#B7C9D6] shadow-2xs space-y-2.5">
            <label className="text-xs font-bold text-[#1E2538] flex items-center gap-2">
              <Clock className="w-4 h-4 text-[#1E2538]" />
              <span>Durée par défaut d'une session de concentration</span>
            </label>
            <div className="grid grid-cols-4 gap-2 pt-1">
              {[25, 30, 45, 60].map((dur) => (
                <button
                  key={dur}
                  type="button"
                  onClick={() => setSessionDuration(dur)}
                  className={`py-2 px-3 text-xs font-semibold rounded-lg border transition-all cursor-pointer ${
                    sessionDuration === dur
                      ? 'bg-[#1E2538] text-white border-[#1E2538]'
                      : 'bg-[#F4F7F9] text-[#1E2538] border-[#B7C9D6] hover:bg-[#D9E8F4]'
                  }`}
                >
                  {dur} min
                </button>
              ))}
            </div>
          </div>

          {/* Toggle Switches */}
          <div className="p-4 rounded-xl bg-white border border-[#B7C9D6] shadow-2xs space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs font-bold text-[#1E2538] flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-[#1E2538]" />
                  <span>Report automatique des activités</span>
                </div>
                <div className="text-[11px] text-[#9BA7B8] mt-0.5">
                  Proposer de reporter automatiquement les séances non terminées au lendemain.
                </div>
              </div>
              <input
                type="checkbox"
                checked={autoPostpone}
                onChange={(e) => setAutoPostpone(e.target.checked)}
                className="w-4 h-4 rounded text-[#1E2538] cursor-pointer"
              />
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-[#B7C9D6]/40">
              <div>
                <div className="text-xs font-bold text-[#1E2538] flex items-center gap-2">
                  <Volume2 className="w-4 h-4 text-[#1E2538]" />
                  <span>Alerte sonore de fin de session</span>
                </div>
                <div className="text-[11px] text-[#9BA7B8] mt-0.5">
                  Émettre un signal sonore doux lorsque le chronomètre arrive à zéro.
                </div>
              </div>
              <input
                type="checkbox"
                checked={soundEnabled}
                onChange={(e) => setSoundEnabled(e.target.checked)}
                className="w-4 h-4 rounded text-[#1E2538] cursor-pointer"
              />
            </div>
          </div>

          {/* Cross-device sync reminder */}
          <div className="p-3.5 rounded-xl bg-[#D9E8F4]/50 border border-[#B7C9D6] text-xs text-[#1E2538] flex items-center gap-2">
            <Smartphone className="w-4 h-4 text-[#1E2538] shrink-0" />
            <span>Toute modification enregistrée est instantanément répercutée sur votre mobile Android.</span>
          </div>

          {/* Submit */}
          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-[#D9E8F4] hover:bg-[#C5D9E9] text-[#1E2538] text-xs font-medium border border-[#B7C9D6] transition-all cursor-pointer"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={isSyncing}
              className="px-5 py-2 rounded-xl bg-[#1E2538] hover:bg-[#2C3652] text-white text-xs font-semibold shadow-xs transition-all disabled:opacity-50 cursor-pointer"
            >
              {isSyncing ? 'Sauvegarde...' : 'Enregistrer les modifications'}
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};
