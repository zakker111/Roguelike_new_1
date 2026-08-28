import { GameState } from '../types';

/**
 * Ambient environmental particle & biome micro-atmosphere renderer:
 * 1. Tundra / Winter: Gentle swirling snowflakes and ice crystal glints
 * 2. Swamp: Glowing bioluminescent fireflies and drifting spores
 * 3. Forest / Autumn / Spring: Drifting golden leaves and cherry blossom petals
 */

export function renderBiomeMicroAtmosphere(
  ctx: CanvasRenderingContext2D,
  dimensions: { width: number; height: number },
  gameState: GameState
) {
  const biome = gameState.biome || 'forest';
  const season = gameState.season || 'spring';
  const isOverworld = gameState.isOverworld;
  const depth = (gameState as any).depth ?? (gameState.playerStats?.level ?? 1);
  const now = Date.now() * 0.001;

  ctx.save();

  if (isOverworld && (biome === 'tundra' || biome === 'glacial' || season === 'winter' || gameState.weather === 'snowy' || gameState.weather === 'blizzard')) {
    // Winter, Tundra & Glacial Snow Flurries and Ice Crystals
    const isGlacial = biome === 'glacial';
    const flakeCount = (gameState.weather === 'blizzard' || isGlacial) ? 38 : 18;
    ctx.fillStyle = isGlacial ? 'rgba(186, 230, 253, 0.75)' : 'rgba(241, 245, 249, 0.65)';
    ctx.beginPath();
    for (let i = 0; i < flakeCount; i++) {
      const speedX = 15 + (i % 5) * 6;
      const speedY = 22 + (i % 6) * 7;
      const rx = ((i * 43 + now * speedX) % (dimensions.width + 40)) - 20;
      const ry = ((i * 67 + now * speedY + Math.sin(now * 1.8 + i) * 12) % (dimensions.height + 40)) - 20;
      const radius = (i % 3 === 0) ? (isGlacial ? 2.0 : 1.6) : 1.1;

      ctx.moveTo(rx + radius, ry);
      ctx.arc(rx, ry, radius, 0, Math.PI * 2);
    }
    ctx.fill();
  } else if (isOverworld && biome === 'coral_reef') {
    // Coral Reef: Drifting aquatic bubbles and luminescent pink/cyan coral spores
    for (let i = 0; i < 18; i++) {
      const speedY = 12 + (i % 4) * 4;
      const rx = ((i * 61 + Math.sin(now * 1.5 + i) * 16) % (dimensions.width - 20)) + 10;
      const ry = dimensions.height - ((i * 53 + now * speedY) % (dimensions.height + 20));
      const alpha = 0.35 + Math.sin(now * 2.0 + i) * 0.25;

      const isBubble = i % 2 === 0;
      ctx.fillStyle = isBubble ? `rgba(56, 189, 248, ${alpha.toFixed(2)})` : `rgba(244, 114, 182, ${alpha.toFixed(2)})`;
      ctx.beginPath();
      ctx.arc(rx, ry, isBubble ? 1.8 : 1.2, 0, Math.PI * 2);
      ctx.fill();
    }
  } else if (isOverworld && (biome === 'volcanic' || gameState.weather === 'ashfall')) {
    // Volcanic Caldera: Rising molten ash motes and ember sparks
    for (let i = 0; i < 22; i++) {
      const speedY = 16 + (i % 5) * 5;
      const rx = ((i * 47 + Math.sin(now * 2.2 + i) * 18) % (dimensions.width - 20)) + 10;
      const ry = dimensions.height - ((i * 41 + now * speedY) % (dimensions.height + 30));
      const alpha = 0.40 + Math.sin(now * 3.0 + i) * 0.30;

      ctx.fillStyle = (i % 3 === 0) ? `rgba(234, 88, 12, ${alpha.toFixed(2)})` : (i % 3 === 1 ? `rgba(220, 38, 38, ${alpha.toFixed(2)})` : `rgba(251, 146, 60, ${alpha.toFixed(2)})`);
      ctx.fillRect(rx, ry, (i % 2 === 0) ? 2 : 1.5, (i % 2 === 0) ? 2 : 1.5);
    }
  } else if (isOverworld && biome === 'swamp') {
    // Swamp: Ambient Bioluminescent Fireflies & Green Will-o'-Wisps
    for (let i = 0; i < 14; i++) {
      const pulse = Math.sin(now * 2.5 + i * 1.7);
      if (pulse > -0.2) {
        const alpha = Math.max(0, (pulse + 0.2) * 0.45);
        const rx = ((i * 73 + Math.sin(now * 0.6 + i) * 35) % (dimensions.width - 40)) + 20;
        const ry = ((i * 59 + Math.cos(now * 0.8 + i) * 25) % (dimensions.height - 40)) + 20;

        const isWisp = i % 4 === 0;
        const color = isWisp ? `168, 85, 247` : `74, 222, 128`; // Purple Wisp or Emerald Firefly
        
        ctx.fillStyle = `rgba(${color}, ${alpha.toFixed(3)})`;
        ctx.beginPath();
        ctx.arc(rx, ry, isWisp ? 2.2 : 1.4, 0, Math.PI * 2);
        ctx.fill();

        // Soft radial glow aura
        ctx.fillStyle = `rgba(${color}, ${(alpha * 0.25).toFixed(3)})`;
        ctx.beginPath();
        ctx.arc(rx, ry, isWisp ? 5.5 : 3.5, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  } else if (!isOverworld && depth >= 6) {
    // Deep Underworld: Floating volcanic cinder sparks & embers
    for (let i = 0; i < 16; i++) {
      const speedY = 18 + (i % 4) * 6;
      const rx = ((i * 57 + Math.sin(now * 2.0 + i) * 15) % (dimensions.width - 20)) + 10;
      const ry = dimensions.height - ((i * 49 + now * speedY) % (dimensions.height + 30));
      const alpha = 0.35 + Math.sin(now * 3.5 + i) * 0.25;

      ctx.fillStyle = (i % 2 === 0) ? `rgba(249, 115, 22, ${alpha.toFixed(2)})` : `rgba(239, 68, 68, ${alpha.toFixed(2)})`;
      ctx.fillRect(rx, ry, 1.5, 1.5);
    }
  }

  ctx.restore();
}
