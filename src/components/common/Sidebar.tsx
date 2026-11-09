import React, { useState } from 'react';
import {
  Rocket,
  LayoutDashboard,
  CheckSquare,
  Calendar,
  Compass,
  User,
  LogOut,
  Flame,
  Plus,
  Volume2,
  VolumeX,
  Clock,
  Users,
  Headphones,
} from 'lucide-react';
import { ViewTab, UserProfile } from '../../types';
import { triggerStrongButtonBurst } from '../particles/ClickBurst';
import { sound } from '../../lib/audio';
import { GeminiLogo } from './GeminiLogo';

interface SidebarProps {
  currentTab: ViewTab;
  onSelectTab: (tab: ViewTab) => void;
  user: UserProfile;
  streak: number;
  onLogout: () => void;
  onOpenCreateMission: () => void;
  onOpenAstraCopilot: () => void;
  onEnterDeepFocus?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  onSelectTab,
  user,
  streak,
  onLogout,
  onOpenCreateMission,
  onOpenAstraCopilot,
  onEnterDeepFocus,
}) => {
  const [isMuted, setIsMuted] = useState(() => sound.getMuted());

  const handleToggleSound = () => {
    const muted = sound.toggleMute();
    setIsMuted(muted);
  };

  const navItems: { tab: ViewTab; label: string; icon: React.ElementType }[] = [
    { tab: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { tab: 'timetable', label: 'Classes & Free Time', icon: Clock },
    { tab: 'missions', label: 'Tasks', icon: CheckSquare },
    { tab: 'calendar', label: 'Calendar', icon: Calendar },
    { tab: 'groups', label: 'Squadron Hub', icon: Users },
    { tab: 'progress', label: 'Progress', icon: Compass },
    { tab: 'profile', label: 'Profile & Subjects', icon: User },
  ];

  const handleCreate = (e: React.MouseEvent<HTMLButtonElement>) => {
    triggerStrongButtonBurst(e, true);
    onOpenCreateMission();
  };

  return (
    <>
      {/* Desktop Sidebar (Left) in Crisp Bright White with Black Color Tone */}
      <aside className="hidden lg:flex flex-col w-64 fixed inset-y-0 left-0 z-30 bg-white border-r border-slate-200 text-slate-900 p-5 justify-between shadow-sm">
        <div className="space-y-6">
          {/* Brand Logo */}
          <div
            onClick={() => onSelectTab('dashboard')}
            className="flex items-center space-x-3 cursor-pointer group"
          >
            <div className="w-10 h-10 rounded-xl bg-black flex items-center justify-center text-white shadow-md group-hover:scale-105 transition-transform">
              <Rocket className="w-5 h-5 stroke-[2.2]" />
            </div>
            <div>
              <span className="font-bebas text-2xl tracking-wider text-black block leading-none font-bold">
                STUDY BUDDY
              </span>
              <span className="text-[10px] tracking-widest text-slate-500 uppercase font-bold">
                STUDY PLANNER
              </span>
            </div>
          </div>

          {/* Quick Action Buttons */}
          <div className="space-y-2">
            <button
              onClick={handleCreate}
              className="w-full py-3 px-4 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center justify-center space-x-2 bg-black text-white hover:bg-slate-800 transition-all shadow-sm active:scale-95 cursor-pointer"
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
              <span>Add Task</span>
            </button>

            {/* AI Copilot Astra Button with Gemini AI Logo */}
            <button
              onClick={() => {
                sound.playRocketSound(0.8);
                onOpenAstraCopilot();
              }}
              className="w-full py-2.5 px-3 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-900 hover:border-slate-400 transition-all text-xs font-bold flex items-center justify-center space-x-2 shadow-sm cursor-pointer"
            >
              <GeminiLogo className="w-4 h-4" />
              <span>Ask Gemini AI</span>
            </button>

            {/* Deep Focus Mode Button */}
            {onEnterDeepFocus && (
              <button
                onClick={() => {
                  sound.playWarpWhoosh();
                  onEnterDeepFocus();
                }}
                className="w-full py-2.5 px-3 rounded-xl border border-black bg-black hover:bg-slate-800 text-white transition-all text-xs font-bold flex items-center justify-center space-x-2 shadow-sm cursor-pointer group"
              >
                <Headphones className="w-4 h-4 text-cyan-400 group-hover:scale-110 transition-transform animate-pulse" />
                <span className="font-mono uppercase tracking-wider text-[11px]">Deep Focus</span>
              </button>
            )}
          </div>

          {/* Navigation Links */}
          <nav className="space-y-1.5 pt-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentTab === item.tab;

              return (
                <button
                  key={item.tab}
                  onClick={() => {
                    sound.playClick();
                    onSelectTab(item.tab);
                  }}
                  className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-sm font-bold transition-all ${
                    isActive
                      ? 'bg-black text-white shadow-sm font-bold'
                      : 'text-slate-600 hover:text-black hover:bg-slate-100'
                  }`}
                >
                  <Icon className={`w-5 h-5 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Bottom Controls */}
        <div className="space-y-4 pt-4 border-t border-slate-200">
          {/* Sound Effect Toggle */}
          <button
            onClick={handleToggleSound}
            className="w-full flex items-center justify-between p-2.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-xs font-semibold text-slate-700 transition-colors"
          >
            <span className="flex items-center space-x-2">
              {isMuted ? <VolumeX className="w-4 h-4 text-slate-400" /> : <Volume2 className="w-4 h-4 text-black" />}
              <span>Space Sound FX</span>
            </span>
            <span className={`text-[10px] font-mono uppercase font-bold ${isMuted ? 'text-slate-400' : 'text-black'}`}>
              {isMuted ? 'Muted' : 'Active'}
            </span>
          </button>

          {/* Study Streak Badge */}
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between shadow-sm">
            <div className="flex items-center space-x-2.5">
              <div className="w-8 h-8 rounded-lg bg-black text-white flex items-center justify-center shadow-sm">
                <Flame className="w-4 h-4 stroke-[2.4]" />
              </div>
              <div>
                <span className="text-xs font-bold text-slate-900 block leading-none">
                  {streak} DAY ORBIT
                </span>
                <span className="text-[10px] text-slate-500 tracking-wide font-mono uppercase font-bold">
                  STREAK ACTIVE
                </span>
              </div>
            </div>
            <span className="text-xs font-mono font-bold text-amber-500">🔥</span>
          </div>

          {/* User profile */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2.5 overflow-hidden">
              <div className="w-9 h-9 rounded-full bg-black border border-slate-300 flex items-center justify-center text-white font-bold text-xs uppercase shrink-0 shadow-sm">
                {user.name.slice(0, 2)}
              </div>
              <div className="truncate">
                <p className="text-xs font-bold text-slate-900 truncate">{user.name}</p>
                <p className="text-[10px] text-slate-500 truncate font-mono">{user.email}</p>
              </div>
            </div>
            <button
              onClick={onLogout}
              title="Logout"
              className="p-2 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Mobile Top Header in Bright White with Black Accents */}
      <header className="lg:hidden fixed top-0 left-0 right-0 z-40 bg-white/95 border-b border-slate-200 backdrop-blur-md px-4 py-3 flex items-center justify-between shadow-sm">
        <div className="flex items-center space-x-2.5">
          <div className="w-8 h-8 rounded-lg bg-black flex items-center justify-center text-white shadow-sm">
            <Rocket className="w-4 h-4 stroke-[2.2]" />
          </div>
          <div>
            <span className="font-bebas text-xl tracking-wider text-black leading-none block font-bold">
              STUDY BUDDY
            </span>
            <span className="text-[9px] text-slate-500 font-mono tracking-widest block font-bold">
              MISSION CONTROL
            </span>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          {onEnterDeepFocus && (
            <button
              onClick={() => {
                sound.playWarpWhoosh();
                onEnterDeepFocus();
              }}
              className="p-2 rounded-lg bg-black text-white hover:bg-slate-800 transition-colors shadow-sm"
              title="Deep Focus (Space Mode)"
            >
              <Headphones className="w-4 h-4 text-cyan-400 animate-pulse" />
            </button>
          )}
          <button
            onClick={() => {
              sound.playRocketSound(0.8);
              onOpenAstraCopilot();
            }}
            className="p-2 rounded-lg border border-slate-200 bg-slate-50 text-slate-900 hover:bg-slate-100 transition-colors"
            title="Astra AI Copilot"
          >
            <GeminiLogo className="w-4 h-4" />
          </button>
          <button
            onClick={handleToggleSound}
            className="p-2 rounded-lg border border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100 transition-colors"
          >
            {isMuted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
          </button>
          <button
            onClick={handleCreate}
            className="p-2 rounded-lg bg-black text-white hover:bg-slate-800 transition-colors shadow-sm"
            title="Create Mission"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Mobile Bottom Navigation in Bright White */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 border-t border-slate-200 backdrop-blur-lg px-2 py-2 flex items-center justify-around shadow-lg">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentTab === item.tab;

          return (
            <button
              key={item.tab}
              onClick={() => {
                sound.playClick();
                onSelectTab(item.tab);
              }}
              className={`flex flex-col items-center justify-center py-1 px-2 rounded-xl text-[10px] font-bold transition-colors ${
                isActive ? 'text-black font-extrabold' : 'text-slate-400 hover:text-black'
              }`}
            >
              <Icon className={`w-5 h-5 mb-0.5 ${isActive ? 'text-black' : 'text-slate-400'}`} />
              <span className="truncate max-w-[64px]">{item.label}</span>
            </button>
          );
        })}
      </nav>
    </>
  );
};
