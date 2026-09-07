import { GameState, getMoonPhase } from '../types';
import { visualFxParticleSystem } from './visualFxParticleSystem';
import { playSound } from '../utils/audio';
import { getSeasonalLeafPalette, isForestBiome, isDesertBiome, isObstacleTile } from '../utils/weatherEngine';
import { renderBiomeMicroAtmosphere } from './biomeAtmosphereRenderer';
import { lightingEngine } from './lightingEngine';
import { weatherInteractivityManager } from './weatherInteractivityRenderer';

export interface RenderWeatherAndLightingParams {
  ctx: CanvasRenderingContext2D;
  gameState: GameState;
  dimensions: { width: number; height: number };
  camX?: number;
  camY?: number;
  tileSize?: number;
}

interface LightningActiveState {
  startTime: number;
  duration: number;
  targetX: number;
  targetY: number;
  mainSegments: { x1: number; y1: number; x2: number; y2: number }[];
  branchSegments: { x1: number; y1: number; x2: number; y2: number }[];
}

let activeLightningStrike: LightningActiveState | null = null;
let lastAmbientLightningTime = 0;

let currentTrackedWeather: string | null = null;
let previousTrackedWeather: string | null = null;
let weatherTransitionStartTime = 0;
const WEATHER_TRANSITION_DURATION = 2400; // 2.4 seconds smooth atmospheric transition

export function resetWeatherTransitionState() {
  currentTrackedWeather = null;
  previousTrackedWeather = null;
  weatherTransitionStartTime = 0;
}

export function renderWeatherOverlay(
  ctx: CanvasRenderingContext2D,
  weather: string,
  dimensions: { width: number; height: number },
  alpha: number = 1.0
) {
  if (alpha <= 0 || !weather || weather === 'clear') return;

  ctx.save();
  ctx.globalAlpha *= Math.min(1.0, Math.max(0, alpha));

  if (weather === 'rainy' || weather === 'stormy') {
    ctx.strokeStyle = 'rgba(56, 189, 248, 0.4)';
    ctx.lineWidth = 1;
    const now = Date.now() * 0.04;
    ctx.beginPath();
    for (let i = 0; i < 28; i++) {
      const rx = (i * 47 + now * 2.2) % dimensions.width;
      const ry = (i * 83 + now * 5.4) % dimensions.height;
      ctx.moveTo(rx, ry);
      ctx.lineTo(rx - 2, ry + 12);
    }
    ctx.stroke();
  } else if (weather === 'snowy') {
    ctx.fillStyle = 'rgba(255, 255, 255, 0.75)';
    const now = Date.now() * 0.012;
    ctx.beginPath();
    for (let i = 0; i < 30; i++) {
      const rx = (i * 39 + Math.sin(now + i) * 15) % dimensions.width;
      const ry = (i * 73 + now * 0.9) % dimensions.height;
      const radius = Math.abs(i % 3) + 1.2;
      ctx.moveTo(rx + radius, ry);
      ctx.arc(rx, ry, radius, 0, Math.PI * 2);
    }
    ctx.fill();
  } else if (weather === 'foggy') {
    const fogGrad = ctx.createLinearGradient(0, 0, 0, dimensions.height);
    fogGrad.addColorStop(0, 'rgba(148, 163, 184, 0.15)');
    fogGrad.addColorStop(0.5, 'rgba(148, 163, 184, 0.28)');
    fogGrad.addColorStop(1, 'rgba(148, 163, 184, 0.15)');
    ctx.fillStyle = fogGrad;
    ctx.fillRect(0, 0, dimensions.width, dimensions.height);
  } else if (weather === 'sandstorm') {
    ctx.strokeStyle = 'rgba(245, 158, 11, 0.22)';
    ctx.lineWidth = 1.5;
    const now = Date.now() * 0.08;
    ctx.beginPath();
    for (let i = 0; i < 40; i++) {
      const rx = (i * 59 + now * 8.5) % dimensions.width;
      const ry = (i * 37 + Math.sin(now + i) * 8) % dimensions.height;
      ctx.moveTo(rx, ry);
      ctx.lineTo(rx + 20, ry + 2);
    }
    ctx.stroke();
    ctx.fillStyle = 'rgba(120, 53, 4, 0.08)';
    ctx.fillRect(0, 0, dimensions.width, dimensions.height);
  } else if (weather === 'blizzard') {
    ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
    ctx.strokeStyle = 'rgba(186, 230, 253, 0.35)';
    ctx.lineWidth = 1;
    const now = Date.now() * 0.05;
    ctx.beginPath();
    for (let i = 0; i < 50; i++) {
      const rx = (i * 41 + now * 12.0) % dimensions.width;
      const ry = (i * 61 + now * 5.0) % dimensions.height;
      const radius = Math.abs(i % 2) + 1.2;
      ctx.moveTo(rx + radius, ry);
      ctx.arc(rx, ry, radius, 0, Math.PI * 2);
    }
    ctx.fill();

    ctx.beginPath();
    for (let i = 0; i < 50; i += 5) {
      const rx = (i * 41 + now * 12.0) % dimensions.width;
      const ry = (i * 61 + now * 5.0) % dimensions.height;
      ctx.moveTo(rx, ry);
      ctx.lineTo(rx - 15, ry + 3);
    }
    ctx.stroke();

    ctx.fillStyle = 'rgba(224, 242, 254, 0.12)';
    ctx.fillRect(0, 0, dimensions.width, dimensions.height);
  }

  ctx.restore();
}

