import React, { useState } from 'react';
import {
  X,
  Clock,
  Lock,
  Plus,
  BookOpen,
  Coffee,
  Car,
  Briefcase,
  GraduationCap
} from 'lucide-react';
import { useData } from '../context/DataContext';
import { ActivityType, SubjectId } from '../types';

interface AvailabilityModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultDate?: string;
}

export const AvailabilityModal: React.FC<AvailabilityModalProps> = ({
  isOpen,
  onClose,
  defaultDate,
}) => {
  const { saveActivity, modules, exercises } = useData();

  const todayStr = defaultDate || new Date().toISOString().split('T')[0];

  const [title, setTitle] = useState('');
  const [type, setType] = useState<ActivityType>('study_available');
  const [subject, setSubject] = useState<SubjectId | ''>('');
  const [moduleId, setModuleId] = useState('');
  const [exerciseId, setExerciseId] = useState('');
  const [date, setDate] = useState(todayStr);
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('10:00');
  const [isFixed, setIsFixed] = useState(false);
  const [notes, setNotes] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const filteredModules = subject ? modules.filter((m) => m.subject === subject) : [];
  const filteredExercises = moduleId ? exercises.filter((e) => e.moduleId === moduleId) : [];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError('Veuillez renseigner un titre pour cette activité.');
      return;
    }
    if (startTime >= endTime) {
      setError('L’heure de fin doit être postérieure à l’heure de début.');
      return;
    }

    setIsSaving(true);
    setError(null);
    try {
      await saveActivity({
        title: title.trim(),
        type,
        subject: (subject as SubjectId) || undefined,
        moduleId: moduleId || undefined,
        exerciseId: exerciseId || undefined,
        date,
        startTime,
        endTime,
        isFixed,
        isCompleted: false,
        notes: notes.trim(),
      });
      onClose();
    } catch (err: any) {
      setError(err.message || 'Erreur lors de l’enregistrement de l’activité.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleQuickPreset = (presetType: ActivityType, defaultTitle: string, fixed: boolean) => {
    setType(presetType);
    setTitle(defaultTitle);
    setIsFixed(fixed);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#1E2538]/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white border border-[#B7C9D6] rounded-xl max-w-lg w-full p-6 shadow-xl relative my-8 text-[#1E2538]">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-[#B7C9D6]">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-[#D9E8F4] text-[#1E2538] border border-[#B7C9D6]">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-[#1E2538]">Ajouter une activité / Disponibilité</h2>
              <p className="text-xs text-[#9BA7B8]">Renseignez vos cours, créneaux libres ou obligations</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-[#9BA7B8] hover:text-[#1E2538] rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Quick Type Presets */}
        <div className="mt-4">
          <label className="block text-[11px] font-semibold text-[#1E2538] uppercase tracking-wider mb-1.5">
            Type d'activité rapide
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5 text-xs">
            <button
              type="button"
              onClick={() => handleQuickPreset('study_available', 'Créneau d\'apprentissage libre', false)}
              className={`p-2 rounded-xl border text-left flex items-center gap-2 transition-all cursor-pointer ${
                type === 'study_available'
                  ? 'bg-[#C5D9E9] border-[#B7C9D6] text-[#1E2538] font-semibold'
                  : 'bg-[#F4F7F9] border-[#B7C9D6] text-[#1E2538] hover:bg-[#D9E8F4]'
              }`}
            >
              <Clock className="w-4 h-4 text-[#1E2538] shrink-0" />
              <span className="truncate">Disponibilité</span>
            </button>
            <button
              type="button"
              onClick={() => handleQuickPreset('course', 'Cours obligatoire', true)}
              className={`p-2 rounded-xl border text-left flex items-center gap-2 transition-all cursor-pointer ${
                type === 'course'
                  ? 'bg-[#C5D9E9] border-[#B7C9D6] text-[#1E2538] font-semibold'
                  : 'bg-[#F4F7F9] border-[#B7C9D6] text-[#1E2538] hover:bg-[#D9E8F4]'
              }`}
            >
              <GraduationCap className="w-4 h-4 text-[#1E2538] shrink-0" />
              <span className="truncate">Cours</span>
            </button>
            <button
              type="button"
              onClick={() => handleQuickPreset('study_session', 'Séance ciblée', false)}
              className={`p-2 rounded-xl border text-left flex items-center gap-2 transition-all cursor-pointer ${
                type === 'study_session'
                  ? 'bg-[#C5D9E9] border-[#B7C9D6] text-[#1E2538] font-semibold'
                  : 'bg-[#F4F7F9] border-[#B7C9D6] text-[#1E2538] hover:bg-[#D9E8F4]'
              }`}
            >
              <BookOpen className="w-4 h-4 text-[#1E2538] shrink-0" />
              <span className="truncate">Étude ciblée</span>
            </button>
            <button
              type="button"
              onClick={() => handleQuickPreset('appointment', 'Rendez-vous', true)}
              className={`p-2 rounded-xl border text-left flex items-center gap-2 transition-all cursor-pointer ${
                type === 'appointment'
                  ? 'bg-[#C5D9E9] border-[#B7C9D6] text-[#1E2538] font-semibold'
                  : 'bg-[#F4F7F9] border-[#B7C9D6] text-[#1E2538] hover:bg-[#D9E8F4]'
              }`}
            >
              <Briefcase className="w-4 h-4 text-[#1E2538] shrink-0" />
              <span className="truncate">Rendez-vous</span>
            </button>
            <button
              type="button"
              onClick={() => handleQuickPreset('commute', 'Déplacement / Transport', true)}
              className={`p-2 rounded-xl border text-left flex items-center gap-2 transition-all cursor-pointer ${
                type === 'commute'
                  ? 'bg-[#C5D9E9] border-[#B7C9D6] text-[#1E2538] font-semibold'
                  : 'bg-[#F4F7F9] border-[#B7C9D6] text-[#1E2538] hover:bg-[#D9E8F4]'
              }`}
            >
              <Car className="w-4 h-4 text-[#1E2538] shrink-0" />
              <span className="truncate">Déplacement</span>
            </button>
            <button
              type="button"
              onClick={() => handleQuickPreset('rest', 'Pause / Repos', false)}
              className={`p-2 rounded-xl border text-left flex items-center gap-2 transition-all cursor-pointer ${
                type === 'rest'
                  ? 'bg-[#C5D9E9] border-[#B7C9D6] text-[#1E2538] font-semibold'
                  : 'bg-[#F4F7F9] border-[#B7C9D6] text-[#1E2538] hover:bg-[#D9E8F4]'
              }`}
            >
              <Coffee className="w-4 h-4 text-[#1E2538] shrink-0" />
              <span className="truncate">Repos</span>
            </button>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="mt-4 space-y-3.5">
          
          {/* Title */}
          <div>
            <label className="block text-xs font-semibold text-[#1E2538] mb-1">
              Titre de l'activité *
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ex: Révision pointeurs C, Cours d'algorithmique, Trajet bus..."
              className="w-full px-3 py-2 bg-[#F4F7F9] border border-[#B7C9D6] focus:border-[#1E2538] rounded-xl text-xs text-[#1E2538] outline-none"
            />
          </div>

          {/* Date and Times */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            <div>
              <label className="block text-xs font-semibold text-[#1E2538] mb-1">
                Date
              </label>
              <input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-2.5 py-1.5 bg-[#F4F7F9] border border-[#B7C9D6] rounded-xl text-xs text-[#1E2538] outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#1E2538] mb-1">
                Début
              </label>
              <input
                type="time"
                required
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="w-full px-2.5 py-1.5 bg-[#F4F7F9] border border-[#B7C9D6] rounded-xl text-xs text-[#1E2538] outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#1E2538] mb-1">
                Fin
              </label>
              <input
                type="time"
                required
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className="w-full px-2.5 py-1.5 bg-[#F4F7F9] border border-[#B7C9D6] rounded-xl text-xs text-[#1E2538] outline-none"
              />
            </div>
          </div>

          {/* Study specific bindings */}
          {(type === 'study_session' || type === 'study_available') && (
            <div className="p-3.5 rounded-xl bg-[#D9E8F4]/50 border border-[#B7C9D6] space-y-2.5">
              <span className="text-xs font-bold text-[#1E2538] block">
                Association avec mon programme (Facultatif)
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] font-medium text-[#1E2538] mb-1">Matière</label>
                  <select
                    value={subject}
                    onChange={(e) => {
                      setSubject(e.target.value as SubjectId);
                      setModuleId('');
                      setExerciseId('');
                    }}
                    className="w-full px-2.5 py-1.5 bg-white border border-[#B7C9D6] rounded-lg text-xs text-[#1E2538] outline-none"
                  >
                    <option value="">-- Aucune matière --</option>
                    <option value="c">C</option>
                    <option value="cpp">C++</option>
                    <option value="python">Python</option>
                    <option value="sql">SQL</option>
                  </select>
                </div>

                {subject && (
                  <div>
                    <label className="block text-[11px] font-medium text-[#1E2538] mb-1">Module</label>
                    <select
                      value={moduleId}
                      onChange={(e) => {
                        setModuleId(e.target.value);
                        setExerciseId('');
                      }}
                      className="w-full px-2.5 py-1.5 bg-white border border-[#B7C9D6] rounded-lg text-xs text-[#1E2538] outline-none"
                    >
                      <option value="">-- Choisir un module --</option>
                      {filteredModules.map((m) => (
                        <option key={m.id} value={m.id}>
                          {m.title}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              {moduleId && filteredExercises.length > 0 && (
                <div>
                  <label className="block text-[11px] font-medium text-[#1E2538] mb-1">Exercice lié</label>
                  <select
                    value={exerciseId}
                    onChange={(e) => setExerciseId(e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-white border border-[#B7C9D6] rounded-lg text-xs text-[#1E2538] outline-none"
                  >
                    <option value="">-- Aucun exercice spécifique --</option>
                    {filteredExercises.map((ex) => (
                      <option key={ex.id} value={ex.id}>
                        {ex.title} ({ex.estimatedMinutes} min - {ex.difficulty})
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>
          )}

          {/* Is Fixed Toggle */}
          <div className="flex items-center gap-3 p-3 rounded-xl bg-[#F4F7F9] border border-[#B7C9D6]">
            <input
              type="checkbox"
              id="isFixedCheckbox"
              checked={isFixed}
              onChange={(e) => setIsFixed(e.target.checked)}
              className="w-4 h-4 rounded text-[#1E2538] border-[#B7C9D6] focus:ring-0 cursor-pointer"
            />
            <label htmlFor="isFixedCheckbox" className="text-xs text-[#1E2538] cursor-pointer">
              <span className="font-bold flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5 text-[#1E2538]" />
                Événement fixe (Ne pas déplacer)
              </span>
              <span className="text-[#9BA7B8] text-[11px] block mt-0.5">
                L'assistant IA ne pourra jamais déplacer ou annuler cette activité lors d'une réorganisation.
              </span>
            </label>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-semibold text-[#1E2538] mb-1">
              Notes personnelles
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Ex: Préparer le TP n°2, prendre les écouteurs..."
              className="w-full px-3 py-2 bg-[#F4F7F9] border border-[#B7C9D6] focus:border-[#1E2538] rounded-xl text-xs text-[#1E2538] outline-none"
            />
          </div>

          {error && (
            <div className="p-2.5 rounded-xl bg-[#D9E8F4] border border-[#B7C9D6] text-[#1E2538] text-xs">
              {error}
            </div>
          )}

          {/* Buttons */}
          <div className="flex items-center justify-end gap-2.5 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-medium text-[#9BA7B8] hover:text-[#1E2538] transition-colors"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#1E2538] hover:bg-[#2C3652] text-white font-medium text-xs shadow-xs transition-all cursor-pointer disabled:opacity-50"
            >
              <Plus className="w-4 h-4" />
              <span>{isSaving ? 'Enregistrement...' : 'Ajouter au planning'}</span>
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};
