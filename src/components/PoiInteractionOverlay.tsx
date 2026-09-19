import React, { useState, useEffect } from 'react';
import { X, Sparkles, BookOpen, Flame, Shield, HelpCircle, Heart, Trophy, Zap, AlertTriangle, Coins, Compass, Navigation, Swords } from 'lucide-react';
import { PlayerStats, CatalystType, TileType } from '../types';
import { playSound } from '../utils/audio';

export interface PoiType {
  id: string;
  x: number;
  y: number;
  chunkX?: number;
  chunkY?: number;
  name: string;
  type: 'monolith' | 'shrine' | 'hearth' | 'sunken_keep' | 'fossil' | string;
  description: string;
  historySnippet: string;
  chapterId: string;
  isInteracted: boolean;
  isAttunedWaystone?: boolean;
  guardianDefeated?: boolean;
  guardianSpawned?: boolean;
  char: string;
  color: string;
}

interface PoiInteractionOverlayProps {
  poi: PoiType;
  playerStats: PlayerStats;
  townReputation: number;
  inventoryMaterials?: { [matId: string]: number };
  inventoryCatalysts?: { [catId: string]: number };
  attunedWaystones?: string[];
  allKnownWaystones?: PoiType[];
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
      removeMaterials?: { [matId: string]: number };
      spawnEffectText?: string;
      spawnEffectType?: 'heal' | 'damage' | 'xp' | 'gold';
      applyBlessed?: boolean;
      applyShielded?: boolean;
    }
  ) => void;
  onAttuneWaystone?: (poiId: string) => void;
  onFastTravel?: (targetChunkX: number, targetChunkY: number, targetX: number, targetY: number, targetName: string) => void;
  onChallengeGuardian?: (poi: PoiType) => void;
}

