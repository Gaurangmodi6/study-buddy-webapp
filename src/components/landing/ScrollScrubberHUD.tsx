import React from 'react';
import { motion } from 'motion/react';
import { Rocket, Disc, Calendar, BarChart3 } from 'lucide-react';
import { ScrollMorphState, liveScrollScrubber } from '../particles/useScrollMorph';
import { sound } from '../../lib/audio';

interface ScrollScrubberHUDProps {
  scrollState: ScrollMorphState;
}

export const ScrollScrubberHUD: React.FC<ScrollScrubberHUDProps> = ({ scrollState }) => {
  const percent = Math.round(scrollState.progress * 100);

  const chapters = [
    { label: '01 ROCKET', progress: 0.0, icon: Rocket, name: 'Orbital Launch' },
    { label: '02 SATELLITE', progress: 0.28, icon: Disc, name: 'Class Radar' },
    { label: '03 WORKSPACE', progress: 0.56, icon: Calendar, name: 'Google Suite' },
    { label: '04 TELEMETRY', progress: 0.85, icon: BarChart3, name: 'Subsystems' },
  ];

  const handleJump = (targetProgress: number) => {
    sound.playClick();
    liveScrollScrubber.jumpToProgress(targetProgress);
  };

  return (
    <aside
      aria-label="Scroll scrubber"
      className="fixed right-4 bottom-6 z-30 hidden sm:flex flex-col items-end pointer-events-auto"
    >
      <div className="glass-panel px-3.5 py-3 rounded-2xl border border-white/20 bg-black/90 shadow-2xl backdrop-blur-xl flex flex-col space-y-2.5 max-w-[210px]">
        {/* Header with live frame % */}
        <div className="flex items-center justify-between w-full text-[10px] font-mono font-bold">
          <span className="text-slate-400 uppercase tracking-wider">3D SCRUBBER</span>
          <span className="text-white px-1.5 py-0.2 rounded bg-white/10 font-mono">
            {percent}%
          </span>
        </div>

        {/* Continuous Scrubbing Bar */}
        <div className="w-full h-1.5 rounded-full bg-slate-900 border border-white/10 overflow-hidden relative">
          <div
            className="h-full bg-gradient-to-r from-[#38bdf8] via-white to-[#38bdf8] transition-all duration-75"
            style={{ width: `${percent}%` }}
          />
        </div>

        {/* Chapter scrubbing anchors */}
        <div className="grid grid-cols-4 gap-1 w-full pt-1">
          {chapters.map((ch, idx) => {
            const isActive =
              (idx === 0 && scrollState.progress < 0.25) ||
              (idx === 1 && scrollState.progress >= 0.25 && scrollState.progress < 0.55) ||
              (idx === 2 && scrollState.progress >= 0.55 && scrollState.progress < 0.80) ||
              (idx === 3 && scrollState.progress >= 0.80);

            const Icon = ch.icon;

            return (
              <button
                key={ch.label}
                onClick={() => handleJump(ch.progress)}
                className={`flex flex-col items-center justify-center p-1.5 rounded-lg text-[9px] font-mono font-bold transition-all cursor-pointer ${
                  isActive
                    ? 'bg-white text-black shadow-md'
                    : 'text-slate-400 hover:text-white hover:bg-white/10'
                }`}
                title={`Scrub to ${ch.name}`}
              >
                <Icon className="w-3.5 h-3.5 mb-0.5" />
                <span>{`0${idx + 1}`}</span>
              </button>
            );
          })}
        </div>

        {/* Scrub Hint */}
        <div className="text-[9px] text-slate-400 font-medium text-center border-t border-white/10 pt-1.5 leading-tight">
          Mouse wheel scrubs 3D particles forward & reverse
        </div>
      </div>
    </aside>
  );
};
