import React from 'react';
import { WifiOff } from 'lucide-react';
import { useOnlineStatus } from '../hooks/useOnlineStatus';

export const OfflineIndicator: React.FC = () => {
  const isOnline = useOnlineStatus();

  if (isOnline) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="bg-[#1E2538] text-[#F4F7F9] border-b border-[#B7C9D6] px-4 py-2 text-xs flex items-center justify-center gap-2 transition-all shadow-sm"
    >
      <WifiOff className="w-4 h-4 text-[#D9E8F4] shrink-0" />
      <span>
        <strong>Mode hors ligne</strong> — Vos cours et données déjà chargées restent consultables. Les modifications seront synchronisées dès le retour de la connexion.
      </span>
    </div>
  );
};
