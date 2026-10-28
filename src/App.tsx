import React, { useState } from 'react';
import { AuthProvider } from './context/AuthContext';
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
import { SubjectId } from './types';

function MainApp() {
  const [currentTab, setCurrentTab] = useState<NavTab>('dashboard');
  const [selectedSubject, setSelectedSubject] = useState<SubjectId>('c');

  // Modals
  const [isReorganizeOpen, setIsReorganizeOpen] = useState(false);
  const [isAvailabilityOpen, setIsAvailabilityOpen] = useState(false);
  const [isDailyReviewOpen, setIsDailyReviewOpen] = useState(false);

  // Focus target parameters
  const [focusSubject, setFocusSubject] = useState<SubjectId | undefined>(undefined);
  const [focusModuleId, setFocusModuleId] = useState<string | undefined>(undefined);
  const [focusExerciseId, setFocusExerciseId] = useState<string | undefined>(undefined);

  // Exercise filters
  const [exSubject, setExSubject] = useState<SubjectId | undefined>(undefined);
  const [exModuleId, setExModuleId] = useState<string | undefined>(undefined);

  const todayStr = new Date().toISOString().split('T')[0];

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
        onOpenReorganize={() => setIsReorganizeOpen(true)}
        onOpenDailyReview={() => setIsDailyReviewOpen(true)}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-20 md:pb-8">
        {currentTab === 'dashboard' && (
          <DashboardView
            onOpenReorganize={() => setIsReorganizeOpen(true)}
            onOpenAvailability={() => setIsAvailabilityOpen(true)}
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
            onOpenReorganize={() => setIsReorganizeOpen(true)}
            onOpenAvailability={() => setIsAvailabilityOpen(true)}
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
        selectedDate={todayStr}
      />

      <AvailabilityModal
        isOpen={isAvailabilityOpen}
        onClose={() => setIsAvailabilityOpen(false)}
        defaultDate={todayStr}
      />

      <DailyReviewModal
        isOpen={isDailyReviewOpen}
        onClose={() => setIsDailyReviewOpen(false)}
        selectedDate={todayStr}
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