export function triggerLightningStrike(options?: {
  targetX?: number;
  targetY?: number;
  screenWidth?: number;
  screenHeight?: number;
  playAudio?: boolean;
}) {
  const width = options?.screenWidth || (typeof window !== 'undefined' ? window.innerWidth : 800);
  const height = options?.screenHeight || (typeof window !== 'undefined' ? window.innerHeight : 600);

  const targetX = options?.targetX !== undefined ? options.targetX : Math.random() * (width * 0.8) + width * 0.1;
  const targetY = options?.targetY !== undefined ? options.targetY : Math.random() * (height * 0.5) + height * 0.25;

  const startX = targetX + (Math.random() - 0.5) * 140;
  const startY = 0;

  const mainSegments: { x1: number; y1: number; x2: number; y2: number }[] = [];
  const branchSegments: { x1: number; y1: number; x2: number; y2: number }[] = [];

  let currX = startX;
  let currY = startY;
  const steps = 14 + Math.floor(Math.random() * 6);
  const dy = (targetY - startY) / steps;

  for (let i = 0; i < steps; i++) {
    const nextY = currY + dy;
    const progress = (i + 1) / steps;
    const interpX = startX + (targetX - startX) * progress;
    const jitter = (1 - progress) * 35 + 8;
    const nextX = i === steps - 1 ? targetX : interpX + (Math.random() - 0.5) * jitter;

    mainSegments.push({ x1: currX, y1: currY, x2: nextX, y2: nextY });

    if (Math.random() < 0.35 && i > 2 && i < steps - 2) {
      let bX = nextX;
      let bY = nextY;
      const branchAngle = (Math.random() > 0.5 ? 1 : -1) * (0.4 + Math.random() * 0.5);
      const branchLen = 25 + Math.random() * 40;
      const bSteps = 3 + Math.floor(Math.random() * 3);

      for (let b = 0; b < bSteps; b++) {
        const nbX = bX + Math.cos(branchAngle) * (branchLen / bSteps) + (Math.random() - 0.5) * 10;
        const nbY = bY + Math.sin(branchAngle) * (branchLen / bSteps) + Math.random() * 12;
        branchSegments.push({ x1: bX, y1: bY, x2: nbX, y2: nbY });
        bX = nbX;
        bY = nbY;
      }
    }

    currX = nextX;
    currY = nextY;
  }

  activeLightningStrike = {
    startTime: Date.now(),
    duration: 420,
    targetX,
    targetY,
    mainSegments,
    branchSegments,
  };

  visualFxParticleSystem.spawnLightningBurst(targetX, targetY, 24);

  if (options?.playAudio !== false) {
    playSound('lightning_strike', { volume: 0.95 });
  }
}

