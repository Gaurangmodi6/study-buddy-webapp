import React, { useRef, useMemo, useEffect, useState } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { generateParticleData, ParticleData } from './ParticleShapes';
import { ScrollMorphState, liveScrollScrubber } from './useScrollMorph';

interface ParticleSceneProps {
  scrollState: ScrollMorphState;
  ambientOnly?: boolean;
}

function isWebGLAvailable(): boolean {
  try {
    const canvas = document.createElement('canvas');
    return !!(
      window.WebGLRenderingContext &&
      (canvas.getContext('webgl') || canvas.getContext('experimental-webgl'))
    );
  } catch {
    return false;
  }
}

// Deep space starfield full of brilliant WHITE stars (8,000 count) with bidirectional scroll scrubbing
function CosmicWhiteStarfield() {
  const count = typeof window !== 'undefined' && window.innerWidth < 768 ? 4000 : 8000;
  const starsRef = useRef<THREE.Points>(null);
  const prevScrollY = useRef(0);
  const smoothedVelocity = useRef(0);

  const [positions, colors] = useMemo(() => {
    const pos = new Float32Array(count * 3);
    const col = new Float32Array(count * 3);

    for (let i = 0; i < count; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 90;
      pos[i * 3 + 1] = (Math.random() - 0.5) * 90;
      pos[i * 3 + 2] = -85 + Math.random() * 110;

      // 100% PURE CRISP WHITE STARS (Zero blur, zero blue tint)
      col[i * 3] = 1.0;
      col[i * 3 + 1] = 1.0;
      col[i * 3 + 2] = 1.0;
    }
    return [pos, col];
  }, [count]);

  // Crisp radiant white star texture
  const starTexture = useMemo(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 64;
    canvas.height = 64;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      const gradient = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
      gradient.addColorStop(0, '#ffffff');
      gradient.addColorStop(0.2, 'rgba(255, 255, 255, 1)');
      gradient.addColorStop(0.45, 'rgba(255, 255, 255, 0.4)');
      gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, 64, 64);
    }
    const texture = new THREE.CanvasTexture(canvas);
    texture.generateMipmaps = false;
    texture.minFilter = THREE.LinearFilter;
    return texture;
  }, []);

  useFrame(({ clock }) => {
    if (!starsRef.current) return;
    const time = clock.getElapsedTime();

    // Read direct live scrubber velocity for frame-by-frame scrub reaction
    const currentScrollY = liveScrollScrubber.scrollY;
    const deltaScroll = currentScrollY - prevScrollY.current;
    prevScrollY.current = currentScrollY;

    smoothedVelocity.current += (deltaScroll - smoothedVelocity.current) * 0.2;

    const geom = starsRef.current.geometry;
    const posAttr = geom.getAttribute('position') as THREE.BufferAttribute;
    const array = posAttr.array as Float32Array;

    // Gentle ambient drift
    starsRef.current.rotation.y = time * 0.008;

    // Bidirectional velocity: forward when scrolling down, backward when scrubbing up!
    const velocity = smoothedVelocity.current;
    const speed = Math.max(-3.5, Math.min(3.5, velocity * 0.09));

    for (let i = 0; i < count; i++) {
      const idx = i * 3;

      // Scrub forward or backward tied directly to mouse wheel / scroll movement
      array[idx + 2] += 0.03 + speed;

      // Wrap stars seamlessly in both forward and reverse scrub directions
      if (array[idx + 2] > 25) {
        array[idx + 2] = -85;
        array[idx] = (Math.random() - 0.5) * 90;
        array[idx + 1] = (Math.random() - 0.5) * 90;
      } else if (array[idx + 2] < -85) {
        array[idx + 2] = 25;
        array[idx] = (Math.random() - 0.5) * 90;
        array[idx + 1] = (Math.random() - 0.5) * 90;
      }
    }

    posAttr.needsUpdate = true;
  });

  return (
    <points ref={starsRef}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
        <bufferAttribute attach="attributes-color" args={[colors, 3]} />
      </bufferGeometry>
      <pointsMaterial
        size={0.16}
        map={starTexture}
        vertexColors
        transparent
        opacity={0.92}
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
    </points>
  );
}

// 3D Interactive Camera Parallax Controller (Mouse & Scroll Depth)
function CameraParallaxRig() {
  const { camera } = useThree();
  useFrame(() => {
    const mx = liveScrollScrubber.mouseX;
    const my = liveScrollScrubber.mouseY;
    const scrub = liveScrollScrubber.targetProgress;

    // Smooth exponential damping to mouse & scroll parallax
    const targetCamX = mx * 0.45;
    const targetCamY = -my * 0.35 + (scrub < 0.25 ? 0 : -0.2);
    const targetCamZ = 7.0 - scrub * 0.4;

    camera.position.x += (targetCamX - camera.position.x) * 0.06;
    camera.position.y += (targetCamY - camera.position.y) * 0.06;
    camera.position.z += (targetCamZ - camera.position.z) * 0.06;
    camera.lookAt(0, 0, 0);
  });
  return null;
}

