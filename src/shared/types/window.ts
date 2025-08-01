export interface WindowConfig {
  width: number;
  height: number;
  x?: number;
  y?: number;
  alwaysOnTop: boolean;
  skipTaskbar: boolean;
  transparent: boolean;
  frame: boolean;
}

export interface WindowState {
  isVisible: boolean;
  isMinimized: boolean;
  position: { x: number; y: number };
  size: { width: number; height: number };
}

export type WindowStatus = 'hidden' | 'visible' | 'minimized';