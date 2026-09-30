// Sample objects shaped like API responses, used only by the dev /dev/ui page.
// (The app itself loads real data; `npm run seed` in backend/ fills the database.)

export const cafes = [
  {
    id: "fixture-roastery",
    name: "The Roastery House",
    area: "Poblacion, Makati",
    address: "47 Matilde St, Poblacion, Makati City",
    rating: 4.7,
    visits: 3,
    photo: null,
  },
  { id: "fixture-blue", name: "Blue Bottle Coffee", area: "BGC, Taguig", address: "Lane P, Bonifacio High Street, BGC, Taguig", rating: 4.5, visits: 2, photo: null },
  { id: "fixture-onyx", name: "Onyx Coffee Lab", area: "Katipunan, Quezon City", address: "310 Katipunan Ave, Loyola Heights, Quezon City", rating: 4.5, visits: 2, photo: null },
];

const margot = { id: "fixture-margot", name: "Margot Chen", username: "margotbrews", avatarUrl: "" };

export const logs = [
  {
    id: "fixture-log-1",
    user: margot,
    cafe: cafes[0],
    type: "review",
    visitedAt: "2026-08-31T09:00:00.000Z",
    rating: 5,
    text: "Exceptional Ethiopian single-origin on the pour-over bar today. Bright florals with a long bergamot finish.",
    items: [
      { name: "Ethiopian Yirgacheffe Pourover", category: "Coffee", rating: 5 },
      { name: "Cardamom Kouign-Amann", category: "Pastry", rating: 4 },
    ],
    photos: [],
  },
  {
    id: "fixture-log-2",
    user: null, //anonymous review
    cafe: cafes[0],
    type: "review",
    visitedAt: "2026-08-10T09:00:00.000Z",
    rating: 5,
    text: "Cold brew is genuinely brilliant. Smooth, chocolatey, and dangerously easy to drink.",
    items: [{ name: "Cold Brew", category: "Coffee", rating: 5 }],
    photos: [],
  },
];

export const stats = [
  { label: "Total Cafés", value: "8", delta: "+1 this week" },
  { label: "Registered Users", value: "4", delta: "+4 this week" },
  { label: "Pending Suggestions", value: "2", delta: "Needs review", highlight: true },
];
