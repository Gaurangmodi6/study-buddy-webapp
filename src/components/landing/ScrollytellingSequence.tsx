import React, { useRef, useEffect, useState, useMemo } from 'react';
import { motion } from 'motion/react';
import {
  Rocket,
  Disc,
  Calendar,
  Users,
  Play,
  RotateCcw,
  Sparkles,
  ArrowRight,
  Shield,
  Layers,
  ChevronDown,
} from 'lucide-react';
import { sound } from '../../lib/audio';

interface ScrollytellingSequenceProps {
  onOpenAuth: (mode: 'login' | 'signup') => void;
  onLaunchGuest: () => void;
}

export const ScrollytellingSequence: React.FC<ScrollytellingSequenceProps> = ({
  onOpenAuth,
  onLaunchGuest,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [currentFrame, setCurrentFrame] = useState(0);
  const [scrubProgress, setScrubProgress] = useState(0);
  const totalFrames = 100;

  // Track scroll position within this 350vh scrollytelling section
  useEffect(() => {
    let animId = 0;

    const handleScroll = () => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const totalScrollable = containerRef.current.clientHeight - window.innerHeight;
      if (totalScrollable <= 0) return;

      const scrolled = -rect.top;
      const progress = Math.min(Math.max(scrolled / totalScrollable, 0), 1);
      const frameIndex = Math.min(totalFrames - 1, Math.floor(progress * totalFrames));

      setScrubProgress(progress);
      setCurrentFrame(frameIndex);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();

    return () => {
      window.removeEventListener('scroll', handleScroll);
      if (animId) cancelAnimationFrame(animId);
    };
  }, [totalFrames]);

  // Procedural Canvas Frame Renderer for the 100-frame image sequence
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Handle high DPI
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const width = canvas.clientWidth;
    const height = canvas.clientHeight;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    ctx.scale(dpr, dpr);

    // Clear frame to deep black
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, width, height);

    const cx = width / 2;
    const cy = height / 2;
    const t = scrubProgress; // 0.0 to 1.0 frame timeline

    // 1. Draw Starfield Background with forward/reverse scroll parallax
    const starCount = 180;
    ctx.save();
    for (let i = 0; i < starCount; i++) {
      const seed = i * 9301 + 49297;
      const sx = ((seed % 1000) / 1000) * width;
      const sy = (((seed * 7) % 1000) / 1000) * height;
      const baseSize = ((seed * 13) % 100) / 100;

      // Parallax scrub displacement
      const scrubShift = (t * 240 * (baseSize + 0.5)) % height;
      const drawY = (sy + scrubShift) % height;
      const size = 0.8 + baseSize * 1.8;

      ctx.fillStyle = '#ffffff';
      ctx.globalAlpha = 0.4 + baseSize * 0.55;
      ctx.beginPath();
      ctx.arc(sx, drawY, size, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();

    // 2. Earth Curve Horizon in deep background (scrubs into view)
    const earthY = height + 320 - t * 240;
    const earthRadius = width * 1.2;
    const earthGrad = ctx.createRadialGradient(cx, earthY, earthRadius * 0.85, cx, earthY, earthRadius);
    earthGrad.addColorStop(0, '#000000');
    earthGrad.addColorStop(0.85, '#020b24');
    earthGrad.addColorStop(0.96, 'rgba(56, 189, 248, 0.4)');
    earthGrad.addColorStop(1, 'rgba(0, 240, 255, 0)');

    ctx.save();
    ctx.fillStyle = earthGrad;
    ctx.beginPath();
    ctx.arc(cx, earthY, earthRadius, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // 3. Image Sequence Animation Stages
    ctx.save();

    if (t < 0.32) {
      // PHASE 1: ROCKET ASCENT & ACCELERATION (0% - 32%)
      const stageT = t / 0.32; // 0 to 1
      const rocketY = cy + 90 - stageT * 130;
      const rocketScale = 1.0 + stageT * 0.25;
      const rot = -0.35 * (1 - stageT * 0.5); // Tilted ~25 degrees

      ctx.translate(cx + (width > 768 ? 160 : 0), rocketY);
      ctx.rotate(rot);
      ctx.scale(rocketScale, rocketScale);

      // Thruster Exhaust Flame (frame-linked flickering roar)
      const flameLength = 80 + Math.sin(t * 80) * 16 + stageT * 40;
      const flameGrad = ctx.createLinearGradient(0, 50, 0, 50 + flameLength);
      flameGrad.addColorStop(0, '#ffffff');
      flameGrad.addColorStop(0.2, '#38bdf8');
      flameGrad.addColorStop(0.6, '#2563eb');
      flameGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');

      ctx.fillStyle = flameGrad;
      ctx.beginPath();
      ctx.moveTo(-16, 50);
      ctx.quadraticCurveTo(0, 50 + flameLength, 16, 50);
      ctx.closePath();
      ctx.fill();

      // Rocket Body (Solid white & electric blue panels)
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.moveTo(0, -95); // Nosecone tip
      ctx.bezierCurveTo(28, -60, 28, 40, 22, 50);
      ctx.lineTo(-22, 50);
      ctx.bezierCurveTo(-28, 40, -28, -60, 0, -95);
      ctx.closePath();
      ctx.fill();

      // Electric Blue Ridge Accent
      ctx.fillStyle = '#2563eb';
      ctx.beginPath();
      ctx.moveTo(0, -95);
      ctx.bezierCurveTo(12, -50, 12, 35, 8, 50);
      ctx.lineTo(-8, 50);
      ctx.bezierCurveTo(-12, 35, -12, -50, 0, -95);
      ctx.closePath();
      ctx.fill();

      // Circular Central Viewport (matching user reference photo)
      ctx.fillStyle = '#38bdf8';
      ctx.beginPath();
      ctx.arc(0, -25, 14, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(0, -25, 8, 0, Math.PI * 2);
      ctx.fill();

      // Fins
      ctx.fillStyle = '#f59e0b'; // Amber ridge accents
      ctx.beginPath();
      ctx.moveTo(-22, 20);
      ctx.lineTo(-44, 55);
      ctx.lineTo(-22, 50);
      ctx.closePath();
      ctx.fill();

      ctx.beginPath();
      ctx.moveTo(22, 20);
      ctx.lineTo(44, 55);
      ctx.lineTo(22, 50);
      ctx.closePath();
      ctx.fill();

    } else if (t < 0.65) {
      // PHASE 2: SATELLITE DEPLOYMENT & SOLAR ARRAY EXTENSION (32% - 65%)
      const stageT = (t - 0.32) / 0.33; // 0 to 1
      const wingExtension = Math.min(1, stageT * 1.3); // Wings extend
      const dishAngle = stageT * Math.PI * 0.4; // Dish articulates
      const satScale = 1.15;

      ctx.translate(cx + (width > 768 ? 160 : 0), cy);
      ctx.scale(satScale, satScale);

      // Central Satellite Bus (Octagonal chassis)
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      const r = 36;
      for (let a = 0; a < 8; a++) {
        const ang = (a * Math.PI) / 4 + Math.PI / 8;
        const px = Math.cos(ang) * r;
        const py = Math.sin(ang) * r;
        if (a === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.closePath();
      ctx.fill();

      // Inner Core
      ctx.fillStyle = '#081432';
      ctx.beginPath();
      ctx.arc(0, 0, 22, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#38bdf8';
      ctx.beginPath();
      ctx.arc(0, 0, 10, 0, Math.PI * 2);
      ctx.fill();

      // Left Solar Array Wing (Unfolds frame-by-frame)
      const wingW = 110 * wingExtension;
      const wingH = 48;
      ctx.fillStyle = '#1e3a8a';
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 1.5;

      // Left wing panels
      ctx.fillRect(-38 - wingW, -wingH / 2, wingW, wingH);
      ctx.strokeRect(-38 - wingW, -wingH / 2, wingW, wingH);

      // Solar grid lines
      ctx.strokeStyle = '#60a5fa';
      ctx.lineWidth = 0.8;
      const subPanels = 4;
      for (let p = 1; p < subPanels; p++) {
        const x = -38 - (wingW * p) / subPanels;
        ctx.beginPath();
        ctx.moveTo(x, -wingH / 2);
        ctx.lineTo(x, wingH / 2);
        ctx.stroke();
      }

      // Right Solar Array Wing
      ctx.fillStyle = '#1e3a8a';
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 1.5;
      ctx.fillRect(38, -wingH / 2, wingW, wingH);
      ctx.strokeRect(38, -wingH / 2, wingW, wingH);

      ctx.strokeStyle = '#60a5fa';
      ctx.lineWidth = 0.8;
      for (let p = 1; p < subPanels; p++) {
        const x = 38 + (wingW * p) / subPanels;
        ctx.beginPath();
        ctx.moveTo(x, -wingH / 2);
        ctx.lineTo(x, wingH / 2);
        ctx.stroke();
      }

      // Parabolic Dish Antenna (Articulates towards Earth)
      ctx.save();
      ctx.translate(0, -42);
      ctx.rotate(Math.sin(dishAngle) * 0.25);
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.ellipse(0, 0, 26, 9, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Antenna Feed Horn
      ctx.strokeStyle = '#f59e0b';
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(0, -18);
      ctx.stroke();
      ctx.fillStyle = '#f59e0b';
      ctx.beginPath();
      ctx.arc(0, -18, 3.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      // Free-time Radar Scan Wave (emanating towards bottom)
      const radarPulse = (stageT * 4) % 1;
      ctx.strokeStyle = `rgba(56, 189, 248, ${1 - radarPulse})`;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(0, 20, 30 + radarPulse * 90, 0.2 * Math.PI, 0.8 * Math.PI);
      ctx.stroke();

    } else {
      // PHASE 3 & 4: WORKSPACE DATA DOWNLINK & SQUADRON NETWORK (65% - 100%)
      const stageT = (t - 0.65) / 0.35; // 0 to 1
      const networkScale = 1.0 + Math.sin(stageT * Math.PI) * 0.1;

      ctx.translate(cx + (width > 768 ? 160 : 0), cy);
      ctx.scale(networkScale, networkScale);

      // Central Quantum Satellite Relay
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(0, 0, 32, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#081432';
      ctx.beginPath();
      ctx.arc(0, 0, 24, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#38bdf8';
      ctx.beginPath();
      ctx.arc(0, 0, 12, 0, Math.PI * 2);
      ctx.fill();

      // 4 Orbiting Google Apps & Squadron Nodes
      const nodes = [
        { name: 'CALENDAR', color: '#38bdf8', angle: 0 + stageT * Math.PI },
        { name: 'TASKS', color: '#22c55e', angle: Math.PI * 0.5 + stageT * Math.PI },
        { name: 'DRIVE', color: '#eab308', angle: Math.PI * 1.0 + stageT * Math.PI },
        { name: 'SQUADRON', color: '#a855f7', angle: Math.PI * 1.5 + stageT * Math.PI },
      ];

      const orbitR = 100 + stageT * 20;

      // Orbit Ring
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.25)';
      ctx.lineWidth = 1;
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.arc(0, 0, orbitR, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);

      nodes.forEach((n) => {
        const nx = Math.cos(n.angle) * orbitR;
        const ny = Math.sin(n.angle) * orbitR;

        // Laser connection beam
        ctx.strokeStyle = `${n.color}55`;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(nx, ny);
        ctx.stroke();

        // Node Circle
        ctx.fillStyle = n.color;
        ctx.beginPath();
        ctx.arc(nx, ny, 10, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(nx, ny, 4, 0, Math.PI * 2);
        ctx.fill();
      });
    }

    ctx.restore();

    // 4. Scrollytelling Telemetry Overlay on Canvas
    ctx.save();
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 11px monospace';
    ctx.fillText(`FRAME [${String(currentFrame + 1).padStart(3, '0')} / ${totalFrames}]`, 24, 36);

    ctx.fillStyle = '#38bdf8';
    ctx.font = '10px monospace';
    const alt = Math.round(t * 420);
    const speed = Math.round(t * 11.2 * 10) / 10;
    ctx.fillText(`ALTITUDE: ${alt} KM • VELOCITY: ${speed} KM/S`, 24, 52);
    ctx.restore();
  }, [currentFrame, scrubProgress, totalFrames]);

  // Scrollytelling Story Acts content
  const currentAct = useMemo(() => {
    if (scrubProgress < 0.28) {
      return {
        badge: 'ACT 01 // ROCKET ASCENT',
        title: 'POWERED FLIGHT TO ACADEMIC ORBIT',
        subtitle: 'Break free from study inertia with scheduled mission deadlines.',
        description:
          'Every assignment is treated as a high-thrust orbital mission. Set critical priorities, calculate countdowns, and launch your study sprints on a clean trajectory.',
        stats: [{ label: 'THRUST', value: '100% NOMINAL' }, { label: 'ALTITUDE', value: `${Math.round(scrubProgress * 420)} KM` }],
        icon: Rocket,
      };
    } else if (scrubProgress < 0.60) {
      return {
        badge: 'ACT 02 // SATELLITE DEPLOYMENT',
        title: 'DAILY FREE-TIME RADAR & CLASSES',
        subtitle: 'Scans your lecture timetable to pinpoint every open study hour.',
        description:
          'Upload your timetable screenshot or syllabus. Gemini AI parses every lecture, identifies gaps, and categorizes free slots into Quick Reviews (15-45m) and Deep Work (2h+).',
        stats: [{ label: 'RADAR LOCK', value: 'ACTIVE' }, { label: 'FREE TIME', value: '3H 45M DETECTED' }],
        icon: Disc,
      };
    } else if (scrubProgress < 0.85) {
      return {
        badge: 'ACT 03 // WORKSPACE SYNCHRONIZATION',
        title: 'GOOGLE CALENDAR, TASKS & DRIVE LINK',
        subtitle: '2-way orbital downlink directly into your daily Google apps.',
        description:
          'Auto-generate Google Calendar deadline events with 2-hour reminders, sync checklists to Google Tasks, and inspect course syllabus files straight from Drive.',
        stats: [{ label: 'GOOGLE SYNC', value: '4 APPS CONNECTED' }, { label: 'LATENCY', value: '18 MS' }],
        icon: Calendar,
      };
    } else {
      return {
        badge: 'ACT 04 // SQUADRON HUB COLLABORATION',
        title: 'MUTUAL STUDY GOALS WITH FRIENDS',
        subtitle: 'Create a shared squadron with friends using a unique Group ID.',
        description:
          'See an aggregated feed of friends’ shared mission progress, cheer each other with 1-click boosts, and conquer collective study milestones together.',
        stats: [{ label: 'SQUADRON ID', value: 'SQUAD-409' }, { label: 'COLLECTIVE', value: '70% GOALS DONE' }],
        icon: Users,
      };
    }
  }, [scrubProgress]);

  const ActIcon = currentAct.icon;

  return (
    <section
      ref={containerRef}
      className="relative w-full h-[320vh] bg-[#000000] text-white"
    >
      {/* Sticky Fullscreen Scrollytelling Stage */}
      <div className="sticky top-0 h-screen w-full overflow-hidden flex items-center justify-between pointer-events-none">
        {/* Fullscreen HTML5 Image Sequence Canvas */}
        <canvas
          ref={canvasRef}
          className="absolute inset-0 w-full h-full pointer-events-none z-0"
        />

        {/* Foreground Content: Text Overlay with High-Contrast Layout */}
        <div className="relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pointer-events-auto">
          <div className="max-w-xl space-y-5">
            {/* Act Headline (Solid crisp white text, ZERO blue glow) */}
            <h2 className="font-bebas text-5xl sm:text-6xl text-white font-extrabold tracking-wide leading-none">
              {currentAct.title}
            </h2>

            {/* Subtitle */}
            <p className="text-sm sm:text-base font-semibold text-sky-400">
              {currentAct.subtitle}
            </p>

            {/* Description */}
            <p className="text-sm text-slate-300 leading-relaxed font-medium">
              {currentAct.description}
            </p>

            {/* Telemetry Stats Box */}
            <div className="grid grid-cols-2 gap-3 pt-2">
              {currentAct.stats.map((s) => (
                <div
                  key={s.label}
                  className="p-3 rounded-xl bg-black/90 border border-white/20 shadow-lg"
                >
                  <span className="text-[10px] font-mono text-slate-400 uppercase font-bold block">
                    {s.label}
                  </span>
                  <span className="text-sm font-mono font-extrabold text-white">
                    {s.value}
                  </span>
                </div>
              ))}
            </div>

            {/* Quick Action Button */}
            <div className="pt-3 flex items-center gap-3">
              <button
                onClick={() => onOpenAuth('signup')}
                className="px-6 py-3 rounded-xl bg-white text-black font-extrabold text-xs uppercase tracking-wider hover:bg-slate-200 transition-all shadow-xl cursor-pointer flex items-center gap-2"
              >
                <span>Launch Squadron Hub</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <button
                onClick={onLaunchGuest}
                className="px-4 py-3 rounded-xl border border-white/30 text-white font-bold text-xs uppercase tracking-wider hover:bg-white/10 transition-all cursor-pointer"
              >
                Demo Flight
              </button>
            </div>
          </div>
        </div>

        {/* Bottom Scroll Indicator */}
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex flex-col items-center space-y-1 text-slate-400 text-[10px] font-mono uppercase tracking-widest font-bold">
          <span>SCROLL TO SCRUB TIMELINE</span>
          <ChevronDown className="w-4 h-4 text-sky-400 animate-bounce" />
        </div>
      </div>
    </section>
  );
};