export function renderWeatherAndLighting({
  ctx,
  gameState,
  dimensions,
  camX = 0,
  camY = 0,
  tileSize = 28,
}: RenderWeatherAndLightingParams) {
  let lightningFlashAlpha = 0;

  // --- Rare Ambient Lightning Strike Trigger during Rainy Storm Weather ---
  const nowTime = Date.now();
  if (gameState.weather === 'rainy' && gameState.isOverworld && !activeLightningStrike) {
    if (nowTime - lastAmbientLightningTime > 45000) { // At least 45s interval
      if (Math.random() < 0.0008) { // Extra rare frame trigger chance
        lastAmbientLightningTime = nowTime;
        triggerLightningStrike({
          screenWidth: dimensions.width,
          screenHeight: dimensions.height,
        });
      }
    }
  }

  // Calculate active lightning flash intensity
  if (activeLightningStrike) {
    const elapsed = nowTime - activeLightningStrike.startTime;
    if (elapsed <= activeLightningStrike.duration) {
      const progress = elapsed / activeLightningStrike.duration;
      if (progress < 0.15) {
        lightningFlashAlpha = (progress / 0.15) * 0.85;
      } else if (progress < 0.30) {
        lightningFlashAlpha = 0.85 - ((progress - 0.15) / 0.15) * 0.45;
      } else if (progress < 0.45) {
        lightningFlashAlpha = 0.40 + ((progress - 0.30) / 0.15) * 0.50;
      } else {
        lightningFlashAlpha = 0.90 * Math.pow(1 - (progress - 0.45) / 0.55, 2);
      }
    }
  }

  // 1. Dynamic 2D Multi-Light Point Shader (Player lantern, campfires, torches, shrines, lava, dungeons)
  lightingEngine.renderLightingPass(
    ctx,
    gameState,
    camX,
    camY,
    dimensions,
    tileSize,
    lightningFlashAlpha
  );

  // 2. Weather Ground Interactivity (Rain puddle ripples, droplet splashes, snow crust on walls/trees)
  weatherInteractivityManager.renderInteractivity(
    ctx,
    gameState,
    camX,
    camY,
    dimensions,
    tileSize
  );

  // If inside dungeon and not overworld, skip overworld weather overlays
  if (!gameState.isOverworld) {
    // Render Visual FX Particle System Overlay (Sparks, Embers, Spell Bursts in dungeon)
    visualFxParticleSystem.updateAndRender(ctx, 16);
    return;
  }

  // Render Weather Elements with Gradual Atmosphere Fade & Smooth Cross-Fade
  const targetWeather = gameState.weather || 'clear';
  if (currentTrackedWeather === null) {
    currentTrackedWeather = targetWeather;
    previousTrackedWeather = targetWeather;
  } else if (currentTrackedWeather !== targetWeather) {
    previousTrackedWeather = currentTrackedWeather;
    currentTrackedWeather = targetWeather;
    weatherTransitionStartTime = Date.now();
  }

  const now = Date.now();
  const transitionElapsed = now - weatherTransitionStartTime;
  const isTransitioning = transitionElapsed < WEATHER_TRANSITION_DURATION && previousTrackedWeather !== currentTrackedWeather;
  const progress = isTransitioning ? Math.min(1.0, transitionElapsed / WEATHER_TRANSITION_DURATION) : 1.0;

  if (isTransitioning) {
    // 1. Cross-fade outgoing previous weather layer
    if (previousTrackedWeather && previousTrackedWeather !== 'clear') {
      renderWeatherOverlay(ctx, previousTrackedWeather, dimensions, 1.0 - progress);
    }

    // 2. Cross-fade incoming current weather layer
    if (currentTrackedWeather && currentTrackedWeather !== 'clear') {
      renderWeatherOverlay(ctx, currentTrackedWeather, dimensions, progress);
    }

    // 3. Render 'fade-to-fog' & 'darken-screen' transitional atmosphere overlay
    // Uses sine wave bell curve peaking at midpoint progress = 0.5
    const atmosphericPeak = Math.sin(progress * Math.PI);

    // Darkening Screen Overlay
    ctx.save();
    const darkenAlpha = atmosphericPeak * 0.32;
    ctx.fillStyle = `rgba(15, 23, 42, ${darkenAlpha.toFixed(3)})`;
    ctx.fillRect(0, 0, dimensions.width, dimensions.height);

    // Soft Rolling Fog Transition Veil
    const fogAlpha = atmosphericPeak * 0.26;
    const fogGrad = ctx.createLinearGradient(0, 0, 0, dimensions.height);
    fogGrad.addColorStop(0, `rgba(203, 213, 225, ${fogAlpha.toFixed(3)})`);
    fogGrad.addColorStop(0.5, `rgba(148, 163, 184, ${(fogAlpha * 1.2).toFixed(3)})`);
    fogGrad.addColorStop(1, `rgba(203, 213, 225, ${fogAlpha.toFixed(3)})`);
    ctx.fillStyle = fogGrad;
    ctx.fillRect(0, 0, dimensions.width, dimensions.height);
    ctx.restore();
  } else {
    // Render active weather overlay at full opacity
    renderWeatherOverlay(ctx, currentTrackedWeather || 'clear', dimensions, 1.0);
  }

  // --- Seasonal Ambient Visual Layers & Particles ---
  const isBloodMoonActive = gameState.bloodMoonTurnsLeft !== undefined && gameState.bloodMoonTurnsLeft > 0;
  if (isBloodMoonActive) {
    ctx.fillStyle = 'rgba(220, 38, 38, 0.06)';
    ctx.fillRect(0, 0, dimensions.width, dimensions.height);

    ctx.fillStyle = 'rgba(239, 68, 68, 0.40)';
    const now = Date.now() * 0.003;
    ctx.beginPath();
    for (let i = 0; i < 10; i++) {
      const rx = (i * 81 + Math.sin(now * 0.4 + i) * 20) % dimensions.width;
      const ry = (dimensions.height - (i * 91 + now * 1.5) % dimensions.height);
      const radius = Math.sin(now + i) > 0.4 ? 1.2 : 0.8;
      ctx.moveTo(rx + radius, ry);
      ctx.arc(rx, ry, radius, 0, Math.PI * 2);
    }
    ctx.fill();
  }

  const season = gameState.season || 'spring';
  const biome = gameState.biome || 'forest';
  const currentWeather = gameState.weather || 'clear';

  if (isDesertBiome(biome, currentWeather)) {
    // Enchanted Desert Biome visuals: radiant sun glow, godrays, heat shimmer, and glittering sand motes
    renderDesertAtmosphere(ctx, dimensions, gameState);
  } else {
    // Forest / Town / Swamp / Tundra ambient micro-particles
    renderBiomeMicroAtmosphere(ctx, dimensions, gameState);
    
    if (isForestBiome(biome) || biome === 'town') {
      if (season !== 'winter') {
        // Drifting leaves/petals during spring, summer, and autumn
        renderDriftingLeavesAndPetals(ctx, dimensions, season, biome);
      }
    }
  }


  // --- Render Active Lightning Strike Visual FX (Atmospheric Flash + Bolt + Impact) ---
  if (activeLightningStrike) {
    const elapsed = nowTime - activeLightningStrike.startTime;
    if (elapsed > activeLightningStrike.duration) {
      activeLightningStrike = null;
    } else {
      const progress = elapsed / activeLightningStrike.duration;
      let flashAlpha = 0;
      if (progress < 0.15) {
        flashAlpha = (progress / 0.15) * 0.85;
      } else if (progress < 0.30) {
        flashAlpha = 0.85 - ((progress - 0.15) / 0.15) * 0.45;
      } else if (progress < 0.45) {
        flashAlpha = 0.40 + ((progress - 0.30) / 0.15) * 0.50;
      } else {
        flashAlpha = 0.90 * Math.pow(1 - (progress - 0.45) / 0.55, 2);
      }

      // 1. Fullscreen Sky & Viewport Atmospheric Flash
      const flashGrad = ctx.createRadialGradient(
        activeLightningStrike.targetX,
        activeLightningStrike.targetY,
        10,
        activeLightningStrike.targetX,
        activeLightningStrike.targetY,
        Math.max(dimensions.width, dimensions.height) * 1.2
      );
      flashGrad.addColorStop(0, `rgba(255, 255, 255, ${Math.min(1.0, flashAlpha * 1.2)})`);
      flashGrad.addColorStop(0.3, `rgba(186, 230, 253, ${flashAlpha * 0.85})`);
      flashGrad.addColorStop(0.7, `rgba(168, 85, 247, ${flashAlpha * 0.45})`);
      flashGrad.addColorStop(1, `rgba(15, 23, 42, ${flashAlpha * 0.25})`);

      ctx.fillStyle = flashGrad;
      ctx.fillRect(0, 0, dimensions.width, dimensions.height);

      // 2. Render Main & Secondary Jagged Bolts with Electric Glow
      ctx.save();
      ctx.lineCap = 'round';
      ctx.lineJoin = 'miter';

      // Outer Cyan Glow
      ctx.shadowBlur = 18;
      ctx.shadowColor = '#06b6d4';
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 4.5;
      ctx.beginPath();
      for (const seg of activeLightningStrike.mainSegments) {
        ctx.moveTo(seg.x1, seg.y1);
        ctx.lineTo(seg.x2, seg.y2);
      }
      for (const seg of activeLightningStrike.branchSegments) {
        ctx.moveTo(seg.x1, seg.y1);
        ctx.lineTo(seg.x2, seg.y2);
      }
      ctx.stroke();

      // Inner White Core Line
      ctx.shadowBlur = 8;
      ctx.shadowColor = '#ffffff';
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2.0;
      ctx.beginPath();
      for (const seg of activeLightningStrike.mainSegments) {
        ctx.moveTo(seg.x1, seg.y1);
        ctx.lineTo(seg.x2, seg.y2);
      }
      ctx.stroke();

      // 3. Render Impact Glow Ring at Target Base
      ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
      ctx.beginPath();
      ctx.arc(activeLightningStrike.targetX, activeLightningStrike.targetY, 8 + (1 - progress) * 12, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();
    }
  }

  // Render Visual FX Particle System Overlay (Sparks, Embers, Spell Bursts)
  visualFxParticleSystem.updateAndRender(ctx, 16);
}

/**
  * Renders delicate drifting leaf and cherry blossom petal particles across forest biomes.
  */
export function renderDriftingLeavesAndPetals(
  ctx: CanvasRenderingContext2D,
  dimensions: { width: number; height: number },
  season: string = 'autumn',
  biome: string = 'forest'
) {
  if (!isForestBiome(biome) && biome !== 'town') return;
  if (season === 'winter') return; // Winter utilizes snowfall layers instead

  const now = Date.now() * 0.0008;
  const palette = getSeasonalLeafPalette(season);
  // Toned down leaf particle count to prevent visual clutter
  const count = season === 'autumn' ? 14 : season === 'spring' ? 12 : 10;

  for (let i = 0; i < count; i++) {
    // Gentle diagonal wind velocity
    const speedX = 14 + (i % 5) * 3;
    const speedY = 20 + (i % 6) * 3;

    const baseX = ((i * 79 + now * speedX * 800) % (dimensions.width + 120)) - 60;
    const baseY = ((i * 47 + now * speedY * 800) % (dimensions.height + 80)) - 40;

    // Realistic wind sway & rotational flutter
    const sway = Math.sin(now * 2.2 + i * 1.4) * 14;
    const rx = baseX + sway;
    const ry = baseY + Math.cos(now * 1.6 + i) * 4;

    const rotation = Math.sin(now * 2.0 + i) * 0.5 + (now * 0.5 + i) % (Math.PI * 2);
    const color = palette.colors[i % palette.colors.length];

    ctx.save();
    ctx.translate(rx, ry);
    ctx.rotate(rotation);
    ctx.fillStyle = color;

    if (palette.type === 'petal') {
      // Soft cherry blossom petal
      ctx.beginPath();
      ctx.ellipse(0, 0, 3.5, 2.0, 0, 0, Math.PI * 2);
      ctx.fill();
    } else {
      // Curved organic leaf
      ctx.beginPath();
      ctx.moveTo(0, -4.5);
      ctx.quadraticCurveTo(3.5, 0, 0, 4.5);
      ctx.quadraticCurveTo(-3.5, 0, 0, -4.5);
      ctx.fill();

      // Leaf midrib / vein line
      ctx.strokeStyle = 'rgba(0, 0, 0, 0.12)';
      ctx.lineWidth = 0.5;
      ctx.beginPath();
      ctx.moveTo(0, -3);
      ctx.lineTo(0, 3);
      ctx.stroke();
    }

    ctx.restore();
  }
}

/**
 * Renders radiant sunrays, warm golden daytime atmosphere, heat mirages, and drifting sand motes for desert biomes.
 */
export function renderDesertAtmosphere(
  ctx: CanvasRenderingContext2D,
  dimensions: { width: number; height: number },
  gameState: GameState
) {
  const biome = gameState.biome || 'forest';
  if (!isDesertBiome(biome, gameState.weather)) return;

  const now = Date.now() * 0.001;
  const rawMins = (gameState.gameTime || 720) % 1440;
  const isDaytime = rawMins >= 360 && rawMins <= 1140; // 6 AM to 7 PM

  // 1. Warm Golden Radiant Daylight Sunburst & Soft Godrays
  if (isDaytime) {
    const sunX = dimensions.width * 0.82;
    const sunY = -15;

    // Radiant Sun Halo
    const sunGrad = ctx.createRadialGradient(sunX, sunY, 20, sunX, sunY, dimensions.width * 0.72);
    sunGrad.addColorStop(0, 'rgba(251, 191, 36, 0.09)');
    sunGrad.addColorStop(0.35, 'rgba(245, 158, 11, 0.035)');
    sunGrad.addColorStop(1, 'rgba(217, 119, 6, 0)');
    ctx.fillStyle = sunGrad;
    ctx.fillRect(0, 0, dimensions.width, dimensions.height);

    // Soft Sweeping Desert Godrays
    ctx.save();
    for (let r = 0; r < 3; r++) {
      const rayOffset = (r * 0.22) + Math.sin(now * 0.15 + r) * 0.03;
      const rayWidth = 50 + r * 25;
      const bottomX = sunX - Math.tan(0.48 + rayOffset) * dimensions.height;
      ctx.fillStyle = 'rgba(254, 240, 138, 0.022)';
      ctx.beginPath();
      ctx.moveTo(sunX - 10, sunY);
      ctx.lineTo(bottomX - rayWidth, dimensions.height);
      ctx.lineTo(bottomX + rayWidth, dimensions.height);
      ctx.closePath();
      ctx.fill();
    }
    ctx.restore();

    // 2. Midday Desert Heat Shimmer / Mirage Ripple
    if (rawMins >= 540 && rawMins <= 1020) { // 9 AM to 5 PM
      ctx.save();
      const shimmerAlpha = 0.032 + Math.sin(now * 1.4) * 0.012;
      const shimmerGrad = ctx.createLinearGradient(0, dimensions.height * 0.45, 0, dimensions.height);
      shimmerGrad.addColorStop(0, 'rgba(251, 191, 36, 0)');
      shimmerGrad.addColorStop(0.5, `rgba(251, 191, 36, ${shimmerAlpha.toFixed(3)})`);
      shimmerGrad.addColorStop(1, 'rgba(245, 158, 11, 0)');
      ctx.fillStyle = shimmerGrad;
      ctx.fillRect(0, dimensions.height * 0.45, dimensions.width, dimensions.height * 0.55);
      ctx.restore();
    }
  }

  // 3. Sparkling Golden Sun-Dust & Sand Motes Drifting on the Breeze
  ctx.save();
  for (let i = 0; i < 22; i++) {
    const speed = 18 + (i % 6) * 6;
    const rx = ((i * 67 + now * speed) % (dimensions.width + 60)) - 30;
    const ry = ((i * 41 + Math.sin(now * 1.5 + i * 0.85) * 16) % (dimensions.height * 0.92)) + dimensions.height * 0.04;
    const size = (i % 4 === 0) ? 1.8 : 1.2;
    const alpha = 0.28 + Math.sin(now * 2.8 + i) * 0.16;
    ctx.fillStyle = `rgba(251, 191, 36, ${alpha.toFixed(2)})`;
    ctx.fillRect(rx, ry, size, size);
  }
  ctx.restore();

  // 4. Render Dust Devils & Tumbleweeds
  renderDustDevilsAndTumbleweeds(ctx, dimensions, gameState);
}

/**
 * Renders spinning translucent dust spirals (dust devils) and rolling tumbleweed gusts across desert biomes.
 */
export function renderDustDevilsAndTumbleweeds(
  ctx: CanvasRenderingContext2D,
  dimensions: { width: number; height: number },
  gameState: GameState
) {
  const biome = gameState.biome || 'forest';
  if (!isDesertBiome(biome, gameState.weather)) return;

  const now = Date.now() * 0.001;
  const tileSize = 32;
  const camX = (gameState as any).camera?.x ?? (gameState.playerX * tileSize - dimensions.width / 2);
  const camY = (gameState as any).camera?.y ?? (gameState.playerY * tileSize - dimensions.height / 2);

  // 1 subtle dust devil during clear/foggy weather, 2-3 during sandstorm
  const dustDevilCount = gameState.weather === 'sandstorm' ? 3 : 1;
  for (let i = 0; i < dustDevilCount; i++) {
    const speed = 18 + (i % 2) * 8;
    const baseX = ((i * 280 + now * speed) % (dimensions.width + 160)) - 80;
    const baseY = ((i * 180 + Math.sin(now * 0.3 + i) * 60) % (dimensions.height * 0.6)) + dimensions.height * 0.2;

    // Check obstacle collision at screen position
    const tileX = Math.floor((baseX + camX) / tileSize);
    const tileY = Math.floor((baseY + camY) / tileSize);
    const targetTile = gameState.map?.[tileY]?.[tileX];
    const isColliding = isObstacleTile(targetTile);

    const alphaMultiplier = isColliding ? 0.25 : 0.65;
    const rx = baseX;
    const ry = baseY;

    ctx.save();
    ctx.translate(rx, ry);

    // 4 translucent funnel rings
    const rings = 4;
    for (let r = 0; r < rings; r++) {
      const ringRadiusX = (r + 1) * 2.8;
      const ringRadiusY = (r + 1) * 1.3;
      const offsetY = -r * 4.2;
      const ringRotation = now * (3 + r * 0.8) * (i % 2 === 0 ? 1 : -1);

      ctx.save();
      ctx.translate(0, offsetY);
      ctx.rotate(ringRotation);

      const alpha = (0.10 + (r / rings) * 0.12) * alphaMultiplier;
      ctx.strokeStyle = `rgba(245, 158, 11, ${alpha.toFixed(2)})`;
      ctx.lineWidth = 1.2;

      ctx.beginPath();
      ctx.ellipse(0, 0, ringRadiusX, ringRadiusY, 0, 0, Math.PI * 2);
      ctx.stroke();

      ctx.restore();
    }

    // Swirling micro sand particles around vortex base
    for (let p = 0; p < 3; p++) {
      const pAngle = now * 4.5 + p * (Math.PI * 2 / 3);
      const pDist = 4.5 + p * 2.0;
      const px = Math.cos(pAngle) * pDist;
      const py = Math.sin(pAngle) * (pDist * 0.45) - p * 3.5;
      ctx.fillStyle = `rgba(251, 191, 36, ${(0.45 * alphaMultiplier).toFixed(2)})`;
      ctx.fillRect(px, py, 1.2, 1.2);
    }

    ctx.restore();
  }

  // Rolling tumbleweeds: 1 during clear, 2 during sandstorm
  const tumbleweedCount = gameState.weather === 'sandstorm' ? 2 : 1;
  for (let i = 0; i < tumbleweedCount; i++) {
    const speed = 28 + (i % 2) * 10;
    const baseX = ((i * 320 + now * speed) % (dimensions.width + 120)) - 60;
    const bounce = Math.abs(Math.sin(now * 2.5 + i * 1.5)) * 8;
    const baseY = ((i * 180 + i * 60) % (dimensions.height * 0.6)) + dimensions.height * 0.2 - bounce;

    const tileX = Math.floor((baseX + camX) / tileSize);
    const tileY = Math.floor((baseY + camY) / tileSize);
    const targetTile = gameState.map?.[tileY]?.[tileX];
    const isColliding = isObstacleTile(targetTile);

    const opacity = isColliding ? 0.22 : 0.5;
    const rotation = now * 3.5 + i * 2;

    ctx.save();
    ctx.translate(baseX, baseY);
    ctx.rotate(rotation);

    // Render rolling twig ball with natural circular shape
    ctx.strokeStyle = `rgba(180, 130, 70, ${opacity})`;
    ctx.lineWidth = 1.1;
    const size = 5.5;

    ctx.beginPath();
    ctx.arc(0, 0, size * 0.7, 0, Math.PI * 2);
    ctx.moveTo(-size, 0); ctx.lineTo(size, 0);
    ctx.moveTo(0, -size); ctx.lineTo(0, size);
    ctx.moveTo(-size * 0.6, -size * 0.6); ctx.lineTo(size * 0.6, size * 0.6);
    ctx.stroke();

    ctx.restore();
  }
}


