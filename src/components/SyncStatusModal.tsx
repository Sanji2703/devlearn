import React, { useState } from 'react';
import {
  X,
  CloudCheck,
  CloudAlert,
  RefreshCw,
  Smartphone,
  Laptop,
  CheckCircle2,
  Database,
  ShieldCheck,
  Radio,
  ExternalLink,
  ArrowRightLeft
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';

interface SyncStatusModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SyncStatusModal: React.FC<SyncStatusModalProps> = ({ isOpen, onClose }) => {
  const { user, isTokenValid, retryTokenValidation, tokenServiceNotice } = useAuth();
  const {
    syncStatus,
    syncError,
    lastSyncedAt,
    isSyncing,
    refreshData,
    modules,
    exercises,
    activities,
    sessions,
    reviews,
  } = useData();

  const [isRefreshing, setIsRefreshing] = useState(false);

  if (!isOpen) return null;

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      if (user && !isTokenValid) {
        await retryTokenValidation();
      } else {
        await refreshData();
      }
    } finally {
      setIsRefreshing(false);
    }
  };

  const formattedLastSync = lastSyncedAt
    ? new Intl.DateTimeFormat('fr-FR', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      }).format(lastSyncedAt)
    : 'En attente';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-[#F4F7F9] border border-[#B7C9D6] rounded-2xl max-w-lg w-full shadow-xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="px-6 py-4 bg-white border-b border-[#B7C9D6] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#D9E8F4] text-[#1E2538] flex items-center justify-center border border-[#B7C9D6]">
              <ArrowRightLeft className="w-5 h-5 text-[#1E2538]" />
            </div>
            <div>
              <h2 className="font-bold text-base text-[#1E2538]">
                Synchronisation en temps réel
              </h2>
              <p className="text-xs text-[#9BA7B8]">
                Ordinateur ↔ Mobile Android (Firestore onSnapshot)
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

        {/* Content */}
        <div className="p-6 space-y-5 overflow-y-auto flex-1">
          
          {/* Status card */}
          <div className="p-4 rounded-xl bg-white border border-[#B7C9D6] shadow-2xs">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                {syncStatus === 'synced' && isTokenValid && (
                  <div className="flex items-center gap-2">
                    <span className="relative flex h-3 w-3">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#1E2538] opacity-50" />
                      <span className="relative inline-flex rounded-full h-3 w-3 bg-[#1E2538]" />
                    </span>
                    <span className="font-semibold text-sm text-[#1E2538]">
                      Synchronisation active en continu
                    </span>
                  </div>
                )}
                {syncStatus === 'syncing' && (
                  <div className="flex items-center gap-2">
                    <RefreshCw className="w-4 h-4 text-[#1E2538] animate-spin" />
                    <span className="font-semibold text-sm text-[#1E2538]">
                      Mise à jour en cours...
                    </span>
                  </div>
                )}
                {(!user || (!isTokenValid && syncStatus !== 'syncing')) && (
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-[#9BA7B8]" />
                    <span className="font-semibold text-sm text-[#1E2538]">
                      {user ? 'Mode local (token Google en attente)' : 'Mode local (non connecté)'}
                    </span>
                  </div>
                )}
                {syncStatus === 'error' && (
                  <div className="flex items-center gap-2">
                    <CloudAlert className="w-4 h-4 text-[#1E2538]" />
                    <span className="font-semibold text-sm text-[#1E2538]">
                      Avertissement de synchronisation
                    </span>
                  </div>
                )}
              </div>

              <button
                type="button"
                onClick={handleRefresh}
                disabled={isRefreshing || isSyncing}
                className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-[#D9E8F4] hover:bg-[#C5D9E9] text-[#1E2538] text-xs font-medium border border-[#B7C9D6] transition-all disabled:opacity-50 cursor-pointer"
                title="Vérifier et forcer l'actualisation"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
                <span>Actualiser</span>
              </button>
            </div>

            {user && !isTokenValid && tokenServiceNotice && (
              <div className="mt-3 p-3 rounded-lg bg-[#D9E8F4] text-[#1E2538] text-xs border border-[#B7C9D6] space-y-2">
                <p>
                  Le service <strong>Google Secure Token</strong> doit être activé sur votre projet GCP (867733881087) pour autoriser la connexion Firestore.
                </p>
                <div className="flex flex-wrap items-center gap-2 pt-1">
                  <a
                    href={tokenServiceNotice}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-2.5 py-1 bg-[#1E2538] text-white rounded-lg font-medium text-xs flex items-center gap-1 hover:bg-[#2C3652]"
                  >
                    <ExternalLink className="w-3 h-3" />
                    <span>Activer sur Google Cloud</span>
                  </a>
                  <button
                    type="button"
                    onClick={async () => {
                      setIsRefreshing(true);
                      await retryTokenValidation();
                      setIsRefreshing(false);
                    }}
                    disabled={isRefreshing}
                    className="px-2.5 py-1 bg-white border border-[#B7C9D6] text-[#1E2538] rounded-lg font-medium text-xs hover:bg-[#C5D9E9] cursor-pointer"
                  >
                    Tester l'activation
                  </button>
                </div>
              </div>
            )}

            {syncError && !(user && !isTokenValid) && (
              <div className="mt-2.5 p-2.5 rounded-lg bg-[#D9E8F4]/80 text-[#1E2538] text-xs border border-[#B7C9D6]">
                {syncError}
              </div>
            )}

            <div className="mt-3 pt-3 border-t border-[#B7C9D6] grid grid-cols-2 gap-2 text-xs text-[#9BA7B8]">
              <div>
                Dernier échange : <strong className="text-[#1E2538]">{formattedLastSync}</strong>
              </div>
              <div className="text-right">
                Mode : <strong className="text-[#1E2538]">{user && isTokenValid ? 'Cloud Firestore' : 'Cache local'}</strong>
              </div>
            </div>
          </div>

          {/* Account & Source of truth */}
          <div className="p-4 rounded-xl bg-white border border-[#B7C9D6] shadow-2xs space-y-2.5">
            <h3 className="text-xs font-bold text-[#1E2538] uppercase tracking-wider flex items-center gap-1.5">
              <Database className="w-3.5 h-3.5 text-[#1E2538]" />
              Source de vérité unique
            </h3>
            
            <div className="text-xs space-y-1.5 text-[#1E2538]">
              <div className="flex justify-between py-1 border-b border-[#B7C9D6]/40">
                <span className="text-[#9BA7B8]">Compte connecté</span>
                <span className="font-medium truncate max-w-[240px]">
                  {user?.email || 'Non connecté (Mode invité local)'}
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-[#B7C9D6]/40">
                <span className="text-[#9BA7B8]">Projet Firebase</span>
                <span className="font-mono text-[11px]">planar-server-2w1rw</span>
              </div>
              <div className="flex justify-between py-1 border-b border-[#B7C9D6]/40">
                <span className="text-[#9BA7B8]">Base Firestore</span>
                <span className="font-mono text-[10px] truncate max-w-[220px]" title="ai-studio-devlearnassistan-95c9b591-b881-4781-bbf8-a2d9708494a4">
                  ai-studio-devlearnassistan...
                </span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-[#9BA7B8]">Identifiant utilisateur (UID)</span>
                <span className="font-mono text-[11px] truncate max-w-[200px]">
                  {user?.uid || 'local'}
                </span>
              </div>
            </div>
          </div>

          {/* Real-time Listeners breakdown */}
          <div className="p-4 rounded-xl bg-white border border-[#B7C9D6] shadow-2xs space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-[#1E2538] uppercase tracking-wider flex items-center gap-1.5">
                <Radio className="w-3.5 h-3.5 text-[#1E2538]" />
                Écouteurs temps réel (onSnapshot)
              </h3>
              <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-[#D9E8F4] text-[#1E2538] border border-[#B7C9D6]">
                6 flux connectés
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="p-2.5 rounded-lg bg-[#F4F7F9] border border-[#B7C9D6] flex items-center justify-between">
                <span>Modules de cours</span>
                <strong className="font-mono text-[#1E2538]">{modules.length}</strong>
              </div>
              <div className="p-2.5 rounded-lg bg-[#F4F7F9] border border-[#B7C9D6] flex items-center justify-between">
                <span>Exercices</span>
                <strong className="font-mono text-[#1E2538]">{exercises.length}</strong>
              </div>
              <div className="p-2.5 rounded-lg bg-[#F4F7F9] border border-[#B7C9D6] flex items-center justify-between">
                <span>Activités & Plages</span>
                <strong className="font-mono text-[#1E2538]">{activities.length}</strong>
              </div>
              <div className="p-2.5 rounded-lg bg-[#F4F7F9] border border-[#B7C9D6] flex items-center justify-between">
                <span>Sessions chrono</span>
                <strong className="font-mono text-[#1E2538]">{sessions.length}</strong>
              </div>
              <div className="p-2.5 rounded-lg bg-[#F4F7F9] border border-[#B7C9D6] flex items-center justify-between">
                <span>Bilans quotidiens</span>
                <strong className="font-mono text-[#1E2538]">{reviews.length}</strong>
              </div>
              <div className="p-2.5 rounded-lg bg-[#F4F7F9] border border-[#B7C9D6] flex items-center justify-between">
                <span>Préférences & Objectifs</span>
                <strong className="text-[#1E2538]">Actifs</strong>
              </div>
            </div>
          </div>

          {/* How to test cross-device sync */}
          <div className="p-4 rounded-xl bg-[#D9E8F4]/50 border border-[#B7C9D6] space-y-2.5">
            <h4 className="text-xs font-bold text-[#1E2538] flex items-center gap-1.5">
              <Smartphone className="w-4 h-4 text-[#1E2538]" />
              <span>Comment tester la synchronisation PC ↔ Android :</span>
            </h4>
            <ol className="text-xs text-[#1E2538] space-y-1.5 list-decimal list-inside pl-1 leading-relaxed">
              <li>
                Ouvrez l'application sur votre ordinateur et connectez-vous avec Google.
              </li>
              <li>
                Ouvrez la même URL sur votre téléphone Android (ou via la PWA installée) et connectez-vous avec le <strong>même compte Google</strong> ({user?.email || 'votre email'}).
              </li>
              <li>
                Ajoutez, cochez ou reportez une activité sur un appareil : <strong>elle apparaît ou se met à jour immédiatement sur l'autre</strong> sans rafraîchir la page !
              </li>
            </ol>
          </div>

        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 bg-white border-t border-[#B7C9D6] flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-[#1E2538] hover:bg-[#2C3652] text-white text-xs font-semibold shadow-xs transition-all cursor-pointer"
          >
            Fermer
          </button>
        </div>

      </div>
    </div>
  );
};
