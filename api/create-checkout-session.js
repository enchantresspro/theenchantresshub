// /api/create-checkout-session.js
const Stripe = require('stripe');

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const stripe = Stripe(process.env.STRIPE_SECRET_KEY); 

    // Build absolute origin from the request (fixes “explicit scheme” errors on some hosts)
    const proto = req.headers['x-forwarded-proto'] || 'https';
    const host  = req.headers.host;
    const base  = `${proto}://${host}`;

    const { items = [] } = req.body || {};
    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'No items in request' });
    }

    // REQUIRED: attach active shipping rates
    const shippingOptions = [];
    if (process.env.STANDARD_SHIPPING_ID) {
      shippingOptions.push({ shipping_rate: process.env.STANDARD_SHIPPING_ID });
    }
    if (process.env.EXPRESS_SHIPPING_ID) {
      shippingOptions.push({ shipping_rate: process.env.EXPRESS_SHIPPING_ID });
    }

    if (shippingOptions.length === 0) {
      return res.status(400).json({
        error: 'No shipping options configured',
        detail: 'Set STANDARD_SHIPPING_ID and/or EXPRESS_SHIPPING_ID env vars to Stripe shipping rate IDs.'
      });
    }

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      line_items: items.map(i => ({ price: i.priceId, quantity: i.qty })),
      allow_promotion_codes: true,
      automatic_tax: { enabled: true },

      // must be present or Stripe hides shipping UI
      shipping_address_collection: {
        allowed_countries: (process.env.ALLOWED_COUNTRIES || 'US')
          .split(',').map(s => s.trim())
      },

      // <-- THIS makes “Standard / Express” appear
      shipping_options: shippingOptions,

      // optional: collect phone for carriers
      // phone_number_collection: { enabled: true },

      success_url: `${base}/thanks.html?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url:  `${base}/cart.html`,
    });

    res.status(200).json({ url: session.url });
  } catch (err) {
    console.error('Stripe error:', err);
    res.status(500).json({ error: 'Stripe error', detail: err.message });
  }
};
