import React, { useState, useMemo } from 'react';
import {
  Rocket,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Plus,
  ArrowUpDown,
  MoreVertical,
  Check,
  Calendar,
} from 'lucide-react';
import { Mission, Subject, Priority, MissionStatus } from '../../types';
import { triggerMissionAccomplishedBurst, triggerStrongButtonBurst } from '../particles/ClickBurst';

interface MissionsListProps {
  missions: Mission[];
  subjects: Subject[];
  onToggleComplete: (id: string) => void;
  onEditMission: (mission: Mission) => void;
  onOpenCreate: () => void;
}

export function formatDeadlineCountdown(deadlineIso: string, isCompleted: boolean): {
  text: string;
  isOverdue: boolean;
  colorClass: string;
} {
  if (isCompleted) {
    return { text: 'Mission Accomplished', isOverdue: false, colorClass: 'text-[#34d399]' };
  }

  const now = new Date().getTime();
  const target = new Date(deadlineIso).getTime();
  const diffMs = target - now;

  if (diffMs <= 0) {
    const overdueMs = Math.abs(diffMs);
    const overdueHours = Math.floor(overdueMs / (1000 * 60 * 60));
    const overdueDays = Math.floor(overdueHours / 24);

    const label = overdueDays > 0 ? `${overdueDays}d overdue` : `${overdueHours}h overdue`;
    return {
      text: `Off course • ${label}`,
      isOverdue: true,
      colorClass: 'text-red-400 font-bold',
    };
  }

  const totalMinutes = Math.floor(diffMs / (1000 * 60));
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  const days = Math.floor(hours / 24);
  const remHours = hours % 24;

  let label = '';
  if (days > 0) {
    label = `${days}d ${remHours}h left`;
  } else if (hours > 0) {
    label = `${hours}h ${minutes}m left`;
  } else {
    label = `${minutes}m to insertion`;
  }

  const isUrgent = diffMs < 24 * 60 * 60 * 1000;
  return {
    text: label,
    isOverdue: false,
    colorClass: isUrgent ? 'text-[#38bdf8] font-bold' : 'text-white/80',
  };
}

