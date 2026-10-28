import React, { useEffect, useState } from 'react';
import {
  X,
  FileText,
  Upload,
  ExternalLink,
  Plus,
  AlertCircle,
  FolderOpen,
  CheckCircle2
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { listAppDriveFiles, uploadFileToDrive, createStudyDocInDrive, DriveFile } from '../lib/drive';
import { GoogleSignInButton } from './GoogleSignInButton';

interface DriveManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectFile?: (file: { id: string; name: string; url?: string }) => void;
}

export const DriveManagerModal: React.FC<DriveManagerModalProps> = ({
  isOpen,
  onClose,
  onSelectFile,
}) => {
  const { user, accessToken } = useAuth();

  const [files, setFiles] = useState<DriveFile[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // New Note state
  const [showCreateNote, setShowCreateNote] = useState(false);
  const [noteTitle, setNoteTitle] = useState('');
  const [noteContent, setNoteContent] = useState('');

  useEffect(() => {
    if (isOpen && accessToken) {
      loadFiles();
    }
  }, [isOpen, accessToken]);

  const loadFiles = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const items = await listAppDriveFiles();
      setFiles(items);
    } catch (err: any) {
      setError(err.message || 'Impossible de lister les fichiers Google Drive.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileList = e.target.files;
    if (!fileList || fileList.length === 0) return;
    const file = fileList[0];

    setIsUploading(true);
    setError(null);
    try {
      const uploaded = await uploadFileToDrive(file, file.name, file.type);
      setFiles((prev) => [uploaded, ...prev]);
      if (onSelectFile) {
        onSelectFile({ id: uploaded.id, name: uploaded.name, url: uploaded.webViewLink });
        onClose();
      }
    } catch (err: any) {
      setError(err.message || 'Échec du téléversement vers Google Drive.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleCreateNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!noteTitle.trim()) return;

    setIsUploading(true);
    setError(null);
    try {
      const created = await createStudyDocInDrive(noteTitle.trim(), noteContent);
      setFiles((prev) => [created, ...prev]);
      setShowCreateNote(false);
      setNoteTitle('');
      setNoteContent('');
      if (onSelectFile) {
        onSelectFile({ id: created.id, name: created.name, url: created.webViewLink });
        onClose();
      }
    } catch (err: any) {
      setError(err.message || 'Échec de création du document Google Drive.');
    } finally {
      setIsUploading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#1E2538]/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white border border-[#B7C9D6] rounded-xl max-w-xl w-full p-6 shadow-xl relative my-8 text-[#1E2538]">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-[#B7C9D6]">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-[#D9E8F4] text-[#1E2538] border border-[#B7C9D6]">
              <FolderOpen className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-[#1E2538]">Mes supports Google Drive</h2>
              <p className="text-xs text-[#9BA7B8]">Associez vos PDF, cours et fiches de révision</p>
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
        <div className="mt-4 space-y-4">
          
          {!user ? (
            <div className="text-center py-8 px-4 rounded-xl bg-[#F4F7F9] border border-[#B7C9D6] space-y-3">
              <FolderOpen className="w-10 h-10 text-[#9BA7B8] mx-auto" />
              <p className="text-sm text-[#1E2538]">
                Connectez-vous avec Google pour accéder à votre espace Google Drive personnel.
              </p>
              <GoogleSignInButton label="Se connecter pour accéder à Google Drive" />
            </div>
          ) : (
            <>
              {/* Action Bar */}
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <label className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#1E2538] hover:bg-[#2C3652] text-white text-xs font-semibold cursor-pointer shadow-xs transition-all">
                    <Upload className="w-3.5 h-3.5" />
                    <span>{isUploading ? 'Téléversement...' : 'Importer un fichier (PDF, code...)'}</span>
                    <input
                      type="file"
                      onChange={handleFileUpload}
                      disabled={isUploading}
                      className="hidden"
                    />
                  </label>

                  <button
                    type="button"
                    onClick={() => setShowCreateNote(!showCreateNote)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#D9E8F4] hover:bg-[#C5D9E9] text-[#1E2538] text-xs font-semibold border border-[#B7C9D6] transition-all cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5 text-[#1E2538]" />
                    <span>Créer une note Drive</span>
                  </button>
                </div>

                <button
                  type="button"
                  onClick={loadFiles}
                  disabled={isLoading}
                  className="text-xs text-[#9BA7B8] hover:text-[#1E2538] transition-colors"
                >
                  {isLoading ? 'Chargement...' : 'Rafraîchir'}
                </button>
              </div>

              {/* Create Note Inline Form */}
              {showCreateNote && (
                <form onSubmit={handleCreateNote} className="p-3.5 rounded-xl bg-[#D9E8F4]/50 border border-[#B7C9D6] space-y-2.5">
                  <span className="text-xs font-bold text-[#1E2538] block">
                    Nouvelle fiche de révision sur Google Drive
                  </span>
                  <input
                    type="text"
                    required
                    placeholder="Titre de la fiche (ex: Synthèse Pointeurs C)"
                    value={noteTitle}
                    onChange={(e) => setNoteTitle(e.target.value)}
                    className="w-full px-3 py-1.5 bg-white border border-[#B7C9D6] rounded-lg text-xs text-[#1E2538] outline-none"
                  />
                  <textarea
                    rows={4}
                    placeholder="Contenu Markdown ou texte de votre fiche de révision..."
                    value={noteContent}
                    onChange={(e) => setNoteContent(e.target.value)}
                    className="w-full px-3 py-1.5 bg-white border border-[#B7C9D6] rounded-lg text-xs text-[#1E2538] outline-none resize-none"
                  />
                  <div className="flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setShowCreateNote(false)}
                      className="px-2.5 py-1 text-xs text-[#9BA7B8] hover:text-[#1E2538]"
                    >
                      Annuler
                    </button>
                    <button
                      type="submit"
                      disabled={isUploading}
                      className="px-3 py-1 text-xs font-semibold rounded-lg bg-[#1E2538] hover:bg-[#2C3652] text-white shadow-xs"
                    >
                      Enregistrer dans Google Drive
                    </button>
                  </div>
                </form>
              )}

              {error && (
                <div className="p-2.5 rounded-xl bg-[#D9E8F4] border border-[#B7C9D6] text-[#1E2538] text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 text-[#1E2538]" />
                  <span>{error}</span>
                </div>
              )}

              {/* Files List */}
              <div className="space-y-1.5 max-h-64 overflow-y-auto pr-1">
                {isLoading ? (
                  <div className="text-center py-6 text-xs text-[#9BA7B8]">
                    Chargement de vos fichiers Google Drive...
                  </div>
                ) : files.length === 0 ? (
                  <div className="text-center py-6 text-xs text-[#9BA7B8]">
                    Aucun fichier disponible dans cette application. Vous pouvez importer un cours ou créer une note ci-dessus.
                  </div>
                ) : (
                  files.map((file) => (
                    <div
                      key={file.id}
                      className="p-2.5 rounded-xl bg-[#F4F7F9] border border-[#B7C9D6] hover:bg-[#D9E8F4]/40 flex items-center justify-between gap-3 text-xs"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <FileText className="w-4 h-4 text-[#1E2538] shrink-0" />
                        <span className="font-semibold text-[#1E2538] truncate">{file.name}</span>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        {file.webViewLink && (
                          <a
                            href={file.webViewLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1 text-[#9BA7B8] hover:text-[#1E2538] rounded"
                            title="Ouvrir dans Google Drive"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </a>
                        )}

                        {onSelectFile && (
                          <button
                            type="button"
                            onClick={() => {
                              onSelectFile({
                                id: file.id,
                                name: file.name,
                                url: file.webViewLink,
                              });
                              onClose();
                            }}
                            className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#1E2538] hover:bg-[#2C3652] text-white font-medium text-[11px] shadow-xs"
                          >
                            <CheckCircle2 className="w-3 h-3" />
                            <span>Associer</span>
                          </button>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </>
          )}

        </div>

      </div>
    </div>
  );
};
