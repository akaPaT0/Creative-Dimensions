import test from "node:test";
import assert from "node:assert/strict";
import { liveHomeEvents } from "../app/lib/home-event.ts";

const keys = (iso) => liveHomeEvents(new Date(iso)).map((e) => e.key);

test("Berbara and Christmas both show before Saint Barbara night", () => {
  assert.deepEqual(keys("2026-11-14T12:00:00+02:00"), ["berbara", "christmas"]);
  assert.deepEqual(keys("2026-12-04T23:59:00+02:00"), ["berbara", "christmas"]);
});

test("only Christmas shows from December 5, Lebanon time", () => {
  assert.deepEqual(keys("2026-12-05T00:00:00+02:00"), ["christmas"]);
  assert.deepEqual(keys("2026-12-20T09:00:00+02:00"), ["christmas"]);
});
