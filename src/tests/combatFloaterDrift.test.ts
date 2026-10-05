/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  calculateDirectionalDrift,
  resolveFloaterArchetype,
  getArchetypeVisuals,
} from '../utils/combatFloaterDrift';
import { combatVfxEngine } from '../canvas/combatVfxEngine';

describe('Combat Floating Text Directional Outward Drift & Archetypes Suite', () => {
  beforeEach(() => {
    combatVfxEngine.clearAll();
  });

  describe('Directional Drift & Line of Sight Avoidance', () => {
    it('drifts to the right when attacked from the left (dx > 0)', () => {
      const result = calculateDirectionalDrift({
        targetX: 10,
        targetY: 10,
        sourceX: 9,
        sourceY: 10,
        isCrit: false,
      });

      expect(result.vx).toBeGreaterThan(0);
      expect(result.spawnX).toBeGreaterThan(10.5); // pushed to the right flank
    });

    it('drifts to the left when attacked from the right (dx < 0)', () => {
      const result = calculateDirectionalDrift({
        targetX: 10,
        targetY: 10,
        sourceX: 11,
        sourceY: 10,
        isCrit: false,
      });

      expect(result.vx).toBeLessThan(0);
      expect(result.spawnX).toBeLessThan(10.5); // pushed to the left flank
    });

    it('drifts downward/outward with upward buoyancy when struck from above', () => {
      const result = calculateDirectionalDrift({
        targetX: 10,
        targetY: 10,
        sourceX: 10,
        sourceY: 9,
        isCrit: false,
      });

      expect(result.spawnY).toBeGreaterThan(10.12);
    });

    it('scales speed up on critical strikes', () => {
      const regular = calculateDirectionalDrift({
        targetX: 10,
        targetY: 10,
        sourceX: 8,
        sourceY: 10,
        isCrit: false,
      });

      const crit = calculateDirectionalDrift({
        targetX: 10,
        targetY: 10,
        sourceX: 8,
        sourceY: 10,
        isCrit: true,
      });

      expect(crit.vx).toBeGreaterThan(regular.vx);
    });

    it('diverges to flanks when attacker source is omitted (clear line of sight)', () => {
      const leftDrift = calculateDirectionalDrift({
        targetX: 10,
        targetY: 10,
        randomSeed: 0.2, // < 0.5 -> left
      });

      const rightDrift = calculateDirectionalDrift({
        targetX: 10,
        targetY: 10,
        randomSeed: 0.8, // > 0.5 -> right
      });

      expect(leftDrift.vx).toBeLessThan(0);
      expect(leftDrift.spawnX).toBeLessThan(10.5);

      expect(rightDrift.vx).toBeGreaterThan(0);
      expect(rightDrift.spawnX).toBeGreaterThan(10.5);
    });
  });

  describe('Phase L3.1: Anti-Overlap Radial Drift & Stagger', () => {
    it('applies horizontal and vertical stagger offsets when multiple floaters target same entity', () => {
      const hit1 = calculateDirectionalDrift({
        targetX: 15,
        targetY: 20,
        sourceX: 14,
        sourceY: 20,
        staggerIndex: 0,
      });

      const hit2 = calculateDirectionalDrift({
        targetX: 15,
        targetY: 20,
        sourceX: 14,
        sourceY: 20,
        staggerIndex: 1,
      });

      const hit3 = calculateDirectionalDrift({
        targetX: 15,
        targetY: 20,
        sourceX: 14,
        sourceY: 20,
        staggerIndex: 2,
      });

      // Sequential hits must have distinct spawn positions to prevent visual collision
      expect(hit1.spawnX).not.toBe(hit2.spawnX);
      expect(hit2.spawnY).toBeLessThan(hit1.spawnY); // Staggered upward vertically
      expect(hit3.spawnX).not.toBe(hit2.spawnX);
    });
  });

  describe('Phase L3.2: Categorized Floater Archetypes', () => {
    it('resolves distinct archetype based on action type, text and target', () => {
      expect(resolveFloaterArchetype('crit', '-45 CRIT!')).toBe('crit');
      expect(resolveFloaterArchetype('dmg', 'DODGE!')).toBe('dodge');
      expect(resolveFloaterArchetype('dmg', 'Braced! Blocked [12 DMG]')).toBe('shield');
      expect(resolveFloaterArchetype('dmg', '-8 Fire Burn')).toBe('burning');
      expect(resolveFloaterArchetype('dmg', '-5 Poison Venom')).toBe('poison');
      expect(resolveFloaterArchetype('dmg', '-10 Shock Lightning')).toBe('shock');
      expect(resolveFloaterArchetype('heal', '+25 HP')).toBe('heal');
      expect(resolveFloaterArchetype('mana', '+15 MP')).toBe('mana');
      expect(resolveFloaterArchetype('dmg', '-14 DMG', true)).toBe('player_damage');
      expect(resolveFloaterArchetype('dmg', '-14 DMG', false)).toBe('enemy_damage');
    });

    it('returns tuned styling, scale and physics contracts for each archetype', () => {
      const critVis = getArchetypeVisuals('crit');
      expect(critVis.primaryColor).toBe('#fbbf24');
      expect(critVis.gravity).toBeGreaterThan(0); // Parabolic bounce arc
      expect(critVis.initialScale).toBeGreaterThan(1.2);

      const playerVis = getArchetypeVisuals('player_damage');
      expect(playerVis.primaryColor).toBe('#ef4444');
      expect(playerVis.tremorIntensity).toBeGreaterThan(0); // Crimson tremor vibration

      const dodgeVis = getArchetypeVisuals('dodge');
      expect(dodgeVis.primaryColor).toBe('#38bdf8');
      expect(dodgeVis.fontStyle).toContain('italic');

      const shieldVis = getArchetypeVisuals('shield');
      expect(shieldVis.primaryColor).toBe('#2dd4bf');
      expect(shieldVis.initialScale).toBeGreaterThan(1.2);

      const burnVis = getArchetypeVisuals('burning');
      expect(burnVis.primaryColor).toBe('#f97316');

      const poisonVis = getArchetypeVisuals('poison');
      expect(poisonVis.primaryColor).toBe('#10b981');
    });

    it('CombatVfxEngine spawns archetypes with proper initial scale, colors, and decays in update()', () => {
      combatVfxEngine.spawnFloatingText({
        x: 10,
        y: 10,
        text: '-99 CRIT!',
        type: 'crit',
      });

      expect(combatVfxEngine.getActiveFloaterCount()).toBe(1);
      const floaters = combatVfxEngine.getFloatingTexts();
      expect(floaters[0].archetype).toBe('crit');
      expect(floaters[0].isCrit).toBe(true);
      expect(floaters[0].scale).toBeGreaterThan(1.3);
      expect(floaters[0].gravity).toBeGreaterThan(0);

      // Multi-attack anti-overlap test: spawn second floater on same tile
      combatVfxEngine.spawnFloatingText({
        x: 10,
        y: 10,
        text: '-15 DMG',
        type: 'dmg',
      });

      expect(combatVfxEngine.getActiveFloaterCount()).toBe(2);
      const updatedFloaters = combatVfxEngine.getFloatingTexts();
      // Ensure the second floater has staggered spawn coordinates
      expect(updatedFloaters[0].y).not.toBe(updatedFloaters[1].y);

      // Run an update cycle
      combatVfxEngine.update();
      // Scale should have decayed smoothly
      expect(updatedFloaters[0].scale).toBeLessThan(1.45);
      expect(updatedFloaters[0].life).toBeLessThan(1.0);
    });
  });
});
