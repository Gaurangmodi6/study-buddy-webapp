import React, { useState, useEffect } from 'react';
import { X, Rocket, Calendar, Clock, Tag, Trash2, Check, Users } from 'lucide-react';
import { Mission, Subject, Priority, MissionStatus } from '../../types';
import { triggerStrongButtonBurst } from '../particles/ClickBurst';

interface MissionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (missionData: Partial<Mission>) => void;
  onDelete?: (id: string) => void;
  editingMission?: Mission | null;
  subjects: Subject[];
  initialDate?: Date | null;
}

const PRIORITIES: { level: Priority; label: string; desc: string; color: string }[] = [
  { level: 'Low', label: 'Low Thrust', desc: 'Routine homework & readings', color: '#34d399' },
  { level: 'Medium', label: 'Medium Thrust', desc: 'Standard lab reports & quizzes', color: '#60a5fa' },
  { level: 'High', label: 'High Thrust', desc: 'Major projects & term papers', color: '#38bdf8' },
  { level: 'Critical', label: 'Critical Thrust', desc: 'Final exams & thesis milestones', color: '#ef4444' },
];

export const MissionModal: React.FC<MissionModalProps> = ({
  isOpen,
  onClose,
  onSave,
  onDelete,
  editingMission,
  subjects,
  initialDate,
}) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [subjectId, setSubjectId] = useState('');
  const [deadlineDate, setDeadlineDate] = useState('');
  const [deadlineTime, setDeadlineTime] = useState('23:59');
  const [priority, setPriority] = useState<Priority>('High');
  const [status, setStatus] = useState<MissionStatus>('Pending');
  const [sharedToSquadron, setSharedToSquadron] = useState(false);

  useEffect(() => {
    if (editingMission) {
      setTitle(editingMission.title);
      setDescription(editingMission.description || '');
      setSubjectId(editingMission.subject_id || (subjects[0]?.id || ''));
      const d = new Date(editingMission.deadline);
      const dateStr = d.toISOString().split('T')[0];
      const hours = String(d.getHours()).padStart(2, '0');
      const mins = String(d.getMinutes()).padStart(2, '0');
      setDeadlineDate(dateStr);
      setDeadlineTime(`${hours}:${mins}`);
      setPriority(editingMission.priority);
      setStatus(editingMission.status);
      setSharedToSquadron(editingMission.shared_to_group || false);
    } else {
      setTitle('');
      setDescription('');
      setSubjectId(subjects[0]?.id || '');
      const defaultDate = initialDate ? new Date(initialDate) : new Date();
      if (!initialDate) defaultDate.setDate(defaultDate.getDate() + 2);
      setDeadlineDate(defaultDate.toISOString().split('T')[0]);
      setDeadlineTime('23:59');
      setPriority('High');
      setStatus('Pending');
      setSharedToSquadron(false);
    }
  }, [editingMission, initialDate, subjects, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const [year, month, day] = deadlineDate.split('-').map(Number);
    const [hours, minutes] = deadlineTime.split(':').map(Number);
    const deadlineObj = new Date(year, month - 1, day, hours, minutes);

    const payload: Partial<Mission> = {
      title: title.trim(),
      description: description.trim() || undefined,
      subject_id: subjectId || undefined,
      deadline: deadlineObj.toISOString(),
      priority,
      status,
      completed_at: status === 'Completed' ? (editingMission?.completed_at || new Date().toISOString()) : null,
      shared_to_group: sharedToSquadron,
    };

    if (editingMission) {
      payload.id = editingMission.id;
    }

    onSave(payload);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
      <div className="glass-panel w-full max-w-lg p-6 sm:p-8 rounded-3xl border border-[#38bdf8]/40 shadow-2xl relative max-h-[90vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-xl text-white/60 hover:text-[#38bdf8] hover:bg-[#0c1a38] transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center space-x-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-[#38bdf8]/20 border border-[#38bdf8]/40 flex items-center justify-center text-[#38bdf8]">
            <Rocket className="w-5 h-5" />
          </div>
          <div>
            <h2 className="font-bebas text-2xl sm:text-3xl text-white font-bold tracking-wide">
              {editingMission ? 'EDIT TASK' : 'ADD NEW TASK'}
            </h2>
            <p className="text-xs text-[#38bdf8] font-mono uppercase font-bold">
              // ASSIGNMENT & DEADLINE DETAILS
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Mission Title */}
          <div>
            <label className="block text-xs font-mono uppercase tracking-wider text-[#38bdf8] mb-1.5 font-bold">
              Task Title *
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Physics Chapter 4 Problem Set"
              className="w-full px-4 py-2.5 rounded-xl bg-[#040816] border border-[#38bdf8]/30 text-white placeholder-white/40 text-sm focus:outline-none focus:border-[#38bdf8]"
            />
          </div>

          {/* Subject / Orbit */}
          <div>
            <label className="block text-xs font-mono uppercase tracking-wider text-[#38bdf8] mb-1.5 font-bold">
              Orbit Subject *
            </label>
            <div className="relative">
              <Tag className="w-4 h-4 text-[#38bdf8] absolute left-3.5 top-1/2 -translate-y-1/2" />
              <select
                value={subjectId}
                onChange={(e) => setSubjectId(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#040816] border border-[#38bdf8]/30 text-white text-sm focus:outline-none focus:border-[#38bdf8]"
              >
                {subjects.map((s) => (
                  <option key={s.id} value={s.id} className="bg-[#040816] text-white">
                    {s.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Deadline Date & Time */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-mono uppercase tracking-wider text-[#38bdf8] mb-1.5 font-bold">
                Target Launch Date *
              </label>
              <div className="relative">
                <Calendar className="w-4 h-4 text-[#38bdf8] absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="date"
                  required
                  value={deadlineDate}
                  onChange={(e) => setDeadlineDate(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#040816] border border-[#38bdf8]/30 text-white text-sm focus:outline-none focus:border-[#38bdf8]"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-mono uppercase tracking-wider text-[#38bdf8] mb-1.5 font-bold">
                Insertion Time *
              </label>
              <div className="relative">
                <Clock className="w-4 h-4 text-[#38bdf8] absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="time"
                  required
                  value={deadlineTime}
                  onChange={(e) => setDeadlineTime(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#040816] border border-[#38bdf8]/30 text-white text-sm focus:outline-none focus:border-[#38bdf8]"
                />
              </div>
            </div>
          </div>

          {/* Thrust Level (Priority) */}
          <div>
            <label className="block text-xs font-mono uppercase tracking-wider text-[#38bdf8] mb-1.5 font-bold">
              Thrust Level (Priority)
            </label>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {PRIORITIES.map((p) => {
                const isSelected = priority === p.level;
                return (
                  <button
                    key={p.level}
                    type="button"
                    onClick={() => setPriority(p.level)}
                    className={`p-2.5 rounded-xl border text-left transition-all ${
                      isSelected
                        ? 'border-[#38bdf8] bg-[#0c1a38] shadow-sm'
                        : 'border-[#38bdf8]/20 bg-[#040816] hover:border-[#38bdf8]/50'
                    }`}
                  >
                    <div className="flex items-center space-x-1.5">
                      <span
                        className="w-2.5 h-2.5 rounded-full"
                        style={{ backgroundColor: p.color }}
                      />
                      <span className="text-xs font-bold text-white">{p.level}</span>
                    </div>
                    <span className="text-[10px] text-white/60 block mt-1 leading-tight truncate">
                      {p.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Flight Status */}
          {editingMission && (
            <div>
              <label className="block text-xs font-mono uppercase tracking-wider text-[#38bdf8] mb-1.5 font-bold">
                Flight Status
              </label>
              <div className="grid grid-cols-3 gap-2">
                {(['Pending', 'In Progress', 'Completed'] as MissionStatus[]).map((st) => (
                  <button
                    key={st}
                    type="button"
                    onClick={() => setStatus(st)}
                    className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all ${
                      status === st
                        ? 'border-[#34d399] bg-[#34d399]/15 text-[#34d399]'
                        : 'border-[#38bdf8]/20 bg-[#040816] text-white/70 hover:text-white'
                    }`}
                  >
                    {st === 'Completed' ? 'Accomplished' : st}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Description */}
          <div>
            <label className="block text-xs font-mono uppercase tracking-wider text-[#38bdf8] mb-1.5 font-bold">
              Flight Notes / Mission Description (Optional)
            </label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Outline steps, reference chapters, or problem numbers..."
              className="w-full px-4 py-2.5 rounded-xl bg-[#040816] border border-[#38bdf8]/30 text-white placeholder-white/40 text-sm focus:outline-none focus:border-[#38bdf8]"
            />
          </div>

          {/* Share to Squadron Hub */}
          <div className="p-3.5 rounded-xl bg-black border border-white/20 flex items-center justify-between">
            <div className="flex items-center space-x-2.5">
              <Users className="w-4 h-4 text-sky-400" />
              <div>
                <span className="text-xs font-bold text-white block">Share to Squadron Hub</span>
                <span className="text-[11px] text-slate-400">Share progress and collaborate with friends</span>
              </div>
            </div>
            <input
              type="checkbox"
              checked={sharedToSquadron}
              onChange={(e) => setSharedToSquadron(e.target.checked)}
              className="w-4 h-4 rounded text-sky-500 cursor-pointer accent-sky-500"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-between pt-4 border-t border-[#38bdf8]/20">
            {editingMission && onDelete ? (
              <button
                type="button"
                onClick={() => {
                  if (confirm('Are you sure you want to delete this task?')) {
                    onDelete(editingMission.id);
                    onClose();
                  }
                }}
                className="p-2.5 rounded-xl border border-red-500/30 text-red-400 hover:bg-red-950/40 text-xs flex items-center space-x-1.5 font-bold cursor-pointer"
              >
                <Trash2 className="w-4 h-4" />
                <span>Delete Task</span>
              </button>
            ) : <div />}

            <div className="flex items-center space-x-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 rounded-xl border border-[#38bdf8]/25 text-xs text-white/70 hover:text-white font-semibold cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-6 py-2.5 rounded-xl bg-white text-black hover:bg-slate-200 text-xs font-bold uppercase tracking-wider flex items-center space-x-2 shadow-md active:scale-95 cursor-pointer"
              >
                <span>{editingMission ? 'Save Changes' : 'Save Task'}</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
