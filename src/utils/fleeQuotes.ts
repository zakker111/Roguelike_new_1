import fleeData from '../data/fleeQuotes.json';

export function getEnemyFleeQuote(name: string, type: string): string {
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

