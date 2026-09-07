import { GameState, EnemyType, TileType, GameLogMessage } from '../../types';

export const DESIGNER_LEGEND: Record<string, string> = {
  '#': 'Wall',
  '.': 'Floor',
  'D': 'Door',
  'B': 'Bed',
  'C': 'Chair',
  'T': 'Table',
  'f': 'Campfire',
  'F': 'Fireplace',
  'S': 'Sign',
  'G': 'Grass',
  'W': 'Water',
  'E': 'Entrance',
  't': 'Tree',
  'P': 'PineTree',
  'Y': 'BirchTree',
  'p': 'Path',
  'w': 'Window',
  'b': 'Bush',
  'o': 'Torch',
  'A': 'Anvil',
  'K': 'Bookshelf',
  'H': 'Counter',
  'M': 'Stool',
  'u': 'DrunkNpc',
  'N': 'Townsfolk',
  'g': 'Guard'
};

export const MATERIAL_LABELS: Record<string, string> = {
  copper_ore: 'Copper Ore',
  iron_ore: 'Iron Ore',
  shadow_essence: 'Shadow Essence',
  beast_pelt: 'Beast Pelt',
  dragon_scale: 'Dragon Scale',
  void_shard: 'Void Shard',
  sun_stone: 'Sun Stone',
  mithril_ingot: 'Mithril Ingot'
};

export const CATALYST_LABELS: Record<string, string> = {
  ember_core: 'Ember Core 🔥',
  glacial_shard: 'Glacial Shard ❄️',
  storm_conduit: 'Storm Conduit ⚡',
  poison_gland: 'Venom Sac 🧪',
  void_tear: 'Void Core 🌌',
  blood_stone: 'Blood Stone 🩸'
};

export interface UseGodPanelStateProps {
  gameState: GameState;
  setGameState: React.Dispatch<React.SetStateAction<GameState>>;
  onClose: () => void;
  onRegenerateCurrentLocation?: () => void;
  onTriggerLockpicking?: () => void;
  onTriggerFishing?: () => void;
  onTriggerScriptorium?: (scrollTemplateId?: string) => void;
  isAutoplayActive?: boolean;
  setIsAutoplayActive?: (active: boolean) => void;
  addLogMessage?: (msg: string, type?: string) => void;
}

export type GodActiveTab =
  | 'sovereign'
  | 'tileset_tester'
  | 'minigames'
  | 'arena'
  | 'structures'
  | 'struct_json'
  | 'enemies'
  | 'town'
  | 'creator'
  | 'admin_editor'
  | 'smoketest'
  | 'replay'
  | 'bestiary_test'
  | 'house_editor'
  | 'npc_planner'
  | 'dungeon_editor'
  | 'modding_api';
