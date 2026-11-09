import { useState, useEffect } from 'react';

export interface ScrollMorphState {
  progress: number; // 0.0 to 1.0
  activeStage: number; // 0, 1, 2, 3
  blendFactor: number; // 0.0 to 1.0 between current and next stage
  fromShape: number;
  toShape: number;
  scrollY: number;
  scrollVelocity: number; // Positive = down, Negative = up (for reverse scrubbing)
  direction: 1 | -1;
}

// Module-level shared reference for frame-by-frame Three.js useFrame scrubbing
export const liveScrollScrubber = {
  progress: 0,
  targetProgress: 0,
  scrollY: 0,
  velocity: 0,
  direction: 1 as 1 | -1,
  mouseX: 0,
  mouseY: 0,
  jumpToProgress(p: number) {
    if (typeof window === 'undefined') return;
    const maxScroll = Math.max(
      document.documentElement.scrollHeight - window.innerHeight,
      1
    );
    window.scrollTo({
      top: p * maxScroll,
      behavior: 'smooth',
    });
  },
};

export function useScrollMorph(): ScrollMorphState {
  const [scrollState, setScrollState] = useState<ScrollMorphState>({
    progress: 0,
    activeStage: 0,
    blendFactor: 0,
    fromShape: 0,
    toShape: 0,
    scrollY: 0,
    scrollVelocity: 0,
    direction: 1,
  });

  useEffect(() => {
    let prevY = window.scrollY;
    let ticking = false;

    const updateScrub = () => {
      const scrollY = window.scrollY;
      const maxScroll = Math.max(
        document.documentElement.scrollHeight - window.innerHeight,
        1
      );
      const rawProgress = Math.min(Math.max(scrollY / maxScroll, 0), 1);
      const deltaY = scrollY - prevY;
      const velocity = deltaY;
      const direction: 1 | -1 = deltaY >= 0 ? 1 : -1;
      prevY = scrollY;

      // Update global instant scrubber ref for Three.js render loop
      liveScrollScrubber.targetProgress = rawProgress;
      liveScrollScrubber.scrollY = scrollY;
      liveScrollScrubber.velocity = velocity;
      liveScrollScrubber.direction = direction;

      // 4-Stage Continuous Scrollytelling Timeline
      // Stage 0: 0.00 - 0.25 (Rocket on Hero)
      // Stage 1: 0.25 - 0.52 (Satellite during Timetable & Free Time)
      // Stage 2: 0.52 - 0.76 (Calendar & Google Workspace)
      // Stage 3: 0.76 - 1.00 (Telemetry Bar Chart & Squadron)
      let fromShape = 0;
      let toShape = 0;
      let blendFactor = 0;
      let activeStage = 0;

      if (rawProgress < 0.25) {
        fromShape = 0;
        toShape = 1;
        // Morph into Satellite starting at 0.14 so it fully assembles for Timetable
        blendFactor = Math.max(0, Math.min(1, (rawProgress - 0.12) / 0.13));
        activeStage = 0;
      } else if (rawProgress < 0.52) {
        fromShape = 1;
        toShape = 2;
        // Hold Satellite steady, then morph into Calendar toward Workspace
        blendFactor = Math.max(0, Math.min(1, (rawProgress - 0.40) / 0.12));
        activeStage = 1;
      } else if (rawProgress < 0.78) {
        fromShape = 2;
        toShape = 3;
        // Morph into Bar Chart
        blendFactor = Math.max(0, Math.min(1, (rawProgress - 0.66) / 0.12));
        activeStage = 2;
      } else {
        fromShape = 3;
        toShape = 3;
        blendFactor = 0;
        activeStage = 3;
      }

      setScrollState({
        progress: rawProgress,
        activeStage,
        blendFactor,
        fromShape,
        toShape,
        scrollY,
        scrollVelocity: velocity,
        direction,
      });

      ticking = false;
    };

    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(updateScrub);
        ticking = true;
      }
    };

    const handleWheel = () => {
      if (!ticking) {
        window.requestAnimationFrame(updateScrub);
        ticking = true;
      }
    };

    const handlePointerMove = (e: MouseEvent) => {
      const mx = (e.clientX / window.innerWidth) * 2 - 1;
      const my = (e.clientY / window.innerHeight) * 2 - 1;
      liveScrollScrubber.mouseX = mx;
      liveScrollScrubber.mouseY = my;
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('wheel', handleWheel, { passive: true });
    window.addEventListener('pointermove', handlePointerMove, { passive: true });
    updateScrub();

    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('wheel', handleWheel);
      window.removeEventListener('pointermove', handlePointerMove);
    };
  }, []);

  return scrollState;
}