// 3D Scroll-Driven / Scroll-Linked Particle Scrubber with Progressive Dispersal
interface MorphingParticlesProps {
  particleData: ParticleData;
}

function MorphingParticles({ particleData }: MorphingParticlesProps) {
  const { count, rocket, satellite, calendar, barChart, colors } = particleData;
  const pointsRef = useRef<THREE.Points>(null);
  const smoothProgressRef = useRef(0);

  const currentPositions = useMemo(() => new Float32Array(rocket), [rocket]);

  const particleTexture = useMemo(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 64;
    canvas.height = 64;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      const gradient = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
      gradient.addColorStop(0, 'rgba(255, 255, 255, 1)');
      gradient.addColorStop(0.3, 'rgba(240, 249, 255, 0.95)');
      gradient.addColorStop(0.6, 'rgba(56, 189, 248, 0.45)');
      gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, 64, 64);
    }
    const texture = new THREE.CanvasTexture(canvas);
    texture.generateMipmaps = false;
    texture.minFilter = THREE.LinearFilter;
    return texture;
  }, []);

  useFrame(({ clock }) => {
    if (!pointsRef.current) return;
    const time = clock.getElapsedTime();
    const geom = pointsRef.current.geometry;
    const posAttr = geom.getAttribute('position') as THREE.BufferAttribute;

    // Direct frame-by-frame scrub interpolation: smooth 60fps dampening to scrub target
    const targetP = liveScrollScrubber.targetProgress;
    smoothProgressRef.current += (targetP - smoothProgressRef.current) * 0.22;
    const scrub = smoothProgressRef.current;

    // Continuous 4-Stage Scrollytelling Timeline:
    // Stage 0: 0.00 - 0.25 (Rocket on Hero)
    // Stage 1: 0.25 - 0.52 (Orbital Satellite at Timetable Section)
    // Stage 2: 0.52 - 0.78 (Google Workspace Calendar Grid)
    // Stage 3: 0.78 - 1.00 (Telemetry Bar Chart & Squadron)
    let fromBuf = rocket;
    let toBuf = rocket;
    let blend = 0;
    let stageIndex = 0;

    if (scrub < 0.25) {
      stageIndex = 0;
      fromBuf = rocket;
      toBuf = satellite;
      // Morph begins at 0.12 so particles disperse and reassemble into Satellite by 0.25
      blend = Math.max(0, Math.min(1, (scrub - 0.12) / 0.13));
    } else if (scrub < 0.52) {
      stageIndex = 1;
      fromBuf = satellite;
      toBuf = calendar;
      blend = Math.max(0, Math.min(1, (scrub - 0.40) / 0.12));
    } else if (scrub < 0.78) {
      stageIndex = 2;
      fromBuf = calendar;
      toBuf = barChart;
      blend = Math.max(0, Math.min(1, (scrub - 0.66) / 0.12));
    } else {
      stageIndex = 3;
      fromBuf = barChart;
      toBuf = barChart;
      blend = 0;
    }

    // 3D Spatial Position & Perspective scrubbing choreographed per section:
    const isDesktop = typeof window !== 'undefined' && window.innerWidth >= 768;

    let targetGroupX = 0;
    let targetGroupY = 0;
    let targetGroupZ = 0;
    let targetRotX = 0;
    let targetRotY = 0;
    let targetRotZ = 0;

    if (stageIndex === 0) {
      // HERO SECTION (Rocket)
      targetGroupX = isDesktop ? 2.05 : 0.0;
      targetGroupY = 0.15 + Math.sin(time * 0.7) * 0.06;
      targetGroupZ = 0.15;
      const tilt = 1 - blend * 0.85;
      targetRotX = 0.26 * tilt;
      targetRotY = time * 0.08 + (scrub * Math.PI * 1.6);
      targetRotZ = -0.54 * tilt;
    } else if (stageIndex === 1) {
      // TIMETABLE SECTION (Orbital Satellite)
      // Placed proudly in the right column of the timetable section
      targetGroupX = isDesktop ? 2.15 : 0.0;
      targetGroupY = -0.1 + Math.sin(time * 0.6) * 0.05;
      targetGroupZ = 0.35;
      targetRotX = Math.sin(time * 0.4) * 0.15;
      targetRotY = time * 0.22 + (scrub * Math.PI * 2.2);
      targetRotZ = 0.08;
    } else if (stageIndex === 2) {
      // GOOGLE WORKSPACE SECTION (Calendar Orbit Grid)
      // Centered with subtle depth behind workspace cards
      targetGroupX = 0.0;
      targetGroupY = -0.25;
      targetGroupZ = -0.75;
      targetRotX = 0.32;
      targetRotY = time * 0.25;
      targetRotZ = 0.0;
    } else {
      // TELEMETRY & SQUADRON (Bar Chart / Fleet)
      targetGroupX = isDesktop ? -1.85 : 0.0;
      targetGroupY = -0.15;
      targetGroupZ = 0.2;
      targetRotX = 0.18;
      targetRotY = time * 0.16;
      targetRotZ = 0.0;
    }

    // Smooth exponential damping on group position & rotation
    pointsRef.current.position.x += (targetGroupX - pointsRef.current.position.x) * 0.16;
    pointsRef.current.position.y += (targetGroupY - pointsRef.current.position.y) * 0.16;
    pointsRef.current.position.z += (targetGroupZ - pointsRef.current.position.z) * 0.16;
    pointsRef.current.rotation.x += (targetRotX - pointsRef.current.rotation.x) * 0.16;
    pointsRef.current.rotation.y += (targetRotY - pointsRef.current.rotation.y) * 0.16;
    pointsRef.current.rotation.z += (targetRotZ - pointsRef.current.rotation.z) * 0.16;

    const array = posAttr.array as Float32Array;
    const dampSpeed = 0.24;

    // Progressive Dispersal Physics:
    // Peak explosion/vortex at blend = 0.5, collapsing back to 0 at blend = 0 or 1
    const disperseFactor = Math.sin(blend * Math.PI) * 1.85;

    for (let i = 0; i < count; i++) {
      const idx = i * 3;

      const fx = fromBuf[idx];
      const fy = fromBuf[idx + 1];
      const fz = fromBuf[idx + 2];

      const tx = toBuf[idx];
      const ty = toBuf[idx + 1];
      const tz = toBuf[idx + 2];

      // Swirling stardust curl noise for progressive dispersal & magnetic assembly
      const seed = (i * 1.6180339887) % (Math.PI * 2);
      const curlNoiseX = Math.cos(seed * 3 + time * 1.5) * disperseFactor * (0.8 + 0.3 * Math.sin(i * 0.1));
      const curlNoiseY = Math.sin(seed * 2 + time * 1.5) * disperseFactor * 0.9 + (liveScrollScrubber.velocity * 0.007);
      const curlNoiseZ = Math.cos(seed * 5) * disperseFactor * 0.7;

      let targetX = fx + (tx - fx) * blend + curlNoiseX;
      let targetY = fy + (ty - fy) * blend + curlNoiseY;
      let targetZ = fz + (tz - fz) * blend + curlNoiseZ;

      // Stage 0: Ion Thruster Flame Flicker only while in Rocket stage
      if (scrub < 0.20 && targetY < -1.0) {
        const flicker = Math.sin(time * 16 + i) * 0.08 * (1 - scrub * 4);
        targetX += flicker * 0.7;
        targetY -= Math.abs(flicker) * 0.5;
      }

      // Stage 1: Radar Scan Wave emanating outward from Satellite dish
      if (stageIndex === 1 && blend < 0.2 && i < count * 0.16) {
        const radarCycle = (time * 1.8 + i * 0.01) % 1.0;
        targetZ += radarCycle * 1.8;
        targetX += Math.cos(i) * radarCycle * 0.7;
        targetY += Math.sin(i) * radarCycle * 0.7;
      }

      array[idx] += (targetX - array[idx]) * dampSpeed;
      array[idx + 1] += (targetY - array[idx + 1]) * dampSpeed;
      array[idx + 2] += (targetZ - array[idx + 2]) * dampSpeed;
    }

    posAttr.needsUpdate = true;
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[currentPositions, 3]} />
        <bufferAttribute attach="attributes-color" args={[colors, 3]} />
      </bufferGeometry>
      <pointsMaterial
        size={typeof window !== 'undefined' && window.innerWidth < 768 ? 0.09 : 0.08}
        map={particleTexture}
        vertexColors
        transparent
        opacity={0.95}
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
    </points>
  );
}

