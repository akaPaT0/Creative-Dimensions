import test from "node:test";
import assert from "node:assert/strict";
import {
  cartLineKey,
  describeCustomization,
  parseStoredCart,
} from "../app/lib/cart-items.ts";
import {
  normalizePriceOptions,
  pricePrefix,
  unitPriceFor,
} from "../app/lib/product-options.ts";

const snowman = {
  priceUSD: 4,
  priceOptions: [
    { label: "1 snowman", priceUSD: 4 },
    { label: "Full set of 5", priceUSD: 18 },
  ],
};

test("cart lines keep a typed name and a chosen option through a reload", () => {
  const stored = [
    {
      productId: "CH004",
      quantity: 2,
      customization: { summary: "", slots: [], personalization: { label: "Name", text: "  Emma  " } },
    },
    {
      productId: "CH010",
      quantity: 1,
      customization: { summary: "", slots: [], option: { label: "Full set of 5" } },
    },
  ];
  const [named, set] = parseStoredCart(JSON.parse(JSON.stringify(stored)));
  assert.deepEqual(named.customization.personalization, { label: "Name", text: "Emma" });
  assert.equal(named.quantity, 2);
  assert.equal(set.customization.option.label, "Full set of 5");
});

test("different names stay separate cart lines; the same name merges", () => {
  const emma = { productId: "CH004", customization: { summary: "", slots: [], personalization: { label: "Name", text: "Emma" } } };
  const lucas = { productId: "CH004", customization: { summary: "", slots: [], personalization: { label: "Name", text: "Lucas" } } };
  assert.notEqual(cartLineKey(emma), cartLineKey(lucas));
  assert.equal(cartLineKey(emma), cartLineKey(structuredClone(emma)));
});

test("older carts with colour-only lines still parse unchanged", () => {
  const [line] = parseStoredCart([
    {
      productId: "HA008",
      quantity: 1,
      previewImageUrl: "/a.webp",
      customization: {
        summary: "Colour: Green Bats",
        slots: [{ slot: "colour", label: "Colour", filamentId: "variant:green bats", filamentLabel: "Green Bats", colorValue: "#2e9e55" }],
      },
    },
  ]);
  assert.equal(line.previewImageUrl, "/a.webp");
  assert.equal(line.customization.slots.length, 1);
  assert.equal(line.customization.personalization, undefined);
});

test("the order line describes option, colour and name together", () => {
  assert.equal(
    describeCustomization({
      summary: "Colour: Red",
      slots: [],
      option: { label: "Full set of 5" },
      personalization: { label: "Name", text: "Emma" },
    }),
    "Full set of 5 · Colour: Red · Name: Emma"
  );
});

test("price comes from the product's option, never from the cart", () => {
  assert.equal(unitPriceFor(snowman, { option: { label: "full set of 5" } }), 18);
  assert.equal(unitPriceFor(snowman, { option: { label: "Free snowman" } }), 4);
  assert.equal(unitPriceFor(snowman, undefined), 4);
  assert.equal(unitPriceFor({ priceUSD: 3 }, { option: { label: "Full set of 5" } }), 3);
});

test("stored options drop invalid and duplicate entries", () => {
  const options = normalizePriceOptions(
    JSON.stringify([
      { label: "1 snowman", priceUSD: 4 },
      { label: "1 SNOWMAN", priceUSD: 2 },
      { label: "", priceUSD: 9 },
      { label: "Broken", priceUSD: "abc" },
      { label: "Negative", priceUSD: -1 },
      { label: "Set", priceUSD: "18" },
    ])
  );
  assert.deepEqual(options, [
    { label: "1 snowman", priceUSD: 4 },
    { label: "Set", priceUSD: 18 },
  ]);
});

test("listings say From only when option prices differ", () => {
  assert.equal(pricePrefix(snowman), "From ");
  assert.equal(pricePrefix({ priceOptions: [{ priceUSD: 5 }, { priceUSD: 5 }] }), "");
  assert.equal(pricePrefix({}), "");
});
