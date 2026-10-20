import assert from "node:assert/strict";
import { test } from "node:test";
import { parseCafeLocation } from "../src/lib/cafeLocation.js";
import Cafe from "../src/models/Cafe.js";

test("coordinates accept multipart numbers, zero, and bounds", () => {
  assert.deepEqual(parseCafeLocation({ latitude: " 14.75 ", longitude: "121.02" }), { lat: 14.75, lng: 121.02 });
  assert.deepEqual(parseCafeLocation({ latitude: 0, longitude: 0 }), { lat: 0, lng: 0 });
  assert.deepEqual(parseCafeLocation({ latitude: -90, longitude: 180 }), { lat: -90, lng: 180 });
});

test("omitted coordinates preserve pins; both blank explicitly clear them", () => {
  assert.equal(parseCafeLocation({}), undefined);
  assert.equal(parseCafeLocation({ latitude: " ", longitude: "" }), null);
  assert.equal(parseCafeLocation({ latitude: null, longitude: null }), null);
});

test("partial, malformed, and out-of-range coordinates are rejected", () => {
  for (const body of [
    { latitude: 14 }, { longitude: 121 }, { latitude: "", longitude: 121 },
    { latitude: 91, longitude: 121 }, { latitude: 14, longitude: -181 },
    { latitude: NaN, longitude: 121 }, { latitude: Infinity, longitude: 121 },
    { latitude: true, longitude: 121 }, { latitude: [], longitude: 121 },
    { latitude: {}, longitude: 121 }, { latitude: "north", longitude: 121 },
  ]) assert.throws(() => parseCafeLocation(body), (error) => error.status === 400 || error.statusCode === 400);
});

test("the model also validates pairs and ranges; old café records remain valid", async () => {
  const fields = { name: "Test café", address: "Test address" };
  await new Cafe(fields).validate();
  await new Cafe({ ...fields, location: { lat: 14.75, lng: 121.02 } }).validate();
  for (const location of [{ lat: 14.75 }, { lat: 91, lng: 121 }, { lat: 14, lng: -181 }]) {
    await assert.rejects(new Cafe({ ...fields, location }).validate());
  }
});
