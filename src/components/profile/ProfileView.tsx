import React, { useState } from 'react';
import {
  User,
  Shield,
  Palette,
  Plus,
  Trash2,
  Database,
  Flame,
  CheckCircle2,
  RefreshCw,
  LogOut,
  Calendar,
} from 'lucide-react';
import { UserProfile, Subject, Mission } from '../../types';
import { isSupabaseConfigured } from '../../lib/supabase';
import { triggerStrongButtonBurst } from '../particles/ClickBurst';
import { GoogleWorkspaceCard } from '../workspace/GoogleWorkspaceCard';

interface ProfileViewProps {
  user: UserProfile;
  subjects: Subject[];
  missions: Mission[];
  streak: number;
  onAddSubject: (name: string, color: string) => void;
  onDeleteSubject: (id: string) => void;
  onResetData: () => void;
  onLogout: () => void;
  onToast: (msg: string, type?: 'success' | 'warning' | 'info' | 'error') => void;
}

const PRESET_COLORS = [
  '#38bdf8', // Electric Cyan
  '#60a5fa', // Light Blue
  '#2563eb', // Royal Blue
  '#ffffff', // Crisp White
  '#34d399', // Mint Emerald
  '#818cf8', // Nebula Indigo
  '#f43f5e', // Plasma Crimson
  '#fbbf24', // Amber
];

