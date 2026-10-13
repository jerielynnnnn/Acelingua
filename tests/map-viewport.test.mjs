import assert from "node:assert/strict";
import { test } from "node:test";
import { constrainMapViewport, focusMapPosition, initialMapViewport, zoomMapAt } from "../lib/world/mapViewport.ts";

test("zoom remains within safe limits and reset shows the whole map", () => {
  assert.deepEqual(constrainMapViewport({ zoom: .1, x: 90, y: -90 }), initialMapViewport);
  assert.equal(constrainMapViewport({ zoom: 12, x: 0, y: 0 }).zoom, 4);
});
test("pan bounds keep the map inside the viewport at every zoom level", () => {
  for (const zoom of [1, 1.5, 2, 3, 4]) {
    const limit = (zoom - 1) * 50;
    const bounded = constrainMapViewport({ zoom, x: 1000, y: -1000 });
    assert.equal(bounded.x, limit); assert.equal(bounded.y, limit === 0 ? 0 : -limit);
  }
});
test("find destination puts configured points inside the visible viewport", () => {
  for (const [x, y] of [[49, 25], [88, 30], [75, 42]]) {
    const view = focusMapPosition(x, y);
    const screenX = 50 + (x - 50) * view.zoom + view.x;
    const screenY = 50 + (y - 50) * view.zoom + view.y;
    assert.ok(screenX >= 0 && screenX <= 100);
    assert.ok(screenY >= 0 && screenY <= 100);
  }
});
test("cursor zoom preserves the world point under the mouse within pan bounds", () => {
  const original = { zoom: 2, x: 0, y: 0 };
  const zoomed = zoomMapAt(original, 3, 60, 45);
  assert.equal((60 - 50 - original.x) / original.zoom, (60 - 50 - zoomed.x) / zoomed.zoom);
  assert.equal((45 - 50 - original.y) / original.zoom, (45 - 50 - zoomed.y) / zoomed.zoom);
  assert.deepEqual(zoomMapAt(zoomed, 1, 60, 45), initialMapViewport);
});
