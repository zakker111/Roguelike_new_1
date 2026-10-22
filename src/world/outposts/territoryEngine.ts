/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import type { OverworldChunk } from '../../types';
import type {
  FactionId,
  OutpostTerritoryState,
  OutpostSiegeState
} from '../../types/worldEvents';
import { createOutpostQuartermaster } from './outpostQuartermaster';
import { eventBus } from '../../events/core/EventBus';

export function getFactionDisplayName(faction: FactionId): string {
  switch (faction) {
    case 'vanguard':
      return 'Dawn Vanguard ☀️';
    case 'syndicate':
      return 'Moonshadow Syndicate 🌙';
    case 'bandits':
      return 'Rust-Raider Outlaws 🪓';
    default:
      return 'Frontier Free Folk 🛡️';
  }
}

export function getOutpostName(chunkX: number, chunkY: number, faction: FactionId): string {
  const direction =
    chunkY < 0 ? (chunkX < 0 ? 'Northwest' : 'Northeast') : chunkX < 0 ? 'Southwest' : 'Southeast';
  const tag =
    faction === 'vanguard'
      ? 'Bastion'
      : faction === 'syndicate'
      ? 'Redoubt'
      : faction === 'bandits'
      ? 'Stronghold'
      : 'Watchtower';
  return `${direction} Frontier ${tag} [${chunkX}, ${chunkY}]`;
}

export interface TerritoryEvaluationResult {
  updatedChunk: OverworldChunk;
  narrativeLog?: { text: string; type: 'danger' | 'info' | 'quest' };
  bountyAwarded?: number;
  reputationGain?: { faction: FactionId; delta: number };
  eventFired?: 'siege_started' | 'defenders_victorious' | 'attackers_captured';
}

/**
 * Checks if a turn milestone or exploration trigger warrants initiating an outpost siege
 */
export function rollWorldEventSiege(
  chunks: Record<string, OverworldChunk>,
  currentTurn: number,
  lastEventTurn: number,
  playerChunkX: number,
  playerChunkY: number
): { chunkKey: string; attacker: FactionId; defender: FactionId } | null {
  const turnsSince = currentTurn - lastEventTurn;
  if (turnsSince < 75) return null;

  // Find candidate chunks with watchtowers that are not currently under siege
  const candidates: Array<{ key: string; chunk: OverworldChunk; dist: number }> = [];

  for (const [key, chunk] of Object.entries(chunks)) {
    if (chunk.watchtower && (!chunk.watchtower.siegeState || !chunk.watchtower.siegeState.isUnderSiege)) {
      const dist = Math.hypot(chunk.chunkX - playerChunkX, chunk.chunkY - playerChunkY);
      candidates.push({ key, chunk, dist });
    }
  }

  if (candidates.length === 0) return null;

  // Prefer nearby chunks (within 0 to 3 chunks away)
  candidates.sort((a, b) => a.dist - b.dist);
  const selected = candidates[0];

  const currentController: FactionId = (selected.chunk.watchtower?.controller as FactionId) || 'neutral';
  let attacker: FactionId = 'bandits';

  if (currentController === 'vanguard') {
    attacker = Math.random() < 0.6 ? 'syndicate' : 'bandits';
  } else if (currentController === 'syndicate') {
    attacker = Math.random() < 0.6 ? 'vanguard' : 'bandits';
  } else {
    attacker = Math.random() < 0.5 ? 'vanguard' : 'syndicate';
  }

  return {
    chunkKey: selected.key,
    attacker,
    defender: currentController
  };
}

/**
 * Resolves combat status inside an active outpost chunk
 */
