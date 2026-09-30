const HIDDEN_FIELDS = [
  "googleId",
  "sessionsValidAfter",
  "verifyTokenHash",
  "verifyTokenExpires",
  "verifySentAt",
  "resetTokenHash",
  "resetTokenExpires",
  "resetSentAt",
];

//mongoose plugin applied to every schema: responses use `id` instead of `_id`,
//and never include `__v`, the password hash, email tokens or Google id
export function toJSONPlugin(schema) {
  schema.set("toJSON", {
    virtuals: true,
    transform(doc, ret) {
      ret.id = ret._id?.toString();
      delete ret._id;
      delete ret.__v;
      delete ret.password;
      //select: false only hides them from queries; a doc that just set one still has it in memory
      for (const key of HIDDEN_FIELDS) delete ret[key];
      return ret;
    },
  });
}
