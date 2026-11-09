import React, { useState, useEffect } from 'react';
import {
  Calendar,
  CheckSquare,
  RefreshCw,
  ExternalLink,
  Shield,
  CheckCircle2,
  AlertCircle,
  Plus,
  FileText,
  Mail,
  HardDrive,
  Folder,
} from 'lucide-react';
import {
  signInWithGoogleWorkspace,
  logoutGoogleWorkspace,
  getWorkspaceAccessToken,
  createGoogleCalendarEvent,
  createGoogleTask,
  listGoogleCalendarEvents,
  listGoogleTasks,
  listGoogleDriveFiles,
  listGmailMessages,
} from '../../lib/workspace';
import { Mission, Subject } from '../../types';
import { sound } from '../../lib/audio';

interface GoogleWorkspaceCardProps {
  missions: Mission[];
  subjects: Subject[];
  onToast: (msg: string, type?: 'success' | 'warning' | 'info' | 'error') => void;
}

export const GoogleWorkspaceCard: React.FC<GoogleWorkspaceCardProps> = ({
  missions,
  subjects,
  onToast,
}) => {
  const [isConnected, setIsConnected] = useState(false);
  const [calendarEvents, setCalendarEvents] = useState<any[]>([]);
  const [googleTasksList, setGoogleTasksList] = useState<any[]>([]);
  const [driveFiles, setDriveFiles] = useState<any[]>([]);
  const [gmailMessages, setGmailMessages] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'calendar' | 'tasks' | 'drive' | 'gmail'>('calendar');
  const [confirmDialogMission, setConfirmDialogMission] = useState<Mission | null>(null);
  const [confirmSyncAllOpen, setConfirmSyncAllOpen] = useState(false);

  const subjectMap = new Map<string, Subject>();
  subjects.forEach((s) => subjectMap.set(s.id, s));

  useEffect(() => {
    const token = getWorkspaceAccessToken();
    if (token) {
      setIsConnected(true);
      fetchLiveGoogleData();
    }
  }, []);

  const fetchLiveGoogleData = async () => {
    setIsLoading(true);
    try {
      const [events, tasks, files, emails] = await Promise.all([
        listGoogleCalendarEvents(),
        listGoogleTasks(),
        listGoogleDriveFiles(),
        listGmailMessages(),
      ]);
      setCalendarEvents(events);
      setGoogleTasksList(tasks);
      setDriveFiles(files);
      setGmailMessages(emails);
    } catch {
      // ignore
    } finally {
      setIsLoading(false);
    }
  };

  const handleConnect = async () => {
    setIsLoading(true);
    try {
      sound.playClick();
      const result = await signInWithGoogleWorkspace();
      if (result) {
        setIsConnected(true);
        sound.playAccomplishedChime();
        onToast('Google Workspace connected! Drive, Gmail, Calendar & Tasks are ready.', 'success');
        fetchLiveGoogleData();
      }
    } catch (err: any) {
      onToast(err.message || 'Failed to authenticate Google Workspace.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDisconnect = async () => {
    await logoutGoogleWorkspace();
    setIsConnected(false);
    setCalendarEvents([]);
    setGoogleTasksList([]);
    setDriveFiles([]);
    setGmailMessages([]);
    onToast('Google Workspace disconnected.', 'info');
  };

  const handleConfirmSyncToCalendar = async (mission: Mission) => {
    try {
      setIsLoading(true);
      const subject = mission.subject_id ? subjectMap.get(mission.subject_id)?.name : undefined;
      await createGoogleCalendarEvent(mission, subject);
      sound.playAccomplishedChime();
      onToast(`Mission "${mission.title}" successfully synced to Google Calendar!`, 'success');
      setConfirmDialogMission(null);
      fetchLiveGoogleData();
    } catch (err: any) {
      onToast(err.message || 'Failed to sync event to Google Calendar.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSyncToTasks = async (mission: Mission) => {
    try {
      setIsLoading(true);
      const subject = mission.subject_id ? subjectMap.get(mission.subject_id)?.name : undefined;
      await createGoogleTask(mission, subject);
      sound.playAccomplishedChime();
      onToast(`Mission "${mission.title}" added to your Google Tasks!`, 'success');
      fetchLiveGoogleData();
    } catch (err: any) {
      onToast(err.message || 'Failed to sync task to Google Tasks.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleBatchSyncAll = async () => {
    const pendingMissions = missions.filter((m) => m.status !== 'Completed');
    if (pendingMissions.length === 0) {
      onToast('No active missions to sync.', 'info');
      setConfirmSyncAllOpen(false);
      return;
    }

    setIsLoading(true);
    let successCount = 0;
    for (const m of pendingMissions) {
      try {
        const subject = m.subject_id ? subjectMap.get(m.subject_id)?.name : undefined;
        await createGoogleCalendarEvent(m, subject);
        await createGoogleTask(m, subject);
        successCount++;
      } catch {
        // continue
      }
    }
    setIsLoading(false);
    setConfirmSyncAllOpen(false);
    sound.playAccomplishedChime();
    onToast(`Synced ${successCount} missions to Google Calendar and Tasks!`, 'success');
    fetchLiveGoogleData();
  };

  return (
    <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-[#38bdf8]/35 shadow-2xl space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#38bdf8]/20">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#1d4ed8] via-[#2563eb] to-[#38bdf8] flex items-center justify-center text-white shadow-md shadow-[#38bdf8]/30">
            <HardDrive className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bebas text-2xl text-white font-bold tracking-wide">
              GOOGLE WORKSPACE // SUITE INTEGRATION
            </h3>
            <p className="text-xs text-white/75 font-medium">
              Synchronize missions with Google Calendar, Google Tasks, Google Drive & Gmail.
            </p>
          </div>
        </div>

        {isConnected ? (
          <div className="flex items-center space-x-3">
            <span className="flex items-center space-x-1.5 px-3 py-1 rounded-full bg-[#34d399]/20 text-[#34d399] border border-[#34d399]/40 text-xs font-bold font-mono">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>LINKED</span>
            </span>
            <button
              onClick={handleDisconnect}
              className="px-3 py-1.5 rounded-xl border border-red-500/30 text-red-400 hover:bg-red-950/40 text-xs font-semibold"
            >
              Disconnect
            </button>
          </div>
        ) : (
          <button
            onClick={handleConnect}
            disabled={isLoading}
            className="flex items-center space-x-2.5 px-5 py-2.5 rounded-xl bg-white text-[#1f2937] hover:bg-gray-100 font-semibold text-xs transition-all shadow-md shrink-0"
          >
            <svg className="w-4 h-4" viewBox="0 0 48 48">
              <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
              <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
              <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
              <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
            </svg>
            <span>Connect All 4 Google Apps</span>
          </button>
        )}
      </div>

      {isConnected ? (
        <div className="space-y-6">
          {/* Sub-nav for the 4 Google Apps */}
          <div className="flex items-center space-x-2 border-b border-[#38bdf8]/15 pb-2 overflow-x-auto">
            <button
              onClick={() => setActiveTab('calendar')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors flex items-center space-x-1.5 ${
                activeTab === 'calendar'
                  ? 'bg-[#38bdf8]/20 text-[#38bdf8] border border-[#38bdf8]/50'
                  : 'text-white/60 hover:text-white'
              }`}
            >
              <Calendar className="w-3.5 h-3.5" />
              <span>Google Calendar ({calendarEvents.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('tasks')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors flex items-center space-x-1.5 ${
                activeTab === 'tasks'
                  ? 'bg-[#38bdf8]/20 text-[#38bdf8] border border-[#38bdf8]/50'
                  : 'text-white/60 hover:text-white'
              }`}
            >
              <CheckSquare className="w-3.5 h-3.5" />
              <span>Google Tasks ({googleTasksList.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('drive')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors flex items-center space-x-1.5 ${
                activeTab === 'drive'
                  ? 'bg-[#38bdf8]/20 text-[#38bdf8] border border-[#38bdf8]/50'
                  : 'text-white/60 hover:text-white'
              }`}
            >
              <Folder className="w-3.5 h-3.5" />
              <span>Google Drive ({driveFiles.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('gmail')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors flex items-center space-x-1.5 ${
                activeTab === 'gmail'
                  ? 'bg-[#38bdf8]/20 text-[#38bdf8] border border-[#38bdf8]/50'
                  : 'text-white/60 hover:text-white'
              }`}
            >
              <Mail className="w-3.5 h-3.5" />
              <span>Gmail Alerts ({gmailMessages.length})</span>
            </button>
          </div>

          {/* Quick Sync Action Bar */}
          <div className="p-4 rounded-2xl bg-[#060c1d] border border-[#38bdf8]/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <p className="text-xs font-bold text-white">Batch Mission Sync</p>
              <p className="text-[11px] text-white/70 font-medium">
                Push all your upcoming academic deadlines and problem sets to Google Calendar & Google Tasks.
              </p>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setConfirmSyncAllOpen(true)}
                disabled={isLoading}
                className="blue-gradient-btn px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center space-x-1.5 shadow-md shadow-[#38bdf8]/25"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Sync All Active Missions</span>
              </button>
              <button
                onClick={fetchLiveGoogleData}
                disabled={isLoading}
                className="p-2 rounded-xl border border-[#38bdf8]/30 hover:bg-[#0c1a38] text-[#38bdf8]"
                title="Refresh Google Workspace Data"
              >
                <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </div>

          {/* Tab 1: Calendar View */}
          {activeTab === 'calendar' && (
            <div className="space-y-3">
              <h4 className="font-bebas text-lg text-white font-bold tracking-wide flex items-center justify-between">
                <span>GOOGLE CALENDAR UPCOMING LAUNCHES</span>
                <span className="text-xs font-mono text-[#38bdf8]">{calendarEvents.length} Events</span>
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-56 overflow-y-auto">
                {calendarEvents.length === 0 ? (
                  <p className="text-xs text-white/50 col-span-2 py-4 text-center">No upcoming events found on primary calendar.</p>
                ) : (
                  calendarEvents.map((evt, idx) => (
                    <a
                      key={idx}
                      href={evt.htmlLink || 'https://calendar.google.com'}
                      target="_blank"
                      rel="noreferrer"
                      className="p-3 rounded-xl border border-[#38bdf8]/20 bg-[#040816] hover:border-[#38bdf8]/50 text-xs flex items-center justify-between group transition-colors"
                    >
                      <div className="truncate">
                        <p className="font-bold text-white truncate group-hover:text-[#38bdf8]">{evt.summary || 'Scheduled Event'}</p>
                        <p className="text-[10px] text-white/60 font-mono">
                          {evt.start?.dateTime ? new Date(evt.start.dateTime).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'All-day'}
                        </p>
                      </div>
                      <ExternalLink className="w-3.5 h-3.5 text-[#38bdf8]/60 group-hover:text-[#38bdf8] shrink-0 ml-2" />
                    </a>
                  ))
                )}
              </div>
            </div>
          )}

          {/* Tab 2: Google Tasks */}
          {activeTab === 'tasks' && (
            <div className="space-y-3">
              <h4 className="font-bebas text-lg text-white font-bold tracking-wide flex items-center justify-between">
                <span>GOOGLE TASKS FLIGHT CHECKLIST</span>
                <span className="text-xs font-mono text-[#38bdf8]">{googleTasksList.length} Tasks</span>
              </h4>
              <div className="space-y-2 max-h-56 overflow-y-auto">
                {googleTasksList.length === 0 ? (
                  <p className="text-xs text-white/50 py-4 text-center">No active tasks in Google Tasks.</p>
                ) : (
                  googleTasksList.map((t, idx) => (
                    <div
                      key={idx}
                      className="p-3 rounded-xl border border-[#38bdf8]/20 bg-[#040816] flex items-center justify-between text-xs"
                    >
                      <div>
                        <p className="font-bold text-white">{t.title}</p>
                        {t.notes && <p className="text-[10px] text-white/60 mt-0.5">{t.notes}</p>}
                      </div>
                      <span className="text-[10px] font-mono text-[#38bdf8] px-2 py-0.5 rounded bg-[#38bdf8]/10 border border-[#38bdf8]/30">
                        {t.due ? new Date(t.due).toLocaleDateString([], { month: 'short', day: 'numeric' }) : 'No deadline'}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* Tab 3: Google Drive */}
          {activeTab === 'drive' && (
            <div className="space-y-3">
              <h4 className="font-bebas text-lg text-white font-bold tracking-wide flex items-center justify-between">
                <span>GOOGLE DRIVE COURSE MATERIALS & PAPERS</span>
                <span className="text-xs font-mono text-[#38bdf8]">{driveFiles.length} Files</span>
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-56 overflow-y-auto">
                {driveFiles.length === 0 ? (
                  <p className="text-xs text-white/50 col-span-2 py-4 text-center">No recent files found in Google Drive.</p>
                ) : (
                  driveFiles.map((file, idx) => (
                    <a
                      key={idx}
                      href={file.webViewLink || 'https://drive.google.com'}
                      target="_blank"
                      rel="noreferrer"
                      className="p-3 rounded-xl border border-[#38bdf8]/20 bg-[#040816] hover:border-[#38bdf8]/50 text-xs flex items-center justify-between group transition-colors"
                    >
                      <div className="flex items-center space-x-2.5 truncate">
                        <FileText className="w-4 h-4 text-[#38bdf8] shrink-0" />
                        <div className="truncate">
                          <p className="font-bold text-white truncate group-hover:text-[#38bdf8]">{file.name}</p>
                          <p className="text-[10px] text-white/60 font-mono">
                            {file.modifiedTime ? new Date(file.modifiedTime).toLocaleDateString() : 'Drive Document'}
                          </p>
                        </div>
                      </div>
                      <ExternalLink className="w-3.5 h-3.5 text-[#38bdf8]/60 group-hover:text-[#38bdf8] shrink-0 ml-2" />
                    </a>
                  ))
                )}
              </div>
            </div>
          )}

          {/* Tab 4: Gmail */}
          {activeTab === 'gmail' && (
            <div className="space-y-3">
              <h4 className="font-bebas text-lg text-white font-bold tracking-wide flex items-center justify-between">
                <span>GMAIL ACADEMIC NOTIFICATIONS</span>
                <span className="text-xs font-mono text-[#38bdf8]">{gmailMessages.length} Messages</span>
              </h4>
              <div className="space-y-2 max-h-56 overflow-y-auto">
                {gmailMessages.length === 0 ? (
                  <p className="text-xs text-white/50 py-4 text-center">No recent Gmail messages found.</p>
                ) : (
                  gmailMessages.map((msg, idx) => (
                    <div
                      key={idx}
                      className="p-3 rounded-xl border border-[#38bdf8]/20 bg-[#040816] text-xs space-y-1"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-white truncate max-w-[70%]">{msg.subject}</span>
                        <span className="text-[10px] text-[#38bdf8] font-mono truncate max-w-[28%]">{msg.from}</span>
                      </div>
                      <p className="text-[11px] text-white/65 line-clamp-1">{msg.snippet}</p>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="text-center py-8 rounded-2xl bg-[#040816] border border-[#38bdf8]/20 p-6 space-y-3">
          <HardDrive className="w-10 h-10 mx-auto text-[#38bdf8]/60" />
          <h4 className="font-bebas text-xl text-white font-bold">CONNECT YOUR ENTIRE GOOGLE FLIGHT SUITE</h4>
          <p className="text-xs text-white/80 max-w-md mx-auto leading-relaxed font-medium">
            Link Google Calendar, Google Tasks, Google Drive, and Gmail to Study Buddy for automatic deadline syncing, file attachments, and assignment notifications.
          </p>
        </div>
      )}

      {/* Confirmation Dialogs */}
      {confirmDialogMission && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
          <div className="glass-panel w-full max-w-md p-6 rounded-3xl border border-[#38bdf8]/40 shadow-2xl space-y-4">
            <div className="flex items-center space-x-3 text-[#38bdf8]">
              <Calendar className="w-6 h-6" />
              <h3 className="font-bebas text-2xl text-white font-bold">CONFIRM GOOGLE CALENDAR SYNC</h3>
            </div>
            <p className="text-xs text-white/85 leading-relaxed font-medium">
              Are you sure you want to create a new event on your primary Google Calendar for:
            </p>
            <div className="p-3 rounded-xl bg-[#040816] border border-[#38bdf8]/30">
              <p className="text-sm font-bold text-white">{confirmDialogMission.title}</p>
              <p className="text-xs text-[#38bdf8] font-mono mt-1 font-bold">
                Target Deadline: {new Date(confirmDialogMission.deadline).toLocaleString()}
              </p>
            </div>
            <div className="flex items-center justify-end space-x-3 pt-2">
              <button
                onClick={() => setConfirmDialogMission(null)}
                className="px-4 py-2 rounded-xl border border-[#38bdf8]/30 text-xs text-white/70 hover:text-white"
              >
                Cancel
              </button>
              <button
                onClick={() => handleConfirmSyncToCalendar(confirmDialogMission)}
                className="blue-gradient-btn px-5 py-2 rounded-xl text-xs font-bold uppercase tracking-wider"
              >
                Confirm & Sync
              </button>
            </div>
          </div>
        </div>
      )}

      {confirmSyncAllOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
          <div className="glass-panel w-full max-w-md p-6 rounded-3xl border border-[#38bdf8]/40 shadow-2xl space-y-4">
            <div className="flex items-center space-x-3 text-[#38bdf8]">
              <Calendar className="w-6 h-6" />
              <h3 className="font-bebas text-2xl text-white font-bold">BATCH SYNC ALL ACTIVE MISSIONS</h3>
            </div>
            <p className="text-xs text-white/85 leading-relaxed font-medium">
              This will create Google Calendar events and Google Tasks for all {missions.filter((m) => m.status !== 'Completed').length} active missions in your flight manifest.
            </p>
            <div className="flex items-center justify-end space-x-3 pt-2">
              <button
                onClick={() => setConfirmSyncAllOpen(false)}
                className="px-4 py-2 rounded-xl border border-[#38bdf8]/30 text-xs text-white/70 hover:text-white"
              >
                Cancel
              </button>
              <button
                onClick={handleBatchSyncAll}
                className="blue-gradient-btn px-5 py-2 rounded-xl text-xs font-bold uppercase tracking-wider"
              >
                Confirm Batch Sync
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
