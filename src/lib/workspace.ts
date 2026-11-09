import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getAuth,
  signInWithPopup,
  GoogleAuthProvider,
  onAuthStateChanged,
  User,
  signOut,
} from 'firebase/auth';
import firebaseConfig from '../../firebase-applet-config.json';
import { Mission } from '../types';

// Initialize Firebase App
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
export const auth = getAuth(app);

// Provider with all 4 Google Workspace scopes
const provider = new GoogleAuthProvider();
provider.addScope('https://www.googleapis.com/auth/calendar.events');
provider.addScope('https://www.googleapis.com/auth/tasks');
provider.addScope('https://www.googleapis.com/auth/drive.readonly');
provider.addScope('https://www.googleapis.com/auth/gmail.readonly');
provider.setCustomParameters({ prompt: 'select_account' });

// In-memory access token cache
let cachedAccessToken: string | null = null;
let isSigningIn = false;

export const initWorkspaceAuth = (
  onAuthSuccess?: (user: User, token: string) => void,
  onAuthFailure?: () => void
) => {
  return onAuthStateChanged(auth, async (user: User | null) => {
    if (user && cachedAccessToken) {
      if (onAuthSuccess) onAuthSuccess(user, cachedAccessToken);
    } else {
      if (!isSigningIn) {
        cachedAccessToken = null;
        if (onAuthFailure) onAuthFailure();
      }
    }
  });
};

export const signInWithGoogleWorkspace = async (): Promise<{
  user: User;
  accessToken: string;
} | null> => {
  try {
    isSigningIn = true;
    const result = await signInWithPopup(auth, provider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    if (!credential?.accessToken) {
      throw new Error('Failed to obtain Google Workspace access token.');
    }

    cachedAccessToken = credential.accessToken;
    return { user: result.user, accessToken: cachedAccessToken };
  } catch (error: any) {
    console.error('Google Workspace sign in error:', error);
    throw error;
  } finally {
    isSigningIn = false;
  }
};

export const getWorkspaceAccessToken = (): string | null => {
  return cachedAccessToken;
};

export const logoutGoogleWorkspace = async () => {
  await signOut(auth);
  cachedAccessToken = null;
};

// 1. Google Calendar Integration: Insert Mission Deadline Event
export async function createGoogleCalendarEvent(
  mission: Mission,
  subjectName?: string
): Promise<{ id: string; htmlLink?: string }> {
  if (!cachedAccessToken) {
    throw new Error('Google Workspace authentication required. Please sign in with Google.');
  }

  const deadline = new Date(mission.deadline);
  const startTime = new Date(deadline.getTime() - 2 * 60 * 60 * 1000);

  const eventPayload = {
    summary: `🚀 [Study Buddy] ${mission.title}`,
    description: `Academic Mission Deliverable\nSubject / Orbit: ${subjectName || 'General'}\nThrust Level: ${mission.priority}\n\nNotes:\n${mission.description || 'No additional flight notes.'}`,
    start: {
      dateTime: startTime.toISOString(),
      timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    },
    end: {
      dateTime: deadline.toISOString(),
      timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    },
    reminders: {
      useDefault: false,
      overrides: [
        { method: 'popup', minutes: 120 },
        { method: 'popup', minutes: 30 },
      ],
    },
  };

  const response = await fetch(
    'https://www.googleapis.com/calendar/v3/calendars/primary/events',
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${cachedAccessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(eventPayload),
    }
  );

  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({}));
    throw new Error(errorBody?.error?.message || 'Failed to create Google Calendar event.');
  }

  return response.json();
}

// 2. Google Calendar Integration: Fetch Upcoming Events
export async function listGoogleCalendarEvents(): Promise<any[]> {
  if (!cachedAccessToken) return [];

  const now = new Date().toISOString();
  const response = await fetch(
    `https://www.googleapis.com/calendar/v3/calendars/primary/events?timeMin=${encodeURIComponent(
      now
    )}&maxResults=8&singleEvents=true&orderBy=startTime`,
    {
      headers: {
        Authorization: `Bearer ${cachedAccessToken}`,
      },
    }
  );

  if (!response.ok) return [];
  const data = await response.json();
  return data.items || [];
}

