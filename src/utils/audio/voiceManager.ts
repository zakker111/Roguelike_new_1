/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { SoundPriority, VoiceAllocationOptions, VoiceChannel, VoiceManagerStats } from './types';
import { SOUND_CATALOG } from '../../data/soundCatalog';

export const MAX_VOICES = 8;

/**
 * Default duration mapping (in seconds) for sound catalog effects.
 */
export const SOUND_DURATIONS: Record<string, number> = {
  click: 0.03,
  tab_click: 0.04,
  clock_tick: 0.04,
  bump: 0.08,
  footstep: 0.1,
  wood_footstep: 0.1,
  stone_footstep: 0.1,
  grass_step: 0.1,
  water_drip: 0.15,
  cricket_chirp: 0.2,
  bird_chirp: 0.25,
  owl_hoot: 0.5,
  eat: 0.2,
  drink: 0.25,
  potion_drink: 0.25,
  deny: 0.15,
  equip: 0.1,
  lockpick_click: 0.06,
  lockpick_snap: 0.15,
  unlock: 0.25,
  wood_creak: 0.4,
  indoor_entry: 0.35,
  door_open: 0.3,
  door_close: 0.3,
  chest_open: 0.35,
  loot: 0.42,
  craft: 0.35,
  forge: 0.4,
  mutate: 0.4,
  shield: 0.2,
  arrow_fly: 0.22,
  slash: 0.18,
  spell: 0.28,
  heal: 0.28,
  trap: 0.15,
  injury: 0.22,
  hurt: 0.22,
  monster_growl: 0.45,
  heartbeat: 0.2,
  critical_hit: 0.35,
  lightning_strike: 0.65,
  boss_roar: 0.85,
  levelUp: 0.85,
  defeat: 1.0,
  victory: 1.2,
};

/**
 * Returns estimated duration (in seconds) for a given sound effect.
 */
export function getSoundDuration(type: string): number {
  return SOUND_DURATIONS[type] || 0.35;
}

const soundMetaMap = new Map<string, (typeof SOUND_CATALOG)[number]>();
for (const item of SOUND_CATALOG) {
  soundMetaMap.set(item.id, item);
}

/**
 * Returns sound priority based on type and category.
 */
export function getSoundPriority(type: string): SoundPriority {
  // 1. Specific overrides for high-impact sounds
  switch (type) {
    case 'defeat':
    case 'victory':
    case 'levelUp':
    case 'boss_roar':
    case 'critical_hit':
    case 'player_death':
    case 'injury':
    case 'hurt':
    case 'heartbeat':
      return SoundPriority.CRITICAL;

    case 'slash':
    case 'spell':
    case 'lightning_strike':
    case 'trap':
    case 'shield':
    case 'arrow_fly':
    case 'monster_growl':
    case 'heal':
    case 'heavy_smash':
    case 'parry':
    case 'dodge':
      return SoundPriority.HIGH;

    case 'loot':
    case 'chest_open':
    case 'craft':
    case 'forge':
    case 'mutate':
    case 'lockpick_click':
    case 'lockpick_snap':
    case 'unlock':
    case 'eat':
    case 'drink':
    case 'potion_drink':
    case 'door_open':
    case 'door_close':
    case 'indoor_entry':
    case 'equip':
    case 'deny':
      return SoundPriority.MEDIUM;

    case 'footstep':
    case 'wood_footstep':
    case 'stone_footstep':
    case 'grass_step':
    case 'bump':
    case 'click':
    case 'tab_click':
    case 'wood_creak':
    case 'clock_tick':
    case 'water_drip':
    case 'bird_chirp':
    case 'cricket_chirp':
    case 'owl_hoot':
      return SoundPriority.LOW;
  }

  // 2. Check metadata category from master sound catalog
  const meta = soundMetaMap.get(type);
  if (meta) {
    if (meta.category === 'combat') return SoundPriority.HIGH;
    if (meta.category === 'crafting') return SoundPriority.MEDIUM;
    if (meta.category === 'ui') return SoundPriority.MEDIUM;
    if (meta.category === 'movement') return SoundPriority.LOW;
    if (meta.category === 'environment') return SoundPriority.LOW;
  }

  return SoundPriority.MEDIUM;
}

/**
 * Synthesizer voice allocation manager maintaining up to MAX_VOICES channels.
 * Reuses persistent node graphs (BiquadFilter -> Gain -> StereoPanner) and implements
 * priority theft for high-impact audio.
 */
export class VoiceAllocationManager {
  private channels: VoiceChannel[] = [];
  private audioCtx: AudioContext | null = null;
  private sfxGainNode: GainNode | null = null;
  private totalAllocations = 0;
  private voiceThefts = 0;
  private throttledCount = 0;

  constructor(private readonly maxVoices = MAX_VOICES) {}

