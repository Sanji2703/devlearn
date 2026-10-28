import React, { useState } from 'react';
import {
  Layers,
  Plus,
  Trash2,
  Edit2,
  FolderOpen,
  Link as LinkIcon,
  ExternalLink,
  ChevronUp,
  ChevronDown,
  BookOpen,
  X
} from 'lucide-react';
import { useData } from '../context/DataContext';
import {
  SUBJECTS,
  SubjectId,
  LearningModule,
  ModuleStatus,
  MODULE_STATUS_LABELS,
  ResourceItem
} from '../types';
import { DriveManagerModal } from './DriveManagerModal';

interface SubjectsViewProps {
  selectedSubject: SubjectId;
  onSelectSubject: (sub: SubjectId) => void;
  onNavigateToExercisesForModule: (subject: SubjectId, moduleId: string) => void;
}

export const SubjectsView: React.FC<SubjectsViewProps> = ({
  selectedSubject,
  onSelectSubject,
  onNavigateToExercisesForModule,
}) => {
  const {
    modules,
    exercises,
    saveModule,
    deleteModule,
    updateModuleStatus,
  } = useData();

  const currentMeta = SUBJECTS[selectedSubject];
  const subjectModules = modules
    .filter((m) => m.subject === selectedSubject)
    .sort((a, b) => (a.order || 0) - (b.order || 0));

  // Edit / Add Module Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingModule, setEditingModule] = useState<Partial<LearningModule> | null>(null);
  const [moduleTitle, setModuleTitle] = useState('');
  const [moduleObjective, setModuleObjective] = useState('');
  const [moduleStatus, setModuleStatus] = useState<ModuleStatus>('not_started');
  const [moduleNotes, setModuleNotes] = useState('');
  const [moduleResources, setModuleResources] = useState<ResourceItem[]>([]);

  // Add Resource state
  const [showAddResource, setShowAddResource] = useState(false);
  const [resTitle, setResTitle] = useState('');
  const [resType, setResType] = useState<'link' | 'drive_file' | 'note' | 'doc'>('link');
  const [resUrl, setResUrl] = useState('');

  // Google Drive Modal
  const [isDriveModalOpen, setIsDriveModalOpen] = useState(false);

  // Expand module details
  const [expandedModuleId, setExpandedModuleId] = useState<string | null>(null);

  const openAddModal = () => {
    setEditingModule(null);
    setModuleTitle('');
    setModuleObjective('');
    setModuleStatus('not_started');
    setModuleNotes('');
    setModuleResources([]);
    setIsModalOpen(true);
  };

  const openEditModal = (mod: LearningModule) => {
    setEditingModule(mod);
    setModuleTitle(mod.title);
    setModuleObjective(mod.objective || '');
    setModuleStatus(mod.status);
    setModuleNotes(mod.notes || '');
    setModuleResources(mod.resources || []);
    setIsModalOpen(true);
  };

  const handleSaveModule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!moduleTitle.trim()) return;

    await saveModule({
      id: editingModule?.id,
      subject: selectedSubject,
      title: moduleTitle.trim(),
      objective: moduleObjective.trim(),
      status: moduleStatus,
      notes: moduleNotes,
      resources: moduleResources,
      order: editingModule?.order ?? (subjectModules.length + 1),
    });

    setIsModalOpen(false);
  };

  const handleMoveOrder = async (mod: LearningModule, direction: 'up' | 'down') => {
    const currentIndex = subjectModules.findIndex((m) => m.id === mod.id);
    const targetIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
    if (targetIndex < 0 || targetIndex >= subjectModules.length) return;

    const otherMod = subjectModules[targetIndex];
    await saveModule({ ...mod, order: otherMod.order });
    await saveModule({ ...otherMod, order: mod.order });
  };

  const handleAddResourceItem = () => {
    if (!resTitle.trim()) return;
    const newRes: ResourceItem = {
      id: `res_${Date.now()}`,
      title: resTitle.trim(),
      type: resType,
      url: resUrl.trim(),
    };
    setModuleResources((prev) => [...prev, newRes]);
    setResTitle('');
    setResUrl('');
    setShowAddResource(false);
  };

  const handleRemoveResource = (id: string) => {
    setModuleResources((prev) => prev.filter((r) => r.id !== id));
  };

  const handleDriveFileAttached = (file: { id: string; name: string; url?: string }) => {
    const newRes: ResourceItem = {
      id: `res_${Date.now()}`,
      title: file.name,
      type: 'drive_file',
      driveFileId: file.id,
      driveFileName: file.name,
      url: file.url,
    };
    setModuleResources((prev) => [...prev, newRes]);
    setIsDriveModalOpen(false);
  };

  return (
    <div className="space-y-6 pb-12">
      
      {/* Subject Tabs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 bg-[#D9E8F4]/60 p-1.5 rounded-xl border border-[#B7C9D6]">
        {(['c', 'cpp', 'python', 'sql'] as SubjectId[]).map((subId) => {
          const meta = SUBJECTS[subId];
          const isSelected = selectedSubject === subId;
          const subCount = modules.filter((m) => m.subject === subId).length;

          return (
            <button
              key={subId}
              onClick={() => onSelectSubject(subId)}
              className={`p-3 rounded-lg text-left transition-all cursor-pointer flex flex-col justify-between ${
                isSelected
                  ? 'bg-white border border-[#B7C9D6] shadow-xs'
                  : 'hover:bg-[#C5D9E9] text-[#1E2538]'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-[#D9E8F4] text-[#1E2538] border border-[#B7C9D6]">
                  {meta.shortName}
                </span>
                <span className="text-xs text-[#9BA7B8] font-mono">
                  {subCount} mod.
                </span>
              </div>
              <div className="mt-2 font-bold text-sm text-[#1E2538]">{meta.name}</div>
            </button>
          );
        })}
      </div>

      {/* Active Subject Header */}
      <div className="p-5 rounded-xl bg-white border border-[#B7C9D6] shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-[#D9E8F4] text-[#1E2538] border border-[#B7C9D6]">
              {currentMeta.shortName}
            </span>
            <h1 className="text-xl font-bold text-[#1E2538]">{currentMeta.name}</h1>
          </div>
          <p className="text-xs sm:text-sm text-[#9BA7B8] mt-1">
            {currentMeta.tagline}
          </p>
        </div>

        <button
          onClick={openAddModal}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#1E2538] hover:bg-[#2C3652] text-white font-medium text-xs sm:text-sm shadow-xs transition-all shrink-0 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Créer un module {currentMeta.shortName}</span>
        </button>
      </div>

      {/* Modules List */}
      <div className="space-y-3.5">
        {subjectModules.length === 0 ? (
          <div className="text-center py-12 px-4 rounded-xl bg-white border border-[#B7C9D6] space-y-3 shadow-xs">
            <Layers className="w-10 h-10 text-[#9BA7B8] mx-auto" />
            <h3 className="text-sm font-semibold text-[#1E2538]">
              Aucun module créé pour {currentMeta.name}
            </h3>
            <p className="text-xs text-[#9BA7B8] max-w-md mx-auto">
              Vous êtes entièrement libre d'organiser vos modules selon votre cursus ou vos objectifs.
            </p>
            <button
              onClick={openAddModal}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#1E2538] hover:bg-[#2C3652] text-white font-medium text-xs shadow-xs transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Créer mon premier module</span>
            </button>
          </div>
        ) : (
          subjectModules.map((mod, index) => {
            const isExpanded = expandedModuleId === mod.id;
            const statusConfig = MODULE_STATUS_LABELS[mod.status];
            const attachedExercises = exercises.filter((e) => e.moduleId === mod.id);
            const completedExercises = attachedExercises.filter((e) => e.status === 'completed');

            return (
              <div
                key={mod.id}
                className="rounded-xl bg-white border border-[#B7C9D6] overflow-hidden shadow-xs transition-all"
              >
                {/* Module Bar */}
                <div className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  
                  {/* Left: Reorder buttons & Title */}
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="flex flex-col gap-0.5 text-[#9BA7B8] shrink-0">
                      <button
                        onClick={() => handleMoveOrder(mod, 'up')}
                        disabled={index === 0}
                        className="hover:text-[#1E2538] disabled:opacity-20 cursor-pointer p-0.5"
                        title="Monter"
                      >
                        <ChevronUp className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleMoveOrder(mod, 'down')}
                        disabled={index === subjectModules.length - 1}
                        className="hover:text-[#1E2538] disabled:opacity-20 cursor-pointer p-0.5"
                        title="Descendre"
                      >
                        <ChevronDown className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-mono text-xs text-[#9BA7B8]">#{index + 1}</span>
                        <h3 className="font-bold text-[#1E2538] text-sm truncate">
                          {mod.title}
                        </h3>
                        <span className={`text-[11px] px-2 py-0.5 rounded-full ${statusConfig.color}`}>
                          {statusConfig.label}
                        </span>
                      </div>
                      {mod.objective && (
                        <p className="text-xs text-[#9BA7B8] mt-0.5 line-clamp-1">
                          🎯 {mod.objective}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Right: Status selector & Action buttons */}
                  <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                    
                    {/* Direct status switcher */}
                    <select
                      value={mod.status}
                      onChange={(e) => updateModuleStatus(mod.id, e.target.value as ModuleStatus)}
                      className="px-2.5 py-1 rounded-lg bg-[#F4F7F9] border border-[#B7C9D6] text-xs text-[#1E2538] outline-none cursor-pointer"
                    >
                      <option value="not_started">Non commencé</option>
                      <option value="in_progress">En cours</option>
                      <option value="completed">Terminé</option>
                      <option value="needs_review">À revoir</option>
                      <option value="mastered">Maîtrisé ⭐</option>
                    </select>

                    <button
                      onClick={() => setExpandedModuleId(isExpanded ? null : mod.id)}
                      className="px-3 py-1 rounded-lg bg-[#D9E8F4] hover:bg-[#C5D9E9] text-[#1E2538] text-xs font-semibold border border-[#B7C9D6] transition-colors cursor-pointer"
                    >
                      {isExpanded ? 'Réduire' : 'Détails & Supports'}
                    </button>

                    <button
                      onClick={() => openEditModal(mod)}
                      className="p-1.5 text-[#9BA7B8] hover:text-[#1E2538] hover:bg-[#D9E8F4] rounded-lg transition-colors cursor-pointer"
                      title="Modifier le module"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>

                    <button
                      onClick={() => {
                        if (confirm(`Supprimer définitivement le module "${mod.title}" ?`)) {
                          deleteModule(mod.id);
                        }
                      }}
                      className="p-1.5 text-[#9BA7B8] hover:text-rose-600 hover:bg-[#D9E8F4] rounded-lg transition-colors cursor-pointer"
                      title="Supprimer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                </div>

                {/* Expanded Details: Objective, Resources & Exercises */}
                {isExpanded && (
                  <div className="px-5 pb-5 pt-3 border-t border-[#B7C9D6] bg-[#F4F7F9] space-y-4">
                    
                    {/* Objective & Notes */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="p-3.5 rounded-xl bg-white border border-[#B7C9D6] shadow-xs">
                        <span className="text-xs font-bold text-[#1E2538] block mb-1">
                          Objectif d'apprentissage
                        </span>
                        <p className="text-xs text-[#1E2538] leading-relaxed">
                          {mod.objective || 'Aucun objectif explicite renseigné.'}
                        </p>
                      </div>

                      <div className="p-3.5 rounded-xl bg-white border border-[#B7C9D6] shadow-xs">
                        <span className="text-xs font-bold text-[#1E2538] block mb-1">
                          Notes personnelles & Mémos
                        </span>
                        <p className="text-xs text-[#1E2538] whitespace-pre-wrap leading-relaxed">
                          {mod.notes || 'Aucune note personnelle enregistrée.'}
                        </p>
                      </div>
                    </div>

                    {/* Resources (Google Drive, Links, Docs) */}
                    <div className="p-4 rounded-xl bg-white border border-[#B7C9D6] shadow-xs">
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-xs font-bold text-[#1E2538] flex items-center gap-1.5">
                          <FolderOpen className="w-4 h-4 text-[#1E2538]" />
                          Mes supports de cours ({mod.resources?.length || 0})
                        </span>
                        <button
                          onClick={() => openEditModal(mod)}
                          className="text-xs text-[#1E2538] hover:underline font-semibold"
                        >
                          + Gérer mes supports
                        </button>
                      </div>

                      {(!mod.resources || mod.resources.length === 0) ? (
                        <p className="text-xs text-[#9BA7B8]">
                          Aucun support associé. Cliquez sur « Gérer mes supports » pour ajouter un document Google Drive, un lien web ou un PDF.
                        </p>
                      ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                          {mod.resources.map((res) => (
                            <div
                              key={res.id}
                              className="p-2.5 rounded-lg bg-[#D9E8F4]/40 border border-[#B7C9D6] flex items-center justify-between gap-2 text-xs"
                            >
                              <div className="flex items-center gap-2 truncate">
                                {res.type === 'drive_file' ? (
                                  <FolderOpen className="w-3.5 h-3.5 text-[#1E2538] shrink-0" />
                                ) : (
                                  <LinkIcon className="w-3.5 h-3.5 text-[#1E2538] shrink-0" />
                                )}
                                <span className="font-semibold text-[#1E2538] truncate">{res.title}</span>
                              </div>
                              {res.url && (
                                <a
                                  href={res.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-[#1E2538] hover:text-[#9BA7B8] p-1"
                                >
                                  <ExternalLink className="w-3.5 h-3.5" />
                                </a>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Attached Exercises */}
                    <div className="p-4 rounded-xl bg-white border border-[#B7C9D6] shadow-xs">
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-xs font-bold text-[#1E2538] flex items-center gap-1.5">
                          <BookOpen className="w-4 h-4 text-[#1E2538]" />
                          Exercices liés ({completedExercises.length}/{attachedExercises.length} terminés)
                        </span>
                        <button
                          onClick={() => onNavigateToExercisesForModule(selectedSubject, mod.id)}
                          className="text-xs text-[#1E2538] hover:underline font-semibold"
                        >
                          Voir & Ajouter des exercices
                        </button>
                      </div>

                      {attachedExercises.length === 0 ? (
                        <p className="text-xs text-[#9BA7B8]">
                          Aucun exercice n'a encore été ajouté pour ce module.
                        </p>
                      ) : (
                        <div className="space-y-1.5">
                          {attachedExercises.map((ex) => (
                            <div
                              key={ex.id}
                              className="p-2 rounded-lg bg-[#D9E8F4]/30 border border-[#B7C9D6] flex items-center justify-between gap-2 text-xs"
                            >
                              <span className="text-[#1E2538] font-medium">{ex.title}</span>
                              <div className="flex items-center gap-2 text-[11px] text-[#9BA7B8]">
                                <span>~{ex.estimatedMinutes} min</span>
                                <span className="capitalize">{ex.difficulty}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Add / Edit Module Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#1E2538]/60 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white border border-[#B7C9D6] rounded-xl max-w-lg w-full p-6 shadow-xl relative my-8 text-[#1E2538]">
            <div className="flex items-center justify-between pb-3 border-b border-[#B7C9D6]">
              <h3 className="font-bold text-[#1E2538] text-base">
                {editingModule ? 'Modifier le module' : `Nouveau module ${currentMeta.shortName}`}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 text-[#9BA7B8] hover:text-[#1E2538]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveModule} className="mt-4 space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-[#1E2538] mb-1">
                  Titre du module *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Variables & Pointeurs, Requêtes imbriquées..."
                  value={moduleTitle}
                  onChange={(e) => setModuleTitle(e.target.value)}
                  className="w-full px-3 py-2 bg-[#F4F7F9] border border-[#B7C9D6] focus:border-[#1E2538] rounded-xl text-xs text-[#1E2538] outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#1E2538] mb-1">
                  Objectif d'apprentissage
                </label>
                <input
                  type="text"
                  placeholder="Ex: Savoir allouer dynamiquement et libérer la mémoire sans fuite."
                  value={moduleObjective}
                  onChange={(e) => setModuleObjective(e.target.value)}
                  className="w-full px-3 py-2 bg-[#F4F7F9] border border-[#B7C9D6] focus:border-[#1E2538] rounded-xl text-xs text-[#1E2538] outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#1E2538] mb-1">
                  Statut du module (attribué par vous-même)
                </label>
                <select
                  value={moduleStatus}
                  onChange={(e) => setModuleStatus(e.target.value as ModuleStatus)}
                  className="w-full px-3 py-2 bg-[#F4F7F9] border border-[#B7C9D6] rounded-xl text-xs text-[#1E2538] outline-none"
                >
                  <option value="not_started">Non commencé</option>
                  <option value="in_progress">En cours</option>
                  <option value="completed">Terminé</option>
                  <option value="needs_review">À revoir</option>
                  <option value="mastered">Maîtrisé ⭐</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#1E2538] mb-1">
                  Notes personnelles
                </label>
                <textarea
                  rows={3}
                  placeholder="Rappels de syntaxe, pièges fréquents..."
                  value={moduleNotes}
                  onChange={(e) => setModuleNotes(e.target.value)}
                  className="w-full px-3 py-2 bg-[#F4F7F9] border border-[#B7C9D6] rounded-xl text-xs text-[#1E2538] outline-none resize-none"
                />
              </div>

              {/* Resource Management */}
              <div className="p-3.5 rounded-xl bg-[#D9E8F4]/50 border border-[#B7C9D6] space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-[#1E2538]">
                    Supports associés ({moduleResources.length})
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setIsDriveModalOpen(true)}
                      className="px-2.5 py-1 rounded-lg bg-[#1E2538] text-white text-[11px] font-semibold"
                    >
                      Google Drive
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowAddResource(!showAddResource)}
                      className="px-2.5 py-1 rounded-lg bg-white border border-[#B7C9D6] text-[#1E2538] text-[11px] font-medium hover:bg-[#C5D9E9]"
                    >
                      + Lien Web
                    </button>
                  </div>
                </div>

                {/* Inline Link input */}
                {showAddResource && (
                  <div className="p-3 rounded-lg bg-white border border-[#B7C9D6] space-y-2">
                    <input
                      type="text"
                      placeholder="Nom du support (ex: Documentation officielle C)"
                      value={resTitle}
                      onChange={(e) => setResTitle(e.target.value)}
                      className="w-full px-2.5 py-1 bg-[#F4F7F9] border border-[#B7C9D6] rounded text-xs text-[#1E2538] outline-none"
                    />
                    <input
                      type="url"
                      placeholder="https://..."
                      value={resUrl}
                      onChange={(e) => setResUrl(e.target.value)}
                      className="w-full px-2.5 py-1 bg-[#F4F7F9] border border-[#B7C9D6] rounded text-xs text-[#1E2538] outline-none"
                    />
                    <div className="flex justify-end gap-1.5">
                      <button
                        type="button"
                        onClick={() => setShowAddResource(false)}
                        className="px-2 py-0.5 text-xs text-[#9BA7B8]"
                      >
                        Annuler
                      </button>
                      <button
                        type="button"
                        onClick={handleAddResourceItem}
                        className="px-2.5 py-0.5 rounded bg-[#1E2538] text-white text-xs font-semibold"
                      >
                        Ajouter
                      </button>
                    </div>
                  </div>
                )}

                {/* List of current resources */}
                {moduleResources.length > 0 && (
                  <div className="space-y-1">
                    {moduleResources.map((r) => (
                      <div
                        key={r.id}
                        className="flex items-center justify-between p-2 rounded-lg bg-white border border-[#B7C9D6] text-xs text-[#1E2538]"
                      >
                        <span className="truncate">{r.title}</span>
                        <button
                          type="button"
                          onClick={() => handleRemoveResource(r.id)}
                          className="text-[#9BA7B8] hover:text-rose-600 p-0.5"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Submit button */}
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
                  Enregistrer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Google Drive Selector Modal */}
      <DriveManagerModal
        isOpen={isDriveModalOpen}
        onClose={() => setIsDriveModalOpen(false)}
        onSelectFile={handleDriveFileAttached}
      />

    </div>
  );
};
