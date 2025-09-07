// netlify/functions/mc-subscribe.js
export async function handler(event) {
  // CORS (allow from your site)
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 204,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type'
      }
    };
  }

  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  try {
    const { email, fname, lname } = JSON.parse(event.body || '{}');
    if (!email) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Email required' })
      };
    }

    const API_KEY = process.env.MAILCHIMP_API_KEY;            // e.g. abcdef-us21
    const DC      = process.env.MAILCHIMP_SERVER_PREFIX;      // e.g. us21
    const LIST_ID = process.env.MAILCHIMP_LIST_ID;            // your Audience ID

    const url = `https://${DC}.api.mailchimp.com/3.0/lists/${LIST_ID}/members`;
    // Choose 'pending' for double opt-in, 'subscribed' for instant subscribe:
    const payload = {
      email_address: email,
      status: 'pending',
      merge_fields: {
        FNAME: fname || '',
        LNAME: lname || ''
      }
    };

    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `apikey ${API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    const data = await res.json();

    // Pass Mailchimp error details through (e.g., Member Exists)
    if (!res.ok) {
      return {
        statusCode: res.status,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify(data)
      };
    }

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ ok: true })
    };
  } catch (err) {
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ error: 'Server error' })
    };
  }
}
