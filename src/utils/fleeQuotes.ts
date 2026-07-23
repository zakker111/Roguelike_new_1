export function getEnemyFleeQuote(name: string, type: string): string {
  const lowercaseName = name.toLowerCase();
  
  if (lowercaseName.includes("deer")) {
    return "*Snort!* (The deer leaps gracefully in a panic-bound flight!)";
  }
  if (lowercaseName.includes("boar")) {
    return "*Oink squeal!* (The boar snorts in alarm and crashes through the brush!)";
  }
  if (lowercaseName.includes("goat")) {
    return "*Maaah!* (The mountain goat kicks up dust, retreating into safety!)";
  }
  
  if (lowercaseName.includes("rat")) {
    const quotes = [
      "*Squiiiieeeek!* (Scurries in pure terror!)",
      "*Chirp chirp chitter* (Panic-scuttles away!)",
      "*Eeeek* (Tail tucked in, running for the shadows!)"
    ];
    return quotes[Math.floor(Math.random() * quotes.length)];
  }
  if (lowercaseName.includes("goblin")) {
    const quotes = [
      "“Mercy, hero! Goblin too young to get squished!”",
      "“Cowardly tactical retreat! Run away!”",
      "“B-boss said you were weak! Boss lied!”",
      "“Not the face! Not the goblin snout!”"
    ];
    return quotes[Math.floor(Math.random() * quotes.length)];
  }
  if (lowercaseName.includes("mage") || lowercaseName.includes("skeleton")) {
    const quotes = [
      "“My brittle bones are rattling! Spare me!”",
      "“This fleshling is too strong! Aborting spell routine!”",
      "“My phylactery isn't ready for this! Retreat!”"
    ];
    return quotes[Math.floor(Math.random() * quotes.length)];
  }
  if (lowercaseName.includes("brute") || lowercaseName.includes("orc")) {
    const quotes = [
      "“Arrrgh! Brute skin bleeding too much! Pulling back!”",
      "“Me smash you... another day! Hurting too bad!”",
      "“Heavy armor feels like tin foil! Retreating!”"
    ];
    return quotes[Math.floor(Math.random() * quotes.length)];
  }
  if (lowercaseName.includes("troll")) {
    const quotes = [
      "“Troll hide splitting! Must run and regrow!”",
      "“Nooo! Hard tiny person hurts too much!”"
    ];
    return quotes[Math.floor(Math.random() * quotes.length)];
  }
  if (lowercaseName.includes("trapmaster")) {
    const quotes = [
      "“My gadgets failed! Mission aborted!”",
      "“Tactical smoke bomb! *cough* ...just running!”"
    ];
    return quotes[Math.floor(Math.random() * quotes.length)];
  }
  
  const generalQuotes = [
    "“Ouch! Spare me! I have gold in my pockets!”",
    "“Retreat! Gathering reinforcements!”",
    "“You win this round, mortal! Running away!”"
  ];
  return generalQuotes[Math.floor(Math.random() * generalQuotes.length)];
}
