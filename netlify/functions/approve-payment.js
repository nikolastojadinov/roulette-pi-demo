const { fetch, ok, err, cors } = require('./utils');

const API = 'https://api.minepi.com/v2';
const KEY = process.env.PI_API_KEY;

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return { statusCode: 204, headers: cors, body: '' };
  if (event.httpMethod !== 'POST') return err('Method not allowed', 405);

  try {
    const { paymentId } = JSON.parse(event.body || '{}');
    if (!paymentId) return err('paymentId required');
    if (!KEY) return err('Missing PI_API_KEY on server', 500);

    // Server-side approve
    const r = await fetch(`${API}/payments/${paymentId}/approve`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Key ${KEY}` },
      body: JSON.stringify({})
    });
    const data = await r.json();
    if (!r.ok) {
      console.error('approve error:', data);
      return err('approve failed', r.status);
    }
    return ok({ ok: true });
  } catch (e) {
    console.error(e);
    return err('approve-payment error');
  }
};
