import React from 'react';
import { ChunkMapInfo, CustomMapPin } from './types';
import { Skull, MapPin, Navigation, Sparkles, Plus, Edit3, X, Compass, Wind, Mountain, Droplets, ShieldAlert, Trees, Package, Route, Gauge } from 'lucide-react';

export interface WorldMapChunkTooltipProps {
  chunk: ChunkMapInfo | null;
  isCurrentHeroChunk: boolean;
  currentChunkX?: number;
  currentChunkY?: number;
  onFastTravel?: (chunkX: number, chunkY: number, name: string) => void;
  onOpenPinEditor?: (chunkX: number, chunkY: number, existingPin?: CustomMapPin | null) => void;
  onClose?: () => void;
}

interface BiomeDetail {
  label: string;
  emoji: string;
  badgeClass: string;
  climate: string;
  resources: string[];
  hazards: string;
  lore: string;
}

const getBiomeDetail = (biome: string, chunk?: ChunkMapInfo | null): BiomeDetail => {
  // 1. Starting Town (Oakhaven Village, [0, 0])
  if (chunk && chunk.chunkX === 0 && chunk.chunkY === 0) {
    return {
      label: 'Oakhaven Village (Starting Town)',
      emoji: '🏡',
      badgeClass: 'bg-emerald-950/80 border-emerald-500/50 text-emerald-300',
      climate: 'Temperate Woodlands & Peaceful Skies',
      resources: ['Sunder Guild Hall', 'Blacksmith Forge', 'Apothecary Wares', 'Tavern Inn & Rations', 'Crafting Anvil'],
      hazards: 'Safe Haven (Open rustic settlement protected by sentries, no fortress walls)',
      lore: 'A peaceful starting woodland village nestled in the Whispering Wilds without restrictive walls, featuring a cobblestone town center, friendly shopkeepers, tavern, and the Sunder Guild Hall.'
    };
  }

  // 2. Coastal Harbor Port (Vanguard Port, [3, -2] or any port)
  if (chunk && (chunk.hasHarbor || (chunk.chunkX === 3 && chunk.chunkY === -2))) {
    return {
      label: 'Vanguard Harbor Port',
      emoji: '⛵',
      badgeClass: 'bg-sky-950/80 border-sky-500/50 text-sky-300',
      climate: 'Ocean Breeze & Maritime Salt Mist',
      resources: ['HMS Tidebreaker Galleon', 'Fresh Fish Market', 'Cargo Wharf & Crane', 'Salty Siren Tavern', 'Maritime Trade'],
      hazards: 'Safe Coastal Port (Deep coastal waters at the docks)',
      lore: 'A bustling coastal port connecting the continent to distant maritime trade routes, complete with wooden piers, seafaring galleons, and fresh fishmongers.'
    };
  }

  // 3. Fortified Citadel / Stronghold (Walled Castle Towns)
  if (chunk && chunk.isCastleTown) {
    return {
      label: 'Walled Citadel / Stronghold',
      emoji: '🏰',
      badgeClass: 'bg-amber-950/80 border-amber-500/50 text-amber-300',
      climate: 'Fortified Bastion & Heavy Garrisons',
      resources: ['Armory Forges', 'Castle Keep', 'Royal Stockpile', 'Military Barracks'],
      hazards: 'Guarded Perimeter Gates & Watchtower Sentries',
      lore: 'A heavily fortified stone citadel surrounded by thick curtain walls, iron portcullis gates, and disciplined guard garrisons.'
    };
  }

  // 4. Open Frontier Settlement / Town
  if (biome === 'town' || (chunk && chunk.hasTown)) {
    return {
      label: 'Frontier Village',
      emoji: '🏘️',
      badgeClass: 'bg-yellow-950/80 border-yellow-500/50 text-yellow-300',
      climate: 'Civilized Haven & Local Settlers',
      resources: ['Local Smithy', 'Herbalist Dispensary', 'General Store', 'Inn Rest Beds'],
      hazards: 'Safe Zone Protected by Village Sentries',
      lore: 'An open frontier settlement providing rest, trade supplies, and shelter for wandering adventurers.'
    };
  }

  // Natural Biomes
  switch (biome) {
    case 'coral_reef':
      return {
        label: 'Sunken Coral Reef',
        emoji: '🪸',
        badgeClass: 'bg-cyan-950/80 border-cyan-500/50 text-cyan-300',
        climate: 'Tropical Maritime & Tidal Surges',
        resources: ['Sea Salt', 'Deep Corals', 'Fresh Catch', 'Sunken Relics', 'Aqua Crystals'],
        hazards: 'Tidal Surges, Coral Stalkers, Deep Drowners & Scalding Geysers',
        lore: 'Shallow coastal lagoons, tidal reefs, and submerged ruins vibrant with marine life, tidal springs, and sunken treasures.'
      };
    case 'volcanic':
      return {
        label: 'Volcanic Caldera',
        emoji: '🌋',
        badgeClass: 'bg-red-950/80 border-red-500/50 text-red-300',
        climate: 'Superheated Air, Molten Heat & Ashfall',
        resources: ['Obsidian Glass', 'Sulfur Ash', 'Molten Ore', 'Fire Lotus', 'Magma Crystals'],
        hazards: 'Lethal Magma Pools, Ash Storms, Fire Imps & Magma Eruptions',
        lore: 'Scorching igneous fissures and bubbling magma vents where extreme geothermal pressure forges rare obsidian glass.'
      };
    case 'glacial':
      return {
        label: 'Glacial Ice Caverns',
        emoji: '🧊',
        badgeClass: 'bg-blue-950/80 border-blue-400/50 text-blue-200',
        climate: 'Sub-Zero Permafrost & Howling Blizzards',
        resources: ['Glacial Ice Shards', 'Cryo Crystals', 'Frost Lotus', 'Permafrost Ore'],
        hazards: 'Extreme Hypothermia, Slippery Ice, Frost Horrors & Frostbite Vents',
        lore: 'Massive frozen glaciers and crystallized cavern complexes enduring eternal winter and razor-sharp frost winds.'
      };
    case 'forest':
      return {
        label: 'Woodland Forest',
        emoji: '🌲',
        badgeClass: 'bg-emerald-950/80 border-emerald-500/50 text-emerald-300',
        climate: 'Temperate Canopy & Mild Showers',
        resources: ['Hardwood Timber', 'Sweet Berries', 'Wild Herbs', 'Animal Pelts', 'Copper Ore'],
        hazards: 'Wolf Packs, Forest Spiders & Roaming Bandits',
        lore: 'Lush verdant woodlands sheltering abundant game, ancient leafy groves, berry bushes, and rich timber resources.'
      };
    case 'tundra':
      return {
        label: 'Frost Tundra',
        emoji: '❄️',
        badgeClass: 'bg-sky-950/80 border-sky-500/50 text-sky-300',
        climate: 'Frigid Winds, Frostbitten Air & Snowfall',
        resources: ['Pine Timber', 'Frost Berries', 'White Fur', 'Cold Iron Ore'],
        hazards: 'Biting Frost, Ice Wolves, Snow Stalkers & Spike Traps',
        lore: 'Vast snowbound plains and hardy boreal taiga enduring sub-zero gales and drifting snowbanks.'
      };
    case 'desert':
      return {
        label: 'Arid Desert',
        emoji: '🏜️',
        badgeClass: 'bg-amber-950/80 border-amber-500/50 text-amber-300',
        climate: 'Scorching Heat, Arid Winds & Sandstorms',
        resources: ['Desert Clay', 'Cactus Needles', 'Fire Salts', 'Sunstone', 'Gold Ore'],
        hazards: 'Dehydration, Sand Spiders, Giant Scorpions & Hidden Fire Vents',
        lore: 'Endless sunscorched sand dunes and sandstone canyons concealing the buried stone relics of lost sun empires.'
      };
    case 'swamp':
      return {
        label: 'Mire Marshlands',
        emoji: '🌿',
        badgeClass: 'bg-lime-950/80 border-lime-500/50 text-lime-300',
        climate: 'Humid Miasma, Dense Fog & Heavy Rain',
        resources: ['Medicinal Reeds', 'Bog Iron', 'Alchemical Slime', 'Poison Spores', 'Shadow Moss'],
        hazards: 'Toxic Mists, Quicksand Pools, Mire Serpents & Poison Gas Vents',
        lore: 'Murky waterways and decaying bogs rich in rare apothecary herbs, peat bogs, and potent alchemical catalysts.'
      };
    case 'mountain':
      return {
        label: 'Granite Peaks',
        emoji: '🏔️',
        badgeClass: 'bg-slate-900 border-slate-700 text-slate-200',
        climate: 'Alpine Winds, Rocky Mists & Thin Air',
        resources: ['Iron Ore', 'Copper Veins', 'Gemstones', 'Granite Stone', 'Mithril Shards'],
        hazards: 'Steep Cliffs, Harpies, Crag Golems & Spike Traps',
        lore: 'Jagged mountain ranges and high crags concealing deep subterranean ore lodes and ancient dwarven shafts.'
      };
    default:
      return {
        label: 'Wilderness Sector',
        emoji: '🗺️',
        badgeClass: 'bg-slate-900 border-slate-700 text-slate-300',
        climate: 'Varied Wilderness Climate',
        resources: ['Regional Flora', 'Raw Stone', 'Wild Game'],
        hazards: 'Wilderness Creatures',
        lore: 'An untamed regional quadrant awaiting explorer survey and charting.'
      };
  }
};

