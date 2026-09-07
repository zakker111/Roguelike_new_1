import { useState } from 'react';

export function useGodArenaState(triggerSuccessLog: (msg: string) => void) {
  // Interactive Arena Sandbox state variables
  const [playerAtkMult, setPlayerAtkMult] = useState(() => (window as any).arenaPlayerDamageMultiplier || 1.0);
  const [enemyHpMult, setEnemyHpMult] = useState(() => (window as any).arenaEnemyHpMultiplier || 1.0);
  const [enemyAtkMultState, setEnemyAtkMultState] = useState(
    () => (window as any).arenaEnemyDamageMultiplier || 1.0
  );
  const [goldMult, setGoldMult] = useState(() => (window as any).arenaGoldMultiplier || 1.0);
  const [xpMult, setXpMult] = useState(() => (window as any).arenaXpMultiplier || 1.0);
  const [godModeActive, setGodModeActive] = useState(() => (window as any).arenaGodModeActive || false);
  const [deathAuraActive, setDeathAuraActive] = useState(() => (window as any).arenaDeathAuraActive || false);
  const [bypassWeightLimit, setBypassWeightLimit] = useState(() => (window as any).bypassWeightLimit || false);
  const [customBaseMaxWeight, setCustomBaseMaxWeight] = useState(
    () => ((window as any).customBaseMaxWeight !== undefined ? (window as any).customBaseMaxWeight : 80.0)
  );

  const updateArenaValue = (key: string, value: any, setter: (val: any) => void) => {
    (window as any)[key] = value;
    setter(value);
    triggerSuccessLog(`Updated: ${key.replace('arena', '')} configured to ${value}`);
  };

  const handleResetArenaSettings = () => {
    (window as any).arenaPlayerDamageMultiplier = 1.0;
    (window as any).arenaEnemyHpMultiplier = 1.0;
    (window as any).arenaEnemyDamageMultiplier = 1.0;
    (window as any).arenaGoldMultiplier = 1.0;
    (window as any).arenaXpMultiplier = 1.0;
    (window as any).arenaGodModeActive = false;
    (window as any).arenaDeathAuraActive = false;
    (window as any).bypassWeightLimit = false;
    (window as any).customBaseMaxWeight = 80.0;

    setPlayerAtkMult(1.0);
    setEnemyHpMult(1.0);
    setEnemyAtkMultState(1.0);
    setGoldMult(1.0);
    setXpMult(1.0);
    setGodModeActive(false);
    setDeathAuraActive(false);
    setBypassWeightLimit(false);
    setCustomBaseMaxWeight(80.0);
    triggerSuccessLog('Successfully restored all Arena multipliers to balanced 1.0x variables!');
  };

  return {
    playerAtkMult,
    setPlayerAtkMult,
    enemyHpMult,
    setEnemyHpMult,
    enemyAtkMultState,
    setEnemyAtkMultState,
    goldMult,
    setGoldMult,
    xpMult,
    setXpMult,
    godModeActive,
    setGodModeActive,
    deathAuraActive,
    setDeathAuraActive,
    bypassWeightLimit,
    setBypassWeightLimit,
    customBaseMaxWeight,
    setCustomBaseMaxWeight,
    updateArenaValue,
    handleResetArenaSettings
  };
}
