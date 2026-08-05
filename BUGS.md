# Game Bug Tracking & Resolution Register

All reported bugs, runtime crashes, and stack trace issues have been systematically resolved, verified through automated unit testing, and validated with clean linter and build passes.

---

## 🟢 Resolved Issue Registry

### Phase 12 Automated Verification & Diagnostics (Latest)
- **[RESOLVED] GameLog undefined string property access during filtering** — Handled via null guards and `safeText` fallback string coercions.
- **[RESOLVED] entityLayerRenderer corpse glyph rendering crash on missing name** — Added optional chaining (`corpse.name?.toLowerCase()`).
- **[RESOLVED] Status affliction property mismatch (`duration` vs `turnsRemaining`)** — Unified debuff tick handling across `useEnemyAI.ts` and `useSpellcasting.ts` with dual fallback handling.
- **[RESOLVED] React duplicate key warnings in combat log renderer** — Implemented safe unique fallback key generator (`log.id || log_row_idx_text`).
- **[RESOLVED] Castle invasion spawner missing debuffs array** — Initialized `debuffs: []` on dynamic siege spawners.

### Core Systems & Stability
- **[RESOLVED] Dungeon level generation crashes** — Fixed stair indexing, safe template lookups, and missing level bounds checks.
- **[RESOLVED] Follower trapping & pathing issues** — Added anti-trapping position swap mechanics and idle dispersion jitter.
- **[RESOLVED] Dual-wielding & shield equipment handlers** — Fully supported left/right hand equipping without stat duplication or crashes.
- **[RESOLVED] GameLog filter bar responsive clipping** — Converted GameLog filters to responsive wrapped flex layouts.
- **[RESOLVED] Caravan travel interaction scope** — Restricted traveling prompt options exclusively to genuine caravan master NPCs.
- **[RESOLVED] Companion target prioritization** — Ensured cats and pet followers only target entities actively hostile to the player.
- **[RESOLVED] Damage scaling balance** — Rebalanced high-level stat and damage scaling using sub-linear power curves in `balance.ts`.
- **[RESOLVED] Camera viewport tracking** — Implemented instant snap positioning on world chunk boundary transitions.

---

## 📊 Current Defect Status: ZERO OPEN BUGS
- **Unit Test Status**: 19 Test Suites / 77 Tests Passing (Vitest)
- **TypeScript Verification**: Clean (`tsc --noEmit` exit 0)
- **Applet Build**: Production Build Clean (`npm run build` exit 0)
