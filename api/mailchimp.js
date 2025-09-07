// api/subscribe.js (ESM)
import mailchimp from "@mailchimp/mailchimp_marketing";

export default async function handler(req, res) {
  try {
    if (req.method !== "POST") {
      return res.status(405).end("Method Not Allowed");
    }

    // Safely parse JSON (string or object)
    let body = {};
    if (typeof req.body === "string") {
      try { body = JSON.parse(req.body || "{}"); }
      catch { return res.status(400).end("Invalid JSON"); }
    } else {
      body = req.body || {};
    }

    const email = (body.email || "").trim();
    if (!email) return res.status(400).end("Missing email address");

    const { MAILCHIMP_API_KEY, MAILCHIMP_LIST_ID } = process.env;
    if (!MAILCHIMP_API_KEY || !MAILCHIMP_LIST_ID) {
      console.error("Missing env vars", { hasKey: !!MAILCHIMP_API_KEY, hasList: !!MAILCHIMP_LIST_ID });
      return res.status(500).json({ error: "Server not configured" });
    }

    mailchimp.setConfig({
      apiKey: MAILCHIMP_API_KEY,
      server: MAILCHIMP_API_KEY.split("-").pop(), // e.g. "us6"
    });

    try {
      const result = await mailchimp.lists.addListMember(MAILCHIMP_LIST_ID, {
        email_address: email,
        status: "subscribed",
      });
      return res.status(200).json({ message: "Subscribed!", id: result.id });
    } catch (mcErr) {
      // Try to surface Mailchimp's detail if present
      let msg = mcErr.message;
      if (mcErr.response && mcErr.response.body) {
        try { msg = JSON.parse(mcErr.response.body).detail || msg; } catch {}
      }
      return res.status(mcErr.status || 500).json({ error: msg });
    }
  } catch (err) {
    console.error("Subscribe error (top-level):", err);
    return res.status(500).json({ error: "Server error" });
  }
}
