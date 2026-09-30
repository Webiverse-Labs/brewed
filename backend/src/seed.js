//Loads the Figma sample data into MongoDB.
//  npm run seed            -> only runs on an empty database
//  npm run seed -- --reset -> deletes all Brewed data first (careful on a shared cluster)
//Every seeded account, including admin@brewed.app, uses SEED_PASSWORD from backend/.env.
import dotenv from "dotenv";
import mongoose from "mongoose";
import connectDB from "./config/db.js";
import Cafe from "./models/Cafe.js";
import Follow from "./models/Follow.js";
import Log from "./models/Log.js";
import Notification from "./models/Notification.js";
import Suggestion from "./models/Suggestion.js";
import Upload from "./models/Upload.js";
import User from "./models/User.js";
import { refreshCafeStats } from "./lib/cafeStats.js";

dotenv.config();

const reset = process.argv.includes("--reset");
const password = process.env.SEED_PASSWORD;

if (!password || password.length < 8) {
  console.error("Set SEED_PASSWORD (8+ characters) in backend/.env before seeding.");
  process.exit(1);
}

const DAY = 24 * 60 * 60 * 1000;
const ago = (ms) => new Date(Date.now() - ms);

const users = {
  margot: { name: "Margot Chen", username: "margotbrews", email: "margotbrews@example.com", bio: "Third-wave devotee. 200+ cafés logged." },
  james: { name: "James Okafor", username: "jamesonthecup", email: "jamesonthecup@example.com", bio: "Chasing perfect espresso across Europe." },
  sofia: { name: "Sofia Reinholt", username: "sofiacoffeediaries", email: "sofiacoffeediaries@example.com", bio: "Nordic café aesthetics & natural-process coffees." },
  tomas: { name: "Tomás Vega", username: "thetomascup", email: "thetomascup@example.com", bio: "Specialty roaster & weekend café pilgrim." },
};

const cafes = {
  roastery: {
    name: "The Roastery House",
    area: "Poblacion, Makati",
    address: "47 Matilde St, Poblacion, Makati City",
    hours: "Mon–Fri 7 am – 6 pm · Sat–Sun 8 am – 5 pm",
    description:
      "A cornerstone of Makati's coffee scene. Single-origin beans from Ethiopia, Colombia, and Guatemala, brewed with deliberate precision in a cozy heritage shophouse.",
    tags: ["Specialty", "Pour-over"],
    featured: true,
  },
  blueBottle: {
    name: "Blue Bottle Coffee",
    area: "BGC, Taguig",
    address: "Lane P, Bonifacio High Street, BGC, Taguig",
    hours: "Daily 7 am – 9 pm",
    description: "Minimalist bar known for precise pour-overs and New Orleans-style iced coffee.",
    tags: ["Specialty"],
    featured: true,
  },
  onyx: {
    name: "Onyx Coffee Lab",
    area: "Katipunan, Quezon City",
    address: "310 Katipunan Ave, Loyola Heights, Quezon City",
    hours: "Mon–Sat 8 am – 8 pm",
    description: "Competition-grade roasts and a tasting-flight menu.",
    tags: ["Micro-roastery"],
  },
  intelligentsia: {
    name: "Intelligentsia Coffee",
    area: "Intramuros, Manila",
    address: "Calle Real del Palacio, Intramuros, Manila",
    hours: "Daily 8 am – 6 pm",
    description: "Direct-trade coffees inside a restored colonial building.",
    tags: ["Specialty", "Heritage"],
    featured: true,
  },
  laColombe: {
    name: "La Colombe Torrefaction",
    area: "Ortigas, Pasig",
    address: "1335 ADB Ave, Ortigas Center, Pasig City",
    hours: "Mon–Fri 7 am – 7 pm",
    description: "Home of the draft latte, poured from the tap.",
    tags: ["Espresso"],
  },
  verve: {
    name: "Verve Coffee Roasters",
    area: "San Juan",
    address: "88 Wilson St, Greenhills, San Juan",
    hours: "Daily 7 am – 7 pm",
    description: "Bright, fruit-forward roasts in a sunny corner space.",
    tags: ["Specialty"],
    featured: true,
  },
  stumptown: {
    name: "Stumptown Coffee",
    area: "Mandaluyong",
    address: "Shaw Blvd, Mandaluyong City",
    hours: "Daily 7 am – 8 pm",
    description: "Hair Bender espresso and cold brew on tap.",
    tags: ["Espresso", "Cold brew"],
  },
  ritual: {
    name: "Ritual Coffee Roasters",
    area: "Marikina",
    address: "Gil Fernando Ave, Marikina City",
    hours: "Tue–Sun 8 am – 6 pm",
    description: "Neighbourhood roaster with a rotating single-origin menu.",
    tags: ["Micro-roastery"],
  },
};

