import React from 'react';
import { Heart, Shield, Coins } from 'lucide-react';
import { GameState, WeaponBaseType, EquipmentItem, OverworldChunk } from '../../types';
import { WEAPON_TEMPLATES } from '../../utils/itemsData';
import { SPELLS } from '../../utils/spellsAndEquipment';
import { hasEquippedTrait } from '../../utils/gameUtils';
import { ChunkMinimap } from '../ChunkMinimap';

export interface PlayerSidebarPanelProps {
  gameState: GameState;
  effectiveMaxHp: number;
  effectivePlayerDef: number;
  brokenArmorDefReduction: number;
  selectedSpellId: string;
  setSelectedSpellId: (spellId: string) => void;
  handleUnequipArmor: () => void;
  handleUnequipWeapon: () => void;
  handleUnequipShield?: () => void;
  handleUnequipHelmet?: () => void;
  handleUnequipGloves?: () => void;
  handleUnequipBoots?: () => void;
  handleUnequipAmulet?: () => void;
  handleEquipItem: (item: EquipmentItem, hand?: 'right' | 'left') => void;
  setIsWorldMapOpen?: (open: boolean) => void;
  onOpenWorldMap?: () => void;
}

export const PlayerSidebarPanel: React.FC<PlayerSidebarPanelProps> = ({
  gameState,
  effectiveMaxHp,
  effectivePlayerDef,
  brokenArmorDefReduction,
  selectedSpellId,
  setSelectedSpellId,
  handleUnequipArmor,
  handleUnequipWeapon,
  handleUnequipShield,
  handleUnequipHelmet,
  handleUnequipGloves,
  handleUnequipBoots,
  handleUnequipAmulet,
  handleEquipItem,
  setIsWorldMapOpen,
  onOpenWorldMap,
}) => {
  return (
    <div id="player-sidebar-panel" className="lg:col-span-3 flex flex-col gap-4 overflow-y-auto order-2 lg:order-none select-none">
      {/* 1. Attributes panel */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow flex flex-col gap-3">
        <div className="border-b border-slate-800 pb-1.5 flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-300">Adventurer Specs</span>
          <span className="text-[10px] bg-slate-950 px-1.5 py-0.5 rounded font-mono text-slate-400">LVL {gameState.playerStats.level}</span>
        </div>

        {/* Stat meters list */}
        <div className="flex flex-col gap-2.5">
          {/* HP */}
          <div className="flex flex-col">
            <div className="flex justify-between text-[10px] font-mono mb-1 text-slate-400">
              <span className="flex items-center gap-1"><Heart className="w-3.5 h-3.5 text-rose-500" /> Vitals HP</span>
              <span className="text-slate-200">{gameState.playerStats.hp}/{effectiveMaxHp}</span>
            </div>
            <div className="w-full h-1.5 bg-slate-950 rounded-full overflow-hidden">
              <div
                className="h-full bg-rose-500 transition-all duration-300"
                style={{ width: `${Math.min(100, (gameState.playerStats.hp / effectiveMaxHp) * 100)}%` }}
              />
            </div>
          </div>

          {/* MP */}
          <div className="flex flex-col">
            <div className="flex justify-between text-[10px] font-mono mb-1 text-slate-400">
              <span className="flex items-center gap-1">⚡ Focus MP</span>
              <span className="text-slate-200">{gameState.playerStats.mp}/{gameState.playerStats.maxMp}</span>
            </div>
            <div className="w-full h-1.5 bg-slate-950 rounded-full overflow-hidden">
              <div
                className="h-full bg-blue-500 transition-all duration-300"
                style={{ width: `${(gameState.playerStats.mp / gameState.playerStats.maxMp) * 100}%` }}
              />
            </div>
          </div>

          {/* XP */}
          <div className="flex flex-col">
            <div className="flex justify-between text-[10px] font-mono mb-1 text-slate-400">
              <span>🌟 Experiential XP</span>
              <span className="text-slate-200">{gameState.playerStats.xp} / {gameState.playerStats.nextLevelXp}</span>
            </div>
            <div className="w-full h-1.5 bg-slate-950 rounded-full overflow-hidden">
              <div
                className="h-full bg-emerald-500 transition-all duration-300"
                style={{ width: `${(gameState.playerStats.xp / gameState.playerStats.nextLevelXp) * 100}%` }}
              />
            </div>
          </div>
        </div>

        {/* Secondary elements (base attack additions & gold) */}
        <div className="grid grid-cols-2 gap-2 mt-1.5 pt-2 border-t border-slate-800 text-[10px] font-mono text-slate-400">
          <div className="flex items-center gap-1.5 bg-slate-950/40 p-1.5 rounded border border-slate-800/50">
            <Shield className="w-3.5 h-3.5 text-blue-500" />
            <span>Def: <strong className="text-white">{effectivePlayerDef}</strong>{brokenArmorDefReduction > 0 && <span className="text-rose-500 text-[8.5px] font-bold" title="Def reduction from broken armor pieces"> (-{brokenArmorDefReduction})</span>}</span>
          </div>
          <div className="flex items-center gap-1.5 bg-slate-950/40 p-1.5 rounded border border-slate-800/50">
            <Coins className="w-3.5 h-3.5 text-amber-500" />
            <span>Gold: <strong className="text-white">{gameState.playerStats.gold}</strong></span>
          </div>
        </div>

        {/* Town Reputation Status */}
        {gameState.isOverworld && (
          <div className="mt-2.5 pt-2 border-t border-slate-800 flex flex-col">
            <div className="flex justify-between text-[10px] font-mono mb-1 text-slate-400">
              <span className="flex items-center gap-1.5">
                ⚖️ Town Reputation
              </span>
              <span className={`font-bold ${(gameState.townReputation ?? 100) >= 80 ? 'text-emerald-400' : (gameState.townReputation ?? 100) >= 50 ? 'text-teal-400' : 'text-rose-400'}`}>
                {Math.round(gameState.townReputation ?? 100)}% {(gameState.townReputation ?? 100) >= 80 ? '(Pristine)' : (gameState.townReputation ?? 100) >= 50 ? '(Pardoned)' : '(Wanted)'}
              </span>
            </div>
            <div className="w-full h-1.5 bg-slate-950 rounded-full overflow-hidden">
              <div
                className={`h-full transition-all duration-300 ${(gameState.townReputation ?? 100) >= 80 ? 'bg-emerald-500' : (gameState.townReputation ?? 100) >= 50 ? 'bg-teal-500' : 'bg-rose-500'}`}
                style={{ width: `${gameState.townReputation ?? 100}%` }}
              />
            </div>
            {/* Active Caravan License Badge */}
            {gameState.hasActiveCaravanLicense && (
              <div className="mt-2.5 flex flex-col">
                <div className="flex items-center gap-2 bg-amber-500/10 border border-amber-500/20 text-[10px] p-1.5 rounded text-amber-300 font-sans">
                  <span className="text-xs">📜</span>
                  <div className="leading-tight">
                    <div className="font-bold uppercase tracking-wider text-[8.5px] text-amber-400">Rare Trade License Active</div>
                    <div className="text-[8px] text-slate-400 font-mono">+30% Sale Profit & 20% Buy Discount</div>
                  </div>
                </div>
              </div>
            )}

            {/* Active Enchanted Traits Panel */}
            {(() => {
              const activeTraits = [];
              if (hasEquippedTrait(gameState, 'STALLION_SPEED')) activeTraits.push({ id: 'STALLION_SPEED', label: 'Stallion Speed', icon: '🏇', desc: 'Overworld speed upgraded (3m/turn)' });
              if (hasEquippedTrait(gameState, 'DESERT_IMMUNITY')) activeTraits.push({ id: 'DESERT_IMMUNITY', label: 'Desert Immunity', icon: '🌵', desc: 'Protected from sandstorms & heat fatigue' });
              if (hasEquippedTrait(gameState, 'WORG_FORCE')) activeTraits.push({ id: 'WORG_FORCE', label: 'Worg Force', icon: '🐺', desc: '+3 Attack damage & Pacifies wild Wolves' });
              if (hasEquippedTrait(gameState, 'SWAMP_GLIDE')) activeTraits.push({ id: 'SWAMP_GLIDE', label: 'Swamp-Glide', icon: '🐊', desc: 'High speed in swamps & swim water' });
              if (hasEquippedTrait(gameState, 'NON_SLIPPERY')) activeTraits.push({ id: 'NON_SLIPPERY', label: 'Non-Slippery', icon: '🥾', desc: 'Immune to wet/muddy slips & blizzard freeze' });

              if (activeTraits.length === 0) return null;

              return (
                <div className="mt-2 flex flex-col gap-1.5">
                  <div className="text-[9px] font-bold uppercase tracking-wider text-teal-400 font-mono mb-0.5">Forged Enchantments</div>
                  {activeTraits.map(tr => (
                    <div key={tr.id} className="flex items-center gap-2 bg-teal-950/40 border border-teal-500/20 text-[10px] p-2 rounded text-teal-300 font-sans">
                      <span className="text-xs">{tr.icon}</span>
                      <div className="leading-tight">
                        <div className="font-bold uppercase tracking-wider text-[8px] text-teal-400">{tr.label}</div>
                        <div className="text-[8px] text-slate-400 font-mono">{tr.desc}</div>
                      </div>
                    </div>
                  ))}
                </div>
              );
            })()}
          </div>
        )}
      </div>

      {/* 2. Equipped weapon card and alloy combination details */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow flex flex-col gap-2 relative overflow-hidden">
        <div className="text-xs font-bold uppercase tracking-wider text-slate-300 border-b border-slate-800 pb-1.5 flex justify-between items-center">
          <span>Active Weaponry</span>
          <span className="text-[9px] font-mono text-slate-500">Custom Forged</span>
        </div>

        {gameState.currentWeapon && (
          <div className="flex flex-col mt-1">
            <div className="flex items-center gap-2">
              <span className="text-2xl bounce-subtle">
                {WEAPON_TEMPLATES[gameState.currentWeapon.baseType]?.icon || '⚔️'}
              </span>
              <div>
                <h4
                  className="text-xs font-bold uppercase tracking-wide font-sans text-shadow-glow"
                  style={{ color: gameState.currentWeapon.color }}
                >
                  {gameState.currentWeapon.name}
                </h4>
                <p className="text-[10px] text-slate-400 font-mono">
                  Base: {gameState.currentWeapon.baseType} Class
                </p>
              </div>
            </div>

            {/* Weapon properties listing block */}
            <div className="bg-slate-950 border border-slate-850 rounded p-2.5 mt-2.5 flex flex-col gap-1 text-[10px] font-mono text-slate-400 leading-relaxed">
              <div className="flex justify-between">
                <span>Physical Base:</span>
                <span className="text-white font-bold">{gameState.currentWeapon.damage} Dmg</span>
              </div>
              <div className="flex justify-between">
                <span>Critical Threshold :</span>
                <span className="text-amber-500">{(gameState.currentWeapon.critChance * 100).toFixed(0)}%</span>
              </div>
              <div className="flex justify-between">
                <span>Maximum Reach:</span>
                <span className="text-sky-400">{gameState.currentWeapon.range} Tiles</span>
              </div>
              <div className="flex justify-between">
                <span>Infused Material:</span>
                <span className="text-slate-300 font-semibold">{gameState.currentWeapon.materialUsed?.name || 'Forged Alloy'}</span>
              </div>
              <div className="flex justify-between">
                <span>Infused Catalyst:</span>
                <span className="text-[#a855f7]" style={{ color: gameState.currentWeapon.catalystUsed?.color || '#a855f7' }}>
                  {gameState.currentWeapon.catalystUsed?.damageType || 'Physical'}
                </span>
              </div>
              
              <p className="border-t border-slate-800/80 pt-1.5 mt-1 text-[9px] text-slate-500 italic leading-snug">
                {gameState.currentWeapon.effectDescription}
              </p>
            </div>

            {/* Magic Spell Tuning Grimoire Panel */}
            {(() => {
              const isMagic = gameState.currentWeapon && (gameState.currentWeapon.baseType === WeaponBaseType.Staff || gameState.currentWeapon.baseType === WeaponBaseType.Wand);
              if (!isMagic) return null;
              return (
                <div className="mt-3 border-t border-slate-800/80 pt-3">
                  <span className="text-[10px] font-mono tracking-wider text-[#a855f7] uppercase font-bold flex items-center gap-1">
                    📖 Grimoire Spell Tuning
                  </span>
                  <div className="grid grid-cols-5 gap-1 mt-2">
                    {SPELLS.map((spell) => {
                      const isSelected = selectedSpellId === spell.id;
                      const finalCost = gameState.currentWeapon?.baseType === WeaponBaseType.Wand ? Math.max(2, spell.manaCost - 1) : spell.manaCost;
                      return (
                        <button
                          key={spell.id}
                          onClick={() => setSelectedSpellId(spell.id)}
                          className={`h-10 rounded-lg flex flex-col items-center justify-center transition-all cursor-pointer border ${
                            isSelected
                              ? 'bg-[#8b5cf6]/20 border-[#a855f7] text-[#c084fc] shadow-md shadow-[#8b5cf6]/10'
                              : 'bg-slate-950 hover:bg-slate-850 border-slate-850 text-slate-400 hover:text-slate-200'
                          }`}
                          title={`${spell.name} (${finalCost} MP): ${spell.description}`}
                        >
                          <span className="text-sm">{spell.icon}</span>
                          <span className="text-[8px] font-mono mt-0.5">{finalCost} MP</span>
                        </button>
                      );
                    })}
                  </div>
                  
                  {/* Selected Spell Details */}
                  {(() => {
                    const spell = SPELLS.find(s => s.id === selectedSpellId) || SPELLS[0];
                    const finalCost = gameState.currentWeapon?.baseType === WeaponBaseType.Wand ? Math.max(2, spell.manaCost - 1) : spell.manaCost;
                    return (
                      <div className="bg-slate-950 border border-[#a855f7]/30 rounded p-2 mt-2 text-[10px] font-sans leading-relaxed text-slate-300">
                        <div className="flex justify-between items-center border-b border-slate-850 pb-1 mb-1">
                          <span className="font-bold text-[#c084fc] flex items-center gap-1">
                            {spell.icon} {spell.name}
                          </span>
                          <span className="font-mono text-[9px] text-purple-400 bg-purple-950/40 px-1.5 py-0.5 rounded border border-purple-900/30">
                            Cost: {finalCost} MP
                          </span>
                        </div>
                        <p className="text-slate-400 text-[9.5px] leading-tight mb-1">{spell.description}</p>
                        <p className="text-[#a78bfa] text-[9px] font-mono font-semibold">{spell.effectDescription}</p>
                      </div>
                    );
                  })()}
                </div>
              );
            })()}
          </div>
        )}
      </div>

      {/* 2.5 Equipped Gear & Stash Section */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow flex flex-col gap-3">
        <div className="text-xs font-bold uppercase tracking-wider text-slate-300 border-b border-slate-800 pb-1.5 flex justify-between items-center">
          <span>🛡️ WORN GEAR & WEAPONRY</span>
          <span className="text-[9px] font-mono text-slate-500">Active Loadout</span>
        </div>

        {/* Right Hand / Main Weapon */}
        <div className="bg-slate-950/40 p-2.5 border border-slate-850 rounded-lg flex flex-col gap-1">
          <span className="text-[9px] text-slate-500 uppercase tracking-wider font-sans">⚔️ Right Hand (Weapon):</span>
          {gameState.currentWeapon ? (
            <div className="flex justify-between items-center bg-slate-900 border border-slate-800 px-2 py-1.5 rounded">
              <div className="flex items-center gap-1.5 min-w-0">
                <span className="text-sm font-bold shrink-0">⚔️</span>
                <div className="flex flex-col truncate">
                  <span className="text-[11px] font-semibold truncate" style={{ color: gameState.currentWeapon.color }}>{gameState.currentWeapon.name}</span>
                  <span className="text-[9px] text-slate-400 font-mono">ATK: +{gameState.currentWeapon.damage} Dmg {gameState.currentWeapon.durability !== undefined && `(${gameState.currentWeapon.durability}% Dur)`}</span>
                </div>
              </div>
              <button
                onClick={handleUnequipWeapon}
                className="px-2 py-0.5 bg-rose-950/25 hover:bg-rose-950/60 border border-rose-900/40 text-[9px] text-rose-400 font-bold rounded cursor-pointer shrink-0 ml-2"
                title="Doff weapon to backpack"
              >
                Doff
              </button>
            </div>
          ) : (
            <div className="text-[10px] text-slate-500 bg-slate-950/50 px-2 py-1.5 text-center rounded border border-dashed border-slate-850 italic">
              Bare Fists (4 Base DMG)
            </div>
          )}
        </div>

        {/* Left Hand / Offhand Shield */}
        <div className="bg-slate-950/40 p-2.5 border border-slate-850 rounded-lg flex flex-col gap-1">
          <span className="text-[9px] text-slate-500 uppercase tracking-wider font-sans">🛡️ Left Hand (Shield / Offhand):</span>
          {gameState.equippedShield ? (
            <div className="flex justify-between items-center bg-slate-900 border border-slate-800 px-2 py-1.5 rounded">
              <div className="flex items-center gap-1.5 min-w-0">
                <span className="text-sm font-bold shrink-0" style={{ color: gameState.equippedShield.color || '#38bdf8' }}>🛡️</span>
                <div className="flex flex-col truncate">
                  <span className="text-[11px] font-semibold truncate text-sky-300" style={{ color: gameState.equippedShield.color }}>{gameState.equippedShield.name}</span>
                  <span className="text-[9px] text-emerald-400 font-mono">Blocks: +{gameState.equippedShield.defense} DEF {gameState.equippedShield.durability !== undefined && `(${gameState.equippedShield.durability}% Dur)`}</span>
                </div>
              </div>
              <button
                onClick={handleUnequipShield}
                className="px-2 py-0.5 bg-rose-950/25 hover:bg-rose-950/60 border border-rose-900/40 text-[9px] text-rose-400 font-bold rounded cursor-pointer shrink-0 ml-2"
                title="Doff shield to backpack"
              >
                Doff
              </button>
            </div>
          ) : (
            <div className="text-[10px] text-slate-500 bg-slate-950/50 px-2 py-1.5 text-center rounded border border-dashed border-slate-850 italic">
              Empty Offhand (No Shield equipped)
            </div>
          )}
        </div>

        {/* Body Armor */}
        <div className="bg-slate-950/40 p-2.5 border border-slate-850 rounded-lg flex flex-col gap-1">
          <span className="text-[9px] text-slate-500 uppercase tracking-wider font-sans">🦺 Body Armor:</span>
          {gameState.equippedArmor ? (
            <div className="flex justify-between items-center bg-slate-900 border border-slate-800 px-2 py-1.5 rounded">
              <div className="flex items-center gap-1.5 min-w-0">
                <span className="text-sm font-bold shrink-0" style={{ color: gameState.equippedArmor.color }}>🦺</span>
                <div className="flex flex-col truncate">
                  <span className="text-[11px] font-semibold text-slate-200 truncate">{gameState.equippedArmor.name}</span>
                  <span className="text-[9px] text-slate-400 font-mono">Blocks: +{gameState.equippedArmor.defense} DEF {gameState.equippedArmor.durability !== undefined && `(${gameState.equippedArmor.durability}% Dur)`}</span>
                </div>
              </div>
              <button
                onClick={handleUnequipArmor}
                className="px-2 py-0.5 bg-rose-950/20 hover:bg-rose-950/50 border border-rose-900/40 text-[9px] text-rose-400 font-bold rounded cursor-pointer shrink-0 ml-2"
                title="Doff armor to backpack"
              >
                Doff
              </button>
            </div>
          ) : (
            <div className="text-center py-1.5 text-[10px] text-slate-600 italic bg-slate-950/60 rounded border border-dashed border-slate-850">
              No Armor Equipped (0 DEF protection)
            </div>
          )}
        </div>

        {/* Other Equipped Accessories (Helmet, Gloves, Boots, Amulet) */}
        {(gameState.equippedHelmet || gameState.equippedGloves || gameState.equippedBoots || gameState.equippedAmulet) && (
          <div className="bg-slate-950/40 p-2 border border-slate-850 rounded-lg flex flex-col gap-1 text-[10px]">
            <span className="text-[9px] text-slate-500 uppercase tracking-wider font-sans">Equipped Accessories:</span>
            {gameState.equippedHelmet && (
              <div className="flex justify-between items-center bg-slate-900/70 border border-slate-800/80 px-2 py-1 rounded">
                <span className="text-slate-300 truncate text-[10px]">🪖 {gameState.equippedHelmet.name} (+{gameState.equippedHelmet.defense} DEF)</span>
                {handleUnequipHelmet && (
                  <button onClick={handleUnequipHelmet} className="text-rose-400 text-[8.5px] hover:underline font-mono">Doff</button>
                )}
              </div>
            )}
            {gameState.equippedGloves && (
              <div className="flex justify-between items-center bg-slate-900/70 border border-slate-800/80 px-2 py-1 rounded">
                <span className="text-slate-300 truncate text-[10px]">🧤 {gameState.equippedGloves.name} (+{gameState.equippedGloves.defense} DEF)</span>
                {handleUnequipGloves && (
                  <button onClick={handleUnequipGloves} className="text-rose-400 text-[8.5px] hover:underline font-mono">Doff</button>
                )}
              </div>
            )}
            {gameState.equippedBoots && (
              <div className="flex justify-between items-center bg-slate-900/70 border border-slate-800/80 px-2 py-1 rounded">
                <span className="text-slate-300 truncate text-[10px]">👢 {gameState.equippedBoots.name} (+{gameState.equippedBoots.defense} DEF)</span>
                {handleUnequipBoots && (
                  <button onClick={handleUnequipBoots} className="text-rose-400 text-[8.5px] hover:underline font-mono">Doff</button>
                )}
              </div>
            )}
            {gameState.equippedAmulet && (
              <div className="flex justify-between items-center bg-slate-900/70 border border-slate-800/80 px-2 py-1 rounded">
                <span className="text-amber-300 truncate text-[10px]">📿 {gameState.equippedAmulet.name}</span>
                {handleUnequipAmulet && (
                  <button onClick={handleUnequipAmulet} className="text-rose-400 text-[8.5px] hover:underline font-mono">Doff</button>
                )}
              </div>
            )}
          </div>
        )}

        {/* Equipment Inventory Bag list */}
        <div className="flex flex-col gap-1.5 max-h-[160px] overflow-y-auto pr-1">
          <span className="text-[9px] text-slate-500 uppercase tracking-wide font-sans">Backpack Gear ({gameState.equipmentInventory.length}):</span>
          {gameState.equipmentInventory.length > 0 ? (
            gameState.equipmentInventory.map((item) => (
              <div key={item.id} className="flex items-center justify-between bg-slate-950/50 p-2 border border-slate-850 rounded text-[10px] gap-2">
                <div className="flex flex-col truncate flex-1">
                  <span className="font-semibold text-slate-100 truncate" style={{ color: item.color }}>
                    {item.name}
                  </span>
                  <span className="text-[9px] text-slate-500 font-mono">
                    {item.subType === 'Scroll'
                      ? 'Consumable teleportation'
                      : item.type === 'weapon'
                      ? `Damage: +${item.damage}`
                      : item.subType === 'Shield'
                      ? `Shield DEF: +${item.defense}`
                      : `Armor DEF: +${item.defense}`}
                  </span>
                </div>
                {item.subType === 'Scroll' ? (
                  <button
                    onClick={() => handleEquipItem(item)}
                    className="px-2 py-1 text-slate-950 text-[9px] font-bold rounded cursor-pointer bg-pink-500 hover:bg-pink-400"
                  >
                    Use
                  </button>
                ) : item.subType === 'Shield' ? (
                  <button
                    onClick={() => handleEquipItem(item, 'left')}
                    className="px-2 py-1 text-slate-950 text-[9px] font-bold rounded cursor-pointer bg-sky-500 hover:bg-sky-400"
                    title="Equip Shield to Left Hand"
                  >
                    🛡️ Equip
                  </button>
                ) : (
                  <button
                    onClick={() => handleEquipItem(item, 'right')}
                    className="px-2 py-1 text-slate-950 text-[9px] font-bold rounded cursor-pointer bg-amber-500 hover:bg-amber-400"
                  >
                    ⚡ Equip
                  </button>
                )}
              </div>
            ))
          ) : (
            <div className="text-[10px] text-slate-600 italic text-center py-2 border border-dashed border-slate-850 rounded">Bag is currently empty.</div>
          )}
        </div>
      </div>

      {/* 2.7 Chunk Minimap tracker */}
      <ChunkMinimap
        playerX={gameState.playerX}
        playerY={gameState.playerY}
        currentChunkX={gameState.currentChunkX}
        currentChunkY={gameState.currentChunkY}
        visitedTiles={gameState.visitedTiles}
        discovered={gameState.discovered}
        map={gameState.map}
        pois={gameState.overworldChunks[`${gameState.currentChunkX},${gameState.currentChunkY}`]?.pois || []}
        attunedWaystones={gameState.attunedWaystones || []}
        onOpenWorldMap={onOpenWorldMap || (setIsWorldMapOpen ? () => setIsWorldMapOpen(true) : undefined)}
      />

      {/* Active Watchtower Sieges Block */}
      {(() => {
        const overworldChunksList = Object.values(gameState.overworldChunks || {}) as OverworldChunk[];
        const activeSieges = overworldChunksList.filter(c => c.watchtower && c.watchtower.siegeState?.isUnderSiege);
        if (activeSieges.length === 0) return null;
        
        return (
          <div className="bg-slate-900 border border-red-900/40 rounded-xl p-3 flex flex-col gap-2 shadow-lg animate-fade-in text-left">
            <div className="text-[10px] font-bold uppercase tracking-wider text-red-500 border-b border-red-950/40 pb-1 flex justify-between items-center">
              <span className="flex items-center gap-1">
                <span className="animate-ping inline-block w-2 h-2 rounded-full bg-red-500 mr-1" />
                📡 WATCHTOWER SIEGES
              </span>
              <span className="text-[9px] font-mono text-red-400">
                ({activeSieges.length} Active)
              </span>
            </div>
            <div className="flex flex-col gap-2 max-h-[160px] overflow-y-auto pr-1">
              {activeSieges.map((chunk) => {
                const wt = chunk.watchtower!;
                const sState = wt.siegeState!;
                
                const dx = chunk.chunkX - gameState.currentChunkX;
                const dy = chunk.chunkY - gameState.currentChunkY;
                const dist = Math.max(Math.abs(dx), Math.abs(dy));
                
                let dirStr = "";
                if (dy < 0) dirStr += "North";
                else if (dy > 0) dirStr += "South";
                if (dx < 0) dirStr += "West";
                else if (dx > 0) dirStr += "East";
                if (!dirStr) dirStr = "CURRENT SECTOR";
                else dirStr = `${dirStr} (${dist} ${dist === 1 ? 'Sector' : 'Sectors'} away)`;

                const attackerLabel = sState.attacker === 'syndicate' ? 'Syndicate' : (sState.attacker === 'vanguard' ? 'Vanguard' : 'Bandits');
                const attackerColor = sState.attacker === 'vanguard' ? 'text-sky-400' : (sState.attacker === 'syndicate' ? 'text-purple-400' : 'text-orange-500');
                
                const defenderLabel = sState.defender === 'syndicate' ? 'Syndicate' : (sState.defender === 'vanguard' ? 'Vanguard' : (sState.defender === 'bandits' ? 'Bandits' : 'Neutral'));
                const defenderColor = sState.defender === 'vanguard' ? 'text-sky-400' : (sState.defender === 'syndicate' ? 'text-purple-400' : (sState.defender === 'bandits' ? 'text-orange-500' : 'text-slate-400'));

                const timerLow = sState.siegeTimerSeconds < 30;

                return (
                  <div key={wt.id} className="bg-slate-950/90 border border-slate-850 p-2.5 rounded flex flex-col gap-1.5">
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] font-bold text-slate-200">Sector [{chunk.chunkX}, {chunk.chunkY}]</span>
                      <span className={`text-[10px] font-mono font-bold ${timerLow ? 'text-red-500 animate-pulse' : 'text-amber-400'}`}>
                        ⏱️ {sState.siegeTimerSeconds}s
                      </span>
                    </div>
                    
                    <div className="text-[10px] text-slate-400 flex items-center gap-1 flex-wrap">
                      <span className={attackerColor + " font-bold"}>{attackerLabel}</span>
                      <span>besieging</span>
                      <span className={defenderColor + " font-bold"}>{defenderLabel}</span>
                    </div>

                    <div className="text-[9px] font-mono text-slate-500 flex items-center justify-between mt-0.5">
                      <span>🧭 {dirStr}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })()}

      {/* Active Rumors Block */}
      {gameState.purchasedRumors && gameState.purchasedRumors.length > 0 && (
        <div className="bg-slate-900 border border-amber-900/40 rounded-xl p-3 flex flex-col gap-2 shadow-lg animate-fade-in text-left">
          <div className="text-[10px] font-bold uppercase tracking-wider text-amber-500 border-b border-amber-950/40 pb-1 flex justify-between items-center">
            <span>📜 ACTIVE RUMORS</span>
            <span className="text-[9px] font-mono text-slate-500">({gameState.purchasedRumors.length})</span>
          </div>
          <div className="flex flex-col gap-1.5 max-h-[140px] overflow-y-auto pr-1">
            {gameState.purchasedRumors.map((rumor, index) => (
              <div key={index} className="bg-slate-950/80 border border-slate-850 p-2 rounded text-[10px] text-slate-300 text-left leading-normal">
                {rumor}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default PlayerSidebarPanel;
