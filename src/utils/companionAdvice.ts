import { GameState, Follower, getMoonPhase } from '../types';
import { getGMPointOfInterestNudge } from './gmNarrator';
import { calculateWorldThreatTier, getThreatTierInfo } from './worldThreat';

/**
 * Generates dynamic, contextual tactical advice from an active companion/follower
 * based on the player's current health, stats, inventory, active weather, world threat, moon phase, and environment.
 */
export function getCompanionAdvice(gameState: GameState, follower?: Follower | null): string {
  const name = follower?.name || 'Companion';

  // 1. Critical Health Warning
  const hpPercent = gameState.playerStats.hp / gameState.playerStats.maxHp;
  if (hpPercent <= 0.3) {
    const healthBarks = [
      `🛡️ ${name}: "Master, your health is critically low (${gameState.playerStats.hp}/${gameState.playerStats.maxHp} HP)! Eat cooked food, quaff a healing potion, or build a campfire to rest before taking another step!"`,
      `🛡️ ${name}: "You're bleeding heavily! We cannot survive another hit—heal yourself immediately or let's fall back!"`,
      `🛡️ ${name}: "Hold on, chief! Drink a potion or consume some provisions before we get ambushed!"`
    ];
    return healthBarks[Math.floor(Math.random() * healthBarks.length)];
  }

  // 2. High World Threat Tier Warning
  const threatTier = calculateWorldThreatTier(gameState.playerStats, gameState.chaosScore);
  if (threatTier >= 3) {
    const threatInfo = getThreatTierInfo(threatTier);
    const threatBarks = [
      `⚡ ${name}: "World Threat is at ${threatInfo.badgeEmoji} ${threatInfo.title}! Monsters are imbued with corrupted affixes—watch out for Vampiric drain and Shieldbreaker strikes!"`,
      `⚡ ${name}: "The realm's malice is mounting (${threatInfo.title}). Be ready to brace [B] or use defensive scrolls when fighting elites!"`
    ];
    return threatBarks[Math.floor(Math.random() * threatBarks.length)];
  }

  // 3. Moon Phase Atmosphere Barks
  const moon = getMoonPhase(gameState.playerStats.turnsPlayed || 0);
  if (moon.id === 'blood_moon') {
    return `🩸 ${name}: "The Blood Moon shines red above us! Monsters move faster and strike with bloodlust, but rare catalysts drop far more often!"`;
  } else if (moon.id === 'eclipse') {
    return `🌑 ${name}: "An Eclipse has enveloped Sunder! Shadow creatures lurk in every corner—keep your weapon drawn!"`;
  }

  // 4. Unspent Attribute Points Nudge
  const unspent = gameState.playerStats.unspentPoints || 0;
  if (unspent > 0) {
    return `💡 ${name}: "You have ${unspent} unspent attribute points! Open your Character Sheet [C] to allocate them to Strength, Agility, or Defense!"`;
  }

  // 5. Overencumbered / Heavy Backpack
  const totalItems = (gameState.equipmentInventory?.length || 0) + Object.keys(gameState.inventoryMaterials || {}).length;
  if (totalItems >= 18) {
    return `🎒 ${name}: "Our packs are nearly bursting with loot (${totalItems} item stacks)! We should find a settlement merchant to sell goods or store items in a Guild Stash."`;
  }

  // 6. Unused Catalyst / Forge Upgrade Nudge
  const matKeys = Object.keys(gameState.inventoryMaterials || {});
  const catKeys = Object.keys(gameState.inventoryCatalysts || {});
  if (matKeys.length >= 5 && catKeys.length >= 2) {
    return `🔨 ${name}: "We have plenty of raw metals and elemental catalysts! Find an Anvil or Blacksmith to forge upgrade infusions onto your gear."`;
  }

  // 7. Extreme Weather Warning
  if (gameState.weather === 'snowy') {
    return `❄️ ${name}: "This howling blizzard is freezing us to the bone! Resting near a warm Campfire will keep our spirits high and ward off frostbite."`;
  } else if (gameState.weather === 'rainy') {
    return `🌧️ ${name}: "The heavy rain makes the ground slick and reduces visibility. Keep your shield ready for sudden ambushes!"`;
  }

  // 8. Dungeon Depth Guidance
  if (!gameState.isOverworld) {
    const depth = gameState.playerStats.depth || 1;
    if (depth >= 5) {
      return `⚔️ ${name}: "We are deep in the Abyss Caverns (Floor ${depth}). Watch for elite champions and hidden traps on the stone tiles!"`;
    }
    return `🗡️ ${name}: "Keep your eyes sharp! Break crates and barrels for potions, and search for stairs down to discover deeper treasure chambers."`;
  }

  // 9. Overworld POI Nudge
  const poiNudge = getGMPointOfInterestNudge(
    gameState.currentChunkX || 0,
    gameState.currentChunkY || 0,
    gameState.playerStats.turnsPlayed || 0
  );
  if (poiNudge) {
    return `🗺️ ${name}: "I've been scanning the horizon—${poiNudge.replace(/^📜 Game Master:\s*"/, '').replace(/"$/, '')}`;
  }

  // 10. General Adventuring Advice
  const generalBarks = [
    `🛡️ ${name}: "Remember, you can use your Recall Scroll anytime to instantly return to safe town squares if trouble mounts!"`,
    `🛡️ ${name}: "Equipping high-quality armor and wielding elemental weapons makes a massive difference against armored beasts."`,
    `🛡️ ${name}: "Check notice boards at local settlement taverns—completing bounties yields heaps of gold and town reputation!"`,
    `🛡️ ${name}: "I'll stand by your side in battle! Give me weapons and armor in the Follower Inspector to make me stronger!"`,
    `🛡️ ${name}: "Standing adjacent to a crackling Campfire allows you to grill fresh fish and cook raw meat for potent healing provisions!"`
  ];

  return generalBarks[gameState.playerStats.turnsPlayed % generalBarks.length];
}
