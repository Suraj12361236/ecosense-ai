// Vercel serverless function: /api/claude
//
// Proxies AI requests from the frontend (AI Climate Coach + Bill Scanner) to
// Google's Gemini API, keeping the API key on the server.
//
// The frontend still sends the same body shape it always has:
//   { model, max_tokens, system, messages }
// where `messages` is an array of { role: "user" | "assistant", content }
// and `content` is either a plain string or an array of content blocks
// (text / image / document) — the same shapes used by the Anthropic API.
//
// This function converts that into Gemini's request format, calls Gemini,
// and converts the response back into the shape the frontend expects:
//   { content: [ { type: "text", text: "..." } ] }
// so nothing in src/App.jsx needs to change.
//
// SETUP:
//   1. Get a free API key at https://aistudio.google.com/app/apikey
//   2. In your Vercel project, add an environment variable:
//        GEMINI_API_KEY = your-key-here
//   3. (Optional) Override the model with GEMINI_MODEL, e.g. "gemini-2.0-flash"
//   4. Deploy. The frontend will automatically call this endpoint.

const GEMINI_MODEL_DEFAULT = "gemini-2.0-flash";

// Convert an Anthropic-style content block into a Gemini "part".
function blockToPart(block) {
  if (typeof block === "string") {
    return { text: block };
  }
  if (block.type === "text") {
    return { text: block.text };
  }
  if (block.type === "image" || block.type === "document") {
    const source = block.source || {};
    return {
      inlineData: {
        mimeType: source.media_type || "application/octet-stream",
        data: source.data,
      },
    };
  }
  // Fallback: stringify anything unrecognized so we don't silently drop data.
  return { text: JSON.stringify(block) };
}

// Convert Anthropic-style messages into Gemini "contents".
function messagesToContents(messages) {
  return (messages || []).map((m) => ({
    role: m.role === "assistant" ? "model" : "user",
    parts: Array.isArray(m.content)
      ? m.content.map(blockToPart)
      : [blockToPart(m.content)],
  }));
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    res.status(500).json({
      error: "Server is missing GEMINI_API_KEY. Add it in your hosting provider's environment variables.",
    });
    return;
  }

  try {
    const body = req.body || {};
    const model = process.env.GEMINI_MODEL || GEMINI_MODEL_DEFAULT;

    const geminiBody = {
      contents: messagesToContents(body.messages),
      generationConfig: {
        maxOutputTokens: body.max_tokens || 1000,
      },
    };

    if (body.system) {
      geminiBody.systemInstruction = { parts: [{ text: body.system }] };
    }

    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(geminiBody),
    });

    const data = await response.json();

    if (!response.ok) {
      res.status(response.status).json({ error: data.error?.message || "Gemini API error", details: data });
      return;
    }

    const text = (data.candidates?.[0]?.content?.parts || [])
      .map((p) => p.text || "")
      .join("\n")
      .trim();

    // Return in the same shape the frontend already expects.
    res.status(200).json({ content: [{ type: "text", text }] });
  } catch (err) {
    res.status(500).json({ error: "Failed to reach Gemini API", details: String(err) });
  }
}
