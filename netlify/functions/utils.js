const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Allow-Methods': 'GET,POST,OPTIONS'
};

function ok(body, status=200){
  return { statusCode: status, headers: cors, body: JSON.stringify(body) };
}
function err(message, status=400){
  return { statusCode: status, headers: cors, body: JSON.stringify({ error: message }) };
}

module.exports = { fetch, ok, err, cors };
