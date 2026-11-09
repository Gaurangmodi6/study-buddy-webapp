import React, { useState, useMemo } from 'react';
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Plus,
  Clock,
  CheckCircle2,
  AlertTriangle,
  X,
  Rocket,
} from 'lucide-react';
import { Mission, Subject, CalendarViewMode, Priority } from '../../types';
import { triggerStrongButtonBurst } from '../particles/ClickBurst';

interface OrbitCalendarProps {
  missions: Mission[];
  subjects: Subject[];
  onSelectMission: (mission: Mission) => void;
  onOpenCreateForDate: (date: Date) => void;
}

export const OrbitCalendar: React.FC<OrbitCalendarProps> = ({
  missions,
  subjects,
  onSelectMission,
  onOpenCreateForDate,
}) => {
  const [viewMode, setViewMode] = useState<CalendarViewMode>('month');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDayDate, setSelectedDayDate] = useState<Date>(new Date());
  const [isSidePanelOpen, setIsSidePanelOpen] = useState(false);

  const subjectMap = useMemo(() => {
    const map = new Map<string, Subject>();
    subjects.forEach((s) => map.set(s.id, s));
    return map;
  }, [subjects]);

  const priorityColor: Record<Priority, string> = {
    Critical: '#ef4444',
    High: '#38bdf8',
    Medium: '#60a5fa',
    Low: '#34d399',
  };

  const missionsByDate = useMemo(() => {
    const map = new Map<string, Mission[]>();
    missions.forEach((m) => {
      const d = new Date(m.deadline);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(m);
    });
    return map;
  }, [missions]);

  const handlePrev = () => {
    const next = new Date(currentDate);
    if (viewMode === 'month') {
      next.setMonth(next.getMonth() - 1);
    } else {
      next.setDate(next.getDate() - 7);
    }
    setCurrentDate(next);
  };

  const handleNext = () => {
    const next = new Date(currentDate);
    if (viewMode === 'month') {
      next.setMonth(next.getMonth() + 1);
    } else {
      next.setDate(next.getDate() + 7);
    }
    setCurrentDate(next);
  };

  const handleToday = () => {
    const today = new Date();
    setCurrentDate(today);
    setSelectedDayDate(today);
  };

  const monthDays = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    const firstDayIndex = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const daysInPrevMonth = new Date(year, month, 0).getDate();

    const days: { date: Date; isCurrentMonth: boolean }[] = [];

    for (let i = firstDayIndex - 1; i >= 0; i--) {
      days.push({
        date: new Date(year, month - 1, daysInPrevMonth - i),
        isCurrentMonth: false,
      });
    }

    for (let i = 1; i <= daysInMonth; i++) {
      days.push({
        date: new Date(year, month, i),
        isCurrentMonth: true,
      });
    }

    const remaining = 42 - days.length;
    for (let i = 1; i <= remaining; i++) {
      days.push({
        date: new Date(year, month + 1, i),
        isCurrentMonth: false,
      });
    }

    return days;
  }, [currentDate]);

  const weekDays = useMemo(() => {
    const start = new Date(currentDate);
    const day = start.getDay();
    start.setDate(start.getDate() - day);
    const days: Date[] = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      days.push(d);
    }
    return days;
  }, [currentDate]);

  const getDateKey = (date: Date) => {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  };

  const isToday = (date: Date) => {
    const today = new Date();
    return (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    );
  };

  const isSelected = (date: Date) => {
    return (
      date.getDate() === selectedDayDate.getDate() &&
      date.getMonth() === selectedDayDate.getMonth() &&
      date.getFullYear() === selectedDayDate.getFullYear()
    );
  };

  const selectedDayMissions = useMemo(() => {
    return missionsByDate.get(getDateKey(selectedDayDate)) || [];
  }, [missionsByDate, selectedDayDate]);

  const monthName = currentDate.toLocaleString('default', { month: 'long', year: 'numeric' });

  return (
    <div className="space-y-6">
      {/* Header and Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-mono tracking-widest text-[#38bdf8] uppercase font-bold">
            // TEMPORAL FLIGHT PATH
          </span>
          <h1 className="font-bebas text-4xl sm:text-5xl text-white font-extrabold tracking-wide">
            ORBIT CALENDAR
          </h1>
          <p className="text-xs text-white/70 font-medium">
            Map launch deadlines, study sprints, and flight trajectories across time.
          </p>
        </div>

        {/* View Mode Toggle & Navigation */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="p-1 rounded-xl bg-[#040816] border border-[#38bdf8]/30 flex items-center text-xs">
            <button
              onClick={() => setViewMode('month')}
              className={`px-3 py-1.5 rounded-lg transition-colors font-bold ${
                viewMode === 'month'
                  ? 'bg-[#38bdf8]/25 text-[#38bdf8] border border-[#38bdf8]/40'
                  : 'text-white/60 hover:text-white'
              }`}
            >
              Month View
            </button>
            <button
              onClick={() => setViewMode('week')}
              className={`px-3 py-1.5 rounded-lg transition-colors font-bold ${
                viewMode === 'week'
                  ? 'bg-[#38bdf8]/25 text-[#38bdf8] border border-[#38bdf8]/40'
                  : 'text-white/60 hover:text-white'
              }`}
            >
              Week View
            </button>
          </div>

          <div className="flex items-center space-x-1.5 bg-[#040816] border border-[#38bdf8]/30 p-1 rounded-xl">
            <button
              onClick={handlePrev}
              className="p-1.5 rounded-lg text-white/70 hover:text-[#38bdf8] hover:bg-[#0c1a38]"
              title="Previous"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={handleToday}
              className="px-2.5 py-1 text-xs font-mono uppercase tracking-wider text-[#38bdf8] hover:bg-[#0c1a38] rounded-lg font-bold"
            >
              Today
            </button>
            <button
              onClick={handleNext}
              className="p-1.5 rounded-lg text-white/70 hover:text-[#38bdf8] hover:bg-[#0c1a38]"
              title="Next"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Main Calendar Card & Side Panel Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className={`space-y-4 ${isSidePanelOpen ? 'lg:col-span-8' : 'lg:col-span-12'}`}>
          <div className="glass-panel p-5 sm:p-6 rounded-3xl border border-[#38bdf8]/30 shadow-2xl">
            <div className="flex items-center justify-between pb-4 mb-4 border-b border-[#38bdf8]/15">
              <h2 className="font-bebas text-2xl sm:text-3xl text-white font-bold tracking-wider">
                {monthName}
              </h2>
              <div className="flex items-center space-x-3 text-xs text-white/70 font-mono font-bold">
                <span className="flex items-center space-x-1">
                  <span className="w-2 h-2 rounded-full bg-[#ef4444]" />
                  <span>Critical</span>
                </span>
                <span className="flex items-center space-x-1">
                  <span className="w-2 h-2 rounded-full bg-[#38bdf8]" />
                  <span>High</span>
                </span>
                <span className="flex items-center space-x-1">
                  <span className="w-2 h-2 rounded-full bg-[#60a5fa]" />
                  <span>Medium</span>
                </span>
              </div>
            </div>

            {/* Days of Week Header */}
            <div className="grid grid-cols-7 gap-1 text-center font-mono text-xs uppercase tracking-wider text-[#38bdf8] pb-3 border-b border-[#38bdf8]/15 font-bold">
              <span>Sun</span>
              <span>Mon</span>
              <span>Tue</span>
              <span>Wed</span>
              <span>Thu</span>
              <span>Fri</span>
              <span>Sat</span>
            </div>

            {/* Month Grid */}
            {viewMode === 'month' ? (
              <div className="grid grid-cols-7 gap-1 sm:gap-2 mt-2">
                {monthDays.map(({ date, isCurrentMonth }, idx) => {
                  const key = getDateKey(date);
                  const dayMissions = missionsByDate.get(key) || [];
                  const activeToday = isToday(date);
                  const activeSelected = isSelected(date);

                  return (
                    <div
                      key={idx}
                      onClick={() => {
                        setSelectedDayDate(date);
                        setIsSidePanelOpen(true);
                      }}
                      className={`min-h-[70px] sm:min-h-[96px] p-1.5 sm:p-2 rounded-xl border transition-all cursor-pointer flex flex-col justify-between ${
                        activeSelected
                          ? 'border-[#38bdf8] bg-[#0c1a38] shadow-lg shadow-[#38bdf8]/20'
                          : activeToday
                          ? 'border-[#38bdf8]/80 bg-[#060e24]'
                          : isCurrentMonth
                          ? 'border-[#38bdf8]/15 bg-[#030612]/70 hover:border-[#38bdf8]/40 hover:bg-[#081226]'
                          : 'border-transparent bg-transparent opacity-30'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span
                          className={`text-xs font-mono font-bold ${
                            activeToday
                              ? 'w-6 h-6 rounded-full bg-[#38bdf8] text-[#000000] flex items-center justify-center'
                              : activeSelected
                              ? 'text-[#38bdf8]'
                              : 'text-white/80'
                          }`}
                        >
                          {date.getDate()}
                        </span>
                        {dayMissions.length > 0 && (
                          <span className="text-[10px] font-mono text-[#38bdf8] bg-[#38bdf8]/20 px-1.5 py-0.2 rounded-md font-bold">
                            {dayMissions.length}
                          </span>
                        )}
                      </div>

                      <div className="space-y-1 mt-1 overflow-hidden">
                        {dayMissions.slice(0, 2).map((m) => (
                          <div
                            key={m.id}
                            className="px-1.5 py-0.5 rounded text-[10px] truncate border font-bold flex items-center space-x-1"
                            style={{
                              backgroundColor: `${priorityColor[m.priority]}22`,
                              borderColor: `${priorityColor[m.priority]}45`,
                              color: priorityColor[m.priority],
                            }}
                          >
                            <span
                              className="w-1.5 h-1.5 rounded-full shrink-0"
                              style={{ backgroundColor: priorityColor[m.priority] }}
                            />
                            <span className="truncate">{m.title}</span>
                          </div>
                        ))}
                        {dayMissions.length > 2 && (
                          <p className="text-[9px] text-white/50 pl-1 font-mono font-bold">
                            +{dayMissions.length - 2} more
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              /* Week View */
              <div className="grid grid-cols-7 gap-2 mt-2">
                {weekDays.map((date, idx) => {
                  const key = getDateKey(date);
                  const dayMissions = missionsByDate.get(key) || [];
                  const activeToday = isToday(date);
                  const activeSelected = isSelected(date);

                  return (
                    <div
                      key={idx}
                      onClick={() => {
                        setSelectedDayDate(date);
                        setIsSidePanelOpen(true);
                      }}
                      className={`min-h-[220px] p-3 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between ${
                        activeSelected
                          ? 'border-[#38bdf8] bg-[#0c1a38] shadow-lg shadow-[#38bdf8]/20'
                          : activeToday
                          ? 'border-[#38bdf8] bg-[#060e24]'
                          : 'border-[#38bdf8]/20 bg-[#030612]/70 hover:border-[#38bdf8]/40'
                      }`}
                    >
                      <div className="flex items-center justify-between pb-2 border-b border-[#38bdf8]/15">
                        <span
                          className={`text-sm font-mono font-bold ${
                            activeToday
                              ? 'w-7 h-7 rounded-full bg-[#38bdf8] text-[#000000] flex items-center justify-center'
                              : 'text-white'
                          }`}
                        >
                          {date.getDate()}
                        </span>
                        <span className="text-[10px] font-mono text-white/60">
                          {date.toLocaleDateString(undefined, { weekday: 'short' })}
                        </span>
                      </div>

                      <div className="space-y-1.5 my-2 flex-1 overflow-y-auto max-h-[160px]">
                        {dayMissions.map((m) => (
                          <div
                            key={m.id}
                            className="p-1.5 rounded-lg border text-[11px] leading-tight space-y-0.5 font-bold"
                            style={{
                              backgroundColor: `${priorityColor[m.priority]}18`,
                              borderColor: `${priorityColor[m.priority]}40`,
                              color: priorityColor[m.priority],
                            }}
                          >
                            <p className="truncate">{m.title}</p>
                            <p className="text-[9px] text-white/60 font-mono">
                              {new Date(m.deadline).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </p>
                          </div>
                        ))}
                        {dayMissions.length === 0 && (
                          <p className="text-[10px] text-white/30 font-mono text-center pt-8">
                            No launches
                          </p>
                        )}
                      </div>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onOpenCreateForDate(date);
                        }}
                        className="w-full py-1 rounded bg-[#38bdf8]/15 hover:bg-[#38bdf8]/30 text-[10px] font-mono text-[#38bdf8] transition-colors flex items-center justify-center space-x-1 font-bold"
                      >
                        <Plus className="w-3 h-3" />
                        <span>Add</span>
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Side Panel: Selected Day Manifest */}
        {isSidePanelOpen && (
          <div className="lg:col-span-4">
            <div className="glass-panel p-6 rounded-3xl border border-[#38bdf8]/35 shadow-2xl relative space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-[#38bdf8]/20">
                <div>
                  <span className="text-[10px] font-mono text-[#38bdf8] uppercase tracking-wider font-bold">
                    // FLIGHT SCHEDULE
                  </span>
                  <h3 className="font-bebas text-2xl text-white font-bold">
                    {selectedDayDate.toLocaleDateString(undefined, {
                      weekday: 'short',
                      month: 'short',
                      day: 'numeric',
                    })}
                  </h3>
                </div>
                <button
                  onClick={() => setIsSidePanelOpen(false)}
                  className="p-1.5 rounded-lg text-white/60 hover:text-[#38bdf8] hover:bg-[#0c1a38]"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <button
                onClick={(e) => {
                  triggerStrongButtonBurst(e, true);
                  onOpenCreateForDate(selectedDayDate);
                }}
                className="blue-gradient-btn w-full py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center justify-center space-x-1.5 shadow-md shadow-[#38bdf8]/30"
              >
                <Plus className="w-4 h-4" />
                <span>Schedule Launch for This Day</span>
              </button>

              <div className="space-y-3 pt-2">
                {selectedDayMissions.length === 0 ? (
                  <div className="p-8 text-center rounded-2xl border border-dashed border-[#38bdf8]/20 text-white/60 space-y-2">
                    <Rocket className="w-6 h-6 mx-auto text-[#38bdf8]/50" />
                    <p className="text-xs">No launches scheduled for this trajectory.</p>
                  </div>
                ) : (
                  selectedDayMissions.map((m) => {
                    const isCompleted = m.status === 'Completed';
                    const subject = m.subject_id ? subjectMap.get(m.subject_id) : undefined;

                    return (
                      <div
                        key={m.id}
                        onClick={() => onSelectMission(m)}
                        className="p-3.5 rounded-xl border border-[#38bdf8]/25 bg-[#060c1d] hover:border-[#38bdf8] transition-all cursor-pointer space-y-2"
                      >
                        <div className="flex items-center justify-between">
                          <span
                            className="px-2 py-0.5 rounded text-[9px] font-bold uppercase border"
                            style={{
                              backgroundColor: `${priorityColor[m.priority]}20`,
                              borderColor: `${priorityColor[m.priority]}40`,
                              color: priorityColor[m.priority],
                            }}
                          >
                            {m.priority} Thrust
                          </span>
                          <span className="text-[10px] font-mono text-white/60">
                            {new Date(m.deadline).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>

                        <h4
                          className={`text-sm font-bold text-white ${
                            isCompleted ? 'line-through text-white/50' : ''
                          }`}
                        >
                          {m.title}
                        </h4>

                        {subject && (
                          <span
                            className="inline-block text-[10px] font-semibold px-2 py-0.5 rounded border"
                            style={{
                              backgroundColor: `${subject.color}15`,
                              borderColor: `${subject.color}40`,
                              color: subject.color,
                            }}
                          >
                            {subject.name}
                          </span>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
