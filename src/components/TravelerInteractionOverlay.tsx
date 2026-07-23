import React, { useState } from 'react';
import { X, Swords, ShoppingBag, MessageSquare, ShieldAlert, Eye, EyeOff, Compass } from 'lucide-react';
import { NPC, PlayerStats } from '../types';
import { playSound } from '../utils/audio';

interface TravelerInteractionOverlayProps {
  npc: NPC;
  playerStats: PlayerStats;
  visibleTiles: boolean[][];
  otherNpcs: NPC[];
  onClose: () => void;
  onTrade: () => void;
  onAttack: (witnessed: boolean) => void;
  gameStateQuests: any[];
  inventoryMaterials: Record<string, number>;
  onAcceptQuest: (questId: string) => void;
  onTurnInQuest: (questId: string) => void;
}

export default function TravelerInteractionOverlay({
  npc,
  playerStats,
  visibleTiles,
  otherNpcs,
  onClose,
  onTrade,
  onAttack,
  gameStateQuests,
  inventoryMaterials,
  onAcceptQuest,
  onTurnInQuest,
}: TravelerInteractionOverlayProps) {
  const [currentDialogue, setCurrentDialogue] = useState<string>(
    npc.dialogue[0] || "Hello, traveler. Sunder is a vast and untamed land."
  );
  const [hasChatted, setHasChatted] = useState(false);

  // Check if there are other NPCs on visible tiles who can witness a crime
  const witnesses = otherNpcs.filter(other => {
    if (other.id === npc.id) return false;
    if (other.role === 'quest_board' as any) return false; // Boards can't witness crimes
    return visibleTiles[other.y]?.[other.x] === true;
  });

  const hasWitnesses = witnesses.length > 0;

  const handleChat = () => {
    playSound('loot');
    setHasChatted(true);
    
    // Select a tip or lore rumor based on traveler role
    let responses: string[] = [];
    if (npc.role === 'traveler_herbalist') {
      responses = [
        "Did you know? Mixing Cave Mushroom with Silver Powder creates a potion that shields your skin from damage!",
        "If you get poisoned in the deep dungeons, swallow a Clear Antidote immediately. Don't let the toxic decay slow your sword.",
        "They say the Moonshadow Cove region holds the rarest herbs, but watch out for Syndicate rogue ambushers.",
        "Always harvest thick timber when you find it; campfire charcoal is vital for crafting advanced elixirs."
      ];
    } else if (npc.role === 'traveler_hunter') {
      responses = [
        "A heavy bow requires dexterity, but it lets you pick off trapmasters before they line up poison dart traps.",
        "Animal pelts are valuable for tailoring, but a blacksmith can also use them to reinforce leather armor linings.",
        "If you encounter a wild boar, don't stand in a straight line. They charge forward with blinding speed!",
        "Always keep a backup melee weapon. Ranged weapons suffer a massive damage penalty in close quarters!"
      ];
    } else {
      responses = [
        "There are four major watchtowers in Sunder. Controlling them allows your faction to accumulate passive tax gold!",
        "Every 8 hours, Captain Jack sails between Oakhaven and Vanguard Port. Keep 200 gold ready for passage.",
        "The notices on Oakhaven's boards aren't just work—they train your companions and level them up autonomously!",
        "Resting at beds or campfires purges all physical fatigue. A drowsy champion makes poor critical hits."
      ];
    }

    const roll = Math.floor(Math.random() * responses.length);
    setCurrentDialogue(`"Here's a bit of advice from the trail, adventurer... ${responses[roll]}"`);
  };

  const travelerTypeLabel = 
    npc.role === 'traveler_herbalist' ? '🌿 WILDERNESS HERBALIST' :
    npc.role === 'traveler_hunter' ? '🏹 WILDERNESS HUNTER' : '🚶 TRAVELING PILGRIM';

  const travelerIcon = 
    npc.role === 'traveler_herbalist' ? '🌿' :
    npc.role === 'traveler_hunter' ? '🏹' : '🚶';

  const questId = 
    npc.role === 'traveler_herbalist' ? 'q_traveler_herbalist_mushrooms' :
    npc.role === 'traveler_hunter' ? 'q_traveler_hunter_pelts' :
    npc.role === 'traveler_pilgrim' ? 'q_traveler_pilgrim_relic' : null;

  const quest = questId ? gameStateQuests.find(q => q.id === questId) : null;

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center z-[9999] p-4 select-none animate-fade-in">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-md w-full shadow-2xl flex flex-col gap-5 animate-scale-up">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2.5">
            <span className="text-2xl">{travelerIcon}</span>
            <div>
              <span className="text-[9px] font-black uppercase text-amber-500 tracking-wider">
                {travelerTypeLabel}
              </span>
              <h3 className="text-sm font-extrabold text-slate-100 font-sans mt-0.5">
                {npc.name.split(' (')[0]}
              </h3>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Portrait & Dialogue */}
        <div className="bg-slate-950/50 rounded-xl p-4 border border-slate-800/80 flex flex-col gap-2 min-h-[90px] justify-center relative">
          <div className="absolute top-2 right-2 flex items-center gap-1 text-[9px] text-slate-500 font-mono">
            <Compass className="w-3 h-3 animate-spin-slow" /> Wilderness Encounter
          </div>
          <p className="text-xs text-slate-300 italic leading-relaxed font-sans pr-4">
            {currentDialogue}
          </p>
        </div>

        {/* Quest Section */}
        {quest && (
          <div className="bg-slate-950/40 border border-amber-500/20 rounded-xl p-3.5 flex flex-col gap-2">
            <div className="flex justify-between items-center">
              <span className="text-[10px] font-black text-amber-400 uppercase tracking-wider flex items-center gap-1">
                📜 WILDERNESS QUEST
              </span>
              <span className={`text-[8px] font-mono px-1.5 py-0.5 rounded uppercase font-bold ${
                quest.status === 'turned_in' ? 'bg-slate-900 text-slate-500' :
                quest.status === 'active' ? 'bg-amber-500 text-slate-950' : 'bg-slate-900 text-amber-400'
              }`}>
                {quest.status}
              </span>
            </div>
            <h4 className="text-xs font-bold text-slate-200 mt-0.5">{quest.title}</h4>
            <p className="text-[10px] text-slate-400 leading-normal">{quest.description}</p>
            
            <div className="flex items-center justify-between text-[10px] font-mono border-t border-slate-800/60 pt-2 mt-1">
              <span className="text-slate-300">Gold: <strong>+{quest.rewardGold}g</strong></span>
              {quest.targetItem && (
                <span className="text-slate-400">
                  Needs: <strong className={(inventoryMaterials[quest.targetItem] || 0) >= quest.targetCount ? 'text-emerald-400' : 'text-slate-300'}>
                    {inventoryMaterials[quest.targetItem] || 0}/{quest.targetCount}
                  </strong>
                </span>
              )}
            </div>

            <div className="flex justify-end gap-2 mt-1.5">
              {quest.status === 'available' && (
                <>
                  <button
                    onClick={() => {
                      playSound('slash');
                      onAttack(hasWitnesses);
                      onClose();
                    }}
                    className="px-2.5 py-1 bg-rose-950/60 hover:bg-rose-900 border border-rose-500/30 text-rose-300 text-[9px] font-bold uppercase rounded cursor-pointer duration-150 transition-colors"
                  >
                    ⚔️ Refuse & Attack
                  </button>
                  <button
                    onClick={() => {
                      playSound('loot');
                      onAcceptQuest(quest.id);
                    }}
                    className="px-2.5 py-1 bg-amber-500 hover:bg-amber-400 text-slate-950 text-[9px] font-bold uppercase rounded cursor-pointer duration-150 transition-colors"
                  >
                    Accept Quest
                  </button>
                </>
              )}
              {quest.status === 'active' && (
                <>
                  <button
                    onClick={() => {
                      playSound('slash');
                      onAttack(hasWitnesses);
                      onClose();
                    }}
                    className="px-2.5 py-1 bg-rose-950/60 hover:bg-rose-900 border border-rose-500/30 text-rose-300 text-[9px] font-bold uppercase rounded cursor-pointer duration-150 transition-colors mr-auto"
                  >
                    ⚔️ Betray & Attack
                  </button>
                  <button
                    onClick={() => {
                      onTurnInQuest(quest.id);
                    }}
                    className={`px-2.5 py-1 text-slate-950 text-[9px] font-bold uppercase rounded cursor-pointer duration-150 transition-colors flex items-center gap-1 ${
                      quest.targetItem && (inventoryMaterials[quest.targetItem] || 0) >= quest.targetCount
                        ? 'bg-emerald-500 hover:bg-emerald-400'
                        : 'bg-slate-800 text-slate-400 hover:bg-slate-750 cursor-not-allowed opacity-50'
                    }`}
                    disabled={!quest.targetItem || (inventoryMaterials[quest.targetItem] || 0) < quest.targetCount}
                  >
                    Deliver & Complete
                  </button>
                </>
              )}
              {quest.status === 'turned_in' && (
                <span className="text-[9px] text-emerald-500 font-mono italic">
                  ✓ Rewards Claimed
                </span>
              )}
              {quest.status === 'failed' && (
                <span className="text-[9px] text-rose-500 font-mono italic">
                  ❌ Quest Failed (Assaulted)
                </span>
              )}
            </div>
          </div>
        )}

        {/* Crime Witness Status Indicator */}
        <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-3.5 flex items-start gap-3">
          {hasWitnesses ? (
            <>
              <div className="p-1.5 bg-rose-500/10 border border-rose-500/20 rounded-lg text-rose-500 shrink-0">
                <Eye className="w-4 h-4" />
              </div>
              <div className="flex flex-col gap-0.5">
                <span className="text-[10px] font-bold text-rose-400 flex items-center gap-1">
                  ⚠️ WITNESSES DETECTED
                </span>
                <span className="text-[9px] text-slate-400 leading-normal">
                  <strong className="text-slate-200">{witnesses.map(w => w.name.split(' (')[0]).join(', ')}</strong> is nearby and watching! Attacking will instantly destroy your town reputation.
                </span>
              </div>
            </>
          ) : (
            <>
              <div className="p-1.5 bg-emerald-500/10 border border-emerald-500/20 rounded-lg text-emerald-500 shrink-0">
                <EyeOff className="w-4 h-4" />
              </div>
              <div className="flex flex-col gap-0.5">
                <span className="text-[10px] font-bold text-emerald-400 flex items-center gap-1">
                  🤫 NO WITNESSES PRESENT
                </span>
                <span className="text-[9px] text-slate-400 leading-normal">
                  You are completely isolated in the wilderness. No other NPCs can see your actions. You can execute an assault without public reputation consequences.
                </span>
              </div>
            </>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col gap-2.5">
          <div className="flex gap-2.5">
            <button
              onClick={handleChat}
              disabled={hasChatted}
              className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-750 disabled:opacity-40 text-slate-200 font-bold text-xs rounded-xl transition-all cursor-pointer border border-slate-700/60 flex items-center justify-center gap-1.5"
            >
              <MessageSquare className="w-3.5 h-3.5" />
              Ask for Advice
            </button>

            <button
              onClick={() => {
                onTrade();
                onClose();
              }}
              className="flex-1 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5"
            >
              <ShoppingBag className="w-3.5 h-3.5" />
              Trade Goods
            </button>
          </div>

          <button
            onClick={() => {
              onAttack(hasWitnesses);
              onClose();
            }}
            className="w-full py-2.5 bg-rose-950/40 hover:bg-rose-900/30 border border-rose-500/30 text-rose-400 font-bold text-xs rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5"
          >
            <Swords className="w-3.5 h-3.5" />
            Assault (Unlawful Strike!)
          </button>
        </div>
      </div>
    </div>
  );
}
