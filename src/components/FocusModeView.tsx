import React, { useState, useEffect, useRef } from 'react';
import {
  Timer,
  Play,
  Pause,
  RotateCcw,
  CheckCircle2,
  Clock,
  BookOpen,
  Smartphone
} from 'lucide-react';
import { useData } from '../context/DataContext';
import { SubjectId, SUBJECTS } from '../types';

interface FocusModeViewProps {
  initialSubject?: SubjectId;
  initialModuleId?: string;
  initialExerciseId?: string;
}

export const FocusModeView: React.FC<FocusModeViewProps> = ({
  initialSubject,
  initialModuleId,
  initialExerciseId,
}) => {
  const {
    modules,
    exercises,
    sessions,
    logStudySession,
  } = useData();

  // Selected parameters
  const [selectedSubject, setSelectedSubject] = useState<SubjectId>(initialSubject || 'c');
  const [selectedModuleId, setSelectedModuleId] = useState<string>(initialModuleId || '');
  const [selectedExerciseId, setSelectedExerciseId] = useState<string>(initialExerciseId || '');
  const [sessionNotes, setSessionNotes] = useState('');

  // Duration in minutes
  const [targetMinutes, setTargetMinutes] = useState(25);
  const [secondsRemaining, setSecondsRemaining] = useState(25 * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  const timerRef = useRef<any>(null);

  // Audio tone generator
  const playChime = () => {
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, audioCtx.currentTime); // D5
      osc.frequency.exponentialRampToValueAtTime(880, audioCtx.currentTime + 0.3); // A5
      gain.gain.setValueAtTime(0.2, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.8);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.8);
    } catch (_) {}
  };

  useEffect(() => {
    if (isRunning) {
      timerRef.current = setInterval(() => {
        setSecondsRemaining((prev) => {
          if (prev <= 1) {
            clearInterval(timerRef.current);
            setIsRunning(false);
            playChime();
            handleCompleteSession(targetMinutes);
            return 0;
          }
          return prev - 1;
        });
        setElapsedSeconds((prev) => prev + 1);
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isRunning, targetMinutes]);

  const handleSetDuration = (mins: number) => {
    setIsRunning(false);
    setTargetMinutes(mins);
    setSecondsRemaining(mins * 60);
    setElapsedSeconds(0);
  };

  const handleToggleTimer = () => {
    setIsRunning(!isRunning);
  };

  const handleResetTimer = () => {
    setIsRunning(false);
    setSecondsRemaining(targetMinutes * 60);
    setElapsedSeconds(0);
  };

  const handleCompleteSession = async (actualMins?: number) => {
    setIsRunning(false);
    const durationMins = actualMins ?? Math.max(1, Math.round(elapsedSeconds / 60));

    await logStudySession({
      subject: selectedSubject,
      moduleId: selectedModuleId || undefined,
      exerciseId: selectedExerciseId || undefined,
      targetMinutes,
      durationMinutes: durationMins,
      completedAt: new Date().toISOString(),
      notes: sessionNotes.trim(),
    });

    setSecondsRemaining(targetMinutes * 60);
    setElapsedSeconds(0);
    setSessionNotes('');
    alert(`Séance de concentration de ${durationMins} minutes enregistrée dans votre historique !`);
  };

  // Time format
  const mins = Math.floor(secondsRemaining / 60);
  const secs = secondsRemaining % 60;
  const timeFormatted = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;

  // Progress percentage
  const totalSeconds = targetMinutes * 60;
  const progressPercent = totalSeconds > 0
    ? Math.round(((totalSeconds - secondsRemaining) / totalSeconds) * 100)
    : 0;

  const availableModules = modules.filter((m) => m.subject === selectedSubject);
  const availableExercises = selectedModuleId
    ? exercises.filter((e) => e.moduleId === selectedModuleId)
    : exercises.filter((e) => e.subject === selectedSubject);

  return (
    <div className="space-y-6 pb-12">
      
      {/* Top Banner */}
      <div className="p-5 sm:p-6 rounded-xl bg-white border border-[#B7C9D6] shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#D9E8F4] text-[#1E2538] border border-[#B7C9D6] text-xs font-semibold uppercase tracking-wider mb-2">
            <Timer className="w-3.5 h-3.5" />
            <span>Mode Concentration & Pomodoro</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-[#1E2538] tracking-tight">
            Séances de travail focalisées
          </h1>
          <p className="text-xs sm:text-sm text-[#9BA7B8] mt-1">
            Chronométrez vos sessions, associez-les à vos modules et consignez votre temps réel.
          </p>
        </div>
      </div>

      {/* Main Focus Area */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left / Center: Chronometer */}
        <div className="lg:col-span-7 p-6 rounded-xl bg-white border border-[#B7C9D6] shadow-xs flex flex-col items-center justify-center text-center">
          
          {/* Duration Preset Selector */}
          <div className="flex items-center gap-2 mb-6">
            {[15, 25, 45, 60, 90].map((m) => (
              <button
                key={m}
                onClick={() => handleSetDuration(m)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold font-mono transition-all cursor-pointer ${
                  targetMinutes === m
                    ? 'bg-[#1E2538] text-white shadow-xs'
                    : 'bg-[#F4F7F9] text-[#1E2538] hover:bg-[#D9E8F4] border border-[#B7C9D6]'
                }`}
              >
                {m}m
              </button>
            ))}
          </div>

          {/* Circular Visual Timer */}
          <div className="relative w-64 h-64 flex items-center justify-center my-2">
            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
              {/* Background circle */}
              <circle
                cx="50"
                cy="50"
                r="44"
                stroke="#D9E8F4"
                strokeWidth="6"
                fill="none"
              />
              {/* Progress circle */}
              <circle
                cx="50"
                cy="50"
                r="44"
                stroke="#1E2538"
                strokeWidth="6"
                strokeDasharray="276.46"
                strokeDashoffset={276.46 - (276.46 * progressPercent) / 100}
                strokeLinecap="round"
                fill="none"
                className="transition-all duration-300"
              />
            </svg>

            <div className="absolute flex flex-col items-center">
              <span className="font-mono text-5xl font-bold text-[#1E2538] tracking-wider">
                {timeFormatted}
              </span>
              <span className="text-xs text-[#9BA7B8] font-medium mt-1">
                {isRunning ? 'Concentration en cours...' : 'En pause'}
              </span>
            </div>
          </div>

          {/* Control Buttons */}
          <div className="flex items-center gap-3 mt-6">
            <button
              onClick={handleToggleTimer}
              className="flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-sm shadow-xs transition-all cursor-pointer bg-[#1E2538] hover:bg-[#2C3652] text-white"
            >
              {isRunning ? (
                <>
                  <Pause className="w-4 h-4 fill-current" />
                  <span>Mettre en pause</span>
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 fill-current" />
                  <span>Démarrer la séance</span>
                </>
              )}
            </button>

            <button
              onClick={handleResetTimer}
              className="p-3 rounded-xl bg-[#F4F7F9] hover:bg-[#D9E8F4] text-[#1E2538] border border-[#B7C9D6] transition-colors cursor-pointer"
              title="Réinitialiser"
            >
              <RotateCcw className="w-4 h-4" />
            </button>

            {elapsedSeconds > 60 && (
              <button
                onClick={() => handleCompleteSession()}
                className="flex items-center gap-1.5 px-4 py-3 rounded-xl bg-[#D9E8F4] hover:bg-[#C5D9E9] text-[#1E2538] border border-[#B7C9D6] font-semibold text-xs shadow-xs transition-all cursor-pointer"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Terminer & Enregistrer</span>
              </button>
            )}
          </div>

        </div>

        {/* Right: Session Context & Android Sandbox Notice */}
        <div className="lg:col-span-5 space-y-4">
          
          {/* Target Binding Form */}
          <div className="p-5 rounded-xl bg-white border border-[#B7C9D6] shadow-xs space-y-3.5">
            <h3 className="text-sm font-bold text-[#1E2538] flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-[#1E2538]" />
              <span>Sur quoi travaillez-vous ?</span>
            </h3>

            {/* Subject */}
            <div>
              <label className="block text-xs font-semibold text-[#1E2538] mb-1">
                Matière
              </label>
              <div className="grid grid-cols-4 gap-1.5">
                {(['c', 'cpp', 'python', 'sql'] as SubjectId[]).map((subId) => (
                  <button
                    key={subId}
                    type="button"
                    onClick={() => {
                      setSelectedSubject(subId);
                      setSelectedModuleId('');
                      setSelectedExerciseId('');
                    }}
                    className={`py-1.5 text-xs font-mono font-bold rounded-lg border transition-all cursor-pointer ${
                      selectedSubject === subId
                        ? 'bg-[#1E2538] text-white border-[#1E2538]'
                        : 'bg-[#F4F7F9] border-[#B7C9D6] text-[#1E2538] hover:bg-[#D9E8F4]'
                    }`}
                  >
                    {SUBJECTS[subId].shortName}
                  </button>
                ))}
              </div>
            </div>

            {/* Module */}
            <div>
              <label className="block text-xs font-semibold text-[#1E2538] mb-1">
                Module associé (Facultatif)
              </label>
              <select
                value={selectedModuleId}
                onChange={(e) => {
                  setSelectedModuleId(e.target.value);
                  setSelectedExerciseId('');
                }}
                className="w-full px-2.5 py-1.5 bg-[#F4F7F9] border border-[#B7C9D6] rounded-xl text-xs text-[#1E2538] outline-none"
              >
                <option value="">-- Aucun module spécifique --</option>
                {availableModules.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.title}
                  </option>
                ))}
              </select>
            </div>

            {/* Exercise */}
            <div>
              <label className="block text-xs font-semibold text-[#1E2538] mb-1">
                Exercice lié (Facultatif)
              </label>
              <select
                value={selectedExerciseId}
                onChange={(e) => setSelectedExerciseId(e.target.value)}
                className="w-full px-2.5 py-1.5 bg-[#F4F7F9] border border-[#B7C9D6] rounded-xl text-xs text-[#1E2538] outline-none"
              >
                <option value="">-- Aucun exercice spécifique --</option>
                {availableExercises.map((ex) => (
                  <option key={ex.id} value={ex.id}>
                    {ex.title} ({ex.difficulty})
                  </option>
                ))}
              </select>
            </div>

            {/* Notes */}
            <div>
              <label className="block text-xs font-semibold text-[#1E2538] mb-1">
                Notes de session
              </label>
              <input
                type="text"
                placeholder="Ex: Résolution de l'exercice 3, débogage mémoire..."
                value={sessionNotes}
                onChange={(e) => setSessionNotes(e.target.value)}
                className="w-full px-3 py-1.5 bg-[#F4F7F9] border border-[#B7C9D6] rounded-xl text-xs text-[#1E2538] outline-none"
              />
            </div>
          </div>

          {/* Android Sandbox Architecture Transparency Notice */}
          <div className="p-4 rounded-xl bg-[#D9E8F4]/60 border border-[#B7C9D6] space-y-2">
            <div className="flex items-center gap-2 text-xs font-bold text-[#1E2538]">
              <Smartphone className="w-4 h-4 text-[#1E2538]" />
              <span>Architecture du blocage d'applications (Android)</span>
            </div>
            <p className="text-[11px] text-[#1E2538] leading-relaxed">
              Pour des raisons de sécurité sandbox et d'isolation des navigateurs Web, une application en ligne ne peut pas restreindre directement l'accès à vos applications Android (TikTok, Instagram, etc.).
            </p>
            <p className="text-[11px] text-[#1E2538] font-semibold leading-relaxed">
              Le véritable blocage strict au niveau du système sera assuré ultérieurement via le composant compagnon natif Android dédié.
            </p>
          </div>

        </div>

      </div>

      {/* Sessions History */}
      <div className="p-5 rounded-xl bg-white border border-[#B7C9D6] shadow-xs">
        <h3 className="font-bold text-[#1E2538] text-sm flex items-center gap-2 mb-3">
          <Clock className="w-4 h-4 text-[#1E2538]" />
          <span>Historique de mes séances de concentration</span>
        </h3>

        {sessions.length === 0 ? (
          <p className="text-xs text-[#9BA7B8] py-4 text-center">
            Aucune séance enregistrée pour le moment. Démarrez votre premier chronomètre ci-dessus !
          </p>
        ) : (
          <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
            {sessions.map((s) => {
              const subMeta = SUBJECTS[s.subject];
              const dateStr = s.completedAt
                ? new Date(s.completedAt).toLocaleString('fr-FR', {
                    day: 'numeric',
                    month: 'short',
                    hour: '2-digit',
                    minute: '2-digit',
                  })
                : '';

              return (
                <div
                  key={s.id}
                  className="p-3 rounded-xl bg-[#F4F7F9] border border-[#B7C9D6] flex items-center justify-between text-xs"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-[10px] font-mono font-bold px-1.5 py-0.2 rounded bg-[#D9E8F4] text-[#1E2538] border border-[#B7C9D6]">
                      {subMeta.shortName}
                    </span>
                    <div>
                      <span className="font-semibold text-[#1E2538]">
                        {s.durationMinutes} minutes effectuées
                      </span>
                      {s.notes && (
                        <span className="text-[#9BA7B8] text-[11px] block">{s.notes}</span>
                      )}
                    </div>
                  </div>

                  <span className="text-[11px] text-[#9BA7B8] font-mono">
                    {dateStr}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>

    </div>
  );
};
