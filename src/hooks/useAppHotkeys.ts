import { useKeyboardInput, UseKeyboardInputParams } from './useKeyboardInput';

export interface UseAppHotkeysParams extends UseKeyboardInputParams {
  onToggleTab?: (tab: string) => void;
}

/**
 * Custom hook managing global hotkeys, movement bindings, tab navigation shortcuts,
 * and overlay modal toggle keybindings across the application.
 */
export function useAppHotkeys(params: UseAppHotkeysParams) {
  // Delegate to useKeyboardInput controller hook
  useKeyboardInput(params);
}

export default useAppHotkeys;
