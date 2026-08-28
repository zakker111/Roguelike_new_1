/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useKeyboardControls, UseKeyboardControlsParams } from './useKeyboardControls';

export interface UseHotkeysParams extends UseKeyboardControlsParams {
  onToggleTab?: (tab: string) => void;
}

/**
 * Custom hook managing global hotkeys, movement bindings, tab navigation shortcuts,
 * and overlay modal toggle keybindings across the application.
 */
export function useHotkeys(params: UseHotkeysParams) {
  useKeyboardControls(params);
}

export default useHotkeys;
