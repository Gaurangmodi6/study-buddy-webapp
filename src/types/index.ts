export type Priority = 'Low' | 'Medium' | 'High' | 'Critical';

export type MissionStatus = 'Pending' | 'In Progress' | 'Completed';

export interface Subject {
  id: string;
  user_id: string;
  name: string;
  color: string;
  created_at: string;
}

export interface Mission {
  id: string;
  user_id: string;
  title: string;
  description?: string;
  subject_id?: string;
  deadline: string; // ISO string
  priority: Priority;
  status: MissionStatus;
  completed_at?: string | null;
  created_at: string;
  shared_to_group?: boolean;
  group_id?: string;
}

export interface UserProfile {
  id: string;
  email: string;
  name: string;
  streak_days: number;
  avatar_url?: string;
}

export type ViewTab = 'dashboard' | 'timetable' | 'missions' | 'calendar' | 'groups' | 'progress' | 'profile';

export interface GroupMember {
  id: string;
  name: string;
  avatarUrl?: string;
  role: 'leader' | 'member';
  statusText?: string;
  completedTasksCount: number;
  streak: number;
  isOnline: boolean;
}

export interface GroupGoal {
  id: string;
  groupId: string;
  title: string;
  targetValue: number;
  currentValue: number;
  unit: string; // e.g. "tasks", "hours", "problem sets"
  deadline?: string;
  completed: boolean;
  createdByName: string;
}

export interface GroupTask {
  id: string;
  groupId: string;
  title: string;
  description?: string;
  subject?: string;
  assignedToName?: string;
  createdByName: string;
  priority: Priority;
  deadline: string;
  completed: boolean;
  completedAt?: string;
  cheersCount?: number;
}

export interface StudyGroup {
  id: string;
  name: string;
  description: string;
  code: string; // Invite code, e.g. "SQUAD-409"
  created_at: string;
  members: GroupMember[];
  goals: GroupGoal[];
  tasks: GroupTask[];
}

export type CalendarViewMode = 'month' | 'week';

export type DayOfWeek =
  | 'Monday'
  | 'Tuesday'
  | 'Wednesday'
  | 'Thursday'
  | 'Friday'
  | 'Saturday'
  | 'Sunday';

export interface ClassSession {
  id: string;
  day: DayOfWeek;
  subject: string;
  startTime: string; // 'HH:MM' (24-hour)
  endTime: string; // 'HH:MM' (24-hour)
  room?: string;
  instructor?: string;
  color?: string;
}

export interface FreeTimeSlot {
  id: string;
  day: DayOfWeek;
  startTime: string; // 'HH:MM'
  endTime: string; // 'HH:MM'
  durationMinutes: number;
  slotType: 'micro' | 'study' | 'deep_work';
  label: string;
}

export interface DailyScheduleAnalysis {
  day: DayOfWeek;
  totalClassMinutes: number;
  totalFreeMinutes: number;
  classes: ClassSession[];
  freeSlots: FreeTimeSlot[];
}

export interface MissionFilter {
  search: string;
  subjectId: string;
  priority: string;
  status: string;
  sortBy: 'deadline' | 'priority' | 'title';
  sortOrder: 'asc' | 'desc';
}
