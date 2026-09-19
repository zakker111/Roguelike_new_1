import { CatalystType, TileType } from '../types';

export type BiomeType = 'forest' | 'desert' | 'tundra' | 'swamp' | 'town';
export type WeatherType = 'clear' | 'rainy' | 'foggy' | 'snowy' | 'sandstorm' | 'blizzard';

export const BIOME_VALID_WEATHERS: Record<BiomeType, WeatherType[]> = {
  desert: ['clear', 'foggy', 'sandstorm'],
  tundra: ['clear', 'foggy', 'snowy', 'blizzard'],
  forest: ['clear', 'foggy', 'rainy'],
  swamp: ['clear', 'foggy', 'rainy'],
  town: ['clear', 'foggy', 'rainy']
};

export function getValidWeatherForBiome(biome?: string, desiredWeather?: string): WeatherType {
  const normBiome = ((biome && BIOME_VALID_WEATHERS[biome as BiomeType]) ? biome : 'forest') as BiomeType;
  const allowed = BIOME_VALID_WEATHERS[normBiome];
  if (desiredWeather && allowed.includes(desiredWeather as WeatherType)) {
    return desiredWeather as WeatherType;
  }
  return allowed[0]; // fallback to default 'clear'
}

export interface WeatherEffect {
  id: 'clear' | 'rainy' | 'foggy' | 'snowy' | 'sandstorm' | 'blizzard';
  name: string;
  icon: string;
  description: string;
  movementPenaltyChance: number;
  fatigueText: string;
  fatigueLog: string;
  combatModifiers?: {
    catalystModifiers?: Partial<Record<CatalystType, { multiplier: number; logText: string }>>;
    blindnessChance?: number;
    blindnessMultiplier?: number;
    blindnessLog?: string;
  };
}

export const WEATHER_EFFECTS: Record<string, WeatherEffect> = {
  clear: {
    id: 'clear',
    name: 'Clear Skies',
    icon: '☀️',
    description: 'Standard traveling speeds, clear fields of view.',
    movementPenaltyChance: 0,
    fatigueText: '',
    fatigueLog: '',
  },
  rainy: {
    id: 'rainy',
    name: 'Pouring Rain & Storms',
    icon: '🌧️',
    description: '⚡ +30% Lightning catalyst, -20% Fire dmg, instant fishing bites!',
    movementPenaltyChance: 0.05,
    fatigueText: '💧 SLIP',
    fatigueLog: '🌧️ [MUDDY PATHS]: You slip and slide on the muddy wet ground, wasting your turn recovering your footing.',
    combatModifiers: {
      catalystModifiers: {
        [CatalystType.Lightning]: {
          multiplier: 1.30,
          logText: '🌧️ [CONDUCTIVITY]: Wet conditions conduct your electric magic, dealing +30% extra Lightning damage!',
        },
        [CatalystType.Fire]: {
          multiplier: 0.80,
          logText: '🌧️ [DAMP AIR]: Heavy rain dampens your active flame infusion, reducing Fire damage by -20%.',
        },
      }
    }
  },
  foggy: {
    id: 'foggy',
    name: 'Thick Ambient Fog',
    icon: '🌫️',
    description: '🌫️ Vision is restricted, but +15% stealth dodge rate active!',
    movementPenaltyChance: 0,
    fatigueText: '',
    fatigueLog: '',
  },
  snowy: {
    id: 'snowy',
    name: 'Gentle Frosty Snowfall',
    icon: '❄️',
    description: '❄️ Fire attacks deal +20% damage. Small chance to slip.',
    movementPenaltyChance: 0.03,
    fatigueText: '🥶 SHIVER',
    fatigueLog: '❄️ [WINTER CHILL]: A frosty blast of freezing wind locks up your muscles! You shiver from frostbite fatigue and waste a turn.',
  },
  sandstorm: {
    id: 'sandstorm',
    name: 'Swirling Sandstorm',
    icon: '🌪️',
    description: '🌪️ Blinds normal attacks. Sandy winds blow through the dunes!',
    movementPenaltyChance: 0.10,
    fatigueText: '🌪️ BLINDED',
    fatigueLog: '🌪️ [SANDSTORM DUST]: Swirling sand fills your eyes, making you stumble blindly! You lose a turn trying to clear your vision.',
    combatModifiers: {
      blindnessChance: 0.25,
      blindnessMultiplier: 0.5,
      blindnessLog: '🌪️ [SANDSTORM BLINDNESS]: Blinding sandstorms obscure your target! Your attack only deals 50% damage.',
    }
  },
  blizzard: {
    id: 'blizzard',
    name: 'Severe Glacial Blizzard',
    icon: '🌨️',
    description: '🌨️ Freezing fatigue outdoor penalty. Frost deals +40% dmg!',
    movementPenaltyChance: 0.12,
    fatigueText: '🥶 FREEZE',
    fatigueLog: '🌨️ [BLIZZARD FREEZE]: A savage winter blizzard gale sweeps over you! You shiver from cold fatigue and lose a turn.',
    combatModifiers: {
      catalystModifiers: {
        [CatalystType.Frost]: {
          multiplier: 1.40,
          logText: '❄️ [BLIZZARD OVERDRIVE]: Freezing blizzard winds amplify your glacial frost, dealing +40% extra Ice damage!',
        }
      }
    }
  }
};

export function isForestBiome(biome?: string): boolean {
  return !biome || biome === 'forest';
}

export function isDesertBiome(biome?: string, weather?: string): boolean {
  return biome === 'desert' || weather === 'sandstorm';
}

export function isObstacleTile(tile?: TileType): boolean {
  if (!tile) return false;
  return (
    tile === TileType.Wall ||
    tile === TileType.CopperVein ||
    tile === TileType.IronVein ||
    tile === TileType.WatchtowerWall ||
    tile === TileType.WatchtowerSlit ||
    tile === TileType.Tree ||
    tile === TileType.PineTree ||
    tile === TileType.BirchTree ||
    tile === TileType.TreeStump ||
    tile === TileType.WatchtowerBarricade ||
    tile === TileType.Window ||
    tile === TileType.Table ||
    tile === TileType.Campfire ||
    tile === TileType.Fireplace ||
    tile === TileType.Anvil ||
    tile === TileType.FieldTent ||
    tile === TileType.Empty
  );
}

export function getSeasonalLeafPalette(season: string = 'autumn'): { colors: string[]; type: 'petal' | 'leaf' } {
  switch (season) {
    case 'spring':
      return {
        colors: ['rgba(251, 207, 232, 0.45)', 'rgba(244, 114, 182, 0.35)', 'rgba(253, 242, 248, 0.50)'],
        type: 'petal',
      };
    case 'summer':
      return {
        colors: ['rgba(16, 185, 129, 0.35)', 'rgba(5, 150, 105, 0.30)', 'rgba(52, 211, 153, 0.40)'],
        type: 'leaf',
      };
    case 'autumn':
    default:
      return {
        colors: ['rgba(217, 119, 6, 0.45)', 'rgba(202, 138, 4, 0.35)', 'rgba(245, 158, 11, 0.40)', 'rgba(180, 83, 9, 0.35)'],
        type: 'leaf',
      };
  }
}
