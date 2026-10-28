import React, { useState } from 'react';
import {
  CheckSquare,
  Plus,
  Play,
  Filter,
  Trash2,
  Edit2,
  ExternalLink,
  FolderOpen,
  X,
  Clock
} from 'lucide-react';
import { useData } from '../context/DataContext';
import {
  Exercise,
  SubjectId,
  SUBJECTS,
  ExerciseStatus,
  EXERCISE_STATUS_LABELS,
  ExerciseDifficulty,
  DIFFICULTY_LABELS
} from '../types';
import { DriveManagerModal } from './DriveManagerModal';

interface ExercisesViewProps {
  initialSubject?: SubjectId;
  initialModuleId?: string;
  onStartFocusSession: (subject: SubjectId, moduleId: string, exerciseId: string) => void;
}

export const ExercisesView: React.FC<ExercisesViewProps> = ({
  initialSubject,
  initialModuleId,
  onStartFocusSession,
}) => {
  const {
    exercises,
    modules,
    saveExercise,
    deleteExercise,
    updateExerciseStatus,
  } = useData();

  // Filters
  const [filterSubject, setFilterSubject] = useState<SubjectId | 'all'>(initialSubject || 'all');
  const [filterModuleId, setFilterModuleId] = useState<string>(initialModuleId || 'all');
  const [filterStatus, setFilterStatus] = useState<ExerciseStatus | 'all'>('all');
  const [filterDifficulty, setFilterDifficulty] = useState<ExerciseDifficulty | 'all'>('all');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingExercise, setEditingExercise] = useState<Partial<Exercise> | null>(null);
  const [formSubject, setFormSubject] = useState<SubjectId>(initialSubject || 'c');
  const [formModuleId, setFormModuleId] = useState<string>(initialModuleId || '');
  const [formTitle, setFormTitle] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formStatement, setFormStatement] = useState('');
  const [formLink, setFormLink] = useState('');
  const [formDriveFileId, setFormDriveFileId] = useState('');
  const [formDriveFileName, setFormDriveFileName] = useState('');
  const [formSolutionNotes, setFormSolutionNotes] = useState('');
  const [formDifficulty, setFormDifficulty] = useState<ExerciseDifficulty>('facile');
  const [formEstimatedMinutes, setFormEstimatedMinutes] = useState(30);
  const [formStatus, setFormStatus] = useState<ExerciseStatus>('not_started');

  // Drive Picker Modal
  const [isDriveModalOpen, setIsDriveModalOpen] = useState(false);

  // Available modules for current form subject
  const formAvailableModules = modules.filter((m) => m.subject === formSubject);

  const openAddModal = () => {
    setEditingExercise(null);
    setFormSubject(filterSubject !== 'all' ? filterSubject : 'c');
    const firstMod = modules.find((m) => m.subject === (filterSubject !== 'all' ? filterSubject : 'c'));
    setFormModuleId(firstMod ? firstMod.id : '');
    setFormTitle('');
    setFormDescription('');
    setFormStatement('');
    setFormLink('');
    setFormDriveFileId('');
    setFormDriveFileName('');
    setFormSolutionNotes('');
    setFormDifficulty('facile');
    setFormEstimatedMinutes(30);
    setFormStatus('not_started');
    setIsModalOpen(true);
  };

  const openEditModal = (ex: Exercise) => {
    setEditingExercise(ex);
    setFormSubject(ex.subject);
    setFormModuleId(ex.moduleId);
    setFormTitle(ex.title);
    setFormDescription(ex.description || '');
    setFormStatement(ex.statement || '');
    setFormLink(ex.link || '');
    setFormDriveFileId(ex.driveFileId || '');
    setFormDriveFileName(ex.driveFileName || '');
    setFormSolutionNotes(ex.solutionNotes || '');
    setFormDifficulty(ex.difficulty);
    setFormEstimatedMinutes(ex.estimatedMinutes);
    setFormStatus(ex.status);
    setIsModalOpen(true);
  };

  const handleSaveExercise = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim()) return;
    if (!formModuleId) {
      alert('Veuillez d’abord créer au moins un module pour cette matière avant d’ajouter un exercice.');
      return;
    }

    await saveExercise({
      id: editingExercise?.id,
      subject: formSubject,
      moduleId: formModuleId,
      title: formTitle.trim(),
      description: formDescription.trim(),
      statement: formStatement.trim(),
      link: formLink.trim(),
      driveFileId: formDriveFileId,
      driveFileName: formDriveFileName,
      solutionNotes: formSolutionNotes.trim(),
      difficulty: formDifficulty,
      estimatedMinutes: Number(formEstimatedMinutes) || 30,
      status: formStatus,
    });

    setIsModalOpen(false);
  };

  // Filtered exercises list
  const filteredList = exercises.filter((ex) => {
    if (filterSubject !== 'all' && ex.subject !== filterSubject) return false;
    if (filterModuleId !== 'all' && ex.moduleId !== filterModuleId) return false;
    if (filterStatus !== 'all' && ex.status !== filterStatus) return false;
    if (filterDifficulty !== 'all' && ex.difficulty !== filterDifficulty) return false;
    return true;
  });

  return (
    <div className="space-y-6 pb-12">
      
      {/* Top Header */}
      <div className="p-5 sm:p-6 rounded-xl bg-white border border-[#B7C9D6] shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#D9E8F4] text-[#1E2538] border border-[#B7C9D6] text-xs font-semibold uppercase tracking-wider mb-2">
            <CheckSquare className="w-3.5 h-3.5" />
            <span>Gestion de mes exercices</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-[#1E2538] tracking-tight">
            Banque d'exercices personnels
          </h1>
          <p className="text-xs sm:text-sm text-[#9BA7B8] mt-1">
            Vous définissez vos propres énoncés, durées estimées et vos statuts de réussite.
          </p>
        </div>

        <button
          onClick={openAddModal}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#1E2538] hover:bg-[#2C3652] text-white font-medium text-xs sm:text-sm shadow-xs transition-all shrink-0 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Ajouter un exercice</span>
        </button>
      </div>

      {/* Filter Bar */}
      <div className="p-4 rounded-xl bg-white border border-[#B7C9D6] shadow-xs flex flex-wrap items-center gap-3 text-xs">
        <div className="flex items-center gap-1.5 text-[#1E2538] font-semibold">
          <Filter className="w-3.5 h-3.5" />
          <span>Filtrer par :</span>
        </div>

        {/* Subject Filter */}
        <select
          value={filterSubject}
          onChange={(e) => {
            setFilterSubject(e.target.value as any);
            setFilterModuleId('all');
          }}
          className="px-2.5 py-1.5 bg-[#F4F7F9] border border-[#B7C9D6] rounded-lg text-[#1E2538] outline-none"
        >
          <option value="all">Toutes les matières</option>
          <option value="c">C</option>
          <option value="cpp">C++</option>
          <option value="python">Python</option>
          <option value="sql">SQL</option>
        </select>

        {/* Module Filter (if subject selected) */}
        {filterSubject !== 'all' && (
          <select
            value={filterModuleId}
            onChange={(e) => setFilterModuleId(e.target.value)}
            className="px-2.5 py-1.5 bg-[#F4F7F9] border border-[#B7C9D6] rounded-lg text-[#1E2538] outline-none max-w-[200px]"
          >
            <option value="all">Tous les modules</option>
            {modules
              .filter((m) => m.subject === filterSubject)
              .map((m) => (
                <option key={m.id} value={m.id}>
                  {m.title}
                </option>
              ))}
          </select>
        )}

        {/* Status Filter */}
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value as any)}
          className="px-2.5 py-1.5 bg-[#F4F7F9] border border-[#B7C9D6] rounded-lg text-[#1E2538] outline-none"
        >
          <option value="all">Tous les statuts</option>
          <option value="not_started">Non commencé</option>
          <option value="in_progress">En cours</option>
          <option value="completed">Terminé</option>
          <option value="needs_review">À revoir</option>
        </select>

        {/* Difficulty Filter */}
        <select
          value={filterDifficulty}
          onChange={(e) => setFilterDifficulty(e.target.value as any)}
          className="px-2.5 py-1.5 bg-[#F4F7F9] border border-[#B7C9D6] rounded-lg text-[#1E2538] outline-none"
        >
          <option value="all">Toutes difficultés</option>
          <option value="facile">Facile</option>
          <option value="moyen">Moyen</option>
          <option value="difficile">Difficile</option>
        </select>

        <span className="text-[#9BA7B8] ml-auto font-medium">
          {filteredList.length} exercice{filteredList.length > 1 ? 's' : ''}
        </span>
      </div>

      {/* Exercises Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredList.length === 0 ? (
          <div className="col-span-full text-center py-12 rounded-xl bg-white border border-[#B7C9D6] space-y-3 shadow-xs">
            <CheckSquare className="w-10 h-10 text-[#9BA7B8] mx-auto" />
            <h3 className="text-sm font-semibold text-[#1E2538]">Aucun exercice trouvé</h3>
            <p className="text-xs text-[#9BA7B8] max-w-sm mx-auto">
              Ajoutez vos exercices de programmation avec vos énoncés ou fichiers de travail.
            </p>
            <button
              onClick={openAddModal}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#1E2538] hover:bg-[#2C3652] text-white font-medium text-xs shadow-xs transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Créer un exercice</span>
            </button>
          </div>
        ) : (
          filteredList.map((ex) => {
            const subMeta = SUBJECTS[ex.subject];
            const mod = modules.find((m) => m.id === ex.moduleId);
            const diffConfig = DIFFICULTY_LABELS[ex.difficulty];

            return (
              <div
                key={ex.id}
                className="p-4 rounded-xl bg-white border border-[#B7C9D6] hover:border-[#9BA7B8] transition-all shadow-xs flex flex-col justify-between"
              >
                <div>
                  
                  {/* Card Header: Subject badge & Difficulty */}
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] font-mono font-bold px-1.5 py-0.2 rounded bg-[#D9E8F4] text-[#1E2538] border border-[#B7C9D6]">
                        {subMeta.shortName}
                      </span>
                      {mod && (
                        <span className="text-[11px] text-[#9BA7B8] truncate max-w-[150px]">
                          {mod.title}
                        </span>
                      )}
                    </div>
                    <span className={`text-[10px] px-2 py-0.5 rounded border ${diffConfig.color}`}>
                      {diffConfig.label}
                    </span>
                  </div>

                  {/* Title & Description */}
                  <h3 className="font-bold text-[#1E2538] text-sm leading-snug">
                    {ex.title}
                  </h3>
                  {ex.description && (
                    <p className="text-xs text-[#9BA7B8] mt-1 line-clamp-2">
                      {ex.description}
                    </p>
                  )}

                  {/* Statement preview */}
                  {ex.statement && (
                    <div className="mt-2.5 p-2.5 rounded-lg bg-[#F4F7F9] border border-[#B7C9D6] text-[11px] text-[#1E2538] line-clamp-2 font-mono">
                      {ex.statement}
                    </div>
                  )}

                  {/* Resources / Links attached */}
                  <div className="flex flex-wrap items-center gap-2 mt-3 text-[11px]">
                    <div className="flex items-center gap-1 text-[#1E2538]">
                      <Clock className="w-3.5 h-3.5 text-[#1E2538]" />
                      <span>~{ex.estimatedMinutes} min</span>
                    </div>

                    {ex.driveFileName && (
                      <div className="flex items-center gap-1 px-2 py-0.5 rounded bg-[#D9E8F4] text-[#1E2538] border border-[#B7C9D6]">
                        <FolderOpen className="w-3 h-3 text-[#1E2538]" />
                        <span className="truncate max-w-[100px]">{ex.driveFileName}</span>
                      </div>
                    )}

                    {ex.link && (
                      <a
                        href={ex.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 text-[#1E2538] hover:underline font-semibold"
                      >
                        <ExternalLink className="w-3 h-3" />
                        <span>Lien</span>
                      </a>
                    )}
                  </div>

                </div>

                {/* Footer Controls: Status change, Focus button, Edit/Delete */}
                <div className="mt-4 pt-3 border-t border-[#B7C9D6] flex items-center justify-between gap-2">
                  
                  {/* Status Dropdown */}
                  <select
                    value={ex.status}
                    onChange={(e) => updateExerciseStatus(ex.id, e.target.value as ExerciseStatus)}
                    className="px-2 py-1 bg-[#F4F7F9] border border-[#B7C9D6] rounded-lg text-[11px] text-[#1E2538] outline-none cursor-pointer"
                  >
                    <option value="not_started">Non commencé</option>
                    <option value="in_progress">En cours</option>
                    <option value="completed">Terminé</option>
                    <option value="needs_review">À revoir</option>
                  </select>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => onStartFocusSession(ex.subject, ex.moduleId, ex.id)}
                      className="p-1.5 rounded-lg bg-[#1E2538] hover:bg-[#2C3652] text-white transition-all cursor-pointer"
                      title="Lancer le chronomètre de concentration sur cet exercice"
                    >
                      <Play className="w-3.5 h-3.5 fill-current" />
                    </button>
                    <button
                      onClick={() => openEditModal(ex)}
                      className="p-1.5 text-[#9BA7B8] hover:text-[#1E2538] hover:bg-[#D9E8F4] rounded-lg transition-colors cursor-pointer"
                      title="Modifier"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => {
                        if (confirm(`Supprimer l'exercice "${ex.title}" ?`)) {
                          deleteExercise(ex.id);
                        }
                      }}
                      className="p-1.5 text-[#9BA7B8] hover:text-rose-600 hover:bg-[#D9E8F4] rounded-lg transition-colors cursor-pointer"
                      title="Supprimer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Add / Edit Exercise Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#1E2538]/60 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white border border-[#B7C9D6] rounded-xl max-w-lg w-full p-6 shadow-xl relative my-8 text-[#1E2538]">
            <div className="flex items-center justify-between pb-3 border-b border-[#B7C9D6]">
              <h3 className="font-bold text-[#1E2538] text-base">
                {editingExercise ? 'Modifier l’exercice' : 'Ajouter un exercice personnel'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 text-[#9BA7B8] hover:text-[#1E2538]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveExercise} className="mt-4 space-y-3.5">
              
              {/* Subject & Module */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-xs font-semibold text-[#1E2538] mb-1">
                    Matière *
                  </label>
                  <select
                    value={formSubject}
                    onChange={(e) => {
                      const s = e.target.value as SubjectId;
                      setFormSubject(s);
                      const available = modules.filter((m) => m.subject === s);
                      setFormModuleId(available.length > 0 ? available[0].id : '');
                    }}
                    className="w-full px-2.5 py-2 bg-[#F4F7F9] border border-[#B7C9D6] rounded-xl text-xs text-[#1E2538] outline-none"
                  >
                    <option value="c">Langage C</option>
                    <option value="cpp">C++</option>
                    <option value="python">Python</option>
                    <option value="sql">SQL</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#1E2538] mb-1">
                    Module rattaché *
                  </label>
                  <select
                    required
                    value={formModuleId}
                    onChange={(e) => setFormModuleId(e.target.value)}
                    className="w-full px-2.5 py-2 bg-[#F4F7F9] border border-[#B7C9D6] rounded-xl text-xs text-[#1E2538] outline-none"
                  >
                    {formAvailableModules.length === 0 ? (
                      <option value="">-- Aucun module disponible --</option>
                    ) : (
                      formAvailableModules.map((m) => (
                        <option key={m.id} value={m.id}>
                          {m.title}
                        </option>
                      ))
                    )}
                  </select>
                </div>
              </div>

              {/* Title */}
              <div>
                <label className="block text-xs font-semibold text-[#1E2538] mb-1">
                  Titre de l'exercice *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Inverser une chaîne de caractères in-place, Jointure complexe..."
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  className="w-full px-3 py-2 bg-[#F4F7F9] border border-[#B7C9D6] focus:border-[#1E2538] rounded-xl text-xs text-[#1E2538] outline-none"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-semibold text-[#1E2538] mb-1">
                  Description brève
                </label>
                <input
                  type="text"
                  placeholder="Ex: Manipuler des pointeurs doubles, optimiser les I/O..."
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  className="w-full px-3 py-2 bg-[#F4F7F9] border border-[#B7C9D6] rounded-xl text-xs text-[#1E2538] outline-none"
                />
              </div>

              {/* Statement (Énoncé) */}
              <div>
                <label className="block text-xs font-semibold text-[#1E2538] mb-1">
                  Énoncé ou consignes de l'exercice
                </label>
                <textarea
                  rows={3}
                  placeholder="Écrivez ici les consignes, signatures de fonctions ou cas de test..."
                  value={formStatement}
                  onChange={(e) => setFormStatement(e.target.value)}
                  className="w-full px-3 py-2 bg-[#F4F7F9] border border-[#B7C9D6] rounded-xl text-xs text-[#1E2538] outline-none resize-none font-mono"
                />
              </div>

              {/* Difficulty & Estimated Minutes */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-xs font-semibold text-[#1E2538] mb-1">
                    Difficulté déclarée
                  </label>
                  <select
                    value={formDifficulty}
                    onChange={(e) => setFormDifficulty(e.target.value as ExerciseDifficulty)}
                    className="w-full px-2.5 py-2 bg-[#F4F7F9] border border-[#B7C9D6] rounded-xl text-xs text-[#1E2538] outline-none"
                  >
                    <option value="facile">Facile</option>
                    <option value="moyen">Moyen</option>
                    <option value="difficile">Difficile</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#1E2538] mb-1">
                    Durée estimée (minutes)
                  </label>
                  <input
                    type="number"
                    min="5"
                    max="300"
                    step="5"
                    value={formEstimatedMinutes}
                    onChange={(e) => setFormEstimatedMinutes(Number(e.target.value))}
                    className="w-full px-2.5 py-2 bg-[#F4F7F9] border border-[#B7C9D6] rounded-xl text-xs text-[#1E2538] outline-none"
                  />
                </div>
              </div>

              {/* Status */}
              <div>
                <label className="block text-xs font-semibold text-[#1E2538] mb-1">
                  Statut de l'exercice (vous décidez vous-même)
                </label>
                <select
                  value={formStatus}
                  onChange={(e) => setFormStatus(e.target.value as ExerciseStatus)}
                  className="w-full px-2.5 py-2 bg-[#F4F7F9] border border-[#B7C9D6] rounded-xl text-xs text-[#1E2538] outline-none"
                >
                  <option value="not_started">Non commencé</option>
                  <option value="in_progress">En cours</option>
                  <option value="completed">Terminé</option>
                  <option value="needs_review">À revoir</option>
                </select>
              </div>

              {/* Drive file attachment & Link */}
              <div className="p-3.5 rounded-xl bg-[#D9E8F4]/50 border border-[#B7C9D6] space-y-2">
                <span className="text-xs font-bold text-[#1E2538] block">
                  Support ou lien d'énoncé (Facultatif)
                </span>
                
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsDriveModalOpen(true)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#1E2538] text-white text-xs font-semibold"
                  >
                    <FolderOpen className="w-3.5 h-3.5" />
                    <span>{formDriveFileName ? `Fichier : ${formDriveFileName}` : 'Associer un fichier Google Drive'}</span>
                  </button>
                  {formDriveFileName && (
                    <button
                      type="button"
                      onClick={() => {
                        setFormDriveFileId('');
                        setFormDriveFileName('');
                      }}
                      className="text-xs text-rose-600 p-1"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                <input
                  type="url"
                  placeholder="Lien externe (ex: GitHub, LeetCode, TP en ligne...)"
                  value={formLink}
                  onChange={(e) => setFormLink(e.target.value)}
                  className="w-full px-2.5 py-1.5 bg-white border border-[#B7C9D6] rounded-lg text-xs text-[#1E2538] outline-none"
                />
              </div>

              {/* Solution / Personal notes */}
              <div>
                <label className="block text-xs font-semibold text-[#1E2538] mb-1">
                  Notes personnelles de solution / Fichier solution
                </label>
                <textarea
                  rows={2}
                  placeholder="Notes personnelles de solution ou lien vers votre code..."
                  value={formSolutionNotes}
                  onChange={(e) => setFormSolutionNotes(e.target.value)}
                  className="w-full px-3 py-2 bg-[#F4F7F9] border border-[#B7C9D6] rounded-xl text-xs text-[#1E2538] outline-none resize-none font-mono"
                />
              </div>

              {/* Submit buttons */}
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-3.5 py-2 text-xs text-[#9BA7B8] hover:text-[#1E2538]"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-[#1E2538] hover:bg-[#2C3652] text-white font-medium text-xs shadow-xs"
                >
                  Enregistrer l'exercice
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* Google Drive Selector */}
      <DriveManagerModal
        isOpen={isDriveModalOpen}
        onClose={() => setIsDriveModalOpen(false)}
        onSelectFile={(f) => {
          setFormDriveFileId(f.id);
          setFormDriveFileName(f.name);
          setIsDriveModalOpen(false);
        }}
      />

    </div>
  );
};
