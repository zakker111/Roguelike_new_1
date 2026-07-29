import React, { useState } from 'react';
import { X, MessageSquare, Scroll, ShoppingBag, Swords, ShieldAlert, Sparkles, HelpCircle } from 'lucide-react';
import { NPC, PlayerStats } from '../../types';
import { playSound } from '../../utils/audio';

export interface DialogueModalProps {
  npc: NPC;
  playerStats: PlayerStats;
  townReputation?: number;
  quests?: any[];
  inventoryMaterials?: Record<string, number>;
  onClose: () => void;
  onOpenTrade?: () => void;
  onAcceptQuest?: (questId: string) => void;
  onTurnInQuest?: (questId: string) => void;
  addLogMessage?: (msg: string, type?: string) => void;
}

export const DialogueModal: React.FC<DialogueModalProps> = ({
  npc,
  playerStats,
  townReputation = 100,
  quests = [],
  inventoryMaterials = {},
  onClose,
  onOpenTrade,
  onAcceptQuest,
  onTurnInQuest,
  addLogMessage,
}) => {
  const [dialogueIndex, setDialogueIndex] = useState(0);
  const [customQuote, setCustomQuote] = useState<string | null>(null);

  const isMerchant = npc.role === 'merchant' || npc.role === 'blacksmith' || npc.role === 'apothecary' || npc.role === 'merchant_seppo';

  const handleNextDialogue = () => {
    playSound('loot');
    if (npc.dialogue && npc.dialogue.length > 0) {
      setDialogueIndex((prev) => (prev + 1) % npc.dialogue.length);
    }
    setCustomQuote(null);
  };

  const handleAskRumors = () => {
    playSound('loot');
    const rumors = [
      "The Deep Abyss dungeons hold ancient artifacts, but tread lightly past floor 5.",
      "Bandits frequently raid the trade routes between Sunder and the Vanguard Fortress.",
      "Ancient shrines grant powerful elemental blessings if you make a small offering.",
      "Controlling watchtowers generates steady passive revenue for your faction guild."
    ];
    const rumor = rumors[Math.floor(Math.random() * rumors.length)];
    setCustomQuote(`"Listen closely... ${rumor}"`);
    if (addLogMessage) {
      addLogMessage(`🗣️ ${npc.name} shares a rumor: "${rumor}"`, 'info');
    }
  };

  const currentText = customQuote || (npc.dialogue && npc.dialogue[dialogueIndex]) || "Greeting, adventurer.";

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center z-[9999] p-4 select-none animate-fade-in">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-lg w-full shadow-2xl flex flex-col gap-5 animate-scale-up">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-center text-2xl font-mono shadow-inner">
              <span style={{ color: npc.color }}>{npc.char}</span>
            </div>
            <div>
              <h3 className="text-base font-extrabold text-slate-100 flex items-center gap-2">
                {npc.name}
              </h3>
              <span className="text-[10px] font-bold tracking-wider uppercase text-amber-400 bg-amber-950/30 px-2 py-0.5 rounded border border-amber-900/40">
                {npc.role.replace('_', ' ')}
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Dialogue Display Box */}
        <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-4 flex flex-col gap-2 relative">
          <div className="text-xs text-amber-200/90 italic leading-relaxed font-serif">
            "{currentText}"
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col gap-2">
          <button
            onClick={handleNextDialogue}
            className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs rounded-xl transition-colors cursor-pointer flex items-center justify-center gap-2 border border-slate-700"
          >
            <MessageSquare className="w-4 h-4 text-cyan-400" />
            <span>Continue Conversation</span>
          </button>

          <button
            onClick={handleAskRumors}
            className="w-full py-2.5 bg-purple-950/40 hover:bg-purple-900/50 text-purple-300 font-bold text-xs rounded-xl transition-colors cursor-pointer flex items-center justify-center gap-2 border border-purple-800/50"
          >
            <Sparkles className="w-4 h-4 text-purple-400" />
            <span>Ask for Regional Rumors & Tips</span>
          </button>

          {isMerchant && onOpenTrade && (
            <button
              onClick={() => {
                onClose();
                onOpenTrade();
              }}
              className="w-full py-2.5 bg-amber-600 hover:bg-amber-500 text-slate-950 font-bold text-xs rounded-xl transition-colors cursor-pointer flex items-center justify-center gap-2 shadow-lg shadow-amber-950/40"
            >
              <ShoppingBag className="w-4 h-4" />
              <span>Open Merchant Store</span>
            </button>
          )}
        </div>

        {/* Footer info */}
        <div className="flex justify-between items-center text-[10px] text-slate-500 border-t border-slate-800/60 pt-2 font-mono">
          <span>Town Rep: {townReputation}</span>
          <span>Role: {npc.role}</span>
        </div>
      </div>
    </div>
  );
};

export default DialogueModal;
