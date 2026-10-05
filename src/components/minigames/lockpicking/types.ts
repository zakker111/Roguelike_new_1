/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type LockpickingStatus = 'READY' | 'SHAKING' | 'SNAPPED' | 'SUCCESS' | 'NO_PICKS';

export interface LockpickingMiniGameProps {
  onClose: () => void;
  onSuccess: (isPerfect: boolean) => void;
  onFail?: () => void;
  lockpickCount: number;
  onConsumeLockpick: () => void;
  chestName?: string;
  skeletonKeyCount?: number;
  onUseSkeletonKey?: () => void;
}
