import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// API Key verification helper
function getGeminiClient() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY environment variable is required");
  }
  return new GoogleGenAI({ apiKey });
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

// API routes FIRST
app.post("/api/chat", async (req, res) => {
  try {
    const { message, history } = req.body;
    if (!message) {
      return res.status(400).json({ error: "Message is required" });
    }

    const ai = getGeminiClient();
    const chat = ai.chats.create({
      model: "gemini-2.5-flash",
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
      },
      history: history || [],
    });

    const result = await chat.sendMessage({ message });
    res.json({ text: result.text || "" });
  } catch (error: any) {
    console.error("Server-side Gemini Error:", error);
    res.status(500).json({ 
      error: error.message || "An error occurred while communicating with the Heritage Assistant." 
    });
  }
});

app.get("/api/health", (req, res) => {
  res.json({ status: "ok" });
});

// Setup Vite or static serving
async function initializeServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on port ${PORT}`);
  });
}

initializeServer().catch((err) => {
  console.error("Failed to start server:", err);
});
