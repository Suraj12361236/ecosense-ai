export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    res.status(500).json({ error: "Missing OPENROUTER_API_KEY" });
    return;
  }

  try {
    const body = req.body || {};
    const messages = [];
    
    if (body.system) {
      messages.push({ role: "system", content: body.system });
    }
    
    (body.messages || []).forEach((m) => {
      if (Array.isArray(m.content)) {
        const text = m.content.map(b => b.text || "").join("\n");
        messages.push({ role: m.role, content: text });
      } else {
        messages.push({ role: m.role, content: m.content });
      }
    });

    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`,
        "HTTP-Referer": "https://ecosense-ai-two.vercel.app",
      },
      body: JSON.stringify({
        model: "google/gemini-2.0-flash-exp:free",
        messages,
        max_tokens: body.max_tokens || 1000,
      }),
    });

    const data = await response.json();
    
    if (!response.ok) {
      res.status(response.status).json({ error: data.error?.message || "OpenRouter error" });
      return;
    }

    const text = data.choices?.[0]?.message?.content || "";
    res.status(200).json({ content: [{ type: "text", text }] });
  } catch (err) {
    res.status(500).json({ error: "Failed", details: String(err) });
  }
}