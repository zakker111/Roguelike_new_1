import { GameState, CaravanEncounter, getMoonPhase } from '../types';
import { calculateWorldThreatTier } from './worldThreat';
import caravanEventsData from '../data/caravanEvents.json';
import caravanBossesData from '../data/caravanBosses.json';

export const generateRandomCaravanEncounter = (_biome: string, state: GameState): CaravanEncounter => {
  const threatTier = calculateWorldThreatTier(state.playerStats, state.chaosScore || 20);
  const moon = getMoonPhase(state.playerStats?.turnsPlayed || 0);

  let dist = 2;
  if (state.caravanTravel) {
    dist = Math.max(
      Math.abs(state.caravanTravel.destX - state.caravanTravel.originX),
      Math.abs(state.caravanTravel.destY - state.caravanTravel.originY)
    );
  }

  // Boss Ambush Chance formula:
  // Base 0.08 + threatTier * 0.12 + 0.25 (Eclipse/Blood Moon) + 0.10 (dist >= 3)
  let bossChance = 0.08 + (threatTier * 0.12);
  if (moon.id === 'eclipse' || moon.id === 'blood_moon') {
    bossChance += 0.25;
  }
  if (dist >= 3) {
    bossChance += 0.10;
  }
  bossChance = Math.min(0.65, bossChance);

  const isBossRoll = Math.random() < bossChance;

  if (isBossRoll) {
    const bossTemplates = caravanBossesData;
    const chosenBoss = bossTemplates[Math.floor(Math.random() * bossTemplates.length)];

    return {
      id: `enc_boss_${Date.now()}`,
      type: 'boss_ambush',
      title: chosenBoss.title,
      desc: chosenBoss.desc,
      resolved: false,
      isBossAmbush: true,
      isTacticalCombat: true,
      bossName: chosenBoss.bossName,
      bossAffixes: chosenBoss.bossAffixes,
      wagonDamagePenalty: chosenBoss.wagonDamagePenalty,
      options: chosenBoss.options.map(opt => ({
        ...opt,
        statCheck: opt.statCheck as any
      }))
    };
  }

  // Regular encounters from JSON with threat-scaled difficulty & wagon damage penalty
  const roll = Math.random();
  const matched = caravanEventsData.find(e => roll < e.threshold) || caravanEventsData[caravanEventsData.length - 1];
  const tpl = matched.template;

  const difficultyBonus = Math.min(6, threatTier * 2);
  const wagonPenalty = tpl.type === 'bandit_ambush' || tpl.type === 'beast_attack' ? 20 : 15;

  return {
    id: `enc_${tpl.type}_${Date.now()}`,
    type: tpl.type as any,
    title: tpl.title,
    desc: tpl.desc,
    resolved: false,
    wagonDamagePenalty: wagonPenalty,
    options: tpl.options.map(opt => ({
      ...opt,
      statCheck: opt.statCheck as any,
      difficulty: opt.difficulty ? opt.difficulty + difficultyBonus : undefined
    }))
  };
};
