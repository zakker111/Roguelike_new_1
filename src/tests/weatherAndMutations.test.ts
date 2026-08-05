import { describe, it, expect } from 'vitest';
import { WEATHER_EFFECTS, WeatherEffect } from '../utils/weatherEngine';
import { DUAL_ELEMENT_SYNERGIES, MutationSynergyDefinition } from '../utils/mutationSynergy';

describe('Phase 7: Weather Engine & Mutation Synergy Suite', () => {
  it('validates weather effects database structure and movement penalty properties', () => {
    const weatherKeys = Object.keys(WEATHER_EFFECTS);
    expect(weatherKeys.length).toBeGreaterThan(0);

    weatherKeys.forEach((key) => {
      const effect: WeatherEffect = WEATHER_EFFECTS[key];
      expect(effect.id).toBeDefined();
      expect(effect.name).toBeDefined();
      expect(effect.icon).toBeDefined();
      expect(effect.movementPenaltyChance).toBeGreaterThanOrEqual(0);
      expect(effect.movementPenaltyChance).toBeLessThanOrEqual(1.0);
    });
  });

  it('validates rainy weather combat modifiers for Lightning and Fire catalysts', () => {
    const rainy = WEATHER_EFFECTS.rainy;
    expect(rainy).toBeDefined();
    expect(rainy.combatModifiers).toBeDefined();
    expect(rainy.combatModifiers?.catalystModifiers).toBeDefined();

    const mods = rainy.combatModifiers!.catalystModifiers!;
    // Lightning should have boost (> 1.0)
    expect(mods['Lightning']?.multiplier).toBeGreaterThan(1.0);
    // Fire should have dampening (< 1.0)
    expect(mods['Fire']?.multiplier).toBeLessThan(1.0);
  });

  it('validates dual-element mutation synergy definitions and power percentages', () => {
    expect(DUAL_ELEMENT_SYNERGIES.length).toBeGreaterThan(0);

    DUAL_ELEMENT_SYNERGIES.forEach((syn: MutationSynergyDefinition) => {
      expect(syn.id).toBeDefined();
      expect(syn.name).toBeDefined();
      expect(syn.elements.length).toBe(2);
      expect(syn.bonusPowerPct).toBeGreaterThan(0);
      expect(syn.color).toBeDefined();
    });
  });

  it('verifies Thermal Shock synergy combines Fire and Frost elements', () => {
    const thermalShock = DUAL_ELEMENT_SYNERGIES.find((s) => s.id === 'syn_thermal_shock');
    expect(thermalShock).toBeDefined();
    expect(thermalShock?.elements).toContain('Fire');
    expect(thermalShock?.elements).toContain('Frost');
    expect(thermalShock?.bonusPowerPct).toBe(35);
  });
});
