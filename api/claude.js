// Vercel serverless function: /api/claude
//
// Proxies chat requests from the frontend to the Anthropic API, keeping the
// API key on the server. The frontend's askClaude() posts the same body
// shape it would send directly to Anthropic: { model, max_tokens, system,
// messages }. This function forwards it and returns the response untouched.
//
// SETUP:
//   1. Get an API key from https://console.anthropic.com
//   2. In your Vercel project, add an environment variable:
//        ANTHROPIC_API_KEY = sk-ant-xxxxxxxx
//   3. Deploy. The frontend will automatically call this endpoint.
//
// If you deploy to a different platform (Netlify, Cloudflare, your own
// Node server), adapt this handler to that platform's function signature —
// the core logic (forwarding the body to api.anthropic.com with your key)
// stays the same.

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    res.status(500).json({
      error: "Server is missing ANTHROPIC_API_KEY. Add it in your hosting provider's environment variables.",
    });
    return;
  }

  try {
    const body = req.body || {};

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: body.model || "claude-sonnet-4-6",
        max_tokens: body.max_tokens || 1000,
        system: body.system,
        messages: body.messages,
      }),
    });

    const data = await response.json();
    res.status(response.status).json(data);
  } catch (err) {
    res.status(500).json({ error: "Failed to reach Anthropic API", details: String(err) });
  }
}
