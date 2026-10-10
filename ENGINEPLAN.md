# ROGUELIKE ENGINE ROADMAP

## Goal

Turn the current roguelike game into a reusable roguelike engine.

The engine should provide the systems.
The game should provide the content.

The same engine should eventually be able to create:
- Fantasy roguelikes
- Sci-fi roguelikes
- Horror roguelikes
- Dungeon crawlers
- Other grid/turn-based roguelike games

---

## 1. Clean Enemy System FIRST

Create one clear enemy pipeline:

Enemy Definition
→ Enemy Registry
→ Spawn Table
→ Runtime Enemy
→ AI
→ Combat
→ Rendering

Enemy definitions should contain things like:

- ID
- name
- HP
- attack
- defense
- speed
- range
- character/sprite
- color
- AI role
- abilities
- tags

Adding an enemy should require as little code as possible.

Ideally:

1. Add enemy definition
2. Add it to a spawn table
3. Done

---

## 2. Data-Driven Content

Move game content into data/configuration instead of hardcoded code.

Examples:

- enemies
- items
- weapons
- abilities
- effects
- loot
- rooms
- dungeon rules
- spawn tables

The engine should read these definitions.

---

## 3. Generic AI

AI should use reusable strategies instead of enemy-specific code.

Examples:

- melee
- ranged
- kiting
- coward
- aggressive
- defensive
- summoner
- patrol
- boss

Enemies select their behaviour through data.

---

## 4. Generic Abilities

Create reusable abilities that any entity can use.

Examples:

- fireball
- heal
- poison
- dash
- summon
- teleport
- explode
- shoot
- buff
- debuff

An enemy should be able to combine abilities without requiring new enemy-specific code.

---

## 5. Generic Effects

Create reusable status/effect systems.

Examples:

- poison
- burning
- bleeding
- freezing
- stun
- slow
- shield
- regeneration

Effects should work on players, enemies and other entities.

---

## 6. Generic Entities

Eventually make the engine understand generic entities instead of only "enemies".

Examples:

- player
- enemy
- NPC
- animal
- summon
- trap
- projectile
- item
- interactable object

---

## 7. Generic Dungeon System

Dungeon generation should be configurable.

Support things like:

- rooms
- corridors
- caves
- arenas
- outdoor areas
- procedural layouts
- room types
- encounter rooms
- treasure rooms
- shops
- secret rooms

Different games should be able to use different generators.

---

## 8. Content Registry

Create central registries for:

- enemies
- items
- abilities
- effects
- weapons
- rooms
- generators
- AI strategies

The engine loads content through these registries.

---

## 9. Engine / Game Separation

Eventually organize the project like:

ENGINE
- combat
- AI
- entities
- map
- dungeon generation
- effects
- abilities
- inventory
- procedural generation
- save/load
- rules

GAME
- enemies
- items
- weapons
- maps
- abilities
- art
- balance
- game rules

The engine should not contain game-specific content.

---

## 10. Validation

Add automatic validation for content.

Detect things like:

- duplicate IDs
- missing values
- invalid AI roles
- invalid abilities
- broken references
- invalid spawn tables

Bad content should produce clear errors.

---

# Development Order

Do NOT rewrite everything at once.

Build gradually:

1. Enemy system [COMPLETED]
2. Abilities [COMPLETED]
3. Effects [COMPLETED]
4. Generic entities [COMPLETED]
5. AI strategies [COMPLETED]
6. Dungeon generators [COMPLETED]
7. Content registries [COMPLETED]
8. Engine/Game separation [COMPLETED]
9. Validation tools [COMPLETED]
10. Documentation [COMPLETED - See ENGINE_MANUAL.md]

---

# Final Test

The engine is becoming a real engine when we can create a completely different roguelike by changing content/configuration instead of rewriting the core engine.

Main rule:

> ENGINE = HOW THE GAME WORKS  
> GAME CONTENT = WHAT EXISTS IN THE GAME