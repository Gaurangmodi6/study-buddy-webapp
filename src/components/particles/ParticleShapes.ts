import * as THREE from 'three';

export interface ParticleData {
  count: number;
  rocket: Float32Array;
  satellite: Float32Array;
  calendar: Float32Array;
  barChart: Float32Array;
  colors: Float32Array;
  sizes: Float32Array;
}

// Generate high-density 3D particle shapes: Rocket -> Satellite (after 2 pages) -> Calendar -> Bar Chart
export function generateParticleData(count: number): ParticleData {
  const rocket = new Float32Array(count * 3);
  const satellite = new Float32Array(count * 3);
  const calendar = new Float32Array(count * 3);
  const barChart = new Float32Array(count * 3);
  const colors = new Float32Array(count * 3);
  const sizes = new Float32Array(count);

  // Palettes matching reference image:
  const cGold = new THREE.Color('#fbbf24');
  const cAmber = new THREE.Color('#f59e0b');
  const cOrange = new THREE.Color('#ea580c');
  const cWhite = new THREE.Color('#ffffff');
  const cIcy = new THREE.Color('#e0f2fe');
  const cElectricBlue = new THREE.Color('#38bdf8');
  const cDeepBlue = new THREE.Color('#2563eb');
  const cRoyalBlue = new THREE.Color('#1d4ed8');
  const cCyan = new THREE.Color('#06b6d4');

  // Pseudo-random generator for consistent distribution
  let seed = 1337;
  const rnd = () => {
    seed = (seed * 9301 + 49297) % 233280;
    return seed / 233280;
  };

  // ==========================================
  // 1. ROCKET SHAPE GENERATION (Stage 0: Page 1 Hero)
  // ==========================================
  const sphereCount = Math.floor(count * 0.16); // Central spherical core
  const noseCount = Math.floor(count * 0.22);   // Golden & white nose
  const bodyCount = Math.floor(count * 0.38);   // Main blue & white body
  const finsCount = Math.floor(count * 0.12);   // Swept fins
  const flameCount = count - sphereCount - noseCount - bodyCount - finsCount; // Exhaust plume

  let idx = 0;

  // A. Central Luminous Sphere / Viewport Core (bright circular orb in reference photo)
  const sphereCenterY = 0.4;
  const sphereRadius = 0.55;
  for (let i = 0; i < sphereCount; i++) {
    const u = rnd();
    const v = rnd();
    const theta = u * 2.0 * Math.PI;
    const phi = Math.acos(2.0 * v - 1.0);
    const r = sphereRadius * (0.8 + 0.2 * Math.sqrt(rnd()));

    const sx = r * Math.sin(phi) * Math.cos(theta);
    const sy = sphereCenterY + r * Math.sin(phi) * Math.sin(theta);
    const sz = r * Math.cos(phi) + 0.15;

    rocket[idx * 3] = sx;
    rocket[idx * 3 + 1] = sy;
    rocket[idx * 3 + 2] = sz;

    const isCoreWhite = rnd() > 0.28;
    const c = isCoreWhite ? cWhite : cIcy;
    colors[idx * 3] = c.r;
    colors[idx * 3 + 1] = c.g;
    colors[idx * 3 + 2] = c.b;
    sizes[idx] = 1.3 + rnd() * 1.8;
    idx++;
  }

  // B. Nose Cone & Upper Ridge (Amber, Gold & White gradient as in reference photo)
  for (let i = 0; i < noseCount; i++) {
    const t = rnd();
    const y = 0.8 + t * 1.6;
    const maxR = (1 - t * 0.95) * 0.68;
    const r = Math.sqrt(rnd()) * maxR;
    const angle = rnd() * Math.PI * 2;

    rocket[idx * 3] = Math.cos(angle) * r;
    rocket[idx * 3 + 1] = y;
    rocket[idx * 3 + 2] = Math.sin(angle) * r;

    const isGoldFlank = Math.cos(angle) < 0.2;
    let c: THREE.Color;
    if (isGoldFlank) {
      c = rnd() > 0.4 ? cGold : cAmber;
    } else {
      c = rnd() > 0.3 ? cWhite : cIcy;
    }

    colors[idx * 3] = c.r;
    colors[idx * 3 + 1] = c.g;
    colors[idx * 3 + 2] = c.b;
    sizes[idx] = 1.2 + rnd() * 2.0;
    idx++;
  }

  // C. Fuselage Body (Electric Blue, Royal Blue, and Brilliant White streaks)
  for (let i = 0; i < bodyCount; i++) {
    const y = -1.1 + rnd() * 2.0;
    const taper = y < -0.6 ? 1 - (-0.6 - y) * 0.4 : 1;
    const r = (0.58 + (rnd() - 0.5) * 0.14) * taper;
    const angle = rnd() * Math.PI * 2;

    rocket[idx * 3] = Math.cos(angle) * r;
    rocket[idx * 3 + 1] = y;
    rocket[idx * 3 + 2] = Math.sin(angle) * r;

    const whiteBand = Math.sin(y * 4 + angle * 2) > 0.3;
    let c: THREE.Color;
    if (whiteBand) {
      c = rnd() > 0.3 ? cWhite : cIcy;
    } else {
      c = rnd() > 0.5 ? cElectricBlue : rnd() > 0.3 ? cDeepBlue : cRoyalBlue;
    }

    colors[idx * 3] = c.r;
    colors[idx * 3 + 1] = c.g;
    colors[idx * 3 + 2] = c.b;
    sizes[idx] = 1.1 + rnd() * 1.7;
    idx++;
  }

  // D. Swept Wings & Aerodynamic Fins
  for (let i = 0; i < finsCount; i++) {
    const finIndex = Math.floor(rnd() * 3);
    const finAngle = (finIndex * Math.PI * 2) / 3;
    const t = rnd();
    const y = -1.1 + t * 0.9;
    const finSpread = 0.6 + (1 - t) * 0.95 * Math.sqrt(rnd());
    const jitter = (rnd() - 0.5) * 0.08;

    rocket[idx * 3] = Math.cos(finAngle) * finSpread - Math.sin(finAngle) * jitter;
    rocket[idx * 3 + 1] = y;
    rocket[idx * 3 + 2] = Math.sin(finAngle) * finSpread + Math.cos(finAngle) * jitter;

    const isEdge = finSpread > 1.1;
    const c = isEdge ? cWhite : rnd() > 0.4 ? cElectricBlue : cDeepBlue;

    colors[idx * 3] = c.r;
    colors[idx * 3 + 1] = c.g;
    colors[idx * 3 + 2] = c.b;
    sizes[idx] = 1.2 + rnd() * 1.9;
    idx++;
  }

  // E. Trailing Flame Exhaust
  for (let i = 0; i < flameCount; i++) {
    const t = rnd();
    const y = -1.1 - t * 2.5;
    const plumeR = (0.22 + t * 0.65) * Math.sqrt(rnd());
    const angle = rnd() * Math.PI * 2;

    rocket[idx * 3] = Math.cos(angle) * plumeR;
    rocket[idx * 3 + 1] = y;
    rocket[idx * 3 + 2] = Math.sin(angle) * plumeR;

    const normalizedDist = plumeR / (0.22 + t * 0.65);
    let c: THREE.Color;
    if (normalizedDist < 0.35) {
      c = cWhite;
    } else if (normalizedDist < 0.7) {
      c = rnd() > 0.5 ? cGold : cAmber;
    } else {
      c = rnd() > 0.5 ? cCyan : cOrange;
    }

    colors[idx * 3] = c.r;
    colors[idx * 3 + 1] = c.g;
    colors[idx * 3 + 2] = c.b;
    sizes[idx] = 1.4 + rnd() * 2.4;
    idx++;
  }

  // ==========================================
  // 2. ORBITAL SATELLITE SHAPE (Stage 1: Formed right after Page 2!)
  // ==========================================
  // Structure:
  // - Central Cube/Octagonal Core (Bus)
  // - Wide Solar Wings extending left (-X) and right (+X)
  // - Parabolic Dish Antenna facing outward
  // - Magnetometer and Sensor Boom pointing +Y
  const satBodyCount = Math.floor(count * 0.28);
  const satPanelsCount = Math.floor(count * 0.46); // Dual solar array wings
  const satDishCount = Math.floor(count * 0.16);   // Communication dish
  const satBoomCount = count - satBodyCount - satPanelsCount - satDishCount;

  let sIdx = 0;

  // Central Satellite Bus (Cube/Octagonal Body)
  for (let i = 0; i < satBodyCount; i++) {
    const bx = (rnd() - 0.5) * 1.1;
    const by = (rnd() - 0.5) * 1.1;
    const bz = (rnd() - 0.5) * 1.1;

    satellite[sIdx * 3] = bx;
    satellite[sIdx * 3 + 1] = by;
    satellite[sIdx * 3 + 2] = bz;
    sIdx++;
  }

  // Dual Wide Solar Panel Wings (Left: x = -2.8 to -0.8, Right: x = 0.8 to 2.8)
  for (let i = 0; i < satPanelsCount; i++) {
    const isRight = rnd() > 0.5;
    const sideSign = isRight ? 1 : -1;

    // Span from 0.8 to 2.9 on X
    const panelX = sideSign * (0.8 + rnd() * 2.1);
    const panelY = (rnd() - 0.5) * 1.35;
    const panelZ = (rnd() - 0.5) * 0.12;

    satellite[sIdx * 3] = panelX;
    satellite[sIdx * 3 + 1] = panelY;
    satellite[sIdx * 3 + 2] = panelZ;
    sIdx++;
  }

  // Parabolic Dish Antenna (facing outward at front +Z)
  for (let i = 0; i < satDishCount; i++) {
    const dishRadius = 0.75 * Math.sqrt(rnd());
    const angle = rnd() * Math.PI * 2;
    const dishDepth = 0.35 * (1 - (dishRadius / 0.75) * (dishRadius / 0.75));

    const dx = Math.cos(angle) * dishRadius;
    const dy = 0.2 + Math.sin(angle) * dishRadius;
    const dz = 0.7 + dishDepth;

    satellite[sIdx * 3] = dx;
    satellite[sIdx * 3 + 1] = dy;
    satellite[sIdx * 3 + 2] = dz;
    sIdx++;
  }

  // Sensor and Communication Booms (+Y and corners)
  for (let i = 0; i < satBoomCount; i++) {
    const t = rnd();
    // Top boom extending +Y
    if (rnd() > 0.35) {
      satellite[sIdx * 3] = (rnd() - 0.5) * 0.15;
      satellite[sIdx * 3 + 1] = 0.6 + t * 1.4;
      satellite[sIdx * 3 + 2] = (rnd() - 0.5) * 0.15;
    } else {
      // Corner thrusters
      const cx = (rnd() > 0.5 ? 1 : -1) * 0.6;
      const cy = (rnd() > 0.5 ? 1 : -1) * 0.6;
      const cz = (rnd() > 0.5 ? 1 : -1) * 0.6;
      satellite[sIdx * 3] = cx + (rnd() - 0.5) * 0.2;
      satellite[sIdx * 3 + 1] = cy + (rnd() - 0.5) * 0.2;
      satellite[sIdx * 3 + 2] = cz + (rnd() - 0.5) * 0.2;
    }
    sIdx++;
  }

  // ==========================================
  // 3. CALENDAR ORBIT GRID SHAPE
  // ==========================================
  for (let i = 0; i < count; i++) {
    const col = Math.floor(rnd() * 7);
    const row = Math.floor(rnd() * 5);
    const cellX = (col - 3) * 0.62 + (rnd() - 0.5) * 0.45;
    const cellY = (2 - row) * 0.58 + (rnd() - 0.5) * 0.4;
    const isHighlighted = (col + row * 7) % 3 === 0;
    const cellZ = isHighlighted ? 0.35 + (rnd() - 0.5) * 0.2 : (rnd() - 0.5) * 0.12;

    calendar[i * 3] = cellX;
    calendar[i * 3 + 1] = cellY;
    calendar[i * 3 + 2] = cellZ;
  }

  // ==========================================
  // 4. TELEMETRY BAR CHART SHAPE
  // ==========================================
  for (let i = 0; i < count; i++) {
    const barIdx = Math.floor(rnd() * 7);
    const barHeights = [1.2, 1.8, 1.5, 2.5, 2.1, 3.0, 2.4];
    const maxH = barHeights[barIdx];
    const bx = (barIdx - 3) * 0.68 + (rnd() - 0.5) * 0.38;
    const by = -1.5 + rnd() * maxH;
    const bz = (rnd() - 0.5) * 0.35;

    barChart[i * 3] = bx;
    barChart[i * 3 + 1] = by;
    barChart[i * 3 + 2] = bz;
  }

  return {
    count,
    rocket,
    satellite,
    calendar,
    barChart,
    colors,
    sizes,
  };
}
