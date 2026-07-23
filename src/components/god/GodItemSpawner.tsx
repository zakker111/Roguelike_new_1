/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { GameState, WeaponBaseType, MaterialCategory } from '../../types';
import { Sparkles, Shield, Wrench } from 'lucide-react';

export interface GodItemSpawnerProps {
  gameState: GameState;
  setGameState: React.Dispatch<React.SetStateAction<GameState>>;
  triggerSuccessLog?: (msg: string) => void;
}

export const GodItemSpawner: React.FC<GodItemSpawnerProps> = ({
  gameState,
  setGameState,
  triggerSuccessLog,
}) => {
  // Custom weapon state
  const [customWeaponName, setCustomWeaponName] = useState('Sovereign Doomsday Blade');
  const [customWeaponBase, setCustomWeaponBase] = useState<WeaponBaseType>(WeaponBaseType.Sword);
  const [customWeaponDmg, setCustomWeaponDmg] = useState(35);
  const [customWeaponRange, setCustomWeaponRange] = useState(1);
  const [customWeaponCrit, setCustomWeaponCrit] = useState(25);
  const [customWeaponMana, setCustomWeaponMana] = useState(0);
  const [customWeaponDurability, setCustomWeaponDurability] = useState(300);

  // Custom armor state
  const [customArmorName, setCustomArmorName] = useState('Sovereign Bastion Aegis');
  const [customArmorBase, setCustomArmorBase] = useState<'Shield' | 'HeavyArmor' | 'Helmet' | 'Gloves' | 'Boots'>('Shield');
  const [customArmorDef, setCustomArmorDef] = useState(15);

  const handleEquipCustomWeapon = () => {
    const customWeapon = {
      id: `wep_dev_${Date.now()}`,
      name: customWeaponName.trim() || `${customWeaponBase} of the Sovereign Lab`,
      baseType: customWeaponBase,
      materialUsed: {
        id: 'mat_mithril',
        name: 'Mithril Silver',
        description: 'Forge-melted developer alloy',
        category: MaterialCategory.Tier3,
        color: '#e2e8f0',
        baseDamageMod: 1.5,
        critMod: 0.1,
        speedMod: 0,
      },
      catalystUsed: {
        id: 'cat_shadow',
        name: 'Void Shadow',
        description: 'Infuses deep decay',
        type: 'Shadow' as any,
        color: '#8b5cf6',
        damageType: 'Shadow',
        statusEffectChance: 0.3,
        statusDuration: 3,
      },
      damage: customWeaponDmg,
      critChance: customWeaponCrit / 100,
      range: customWeaponRange,
      manaCost: customWeaponMana,
      effectDescription: 'Annihilates hostiles with high-density developer integrity parameters.',
      color: '#f43f5e',
      durability: customWeaponDurability,
      maxDurability: customWeaponDurability,
    };

    setGameState((prev) => ({
      ...prev,
      currentWeapon: customWeapon,
      logs: [
        ...prev.logs,
        {
          id: `dev_wep_${Date.now()}`,
          text: `⚔️ DEV FORGE: Outfitted the legendary "${customWeapon.name}" directly onto active slot!`,
          type: 'craft',
          timestamp: 'GOD',
        },
      ],
    }));

    if (triggerSuccessLog) {
      triggerSuccessLog(`Successfully forge-equipped "${customWeapon.name}"!`);
    }
  };

  const handleEquipCustomArmor = () => {
    const customArmor = {
      id: `arm_dev_${Date.now()}`,
      name: customArmorName.trim() || `${customArmorBase} of the Sovereign Lab`,
      type: 'armor' as const,
      subType: customArmorBase,
      defense: customArmorDef,
      damage: 0,
      critChance: 0,
      range: 1,
      color: '#38bdf8',
      description: 'Handcrafted developer weave impervious to physical trauma.',
      value: 1000,
      durability: 300,
      maxDurability: 300,
    };

    setGameState((prev) => ({
      ...prev,
      equipmentInventory: [...prev.equipmentInventory, customArmor],
      logs: [
        ...prev.logs,
        {
          id: `dev_arm_${Date.now()}`,
          text: `🛡️ DEV FORGE: Outfitted "${customArmor.name}" directly into backpack!`,
          type: 'craft',
          timestamp: 'GOD',
        },
      ],
    }));

    if (triggerSuccessLog) {
      triggerSuccessLog(`Successfully added "${customArmor.name}" to Pack!`);
    }
  };

  return (
    <div className="space-y-4 font-mono p-4 bg-slate-950/40 border border-slate-800 rounded-xl">
      <div className="flex items-center gap-2 border-b border-slate-800/60 pb-1.5">
        <span className="text-pink-400 font-bold text-[10px] uppercase tracking-wider flex items-center gap-1.5">
          <Sparkles className="w-4 h-4 text-pink-400" />
          <span>Sovereign Bespoke Item Generator</span>
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Custom Weapon Section */}
        <div className="p-3.5 bg-slate-900/80 border border-slate-800 rounded-lg space-y-3">
          <div className="flex items-center gap-2 border-b border-slate-800 pb-1.5">
            <Wrench className="w-3.5 h-3.5 text-pink-400" />
            <span className="text-pink-400 font-bold text-[10px] uppercase">Custom Weapon Forge</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            <div>
              <label className="text-[9px] text-slate-400 font-bold uppercase block mb-1">Base Type</label>
              <select
                value={customWeaponBase}
                onChange={(e) => setCustomWeaponBase(e.target.value as WeaponBaseType)}
                className="w-full bg-slate-950 border border-slate-800 p-1.5 rounded text-slate-200 text-xs font-mono"
              >
                {Object.values(WeaponBaseType).map((bt) => (
                  <option key={bt} value={bt}>
                    {bt}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-[9px] text-slate-400 font-bold uppercase block mb-1">Custom Name</label>
              <input
                type="text"
                value={customWeaponName}
                onChange={(e) => setCustomWeaponName(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 p-1.5 rounded text-slate-200 text-xs font-mono"
                placeholder="e.g. Blade of Ruin"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2">
            <div>
              <label className="text-[9px] text-slate-400 font-bold uppercase block mb-1 text-center">Damage</label>
              <input
                type="number"
                value={customWeaponDmg}
                onChange={(e) => setCustomWeaponDmg(Math.max(1, parseInt(e.target.value) || 1))}
                className="w-full bg-slate-950 border border-slate-800 p-1 rounded text-slate-200 text-center text-xs font-mono"
              />
            </div>
            <div>
              <label className="text-[9px] text-slate-400 font-bold uppercase block mb-1 text-center">Crit %</label>
              <input
                type="number"
                value={customWeaponCrit}
                onChange={(e) => setCustomWeaponCrit(Math.max(0, Math.min(100, parseInt(e.target.value) || 0)))}
                className="w-full bg-slate-950 border border-slate-800 p-1 rounded text-slate-200 text-center text-xs font-mono"
              />
            </div>
            <div>
              <label className="text-[9px] text-slate-400 font-bold uppercase block mb-1 text-center">Range</label>
              <input
                type="number"
                value={customWeaponRange}
                onChange={(e) => setCustomWeaponRange(Math.max(1, parseInt(e.target.value) || 1))}
                className="w-full bg-slate-950 border border-slate-800 p-1 rounded text-slate-200 text-center text-xs font-mono"
              />
            </div>
          </div>

          <button
            onClick={handleEquipCustomWeapon}
            className="w-full py-2 bg-pink-950/40 hover:bg-pink-900/60 border border-pink-750 text-pink-300 text-[10px] font-bold rounded cursor-pointer transition-all flex items-center justify-center gap-1.5"
          >
            <Sparkles className="w-3.5 h-3.5 text-pink-400" />
            <span>Forge & Equip Custom Weapon</span>
          </button>
        </div>

        {/* Custom Armor Section */}
        <div className="p-3.5 bg-slate-900/80 border border-slate-800 rounded-lg space-y-3">
          <div className="flex items-center gap-2 border-b border-slate-800 pb-1.5">
            <Shield className="w-3.5 h-3.5 text-sky-400" />
            <span className="text-sky-400 font-bold text-[10px] uppercase">Custom Armor Forge</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            <div>
              <label className="text-[9px] text-slate-400 font-bold uppercase block mb-1">Armor Slot</label>
              <select
                value={customArmorBase}
                onChange={(e) => setCustomArmorBase(e.target.value as any)}
                className="w-full bg-slate-950 border border-slate-800 p-1.5 rounded text-slate-200 text-xs font-mono"
              >
                {['Shield', 'HeavyArmor', 'Helmet', 'Gloves', 'Boots'].map((slot) => (
                  <option key={slot} value={slot}>
                    {slot}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-[9px] text-slate-400 font-bold uppercase block mb-1">Custom Name</label>
              <input
                type="text"
                value={customArmorName}
                onChange={(e) => setCustomArmorName(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 p-1.5 rounded text-slate-200 text-xs font-mono"
                placeholder="e.g. Shield of Aegis"
              />
            </div>
          </div>

          <div>
            <label className="text-[9px] text-slate-400 font-bold uppercase block mb-1">Defense Rating</label>
            <input
              type="number"
              value={customArmorDef}
              onChange={(e) => setCustomArmorDef(Math.max(1, parseInt(e.target.value) || 1))}
              className="w-full bg-slate-950 border border-slate-800 p-1.5 rounded text-slate-200 text-xs font-mono"
            />
          </div>

          <button
            onClick={handleEquipCustomArmor}
            className="w-full py-2 bg-sky-950/40 hover:bg-sky-900/60 border border-sky-750 text-sky-300 text-[10px] font-bold rounded cursor-pointer transition-all flex items-center justify-center gap-1.5"
          >
            <Shield className="w-3.5 h-3.5 text-sky-400" />
            <span>Forge & Grant Custom Armor</span>
          </button>
        </div>
      </div>
    </div>
  );
};
