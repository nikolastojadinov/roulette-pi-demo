// netlify/functions/utils.js

// CORS helper
const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Allow-Methods': 'GET,POST,OPTIONS'
};

function ok(body, status = 200) {
  return { statusCode: status, headers: cors, body: JSON.stringify(body) };
}
function err(message, status = 400) {
  return { statusCode: status, headers: cors, body: JSON.stringify({ error: message }) };
}

// Koristi natívni fetch iz Node 18+ (Netlify Functions runtime)
async function fetch_(...args) {
  return await fetch(...args);
}

module.exports = { fetch: fetch_, ok, err, cors };