const getThreatInfo = (tier: number) => {
  switch (tier) {
    case 1: return { text: 'Tier 1 • Peaceful', color: 'text-emerald-400', bg: 'bg-emerald-950/40 border-emerald-500/30' };
    case 2: return { text: 'Tier 2 • Moderate', color: 'text-yellow-400', bg: 'bg-yellow-950/40 border-yellow-500/30' };
    case 3: return { text: 'Tier 3 • Perilous', color: 'text-amber-400', bg: 'bg-amber-950/40 border-amber-500/30' };
    case 4: return { text: 'Tier 4 • Lethal', color: 'text-rose-400', bg: 'bg-rose-950/40 border-rose-500/30' };
    default: return { text: `Tier ${tier} • Cataclysmic`, color: 'text-purple-400', bg: 'bg-purple-950/40 border-purple-500/30' };
  }
};

const getElevationLabel = (elevation: number) => {
  const pct = Math.round(elevation * 100);
  if (pct < 30) return `${pct}% • Lowlands`;
  if (pct < 65) return `${pct}% • Plateau`;
  return `${pct}% • High Crags`;
};

const getMoistureLabel = (moisture: number) => {
  const pct = Math.round(moisture * 100);
  if (pct < 25) return `${pct}% • Arid`;
  if (pct < 65) return `${pct}% • Temperate`;
  return `${pct}% • Wetland`;
};