  /**
   * Initializes or re-attaches audio context and shared node graphs.
   */
  public init(ctx: AudioContext, sfxGainNode: GainNode): void {
    if (this.audioCtx === ctx && this.channels.length === this.maxVoices) {
      return;
    }

    this.stopAllVoices();
    this.audioCtx = ctx;
    this.sfxGainNode = sfxGainNode;
    this.channels = [];

    const now = ctx.currentTime;

    for (let i = 0; i < this.maxVoices; i++) {
      const channelId = i;

      // Master channel node graph: Filter -> Gain -> Panner -> SFX Master Gain
      const filterNode = ctx.createBiquadFilter();
      filterNode.type = 'lowpass';
      filterNode.frequency.setValueAtTime(20000, now);

      const gainNode = ctx.createGain();
      gainNode.gain.setValueAtTime(0, now);
      filterNode.connect(gainNode);

      let pannerNode: StereoPannerNode | null = null;
      if (typeof ctx.createStereoPanner === 'function') {
        try {
          pannerNode = ctx.createStereoPanner();
          pannerNode.pan.setValueAtTime(0, now);
          gainNode.connect(pannerNode);
          pannerNode.connect(sfxGainNode);
        } catch (e) {
          gainNode.connect(sfxGainNode);
        }
      } else {
        gainNode.connect(sfxGainNode);
      }

      const channel: VoiceChannel = {
        id: channelId,
        filterNode,
        gainNode,
        pannerNode,
        isActive: false,
        currentSound: '',
        currentPriority: 0,
        startTime: 0,
        endTime: 0,
        sourceNodes: [],
        timerId: null,
        registerSource: (node) => {
          channel.sourceNodes.push(node);
        },
        release: () => {
          this.releaseChannel(channel);
        },
        steal: () => {
          this.stealChannel(channel);
        },
      };

      this.channels.push(channel);
    }
  }

  /**
   * Cleans up expired voice channels based on current audio time.
   */
  private cleanupExpired(now: number): void {
    for (const ch of this.channels) {
      if (ch.isActive && now >= ch.endTime) {
        ch.release();
      }
    }
  }

  /**
   * Requests a voice channel for playback.
   * If all channels are active, performs priority theft if the incoming sound
   * has higher priority than the lowest active voice.
   */
  public allocateVoice(
    soundType: string,
    durationSec: number,
    priority: number = SoundPriority.MEDIUM,
    options?: VoiceAllocationOptions
  ): VoiceChannel | null {
    if (!this.audioCtx || !this.sfxGainNode) {
      return null;
    }

    const now = this.audioCtx.currentTime;
    this.cleanupExpired(now);

    // 1. Look for free channel
    let selectedChannel = this.channels.find((ch) => !ch.isActive);

    // 2. If all channels are busy, evaluate voice theft
    if (!selectedChannel) {
      let lowestPriorityChannel: VoiceChannel | null = null;
      let minPriority = Infinity;
      let minRemainingTime = Infinity;

      for (const ch of this.channels) {
        if (ch.currentPriority < minPriority) {
          minPriority = ch.currentPriority;
          lowestPriorityChannel = ch;
          minRemainingTime = ch.endTime - now;
        } else if (ch.currentPriority === minPriority) {
          const remaining = ch.endTime - now;
          if (remaining < minRemainingTime) {
            lowestPriorityChannel = ch;
            minRemainingTime = remaining;
          }
        }
      }

      if (lowestPriorityChannel) {
        const isHigherPriority = priority > lowestPriorityChannel.currentPriority;
        const totalDuration = lowestPriorityChannel.endTime - lowestPriorityChannel.startTime;
        const hasElapsedSignificantly = totalDuration > 0 && (now - lowestPriorityChannel.startTime) / totalDuration >= 0.65;
        const isSamePriorityExpiring = priority === lowestPriorityChannel.currentPriority && hasElapsedSignificantly;

        if (isHigherPriority || isSamePriorityExpiring) {
          // Steal voice!
          lowestPriorityChannel.steal();
          selectedChannel = lowestPriorityChannel;
          this.voiceThefts++;
        }
      }
    }

    // 3. If still no channel, sound is throttled
    if (!selectedChannel) {
      this.throttledCount++;
      return null;
    }

    // 4. Configure allocated channel
    selectedChannel.isActive = true;
    selectedChannel.currentSound = soundType;
    selectedChannel.currentPriority = priority;
    selectedChannel.startTime = now;
    selectedChannel.endTime = now + Math.max(0.02, durationSec);
    selectedChannel.sourceNodes = [];

    // Clear any previous timer
    if (selectedChannel.timerId) {
      clearTimeout(selectedChannel.timerId);
      selectedChannel.timerId = null;
    }

    // Reset filter
    const filterType = options?.filterType || 'lowpass';
    const lowpassFreq = options?.lowpassFreq ?? 20000;
    try {
      selectedChannel.filterNode.type = filterType;
      selectedChannel.filterNode.frequency.cancelScheduledValues(now);
      selectedChannel.filterNode.frequency.setValueAtTime(lowpassFreq, now);
      if (options?.filterQ !== undefined) {
        selectedChannel.filterNode.Q.setValueAtTime(options.filterQ, now);
      }
    } catch (e) {
      // Safe fallback
    }

    // Reset gain
    const vol = options?.volume ?? 1.0;
    try {
      selectedChannel.gainNode.gain.cancelScheduledValues(now);
      selectedChannel.gainNode.gain.setValueAtTime(vol, now);
    } catch (e) {
      // Safe fallback
    }

    // Reset pan
    if (selectedChannel.pannerNode && options?.panX !== undefined) {
      try {
        selectedChannel.pannerNode.pan.cancelScheduledValues(now);
        selectedChannel.pannerNode.pan.setValueAtTime(Math.max(-1, Math.min(1, options.panX)), now);
      } catch (e) {
        // Safe fallback
      }
    }

    // Auto-release timer as safety backstop
    const timeoutMs = Math.max(30, (durationSec + 0.05) * 1000);
    selectedChannel.timerId = setTimeout(() => {
      if (selectedChannel && selectedChannel.isActive && this.audioCtx && this.audioCtx.currentTime >= selectedChannel.endTime) {
        selectedChannel.release();
      }
    }, timeoutMs);

    this.totalAllocations++;
    return selectedChannel;
  }