//[user, café, type, days ago, rating, text, items, anonymous]
const logs = [
  ["margot", "roastery", "review", 30, 5, "Exceptional Ethiopian single-origin on the pour-over bar today. Bright florals with a long bergamot finish.", [["Ethiopian Yirgacheffe Pourover", "Coffee", 5], ["Cardamom Kouign-Amann", "Pastry", 4]]],
  ["james", "roastery", "review", 39, 4, "Reliable as always. The flat white is balanced and the pastry case never disappoints.", [["Flat White", "Coffee", 4]]],
  ["sofia", "roastery", "review", 51, 5, "Cold brew is genuinely brilliant. Smooth, chocolatey, and dangerously easy to drink.", [["Cold Brew", "Coffee", 5]], true],
  ["margot", "blueBottle", "review", 39, 4, "Reliable as always. The New Orleans iced coffee is still the best in the city.", [["New Orleans Iced Coffee", "Coffee", 5], ["Almond Croissant", "Pastry", 4]]],
  ["tomas", "blueBottle", "review", 12, 5, "Their Gibraltar is textbook. Worth the queue on a weekend morning.", [["Gibraltar", "Coffee", 5]]],
  ["margot", "laColombe", "diary", 51, 5, "Draft latte is genuinely brilliant. Frothy, creamy, and dangerously easy to drink.", [["Draft Latte", "Coffee", 5]]],
  ["sofia", "onyx", "review", 8, 5, "The tasting flight is a lesson in terroir. Loved the washed Kenya.", [["Tasting Flight", "Coffee", 5]]],
  ["james", "onyx", "review", 20, 4, "Great espresso, slightly cramped seating.", [["Espresso", "Coffee", 4]]],
  ["tomas", "intelligentsia", "review", 15, 4, "Beautiful space. The Black Cat espresso holds up well in milk.", [["Cappuccino", "Coffee", 4]]],
  ["sofia", "verve", "review", 6, 4, "Sunny spot, juicy Streetlevel blend.", [["Streetlevel Latte", "Coffee", 4]]],
  ["james", "stumptown", "review", 25, 4, "Hair Bender never misses. Cold brew on tap is a nice touch.", [["Cold Brew", "Coffee", 4]]],
  ["tomas", "ritual", "review", 3, 3, "Solid single-origin menu, but the pastries were sold out by 10.", [["Pour-over", "Coffee", 4]]],
];

const suggestions = [
  { name: "Elm & Oak Brew", by: "james", daysAgo: 29, status: "pending", address: "18 Kalayaan Ave, Diliman, Quezon City", hours: "Mon–Sat 8am–6pm", description: "A hidden gem tucked in a quiet corner of Diliman." },
  { name: "Drift Coffee Co.", by: "tomas", daysAgo: 32, status: "pending", address: "22 Esteban St, Legaspi Village, Makati", hours: "Daily 7am–5pm", description: "Surf-shack espresso bar with a small-batch roaster out back." },
  { name: "Fold Café", by: "sofia", daysAgo: 34, status: "approved", address: "5 Maginhawa St, Teachers Village, Quezon City", hours: "Tue–Sun 9am–7pm", description: "Scandi-style café with a strong filter program." },
  { name: "Common Ground", by: "margot", daysAgo: 36, status: "rejected", address: "BGC, Taguig", hours: "", description: "Co-working café. Duplicate of an existing listing." },
];

