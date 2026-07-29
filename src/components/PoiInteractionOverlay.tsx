import React, { useState } from 'react';
import { X, Sparkles, BookOpen, Flame, Shield, HelpCircle, Heart, Trophy, Zap, AlertTriangle, Coins } from 'lucide-react';
import { PlayerStats, CatalystType, TileType } from '../types';
import { playSound } from '../utils/audio';

export interface PoiType {
  id: string;
  x: number;
  y: number;
  name: string;
  type: 'monolith' | 'shrine' | 'hearth' | 'sunken_keep' | 'fossil';
  description: string;
  historySnippet: string;
  chapterId: string;
  isInteracted: boolean;
  char: string;
  color: string;
}

interface PoiInteractionOverlayProps {
  poi: PoiType;
  playerStats: PlayerStats;
  townReputation: number;
  onClose: () => void;
  onSelectOption: (
    poiId: string,
    choiceId: string,
    effects: {
      logText: string;
      hpChange?: number;
      mpChange?: number;
      maxHpChange?: number;
      maxMpChange?: number;
      xpChange?: number;
      goldChange?: number;
      defChange?: number;
      unspentPointsChange?: number;
      reputationChange?: number;
      addMaterials?: { [matId: string]: number };
      addCatalysts?: { [catId: string]: number };
      spawnEffectText?: string;
      spawnEffectType?: 'heal' | 'damage' | 'xp' | 'gold';
      applyBlessed?: boolean;
      applyShielded?: boolean;
    }
  ) => void;
}

