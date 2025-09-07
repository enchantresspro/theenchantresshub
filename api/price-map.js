const Stripe = require('stripe');
const stripe = Stripe(process.env.STRIPE_SECRET_KEY);

module.exports = async (req, res) => {
  if (req.method !== 'POST') return res.status(405).end();
  const { price_ids } = req.body || {};
  if (!Array.isArray(price_ids) || !price_ids.length) {
    return res.status(200).json({ priceMap: {} });
  }
  try {
    const ids = [...new Set(price_ids)];
    const priceMap = {};
    const prices = await Promise.all(ids.map(id => stripe.prices.retrieve(id)));
    for (const p of prices) {
      priceMap[p.id] = { unit_amount: p.unit_amount, currency: p.currency };
    }
    res.status(200).json({ priceMap });
  } catch (e) {
    console.error(e);
    res.status(200).json({ priceMap: {} });
  }
};
