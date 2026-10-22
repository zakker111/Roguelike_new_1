/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, it, expect } from 'vitest';
import { parseErrorLocation, formatErrorLog } from '../components/ErrorBoundary';

describe('Sanctum Error Gump Diagnostic Parser & Reporter Suite', () => {
  it('correctly parses file, line number, column, and function name from a standard Vite stack trace', () => {
    const mockError = new Error("Cannot read properties of undefined (reading 'startsWith')");
    mockError.stack = `TypeError: Cannot read properties of undefined (reading 'startsWith')
    at performPlayerAttack (http://localhost:3000/src/hooks/usePlayerAttack.ts?t=1729497000123:544:12)
    at HTMLDivElement.dispatchAction (http://localhost:3000/src/components/GameCanvas.tsx:645:8)`;

    const loc = parseErrorLocation(mockError);
    expect(loc.file).toContain('usePlayerAttack.ts');
    expect(loc.line).toBe('544');
    expect(loc.col).toBe('12');
    expect(loc.functionName).toBe('performPlayerAttack');
    expect(loc.fullLocation).toContain('544:12');
  });

  it('correctly parses line number from relative file path stack trace', () => {
    const mockError = new Error('Enemy target missing');
    mockError.stack = `Error: Enemy target missing
    at executePlayerAttackTactics (src/hooks/ai/tactics/aiPlayerAttackTactics.ts:128:22)
    at executeEnemiesTurn (src/hooks/ai/useEnemyAI.ts:250:15)`;

    const loc = parseErrorLocation(mockError);
    expect(loc.file).toBe('src/hooks/ai/tactics/aiPlayerAttackTactics.ts');
    expect(loc.line).toBe('128');
    expect(loc.col).toBe('22');
    expect(loc.functionName).toBe('executePlayerAttackTactics');
  });

  it('gracefully handles empty, missing, or malformed stack traces', () => {
    const locFromNull = parseErrorLocation(null);
    expect(locFromNull.line).toBe('?');
    expect(locFromNull.file).toBe('Unknown File');

    const locFromString = parseErrorLocation('Custom error string without stack');
    expect(locFromString.line).toBe('?');
  });

  it('formats a comprehensive, markdown-ready diagnostic report for clipboard copy', () => {
    const mockError = new Error("Cannot read properties of undefined (reading 'startsWith')");
    mockError.stack = `TypeError: Cannot read properties of undefined (reading 'startsWith')
    at performPlayerAttack (src/hooks/usePlayerAttack.ts:544:12)`;

    const log = formatErrorLog(
      mockError,
      'Combat Action: Player attacking [Forest Dire Wolf] (ID: wolf_1)',
      { playerHp: 45, depth: 3 }
    );

    expect(log).toContain('### ⚠️ Sanctum Error Gump Diagnostic Report');
    expect(log).toContain('Line 544');
    expect(log).toContain('usePlayerAttack.ts');
    expect(log).toContain('Forest Dire Wolf');
    expect(log).toContain('TypeError: Cannot read properties of undefined');
    expect(log).toContain('#### 📜 Stack Trace:');
  });
});
