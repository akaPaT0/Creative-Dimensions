import test from "node:test";
import assert from "node:assert/strict";
import { getAuthOrigin, getAuthReturnPath, PRODUCTION_AUTH_ORIGIN } from "../app/lib/auth-navigation.ts";

test("sign-in returns to internal shop pages and preserves filters", () => {
  assert.equal(getAuthReturnPath("/shop/keychains?sort=new#items"), "/shop/keychains?sort=new");
  assert.equal(getAuthReturnPath("/cart"), "/cart");
});

test("callback refuses external destinations, malformed input and auth loops", () => {
  for (const path of [null, "", "https://evil.example", "//evil.example", "/\\evil.example", "/%2fevil.example", "/%5cevil.example", "/%0aevil", "/bad%zz", "/auth/google", "/api/orders", "/shop/../auth/callback"]) {
    assert.equal(getAuthReturnPath(path), "/", String(path));
  }
});

test("production ignores untrusted origins; localhost keeps its development port", () => {
  assert.equal(getAuthOrigin("https://evil.example", "production", "production"), PRODUCTION_AUTH_ORIGIN);
  assert.equal(getAuthOrigin("http://localhost:3001", "production", "production"), PRODUCTION_AUTH_ORIGIN);
  assert.equal(getAuthOrigin("http://localhost:3001", "development"), "http://localhost:3001");
  assert.equal(getAuthOrigin("http://127.0.0.1:3000", "development"), "http://127.0.0.1:3000");
  assert.equal(getAuthOrigin("https://evil.example", "development"), PRODUCTION_AUTH_ORIGIN);
  assert.equal(getAuthOrigin("https://creative-dimensions-preview.vercel.app", "production", "preview"), "https://creative-dimensions-preview.vercel.app");
  assert.equal(getAuthOrigin("https://vercel.app.evil.example", "production", "preview"), PRODUCTION_AUTH_ORIGIN);
});