export const ParticleScene: React.FC<ParticleSceneProps> = ({ ambientOnly = false }) => {
  const [hasWebGL, setHasWebGL] = useState(true);

  useEffect(() => {
    setHasWebGL(isWebGLAvailable());
  }, []);

  const particleCount = useMemo(() => {
    if (typeof window === 'undefined') return 3600;
    return window.innerWidth < 768 ? 1900 : 4200;
  }, []);

  const particleData = useMemo(() => {
    return generateParticleData(particleCount);
  }, [particleCount]);

  if (!hasWebGL) {
    return (
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden bg-black">
        <div className="absolute top-1/4 right-1/4 w-[500px] h-[500px] rounded-full bg-blue-600/10 blur-3xl" />
      </div>
    );
  }

  return (
    <div
      className="fixed inset-0 pointer-events-none z-0"
      style={{
        backgroundColor: '#000000',
      }}
    >
      <Canvas
        camera={{ position: [0, 0, 7], fov: 48 }}
        gl={{ antialias: true, powerPreference: 'high-performance' }}
        onCreated={({ gl }) => {
          gl.setClearColor('#000000', 1);
        }}
        dpr={typeof window !== 'undefined' ? Math.min(window.devicePixelRatio, 2) : 1}
      >
        {/* Interactive Mouse & Scroll 3D Camera Parallax Controller */}
        <CameraParallaxRig />

        {/* Full 3D Starfield with ~8,000 Brilliant White Stars & Bidirectional Scroll Warp */}
        <CosmicWhiteStarfield />

        {/* Central 3D White & Blue Rocket / Morphing Shapes with Progressive Dispersal */}
        {!ambientOnly && (
          <MorphingParticles
            particleData={particleData}
          />
        )}
      </Canvas>
    </div>
  );
};
