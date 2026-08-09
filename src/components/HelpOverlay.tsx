import React from 'react';
import { X, HelpCircle, ArrowRight, BookOpen, Key, Shield, Hammer, Flame, Shuffle, Sparkles, Globe, Compass, Skull, Scroll, Cloud } from 'lucide-react';

interface HelpOverlayProps {
  onClose: () => void;
}

export default function HelpOverlay({ onClose }: HelpOverlayProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md">
      <div 
        id="help-modal"
        className="bg-slate-900 border border-slate-800 rounded-xl max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden shadow-2xl animate-in fade-in-50 zoom-in-95 duration-150"
      >
        {/* Header */}
        <div className="border-b border-slate-800 p-4 flex items-center justify-between bg-slate-950/40">
          <div className="flex items-center gap-2">
            <HelpCircle className="w-5 h-5 text-amber-500 animate-pulse" />
            <span className="text-sm font-extrabold uppercase tracking-wider text-slate-100 font-sans">
              ROGUE SURVIVAL MASTERCLASS & MANUAL
            </span>
          </div>
          <button 
            id="close-help-btn"
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800/50 cursor-pointer transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 text-xs text-slate-300 leading-relaxed font-sans text-left">
          
          {/* Welcome Intro */}
          <div className="bg-amber-950/15 border border-amber-900/30 p-3.5 rounded-lg">
            <span className="font-extrabold text-[10px] text-amber-500 uppercase tracking-widest block mb-1">
              👋 WELCOME CRAWLER!
            </span>
            <p className="text-[11px] text-slate-300 leading-normal">
              You are stranded in a dark, shifting overworld crawling with mutated beasts, hidden dungeons, and ancient ruins. To survive, you must manage your hunger, forage materials, fish next to water basins, and forge powerful upgraded gear!
            </p>
          </div>

          {/* Grid of Keyboard Commands */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Movement Column */}
            <div className="bg-slate-950/30 p-3.5 rounded-lg border border-slate-800/60">
              <h4 className="font-bold text-amber-500 uppercase tracking-wide border-b border-slate-800 pb-1 mb-2 flex items-center gap-1.5">
                <span>🔀</span> Movement & Turns
              </h4>
              <div className="space-y-1.5 font-mono text-[10.5px]">
                <div className="flex justify-between border-b border-slate-800/30 py-0.5">
                  <span className="text-slate-400">Move 4-ways:</span>
                  <span className="text-amber-400 font-bold">WASD / Arrow Keys</span>
                </div>
                <div className="flex justify-between border-b border-slate-800/30 py-0.5">
                  <span className="text-slate-400">Move Diagonals:</span>
                  <span className="text-slate-300">Numpad (7, 9, 1, 3) / Home, PgUp, End, PgDn</span>
                </div>
                <div className="flex justify-between border-b border-slate-800/30 py-0.5">
                  <span className="text-slate-400">Wait / Skip Turn:</span>
                  <span className="text-amber-400 font-bold">Spacebar / Period (.) / Num 5</span>
                </div>
                <div className="flex justify-between border-b border-slate-800/30 py-0.5">
                  <span className="text-slate-400">Brace (+Block rate):</span>
                  <span className="text-amber-400 font-bold">B Key</span>
                </div>
                <div className="flex justify-between border-b border-slate-800/30 py-0.5">
                  <span className="text-slate-400">Stairs Up / Exit:</span>
                  <span className="text-amber-400 font-bold">&lt; Key</span>
                </div>
                <div className="flex justify-between border-b border-slate-800/30 py-0.5">
                  <span className="text-slate-400">Stairs Down / Enter:</span>
                  <span className="text-amber-400 font-bold">&gt; Key</span>
                </div>
              </div>
            </div>

            {/* Panel Column */}
            <div className="bg-slate-950/30 p-3.5 rounded-lg border border-slate-800/60">
              <h4 className="font-bold text-amber-500 uppercase tracking-wide border-b border-slate-800 pb-1 mb-2 flex items-center gap-1.5">
                <span>🎯</span> Tactical Keys & Panels
              </h4>
              <div className="space-y-1.5 font-mono text-[10.5px]">
                <div className="flex justify-between border-b border-slate-800/30 py-0.5">
                  <span className="text-slate-400">Toggle Help Manual:</span>
                  <span className="text-amber-400 font-bold">F1 Key</span>
                </div>
                <div className="flex justify-between border-b border-slate-800/30 py-0.5">
                  <span className="text-slate-400">Loot / Camp / Stairs / Interact:</span>
                  <span className="text-amber-400 font-bold">G Key</span>
                </div>
                <div className="flex justify-between border-b border-slate-800/30 py-0.5">
                  <span className="text-slate-400">Character Sheet & Equipment:</span>
                  <span className="text-amber-400 font-bold">C Key</span>
                </div>
                <div className="flex justify-between border-b border-slate-800/30 py-0.5">
                  <span className="text-slate-400">Chronicles & Lore Book:</span>
                  <span className="text-amber-400 font-bold">H Key</span>
                </div>
                <div className="flex justify-between border-b border-slate-800/30 py-0.5">
                  <span className="text-slate-400">Bestiary & Monsters Index:</span>
                  <span className="text-amber-400 font-bold">V / K Key</span>
                </div>
                <div className="flex justify-between border-b border-slate-800/30 py-0.5">
                  <span className="text-slate-400">Open Game Master UI:</span>
                  <span className="text-purple-400">O Key</span>
                </div>
                <div className="flex justify-between border-b border-slate-800/30 py-0.5">
                  <span className="text-slate-400">Developer GOD Panel:</span>
                  <span className="text-red-400">P Key</span>
                </div>
                <div className="flex justify-between border-b border-slate-800/30 py-0.5">
                  <span className="text-slate-400">Close Window / Return:</span>
                  <span className="text-slate-300 font-bold">Esc Key</span>
                </div>
              </div>
            </div>
          </div>

          {/* NEW: Abyss Dungeon & Molten Underworld */}
          <div>
            <h4 className="font-bold text-amber-500 uppercase tracking-wide border-b border-slate-800 pb-1 mb-2 flex items-center gap-1.5">
              <Compass className="w-4 h-4 text-emerald-400" />
              <span>🪜 10-Floor Abyss & Underworld Depths</span>
            </h4>
            <p className="text-[11px] text-slate-300 leading-normal mb-2">
              Brave the terrifying multi-tiered dungeon levels, which save their progress and layout exactly as you left them:
            </p>
            <ul className="space-y-1.5 text-[10.5px] list-disc list-inside text-slate-400 pl-1">
              <li><strong className="text-slate-200">The Magma Threshold:</strong> Floors 1 to 5 consist of traditional dungeon stone. Descending past Floor 5 transports you to the volcanic Underworld Depths (Floors 6-10).</li>
              <li><strong className="text-slate-200">Boiling Lava Hazards:</strong> Stepping onto bubbling molten lava tiles on floors 6-10 inflicts <strong className="text-red-400 font-semibold">8 Fire Damage</strong>, triggering screenshakes and visual embers. Slide with ice-magic, ride crocodile mounts, or tread very carefully!</li>
              <li><strong className="text-slate-200">Overlord Surtur:</strong> Floor 10 holds the ultimate magma chamber where the colossal arch-demon <strong className="text-amber-500 font-semibold">Surtur</strong> guards the *Spark of the Cosmos*. Defeating him triggers the game's ultimate victory state and unlocks mythic weapon drops.</li>
            </ul>
          </div>

          {/* NEW: Active Chaos Suppression */}
          <div>
            <h4 className="font-bold text-amber-500 uppercase tracking-wide border-b border-slate-800 pb-1 mb-2 flex items-center gap-1.5">
              <Shield className="w-4 h-4 text-emerald-500" />
              <span>🛡️ Active Chaos Suppression & Pushback</span>
            </h4>
            <p className="text-[11px] text-slate-300 leading-normal mb-2">
              The world's Abyssal Chaos Coefficient scales dynamically over time, depth, and with your character's growing power. Fight back to actively lower the global difficulty coefficient down to a challenge floor of <strong className="text-emerald-400">0.70x</strong>:
            </p>
            <ul className="space-y-1.5 text-[10.5px] list-disc list-inside text-slate-400 pl-1">
              <li><strong className="text-slate-200">Slay Dungeon Bosses:</strong> Defeating any of Sunder's legendary bosses grants a massive <strong className="text-emerald-400 font-semibold">-0.35x threat reduction</strong>.</li>
              <li><strong className="text-slate-200">Clear Wilderness Camps:</strong> Purging outlaws or faction camps grants a robust <strong className="text-emerald-400 font-semibold">-0.15x threat reduction</strong>.</li>
              <li><strong className="text-slate-200">Defeat Standard Foes:</strong> Vanquishing standard mobs provides a steady <strong className="text-emerald-400 font-semibold">-0.05x threat reduction</strong> for every 10 enemies defeated.</li>
            </ul>
          </div>

          {/* NEW: Faction Conquest & Trade Caravans */}
          <div>
            <h4 className="font-bold text-amber-500 uppercase tracking-wide border-b border-slate-800 pb-1 mb-2 flex items-center gap-1.5">
              <Globe className="w-4 h-4 text-sky-400" />
              <span>🚩 Faction Conquest & Caravan Travel</span>
            </h4>
            <p className="text-[11px] text-slate-300 leading-normal mb-2">
              Influence geopolitical territory control and fund regional wars from the Faction War Room:
            </p>
            <ul className="space-y-1.5 text-[10.5px] list-disc list-inside text-slate-400 pl-1">
              <li><strong className="text-slate-200">Territory Dividends:</strong> Defeating highway outlaws and enemy vanguard soldiers shifts faction control percentages. Controlled lands generate passive gold and resource taxes with every turn you take!</li>
              <li><strong className="text-slate-200">War Chest & Directives:</strong> Contribute gold to your aligned Faction Treasury to gain Renown, or authorize devastating war directives (e.g. *Aegis Shields*, *Syndicate Supply Poisoning*) to manipulate territory borders.</li>
              <li><strong className="text-slate-200">Caravan Escorts:</strong> Hire heavy transport wagons to haul valuable resource packages across hostile territories. Safely guiding cargo awards monumental coin, renown, and experience payouts!</li>
              <li><strong className="text-slate-200">Saddled Mounts:</strong> Purchase and saddle unique mounts like the <strong className="text-slate-200">Swamp Crocodile</strong> 🐊 to glide across swamp waters effortlessly and ignore deep liquid blockages.</li>
            </ul>
          </div>

          {/* NEW: Weather, Spells & Combos */}
          <div>
            <h4 className="font-bold text-amber-500 uppercase tracking-wide border-b border-slate-800 pb-1 mb-2 flex items-center gap-1.5">
              <Cloud className="w-4 h-4 text-cyan-400" />
              <span>🌡️ Dynamic Weather & Elemental Spell Combos</span>
            </h4>
            <p className="text-[11px] text-slate-300 leading-normal mb-2">
              Prepare for shifting climates and adapt your magic to exploit natural elemental interaction chains:
            </p>
            <ul className="space-y-1.5 text-[10.5px] list-disc list-inside text-slate-400 pl-1">
              <li><strong className="text-slate-200">Weather Modifiers:</strong> Rainfall increases lightning spell damage by +30% and reduces fire damage by 20%. Sandstorms restrict sight and cause blindness, while blizzards inflict cold bites unless adjacent to campfires.</li>
              <li><strong className="text-slate-200">Wand Mana Conservation:</strong> Equip wands to reduce active spellcasting mana requirements by -1 MP (down to a minimum floor of 2 MP), enabling continuous magical barrages.</li>
              <li><strong className="text-slate-200">Grimoire Spellcasting:</strong> Wield staffs or wands to unlock the active Spellbook sidebar. Instantly swap between Fireball, Icicle, Lightning Shock, Poison Dart, and Shadow Orb on demand.</li>
              <li>
                <strong className="text-pink-400">🔥❄️⚡ Spell Combos (Elemental Reactions):</strong> Cast spells on afflicted targets to trigger devastating reactions:
                <ul className="pl-4 list-none space-y-1 mt-1 text-[10px]">
                  <li>❄️⚡ <strong className="text-teal-400 font-semibold">SHATTER (Frost + Lightning):</strong> Casting Frostbite Lance on a Shocked target, or Chain Lightning on a Frozen target, shatters their form for <strong className="text-white">+25 bonus flat damage</strong>.</li>
                  <li>🔥❄️ <strong className="text-rose-400 font-semibold">MELT (Fire + Frost):</strong> Casting Pyroblast on a Frozen target, or Frostbite Lance on a Burning target, causes violent thermal shock for <strong className="text-white">+20 bonus flat damage</strong>.</li>
                  <li>🔥🧪 <strong className="text-orange-400 font-semibold">COMBUSTION (Fire + Poison):</strong> Casting Pyroblast on a Poisoned target ignites the vapors for <strong className="text-white">+20 bonus flat damage</strong> and sparks a fiery gas burst.</li>
                  <li>🌌🔮 <strong className="text-purple-400 font-semibold">VOID REAP (Shadow + Any Element):</strong> Casting Void Siphon on an afflicted target collapses the state, dealing <strong className="text-white">+15 bonus damage</strong> and restoring <strong className="text-white">+15 HP</strong>.</li>
                </ul>
              </li>
            </ul>
          </div>

          {/* NEW: Finnish Mythology & Divine GM Interventions */}
          <div>
            <h4 className="font-bold text-amber-500 uppercase tracking-wide border-b border-slate-800 pb-1 mb-2 flex items-center gap-1.5">
              <Scroll className="w-4 h-4 text-purple-400" />
              <span>📜 Finnish Folklore, Landmarks & Divine Spells</span>
            </h4>
            <p className="text-[11px] text-slate-300 leading-normal mb-2">
              Sunder is fully infused with Finnish mythology, complete with bards, celestial spirits, and legendary landmarks:
            </p>
            <ul className="space-y-1.5 text-[10.5px] list-disc list-inside text-slate-400 pl-1">
              <li><strong className="text-slate-200">10-Chapter History Book:</strong> Interact with unique landmarks to collect and unlock detailed lore chapters inside your interactive History Book (including the duck's primordial eggs, the Sampo mill, and the Black River of Tuonela).</li>
              <li><strong className="text-slate-200">Biome-Aware POIs:</strong> Points of Interest procedurally adapt to their ecosystem—discover *Väinämöinen's Rune Stone* or *Tapio's Evergreen Grove* in woodlands, *The Gates of Tuonela* in swamps, *Ribs of Antero Vipunen* in tundra cold, and *Forge of Ilmarinen* in baking desert sands.</li>
              <li><strong className="text-slate-200">Divine Storyteller Interventions:</strong> The Game Master storyteller might grant legendary mythic actions to players based on mood and boredom:
                <ul className="pl-4 list-none space-y-1 mt-1 text-[10px]">
                  <li>⚡ <strong className="text-yellow-400 font-semibold">Ukko's Golden Bolt:</strong> Strikes closest hostiles for 35 damage and restores +10 Mana.</li>
                  <li>🎵 <strong className="text-indigo-400 font-semibold">Väinämöinen's Rune-Song:</strong> Heals +25 HP and pacifies enraged chasing monsters.</li>
                  <li>🐻 <strong className="text-emerald-400 font-semibold">Mielikki's Honey Drop:</strong> Spawns a sweet Honey-Glazed Boar nearby, which drops prime roasted steaks and fish when hunted.</li>
                </ul>
              </li>
              <li><strong className="text-slate-200">Colossal Biome Titans:</strong> Brave travelers will encounter colossal boss titans guarding wilderness ruins: *Sylvanus the Forest Behemoth* 🌳, *Sekhmet the Desert Sovereign* 🦂, *Ymir the Frost Titan* ⛄, and *Charybdis the Swamp Feaster* 🦠.</li>
            </ul>
          </div>

          {/* Cooking and Campfires */}
          <div>
            <h4 className="font-bold text-amber-500 uppercase tracking-wide border-b border-slate-800 pb-1 mb-2 flex items-center gap-1.5">
              <Flame className="w-4 h-4 text-orange-500" />
              <span>🔥 Survival Camping & Cooking</span>
            </h4>
            <p className="text-[11px] text-slate-300 leading-normal mb-2">
              Starvation is lethal. Keep your Hunger bar full to auto-heal over time. Here is the cooking loop:
            </p>
            <ul className="space-y-1.5 text-[10.5px] list-disc list-inside text-slate-400 pl-1">
              <li><strong className="text-slate-200">Campfires:</strong> Stand next to a campfire or place one using wood to rest. Standing next to campfire lets you rest to restore HP, or cook.</li>
              <li><strong className="text-slate-200">Raw Food:</strong> Slain beasts drop raw meat. Foraging bushes gives berries. Catching fish from water tiles gives raw fish.</li>
              <li><strong className="text-slate-200">Cooked Food:</strong> Raw food can be eaten in an emergency, but it can be roasted at a campfire to multiply its nutritional values! Check the <strong className="text-slate-300">Camp & Cooking</strong> subtab in the workbench.</li>
            </ul>
          </div>

          {/* Fishing Basin */}
          <div>
            <h4 className="font-bold text-amber-500 uppercase tracking-wide border-b border-slate-800 pb-1 mb-2 flex items-center gap-1.5">
              <span>🎣</span> Water Fishing Basin
            </h4>
            <p className="text-[11px] text-slate-300 leading-normal mb-2">
              Tired of hunting dangerous monsters? Tap into marine agriculture:
            </p>
            <ul className="space-y-1.5 text-[10.5px] list-disc list-inside text-slate-400 pl-1">
              <li><strong className="text-slate-200">Forging a Rod:</strong> Craft a basic fishing pole using wood and materials in the Workbench.</li>
              <li><strong className="text-slate-200">Casting lines:</strong> Stand next to any deep water tile. Click the water or hit <strong className="text-slate-300">G Key</strong> to initiate the fishing sequence!</li>
              <li><strong className="text-slate-200">Mini-game:</strong> Hold the reels to maintain balance inside the golden safety box. Keep the needle green until the progress completes to yank out a plump raw fish or rare treasures!</li>
            </ul>
          </div>

          {/* Lockpicking Chests */}
          <div>
            <h4 className="font-bold text-amber-500 uppercase tracking-wide border-b border-slate-800 pb-1 mb-2 flex items-center gap-1.5">
              <Key className="w-4 h-4 text-teal-400" />
              <span>🗝️ Lockpicking Ancient Chests</span>
            </h4>
            <p className="text-[11px] text-slate-300 leading-normal mb-2">
              Dungeons and ruins harbor locked golden chests filled with mythic equipment.
            </p>
            <ul className="space-y-1.5 text-[10.5px] list-disc list-inside text-slate-400 pl-1">
              <li><strong className="text-slate-200">Required tools:</strong> Ensure you have Lockpicks. These can be purchased from merchants or forged in the Workbench using iron ores.</li>
              <li><strong className="text-slate-200">Tension Alignment:</strong> Rotate the locking pick and apply subtle tension. Green lights indicate pins safely binding.</li>
              <li><strong className="text-slate-200">Step Away:</strong> If your lockpick health is too low or you want to save them for later, simply click the <strong className="text-rose-400 font-semibold">Step Away From Chest (Close)</strong> button at the bottom of the lockpicking interface to cancel safely!</li>
            </ul>
          </div>

          {/* Forging, Mutating, Upgrading */}
          <div>
            <h4 className="font-bold text-amber-500 uppercase tracking-wide border-b border-slate-800 pb-1 mb-2 flex items-center gap-1.5">
              <Hammer className="w-4 h-4 text-amber-500" />
              <span>✨ Equipment Mastery: Forge, Mutate & Upgrade</span>
            </h4>
            <p className="text-[11px] text-slate-300 leading-normal mb-2">
              The Arcanum Workbench offers three distinct tiers of gear customization:
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 mt-2">
              <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-850">
                <span className="font-bold text-[10px] text-amber-400 flex items-center gap-1">
                  <Hammer className="w-3.5 h-3.5" /> FORGE EQUIPMENT
                </span>
                <p className="text-[9.5px] text-slate-400 mt-1 leading-relaxed">
                  Combine basic metal ingots (Iron, Mithril, Feybone, Dragonscale) with elemental catalysts to forge standard physical weapons and shields.
                </p>
              </div>

              <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-850">
                <span className="font-bold text-[10px] text-purple-400 flex items-center gap-1">
                  <Shuffle className="w-3.5 h-3.5" /> MUTATE PROPERTIES
                </span>
                <p className="text-[9.5px] text-slate-400 mt-1 leading-relaxed">
                  Infuse catalyst charges to randomly alter weapon damage parameters. Re-rolls base status, colors, and generates unique passive suffixes.
                </p>
              </div>

              <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-850">
                <span className="font-bold text-[10px] text-teal-400 flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5" /> UPGRADE GEAR (+1, +2)
                </span>
                <p className="text-[9.5px] text-slate-400 mt-1 leading-relaxed">
                  Safely reinforce any existing gear using metals. Grants guaranteed raw damage, defense boosts, and unlocks powerful materials-bound passive perks!
                </p>
              </div>
            </div>
          </div>

          {/* Roleplay Attributes Guide */}
          <div className="bg-slate-950/80 p-4 rounded-xl border border-slate-800 space-y-2">
            <span className="font-bold text-[10px] text-amber-500 uppercase tracking-widest block">Roleplay Attributes Guide</span>
            <ul className="space-y-1 text-[10.5px] list-disc list-inside text-slate-400">
              <li><strong className="text-slate-200">STR (Strength):</strong> Boosts melee power. Adds solid physical weapon striking bonuses.</li>
              <li><strong className="text-slate-200">DEX (Dexterity):</strong> Boosts crit hit chance, agility, and reduces incoming damage when hit.</li>
              <li><strong className="text-slate-200">INT (Intelligence):</strong> Gives extra pins buffer budget in lockpicking, and better wood/berry foraging luck.</li>
              <li><strong className="text-slate-200">CHA (Charisma):</strong> Dynamically scales all town trade transactions. Grants up to 40% discount when buying items, catalysts, keys, or custom forged gear, and increases gold payouts when selling loot (+2% per point above 10).</li>
              <li><strong className="text-slate-200">LCK (Luck):</strong> Scales loot drop rates and item quality. Boosts chest generation, standard monster drop frequencies (+3% per point above 10, up to 85% max), and chest equipment drops (+3% per point above 10, up to 90% max).</li>
            </ul>
          </div>

        </div>

        {/* Footer */}
        <div className="border-t border-slate-800 p-4 bg-slate-950/40 text-center text-[10.5px] font-mono text-slate-500 flex justify-center items-center gap-1.5">
          <BookOpen className="w-3.5 h-3.5 text-slate-600 animate-pulse" />
          <span>Press <strong className="text-slate-300 font-bold bg-slate-950 px-1 py-0.5 rounded">Esc</strong> or click the cross to return to your adventure.</span>
        </div>

      </div>
    </div>
  );
}
