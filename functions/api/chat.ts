interface Env {
  GEMINI_API_KEY: string;
}

const SYSTEM_INSTRUCTION = `You are the "Heritage Assistant" for a luxury South Indian artisanal saree shop. 
Your goal is to provide exceptional, polite, and knowledgeable customer support.

Tone: Elegant, traditional yet modern, helpful, and sophisticated.
Context: 
- We specialize in Kanchipuram Silk, Chettinad Cotton, Madurai Sungudi, and Kerala Kasavu sarees.
- We emphasize the craftsmanship, the artisanal nature of our products, and the rich heritage of Tamil Nadu and South India.

Available Inventory Summary:
- Kanchipuram Gold Zari Saree: Royal crimson and gold brocade silk saree with intricate temple borders. Price: ₹185,000
- Chettinad Mustard Cotton Saree: Sourced from Karaikudi, featuring bold checks and pure cotton elegance. Price: ₹12,500
- Madurai Sungudi Indigo Saree: Traditional tie-dye block printed cotton saree with elegant zari border. Price: ₹9,800
- Kerala Kasavu Premium Saree: Undyed off-white handloom cotton saree with 24k gold zari border. Price: ₹32,000
- Kanchipuram Brocade Emerald Saree: Rich emerald green silk with silver-gold floral zari work across body. Price: ₹210,000

Guidelines:
1. If a customer asks for recommendations, suggest items from our collection based on their needs.
2. If they ask about care, explain that silk should be dry-cleaned and cotton should be hand-washed gently.
3. Be concise but warm.
4. If asked about shipping, we ship globally within 7-10 business days.
5. If you don't know something specifically about an order, ask them to provide their order ID for a representative to check.
6. Use Indian English variations where appropriate (e.g., using "zari", "handloom", "pallu").

Keep your responses formatted in a clean way, suitable for a small chat window.`;

export const onRequestPost: PagesFunction<Env> = async (context) => {
  try {
    const { request, env } = context;
    const apiKey = env.GEMINI_API_KEY || "";

    if (!apiKey) {
      return new Response(
        JSON.stringify({ error: "GEMINI_API_KEY environment variable is not configured on Cloudflare." }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    const body: any = await request.json();
    const { message, history } = body;

    if (!message) {
      return new Response(
        JSON.stringify({ error: "Message is required." }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // Format history and latest message into standard Gemini API content structure
    const contents: any[] = [];
    if (history && Array.isArray(history)) {
      for (const turn of history) {
        contents.push({
          role: turn.role === "user" ? "user" : "model",
          parts: [{ text: turn.parts?.[0]?.text || "" }]
        });
      }
    }
    // Append current user message
    contents.push({
      role: "user",
      parts: [{ text: message }]
    });

    // We use the modern gemini-2.5-flash API endpoint directly for the Edge function
    // as it runs at 100% web-standard compat on modern Workers.
    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;

    const geminiResponse = await fetch(geminiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        contents: contents,
        systemInstruction: {
          parts: [{ text: SYSTEM_INSTRUCTION }]
        }
      }),
    });

    if (!geminiResponse.ok) {
      const errorText = await geminiResponse.text();
      return new Response(
        JSON.stringify({ error: `Gemini API response error: ${errorText}` }),
        { status: geminiResponse.status, headers: { "Content-Type": "application/json" } }
      );
    }

    const result: any = await geminiResponse.json();
    const replyText = result.candidates?.[0]?.content?.parts?.[0]?.text || "";

    return new Response(
      JSON.stringify({ text: replyText }),
      { headers: { "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    return new Response(
      JSON.stringify({ error: error.message || "An unexpected error occurred in Cloudflare Pages function." }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
};
