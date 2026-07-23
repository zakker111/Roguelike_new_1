import { WeaponBaseType } from '../types';

export interface FlavorSet {
  normal: string[];
  crit: string[];
}

/**
 * Centered configuration for all combat description pools in Abyss Rogue.
 * Easy to extend: simply add new string items containing the '{name}' placeholder.
 */
export const COMBAT_FLAVOR_TEXTS: Record<WeaponBaseType, FlavorSet> = {
  [WeaponBaseType.Sword]: {
    normal: [
      "You piece together a fine sweep, slashing {name} along the shoulder.",
      "You cleanly slice across {name}'s side, splitting cloth and skin.",
      "Your blade bites deep into {name}'s armor-seam, nicking the forearm.",
      "You execute a quick thrust, clipping {name}'s collarbone.",
      "Your steel cuts through the air, carving a crimson arc across {name}'s flank.",
      "You feint low and lunge high, leaving a clean scratch across {name}'s chest."
    ],
    crit: [
      "💥 A glorious cleave! You slash upwards, splitting {name}'s skull!",
      "💥 Decisive lunge! You pierce {name} straight through the chest!",
      "💥 Flashing steel! You sever flesh and bone, nearly disarming {name}!",
      "💥 Spinning strike! Your blade shears through {name}'s guards, slicing a deep artery!",
      "💥 Execution style! You deliver a powerful overhead strike, fracturing {name}'s clavicle!",
      "💥 Horizon crescent! You pivot gracefully, cleaving {name}'s armor plate in half!"
    ]
  },
  [WeaponBaseType.Spear]: {
    normal: [
      "You thrust forward, skewering {name} through the upper thigh.",
      "The tip of your spear grazes {name}'s shoulder with a sharp scrape.",
      "A quick jab catches {name} right under their shield-arm.",
      "You lunge and stab, puncturing {name}'s side armour.",
      "You sweep the shaft, landing a hard sting against {name}'s shin before nicking them.",
      "A swift underhand poke nips {name}'s guard-arm."
    ],
    crit: [
      "💥 Heartbreaker! Your spear pierces {name}'s breastplate, puncturing deep!",
      "💥 Sweeping strike! You spear {name} through the throat with perfect accuracy!",
      "💥 Brutal impalement! You drive the spear-head clean through {name}'s torso!",
      "💥 Searing lunge! You thread the needle, skewering {name}'s major arteries!",
      "💥 Vaulting thrust! You descend with immense force, pinning {name}'s hand to their ribs!",
      "💥 Leviathan pierce! You release a hyper-focused lunge, shattering {name}'s defensive core!"
    ]
  },
  [WeaponBaseType.Dagger]: {
    normal: [
      "A quick wrist-flick lands a shallow cut across {name}'s ribcage.",
      "You slip behind {name}'s guard, nicking their forearm.",
      "A rapid stab opens a neat bloodline along {name}'s shoulder.",
      "Your blade bites briefly into {name}'s wrist.",
      "You execute a lightning-fast feint and slash {name}'s cheek.",
      "You dart inward, leaving a razor-thin opening on {name}'s wrist."
    ],
    crit: [
      "💥 Backstab! You plunge your dagger deep between {name}'s shoulder blades!",
      "💥 Silent lung punch! You jam your blade directly under {name}'s ribcage!",
      "💥 Throat-cutter! Your dagger slices across {name}'s neck in a flashing arc!",
      "💥 Kidneys strike! You sink the shiv deep into {name}'s lower back!",
      "💥 Eye gouge! You drive the dagger point into {name}'s defensive seam, blinding them with blood!",
      "💥 Shadow carve! You slice behind {name}'s Achilles tendon, bringing them to their knees!"
    ]
  },
  [WeaponBaseType.Hammer]: {
    normal: [
      "You bring down your hammer, bruising {name}'s heavy shoulder collar.",
      "The blunt impact cracks against {name}'s armor plate, rattling their bones.",
      "A heavy swing fractures {name}'s knee-guard with a dull thud.",
      "You club {name}'s arm, numbing their fingers and forcing a gasp.",
      "A sideways smash dents {name}'s chest plate, knocking them off balance.",
      "You swing a heavy low arc, bruising {name}'s lower flank."
    ],
    crit: [
      "💥 Skull smashed! Your hammer crashes down directly onto {name}'s forehead with a sickening crunch!",
      "💥 Chest collapse! You shatter the sternum of {name}, flattening their armor!",
      "💥 Bone pulverizer! You break {name}'s kneecap into absolute splinters!",
      "💥 Jaw shattered! Your sweeping mallet impact snaps {name}'s lower jaw structure!",
      "💥 Rib cage crater! The blunt shockwave cringes {name}'s entire upper rib cage inward!",
      "💥 Shockwave slam! Your hammer fractures the ground, destabilizing and rattling {name}'s skeletal frame!"
    ]
  },
  [WeaponBaseType.Staff]: {
    normal: [
      "A crackling ball of arcane power sings through the air, burning {name}'s side.",
      "Your magic energy brushes past {name}, searing their flank.",
      "An energy orb detonates, chipping away {name}'s magical aura.",
      "Raw energy sparks singe {name}'s legs.",
      "Your staff emits a hum, projecting a hard kinetic punch to {name}'s sternum.",
      "A minor telekinetic pulse knocks {name} off-stride."
    ],
    crit: [
      "💥 Cosmic devastation! Your staff projects a direct-hit bolt of pure raw energy, vaporizing {name}'s skin!",
      "💥 Searing rupture! An arcane shockwave blasts {name}'s chest, scorching vital organs!",
      "💥 Mind obliteration! A psychic wave from your staff shatters {name}'s head-space!",
      "💥 Nova implosion! The spell collapses around {name}, tearing muscle fibers apart!",
      "💥 Celestial brand! Pure hot stellar fire marks {name}'s face, melting bone!",
      "💥 Void strike! The dark energy pulse collapses the local space around {name}, fracturing their defense!"
    ]
  },
  [WeaponBaseType.Bow]: {
    normal: [
      "An arrow whistling through the dark grazes {name}'s calf.",
      "You loose a quick shot, sticking an arrow in {name}'s shoulder.",
      "Your arrow bites into {name}'s side, fracturing wood and flesh.",
      "A rapid-fire shot punctures {name}'s thigh.",
      "You pin {name}'s cloak to their body with a grazing laceration.",
      "A curved projectile trajectory scrapes past {name}'s temples."
    ],
    crit: [
      "💥 Eye shot! Your arrow sails through the shadow, pinning {name} straight through the socket!",
      "💥 Heartseeker! A razor-sharp flint arrow punches clean through {name}'s chest cavity!",
      "💥 Spine-splitter! You let fly a perfect arrow, piercing {name}'s vertebrae!",
      "💥 Throat skewer! The shaft passes clean through {name}'s vocal cords!",
      "💥 Artery nick! Your arrow hits the exact soft spot in {name}'s neck armour!",
      "💥 Pinpoint puncture! Your arrow penetrates the narrow helmet visor slit, staggering {name}!"
    ]
  },
  [WeaponBaseType.Wand]: {
    normal: [
      "Sparks of voltage crackle outwards, shocking {name}'s fingers.",
      "A thin spark of electric energy singes the leg of {name}.",
      "Searing magic fizzles against {name}'s arm.",
      "A ball of energy delivers a burning snap to {name}'s ribs.",
      "Electric ripples jump across {name}'s chest, causing them to shudder.",
      "A focused heat ray grazes {name}'s sleeve with a popping smell."
    ],
    crit: [
      "💥 Thunderstorm strike! A concentrated lightning stream melts {name}'s eyes!",
      "💥 Voltage overload! High-current lightning courses through {name}, melting nerve paths!",
      "💥 Plasma burn! A superheated ball of plasma completely toasts {name}'s jaw!",
      "💥 Disintegration ray! High voltage burns a clean black hole in {name}'s torso!",
      "💥 Neuro shock! The wand discharge induces immediate cardiac arrhythmia in {name}!",
      "💥 Lightning Cascade! Sparks splinter off and scorch {name}'s main joints, leaving them trembling!"
    ]
  },
  [WeaponBaseType.Crossbow]: {
    normal: [
      "You release the winch, launching a heavy steel bolt into {name}'s shoulder.",
      "Your crossbow bolt thuds deep into {name}'s thigh armor.",
      "A rapid mechanical shot grazes {name}'s temple.",
      "Your mechanical bolt clips {name}'s helmet, ringing heavily."
    ],
    crit: [
      "💥 Visor puncture! Your heavy bolt sails true and pierces {name}'s visor directly!",
      "💥 Heartpiercer! A massive windlass bolt punches completely through {name}'s chestplate!",
      "💥 Bone splinter! The bolt slams into {name}'s hip, shattering their joint!"
    ]
  },
  [WeaponBaseType.Greatsword]: {
    normal: [
      "You swing your Zweihander in a massive sweeping curve, slashing along {name}'s side.",
      "The heavy edge of your greatsword cuts into {name}'s guards, slicing a forearm.",
      "You follow up with a wide sweep, slicing across {name}'s chest steel."
    ],
    crit: [
      "💥 Sweeping decapitation! Your massive Zweihander sweeps through, nearly cleaving {name} in two!",
      "💥 Brutal bifurcation! A powerful vertical cleave shears through {name}'s defenses and splits their breastplate!",
      "💥 Colossal impact! You pivot and bring the Zweihander down, smashing {name}'s shoulders into the tiles!"
    ]
  },
  [WeaponBaseType.Warhammer]: {
    normal: [
      "You bring the heavy volcanic warhammer down, scraping {name}'s arm guards.",
      "Your heavy warhammer hammer denting the breastplate of {name}.",
      "You swing low, slamming the warhammer's spike into {name}'s knee."
    ],
    crit: [
      "💥 Plate pulverizer! Your massive warhammer collapses {name}'s chest armor, crushing their ribs!",
      "💥 Skullcleaver! Your warhammer smashes {name}'s visor into powder, causing instant vertigo!",
      "💥 Earthquake slam! The sheer force of your warhammer strike sends shockwaves through {name}'s skeleton!"
    ]
  }
};

export const FALLBACK_FLAVORS: FlavorSet = {
  normal: [
    "You strike {name}, landing a painful bruise.",
    "A solid impact rattles {name}'s stance.",
    "You pummel {name}, drawing a fierce grunt of pain.",
    "You manage to catch {name} with a glancing blow."
  ],
  crit: [
    "💥 Splendid strike! Your hit causes {name}'s teeth to rattle with a smash!",
    "💥 Liver punch! You strike {name}'s solar plexus, knocking the wind out of them!",
    "💥 Direct hit! You crash through {name}'s guard with raw force!",
    "💥 Brutal concussion! Your blow rings heavy, temporarily dazing {name}!"
  ]
};