export function evaluateActiveOutpostCombat(
  chunk: OverworldChunk,
  playerFaction: string = 'neutral'
): TerritoryEvaluationResult | null {
  const wt = chunk.watchtower;
  if (!wt || !wt.siegeState || !wt.siegeState.isUnderSiege) {
    return null;
  }

  const siege = wt.siegeState;
  const enemies = chunk.enemies || [];

  // Count remaining attackers and defenders
  const remainingAttackers = enemies.filter(
    (e) => (e.id.startsWith('siege_attacker_') || e.id.startsWith('siege_att_')) && e.hp > 0
  );
  const remainingDefenders = enemies.filter(
    (e) => (e.id.startsWith('siege_defender_') || e.id.startsWith('siege_def_')) && e.hp > 0
  );

  const updatedChunk: OverworldChunk = {
    ...chunk,
    watchtower: { ...wt, siegeState: { ...siege } }
  };

  // CASE 1: All attackers are wiped out -> DEFENDERS WIN
  if (remainingAttackers.length === 0) {
    const victor = siege.defender;
    const bounty = (siege as any).bountyGold || 200;
    const playerAssisted = (siege as any).playerAssistedDefender || playerFaction === victor;

    const quartermaster = createOutpostQuartermaster(
      chunk.chunkX,
      chunk.chunkY,
      victor,
      1,
      bounty
    );
    quartermaster.bountyClaimAvailable = playerAssisted;

    updatedChunk.watchtower = {
      ...wt,
      controller: victor,
      isClaimed: true,
      claimPercent: 100,
      garrisonDefeated: false,
      siegeState: undefined,
      quartermaster: quartermaster as any
    };

    const outpostName = getOutpostName(chunk.chunkX, chunk.chunkY, victor);
    const victorName = getFactionDisplayName(victor);

    // Event bus notification
    eventBus.emit('world:outpost_liberated', {
      outpostId: wt.id,
      outpostName,
      chunkX: chunk.chunkX,
      chunkY: chunk.chunkY,
      victor,
      playerAssisted,
      bountyAwarded: playerAssisted ? bounty : 0,
      reputationGain: playerAssisted ? 25 : 0
    });

    return {
      updatedChunk,
      eventFired: 'defenders_victorious',
      bountyAwarded: playerAssisted ? bounty : 0,
      reputationGain: playerAssisted ? { faction: victor, delta: 25 } : undefined,
      narrativeLog: {
        text: `🚩 OUTPOST SECURED! The ${victorName} has repelled the assault at ${outpostName}! ${
          playerAssisted
            ? `Your valor earned +25 Standing and a ${bounty} Gold bounty from the Quartermaster!`
            : 'The frontier sector is now stabilized.'
        }`,
        type: 'quest'
      }
    };
  }

  // CASE 2: All defenders are wiped out -> ATTACKERS CAPTURE OUTPOST
  if (remainingDefenders.length === 0) {
    const victor = siege.attacker;
    const bounty = (siege as any).bountyGold || 200;
    const playerAssisted = (siege as any).playerAssistedAttacker || playerFaction === victor;

    const quartermaster = createOutpostQuartermaster(
      chunk.chunkX,
      chunk.chunkY,
      victor,
      1,
      bounty
    );
    quartermaster.bountyClaimAvailable = playerAssisted;

    updatedChunk.watchtower = {
      ...wt,
      controller: victor,
      isClaimed: true,
      claimPercent: 100,
      garrisonDefeated: false,
      siegeState: undefined,
      quartermaster: quartermaster as any
    };

    const outpostName = getOutpostName(chunk.chunkX, chunk.chunkY, victor);
    const victorName = getFactionDisplayName(victor);

    eventBus.emit('world:outpost_liberated', {
      outpostId: wt.id,
      outpostName,
      chunkX: chunk.chunkX,
      chunkY: chunk.chunkY,
      victor,
      playerAssisted,
      bountyAwarded: playerAssisted ? bounty : 0,
      reputationGain: playerAssisted ? 25 : 0
    });

    return {
      updatedChunk,
      eventFired: 'attackers_captured',
      bountyAwarded: playerAssisted ? bounty : 0,
      reputationGain: playerAssisted ? { faction: victor, delta: 25 } : undefined,
      narrativeLog: {
        text: `⚔️ OUTPOST CAPTURED! The ${victorName} has conquered ${outpostName}! ${
          playerAssisted
            ? `Your aid was honored: +25 Standing & ${bounty} Gold bounty unlocked at the Quartermaster!`
            : 'A new banner flies over the battlements.'
        }`,
        type: 'danger'
      }
    };
  }

  return null;
}
