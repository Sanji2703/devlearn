import React, { useRef, useState } from 'react';
import {
  X,
  Upload,
  FileText,
  Trash2,
  ExternalLink,
  Download,
  CheckCircle2,
  AlertCircle,
  FolderOpen,
  FileCode,
  HardDrive,
  Cloud,
  File,
  Sparkles,
  Smartphone
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import { LearningMaterial, SubjectId, SUBJECTS } from '../types';
import {
  uploadLearningFile,
  formatFileSize,
  ALLOWED_EXTENSIONS,
  MAX_FILE_SIZE_BYTES,
} from '../lib/storageService';

interface MaterialsModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultSubject?: SubjectId;
  defaultModuleId?: string;
  defaultExerciseId?: string;
  onSelectMaterial?: (material: LearningMaterial) => void;
}

export const MaterialsModal: React.FC<MaterialsModalProps> = ({
  isOpen,
  onClose,
  defaultSubject,
  defaultModuleId,
  defaultExerciseId,
  onSelectMaterial,
}) => {
  const { user } = useAuth();
  const { materials, saveMaterial, deleteMaterial, modules } = useData();

  const fileInputRef = useRef<HTMLInputElement>(null);

  const [selectedSubject, setSelectedSubject] = useState<SubjectId | ''>(defaultSubject || '');
  const [selectedModuleId, setSelectedModuleId] = useState<string>(defaultModuleId || '');
  const [fileDescription, setFileDescription] = useState('');

  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  // Filter modules based on subject
  const availableModules = selectedSubject
    ? modules.filter((m) => m.subject === selectedSubject)
    : modules;

  // Filtered materials
  const displayedMaterials = materials.filter((m) => {
    if (selectedSubject && m.subject && m.subject !== selectedSubject) return false;
    if (selectedModuleId && m.moduleId && m.moduleId !== selectedModuleId) return false;
    return true;
  });

  const handleTriggerPicker = () => {
    setErrorMessage(null);
    setSuccessMessage(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
      fileInputRef.current.click();
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];

    // Check size limit (20 MB)
    if (file.size > MAX_FILE_SIZE_BYTES) {
      setErrorMessage(`Le fichier sélectionné est trop volumineux (${formatFileSize(file.size)}). La taille maximale autorisée est de 20 Mo.`);
      return;
    }

    setIsUploading(true);
    setUploadProgress(10);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const material = await uploadLearningFile(file, user?.uid, {
        subject: (selectedSubject as SubjectId) || undefined,
        moduleId: selectedModuleId || undefined,
        exerciseId: defaultExerciseId || undefined,
        description: fileDescription.trim() || undefined,
        onProgress: (p) => setUploadProgress(p),
      });

      await saveMaterial(material);

      setUploadProgress(100);
      setSuccessMessage(`Support "${file.name}" (${formatFileSize(file.size)}) enregistré avec succès !`);
      setFileDescription('');

      if (onSelectMaterial) {
        onSelectMaterial(material);
      }
    } catch (err: any) {
      console.error('File upload error:', err);
      setErrorMessage(err.message || 'Erreur lors de l’envoi du fichier.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (confirm(`Voulez-vous vraiment supprimer le support "${name}" ?`)) {
      try {
        await deleteMaterial(id);
        setSuccessMessage(`Fichier "${name}" supprimé.`);
      } catch (err: any) {
        setErrorMessage(err.message || 'Erreur lors de la suppression.');
      }
    }
  };

  const getFileIcon = (fileName: string) => {
    const lower = fileName.toLowerCase();
    if (lower.endsWith('.pdf')) return <FileText className="w-5 h-5 text-rose-600" />;
    if (lower.endsWith('.c') || lower.endsWith('.cpp') || lower.endsWith('.h') || lower.endsWith('.hpp')) {
      return <FileCode className="w-5 h-5 text-[#1E2538]" />;
    }
    if (lower.endsWith('.py')) return <FileCode className="w-5 h-5 text-[#1E2538]" />;
    if (lower.endsWith('.sql')) return <FileCode className="w-5 h-5 text-[#1E2538]" />;
    if (lower.endsWith('.png') || lower.endsWith('.jpg') || lower.endsWith('.jpeg')) {
      return <File className="w-5 h-5 text-[#1E2538]" />;
    }
    return <FileText className="w-5 h-5 text-[#1E2538]" />;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-[#1E2538]/60 backdrop-blur-xs overflow-y-auto animate-in fade-in duration-150">
      <div className="bg-white border border-[#B7C9D6] rounded-2xl max-w-2xl w-full shadow-2xl relative my-6 text-[#1E2538] flex flex-col max-h-[92vh]">
        
        {/* Header */}
        <div className="px-5 py-4 border-b border-[#B7C9D6] flex items-center justify-between bg-white rounded-t-2xl">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#D9E8F4] text-[#1E2538] border border-[#B7C9D6] flex items-center justify-center shrink-0">
              <FolderOpen className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-[#1E2538]">
                Supports pédagogiques & Fichiers
              </h2>
              <p className="text-xs text-[#9BA7B8]">
                Compatible mobile Android (gestionnaire de fichiers & téléchargements) et ordinateur
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-[#9BA7B8] hover:text-[#1E2538] hover:bg-[#D9E8F4] rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="p-5 overflow-y-auto space-y-5 flex-1">
          
          {/* Mode Badge & Information */}
          <div className="flex flex-wrap items-center justify-between gap-2 p-3 bg-[#F4F7F9] border border-[#B7C9D6] rounded-xl text-xs">
            <div className="flex items-center gap-2">
              {user ? (
                <>
                  <Cloud className="w-4 h-4 text-[#1E2538]" />
                  <span>
                    <strong>Mode Compte Google :</strong> Fichiers synchronisés sur votre espace sécurisé.
                  </span>
                </>
              ) : (
                <>
                  <HardDrive className="w-4 h-4 text-[#1E2538]" />
                  <span>
                    <strong>Mode Local :</strong> Fichiers conservés dans le stockage local de votre appareil.
                  </span>
                </>
              )}
            </div>
            <span className="text-[11px] text-[#9BA7B8]">
              {user ? user.email : 'Données locales préservées'}
            </span>
          </div>

          {/* Feedback Banners */}
          {successMessage && (
            <div className="p-3 rounded-xl bg-[#D9E8F4] border border-[#B7C9D6] text-[#1E2538] text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-[#1E2538] shrink-0" />
              <span className="flex-1 font-medium">{successMessage}</span>
              <button
                onClick={() => setSuccessMessage(null)}
                className="p-1 text-[#1E2538] hover:bg-[#C5D9E9] rounded cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {errorMessage && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span className="flex-1 font-medium">{errorMessage}</span>
              <button
                onClick={() => setErrorMessage(null)}
                className="p-1 text-rose-700 hover:bg-rose-100 rounded cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* Upload Card */}
          <div className="p-4 sm:p-5 rounded-xl border border-[#B7C9D6] bg-white shadow-xs space-y-4">
            <h3 className="text-xs font-bold text-[#1E2538] uppercase tracking-wider flex items-center gap-1.5">
              <Smartphone className="w-3.5 h-3.5 text-[#1E2538]" />
              Ajouter un support depuis cet appareil
            </h3>

            {/* Optional tagging: Subject and Module */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div>
                <label className="block font-medium text-[#1E2538] mb-1">
                  Technologie associée (optionnel)
                </label>
                <select
                  value={selectedSubject}
                  onChange={(e) => setSelectedSubject(e.target.value as SubjectId | '')}
                  className="w-full px-3 py-2 bg-[#F4F7F9] border border-[#B7C9D6] rounded-xl text-xs text-[#1E2538] focus:border-[#1E2538] outline-none"
                >
                  <option value="">Aucune technologie spécifique</option>
                  <option value="c">C</option>
                  <option value="cpp">C++</option>
                  <option value="python">Python</option>
                  <option value="sql">SQL</option>
                </select>
              </div>

              <div>
                <label className="block font-medium text-[#1E2538] mb-1">
                  Module d'apprentissage (optionnel)
                </label>
                <select
                  value={selectedModuleId}
                  onChange={(e) => setSelectedModuleId(e.target.value)}
                  className="w-full px-3 py-2 bg-[#F4F7F9] border border-[#B7C9D6] rounded-xl text-xs text-[#1E2538] focus:border-[#1E2538] outline-none"
                >
                  <option value="">Aucun module spécifique</option>
                  {availableModules.map((m) => (
                    <option key={m.id} value={m.id}>
                      [{m.subject.toUpperCase()}] {m.title}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-[#1E2538] mb-1">
                Description ou note sur ce document (optionnel)
              </label>
              <input
                type="text"
                value={fileDescription}
                onChange={(e) => setFileDescription(e.target.value)}
                placeholder="Ex : Énoncé TP pointeurs, cours syntaxe SQL, antisèche Python..."
                className="w-full px-3 py-2 bg-[#F4F7F9] border border-[#B7C9D6] rounded-xl text-xs text-[#1E2538] placeholder-[#9BA7B8] focus:border-[#1E2538] outline-none"
              />
            </div>

            {/* Hidden native input for mobile Android and Desktop compatibility */}
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.txt,.c,.cpp,.h,.hpp,.py,.sql,.doc,.docx,.md,.png,.jpg,.jpeg,application/pdf,text/*"
              onChange={handleFileChange}
              disabled={isUploading}
              style={{
                position: 'absolute',
                width: '1px',
                height: '1px',
                padding: 0,
                margin: '-1px',
                overflow: 'hidden',
                clip: 'rect(0, 0, 0, 0)',
                border: 0,
              }}
            />

            {/* Android-friendly tap button */}
            <div className="pt-1">
              <button
                type="button"
                onClick={handleTriggerPicker}
                disabled={isUploading}
                className="w-full min-h-[48px] py-3 px-4 rounded-xl bg-[#1E2538] hover:bg-[#2C3652] active:bg-[#1E2538] text-white font-semibold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-xs transition-all cursor-pointer disabled:opacity-50"
              >
                <Upload className={`w-4 h-4 ${isUploading ? 'animate-bounce' : ''}`} />
                <span>
                  {isUploading
                    ? `Enregistrement en cours (${uploadProgress}%)...`
                    : '+ Sélectionner un fichier (Téléphone / PC)'}
                </span>
              </button>

              <p className="text-[11px] text-[#9BA7B8] text-center mt-2">
                Formats acceptés : PDF, Code source (C, C++, Python, SQL), Markdown, Texte (.txt, .docx) et images. Max 20 Mo.
              </p>
            </div>

            {/* Progress bar */}
            {isUploading && (
              <div className="w-full bg-[#D9E8F4] h-2 rounded-full overflow-hidden mt-2">
                <div
                  className="bg-[#1E2538] h-full transition-all duration-300"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
            )}
          </div>

          {/* List of Existing Materials */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-[#1E2538] uppercase tracking-wider flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-[#1E2538]" />
                Vos documents et supports enregistrés ({displayedMaterials.length})
              </h3>
            </div>

            {displayedMaterials.length === 0 ? (
              <div className="text-center py-8 px-4 rounded-xl bg-[#F4F7F9] border border-[#B7C9D6] space-y-2">
                <FolderOpen className="w-8 h-8 text-[#9BA7B8] mx-auto" />
                <p className="text-xs font-medium text-[#1E2538]">
                  Aucun support pédagogique pour le moment.
                </p>
                <p className="text-[11px] text-[#9BA7B8]">
                  Sélectionnez un fichier ci-dessus pour l'ajouter à vos supports d'étude.
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {displayedMaterials.map((mat) => {
                  const subjMeta = mat.subject ? SUBJECTS[mat.subject] : null;
                  const modMeta = mat.moduleId ? modules.find((m) => m.id === mat.moduleId) : null;

                  return (
                    <div
                      key={mat.id}
                      className="p-3.5 rounded-xl border border-[#B7C9D6] bg-white hover:bg-[#F4F7F9] transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs"
                    >
                      <div className="flex items-start sm:items-center gap-3">
                        <div className="p-2 rounded-lg bg-[#D9E8F4] border border-[#B7C9D6] shrink-0 mt-0.5 sm:mt-0">
                          {getFileIcon(mat.fileName)}
                        </div>

                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-semibold text-xs sm:text-sm text-[#1E2538] break-all">
                              {mat.fileName}
                            </span>

                            {subjMeta && (
                              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-[#C5D9E9] text-[#1E2538] border border-[#B7C9D6]">
                                {subjMeta.shortName}
                              </span>
                            )}

                            <span className="text-[10px] text-[#9BA7B8] px-1.5 py-0.5 rounded bg-[#F4F7F9] border border-[#B7C9D6]">
                              {formatFileSize(mat.fileSize)}
                            </span>

                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#D9E8F4] text-[#1E2538] border border-[#B7C9D6]">
                              {mat.storageType === 'firebase_storage' ? 'Cloud' : 'Local'}
                            </span>
                          </div>

                          {mat.description && (
                            <p className="text-xs text-[#1E2538]/80 mt-0.5">
                              {mat.description}
                            </p>
                          )}

                          {modMeta && (
                            <p className="text-[11px] text-[#9BA7B8] mt-0.5">
                              Module : {modMeta.title}
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Action buttons */}
                      <div className="flex items-center gap-1.5 shrink-0 self-end sm:self-center">
                        {mat.downloadUrl && (
                          <a
                            href={mat.downloadUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-2 text-[#1E2538] hover:bg-[#D9E8F4] rounded-lg transition-colors cursor-pointer text-xs flex items-center gap-1 border border-[#B7C9D6]"
                            title="Ouvrir / Visualiser"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                            <span className="sm:hidden text-xs">Ouvrir</span>
                          </a>
                        )}

                        {mat.downloadUrl && (
                          <a
                            href={mat.downloadUrl}
                            download={mat.fileName}
                            className="p-2 text-[#1E2538] hover:bg-[#D9E8F4] rounded-lg transition-colors cursor-pointer text-xs flex items-center gap-1 border border-[#B7C9D6]"
                            title="Télécharger sur cet appareil"
                          >
                            <Download className="w-3.5 h-3.5" />
                            <span className="sm:hidden text-xs">Télécharger</span>
                          </a>
                        )}

                        <button
                          onClick={() => handleDelete(mat.id, mat.fileName)}
                          className="p-2 text-[#9BA7B8] hover:text-rose-600 hover:bg-[#D9E8F4] rounded-lg transition-colors cursor-pointer border border-[#B7C9D6]"
                          title="Supprimer ce support"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-[#B7C9D6] bg-white rounded-b-2xl flex items-center justify-between">
          <span className="text-xs text-[#9BA7B8]">
            {materials.length} support(s) au total
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-[#D9E8F4] hover:bg-[#C5D9E9] text-[#1E2538] text-xs font-semibold border border-[#B7C9D6] transition-all cursor-pointer"
          >
            Fermer
          </button>
        </div>

      </div>
    </div>
  );
};
