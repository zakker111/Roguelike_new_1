import { hasTownAtChunk, isCastleTownAtChunk, getDeterministicTownName, prng } from './overworld';

/**
 * Generates an RPG style storyteller hint about a nearby point of interest
 * (castle, village, ruins, or cavernous dungeon entrance) based on the adjacent overworld chunk layout.
 * Runs deterministically to guide the player dynamically.
 */
export function getGMPointOfInterestNudge(
  cx: number,
  cy: number,
  turnsPlayed: number
): string | null {
  const adjacentDirs = [
    { name: 'North', dx: 0, dy: -1 },
    { name: 'South', dx: 0, dy: 1 },
    { name: 'West', dx: -1, dy: 0 },
    { name: 'East', dx: 1, dy: 0 }
  ];

  const pois: { dir: string; type: 'castle' | 'village' | 'dungeon' | 'ruins'; label: string }[] = [];

  adjacentDirs.forEach(({ name: dir, dx, dy }) => {
    const nx = cx + dx;
    const ny = cy + dy;

    const hasTown = hasTownAtChunk(nx, ny);
    if (hasTown) {
      const isCastle = isCastleTownAtChunk(nx, ny);
      const townName = getDeterministicTownName(nx, ny);
      if (isCastle) {
        pois.push({ dir, type: 'castle', label: townName });
      } else {
        pois.push({ dir, type: 'village', label: townName });
      }
    } else {
      // Wild chunk has a dungeon entrance
      pois.push({ dir, type: 'dungeon', label: 'Deep Dungeon Caverns' });
      
      // Does it spawn ruins?
      const spawnRuins = prng(nx, ny, 150) > 0.55;
      if (spawnRuins) {
        pois.push({ dir, type: 'ruins', label: 'Ancient Wild Ruins' });
      }
    }
  });

  if (pois.length === 0) return null;

  // Select one deterministically so waiting in place doesn't cycle options weirdly
  const chosenIdx = (Math.abs(cx * 13 + cy * 17) + turnsPlayed) % pois.length;
  const chosen = pois[chosenIdx];

  let nudgeMsg = "";
  if (chosen.type === 'castle') {
    const lines = [
      `📜 Game Master: "Far to the ${chosen.dir}, high stone battlements of ${chosen.label}, forged with the durable smith-craft of Ilmarinen, pierce the gray clouds."`,
      `📜 Game Master: "Wind blowing from the ${chosen.dir} carries the distant sound of clanging iron and horn blows. A grand Keep lies there, guarded by Ukko's lightning runes."`,
      `📜 Game Master: "Look to the ${chosen.dir}! The fortified flags of ${chosen.label} wave proudly in the distance, safe from the cold winds of Pohjola."`
    ];
    nudgeMsg = lines[turnsPlayed % lines.length];
  } else if (chosen.type === 'village') {
    const lines = [
      `📜 Game Master: "To the ${chosen.dir}, faint columns of gray chimney smoke rise from the cozy cottages of ${chosen.label}, where skalds sing of Väinämöinen's creation."`,
      `📜 Game Master: "A gentle breeze from the ${chosen.dir} brings the faint scent of sizzling boar, malted ale, and villagers praying to Ukko for rain."`,
      `📜 Game Master: "If you travel to the ${chosen.dir}, you'll find the friendly streets of ${chosen.label}, where elders craft Kanteles and share honey from Mielikki's bees."`
    ];
    nudgeMsg = lines[turnsPlayed % lines.length];
  } else if (chosen.type === 'ruins') {
    const lines = [
      `📜 Game Master: "Your adventurer senses tingle; old legends tell of forgotten mossy temples and ruins toward the ${chosen.dir} containing fragments of the shattered Sampo."`,
      `📜 Game Master: "An old rune-stone stands cracked to the ${chosen.dir}. Rubble ruins from the ancient battle between Väinämöinen and Louhi sit unclaimed."`,
      `📜 Game Master: "A glint of golden relics and ancient chests drifts from forgotten ruins in the ${chosen.dir}, rumored to be guarded by Tapio's woodland wardens."`
    ];
    nudgeMsg = lines[turnsPlayed % lines.length];
  } else if (chosen.type === 'dungeon') {
    const lines = [
      `📜 Game Master: "A chilling draught sweeps from the ${chosen.dir}, carrying the cold breath of Louhi and the metallic scent of Tuonela's black river."`,
      `📜 Game Master: "To the ${chosen.dir}, dark rumors whisper of an abyss cave entrance leading down to the underworld where Surtur and Louhi's beasts gather."`,
      `📜 Game Master: "Distant echoey sounds of clanking iron and rusty chains rumble in the hollow chambers to the ${chosen.dir}, echoing Antero Vipunen's trapped songs."`
    ];
    nudgeMsg = lines[turnsPlayed % lines.length];
  }

  return nudgeMsg || null;
}