export default function PoiInteractionOverlay({
  poi,
  playerStats,
  townReputation,
  inventoryMaterials = {},
  inventoryCatalysts = {},
  attunedWaystones = [],
  allKnownWaystones = [],
  onClose,
  onSelectOption,
  onAttuneWaystone,
  onFastTravel,
  onChallengeGuardian,
}: PoiInteractionOverlayProps) {
  const [selectedChoiceId, setSelectedChoiceId] = useState<string | null>(null);
  const [showWaystoneNetwork, setShowWaystoneNetwork] = useState<boolean>(false);

  // Close POI interaction or subview on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        e.stopPropagation();
        if (showWaystoneNetwork) {
          setShowWaystoneNetwork(false);
        } else {
          onClose();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown, true);
    return () => window.removeEventListener('keydown', handleKeyDown, true);
  }, [showWaystoneNetwork, onClose]);

  const isAlreadyAttuned = poi.isAttunedWaystone || attunedWaystones.includes(poi.id);

  // Define header based on POI type
  const getPoiHeader = () => {
    switch (poi.type) {
      case 'shrine':
        return {
          icon: <Sparkles className="w-6 h-6 text-cyan-400" />,
          title: "TAPIO & VELLAMO LEY-SHRINE",
          accentColor: "border-cyan-500/30 text-cyan-400 bg-cyan-950/10",
        };
      case 'hearth':
        return {
          icon: <Flame className="w-6 h-6 text-amber-500 animate-pulse" />,
          title: "FORGE OF ILMARINEN",
          accentColor: "border-amber-500/30 text-amber-400 bg-amber-950/10",
        };
      case 'monolith':
        return {
          icon: <BookOpen className="w-6 h-6 text-purple-400" />,
          title: "VÄINÄMÖINEN RUNE STONE",
          accentColor: "border-purple-500/30 text-purple-400 bg-purple-950/10",
        };
      case 'sunken_keep':
        return {
          icon: <Shield className="w-6 h-6 text-teal-400" />,
          title: "GATES OF TUONELA & AHTI CITADEL",
          accentColor: "border-teal-500/30 text-teal-400 bg-teal-950/10",
        };
      case 'fossil':
        return {
          icon: <Zap className="w-6 h-6 text-emerald-400" />,
          title: "RIBS OF ANTERO VIPUNEN",
          accentColor: "border-emerald-500/30 text-emerald-400 bg-emerald-950/10",
        };
      default:
        return {
          icon: <HelpCircle className="w-6 h-6 text-slate-400" />,
          title: "KALEVALA LANDMARK RUIN",
          accentColor: "border-slate-800 text-slate-400 bg-slate-950/10",
        };
    }
  };

  const header = getPoiHeader();

  // Define interactive choices based on the type
  const getChoices = () => {
    const choicesList: any[] = [];

    // 1. Attune Leyline Waystone Option
    if (!isAlreadyAttuned) {
      choicesList.push({
        id: 'attune_waystone',
        title: "⚡ Attune Leyline Waystone",
        description: "Connect this landmark's magical core to Sunder's Leyline Network, enabling fast-travel teleportation.",
        requirementsText: "Free Attunement",
        isAvailable: true,
        icon: "🔮",
        execute: () => {
          if (onAttuneWaystone) onAttuneWaystone(poi.id);
          return {
            logText: `🔮 Leyline Attunement: You attuned your soul to ${poi.name}! It is now linked to the Overworld Fast-Travel Network.`,
            spawnEffectText: `WAYSTONE ATTUNED! 🔮`,
            spawnEffectType: 'heal' as const
          };
        }
      });
    }

    // 2. Challenge Biome Guardian Option
    if (!poi.guardianDefeated) {
      choicesList.push({
        id: 'challenge_guardian',
        title: "⚔️ Challenge Biome Guardian (Trial of Ancients)",
        description: `Awaken and challenge the mythic spirit guardian bound to ${poi.name}. High-difficulty boss battle!`,
        requirementsText: poi.guardianSpawned ? "Guardian Active!" : "Boss Battle",
        isAvailable: true,
        icon: "👹",
        execute: () => {
          if (onChallengeGuardian) onChallengeGuardian(poi);
          return {
            logText: `⚔️ Trial Challenge: You disturbed the ancient seals at ${poi.name}! The Biome Guardian awakens!`,
            spawnEffectText: `GUARDIAN AWAKENED! ⚡`,
            spawnEffectType: 'damage' as const
          };
        }
      });
    }

    // 3. Lore-based choices per POI type
    switch (poi.type) {
      case 'shrine':
        choicesList.push(
          {
            id: 'shrine_laulu',
            title: "🎵 Chant Spell-Song of Tapio (Laulu)",
            description: "Chant the sacred evergreen runes of Tapio and Mielikki. Fully heals HP/MP and grants BLESSED status (+10% Crit, +5 Luck).",
            requirementsText: "Costs 10 MP",
            isAvailable: playerStats.mp >= 10,
            icon: "⛲",
            execute: () => {
              return {
                logText: `⛲ Tapio's Blessing: You chanted the Spell-Song at ${poi.name}. Gained BLESSED (+10% Critical, +5 Luck) and fully restored health!`,
                hpChange: playerStats.maxHp,
                mpChange: -10 + 30,
                applyBlessed: true,
                spawnEffectText: `TAPIO BLESSED! ✨`,
                spawnEffectType: 'heal' as const
              };
            }
          },
          {
            id: 'shrine_berries',
            title: "🍓 Forest Wild Berry Offering",
            description: "Place 5 Forest Berries on Mielikki's mossy altar in tribute.",
            requirementsText: (inventoryMaterials['mat_berry'] || 0) >= 5 ? "Has 5 Berries" : "Requires 5 Berries",
            isAvailable: (inventoryMaterials['mat_berry'] || 0) >= 5,
            icon: "🍇",
            execute: () => {
              return {
                logText: `🍓 Mielikki's Favor: You offered wild berries at ${poi.name}. Received +150 XP, +15 Reputation, and 1x Poison Catalyst!`,
                removeMaterials: { 'mat_berry': 5 },
                xpChange: 150,
                reputationChange: 15,
                addCatalysts: { 'cat_poison': 1 },
                spawnEffectText: `+150 XP Favor! 🌟`,
                spawnEffectType: 'xp' as const
              };
            }
          }
        );
        break;

      case 'hearth':
        choicesList.push(
          {
            id: 'hearth_ilmarinen_laulu',
            title: "🔨 Chant Forge-Runes of Ilmarinen",
            description: "Sing the ancient smithy runes that Ilmarinen used to forge the sky-dome. Permanently increases DEF by +2 and yields 1x Fire Catalyst.",
            requirementsText: "Costs 10 MP",
            isAvailable: playerStats.mp >= 10,
            icon: "🔥",
            execute: () => {
              return {
                logText: `🔥 Ilmarinen's Forge: You sang the smithy runes at ${poi.name}. Permanent +2 Defense & 1x Fire Catalyst!`,
                mpChange: -10,
                defChange: 2,
                addCatalysts: { 'cat_fire': 1 },
                spawnEffectText: `+2 DEF & Fire Catalyst! 🔥`,
                spawnEffectType: 'heal' as const
              };
            }
          },
          {
            id: 'hearth_smelt',
            title: "⚒️ Smelt Raw Ore in Volcanic Crucible",
            description: "Feed 3 Iron Ore into the geothermal forge to produce a rare Ember Core & +100 Gold.",
            requirementsText: (inventoryMaterials['mat_iron'] || 0) >= 3 ? "Has 3 Iron Ore" : "Requires 3 Iron Ore",
            isAvailable: (inventoryMaterials['mat_iron'] || 0) >= 3,
            icon: "🪨",
            execute: () => {
              return {
                logText: `🌋 Crucible Smelting: You fed raw iron into ${poi.name}. Yielded 1x Ember Core & +100 Gold!`,
                removeMaterials: { 'mat_iron': 3 },
                addMaterials: { 'mat_ember_core': 1 },
                goldChange: 100,
                spawnEffectText: `+1 Ember Core! 🌋`,
                spawnEffectType: 'gold' as const
              };
            }
          }
        );
        break;

      case 'monolith':
        choicesList.push(
          {
            id: 'monolith_song_words',
            title: "📖 Channel Väinämöinen's Lost Words",
            description: "Decipher the primeval creation runes inscribed on the stone. Grants +3 Unspent Attribute Points and +120 XP!",
            requirementsText: "Costs 15 MP",
            isAvailable: playerStats.mp >= 15,
            icon: "📜",
            execute: () => {
              return {
                logText: `📜 Creation Runes: You deciphered ${poi.name}. Gained +3 Unspent Attribute Points and +120 XP!`,
                mpChange: -15,
                unspentPointsChange: 3,
                xpChange: 120,
                spawnEffectText: `+3 Attribute Points! ✨`,
                spawnEffectType: 'heal' as const
              };
            }
          },
          {
            id: 'monolith_gold_tribute',
            title: "💰 Gold Tribute to the Bard",
            description: "Place 75 Gold at the base of the rune stone to receive 2x random Elemental Catalysts and +20 Reputation.",
            requirementsText: playerStats.gold >= 75 ? "Costs 75 Gold" : "Requires 75 Gold",
            isAvailable: playerStats.gold >= 75,
            icon: "🪙",
            execute: () => {
              const allCats = ['cat_fire', 'cat_frost', 'cat_poison', 'cat_lightning', 'cat_shadow'];
              const cat1 = allCats[Math.floor(Math.random() * allCats.length)];
              const cat2 = allCats[Math.floor(Math.random() * allCats.length)];
              return {
                logText: `🪙 Bard's Tribute: You offered gold at ${poi.name}. Received 2x Catalysts and +20 Town Reputation!`,
                goldChange: -75,
                reputationChange: 20,
                addCatalysts: { [cat1]: 1, [cat2]: 1 },
                spawnEffectText: `+2 Catalysts! 🧪`,
                spawnEffectType: 'xp' as const
              };
            }
          }
        );
        break;

      case 'sunken_keep':
        choicesList.push(
          {
            id: 'keep_tuonela_song',
            title: "💀 Chant Song of Tuoni's River",
            description: "Sing the iron protective spells to cross Tuonela's black river. Grants SHIELDED (+3 DEF) and 1x Shadow Catalyst.",
            requirementsText: "Costs 12 MP",
            isAvailable: playerStats.mp >= 12,
            icon: "🏰",
            execute: () => {
              return {
                logText: `🏰 Tuonela Protection: You sang Tuoni's runes at ${poi.name}. Gained SHIELDED (+3 DEF) & 1x Shadow Catalyst!`,
                mpChange: -12,
                applyShielded: true,
                addCatalysts: { 'cat_shadow': 1 },
                spawnEffectText: `SHIELDED! 🛡️`,
                spawnEffectType: 'heal' as const
              };
            }
          },
          {
            id: 'keep_ahti_gold',
            title: "🌊 Scavenge Ahti's Sunken Treasure",
            description: "Pry gold coins and copper plating from Ahti's drowned citadel.",
            requirementsText: "None",
            isAvailable: true,
            icon: "💎",
            execute: () => {
              return {
                logText: `🌊 Sunken Salvage: You scavenged ${poi.name}, retrieving +180 Gold and +2 Copper!`,
                goldChange: 180,
                addMaterials: { 'mat_copper': 2 },
                spawnEffectText: `+180 Gold! 🪙`,
                spawnEffectType: 'gold' as const
              };
            }
          }
        );
        break;

      case 'fossil':
        choicesList.push(
          {
            id: 'fossil_vipunen_song',
            title: "🦴 Channel Song-Giant Antero Vipunen",
            description: "Echo the deep tectonic vibrations of Vipunen's ribs. Permanently expands Max Vitality by +15 HP!",
            requirementsText: "Costs 15 MP",
            isAvailable: playerStats.mp >= 15,
            icon: "🐉",
            execute: () => {
              return {
                logText: `🦴 Giant's Resonance: You channeled Vipunen at ${poi.name}. Permanent +15 Max HP!`,
                mpChange: -15,
                maxHpChange: 15,
                hpChange: 15,
                spawnEffectText: `+15 Max HP! 🩸`,
                spawnEffectType: 'heal' as const
              };
            }
          },
          {
            id: 'fossil_exhume',
            title: "⛏️ Exhume Calcified Dragon Marrow",
            description: "Extract hardened marrow and rare mithril deposits from the giant fossilized structure.",
            requirementsText: "None",
            isAvailable: true,
            icon: "🦴",
            execute: () => {
              return {
                logText: `🦴 Fossil Extraction: You chipped marrow from ${poi.name}, gaining +1 Mithril Ore & +150 XP!`,
                addMaterials: { 'mat_mithril': 1 },
                xpChange: 150,
                spawnEffectText: `+1 Mithril Ore! 💎`,
                spawnEffectType: 'gold' as const
              };
            }
          }
        );
        break;

      default:
        break;
    }

    return choicesList;
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

  // Filter list of valid attuned waystones for fast travel
  const attunedWaystoneList = (allKnownWaystones.length > 0 ? allKnownWaystones : [poi]).filter(w => 
    w.isAttunedWaystone || attunedWaystones.includes(w.id)
  );

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
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono text-slate-500 block uppercase tracking-wider">KALEVALA LANDMARK</span>
                {isAlreadyAttuned && (
                  <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 flex items-center gap-1 font-mono">
                    🔮 WAYSTONE ATTUNED
                  </span>
                )}
              </div>
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
          {showWaystoneNetwork ? (
            /* Fast Travel Waystone Subview */
            <div className="space-y-3 animate-fade-in">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <div className="flex items-center gap-2">
                  <Compass className="w-5 h-5 text-cyan-400 animate-spin-slow" />
                  <span className="text-xs font-black uppercase tracking-wider text-cyan-300">LEYLINE WAYSTONE NETWORK</span>
                </div>
                <button
                  type="button"
                  onClick={() => setShowWaystoneNetwork(false)}
                  className="text-[10px] text-slate-400 hover:text-white px-2 py-1 rounded bg-slate-800 font-mono"
                >
                  ← Back to Landmark
                </button>
              </div>

              <p className="text-xs text-slate-300 leading-relaxed font-sans">
                Select any attuned Leyline Waystone across Sunder's overworld chunks to instantly materialize there.
              </p>

              <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                {attunedWaystoneList.length === 0 ? (
                  <div className="p-4 bg-slate-950/40 rounded-xl text-center text-xs text-slate-500 italic">
                    No Leyline Waystones currently attuned. Click "Attune Leyline Waystone" at any landmark to unlock fast travel!
                  </div>
                ) : (
                  attunedWaystoneList.map((waystone) => {
                    const isCurrentPOI = waystone.id === poi.id;
                    return (
                      <div
                        key={waystone.id}
                        className={`p-3 rounded-xl border flex items-center justify-between gap-3 ${
                          isCurrentPOI 
                            ? 'bg-cyan-950/30 border-cyan-500/40 text-cyan-200' 
                            : 'bg-slate-950/50 border-slate-800 text-slate-200 hover:border-slate-700'
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <span className="text-2xl">{waystone.char || "🗿"}</span>
                          <div>
                            <div className="flex items-center gap-1.5">
                              <span className="text-xs font-bold text-slate-100">{waystone.name}</span>
                              {isCurrentPOI && (
                                <span className="text-[8px] bg-cyan-500/20 text-cyan-300 px-1 rounded font-mono">YOU ARE HERE</span>
                              )}
                            </div>
                            <span className="text-[10px] text-slate-400 font-mono">
                              Chunk ({waystone.chunkX ?? 0}, {waystone.chunkY ?? 0}) • Tile ({waystone.x}, {waystone.y})
                            </span>
                          </div>
                        </div>

                        {!isCurrentPOI && (
                          <button
                            type="button"
                            onClick={() => {
                              if (onFastTravel) {
                                onFastTravel(
                                  waystone.chunkX ?? 0,
                                  waystone.chunkY ?? 0,
                                  waystone.x,
                                  waystone.y,
                                  waystone.name
                                );
                                playSound('spell');
                                onClose();
                              }
                            }}
                            className="py-1.5 px-3 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-slate-950 text-[10px] font-black uppercase tracking-wider cursor-pointer transition-all flex items-center gap-1 shadow-md active:scale-95"
                          >
                            <Navigation className="w-3 h-3" />
                            TELEPORT
                          </button>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          ) : (
            /* Normal POI Interactive View */
            <>
              {/* Landmark Lore card */}
              <div className="bg-slate-950/50 border border-slate-800 p-4 rounded-xl space-y-2.5 relative overflow-hidden">
                <div className="absolute right-0 bottom-0 text-7xl font-sans opacity-[0.02] translate-y-3 translate-x-1 select-none font-black text-white">
                  {poi.char}
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-amber-500 uppercase tracking-wider font-mono">
                    <span>📖 Mythic Lore</span>
                  </div>
                  {attunedWaystoneList.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setShowWaystoneNetwork(true)}
                      className="text-[10px] font-bold text-cyan-400 hover:text-cyan-300 bg-cyan-950/30 border border-cyan-500/30 px-2 py-0.5 rounded flex items-center gap-1 font-mono cursor-pointer transition-colors"
                    >
                      <Compass className="w-3 h-3" />
                      Waystone Network ({attunedWaystoneList.length})
                    </button>
                  )}
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
                    {poi.isInteracted ? "Landmark Expended" : "Finnish Mythic Paths"}
                  </span>
                  <span className="text-[9px] text-slate-500 font-mono">
                    {poi.isInteracted ? "🔒 Fully Resolved" : "⚡ Choose Action"}
                  </span>
                </div>

                {poi.isInteracted ? (
                  <div className="bg-slate-950/20 border border-slate-800/50 rounded-xl p-4 text-center text-slate-400 text-xs">
                    ✨ <span className="font-semibold text-slate-300">{poi.name}'s</span> ancient magic has been channeled by your soul. However, the echoes of its Spell-Song still resonate here.
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
            </>
          )}
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
