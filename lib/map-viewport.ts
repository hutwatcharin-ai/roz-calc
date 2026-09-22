export const MAP_WIDTH = 1280;
export const MAP_HEIGHT = 1024;
export const MAX_SCALE = 2.4;

export interface ViewportState { scale: number; x: number; y: number }

/**
 * Size of what is being panned. The atlas picture is 1280x1024; the map-grid
 * view (22 Sep 2026) is as big as its grid, so every function takes the
 * content size, defaulting to the atlas.
 */
export interface ContentSize { w: number; h: number }
const ATLAS: ContentSize = { w: MAP_WIDTH, h: MAP_HEIGHT };

export function fitScale(width: number, height: number, content: ContentSize = ATLAS) {
  return Math.min(1, width / content.w, height / content.h);
}

export function clampViewport(state: ViewportState, width: number, height: number, minimum?: number, content: ContentSize = ATLAS): ViewportState {
  const floor = minimum ?? fitScale(width, height, content);
  const scale = Math.min(MAX_SCALE, Math.max(floor, state.scale));
  const scaledWidth = content.w * scale;
  const scaledHeight = content.h * scale;
  const minX = Math.min(0, width - scaledWidth);
  const minY = Math.min(0, height - scaledHeight);
  return {
    scale,
    x: scaledWidth <= width ? (width - scaledWidth) / 2 : Math.min(0, Math.max(minX, state.x)),
    y: scaledHeight <= height ? (height - scaledHeight) / 2 : Math.min(0, Math.max(minY, state.y)),
  };
}

export function resetViewport(width: number, height: number, content: ContentSize = ATLAS): ViewportState {
  const scale = fitScale(width, height, content);
  return clampViewport({ scale, x: 0, y: 0 }, width, height, scale, content);
}

export function zoomAt(state: ViewportState, nextScale: number, pointX: number, pointY: number, width: number, height: number, content: ContentSize = ATLAS) {
  const minimum = fitScale(width, height, content);
  const scale = Math.min(MAX_SCALE, Math.max(minimum, nextScale));
  const ratio = scale / state.scale;
  return clampViewport({ scale, x: pointX - (pointX - state.x) * ratio, y: pointY - (pointY - state.y) * ratio }, width, height, minimum, content);
}

export function focusRegion(state: ViewportState, region: { x: number; y: number; width: number; height: number }, width: number, height: number, content: ContentSize = ATLAS) {
  const scale = Math.max(state.scale, Math.min(1.35, MAX_SCALE));
  const cx = region.x + region.width / 2;
  const cy = region.y + region.height / 2;
  return clampViewport({ scale, x: width / 2 - cx * scale, y: height / 2 - cy * scale }, width, height, undefined, content);
}
