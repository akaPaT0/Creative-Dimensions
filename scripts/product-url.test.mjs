import test from "node:test";
import assert from "node:assert/strict";
import { getProductPath } from "../app/lib/product-url.ts";

test("legacy fidget slugs resolve to the sitemap URL", () => {
  for (const slug of ["Mechanical switch fidget keychain", "Mechanical%20switch%20fidget%20keychain", "mechanical_switch_fidget_keychain"]) {
    assert.equal(getProductPath({ category: "keychains", slug }), "/shop/keychains/mechanical-switch-fidget-keychain");
  }
});

test("recommendations retain the actual product category", () => {
  assert.equal(getProductPath({ category: "accessories", slug: "ghost-style-bic-lighter-covers" }), "/shop/accessories/ghost-style-bic-lighter-covers");
  assert.equal(getProductPath({ category: "desk-add-ons", slug: "business-card-holders" }), "/shop/desk-add-ons/business-card-holders");
});

test("URL segments are encoded without breaking fallback navigation", () => {
  assert.equal(getProductPath({ category: "keychains", slug: "Badge / 100%" }), "/shop/keychains/badge-%2F-100%25");
  assert.equal(getProductPath({ category: "keychains" }), "/shop/keychains");
  assert.equal(getProductPath({}), "/shop");
});
