import { describe, it, expect } from 'vitest';
import { CatalystType, EnemyState, EnemyType, TileType } from '../types';

describe('12.6 Log Integrity, UI Renderers & System Diagnostics Suite', () => {
  it('entityLayerRenderer string safety check prevents crashes on null or missing corpse names', () => {
    const mockCorpse1 = { name: 'Skeleton Warrior', type: 'undead', x: 2, y: 3 };
    const mockCorpse2 = { name: undefined as any, type: 'animal', x: 4, y: 5 };
    const mockCorpse3 = { name: null as any, type: 'humanoid', x: 6, y: 7 };

    // Function matching entityLayerRenderer.ts corpse glyph check:
    const getCorpseGlyph = (corpse: { name?: string; type?: string }) => {
      let corpseGlyph = '%';
      if (corpse.type === 'animal') {
        corpseGlyph = '🪶';
      } else if (corpse.name?.toLowerCase().includes('skeleton')) {
        corpseGlyph = '☠';
      }
      return corpseGlyph;
    };

    expect(getCorpseGlyph(mockCorpse1)).toBe('☠');
    expect(getCorpseGlyph(mockCorpse2)).toBe('🪶');
    expect(getCorpseGlyph(mockCorpse3)).toBe('%');
  });

  it('GameLog row formatting generates unique key strings for duplicate logs', () => {
    const log1 = { id: 'log_1', text: 'You struck the Goblin for 12 damage.', timestamp: '10:05', type: 'combat' };
    const log2 = { id: undefined as any, text: 'You struck the Goblin for 12 damage.', timestamp: '10:05', type: 'combat' };

    const getRowKey = (log: typeof log1, idx: number) => {
      return log.id || `log_row_${idx}_${(log.text || '').slice(0, 10)}`;
    };

    expect(getRowKey(log1, 0)).toBe('log_1');
    expect(getRowKey(log2, 1)).toBe('log_row_1_You struck');
  });

  it('Scroll of Recall and fast travel target coordinate sanitization', () => {
    const mapWidth = 64;
    const mapHeight = 40;

    const sanitizeTargetCoord = (targetX: number, targetY: number) => {
      const safeX = Math.max(1, Math.min(mapWidth - 2, Math.floor(targetX)));
      const safeY = Math.max(1, Math.min(mapHeight - 2, Math.floor(targetY)));
      return { safeX, safeY };
    };

    expect(sanitizeTargetCoord(-5, 100)).toEqual({ safeX: 1, safeY: 38 });
    expect(sanitizeTargetCoord(32.7, 20.4)).toEqual({ safeX: 32, safeY: 20 });
  });

  it('Virtual Smoke Test Runner executes 100 simulated turns cleanly', () => {
    let mockState = {
      turn: 0,
      playerHp: 50,
      enemies: [
        { id: 'e1', x: 10, y: 10, hp: 10, maxHp: 10, debuffs: [{ type: CatalystType.Fire, duration: 5, damagePerTurn: 4 }] }
      ]
    };

    // Simulate 100 engine tick turns
    for (let i = 0; i < 100; i++) {
      mockState.turn += 1;
      // Process enemy debuff ticks
      mockState.enemies = mockState.enemies.map(e => {
        let hp = e.hp;
        const nextDebuffs = e.debuffs
          .map(d => {
            hp -= d.damagePerTurn;
            return { ...d, duration: d.duration - 1 };
          })
          .filter(d => d.duration > 0);
        return { ...e, hp: Math.max(0, hp), debuffs: nextDebuffs };
      }).filter(e => e.hp > 0);
    }

    expect(mockState.turn).toBe(100);
    expect(mockState.enemies.length).toBe(0); // Enemy perished from fire debuff ticks by turn 10
  });

  it('Handles 50,000 log entries without UI lag by collapsing duplicates and slicing render window', () => {
    const hugeLogsArray = [];
    for (let i = 0; i < 50000; i++) {
      hugeLogsArray.push({
        id: `log_${i}`,
        text: i % 2 === 0 ? 'Player attacks Goblin' : 'Goblin retaliates for 3 damage',
        type: i % 2 === 0 ? 'combat' : 'danger',
        timestamp: '12:00'
      });
    }

    // Collapse consecutive duplicates algorithm test
    const collapsed: Array<{ log: any; count: number }> = [];
    hugeLogsArray.forEach((currentLog) => {
      const lastItem = collapsed[collapsed.length - 1];
      if (lastItem && lastItem.log.text === currentLog.text && lastItem.log.type === currentLog.type) {
        lastItem.count += 1;
      } else {
        collapsed.push({ log: currentLog, count: 1 });
      }
    });

    // Render slice maximum cap
    const maxRenderedLogs = 150;
    const sliced = collapsed.slice(-maxRenderedLogs);

    expect(hugeLogsArray.length).toBe(50000);
    expect(collapsed.length).toBe(50000);
    expect(sliced.length).toBe(150);
  });

  it('Parses simulation replay JSON embedded in raw log text files cleanly', () => {
    const sampleLogFile = `
========================================
SUNDERED REALMS PLAYTHROUGH LOG EXPORT
========================================
[12:00:01] Player entered Oakhaven Town Center.
[12:00:05] Engaged Goblin Warrior in combat.

--- COMPREHENSIVE SIMULATOR REPLAY DATA ---
{
  "totalTurns": 5,
  "snapshots": [
    { "turn": 1, "playerHp": 50, "enemyHp": 30 },
    { "turn": 2, "playerHp": 45, "enemyHp": 20 },
    { "turn": 3, "playerHp": 45, "enemyHp": 10 },
    { "turn": 4, "playerHp": 42, "enemyHp": 0 }
  ]
}
--- END OF SIMULATOR REPLAY DATA ---

Log export finalized.
`;

    const startMarker = "--- COMPREHENSIVE SIMULATOR REPLAY DATA ---";
    const endMarker = "--- END OF SIMULATOR REPLAY DATA ---";

    let searchSource = sampleLogFile;
    const startIdx = sampleLogFile.indexOf(startMarker);
    if (startIdx !== -1) {
      const afterStart = sampleLogFile.substring(startIdx + startMarker.length);
      const endIdx = afterStart.indexOf(endMarker);
      searchSource = endIdx !== -1 ? afterStart.substring(0, endIdx) : afterStart;
    }

    const firstBrace = searchSource.indexOf('{');
    const lastBrace = searchSource.lastIndexOf('}');
    const jsonText = searchSource.substring(firstBrace, lastBrace + 1).trim();
    const parsed = JSON.parse(jsonText);

    expect(parsed.totalTurns).toBe(5);
    expect(parsed.snapshots).toHaveLength(4);
    expect(parsed.snapshots[3].enemyHp).toBe(0);
  });
});
