// Case-insensitive "any field contains the query" — client-side filtering for the UI-only phase.
export const matches = (query, ...fields) => {
  const q = query.trim().toLowerCase();
  return fields.some((field) => field.toLowerCase().includes(q));
};
