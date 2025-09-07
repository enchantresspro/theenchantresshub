// /api/session.js  (CommonJS)
const Stripe = require('stripe');

module.exports = async (req, res) => {
  // sanity: make sure the secret is present
  const secret = (process.env.STRIPE_SECRET_KEY || '').trim();
  if (!secret || !secret.startsWith('sk_')) {
    return res.status(500).json({ error: 'Missing STRIPE_SECRET_KEY on server' });
  }
  const stripe = new Stripe(secret);

  // build absolute base URL for the URL() parser
  const proto = req.headers['x-forwarded-proto'] || 'https';
  const host  = req.headers.host;
  const url   = new URL(req.url, `${proto}://${host}`);

  // read ?id or ?session_id
  const id = url.searchParams.get('id') || url.searchParams.get('session_id');
  if (!id) return res.status(400).json({ error: 'Missing id' });

  try {
    const session = await stripe.checkout.sessions.retrieve(id, {
      expand: ['line_items.data.price.product'],
    });
    return res.status(200).json(session);
  } catch (err) {
    return res.status(err.statusCode || 500).json({ error: err.message });
  }
};
