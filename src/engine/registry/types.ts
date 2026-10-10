/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Summary metrics of all active registered content in the engine
 */
export interface ContentSummary {
  enemies: number;
  items: number;
  weapons: number;
  abilities: number;
  effects: number;
  rooms: number;
  generators: number;
  aiStrategies: number;
  entities: number;
  total: number;
}

/**
 * Result of cross-registry referential validation
 */
export interface ContentValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
  timestamp: number;
}
