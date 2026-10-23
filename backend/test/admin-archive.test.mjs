import assert from "node:assert/strict";
import test from "node:test";
import Cafe from "../src/models/Cafe.js";
import Log from "../src/models/Log.js";
import Suggestion from "../src/models/Suggestion.js";
import User from "../src/models/User.js";
import { listAllCafes, listSuggestions, listUsers } from "../src/controllers/adminController.js";

function queryResult(rows = []) {
  return {
    sort() { return this; },
    limit() { return this; },
    populate() { return this; },
    then(resolve, reject) { return Promise.resolve(rows).then(resolve, reject); },
  };
}

test("suggestions default to pending and archive filters are applied before limiting results", async (t) => {
  const filters = [];
  t.mock.method(Suggestion, "find", (filter) => { filters.push(filter); return queryResult(); });
  for (const status of [undefined, "pending", "approved", "rejected"]) {
    await listSuggestions({ query: status ? { status, q: "Elm (Oak)" } : {} }, { json: (data) => assert.deepEqual(data, { suggestions: [] }) });
    assert.equal(filters.at(-1).status, status ?? "pending");
    if (status) {
      assert.equal(filters.at(-1).$or[0].name.test("Elm (Oak)"), true);
      assert.equal(filters.at(-1).$or[0].name.test("Elm Oak"), false);
    }
  }
  await assert.rejects(listSuggestions({ query: { status: "all" } }, {}), { status: 400 });
  assert.equal(filters.length, 4);
});

test("archive account filters retain the user role and exclude active accounts", async (t) => {
  let filter;
  t.mock.method(User, "find", (value) => { filter = value; return queryResult(); });
  t.mock.method(Log, "aggregate", async () => []);
  await listUsers({ query: { status: "suspended", q: "test" } }, { json: (data) => assert.deepEqual(data, { users: [] }) });
  assert.equal(filter.role, "user");
  assert.equal(filter.status, "suspended");
  assert.ok(filter.$or.some((condition) => condition.email?.test("test@example.com")));
  await listUsers({ query: { status: "active" } }, { json() {} });
  assert.deepEqual(filter, { role: "user", status: "active" });
  await assert.rejects(listUsers({ query: { status: "admin" } }, {}), { status: 400 });
});

test("café filters keep active management listings separate from disabled archive records", async (t) => {
  let filter;
  t.mock.method(Cafe, "find", (value) => { filter = value; return queryResult(); });
  await listAllCafes({ query: { active: "false", q: "Elm" } }, { json() {} });
  assert.equal(filter.active, false);
  assert.equal(filter.$or[0].name.test("Elm Café"), true);
  await listAllCafes({ query: { active: "true" } }, { json() {} });
  assert.deepEqual(filter, { active: true });
  await listAllCafes({ query: {} }, { json() {} });
  assert.deepEqual(filter, {});
  await assert.rejects(listAllCafes({ query: { active: "invalid" } }, {}), { status: 400 });
});