export const ProfileView: React.FC<ProfileViewProps> = ({
  user,
  subjects,
  missions,
  streak,
  onAddSubject,
  onDeleteSubject,
  onResetData,
  onLogout,
  onToast,
}) => {
  const [newSubjectName, setNewSubjectName] = useState('');
  const [newSubjectColor, setNewSubjectColor] = useState('#38bdf8');

  const handleCreateSubject = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSubjectName.trim()) return;
    onAddSubject(newSubjectName.trim(), newSubjectColor);
    setNewSubjectName('');
  };

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      {/* Header */}
      <div>
        <span className="text-xs font-mono tracking-widest text-[#38bdf8] uppercase font-bold">
          // FLIGHT COMMANDER PROFILE & GOOGLE INTEGRATION
        </span>
        <h1 className="font-bebas text-4xl sm:text-5xl text-white font-extrabold tracking-wide">
          COMMAND PROFILE & WORKSPACE
        </h1>
        <p className="text-xs text-white/70 font-medium">
          Manage your academic orbits, Google Calendar / Tasks synchronization, and telemetry settings.
        </p>
      </div>

      {/* Commander Card */}
      <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-[#38bdf8]/35 shadow-2xl flex flex-col sm:flex-row items-center justify-between gap-6">
        <div className="flex items-center space-x-5">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-[#1d4ed8] via-[#2563eb] to-[#38bdf8] flex items-center justify-center text-white font-bebas text-3xl shadow-xl shadow-[#38bdf8]/30">
            {user.name.slice(0, 2).toUpperCase()}
          </div>
          <div>
            <h2 className="font-bebas text-3xl text-white font-bold">{user.name}</h2>
            <p className="text-xs text-[#38bdf8] font-mono font-bold">{user.email}</p>
            <div className="flex items-center space-x-2 mt-2">
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-[#38bdf8]/20 text-[#38bdf8] border border-[#38bdf8]/40">
                🔥 {streak} DAY STREAK
              </span>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-[#34d399]/20 text-[#34d399] border border-[#34d399]/40">
                ACTIVE ORBIT
              </span>
            </div>
          </div>
        </div>

        <button
          onClick={onLogout}
          className="px-5 py-2.5 rounded-xl border border-red-500/40 text-red-400 hover:bg-red-950/40 text-xs font-bold flex items-center space-x-2 transition-colors"
        >
          <LogOut className="w-4 h-4" />
          <span>Exit Flight (Logout)</span>
        </button>
      </div>

      {/* Google Workspace Card Integration */}
      <GoogleWorkspaceCard
        missions={missions}
        subjects={subjects}
        onToast={onToast}
      />

      {/* Orbits (Subjects) Manager */}
      <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-[#38bdf8]/30 space-y-6">
        <div className="flex items-center justify-between pb-4 border-b border-[#38bdf8]/20">
          <div className="flex items-center space-x-2.5">
            <Palette className="w-5 h-5 text-[#38bdf8]" />
            <h3 className="font-bebas text-2xl text-white font-bold">ORBIT SUBJECTS ({subjects.length})</h3>
          </div>
          <span className="text-xs font-mono text-[#38bdf8] font-bold">ACADEMIC DISCIPLINES</span>
        </div>

        {/* Add New Orbit Form */}
        <form onSubmit={handleCreateSubject} className="space-y-4 p-4 rounded-2xl bg-[#060c1d] border border-[#38bdf8]/25">
          <h4 className="text-xs font-mono uppercase text-[#38bdf8] tracking-wider font-bold">
            Establish New Academic Orbit
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-center">
            <div className="sm:col-span-6">
              <input
                type="text"
                required
                value={newSubjectName}
                onChange={(e) => setNewSubjectName(e.target.value)}
                placeholder="Course Name (e.g. Molecular Biology)"
                className="w-full px-4 py-2.5 rounded-xl bg-[#030610] border border-[#38bdf8]/30 text-white text-xs placeholder-white/40 focus:outline-none focus:border-[#38bdf8]"
              />
            </div>

            {/* Color Swatch Picker */}
            <div className="sm:col-span-4 flex items-center space-x-1.5 overflow-x-auto py-1">
              {PRESET_COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setNewSubjectColor(c)}
                  className={`w-6 h-6 rounded-full border-2 transition-transform shrink-0 ${
                    newSubjectColor === c ? 'scale-125 border-white shadow-md' : 'border-transparent'
                  }`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>

            <div className="sm:col-span-2">
              <button
                type="submit"
                onClick={(e) => triggerStrongButtonBurst(e)}
                className="blue-gradient-btn w-full py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center justify-center space-x-1"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add</span>
              </button>
            </div>
          </div>
        </form>

        {/* Existing Subjects Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {subjects.map((sub) => {
            const count = missions.filter((m) => m.subject_id === sub.id).length;

            return (
              <div
                key={sub.id}
                className="p-3.5 rounded-xl border border-[#38bdf8]/20 bg-[#060c1d] flex items-center justify-between gap-3"
              >
                <div className="flex items-center space-x-3 truncate">
                  <span
                    className="w-4 h-4 rounded-full shrink-0 shadow-sm"
                    style={{ backgroundColor: sub.color }}
                  />
                  <div className="truncate">
                    <p className="text-xs font-bold text-white truncate">{sub.name}</p>
                    <p className="text-[10px] text-white/60 font-mono">
                      {count} {count === 1 ? 'Mission' : 'Missions'} Assigned
                    </p>
                  </div>
                </div>

                {subjects.length > 1 && (
                  <button
                    onClick={() => onDeleteSubject(sub.id)}
                    className="p-1.5 rounded text-white/40 hover:text-red-400 hover:bg-red-950/30 transition-colors"
                    title="Remove Orbit"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Database & Telemetry Health */}
      <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-[#38bdf8]/30 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-[#38bdf8]/20">
          <div className="flex items-center space-x-2.5">
            <Database className="w-5 h-5 text-[#38bdf8]" />
            <h3 className="font-bebas text-2xl text-white font-bold">TELEMETRY PERSISTENCE</h3>
          </div>
          <span className="text-xs font-mono text-[#34d399] font-bold">STATUS: OPERATIONAL</span>
        </div>

        <p className="text-xs text-white/75 leading-relaxed font-medium">
          {isSupabaseConfigured
            ? 'Connected directly to Supabase cloud database with active Row Level Security.'
            : 'Running on high-performance persistent storage engine with automatic local synchronization.'}
        </p>

        <div className="pt-2 flex flex-wrap items-center gap-3">
          <button
            onClick={() => {
              if (confirm('Reset to initial starter flight missions?')) {
                onResetData();
              }
            }}
            className="px-4 py-2 rounded-xl border border-[#38bdf8]/30 hover:bg-[#0c1a38] text-xs text-[#38bdf8] font-mono font-bold flex items-center space-x-2"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Reset Demo Starter Missions</span>
          </button>
        </div>
      </div>
    </div>
  );
};
