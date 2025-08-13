const { fetch, ok, err, cors } = require('./utils');

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return { statusCode: 204, headers: cors, body: '' };
  if (event.httpMethod !== 'POST') return err('Method not allowed', 405);

  try {
    const { amount, memo, metadata } = JSON.parse(event.body || '{}');
    const bearer = event.headers.authorization || event.headers.Authorization;
    if (!bearer?.startsWith('Bearer ')) return err('Missing bearer token', 401);
    const accessToken = bearer.replace('Bearer ', '');

    // 1) verifikuj korisnika na Pi API (sa access tokenom klijenta)
    const meRes = await fetch('https://api.minepi.com/v2/me', {
      headers: { Authorization: `Bearer ${accessToken}` }
    });
    if (!meRes.ok) return err('Invalid Pi access token', 401);
    const me = await meRes.json(); // { username, uid, ... }

    // 2) pripremi payment data za Pi.createPayment
    if (!amount || amount <= 0) return err('Invalid amount');
    const paymentData = {
      amount,
      memo: memo || 'Top-up',
      metadata: metadata || {},
      uid: me.uid,                  // obavezno
      username: me.username        // korisno za tvoj zapis
    };

    return ok(paymentData);
  } catch (e) {
    console.error(e);
    return err('create-payment error');
  }
};
