import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { ViewTab, UserProfile, Mission, Subject, ClassSession, DayOfWeek } from './types';
import {
  localStore,
  calculateStudyStreak,
  getInitialMissions,
  DEFAULT_SUBJECTS,
} from './lib/supabase';
import { useScrollMorph } from './components/particles/useScrollMorph';
import { ParticleScene } from './components/particles/ParticleScene';
import { ClickBurstOverlay } from './components/particles/ClickBurst';
import { LandingPage } from './components/landing/LandingPage';
import { AuthModal } from './components/auth/AuthModal';
import { Sidebar } from './components/common/Sidebar';
import { MissionControl } from './components/dashboard/MissionControl';
import { MissionsList } from './components/missions/MissionsList';
import { OrbitCalendar } from './components/calendar/OrbitCalendar';
import { ClassTimetable } from './components/timetable/ClassTimetable';
import { ProgressTracker } from './components/progress/ProgressTracker';
import { ProfileView } from './components/profile/ProfileView';
import { MissionModal } from './components/missions/MissionModal';
import { AstraCopilotModal } from './components/gemini/AstraCopilotModal';
import { StudyGroupsView } from './components/groups/StudyGroupsView';
import { ToastProvider, useToast } from './components/common/Toast';
import { getStoredClasses } from './lib/timetable';
import { DeepFocusChamber } from './components/focus/DeepFocusChamber';

