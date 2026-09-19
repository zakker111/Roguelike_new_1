import React, { useState, useMemo, useEffect } from 'react';
import { X, MessageSquare, Scroll, ShoppingBag, Swords, ShieldAlert, Sparkles, HelpCircle, CloudRain, Sun, Snowflake, CloudFog, CupSoda, Navigation } from 'lucide-react';
import { NPC, PlayerStats } from '../../types';
import { playSound } from '../../utils/audio';
import { getWeatherTimeContextDialogue, getRegionalRumorAndGossip } from '../../utils/npcDialogue';

export interface DialogueModalProps {
  npc: NPC;
  playerStats: PlayerStats;
  townReputation?: number;
  quests?: any[];
  inventoryMaterials?: Record<string, number>;
  weather?: string;
  gameTime?: number;
  biome?: string;
  season?: string;
  onClose: () => void;
  onOpenTrade?: () => void;
  onAcceptQuest?: (questId: string) => void;
  onTurnInQuest?: (questId: string) => void;
  onBuyTavernDrink?: () => void;
  addLogMessage?: (msg: string, type?: string) => void;
}

export const DialogueModal: React.FC<DialogueModalProps> = ({
  npc,
  playerStats,
  townReputation = 100,
  quests = [],
  inventoryMaterials = {},
  weather = 'clear',
  gameTime = 720,
  biome = 'forest',
  season = 'spring',
  onClose,
  onOpenTrade,
  onAcceptQuest,
  onTurnInQuest,
  onBuyTavernDrink,
  addLogMessage,
}) => {
  const [dialogueIndex, setDialogueIndex] = useState(0);
  const [customQuote, setCustomQuote] = useState<string | null>(null);

  // Close dialogue on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        e.stopPropagation();
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown, true);
    return () => window.removeEventListener('keydown', handleKeyDown, true);
  }, [onClose]);

  const contextualLines = useMemo(() => {
    return getWeatherTimeContextDialogue(npc, { weather, gameTime, biome, season, townReputation });
  }, [npc, weather, gameTime, biome, season, townReputation]);

  const isMerchant = 
    npc.role === 'merchant' || 
    npc.role === 'blacksmith' || 
    npc.role === 'apothecary' || 
    npc.role === 'merchant_seppo' || 
    npc.role === 'fishmonger' || 
    npc.role === 'harbor_master' || 
    npc.role === 'sailor' || 
    npc.role === 'dockworker' || 
    npc.role === 'ferried_navigator' ||
    npc.role === 'merchant_caravan' ||
    npc.role === ('merchant_caravan_ambushed' as any) ||
    npc.role === 'traveler_merchant' ||
    (npc.role && typeof npc.role === 'string' && (npc.role.includes('merchant') || npc.role.includes('caravan') || npc.role.includes('trader'))) ||
    (npc.name && (npc.name.toLowerCase().includes('caravan') || npc.name.toLowerCase().includes('merchant') || npc.name.toLowerCase().includes('trader') || npc.name.toLowerCase().includes('sledger') || npc.name.toLowerCase().includes('barger') || npc.name.toLowerCase().includes('caravaneer')));

  const isCaravanNpc = 
    npc.role === 'merchant_caravan' ||
    npc.role === ('merchant_caravan_ambushed' as any) ||
    npc.role === 'traveler_merchant' ||
    npc.id?.includes('caravan') ||
    npc.id?.includes('wandering') ||
    (npc.name && (npc.name.toLowerCase().includes('caravan') || npc.name.toLowerCase().includes('caravaneer') || npc.name.toLowerCase().includes('sledger') || npc.name.toLowerCase().includes('barger') || npc.name.toLowerCase().includes('trader')));

  const isTavernOrDrinking = npc.role === 'innkeeper' || npc.role === 'drunk_villager' || npc.role === 'patron' || npc.isDrinking || (npc.scheduleState === 'leisure' && npc.isDrinking);

  const handleNextDialogue = () => {
    playSound('loot');
    if (contextualLines.length > 0) {
      setDialogueIndex((prev) => (prev + 1) % contextualLines.length);
    }
    setCustomQuote(null);
  };

  const handleAskRumors = () => {
    playSound('loot');
    const rumor = getRegionalRumorAndGossip({ weather, biome, season });
    setCustomQuote(`"Listen closely... ${rumor}"`);
    if (addLogMessage) {
      addLogMessage(`🗣️ ${npc.name} shares a rumor: "${rumor}"`, 'info');
    }
  };

  const handleBuyDrink = () => {
    playSound('loot');
    if (playerStats.gold < 5) {
      setCustomQuote(`"You're short on coin, friend! Drinks are 5 Gold a glass."`);
      return;
    }
    const toasts = [
      `"To Sunder's heroes! May your blade stay sharp!"`,
      `"Bottoms up! Nothing beats tavern mead after a long road."`,
      `"A toast to brave travelers! May fortune favor your path."`,
      `"Ah, hits the spot! Cheers to good company and warm hearths!"`
    ];
    const toast = toasts[Math.floor(Math.random() * toasts.length)];
    setCustomQuote(toast);
    if (onBuyTavernDrink) {
      onBuyTavernDrink();
    } else if (addLogMessage) {
      addLogMessage(`🍻 You shared a tavern toast with ${npc.name}! (-5 Gold)`, 'info');
    }
  };

  const currentText = customQuote || (contextualLines && contextualLines[dialogueIndex]) || "Greeting, adventurer.";

  const weatherIcon = 
    weather === 'rainy' ? <CloudRain className="w-3.5 h-3.5 text-cyan-400" /> :
    weather === 'blizzard' || weather === 'snowy' ? <Snowflake className="w-3.5 h-3.5 text-blue-300" /> :
    weather === 'foggy' ? <CloudFog className="w-3.5 h-3.5 text-slate-400" /> :
    <Sun className="w-3.5 h-3.5 text-amber-400" />;

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
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-[10px] font-bold tracking-wider uppercase text-amber-400 bg-amber-950/30 px-2 py-0.5 rounded border border-amber-900/40">
                  {npc.role.replace('_', ' ')}
                </span>
                <span className="text-[10px] text-slate-400 capitalize flex items-center gap-1 bg-slate-950 px-2 py-0.5 rounded border border-slate-800 font-mono">
                  {weatherIcon} {weather}
                </span>
              </div>
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
        <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-4 flex flex-col gap-2 relative min-h-[80px] justify-center">
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
            <span>Continue Conversation ({dialogueIndex + 1}/{contextualLines.length})</span>
          </button>

          <button
            onClick={handleAskRumors}
            className="w-full py-2.5 bg-purple-950/40 hover:bg-purple-900/50 text-purple-300 font-bold text-xs rounded-xl transition-colors cursor-pointer flex items-center justify-center gap-2 border border-purple-800/50"
          >
            <Sparkles className="w-4 h-4 text-purple-400" />
            <span>Ask for Regional Rumors & Weather Tips</span>
          </button>

          {isTavernOrDrinking && (
            <button
              onClick={handleBuyDrink}
              className="w-full py-2.5 bg-amber-950/50 hover:bg-amber-900/60 text-amber-300 font-bold text-xs rounded-xl transition-colors cursor-pointer flex items-center justify-center gap-2 border border-amber-800/60 shadow-md"
            >
              <CupSoda className="w-4 h-4 text-amber-400" />
              <span>🍻 Buy a Round of Drinks (5 Gold)</span>
            </button>
          )}

          {isCaravanNpc && onOpenTrade && (
            <button
              onClick={() => {
                onClose();
                onOpenTrade();
              }}
              className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-extrabold text-xs rounded-xl transition-all cursor-pointer flex items-center justify-center gap-2 shadow-lg shadow-blue-950/50 border border-blue-400/40 animate-pulse"
            >
              <Navigation className="w-4 h-4 text-yellow-300" />
              <span>🗺️ View Caravan Escort Routes & Fast Travel</span>
            </button>
          )}

          {isMerchant && onOpenTrade && (
            <button
              onClick={() => {
                onClose();
                onOpenTrade();
              }}
              className="w-full py-2.5 bg-amber-600 hover:bg-amber-500 text-slate-950 font-bold text-xs rounded-xl transition-colors cursor-pointer flex items-center justify-center gap-2 shadow-lg shadow-amber-950/40"
            >
              <ShoppingBag className="w-4 h-4" />
              <span>Open Merchant Store & Caravan Counter</span>
            </button>
          )}
        </div>

        {/* Footer info */}
        <div className="flex justify-between items-center text-[10px] text-slate-500 border-t border-slate-800/60 pt-2 font-mono">
          <span>Town Rep: {townReputation}</span>
          <span className="capitalize">{biome} Biome • {season}</span>
        </div>
      </div>
    </div>
  );
};

export default DialogueModal;

