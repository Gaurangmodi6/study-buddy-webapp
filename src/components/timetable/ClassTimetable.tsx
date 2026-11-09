import React, { useState, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Clock,
  Calendar,
  Upload,
  Plus,
  Trash2,
  Sparkles,
  Zap,
  CheckCircle2,
  AlertCircle,
  FileText,
  Image as ImageIcon,
  ChevronRight,
  ArrowRight,
  Compass,
  Rocket,
  Info,
  ExternalLink,
  BookOpen,
  Filter,
} from 'lucide-react';
import { ClassSession, DayOfWeek, Subject, Mission } from '../../types';
import {
  DAYS_OF_WEEK,
  DEFAULT_DAY_START,
  DEFAULT_DAY_END,
  analyzeDaySchedule,
  formatDuration,
  saveStoredClasses,
} from '../../lib/timetable';
import { sound } from '../../lib/audio';
import { triggerStrongButtonBurst } from '../particles/ClickBurst';
import { googleWorkspace } from '../../lib/workspace';

interface ClassTimetableProps {
  classes: ClassSession[];
  onUpdateClasses: (updated: ClassSession[]) => void;
  subjects: Subject[];
  onPlanMissionInSlot: (day: DayOfWeek, startTime: string, durationMinutes: number) => void;
  onToast: (message: string, type: 'success' | 'error' | 'info') => void;
}

