import { StudyGroup, GroupMember, GroupGoal, GroupTask } from '../types';

const STORAGE_KEY = 'study_buddy_groups_data';

// Initial realistic starter study group for interactive friend sharing
export const DEFAULT_GROUPS: StudyGroup[] = [
  {
    id: 'grp-alpha',
    name: 'Quantum & AI Study Squad',
    description: 'Finals study circle • Daily study sprints, group problem sets, and shared milestone tracking.',
    code: 'SQUAD-409',
    created_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    members: [
      {
        id: 'mem-you',
        name: 'You (Commander)',
        role: 'leader',
        statusText: 'Studying Astrophysics • Active Sprint',
        completedTasksCount: 8,
        streak: 6,
        isOnline: true,
      },
      {
        id: 'mem-alex',
        name: 'Alex Chen',
        role: 'member',
        statusText: 'Free until 3:30 PM • 2 Tasks Done Today',
        completedTasksCount: 6,
        streak: 5,
        isOnline: true,
      },
      {
        id: 'mem-priya',
        name: 'Priya Sharma',
        role: 'member',
        statusText: 'Reviewing Linear Algebra & Shor Algorithm',
        completedTasksCount: 11,
        streak: 8,
        isOnline: true,
      },
      {
        id: 'mem-david',
        name: 'David Miller',
        role: 'member',
        statusText: 'Class in 45m • Done with Orbital Problem Set',
        completedTasksCount: 5,
        streak: 4,
        isOnline: false,
      },
    ],
    goals: [
      {
        id: 'goal-1',
        groupId: 'grp-alpha',
        title: 'Complete 20 Problem Sets Before Friday',
        targetValue: 20,
        currentValue: 14,
        unit: 'sets',
        deadline: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
        completed: false,
        createdByName: 'Priya Sharma',
      },
      {
        id: 'goal-2',
        groupId: 'grp-alpha',
        title: 'Log 40 Collective Study Hours This Week',
        targetValue: 40,
        currentValue: 31,
        unit: 'hours',
        deadline: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000).toISOString(),
        completed: false,
        createdByName: 'You (Commander)',
      },
      {
        id: 'goal-3',
        groupId: 'grp-alpha',
        title: 'Review Midterm Practice Exam 1 & 2',
        targetValue: 2,
        currentValue: 2,
        unit: 'exams',
        deadline: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
        completed: true,
        createdByName: 'Alex Chen',
      },
    ],
    tasks: [
      {
        id: 'gtask-1',
        groupId: 'grp-alpha',
        title: 'Kepler Trajectory Vectors Problem Set (Questions 4-12)',
        description: 'Derive eccentricity and escape velocity for hyperbolic satellite trajectories.',
        subject: 'Orbital Mechanics',
        assignedToName: 'Alex Chen',
        createdByName: 'You (Commander)',
        priority: 'Critical',
        deadline: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000).toISOString(),
        completed: false,
        cheersCount: 5,
      },
      {
        id: 'gtask-2',
        groupId: 'grp-alpha',
        title: 'Quantum Shor’s Algorithm Literature Synthesis',
        description: 'Summarize decoherence noise suppression in fault-tolerant quantum gates.',
        subject: 'Quantum Computation',
        assignedToName: 'Priya Sharma',
        createdByName: 'Priya Sharma',
        priority: 'High',
        deadline: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
        completed: false,
        cheersCount: 4,
      },
      {
        id: 'gtask-3',
        groupId: 'grp-alpha',
        title: 'Thermodynamics Nozzle Specific Impulse Calculations',
        description: 'Complete lab data plots and compare theoretical thrust with sensor logs.',
        subject: 'Propulsion Thermodynamics',
        assignedToName: 'You (Commander)',
        createdByName: 'You (Commander)',
        priority: 'High',
        deadline: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
        completed: false,
        cheersCount: 3,
      },
      {
        id: 'gtask-4',
        groupId: 'grp-alpha',
        title: 'Linear Algebra Eigenvector Review & Proofs',
        description: 'Eigenbasis transformations and spectral theorem application exercises.',
        subject: 'Mathematics',
        assignedToName: 'David Miller',
        createdByName: 'Alex Chen',
        priority: 'Medium',
        deadline: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
        completed: true,
        completedAt: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(),
        cheersCount: 7,
      },
    ],
  },
];

export function loadStoredGroups(): StudyGroup[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      saveStoredGroups(DEFAULT_GROUPS);
      return DEFAULT_GROUPS;
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : DEFAULT_GROUPS;
  } catch {
    return DEFAULT_GROUPS;
  }
}

export function saveStoredGroups(groups: StudyGroup[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(groups));
  } catch (err) {
    console.error('Failed to save study groups to localStorage', err);
  }
}

export function generateGroupCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let result = 'SQUAD-';
  for (let i = 0; i < 4; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

export function createNewStudyGroup(
  name: string,
  description: string,
  creatorName: string
): StudyGroup {
  const newGroup: StudyGroup = {
    id: `grp-${Date.now()}`,
    name: name.trim(),
    description: description.trim() || 'Study group for collaborative goals and shared tasks.',
    code: generateGroupCode(),
    created_at: new Date().toISOString(),
    members: [
      {
        id: `mem-${Date.now()}`,
        name: `${creatorName} (Leader)`,
        role: 'leader',
        statusText: 'Group Founder • Ready to Study',
        completedTasksCount: 0,
        streak: 1,
        isOnline: true,
      },
    ],
    goals: [
      {
        id: `goal-${Date.now()}`,
        groupId: '',
        title: 'Complete 10 Shared Tasks Together',
        targetValue: 10,
        currentValue: 0,
        unit: 'tasks',
        completed: false,
        createdByName: creatorName,
      },
    ],
    tasks: [],
  };
  newGroup.goals[0].groupId = newGroup.id;

  const current = loadStoredGroups();
  const updated = [newGroup, ...current];
  saveStoredGroups(updated);
  return newGroup;
}

export function joinGroupByCode(
  code: string,
  memberName: string
): { success: boolean; group?: StudyGroup; message: string } {
  const cleanCode = code.trim().toUpperCase();
  const groups = loadStoredGroups();
  const target = groups.find((g) => g.code.toUpperCase() === cleanCode);

  if (!target) {
    return {
      success: false,
      message: `No study group found with invite code "${cleanCode}". Please verify the code with your friend.`,
    };
  }

  // Check if member already in group
  const alreadyMember = target.members.some(
    (m) => m.name.toLowerCase().includes(memberName.toLowerCase())
  );

  if (alreadyMember) {
    return {
      success: true,
      group: target,
      message: `You are already a member of "${target.name}". Welcome back!`,
    };
  }

  const newMember: GroupMember = {
    id: `mem-${Date.now()}`,
    name: memberName || 'Study Friend',
    role: 'member',
    statusText: 'Joined the squad • Ready to study',
    completedTasksCount: 0,
    streak: 1,
    isOnline: true,
  };

  target.members.push(newMember);
  saveStoredGroups(groups);

  return {
    success: true,
    group: target,
    message: `Joined "${target.name}" successfully! You can now share goals and tasks.`,
  };
}
