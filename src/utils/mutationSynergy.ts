// Modular Unstable Mutation Synergy Chain Engine
// Calculates dual-element catalyst synergies, chain tiers, strain gauges, and trait perks.

export interface MutationSynergyDefinition {
  id: string;
  name: string;
  elements: [string, string];
  traitName: string;
  icon: string;
  color: string;
  description: string;
  bonusPowerPct: number;
}

export const DUAL_ELEMENT_SYNERGIES: MutationSynergyDefinition[] = [
  {
    id: 'syn_thermal_shock',
    name: 'Thermal Shock',
    elements: ['Fire', 'Frost'],
    traitName: '❄️🔥 Thermal Shock Meltdown',
    icon: '🔥',
    color: 'from-orange-500 to-cyan-400',
    description: 'Rapid expansion of extreme heat and sub-zero frost causes armor fracture and explosive thermal damage on hit.',
    bonusPowerPct: 35,
  },
  {
    id: 'syn_plasma_arc',
    name: 'Plasma Arc',
    elements: ['Fire', 'Lightning'],
    traitName: '⚡🔥 Supercharged Plasma Arc',
    icon: '⚡',
    color: 'from-amber-400 to-rose-500',
    description: 'Electrified solar plasma ignites targets and arcs high-voltage electrical surges to adjacent foes.',
    bonusPowerPct: 40,
  },
  {
    id: 'syn_hellfire',
    name: 'Hellfire Singularity',
    elements: ['Fire', 'Shadow'],
    traitName: '🌑🔥 Voidflame Singularity',
    icon: '🌑',
    color: 'from-purple-600 to-red-500',
    description: 'Dark nether flames pull targets into a soul-burning gravitational singularity.',
    bonusPowerPct: 45,
  },
  {
    id: 'syn_cryo_bolt',
    name: 'Superconductor Cryo-Bolt',
    elements: ['Frost', 'Lightning'],
    traitName: '⚡❄️ Superconductor Cryo-Bolt',
    icon: '❄️',
    color: 'from-cyan-400 to-yellow-300',
    description: 'Sub-zero electrical currents freeze targets instantly while shattering physical resistances.',
    bonusPowerPct: 35,
  },
  {
    id: 'syn_abyssal_frost',
    name: 'Abyssal Frostbite',
    elements: ['Frost', 'Shadow'],
    traitName: '🌑❄️ Abyssal Soul-Frost',
    icon: '❄️',
    color: 'from-sky-400 to-purple-800',
    description: 'Black glacial frost decays enemy vitality and reduces enemy hit accuracy.',
    bonusPowerPct: 30,
  },
  {
    id: 'syn_neuro_shock',
    name: 'Neuro-Galvanic Toxin',
    elements: ['Lightning', 'Poison'],
    traitName: '⚡☠️ Neuro-Galvanic Shock',
    icon: '⚡',
    color: 'from-yellow-400 to-emerald-500',
    description: 'High-frequency electric shocks force bio-toxins deeper into enemy nervous systems.',
    bonusPowerPct: 35,
  },
  {
    id: 'syn_corrosive_blight',
    name: 'Corrosive Blight',
    elements: ['Poison', 'Shadow'],
    traitName: '☠️🌑 Corrosive Soul Blight',
    icon: '☠️',
    color: 'from-emerald-500 to-indigo-900',
    description: 'Acidic shadow miasma melts armor values and restores a portion of damage dealt back as HP.',
    bonusPowerPct: 40,
  },
  {
    id: 'syn_toxic_flame',
    name: 'Pyro-Toxic Combustion',
    elements: ['Fire', 'Poison'],
    traitName: '🔥☠️ Pyro-Toxic Defoliation',
    icon: '🔥',
    color: 'from-orange-500 to-lime-400',
    description: 'Volatile venomous gas ignites in violent firebursts upon striking targets.',
    bonusPowerPct: 35,
  },
  {
    id: 'syn_glacio_venom',
    name: 'Glacial Venom',
    elements: ['Frost', 'Poison'],
    traitName: '❄️☠️ Cryo-Venom Stasis',
    icon: '❄️',
    color: 'from-teal-300 to-emerald-600',
    description: 'Crystallized toxin needles slow target movement and deal ticking frost-poison damage.',
    bonusPowerPct: 30,
  },
  {
    id: 'syn_shadow_flux',
    name: 'Void Surge Flux',
    elements: ['Lightning', 'Shadow'],
    traitName: '⚡🌑 Void-Voltaic Flux',
    icon: '⚡',
    color: 'from-purple-500 to-yellow-400',
    description: 'Anomalous dark lightning pierces magical shielding and restores mana on critical hits.',
    bonusPowerPct: 40,
  },
];

