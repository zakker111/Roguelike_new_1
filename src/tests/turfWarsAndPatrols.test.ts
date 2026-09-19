import { describe, it, expect, vi } from 'vitest';
import {
  populateOrcWarcamp,
  populateBanditHideout,
  populateContestedPlaza,
  RuinedCitySector
} from '../world/ruinedCity/ruinedCityTurf';
import { EnemyState, EnemyType } from '../types/entities';
import { isHostileBetween } from '../factions/FactionMatrix';

describe('Phase E4: Turf Wars & Autonomous Faction Patrols', () => {
  const dummySector: RuinedCitySector = {
    id: 'test_sec_01',
    x: 10,
    y: 10,
    w: 12,
    h: 12,
    zone: 'orc_warcamp',
    controllingFaction: 'orc_clans',
    dangerLevel: 3,
    name: 'Goreaxe Warcamp',
  };

  it('Phase E4.1: Orc warcamp spawns leader and grunts with multi-node roving sector patrol routes', () => {
    const { enemies } = populateOrcWarcamp(dummySector, 100, 2, 20);
    expect(enemies.length).toBeGreaterThanOrEqual(3);

    const warlord = enemies.find(e => e.factionRank === 'warlord');
    expect(warlord).toBeDefined();
    expect(warlord?.patrolPath).toBeDefined();
    expect(warlord!.patrolPath!.length).toBeGreaterThanOrEqual(4);

    const grunts = enemies.filter(e => e.factionRank === 'soldier' || e.factionRank === 'shaman');
    expect(grunts.length).toBeGreaterThanOrEqual(2);
    for (const grunt of grunts) {
      expect(grunt.patrolPath).toBeDefined();
      expect(grunt.patrolPath!.length).toBeGreaterThanOrEqual(3);
    }
  });

  it('Phase E4.1: Bandit hideout spawns leader and outlaws with roving patrol waypoints', () => {
    const banditSector: RuinedCitySector = {
      ...dummySector,
      id: 'test_bandit_01',
      zone: 'bandit_hideout',
      controllingFaction: 'outlaw_bandits',
      name: 'Shadow Dagger Hideout',
    };
    const { enemies } = populateBanditHideout(banditSector, 200, 3, 20);
    expect(enemies.length).toBeGreaterThanOrEqual(3);

    const leader = enemies.find(e => e.factionRank === 'leader');
    expect(leader).toBeDefined();
    expect(leader?.patrolPath).toBeDefined();
    expect(leader!.patrolPath!.length).toBeGreaterThanOrEqual(4);

    const outlaws = enemies.filter(e => e.factionRank === 'soldier' || e.factionRank === 'scout');
    for (const outlaw of outlaws) {
      expect(outlaw.patrolPath).toBeDefined();
      expect(outlaw.patrolPath!.length).toBeGreaterThanOrEqual(3);
    }
  });

  it('Phase E4.1 & E4.2: Contested Plaza spawns rival squads on clashing patrol routes', () => {
    const plazaSector: RuinedCitySector = {
      ...dummySector,
      id: 'test_plaza_01',
      zone: 'contested_plaza',
      controllingFaction: 'contested',
      name: 'Shattered Plaza',
    };
    const { enemies, props } = populateContestedPlaza(plazaSector, 300, 2, 20);

    // Should spawn fountain and salvage debris
    const fountain = props.find(p => p.id.includes('fountain'));
    const debris = props.find(p => p.id.includes('shield_debris'));
    expect(fountain).toBeDefined();
    expect(debris).toBeDefined();

    // Verify both rival factions are present
    const orcs = enemies.filter(e => e.faction === 'orc_clans');
    const bandits = enemies.filter(e => e.faction === 'outlaw_bandits');
    expect(orcs.length).toBeGreaterThanOrEqual(2);
    expect(bandits.length).toBeGreaterThanOrEqual(2);

    // Hostility matrix check: Orcs and Outlaw Bandits must be hostile
    expect(isHostileBetween('orc_clans', 'outlaw_bandits')).toBe(true);

    // Verify both factions have multi-point patrol paths encircling the central fountain
    for (const combatant of [...orcs, ...bandits]) {
      expect(combatant.state).toBe(EnemyState.Patrolling);
      expect(combatant.patrolPath).toBeDefined();
      expect(combatant.patrolPath!.length).toBeGreaterThanOrEqual(4);
    }
  });
});
