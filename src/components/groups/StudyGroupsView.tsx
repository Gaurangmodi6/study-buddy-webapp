import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Users,
  Plus,
  Target,
  CheckCircle2,
  Clock,
  Share2,
  Copy,
  Check,
  Flame,
  Rocket,
  Sparkles,
  ArrowRight,
  UserPlus,
  AlertCircle,
  TrendingUp,
  MessageSquare,
  BookOpen,
  Filter,
  Shield,
} from 'lucide-react';
import { StudyGroup, GroupMember, GroupGoal, GroupTask, Priority, Subject } from '../../types';
import {
  loadStoredGroups,
  saveStoredGroups,
  createNewStudyGroup,
  joinGroupByCode,
} from '../../lib/groups';
import { sound } from '../../lib/audio';
import { triggerMissionAccomplishedBurst } from '../particles/ClickBurst';

interface StudyGroupsViewProps {
  currentUser: { id: string; name: string };
  subjects: Subject[];
  onToast: (message: string, type: 'success' | 'error' | 'info') => void;
}

export const StudyGroupsView: React.FC<StudyGroupsViewProps> = ({
  currentUser,
  subjects,
  onToast,
}) => {
  const [groups, setGroups] = useState<StudyGroup[]>(() => loadStoredGroups());
  const [activeGroupId, setActiveGroupId] = useState<string>(() => groups[0]?.id || '');
  const [activeTab, setActiveTab] = useState<'goals' | 'tasks' | 'members'>('goals');
  const [copiedCode, setCopiedCode] = useState(false);

  // Modals
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isJoinModalOpen, setIsJoinModalOpen] = useState(false);
  const [isAddGoalModalOpen, setIsAddGoalModalOpen] = useState(false);
  const [isAddTaskModalOpen, setIsAddTaskModalOpen] = useState(false);

  // New Group Form
  const [newGroupName, setNewGroupName] = useState('');
  const [newGroupDesc, setNewGroupDesc] = useState('');

  // Join Group Form
  const [joinCodeInput, setJoinCodeInput] = useState('');

  // New Goal Form
  const [goalTitle, setGoalTitle] = useState('');
  const [goalTarget, setGoalTarget] = useState(10);
  const [goalUnit, setGoalUnit] = useState('tasks');
  const [goalDeadline, setGoalDeadline] = useState('');

  // New Task Form
  const [taskTitle, setTaskTitle] = useState('');
  const [taskDesc, setTaskDesc] = useState('');
  const [taskSubject, setTaskSubject] = useState(subjects[0]?.name || 'General');
  const [taskPriority, setTaskPriority] = useState<Priority>('High');
  const [taskDeadline, setTaskDeadline] = useState('');
  const [taskAssignee, setTaskAssignee] = useState(currentUser.name);

  // Task Filter
  const [taskFilter, setTaskFilter] = useState<'all' | 'mine' | 'completed'>('all');

  const activeGroup = useMemo(() => {
    return groups.find((g) => g.id === activeGroupId) || groups[0];
  }, [groups, activeGroupId]);

  const updateActiveGroup = (updater: (prev: StudyGroup) => StudyGroup) => {
    if (!activeGroup) return;
    const updated = updater(activeGroup);
    const newGroups = groups.map((g) => (g.id === updated.id ? updated : g));
    setGroups(newGroups);
    saveStoredGroups(newGroups);
  };

  // Copy Squad Invite Code
  const handleCopyCode = () => {
    if (!activeGroup) return;
    navigator.clipboard.writeText(activeGroup.code);
    setCopiedCode(true);
    sound.playClick();
    onToast(`Group code ${activeGroup.code} copied! Share it with your friends.`, 'success');
    setTimeout(() => setCopiedCode(false), 2500);
  };

  // Create Group
  const handleCreateGroup = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGroupName.trim()) {
      onToast('Please enter a group name', 'error');
      return;
    }
    const created = createNewStudyGroup(newGroupName, newGroupDesc, currentUser.name);
    setGroups(loadStoredGroups());
    setActiveGroupId(created.id);
    setIsCreateModalOpen(false);
    setNewGroupName('');
    setNewGroupDesc('');
    sound.taskComplete();
    onToast(`Study group "${created.name}" created!`, 'success');
  };

  // Join Group
  const handleJoinGroup = (e: React.FormEvent) => {
    e.preventDefault();
    if (!joinCodeInput.trim()) {
      onToast('Please enter a squad code', 'error');
      return;
    }
    const res = joinGroupByCode(joinCodeInput, currentUser.name);
    if (res.success && res.group) {
      setGroups(loadStoredGroups());
      setActiveGroupId(res.group.id);
      setIsJoinModalOpen(false);
      setJoinCodeInput('');
      sound.taskComplete();
      onToast(res.message, 'success');
    } else {
      sound.playClick();
      onToast(res.message, 'error');
    }
  };

  // Add Goal
  const handleAddGoal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!goalTitle.trim()) {
      onToast('Please enter a goal title', 'error');
      return;
    }
    const newGoal: GroupGoal = {
      id: `goal-${Date.now()}`,
      groupId: activeGroup.id,
      title: goalTitle.trim(),
      targetValue: Number(goalTarget) || 10,
      currentValue: 0,
      unit: goalUnit || 'tasks',
      deadline: goalDeadline || undefined,
      completed: false,
      createdByName: currentUser.name,
    };

    updateActiveGroup((prev) => ({
      ...prev,
      goals: [newGoal, ...prev.goals],
    }));

    setIsAddGoalModalOpen(false);
    setGoalTitle('');
    sound.playClick();
    onToast(`Shared goal "${newGoal.title}" added to the group!`, 'success');
  };

  // Increment Goal Progress
  const handleIncrementGoal = (goalId: string) => {
    sound.playClick();
    updateActiveGroup((prev) => ({
      ...prev,
      goals: prev.goals.map((g) => {
        if (g.id !== goalId) return g;
        const nextVal = g.currentValue + 1;
        const isDone = nextVal >= g.targetValue;
        if (isDone && !g.completed) {
          triggerMissionAccomplishedBurst();
          onToast(`🎉 Group Goal Accomplished: "${g.title}"!`, 'success');
        }
        return {
          ...g,
          currentValue: nextVal,
          completed: isDone,
        };
      }),
    }));
  };

  // Add Task to Group
  const handleAddTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!taskTitle.trim()) {
      onToast('Please enter a task title', 'error');
      return;
    }

    const newTask: GroupTask = {
      id: `gtask-${Date.now()}`,
      groupId: activeGroup.id,
      title: taskTitle.trim(),
      description: taskDesc.trim() || undefined,
      subject: taskSubject,
      assignedToName: taskAssignee,
      createdByName: currentUser.name,
      priority: taskPriority,
      deadline: taskDeadline || new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
      completed: false,
      cheersCount: 0,
    };

    updateActiveGroup((prev) => ({
      ...prev,
      tasks: [newTask, ...prev.tasks],
    }));

    setIsAddTaskModalOpen(false);
    setTaskTitle('');
    setTaskDesc('');
    sound.playClick();
    onToast(`Task shared with group: "${newTask.title}"!`, 'success');
  };

  // Toggle Task Completion
  const handleToggleTask = (task: GroupTask) => {
    const isNowComplete = !task.completed;
    if (isNowComplete) {
      triggerMissionAccomplishedBurst();
      onToast(`🎉 Task completed: "${task.title}"!`, 'success');
    } else {
      sound.playClick();
    }

    updateActiveGroup((prev) => ({
      ...prev,
      tasks: prev.tasks.map((t) =>
        t.id === task.id
          ? {
              ...t,
              completed: isNowComplete,
              completedAt: isNowComplete ? new Date().toISOString() : undefined,
            }
          : t
      ),
      members: prev.members.map((m) => {
        if (m.name.toLowerCase().includes(currentUser.name.toLowerCase())) {
          return {
            ...m,
            completedTasksCount: isNowComplete
              ? m.completedTasksCount + 1
              : Math.max(0, m.completedTasksCount - 1),
          };
        }
        return m;
      }),
    }));
  };

  // Cheer Friend's Task
  const handleCheerTask = (task: GroupTask) => {
    sound.taskComplete();
    updateActiveGroup((prev) => ({
      ...prev,
      tasks: prev.tasks.map((t) =>
        t.id === task.id ? { ...t, cheersCount: (t.cheersCount || 0) + 1 } : t
      ),
    }));
    onToast(`Cheered ${task.assignedToName || 'friend'}! 🚀`, 'info');
  };

  // Nudge Friend
  const handleNudgeFriend = (memberName: string) => {
    sound.playRocketSound(0.7);
    onToast(`Study ping sent to ${memberName}! "Let's study together during our next free time block!"`, 'success');
  };

  // Filtered Tasks
  const filteredTasks = useMemo(() => {
    if (!activeGroup) return [];
    if (taskFilter === 'mine') {
      return activeGroup.tasks.filter(
        (t) =>
          t.assignedToName?.toLowerCase().includes(currentUser.name.toLowerCase()) ||
          t.createdByName?.toLowerCase().includes(currentUser.name.toLowerCase())
      );
    }
    if (taskFilter === 'completed') {
      return activeGroup.tasks.filter((t) => t.completed);
    }
    return activeGroup.tasks;
  }, [activeGroup, taskFilter, currentUser]);

  // Overall Goal Completion Stats
  const goalStats = useMemo(() => {
    if (!activeGroup || activeGroup.goals.length === 0) return { total: 0, completed: 0, percent: 0 };
    const total = activeGroup.goals.length;
    const completed = activeGroup.goals.filter((g) => g.completed).length;
    const percent = Math.round((completed / total) * 100);
    return { total, completed, percent };
  }, [activeGroup]);

  if (!activeGroup) {
    return (
      <div className="p-8 text-center text-white">
        <Users className="w-12 h-12 mx-auto text-sky-400 mb-3" />
        <h2 className="text-2xl font-bold font-bebas">NO STUDY GROUPS FOUND</h2>
        <p className="text-sm text-slate-300 mb-4">Create or join a study group to share goals and tasks with friends.</p>
        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="px-6 py-2.5 rounded-lg bg-white text-black font-bold text-sm"
        >
          Create Study Group
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top Header: Group Selector & Actions */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-white/15">
        <div>
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full border border-white/20 bg-black text-xs font-mono font-bold text-white mb-2">
            <span className="w-2 h-2 rounded-full bg-sky-400" />
            <span className="uppercase tracking-wider">COLLABORATIVE STUDY NETWORK</span>
          </div>
          <h1 className="font-bebas text-4xl sm:text-5xl text-white font-extrabold tracking-wide">
            SQUADRON HUB
          </h1>
          <p className="text-sm text-slate-300 font-medium">
            Create shared groups with friends using a unique Squadron ID. Track aggregated mission progress and mutual study goals together.
          </p>
        </div>

        {/* Squad Selector and New/Join Actions */}
        <div className="flex flex-wrap items-center gap-2.5">
          {groups.length > 1 && (
            <select
              value={activeGroupId}
              onChange={(e) => setActiveGroupId(e.target.value)}
              className="px-3.5 py-2.5 rounded-xl bg-black border border-white/20 text-white font-bold text-xs cursor-pointer focus:outline-none focus:border-sky-400"
            >
              {groups.map((g) => (
                <option key={g.id} value={g.id} className="bg-black text-white">
                  {g.name}
                </option>
              ))}
            </select>
          )}

          <button
            onClick={() => setIsJoinModalOpen(true)}
            className="flex items-center space-x-1.5 px-3.5 py-2.5 rounded-xl border border-sky-400/40 bg-black hover:bg-[#07132e] text-white text-xs font-bold transition-all cursor-pointer"
          >
            <UserPlus className="w-4 h-4 text-sky-400" />
            <span>Join Group</span>
          </button>

          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="flex items-center space-x-1.5 px-4 py-2.5 rounded-xl bg-white text-black hover:bg-slate-200 text-xs font-extrabold uppercase tracking-wider transition-all shadow-md cursor-pointer"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>New Group</span>
          </button>
        </div>
      </div>

      {/* Active Squad Card Header */}
      <div className="glass-panel p-6 rounded-3xl border border-white/15 bg-black/90 space-y-5">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center space-x-3">
              <h2 className="font-bebas text-3xl text-white font-bold tracking-wide">
                {activeGroup.name}
              </h2>
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-mono font-bold bg-sky-950/80 text-sky-400 border border-sky-500/40">
                {activeGroup.members.length} MEMBERS
              </span>
            </div>
            <p className="text-xs text-slate-300 font-medium max-w-2xl">
              {activeGroup.description}
            </p>
          </div>

          {/* Unique Squadron ID Badge with 1-click Copy */}
          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-2 px-3.5 py-2 rounded-xl bg-black border border-white/20">
              <div className="text-left">
                <span className="text-[9px] uppercase tracking-wider font-mono text-slate-400 font-bold block">
                  Unique Squadron ID
                </span>
                <span className="text-sm font-mono font-extrabold text-white">
                  {activeGroup.code}
                </span>
              </div>
              <button
                onClick={handleCopyCode}
                className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
                title="Copy Unique Squadron ID"
              >
                {copiedCode ? (
                  <Check className="w-4 h-4 text-emerald-400" />
                ) : (
                  <Copy className="w-4 h-4 text-sky-400" />
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Squad Key Metrics */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-4 border-t border-white/10">
          <div className="p-3.5 rounded-2xl bg-[#030712] border border-white/10">
            <div className="flex items-center space-x-1.5 text-slate-400 text-xs font-semibold mb-1">
              <Target className="w-3.5 h-3.5 text-sky-400" />
              <span>Mutual Goals Progress</span>
            </div>
            <p className="font-bebas text-2xl text-white font-bold">
              {goalStats.completed} / {goalStats.total}{' '}
              <span className="text-xs font-sans text-sky-400">({goalStats.percent}%)</span>
            </p>
          </div>

          <div className="p-3.5 rounded-2xl bg-[#030712] border border-white/10">
            <div className="flex items-center space-x-1.5 text-slate-400 text-xs font-semibold mb-1">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              <span>Missions Accomplished</span>
            </div>
            <p className="font-bebas text-2xl text-white font-bold">
              {activeGroup.tasks.filter((t) => t.completed).length}{' '}
              <span className="text-xs font-sans text-slate-400">missions</span>
            </p>
          </div>

          <div className="p-3.5 rounded-2xl bg-[#030712] border border-white/10">
            <div className="flex items-center space-x-1.5 text-slate-400 text-xs font-semibold mb-1">
              <Flame className="w-3.5 h-3.5 text-amber-400" />
              <span>Squadron Streak</span>
            </div>
            <p className="font-bebas text-2xl text-white font-bold">
              6 <span className="text-xs font-sans text-amber-400">Days Active</span>
            </p>
          </div>

          <div className="p-3.5 rounded-2xl bg-[#030712] border border-white/10">
            <div className="flex items-center space-x-1.5 text-slate-400 text-xs font-semibold mb-1">
              <Users className="w-3.5 h-3.5 text-sky-400" />
              <span>Active Friends</span>
            </div>
            <p className="font-bebas text-2xl text-white font-bold">
              {activeGroup.members.filter((m) => m.isOnline).length}{' '}
              <span className="text-xs font-sans text-emerald-400">Online Now</span>
            </p>
          </div>
        </div>
      </div>

      {/* Main Tabs Navigation */}
      <div className="flex items-center space-x-2 border-b border-white/15 pb-2">
        <button
          onClick={() => {
            sound.playClick();
            setActiveTab('goals');
          }}
          className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'goals'
              ? 'bg-white text-black font-extrabold shadow-md'
              : 'text-slate-300 hover:text-white hover:bg-white/5'
          }`}
        >
          <Target className="w-4 h-4" />
          <span>Mutual Study Goals ({activeGroup.goals.length})</span>
        </button>

        <button
          onClick={() => {
            sound.playClick();
            setActiveTab('tasks');
          }}
          className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'tasks'
              ? 'bg-white text-black font-extrabold shadow-md'
              : 'text-slate-300 hover:text-white hover:bg-white/5'
          }`}
        >
          <CheckCircle2 className="w-4 h-4" />
          <span>Shared Mission Progress ({activeGroup.tasks.length})</span>
        </button>

        <button
          onClick={() => {
            sound.playClick();
            setActiveTab('members');
          }}
          className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'members'
              ? 'bg-white text-black font-extrabold shadow-md'
              : 'text-slate-300 hover:text-white hover:bg-white/5'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Squadron Friends ({activeGroup.members.length})</span>
        </button>
      </div>

      {/* TAB 1: SHARED GOALS */}
      {activeTab === 'goals' && (
        <div className="space-y-5">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bebas text-2xl text-white font-bold">
                COLLECTIVE SQUAD GOALS
              </h3>
              <p className="text-xs text-slate-300">
                Set milestones for your study circle. Every task completed pushes the collective needle.
              </p>
            </div>
            <button
              onClick={() => setIsAddGoalModalOpen(true)}
              className="flex items-center space-x-1.5 px-3.5 py-2 rounded-xl bg-white text-black hover:bg-slate-200 text-xs font-extrabold uppercase tracking-wide cursor-pointer shadow-sm"
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
              <span>Add Goal</span>
            </button>
          </div>

          {activeGroup.goals.length === 0 ? (
            <div className="p-8 text-center glass-panel rounded-2xl border border-white/10 space-y-2">
              <Target className="w-8 h-8 mx-auto text-sky-400/60" />
              <h4 className="text-white font-bold text-sm">No group goals yet</h4>
              <p className="text-xs text-slate-400">
                Create a milestone like "Complete 20 Problem Sets" to unite your squad.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {activeGroup.goals.map((goal) => {
                const percent = Math.min(
                  100,
                  Math.round((goal.currentValue / (goal.targetValue || 1)) * 100)
                );
                return (
                  <div
                    key={goal.id}
                    className="p-5 rounded-2xl glass-panel border border-white/15 bg-black/85 space-y-3.5 shadow-md"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="space-y-1">
                        <div className="flex items-center space-x-2">
                          <span
                            className={`w-2.5 h-2.5 rounded-full ${
                              goal.completed ? 'bg-emerald-400' : 'bg-sky-400'
                            }`}
                          />
                          <h4 className="text-base font-bold text-white leading-tight">
                            {goal.title}
                          </h4>
                        </div>
                        <p className="text-[11px] text-slate-400 font-medium">
                          Created by <span className="text-white font-semibold">{goal.createdByName}</span>
                        </p>
                      </div>

                      {goal.completed ? (
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-950 border border-emerald-500 text-emerald-300">
                          COMPLETED
                        </span>
                      ) : (
                        <button
                          onClick={() => handleIncrementGoal(goal.id)}
                          className="px-2.5 py-1 rounded-lg bg-sky-950/80 border border-sky-400/50 hover:bg-sky-900 text-sky-300 text-xs font-bold flex items-center space-x-1 cursor-pointer transition-colors"
                          title="Record 1 unit toward goal"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>+1 {goal.unit}</span>
                        </button>
                      )}
                    </div>

                    {/* Progress Bar */}
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs font-mono font-bold">
                        <span className="text-white">
                          {goal.currentValue} / {goal.targetValue} {goal.unit}
                        </span>
                        <span className="text-sky-400">{percent}%</span>
                      </div>
                      <div className="w-full h-2 rounded-full bg-slate-900 overflow-hidden border border-white/10">
                        <div
                          className={`h-full transition-all duration-500 ${
                            goal.completed
                              ? 'bg-emerald-400'
                              : 'bg-gradient-to-r from-sky-400 to-white'
                          }`}
                          style={{ width: `${percent}%` }}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: SHARED TASKS */}
      {activeTab === 'tasks' && (
        <div className="space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="font-bebas text-2xl text-white font-bold">
                SQUAD TASK BOARD
              </h3>
              <p className="text-xs text-slate-300">
                Share what you are working on, check off finished work, and cheer on your friends.
              </p>
            </div>

            <div className="flex items-center space-x-2">
              <div className="flex rounded-lg bg-black border border-white/20 p-0.5 text-xs font-bold">
                <button
                  onClick={() => setTaskFilter('all')}
                  className={`px-3 py-1 rounded-md transition-colors ${
                    taskFilter === 'all' ? 'bg-white text-black' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  All
                </button>
                <button
                  onClick={() => setTaskFilter('mine')}
                  className={`px-3 py-1 rounded-md transition-colors ${
                    taskFilter === 'mine' ? 'bg-white text-black' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Mine
                </button>
                <button
                  onClick={() => setTaskFilter('completed')}
                  className={`px-3 py-1 rounded-md transition-colors ${
                    taskFilter === 'completed'
                      ? 'bg-white text-black'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Done
                </button>
              </div>

              <button
                onClick={() => setIsAddTaskModalOpen(true)}
                className="flex items-center space-x-1.5 px-3.5 py-2 rounded-xl bg-white text-black hover:bg-slate-200 text-xs font-extrabold uppercase tracking-wide cursor-pointer shadow-sm"
              >
                <Plus className="w-4 h-4 stroke-[2.5]" />
                <span>Share Task</span>
              </button>
            </div>
          </div>

          {filteredTasks.length === 0 ? (
            <div className="p-8 text-center glass-panel rounded-2xl border border-white/10 space-y-2">
              <CheckCircle2 className="w-8 h-8 mx-auto text-sky-400/60" />
              <h4 className="text-white font-bold text-sm">No tasks in this view</h4>
              <p className="text-xs text-slate-400">
                Share a homework assignment or project deliverable with your group.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredTasks.map((t) => (
                <div
                  key={t.id}
                  className={`p-4 rounded-2xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                    t.completed
                      ? 'bg-emerald-950/20 border-emerald-500/30 opacity-75'
                      : 'bg-black/85 border-white/15 hover:border-sky-400/50'
                  }`}
                >
                  <div className="flex items-start space-x-3 truncate">
                    <button
                      onClick={() => handleToggleTask(t)}
                      className={`w-5 h-5 rounded-md border mt-0.5 flex items-center justify-center transition-colors cursor-pointer shrink-0 ${
                        t.completed
                          ? 'bg-emerald-500 border-emerald-400 text-black'
                          : 'border-white/30 hover:border-sky-400 bg-transparent'
                      }`}
                    >
                      {t.completed && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                    </button>

                    <div className="space-y-1 truncate">
                      <div className="flex flex-wrap items-center gap-2">
                        <h4
                          className={`text-sm font-bold truncate ${
                            t.completed ? 'line-through text-slate-400' : 'text-white'
                          }`}
                        >
                          {t.title}
                        </h4>
                        {t.subject && (
                          <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-sky-950/80 text-sky-300 border border-sky-500/30">
                            {t.subject}
                          </span>
                        )}
                        <span
                          className={`px-1.5 py-0.2 rounded text-[9px] font-mono font-bold uppercase ${
                            t.priority === 'Critical'
                              ? 'bg-red-950 text-red-300 border border-red-500/40'
                              : t.priority === 'High'
                              ? 'bg-amber-950 text-amber-300 border border-amber-500/40'
                              : 'bg-blue-950 text-blue-300 border border-blue-500/40'
                          }`}
                        >
                          {t.priority}
                        </span>
                      </div>
                      {t.description && (
                        <p className="text-xs text-slate-300 truncate max-w-xl">
                          {t.description}
                        </p>
                      )}
                      <div className="flex items-center space-x-3 text-[11px] text-slate-400 font-mono">
                        <span>
                          Assigned: <strong className="text-white">{t.assignedToName || 'Unassigned'}</strong>
                        </span>
                        <span>•</span>
                        <span>
                          Due:{' '}
                          <strong className="text-white">
                            {new Date(t.deadline).toLocaleDateString([], {
                              month: 'short',
                              day: 'numeric',
                            })}
                          </strong>
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Right Actions: Cheer counter */}
                  <div className="flex items-center space-x-2 shrink-0 self-end sm:self-center">
                    <button
                      onClick={() => handleCheerTask(t)}
                      className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl border border-white/20 bg-black hover:bg-white/10 text-xs font-bold text-white transition-all cursor-pointer"
                      title="Cheer your friend"
                    >
                      <Rocket className="w-3.5 h-3.5 text-sky-400" />
                      <span>{t.cheersCount || 0}</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 3: SQUAD FRIENDS */}
      {activeTab === 'members' && (
        <div className="space-y-5">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bebas text-2xl text-white font-bold">
                STUDY SQUAD FRIENDS
              </h3>
              <p className="text-xs text-slate-300">
                See what your friends are studying right now and ping them for joint review sessions.
              </p>
            </div>
            <button
              onClick={handleCopyCode}
              className="flex items-center space-x-1.5 px-3.5 py-2 rounded-xl bg-white text-black hover:bg-slate-200 text-xs font-extrabold uppercase tracking-wide cursor-pointer shadow-sm"
            >
              <Share2 className="w-4 h-4 stroke-[2.5]" />
              <span>Invite Friends</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {activeGroup.members.map((member) => (
              <div
                key={member.id}
                className="p-5 rounded-2xl glass-panel border border-white/15 bg-black/85 flex items-center justify-between gap-4"
              >
                <div className="flex items-center space-x-3.5 truncate">
                  <div className="relative">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-[#1d4ed8] via-[#2563eb] to-[#38bdf8] flex items-center justify-center text-white font-bebas text-xl font-bold shadow-md">
                      {member.name.charAt(0)}
                    </div>
                    <span
                      className={`absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full border-2 border-black ${
                        member.isOnline ? 'bg-emerald-400' : 'bg-slate-500'
                      }`}
                    />
                  </div>

                  <div className="space-y-0.5 truncate">
                    <div className="flex items-center space-x-2">
                      <h4 className="text-sm font-bold text-white truncate">{member.name}</h4>
                      {member.role === 'leader' && (
                        <span className="px-1.5 py-0.2 rounded text-[9px] font-mono font-bold bg-amber-950 text-amber-300 border border-amber-500/30">
                          FOUNDER
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-300 truncate">
                      {member.statusText || 'Active learner'}
                    </p>
                    <div className="flex items-center space-x-3 text-[11px] font-mono text-slate-400">
                      <span>
                        Tasks Done: <strong className="text-white">{member.completedTasksCount}</strong>
                      </span>
                      <span>•</span>
                      <span>
                        Streak: <strong className="text-amber-400">{member.streak}d</strong>
                      </span>
                    </div>
                  </div>
                </div>

                {!member.name.toLowerCase().includes('you') && (
                  <button
                    onClick={() => handleNudgeFriend(member.name)}
                    className="px-3 py-1.5 rounded-xl border border-sky-400/40 bg-black hover:bg-[#081533] text-sky-400 text-xs font-bold transition-all shrink-0 cursor-pointer"
                  >
                    Study Ping
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* MODAL: CREATE GROUP */}
      <AnimatePresence>
        {isCreateModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-black border border-white/20 p-6 rounded-3xl max-w-md w-full shadow-2xl space-y-4"
            >
              <div className="flex items-center justify-between pb-3 border-b border-white/10">
                <div className="flex items-center space-x-2">
                  <Users className="w-5 h-5 text-sky-400" />
                  <h3 className="font-bebas text-2xl text-white font-bold">CREATE STUDY GROUP</h3>
                </div>
                <button
                  onClick={() => setIsCreateModalOpen(false)}
                  className="text-slate-400 hover:text-white font-bold text-sm"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleCreateGroup} className="space-y-4">
                <div>
                  <label className="text-xs font-bold text-white uppercase block mb-1">
                    Group Name
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Finals Cram Crew, Physics Problem Solvers"
                    value={newGroupName}
                    onChange={(e) => setNewGroupName(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-black border border-white/20 text-white text-sm font-semibold focus:outline-none focus:border-sky-400"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-white uppercase block mb-1">
                    Description & Focus Goal
                  </label>
                  <textarea
                    rows={3}
                    placeholder="e.g. Master quantum mechanics homework and study daily during 2 PM free slot"
                    value={newGroupDesc}
                    onChange={(e) => setNewGroupDesc(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-black border border-white/20 text-white text-sm font-medium focus:outline-none focus:border-sky-400"
                  />
                </div>

                <div className="pt-2 flex items-center justify-end space-x-2">
                  <button
                    type="button"
                    onClick={() => setIsCreateModalOpen(false)}
                    className="px-4 py-2 rounded-xl border border-white/20 text-xs font-bold text-slate-300 hover:text-white"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl bg-white text-black font-extrabold text-xs uppercase tracking-wide hover:bg-slate-200"
                  >
                    Create Group
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL: JOIN GROUP */}
      <AnimatePresence>
        {isJoinModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-black border border-white/20 p-6 rounded-3xl max-w-md w-full shadow-2xl space-y-4"
            >
              <div className="flex items-center justify-between pb-3 border-b border-white/10">
                <div className="flex items-center space-x-2">
                  <UserPlus className="w-5 h-5 text-sky-400" />
                  <h3 className="font-bebas text-2xl text-white font-bold">JOIN SQUAD WITH CODE</h3>
                </div>
                <button
                  onClick={() => setIsJoinModalOpen(false)}
                  className="text-slate-400 hover:text-white font-bold text-sm"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleJoinGroup} className="space-y-4">
                <div>
                  <label className="text-xs font-bold text-white uppercase block mb-1">
                    Squad Invite Code
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. SQUAD-409"
                    value={joinCodeInput}
                    onChange={(e) => setJoinCodeInput(e.target.value.toUpperCase())}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-black border border-white/20 text-white text-base font-mono font-bold tracking-widest text-center uppercase focus:outline-none focus:border-sky-400"
                  />
                  <p className="text-[11px] text-slate-400 mt-1.5">
                    Ask your friend for their 8-character squad invite code.
                  </p>
                </div>

                <div className="pt-2 flex items-center justify-end space-x-2">
                  <button
                    type="button"
                    onClick={() => setIsJoinModalOpen(false)}
                    className="px-4 py-2 rounded-xl border border-white/20 text-xs font-bold text-slate-300 hover:text-white"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl bg-white text-black font-extrabold text-xs uppercase tracking-wide hover:bg-slate-200"
                  >
                    Join Squad
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL: ADD GOAL */}
      <AnimatePresence>
        {isAddGoalModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-black border border-white/20 p-6 rounded-3xl max-w-md w-full shadow-2xl space-y-4"
            >
              <div className="flex items-center justify-between pb-3 border-b border-white/10">
                <div className="flex items-center space-x-2">
                  <Target className="w-5 h-5 text-sky-400" />
                  <h3 className="font-bebas text-2xl text-white font-bold">ADD COLLECTIVE GOAL</h3>
                </div>
                <button
                  onClick={() => setIsAddGoalModalOpen(false)}
                  className="text-slate-400 hover:text-white font-bold text-sm"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleAddGoal} className="space-y-4">
                <div>
                  <label className="text-xs font-bold text-white uppercase block mb-1">
                    Goal Title
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Complete 25 Calculus Questions, Log 30 Hours"
                    value={goalTitle}
                    onChange={(e) => setGoalTitle(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-black border border-white/20 text-white text-sm font-semibold focus:outline-none focus:border-sky-400"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-bold text-white uppercase block mb-1">
                      Target Count
                    </label>
                    <input
                      type="number"
                      min={1}
                      required
                      value={goalTarget}
                      onChange={(e) => setGoalTarget(Number(e.target.value))}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-black border border-white/20 text-white text-sm font-semibold focus:outline-none focus:border-sky-400"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-white uppercase block mb-1">
                      Unit
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. tasks, hours, chapters"
                      value={goalUnit}
                      onChange={(e) => setGoalUnit(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-black border border-white/20 text-white text-sm font-semibold focus:outline-none focus:border-sky-400"
                    />
                  </div>
                </div>

                <div className="pt-2 flex items-center justify-end space-x-2">
                  <button
                    type="button"
                    onClick={() => setIsAddGoalModalOpen(false)}
                    className="px-4 py-2 rounded-xl border border-white/20 text-xs font-bold text-slate-300 hover:text-white"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl bg-white text-black font-extrabold text-xs uppercase tracking-wide hover:bg-slate-200"
                  >
                    Save Goal
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL: ADD TASK */}
      <AnimatePresence>
        {isAddTaskModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-black border border-white/20 p-6 rounded-3xl max-w-md w-full shadow-2xl space-y-4"
            >
              <div className="flex items-center justify-between pb-3 border-b border-white/10">
                <div className="flex items-center space-x-2">
                  <CheckCircle2 className="w-5 h-5 text-sky-400" />
                  <h3 className="font-bebas text-2xl text-white font-bold">SHARE TASK WITH SQUAD</h3>
                </div>
                <button
                  onClick={() => setIsAddTaskModalOpen(false)}
                  className="text-slate-400 hover:text-white font-bold text-sm"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleAddTask} className="space-y-4">
                <div>
                  <label className="text-xs font-bold text-white uppercase block mb-1">
                    Task Title
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Thermodynamics Chapter 4 Questions"
                    value={taskTitle}
                    onChange={(e) => setTaskTitle(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-black border border-white/20 text-white text-sm font-semibold focus:outline-none focus:border-sky-400"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-white uppercase block mb-1">
                    Notes / Description
                  </label>
                  <textarea
                    rows={2}
                    placeholder="Notes or resources for friends..."
                    value={taskDesc}
                    onChange={(e) => setTaskDesc(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-black border border-white/20 text-white text-sm font-medium focus:outline-none focus:border-sky-400"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-bold text-white uppercase block mb-1">
                      Subject
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Physics, Math"
                      value={taskSubject}
                      onChange={(e) => setTaskSubject(e.target.value)}
                      className="w-full px-3.5 py-2 rounded-xl bg-black border border-white/20 text-white text-xs font-semibold focus:outline-none focus:border-sky-400"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-white uppercase block mb-1">
                      Priority
                    </label>
                    <select
                      value={taskPriority}
                      onChange={(e) => setTaskPriority(e.target.value as Priority)}
                      className="w-full px-3.5 py-2 rounded-xl bg-black border border-white/20 text-white text-xs font-bold focus:outline-none focus:border-sky-400"
                    >
                      <option value="Critical">Critical</option>
                      <option value="High">High</option>
                      <option value="Medium">Medium</option>
                      <option value="Low">Low</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-white uppercase block mb-1">
                    Assign To
                  </label>
                  <select
                    value={taskAssignee}
                    onChange={(e) => setTaskAssignee(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl bg-black border border-white/20 text-white text-xs font-semibold focus:outline-none focus:border-sky-400"
                  >
                    {activeGroup.members.map((m) => (
                      <option key={m.id} value={m.name}>
                        {m.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="pt-2 flex items-center justify-end space-x-2">
                  <button
                    type="button"
                    onClick={() => setIsAddTaskModalOpen(false)}
                    className="px-4 py-2 rounded-xl border border-white/20 text-xs font-bold text-slate-300 hover:text-white"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl bg-white text-black font-extrabold text-xs uppercase tracking-wide hover:bg-slate-200"
                  >
                    Share Task
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
