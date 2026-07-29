import { GameState, getMoonPhase } from '../types';

export interface RenderWeatherAndLightingParams {
  ctx: CanvasRenderingContext2D;
  gameState: GameState;
  dimensions: { width: number; height: number };
}

export function renderWeatherAndLighting({
  ctx,
  gameState,
  dimensions,
}: RenderWeatherAndLightingParams) {
  // Day-Night Lighting Ambient Shader and Weather Elements (Only on Overworld chunks)
  if (!gameState.isOverworld) return;

  const rawMins = gameState.gameTime % 1440;
  let lightCoeff = 1.0; 
  
  if (rawMins < 360) {
    // Night (12 AM to 6 AM): very dark
    lightCoeff = 0.3 + (rawMins / 360) * 0.4;
  } else if (rawMins >= 360 && rawMins < 480) {
    // Dawn (6 AM to 8 AM): transitioning up
    lightCoeff = 0.7 + ((rawMins - 360) / 120) * 0.3;
  } else if (rawMins >= 480 && rawMins < 1080) {
    // Midday (8 AM to 6 PM): crystal clear
    lightCoeff = 1.0;
  } else if (rawMins >= 1080 && rawMins < 1200) {
    // Dusk (6 PM to 8 PM): transitioning down
    lightCoeff = 1.0 - ((rawMins - 1080) / 120) * 0.4;
  } else {
    // Evening / Twilight (8 PM to 12 AM)
    lightCoeff = 0.6 - ((rawMins - 1200) / 240) * 0.3;
  }

  if (lightCoeff < 0.95) {
    // Determine moon phase for gorgeous custom ambient colors during night hours!
    const currentPhase = getMoonPhase(gameState.playerStats?.turnsPlayed || 0);
    let tintColor = `rgba(15, 23, 42, ${0.48 * (1.0 - lightCoeff)})`; // Default slate dark
    
    if (rawMins >= 1200 || rawMins < 360) { // strictly at night hours
      if (currentPhase.id === 'new_moon') {
        // Deep shadow veil violet
        tintColor = `rgba(8, 2, 16, ${0.65 * (1.0 - lightCoeff)})`;
      } else if (currentPhase.id === 'full_moon') {
        // Soft ethereal silver glow
        tintColor = `rgba(224, 231, 255, ${0.28 * (1.0 - lightCoeff)})`;
      } else if (currentPhase.id === 'waxing_crescent') {
        // Soft amber twilight stardust
        tintColor = `rgba(251, 191, 36, ${0.20 * (1.0 - lightCoeff)})`;
      } else if (currentPhase.id === 'first_quarter') {
        // High contrast deep cosmic indigo
        tintColor = `rgba(30, 27, 75, ${0.45 * (1.0 - lightCoeff)})`;
      } else if (currentPhase.id === 'waning_gibbous') {
        // Cool oceanic aquamarine
        tintColor = `rgba(13, 148, 136, ${0.25 * (1.0 - lightCoeff)})`;
      }
    }
    
    ctx.fillStyle = tintColor; 
    ctx.fillRect(0, 0, dimensions.width, dimensions.height);
  }

  // Render Weather Elements (Rain, Snow, Fog, Sandstorm, Blizzard)
  const weather = gameState.weather || 'clear';
  if (weather === 'rainy') {
    ctx.strokeStyle = 'rgba(56, 189, 248, 0.4)';
    ctx.lineWidth = 1;
    const now = Date.now() * 0.04;
    for (let i = 0; i < 28; i++) {
      const rx = (i * 47 + now * 2.2) % dimensions.width;
      const ry = (i * 83 + now * 5.4) % dimensions.height;
      ctx.beginPath();
      ctx.moveTo(rx, ry);
      ctx.lineTo(rx - 2, ry + 12);
      ctx.stroke();
    }
  } else if (weather === 'snowy') {
    ctx.fillStyle = 'rgba(255, 255, 255, 0.75)';
    const now = Date.now() * 0.012;
    for (let i = 0; i < 30; i++) {
      const rx = (i * 39 + Math.sin(now + i) * 15) % dimensions.width;
      const ry = (i * 73 + now * 0.9) % dimensions.height;
      ctx.beginPath();
      ctx.arc(rx, ry, Math.abs(i % 3) + 1.2, 0, Math.PI * 2);
      ctx.fill();
    }
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
    for (let i = 0; i < 40; i++) {
      const rx = (i * 59 + now * 8.5) % dimensions.width;
      const ry = (i * 37 + Math.sin(now + i) * 8) % dimensions.height;
      ctx.beginPath();
      ctx.moveTo(rx, ry);
      ctx.lineTo(rx + 20, ry + 2);
      ctx.stroke();
    }
    ctx.fillStyle = 'rgba(120, 53, 4, 0.08)';
    ctx.fillRect(0, 0, dimensions.width, dimensions.height);
  } else if (weather === 'blizzard') {
    ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
    ctx.strokeStyle = 'rgba(186, 230, 253, 0.35)';
    ctx.lineWidth = 1;
    const now = Date.now() * 0.05;
    for (let i = 0; i < 50; i++) {
      const rx = (i * 41 + now * 12.0) % dimensions.width;
      const ry = (i * 61 + now * 5.0) % dimensions.height;
      ctx.beginPath();
      ctx.arc(rx, ry, Math.abs(i % 2) + 1.2, 0, Math.PI * 2);
      ctx.fill();
      
      if (i % 5 === 0) {
        ctx.beginPath();
        ctx.moveTo(rx, ry);
        ctx.lineTo(rx - 15, ry + 3);
        ctx.stroke();
      }
    }
    ctx.fillStyle = 'rgba(224, 242, 254, 0.12)';
    ctx.fillRect(0, 0, dimensions.width, dimensions.height);
  }

  // --- Seasonal Ambient Visual Layers & Particles ---
  const isBloodMoonActive = gameState.bloodMoonTurnsLeft !== undefined && gameState.bloodMoonTurnsLeft > 0;
  if (isBloodMoonActive) {
    ctx.fillStyle = 'rgba(220, 38, 38, 0.14)';
    ctx.fillRect(0, 0, dimensions.width, dimensions.height);

    ctx.fillStyle = 'rgba(239, 68, 68, 0.72)';
    const now = Date.now() * 0.005;
    for (let i = 0; i < 25; i++) {
      const rx = (i * 61 + Math.sin(now * 0.4 + i) * 30) % dimensions.width;
      const ry = (dimensions.height - (i * 71 + now * 2.0) % dimensions.height);
      ctx.beginPath();
      ctx.arc(rx, ry, Math.sin(now + i) > 0.3 ? 2.0 : 1.1, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  const season = gameState.season || 'spring';
  if (season === 'spring') {
    ctx.fillStyle = 'rgba(244, 63, 94, 0.48)';
    const now = Date.now() * 0.005;
    for (let i = 0; i < 20; i++) {
      const rx = (i * 53 + Math.sin(now + i) * 35) % dimensions.width;
      const ry = (i * 89 + now * 1.6) % dimensions.height;
      ctx.beginPath();
      ctx.ellipse(rx, ry, 3.8, 2.2, Math.PI / 4 + Math.sin(now + i) * 0.35, 0, Math.PI * 2);
      ctx.fill();
    }
  } else if (season === 'summer') {
    ctx.fillStyle = 'rgba(251, 191, 36, 0.035)';
    ctx.fillRect(0, 0, dimensions.width, dimensions.height);

    ctx.fillStyle = 'rgba(253, 224, 71, 0.48)';
    const now = Date.now() * 0.004;
    for (let i = 0; i < 16; i++) {
      const rx = (i * 61 + Math.sin(now * 0.5 + i) * 22) % dimensions.width;
      const ry = (dimensions.height - (i * 97 + now * 1.2) % dimensions.height);
      ctx.beginPath();
      ctx.arc(rx, ry, 1.4, 0, Math.PI * 2);
      ctx.fill();
    }
  } else if (season === 'autumn') {
    const leafColors = ['rgba(217, 119, 6, 0.55)', 'rgba(239, 68, 68, 0.48)', 'rgba(245, 158, 11, 0.55)'];
    const now = Date.now() * 0.006;
    for (let i = 0; i < 24; i++) {
      ctx.fillStyle = leafColors[i % 3];
      const rx = (i * 41 + Math.sin(now + i) * 48) % dimensions.width;
      const ry = (i * 79 + now * 2.4) % dimensions.height;
      ctx.beginPath();
      ctx.moveTo(rx, ry - 3.5);
      ctx.lineTo(rx + 4.5, ry);
      ctx.lineTo(rx, ry + 3.5);
      ctx.lineTo(rx - 4.5, ry);
      ctx.closePath();
      ctx.fill();
    }
  } else if (season === 'winter') {
    ctx.fillStyle = 'rgba(186, 230, 253, 0.05)';
    ctx.fillRect(0, 0, dimensions.width, dimensions.height);

    ctx.fillStyle = 'rgba(255, 255, 255, 0.55)';
    const now = Date.now() * 0.008;
    for (let i = 0; i < 20; i++) {
      const rx = (i * 59 + Math.cos(now + i) * 18) % dimensions.width;
      const ry = (i * 67 + now * 3.0) % dimensions.height;
      ctx.beginPath();
      ctx.arc(rx, ry, 0.9, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}
