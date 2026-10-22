/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, it, expect } from 'vitest';
import {
  rollWorldEventSiege,
  evaluateActiveOutpostCombat,
  getFactionDisplayName,
  getOutpostName
} from '../world/outposts/territoryEngine';
import { spawnOutpostSiegeSquads } from '../world/outposts/outpostSiegeSpawner';
import {
  createOutpostQuartermaster,
  calculateStandingDiscount,
  restInBarracks
} from '../world/outposts/outpostQuartermaster';
import type { OverworldChunk, Enemy, GameState } from '../types';
import { EnemyState, EnemyType } from '../types';

describe('Dynamic World Events & Faction Territory Wars', () => {
  describe('Outpost Names & Display Helpers', () => {
    it('formats faction display names with thematic icons', () => {
      expect(getFactionDisplayName('vanguard')).toContain('Dawn Vanguard');
      expect(getFactionDisplayName('syndicate')).toContain('Moonshadow Syndicate');
      expect(getFactionDisplayName('bandits')).toContain('Rust-Raider Outlaws');
      expect(getFactionDisplayName('neutral')).toContain('Frontier Free Folk');
    });

    it('generates directional outpost titles based on chunk coordinates', () => {
      const nameNW = getOutpostName(-2, -3, 'vanguard');
      expect(nameNW).toContain('Northwest');
      expect(nameNW).toContain('Bastion');

      const nameSE = getOutpostName(4, 5, 'syndicate');
      expect(nameSE).toContain('Southeast');
      expect(nameSE).toContain('Redoubt');
    });
  });

  describe('rollWorldEventSiege (Turn Milestones & Pacing)', () => {
    it('returns null if turn interval is under 75 turns to prevent event spam', () => {
      const chunks: Record<string, OverworldChunk> = {
        '1,1': {
          chunkX: 1,
          chunkY: 1,
          map: [],
          enemies: [],
          pois: [],
          isDiscovered: true,
          watchtower: {
            id: 'wt_1_1',
            chunkX: 1,
            chunkY: 1,
            x: 20,
            y: 20,
            width: 10,
            height: 10,
            controller: 'vanguard',
            isClaimed: true,
            claimPercent: 100,
            garrisonDefeated: false,
            taxGoldAccumulated: 0
          }
        } as any
      };

      // Only 30 turns elapsed
      const result = rollWorldEventSiege(chunks, 130, 100, 1, 1);
      expect(result).toBeNull();
    });

    it('triggers a siege against an outpost when pacing milestone is reached (>= 75 turns)', () => {
      const chunks: Record<string, OverworldChunk> = {
        '2,2': {
          chunkX: 2,
          chunkY: 2,
          map: [],
          enemies: [],
          pois: [],
          isDiscovered: true,
          watchtower: {
            id: 'wt_2_2',
            chunkX: 2,
            chunkY: 2,
            x: 15,
            y: 15,
            width: 10,
            height: 10,
            controller: 'vanguard',
            isClaimed: true,
            claimPercent: 100,
            garrisonDefeated: false,
            taxGoldAccumulated: 0
          }
        } as any
      };

      // 80 turns elapsed
      const result = rollWorldEventSiege(chunks, 180, 100, 2, 2);
      expect(result).not.toBeNull();
      expect(result?.chunkKey).toBe('2,2');
      expect(result?.defender).toBe('vanguard');
      // Attacker should be rival faction (syndicate or bandits)
      expect(['syndicate', 'bandits']).toContain(result?.attacker);
    });
  });

  describe('spawnOutpostSiegeSquads', () => {
    it('creates coordinated defender and attacker squads with leaders', () => {
      const { enemies, siegeState } = spawnOutpostSiegeSquads({
        wtX: 20,
        wtY: 20,
        chunkX: 3,
        chunkY: -2,
        attackerFaction: 'syndicate',
        defenderFaction: 'vanguard',
        playerFaction: 'neutral',
        playerReputation: { vanguard: 10, syndicate: 0, bandits: 0 },
        defenseTier: 2
      });

      expect(enemies.length).toBeGreaterThan(4);
      expect(siegeState.isUnderSiege).toBe(true);
      expect(siegeState.attacker).toBe('syndicate');
      expect(siegeState.defender).toBe('vanguard');
      expect(siegeState.bountyGold).toBeGreaterThanOrEqual(300);

      const defenders = enemies.filter(
        (e) => e.id.startsWith('siege_defender_') || e.id.startsWith('siege_def_')
      );
      const attackers = enemies.filter(
        (e) => e.id.startsWith('siege_attacker_') || e.id.startsWith('siege_att_')
      );

      expect(defenders.length).toBeGreaterThan(0);
      expect(attackers.length).toBeGreaterThan(0);

      // Verify leader presence
      const hasDefLeader = defenders.some((e) => e.isElite && e.name.includes('Captain'));
      const hasAttLeader = attackers.some((e) => e.isElite && (e.name.includes('Commander') || e.name.includes('Chief') || e.name.includes('Master')));
      expect(hasDefLeader).toBe(true);
      expect(hasAttLeader).toBe(true);
    });
  });

  describe('createOutpostQuartermaster & Standing Discounts', () => {
    it('generates faction-specific inventory and bounty status', () => {
      const vanguardQm = createOutpostQuartermaster(2, 3, 'vanguard', 1, 250);
      expect(vanguardQm.factionId).toBe('vanguard');
      expect(vanguardQm.items.length).toBeGreaterThanOrEqual(4);
      expect(vanguardQm.bountyRewardGold).toBe(250);

      // Vanguard should stock shields and defensive supplies
      const hasVanguardGear = vanguardQm.items.some((i) => i.factionExclusive === 'vanguard');
      expect(hasVanguardGear).toBe(true);
    });

    it('calculates standing discounts properly up to 35%', () => {
      expect(calculateStandingDiscount(-50)).toBe(0);
      expect(calculateStandingDiscount(0)).toBe(0);
      expect(calculateStandingDiscount(25)).toBe(0.10);
      expect(calculateStandingDiscount(50)).toBe(0.20);
      expect(calculateStandingDiscount(80)).toBe(0.35);
    });

    it('restInBarracks clears physical exhaustion and restores vitals', () => {
      const state: GameState = {
        playerStats: {
          hp: 20,
          maxHp: 100,
          mp: 5,
          maxMp: 50,
          exhaustion: 45,
          activeEffects: []
        }
      } as any;

      const updated = restInBarracks(state);
      expect(updated.playerStats.hp).toBe(100);
      expect(updated.playerStats.mp).toBe(50);
      expect(updated.playerStats.exhaustion).toBe(0);
      expect(updated.playerStats.activeEffects?.some((e) => e.id === 'buff_barracks_rest')).toBe(true);
    });
  });

  describe('evaluateActiveOutpostCombat', () => {
    it('recognizes defender victory when all attackers are eliminated', () => {
      const chunk: OverworldChunk = {
        chunkX: 1,
        chunkY: 2,
        map: [],
        pois: [],
        isDiscovered: true,
        watchtower: {
          id: 'wt_1_2',
          chunkX: 1,
          chunkY: 2,
          x: 10,
          y: 10,
          width: 8,
          height: 8,
          controller: 'vanguard',
          isClaimed: true,
          claimPercent: 100,
          garrisonDefeated: false,
          taxGoldAccumulated: 0,
          siegeState: {
            isUnderSiege: true,
            attacker: 'syndicate',
            defender: 'vanguard',
            siegeTimerSeconds: 60,
            maxTimerSeconds: 120,
            bountyGold: 220,
            playerAssistedDefender: true
          }
        },
        enemies: [
          {
            id: 'siege_def_lead_1_2',
            name: 'Vanguard Outpost Captain',
            hp: 150,
            maxHp: 150,
            atk: 20,
            def: 10,
            type: EnemyType.OrcBrute,
            state: EnemyState.Chasing,
            x: 12,
            y: 12
          } as Enemy
          // No attacker enemies remaining
        ]
      } as any;

      const result = evaluateActiveOutpostCombat(chunk, 'vanguard');
      expect(result).not.toBeNull();
      expect(result?.eventFired).toBe('defenders_victorious');
      expect(result?.bountyAwarded).toBe(220);
      expect(result?.reputationGain?.faction).toBe('vanguard');
      expect(result?.reputationGain?.delta).toBe(25);
      expect(result?.updatedChunk.watchtower?.siegeState).toBeUndefined();
      expect(result?.updatedChunk.watchtower?.controller).toBe('vanguard');
      expect(result?.updatedChunk.watchtower?.quartermaster).toBeDefined();
    });

    it('recognizes attacker capture when all defenders are eliminated', () => {
      const chunk: OverworldChunk = {
        chunkX: 3,
        chunkY: 4,
        map: [],
        pois: [],
        isDiscovered: true,
        watchtower: {
          id: 'wt_3_4',
          chunkX: 3,
          chunkY: 4,
          x: 10,
          y: 10,
          width: 8,
          height: 8,
          controller: 'vanguard',
          isClaimed: true,
          claimPercent: 100,
          garrisonDefeated: false,
          taxGoldAccumulated: 0,
          siegeState: {
            isUnderSiege: true,
            attacker: 'syndicate',
            defender: 'vanguard',
            siegeTimerSeconds: 60,
            maxTimerSeconds: 120,
            bountyGold: 250,
            playerAssistedAttacker: true
          }
        },
        enemies: [
          {
            id: 'siege_att_lead_3_4',
            name: 'Syndicate Shadow Master',
            hp: 180,
            maxHp: 180,
            atk: 22,
            def: 6,
            type: EnemyType.Bandit,
            state: EnemyState.Chasing,
            x: 12,
            y: 12
          } as Enemy
          // No defenders remaining
        ]
      } as any;

      const result = evaluateActiveOutpostCombat(chunk, 'syndicate');
      expect(result).not.toBeNull();
      expect(result?.eventFired).toBe('attackers_captured');
      expect(result?.bountyAwarded).toBe(250);
      expect(result?.reputationGain?.faction).toBe('syndicate');
      expect(result?.updatedChunk.watchtower?.controller).toBe('syndicate');
    });

    it('returns null if both attackers and defenders are still fighting', () => {
      const chunk: OverworldChunk = {
        chunkX: 1,
        chunkY: 1,
        map: [],
        pois: [],
        isDiscovered: true,
        watchtower: {
          id: 'wt_1_1',
          chunkX: 1,
          chunkY: 1,
          x: 10,
          y: 10,
          width: 8,
          height: 8,
          controller: 'vanguard',
          isClaimed: true,
          claimPercent: 100,
          garrisonDefeated: false,
          taxGoldAccumulated: 0,
          siegeState: {
            isUnderSiege: true,
            attacker: 'syndicate',
            defender: 'vanguard',
            siegeTimerSeconds: 60,
            maxTimerSeconds: 120
          }
        },
        enemies: [
          { id: 'siege_def_1', hp: 100 } as Enemy,
          { id: 'siege_att_1', hp: 100 } as Enemy
        ]
      } as any;

      const result = evaluateActiveOutpostCombat(chunk, 'neutral');
      expect(result).toBeNull();
    });
  });
});
