import fleeData from '../data/fleeQuotes.json';

export function getEnemyFleeQuote(name: string, _type: string): string {
  const lowercaseName = name.toLowerCase();

  for (const group of fleeData.archetypes) {
    if (group.keywords.some(kw => lowercaseName.includes(kw))) {
      const quotes = group.quotes;
      return quotes[Math.floor(Math.random() * quotes.length)];
    }
  }

  const generalQuotes = fleeData.general;
  return generalQuotes[Math.floor(Math.random() * generalQuotes.length)];
}

export function getLeaderPanicQuote(): string {
  const quotes = (fleeData as any).leaderPanic || [
    "“The Warlord has fallen! The clan is broken! Run!”",
    "“Chief is dead! Scatter into the ruins!”"
  ];
  return quotes[Math.floor(Math.random() * quotes.length)];
}

export function getSurrenderQuote(): string {
  const quotes = (fleeData as any).surrender || [
    "“Mercy, warrior! I drop my blade! Take my purse!”",
    "“Please, spare me! The clan's cause is lost!”"
  ];
  return quotes[Math.floor(Math.random() * quotes.length)];
}

