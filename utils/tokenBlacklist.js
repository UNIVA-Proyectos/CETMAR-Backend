// Set en memoria para tokens revocados

const blacklist = new Set();
async function add(token, ttlMs) {
  blacklist.add(token);
  setTimeout(() => blacklist.delete(token), ttlMs);
}

async function has(token) {
  return blacklist.has(token);
}

module.exports = { add, has };
