import React from 'react';
import {
  LayoutDashboard,
  Layers,
  CheckSquare,
  Calendar,
  Timer,
  BarChart3,
  CloudCheck,
  CloudAlert,
  LogOut,
  Sparkles,
  ClipboardCheck,
  Smartphone,
  Settings,
  FolderOpen,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import { GoogleSignInButton } from './GoogleSignInButton';
import { PWAInstallButton } from './PWAInstallButton';

export type NavTab = 'dashboard' | 'subjects' | 'exercises' | 'planning' | 'focus' | 'progress';

interface NavbarProps {
  currentTab: NavTab;
  onTabChange: (tab: NavTab) => void;
  onOpenReorganize: () => void;
  onOpenDailyReview: () => void;
  onOpenSyncStatus: () => void;
  onOpenSettings: () => void;
  onOpenMaterials: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentTab,
  onTabChange,
  onOpenReorganize,
  onOpenDailyReview,
  onOpenSyncStatus,
  onOpenSettings,
  onOpenMaterials,
}) => {
  const { user, logout } = useAuth();
  const { isSyncing, syncError, syncStatus } = useData();


  const navItems: Array<{ id: NavTab; label: string; icon: React.FC<{ className?: string }> }> = [
    { id: 'dashboard', label: 'Tableau de bord', icon: LayoutDashboard },
    { id: 'subjects', label: 'Matières & Modules', icon: Layers },
    { id: 'exercises', label: 'Exercices', icon: CheckSquare },
    { id: 'planning', label: 'Planning', icon: Calendar },
    { id: 'focus', label: 'Concentration', icon: Timer },
    { id: 'progress', label: 'Suivi', icon: BarChart3 },
  ];

  return (
    <>
      {/* Desktop & Tablet Top Navigation */}
      <header className="sticky top-0 z-40 bg-[#F4F7F9]/95 backdrop-blur-md border-b border-[#B7C9D6] text-[#1E2538]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
          
          {/* Logo & Branding */}
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#1E2538] text-[#F4F7F9] flex items-center justify-center font-mono font-bold text-sm shadow-sm">
              &lt;/&gt;
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-lg tracking-tight text-[#1E2538]">
                  DevLearn
                </span>
                <span className="text-[11px] font-mono uppercase px-2 py-0.5 rounded-full bg-[#D9E8F4] text-[#1E2538] border border-[#B7C9D6]">
                  C • C++ • Python • SQL
                </span>
              </div>
            </div>
          </div>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-1 bg-[#D9E8F4]/70 p-1.5 rounded-xl border border-[#B7C9D6]">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => onTabChange(item.id)}
                  className={`flex items-center gap-2 px-3 py-1.5 text-xs font-medium rounded-lg transition-all cursor-pointer ${
                    isActive
                      ? 'bg-[#1E2538] text-white shadow-sm'
                      : 'text-[#1E2538] hover:bg-[#C5D9E9]'
                  }`}
                >
                  <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-white' : 'text-[#1E2538]'}`} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>

          {/* Right Header Actions */}
          <div className="flex items-center gap-2.5">
            {/* PWA Install Button */}
            <PWAInstallButton variant="navbar" />

            {/* Quick Reorganize button */}
            <button
              onClick={onOpenReorganize}
              className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl bg-[#1E2538] hover:bg-[#2C3652] text-white shadow-sm transition-all cursor-pointer"
              title="Réorganiser ma journée avec l'IA"
            >
              <Sparkles className="w-3.5 h-3.5 text-[#C5D9E9]" />
              <span>Réorganiser</span>
            </button>

            {/* Quick Bilan button */}
            <button
              onClick={onOpenDailyReview}
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-xl bg-[#D9E8F4] hover:bg-[#C5D9E9] text-[#1E2538] border border-[#B7C9D6] transition-all cursor-pointer"
              title="Bilan quotidien"
            >
              <ClipboardCheck className="w-3.5 h-3.5 text-[#1E2538]" />
              <span className="hidden xl:inline">Bilan</span>
            </button>

            {/* Quick Supports / Fichiers button */}
            <button
              onClick={onOpenMaterials}
              className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 text-xs font-medium rounded-xl bg-[#D9E8F4] hover:bg-[#C5D9E9] text-[#1E2538] border border-[#B7C9D6] transition-all cursor-pointer"
              title="Gérer mes fichiers et supports pédagogiques (PDF, Code C/Python/SQL, documents)"
            >
              <FolderOpen className="w-3.5 h-3.5 text-[#1E2538]" />
              <span className="hidden sm:inline">Supports</span>
            </button>

            {/* Interactive Sync status button */}
            <button
              type="button"
              onClick={onOpenSyncStatus}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-[#D9E8F4] hover:bg-[#C5D9E9] border border-[#B7C9D6] text-[11px] text-[#1E2538] transition-colors cursor-pointer"
              title="Afficher l'état de synchronisation en temps réel"
            >
              {isSyncing ? (
                <>
                  <div className="w-2 h-2 rounded-full bg-[#1E2538] animate-ping" />
                  <span className="hidden sm:inline font-medium">Synchro...</span>
                </>
              ) : syncError ? (
                <>
                  <CloudAlert className="w-3.5 h-3.5 text-[#1E2538]" />
                  <span className="hidden sm:inline font-medium">Avertissement</span>
                </>
              ) : (
                <>
                  <CloudCheck className="w-3.5 h-3.5 text-[#1E2538]" />
                  <span className="hidden sm:inline font-medium">Synchro Cloud</span>
                </>
              )}
            </button>

            {/* Settings button */}
            <button
              type="button"
              onClick={onOpenSettings}
              className="p-1.5 rounded-xl bg-[#D9E8F4] hover:bg-[#C5D9E9] text-[#1E2538] border border-[#B7C9D6] transition-colors cursor-pointer"
              title="Paramètres & Préférences d'apprentissage"
            >
              <Settings className="w-4 h-4" />
            </button>


            {/* User profile or Google Login */}
            {user ? (
              <div className="flex items-center gap-2 pl-2 border-l border-[#B7C9D6]">
                {user.photoURL ? (
                  <img
                    src={user.photoURL}
                    alt={user.displayName || 'Utilisateur'}
                    className="w-8 h-8 rounded-full border border-[#B7C9D6]"
                  />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-[#C5D9E9] text-[#1E2538] border border-[#B7C9D6] flex items-center justify-center font-bold text-xs">
                    {(user.displayName || user.email || 'U')[0].toUpperCase()}
                  </div>
                )}
                <div className="hidden xl:block text-left">
                  <div className="text-xs font-semibold text-[#1E2538] truncate max-w-[120px]">
                    {user.displayName || user.email?.split('@')[0]}
                  </div>
                  <div className="text-[10px] text-[#9BA7B8] flex items-center gap-1">
                    <Smartphone className="w-2.5 h-2.5 text-[#1E2538]" />
                    PC & Mobile
                  </div>
                </div>
                <button
                  onClick={logout}
                  className="p-1.5 text-[#9BA7B8] hover:text-[#1E2538] hover:bg-[#C5D9E9] rounded-lg transition-colors cursor-pointer"
                  title="Déconnexion"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <GoogleSignInButton label="Connexion" className="text-xs py-1.5 px-3" />
            )}
          </div>
        </div>
      </header>

      {/* Mobile Bottom Navigation Bar (optimized for Android touch screen) */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#F4F7F9]/95 backdrop-blur-lg border-t border-[#B7C9D6] px-2 py-1.5 flex items-center justify-around">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onTabChange(item.id)}
              className={`flex flex-col items-center gap-1 py-1 px-2 rounded-xl transition-all cursor-pointer ${
                isActive
                  ? 'text-[#1E2538] font-bold'
                  : 'text-[#9BA7B8] hover:text-[#1E2538]'
              }`}
            >
              <div className={`p-1.5 rounded-lg ${isActive ? 'bg-[#C5D9E9]' : ''}`}>
                <Icon className="w-4 h-4" />
              </div>
              <span className="text-[10px] leading-none">{item.label.split(' ')[0]}</span>
            </button>
          );
        })}
      </nav>
    </>
  );
};
