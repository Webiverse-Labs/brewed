// Home page café rows that have a "See all" page at /browse/:slug.
// `query` is the /cafes filter shared by the home row (limited) and the full section page.
export const cafeSections = {
  featured: {
    title: "Featured Cafés",
    description: "Hand-picked spots worth the trip.",
    query: "featured=true",
  },
  "top-rated": {
    title: "Top Rated",
    description: "The cafés our community rates the highest.",
    query: "sort=rating",
  },
  recent: {
    title: "Recently Added",
    description: "The newest cafés on Brewed.",
    query: "sort=new",
  },
};

export const sectionPath = (slug) => `/browse/${slug}`;
