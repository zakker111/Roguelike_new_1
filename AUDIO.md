# 🔊 Cosmic Abyss Sound Engine & Audio Developer Guide

Welcome to the **Cosmic Abyss Audio Architecture** developer guide. This document explains how the procedural WebAudio sound synthesizer works, how spatial audio and ambient soundscapes are generated, and how developers can add new sound effects or ambient layers.

---

## 🎧 Architecture Overview

The sound system in **Cosmic Abyss** is powered entirely by a pure **WebAudio API procedural synthesizer** (`src/utils/audio.ts`). 

### Why Procedural Synthesis?
1. **Zero Asset Overhead**: No external `.mp3` or `.wav` files need to be loaded over the network.
2. **Infinite Variation**: Pitch, gain, filter frequency, and timing can be dynamically modulated per event or position.
3. **Instant Responsiveness**: Microsecond latency execution with zero audio buffering delays.
4. **Spatial Immersion**: Every sound effect can automatically attenuate volume, pan stereo channels, and low-pass filter frequencies based on tile coordinates relative to the player.

---

## 🎛️ Audio Node Routing Graph

```
[ Oscillator / Noise Buffer ] 
            │
            ▼
   [ Biquad Filter Node ] (Low-pass / Bandpass / High-pass)
            │
            ▼
    [ Stereo Panner Node ] (Pan -1.0 to +1.0 based on relative tile Δx)
            │
            ▼
     [ Sound Gain Node ] (Proximity attenuation & event volume)
            │
            ▼
      [ SFX Gain Node ] / [ Ambient Gain Node ] ──► [ Ambient Wall Muffle Filter ]
            │
            ▼
    [ Master Gain Node ] (Global Volume & Mute Controller)
            │
            ▼
    [ Analyser Node ] ──► Real-Time Vector Oscilloscope & Spectrum Visualizer (60 FPS)
            │
            ▼
    [ AudioContext Destination ] (Speakers / Headphones)
```

---

## 🎵 Live WebAudio Oscilloscope & Synthesizer Studio (v4.3.7)

Developers can launch the **Live WebAudio Oscilloscope & Synthesizer Studio** directly from the **Audio Settings Modal** (`src/components/AudioSettingsModal.tsx` -> `Activity` icon tab) or developer instruments:

1. **Vector Oscilloscope Waveform Trace**: Renders live phosphor green trace with cyan glow (`getByteTimeDomainData`).
2. **FFT Frequency Spectrum Analyzer**: Renders 48-bin frequency energy bars with peak level indicators in dBFS (`getByteFrequencyData`).
3. **Soundboard & Spatial Modulator**: Instant trigger catalog for all 35+ sound effects with live Pitch, Panning, and Distance sliders.
4. **Custom Patch Workbench**: Interactive ADSR, Filter, and Oscillator controls with a 1-click **"Copy TypeScript Snippet"** generator.

---

## 📍 Spatial Audio & Distance Attenuation Math

When calling `playSound(soundType, options)` with spatial coordinates:

```typescript
playSound('monster_growl', {
  x: enemy.x,
  y: enemy.y,
  playerX: player.x,
  playerY: player.y,
  maxDistance: 14,
});
```

The audio engine automatically calculates:
1. **Distance Attenuation**:
   $$\text{attenuation} = \left(1 - \frac{\text{dist}}{\text{maxDistance}}\right)^{1.5}$$
   If $\text{dist} > \text{maxDistance}$, the sound is strictly culled (0 volume).
2. **Stereo Panning**:
   $$\text{panX} = \text{clamp}\left(\frac{\Delta x}{8}, -1, 1\right)$$
   Events to the left of the player pan left; events to the right pan right.
3. **Low-Pass Wall/Distance Occlusion**:
   $$\text{cutoffFreq} = 1200 + (18000 - 1200) \times \left(1 - \frac{\text{dist}}{\text{maxDistance}}\right)$$
   Distant sounds lose high frequencies, creating realistic spatial depth.

---

## 🌿 Ambient Soundscape & Atmospheric Accents

Ambient audio is driven by `updateAmbientAudio(params)` in `src/utils/audio.ts` and triggered by `useAmbientAudio` hook.

### Ambient Layers:
- **Biome Wind & Hiss**: Continuous filtered white noise modulated by biome (Ocean, Desert, Forest, Tundra, Swamp, Cave).
- **Weather Overlays**: Bandpass rain, blizzard howl, and sandstorm whistling.
- **Low Sub-Bass Drone**: Sub-30Hz oscillator providing atmospheric dungeon/night tension.
- **Realistic Indoor Acoustic Muffling (v4.3.6)**: When the player steps inside any indoor building (houses, taverns, shops, keeps, watchtowers), `src/utils/buildingAudio.ts` flags `isIndoor: true`. The soundscape passes outdoor wind and rain through a dynamic 650Hz lowpass filter, realistically dampening outdoor atmosphere behind wooden walls and stone roofs.
- **Indoor Accent Soundscapes**: Periodic indoor ambient accents (`fire_crackle`, `wood_creak`, `lute_pluck`, `clock_tick`) play softly inside buildings.
- **Dynamic Door & Step Audio**: Triggers `door_open` creaks and `door_close` thuds when entering/exiting, and dynamically alternates between `wood_footstep`, `stone_footstep`, and `grass_step`.

---

## 🛠️ Step-by-Step Guide: How to Add a New Sound Effect

Adding a new sound effect requires **3 simple steps**:

### Step 1: Declare the Sound Name in Union Type
Open `src/utils/audio.ts` and add your sound name to the `playSound` `type` union:

```typescript
export function playSound(
  type:
    | 'bump'
    | 'slash'
    | 'my_new_sound' // <--- Add your sound name here
    | (string & {}),
  options?: PlaySoundOptions | number
)
```

### Step 2: Add the Synthesizer Logic in `playSound()` Switch
Inside the `switch (type)` block in `src/utils/audio.ts`, create your WebAudio node generator:

```typescript
case 'my_new_sound': {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  
  // Set wave type: 'sine' | 'square' | 'sawtooth' | 'triangle'
  osc.type = 'triangle';
  osc.frequency.setValueAtTime(440 * pitch, now); // A4 pitch
  osc.frequency.exponentialRampToValueAtTime(880 * pitch, now + 0.15); // Ramp up octave

  gain.gain.setValueAtTime(0.15, now);
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);

  osc.connect(gain);
  gain.connect(destNode);
  
  osc.start(now);
  osc.stop(now + 0.2);
  break;
}
```

### Step 3: Trigger the Sound anywhere in the Codebase
Import `playSound` and call it wherever the action occurs:

```typescript
import { playSound } from '../utils/audio';

// Non-spatial UI trigger
playSound('my_new_sound', { volume: 0.8 });

// Spatial gameplay trigger (positional)
playSound('my_new_sound', {
  x: targetTile.x,
  y: targetTile.y,
  playerX: player.x,
  playerY: player.y,
  volume: 1.0,
});
```

---

## 🔇 Quick Mute Button & Preferences Persistence

- **HUD Quick Mute**: Users can click the **`🔊 Mute` / `🔇 Muted`** button in the header bar or toggle settings in the Audio Modal (`⚙️ Audio`).
- **Persistence**: Preferences are automatically saved in `localStorage` (`cosmic_abyss_audio_settings_v1`) and restored upon launch:
  ```typescript
  import { toggleAudioMute, getAudioSettings } from './utils/audio';
  ```

---

## 📜 Full Catalog of Available Sound Effects

| Sound Key | Type / Frequency | Primary Use |
| :--- | :--- | :--- |
| `bump` | Low Sine Drop (160Hz -> 60Hz) | Wall collision, blocked step |
| `slash` | Filtered Sawtooth Sweep | Melee weapon attack |
| `spell` | Dual High Triangle Chiming | Magic casting, scroll scribing |
| `loot` | Ascending Major Triad (Arpeggio) | Item pickup, gold drop |
| `trap` | Square Wave Snap + White Noise | Mechanical trap trigger |
| `levelUp` | 7-Note Ascending Arpeggio | Character level up |
| `injury` / `hurt` | Sawtooth Lowpass Burst | Player/Enemy damage taken |
| `defeat` | Descending Minor Triad | Character death |
| `victory` | Bright Major Chords | Quest complete, victory |
| `craft` / `forge` | Metallic Resonance Pitch Drop | Anvil forging, item repairs |
| `mutate` | Sawtooth Glitch Shift | Mutation forge transmutations |
| `lockpick_click` | Ultra-short Square Tick | Chest lockpick attempt |
| `lockpick_snap` | High Sine Snap | Lockpick breaking |
| `unlock` | Ascending Dual Tick | Door/Chest unlocked |
| `eat` | Sine Pitch Sweep Gulp | Food consumption |
| `drink` / `potion_drink` | Double Sine Gulp Resonance | Potion consumption |
| `click` / `tab_click` | Soft High Sine Tick | UI button & tab clicks |
| `deny` | Dual Low Square Error Tone | Invalid action / insufficient mana |
| `heal` | Ascending Pure Sine Bell | Spell healing |
| `shield` | Resonant Low Square Drop | Shield blocking |
| `footstep` | Soft Filtered Noise Tap | Walking steps |
| `monster_growl` / `boss_roar` | Deep Sawtooth Sub-Bass Pitch Ramp | Monster agro & boss roars |
| `water_drip` | High-to-Low Droplet Sine | Cave & dungeon ambient accent |
| `heartbeat` | Sub-Bass Double Pulse (Lub-dub) | Low health warning (<25% HP) |
| `arrow_fly` | Pitch-dropping Whistle | Ranged arrow projectile |
| `chest_open` | Creaky Sawtooth + Metal Latch Drop | Chest opening |
| `lightning_strike` | Short Noise Crackle + Sub Boom | Elemental storm lightning |
| `critical_hit` | High Bell Ring Quad Note | Critical hit strike |
| `equip` | Triangle Pitch Snap | Armoring / weapon equip |
| `bird_chirp` | Melodic Dual-Trill Sine Sweep (2400Hz-3400Hz) | Forest & plains songbird chirping |
| `owl_hoot` | Dual Soft Sine Slope | Forest & plains night accent |
| `cricket_chirp` | Triple High Sine Burst | Night time ambient accent |
| `frog_croak` | Filtered Sawtooth Ribbit | Swamp ambient accent |
| `cave_echo` | Deep Sine Echo Drop | Dungeon cave reverberation |
| `lute_pluck` | Soft Arpeggiated Pluck | Town tavern ambient accent |
| `ocean_wave` | Filtered Lowpass Noise Wave | Coastline & sea ambient accent |
| `fire_crackle` | Short High Triangle Ember Snap | Campfire & hearth accent |

---

*Keep the soundscapes subtle, spatial, and immersive! Sovereign Creators can expand procedural sound recipes as needed.*
