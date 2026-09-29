import Notification from "../models/Notification.js";

//notify(userId, { type, message, actor?, cafe? })
export function notify(user, { type, message, actor, cafe }) {
  return Notification.create({ user, type, message, actor, cafe });
}

//same notification to many recipients in one write
export function notifyMany(users, { type, message, actor, cafe }) {
  if (users.length === 0) return Promise.resolve([]);
  return Notification.insertMany(users.map((user) => ({ user, type, message, actor, cafe })));
}
