import React from 'react';
import { motion } from 'motion/react';
import {
  Rocket,
  Calendar,
  BarChart3,
  Compass,
  ArrowRight,
  Shield,
  Zap,
  Flame,
  Clock,
  CheckCircle2,
  ChevronRight,
  Volume2,
  VolumeX,
  Folder,
  Mail,
  CheckSquare,
  Sparkles,
  Upload,
} from 'lucide-react';
import { triggerStrongButtonBurst } from '../particles/ClickBurst';
import { sound } from '../../lib/audio';
import { ScrollMorphState } from '../particles/useScrollMorph';
import { GeminiLogo } from '../common/GeminiLogo';

interface LandingPageProps {
  onOpenAuth: (mode: 'login' | 'signup') => void;
  onLaunchGuest: () => void;
  onOpenAstraCopilot: () => void;
  scrollState?: ScrollMorphState;
}

export const LandingPage: React.FC<LandingPageProps> = ({
  onOpenAuth,
  onLaunchGuest,
  onOpenAstraCopilot,
  scrollState,
}) => {
  const [isMuted, setIsMuted] = React.useState(() => sound.getMuted());

  const handleToggleSound = () => {
    const muted = sound.toggleMute();
    setIsMuted(muted);
  };

  const handleButtonClick = (
    e: React.MouseEvent<HTMLButtonElement>,
    action: () => void,
    rocketSound = true
  ) => {
    triggerStrongButtonBurst(e, rocketSound);
    action();
  };

  const handleGeminiSpecialClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    triggerStrongButtonBurst(e, true);
    onOpenAstraCopilot();
  };

  return (
    <div className="relative z-10 min-h-screen text-white bg-transparent">
      {/* Navbar */}
      <header className="fixed top-0 left-0 right-0 z-40 border-b border-[#38bdf8]/20 bg-[#000000]/80 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          <nav className="hidden md:flex items-center space-x-7 text-sm font-semibold">
            <a href="#features" className="text-white/80 hover:text-[#38bdf8] transition-colors">
              Features
            </a>
            <a href="#google-apps" className="text-white/80 hover:text-[#38bdf8] transition-colors">
              Google Workspace
            </a>
          </nav>

          <div className="flex items-center space-x-2.5">
            {/* GOOGLE GEMINI LOGO ONLY BUTTON */}
            <button
              onClick={handleGeminiSpecialClick}
              className="p-2.5 rounded-xl border border-white/20 bg-black/90 hover:bg-[#07132e] hover:border-sky-400 text-white transition-all shadow-md hover:scale-105 cursor-pointer flex items-center justify-center"
              title="Gemini AI Academic Tutor"
              aria-label="Gemini AI"
            >
              <GeminiLogo className="w-5 h-5" />
            </button>

            <button
              onClick={(e) => handleButtonClick(e, () => onOpenAuth('login'), false)}
              className="px-3.5 py-2 text-sm font-bold text-white hover:text-[#38bdf8] transition-colors hidden sm:block"
            >
              Login
            </button>
            <button
              onClick={(e) => handleButtonClick(e, () => onOpenAuth('signup'), true)}
              className="blue-gradient-btn px-4 py-2.5 rounded-lg text-xs font-bold uppercase tracking-wider flex items-center space-x-1.5"
            >
              <span>Launch</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="min-h-screen pt-32 pb-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto flex flex-col justify-center">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-12 items-center">
          {/* Left Column Text with 3D Slide-in Transition */}
          <motion.div
            initial={{ opacity: 0, x: -50, scale: 0.95 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
            className="md:col-span-7 space-y-6 pt-4"
          >
            <h1 className="font-bebas text-6xl sm:text-7xl lg:text-9xl leading-[0.9] tracking-normal font-extrabold text-white flex flex-col">
              <span className="flex items-center gap-3">
                PLAN
                <span className="inline-block w-4 h-4 sm:w-6 sm:h-6 rounded-full bg-white/40 border border-white" />
              </span>
              <span>SMARTER.</span>
              <span>STUDY</span>
              <span>BETTER.</span>
            </h1>

            <p className="text-base sm:text-lg text-slate-300 max-w-xl font-medium leading-relaxed">
              Organize your classes, schedule assignments, compute your daily free time, and master your subjects with Gemini AI and Google Workspace synchronization.
            </p>

            {/* Simple Direct Actions with High Contrast */}
            <div className="flex flex-wrap items-center gap-3.5 pt-4">
              <button
                onClick={(e) => handleButtonClick(e, () => onOpenAuth('signup'), true)}
                className="px-8 py-4 rounded-xl text-sm font-extrabold uppercase tracking-wider bg-white text-black hover:bg-slate-200 transition-all shadow-xl active:scale-95 cursor-pointer flex items-center gap-2"
              >
                <span>Start Free</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <button
                onClick={(e) => handleButtonClick(e, () => onOpenAuth('login'), false)}
                className="px-6 py-4 rounded-xl text-sm font-bold border-2 border-white/40 text-white hover:bg-white/15 transition-all cursor-pointer"
              >
                Sign In
              </button>
            </div>

            {/* Quick metrics */}
            <div className="grid grid-cols-2 gap-6 pt-8 border-t border-white/20">
              <div>
                <p className="font-bebas text-3xl text-white font-bold">Google Apps</p>
                <p className="text-xs text-slate-400 uppercase tracking-wider font-semibold">Calendar, Tasks, Drive, Gmail</p>
              </div>
              <div>
                <p className="font-bebas text-3xl text-white font-bold">Gemini AI</p>
                <p className="text-xs text-slate-400 uppercase tracking-wider font-semibold">Instant Doubt Solver</p>
              </div>
            </div>
          </motion.div>

          {/* Right Column: 3D interactive viewport */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.9, delay: 0.2 }}
            className="md:col-span-5 h-[340px] md:h-[500px] flex items-center justify-center relative pointer-events-none"
          />
        </div>
      </section>

      {/* PAGE 02: CLASS TIMETABLE & FREE-TIME RADAR (SATELLITE ORBIT STAGE) */}
      <section id="timetable-page" className="py-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto relative">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
          {/* Left Column: Timetable Narrative & Feature Cards */}
          <div className="lg:col-span-7 space-y-8">
            <div className="space-y-4">
              <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full border border-sky-400/40 bg-[#07132e] text-xs font-mono font-bold text-sky-400 shadow-md">
                <span className="w-2 h-2 rounded-full bg-sky-400 animate-ping" />
                <span>STAGE 02 // SATELLITE RELAY & TIMETABLE RADAR</span>
              </div>
              <h2 className="font-bebas text-5xl sm:text-6xl text-white font-extrabold tracking-wide leading-none">
                KNOW EXACTLY WHEN YOU ARE FREE IN A DAY
              </h2>
              <p className="text-base sm:text-lg text-slate-300 leading-relaxed font-medium">
                Upload your college or school timetable. Mission Control automatically scans your lectures,
                maps every gap, and calculates exactly how much free study time you have every day.
              </p>
            </div>

            {/* 3 Feature Highlights of the Timetable */}
            <div className="space-y-4">
              <div className="glass-panel p-5 sm:p-6 rounded-2xl border border-sky-500/30 flex items-start space-x-4 shadow-xl">
                <div className="w-12 h-12 rounded-xl bg-sky-950/80 border border-sky-500/40 flex items-center justify-center text-sky-400 shrink-0">
                  <Upload className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-bebas text-2xl text-white font-bold tracking-wide">1. UPLOAD TIMETABLE</h3>
                  <p className="text-sm text-slate-300 leading-relaxed font-normal mt-1">
                    Upload a photo, screenshot, or paste your syllabus timings. Gemini AI instantly parses subjects, rooms, and class hours into your schedule.
                  </p>
                </div>
              </div>

              <div className="glass-panel p-5 sm:p-6 rounded-2xl border border-emerald-500/30 flex items-start space-x-4 shadow-xl">
                <div className="w-12 h-12 rounded-xl bg-emerald-950/80 border border-emerald-500/40 flex items-center justify-center text-emerald-400 shrink-0">
                  <Clock className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-bebas text-2xl text-white font-bold tracking-wide">2. DAILY FREE-TIME RADAR</h3>
                  <p className="text-sm text-slate-300 leading-relaxed font-normal mt-1">
                    See your exact free hours calculated down to the minute. Categorized into Quick Review breaks (15–45m) and Deep Work study blocks (2h+).
                  </p>
                </div>
              </div>

              <div className="glass-panel p-5 sm:p-6 rounded-2xl border border-blue-500/30 flex items-start space-x-4 shadow-xl">
                <div className="w-12 h-12 rounded-xl bg-blue-950/80 border border-blue-500/40 flex items-center justify-center text-blue-400 shrink-0">
                  <Calendar className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-bebas text-2xl text-white font-bold tracking-wide">3. ONE-CLICK GOOGLE SYNC</h3>
                  <p className="text-sm text-slate-300 leading-relaxed font-normal mt-1">
                    Sync your class timings directly to your Google Calendar with reminders so you never miss a lecture or assignment due date.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: 3D Viewport Framing the Orbiting Satellite */}
          <div className="lg:col-span-5 h-[360px] lg:h-[540px] pointer-events-none" />
        </div>
      </section>

      {/* PAGE 03: ALL GOOGLE APPS FRONT PAGE SHOWCASE SECTION */}
      <section id="google-apps" className="py-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 45, filter: 'blur(10px)', rotateX: 8 }}
          whileInView={{ opacity: 1, y: 0, filter: 'blur(0px)', rotateX: 0 }}
          viewport={{ once: true, margin: '-70px' }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="text-center max-w-3xl mx-auto mb-16 space-y-4"
        >
          {/* Futuristic Page-change loading sweep */}
          <div className="w-56 h-1 bg-slate-900 rounded-full mx-auto overflow-hidden">
            <motion.div
              initial={{ x: '-100%' }}
              whileInView={{ x: '100%' }}
              transition={{ repeat: Infinity, duration: 1.8, ease: 'easeInOut' }}
              className="w-1/2 h-full bg-gradient-to-r from-transparent via-[#38bdf8] to-white"
            />
          </div>

          <h2 className="font-bebas text-5xl sm:text-6xl text-white font-extrabold">
            SEAMLESSLY CONNECTED TO ALL YOUR GOOGLE APPS
          </h2>
          <p className="text-base sm:text-lg text-slate-300">
            Study Buddy synchronizes your study timeline and assignments directly with your Google Workspace tools.
          </p>
        </motion.div>

        {/* Google Apps in a clean line / points list */}
        <div className="max-w-4xl mx-auto space-y-4 pt-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 py-3.5 border-b border-white/10">
            <div className="flex items-center space-x-3 shrink-0">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-400" />
              <span className="font-bebas text-2xl text-white font-bold tracking-wider">GOOGLE CALENDAR</span>
            </div>
            <p className="text-sm text-slate-300 sm:text-right max-w-xl font-medium">
              Auto-create mission deadline events and focused study sprints on your primary Google Calendar with 2-hour notification reminders.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 py-3.5 border-b border-white/10">
            <div className="flex items-center space-x-3 shrink-0">
              <span className="w-2.5 h-2.5 rounded-full bg-yellow-400" />
              <span className="font-bebas text-2xl text-white font-bold tracking-wider">GOOGLE DRIVE</span>
            </div>
            <p className="text-sm text-slate-300 sm:text-right max-w-xl font-medium">
              Browse recent academic documents, lecture slides, lab spreadsheets, and term papers straight from your Google Drive.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 py-3.5 border-b border-white/10">
            <div className="flex items-center space-x-3 shrink-0">
              <span className="w-2.5 h-2.5 rounded-full bg-red-400" />
              <span className="font-bebas text-2xl text-white font-bold tracking-wider">GMAIL ALERTS</span>
            </div>
            <p className="text-sm text-slate-300 sm:text-right max-w-xl font-medium">
              Inspect assignment notifications, grade releases, and professor transmissions directly in your mission telemetry feed.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 py-3.5 border-b border-white/10">
            <div className="flex items-center space-x-3 shrink-0">
              <span className="w-2.5 h-2.5 rounded-full bg-cyan-400" />
              <span className="font-bebas text-2xl text-white font-bold tracking-wider">GOOGLE TASKS</span>
            </div>
            <p className="text-sm text-slate-300 sm:text-right max-w-xl font-medium">
              Bi-directional sync of your mission checklists, priority thrust levels, and sub-tasks straight to the Google Tasks app.
            </p>
          </div>
        </div>
      </section>

      {/* Features Strip Section (Calendar Morph) */}
      <section id="features" className="py-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.7 }}
          className="text-center max-w-3xl mx-auto mb-16 space-y-4"
        >
          <span className="text-xs font-mono tracking-widest text-[#38bdf8] uppercase font-bold">
            // FLIGHT SUBSYSTEMS
          </span>
          <h2 className="font-bebas text-5xl sm:text-6xl text-white font-extrabold">
            ENGINEERED FOR HIGH-G ACADEMIC SEASONS
          </h2>
          <p className="text-base sm:text-lg text-white/80">
            Scroll down to watch your rocket morph into tactical orbit calendars, telemetry charts, and planetary navigation.
          </p>
        </motion.div>

        {/* 4 Glowing Cards in Pure Black & Electric Blue */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="glass-panel-interactive p-7 rounded-2xl flex flex-col justify-between"
          >
            <div className="space-y-4">
              <div className="w-12 h-12 rounded-xl bg-[#38bdf8]/15 border border-[#38bdf8]/40 flex items-center justify-center text-[#38bdf8]">
                <Rocket className="w-6 h-6" />
              </div>
              <h3 className="font-bebas text-2xl text-white font-bold">MISSIONS</h3>
              <p className="text-sm text-white/80 leading-relaxed font-normal">
                Track all your assignments and problem sets with priority levels and live countdowns.
              </p>
            </div>
            <div className="pt-6 border-t border-[#38bdf8]/20 flex items-center justify-between text-xs font-bold text-[#38bdf8]">
              <span>Thrust & Countdown</span>
              <ChevronRight className="w-4 h-4" />
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="glass-panel-interactive p-7 rounded-2xl flex flex-col justify-between"
          >
            <div className="space-y-4">
              <div className="w-12 h-12 rounded-xl bg-[#38bdf8]/15 border border-[#38bdf8]/40 flex items-center justify-center text-[#38bdf8]">
                <Calendar className="w-6 h-6" />
              </div>
              <h3 className="font-bebas text-2xl text-white font-bold">ORBIT CALENDAR</h3>
              <p className="text-sm text-white/80 leading-relaxed font-normal">
                View your monthly and weekly schedules with clear deadlines and color-coded subjects.
              </p>
            </div>
            <div className="pt-6 border-t border-[#38bdf8]/20 flex items-center justify-between text-xs font-bold text-[#38bdf8]">
              <span>Monthly & Weekly Views</span>
              <ChevronRight className="w-4 h-4" />
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="glass-panel-interactive p-7 rounded-2xl flex flex-col justify-between"
          >
            <div className="space-y-4">
              <div className="w-12 h-12 rounded-xl bg-[#38bdf8]/15 border border-[#38bdf8]/40 flex items-center justify-center text-[#38bdf8]">
                <Compass className="w-6 h-6" />
              </div>
              <h3 className="font-bebas text-2xl text-white font-bold">PROGRESS TRACKER</h3>
              <p className="text-sm text-white/80 leading-relaxed font-normal">
                Monitor completed and upcoming tasks with instant visual feedback as you finish work.
              </p>
            </div>
            <div className="pt-6 border-t border-[#38bdf8]/20 flex items-center justify-between text-xs font-bold text-[#38bdf8]">
              <span>Live Accomplishment</span>
              <ChevronRight className="w-4 h-4" />
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="glass-panel-interactive p-7 rounded-2xl flex flex-col justify-between"
          >
            <div className="space-y-4">
              <div className="w-12 h-12 rounded-xl bg-[#38bdf8]/15 border border-[#38bdf8]/40 flex items-center justify-center text-[#38bdf8]">
                <BarChart3 className="w-6 h-6" />
              </div>
              <h3 className="font-bebas text-2xl text-white font-bold">MISSION CONTROL</h3>
              <p className="text-sm text-white/80 leading-relaxed font-normal">
                Get real-time study analytics, 7-day completion trends, and track your daily streak.
              </p>
            </div>
            <div className="pt-6 border-t border-[#38bdf8]/20 flex items-center justify-between text-xs font-bold text-[#38bdf8]">
              <span>Real-Time Charts</span>
              <ChevronRight className="w-4 h-4" />
            </div>
          </motion.div>
        </div>
      </section>

      {/* Mission Control Telemetry Preview Section (Bar Chart Morph) */}
      <section id="telemetry" className="py-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          <motion.div
            initial={{ opacity: 0, x: -40 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
            className="lg:col-span-6 space-y-6"
          >
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full border border-[#38bdf8]/40 bg-[#040816] text-xs font-mono font-bold text-[#38bdf8]">
              <span>STUDY TRACKER</span>
            </div>
            <h2 className="font-bebas text-5xl sm:text-6xl text-white font-extrabold">
              TRACK YOUR STUDY PROGRESS IN REAL TIME
            </h2>
            <p className="text-base sm:text-lg text-white/85 leading-relaxed font-medium">
              Never miss an assignment deadline. See upcoming tasks, track your completion rate, and build a daily study streak.
            </p>

            <ul className="space-y-4 pt-2">
              <li className="flex items-start space-x-3">
                <div className="w-6 h-6 rounded-full bg-[#38bdf8]/20 flex items-center justify-center text-[#38bdf8] mt-0.5 shadow-sm">
                  <Flame className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="font-bold text-sm text-white">Daily Study Streak</h4>
                  <p className="text-xs text-white/70">Maintain consecutive days of studying to build strong study habits.</p>
                </div>
              </li>
              <li className="flex items-start space-x-3">
                <div className="w-6 h-6 rounded-full bg-[#38bdf8]/20 flex items-center justify-center text-[#38bdf8] mt-0.5 shadow-sm">
                  <Clock className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="font-bold text-sm text-white">Live Deadlines</h4>
                  <p className="text-xs text-white/70">See real-time countdown timers for all upcoming assignments.</p>
                </div>
              </li>
              <li className="flex items-start space-x-3">
                <div className="w-6 h-6 rounded-full bg-[#38bdf8]/20 flex items-center justify-center text-[#38bdf8] mt-0.5 shadow-sm">
                  <CheckCircle2 className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="font-bold text-sm text-white">Overdue Alerts</h4>
                  <p className="text-xs text-white/70">Get clear reminders for overdue tasks so you can catch up quickly.</p>
                </div>
              </li>
            </ul>
          </motion.div>

          {/* Interactive Card Mockup with 3D Slide-in */}
          <motion.div
            initial={{ opacity: 0, x: 40, rotateY: -10 }}
            whileInView={{ opacity: 1, x: 0, rotateY: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="lg:col-span-6"
          >
            <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-[#38bdf8]/35 shadow-2xl relative">
              <div className="flex items-center justify-between pb-6 border-b border-[#38bdf8]/20">
                <div className="flex items-center space-x-3">
                  <div className="w-3 h-3 rounded-full bg-[#38bdf8] animate-ping" />
                  <span className="font-mono text-xs text-[#38bdf8] font-bold tracking-widest uppercase">
                    ACTIVE ORBIT MANIFEST
                  </span>
                </div>
                <span className="text-xs text-white/70 font-mono font-bold">STATUS: NOMINAL</span>
              </div>

              {/* Sample Mission Cards in Blue & Black */}
              <div className="space-y-3.5 mt-6">
                <div className="p-4 rounded-xl bg-[#060c1d] border border-[#38bdf8]/40 flex items-center justify-between">
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="px-2 py-0.5 text-[10px] font-bold uppercase rounded bg-[#ef4444]/20 text-[#f87171] border border-[#ef4444]/50">
                        CRITICAL THRUST
                      </span>
                      <span className="text-xs text-[#38bdf8] font-bold">Orbital Mechanics</span>
                    </div>
                    <p className="text-sm font-bold text-white mt-1">Kepler Transfer Orbit Calculations</p>
                  </div>
                  <span className="text-xs font-mono text-[#38bdf8] bg-[#09132c] px-2.5 py-1 rounded-md border border-[#38bdf8]/30 font-bold">
                    1d 4h left
                  </span>
                </div>

                <div className="p-4 rounded-xl bg-[#060c1d] border border-[#38bdf8]/30 flex items-center justify-between">
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="px-2 py-0.5 text-[10px] font-bold uppercase rounded bg-[#38bdf8]/20 text-[#38bdf8] border border-[#38bdf8]/40">
                        HIGH THRUST
                      </span>
                      <span className="text-xs text-[#38bdf8] font-bold">Quantum Computing</span>
                    </div>
                    <p className="text-sm font-bold text-white mt-1">Shor Algorithm Paper Synthesis</p>
                  </div>
                  <span className="text-xs font-mono text-white/80 bg-[#09132c] px-2.5 py-1 rounded-md border border-[#38bdf8]/20">
                    2d 8h left
                  </span>
                </div>

                <div className="p-4 rounded-xl bg-[#060c1d] border border-[#34d399]/40 flex items-center justify-between opacity-85">
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="px-2 py-0.5 text-[10px] font-bold uppercase rounded bg-[#34d399]/20 text-[#34d399] border border-[#34d399]/50">
                        MISSION ACCOMPLISHED
                      </span>
                      <span className="text-xs text-[#34d399] font-bold">Astrophysics</span>
                    </div>
                    <p className="text-sm font-bold text-white/70 line-through mt-1">Differential Geometry Lecture Notes</p>
                  </div>
                  <CheckCircle2 className="w-5 h-5 text-[#34d399]" />
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Final Call to Action Section (Planet & Rings Morph) */}
      <section id="flight-plan" className="py-28 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto text-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.94, y: 30 }}
          whileInView={{ opacity: 1, scale: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="glass-panel p-10 sm:p-16 rounded-3xl border border-[#38bdf8]/40 shadow-2xl relative overflow-hidden"
        >
          <div className="absolute -top-24 -right-24 w-72 h-72 rounded-full bg-[#38bdf8]/15 blur-3xl" />
          <div className="absolute -bottom-24 -left-24 w-72 h-72 rounded-full bg-[#1d4ed8]/20 blur-3xl" />

          <div className="relative z-10 space-y-6 max-w-2xl mx-auto">
            <span className="inline-block px-3 py-1 rounded-full text-xs font-mono font-bold text-[#38bdf8] border border-[#38bdf8]/40 bg-[#040816]">
              ORBITAL INSERTION AWAITS
            </span>
            <h2 className="font-bebas text-5xl sm:text-7xl text-white font-extrabold">
              READY TO IGNITE YOUR ACADEMIC BOOSTERS?
            </h2>
            <p className="text-base sm:text-lg text-white/90 leading-relaxed font-medium">
              Take the commander's seat. Organize all your courses, assignments, and study habits in a high-performance mission control with Gemini AI & Google Workspace.
            </p>

            <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-4">
              <button
                onClick={(e) => handleButtonClick(e, () => onOpenAuth('signup'), true)}
                className="blue-gradient-btn w-full sm:w-auto px-8 py-4 rounded-xl text-sm font-bold uppercase tracking-wider flex items-center justify-center space-x-2 shadow-lg shadow-[#38bdf8]/30"
              >
                <span>Launch Now – Free</span>
                <Rocket className="w-4 h-4 stroke-[2.5]" />
              </button>

              <button
                onClick={handleGeminiSpecialClick}
                className="w-full sm:w-auto px-7 py-4 rounded-xl text-sm font-bold border-2 border-[#38bdf8] bg-[#07132e] hover:bg-[#0c1f48] text-[#38bdf8] hover:text-white transition-all flex items-center justify-center space-x-2"
              >
                <GeminiLogo className="w-5 h-5" />
                <span>Ask Gemini AI Copilot</span>
              </button>

              <button
                onClick={(e) => handleButtonClick(e, onLaunchGuest, true)}
                className="w-full sm:w-auto px-8 py-4 rounded-xl text-sm font-bold border border-[#38bdf8]/40 bg-[#040816] hover:bg-[#081226] transition-all text-white"
              >
                Instant Guest Flight
              </button>
            </div>
          </div>
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="border-t border-[#38bdf8]/20 py-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between text-xs text-white/70 space-y-4 sm:space-y-0">
        <div className="flex items-center space-x-2">
          <Rocket className="w-4 h-4 text-[#38bdf8]" />
          <span className="font-bebas text-lg text-white tracking-wider font-bold">
            STUDY BUDDY // MISSION CONTROL
          </span>
        </div>
        <p>© 2026 Study Buddy. All orbits nominal. Built with React Three Fiber, Google Workspace & Gemini AI.</p>
        <div className="flex items-center space-x-6 text-xs text-[#38bdf8] font-bold">
          <a href="#features" className="hover:underline">Systems</a>
          <a href="#google-apps" className="hover:underline">Google Apps</a>
          <a href="#telemetry" className="hover:underline">Telemetry</a>
          <button onClick={() => onOpenAuth('login')} className="hover:underline">Commander Login</button>
        </div>
      </footer>
    </div>
  );
};
