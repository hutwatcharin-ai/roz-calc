export const MAP_WIDTH = 1280;
export const MAP_HEIGHT = 1024;
export const MAX_SCALE = 2.4;

export interface ViewportState { scale: number; x: number; y: number }

export function fitScale(width: number, height: number) {
  return Math.min(1, width / MAP_WIDTH, height / MAP_HEIGHT);
}

export function clampViewport(state: ViewportState, width: number, height: number, minimum = fitScale(width, height)): ViewportState {
  const scale = Math.min(MAX_SCALE, Math.max(minimum, state.scale));
  const scaledWidth = MAP_WIDTH * scale;
  const scaledHeight = MAP_HEIGHT * scale;
  const minX = Math.min(0, width - scaledWidth);
  const minY = Math.min(0, height - scaledHeight);
  return {
    scale,
    x: scaledWidth <= width ? (width - scaledWidth) / 2 : Math.min(0, Math.max(minX, state.x)),
    y: scaledHeight <= height ? (height - scaledHeight) / 2 : Math.min(0, Math.max(minY, state.y)),
  };
}

export function resetViewport(width: number, height: number): ViewportState {
  const scale = fitScale(width, height);
  return clampViewport({ scale, x: 0, y: 0 }, width, height, scale);
}

export function zoomAt(state: ViewportState, nextScale: number, pointX: number, pointY: number, width: number, height: number) {
  const minimum = fitScale(width, height);
  const scale = Math.min(MAX_SCALE, Math.max(minimum, nextScale));
  const ratio = scale / state.scale;
  return clampViewport({ scale, x: pointX - (pointX - state.x) * ratio, y: pointY - (pointY - state.y) * ratio }, width, height, minimum);
}

export function focusRegion(state: ViewportState, region: { x: number; y: number; width: number; height: number }, width: number, height: number) {
  const scale = Math.max(state.scale, Math.min(1.35, MAX_SCALE));
  const cx = region.x + region.width / 2;
  const cy = region.y + region.height / 2;
  return clampViewport({ scale, x: width / 2 - cx * scale, y: height / 2 - cy * scale }, width, height);
}
