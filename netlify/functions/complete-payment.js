const { fetch, ok, err, cors } = require('./utils');

const API = 'https://api.minepi.com/v2';
const KEY = process.env.PI_API_KEY;

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return { statusCode: 204, headers: cors, body: '' };
  if (event.httpMethod !== 'POST') return err('Method not allowed', 405);

  try {
    const { paymentId, txid } = JSON.parse(event.body || '{}');
    if (!paymentId) return err('paymentId required');
    if (!KEY) return err('Missing PI_API_KEY on server', 500);

    // opciono: mogao bi prvo da validiraš blockchain txid
    // ali Pi API complete će sam obaviti validacije po svom modelu.

    const r = await fetch(`${API}/payments/${paymentId}/complete`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Key ${KEY}` },
      body: JSON.stringify({ txid: txid || null })
    });
    const data = await r.json();
    if (!r.ok) {
      console.error('complete error:', data);
      return err('complete failed', r.status);
    }
    // ovde bi u realnoj app dodelio kupljene kredite u bazi korisnika
    return ok({ ok: true });
  } catch (e) {
    console.error(e);
    return err('complete-payment error');
  }
};
