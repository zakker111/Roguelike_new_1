/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, it, expect, vi } from 'vitest';
import { renderToString } from 'react-dom/server';
import {
  resolvePipCategory,
  LogPipIndicator,
  LogMessageItem,
  LogFilterControls,
  LogHeaderBar,
  computeEncounterTally,
  LogEncounterRecapBar,
} from '../components/log';
import { GameLog } from '../components/GameLog';
import { GameLogMessage } from '../types';

describe('13.1 Modular Log Sub-Engine & Tactical Feed Suite', () => {
  describe('resolvePipCategory & LogPipIndicator', () => {
    it('correctly maps message types and keywords to unboxed pip categories', () => {
      expect(resolvePipCategory('danger', 'You took 15 damage from Lava!')).toBe('danger');
      expect(resolvePipCategory('combat', 'You struck the Forest Spider for [14 DMG].')).toBe('combat');
      expect(resolvePipCategory('combat', 'Critical Hit! You cleaved the Goblin Raider.')).toBe('combat');
      expect(resolvePipCategory('info', 'Drank Elixir of Youth. Restored [25 HP].')).toBe('heal');
      expect(resolvePipCategory('loot', 'Acquired [45 Gold] from Chest.')).toBe('loot');
      expect(resolvePipCategory('craft', 'Successfully forged [Iron Broadsword].')).toBe('craft');
      expect(resolvePipCategory('system', 'Storyteller whispers from the deep dark.')).toBe('story');
      expect(resolvePipCategory('system', 'Weather changed to Heavy Rain. Braced against the storm.')).toBe('system');
      expect(resolvePipCategory('custom', 'You gaze into the distance.')).toBe('neutral');
    });

    it('renders glowing pip indicator with appropriate category title', () => {
      const htmlDanger = renderToString(<LogPipIndicator category="danger" />);
      expect(htmlDanger).toContain('title="Danger / Damage Received"');

      const htmlCombat = renderToString(<LogPipIndicator category="combat" />);
      expect(htmlCombat).toContain('title="Combat Attack / Damage Dealt"');

      const htmlHeal = renderToString(<LogPipIndicator category="heal" />);
      expect(htmlHeal).toContain('title="Healing / Recovery"');

      const htmlStory = renderToString(<LogPipIndicator category="story" />);
      expect(htmlStory).toContain('title="Storyteller Lore / Relic"');

      const htmlLoot = renderToString(<LogPipIndicator category="loot" />);
      expect(htmlLoot).toContain('title="Spoils &amp; Loot"');

      const htmlCraft = renderToString(<LogPipIndicator category="craft" />);
      expect(htmlCraft).toContain('title="Crafting &amp; Alchemy"');
    });
  });

  describe('LogMessageItem Component', () => {
    it('renders text, unboxed monospace timestamp and turn counter', () => {
      const log: GameLogMessage = {
        id: 'log-1',
        text: 'You struck Shadow Wolf for [18 DMG · Steel Dagger]',
        type: 'combat',
        timestamp: '14:22:05',
        turn: 42,
      };

      const html = renderToString(<LogMessageItem log={log} count={1} isCompact={true} />);

      // Monospace timestamp and turn
      expect(html).toContain('T:42 · 14:22:05');
      // Highlighted bracket badge
      expect(html).toContain('18 DMG · Steel Dagger');
    });

    it('renders duplicate count badge when count > 1', () => {
      const log: GameLogMessage = {
        id: 'log-2',
        text: 'The arrows whiz past your ear!',
        type: 'combat',
        timestamp: '14:25:00',
      };

      const html = renderToString(<LogMessageItem log={log} count={4} isCompact={true} />);
      expect(html).toContain('×4');
    });
  });

  describe('LogFilterControls & LogHeaderBar', () => {
    it('renders category filter buttons and category counts', () => {
      const html = renderToString(
        <LogFilterControls
          activeFilter="all"
          onSelectFilter={vi.fn()}
          categoryCounts={{ all: 10, combat: 5, story: 2, loot: 2, craft: 1 }}
          searchQuery=""
          onSearchChange={vi.fn()}
        />
      );

      expect(html).toContain('All');
      expect(html).toContain('(10)');
      expect(html).toContain('Combat');
      expect(html).toContain('(5)');
      expect(html).toContain('Story');
      expect(html).toContain('(2)');
      expect(html).toContain('Loot');
      expect(html).toContain('Craft');
      expect(html).toContain('Filter logs...');
    });

    it('LogHeaderBar renders action toggles for density, sort order and clear', () => {
      const html = renderToString(
        <LogHeaderBar
          activeFilter="all"
          onSelectFilter={vi.fn()}
          categoryCounts={{ all: 5, combat: 2, story: 1, loot: 1, craft: 1 }}
          searchQuery=""
          onSearchChange={vi.fn()}
          isCompact={true}
          onToggleCompact={vi.fn()}
          sortOrder="newest-first"
          onToggleSortOrder={vi.fn()}
          onClearLogs={vi.fn()}
          onDownloadLogs={vi.fn()}
        />
      );

      expect(html).toContain('Chronologue');
      expect(html).toContain('Compact');
      expect(html).toContain('↓ Newest');
      expect(html).toContain('EXPORT');
      expect(html).toContain('Clear Chronologue');
    });
  });

  describe('computeEncounterTally & LogEncounterRecapBar', () => {
    it('accurately parses recent combat and loot statistics from log stream', () => {
      const sampleLogs: GameLogMessage[] = [
        { id: '1', text: 'You struck Blood Orc for [24 DMG]', type: 'combat', timestamp: '12:00:01' },
        { id: '2', text: 'Blood Orc struck you for [10 DMG]', type: 'combat', timestamp: '12:00:02' },
        { id: '3', text: 'Braced! Blocked [6 DMG]', type: 'combat', timestamp: '12:00:03' },
        { id: '4', text: 'You defeated Blood Orc', type: 'combat', timestamp: '12:00:04' },
        { id: '5', text: 'Acquired [35 Gold]', type: 'loot', timestamp: '12:00:05' },
        { id: '6', text: 'Picked up Iron Ingot', type: 'loot', timestamp: '12:00:06' },
      ];

      const tally = computeEncounterTally(sampleLogs);
      expect(tally.damageDealt).toBe(24);
      expect(tally.damageTaken).toBe(10);
      expect(tally.damageBlocked).toBe(6);
      expect(tally.enemiesDefeated).toBe(1);
      expect(tally.goldLooted).toBe(35);
      expect(tally.itemsLooted).toBe(1);
    });

    it('renders expandable encounter recap banner when combat occurred', () => {
      const sampleLogs: GameLogMessage[] = [
        { id: '1', text: 'You struck Dark Cultist for [30 DMG]', type: 'combat', timestamp: '12:10:00' },
        { id: '2', text: 'You defeated Dark Cultist', type: 'combat', timestamp: '12:10:02' },
      ];

      const html = renderToString(<LogEncounterRecapBar logs={sampleLogs} />);
      expect(html).toContain('Encounter Recap');
      expect(html).toContain('30');
      expect(html).toContain('dealt');
      expect(html).toContain('1');
      expect(html).toContain('slain');
    });
  });

  describe('GameLog Full Coordinator Integration', () => {
    it('collapses consecutive duplicate logs into single item with count badge', () => {
      const logs: GameLogMessage[] = [
        { id: '1', text: 'Fireball ignites the dry grass.', type: 'combat', timestamp: '10:00:00' },
        { id: '2', text: 'Fireball ignites the dry grass.', type: 'combat', timestamp: '10:00:01' },
        { id: '3', text: 'Fireball ignites the dry grass.', type: 'combat', timestamp: '10:00:02' },
        { id: '4', text: 'The flames spread.', type: 'system', timestamp: '10:00:03' },
      ];

      const html = renderToString(
        <GameLog logs={logs} onClearLogs={vi.fn()} onDownloadLogs={vi.fn()} />
      );

      // Duplicate count badge
      expect(html).toContain('×3');
      expect(html).toContain('Fireball ignites the dry grass.');
      expect(html).toContain('The flames spread.');
    });

    it('displays empty state message when no logs match', () => {
      const html = renderToString(<GameLog logs={[]} onClearLogs={vi.fn()} />);
      expect(html).toContain('The halls are silent');
    });
  });
});
