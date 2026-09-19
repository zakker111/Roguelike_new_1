import React, { useState, useEffect } from 'react';
import { GameState, TileType } from '../../types';
import { 
  CustomDungeonBlueprintMod, 
  GameMod, 
  saveSingleMod, 
  loadAllMods 
} from '../../utils/moddingEngine';
import { 
  Play, 
  Save, 
  Download, 
  Upload, 
  Trash2, 
  RefreshCw, 
  Sparkles, 
  Grid, 
  Layers, 
  Copy, 
  Check, 
  Info,
  Sliders
} from 'lucide-react';

interface GodDungeonEditorProps {
  gameState: GameState;
  setGameState: React.Dispatch<React.SetStateAction<GameState>>;
  onClose: () => void;
  triggerSuccessLog: (msg: string) => void;
  playSound: (sound: string) => void;
}

const TILE_PALETTE = [
  { type: TileType.Floor, name: 'Floor', char: '·', color: '#475569', num: 0 },
  { type: TileType.Wall, name: 'Wall', char: '▓', color: '#64748b', num: 1 },
  { type: TileType.Water, name: 'Water', char: '≈', color: '#38bdf8', num: 2 },
  { type: TileType.Door, name: 'Door', char: '+', color: '#f59e0b', num: 3 },
  { type: TileType.StairsUp, name: 'Stairs Up', char: '<', color: '#a855f7', num: 4 },
  { type: TileType.StairsDown, name: 'Stairs Down', char: '>', color: '#ec4899', num: 5 },
  { type: TileType.Grass, name: 'Grass', char: '"', color: '#22c55e', num: 6 },
  { type: TileType.Path, name: 'Path', char: '=', color: '#eab308', num: 7 },
  { type: TileType.Tree, name: 'Tree', char: '♣', color: '#15803d', num: 8 },
  { type: TileType.Campfire, name: 'Campfire', char: '🔥', color: '#f97316', num: 9 },
  { type: TileType.Bed, name: 'Bed', char: '🛏️', color: '#0d9488', num: 10 },
  { type: TileType.Fireplace, name: 'Fireplace', char: '🧱', color: '#b91c1c', num: 11 }
];

const PROP_TEMPLATES = [
  { type: 'sarcophagus', name: 'Sarcophagus', char: '⚰️', color: '#94a3b8', description: 'Carved marble sarcophagus.' },
  { type: 'weapon_rack', name: 'Weapon Rack', char: '🗡️', color: '#cbd5e1', description: 'Racks holding antique blades.' },
  { type: 'bookshelf', name: 'Bookshelf', char: '📚', color: '#f59e0b', description: 'Shelves crammed with books.' },
  { type: 'alchemy_table', name: 'Worktable', char: '🧪', color: '#10b981', description: 'Bubbling glass retorts.' },
  { type: 'bed', name: 'Feather Bed', char: '🛏️', color: '#f43f5e', description: 'Restful bed for restoration.' },
  { type: 'fireplace', name: 'Fireplace', char: '🔥', color: '#f97316', description: 'Crackling brick fireplace.' },
  { type: 'well', name: 'Spring Well', char: '🚰', color: '#06b6d4', description: 'Cool mountain well.' },
  { type: 'notice_board', name: 'Notice Board', char: '📜', color: '#fbbf24', description: 'Pinned bounty notices.' }
];

const ENEMY_TEMPLATES = [
  { id: 'skeleton', name: 'Skeleton', char: '💀', color: '#e2e8f0', hp: 50, atk: 12, def: 4 },
  { id: 'orc', name: 'Orc Berserker', char: '👹', color: '#22c55e', hp: 90, atk: 18, def: 8 },
  { id: 'goblin', name: 'Goblin Scout', char: '👺', color: '#84cc16', hp: 35, atk: 9, def: 2 },
  { id: 'demon', name: 'Demon Fiend', char: '👿', color: '#ef4444', hp: 120, atk: 22, def: 10 },
  { id: 'boss_dragon', name: 'Elder Wyrm', char: '🐉', color: '#f59e0b', hp: 500, atk: 40, def: 20, isBoss: true }
];

