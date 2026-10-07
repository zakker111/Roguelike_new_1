/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderToString } from 'react-dom/server';
import { GodVisualsStudioTab } from '../components/god/GodVisualsStudioTab';
import { visualsConfig } from '../canvas/visualsConfig';
import { createNewGameRun } from '../utils/gameStateFactory';
import { GameState } from '../types';

describe('GodVisualsStudioTab Component & Visual Engine Sandbox', () => {
  let mockGameState: GameState;
  let successLogs: string[] = [];
  let logMessages: { text: string; type?: string }[] = [];

  const triggerSuccessLog = (msg: string) => {
    successLogs.push(msg);
  };

  const addLogMessage = (msg: string, type?: string) => {
    logMessages.push({ text: msg, type });
  };

  beforeEach(() => {
    mockGameState = createNewGameRun(12345);
    successLogs = [];
    logMessages = [];
    visualsConfig.resetAll();
  });

  it('renders GodVisualsStudioTab without crashing', () => {
    const html = renderToString(
      <GodVisualsStudioTab
        gameState={mockGameState}
        setGameState={vi.fn()}
        triggerSuccessLog={triggerSuccessLog}
        addLogMessage={addLogMessage}
      />
    );

    expect(html).toContain('VISUALS &amp; SHADERS STUDIO');
    expect(html).toContain('Instant Visual Presets');
    expect(html).toContain('Vivid');
    expect(html).toContain('Cinematic');
    expect(html).toContain('Retro Clean');
    expect(html).toContain('Performance');
  });

  it('renders Astronomical 24h Time-of-Day Quick Warper buttons', () => {
    const html = renderToString(
      <GodVisualsStudioTab
        gameState={mockGameState}
        setGameState={vi.fn()}
        triggerSuccessLog={triggerSuccessLog}
        addLogMessage={addLogMessage}
      />
    );

    expect(html).toContain('Astronomical 24h Time-of-Day Quick Warper');
    expect(html).toContain('Dawn');
    expect(html).toContain('Morning');
    expect(html).toContain('Midday');
    expect(html).toContain('Golden');
    expect(html).toContain('Twilight');
    expect(html).toContain('Night');
  });

  it('renders all live shader pass controls and multipliers', () => {
    const html = renderToString(
      <GodVisualsStudioTab
        gameState={mockGameState}
        setGameState={vi.fn()}
        triggerSuccessLog={triggerSuccessLog}
        addLogMessage={addLogMessage}
      />
    );

    expect(html).toContain('Volumetric Sunbeams &amp; Dust');
    expect(html).toContain('Luminous HDR Bloom Glow');
    expect(html).toContain('Perimeter Vignette Darkness');
    expect(html).toContain('24h Sun / Moon Drop Shadows');
    expect(html).toContain('Underwater Caustic Webs');
    expect(html).toContain('Biome Micro-Atmosphere Motes');
  });

  it('renders active biome lighting and shader profile inspector', () => {
    mockGameState.biome = 'desert';
    const html = renderToString(
      <GodVisualsStudioTab
        gameState={mockGameState}
        setGameState={vi.fn()}
        triggerSuccessLog={triggerSuccessLog}
        addLogMessage={addLogMessage}
      />
    );

    expect(html).toContain('Active Biome Lighting &amp; Shader Profile');
    expect(html).toContain('desert');
    expect(html).toContain('Primary Tone Tint:');
    expect(html).toContain('Accent Edge Tint:');
    expect(html).toContain('God Ray Beam Color:');
    expect(html).toContain('Dust Mote Color:');
  });

  it('allows applying visual presets and resetting defaults', () => {
    visualsConfig.applyPreset('cinematic');
    expect(visualsConfig.colorGrading.getVibrancyMode()).toBe('cinematic');
    expect(visualsConfig.vignette.getDarknessMultiplier()).toBe(1.15);

    visualsConfig.applyPreset('retro_clean');
    expect(visualsConfig.bloom.getIsEnabled()).toBe(false);
    expect(visualsConfig.colorGrading.getIsEnabled()).toBe(false);

    visualsConfig.resetAll();
    expect(visualsConfig.bloom.getIsEnabled()).toBe(true);
    expect(visualsConfig.colorGrading.getIsEnabled()).toBe(true);
    expect(visualsConfig.vignette.getDarknessMultiplier()).toBe(1.0);
  });
});