// 3. Google Tasks Integration: Sync Mission into Tasks
export async function createGoogleTask(
  mission: Mission,
  subjectName?: string
): Promise<{ id: string; title: string }> {
  if (!cachedAccessToken) {
    throw new Error('Google Workspace authentication required. Please sign in with Google.');
  }

  const deadline = new Date(mission.deadline);

  const taskPayload = {
    title: `[${mission.priority} Thrust] ${mission.title}`,
    notes: `Orbit: ${subjectName || 'General'}\n${mission.description || ''}`,
    due: deadline.toISOString(),
    status: mission.status === 'Completed' ? 'completed' : 'needsAction',
  };

  const response = await fetch(
    'https://tasks.googleapis.com/tasks/v1/lists/@default/tasks',
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${cachedAccessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(taskPayload),
    }
  );

  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({}));
    throw new Error(errorBody?.error?.message || 'Failed to create Google Task.');
  }

  return response.json();
}

// 4. Google Tasks: List existing tasks
export async function listGoogleTasks(): Promise<any[]> {
  if (!cachedAccessToken) return [];

  const response = await fetch(
    'https://tasks.googleapis.com/tasks/v1/lists/@default/tasks?showCompleted=false&maxResults=8',
    {
      headers: {
        Authorization: `Bearer ${cachedAccessToken}`,
      },
    }
  );

  if (!response.ok) return [];
  const data = await response.json();
  return data.items || [];
}

// 5. Google Drive: List academic study files & documents
export async function listGoogleDriveFiles(): Promise<any[]> {
  if (!cachedAccessToken) return [];

  try {
    const response = await fetch(
      `https://www.googleapis.com/drive/v3/files?pageSize=8&fields=files(id,name,mimeType,webViewLink,iconLink,modifiedTime)&orderBy=modifiedTime desc`,
      {
        headers: {
          Authorization: `Bearer ${cachedAccessToken}`,
        },
      }
    );

    if (!response.ok) return [];
    const data = await response.json();
    return data.files || [];
  } catch {
    return [];
  }
}

// 6. Gmail: List recent academic alerts / messages
export async function listGmailMessages(): Promise<any[]> {
  if (!cachedAccessToken) return [];

  try {
    const response = await fetch(
      'https://gmail.googleapis.com/gmail/v1/users/me/messages?maxResults=6',
      {
        headers: {
          Authorization: `Bearer ${cachedAccessToken}`,
        },
      }
    );

    if (!response.ok) return [];
    const listData = await response.json();
    const messageIds = (listData.messages || []).map((m: any) => m.id);

    // Fetch snippet & subject for top messages
    const messageDetails = await Promise.all(
      messageIds.slice(0, 5).map(async (id: string) => {
        try {
          const res = await fetch(
            `https://gmail.googleapis.com/gmail/v1/users/me/messages/${id}?format=metadata&metadataHeaders=Subject&metadataHeaders=From`,
            {
              headers: { Authorization: `Bearer ${cachedAccessToken}` },
            }
          );
          if (!res.ok) return null;
          const detail = await res.json();
          const subjectHeader = detail.payload?.headers?.find((h: any) => h.name === 'Subject');
          const fromHeader = detail.payload?.headers?.find((h: any) => h.name === 'From');
          return {
            id,
            snippet: detail.snippet,
            subject: subjectHeader?.value || '(No Subject)',
            from: fromHeader?.value || 'Academic Dispatch',
          };
        } catch {
          return null;
        }
      })
    );

    return messageDetails.filter(Boolean);
  } catch {
    return [];
  }
}

// 7. Generic calendar event creator
export async function createRawCalendarEvent(payload: {
  summary: string;
  description?: string;
  start: { dateTime: string };
  end: { dateTime: string };
  location?: string;
}): Promise<any> {
  if (!cachedAccessToken) {
    throw new Error('Google Workspace authentication required. Please sign in with Google.');
  }

  const response = await fetch(
    'https://www.googleapis.com/calendar/v3/calendars/primary/events',
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${cachedAccessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    }
  );

  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({}));
    throw new Error(errorBody?.error?.message || 'Failed to create Google Calendar event.');
  }

  return response.json();
}

// Convenience namespace object for Google Workspace integrations
export const googleWorkspace = {
  hasToken: () => !!cachedAccessToken,
  signInWithGoogle: signInWithGoogleWorkspace,
  logout: logoutGoogleWorkspace,
  createCalendarEvent: createRawCalendarEvent,
  createMissionCalendarEvent: createGoogleCalendarEvent,
  listCalendarEvents: listGoogleCalendarEvents,
  createTask: createGoogleTask,
  listDriveFiles: listGoogleDriveFiles,
  listGmail: listGmailMessages,
};
