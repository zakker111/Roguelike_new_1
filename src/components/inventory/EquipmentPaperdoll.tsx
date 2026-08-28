/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { GameState, EquipmentItem, CraftedWeapon, isTwoHandedWeapon } from '../../types';
import { getItemDurabilityDecay } from '../../utils/spellsAndEquipment';

interface EquipmentPaperdollProps {
  gameState: GameState;
  handleUnequipHelmet: () => void;
  handleUnequipArmor: () => void;
  handleUnequipBoots: () => void;
  handleUnequipWeapon: () => void;
  handleUnequipShield: () => void;
  handleUnequipGloves: () => void;
  handleUnequipAmulet: () => void;
}

export const renderItemDurability = (
  dur: number | undefined,
  max: number | undefined,
  item?: EquipmentItem | CraftedWeapon
) => {
  if (dur === undefined || max === undefined) return null;
  const pct = max > 0 ? (dur / max) * 100 : 100;
  const finalPct = Math.min(100, Math.max(0, pct));
  let colorClass = 'text-emerald-400';
  if (dur === 0) colorClass = 'text-rose-500 font-bold';
  else if (finalPct < 25) colorClass = 'text-amber-500 font-semibold animate-pulse';
  else if (finalPct < 60) colorClass = 'text-yellow-400';

  // Calculate wear/decay factor if item is provided
  let decayMultiplier = 1;
  if (item) {
    decayMultiplier = getItemDurabilityDecay(item, 1);
  }

  return (
    <div
      className="flex flex-col w-full px-1 items-center mt-0.5"
      title={
        decayMultiplier > 1
          ? `Wear Rate: ${decayMultiplier}x. Powerful, upgraded, or mutated gear decays faster in combat.`
          : undefined
      }
    >
      <span
        className={`text-[7px] font-mono leading-none ${colorClass} flex items-center justify-center gap-0.5`}
      >
        {dur === 0 ? '🛠️ BROKEN' : `⚡ ${dur}/${max}`}
        {decayMultiplier > 1 && (
          <span
            className="text-[6.5px] font-bold text-rose-400"
            title={`Wear factor: ${decayMultiplier}x. This gear is fragile!`}
          >
            ({decayMultiplier}x ⚠️)
          </span>
        )}
      </span>
      <div className="w-full h-[2.5px] bg-slate-950 rounded-full mt-0.5 overflow-hidden border border-slate-900">
        <div
          className={`h-full transition-all duration-300 ${
            dur === 0
              ? 'bg-rose-500'
              : finalPct < 25
              ? 'bg-amber-500'
              : 'bg-emerald-500'
          }`}
          style={{ width: `${finalPct}%` }}
        />
      </div>
    </div>
  );
};

