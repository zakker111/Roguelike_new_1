/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { GameState } from '../../types';
import { SCAR_DATABASE, getScarStatus, getEffectiveStats } from '../../utils/scars';

interface CombatStatsSummaryProps {
  gameState: GameState;
  setGameState: React.Dispatch<React.SetStateAction<GameState>>;
  playSound: (soundId: string) => void;
}

export const CombatStatsSummary: React.FC<CombatStatsSummaryProps> = ({
  gameState,
  setGameState,
  playSound,
}) => {
  const effStats = getEffectiveStats(gameState.playerStats);

  // Compute stats
  const isRightHandBroken =
    gameState.currentWeapon !== null &&
    gameState.currentWeapon.durability !== undefined &&
    gameState.currentWeapon.durability <= 0;
  const rightHandDamage =
    gameState.currentWeapon !== null
      ? isRightHandBroken
        ? 1
        : gameState.currentWeapon.damage ?? 0
      : 4;

  const isLeftHandBroken =
    gameState.equippedShield !== null &&
    gameState.equippedShield.durability !== undefined &&
    gameState.equippedShield.durability <= 0;
  const leftHandDamage =
    gameState.equippedShield !== null
      ? isLeftHandBroken
        ? 0
        : gameState.equippedShield.damage ?? 0
      : 0;

  const isWeaponBroken = isRightHandBroken;
  const effectiveWeaponDamage = rightHandDamage + leftHandDamage;

  let brokenArmorDefReduction = 0;
  const armorSlotsKeysStr = [
    'equippedArmor',
    'equippedHelmet',
    'equippedGloves',
    'equippedBoots',
    'equippedShield',
    'equippedAmulet',
  ] as const;
  armorSlotsKeysStr.forEach((slot) => {
    const item = gameState[slot];
    if (item && item.durability !== undefined && item.durability <= 0) {
      brokenArmorDefReduction += item.defense;
    }
  });

  let activeEffectsDefBonus = 0;
  if (gameState.playerStats.activeEffects) {
    gameState.playerStats.activeEffects.forEach((eff) => {
      if (eff.statModifiers?.def) activeEffectsDefBonus += eff.statModifiers.def;
    });
  }
  const effectivePlayerDef = Math.max(
    0,
    effStats.def - brokenArmorDefReduction + activeEffectsDefBonus
  );

  const triggerTestScar = () => {
    const currentScars = gameState.playerStats.scars || [];
    const existingNames = new Set(currentScars.map((s) => s.name));
    const available = SCAR_DATABASE.filter((s) => !existingNames.has(s.name));

    if (available.length === 0) {
      playSound('bump');
      return;
    }

    const template = available[Math.floor(Math.random() * available.length)];
    const newScar = {
      id: `scar_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      name: template.name,
      description: template.description,
      icon: template.icon,
      severity: template.severity,
      acquiredTurn: gameState.playerStats.turnsPlayed,
    };

    setGameState((prev: any) => {
      const updatedStats = {
        ...prev.playerStats,
        scars: [...(prev.playerStats.scars || []), newScar],
      };

      const nextLogs = [
        {
          id: `log_${Date.now()}_${Math.random()}`,
          text: `🩹 Permanent scar: [${newScar.name}] (${newScar.severity}) sustained! "${newScar.description}"`,
          type: 'craft' as const,
          turn: prev.playerStats.turnsPlayed,
        },
        ...(prev.logs || []),
      ];

      return {
        ...prev,
        playerStats: updatedStats,
        logs: nextLogs,
      };
    });
    playSound('heal');
  };

  return (
    <>
      {/* Integrated Total Stat summaries inside inventory tab */}
      <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-3.5 grid grid-cols-2 gap-3.5 text-xs font-mono shadow-inner">
        <div className="flex flex-col gap-1.5 text-slate-400">
          <div className="flex justify-between border-b border-slate-800/80 pb-1">
            <span>Max HP:</span>
            <span className="text-rose-400 font-bold">
              {effStats.maxHp}
              {effStats.maxHp !== gameState.playerStats.maxHp && (
                <span
                  className={`text-[9.5px] font-bold ml-1 ${
                    effStats.maxHp > gameState.playerStats.maxHp
                      ? 'text-emerald-400'
                      : 'text-rose-500'
                  }`}
                >
                  ({effStats.maxHp > gameState.playerStats.maxHp ? '+' : ''}
                  {effStats.maxHp - gameState.playerStats.maxHp})
                </span>
              )}
            </span>
          </div>
          <div className="flex justify-between border-b border-slate-800/80 pb-1">
            <span>Max MP:</span>
            <span className="text-sky-400 font-bold">
              {effStats.maxMp}
              {effStats.maxMp !== gameState.playerStats.maxMp && (
                <span
                  className={`text-[9.5px] font-bold ml-1 ${
                    effStats.maxMp > gameState.playerStats.maxMp
                      ? 'text-emerald-400'
                      : 'text-rose-500'
                  }`}
                >
                  ({effStats.maxMp > gameState.playerStats.maxMp ? '+' : ''}
                  {effStats.maxMp - gameState.playerStats.maxMp})
                </span>
              )}
            </span>
          </div>
          <div className="flex justify-between pb-0.5">
            <span>Attack Power:</span>
            <span className="text-rose-400 font-bold">
              {effStats.atk + effectiveWeaponDamage}
              {effStats.atk !== gameState.playerStats.atk && (
                <span
                  className={`text-[9.5px] font-bold ml-1 ${
                    effStats.atk > gameState.playerStats.atk ? 'text-emerald-400' : 'text-rose-500'
                  }`}
                >
                  ({effStats.atk > gameState.playerStats.atk ? '+' : ''}
                  {effStats.atk - gameState.playerStats.atk})
                </span>
              )}
              {isWeaponBroken && (
                <span
                  className="text-rose-500 text-[9px] ml-1 font-bold animate-pulse"
                  title="Weapon is broken! damage reduced to 1"
                >
                  (BROKEN)
                </span>
              )}
            </span>
          </div>
        </div>
        <div className="flex flex-col gap-1.5 text-slate-400">
          <div className="flex justify-between border-b border-slate-800/80 pb-1">
            <span>Armor Def:</span>
            <span className="text-emerald-400 font-bold">
              {effectivePlayerDef} DEF
              {brokenArmorDefReduction > 0 && (
                <span
                  className="text-rose-500 text-[9px] ml-1 font-bold animate-pulse"
                  title="Armor defense lost from broken gear"
                >
                  (-{brokenArmorDefReduction})
                </span>
              )}
            </span>
          </div>
          <div className="flex justify-between border-b border-slate-800/80 pb-1">
            <span>Critical:</span>
            <span className="text-amber-400 font-bold">
              {((gameState.currentWeapon?.critChance || 0.1) * 100).toFixed(0)}%
            </span>
          </div>
          <div className="flex justify-between pb-0.5">
            <span>Rng Reach:</span>
            <span className="text-slate-200 font-bold">
              {gameState.currentWeapon?.range || 1} Tiles
            </span>
          </div>
        </div>
      </div>

      {/* Cat Lover Status section */}
      {gameState.playerStats.hasCatLover && (
        <div className="bg-emerald-950/30 border border-emerald-500/30 rounded-2xl p-3.5 flex flex-col gap-2 shadow-lg shadow-emerald-500/5">
          <span className="text-[10px] uppercase font-bold text-emerald-400 font-mono flex items-center gap-1.5">
            <span>🐱 SPECIAL TRAIT: CAT LOVER</span>
          </span>
          <div className="text-[11px] text-emerald-300 font-sans leading-relaxed">
            In memory of our beloved feline companions. You have met{' '}
            <span className="font-bold text-emerald-100">Jekku</span>,{' '}
            <span className="font-bold text-emerald-100">Pulla</span>,{' '}
            <span className="font-bold text-emerald-100">Alli</span>, and{' '}
            <span className="font-bold text-emerald-100">Leevi</span>.
          </div>
          <div className="bg-emerald-500/10 border border-emerald-500/20 p-2 rounded-xl text-[10px] text-emerald-400 font-mono flex justify-between items-center">
            <span>✦ Luck Modifier Boost</span>
            <strong className="font-black text-xs text-emerald-300">+10 LCK</strong>
          </div>
        </div>
      )}

      {/* Permanent Battle Scars section */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-3.5 flex flex-col gap-2.5 shadow-xl">
        <div className="flex justify-between items-center border-b border-slate-800/80 pb-2">
          <span className="text-[10px] uppercase font-bold text-slate-300 font-mono flex items-center gap-1.5">
            <span>🩹 PERMANENT BATTLE SCARS ({gameState.playerStats.scars?.length || 0})</span>
          </span>
          <button
            onClick={triggerTestScar}
            className="text-[8.5px] bg-slate-950 hover:bg-slate-800 border border-slate-700 text-slate-300 hover:text-white px-2 py-0.5 rounded-lg font-mono transition-all cursor-pointer active:scale-95"
            title="Simulate acquiring a permanent battle scar for testing purposes."
          >
            + Simulate Scar
          </button>
        </div>

        {!gameState.playerStats.scars || gameState.playerStats.scars.length === 0 ? (
          <div className="text-center py-4 bg-slate-950/40 rounded-lg border border-slate-900/60 flex flex-col items-center gap-1">
            <span className="text-lg">✨</span>
            <p className="text-[10px] text-slate-400 font-mono">Unblemished Hero (0 Scars)</p>
            <p className="text-[8px] text-slate-500 font-mono max-w-[200px] leading-relaxed mx-auto text-center">
              Surmounting near-fatal hits or trap damage has a chance of leaving permanent scars.
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-1.5 max-h-[160px] overflow-y-auto pr-1">
            {gameState.playerStats.scars.map((scar) => {
              let severityColor = 'text-blue-400 bg-blue-950/30 border-blue-900/40';
              if (scar.severity === 'Major')
                severityColor = 'text-amber-400 bg-amber-950/30 border-amber-900/40';
              else if (scar.severity === 'Grave')
                severityColor = 'text-rose-400 bg-rose-950/30 border-rose-900/40';
              else if (scar.severity === 'Legendary')
                severityColor =
                  'text-purple-400 bg-purple-950/30 border-purple-900/40 animate-pulse';

              const status = getScarStatus(scar, gameState.playerStats.turnsPlayed || 0);
              const statusBadgeColor = status.isFresh
                ? 'text-rose-400 bg-rose-950/30 border-rose-900/40'
                : 'text-emerald-400 bg-emerald-950/30 border-emerald-900/40';

              return (
                <div
                  key={scar.id}
                  className="bg-slate-950/50 p-2 rounded-lg border border-slate-900 flex gap-2.5 items-start text-left"
                >
                  <span className="text-base leading-none pt-0.5">{scar.icon}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1.5 mb-1">
                      <span
                        className="text-[10px] font-bold text-slate-200 font-mono truncate"
                        title={scar.name}
                      >
                        {scar.name}
                      </span>
                      <div className="flex items-center gap-1 shrink-0">
                        <span
                          className={`text-[6.5px] font-mono font-bold uppercase px-1 py-0.2 rounded border ${statusBadgeColor}`}
                        >
                          {status.isFresh ? 'FRESH' : 'HEALED'}
                        </span>
                        <span
                          className={`text-[6.5px] font-mono font-bold uppercase px-1 py-0.2 rounded border ${severityColor}`}
                        >
                          {scar.severity}
                        </span>
                      </div>
                    </div>
                    <p className="text-[9px] text-slate-400 font-mono leading-tight mb-1">
                      {scar.description}
                    </p>
                    <div className="bg-slate-900/40 p-1 rounded border border-slate-800/40 text-[8px] font-mono leading-tight mb-1">
                      <span className="text-slate-500">Active Effect: </span>
                      <span
                        className={
                          status.isFresh ? 'text-rose-400 font-medium' : 'text-emerald-400 font-medium'
                        }
                      >
                        {status.effectDesc}
                      </span>
                    </div>
                    <div className="flex justify-between items-center text-[7.5px] text-slate-500 font-mono">
                      <span>Acquired on Turn {scar.acquiredTurn}</span>
                      {status.isFresh && (
                        <span className="text-rose-400/80">
                          Heals in{' '}
                          {25 -
                            ((gameState.playerStats.turnsPlayed || 0) - scar.acquiredTurn)}{' '}
                          turns
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </>
  );
};
