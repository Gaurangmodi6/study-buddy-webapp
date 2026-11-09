import { ClassSession, DayOfWeek, FreeTimeSlot, DailyScheduleAnalysis } from '../types';

export const DAYS_OF_WEEK: DayOfWeek[] = [
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
  'Sunday',
];

export const DEFAULT_DAY_START = '08:00';
export const DEFAULT_DAY_END = '22:00';

// Convert "HH:MM" to minutes from midnight
export function timeToMinutes(timeStr: string): number {
  if (!timeStr) return 0;
  const [h, m] = timeStr.split(':').map((num) => parseInt(num, 10) || 0);
  return h * 60 + m;
}

// Convert minutes from midnight to "HH:MM"
export function minutesToTime(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
}

// Format duration into readable string e.g. "2h 15m" or "45m"
export function formatDuration(minutes: number): string {
  if (minutes < 60) {
    return `${minutes}m`;
  }
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (m === 0) {
    return `${h}h`;
  }
  return `${h}h ${m}m`;
}

// Calculate free time slots given classes for a specific day
export function analyzeDaySchedule(
  day: DayOfWeek,
  classes: ClassSession[],
  dayStart = DEFAULT_DAY_START,
  dayEnd = DEFAULT_DAY_END
): DailyScheduleAnalysis {
  const dayClasses = classes
    .filter((c) => c.day === day)
    .sort((a, b) => timeToMinutes(a.startTime) - timeToMinutes(b.startTime));

  const startBound = timeToMinutes(dayStart);
  const endBound = timeToMinutes(dayEnd);

  // Merge overlapping classes if any to find busy intervals
  const busyIntervals: { start: number; end: number }[] = [];
  let totalClassMinutes = 0;

  for (const c of dayClasses) {
    const cStart = Math.max(startBound, timeToMinutes(c.startTime));
    const cEnd = Math.min(endBound, timeToMinutes(c.endTime));
    if (cEnd > cStart) {
      totalClassMinutes += cEnd - cStart;
      busyIntervals.push({ start: cStart, end: cEnd });
    }
  }

  // Merge overlapping busy intervals
  busyIntervals.sort((a, b) => a.start - b.start);
  const mergedBusy: { start: number; end: number }[] = [];
  for (const interval of busyIntervals) {
    if (!mergedBusy.length) {
      mergedBusy.push({ ...interval });
    } else {
      const last = mergedBusy[mergedBusy.length - 1];
      if (interval.start <= last.end) {
        last.end = Math.max(last.end, interval.end);
      } else {
        mergedBusy.push({ ...interval });
      }
    }
  }

  // Find free intervals between merged busy intervals
  const freeSlots: FreeTimeSlot[] = [];
  let currentPointer = startBound;

  for (let i = 0; i < mergedBusy.length; i++) {
    const busy = mergedBusy[i];
    if (busy.start > currentPointer) {
      const gap = busy.start - currentPointer;
      if (gap >= 15) {
        // Only count gaps of 15 mins or more
        const slotType: 'micro' | 'study' | 'deep_work' =
          gap < 45 ? 'micro' : gap < 120 ? 'study' : 'deep_work';

        const label =
          slotType === 'micro'
            ? 'Quick Orbit Break'
            : slotType === 'study'
            ? 'Orbital Study Window'
            : 'Deep Flight Launch Window';

        freeSlots.push({
          id: `free-${day}-${currentPointer}-${busy.start}`,
          day,
          startTime: minutesToTime(currentPointer),
          endTime: minutesToTime(busy.start),
          durationMinutes: gap,
          slotType,
          label,
        });
      }
    }
    currentPointer = Math.max(currentPointer, busy.end);
  }

  // Check gap after last class until dayEnd
  if (endBound > currentPointer) {
    const gap = endBound - currentPointer;
    if (gap >= 15) {
      const slotType: 'micro' | 'study' | 'deep_work' =
        gap < 45 ? 'micro' : gap < 120 ? 'study' : 'deep_work';

      const label =
        slotType === 'micro'
          ? 'Evening Quick Review'
          : slotType === 'study'
          ? 'Orbital Study Window'
          : 'Deep Flight Launch Window';

      freeSlots.push({
        id: `free-${day}-${currentPointer}-${endBound}`,
        day,
        startTime: minutesToTime(currentPointer),
        endTime: minutesToTime(endBound),
        durationMinutes: gap,
        slotType,
        label,
      });
    }
  }

  const totalFreeMinutes = freeSlots.reduce((acc, slot) => acc + slot.durationMinutes, 0);

  return {
    day,
    totalClassMinutes,
    totalFreeMinutes,
    classes: dayClasses,
    freeSlots,
  };
}

// Storage helpers
const STORAGE_PREFIX = 'studybuddy_timetable_';

export function getStoredClasses(userId = 'guest'): ClassSession[] {
  try {
    const raw = localStorage.getItem(`${STORAGE_PREFIX}${userId}`);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch (e) {
    console.error('Failed to read timetable from localStorage', e);
  }

  // Realistic space-cadet default timetable
  return [
    {
      id: 'c1',
      day: 'Monday',
      subject: 'Astrophysics 301',
      startTime: '09:00',
      endTime: '10:30',
      room: 'Observatory Hall A',
      instructor: 'Dr. Thorne',
      color: '#38bdf8',
    },
    {
      id: 'c2',
      day: 'Monday',
      subject: 'Orbital Mechanics',
      startTime: '13:00',
      endTime: '14:30',
      room: 'Lab 4B',
      instructor: 'Prof. Sagan',
      color: '#2563eb',
    },
    {
      id: 'c3',
      day: 'Tuesday',
      subject: 'Quantum Propulsion',
      startTime: '10:00',
      endTime: '11:45',
      room: 'Science Complex 2',
      instructor: 'Dr. Alcubierre',
      color: '#60a5fa',
    },
    {
      id: 'c4',
      day: 'Wednesday',
      subject: 'Astrophysics 301',
      startTime: '09:00',
      endTime: '10:30',
      room: 'Observatory Hall A',
      instructor: 'Dr. Thorne',
      color: '#38bdf8',
    },
    {
      id: 'c5',
      day: 'Wednesday',
      subject: 'Celestial Data Structures',
      startTime: '14:00',
      endTime: '16:00',
      room: 'Turing Annex 10',
      instructor: 'Dr. Lovelace',
      color: '#93c5fd',
    },
    {
      id: 'c6',
      day: 'Thursday',
      subject: 'Orbital Mechanics Lab',
      startTime: '11:00',
      endTime: '13:00',
      room: 'Flight Sim B',
      instructor: 'Prof. Sagan',
      color: '#2563eb',
    },
    {
      id: 'c7',
      day: 'Friday',
      subject: 'Cosmology & Dark Matter',
      startTime: '10:00',
      endTime: '12:00',
      room: 'Auditorium 1',
      instructor: 'Dr. Rubin',
      color: '#38bdf8',
    },
  ];
}

export function saveStoredClasses(userId = 'guest', classes: ClassSession[]) {
  try {
    localStorage.setItem(`${STORAGE_PREFIX}${userId}`, JSON.stringify(classes));
  } catch (e) {
    console.error('Failed to save timetable to localStorage', e);
  }
}
