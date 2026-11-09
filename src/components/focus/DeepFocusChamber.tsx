import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  Play,
  Pause,
  RotateCcw,
  Headphones,
  Volume2,
  VolumeX,
  Target,
  Sparkles,
  CheckCircle2,
  Plus,
  ArrowLeft,
  Flame,
  Radio,
  FileText,
  Clock,
  Sliders,
  ChevronDown,
} from 'lucide-react';
import { Mission, Subject } from '../../types';
import { sound } from '../../lib/audio';
import { triggerStrongButtonBurst, triggerMissionAccomplishedBurst } from '../particles/ClickBurst';

interface DeepFocusChamberProps {
  missions: Mission[];
  subjects: Subject[];
  streak: number;
  onExitDeepFocus: () => void;
  onCompleteMission: (missionId: string) => void;
  onAddQuickMission?: (title: string) => void;
}

type SoundPreset = 'white' | 'cosmic' | 'pink';

export const DeepFocusChamber: React.FC<DeepFocusChamberProps> = ({
  missions,
  subjects,
  streak,
  onExitDeepFocus,
  onCompleteMission,
  onAddQuickMission,
}) => {
  // Timer State (Default 25 min Pomodoro)
  const [selectedDurationMinutes, setSelectedDurationMinutes] = useState<number>(25);
  const [secondsRemaining, setSecondsRemaining] = useState<number>(25 * 60);
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [sessionCount, setSessionCount] = useState<number>(() => {
    try {
      return Number(localStorage.getItem('study_deep_focus_sessions') || 0);
    } catch {
      return 0;
    }
  });

  // Sound Engine State
  const [isAudioPlaying, setIsAudioPlaying] = useState<boolean>(true);
  const [soundPreset, setSoundPreset] = useState<SoundPreset>('white');
  const [volume, setVolume] = useState<number>(0.3);
  const [showAudioMenu, setShowAudioMenu] = useState<boolean>(false);

  // Active Focus Task
  const pendingMissions = useMemo(
    () => missions.filter((m) => m.status !== 'Completed'),
    [missions]
  );
  const [selectedMissionId, setSelectedMissionId] = useState<string>(
    () => pendingMissions[0]?.id || ''
  );
  const [customGoal, setCustomGoal] = useState<string>('');
  const [isSettingCustomGoal, setIsSettingCustomGoal] = useState<boolean>(false);

  // Scratchpad for distraction-free brain dumping
  const [scratchpad, setScratchpad] = useState<string>(() => {
    try {
      return localStorage.getItem('study_focus_scratchpad') || '';
    } catch {
      return '';
    }
  });
  const [scratchpadSavedNotice, setScratchpadSavedNotice] = useState<boolean>(false);

  const selectedMission = useMemo(
    () => missions.find((m) => m.id === selectedMissionId),
    [missions, selectedMissionId]
  );

  const subjectMap = useMemo(() => {
    const map = new Map<string, Subject>();
    subjects.forEach((s) => map.set(s.id, s));
    return map;
  }, [subjects]);

  // Start ambient noise on mount automatically
  useEffect(() => {
    sound.startAmbient(soundPreset, volume);
    setIsAudioPlaying(true);

    return () => {
      sound.stopAmbient();
    };
  }, []);

  // Update sound when preset or volume changes
  const handlePresetChange = (preset: SoundPreset) => {
    setSoundPreset(preset);
    sound.setAmbientPreset(preset);
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    setVolume(val);
    sound.setAmbientVolume(val);
  };

  const toggleAudio = () => {
    if (isAudioPlaying) {
      sound.stopAmbient();
      setIsAudioPlaying(false);
    } else {
      sound.startAmbient(soundPreset, volume);
      setIsAudioPlaying(true);
    }
  };

  // Timer Tick
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (isRunning && secondsRemaining > 0) {
      interval = setInterval(() => {
        setSecondsRemaining((prev) => {
          if (prev <= 1) {
            // Timer Finished
            sound.playAccomplishedChime();
            setIsRunning(false);
            setSessionCount((sc) => {
              const updated = sc + 1;
              try {
                localStorage.setItem('study_deep_focus_sessions', String(updated));
              } catch {}
              return updated;
            });
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isRunning, secondsRemaining]);

  // Set Preset Duration
  const setTimerPreset = (mins: number) => {
    sound.playClick();
    setSelectedDurationMinutes(mins);
    setSecondsRemaining(mins * 60);
    setIsRunning(false);
  };

  // Timer Controls
  const toggleTimer = (e: React.MouseEvent<HTMLButtonElement>) => {
    triggerStrongButtonBurst(e, false);
    if (!isRunning) {
      sound.playWarpWhoosh();
    } else {
      sound.playClick();
    }
    setIsRunning(!isRunning);
  };

  const resetTimer = () => {
    sound.playClick();
    setIsRunning(false);
    setSecondsRemaining(selectedDurationMinutes * 60);
  };

  const addFiveMinutes = () => {
    sound.playClick();
    setSecondsRemaining((prev) => prev + 5 * 60);
  };

  // Scratchpad save
  const handleScratchpadChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    setScratchpad(val);
    try {
      localStorage.setItem('study_focus_scratchpad', val);
    } catch {}
    setScratchpadSavedNotice(true);
    setTimeout(() => setScratchpadSavedNotice(false), 2000);
  };

  // Complete Target Mission
  const handleAccomplishCurrentMission = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (!selectedMissionId) return;
    triggerMissionAccomplishedBurst(e);
    onCompleteMission(selectedMissionId);
  };

  // Format Time Display (MM:SS)
  const formatTime = (totalSec: number) => {
    const mins = Math.floor(totalSec / 60);
    const secs = totalSec % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  // Calculate Ring Progress
  const totalDurationSec = selectedDurationMinutes * 60;
  const progressRatio = totalDurationSec > 0 ? (totalDurationSec - secondsRemaining) / totalDurationSec : 0;
  const radius = 130;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - progressRatio * circumference;

  return (
    <div className="relative min-h-screen w-full flex flex-col justify-between text-white select-none overflow-x-hidden">
      {/* Subtle Space Fog & Radial Glow */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] rounded-full bg-cyan-600/10 blur-[140px] pointer-events-none" />
        <div className="absolute top-0 right-1/4 w-[400px] h-[400px] rounded-full bg-blue-600/10 blur-[120px] pointer-events-none" />
      </div>

      {/* Top Distraction-Free Space HUD Header */}
      <header className="relative z-20 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5 flex items-center justify-between border-b border-cyan-500/20 bg-black/40 backdrop-blur-md">
        {/* Left: Exit button & Mode status */}
        <div className="flex items-center space-x-4">
          <button
            onClick={() => {
              sound.playClick();
              sound.stopAmbient();
              onExitDeepFocus();
            }}
            className="flex items-center space-x-2 px-3.5 py-2 rounded-xl bg-cyan-950/40 hover:bg-cyan-900/60 border border-cyan-500/30 text-cyan-300 font-mono text-xs tracking-wider uppercase transition-all duration-200 active:scale-95 cursor-pointer shadow-[0_0_15px_rgba(6,182,212,0.15)]"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>EXIT DEEP FOCUS</span>
          </button>

          <div className="hidden sm:flex items-center space-x-2 border-l border-white/10 pl-4">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-cyan-400"></span>
            </span>
            <span className="text-[11px] font-mono tracking-widest text-cyan-200 font-bold uppercase">
              DEEP SPACE FOCUS PROTOCOL // ZERO CLUTTER
            </span>
          </div>
        </div>

        {/* Right: Ambient Sound Dock Controls */}
        <div className="flex items-center space-x-3">
          {/* Ambient Sound Dock */}
          <div className="relative">
            <div className="flex items-center space-x-2 bg-black/60 border border-cyan-500/30 rounded-xl px-3 py-1.5 shadow-[0_0_15px_rgba(6,182,212,0.1)]">
              <button
                onClick={toggleAudio}
                title={isAudioPlaying ? 'Mute Ambient Noise' : 'Play Ambient Noise'}
                className="text-cyan-400 hover:text-cyan-200 transition-colors p-1"
              >
                {isAudioPlaying ? (
                  <Headphones className="w-4 h-4 animate-pulse text-cyan-300" />
                ) : (
                  <VolumeX className="w-4 h-4 text-slate-500" />
                )}
              </button>

              <button
                onClick={() => setShowAudioMenu(!showAudioMenu)}
                className="flex items-center space-x-1.5 text-xs font-mono text-cyan-200 hover:text-white cursor-pointer"
              >
                <span className="uppercase tracking-wider font-semibold">
                  {soundPreset === 'white'
                    ? 'White Noise'
                    : soundPreset === 'cosmic'
                    ? 'Cosmic Drone'
                    : 'Pink Rain'}
                </span>
                <ChevronDown className="w-3 h-3 text-cyan-400" />
              </button>

              {/* Volume Slider */}
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={volume}
                onChange={handleVolumeChange}
                aria-label="Ambient volume"
                className="w-16 accent-cyan-400 cursor-pointer h-1 bg-slate-800 rounded-lg"
              />
            </div>

            {/* Sound Preset Dropdown */}
            {showAudioMenu && (
              <div className="absolute right-0 mt-2 w-56 rounded-xl bg-slate-950/95 border border-cyan-500/30 shadow-2xl p-2 z-50 backdrop-blur-xl">
                <div className="text-[10px] font-mono tracking-wider text-cyan-400/80 px-2 py-1 uppercase font-bold">
                  Ambient Track Presets
                </div>
                {(
                  [
                    { id: 'white', label: 'White Noise', desc: 'Gentle lowpassed hiss for high concentration' },
                    { id: 'cosmic', label: 'Cosmic Drone', desc: 'Deep sub-bass cabin hum & resonant space tone' },
                    { id: 'pink', label: 'Pink Rain', desc: 'Soft 1/f rainfall noise texture' },
                  ] as const
                ).map((t) => (
                  <button
                    key={t.id}
                    onClick={() => {
                      handlePresetChange(t.id);
                      setShowAudioMenu(false);
                    }}
                    className={`w-full text-left px-2.5 py-2 rounded-lg text-xs transition-colors flex flex-col ${
                      soundPreset === t.id
                        ? 'bg-cyan-500/20 text-cyan-200 border border-cyan-500/40'
                        : 'text-slate-300 hover:bg-white/5'
                    }`}
                  >
                    <span className="font-bold flex items-center justify-between">
                      {t.label}
                      {soundPreset === t.id && <Radio className="w-3 h-3 text-cyan-400" />}
                    </span>
                    <span className="text-[10px] text-slate-400 mt-0.5">{t.desc}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Streak indicator */}
          <div className="hidden md:flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-black/60 border border-cyan-500/20 text-xs font-mono text-cyan-300">
            <Flame className="w-4 h-4 text-amber-400" />
            <span>{streak}D STREAK</span>
          </div>
        </div>
      </header>

      {/* Main Focus Stage: 2-Column or Centered Minimalist Layout */}
      <main className="relative z-10 flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 flex flex-col lg:flex-row items-center justify-center gap-12 lg:gap-16">
        {/* Left: Glowing Cosmic Focus Timer */}
        <div className="flex flex-col items-center justify-center">
          {/* Preset Duration Pills */}
          <div className="flex items-center space-x-2 mb-8 bg-black/50 p-1.5 rounded-2xl border border-cyan-500/20 backdrop-blur-sm">
            {[
              { label: '25m Focus', mins: 25 },
              { label: '50m Sprint', mins: 50 },
              { label: '15m Burst', mins: 15 },
              { label: '5m Rest', mins: 5 },
            ].map((p) => (
              <button
                key={p.mins}
                onClick={() => setTimerPreset(p.mins)}
                className={`px-3 sm:px-4 py-1.5 rounded-xl text-xs font-mono font-bold tracking-wider uppercase transition-all duration-200 ${
                  selectedDurationMinutes === p.mins
                    ? 'bg-gradient-to-r from-cyan-500 to-blue-500 text-black shadow-[0_0_20px_rgba(6,182,212,0.4)]'
                    : 'text-slate-400 hover:text-white hover:bg-white/5'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>

          {/* Glowing Circular SVG Timer Ring */}
          <div className="relative flex items-center justify-center">
            <svg className="w-72 h-72 sm:w-80 sm:h-80 -rotate-90 transform">
              {/* Background Ring */}
              <circle
                cx="50%"
                cy="50%"
                r={radius}
                className="stroke-slate-900"
                strokeWidth="10"
                fill="transparent"
              />
              {/* Outer Cyan Accent Glow */}
              <circle
                cx="50%"
                cy="50%"
                r={radius}
                className="stroke-cyan-500/20"
                strokeWidth="18"
                fill="transparent"
              />
              {/* Progress Ring */}
              <circle
                cx="50%"
                cy="50%"
                r={radius}
                className="stroke-cyan-400 transition-all duration-500 ease-out"
                strokeWidth="10"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
                fill="transparent"
                style={{
                  filter: 'drop-shadow(0 0 12px rgba(6, 182, 212, 0.7))',
                }}
              />
            </svg>

            {/* Inner Center Timer Display */}
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-[11px] font-mono tracking-widest text-cyan-400 uppercase font-black">
                {isRunning ? '// TIME REMAINING' : '// SPRINT PAUSED'}
              </span>
              <h2 className="font-bebas text-6xl sm:text-7xl tracking-wider text-white font-black mt-1 drop-shadow-[0_0_25px_rgba(255,255,255,0.4)]">
                {formatTime(secondsRemaining)}
              </h2>
              <div className="flex items-center space-x-1.5 text-xs text-slate-400 font-mono mt-1">
                <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                <span>{sessionCount} COMPLETED TODAY</span>
              </div>
            </div>
          </div>

          {/* Primary Action Button Controls */}
          <div className="flex items-center space-x-4 mt-8">
            <button
              onClick={resetTimer}
              title="Reset Timer"
              className="p-3.5 rounded-2xl bg-black/60 hover:bg-slate-900 border border-white/10 text-slate-400 hover:text-white transition-all active:scale-95 cursor-pointer"
            >
              <RotateCcw className="w-5 h-5" />
            </button>

            <button
              onClick={toggleTimer}
              className={`flex items-center space-x-3 px-8 py-4 rounded-2xl font-mono text-sm tracking-widest uppercase font-black transition-all duration-300 active:scale-95 cursor-pointer shadow-xl ${
                isRunning
                  ? 'bg-amber-500 hover:bg-amber-400 text-black shadow-[0_0_30px_rgba(245,158,11,0.3)]'
                  : 'bg-cyan-400 hover:bg-cyan-300 text-black shadow-[0_0_35px_rgba(6,182,212,0.4)]'
              }`}
            >
              {isRunning ? (
                <>
                  <Pause className="w-5 h-5 fill-black" />
                  <span>PAUSE SPRINT</span>
                </>
              ) : (
                <>
                  <Play className="w-5 h-5 fill-black" />
                  <span>START FOCUS</span>
                </>
              )}
            </button>

            <button
              onClick={addFiveMinutes}
              title="Add 5 Minutes"
              className="px-4 py-3.5 rounded-2xl bg-black/60 hover:bg-slate-900 border border-white/10 text-xs font-mono text-slate-300 hover:text-cyan-300 transition-all active:scale-95 cursor-pointer"
            >
              +5 MIN
            </button>
          </div>
        </div>

        {/* Right: Active Target Task Card & Fast Flight Scratchpad */}
        <div className="w-full max-w-md flex flex-col space-y-6">
          {/* Target Focal Mission Card */}
          <div className="p-6 rounded-3xl bg-slate-950/70 border border-cyan-500/30 backdrop-blur-xl shadow-[0_0_35px_rgba(6,182,212,0.12)]">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-2">
                <Target className="w-5 h-5 text-cyan-400" />
                <span className="text-xs font-mono tracking-widest text-cyan-300 font-extrabold uppercase">
                  ACTIVE FOCAL OBJECTIVE
                </span>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-cyan-950 border border-cyan-500/30 text-cyan-300">
                1 MISSION IN FOCUS
              </span>
            </div>

            {/* Mission Selector Dropdown */}
            {pendingMissions.length > 0 && !isSettingCustomGoal ? (
              <div className="space-y-4">
                <div className="relative">
                  <select
                    value={selectedMissionId}
                    onChange={(e) => setSelectedMissionId(e.target.value)}
                    className="w-full appearance-none bg-black/70 border border-cyan-500/30 rounded-xl px-4 py-3 text-sm text-white font-medium focus:outline-none focus:border-cyan-400 cursor-pointer pr-10"
                  >
                    {pendingMissions.map((m) => (
                      <option key={m.id} value={m.id} className="bg-slate-950 text-white">
                        {m.title} {m.priority === 'Critical' ? '(!)' : ''}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="w-4 h-4 text-cyan-400 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>

                {selectedMission && (
                  <div className="p-4 rounded-2xl bg-black/50 border border-white/5 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-mono text-slate-400">
                        {subjectMap.get(selectedMission.subject_id || '')?.name || 'General Flight'}
                      </span>
                      <span
                        className={`text-[10px] font-mono px-2 py-0.5 rounded-full font-bold uppercase ${
                          selectedMission.priority === 'Critical'
                            ? 'bg-rose-950 text-rose-300 border border-rose-500/40'
                            : selectedMission.priority === 'High'
                            ? 'bg-amber-950 text-amber-300 border border-amber-500/40'
                            : 'bg-cyan-950 text-cyan-300 border border-cyan-500/40'
                        }`}
                      >
                        {selectedMission.priority} Priority
                      </span>
                    </div>

                    <h3 className="font-bold text-white text-base">
                      {selectedMission.title}
                    </h3>

                    {selectedMission.description && (
                      <p className="text-xs text-slate-400 line-clamp-2">
                        {selectedMission.description}
                      </p>
                    )}

                    {/* Accomplish Button */}
                    <button
                      onClick={handleAccomplishCurrentMission}
                      className="w-full mt-3 flex items-center justify-center space-x-2 py-2.5 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-400/40 text-cyan-200 font-mono text-xs font-bold tracking-wider uppercase transition-all duration-200 active:scale-95 cursor-pointer"
                    >
                      <CheckCircle2 className="w-4 h-4 text-cyan-400" />
                      <span>MARK COMPLETED & LAUNCH</span>
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-3">
                <input
                  type="text"
                  placeholder="e.g. Read Physics Chapter 4 notes..."
                  value={customGoal}
                  onChange={(e) => setCustomGoal(e.target.value)}
                  className="w-full bg-black/70 border border-cyan-500/30 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400"
                />
                {customGoal && (
                  <div className="p-3 rounded-xl bg-cyan-950/40 border border-cyan-500/20 text-xs text-cyan-200 flex items-center justify-between">
                    <span>Focal Goal: "{customGoal}"</span>
                    <button
                      onClick={(e) => {
                        triggerMissionAccomplishedBurst(e);
                        if (onAddQuickMission) onAddQuickMission(customGoal);
                        setCustomGoal('');
                      }}
                      className="px-2 py-1 rounded bg-cyan-500 text-black font-bold uppercase text-[10px]"
                    >
                      Save As Done
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Fast Flight Scratchpad */}
          <div className="p-6 rounded-3xl bg-slate-950/70 border border-white/10 backdrop-blur-xl shadow-lg space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <FileText className="w-4 h-4 text-slate-400" />
                <span className="text-xs font-mono tracking-widest text-slate-300 font-bold uppercase">
                  QUICK DISTRACTION SCRATCHPAD
                </span>
              </div>
              {scratchpadSavedNotice && (
                <span className="text-[10px] font-mono text-cyan-400 animate-fade-in">
                  AUTO-SAVED
                </span>
              )}
            </div>

            <p className="text-[11px] text-slate-500 leading-snug">
              Jot down stray thoughts, ideas, or to-dos without breaking your deep focus sprint.
            </p>

            <textarea
              value={scratchpad}
              onChange={handleScratchpadChange}
              placeholder="Dump stray thoughts here... 'Buy milk at 5', 'Check formula on page 82'..."
              rows={4}
              className="w-full bg-black/60 border border-white/10 focus:border-cyan-500/50 rounded-2xl p-3.5 text-xs text-slate-200 placeholder-slate-600 focus:outline-none resize-none font-mono transition-colors"
            />
          </div>
        </div>
      </main>

      {/* Minimal Footer HUD */}
      <footer className="relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex flex-col sm:flex-row items-center justify-between text-[11px] font-mono text-slate-500 border-t border-white/5">
        <div className="flex items-center space-x-2">
          <Clock className="w-3.5 h-3.5 text-cyan-400" />
          <span>AMBIENT BACKGROUND: {soundPreset.toUpperCase()} NOISE ACTIVE</span>
        </div>
        <div className="mt-2 sm:mt-0 flex items-center space-x-4">
          <span>PRESS ESC OR CLICK EXIT TO RETURN TO DASHBOARD</span>
        </div>
      </footer>
    </div>
  );
};