  /**
   * Release channel back into idle pool.
   */
  private releaseChannel(ch: VoiceChannel): void {
    if (!ch.isActive) return;

    ch.isActive = false;
    ch.currentSound = '';
    ch.currentPriority = 0;

    if (ch.timerId) {
      clearTimeout(ch.timerId);
      ch.timerId = null;
    }

    if (this.audioCtx) {
      const now = this.audioCtx.currentTime;
      try {
        ch.gainNode.gain.cancelScheduledValues(now);
        ch.gainNode.gain.setValueAtTime(0, now);
      } catch (e) {
        // Ignore
      }
    }

    // Cleanly stop and disconnect any source nodes
    for (const src of ch.sourceNodes) {
      try {
        if ('stop' in src && typeof (src as any).stop === 'function') {
          (src as any).stop();
        }
        src.disconnect();
      } catch (e) {
        // Ignore already stopped nodes
      }
    }
    ch.sourceNodes = [];
  }

  /**
   * Steal channel: quickly ramp down to avoid audio pops, stop sources, and reuse.
   */
  private stealChannel(ch: VoiceChannel): void {
    if (ch.timerId) {
      clearTimeout(ch.timerId);
      ch.timerId = null;
    }

    if (this.audioCtx) {
      const now = this.audioCtx.currentTime;
      try {
        ch.gainNode.gain.cancelScheduledValues(now);
        ch.gainNode.gain.linearRampToValueAtTime(0.0001, now + 0.015);
      } catch (e) {
        // Ignore
      }
    }

    for (const src of ch.sourceNodes) {
      try {
        if ('stop' in src && typeof (src as any).stop === 'function') {
          (src as any).stop();
        }
        src.disconnect();
      } catch (e) {
        // Ignore
      }
    }
    ch.sourceNodes = [];
    ch.isActive = false;
  }

  /**
   * Stop all active voice channels.
   */
  public stopAllVoices(): void {
    for (const ch of this.channels) {
      this.releaseChannel(ch);
    }
  }

  /**
   * Return real-time voice allocation statistics.
   */
  public getStats(): VoiceManagerStats {
    const active = this.channels.filter((c) => c.isActive);
    return {
      maxVoices: this.maxVoices,
      activeVoices: active.length,
      totalAllocations: this.totalAllocations,
      voiceThefts: this.voiceThefts,
      throttledCount: this.throttledCount,
      activeChannelSounds: active.map((c) => c.currentSound),
    };
  }

  /**
   * Resets metrics and stops channels (ideal for testing).
   */
  public reset(): void {
    this.stopAllVoices();
    this.totalAllocations = 0;
    this.voiceThefts = 0;
    this.throttledCount = 0;
  }
}

// Global singleton instance
const globalVoiceManager = new VoiceAllocationManager(MAX_VOICES);

/**
 * Accessor for singleton voice allocation manager with lazy initialization.
 */
export function getVoiceManager(ctx?: AudioContext | null, sfxGain?: GainNode | null): VoiceAllocationManager {
  if (ctx && sfxGain) {
    globalVoiceManager.init(ctx, sfxGain);
  }
  return globalVoiceManager;
}
