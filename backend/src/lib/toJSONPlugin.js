const TOKEN_FIELDS = [
  "verifyTokenHash",
  "verifyTokenExpires",
  "verifySentAt",
  "resetTokenHash",
  "resetTokenExpires",
  "resetSentAt",
];

//mongoose plugin applied to every schema: responses use `id` instead of `_id`,
//and never include `__v`, the password hash or the email-token fields
export function toJSONPlugin(schema) {
  schema.set("toJSON", {
    virtuals: true,
    transform(doc, ret) {
      ret.id = ret._id?.toString();
      delete ret._id;
      delete ret.__v;
      delete ret.password;
      //select: false only hides them from queries; a doc that just set a token still has them in memory
      for (const key of TOKEN_FIELDS) delete ret[key];
      return ret;
    },
  });
}
