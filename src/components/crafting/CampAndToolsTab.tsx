/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Compass, Hammer } from 'lucide-react';
import { RecipeCard, IngredientRequirement } from './RecipeCard';

export interface CampAndToolsTabProps {
  scrapWoodCount: number;
  ironCount: number;
  dragonScaleCount: number;
  feyBoneCount: number;
  shadowCatalystCount: number;
  onPlaceCampfire?: () => void;
  onPlaceAnvil?: () => void;
  onPlaceBedroll?: () => void;
  onPlaceFieldTent?: () => void;
  onCraftFishingPole?: () => void;
  onCraftLockpicks?: () => void;
  onCraftHatchet?: () => void;
  onCraftPickaxe?: () => void;
  onCraftRecallScroll?: () => void;
  searchQuery?: string;
}

export const CampAndToolsTab: React.FC<CampAndToolsTabProps> = ({
  scrapWoodCount,
  ironCount,
  dragonScaleCount,
  feyBoneCount,
  shadowCatalystCount,
  onPlaceCampfire,
  onPlaceAnvil,
  onPlaceBedroll,
  onPlaceFieldTent,
  onCraftFishingPole,
  onCraftLockpicks,
  onCraftHatchet,
  onCraftPickaxe,
  onCraftRecallScroll,
  searchQuery = '',
}) => {
  const tools = [
    {
      id: 'campfire',
      title: 'Campfire Structure',
      icon: '🔥',
      description: 'Deploys a permanent Campfire tile (🔥) adjacent to you. Used for resting and campfire gourmet cooking.',
      categoryBadge: 'Camp Structure',
      materials: [
        { id: 'mat_wood', name: 'Scrap Wood', required: 3, owned: scrapWoodCount },
      ],
      canCraft: scrapWoodCount >= 3,
      onCraft: () => onPlaceCampfire?.(),
      buttonLabel: 'Deploy Campfire',
      color: 'amber' as const,
    },
    {
      id: 'bedroll',
      title: "Traveler's Survival Bedroll",
      icon: '🛏️',
      description: 'Deploys a portable Bedroll tile (🛏️) on adjacent ground. Allows sleeping, restoring stamina, and resting anywhere in the wilderness.',
      categoryBadge: 'Camp Structure',
      materials: [
        { id: 'mat_wood', name: 'Scrap Wood', required: 2, owned: scrapWoodCount },
      ],
      canCraft: scrapWoodCount >= 2,
      onCraft: () => onPlaceBedroll?.(),
      buttonLabel: 'Deploy Bedroll',
      color: 'amber' as const,
    },
    {
      id: 'tent',
      title: 'Expedition Field Tent',
      icon: '⛺',
      description: 'Pitches a heavy 4-season canvas tent (⛺). Grants +25% rest recovery, complete weather protection against hypothermia/blizzards, and cuts nocturnal ambush risk by 50%!',
      categoryBadge: 'Shelter',
      materials: [
        { id: 'mat_wood', name: 'Scrap Wood', required: 4, owned: scrapWoodCount },
        { id: 'mat_iron', name: 'Iron Ingot', required: 1, owned: ironCount },
      ],
      canCraft: scrapWoodCount >= 4 && ironCount >= 1,
      onCraft: () => onPlaceFieldTent?.(),
      buttonLabel: 'Pitch Field Tent',
      color: 'emerald' as const,
    },
    {
      id: 'portable_anvil',
      title: 'Portable Blacksmith Anvil',
      icon: '⚒️',
      description: 'Deploys an Anvil tile (⚒️) adjacent to you. Allows forging, mutating, and upgrading gear anywhere in the field!',
      categoryBadge: 'Field Workbench',
      materials: [
        { id: 'mat_iron', name: 'Iron Ingot', required: 5, owned: ironCount },
        { id: 'mat_wood', name: 'Scrap Wood', required: 2, owned: scrapWoodCount },
      ],
      canCraft: ironCount >= 5 && scrapWoodCount >= 2,
      onCraft: () => onPlaceAnvil?.(),
      buttonLabel: 'Deploy Portable Anvil',
      color: 'amber' as const,
    },
    {
      id: 'fishing_pole',
      title: 'Ancient Fishing Pole',
      icon: '🎣',
      description: 'Enables fishing in rivers, ponds, and deep ocean shores to capture Raw Fish ingredients.',
      categoryBadge: 'Harvesting Tool',
      materials: [
        { id: 'mat_wood', name: 'Scrap Wood', required: 2, owned: scrapWoodCount },
        { id: 'mat_iron', name: 'Iron Ingot', required: 1, owned: ironCount },
      ],
      canCraft: scrapWoodCount >= 2 && ironCount >= 1,
      onCraft: () => onCraftFishingPole?.(),
      buttonLabel: 'Assemble Fishing Pole',
      color: 'sky' as const,
    },
    {
      id: 'lockpicks',
      title: 'Tension Lockpicks (x3)',
      icon: '🔑',
      description: 'High-tensile picks used to pick locked iron chests and dungeon grates discovered during exploration.',
      categoryBadge: 'Dungeon Tool',
      materials: [
        { id: 'mat_iron', name: 'Iron Ingot', required: 1, owned: ironCount },
      ],
      canCraft: ironCount >= 1,
      onCraft: () => onCraftLockpicks?.(),
      buttonLabel: 'Craft Lockpicks (x3)',
      color: 'amber' as const,
    },
    {
      id: 'hatchet',
      title: 'Lumberjack Hatchet',
      icon: '🪓',
      description: 'Harvests wood and logs automatically from inventory or hand when chopping trees. Unrepairable.',
      categoryBadge: 'Harvesting Tool',
      materials: [
        { id: 'mat_iron', name: 'Iron Ingot', required: 1, owned: ironCount },
        { id: 'mat_wood', name: 'Scrap Wood', required: 2, owned: scrapWoodCount },
      ],
      canCraft: ironCount >= 1 && scrapWoodCount >= 2,
      onCraft: () => onCraftHatchet?.(),
      buttonLabel: 'Forge Lumberjack Hatchet',
      color: 'amber' as const,
    },
    {
      id: 'pickaxe',
      title: 'Prospector Pickaxe',
      icon: '⛏️',
      description: 'Extracts iron ore veins and obsidian crystal clusters found throughout deep caverns.',
      categoryBadge: 'Mining Tool',
      materials: [
        { id: 'mat_iron', name: 'Iron Ingot', required: 2, owned: ironCount },
        { id: 'mat_wood', name: 'Scrap Wood', required: 2, owned: scrapWoodCount },
      ],
      canCraft: ironCount >= 2 && scrapWoodCount >= 2,
      onCraft: () => onCraftPickaxe?.(),
      buttonLabel: 'Forge Prospector Pickaxe',
      color: 'amber' as const,
    },
    {
      id: 'recall_scroll',
      title: 'Scroll of Recall',
      icon: '📜',
      description: 'Instantly teleports you back to Oakhaven sanctuary town square from anywhere in the world.',
      categoryBadge: 'Teleportation',
      materials: [
        { id: 'mat_dragon_scale', name: 'Wyrm Scale', required: 1, owned: dragonScaleCount },
        { id: 'mat_fey_bone', name: 'Relic Bone', required: 1, owned: feyBoneCount },
      ],
      catalysts: [
        { id: 'cat_shadow', name: 'Echo Stone', required: 1, owned: shadowCatalystCount },
      ],
      canCraft: dragonScaleCount >= 1 && feyBoneCount >= 1 && shadowCatalystCount >= 1,
      onCraft: () => onCraftRecallScroll?.(),
      buttonLabel: 'Inscribe Scroll of Recall',
      color: 'sky' as const,
    },
  ];

  const filteredTools = tools.filter((t) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return t.title.toLowerCase().includes(q) || t.description.toLowerCase().includes(q);
  });

  return (
    <div className="flex-1 overflow-y-auto p-5 space-y-5" id="survival_camping_tab">
      <div className="max-w-5xl mx-auto space-y-5">
        <div className="flex items-center justify-between border-b border-slate-800/80 pb-2">
          <div className="flex items-center gap-2.5">
            <span className="text-xl">⛺</span>
            <div>
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-200">
                Camp & Survival Tools Assembly
              </h3>
              <p className="text-[10px] text-slate-400 font-mono">
                Prepare deployable field structures, resource harvesting gear, and emergency teleportation scrolls
              </p>
            </div>
          </div>
          <span className="text-[10px] font-mono text-slate-400">
            Showing {filteredTools.length} blueprints
          </span>
        </div>

        {/* Informative tutorial panel */}
        <div className="bg-slate-950/80 border border-amber-500/30 rounded-2xl p-4 flex items-start gap-3 shadow-lg">
          <Compass className="w-5 h-5 text-amber-400 mt-0.5 shrink-0" />
          <div className="text-xs leading-relaxed text-slate-300">
            <p>
              <strong className="text-amber-400 font-bold">Wilderness Survival Tip:</strong> Stand next to any pine tree or lush vegetation <span className="text-emerald-400 font-bold">🌲</span> in the Overworld and walk into it to harvest timber!
            </p>
            <p className="mt-1 text-[11px] text-slate-400 font-mono">
              Felling trees awards <strong className="text-amber-300 font-bold">Scrap Wood</strong>, enabling campfire pitching, survival bedrolls, and tool handles anywhere.
            </p>
          </div>
        </div>

        {/* Grid of Tools */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredTools.map((tool) => (
            <RecipeCard
              key={tool.id}
              id={tool.id}
              title={tool.title}
              icon={tool.icon}
              description={tool.description}
              categoryBadge={tool.categoryBadge}
              materials={tool.materials}
              catalysts={tool.catalysts}
              canCraft={tool.canCraft}
              onCraft={tool.onCraft}
              craftButtonLabel={tool.buttonLabel}
              disabledReason={!tool.canCraft ? 'Missing required materials' : undefined}
              themeColor={tool.color}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default CampAndToolsTab;
