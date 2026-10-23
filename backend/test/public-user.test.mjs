import assert from "node:assert/strict";
import test from "node:test";
import { publicLog } from "../src/controllers/cafeController.js";
import { publicUser } from "../src/lib/userPayload.js";

const account = {
  _id: "507f1f77bcf86cd799439011",
  name: "Coffee Drinker",
  username: "coffee_drinker",
  email: "private@example.com",
  password: "private-password-hash",
  verifyTokenHash: "private-verification-token",
  pendingEmail: "pending@example.com",
  role: "admin",
  favorites: ["private-favorite"],
};

test("public identities expose a strict verification boolean without private account fields", () => {
  for (const value of [true, false, undefined, "true"]) {
    const user = publicUser({ ...account, emailVerified: value });
    assert.equal(user.emailVerified, value === true);
    assert.equal(user.name, account.name);
    assert.deepEqual(Object.keys(user).sort(), [
      "avatarUrl", "bio", "createdAt", "emailVerified", "id", "name", "username",
    ]);
  }
  assert.equal(publicUser(null), null);
});

test("public reviews include verification only when their author is visible", () => {
  for (const anonymous of [false, true]) {
    const user = { ...account, emailVerified: true };
    const review = publicLog({ anonymous, user, toJSON: () => ({ anonymous, user, rating: 4 }) });
    assert.equal(review.rating, 4);
    if (anonymous) {
      assert.equal(review.user, null);
    } else {
      assert.equal(review.user.emailVerified, true);
      assert.equal(review.user.email, undefined);
      assert.equal(review.user.verifyTokenHash, undefined);
    }
  }
});