export const ClassTimetable: React.FC<ClassTimetableProps> = ({
  classes,
  onUpdateClasses,
  subjects,
  onPlanMissionInSlot,
  onToast,
}) => {
  // Determine current day of week as initial tab
  const todayName = useMemo<DayOfWeek>(() => {
    const days: DayOfWeek[] = [
      'Sunday',
      'Monday',
      'Tuesday',
      'Wednesday',
      'Thursday',
      'Friday',
      'Saturday',
    ];
    const current = days[new Date().getDay()];
    return current;
  }, []);

  const [selectedDay, setSelectedDay] = useState<DayOfWeek>(todayName);
  const [dayStart, setDayStart] = useState<string>(DEFAULT_DAY_START);
  const [dayEnd, setDayEnd] = useState<string>(DEFAULT_DAY_END);

  // Upload & AI modal states
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [isAddClassModalOpen, setIsAddClassModalOpen] = useState(false);
  const [isParsingAI, setIsParsingAI] = useState(false);
  const [pastedText, setPastedText] = useState('');
  const [uploadedImageBase64, setUploadedImageBase64] = useState<string | null>(null);
  const [uploadedImagePreview, setUploadedImagePreview] = useState<string | null>(null);
  const [aiAnalysisResult, setAiAnalysisResult] = useState<{
    insight?: string;
    recommendation?: string;
    totalClasses?: number;
  } | null>(null);

  // Manual Class Add form state
  const [newClassDay, setNewClassDay] = useState<DayOfWeek>(selectedDay);
  const [newClassSubject, setNewClassSubject] = useState('');
  const [newClassStartTime, setNewClassStartTime] = useState('09:00');
  const [newClassEndTime, setNewClassEndTime] = useState('10:30');
  const [newClassRoom, setNewClassRoom] = useState('');
  const [newClassInstructor, setNewClassInstructor] = useState('');

  // Syncing to Google Calendar
  const [isSyncingCalendar, setIsSyncingCalendar] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Analyze active day schedule
  const dayAnalysis = useMemo(() => {
    return analyzeDaySchedule(selectedDay, classes, dayStart, dayEnd);
  }, [selectedDay, classes, dayStart, dayEnd]);

  // Overall weekly free time statistics
  const weeklyStats = useMemo(() => {
    let totalFree = 0;
    let totalClasses = 0;
    const daySummaries = DAYS_OF_WEEK.map((d) => {
      const a = analyzeDaySchedule(d, classes, dayStart, dayEnd);
      totalFree += a.totalFreeMinutes;
      totalClasses += a.totalClassMinutes;
      return {
        day: d,
        freeMinutes: a.totalFreeMinutes,
        classMinutes: a.totalClassMinutes,
        classCount: a.classes.length,
      };
    });
    return {
      totalFreeMinutes: totalFree,
      totalClassMinutes: totalClasses,
      daySummaries,
    };
  }, [classes, dayStart, dayEnd]);

  // Handle image upload selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      onToast('Please upload an image file (PNG, JPG, WEBP).', 'error');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      setUploadedImageBase64(result);
      setUploadedImagePreview(result);
    };
    reader.readAsDataURL(file);
  };

  // Submit to Gemini AI Timetable Parser
  const handleAITimetableParse = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pastedText.trim() && !uploadedImageBase64) {
      onToast('Please provide a timetable image or paste your class schedule notes.', 'info');
      return;
    }

    setIsParsingAI(true);
    sound.rocketLaunch();

    try {
      const response = await fetch('/api/gemini/parse-timetable', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: pastedText.trim() || undefined,
          imageBase64: uploadedImageBase64 || undefined,
          mimeType: uploadedImageBase64 ? 'image/jpeg' : undefined,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to parse timetable via Gemini.');
      }

      const data = await response.json();
      const detectedClasses = data.classes || [];

      if (!Array.isArray(detectedClasses) || detectedClasses.length === 0) {
        onToast('Gemini could not detect any classes in the provided input.', 'error');
        setIsParsingAI(false);
        return;
      }

      // Convert to ClassSession objects
      const newSessions: ClassSession[] = detectedClasses.map((item: any, idx: number) => {
        // Match day safely
        const rawDay = (item.day || 'Monday').trim();
        const matchedDay =
          DAYS_OF_WEEK.find((d) => d.toLowerCase() === rawDay.toLowerCase()) || 'Monday';

        return {
          id: `ai-${Date.now()}-${idx}`,
          day: matchedDay,
          subject: item.subject || 'Class Session',
          startTime: item.startTime || '09:00',
          endTime: item.endTime || '10:00',
          room: item.room || '',
          instructor: item.instructor || '',
          color: '#38bdf8',
        };
      });

      // Merge with existing or replace
      const merged = [...classes, ...newSessions];
      onUpdateClasses(merged);
      saveStoredClasses('guest', merged);

      setAiAnalysisResult({
        insight: data.analysis?.freeTimeInsight || 'Classes successfully analyzed into flight timeline.',
        recommendation: data.analysis?.recommendation || 'Plan high-focus study sprints in long gaps.',
        totalClasses: detectedClasses.length,
      });

      sound.taskComplete();
      onToast(`Gemini successfully extracted ${detectedClasses.length} class timings!`, 'success');
      setIsUploadModalOpen(false);
      setPastedText('');
      setUploadedImageBase64(null);
      setUploadedImagePreview(null);
    } catch (err: any) {
      console.error('Gemini timetable parse failed', err);
      onToast('Error parsing timetable: ' + (err?.message || 'Check connection'), 'error');
    } finally {
      setIsParsingAI(false);
    }
  };

  // Add manual class
  const handleAddManualClass = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newClassSubject.trim()) {
      onToast('Please enter a class subject name.', 'info');
      return;
    }

    const newSession: ClassSession = {
      id: `manual-${Date.now()}`,
      day: newClassDay,
      subject: newClassSubject.trim(),
      startTime: newClassStartTime,
      endTime: newClassEndTime,
      room: newClassRoom.trim() || undefined,
      instructor: newClassInstructor.trim() || undefined,
      color: '#38bdf8',
    };

    const updated = [...classes, newSession];
    onUpdateClasses(updated);
    saveStoredClasses('guest', updated);

    sound.click();
    onToast(`Added ${newClassSubject} to ${newClassDay}!`, 'success');
    setIsAddClassModalOpen(false);
    setNewClassSubject('');
    setNewClassRoom('');
    setNewClassInstructor('');
  };

  // Delete a class
  const handleDeleteClass = (id: string, subjectName: string) => {
    sound.click();
    const updated = classes.filter((c) => c.id !== id);
    onUpdateClasses(updated);
    saveStoredClasses('guest', updated);
    onToast(`Removed ${subjectName} from schedule.`, 'info');
  };

  // Sync Classes to Google Calendar
  const handleSyncToGoogleCalendar = async () => {
    setIsSyncingCalendar(true);
    sound.rocketLaunch();

    try {
      if (!googleWorkspace.hasToken()) {
        const authed = await googleWorkspace.signInWithGoogle();
        if (!authed) {
          onToast('Google authentication required to sync calendar.', 'error');
          setIsSyncingCalendar(false);
          return;
        }
      }

      // Add next upcoming occurrence for each class
      const today = new Date();
      let syncedCount = 0;

      for (const c of classes) {
        // Calculate upcoming date for this day of week
        const targetDayIdx = DAYS_OF_WEEK.indexOf(c.day) + 1; // 1 = Mon ... 7 = Sun
        const currentDayIdx = today.getDay() === 0 ? 7 : today.getDay();
        let daysAhead = targetDayIdx - currentDayIdx;
        if (daysAhead < 0) daysAhead += 7;

        const eventDate = new Date(today);
        eventDate.setDate(today.getDate() + daysAhead);

        const [startH, startM] = c.startTime.split(':').map(Number);
        const [endH, endM] = c.endTime.split(':').map(Number);

        const startDateTime = new Date(eventDate);
        startDateTime.setHours(startH, startM, 0, 0);

        const endDateTime = new Date(eventDate);
        endDateTime.setHours(endH, endM, 0, 0);

        await googleWorkspace.createCalendarEvent({
          summary: `🎓 Class: ${c.subject}`,
          description: `Location: ${c.room || 'Campus'}\nInstructor: ${c.instructor || 'Staff'}\nScheduled via Study Buddy Mission Control`,
          start: { dateTime: startDateTime.toISOString() },
          end: { dateTime: endDateTime.toISOString() },
          location: c.room || 'Academic Campus',
        });
        syncedCount++;
      }

      sound.taskComplete();
      onToast(`Successfully synced ${syncedCount} classes to your Google Calendar!`, 'success');
    } catch (err: any) {
      console.error('Calendar sync error', err);
      onToast('Failed to sync to Google Calendar: ' + (err?.message || 'Check authorization'), 'error');
    } finally {
      setIsSyncingCalendar(false);
    }
  };

  return (
    <div className="space-y-8 animate-fadeIn text-slate-900">
      {/* Top Banner: Day Selector & Quick Action Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-xs font-black bg-black text-white border border-black shadow-sm">
              <Clock className="w-3.5 h-3.5 text-white" />
              CLASS SCHEDULE & FREE TIME ANALYZER
            </span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900 uppercase font-bebas">
            MY CLASSES & DAILY FREE TIME
          </h1>
          <p className="text-slate-600 text-sm max-w-2xl mt-1">
            Upload your university timetable or enter class periods. Mission Control computes your
            free time windows so you can instantly plan your study sessions.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={(e) => {
              triggerStrongButtonBurst(e, true);
              setIsUploadModalOpen(true);
            }}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-black hover:bg-slate-800 text-white font-black text-sm tracking-wide transition-all shadow-md active:scale-95 cursor-pointer"
          >
            <Sparkles className="w-4 h-4 text-white" />
            UPLOAD TIMETABLE (AI SCAN)
          </button>

          <button
            onClick={(e) => {
              triggerStrongButtonBurst(e, false);
              setNewClassDay(selectedDay);
              setIsAddClassModalOpen(true);
            }}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white hover:bg-slate-100 text-black font-bold text-sm border-2 border-black transition-all active:scale-95 cursor-pointer"
          >
            <Plus className="w-4 h-4 text-black stroke-[3]" />
            ADD CLASS
          </button>

          <button
            onClick={handleSyncToGoogleCalendar}
            disabled={isSyncingCalendar || classes.length === 0}
            className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-black font-bold text-xs border border-slate-300 transition-all disabled:opacity-50 cursor-pointer shadow-sm"
            title="Sync class schedule to your Google Calendar"
          >
            <Calendar className="w-4 h-4 text-black" />
            {isSyncingCalendar ? 'SYNCING...' : 'SYNC GOOGLE CALENDAR'}
          </button>
        </div>
      </div>

      {/* AI Intelligence Insight Banner (if generated) */}
      {aiAnalysisResult && (
        <div className="p-4 rounded-xl bg-white/5 border border-white/20 flex items-start gap-3">
          <Sparkles className="w-5 h-5 text-[#38bdf8] shrink-0 mt-0.5" />
          <div className="text-sm">
            <span className="font-bold text-white">GEMINI ANALYSIS: </span>
            <span className="text-white/95">{aiAnalysisResult.insight} </span>
            <span className="text-[#38bdf8] font-bold">{aiAnalysisResult.recommendation}</span>
          </div>
        </div>
      )}

      {/* Main Free-Time Summary Cards for Active Day (Clear White-Outlined Cards on Black Background) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Free Time */}
        <div className="p-5 rounded-xl bg-black border-2 border-white text-white shadow-xl">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-black text-white tracking-wider uppercase">
              {selectedDay.toUpperCase()} FREE TIME
            </span>
            <Clock className="w-4 h-4 text-white" />
          </div>
          <div className="text-3xl font-black text-white font-mono">
            {formatDuration(dayAnalysis.totalFreeMinutes)}
          </div>
          <div className="mt-1 inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-white text-black text-[10px] font-black uppercase">
            <Zap className="w-3 h-3 fill-black" />
            FREE TIME AVAILABLE
          </div>
        </div>

        {/* In-Class Duration */}
        <div className="p-5 rounded-xl bg-black border-2 border-white text-white shadow-xl">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-black text-white tracking-wider uppercase">
              TIME IN CLASS
            </span>
            <BookOpen className="w-4 h-4 text-white" />
          </div>
          <div className="text-3xl font-black text-white font-mono">
            {formatDuration(dayAnalysis.totalClassMinutes)}
          </div>
          <p className="text-xs text-white/80 mt-1 font-medium">
            {dayAnalysis.classes.length} class session{dayAnalysis.classes.length !== 1 ? 's' : ''} scheduled
          </p>
        </div>

        {/* Free Study Blocks Count */}
        <div className="p-5 rounded-xl bg-black border-2 border-white text-white shadow-xl">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-black text-white tracking-wider uppercase">
              STUDY WINDOWS
            </span>
            <Zap className="w-4 h-4 fill-white text-white" />
          </div>
          <div className="text-3xl font-black text-white font-mono">
            {dayAnalysis.freeSlots.length} Windows
          </div>
          <p className="text-xs text-white/80 mt-1 font-medium">
            Gaps between classes & evening hours
          </p>
        </div>

        {/* Weekly Total Free Time */}
        <div className="p-5 rounded-xl bg-black border-2 border-white text-white shadow-xl">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-black text-white tracking-wider uppercase">
              WEEKLY FREE TIME
            </span>
            <Rocket className="w-4 h-4 text-white" />
          </div>
          <div className="text-3xl font-black text-white font-mono">
            {formatDuration(weeklyStats.totalFreeMinutes)}
          </div>
          <p className="text-xs text-white/80 mt-1 font-medium">
            Across Mon – Sun ({formatDuration(weeklyStats.totalClassMinutes)} class)
          </p>
        </div>
      </div>

      {/* Day Selector Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none border-b border-slate-300">
        {DAYS_OF_WEEK.map((d) => {
          const isSelected = selectedDay === d;
          const isToday = d === todayName;
          const a = analyzeDaySchedule(d, classes, dayStart, dayEnd);

          return (
            <button
              key={d}
              onClick={(e) => {
                triggerStrongButtonBurst(e, false);
                setSelectedDay(d);
              }}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-all whitespace-nowrap cursor-pointer ${
                isSelected
                  ? 'bg-black text-white border-2 border-black shadow-lg scale-[1.02]'
                  : 'bg-white text-black hover:bg-slate-100 border-2 border-slate-300'
              }`}
            >
              <span>{d}</span>
              {isToday && (
                <span
                  className={`text-[10px] uppercase px-1.5 py-0.5 rounded font-black ${
                    isSelected ? 'bg-white text-black' : 'bg-black text-white'
                  }`}
                >
                  TODAY
                </span>
              )}
              <span
                className={`text-xs px-2 py-0.5 rounded-full font-mono ${
                  isSelected ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-700'
                }`}
              >
                {formatDuration(a.totalFreeMinutes)} free
              </span>
            </button>
          );
        })}
      </div>

      {/* Day Timetable & Free Time Breakdown Section */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Chronological Flight Timeline (Classes + Free Windows) */}
        <div className="lg:col-span-8 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-black tracking-tight text-slate-900 flex items-center gap-2 uppercase font-bebas">
              <Calendar className="w-5 h-5 text-black" />
              {selectedDay.toUpperCase()} FLIGHT RADAR & TIMELINE
            </h2>
            <div className="flex items-center gap-2 text-xs text-slate-600 font-medium">
              <span>Day boundary:</span>
              <input
                type="time"
                value={dayStart}
                onChange={(e) => setDayStart(e.target.value)}
                className="bg-white border-2 border-slate-300 rounded px-2 py-0.5 text-xs text-black font-mono font-bold"
              />
              <span>to</span>
              <input
                type="time"
                value={dayEnd}
                onChange={(e) => setDayEnd(e.target.value)}
                className="bg-white border-2 border-slate-300 rounded px-2 py-0.5 text-xs text-black font-mono font-bold"
              />
            </div>
          </div>

          {/* Chronological List of Events (Classes and Free Time Gaps) */}
          <div className="space-y-3">
            {dayAnalysis.classes.length === 0 ? (
              /* High-Contrast Clear White-Outlined Card on Black Background with Free Time Indicator */
              <div className="p-8 rounded-2xl bg-black border-2 border-white text-white text-center space-y-5 shadow-2xl">
                <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white text-black text-xs font-black uppercase tracking-wider shadow-md">
                  <Zap className="w-4 h-4 fill-black" />
                  FREE TIME INDICATOR • ENTIRE DAY OPEN
                </div>

                <div className="w-16 h-16 rounded-2xl bg-white text-black flex items-center justify-center mx-auto shadow-xl">
                  <Clock className="w-8 h-8 stroke-[2.3]" />
                </div>

                <div className="space-y-2">
                  <h3 className="text-2xl sm:text-3xl font-extrabold text-white uppercase tracking-tight font-bebas">
                    NO CLASSES SCHEDULED ON {selectedDay.toUpperCase()}
                  </h3>
                  <p className="text-sm text-slate-200 max-w-lg mx-auto font-medium">
                    You have <strong className="text-white underline font-bold">{formatDuration(dayAnalysis.totalFreeMinutes)}</strong> of 100% uninterrupted free time today. Ideal for deep work, study sprints, and completing upcoming assignments.
                  </p>
                </div>

                <div className="inline-flex items-center gap-3 p-3.5 rounded-xl bg-black border border-white/40">
                  <span className="text-xs font-mono uppercase tracking-wider text-slate-300 font-bold">AVAILABLE STUDY DURATION:</span>
                  <span className="text-xl font-extrabold text-white font-mono bg-white/20 px-3 py-1 rounded-lg border border-white/60">
                    {formatDuration(dayAnalysis.totalFreeMinutes)}
                  </span>
                </div>

                <div className="pt-2">
                  <button
                    onClick={() => onPlanMissionInSlot(selectedDay, dayStart, 120)}
                    className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-white hover:bg-slate-200 text-black font-extrabold text-xs tracking-wider uppercase transition-all shadow-xl active:scale-95 cursor-pointer"
                  >
                    <Plus className="w-4 h-4 stroke-[3]" />
                    SCHEDULE FREE TIME STUDY SPRINT
                  </button>
                </div>
              </div>
            ) : (
              // Interleave Classes and Free Time Slots in chronological order
              (() => {
                const chronologicalItems: Array<
                  | { type: 'class'; item: ClassSession; sortMinutes: number }
                  | { type: 'free'; item: (typeof dayAnalysis.freeSlots)[0]; sortMinutes: number }
                > = [];

                dayAnalysis.classes.forEach((c) => {
                  const [h, m] = c.startTime.split(':').map(Number);
                  chronologicalItems.push({
                    type: 'class',
                    item: c,
                    sortMinutes: h * 60 + m,
                  });
                });

                dayAnalysis.freeSlots.forEach((f) => {
                  const [h, m] = f.startTime.split(':').map(Number);
                  chronologicalItems.push({
                    type: 'free',
                    item: f,
                    sortMinutes: h * 60 + m,
                  });
                });

                chronologicalItems.sort((a, b) => a.sortMinutes - b.sortMinutes);

                return chronologicalItems.map((block, i) => {
                  if (block.type === 'class') {
                    const c = block.item as ClassSession;
                    return (
                      <div
                        key={`class-${c.id}-${i}`}
                        className="p-4 rounded-xl bg-black border-2 border-white text-white flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xl transition-all hover:border-white/90"
                      >
                        <div className="flex items-start gap-3.5">
                          <div className="w-10 h-10 rounded-lg bg-white text-black flex flex-col items-center justify-center shrink-0 font-black shadow-md">
                            <BookOpen className="w-4 h-4 stroke-[2.5]" />
                            <span className="text-[9px] font-black uppercase">CLASS</span>
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <h4 className="text-base font-extrabold text-white tracking-wide">
                                {c.subject}
                              </h4>
                              {c.room && (
                                <span className="text-xs px-2 py-0.5 rounded border border-white/60 bg-white/10 text-white font-mono">
                                  {c.room}
                                </span>
                              )}
                            </div>
                            <div className="text-xs text-slate-200 mt-1 flex items-center gap-3 font-medium">
                              <span className="font-bold text-white bg-white/20 px-2 py-0.5 rounded border border-white/30">
                                🕒 {c.startTime} — {c.endTime}
                              </span>
                              {c.instructor && <span className="text-slate-200">• Instructor: {c.instructor}</span>}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 self-end sm:self-center">
                          <button
                            onClick={() => handleDeleteClass(c.id, c.subject)}
                            className="p-2 rounded-lg text-white hover:text-red-400 hover:bg-white/10 border border-white/30 transition-colors cursor-pointer"
                            title="Remove class"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    );
                  } else {
                    const f = block.item as (typeof dayAnalysis.freeSlots)[0];
                    return (
                      <div
                        key={`free-${f.id}-${i}`}
                        className="p-4 rounded-xl bg-black border-2 border-white text-white flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xl transition-all hover:border-white/90"
                      >
                        <div className="flex items-start gap-3.5">
                          <div className="w-10 h-10 rounded-lg bg-white text-black flex flex-col items-center justify-center shrink-0 font-black shadow-md">
                            <Zap className="w-4 h-4 fill-black" />
                            <span className="text-[9px] font-black uppercase">FREE</span>
                          </div>
                          <div>
                            <div className="flex flex-wrap items-center gap-2">
                              <h4 className="text-base font-extrabold text-white tracking-wide">
                                {f.label} ({formatDuration(f.durationMinutes)})
                              </h4>
                              <span className="text-[10px] font-black px-2.5 py-0.5 rounded-full bg-white text-black uppercase tracking-wider shadow-sm">
                                FREE TIME INDICATOR • {formatDuration(f.durationMinutes)}
                              </span>
                            </div>
                            <div className="text-xs text-slate-200 mt-1 font-medium">
                              Open schedule slot: <strong className="text-white font-bold">{f.startTime}</strong> to{' '}
                              <strong className="text-white font-bold">{f.endTime}</strong> • Unoccupied for study sprints.
                            </div>
                          </div>
                        </div>

                        <button
                          onClick={(e) => {
                            triggerStrongButtonBurst(e, false);
                            onPlanMissionInSlot(selectedDay, f.startTime, f.durationMinutes);
                          }}
                          className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-white hover:bg-slate-200 text-black font-extrabold text-xs tracking-wider uppercase transition-all shadow-md active:scale-95 cursor-pointer shrink-0 self-end sm:self-center"
                        >
                          <Plus className="w-3.5 h-3.5 stroke-[3]" />
                          PLAN STUDY BLOCK
                        </button>
                      </div>
                    );
                  }
                });
              })()
            )}
          </div>
        </div>

        {/* Right Column: Weekly Free Time Distribution Radar (Clear White-Outlined Cards on Black Background) */}
        <div className="lg:col-span-4 space-y-4">
          <div className="p-5 rounded-2xl bg-black border-2 border-white text-white space-y-4 shadow-xl">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-black text-white flex items-center gap-2 uppercase font-bebas">
                <Clock className="w-4 h-4 text-white" />
                WEEKLY FREE-TIME RADAR
              </h3>
              <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded bg-white text-black">
                FREE CAPACITY
              </span>
            </div>
            <p className="text-xs text-white/80">
              Your free time calculated across every day of the week based on your class schedule:
            </p>

            <div className="space-y-2.5">
              {weeklyStats.daySummaries.map((ds) => {
                const isCurrent = ds.day === selectedDay;
                const totalDayMinutes = 14 * 60; // 08:00 to 22:00 = 14 hours
                const freePercent = Math.min(100, Math.round((ds.freeMinutes / totalDayMinutes) * 100));

                return (
                  <div
                    key={ds.day}
                    onClick={() => setSelectedDay(ds.day)}
                    className={`p-2.5 rounded-xl border transition-all cursor-pointer ${
                      isCurrent
                        ? 'bg-white text-black border-white shadow-lg'
                        : 'bg-black text-white border-white/40 hover:border-white'
                    }`}
                  >
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="font-bold flex items-center gap-1.5">
                        {ds.day}
                        {ds.day === todayName && (
                          <span className={`text-[9px] px-1 rounded font-black ${isCurrent ? 'bg-black text-white' : 'bg-white text-black'}`}>
                            TODAY
                          </span>
                        )}
                      </span>
                      <span className={`font-mono font-bold ${isCurrent ? 'text-black' : 'text-white'}`}>
                        {formatDuration(ds.freeMinutes)} free
                      </span>
                    </div>

                    {/* Progress Bar of Free Time vs Class Time */}
                    <div className={`w-full rounded-full h-2 overflow-hidden flex ${isCurrent ? 'bg-slate-200' : 'bg-white/20'}`}>
                      <div
                        className={`h-2 transition-all ${isCurrent ? 'bg-black' : 'bg-white'}`}
                        style={{ width: `${freePercent}%` }}
                        title={`${freePercent}% Free Time`}
                      />
                      <div
                        className={`h-2 transition-all ${isCurrent ? 'bg-slate-400' : 'bg-white/40'}`}
                        style={{
                          width: `${Math.min(
                            100 - freePercent,
                            Math.round((ds.classMinutes / totalDayMinutes) * 100)
                          )}%`,
                        }}
                        title={`Class Time`}
                      />
                    </div>
                    <div className={`flex items-center justify-between text-[10px] mt-1 font-medium ${isCurrent ? 'text-slate-600' : 'text-white/70'}`}>
                      <span>{ds.classCount} class{ds.classCount !== 1 ? 'es' : ''}</span>
                      <span>{freePercent}% free capacity</span>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="pt-3 border-t border-white/20 space-y-1">
              <div className="text-xs text-white/90 flex items-center justify-between">
                <span>Total Weekly Free Time:</span>
                <strong className="text-white text-sm font-mono font-black">
                  {formatDuration(weeklyStats.totalFreeMinutes)}
                </strong>
              </div>
              <div className="text-xs text-white/90 flex items-center justify-between">
                <span>Total Weekly Class Time:</span>
                <strong className="text-white text-sm font-mono font-black">
                  {formatDuration(weeklyStats.totalClassMinutes)}
                </strong>
              </div>
            </div>
          </div>

          {/* Quick Tips Box */}
          <div className="p-4 rounded-2xl bg-black border-2 border-white text-xs text-white space-y-2 shadow-lg">
            <div className="font-black text-white flex items-center gap-1.5 uppercase font-mono">
              <Info className="w-4 h-4 text-white" />
              FLIGHT DIRECTOR TIP
            </div>
            <p className="text-white/80 leading-relaxed font-medium">
              Use <strong>Deep Work Windows</strong> (2h+ free blocks) for complex problem sets
              or project assignments, and reserve <strong>Quick Review</strong> (15–45m) for flashcards
              and lecture reviews between classes.
            </p>
          </div>
        </div>
      </div>

      {/* Upload Timetable / AI Parser Modal */}
      <AnimatePresence>
        {isUploadModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-xl bg-black border border-sky-500/40 rounded-2xl p-6 shadow-2xl relative space-y-5"
            >
              <div className="flex items-center justify-between border-b border-sky-900/40 pb-4">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-sky-950 border border-sky-500/40 flex items-center justify-center text-sky-400">
                    <Sparkles className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-white font-bebas tracking-wide">
                      UPLOAD TIMETABLE (AI GEMINI SCANNER)
                    </h3>
                    <p className="text-xs text-slate-300">
                      Upload an image/photo of your class schedule, or paste timetable text
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setIsUploadModalOpen(false)}
                  className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleAITimetableParse} className="space-y-4">
                {/* File Upload Area */}
                <div>
                  <label className="block text-xs font-bold text-sky-400 uppercase tracking-wider mb-1.5">
                    1. Upload Timetable Screenshot / Photo / Document
                  </label>
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="border-2 border-dashed border-sky-500/40 hover:border-sky-400 rounded-xl p-5 text-center cursor-pointer transition-all bg-sky-950/20 hover:bg-sky-950/40"
                  >
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleFileChange}
                      className="hidden"
                    />
                    {uploadedImagePreview ? (
                      <div className="space-y-2">
                        <img
                          src={uploadedImagePreview}
                          alt="Timetable Preview"
                          className="max-h-40 mx-auto rounded-lg border border-sky-500/40 object-contain"
                        />
                        <p className="text-xs text-emerald-400 font-bold">
                          ✓ Image loaded. Ready for Gemini analysis!
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-1.5">
                        <Upload className="w-8 h-8 text-sky-400 mx-auto" />
                        <div className="text-sm font-bold text-white">
                          Click to select timetable image or drag & drop
                        </div>
                        <p className="text-xs text-slate-400">
                          Supports PNG, JPG, WEBP screenshots of your college or school schedule
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Paste Text Fallback */}
                <div>
                  <label className="block text-xs font-bold text-sky-400 uppercase tracking-wider mb-1.5">
                    2. OR Paste Schedule Notes / Syllabus Timings
                  </label>
                  <textarea
                    rows={4}
                    value={pastedText}
                    onChange={(e) => setPastedText(e.target.value)}
                    placeholder="e.g. Monday: Physics 9am-10:30am Hall A, Math 1pm-2:30pm&#10;Wednesday: Chemistry 10am-12pm Lab 2&#10;Friday: Computer Science 2pm-4pm"
                    className="w-full bg-black border border-sky-900/60 rounded-xl p-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-sky-400 font-mono"
                  />
                </div>

                <div className="flex items-center justify-end gap-3 pt-3 border-t border-sky-900/40">
                  <button
                    type="button"
                    onClick={() => setIsUploadModalOpen(false)}
                    className="px-4 py-2 rounded-lg text-sm font-semibold text-slate-300 hover:text-white cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isParsingAI || (!uploadedImageBase64 && !pastedText.trim())}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-sky-500 hover:bg-sky-400 disabled:opacity-50 text-black font-bold text-sm tracking-wide transition-all shadow-lg shadow-sky-500/25 active:scale-95 cursor-pointer"
                  >
                    <Sparkles className="w-4 h-4 text-black" />
                    {isParsingAI ? 'GEMINI SCANNING TIMETABLE...' : 'PARSE & COMPUTE FREE TIME'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Manual Class Add Modal */}
      <AnimatePresence>
        {isAddClassModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-lg bg-black border border-sky-500/40 rounded-2xl p-6 shadow-2xl relative space-y-4"
            >
              <div className="flex items-center justify-between border-b border-sky-900/40 pb-4">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-blue-950 border border-blue-500/40 flex items-center justify-center text-blue-400">
                    <Plus className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-white font-bebas tracking-wide">
                      ADD CLASS SESSION
                    </h3>
                    <p className="text-xs text-slate-300">
                      Add a scheduled lecture, seminar, or lab period
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setIsAddClassModalOpen(false)}
                  className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleAddManualClass} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-sky-400 uppercase tracking-wider mb-1">
                    Day of Week
                  </label>
                  <select
                    value={newClassDay}
                    onChange={(e) => setNewClassDay(e.target.value as DayOfWeek)}
                    className="w-full bg-black border border-sky-900/60 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-sky-400"
                  >
                    {DAYS_OF_WEEK.map((d) => (
                      <option key={d} value={d}>
                        {d}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-sky-400 uppercase tracking-wider mb-1">
                    Class / Subject Name
                  </label>
                  <input
                    type="text"
                    required
                    value={newClassSubject}
                    onChange={(e) => setNewClassSubject(e.target.value)}
                    placeholder="e.g. Astrophysics 301, Organic Chemistry, Linear Algebra"
                    className="w-full bg-black border border-sky-900/60 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-sky-400"
                  />
                  {/* Quick subject picker chips */}
                  {subjects.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      <span className="text-[11px] text-slate-400 mr-1">Quick pick:</span>
                      {subjects.map((s) => (
                        <button
                          key={s.id}
                          type="button"
                          onClick={() => setNewClassSubject(s.name)}
                          className="text-[11px] px-2 py-0.5 rounded bg-sky-950/60 border border-sky-800/40 text-sky-300 hover:bg-sky-900/60 cursor-pointer"
                        >
                          {s.name}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-sky-400 uppercase tracking-wider mb-1">
                      Start Time
                    </label>
                    <input
                      type="time"
                      required
                      value={newClassStartTime}
                      onChange={(e) => setNewClassStartTime(e.target.value)}
                      className="w-full bg-black border border-sky-900/60 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-sky-400"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-sky-400 uppercase tracking-wider mb-1">
                      End Time
                    </label>
                    <input
                      type="time"
                      required
                      value={newClassEndTime}
                      onChange={(e) => setNewClassEndTime(e.target.value)}
                      className="w-full bg-black border border-sky-900/60 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-sky-400"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-sky-400 uppercase tracking-wider mb-1">
                      Hall / Room (Optional)
                    </label>
                    <input
                      type="text"
                      value={newClassRoom}
                      onChange={(e) => setNewClassRoom(e.target.value)}
                      placeholder="e.g. Hall 4B or Zoom"
                      className="w-full bg-black border border-sky-900/60 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-sky-400"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-sky-400 uppercase tracking-wider mb-1">
                      Instructor (Optional)
                    </label>
                    <input
                      type="text"
                      value={newClassInstructor}
                      onChange={(e) => setNewClassInstructor(e.target.value)}
                      placeholder="e.g. Dr. Feynman"
                      className="w-full bg-black border border-sky-900/60 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-sky-400"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-end gap-3 pt-3 border-t border-sky-900/40">
                  <button
                    type="button"
                    onClick={() => setIsAddClassModalOpen(false)}
                    className="px-4 py-2 rounded-lg text-sm font-semibold text-slate-300 hover:text-white cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-sky-500 hover:bg-sky-400 text-black font-bold text-sm tracking-wide transition-all shadow-lg shadow-sky-500/25 active:scale-95 cursor-pointer"
                  >
                    <Plus className="w-4 h-4 text-black" />
                    SAVE CLASS
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
