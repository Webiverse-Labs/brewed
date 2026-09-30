//mongoose plugin applied to every schema: responses use `id` instead of `_id`,
//and never include `__v` or the password hash
export function toJSONPlugin(schema) {
  schema.set("toJSON", {
    virtuals: true,
    transform(doc, ret) {
      ret.id = ret._id?.toString();
      delete ret._id;
      delete ret.__v;
      delete ret.password;
      return ret;
    },
  });
}
