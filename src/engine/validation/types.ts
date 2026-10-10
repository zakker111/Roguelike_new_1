/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type ValidationSeverity = 'error' | 'warning';

export type ValidationCategory =
  | 'enemies'
  | 'items'
  | 'weapons'
  | 'abilities'
  | 'effects'
  | 'rooms'
  | 'spawnTables'
  | 'crossReference';

export type ValidationCode =
  | 'DUPLICATE_ID'
  | 'MISSING_FIELD'
  | 'INVALID_VALUE'
  | 'INVALID_AI_ROLE'
  | 'INVALID_ABILITY'
  | 'INVALID_EFFECT'
  | 'BROKEN_REFERENCE'
  | 'INVALID_RANGE'
  | 'INVALID_SPAWN_TABLE'
  | 'INVALID_DIMENSIONS'
  | 'EMPTY_COLLECTION';

export interface ValidationIssue {
  severity: ValidationSeverity;
  category: ValidationCategory;
  code: ValidationCode;
  targetId: string;
  message: string;
  field?: string;
  details?: Record<string, any>;
}

export interface ValidationReport {
  valid: boolean;
  errors: ValidationIssue[];
  warnings: ValidationIssue[];
  checkedCounts: Record<string, number>;
  timestamp: number;
}