export interface SynergyChainResult {
  chainLevel: number;
  catalysts: string[];
  activeSynergies: MutationSynergyDefinition[];
  primaryTitle: string;
  powerMultiplier: number;
  unstableStrain: number; // 0 - 100
  isSupercritical: boolean;
  isOmegaResonance: boolean;
  traits: string[];
  description: string;
}

export function resolveMutationSynergyChain(
  existingCatalysts: string[] = [],
  newCatalystType: string,
  mutationCount: number = 0,
  overforgeHeat: number = 0
): SynergyChainResult {
  // Combine unique catalysts history
  const allCatalysts = Array.from(new Set([...existingCatalysts, newCatalystType]));
  const nextCount = mutationCount + 1;

  // Find dual element synergies
  const matchedSynergies: MutationSynergyDefinition[] = [];
  for (let i = 0; i < allCatalysts.length; i++) {
    for (let j = i + 1; j < allCatalysts.length; j++) {
      const e1 = allCatalysts[i];
      const e2 = allCatalysts[j];
      const match = DUAL_ELEMENT_SYNERGIES.find(
        (syn) =>
          (syn.elements[0] === e1 && syn.elements[1] === e2) ||
          (syn.elements[0] === e2 && syn.elements[1] === e1)
      );
      if (match && !matchedSynergies.some((s) => s.id === match.id)) {
        matchedSynergies.push(match);
      }
    }
  }

  // Calculate Base Multipliers
  let synergyBonusPct = matchedSynergies.reduce((sum, syn) => sum + syn.bonusPowerPct, 0);
  const chainLevel = Math.min(10, nextCount);

  // Supercritical and Omega checks
  const isSupercritical = chainLevel >= 3 || matchedSynergies.length >= 2;
  const isOmegaResonance = chainLevel >= 5 || matchedSynergies.length >= 3;

  if (isSupercritical) synergyBonusPct += 25;
  if (isOmegaResonance) synergyBonusPct += 50;

  // Overforge heat stack
  const heatRatio = overforgeHeat / 100;
  const baseMultiplier = 1.0 + (synergyBonusPct / 100) + (nextCount * 0.15) + (heatRatio * 0.5);

  // Strain calculation (0 to 100)
  const unstableStrain = Math.min(100, Math.round((nextCount * 18) + (allCatalysts.length * 12) + (heatRatio * 30)));

  // Generate Traits
  const traits: string[] = matchedSynergies.map((s) => s.traitName);
  if (isSupercritical) traits.push('⚡ Supercritical Mutagenic Resonance');
  if (isOmegaResonance) traits.push('🌌 Omega Chaos Overcharge');

  // Title generation
  let primaryTitle = 'Unstable Catalyst Infusion';
  if (isOmegaResonance) {
    primaryTitle = '🌌 OMEGA CHAOS RESONANCE';
  } else if (matchedSynergies.length > 0) {
    primaryTitle = matchedSynergies.map((s) => s.name).join(' & ');
  } else if (isSupercritical) {
    primaryTitle = '⚡ Supercritical Mutagenic Surge';
  } else {
    primaryTitle = `${newCatalystType}-Infused Mutation`;
  }

  // Description
  let description = `Mutated (Chain Lv ${chainLevel}). Elements: ${allCatalysts.join(' + ')}.`;
  if (matchedSynergies.length > 0) {
    description += ` Synergies: ${matchedSynergies.map((s) => s.name).join(', ')}.`;
  }

  return {
    chainLevel,
    catalysts: allCatalysts,
    activeSynergies: matchedSynergies,
    primaryTitle,
    powerMultiplier: parseFloat(baseMultiplier.toFixed(2)),
    unstableStrain,
    isSupercritical,
    isOmegaResonance,
    traits,
    description,
  };
}
