import React, { useState } from 'react';
import {
  Compass,
  Clock,
  PlayCircle,
  CheckCircle2,
  ArrowRight,
  Check,
} from 'lucide-react';
import { Mission, Subject, MissionStatus } from '../../types';
import { formatDeadlineCountdown } from '../missions/MissionsList';
import { triggerMissionAccomplishedBurst } from '../particles/ClickBurst';

interface ProgressTrackerProps {
  missions: Mission[];
  subjects: Subject[];
  onToggleComplete: (id: string) => void;
  onEditMission: (mission: Mission) => void;
}

export const ProgressTracker: React.FC<ProgressTrackerProps> = ({
  missions,
  subjects,
  onToggleComplete,
  onEditMission,
}) => {
  const [activeTab, setActiveTab] = useState<MissionStatus>('Pending');

  const subjectMap = new Map<string, Subject>();
  subjects.forEach((s) => subjectMap.set(s.id, s));

  const pending = missions.filter((m) => m.status === 'Pending');
  const inProgress = missions.filter((m) => m.status === 'In Progress');
  const completed = missions.filter((m) => m.status === 'Completed');

  const currentList = activeTab === 'Pending' ? pending : activeTab === 'In Progress' ? inProgress : completed;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <span className="text-xs font-mono tracking-widest text-[#38bdf8] uppercase font-bold">
          // ORBITAL VELOCITY AUDIT
        </span>
        <h1 className="font-bebas text-4xl sm:text-5xl text-white font-extrabold tracking-wide">
          PROGRESS TRACKER
        </h1>
        <p className="text-xs text-white/70 font-medium">
          Track stage transitions from pre-flight pending to active burn and orbital accomplishment.
        </p>
      </div>

      {/* 3 Large Stage Selector Tabs */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Pending */}
        <button
          onClick={() => setActiveTab('Pending')}
          className={`glass-panel p-5 rounded-2xl border text-left transition-all ${
            activeTab === 'Pending'
              ? 'border-[#38bdf8] bg-[#0c1a38] shadow-lg shadow-[#38bdf8]/20'
              : 'border-[#38bdf8]/20 hover:border-[#38bdf8]/40'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono uppercase text-white/70 font-bold">Pre-Flight</span>
            <Clock className="w-4 h-4 text-[#38bdf8]" />
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <span className="font-bebas text-4xl text-white font-bold">{pending.length}</span>
            <span className="text-xs font-mono text-[#38bdf8] font-bold">PENDING</span>
          </div>
        </button>

        {/* In Progress */}
        <button
          onClick={() => setActiveTab('In Progress')}
          className={`glass-panel p-5 rounded-2xl border text-left transition-all ${
            activeTab === 'In Progress'
              ? 'border-[#38bdf8] bg-[#0c1a38] shadow-lg shadow-[#38bdf8]/20'
              : 'border-[#38bdf8]/20 hover:border-[#38bdf8]/40'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono uppercase text-[#60a5fa] font-bold">Active Burn</span>
            <PlayCircle className="w-4 h-4 text-[#60a5fa]" />
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <span className="font-bebas text-4xl text-[#60a5fa] font-bold">{inProgress.length}</span>
            <span className="text-xs font-mono text-[#60a5fa] font-bold">IN PROGRESS</span>
          </div>
        </button>

        {/* Completed */}
        <button
          onClick={() => setActiveTab('Completed')}
          className={`glass-panel p-5 rounded-2xl border text-left transition-all ${
            activeTab === 'Completed'
              ? 'border-[#34d399] bg-[#0a2618] shadow-lg shadow-[#34d399]/20'
              : 'border-[#34d399]/20 hover:border-[#34d399]/40'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono uppercase text-[#34d399] font-bold">In Orbit</span>
            <CheckCircle2 className="w-4 h-4 text-[#34d399]" />
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <span className="font-bebas text-4xl text-[#34d399] font-bold">{completed.length}</span>
            <span className="text-xs font-mono text-[#34d399] font-bold">ACCOMPLISHED</span>
          </div>
        </button>
      </div>

      {/* Stage Detail List */}
      <div className="glass-panel p-6 rounded-3xl border border-[#38bdf8]/30 space-y-4">
        <div className="flex items-center justify-between pb-4 border-b border-[#38bdf8]/15">
          <h3 className="font-bebas text-2xl text-white font-bold">
            {activeTab === 'Completed'
              ? 'MISSION ACCOMPLISHED ARCHIVE'
              : activeTab === 'In Progress'
              ? 'ACTIVE THRUST MISSIONS'
              : 'QUEUED LAUNCH MANIFEST'}
          </h3>
          <span className="text-xs font-mono text-[#38bdf8] font-bold">
            {currentList.length} PAYLOADS
          </span>
        </div>

        {currentList.length === 0 ? (
          <div className="text-center py-12 text-white/60 space-y-2">
            <Compass className="w-8 h-8 mx-auto text-[#38bdf8]/40" />
            <p className="text-sm">No missions currently in this flight stage.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {currentList.map((m) => {
              const isCompleted = m.status === 'Completed';
              const subject = m.subject_id ? subjectMap.get(m.subject_id) : undefined;
              const countdown = formatDeadlineCountdown(m.deadline, isCompleted);

              return (
                <div
                  key={m.id}
                  onClick={() => onEditMission(m)}
                  className="p-4 rounded-2xl border border-[#38bdf8]/20 bg-[#060c1d] hover:border-[#38bdf8] transition-all cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  <div className="flex items-start space-x-3.5">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (!isCompleted) triggerMissionAccomplishedBurst(e);
                        onToggleComplete(m.id);
                      }}
                      className={`w-6 h-6 rounded-lg border mt-0.5 flex items-center justify-center shrink-0 transition-colors ${
                        isCompleted
                          ? 'bg-[#34d399] border-[#34d399] text-[#000000]'
                          : 'border-[#38bdf8]/40 hover:border-[#38bdf8] text-transparent'
                      }`}
                    >
                      <Check className="w-3.5 h-3.5 stroke-[3]" />
                    </button>

                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-[#38bdf8]">
                          {m.priority} Thrust
                        </span>
                        {subject && (
                          <span
                            className="text-[10px] font-semibold px-2 py-0.5 rounded border"
                            style={{
                              backgroundColor: `${subject.color}15`,
                              borderColor: `${subject.color}35`,
                              color: subject.color,
                            }}
                          >
                            {subject.name}
                          </span>
                        )}
                      </div>
                      <h4
                        className={`text-sm font-bold text-white mt-1 ${
                          isCompleted ? 'line-through text-white/50' : ''
                        }`}
                      >
                        {m.title}
                      </h4>
                      {m.description && (
                        <p className="text-xs text-white/60 mt-0.5 line-clamp-1 font-normal">
                          {m.description}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end space-x-4 shrink-0 text-xs font-mono font-bold">
                    <span className={countdown.colorClass}>{countdown.text}</span>
                    <button className="text-[#38bdf8] hover:underline flex items-center space-x-1">
                      <span>Inspect</span>
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