function AppContent() {
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(() => localStore.getUser());
  const [currentTab, setCurrentTab] = useState<ViewTab>('dashboard');
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState<'login' | 'signup'>('login');

  // Mission management state
  const [missions, setMissions] = useState<Mission[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [isMissionModalOpen, setIsMissionModalOpen] = useState(false);
  const [editingMission, setEditingMission] = useState<Mission | null>(null);
  const [modalInitialDate, setModalInitialDate] = useState<Date | null>(null);

  // Gemini AI Astra Copilot state
  const [isAstraOpen, setIsAstraOpen] = useState(false);

  // Deep Focus Chamber state (Space Theme + Ambient White Noise)
  const [isDeepFocus, setIsDeepFocus] = useState<boolean>(false);

  // Class Timetable state
  const [classes, setClasses] = useState<ClassSession[]>(() =>
    getStoredClasses(currentUser?.id || 'guest')
  );

  const { addToast } = useToast();
  const scrollState = useScrollMorph();

  // Load data when user changes
  useEffect(() => {
    if (currentUser) {
      const userSubs = localStore.getSubjects(currentUser.id);
      const userMissions = localStore.getMissions(currentUser.id);
      setSubjects(userSubs);
      setMissions(userMissions);
      setClasses(getStoredClasses(currentUser.id));
    }
  }, [currentUser]);

  // Synchronize Bright Theme vs Deep Focus Space Theme
  useEffect(() => {
    if (currentUser && !isDeepFocus) {
      document.documentElement.classList.add('theme-light-auth');
      document.body.classList.add('theme-light-auth');
    } else {
      document.documentElement.classList.remove('theme-light-auth');
      document.body.classList.remove('theme-light-auth');
    }
  }, [currentUser, isDeepFocus]);

  // Keyboard shortcut: Escape exits Deep Focus
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isDeepFocus) {
        setIsDeepFocus(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isDeepFocus]);

  // Plan mission directly into identified free slot
  const handlePlanMissionInSlot = (
    day: DayOfWeek,
    startTime: string,
    durationMinutes: number
  ) => {
    const days: DayOfWeek[] = [
      'Sunday',
      'Monday',
      'Tuesday',
      'Wednesday',
      'Thursday',
      'Friday',
      'Saturday',
    ];
    const today = new Date();
    const currentDayIdx = today.getDay();
    const targetDayIdx = days.indexOf(day);
    let daysAhead = targetDayIdx - currentDayIdx;
    if (daysAhead < 0) daysAhead += 7;

    const targetDate = new Date(today);
    targetDate.setDate(today.getDate() + daysAhead);
    const [h, m] = startTime.split(':').map(Number);
    targetDate.setHours(h, m, 0, 0);

    setEditingMission({
      id: '',
      user_id: currentUser?.id || 'guest',
      title: `Study Session (${startTime})`,
      description: `Scheduled ${durationMinutes} min study block in open timetable slot`,
      subject_id: subjects[0]?.id || '',
      deadline: targetDate.toISOString(),
      priority: 'High',
      status: 'Pending',
      created_at: new Date().toISOString(),
    });
    setModalInitialDate(targetDate);
    setIsMissionModalOpen(true);
  };

  // Save changes
  const saveMissions = useCallback((newMissions: Mission[]) => {
    setMissions(newMissions);
    if (currentUser) {
      localStore.setMissions(currentUser.id, newMissions);
    }
  }, [currentUser]);

  const saveSubjects = useCallback((newSubjects: Subject[]) => {
    setSubjects(newSubjects);
    if (currentUser) {
      localStore.setSubjects(currentUser.id, newSubjects);
    }
  }, [currentUser]);

  // Calculate live study streak
  const streak = useMemo(() => {
    return calculateStudyStreak(missions);
  }, [missions]);

  // Auth Handlers
  const handleOpenAuth = (mode: 'login' | 'signup') => {
    setAuthModalMode(mode);
    setAuthModalOpen(true);
  };

  const handleLaunchGuest = () => {
    const guestUser: UserProfile = {
      id: 'commander-guest',
      email: 'flight.cadet@starfleet.edu',
      name: 'Cadet Commander',
      streak_days: 6,
    };
    localStore.setUser(guestUser);
    setCurrentUser(guestUser);
    addToast('Orbital Insertion Complete. Welcome to Mission Control!', 'success');
  };

  const handleAuthSuccess = (user: UserProfile) => {
    setCurrentUser(user);
    addToast(`Commander ${user.name} logged in successfully.`, 'success');
  };

  const handleLogout = () => {
    setIsDeepFocus(false);
    localStore.setUser(null);
    setCurrentUser(null);
    addToast('Flight session terminated. Secure orbit maintained.', 'info');
  };

  // Mission Actions
  const handleSaveMission = (missionData: Partial<Mission>) => {
    if (!currentUser) return;

    if (missionData.id) {
      const updated = missions.map((m) =>
        m.id === missionData.id ? ({ ...m, ...missionData } as Mission) : m
      );
      saveMissions(updated);
      addToast('Mission trajectory recalibrated successfully.', 'success');
    } else {
      const newMission: Mission = {
        id: 'm-' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
        user_id: currentUser.id,
        title: missionData.title || 'Untitled Mission',
        description: missionData.description,
        subject_id: missionData.subject_id,
        deadline: missionData.deadline || new Date().toISOString(),
        priority: missionData.priority || 'Medium',
        status: missionData.status || 'Pending',
        completed_at: missionData.status === 'Completed' ? new Date().toISOString() : null,
        created_at: new Date().toISOString(),
      };
      saveMissions([newMission, ...missions]);
      addToast(`Mission "${newMission.title}" scheduled for launch!`, 'success');
    }
  };

  const handleDeleteMission = (id: string) => {
    const updated = missions.filter((m) => m.id !== id);
    saveMissions(updated);
    addToast('Mission flight plan aborted and removed.', 'warning');
  };

  const handleToggleComplete = (id: string) => {
    const target = missions.find((m) => m.id === id);
    if (!target) return;

    const willBeCompleted = target.status !== 'Completed';
    const updated = missions.map((m) => {
      if (m.id === id) {
        return {
          ...m,
          status: (willBeCompleted ? 'Completed' : 'Pending') as Mission['status'],
          completed_at: willBeCompleted ? new Date().toISOString() : null,
        };
      }
      return m;
    });

    saveMissions(updated);

    if (willBeCompleted) {
      addToast(`Mission Accomplished: "${target.title}"! Orbit achieved.`, 'success');
    } else {
      addToast(`Mission reactivated to Pending thrusters.`, 'info');
    }
  };

  // Subjects / Orbits Actions
  const handleAddSubject = (name: string, color: string) => {
    if (!currentUser) return;
    const newSub: Subject = {
      id: 'subj-' + Date.now().toString(36),
      user_id: currentUser.id,
      name,
      color,
      created_at: new Date().toISOString(),
    };
    saveSubjects([...subjects, newSub]);
    addToast(`New Orbit "${name}" established.`, 'success');
  };

  const handleDeleteSubject = (id: string) => {
    const updated = subjects.filter((s) => s.id !== id);
    saveSubjects(updated);
    addToast('Orbit subject deleted.', 'info');
  };

  const handleResetData = () => {
    if (!currentUser) return;
    const initialMissions = getInitialMissions(currentUser.id);
    const initialSubs = DEFAULT_SUBJECTS.map((s) => ({ ...s, user_id: currentUser.id }));
    saveMissions(initialMissions);
    saveSubjects(initialSubs);
    addToast('Telemetry reset to starter demonstration missions.', 'info');
  };

  const openCreateForDate = (date: Date) => {
    setEditingMission(null);
    setModalInitialDate(date);
    setIsMissionModalOpen(true);
  };

  const openCreate = () => {
    setEditingMission(null);
    setModalInitialDate(null);
    setIsMissionModalOpen(true);
  };

  const openEdit = (m: Mission) => {
    setEditingMission(m);
    setModalInitialDate(null);
    setIsMissionModalOpen(true);
  };

  // Create Mission from Astra Copilot
  const handleCreateMissionFromAstra = (title: string, description: string) => {
    if (!currentUser) {
      handleLaunchGuest();
    }
    setEditingMission({
      id: '',
      user_id: currentUser?.id || 'guest',
      title,
      description,
      subject_id: subjects[0]?.id || '',
      deadline: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
      priority: 'High',
      status: 'Pending',
      created_at: new Date().toISOString(),
    });
    setModalInitialDate(new Date(Date.now() + 2 * 24 * 60 * 60 * 1000));
    setIsMissionModalOpen(true);
  };

  return (
    <div
      className={
        currentUser && !isDeepFocus
          ? 'min-h-screen bg-slate-50 text-slate-900 selection:bg-black selection:text-white theme-light-auth'
          : 'min-h-screen bg-[#000000] text-white selection:bg-[#38bdf8] selection:text-[#000000]'
      }
    >
      {/* 3D Cosmic Starfield Background with White Glowing Stars (Landing Page & Deep Focus Space Mode) */}
      {(!currentUser || isDeepFocus) && (
        <ParticleScene scrollState={scrollState} ambientOnly={isDeepFocus} />
      )}

      {!currentUser ? (
        /* Public Landing Page */
        <div className="relative z-10">
          <LandingPage
            onOpenAuth={handleOpenAuth}
            onLaunchGuest={handleLaunchGuest}
            onOpenAstraCopilot={() => setIsAstraOpen(true)}
            scrollState={scrollState}
          />
          <AuthModal
            isOpen={authModalOpen}
            initialMode={authModalMode}
            onClose={() => setAuthModalOpen(false)}
            onSuccess={handleAuthSuccess}
          />
        </div>
      ) : isDeepFocus ? (
        /* Dedicated Space Deep Focus Chamber (Zero clutter, cosmic theme, ambient white noise) */
        <DeepFocusChamber
          missions={missions}
          subjects={subjects}
          streak={streak}
          onExitDeepFocus={() => setIsDeepFocus(false)}
          onCompleteMission={handleToggleComplete}
          onAddQuickMission={(title) => {
            handleSaveMission({
              title,
              description: 'Captured during Deep Focus space sprint',
              priority: 'Medium',
              status: 'Completed',
            });
          }}
        />
      ) : (
        /* Authenticated App Shell (Bright White with Black Tone) */
        <div className="min-h-screen flex bg-slate-50 relative z-10 text-slate-900">
          {/* Sidebar & Mobile Nav */}
          <Sidebar
            currentTab={currentTab}
            onSelectTab={setCurrentTab}
            user={currentUser}
            streak={streak}
            onLogout={handleLogout}
            onOpenCreateMission={openCreate}
            onOpenAstraCopilot={() => setIsAstraOpen(true)}
            onEnterDeepFocus={() => setIsDeepFocus(true)}
          />

          {/* Main Dashboard & Feature Panels */}
          <main className="flex-1 lg:pl-64 pt-16 lg:pt-0 pb-20 lg:pb-12 min-h-screen relative z-10">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-8">
              {currentTab === 'dashboard' && (
                <MissionControl
                  missions={missions}
                  subjects={subjects}
                  streak={streak}
                  classes={classes}
                  onNavigateToMissions={() => setCurrentTab('missions')}
                  onNavigateToTimetable={() => setCurrentTab('timetable')}
                  onNavigateToGroups={() => setCurrentTab('groups')}
                  onOpenMission={openEdit}
                  onOpenCreate={openCreate}
                  onEnterDeepFocus={() => setIsDeepFocus(true)}
                />
              )}

              {currentTab === 'timetable' && (
                <ClassTimetable
                  classes={classes}
                  onUpdateClasses={setClasses}
                  subjects={subjects}
                  onPlanMissionInSlot={handlePlanMissionInSlot}
                  onToast={addToast}
                />
              )}

              {currentTab === 'missions' && (
                <MissionsList
                  missions={missions}
                  subjects={subjects}
                  onToggleComplete={handleToggleComplete}
                  onEditMission={openEdit}
                  onOpenCreate={openCreate}
                />
              )}

              {currentTab === 'calendar' && (
                <OrbitCalendar
                  missions={missions}
                  subjects={subjects}
                  onSelectMission={openEdit}
                  onOpenCreateForDate={openCreateForDate}
                />
              )}

              {currentTab === 'groups' && currentUser && (
                <StudyGroupsView
                  currentUser={currentUser}
                  subjects={subjects}
                  onToast={addToast}
                />
              )}

              {currentTab === 'progress' && (
                <ProgressTracker
                  missions={missions}
                  subjects={subjects}
                  onToggleComplete={handleToggleComplete}
                  onEditMission={openEdit}
                />
              )}

              {currentTab === 'profile' && (
                <ProfileView
                  user={currentUser}
                  subjects={subjects}
                  missions={missions}
                  streak={streak}
                  onAddSubject={handleAddSubject}
                  onDeleteSubject={handleDeleteSubject}
                  onResetData={handleResetData}
                  onLogout={handleLogout}
                  onToast={addToast}
                />
              )}
            </div>
          </main>

          {/* Mission Creation / Editing Modal */}
          <MissionModal
            isOpen={isMissionModalOpen}
            onClose={() => setIsMissionModalOpen(false)}
            onSave={handleSaveMission}
            onDelete={handleDeleteMission}
            editingMission={editingMission}
            subjects={subjects}
            initialDate={modalInitialDate}
          />
        </div>
      )}

      {/* Gemini AI Astra Flight Copilot Modal (Global, opens anywhere) */}
      <AstraCopilotModal
        isOpen={isAstraOpen}
        onClose={() => setIsAstraOpen(false)}
        subjects={subjects}
        onCreateMissionFromText={handleCreateMissionFromAstra}
      />
    </div>
  );
}

export default function App() {
  return (
    <ToastProvider>
      <AppContent />
    </ToastProvider>
  );
}
