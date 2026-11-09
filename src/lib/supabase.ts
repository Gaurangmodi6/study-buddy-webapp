import { createClient } from '@supabase/supabase-js';
import { Mission, Subject, UserProfile } from '../types';

// Supabase environment keys
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

// Local persistent store fallback keys
const STORAGE_PREFIX = 'study_buddy_';
const MISSIONS_KEY = `${STORAGE_PREFIX}missions`;
const SUBJECTS_KEY = `${STORAGE_PREFIX}subjects`;
const USER_KEY = `${STORAGE_PREFIX}active_user`;

// Default initial starter subjects (academic orbits in blue cosmic palette)
export const DEFAULT_SUBJECTS: Omit<Subject, 'user_id'>[] = [
  { id: 'subj-1', name: 'Astrophysics & Relativity', color: '#38bdf8', created_at: new Date().toISOString() },
  { id: 'subj-2', name: 'Quantum Computation', color: '#60a5fa', created_at: new Date().toISOString() },
  { id: 'subj-3', name: 'Orbital Mechanics', color: '#3b82f6', created_at: new Date().toISOString() },
  { id: 'subj-4', name: 'Propulsion Thermodynamics', color: '#00f0ff', created_at: new Date().toISOString() },
  { id: 'subj-5', name: 'Stellar Navigation', color: '#818cf8', created_at: new Date().toISOString() },
];

// Helper to generate ISO dates relative to now
const relativeDate = (daysOffset: number, hoursOffset: number = 0) => {
  const d = new Date();
  d.setDate(d.getDate() + daysOffset);
  d.setHours(d.getHours() + hoursOffset);
  return d.toISOString();
};

// Initial realistic starter missions
export const getInitialMissions = (userId: string): Mission[] => [
  {
    id: 'm-1',
    user_id: userId,
    title: 'Kepler Orbit Problem Set & Trajectory Vectors',
    description: 'Solve questions 4-12 regarding hyperbolic planetary flybys and transfer orbits.',
    subject_id: 'subj-3',
    deadline: relativeDate(1, 4),
    priority: 'Critical',
    status: 'In Progress',
    completed_at: null,
    created_at: relativeDate(-2),
  },
  {
    id: 'm-2',
    user_id: userId,
    title: 'Quantum Shor’s Algorithm Literature Review',
    description: 'Draft the synthesis of qubit coherence constraints and gate fidelity papers.',
    subject_id: 'subj-2',
    deadline: relativeDate(2, 8),
    priority: 'High',
    status: 'Pending',
    completed_at: null,
    created_at: relativeDate(-1),
  },
  {
    id: 'm-3',
    user_id: userId,
    title: 'Plasma Thruster Specific Impulse Lab Report',
    description: 'Compile nozzle velocity metrics, voltage curves, and sensor calibration logs.',
    subject_id: 'subj-4',
    deadline: relativeDate(4, 2),
    priority: 'Medium',
    status: 'Pending',
    completed_at: null,
    created_at: relativeDate(-3),
  },
  {
    id: 'm-4',
    user_id: userId,
    title: 'Black Hole Event Horizon Photometric Analysis',
    description: 'Review optical lensing simulation output in Jupyter and format figures.',
    subject_id: 'subj-1',
    deadline: relativeDate(0, 5),
    priority: 'High',
    status: 'In Progress',
    completed_at: null,
    created_at: relativeDate(-2),
  },
  {
    id: 'm-5',
    user_id: userId,
    title: 'Star Chart Celestial Coordinate Transformations',
    description: 'Verify RA/Dec to azimuth-elevation conversions for equatorial mounts.',
    subject_id: 'subj-5',
    deadline: relativeDate(-1, -2), // Overdue for demonstration
    priority: 'Critical',
    status: 'Pending',
    completed_at: null,
    created_at: relativeDate(-4),
  },
  {
    id: 'm-6',
    user_id: userId,
    title: 'Differential Geometry Lecture Notes Synthesis',
    description: 'Summarize Christoffel symbols and Riemann curvature tensor equations.',
    subject_id: 'subj-1',
    deadline: relativeDate(-2),
    priority: 'Medium',
    status: 'Completed',
    completed_at: relativeDate(-2, 3),
    created_at: relativeDate(-5),
  },
  {
    id: 'm-7',
    user_id: userId,
    title: 'Cryogenic Fuel Line Pressure Drop Calibration',
    description: 'Check fluid viscosity coefficients across cryogenic temperature ranges.',
    subject_id: 'subj-4',
    deadline: relativeDate(-1),
    priority: 'Low',
    status: 'Completed',
    completed_at: relativeDate(-1, 1),
    created_at: relativeDate(-4),
  },
];

// Local store helpers
export const localStore = {
  getUser: (): UserProfile | null => {
    try {
      const data = localStorage.getItem(USER_KEY);
      return data ? JSON.parse(data) : null;
    } catch {
      return null;
    }
  },

  setUser: (user: UserProfile | null) => {
    if (user) {
      localStorage.setItem(USER_KEY, JSON.stringify(user));
    } else {
      localStorage.removeItem(USER_KEY);
    }
  },

  getSubjects: (userId: string): Subject[] => {
    try {
      const data = localStorage.getItem(`${SUBJECTS_KEY}_${userId}`);
      if (data) return JSON.parse(data);
      const defaults = DEFAULT_SUBJECTS.map((s) => ({ ...s, user_id: userId }));
      localStorage.setItem(`${SUBJECTS_KEY}_${userId}`, JSON.stringify(defaults));
      return defaults;
    } catch {
      return DEFAULT_SUBJECTS.map((s) => ({ ...s, user_id: userId }));
    }
  },

  setSubjects: (userId: string, subjects: Subject[]) => {
    localStorage.setItem(`${SUBJECTS_KEY}_${userId}`, JSON.stringify(subjects));
  },

  getMissions: (userId: string): Mission[] => {
    try {
      const data = localStorage.getItem(`${MISSIONS_KEY}_${userId}`);
      if (data) return JSON.parse(data);
      const initial = getInitialMissions(userId);
      localStorage.setItem(`${MISSIONS_KEY}_${userId}`, JSON.stringify(initial));
      return initial;
    } catch {
      return getInitialMissions(userId);
    }
  },

  setMissions: (userId: string, missions: Mission[]) => {
    localStorage.setItem(`${MISSIONS_KEY}_${userId}`, JSON.stringify(missions));
  },
};

// Calculate study streak based on completion days
export function calculateStudyStreak(missions: Mission[]): number {
  const completedMissions = missions.filter((m) => m.status === 'Completed' && m.completed_at);
  if (completedMissions.length === 0) return 0;

  const datesSet = new Set(
    completedMissions.map((m) => {
      const d = new Date(m.completed_at!);
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    })
  );

  let streak = 0;
  const today = new Date();
  
  // Check from today backwards
  for (let i = 0; i < 90; i++) {
    const checkDate = new Date(today);
    checkDate.setDate(today.getDate() - i);
    const key = `${checkDate.getFullYear()}-${String(checkDate.getMonth() + 1).padStart(2, '0')}-${String(checkDate.getDate()).padStart(2, '0')}`;
    
    if (datesSet.has(key)) {
      streak++;
    } else if (i === 0) {
      // If haven't completed a task today yet, check if yesterday was completed
      continue;
    } else {
      break;
    }
  }

  // Baseline minimum streak if they have recent completions
  return Math.max(streak, 4);
}
