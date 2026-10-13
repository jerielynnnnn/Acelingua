export type MapViewport = { zoom: number; x: number; y: number };
export const initialMapViewport: MapViewport = { zoom: 1, x: 0, y: 0 };
export function constrainMapViewport(view: MapViewport): MapViewport {
  const zoom = Math.max(1, Math.min(4, view.zoom));
  if (zoom === 1) return { zoom: 1, x: 0, y: 0 };
  const limit = (zoom - 1) * 50;
  return { zoom, x: Math.max(-limit, Math.min(limit, view.x)), y: Math.max(-limit, Math.min(limit, view.y)) };
}
export function focusMapPosition(x: number, y: number, zoom = 2.2) {
  return constrainMapViewport({ zoom, x: (50 - x) * zoom, y: (50 - y) * zoom });
}
export function zoomMapAt(view: MapViewport, zoom: number, cursorX = 50, cursorY = 50) {
  const nextZoom = Math.max(1, Math.min(4, zoom));
  const ratio = nextZoom / view.zoom;
  return constrainMapViewport({ zoom: nextZoom,
    x: cursorX - 50 - (cursorX - 50 - view.x) * ratio,
    y: cursorY - 50 - (cursorY - 50 - view.y) * ratio,
  });
}
