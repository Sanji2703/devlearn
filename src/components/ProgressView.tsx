import React from 'react';
import {
  BarChart3,
  Layers,
  BookOpen,
  Clock,
  TrendingUp,
  Info
} from 'lucide-react';
import { useData } from '../context/DataContext';
import { SubjectId, SUBJECTS } from '../types';

export const ProgressView: React.FC = () => {
  const { modules, exercises, sessions } = useData();

  const subjectsList: SubjectId[] = ['c', 'cpp', 'python', 'sql'];

  // Global counts
  const totalModules = modules.length;
  const startedModules = modules.filter((m) => m.status === 'in_progress' || m.status === 'needs_review').length;
  const completedModules = modules.filter((m) => m.status === 'completed' || m.status === 'mastered').length;
  const masteredModules = modules.filter((m) => m.status === 'mastered').length;

  const totalExercises = exercises.length;
  const completedExercises = exercises.filter((e) => e.status === 'completed').length;
  const pendingExercises = totalExercises - completedExercises;

  const totalMinutesRecorded = sessions.reduce((acc, c) => acc + (c.durationMinutes || 0), 0);
  const totalHours = (totalMinutesRecorded / 60).toFixed(1);

  // Per-subject details
  const subjectAnalytics = subjectsList.map((subId) => {
    const subMeta = SUBJECTS[subId];
    const subModules = modules.filter((m) => m.subject === subId);
    const subExercises = exercises.filter((e) => e.subject === subId);
    const subSessions = sessions.filter((s) => s.subject === subId);

    const modStarted = subModules.filter((m) => m.status === 'in_progress' || m.status === 'needs_review').length;
    const modCompleted = subModules.filter((m) => m.status === 'completed' || m.status === 'mastered').length;
    const modMastered = subModules.filter((m) => m.status === 'mastered').length;

    const exCompleted = subExercises.filter((e) => e.status === 'completed').length;
    const timeSpent = subSessions.reduce((acc, c) => acc + (c.durationMinutes || 0), 0);

    const completionRate = subModules.length > 0
      ? Math.round((modCompleted / subModules.length) * 100)
      : 0;

    return {
      subId,
      meta: subMeta,
      totalModules: subModules.length,
      startedModules: modStarted,
      completedModules: modCompleted,
      masteredModules: modMastered,
      totalExercises: subExercises.length,
      completedExercises: exCompleted,
      pendingExercises: subExercises.length - exCompleted,
      timeSpentMinutes: timeSpent,
      completionRate,
    };
  });

  return (
    <div className="space-y-6 pb-12">
      
      {/* Top Banner */}
      <div className="p-5 sm:p-6 rounded-xl bg-white border border-[#B7C9D6] shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#D9E8F4] text-[#1E2538] border border-[#B7C9D6] text-xs font-semibold uppercase tracking-wider mb-2">
            <BarChart3 className="w-3.5 h-3.5" />
            <span>Suivi de progression</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-[#1E2538] tracking-tight">
            Statistiques & Avancement personnel
          </h1>
          <p className="text-xs sm:text-sm text-[#9BA7B8] mt-1">
            Tableau de bord synthétique de vos modules, exercices et temps d'étude.
          </p>
        </div>
      </div>

      {/* Honest Disclaimer Banner per Section 8 instructions */}
      <div className="p-4 rounded-xl bg-[#D9E8F4]/60 border border-[#B7C9D6] flex items-start gap-3">
        <Info className="w-4 h-4 text-[#1E2538] shrink-0 mt-0.5" />
        <p className="text-xs text-[#1E2538] leading-relaxed">
          <span className="font-bold">Avertissement de transparence : </span>
          Ces statistiques ne constituent en aucun cas une évaluation algorithmique ou un jugement externe de vos compétences : elles reflètent fidèlement et exclusivement les informations, statuts et séances que vous avez vous-même déclarés et enregistrés.
        </p>
      </div>

      {/* Global Highlights */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        
        <div className="p-4 rounded-xl bg-white border border-[#B7C9D6] shadow-xs">
          <div className="flex items-center justify-between text-[#9BA7B8] text-xs">
            <span>Modules créés</span>
            <Layers className="w-4 h-4 text-[#1E2538]" />
          </div>
          <div className="text-2xl font-bold font-mono text-[#1E2538] mt-2">
            {totalModules}
          </div>
          <span className="text-[11px] text-[#9BA7B8] mt-1 block">
            {completedModules} terminés ({masteredModules} maîtrisés ⭐)
          </span>
        </div>

        <div className="p-4 rounded-xl bg-white border border-[#B7C9D6] shadow-xs">
          <div className="flex items-center justify-between text-[#9BA7B8] text-xs">
            <span>Exercices déclarés</span>
            <BookOpen className="w-4 h-4 text-[#1E2538]" />
          </div>
          <div className="text-2xl font-bold font-mono text-[#1E2538] mt-2">
            {totalExercises}
          </div>
          <span className="text-[11px] text-[#9BA7B8] mt-1 block">
            {completedExercises} réussis / {pendingExercises} restants
          </span>
        </div>

        <div className="p-4 rounded-xl bg-white border border-[#B7C9D6] shadow-xs">
          <div className="flex items-center justify-between text-[#9BA7B8] text-xs">
            <span>Temps total enregistré</span>
            <Clock className="w-4 h-4 text-[#1E2538]" />
          </div>
          <div className="text-2xl font-bold font-mono text-[#1E2538] mt-2">
            {totalHours} h
          </div>
          <span className="text-[11px] text-[#9BA7B8] mt-1 block">
            {totalMinutesRecorded} minutes de concentration
          </span>
        </div>

        <div className="p-4 rounded-xl bg-white border border-[#B7C9D6] shadow-xs">
          <div className="flex items-center justify-between text-[#9BA7B8] text-xs">
            <span>Séances accomplies</span>
            <TrendingUp className="w-4 h-4 text-[#1E2538]" />
          </div>
          <div className="text-2xl font-bold font-mono text-[#1E2538] mt-2">
            {sessions.length}
          </div>
          <span className="text-[11px] text-[#9BA7B8] mt-1 block">
            Historique de focus enregistré
          </span>
        </div>

      </div>

      {/* Visual Distribution of Study Time (SVG Bar) */}
      <div className="p-5 rounded-xl bg-white border border-[#B7C9D6] shadow-xs">
        <h3 className="font-bold text-[#1E2538] text-sm mb-2">
          Répartition du temps de travail par technologie
        </h3>
        
        {totalMinutesRecorded === 0 ? (
          <p className="text-xs text-[#9BA7B8] py-2">
            Aucun temps encore enregistré dans le Mode Concentration.
          </p>
        ) : (
          <div>
            <div className="w-full h-3 rounded-full overflow-hidden flex bg-[#D9E8F4] my-3">
              {subjectAnalytics.map((item, idx) => {
                const percent = (item.timeSpentMinutes / totalMinutesRecorded) * 100;
                if (percent === 0) return null;
                // Palette tones for segments
                const segColors = ['#1E2538', '#9BA7B8', '#B7C9D6', '#C5D9E9'];
                return (
                  <div
                    key={item.subId}
                    style={{ width: `${percent}%`, backgroundColor: segColors[idx % segColors.length] }}
                    title={`${item.meta.shortName} : ${item.timeSpentMinutes} min (${Math.round(percent)}%)`}
                    className="h-full transition-all"
                  />
                );
              })}
            </div>

            <div className="flex flex-wrap items-center gap-4 text-xs mt-2">
              {subjectAnalytics.map((item, idx) => {
                const segColors = ['#1E2538', '#9BA7B8', '#B7C9D6', '#C5D9E9'];
                return (
                  <div key={item.subId} className="flex items-center gap-1.5">
                    <div
                      className="w-2.5 h-2.5 rounded-full"
                      style={{ backgroundColor: segColors[idx % segColors.length] }}
                    />
                    <span className="font-semibold text-[#1E2538]">{item.meta.shortName}:</span>
                    <span className="text-[#9BA7B8] font-mono">{item.timeSpentMinutes} min</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Per-Technology Detailed Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {subjectAnalytics.map((item) => {
          const meta = item.meta;
          return (
            <div
              key={item.subId}
              className="p-5 rounded-xl bg-white border border-[#B7C9D6] shadow-xs flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between pb-3 border-b border-[#B7C9D6]">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-[#D9E8F4] text-[#1E2538] border border-[#B7C9D6]">
                      {meta.shortName}
                    </span>
                    <h3 className="font-bold text-[#1E2538] text-base">{meta.name}</h3>
                  </div>
                  <span className="text-sm font-bold text-[#1E2538] font-mono">
                    {item.completionRate}%
                  </span>
                </div>

                {/* Progress bar */}
                <div className="w-full bg-[#D9E8F4] rounded-full h-2 my-4 overflow-hidden">
                  <div
                    className="h-2 rounded-full transition-all duration-500 bg-[#1E2538]"
                    style={{
                      width: `${item.completionRate}%`,
                    }}
                  />
                </div>

                {/* Metrics Breakdown */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
                  <div className="p-2.5 rounded-xl bg-[#F4F7F9] border border-[#B7C9D6]">
                    <span className="text-[#9BA7B8] text-[11px] block">Modules créés</span>
                    <span className="font-bold text-[#1E2538] font-mono text-sm mt-0.5 block">
                      {item.totalModules}
                    </span>
                  </div>

                  <div className="p-2.5 rounded-xl bg-[#F4F7F9] border border-[#B7C9D6]">
                    <span className="text-[#9BA7B8] text-[11px] block">En cours / À revoir</span>
                    <span className="font-bold text-[#1E2538] font-mono text-sm mt-0.5 block">
                      {item.startedModules}
                    </span>
                  </div>

                  <div className="p-2.5 rounded-xl bg-[#F4F7F9] border border-[#B7C9D6]">
                    <span className="text-[#9BA7B8] text-[11px] block">Maîtrisés ⭐</span>
                    <span className="font-bold text-[#1E2538] font-mono text-sm mt-0.5 block">
                      {item.masteredModules}
                    </span>
                  </div>

                  <div className="p-2.5 rounded-xl bg-[#F4F7F9] border border-[#B7C9D6]">
                    <span className="text-[#9BA7B8] text-[11px] block">Exercices faits</span>
                    <span className="font-bold text-[#1E2538] font-mono text-sm mt-0.5 block">
                      {item.completedExercises} / {item.totalExercises}
                    </span>
                  </div>

                  <div className="p-2.5 rounded-xl bg-[#F4F7F9] border border-[#B7C9D6]">
                    <span className="text-[#9BA7B8] text-[11px] block">Exercices en attente</span>
                    <span className="font-bold text-[#1E2538] font-mono text-sm mt-0.5 block">
                      {item.pendingExercises}
                    </span>
                  </div>

                  <div className="p-2.5 rounded-xl bg-[#F4F7F9] border border-[#B7C9D6]">
                    <span className="text-[#9BA7B8] text-[11px] block">Temps enregistré</span>
                    <span className="font-bold text-[#1E2538] font-mono text-sm mt-0.5 block">
                      {item.timeSpentMinutes} min
                    </span>
                  </div>
                </div>

              </div>

              <div className="mt-4 pt-3 border-t border-[#B7C9D6] text-[11px] text-[#9BA7B8] flex items-center justify-between">
                <span>Modules terminés déclarés : {item.completedModules}</span>
                <span className="text-[#1E2538] font-semibold">100% déclaré par vous</span>
              </div>

            </div>
          );
        })}
      </div>

    </div>
  );
};