export const EquipmentPaperdoll: React.FC<EquipmentPaperdollProps> = ({
  gameState,
  handleUnequipHelmet,
  handleUnequipArmor,
  handleUnequipBoots,
  handleUnequipWeapon,
  handleUnequipShield,
  handleUnequipGloves,
  handleUnequipAmulet,
}) => {
  return (
    <div className="grid grid-cols-12 gap-3 items-center justify-center bg-slate-950/80 p-3 rounded-2xl border border-slate-800 shadow-inner">
      {/* Left Column equipment slots: Head, Body, Feet */}
      <div className="col-span-3 flex flex-col gap-3">
        {/* Helmet slot */}
        <div className="flex flex-col items-center">
          <span className="text-[9px] text-slate-400 uppercase font-mono font-bold mb-1">
            Helmet
          </span>
          {gameState.equippedHelmet ? (
            <button
              onClick={handleUnequipHelmet}
              className="w-14 h-14 bg-slate-900 border border-slate-700 hover:border-rose-500 rounded-xl flex flex-col items-center justify-center p-1 cursor-pointer transition-all shadow-lg text-center hover:scale-105"
              title="Click to unequip helmet"
            >
              <span className="text-lg">🪖</span>
              <span
                className="text-[7.5px] text-slate-300 font-semibold truncate w-full"
                style={{ color: gameState.equippedHelmet.color }}
              >
                {gameState.equippedHelmet.name}
              </span>
              {renderItemDurability(
                gameState.equippedHelmet.durability,
                gameState.equippedHelmet.maxDurability,
                gameState.equippedHelmet
              )}
            </button>
          ) : (
            <div className="w-14 h-14 border border-dashed border-slate-800 bg-slate-900/40 rounded-xl flex flex-col items-center justify-center text-slate-600">
              <span className="text-base opacity-40">🪖</span>
              <span className="text-[7px] font-mono mt-0.5 text-slate-500">Empty</span>
            </div>
          )}
        </div>

        {/* Chest/Armor slot */}
        <div className="flex flex-col items-center">
          <span className="text-[9px] text-slate-400 uppercase font-mono font-bold mb-1">
            Plate
          </span>
          {gameState.equippedArmor ? (
            <button
              onClick={handleUnequipArmor}
              className="w-14 h-14 bg-slate-900 border border-slate-700 hover:border-rose-500 rounded-xl flex flex-col items-center justify-center p-1 cursor-pointer transition-all shadow-lg text-center hover:scale-105"
              title="Click to unequip body armor"
            >
              <span className="text-lg">🛡️</span>
              <span
                className="text-[7.5px] text-slate-300 font-semibold truncate w-full"
                style={{ color: gameState.equippedArmor.color }}
              >
                {gameState.equippedArmor.name}
              </span>
              {renderItemDurability(
                gameState.equippedArmor.durability,
                gameState.equippedArmor.maxDurability,
                gameState.equippedArmor
              )}
            </button>
          ) : (
            <div className="w-14 h-14 border border-dashed border-slate-800 bg-slate-900/40 rounded-xl flex flex-col items-center justify-center text-slate-600">
              <span className="text-base opacity-40">🛡️</span>
              <span className="text-[7px] font-mono mt-0.5 text-slate-500">Empty</span>
            </div>
          )}
        </div>

        {/* Boots slot */}
        <div className="flex flex-col items-center">
          <span className="text-[9px] text-slate-400 uppercase font-mono font-bold mb-1">
            Boots
          </span>
          {gameState.equippedBoots ? (
            <button
              onClick={handleUnequipBoots}
              className="w-14 h-14 bg-slate-900 border border-slate-700 hover:border-rose-500 rounded-xl flex flex-col items-center justify-center p-1 cursor-pointer transition-all shadow-lg text-center hover:scale-105"
              title="Click to unequip boots"
            >
              <span className="text-lg">🥾</span>
              <span
                className="text-[7.5px] text-slate-300 font-semibold truncate w-full"
                style={{ color: gameState.equippedBoots.color }}
              >
                {gameState.equippedBoots.name}
              </span>
              {renderItemDurability(
                gameState.equippedBoots.durability,
                gameState.equippedBoots.maxDurability,
                gameState.equippedBoots
              )}
            </button>
          ) : (
            <div className="w-14 h-14 border border-dashed border-slate-800 bg-slate-900/40 rounded-xl flex flex-col items-center justify-center text-slate-600">
              <span className="text-base opacity-40">🥾</span>
              <span className="text-[7px] font-mono mt-0.5 text-slate-500">Empty</span>
            </div>
          )}
        </div>
      </div>

      {/* CENTER PICTURE CARD: Humanoid Avatar Wireframe */}
      <div className="col-span-6 flex flex-col items-center justify-center relative bg-slate-900/70 rounded-2xl border border-slate-800 p-3 h-full min-h-[200px] overflow-hidden shadow-inner">
        {/* Circular glow grids behind humanoid */}
        <div
          className="absolute w-36 h-36 rounded-full border border-amber-500/10 animate-spin"
          style={{ animationDuration: '24s' }}
        />
        <div className="absolute top-0 bottom-0 left-1/2 w-[1px] bg-amber-500/10" />
        <div className="absolute left-0 right-0 top-1/2 h-[1px] bg-amber-500/10" />

        {/* Scars overlay badge in avatar box */}
        {gameState.playerStats.scars && gameState.playerStats.scars.length > 0 && (
          <div className="absolute top-2 right-2 bg-rose-950/80 border border-rose-500/40 px-2 py-0.5 rounded-md flex items-center gap-1 animate-pulse z-10 shadow-sm">
            <span className="text-[8px] text-rose-400 font-mono font-bold">
              🩹 {gameState.playerStats.scars.length}{' '}
              {gameState.playerStats.scars.length === 1 ? 'SCAR' : 'SCARS'}
            </span>
          </div>
        )}

        {/* Battle Scar Scratch overlays on top of the character avatar */}
        {gameState.playerStats.scars && gameState.playerStats.scars.length > 0 && (
          <div className="absolute inset-0 pointer-events-none flex items-center justify-center select-none opacity-60 z-20">
            {gameState.playerStats.scars.map((scar, i) => (
              <div
                key={scar.id}
                className="absolute text-rose-500/90 font-mono font-extrabold text-[10px]"
                style={{
                  top: `${35 + (i * 12) % 40}%`,
                  left: `${40 + (i * 18) % 25}%`,
                  transform: `rotate(${((i * 45) % 90) - 45}deg)`,
                }}
                title={scar.name}
              >
                ⚡
              </div>
            ))}
          </div>
        )}

        {/* Adventurer Humanoid Character Wireframe */}
        <div className="relative text-amber-400/80 font-mono leading-none select-none text-[8.5px] whitespace-pre text-center z-10 antialiased my-2 drop-shadow-md">
          {`      /\\_/\\      
    /  ^ ^  \\    
   (  = ' =  )   
    /\\__*__/     
   /|_|___|_|\\   
  /   |   |   \\  
 | (__)   (__) | 
  \\__________/  
    |_|   |_|    
    | |   | |    
   (_/     \\_)   `}
        </div>

        {/* Biometrics Status Tracker */}
        <div className="absolute bottom-1.5 left-1.5 right-1.5 flex justify-between items-center text-[8px] font-mono text-slate-400 uppercase px-2 py-1 bg-slate-950/90 rounded-lg border border-slate-800 z-10 shadow-sm">
          <span>STATUS</span>
          <span className="text-amber-400 animate-pulse font-bold">
            LVL {gameState.playerStats.level} HERO
          </span>
          <span className="text-emerald-400 font-bold">● VITAL</span>
        </div>
      </div>

      {/* Right Column equipment slots: R-Hand, L-Hand, Gauntlets, Necklace */}
      <div className="col-span-3 flex flex-col gap-3">
        {/* Weapon (R-Hand) slot */}
        <div className="flex flex-col items-center">
          <span className="text-[9px] text-slate-400 uppercase font-mono font-bold mb-1">
            R-Hand
          </span>
          {gameState.currentWeapon ? (
            <button
              onClick={handleUnequipWeapon}
              className="w-14 h-14 bg-slate-900 border border-slate-700 hover:border-rose-500 rounded-xl flex flex-col items-center justify-center p-1 cursor-pointer transition-all shadow-lg text-center hover:scale-105"
              title="Click to unequip from R-Hand"
            >
              <span className="text-lg">
                {gameState.currentWeapon.type === 'armor' ||
                (gameState.currentWeapon.baseType as any) === 'Shield'
                  ? '🛡️'
                  : '⚔️'}
              </span>
              <span
                className="text-[7.5px] text-slate-300 font-semibold truncate w-full"
                style={{ color: gameState.currentWeapon.color }}
              >
                {gameState.currentWeapon.name}
              </span>
              {renderItemDurability(
                gameState.currentWeapon.durability,
                gameState.currentWeapon.maxDurability,
                gameState.currentWeapon
              )}
            </button>
          ) : (
            <div
              className="w-14 h-14 border border-dashed border-slate-800 bg-slate-900/40 rounded-xl flex flex-col items-center justify-center text-slate-500"
              title="Empty Right Hand"
            >
              <span className="text-base opacity-40">🗡️</span>
              <span className="text-[7px] font-mono mt-0.5 text-slate-500">Belted Shiv</span>
            </div>
          )}
        </div>

        {/* Shield / Left-Hand slot */}
        <div className="flex flex-col items-center">
          <span className="text-[9px] text-slate-400 uppercase font-mono font-bold mb-1">
            L-Hand
          </span>
          {gameState.equippedShield ? (
            <button
              onClick={handleUnequipShield}
              className="w-14 h-14 bg-slate-900 border border-slate-700 hover:border-rose-500 rounded-xl flex flex-col items-center justify-center p-1 cursor-pointer transition-all shadow-lg text-center hover:scale-105"
              title="Click to unequip from L-Hand"
            >
              <span className="text-lg">
                {gameState.equippedShield.type === 'weapon' ? '⚔️' : '🛡️'}
              </span>
              <span
                className="text-[7.5px] text-slate-300 font-semibold truncate w-full"
                style={{ color: gameState.equippedShield.color }}
              >
                {gameState.equippedShield.name}
              </span>
              {renderItemDurability(
                gameState.equippedShield.durability,
                gameState.equippedShield.maxDurability,
                gameState.equippedShield
              )}
            </button>
          ) : isTwoHandedWeapon(gameState.currentWeapon) ? (
            <div
              className="w-14 h-14 border border-amber-900/50 bg-amber-950/30 rounded-xl flex flex-col items-center justify-center text-amber-400 p-0.5 text-center shadow-inner"
              title="Occupied by 2-Handed weapon"
            >
              <span className="text-sm">👐</span>
              <span className="text-[6.5px] font-mono font-bold leading-none text-amber-400 mt-0.5">
                2-Handed
              </span>
              <span className="text-[6px] font-mono text-amber-500/80">Occupied</span>
            </div>
          ) : (
            <div
              className="w-14 h-14 border border-dashed border-slate-800 bg-slate-900/40 rounded-xl flex flex-col items-center justify-center text-slate-600"
              title="Empty Left Hand"
            >
              <span className="text-base opacity-40">🛡️</span>
              <span className="text-[7px] font-mono mt-0.5 text-slate-500">Empty</span>
            </div>
          )}
        </div>

        {/* Gauntlets slot */}
        <div className="flex flex-col items-center">
          <span className="text-[9px] text-slate-400 uppercase font-mono font-bold mb-1">
            Gauntlets
          </span>
          {gameState.equippedGloves ? (
            <button
              onClick={handleUnequipGloves}
              className="w-14 h-14 bg-slate-900 border border-slate-700 hover:border-rose-500 rounded-xl flex flex-col items-center justify-center p-1 cursor-pointer transition-all shadow-lg text-center hover:scale-105"
              title="Click to unequip gauntlets"
            >
              <span className="text-lg">🧤</span>
              <span
                className="text-[7.5px] text-slate-300 font-semibold truncate w-full"
                style={{ color: gameState.equippedGloves.color }}
              >
                {gameState.equippedGloves.name}
              </span>
              {renderItemDurability(
                gameState.equippedGloves.durability,
                gameState.equippedGloves.maxDurability,
                gameState.equippedGloves
              )}
            </button>
          ) : (
            <div
              className="w-14 h-14 border border-dashed border-slate-800 bg-slate-900/40 rounded-xl flex flex-col items-center justify-center text-slate-600"
              title="Equip Gauntlets here"
            >
              <span className="text-base opacity-40">🧤</span>
              <span className="text-[7px] font-mono mt-0.5 text-slate-500">Empty</span>
            </div>
          )}
        </div>

        {/* Neck Piece / Amulet slot */}
        <div className="flex flex-col items-center">
          <span className="text-[9px] text-slate-400 uppercase font-mono font-bold mb-1">
            Neck Piece
          </span>
          {gameState.equippedAmulet ? (
            <button
              onClick={handleUnequipAmulet}
              className="w-14 h-14 bg-slate-900 border border-slate-700 hover:border-rose-500 rounded-xl flex flex-col items-center justify-center p-1 cursor-pointer transition-all shadow-lg text-center hover:scale-105"
              title="Click to unequip neck piece"
            >
              <span className="text-lg">📿</span>
              <span
                className="text-[7.5px] text-slate-300 font-semibold truncate w-full"
                style={{ color: gameState.equippedAmulet.color }}
              >
                {gameState.equippedAmulet.name}
              </span>
              {renderItemDurability(
                gameState.equippedAmulet.durability,
                gameState.equippedAmulet.maxDurability,
                gameState.equippedAmulet
              )}
            </button>
          ) : (
            <div
              className="w-14 h-14 border border-dashed border-slate-800 bg-slate-900/40 rounded-xl flex flex-col items-center justify-center text-slate-600"
              title="Equip Neck Piece here"
            >
              <span className="text-base opacity-40">📿</span>
              <span className="text-[7px] font-mono mt-0.5 text-slate-500">Empty</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
