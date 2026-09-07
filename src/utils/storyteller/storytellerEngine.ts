import { GameState, GameLogMessage } from '../../types';
import { GMState, GMEncounter, GMPersonality, getGMStorytellerState, setGMStorytellerState, STORY_EVENTS_CATALOG } from './types';
import { getEncounterFlavorText } from './storytellerFlavor';
import { GM_ENCOUNTERS_DATABASE } from './storytellerEncountersData';
import { executeChaosSurgeRoll } from './storytellerChaos';
import { evaluatePityRescueAid } from './storytellerRescue';

/**
 * Principal tick function executed per player action step.
 * Orchestrates autonomous tension curves, boredom pacing, chaos matrix adaptation,
 * periodic chaos surges, and dynamic story interventions.
 */
export function tickActiveGMStoryteller(
  gameState: GameState
): {
  gmState: GMState;
  stateUpdates: Partial<GameState>;
  didIntervene: boolean;
  logMessage?: GameLogMessage;
  logMessages?: GameLogMessage[];
  effectSpawn?: { x: number; y: number; text: string; type: 'heal' | 'dmg' | 'loot' };
} {
  const currentGM = getGMStorytellerState();
  const px = gameState.playerX;
  const py = gameState.playerY;

  // 1. Memory tracking
  const mem = { ...currentGM.memories };
  if (px === mem.lastPlayerX && py === mem.lastPlayerY) {
    mem.idleTurns += 1;
  } else {
    mem.idleTurns = 0;
  }

  mem.lastPlayerX = px;
  mem.lastPlayerY = py;

  // 2. Track dynamic tension level (0 to 100)
  // Low player HP increases tension. High monster count near player increases tension.
  const hpRatio = gameState.playerStats.hp / gameState.playerStats.maxHp;
  const surroundingEnemies = gameState.enemies.filter(
    e => Math.abs(e.x - px) + Math.abs(e.y - py) <= 5 && !e.isFollower && !e.isTownGuard && e.hp > 0
  ).length;

  const calculatedTension = Math.max(
    0,
    Math.min(100, Math.round((1 - hpRatio) * 60 + surroundingEnemies * 12))
  );

  // 3. Calculate dynamic boredom/chaos metric
  // If player is in close combat, combat keeps GM engaged (boredom decreases).
  // If player is idling in one spot (idleTurns > 3), boredom rises slightly.
  // During peaceful / non-combat turns, Chaos/Boredom automatically drifts down toward 20% baseline!
  let boredomDelta = 0;
  if (surroundingEnemies > 0) {
    boredomDelta = -2; // kept engaged by close combat!
  } else if (mem.idleTurns > 3) {
    boredomDelta = 2; // extended idling gently increases boredom
  } else {
    // Peaceful or non-combat active turns: natural decay toward 20% baseline
    if (currentGM.boredom > 20) {
      boredomDelta = -1; // drift down toward 20%
    } else if (currentGM.boredom < 20) {
      boredomDelta = 1; // drift up toward 20%
    }
  }

  const calculatedBoredom = Math.max(10, Math.min(100, currentGM.boredom + boredomDelta));

  // 4. Determine current GM mood flavor
  let nextPersonality = currentGM.personality;
  if (currentGM.disableGifts && nextPersonality === 'Benevolent') {
    nextPersonality = 'Intrigued';
  }

  // Dynamic temporary thoughts and personality shifts
  if (calculatedBoredom > 75 && Math.random() < 0.15) {
    const list: GMPersonality[] = currentGM.disableGifts
      ? ['Mischievous', 'Sadistic']
      : ['Mischievous', 'Sadistic', 'Intrigued'];
    nextPersonality = list[Math.floor(Math.random() * list.length)];
  } else if (hpRatio < 0.25 && Math.random() < 0.2) {
    const list: GMPersonality[] = currentGM.disableGifts
      ? ['Sadistic', 'Intrigued']
      : ['Benevolent', 'Intrigued', 'Sadistic'];
    nextPersonality = list[Math.floor(Math.random() * list.length)];
  }

  const thoughts = [...currentGM.thoughts];
  const turn = gameState.playerStats.turnsPlayed;

  // Log internal monologue occasionally
  if (turn % 7 === 0) {
    const promptTemplate =
      STORY_EVENTS_CATALOG.narrativePrompts[nextPersonality] ||
      STORY_EVENTS_CATALOG.narrativePrompts.Intrigued;
    let thought = `Turn ${turn}: "${promptTemplate}"`;
    if (nextPersonality === 'Sadistic') {
      thought = `Turn ${turn}: "HP ratio is at ${(hpRatio * 100).toFixed(0)}%. ${promptTemplate}"`;
    } else if (nextPersonality === 'Intrigued' || nextPersonality === 'Apathetic') {
      thought = `Turn ${turn}: "Watching coordinate vector (${px},${py}). Boredom coefficient is ${calculatedBoredom} pts. ${promptTemplate}"`;
    }
    thoughts.unshift(thought);
    if (thoughts.length > 20) thoughts.pop();
  }

  const updatedGM: GMState = {
    personality: nextPersonality,
    boredom: calculatedBoredom,
    tension: calculatedTension,
    memories: mem,
    thoughts: thoughts,
    lastChaosRoll: currentGM.lastChaosRoll,
    lastChaosEffectName: currentGM.lastChaosEffectName,
    lastChaosEffectDesc: currentGM.lastChaosEffectDesc,
    chaosHistory: currentGM.chaosHistory ? [...currentGM.chaosHistory] : []
  };

  // --- GM Chaos Matrix Integration & Adaptive Combat Evaluation ---
  let currentChaos = gameState.chaosScore ?? 20;
  let chaosStateUpdates: Partial<GameState> = { chaosScore: currentChaos };
  let chaosLogMessage: GameLogMessage | undefined = undefined;
  let chaosEffectSpawn: any = undefined;
  let didChaosTrigger = false;

  // Track total monsters slain
  const totalSlain = Object.values(gameState.defeatedEnemiesCount || {}).reduce((a, b) => a + b, 0);
  const slainInInterval = Math.max(0, totalSlain - (mem.monstersSlain || 0));

  // Chaos Threat Scaling & Adaptive GM Intervention
  const isChaosEpochMilestone = turn > 0 && turn % 350 === 0 && (mem.lastChaosRollTurn !== turn) && slainInInterval > 0;
  const isPlayerPeril = hpRatio < 0.25 && currentChaos > 15;
  const isPlayerDominance = slainInInterval >= 3 && hpRatio >= 0.7;
  const isSpontaneousGMMercy = isPlayerPeril && (turn % 20 === 0 || Math.random() < 0.2);
  const isSpontaneousGMEscalation = isPlayerDominance && (turn % 10 === 0 || Math.random() < 0.2);

  if (isChaosEpochMilestone || isSpontaneousGMMercy || isSpontaneousGMEscalation) {
    mem.lastChaosRollTurn = turn;
    mem.monstersSlain = totalSlain;

    // Determine whether to escalate, lessen, or harmonize Chaos
    const randomRoll = Math.random();
    
    // Scenario 1: GM Escalates Chaos (Player dominant slaughtering enemies with high HP) - Never escalate if idling
    if (isPlayerDominance || isSpontaneousGMEscalation) {
      const delta = Math.floor(Math.random() * 5) + 5; // 5 to 9 escalation
      const oldScore = currentChaos;
      currentChaos = Math.min(100, currentChaos + delta);
      chaosStateUpdates.chaosScore = currentChaos;

      // Empower active enemies dynamically
      let mutatedEnemiesCount = 0;
      const updatedEnemies = gameState.enemies.map(enemy => {
        if (!enemy.isFollower && !enemy.isTownGuard && !enemy.isAnimal && enemy.hp > 0) {
          mutatedEnemiesCount++;
          const hpBoost = Math.max(6, Math.floor(enemy.maxHp * 0.25));
          const newMaxHp = enemy.maxHp + hpBoost;
          const newHp = enemy.hp + hpBoost;
          const newAtk = enemy.atk + 1;
          const newDef = enemy.def + 1;
          const newChaosTier = Math.min(3, (enemy.chaosTier || 0) + 1);

          let isNowElite = enemy.isElite;
          let enemyName = enemy.name;
          let eliteEffect = enemy.eliteEffect;

          if (!enemy.isElite && !enemy.isBoss && Math.random() < 0.35) {
            isNowElite = true;
            if (!enemyName.includes('Chaos-Empowered')) {
              enemyName = `Chaos-Empowered ${enemyName}`;
            }
            eliteEffect = '⚡ Abyssal Ferocity (+25% HP, +1 ATK)';
          }

          return {
            ...enemy,
            hp: newHp,
            maxHp: newMaxHp,
            atk: newAtk,
            def: newDef,
            chaosTier: newChaosTier,
            isElite: isNowElite,
            name: enemyName,
            eliteEffect
          };
        }
        return enemy;
      });

      if (mutatedEnemiesCount > 0) {
        chaosStateUpdates.enemies = updatedEnemies;
      }

      const logText = `🔮 [GM CHAOS ADAPTATION]: After observing martial prowess, the subterranean abyss recalibrates (+${delta} Chaos: ${oldScore} → ${currentChaos})! Active adversaries absorb dark ether (+25% HP, +1 ATK).`;

      thoughts.unshift(
        `Turn ${turn} (Adaptation): "Martial progression observed. Escalating Chaos Matrix by +${delta} to ${currentChaos} pts and mutating ${mutatedEnemiesCount} foes."`
      );

      chaosLogMessage = {
        id: `gm_chaos_epoch_${Date.now()}_${Math.random()}`,
        text: logText,
        type: 'danger',
        timestamp: 'CHAOS'
      };

      chaosEffectSpawn = { x: px, y: py, text: `🔮 Chaos +${delta} (Adaptation)`, type: 'dmg' };
      didChaosTrigger = true;
    }
    // Scenario 2: GM Lessens Chaos (Mercy, struggling player in peril)
    else if (isPlayerPeril || isSpontaneousGMMercy || hpRatio < 0.35) {
      const delta = Math.floor(Math.random() * 6) + 6; // 6 to 11 reduction
      const oldScore = currentChaos;
      currentChaos = Math.max(5, currentChaos - delta);
      chaosStateUpdates.chaosScore = currentChaos;

      const logText = getEncounterFlavorText(
        'chaos_mercy',
        `✨ [GM CHAOS MERCY]: ${oldScore} → ${currentChaos} (-${delta}) — A warm breeze carrying the scent of pine and heather revitalizes your failing strength—the spirits of the ancient grove grant you respite, calming subterranean malice!`,
        { oldScore, currentChaos, delta }
      );
      thoughts.unshift(
        `Turn ${turn} (Respite): "Granting world respite. Lowered Chaos Matrix by -${delta} pts to ${currentChaos}."`
      );
      chaosLogMessage = {
        id: `gm_chaos_respite_${Date.now()}`,
        text: logText,
        type: 'loot',
        timestamp: 'CHAOS'
      };
      chaosEffectSpawn = { x: px, y: py, text: `✨ Chaos -${delta} (Respite)`, type: 'heal' };
      didChaosTrigger = true;
    }
    // Scenario 3: Periodic Milestone drift
    else if (isChaosEpochMilestone || randomRoll > 0.65) {
      if (randomRoll < 0.50 && currentChaos > 15) {
        const delta = Math.floor(Math.random() * 6) + 6;
        const oldScore = currentChaos;
        currentChaos = Math.max(5, currentChaos - delta);
        chaosStateUpdates.chaosScore = currentChaos;

        const logText = getEncounterFlavorText(
          'chaos_mercy',
          `✨ [GM CHAOS MERCY]: ${oldScore} → ${currentChaos} (-${delta}) — A warm breeze carrying the scent of pine and heather revitalizes your failing strength—the spirits of the ancient grove grant you respite, calming subterranean malice!`,
          { oldScore, currentChaos, delta }
        );
        thoughts.unshift(
          `Turn ${turn} (Respite): "Granting world respite. Lowered Chaos Matrix by -${delta} pts to ${currentChaos}."`
        );
        chaosLogMessage = {
          id: `gm_chaos_respite_${Date.now()}`,
          text: logText,
          type: 'loot',
          timestamp: 'CHAOS'
        };
        chaosEffectSpawn = { x: px, y: py, text: `✨ Chaos -${delta} (Respite)`, type: 'heal' };
        didChaosTrigger = true;
      } else {
        const delta = Math.floor(Math.random() * 5) + 5;
        const oldScore = currentChaos;
        currentChaos = Math.min(100, currentChaos + delta);
        chaosStateUpdates.chaosScore = currentChaos;

        let mutatedEnemiesCount = 0;
        const updatedEnemies = gameState.enemies.map(enemy => {
          if (!enemy.isFollower && !enemy.isTownGuard && !enemy.isAnimal && enemy.hp > 0) {
            mutatedEnemiesCount++;
            const hpBoost = Math.max(6, Math.floor(enemy.maxHp * 0.25));
            const newMaxHp = enemy.maxHp + hpBoost;
            const newHp = enemy.hp + hpBoost;
            const newAtk = enemy.atk + 1;
            const newDef = enemy.def + 1;
            const newChaosTier = Math.min(3, (enemy.chaosTier || 0) + 1);

            let isNowElite = enemy.isElite;
            let enemyName = enemy.name;
            let eliteEffect = enemy.eliteEffect;

            if (!enemy.isElite && !enemy.isBoss && Math.random() < 0.35) {
              isNowElite = true;
              if (!enemyName.includes('Chaos-Empowered')) {
                enemyName = `Chaos-Empowered ${enemyName}`;
              }
              eliteEffect = '⚡ Abyssal Ferocity (+25% HP, +1 ATK)';
            }

            return {
              ...enemy,
              hp: newHp,
              maxHp: newMaxHp,
              atk: newAtk,
              def: newDef,
              chaosTier: newChaosTier,
              isElite: isNowElite,
              name: enemyName,
              eliteEffect
            };
          }
          return enemy;
        });

        if (mutatedEnemiesCount > 0) {
          chaosStateUpdates.enemies = updatedEnemies;
        }

        const logText = `🔮 [GM CHAOS ADAPTATION]: After observing martial prowess, the subterranean abyss recalibrates (+${delta} Chaos: ${oldScore} → ${currentChaos})! Active adversaries absorb dark ether (+25% HP, +1 ATK).`;

        thoughts.unshift(
          `Turn ${turn} (Adaptation): "Epoch progression observed. Escalating Chaos Matrix by +${delta} to ${currentChaos} pts and mutating ${mutatedEnemiesCount} foes."`
        );

        chaosLogMessage = {
          id: `gm_chaos_epoch_${Date.now()}_${Math.random()}`,
          text: logText,
          type: 'danger',
          timestamp: 'CHAOS'
        };

        chaosEffectSpawn = { x: px, y: py, text: `🔮 Chaos +${delta} (Adaptation)`, type: 'dmg' };
        didChaosTrigger = true;
      }
    }
  }

  // Periodic Chaos Core Surge (Every 15 turns)
  if (turn > 0 && turn % 15 === 0 && mem.lastChaosRollTurn !== turn) {
    mem.lastChaosRollTurn = turn;
    didChaosTrigger = true;
    let roll = Math.floor(Math.random() * 20) + 1;
    if (updatedGM.disableGifts && roll >= 11) {
      roll = Math.floor(Math.random() * 10) + 1;
    }
    updatedGM.lastChaosRoll = roll;

    const surgeResult = executeChaosSurgeRoll(gameState, updatedGM, roll);

    chaosStateUpdates = {
      ...chaosStateUpdates,
      ...surgeResult.mutatedState
    };
    chaosEffectSpawn = surgeResult.effectSpawn;

    updatedGM.lastChaosEffectName = surgeResult.effName;
    updatedGM.lastChaosEffectDesc = surgeResult.effDesc;
    if (!updatedGM.chaosHistory) updatedGM.chaosHistory = [];
    updatedGM.chaosHistory.unshift({
      turn,
      roll,
      name: surgeResult.effName,
      type: surgeResult.effType
    });
    if (updatedGM.chaosHistory.length > 5) updatedGM.chaosHistory.pop();

    chaosLogMessage = {
      id: `chaos_surge_${Date.now()}`,
      text: surgeResult.logText,
      type: surgeResult.effType === 'good' ? 'loot' : surgeResult.effType === 'bad' ? 'danger' : 'info',
      timestamp: 'CHAOS'
    };
  }

  // Evaluate interventions & rescue
  const turnsSinceIntervention = turn - mem.lastInterventionTurn;

  let dynamicCooldownThreshold = 120;
  const bossesExist = gameState.enemies.some(e => e.isBoss && e.hp > 0);
  if (bossesExist) {
    dynamicCooldownThreshold = 40;
  } else if (hpRatio < 0.25) {
    dynamicCooldownThreshold = 45;
  }

  const isCooledDown = turnsSinceIntervention > dynamicCooldownThreshold;

  // Check emergency rescue & pity evaluation
  const rescueEval = evaluatePityRescueAid(gameState, updatedGM, turnsSinceIntervention, hpRatio, px, py);
  const forceImmediateTrigger = rescueEval.forceTrigger;
  const forcedImmediateEncounterId = rescueEval.forcedEncounterId;

  let chosenEncounter: GMEncounter | undefined;

  if (forceImmediateTrigger && forcedImmediateEncounterId) {
    chosenEncounter = GM_ENCOUNTERS_DATABASE.find(enc => enc.id === forcedImmediateEncounterId);
  } else if (!didChaosTrigger && isCooledDown && calculatedBoredom >= 95 && Math.random() < 0.005) {
    const eligibleEncounters = GM_ENCOUNTERS_DATABASE.filter(enc => {
      if (calculatedBoredom < enc.minBoredom) return false;
      if (enc.requiredMood && !enc.requiredMood.includes(nextPersonality)) return false;
      if (enc.minTension && calculatedTension < enc.minTension) return false;
      if (enc.maxTension && calculatedTension > enc.maxTension) return false;
      return true;
    });

    if (eligibleEncounters.length > 0) {
      chosenEncounter = eligibleEncounters[Math.floor(Math.random() * eligibleEncounters.length)];
    }
  }

  if (chosenEncounter) {
    const result = chosenEncounter.trigger(gameState, updatedGM);

    if (result.success) {
      mem.lastInterventionTurn = turn;
      updatedGM.boredom = Math.max(10, calculatedBoredom - 30);

      const logPrefix = forceImmediateTrigger
        ? `Turn ${turn}: EMERGENCY OVERRIDE INTERVENTION: `
        : `Turn ${turn}: AUTONOMOUS INTERVENTION: `;
      updatedGM.thoughts.unshift(`${logPrefix}${chosenEncounter.name}`);

      const logMsg: GameLogMessage = {
        id: `gm_intervene_${Date.now()}`,
        text: result.logText,
        type: 'danger',
        timestamp: 'STORY'
      };

      const finalStateUpdates = {
        ...result.mutatedState,
        ...chaosStateUpdates
      };

      setGMStorytellerState(updatedGM);

      const allMsgs: GameLogMessage[] = [];
      if (chaosLogMessage) allMsgs.push(chaosLogMessage);
      if (logMsg) allMsgs.push(logMsg);

      return {
        gmState: updatedGM,
        stateUpdates: finalStateUpdates,
        didIntervene: true,
        logMessage: chaosLogMessage || logMsg,
        logMessages: allMsgs,
        effectSpawn: chaosEffectSpawn || result.effectSpawn
      };
    }
  }

  setGMStorytellerState(updatedGM);

  return {
    gmState: updatedGM,
    stateUpdates: chaosStateUpdates,
    didIntervene: didChaosTrigger,
    logMessage: chaosLogMessage,
    logMessages: chaosLogMessage ? [chaosLogMessage] : [],
    effectSpawn: chaosEffectSpawn
  };
}

/**
 * Manually forces a specific GM encounter from the registry to execute immediately.
 */
export function forceGMEncounter(encounterId: string, gameState: GameState) {
  const enc = GM_ENCOUNTERS_DATABASE.find(e => e.id === encounterId);
  if (!enc) {
    return {
      success: false,
      logText: 'Encounter not found',
      mutatedState: {},
      effectSpawn: undefined
    };
  }

  const currentGM = getGMStorytellerState();
  const res = enc.trigger(gameState, currentGM);
  if (res.success) {
    const turn = gameState.playerStats.turnsPlayed;
    currentGM.thoughts.unshift(`Turn ${turn}: GM FORCED INTERVENTION: ${enc.name}!`);
    currentGM.boredom = Math.max(10, currentGM.boredom - 25);
    currentGM.memories.lastInterventionTurn = turn;
    setGMStorytellerState(currentGM);
  }
  return res;
}
