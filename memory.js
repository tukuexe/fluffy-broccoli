// ultra-simple in-memory store (lost only if Render restarts)
const cache = {
  users: [],        // {id, username, passwordHash}
  sessions: [],     // {userId, token, expiresAt}
  messages: []      // {id, username, content, ts}
};

module.exports = cache;
