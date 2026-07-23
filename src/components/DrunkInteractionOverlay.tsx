import React, { useState } from 'react';
import { X, Wine, Coins, Sparkles, Zap, Hand, Dices } from 'lucide-react';
import { NPC, PlayerStats } from '../types';
import { playSound } from '../utils/audio';

interface DrunkInteractionOverlayProps {
  npc: NPC;
  playerStats: PlayerStats;
  onClose: () => void;
  onApplyEffects: (effects: {
    logText: string;
    goldChange: number;
    hpChange?: number;
    mpChange?: number;
    addMaterials?: { [matId: string]: number };
    addCatalysts?: { [catId: string]: number };
    spawnEffectText: string;
    spawnEffectType: 'heal' | 'damage' | 'xp' | 'gold' | 'loot';
    buff?: {
      name: string;
      type: 'atk' | 'crit' | 'def' | 'speed';
      atkBonus?: number;
      critBonus?: number;
      defBonus?: number;
      turnsRemaining: number;
    };
  }) => void;
}

export default function DrunkInteractionOverlay({
  npc,
  playerStats,
  onClose,
  onApplyEffects,
}: DrunkInteractionOverlayProps) {
  const [currentDialogue, setCurrentDialogue] = useState<string>(
    npc.dialogue[Math.floor(Math.random() * 3)] || "Hic! This tavern is spinning..."
  );
  const [outcomeMessage, setOutcomeMessage] = useState<string | null>(null);
  const [coinBet, setCoinBet] = useState<'heads' | 'tails' | null>(null);
  const [coinResult, setCoinResult] = useState<{ choice: string; rolled: string; won: boolean } | null>(null);

  const handleBuyDrink = () => {
    if (playerStats.gold < 25) {
      setCurrentDialogue("Hic! You don't even have 25 gold for a draft... Go away, cheapskate!");
      return;
    }

    playSound('spell');
    const roll = Math.random();
    let text = '';
    let goldChange = -25;
    let addMaterials: { [id: string]: number } | undefined = undefined;
    let addCatalysts: { [id: string]: number } | undefined = undefined;
    let spawnEffectText = '🍻 CHEERS!';
    let spawnEffectType: 'heal' | 'damage' | 'xp' | 'gold' | 'loot' = 'heal';
    let buff: any = undefined;

    if (roll < 0.35) {
      // Gift raw material
      const mats = ['mat_raw_fish', 'mat_iron', 'mat_copper', 'mat_pine'];
      const chosenMat = mats[Math.floor(Math.random() * mats.length)];
      addMaterials = { [chosenMat]: 2 };
      text = `*Clinks glasses* "Aha! You are a true friend! Here, take some stuff from my backpack... I don't even remember why I have it. Hic!"`;
      setOutcomeMessage(`Gifted +2 Raw Materials!`);
    } else if (roll < 0.70) {
      // Drunken luck buff
      buff = {
        name: 'Drunken Cheer',
        type: 'crit' as const,
        critBonus: 0.15, // +15% crit
        turnsRemaining: 20,
      };
      text = `"I feel... AMAZING! You look like a hero, go strike some monsters with my ultimate tavern blessing! Hic!"`;
      setOutcomeMessage(`Granted Drunken Cheer Buff (+15% Crit Chance for 20 turns)!`);
    } else {
      // Rumor gossip
      const tips = [
        "Did you know? Cooking at campfires purges physical exhaustion fully if you make Shadow Jerky!",
        "Baron Tobias's caravans carry precious titanium alloys... but look out for bandit ambushes!",
        "If you discover a deep dungeon entrance (∩), make sure your gear is at least level 2!",
        "Barnaby says the Oakhaven notice boards have infinite bounties that complete while you walk!"
      ];
      const tip = tips[Math.floor(Math.random() * tips.length)];
      text = `*Leans in and whispers stinky brew-fumes* "Listen close... I heard a rumor... ${tip}"`;
      setOutcomeMessage(`Learned tavern rumor & gossip!`);
    }

    setCurrentDialogue(text);
    onApplyEffects({
      logText: `🍻 [TAVERN] Bought a drink for ${npc.name}. They said: "${text}"`,
      goldChange,
      addMaterials,
      addCatalysts,
      spawnEffectText,
      spawnEffectType,
      buff,
    });
  };

  const handleSlap = () => {
    playSound('bump');
    const roll = Math.random();
    let text = '';
    let goldChange = 0;
    let hpChange = 0;
    let spawnEffectText = '👋 SLAPPED!';
    let spawnEffectType: 'heal' | 'damage' | 'xp' | 'gold' | 'loot' = 'damage';

    if (roll < 0.40) {
      // Anger pickpocket
      const toll = Math.min(playerStats.gold, 5);
      goldChange = -toll;
      text = `"HOW DARE YOU SLAP ME! *Fleshes around* I'll teach you some manners!" *Hic! They pickpocketed ${toll} Gold during the struggle!*`;
      setOutcomeMessage(`Lost -${toll} Gold in the scuffle!`);
    } else if (roll < 0.80) {
      // Throw drink (exhaustion reduction but loses speed)
      hpChange = -2;
      text = `"OW! *Splash* Wake up yourself!" *They threw cold ale in your face! It stings, but you feel slightly energized.*`;
      setOutcomeMessage(`Ale splashed in your face! (-2 HP, but highly awake)`);
    } else {
      // Drop coin
      goldChange = Math.floor(Math.random() * 6) + 3;
      text = `"Yawn... *Stumbles* Ah! My pocket has a hole!" *They trip over a stool and drop some coins on the floor!*`;
      setOutcomeMessage(`Found +${goldChange} Gold on the floor!`);
    }

    setCurrentDialogue(text);
    onApplyEffects({
      logText: `👋 [TAVERN] You slapped ${npc.name}! They responded: "${text}"`,
      goldChange,
      hpChange,
      spawnEffectText,
      spawnEffectType,
    });
  };

  const handleCoinFlip = (guess: 'heads' | 'tails') => {
    if (playerStats.gold < 25) {
      setCurrentDialogue("Hic! Bet requires 25 gold coins. Come back when you have some shiny metal!");
      return;
    }

    playSound('loot');
    const rolled = Math.random() > 0.5 ? 'heads' : 'tails';
    const won = guess === rolled;
    let goldChange = won ? 25 : -25;
    let text = '';
    let spawnEffectText = won ? '🪙 WON!' : '❌ LOST!';
    let spawnEffectType: 'heal' | 'damage' | 'xp' | 'gold' | 'loot' = won ? 'gold' : 'damage';

    if (won) {
      text = `"Hah! Tails... wait, Heads? You won! The coin is yours... going straight into your pouch! Hic!"`;
      setOutcomeMessage(`Won the coin toss! Gained +25 Gold!`);
    } else {
      text = `"Mine! Goin' straight to my beer fund! *Laughs drunkenly* Barnaby, another round!"`;
      setOutcomeMessage(`Lost the coin toss! Lost -25 Gold.`);
    }

    setCoinResult({ choice: guess, rolled, won });
    setCurrentDialogue(text);
    onApplyEffects({
      logText: `🪙 [COIN FLIP] Tossed a coin with ${npc.name} (Bet: ${guess.toUpperCase()}, Rolled: ${rolled.toUpperCase()}). ${won ? 'WON' : 'LOST'}`,
      goldChange,
      spawnEffectText,
      spawnEffectType,
    });
  };

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="w-full max-w-lg bg-slate-900 border-2 border-rose-500/30 rounded-xl overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-200">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-rose-500/10 bg-slate-950">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-xl animate-bounce">
              🍺
            </div>
            <div>
              <h2 className="text-sm font-bold text-rose-400 font-sans tracking-wide uppercase">
                {npc.name}
              </h2>
              <span className="text-[10px] text-slate-400 font-mono flex items-center gap-1">
                <Wine className="w-3 h-3 text-rose-500 animate-pulse" /> INN & TAVERN PATRON (DRUNK)
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-md text-slate-400 hover:bg-slate-800 hover:text-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Dialogue Body */}
        <div className="p-6 flex flex-col gap-5 bg-gradient-to-b from-slate-900 to-slate-950">
          <div className="bg-slate-950/60 border border-slate-800 rounded-lg p-4 relative min-h-[90px] flex items-center">
            {/* Ambient bubble particles */}
            <div className="absolute top-2 right-2 flex gap-1">
              <span className="w-1.5 h-1.5 bg-rose-500/40 rounded-full animate-ping" />
              <span className="w-1 h-1 bg-amber-500/30 rounded-full animate-pulse" />
            </div>
            
            <p className="text-xs text-slate-100 font-sans leading-relaxed italic pr-4">
              "{currentDialogue}"
            </p>
          </div>

          {/* Outcome Badge */}
          {outcomeMessage && (
            <div className="text-center py-2 px-3 bg-rose-950/20 border border-rose-500/10 rounded-md text-[11px] font-mono text-rose-300 font-bold animate-pulse">
              ✨ EFFECT: {outcomeMessage}
            </div>
          )}

          {/* Gold Display */}
          <div className="flex items-center justify-between border-t border-slate-800 pt-4">
            <span className="text-[10px] text-slate-400 font-mono tracking-wider">YOUR REPUTATION / PURSE</span>
            <span className="text-xs font-mono font-bold text-amber-400 flex items-center gap-1 bg-slate-950 px-2 py-1 rounded-md border border-amber-500/20">
              <Coins className="w-3.5 h-3.5" /> {playerStats.gold} Gold
            </span>
          </div>

          {/* Actions Column */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-2">
            {/* Option 1: Buy Ale */}
            <button
              onClick={handleBuyDrink}
              disabled={playerStats.gold < 25}
              className={`flex items-center justify-center gap-2 py-3 px-4 rounded-lg text-xs font-bold border transition-all cursor-pointer ${
                playerStats.gold >= 25
                  ? 'bg-rose-950/40 border-rose-500/40 text-rose-300 hover:bg-rose-900/40 hover:border-rose-400'
                  : 'bg-slate-950 border-slate-900 text-slate-600 cursor-not-allowed'
              }`}
            >
              <Wine className="w-4 h-4 text-rose-400" />
              <div className="text-left">
                <span className="block text-slate-200">Buy a Pint of Ale</span>
                <span className="block text-[10px] text-rose-400 font-normal">Costs -25 Gold</span>
              </div>
            </button>

            {/* Option 2: Slap */}
            <button
              onClick={handleSlap}
              className="flex items-center justify-center gap-2 py-3 px-4 rounded-lg text-xs font-bold border border-slate-800 bg-slate-950 text-slate-300 hover:bg-slate-800 hover:text-white transition-all cursor-pointer"
            >
              <Hand className="w-4 h-4 text-emerald-400" />
              <div className="text-left">
                <span className="block">Slap to Wake Up</span>
                <span className="block text-[10px] text-slate-400 font-normal">Unpredictable outcome!</span>
              </div>
            </button>

            {/* Option 3: Coin Flip (Heads) */}
            <button
              onClick={() => handleCoinFlip('heads')}
              disabled={playerStats.gold < 25}
              className={`flex items-center justify-center gap-2 py-3 px-4 rounded-lg text-xs font-bold border transition-all cursor-pointer ${
                playerStats.gold >= 25
                  ? 'bg-slate-900 border-amber-500/20 text-slate-300 hover:border-amber-500 hover:text-white'
                  : 'bg-slate-950 border-slate-900 text-slate-600 cursor-not-allowed'
              }`}
            >
              <Dices className="w-4 h-4 text-amber-400 animate-spin" />
              <div className="text-left">
                <span className="block">Bet Heads</span>
                <span className="block text-[10px] text-amber-500/80 font-normal">Costs -25 Gold (50/50 win)</span>
              </div>
            </button>

            {/* Option 4: Coin Flip (Tails) */}
            <button
              onClick={() => handleCoinFlip('tails')}
              disabled={playerStats.gold < 25}
              className={`flex items-center justify-center gap-2 py-3 px-4 rounded-lg text-xs font-bold border transition-all cursor-pointer ${
                playerStats.gold >= 25
                  ? 'bg-slate-900 border-amber-500/20 text-slate-300 hover:border-amber-500 hover:text-white'
                  : 'bg-slate-950 border-slate-900 text-slate-600 cursor-not-allowed'
              }`}
            >
              <Dices className="w-4 h-4 text-amber-400 animate-spin" />
              <div className="text-left">
                <span className="block">Bet Tails</span>
                <span className="block text-[10px] text-amber-500/80 font-normal">Costs -25 Gold (50/50 win)</span>
              </div>
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-slate-800 bg-slate-950 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg text-xs font-semibold bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white transition-all cursor-pointer"
          >
            Leave Inn Table
          </button>
        </div>
      </div>
    </div>
  );
}