export const GodDungeonEditor: React.FC<GodDungeonEditorProps> = ({
  gameState,
  setGameState,
  onClose,
  triggerSuccessLog,
  playSound
}) => {
  const [dungeonTitle, setDungeonTitle] = useState('Custom Abyss Vault');
  const [dungeonDepth, setDungeonDepth] = useState(3);
  const [dungeonBiome, setDungeonBiome] = useState<'dungeon' | 'crypt' | 'volcanic' | 'ice' | 'forest' | 'town'>('crypt');
  const [gridWidth, setGridWidth] = useState(20);
  const [gridHeight, setGridHeight] = useState(16);

  // Grid array of TileType numbers
  const [mapGrid, setMapGrid] = useState<number[][]>(() => {
    const grid: number[][] = [];
    for (let y = 0; y < 16; y++) {
      const row: number[] = [];
      for (let x = 0; x < 20; x++) {
        if (x === 0 || x === 19 || y === 0 || y === 15) {
          row.push(1); // Wall border
        } else {
          row.push(0); // Floor
        }
      }
      grid.push(row);
    }
    return grid;
  });

  const [playerStart, setPlayerStart] = useState<{ x: number; y: number }>({ x: 2, y: 2 });
  const [propsList, setPropsList] = useState<{ id: string; x: number; y: number; name: string; char: string; color: string; description: string; type: string }[]>([]);
  const [enemiesList, setEnemiesList] = useState<{ id: string; x: number; y: number; name: string; char: string; color: string; hp: number; atk: number; def: number; isBoss?: boolean }[]>([]);

  // Brush Selection
  const [selectedToolCategory, setSelectedToolCategory] = useState<'tiles' | 'props' | 'enemies' | 'player'>('tiles');
  const [selectedTileNum, setSelectedTileNum] = useState<number>(0);
  const [selectedProp, setSelectedProp] = useState<typeof PROP_TEMPLATES[0]>(PROP_TEMPLATES[0]);
  const [selectedEnemy, setSelectedEnemy] = useState<typeof ENEMY_TEMPLATES[0]>(ENEMY_TEMPLATES[0]);

  const [jsonInput, setJsonInput] = useState('');
  const [showJsonModal, setShowJsonModal] = useState(false);
  const [copiedSuccess, setCopiedSuccess] = useState(false);

  // Close JSON modal on Escape key
  useEffect(() => {
    if (!showJsonModal) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        e.stopPropagation();
        setShowJsonModal(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown, true);
    return () => window.removeEventListener('keydown', handleKeyDown, true);
  }, [showJsonModal]);

  // Resize Grid
  const handleResizeGrid = (newW: number, newH: number) => {
    setGridWidth(newW);
    setGridHeight(newH);
    const newGrid: number[][] = [];
    for (let y = 0; y < newH; y++) {
      const row: number[] = [];
      for (let x = 0; x < newW; x++) {
        if (x === 0 || x === newW - 1 || y === 0 || y === newH - 1) {
          row.push(1);
        } else {
          row.push(0);
        }
      }
      newGrid.push(row);
    }
    setMapGrid(newGrid);
    setPropsList([]);
    setEnemiesList([]);
    setPlayerStart({ x: Math.min(2, newW - 2), y: Math.min(2, newH - 2) });
  };

  // Canvas Tile Click Handler
  const handleTileClick = (x: number, y: number) => {
    if (x < 0 || x >= gridWidth || y < 0 || y >= gridHeight) return;

    if (selectedToolCategory === 'player') {
      setPlayerStart({ x, y });
      playSound('click');
      return;
    }

    if (selectedToolCategory === 'tiles') {
      const nextGrid = mapGrid.map(row => [...row]);
      nextGrid[y][x] = selectedTileNum;
      setMapGrid(nextGrid);
      playSound('click');
      return;
    }

    if (selectedToolCategory === 'props') {
      // Clear existing prop at same position
      const filteredProps = propsList.filter(p => p.x !== x || p.y !== y);
      const newProp = {
        id: `prop_${Date.now()}_${Math.random()}`,
        x,
        y,
        name: selectedProp.name,
        char: selectedProp.char,
        color: selectedProp.color,
        description: selectedProp.description,
        type: selectedProp.type
      };
      setPropsList([...filteredProps, newProp]);
      playSound('loot');
      return;
    }

    if (selectedToolCategory === 'enemies') {
      const filteredEnemies = enemiesList.filter(e => e.x !== x || e.y !== y);
      const newEnemy = {
        id: `enemy_${Date.now()}_${Math.random()}`,
        x,
        y,
        name: selectedEnemy.name,
        char: selectedEnemy.char,
        color: selectedEnemy.color,
        hp: selectedEnemy.hp,
        atk: selectedEnemy.atk,
        def: selectedEnemy.def,
        isBoss: selectedEnemy.isBoss
      };
      setEnemiesList([...filteredEnemies, newEnemy]);
      playSound('mutate');
      return;
    }
  };

  // Quick Generator (Random Rooms)
  const handleGenerateRandomCave = () => {
    const nextGrid: number[][] = [];
    for (let y = 0; y < gridHeight; y++) {
      const row: number[] = [];
      for (let x = 0; x < gridWidth; x++) {
        if (x === 0 || x === gridWidth - 1 || y === 0 || y === gridHeight - 1) {
          row.push(1);
        } else {
          row.push(Math.random() < 0.28 ? 1 : 0);
        }
      }
      nextGrid.push(row);
    }
    // Ensure player start position is open floor
    nextGrid[playerStart.y][playerStart.x] = 0;
    setMapGrid(nextGrid);
    playSound('magic_cast');
    triggerSuccessLog('✨ Generated randomized cavern baseline!');
  };

  // Launch Test Play
  const handleLaunchTestPlay = () => {
    setGameState(prev => {
      // Convert mapGrid number matrix to TileType string array matrix
      const formattedMap: TileType[][] = mapGrid.map(row => 
        row.map(val => {
          const match = TILE_PALETTE.find(t => t.num === val);
          return match ? match.type : TileType.Floor;
        })
      );

      // Convert props to game dungeonProps format
      const formattedProps = propsList.map(p => ({
        id: p.id,
        x: p.x,
        y: p.y,
        name: p.name,
        char: p.char,
        color: p.color,
        description: p.description,
        type: p.type as any,
        actionLabel: 'INTERACT',
        isInteracted: false
      }));

      // Convert enemies to game Enemy format
      const formattedEnemies = enemiesList.map(e => ({
        id: e.id,
        x: e.x,
        y: e.y,
        type: e.isBoss ? 'boss_apex' : 'skirmisher',
        name: e.name,
        hp: e.hp,
        maxHp: e.hp,
        atk: e.atk,
        def: e.def,
        range: 1,
        speed: 1,
        color: e.color,
        char: e.char,
        state: 'patrol' as any,
        isElite: false,
        patrolPath: [{ x: e.x, y: e.y }],
        patrolIndex: 0,
        debuffs: [],
        isBoss: e.isBoss
      }));

      return {
        ...prev,
        map: formattedMap,
        levelWidth: gridWidth,
        levelHeight: gridHeight,
        playerX: playerStart.x,
        playerY: playerStart.y,
        depth: dungeonDepth,
        dungeonProps: formattedProps,
        enemies: formattedEnemies as any
      };
    });

    playSound('teleport');
    triggerSuccessLog(`🎮 INSTANT LAUNCH: Playing custom map "${dungeonTitle}" (Depth ${dungeonDepth})!`);
    onClose();
  };

  // Save Blueprint to Modding API Storage
  const handleSaveToModManager = () => {
    const newBlueprint: CustomDungeonBlueprintMod = {
      id: `dungeon_${Date.now()}`,
      name: dungeonTitle,
      depth: dungeonDepth,
      width: gridWidth,
      height: gridHeight,
      biome: dungeonBiome,
      playerStart,
      mapGrid,
      props: propsList,
      enemies: enemiesList
    };

    const existingMods = loadAllMods();
    let customMod = existingMods.find(m => m.id === 'mod_custom_dungeons');

    if (!customMod) {
      customMod = {
        id: 'mod_custom_dungeons',
        title: 'Custom Editor Blueprints Mod',
        author: 'Player World Sculptor',
        version: '1.0.0',
        description: 'Collection of custom player created dungeon blueprints.',
        enabled: true,
        createdAt: new Date().toISOString().split('T')[0],
        customDungeons: [newBlueprint]
      };
    } else {
      customMod.customDungeons = [newBlueprint, ...(customMod.customDungeons || [])];
    }

    saveSingleMod(customMod);
    playSound('mutate');
    triggerSuccessLog(`💾 SAVED: Blueprint "${dungeonTitle}" added to Mod Manager!`);
  };

  // Export JSON
  const handleExportJSON = () => {
    const blueprint: CustomDungeonBlueprintMod = {
      id: `dungeon_${Date.now()}`,
      name: dungeonTitle,
      depth: dungeonDepth,
      width: gridWidth,
      height: gridHeight,
      biome: dungeonBiome,
      playerStart,
      mapGrid,
      props: propsList,
      enemies: enemiesList
    };
    const jsonStr = JSON.stringify(blueprint, null, 2);
    navigator.clipboard.writeText(jsonStr);
    setCopiedSuccess(true);
    setTimeout(() => setCopiedSuccess(false), 2500);
    playSound('loot');
    triggerSuccessLog('📋 EXPORTED: Custom dungeon JSON copied to clipboard!');
  };

  // Import JSON Blueprint
  const handleImportJSON = () => {
    try {
      const parsed = JSON.parse(jsonInput);
      if (!parsed.width || !parsed.height || !parsed.mapGrid) {
        alert('Invalid dungeon blueprint JSON format. Must contain width, height, and mapGrid.');
        return;
      }
      setDungeonTitle(parsed.name || 'Imported Vault');
      setDungeonDepth(parsed.depth || 1);
      setDungeonBiome(parsed.biome || 'crypt');
      setGridWidth(parsed.width);
      setGridHeight(parsed.height);
      setMapGrid(parsed.mapGrid);
      setPlayerStart(parsed.playerStart || { x: 2, y: 2 });
      setPropsList(parsed.props || []);
      setEnemiesList(parsed.enemies || []);
      setShowJsonModal(false);
      playSound('magic_cast');
      triggerSuccessLog('📥 IMPORTED: Blueprint loaded onto editor canvas!');
    } catch (err: any) {
      alert(`JSON Parse Error: ${err.message}`);
    }
  };

  return (
    <div className="flex flex-col h-full overflow-y-auto space-y-4 p-4 bg-slate-900/90 text-slate-200 font-mono text-xs">
      {/* Top Header & Settings */}
      <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-3 flex flex-wrap items-center justify-between gap-3 shadow-lg">
        <div className="flex items-center gap-3">
          <Grid className="w-5 h-5 text-indigo-400" />
          <div>
            <div className="font-bold text-amber-400 flex items-center gap-2">
              <span>CUSTOM DUNGEON EDITOR</span>
              <span className="text-[10px] bg-indigo-950 border border-indigo-500/50 text-indigo-300 px-2 py-0.5 rounded font-mono">
                v5.1.0 Mod API
              </span>
            </div>
            <p className="text-[11px] text-slate-400">Design, paint, test-play, and export custom abyss levels.</p>
          </div>
        </div>

        {/* Primary Launch & Export Buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={handleLaunchTestPlay}
            className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg shadow-md flex items-center gap-1.5 cursor-pointer transition-all hover:scale-105 active:scale-95"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            <span>TEST PLAY NOW</span>
          </button>

          <button
            onClick={handleSaveToModManager}
            className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-lg shadow-md flex items-center gap-1.5 cursor-pointer transition-all hover:scale-105"
          >
            <Save className="w-3.5 h-3.5" />
            <span>Save to Mod API</span>
          </button>

          <button
            onClick={handleExportJSON}
            className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-amber-400 border border-slate-700 rounded-lg flex items-center gap-1 cursor-pointer transition-colors"
            title="Copy Blueprint JSON to Clipboard"
          >
            {copiedSuccess ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copiedSuccess ? 'Copied!' : 'Export JSON'}</span>
          </button>

          <button
            onClick={() => setShowJsonModal(true)}
            className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 rounded-lg flex items-center gap-1 cursor-pointer transition-colors"
          >
            <Upload className="w-3.5 h-3.5 text-sky-400" />
            <span>Import JSON</span>
          </button>
        </div>
      </div>

      {/* Blueprint Metadata Configuration Bar */}
      <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-3 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-xs">
        <div>
          <label className="text-[10px] text-slate-400 block mb-1">Dungeon Title:</label>
          <input
            type="text"
            value={dungeonTitle}
            onChange={(e) => setDungeonTitle(e.target.value)}
            className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-slate-100 font-bold focus:border-indigo-500 outline-none"
          />
        </div>

        <div>
          <label className="text-[10px] text-slate-400 block mb-1">Depth Level (1-20):</label>
          <input
            type="number"
            min="1"
            max="20"
            value={dungeonDepth}
            onChange={(e) => setDungeonDepth(parseInt(e.target.value) || 1)}
            className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-amber-400 font-bold focus:border-indigo-500 outline-none"
          />
        </div>

        <div>
          <label className="text-[10px] text-slate-400 block mb-1">Biome Environment:</label>
          <select
            value={dungeonBiome}
            onChange={(e) => setDungeonBiome(e.target.value as any)}
            className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-indigo-300 font-bold focus:border-indigo-500 outline-none cursor-pointer"
          >
            <option value="crypt">Crypt / Catacombs</option>
            <option value="dungeon">Abyss Dungeon</option>
            <option value="volcanic">Volcanic Chasm</option>
            <option value="ice">Frost Caverns</option>
            <option value="forest">Overworld Forest</option>
            <option value="town">Sanctuary Town</option>
          </select>
        </div>

        <div>
          <label className="text-[10px] text-slate-400 block mb-1">Grid Preset Size:</label>
          <div className="flex gap-1">
            <button
              onClick={() => handleResizeGrid(20, 16)}
              className={`flex-1 py-1 rounded text-[11px] font-bold border transition-colors cursor-pointer ${
                gridWidth === 20 ? 'bg-indigo-600 border-indigo-400 text-white' : 'bg-slate-800 border-slate-700 text-slate-400'
              }`}
            >
              20x16
            </button>
            <button
              onClick={() => handleResizeGrid(24, 18)}
              className={`flex-1 py-1 rounded text-[11px] font-bold border transition-colors cursor-pointer ${
                gridWidth === 24 ? 'bg-indigo-600 border-indigo-400 text-white' : 'bg-slate-800 border-slate-700 text-slate-400'
              }`}
            >
              24x18
            </button>
            <button
              onClick={() => handleResizeGrid(30, 20)}
              className={`flex-1 py-1 rounded text-[11px] font-bold border transition-colors cursor-pointer ${
                gridWidth === 30 ? 'bg-indigo-600 border-indigo-400 text-white' : 'bg-slate-800 border-slate-700 text-slate-400'
              }`}
            >
              30x20
            </button>
          </div>
        </div>
      </div>

      {/* Editor Tool Palette Category Tabs */}
      <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-3 space-y-3">
        <div className="flex items-center justify-between border-b border-slate-800 pb-2">
          <div className="flex gap-2">
            <button
              onClick={() => setSelectedToolCategory('tiles')}
              className={`px-3 py-1 rounded-lg font-bold text-xs flex items-center gap-1 cursor-pointer transition-colors ${
                selectedToolCategory === 'tiles' ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              <Grid className="w-3.5 h-3.5" />
              <span>Tiles</span>
            </button>

            <button
              onClick={() => setSelectedToolCategory('props')}
              className={`px-3 py-1 rounded-lg font-bold text-xs flex items-center gap-1 cursor-pointer transition-colors ${
                selectedToolCategory === 'props' ? 'bg-amber-600 text-white' : 'bg-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Decor Props</span>
            </button>

            <button
              onClick={() => setSelectedToolCategory('enemies')}
              className={`px-3 py-1 rounded-lg font-bold text-xs flex items-center gap-1 cursor-pointer transition-colors ${
                selectedToolCategory === 'enemies' ? 'bg-rose-600 text-white' : 'bg-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Monsters</span>
            </button>

            <button
              onClick={() => setSelectedToolCategory('player')}
              className={`px-3 py-1 rounded-lg font-bold text-xs flex items-center gap-1 cursor-pointer transition-colors ${
                selectedToolCategory === 'player' ? 'bg-emerald-600 text-white' : 'bg-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              <span>Player Spawn (P)</span>
            </button>
          </div>

          <button
            onClick={handleGenerateRandomCave}
            className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-indigo-300 border border-slate-700 rounded-lg text-[11px] font-bold flex items-center gap-1 cursor-pointer"
          >
            <RefreshCw className="w-3 h-3" />
            <span>Random Caves</span>
          </button>
        </div>

        {/* Selected Palette Items Picker */}
        {selectedToolCategory === 'tiles' && (
          <div className="flex flex-wrap gap-1.5">
            {TILE_PALETTE.map(tile => (
              <button
                key={tile.num}
                onClick={() => setSelectedTileNum(tile.num)}
                className={`px-2 py-1 rounded border text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-all ${
                  selectedTileNum === tile.num
                    ? 'bg-indigo-900 border-indigo-400 text-indigo-200 ring-2 ring-indigo-500/50'
                    : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                <span style={{ color: tile.color }} className="font-mono">{tile.char}</span>
                <span>{tile.name}</span>
              </button>
            ))}
          </div>
        )}

        {selectedToolCategory === 'props' && (
          <div className="flex flex-wrap gap-1.5">
            {PROP_TEMPLATES.map(prop => (
              <button
                key={prop.type}
                onClick={() => setSelectedProp(prop)}
                className={`px-2.5 py-1 rounded border text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-all ${
                  selectedProp.type === prop.type
                    ? 'bg-amber-900 border-amber-400 text-amber-200 ring-2 ring-amber-500/50'
                    : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                <span>{prop.char}</span>
                <span>{prop.name}</span>
              </button>
            ))}
          </div>
        )}

        {selectedToolCategory === 'enemies' && (
          <div className="flex flex-wrap gap-1.5">
            {ENEMY_TEMPLATES.map(enemy => (
              <button
                key={enemy.id}
                onClick={() => setSelectedEnemy(enemy)}
                className={`px-2.5 py-1 rounded border text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-all ${
                  selectedEnemy.id === enemy.id
                    ? 'bg-rose-900 border-rose-400 text-rose-200 ring-2 ring-rose-500/50'
                    : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                <span>{enemy.char}</span>
                <span>{enemy.name}</span>
                <span className="text-[10px] opacity-75">(HP {enemy.hp})</span>
              </button>
            ))}
          </div>
        )}

        {selectedToolCategory === 'player' && (
          <div className="text-emerald-400 text-[11px] font-bold flex items-center gap-2">
            <Info className="w-4 h-4 text-emerald-400" />
            <span>Click any tile on the canvas grid below to set the Hero's starting spawn location (P).</span>
          </div>
        )}
      </div>

      {/* Grid Canvas Interactive Map Editor */}
      <div className="bg-slate-950 border border-slate-800 rounded-xl p-3 flex flex-col items-center justify-center overflow-x-auto shadow-2xl">
        <div 
          className="grid gap-0.5 bg-slate-900 p-2 rounded border border-slate-800/80 font-mono select-none"
          style={{ gridTemplateColumns: `repeat(${gridWidth}, minmax(0, 1fr))` }}
        >
          {mapGrid.map((row, y) =>
            row.map((val, x) => {
              const tile = TILE_PALETTE.find(t => t.num === val) || TILE_PALETTE[0];
              const isPlayer = playerStart.x === x && playerStart.y === y;
              const prop = propsList.find(p => p.x === x && p.y === y);
              const enemy = enemiesList.find(e => e.x === x && e.y === y);

              return (
                <div
                  key={`${x}_${y}`}
                  onClick={() => handleTileClick(x, y)}
                  className={`w-6 h-6 flex items-center justify-center text-xs font-bold rounded cursor-pointer transition-all hover:scale-125 hover:z-10 relative ${
                    isPlayer ? 'bg-emerald-950 border border-emerald-400 text-emerald-300 font-extrabold ring-1 ring-emerald-400' :
                    enemy ? 'bg-rose-950 border border-rose-800/80' :
                    prop ? 'bg-amber-950 border border-amber-800/80' :
                    'bg-slate-900 border border-slate-800/40 hover:bg-slate-800'
                  }`}
                  title={`(${x}, ${y}) - ${isPlayer ? 'Player Spawn' : enemy ? enemy.name : prop ? prop.name : tile.name}`}
                >
                  {isPlayer ? (
                    <span className="text-emerald-300 font-extrabold text-sm animate-pulse">P</span>
                  ) : enemy ? (
                    <span style={{ color: enemy.color }}>{enemy.char}</span>
                  ) : prop ? (
                    <span>{prop.char}</span>
                  ) : (
                    <span style={{ color: tile.color }}>{tile.char}</span>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* JSON Import Modal */}
      {showJsonModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-xl max-w-lg w-full p-4 space-y-3 font-mono shadow-2xl">
            <h3 className="text-amber-400 font-bold text-sm flex items-center gap-2">
              <Upload className="w-4 h-4 text-amber-400" />
              <span>IMPORT BLUEPRINT JSON</span>
            </h3>
            <p className="text-[11px] text-slate-400">Paste your custom dungeon blueprint JSON string below to load it into the editor.</p>
            <textarea
              rows={8}
              value={jsonInput}
              onChange={(e) => setJsonInput(e.target.value)}
              placeholder="Paste JSON dungeon blueprint here..."
              className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-xs font-mono text-emerald-300 outline-none focus:border-indigo-500"
            />
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowJsonModal(false)}
                className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded font-bold text-xs"
              >
                Cancel
              </button>
              <button
                onClick={handleImportJSON}
                className="px-3 py-1 bg-indigo-600 hover:bg-indigo-500 text-white rounded font-bold text-xs"
              >
                Load Blueprint
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
