import { GameState, CaravanEncounter } from '../types';
import caravanEventsData from '../data/caravanEvents.json';

export const generateRandomCaravanEncounter = (biome: string, state: GameState): CaravanEncounter => {
  const roll = Math.random();
  
  const matched = caravanEventsData.find(e => roll < e.threshold) || caravanEventsData[caravanEventsData.length - 1];
  const tpl = matched.template;

  return {
    id: `enc_${tpl.type}_${Date.now()}`,
    type: tpl.type as any,
    title: tpl.title,
    desc: tpl.desc,
    resolved: false,
    options: tpl.options.map(opt => ({
      ...opt,
      statCheck: opt.statCheck as any
    }))
  };
};

