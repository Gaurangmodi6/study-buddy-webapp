import React from 'react';
import confetti from 'canvas-confetti';
import { sound } from '../../lib/audio';

// Celebration burst for completed missions (non-cursor)
export function triggerMissionAccomplishedBurst(event?: React.MouseEvent | HTMLElement) {
  sound.playAccomplishedChime();

  let origin = { x: 0.5, y: 0.5 };
  if (event) {
    if ('clientX' in event) {
      origin = {
        x: event.clientX / window.innerWidth,
        y: event.clientY / window.innerHeight,
      };
    } else if (event instanceof HTMLElement) {
      const rect = event.getBoundingClientRect();
      origin = {
        x: (rect.left + rect.width / 2) / window.innerWidth,
        y: (rect.top + rect.height / 2) / window.innerHeight,
      };
    }
  }

  confetti({
    particleCount: 45,
    spread: 60,
    origin,
    colors: ['#38bdf8', '#60a5fa', '#93c5fd', '#ffffff'],
    ticks: 100,
    gravity: 0.8,
    scalar: 0.9,
    disableForReducedMotion: true,
  });
}

// Button click sound trigger - Cursor animation completely removed per user instruction
export function triggerStrongButtonBurst(_e?: React.MouseEvent<HTMLElement>, playRocketAudio = true) {
  if (playRocketAudio) {
    sound.playRocketSound(1.4);
  } else {
    sound.playClick();
  }
}

// Completely inert overlay with zero cursor animation or canvas listeners
export const ClickBurstOverlay: React.FC = () => {
  return null;
};