async function seed() {
  await connectDB();

  const existing = await User.estimatedDocumentCount();
  if (existing > 0 && !reset) {
    console.error(`Database already has ${existing} user(s). Run \`npm run seed -- --reset\` to wipe Brewed's data and reseed.`);
    process.exit(1);
  }
  if (reset) {
    //uploaded images belonged to the deleted records, so they go too
    await Promise.all([User, Cafe, Log, Follow, Suggestion, Notification, Upload].map((Model) => Model.deleteMany({})));
    console.log("Cleared existing Brewed data and uploads.");
  }

  //users one by one so the pre-save hook hashes each password
  const u = {};
  for (const [key, data] of Object.entries(users)) u[key] = await User.create({ ...data, password });
  await User.create({ name: "Administrator", username: "admin", email: "admin@brewed.app", password, role: "admin" });

  const c = {};
  for (const [key, data] of Object.entries(cafes)) c[key] = await Cafe.create(data);

  await Log.insertMany(
    logs.map(([user, cafe, type, daysAgo, rating, text, items, anonymous = false]) => ({
      user: u[user]._id,
      cafe: c[cafe]._id,
      type,
      visitedAt: ago(daysAgo * DAY),
      createdAt: ago(daysAgo * DAY),
      rating,
      text,
      items: items.map(([name, category, itemRating]) => ({ name, category, rating: itemRating })),
      anonymous,
    })),
  );
  await Promise.all(Object.values(c).map((cafe) => refreshCafeStats(cafe._id)));

  u.margot.favorites = [c.blueBottle._id, c.laColombe._id];
  await u.margot.save();

  await Follow.insertMany([
    { follower: u.margot._id, following: u.james._id },
    { follower: u.james._id, following: u.margot._id },
    { follower: u.sofia._id, following: u.margot._id },
  ]);

  await Suggestion.insertMany(
    suggestions.map(({ by, daysAgo, ...s }) => ({
      ...s,
      submittedBy: u[by]._id,
      createdAt: ago(daysAgo * DAY),
      reviewedAt: s.status === "pending" ? undefined : ago((daysAgo - 1) * DAY),
    })),
  );

  //Margot's inbox, matching the Notifications screen
  await Notification.insertMany([
    { user: u.margot._id, type: "follow", actor: u.sofia._id, message: "Sofia Reinholt started following you.", createdAt: ago(2 * 60 * 1000) },
    { user: u.margot._id, type: "cafe_update", cafe: c.onyx._id, message: "Onyx Coffee Lab updated their opening hours.", createdAt: ago(60 * 60 * 1000) },
    { user: u.margot._id, type: "system", message: "Your café suggestion Common Ground wasn't approved this time.", read: true, createdAt: ago(3 * 60 * 60 * 1000) },
    { user: u.margot._id, type: "follow", actor: u.james._id, message: "James Okafor followed you back.", read: true, createdAt: ago(DAY) },
    { user: u.margot._id, type: "system", message: "New cafés near Manila have been added to Brewed.", read: true, createdAt: ago(2 * DAY) },
  ]);

  console.log(
    `Seeded ${Object.keys(users).length} users + admin@brewed.app, ${Object.keys(cafes).length} cafés, ${logs.length} logs, ` +
      `${suggestions.length} suggestions. All accounts use SEED_PASSWORD.`,
  );
}

seed()
  .catch((err) => {
    console.error("Seeding failed:", err);
    process.exitCode = 1;
  })
  .finally(() => mongoose.disconnect());
