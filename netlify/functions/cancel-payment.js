const { ok, err, cors } = require('./utils');

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return { statusCode: 204, headers: cors, body: '' };
  if (event.httpMethod !== 'POST') return err('Method not allowed', 405);
  try {
    const { paymentId } = JSON.parse(event.body || '{}');
    console.log('Payment canceled:', paymentId);
    return ok({ ok: true });
  } catch (e) {
    console.error(e);
    return err('cancel-payment error');
  }
};
