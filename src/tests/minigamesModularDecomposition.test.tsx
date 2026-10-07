/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

if (typeof (globalThis as any).window === 'undefined') {
  (globalThis as any).window = globalThis;
  (globalThis as any).window.addEventListener = () => {};
  (globalThis as any).window.removeEventListener = () => {};
  (globalThis as any).window.dispatchEvent = () => true;
  (globalThis as any).CustomEvent = class CustomEvent { constructor() {} };
}

import { describe, it, expect, vi } from 'vitest';
import { renderToString } from 'react-dom/server';
import { ScriptoriumMiniGame } from '../components/ScriptoriumMiniGame';
import LockpickingMiniGame from '../components/LockpickingMiniGame';
import { ScriptoriumScoreCard } from '../components/minigames/scriptorium/ScriptoriumScoreCard';
import { TumblerCanvasRenderer } from '../components/minigames/lockpicking/TumblerCanvasRenderer';

describe('Mini-Game Modular Decomposition & Logic Architecture', () => {
  describe('Scriptorium Mini-Game Sub-Engine', () => {
    it('renders ScriptoriumMiniGame without crashing', () => {
      const html = renderToString(
        <ScriptoriumMiniGame
          onClose={vi.fn()}
          onSuccess={vi.fn()}
          onFail={vi.fn()}
        />
      );
      expect(html).toContain('Target Sequence');
      expect(html).toContain('Arcane Instability');
      expect(html).toContain('Difficulty');
    });

    it('renders ScriptoriumScoreCard for masterwork completion', () => {
      const mockResult = {
        glyphId: 'glyph_flame_1',
        glyphName: 'Ignis Rune',
        element: 'Fire' as any,
        accuracyScore: 98,
        instabilityReached: 20,
        timeTakenMs: 3200,
        outcome: 'flawless' as any,
        isMasterwork: true,
        bonusPowerPct: 30,
        manaDiscountPct: 100,
        harmonicChainsAchieved: 4,
        surgesSurmounted: 1,
      };

      const html = renderToString(
        <ScriptoriumScoreCard
          isCompleted={true}
          isFailed={false}
          scribingResult={mockResult}
          harmonicChains={4}
          mistakeCount={0}
          onSuccess={vi.fn()}
          onFail={vi.fn()}
          onClose={vi.fn()}
          resetTracingState={vi.fn()}
        />
      );

      expect(html).toContain('Flawless Masterwork Inscription');
      expect(html).toContain('0 MP (Free)');
      expect(html).toMatch(/Claim &amp; Inscribe Scroll|Claim & Inscribe Scroll/);
    });

    it('renders ScriptoriumScoreCard for mishap failure', () => {
      const mockResult = {
        glyphId: 'glyph_flame_1',
        glyphName: 'Ignis Rune',
        element: 'Fire' as any,
        accuracyScore: 40,
        instabilityReached: 100,
        timeTakenMs: 1200,
        outcome: 'mishap' as any,
        isMasterwork: false,
        bonusPowerPct: 0,
        manaDiscountPct: 0,
        harmonicChainsAchieved: 0,
        surgesSurmounted: 0,
      };

      const html = renderToString(
        <ScriptoriumScoreCard
          isCompleted={false}
          isFailed={true}
          scribingResult={mockResult}
          harmonicChains={0}
          mistakeCount={3}
          onSuccess={vi.fn()}
          onFail={vi.fn()}
          onClose={vi.fn()}
          resetTracingState={vi.fn()}
        />
      );

      expect(html).toContain('Arcane Backlash');
      expect(html).toContain('Retry Inscription');
    });
  });

  describe('Lockpicking Mini-Game Sub-Engine', () => {
    it('renders LockpickingMiniGame without crashing', () => {
      const html = renderToString(
        <LockpickingMiniGame
          onClose={vi.fn()}
          onSuccess={vi.fn()}
          lockpickCount={3}
          onConsumeLockpick={vi.fn()}
          chestName="Ancient Vault Chest"
        />
      );

      expect(html).toContain('Ancient Vault Chest');
      expect(html).toContain('REMAINING PICKS');
      expect(html).toMatch(/x<!-- -->3|x3/);
      expect(html).toContain('APPLY TENSION');
    });

    it('renders TumblerCanvasRenderer components with dial, wrench, and pick', () => {
      const mockRef = { current: null };
      const html = renderToString(
        <TumblerCanvasRenderer
          dialRef={mockRef}
          cylinderRef={mockRef}
          wrenchRef={mockRef}
          pickRef={mockRef}
          durabilityBarRef={mockRef}
          durabilityTextRef={mockRef}
          angleTextRef={mockRef}
          sliderRef={mockRef}
          status="READY"
          activePicks={5}
          handleDialStart={vi.fn()}
          handleSliderChange={vi.fn()}
        />
      );

      expect(html).toContain('MOVE LOCKPICK ANGLE');
      expect(html).toContain('PICK DURABILITY');
      expect(html).toMatch(/x<!-- -->5|x5/);
    });
  });
});