export const WorldMapChunkTooltip: React.FC<WorldMapChunkTooltipProps> = ({
  chunk,
  isCurrentHeroChunk,
  currentChunkX,
  currentChunkY,
  onFastTravel,
  onOpenPinEditor,
  onClose
}) => {
  if (!chunk) {
    return (
      <div className="p-3 bg-slate-950/95 border border-slate-800 rounded-xl text-xs text-slate-400 flex items-center gap-2 shadow-2xl backdrop-blur-md">
        <Compass className="w-4 h-4 text-amber-500/80 animate-spin-slow shrink-0" />
        <span className="leading-tight">Tap or hover on any regional sector to inspect cartographic intelligence.</span>
      </div>
    );
  }

  // Calculate distance from hero chunk if known
  const distance = (typeof currentChunkX === 'number' && typeof currentChunkY === 'number')
    ? Math.max(Math.abs(chunk.chunkX - currentChunkX), Math.abs(chunk.chunkY - currentChunkY))
    : null;

  if (!chunk.isDiscovered) {
    return (
      <div className="p-3.5 sm:p-4 bg-slate-950/95 border border-slate-800 rounded-2xl text-xs text-slate-300 shadow-2xl backdrop-blur-md max-h-[60vh] sm:max-h-[70vh] overflow-y-auto">
        <div className="flex items-start justify-between gap-2 mb-2">
          <div>
            <div className="flex items-center gap-2 font-bold text-slate-200">
              <span className="text-base">🌫️</span>
              <span className="text-sm">Uncharted Frontier</span>
              <span className="font-mono text-[10px] text-amber-400/90 bg-slate-900 px-1.5 py-0.5 rounded border border-slate-800">
                [{chunk.chunkX}, {chunk.chunkY}]
              </span>
            </div>
            {distance !== null && distance > 0 && (
              <div className="text-[10px] text-slate-400 mt-0.5">
                Distance: <span className="font-mono text-amber-300">{distance}</span> {distance === 1 ? 'sector' : 'sectors'} away
              </div>
            )}
          </div>

          <div className="flex items-center gap-1.5">
            {onOpenPinEditor && (
              <button
                onClick={() => onOpenPinEditor(chunk.chunkX, chunk.chunkY, null)}
                className="px-2.5 py-1.5 bg-amber-500/15 hover:bg-amber-500/25 active:scale-95 text-amber-300 border border-amber-500/40 rounded-lg text-[11px] font-bold flex items-center gap-1 cursor-pointer transition-all shadow-sm"
                title="Add a custom explorer pin to this sector"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Mark Pin</span>
              </button>
            )}
            {onClose && (
              <button
                onClick={onClose}
                className="p-1 hover:bg-slate-800 text-slate-400 hover:text-slate-200 rounded-md transition-colors cursor-pointer"
                title="Dismiss inspector"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        <p className="text-[11px] text-slate-400 leading-relaxed italic bg-slate-900/60 p-2.5 rounded-xl border border-slate-800/80">
          This sector is shrouded by the fog of war. Journey into this wilderness quadrant or acquire regional cartographer maps to reveal terrain, settlements, and hidden dungeons.
        </p>
      </div>
    );
  }

  const biomeDetail = getBiomeDetail(chunk.biome, chunk);
  const threatInfo = getThreatInfo(chunk.threatTier);
  const primaryPin = chunk.customPins && chunk.customPins.length > 0 ? chunk.customPins[0] : null;

  return (
    <div className="p-3.5 sm:p-4 bg-slate-950/95 border border-slate-800/90 rounded-2xl shadow-2xl backdrop-blur-md text-slate-200 max-h-[60vh] sm:max-h-[70vh] overflow-y-auto space-y-3">
      {/* Top Header Row */}
      <div className="flex items-start justify-between gap-2 border-b border-slate-800/80 pb-2.5">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="text-sm sm:text-base font-bold text-slate-100 flex items-center gap-1.5 truncate">
              <span className="truncate">{chunk.regionName}</span>
            </h3>
            <span className="font-mono text-[11px] text-amber-400 bg-slate-900 px-1.5 py-0.5 rounded border border-slate-800 shrink-0">
              [{chunk.chunkX}, {chunk.chunkY}]
            </span>
          </div>

          <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
            {/* Biome Badge */}
            <span className={`text-[10px] px-2 py-0.5 rounded-full border font-semibold flex items-center gap-1 ${biomeDetail.badgeClass}`}>
              <span>{biomeDetail.emoji}</span>
              <span>{biomeDetail.label}</span>
            </span>

            {isCurrentHeroChunk && (
              <span className="text-[10px] bg-amber-500/20 text-amber-300 border border-amber-500/40 px-2 py-0.5 rounded-full font-bold flex items-center gap-1">
                📍 Current Location
              </span>
            )}

            {distance !== null && !isCurrentHeroChunk && (
              <span className="text-[10px] bg-slate-900 text-slate-400 border border-slate-800 px-1.5 py-0.5 rounded font-mono">
                {distance} {distance === 1 ? 'Sector' : 'Sectors'} away
              </span>
            )}

            {chunk.hasWaystone && (
              <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold border flex items-center gap-1 ${
                chunk.isWaystoneAttuned
                  ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40 animate-pulse'
                  : 'bg-slate-900 text-slate-400 border-slate-800'
              }`}>
                <Sparkles className="w-3 h-3" />
                <span>{chunk.isWaystoneAttuned ? 'Attuned Waystone' : 'Dormant Waystone'}</span>
              </span>
            )}
          </div>
        </div>

        {/* Header Action Controls */}
        <div className="flex items-center gap-1.5 shrink-0">
          {onOpenPinEditor && (
            <button
              onClick={() => onOpenPinEditor(chunk.chunkX, chunk.chunkY, primaryPin)}
              className="px-2.5 py-1 bg-amber-500/15 hover:bg-amber-500/25 active:scale-95 text-amber-300 border border-amber-500/40 rounded-lg text-[10px] font-bold flex items-center gap-1 cursor-pointer transition-all shadow-sm"
              title={primaryPin ? 'Edit pin on this sector' : 'Place custom pin on this sector'}
            >
              {primaryPin ? <Edit3 className="w-3 h-3" /> : <Plus className="w-3 h-3" />}
              <span>{primaryPin ? 'Edit Pin' : 'Mark Pin'}</span>
            </button>
          )}

          {chunk.isWaystoneAttuned && !isCurrentHeroChunk && onFastTravel && (
            <button
              onClick={() => onFastTravel(chunk.chunkX, chunk.chunkY, chunk.waystoneName || chunk.regionName)}
              className="px-2.5 py-1 bg-sky-600 hover:bg-sky-500 active:scale-95 text-white rounded-lg text-[10px] font-bold flex items-center gap-1 cursor-pointer transition-all shadow-md"
              title="Fast Travel to this Waystone"
            >
              <Navigation className="w-3 h-3" />
              <span>Teleport</span>
            </button>
          )}

          {onClose && (
            <button
              onClick={onClose}
              className="p-1 hover:bg-slate-800 text-slate-400 hover:text-slate-200 rounded-md transition-colors cursor-pointer ml-1"
              title="Dismiss inspector"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Cartographic Intelligence Metrics Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-[10px] font-mono">
        <div className={`p-2 rounded-xl border ${threatInfo.bg}`}>
          <span className="text-slate-400 block text-[9px] font-sans flex items-center gap-1">
            <Skull className="w-2.5 h-2.5 text-rose-400" /> THREAT RATING
          </span>
          <span className={`font-bold block mt-0.5 ${threatInfo.color}`}>
            {threatInfo.text}
          </span>
        </div>

        <div className="p-2 bg-slate-900/80 rounded-xl border border-slate-800">
          <span className="text-slate-400 block text-[9px] font-sans flex items-center gap-1">
            <Mountain className="w-2.5 h-2.5 text-slate-300" /> ELEVATION
          </span>
          <span className="font-bold text-slate-200 block mt-0.5">
            {getElevationLabel(chunk.elevation)}
          </span>
        </div>

        <div className="p-2 bg-slate-900/80 rounded-xl border border-slate-800">
          <span className="text-slate-400 block text-[9px] font-sans flex items-center gap-1">
            <Droplets className="w-2.5 h-2.5 text-cyan-400" /> MOISTURE
          </span>
          <span className="font-bold text-cyan-300 block mt-0.5">
            {getMoistureLabel(chunk.moisture)}
          </span>
        </div>

        <div className="p-2 bg-slate-900/80 rounded-xl border border-slate-800">
          <span className="text-slate-400 block text-[9px] font-sans flex items-center gap-1">
            <Gauge className="w-2.5 h-2.5 text-amber-400" /> TRAVERSAL
          </span>
          <span className={`font-bold block mt-0.5 ${chunk.traversalIndex?.ratingColor || 'text-amber-300'}`}>
            {chunk.traversalIndex ? `${chunk.traversalIndex.speedPct}% • ${chunk.traversalIndex.rating}` : 'Standard'}
          </span>
        </div>

        <div className="p-2 bg-slate-900/80 rounded-xl border border-slate-800 col-span-2 sm:col-span-1">
          <span className="text-slate-400 block text-[9px] font-sans flex items-center gap-1">
            <MapPin className="w-2.5 h-2.5 text-amber-400" /> LANDMARKS
          </span>
          <span className="font-bold text-amber-300 block mt-0.5">
            {chunk.pois.length} Discovered
          </span>
        </div>
      </div>

      {/* Sector Traversal & Terrain Movement Summary */}
      {chunk.traversalIndex && (
        <div className="flex items-center justify-between px-2.5 py-1.5 bg-slate-900/90 border border-slate-800/80 rounded-xl text-[10px] font-mono">
          <span className="text-slate-400 flex items-center gap-1 font-sans">
            <Route className="w-3 h-3 text-amber-400 shrink-0" />
            <span className="text-slate-300">Terrain Traversal Cost:</span>
          </span>
          <span className="text-slate-200 font-semibold truncate ml-1 text-right">
            {chunk.traversalIndex.terrainModifier}
          </span>
        </div>
      )}

      {/* Biome Atmosphere, Lore & Gatherable Resources */}
      <div className="bg-slate-900/70 border border-slate-800/90 rounded-xl p-2.5 space-y-2 text-xs">
        <div className="text-[11px] text-slate-300 leading-relaxed italic">
          "{biomeDetail.lore}"
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[10px] pt-1 border-t border-slate-800/60">
          <div>
            <span className="text-slate-400 font-bold uppercase tracking-wider block mb-1 flex items-center gap-1">
              <Trees className="w-3 h-3 text-emerald-400" /> Abundant Resources
            </span>
            <div className="flex flex-wrap gap-1">
              {biomeDetail.resources.map((res, i) => (
                <span key={i} className="px-1.5 py-0.5 bg-slate-950 border border-slate-800 rounded text-slate-300">
                  {res}
                </span>
              ))}
            </div>
          </div>

          <div>
            <span className="text-slate-400 font-bold uppercase tracking-wider block mb-1 flex items-center gap-1">
              <ShieldAlert className="w-3 h-3 text-rose-400" /> Environmental Hazards
            </span>
            <p className="text-rose-300/90 bg-rose-950/20 border border-rose-900/30 px-2 py-1 rounded">
              {biomeDetail.hazards}
            </p>
          </div>
        </div>
      </div>

      {/* Custom Player Pins Card if any */}
      {chunk.customPins && chunk.customPins.length > 0 && (
        <div className="p-2.5 bg-amber-500/10 border border-amber-500/25 rounded-xl text-xs space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="font-bold text-amber-300 flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5" />
              <span>Player Expedition Pin: {chunk.customPins[0].label}</span>
            </span>
            {onOpenPinEditor && (
              <button
                onClick={() => onOpenPinEditor(chunk.chunkX, chunk.chunkY, chunk.customPins![0])}
                className="text-[10px] text-amber-400 hover:text-amber-200 underline font-bold cursor-pointer"
              >
                Edit
              </button>
            )}
          </div>
          {chunk.customPins[0].notes && (
            <p className="text-slate-300 italic text-[11px] bg-slate-950/60 p-2 rounded-lg border border-amber-500/20">
              {chunk.customPins[0].notes}
            </p>
          )}
        </div>
      )}

      {/* Points of Interest Section */}
      <div className="space-y-1.5">
        <span className="text-[10px] font-bold tracking-wider text-slate-400 uppercase flex items-center gap-1">
          <Package className="w-3 h-3 text-sky-400" /> Discovered Points of Interest ({chunk.pois.length})
        </span>

        {chunk.pois.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
            {chunk.pois.map((poi, idx) => (
              <div
                key={idx}
                className="p-2 bg-slate-900/80 border border-slate-800 rounded-lg text-xs flex items-center justify-between gap-2"
              >
                <div className="flex items-center gap-1.5 min-w-0">
                  <span className="text-base shrink-0">
                    {poi.type === 'town' && '🏰'}
                    {poi.type === 'harbor' && '⛵'}
                    {poi.type === 'dungeon' && '⚔️'}
                    {poi.type === 'shrine' && '✨'}
                    {poi.type === 'watchtower' && '🏹'}
                    {poi.type === 'ruin' && '🏛️'}
                    {poi.type === 'camp' && '🏕️'}
                  </span>
                  <div className="truncate">
                    <div className="font-bold text-slate-200 truncate text-[11px]">
                      {poi.name}
                    </div>
                    <div className="text-[9px] text-slate-400 uppercase tracking-wide">
                      {poi.type === 'town' && 'Civilized Settlement'}
                      {poi.type === 'harbor' && 'Coastal Harbor Port'}
                      {poi.type === 'dungeon' && 'Subterranean Dungeon Vault'}
                      {poi.type === 'shrine' && 'Ancient Relic Shrine'}
                      {poi.type === 'watchtower' && 'Wilderness Sentry Watchtower'}
                      {poi.type === 'ruin' && 'Forgotten Empire Ruins'}
                      {poi.type === 'camp' && 'Explorer Campfire'}
                    </div>
                  </div>
                </div>

                {poi.hasWaystone && (
                  <span className="text-cyan-400 text-xs shrink-0 flex items-center gap-0.5 bg-cyan-950/60 px-1.5 py-0.5 rounded border border-cyan-500/30" title="Ancient Leyline Waystone">
                    🌀
                  </span>
                )}
              </div>
            ))}
          </div>
        ) : (
          <p className="text-[11px] text-slate-500 italic bg-slate-900/40 p-2 rounded-lg border border-slate-800/60">
            No major structures or civilized settlements discovered in this sector yet.
          </p>
        )}
      </div>
    </div>
  );
};