export default function PoiInteractionOverlay({
  poi,
  playerStats,
  townReputation,
  onClose,
  onSelectOption,
}: PoiInteractionOverlayProps) {
  const [selectedChoiceId, setSelectedChoiceId] = useState<string | null>(null);

  // Define icon based on POI type
  const getPoiHeader = () => {
    switch (poi.type) {
      case 'shrine':
        return {
          icon: <Sparkles className="w-6 h-6 text-cyan-400" />,
          title: "LEY-WELL SHRINE",
          accentColor: "border-cyan-500/30 text-cyan-400 bg-cyan-950/10",
        };
      case 'hearth':
        return {
          icon: <Flame className="w-6 h-6 text-amber-500 animate-pulse" />,
          title: "FLAME LORD CRUCIBLE",
          accentColor: "border-amber-500/30 text-amber-400 bg-amber-950/10",
        };
      case 'monolith':
        return {
          icon: <BookOpen className="w-6 h-6 text-purple-400" />,
          title: "ANCIENT RUNED MONOLITH",
          accentColor: "border-purple-500/30 text-purple-400 bg-purple-950/10",
        };
      case 'sunken_keep':
        return {
          icon: <Shield className="w-6 h-6 text-teal-400" />,
          title: "SUNKEN KEEP FORTRESS",
          accentColor: "border-teal-500/30 text-teal-400 bg-teal-950/10",
        };
      case 'fossil':
        return {
          icon: <Zap className="w-6 h-6 text-emerald-400" />,
          title: "TECTONIC BEAST FOSSIL",
          accentColor: "border-emerald-500/30 text-emerald-400 bg-emerald-950/10",
        };
      default:
        return {
          icon: <HelpCircle className="w-6 h-6 text-slate-400" />,
          title: "LANDMARK RUIN",
          accentColor: "border-slate-800 text-slate-400 bg-slate-950/10",
        };
    }
  };

  const header = getPoiHeader();

  // Define interactive choices based on the type
  const getChoices = () => {
    switch (poi.type) {
      case 'shrine':
        return [
          {
            id: 'shrine_pray',
            title: "Offer Silent Prayer",
            description: "Whisper a plea to the old spirits. Gain the BLESSED status effect, healing wounds.",
            requirementsText: "None",
            isAvailable: true,
            icon: "⛲",
            execute: () => {
              const hpHealed = 35;
              const mpHealed = 25;
              return {
                logText: `⛲ Ley-Well Restored: You knelt and prayed at ${poi.name}. Gained BLESSED (+10% Critical, +5 Luck) and fully healed wounds!`,
                hpChange: hpHealed,
                mpChange: mpHealed,
                applyBlessed: true,
                spawnEffectText: `BLESSED! ✨`,
                spawnEffectType: 'heal' as const
              };
            }
          },
          {
            id: 'shrine_siphon',
            title: "Siphon Ley-Well Core",
            description: "Greedily draw raw magic into your veins. Increases raw mana but risks psychic backfiring.",
            requirementsText: "None (35% risk of -15 HP)",
            isAvailable: true,
            icon: "🧪",
            execute: () => {
              const backfired = Math.random() < 0.35;
              if (backfired) {
                return {
                  logText: `⚠️ Ley-Well Backfire: You siphoned the core of ${poi.name}, but unstable magic erupted! (+5 Max MP, -15 HP)`,
                  maxMpChange: 5,
                  hpChange: -15,
                  spawnEffectText: `Backfire! -15 HP 💥`,
                  spawnEffectType: 'damage' as const
                };
              } else {
                return {
                  logText: `🌟 Siphon Success: You extracted the core of ${poi.name}, expanding your magical capacity! (+5 Max MP)`,
                  maxMpChange: 5,
                  spawnEffectText: `+5 Max MP! 🧬`,
                  spawnEffectType: 'heal' as const
                };
              }
            }
          },
          {
            id: 'shrine_gold',
            title: "Tribute of Gold",
            description: "Place 50 gold pieces in the basin to receive Pristine Favor and a random magic catalyst shard.",
            requirementsText: "Costs 50 Gold",
            isAvailable: playerStats.gold >= 50,
            icon: "💰",
            execute: () => {
              const allCats = ['cat_fire', 'cat_frost', 'cat_poison', 'cat_lightning', 'cat_shadow'];
              const chosenCat = allCats[Math.floor(Math.random() * allCats.length)];
              const catNames: { [key: string]: string } = {
                cat_fire: "Fire Catalyst",
                cat_frost: "Frost Catalyst",
                cat_poison: "Poison Catalyst",
                cat_lightning: "Lightning Catalyst",
                cat_shadow: "Shadow Catalyst"
              };
              return {
                logText: `🪙 Golden Favor: You left a gold tribute at ${poi.name}. Received +15 Town Reputation, +100 XP, and 1x ${catNames[chosenCat]}!`,
                goldChange: -50,
                reputationChange: 15,
                xpChange: 100,
                addCatalysts: { [chosenCat]: 1 },
                spawnEffectText: `+15 Reputation! ⚖️`,
                spawnEffectType: 'xp' as const
              };
            }
          }
        ];

      case 'hearth':
        return [
          {
            id: 'hearth_stoke',
            title: "Stoke the Sacred Embers",
            description: "Intensely fan the ancient forge crucible, yielding a rare Ember Core for weapon forging.",
            requirementsText: "None",
            isAvailable: true,
            icon: "🔥",
            execute: () => {
              return {
                logText: `🔥 Crucible Stoke: You stoke the forge of ${poi.name} and salvage +1 rare Ember Core!`,
                addMaterials: { 'mat_ember_core': 1 },
                spawnEffectText: `+1 Ember Core! 🔥`,
                spawnEffectType: 'heal' as const
              };
            }
          },
          {
            id: 'hearth_absorb',
            title: "Meditate in the Crucible",
            description: "Absorb the thermal radiation, permanently hardening your constitution and earning a Fire Catalyst.",
            requirementsText: "None",
            isAvailable: true,
            icon: "🧘",
            execute: () => {
              return {
                logText: `🌋 Crucible Blessing: You absorb the extreme heat of ${poi.name}, gaining permanent +8 Max HP and +1 Fire Catalyst!`,
                maxHpChange: 8,
                hpChange: 8,
                addCatalysts: { 'cat_fire': 1 },
                spawnEffectText: `+8 Max HP! 🩸`,
                spawnEffectType: 'heal' as const
              };
            }
          },
          {
            id: 'hearth_quench',
            title: "Quench the Fire",
            description: "Smother the fire to extract highly valuable Coal and raw Iron Ore fuel elements.",
            requirementsText: "Extinguishes the fire (+50 XP)",
            isAvailable: true,
            icon: "🪨",
            execute: () => {
              return {
                logText: `🪨 Quenched Hearth: You cool down the crucible of ${poi.name}, scavenging +3 Coal and +2 Iron Ore!`,
                xpChange: 50,
                addMaterials: { 'mat_coal': 3, 'mat_iron': 2 },
                spawnEffectText: `+3 Coal, +2 Iron! 🪨`,
                spawnEffectType: 'gold' as const
              };
            }
          }
        ];

      case 'monolith':
        return [
          {
            id: 'monolith_decipher',
            title: "Decipher Ancient Runes",
            description: "Translate the worn inscriptions. Earn ancient XP wisdom and a chance to learn catalyst lore.",
            requirementsText: "None",
            isAvailable: true,
            icon: "📜",
            execute: () => {
              return {
                logText: `📖 Glyph Translation: You study ${poi.name}, deciphering records of early Sunder. Gained +80 XP!`,
                xpChange: 80,
                spawnEffectText: `+80 XP Wisdom! 🌟`,
                spawnEffectType: 'xp' as const
              };
            }
          },
          {
            id: 'monolith_commune',
            title: "Commune with Spirits",
            description: "Rest your head against the cold obsidian. Channel raw attribute power from ancestral souls.",
            requirementsText: "None",
            isAvailable: true,
            icon: "🌌",
            execute: () => {
              return {
                logText: `🌌 Astral Commune: You connect with the spirits at ${poi.name}, gaining +2 Unspent Attribute Points!`,
                unspentPointsChange: 3, // Let's give +3 to be highly satisfying!
                spawnEffectText: `+3 Attribute Points! ✨`,
                spawnEffectType: 'heal' as const
              };
            }
          },
          {
            id: 'monolith_carve',
            title: "Carve Your Renowned Name",
            description: "Engrave your heroic seal to spread rumors of your deeds (+15 Reputation), but risk a psychic recoil.",
            requirementsText: "10% chance of -10 HP",
            isAvailable: true,
            icon: "🔨",
            execute: () => {
              const backfired = Math.random() < 0.10;
              if (backfired) {
                return {
                  logText: `💥 Monolith Crack: You engrave your name into ${poi.name}, but a sudden kinetic recoil occurs! (+15 Reputation, -10 HP)`,
                  reputationChange: 15,
                  hpChange: -10,
                  spawnEffectText: `Psychic Shock! -10 HP 💥`,
                  spawnEffectType: 'damage' as const
                };
              } else {
                return {
                  logText: `⚖️ Legend Spread: You successfully carve your sigil on ${poi.name}. Your fame grows! (+15 Town Reputation)`,
                  reputationChange: 15,
                  spawnEffectText: `+15 Reputation! 🛡️`,
                  spawnEffectType: 'xp' as const
                };
              }
            }
          }
        ];

      case 'sunken_keep':
        return [
          {
            id: 'keep_scavenge',
            title: "Scavenge Fortress Scraps",
            description: "Pry metal plating and copper wires loose from the rusted armory ruins.",
            requirementsText: "None",
            isAvailable: true,
            icon: "🛡️",
            execute: () => {
              return {
                logText: `🏰 Salvaged Keep: You scrape off metallic plates from ${poi.name}. (+3 Copper, +1 Military Steel)`,
                addMaterials: { 'mat_copper': 3, 'mat_steel': 1 },
                spawnEffectText: `+3 Copper, +1 Steel! 🏰`,
                spawnEffectType: 'gold' as const
              };
            }
          },
          {
            id: 'keep_vault',
            title: "Delve Shaking Vaults",
            description: "Clamber into the unstable, dark dungeon cellar. High chance of rare chest loot; moderate risk of a cave-in.",
            requirementsText: "None (35% risk of -20 HP cave-in)",
            isAvailable: true,
            icon: "💎",
            execute: () => {
              const caveIn = Math.random() < 0.35;
              if (caveIn) {
                return {
                  logText: `💥 Fortress Cave-in: You fell through rotting floors in ${poi.name}! Heavy rocks deal -20 HP!`,
                  hpChange: -20,
                  spawnEffectText: `Cave-In! -20 HP 💥`,
                  spawnEffectType: 'damage' as const
                };
              } else {
                return {
                  logText: `🪙 Treasure Found: You breached the rusted strongbox of ${poi.name}! Gained +150 Gold and 1x Shadow Catalyst!`,
                  goldChange: 150,
                  addCatalysts: { 'cat_shadow': 1 },
                  spawnEffectText: `+150 Gold! 💰`,
                  spawnEffectType: 'gold' as const
                };
              }
            }
          },
          {
            id: 'keep_banner',
            title: "Hoist Your Alliance Flag",
            description: "Erect a makeshift banner atop the tower ruins, declaring sovereign claim. Gain the SHIELDED status effect (+3 DEF).",
            requirementsText: "None",
            isAvailable: true,
            icon: "🚩",
            execute: () => {
              return {
                logText: `🚩 Fortress Reclaimed: You hoist your colors atop ${poi.name}. Gained SHIELDED (+3 DEF) and town reputation. (+20 Town Reputation, +120 XP)`,
                reputationChange: 20,
                xpChange: 120,
                applyShielded: true,
                spawnEffectText: `SHIELDED! 🛡️`,
                spawnEffectType: 'heal' as const
              };
            }
          }
        ];

      case 'fossil':
        return [
          {
            id: 'fossil_plate',
            title: "Exhume Tectonic Marrow",
            description: "Carefully chip away calcified tectonic bone plate. Permanently reinforces armor integrity.",
            requirementsText: "None",
            isAvailable: true,
            icon: "🛡️",
            execute: () => {
              return {
                logText: `🦴 Bone Reinforcement: You graft a dense bone scale from ${poi.name} to your apparel. Permanent +2 Armor DEF!`,
                defChange: 2,
                spawnEffectText: `Permanent +2 DEF! 🛡️`,
                spawnEffectType: 'heal' as const
              };
            }
          },
          {
            id: 'fossil_essence',
            title: "Channel Primeval Life Soul",
            description: "Absorb primeval dragon energy. Permanently expands Max Vitality, but drains current Mana.",
            requirementsText: "Drains -15 MP",
            isAvailable: playerStats.mp >= 15,
            icon: "🐉",
            execute: () => {
              return {
                logText: `🐉 Dragon Siphon: You absorb primordial dragon soul energy from ${poi.name}. (+12 Max HP, -15 MP)`,
                maxHpChange: 12,
                hpChange: 12,
                mpChange: -15,
                spawnEffectText: `+12 Max HP! 🩸`,
                spawnEffectType: 'heal' as const
              };
            }
          },
          {
            id: 'fossil_crystals',
            title: "Extract Magic Shards",
            description: "Excavate glowing, calcified elemental crystals from the dragon's skull sockets.",
            requirementsText: "None",
            isAvailable: true,
            icon: "💎",
            execute: () => {
              // Extract 2 random catalyst shards
              const allCats = ['cat_fire', 'cat_frost', 'cat_poison', 'cat_lightning', 'cat_shadow'];
              const cat1 = allCats[Math.floor(Math.random() * allCats.length)];
              const cat2 = allCats[Math.floor(Math.random() * allCats.length)];
              const catNames: { [key: string]: string } = {
                cat_fire: "Fire Catalyst",
                cat_frost: "Frost Catalyst",
                cat_poison: "Poison Catalyst",
                cat_lightning: "Lightning Catalyst",
                cat_shadow: "Shadow Catalyst"
              };
              return {
                logText: `🧪 Calcified Crystals: You dug up crystals inside ${poi.name}. Received 1x ${catNames[cat1]} and 1x ${catNames[cat2]}!`,
                addCatalysts: { [cat1]: 1, [cat2]: 1 },
                spawnEffectText: `+2 Catalyst Shards! 🧪`,
                spawnEffectType: 'gold' as const
              };
            }
          }
        ];

      default:
        return [];
    }
  };

  const choices = getChoices();

  const handleSelectChoice = (choice: any) => {
    if (!choice || !choice.isAvailable || poi?.isInteracted) return;
    playSound('levelUp');
    const outcomes = choice.execute();
    if (poi?.id && choice?.id) {
      onSelectOption(poi.id, choice.id, outcomes);
      setSelectedChoiceId(choice.id);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-xs">
      <div 
        id="poi-modal"
        className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full flex flex-col overflow-hidden shadow-2xl animate-in fade-in-50 zoom-in-95 duration-150"
      >
        {/* Header */}
        <div className="border-b border-slate-800 p-4.5 flex items-center justify-between bg-slate-950/40">
          <div className="flex items-center gap-2.5">
            <div className={`p-2 rounded-lg border ${header.accentColor}`}>
              {header.icon}
            </div>
            <div>
              <span className="text-xs font-mono text-slate-500 block uppercase tracking-wider">OVERWORLD LANDMARK</span>
              <span className="text-sm font-black uppercase tracking-wide text-slate-100">{poi.name}</span>
            </div>
          </div>
          <button 
            id="close-poi-btn"
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800/50 cursor-pointer transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="p-5 overflow-y-auto max-h-[70vh] space-y-4 text-slate-300 font-sans text-left">
          {/* Landmark Lore card */}
          <div className="bg-slate-950/50 border border-slate-800 p-4 rounded-xl space-y-2.5 relative overflow-hidden">
            <div className="absolute right-0 bottom-0 text-7xl font-sans opacity-[0.02] translate-y-3 translate-x-1 select-none font-black text-white">
              {poi.char}
            </div>
            <div className="flex items-center gap-1.5 text-xs font-bold text-amber-500 uppercase tracking-wider font-mono">
              <span>📖 Landmark Description</span>
            </div>
            <p className="text-xs text-slate-300 italic font-serif leading-relaxed">
              "{poi.description}"
            </p>
            <div className="pt-2.5 border-t border-slate-800/80">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest font-mono">CHRONICLE SCROLL:</span>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                {poi.historySnippet}
              </p>
            </div>
          </div>

          {/* Interactive Choices */}
          <div className="space-y-2.5">
            <div className="flex justify-between items-center">
              <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">
                {poi.isInteracted ? "Landmark Expended" : "Interactive Choices"}
              </span>
              <span className="text-[9px] text-slate-500 font-mono">
                {poi.isInteracted ? "🔒 Already Resolved" : "⚡ Choose One Path"}
              </span>
            </div>

            {poi.isInteracted ? (
              <div className="bg-slate-950/20 border border-slate-800/50 rounded-xl p-4 text-center text-slate-400 text-xs">
                ✨ <span className="font-semibold text-slate-300">{poi.name}'s</span> magical potential and primeval core have been fully tapped by your soul. However, the echo of its history still resonates here.
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                {choices.map((choice) => {
                  return (
                    <button
                      key={choice.id}
                      type="button"
                      disabled={!choice.isAvailable || selectedChoiceId !== null}
                      onClick={() => handleSelectChoice(choice)}
                      className={`flex gap-3.5 items-start p-3 rounded-xl border text-left transition-all relative overflow-hidden ${
                        !choice.isAvailable
                          ? 'bg-slate-950/10 border-slate-900 text-slate-600 cursor-not-allowed opacity-50'
                          : 'bg-slate-950/40 border-slate-800/80 hover:bg-slate-950/60 hover:border-slate-700 text-slate-300 cursor-pointer active:scale-[0.99]'
                      }`}
                    >
                      <div className="text-2xl pt-0.5">{choice.icon}</div>
                      <div className="flex-grow space-y-1">
                        <div className="flex justify-between items-baseline">
                          <span className="text-xs font-extrabold text-slate-200">{choice.title}</span>
                          <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded font-mono ${
                            !choice.isAvailable 
                              ? 'bg-rose-500/10 text-rose-400' 
                              : 'bg-slate-800 text-slate-400'
                          }`}>
                            {choice.requirementsText}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-400 leading-relaxed">
                          {choice.description}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Action Button Footer */}
        <div className="border-t border-slate-800 p-4 flex gap-3 bg-slate-950/40">
          <button
            type="button"
            onClick={onClose}
            className="w-full py-2.5 rounded-xl border border-slate-800 text-slate-400 text-xs font-bold hover:bg-slate-800/30 transition-all cursor-pointer font-sans text-center"
          >
            {poi.isInteracted ? "Close Landmark" : "Leave Landmark"}
          </button>
        </div>
      </div>
    </div>
  );
}
