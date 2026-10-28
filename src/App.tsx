import React, { useState } from 'react';
import { ExternalLink, ShieldAlert, AlertCircle, X, RefreshCw } from 'lucide-react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { DataProvider } from './context/DataContext';
import { Navbar, NavTab } from './components/Navbar';
import { DashboardView } from './components/DashboardView';
import { SubjectsView } from './components/SubjectsView';
import { ExercisesView } from './components/ExercisesView';
import { PlanningView } from './components/PlanningView';
import { FocusModeView } from './components/FocusModeView';
import { ProgressView } from './components/ProgressView';
import { ReorganizeModal } from './components/ReorganizeModal';
import { AvailabilityModal } from './components/AvailabilityModal';
import { DailyReviewModal } from './components/DailyReviewModal';
import { OfflineIndicator } from './components/OfflineIndicator';
import { SyncStatusModal } from './components/SyncStatusModal';
import { SettingsModal } from './components/SettingsModal';
import { SubjectId } from './types';

function MainApp() {
  const { authError, tokenServiceNotice, clearAuthError, dismissTokenServiceNotice, logout, retryTokenValidation } = useAuth();
  const [currentTab, setCurrentTab] = useState<NavTab>('dashboard');
  const [selectedSubject, setSelectedSubject] = useState<SubjectId>('c');
  const [isRetryingToken, setIsRetryingToken] = useState(false);

  // Modals
  const [isReorganizeOpen, setIsReorganizeOpen] = useState(false);
  const [isAvailabilityOpen, setIsAvailabilityOpen] = useState(false);
  const [isDailyReviewOpen, setIsDailyReviewOpen] = useState(false);
  const [isSyncStatusOpen, setIsSyncStatusOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const todayStr = new Date().toISOString().split('T')[0];
  const [targetModalDate, setTargetModalDate] = useState<string>(todayStr);


  const handleOpenAvailability = (date?: string) => {
    setTargetModalDate(date || todayStr);
    setIsAvailabilityOpen(true);
  };

  const handleOpenReorganize = (date?: string) => {
    setTargetModalDate(date || todayStr);
    setIsReorganizeOpen(true);
  };

  const handleRetryToken = async () => {
    setIsRetryingToken(true);
    await retryTokenValidation();
    setIsRetryingToken(false);
  };

  // Focus target parameters
  const [focusSubject, setFocusSubject] = useState<SubjectId | undefined>(undefined);
  const [focusModuleId, setFocusModuleId] = useState<string | undefined>(undefined);
  const [focusExerciseId, setFocusExerciseId] = useState<string | undefined>(undefined);

  // Exercise filters
  const [exSubject, setExSubject] = useState<SubjectId | undefined>(undefined);
  const [exModuleId, setExModuleId] = useState<string | undefined>(undefined);

  const handleLaunchFocus = (subject?: SubjectId, moduleId?: string, exerciseId?: string) => {
    setFocusSubject(subject);
    setFocusModuleId(moduleId);
    setFocusExerciseId(exerciseId);
    setCurrentTab('focus');
  };

  const handleSelectSubject = (subject: SubjectId) => {
    setSelectedSubject(subject);
    setCurrentTab('subjects');
  };

  const handleNavigateToExercisesForModule = (subject: SubjectId, moduleId: string) => {
    setExSubject(subject);
    setExModuleId(moduleId);
    setCurrentTab('exercises');
  };

  return (
    <div className="min-h-screen bg-[#F4F7F9] text-[#1E2538] flex flex-col font-sans selection:bg-[#C5D9E9] selection:text-[#1E2538]">
      {/* Offline Alert */}
      <OfflineIndicator />

      {/* Cloud Token Service Notice Banner */}
      {tokenServiceNotice && (
        <div className="bg-[#D9E8F4] text-[#1E2538] border-b border-[#B7C9D6] px-4 py-2.5 text-xs flex flex-wrap items-center justify-between gap-3 shadow-xs">
          <div className="flex items-center gap-2 flex-1 min-w-[280px]">
            <ShieldAlert className="w-4 h-4 text-[#1E2538] shrink-0" />
            <span>
              <strong>Synchronisation Cloud :</strong> Activez le service Google Secure Token sur votre projet GCP (867733881087) pour synchroniser vos appareils. Vos données locales sont 100% conservées et utilisables.
            </span>
          </div>
          <div className="flex items-center gap-2">
            <a
              href={tokenServiceNotice}
              target="_blank"
              rel="noopener noreferrer"
              className="px-3 py-1 bg-[#1E2538] text-white hover:bg-[#2C3652] rounded-lg font-medium transition-colors text-xs flex items-center gap-1.5"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>Activer l'API Google Cloud</span>
            </a>
            <button
              onClick={handleRetryToken}
              disabled={isRetryingToken}
              className="px-2.5 py-1 bg-[#C5D9E9] hover:bg-[#B7C9D6] text-[#1E2538] rounded-lg font-medium transition-colors text-xs flex items-center gap-1 cursor-pointer disabled:opacity-50"
              title="Tester si l'API est maintenant activée"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRetryingToken ? 'animate-spin' : ''}`} />
              <span>Tester</span>
            </button>
            <button
              onClick={() => {
                logout();
                dismissTokenServiceNotice();
              }}
              className="px-2.5 py-1 bg-white hover:bg-[#C5D9E9] text-[#1E2538] border border-[#B7C9D6] rounded-lg font-medium transition-colors text-xs cursor-pointer"
              title="Passer en mode local sans synchronisation cloud"
            >
              Mode local
            </button>
            <button
              onClick={dismissTokenServiceNotice}
              className="p-1 hover:bg-[#C5D9E9] rounded text-[#1E2538] transition-colors cursor-pointer"
              title="Masquer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Authentication Notice Banner */}
      {authError && (
        <div className="bg-[#F4F7F9] text-[#1E2538] border-b border-[#B7C9D6] px-4 py-2.5 text-xs flex items-center justify-between gap-2 shadow-xs">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-[#1E2538] shrink-0" />
            <span>{authError}</span>
          </div>
          <button
            onClick={clearAuthError}
            className="p-1 hover:bg-[#D9E8F4] rounded text-[#9BA7B8] hover:text-[#1E2538] transition-colors cursor-pointer"
            title="Fermer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Navigation Bar */}
      <Navbar
        currentTab={currentTab}
        onTabChange={(tab) => {
          if (tab !== 'focus') {
            setFocusSubject(undefined);
            setFocusModuleId(undefined);
            setFocusExerciseId(undefined);
          }
          if (tab !== 'exercises') {
            setExSubject(undefined);
            setExModuleId(undefined);
          }
          setCurrentTab(tab);
        }}
        onOpenReorganize={() => handleOpenReorganize(todayStr)}
        onOpenDailyReview={() => setIsDailyReviewOpen(true)}
        onOpenSyncStatus={() => setIsSyncStatusOpen(true)}
        onOpenSettings={() => setIsSettingsOpen(true)}
      />


      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-20 md:pb-8">
        {currentTab === 'dashboard' && (
          <DashboardView
            onOpenReorganize={() => handleOpenReorganize(todayStr)}
            onOpenAvailability={() => handleOpenAvailability(todayStr)}
            onOpenDailyReview={() => setIsDailyReviewOpen(true)}
            onSelectSubject={handleSelectSubject}
            onNavigateToExercises={() => setCurrentTab('exercises')}
            onNavigateToPlanning={() => setCurrentTab('planning')}
            onNavigateToFocus={handleLaunchFocus}
          />
        )}

        {currentTab === 'subjects' && (
          <SubjectsView
            selectedSubject={selectedSubject}
            onSelectSubject={setSelectedSubject}
            onNavigateToExercisesForModule={handleNavigateToExercisesForModule}
          />
        )}

        {currentTab === 'exercises' && (
          <ExercisesView
            initialSubject={exSubject}
            initialModuleId={exModuleId}
            onStartFocusSession={handleLaunchFocus}
          />
        )}

        {currentTab === 'planning' && (
          <PlanningView
            onOpenReorganize={(d) => handleOpenReorganize(d)}
            onOpenAvailability={(d) => handleOpenAvailability(d)}
            onStartFocus={handleLaunchFocus}
          />
        )}

        {currentTab === 'focus' && (
          <FocusModeView
            initialSubject={focusSubject}
            initialModuleId={focusModuleId}
            initialExerciseId={focusExerciseId}
          />
        )}

        {currentTab === 'progress' && <ProgressView />}
      </main>

      {/* Modals */}
      <ReorganizeModal
        isOpen={isReorganizeOpen}
        onClose={() => setIsReorganizeOpen(false)}
        selectedDate={targetModalDate}
      />

      <AvailabilityModal
        isOpen={isAvailabilityOpen}
        onClose={() => setIsAvailabilityOpen(false)}
        defaultDate={targetModalDate}
      />

      <DailyReviewModal
        isOpen={isDailyReviewOpen}
        onClose={() => setIsDailyReviewOpen(false)}
        selectedDate={todayStr}
      />

      <SyncStatusModal
        isOpen={isSyncStatusOpen}
        onClose={() => setIsSyncStatusOpen(false)}
      />

      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
      />
    </div>

  );
}

export default function App() {
  return (
    <AuthProvider>
      <DataProvider>
        <MainApp />
      </DataProvider>
    </AuthProvider>
  );
}