export const MissionsList: React.FC<MissionsListProps> = ({
  missions,
  subjects,
  onToggleComplete,
  onEditMission,
  onOpenCreate,
}) => {
  const [search, setSearch] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('ALL');
  const [selectedPriority, setSelectedPriority] = useState('ALL');
  const [selectedStatus, setSelectedStatus] = useState('ALL');
  const [sortBy, setSortBy] = useState<'deadline' | 'priority' | 'title'>('deadline');

  const subjectMap = useMemo(() => {
    const map = new Map<string, Subject>();
    subjects.forEach((s) => map.set(s.id, s));
    return map;
  }, [subjects]);

  const priorityWeight: Record<Priority, number> = {
    Critical: 4,
    High: 3,
    Medium: 2,
    Low: 1,
  };

  const filteredMissions = useMemo(() => {
    return missions
      .filter((m) => {
        if (search) {
          const q = search.toLowerCase();
          const matchTitle = m.title.toLowerCase().includes(q);
          const matchDesc = m.description?.toLowerCase().includes(q);
          if (!matchTitle && !matchDesc) return false;
        }
        if (selectedSubject !== 'ALL' && m.subject_id !== selectedSubject) return false;
        if (selectedPriority !== 'ALL' && m.priority !== selectedPriority) return false;
        if (selectedStatus !== 'ALL') {
          if (selectedStatus === 'Completed' && m.status !== 'Completed') return false;
          if (selectedStatus === 'Pending' && m.status === 'Completed') return false;
        }
        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'deadline') {
          return new Date(a.deadline).getTime() - new Date(b.deadline).getTime();
        }
        if (sortBy === 'priority') {
          return priorityWeight[b.priority] - priorityWeight[a.priority];
        }
        return a.title.localeCompare(b.title);
      });
  }, [missions, search, selectedSubject, selectedPriority, selectedStatus, sortBy]);

  const handleCheckboxClick = (e: React.MouseEvent, mission: Mission) => {
    e.stopPropagation();
    if (mission.status !== 'Completed') {
      triggerMissionAccomplishedBurst(e);
    }
    onToggleComplete(mission.id);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner / Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-mono tracking-widest text-slate-500 uppercase font-black">
            // TASK MANAGER
          </span>
          <h1 className="font-bebas text-4xl sm:text-5xl text-slate-900 font-extrabold tracking-wide">
            MY TASKS ({filteredMissions.length})
          </h1>
          <p className="text-xs text-slate-600 font-medium">
            Manage your assignments, homework, projects, and deadlines.
          </p>
        </div>

        <button
          onClick={(e) => {
            triggerStrongButtonBurst(e, true);
            onOpenCreate();
          }}
          className="px-6 py-3 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center justify-center space-x-2 shrink-0 bg-black text-white hover:bg-slate-800 transition-all shadow-sm active:scale-95 cursor-pointer"
        >
          <Plus className="w-4 h-4 stroke-[2.5]" />
          <span>New Task</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="glass-panel p-4 rounded-2xl border border-slate-200 space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {/* Search */}
          <div className="lg:col-span-2 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search tasks by title or keyword..."
              className="w-full pl-10 pr-4 py-2 rounded-xl bg-white border border-slate-300 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-black"
            />
          </div>

          {/* Subject Filter */}
          <div>
            <select
              value={selectedSubject}
              onChange={(e) => setSelectedSubject(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-white border border-slate-300 text-xs text-slate-900 focus:outline-none focus:border-black"
            >
              <option value="ALL">All Subjects</option>
              {subjects.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>

          {/* Priority Filter */}
          <div>
            <select
              value={selectedPriority}
              onChange={(e) => setSelectedPriority(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-white border border-slate-300 text-xs text-slate-900 focus:outline-none focus:border-black"
            >
              <option value="ALL">All Priorities</option>
              <option value="Critical">Critical Priority</option>
              <option value="High">High Priority</option>
              <option value="Medium">Medium Priority</option>
              <option value="Low">Low Priority</option>
            </select>
          </div>

          {/* Sort By */}
          <div>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="w-full px-3 py-2 rounded-xl bg-white border border-slate-300 text-xs text-slate-900 focus:outline-none focus:border-black"
            >
              <option value="deadline">Sort: Deadline</option>
              <option value="priority">Sort: Thrust Level</option>
              <option value="title">Sort: Mission Name</option>
            </select>
          </div>
        </div>

        {/* Quick Status Pills */}
        <div className="flex items-center space-x-2 pt-2 border-t border-slate-200 overflow-x-auto text-xs">
          <span className="text-slate-500 font-mono text-[11px] uppercase font-bold shrink-0">Status:</span>
          {(['ALL', 'Pending', 'Completed'] as const).map((st) => (
            <button
              key={st}
              onClick={() => setSelectedStatus(st)}
              className={`px-3 py-1 rounded-lg transition-colors shrink-0 font-bold ${
                selectedStatus === st
                  ? 'bg-black text-white'
                  : 'text-slate-600 hover:text-black bg-slate-100'
              }`}
            >
              {st === 'ALL' ? 'All Trajectories' : st === 'Completed' ? 'Accomplished' : 'Active Flight'}
            </button>
          ))}
        </div>
      </div>

      {/* Mission Cards Grid */}
      {filteredMissions.length === 0 ? (
        <div className="glass-panel p-12 text-center rounded-3xl border border-slate-200 max-w-md mx-auto my-12 space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-slate-100 border border-slate-300 mx-auto flex items-center justify-center text-black">
            <Rocket className="w-7 h-7" />
          </div>
          <h3 className="font-bebas text-3xl text-slate-900 font-bold">NO MISSIONS RECORDED</h3>
          <p className="text-xs text-slate-600 leading-relaxed">
            All orbit trajectories are clear or matched no filters. Ready for launch?
          </p>
          <button
            onClick={onOpenCreate}
            className="px-6 py-2.5 rounded-xl bg-black hover:bg-slate-800 text-white text-xs font-bold uppercase tracking-wider inline-flex items-center space-x-2 shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span>Schedule Mission</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filteredMissions.map((mission) => {
            const isCompleted = mission.status === 'Completed';
            const subject = mission.subject_id ? subjectMap.get(mission.subject_id) : undefined;
            const countdown = formatDeadlineCountdown(mission.deadline, isCompleted);

            const priorityBadgeColors: Record<Priority, { bg: string; text: string; border: string }> = {
              Low: { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200' },
              Medium: { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200' },
              High: { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200' },
              Critical: { bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-200' },
            };

            const pBadge = priorityBadgeColors[mission.priority];

            return (
              <div
                key={mission.id}
                onClick={() => onEditMission(mission)}
                className={`glass-panel-interactive p-5 rounded-2xl cursor-pointer flex flex-col justify-between relative group ${
                  countdown.isOverdue
                    ? 'border-red-300 shadow-sm'
                    : isCompleted
                    ? 'opacity-70 border-emerald-200 bg-slate-50'
                    : 'border-slate-200'
                }`}
              >
                <div>
                  {/* Top Badges */}
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <div className="flex items-center space-x-2 overflow-hidden">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase border tracking-wider shrink-0 ${pBadge.bg} ${pBadge.text} ${pBadge.border}`}
                      >
                        {mission.priority} Priority
                      </span>

                      {subject && (
                        <span
                          className="px-2 py-0.5 rounded text-[10px] font-semibold border truncate max-w-[140px]"
                          style={{
                            backgroundColor: `${subject.color}18`,
                            color: subject.color,
                            borderColor: `${subject.color}45`,
                          }}
                        >
                          {subject.name}
                        </span>
                      )}
                    </div>

                    {/* Completion Checkbox */}
                    <button
                      type="button"
                      onClick={(e) => handleCheckboxClick(e, mission)}
                      className={`w-6 h-6 rounded-lg border flex items-center justify-center transition-all ${
                        isCompleted
                          ? 'bg-emerald-500 border-emerald-500 text-white'
                          : 'border-slate-300 hover:border-black hover:bg-slate-100 text-transparent'
                      }`}
                      title={isCompleted ? 'Mark Pending' : 'Mark Accomplished'}
                    >
                      <Check className="w-3.5 h-3.5 stroke-[3]" />
                    </button>
                  </div>

                  {/* Title & Description */}
                  <h3
                    className={`font-bold text-base text-slate-900 group-hover:text-black transition-colors leading-snug ${
                      isCompleted ? 'line-through text-slate-400' : ''
                    }`}
                  >
                    {mission.title}
                  </h3>

                  {mission.description && (
                    <p className="text-xs text-slate-600 mt-2 line-clamp-2 leading-relaxed font-normal">
                      {mission.description}
                    </p>
                  )}
                </div>

                {/* Bottom Footer Info */}
                <div className="pt-4 mt-4 border-t border-slate-200 flex items-center justify-between text-xs">
                  <div className="flex items-center space-x-1.5 font-mono">
                    {countdown.isOverdue ? (
                      <AlertTriangle className="w-3.5 h-3.5 text-red-500 shrink-0" />
                    ) : (
                      <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    )}
                    <span className={countdown.colorClass}>{countdown.text}</span>
                  </div>

                  <span className="text-[10px] text-slate-500 font-mono">
                    {new Date(mission.deadline).toLocaleDateString(undefined, {
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
