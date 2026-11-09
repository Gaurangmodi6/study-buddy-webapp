import React, { useMemo } from 'react';
import {
  Rocket,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Flame,
  ArrowRight,
  TrendingUp,
  PieChart as PieIcon,
  BarChart2,
  Calendar,
  Users,
  Headphones,
  Sparkles,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { Mission, Subject, Priority, ClassSession, DayOfWeek } from '../../types';
import { formatDeadlineCountdown } from '../missions/MissionsList';
import { triggerStrongButtonBurst } from '../particles/ClickBurst';
import { sound } from '../../lib/audio';
import { analyzeDaySchedule, formatDuration } from '../../lib/timetable';

interface MissionControlProps {
  missions: Mission[];
  subjects: Subject[];
  streak: number;
  classes?: ClassSession[];
  onNavigateToMissions: () => void;
  onNavigateToTimetable?: () => void;
  onNavigateToGroups?: () => void;
  onOpenMission: (m: Mission) => void;
  onOpenCreate: () => void;
  onEnterDeepFocus?: () => void;
}

export const MissionControl: React.FC<MissionControlProps> = ({
  missions,
  subjects,
  streak,
  classes = [],
  onNavigateToMissions,
  onNavigateToTimetable,
  onNavigateToGroups,
  onOpenMission,
  onOpenCreate,
  onEnterDeepFocus,
}) => {
  const subjectMap = useMemo(() => {
    const map = new Map<string, Subject>();
    subjects.forEach((s) => map.set(s.id, s));
    return map;
  }, [subjects]);

  // Today's Day of Week & Free-Time Analysis
  const todayAnalysis = useMemo(() => {
    const dayNames: DayOfWeek[] = [
      'Sunday',
      'Monday',
      'Tuesday',
      'Wednesday',
      'Thursday',
      'Friday',
      'Saturday',
    ];
    const todayDayName = dayNames[new Date().getDay()];
    return analyzeDaySchedule(todayDayName, classes);
  }, [classes]);

  // Statistics
  const totalCount = missions.length;
  const completedMissions = missions.filter((m) => m.status === 'Completed');
  const completedCount = completedMissions.length;
  const pendingCount = missions.filter((m) => m.status !== 'Completed').length;

  const now = new Date().getTime();
  const overdueCount = missions.filter(
    (m) => m.status !== 'Completed' && new Date(m.deadline).getTime() < now
  ).length;

  const completionRate = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  // 7-day completions history
  const last7DaysData = useMemo(() => {
    const data: { day: string; date: string; completed: number; total: number }[] = [];
    const today = new Date();

    for (let i = 6; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      const dayName = d.toLocaleDateString(undefined, { weekday: 'short' });

      const dayCompleted = completedMissions.filter((m) => {
        if (!m.completed_at) return false;
        const compD = new Date(m.completed_at);
        const compStr = `${compD.getFullYear()}-${String(compD.getMonth() + 1).padStart(2, '0')}-${String(compD.getDate()).padStart(2, '0')}`;
        return compStr === dateStr;
      }).length;

      data.push({
        day: dayName,
        date: dateStr,
        completed: dayCompleted,
        total: dayCompleted + 1,
      });
    }

    return data;
  }, [completedMissions]);

  // Subject distribution donut in blue palette
  const subjectDistribution = useMemo(() => {
    const counts: Record<string, number> = {};
    missions.forEach((m) => {
      const sId = m.subject_id || 'unassigned';
      counts[sId] = (counts[sId] || 0) + 1;
    });

    const palette = ['#38bdf8', '#60a5fa', '#00f0ff', '#3b82f6', '#818cf8', '#34d399'];

    return Object.entries(counts).map(([id, value], index) => {
      const subject = subjectMap.get(id);
      return {
        name: subject?.name || 'General Flight',
        value,
        color: subject?.color || palette[index % palette.length],
      };
    });
  }, [missions, subjectMap]);

  // Priority distribution
  const priorityDistribution = useMemo(() => {
    const counts: Record<Priority, number> = {
      Critical: 0,
      High: 0,
      Medium: 0,
      Low: 0,
    };

    missions.forEach((m) => {
      counts[m.priority] = (counts[m.priority] || 0) + 1;
    });

    return [
      { name: 'Critical', count: counts.Critical, color: '#ef4444' },
      { name: 'High', count: counts.High, color: '#38bdf8' },
      { name: 'Medium', count: counts.Medium, color: '#60a5fa' },
      { name: 'Low', count: counts.Low, color: '#34d399' },
    ];
  }, [missions]);

  // Next 5 upcoming launches
  const nextLaunches = useMemo(() => {
    return missions
      .filter((m) => m.status !== 'Completed')
      .sort((a, b) => new Date(a.deadline).getTime() - new Date(b.deadline).getTime())
      .slice(0, 5);
  }, [missions]);

  // SVG Progress Ring calculations
  const radius = 54;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (completionRate / 100) * circumference;

  return (
    <div className="space-y-6">
      {/* Top Banner in Bright White Theme */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-mono tracking-widest text-slate-500 uppercase font-black">
            // ACADEMIC OVERVIEW
          </span>
          <h1 className="font-bebas text-4xl sm:text-5xl text-slate-900 font-extrabold tracking-wide">
            STUDY DASHBOARD
          </h1>
          <p className="text-xs text-slate-600 font-medium">
            Real-time study progress, class schedule, free study windows, and upcoming deadlines.
          </p>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          {/* Deep Focus Mode Button / Toggle */}
          {onEnterDeepFocus && (
            <button
              onClick={() => {
                sound.playWarpWhoosh();
                onEnterDeepFocus();
              }}
              className="flex items-center space-x-3 px-4 py-2.5 rounded-2xl bg-black hover:bg-slate-800 text-white shadow-md transition-all duration-200 active:scale-95 cursor-pointer border border-black group"
            >
              <div className="w-10 h-10 rounded-xl bg-slate-900 border border-slate-700 flex items-center justify-center text-cyan-400 group-hover:scale-105 transition-transform shadow-inner shrink-0">
                <Headphones className="w-5 h-5 animate-pulse" />
              </div>
              <div className="text-left">
                <div className="flex items-center space-x-1.5">
                  <span className="font-bebas text-xl leading-none text-white tracking-wider">
                    DEEP FOCUS
                  </span>
                  <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-cyan-400 text-black font-black uppercase">
                    SPACE
                  </span>
                </div>
                <p className="text-[10px] text-slate-400 font-mono font-medium">
                  Ambient audio & zero clutter
                </p>
              </div>
            </button>
          )}

          {/* Study Streak Badge Highlight */}
          <div className="flex items-center space-x-3 bg-white border border-slate-200 p-3 rounded-2xl shadow-sm">
            <div className="w-12 h-12 rounded-xl bg-black flex items-center justify-center text-white shadow-md">
              <Flame className="w-7 h-7 stroke-[2.4]" />
            </div>
            <div>
              <div className="flex items-center space-x-1.5">
                <span className="font-bebas text-2xl text-slate-900 leading-none font-black">
                  {streak} CONSECUTIVE DAYS
                </span>
              </div>
              <p className="text-[11px] text-slate-500 font-mono uppercase font-bold">
                DAILY STUDY STREAK ACTIVE
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Today's Classes & Free Time Quick Bar */}
      <div className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-sm text-slate-900">
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center text-black shrink-0 shadow-sm">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-black text-slate-600 uppercase tracking-wider">
                TODAY ({todayAnalysis.day.toUpperCase()}):
              </span>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-black text-white font-black">
                {formatDuration(todayAnalysis.totalFreeMinutes)} FREE TIME
              </span>
            </div>
            <p className="text-sm text-slate-800 font-medium mt-0.5">
              {todayAnalysis.classes.length > 0 ? (
                <>
                  <span className="text-black font-extrabold">{todayAnalysis.classes.length} class session{todayAnalysis.classes.length !== 1 ? 's' : ''} scheduled</span> ({formatDuration(todayAnalysis.totalClassMinutes)}).
                  {todayAnalysis.freeSlots[0] && (
                    <span className="text-slate-600 ml-1">
                      Next free study window: <strong className="text-black font-extrabold">{todayAnalysis.freeSlots[0].startTime} - {todayAnalysis.freeSlots[0].endTime}</strong>.
                    </span>
                  )}
                </>
              ) : (
                <span className="text-slate-600">No classes today! Entire day open for study sprints and task completion.</span>
              )}
            </p>
          </div>
        </div>

        {onNavigateToTimetable && (
          <button
            onClick={() => {
              sound.playClick();
              onNavigateToTimetable();
            }}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-black hover:bg-slate-800 text-white font-extrabold text-xs tracking-wider uppercase transition-all shadow-sm active:scale-95 cursor-pointer shrink-0"
          >
            <span>VIEW SCHEDULE & FREE TIME</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Squadron Hub Collaborative Goal Banner */}
      {onNavigateToGroups && (
        <div className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-sm text-slate-900">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-xl bg-black text-white flex items-center justify-center shrink-0 shadow-md">
              <Users className="w-6 h-6 stroke-[2.3]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-black text-black uppercase tracking-wider">
                  SQUADRON HUB:
                </span>
                <span className="text-xs px-2 py-0.5 rounded bg-slate-100 text-slate-800 border border-slate-300 font-mono font-bold">
                  SQUAD-409 • 4 FRIENDS
                </span>
                <span className="text-xs px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 border border-emerald-300 font-bold hidden sm:inline">
                  14 / 20 GOALS COMPLETE (70%)
                </span>
              </div>
              <p className="text-xs text-slate-600 font-medium mt-1">
                Alex, Priya, and David are active in your study squad. Share tasks and push mutual study goals together.
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              sound.playClick();
              onNavigateToGroups();
            }}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-black hover:bg-slate-800 text-white font-extrabold text-xs tracking-wider uppercase transition-all shadow-sm active:scale-95 cursor-pointer shrink-0"
          >
            <span>ENTER SQUADRON HUB</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* 4 Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total */}
        <div className="glass-panel p-5 rounded-2xl border border-slate-200 flex flex-col justify-between shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono uppercase text-slate-500 font-black">Total Tasks</span>
            <Rocket className="w-4 h-4 text-black" />
          </div>
          <div className="mt-3">
            <span className="font-bebas text-4xl sm:text-5xl text-black font-bold">{totalCount}</span>
            <p className="text-[10px] text-slate-500 font-mono mt-0.5 font-bold">ALL ASSIGNMENTS</p>
          </div>
        </div>

        {/* Completed */}
        <div className="glass-panel p-5 rounded-2xl border border-slate-200 flex flex-col justify-between shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono uppercase text-emerald-600 font-bold">Completed</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="mt-3">
            <span className="font-bebas text-4xl sm:text-5xl text-emerald-600 font-bold">{completedCount}</span>
            <p className="text-[10px] text-emerald-600 font-mono mt-0.5 font-bold">DONE</p>
          </div>
        </div>

        {/* Pending */}
        <div className="glass-panel p-5 rounded-2xl border border-slate-200 flex flex-col justify-between shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono uppercase text-slate-700 font-bold">In Progress</span>
            <Clock className="w-4 h-4 text-slate-700" />
          </div>
          <div className="mt-3">
            <span className="font-bebas text-4xl sm:text-5xl text-black font-bold">{pendingCount}</span>
            <p className="text-[10px] text-slate-500 font-mono mt-0.5 font-bold">PENDING</p>
          </div>
        </div>

        {/* Overdue */}
        <div className="glass-panel p-5 rounded-2xl border border-slate-200 flex flex-col justify-between shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono uppercase text-red-600 font-bold">Overdue</span>
            <AlertTriangle className="w-4 h-4 text-red-600" />
          </div>
          <div className="mt-3">
            <span className="font-bebas text-4xl sm:text-5xl text-red-600 font-bold">{overdueCount}</span>
            <p className="text-[10px] text-red-600 font-mono mt-0.5 font-bold">NEEDS ATTENTION</p>
          </div>
        </div>
      </div>

      {/* Middle Analytics Grid: Progress Ring & 7-Day Completion Bar Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Progress Ring Card */}
        <div className="lg:col-span-4 glass-panel p-6 rounded-3xl border border-[#38bdf8]/35 flex flex-col items-center justify-center text-center relative shadow-xl">
          <span className="text-[10px] font-mono tracking-widest text-[#38bdf8] uppercase mb-4 font-bold">
            // VELOCITY RATE
          </span>

          <div className="relative w-40 h-40 flex items-center justify-center my-2">
            <svg className="w-full h-full -rotate-90 transform" viewBox="0 0 130 130">
              <circle
                cx="65"
                cy="65"
                r={radius}
                stroke="rgba(56, 189, 248, 0.15)"
                strokeWidth="10"
                fill="transparent"
              />
              <circle
                cx="65"
                cy="65"
                r={radius}
                stroke="url(#blueGradientRing)"
                strokeWidth="10"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
                fill="transparent"
                className="transition-all duration-1000 ease-out"
              />
              <defs>
                <linearGradient id="blueGradientRing" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#ffffff" />
                  <stop offset="50%" stopColor="#38bdf8" />
                  <stop offset="100%" stopColor="#2563eb" />
                </linearGradient>
              </defs>
            </svg>

            <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
              <span className="font-bebas text-4xl text-slate-900 font-extrabold leading-none">
                {completionRate}%
              </span>
              <span className="text-[10px] font-mono text-slate-500 uppercase mt-1 font-bold">
                COMPLETED
              </span>
            </div>
          </div>

          <p className="text-xs text-slate-600 mt-3 max-w-xs font-medium">
            {completionRate >= 75
              ? 'Excellent pace! You are on track with your study plan.'
              : 'Keep making steady progress on your upcoming deadlines.'}
          </p>
        </div>

        {/* 7-Day Completion Bar Chart in Crisp High Contrast */}
        <div className="lg:col-span-8 glass-panel p-6 rounded-3xl border border-slate-200 flex flex-col justify-between shadow-sm">
          <div className="flex items-center justify-between pb-4 border-b border-slate-200">
            <div className="flex items-center space-x-2.5">
              <TrendingUp className="w-4 h-4 text-black" />
              <h3 className="font-bebas text-2xl text-slate-900 tracking-wide font-bold">
                TASKS COMPLETED (LAST 7 DAYS)
              </h3>
            </div>
            <span className="text-[10px] font-mono text-slate-500 uppercase font-bold">DAILY STATS</span>
          </div>

          <div className="h-56 w-full pt-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={last7DaysData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <XAxis
                  dataKey="day"
                  stroke="#64748b"
                  fontSize={11}
                  tickLine={false}
                  axisLine={{ stroke: '#cbd5e1' }}
                />
                <YAxis
                  stroke="#64748b"
                  fontSize={11}
                  tickLine={false}
                  axisLine={{ stroke: '#cbd5e1' }}
                  allowDecimals={false}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#ffffff',
                    borderColor: '#cbd5e1',
                    borderRadius: '12px',
                    color: '#0f172a',
                    fontSize: '12px',
                    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
                  }}
                  cursor={{ fill: 'rgba(0, 0, 0, 0.05)' }}
                />
                <Bar
                  dataKey="completed"
                  fill="#000000"
                  radius={[6, 6, 0, 0]}
                  maxBarSize={40}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Lower Analytics Grid: Donut Chart, Priority Breakdown, and Next Launches */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Donut Chart: By Orbit Subject */}
        <div className="lg:col-span-4 glass-panel p-6 rounded-3xl border border-slate-200 flex flex-col justify-between shadow-sm">
          <div className="flex items-center space-x-2 pb-3 border-b border-slate-200">
            <PieIcon className="w-4 h-4 text-black" />
            <h3 className="font-bebas text-xl text-slate-900 font-bold">TASKS BY SUBJECT</h3>
          </div>

          <div className="h-48 w-full my-2">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={subjectDistribution}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius={45}
                  outerRadius={70}
                  paddingAngle={4}
                >
                  {subjectDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#ffffff',
                    borderColor: '#cbd5e1',
                    borderRadius: '12px',
                    color: '#0f172a',
                    fontSize: '12px',
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="space-y-1.5 pt-2 border-t border-slate-200 max-h-28 overflow-y-auto">
            {subjectDistribution.map((s, i) => (
              <div key={i} className="flex items-center justify-between text-xs font-medium">
                <div className="flex items-center space-x-2 truncate">
                  <span className="w-2.5 h-2.5 rounded-full shrink-0 shadow-sm" style={{ backgroundColor: s.color }} />
                  <span className="text-slate-800 truncate font-semibold">{s.name}</span>
                </div>
                <span className="font-mono text-black font-extrabold ml-2">{s.value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Priority Breakdown */}
        <div className="lg:col-span-3 glass-panel p-6 rounded-3xl border border-slate-200 flex flex-col justify-between shadow-sm">
          <div className="flex items-center space-x-2 pb-3 border-b border-slate-200">
            <BarChart2 className="w-4 h-4 text-black" />
            <h3 className="font-bebas text-xl text-slate-900 font-bold">PRIORITY LEVELS</h3>
          </div>

          <div className="space-y-4 my-auto py-2">
            {priorityDistribution.map((p) => {
              const pct = totalCount > 0 ? Math.round((p.count / totalCount) * 100) : 0;
              return (
                <div key={p.name} className="space-y-1">
                  <div className="flex items-center justify-between text-xs font-semibold">
                    <span className="text-slate-800">{p.name}</span>
                    <span className="font-mono text-[11px] font-bold" style={{ color: p.color }}>
                      {p.count} ({pct}%)
                    </span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden border border-slate-200">
                    <div
                      className="h-full rounded-full transition-all duration-700 shadow-sm"
                      style={{
                        width: `${pct}%`,
                        backgroundColor: p.color,
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          <button
            onClick={() => {
              sound.playClick();
              onNavigateToMissions();
            }}
            className="w-full py-2.5 rounded-xl border border-slate-300 hover:bg-slate-100 text-xs text-slate-800 font-mono font-bold uppercase tracking-wider flex items-center justify-center space-x-1 cursor-pointer transition-colors"
          >
            <span>View All Tasks</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Next 5 Upcoming Launches */}
        <div className="lg:col-span-5 glass-panel p-6 rounded-3xl border border-slate-200 flex flex-col justify-between shadow-sm">
          <div className="flex items-center justify-between pb-3 border-b border-slate-200">
            <div className="flex items-center space-x-2">
              <Calendar className="w-4 h-4 text-black" />
              <h3 className="font-bebas text-xl text-slate-900 font-bold">UPCOMING DEADLINES</h3>
            </div>
            <button
              onClick={() => {
                sound.playClick();
                onNavigateToMissions();
              }}
              className="text-xs text-black hover:underline font-mono font-bold cursor-pointer"
            >
              View All
            </button>
          </div>

          <div className="space-y-2.5 my-3 flex-1 overflow-y-auto">
            {nextLaunches.length === 0 ? (
              <div className="text-center py-8 text-xs text-slate-500 space-y-2">
                <Rocket className="w-6 h-6 mx-auto text-slate-400" />
                <p>No upcoming missions. Clear skies ahead!</p>
              </div>
            ) : (
              nextLaunches.map((m) => {
                const countdown = formatDeadlineCountdown(m.deadline, false);
                const subject = m.subject_id ? subjectMap.get(m.subject_id) : undefined;

                return (
                  <div
                    key={m.id}
                    onClick={() => {
                      sound.playClick();
                      onOpenMission(m);
                    }}
                    className="p-3 rounded-xl border border-slate-200 bg-slate-50 hover:border-black transition-colors cursor-pointer flex items-center justify-between gap-3 shadow-sm"
                  >
                    <div className="truncate">
                      <h4 className="text-xs font-bold text-slate-900 truncate">{m.title}</h4>
                      {subject && (
                        <span className="text-[10px] text-slate-500 font-semibold block truncate">
                          {subject.name}
                        </span>
                      )}
                    </div>
                    <span
                      className={`text-[10px] font-mono px-2 py-0.5 rounded border shrink-0 font-bold ${
                        countdown.isOverdue
                          ? 'bg-red-100 border-red-300 text-red-700'
                          : 'bg-white border-slate-300 text-slate-800'
                      }`}
                    >
                      {countdown.text}
                    </span>
                  </div>
                );
              })
            )}
          </div>

          <button
            onClick={(e) => {
              triggerStrongButtonBurst(e, true);
              onOpenCreate();
            }}
            className="w-full py-2.5 rounded-xl bg-black hover:bg-slate-800 text-white text-xs font-bold uppercase tracking-wider flex items-center justify-center space-x-2 transition-colors shadow-sm"
          >
            <Rocket className="w-3.5 h-3.5" />
            <span>Schedule New Task</span>
          </button>
        </div>
      </div>
    </div>
  );
};
