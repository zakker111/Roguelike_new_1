/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { GlyphScribingResult } from '../../../types/minigames/glyphGame';

export interface ScriptoriumMiniGameProps {
  onClose: () => void;
  onSuccess: (result: GlyphScribingResult) => void;
  onFail?: () => void;
  targetScrollTemplateId?: string;
  isSandboxMode?: boolean;
  parchmentCount?: number;
  inkCount?: number;
}

export interface NodePosition {
  id: number;
  x: number;
  y: number;
}

export interface DynamicSurgeEvent {
  id: string;
  name: string;
  description: string;
  type: 'flame_wave' | 'cryo_lock' | 'static_discharge' | 'void_collapse' | 'mana_whirl' | 'holy_judgment';
  color: string;
  icon: any;
  durationMs: number;
}

export interface ElementTheme {
  color: string;
  bgGlow: string;
  border: string;
  stroke: string;
  faintStroke: string;
  icon: any;
  badgeBg: string;
  activeNodeBg: string;
  surgeColor: string;
}
