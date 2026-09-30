import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import { toJSONPlugin } from "../lib/toJSONPlugin.js";

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: [true, "Name is required."], trim: true, maxlength: 80 },
    username: {
      type: String,
      required: [true, "Username is required."],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^[a-z0-9_.]{3,30}$/, "Username must be 3–30 characters: letters, numbers, _ or ."],
    },
    email: {
      type: String,
      required: [true, "Email is required."],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, "Enter a valid email address."],
    },
    //select: false -> never loaded unless a query asks for "+password"
    //Google-only accounts have no password (hasPassword false); setting one, via reset or settings, turns it on
    password: {
      type: String,
      required: [function () { return this.hasPassword !== false; }, "Password is required."],
      minlength: [8, "Password must be at least 8 characters."],
      select: false,
    },
    bio: { type: String, trim: true, maxlength: 200, default: "" },
    avatarUrl: { type: String, default: "" },
    role: { type: String, enum: ["user", "admin"], default: "user" },
    status: { type: String, enum: ["active", "suspended"], default: "active" },
    favorites: [{ type: mongoose.Schema.Types.ObjectId, ref: "Cafe" }],
    hasPassword: { type: Boolean, default: true },
    //Google's stable user id ("sub"); select: false like the other credentials
    googleId: { type: String, unique: true, sparse: true, select: false },
    //tokens issued before this moment are refused (see userFromCookie): how a session is cut off server-side
    sessionsValidAfter: { type: Date },
    //unverified users can browse but not post, suggest or follow (requireVerified)
    emailVerified: { type: Boolean, default: false },
    //only the SHA-256 of each emailed token is stored (see lib/emailTokens.js); *SentAt drives the resend cooldown
    verifyTokenHash: { type: String, select: false },
    verifyTokenExpires: { type: Date, select: false },
    verifySentAt: { type: Date, select: false },
    resetTokenHash: { type: String, select: false },
    resetTokenExpires: { type: Date, select: false },
    resetSentAt: { type: Date, select: false },
  },
  { timestamps: true },
);

//validation (incl. minlength) runs before this hook, so it checks the plain password; then we hash it
userSchema.pre("save", async function () {
  if (!this.isModified("password")) return;
  this.hasPassword = Boolean(this.password); //setting it to undefined removes the password
  if (this.password) this.password = await bcrypt.hash(this.password, 10);
});

//requires the document to have been loaded with .select("+password")
userSchema.methods.comparePassword = function (plain) {
  if (!this.password) return Promise.resolve(false); //Google-only account
  return bcrypt.compare(String(plain ?? ""), this.password);
};

userSchema.plugin(toJSONPlugin);

export default mongoose.model("User", userSchema);
