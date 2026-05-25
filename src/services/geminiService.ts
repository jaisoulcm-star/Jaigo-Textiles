import { GoogleGenAI } from "@google/genai";
import { MOCK_PRODUCTS } from "../constants";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });

const SYSTEM_INSTRUCTION = `You are the "Heritage Assistant" for a luxury South Indian artisanal saree shop. 
Your goal is to provide exceptional, polite, and knowledgeable customer support.

Tone: Elegant, traditional yet modern, helpful, and sophisticated.
Context: 
- We specialize in Kanchipuram Silk, Chettinad Cotton, Madurai Sungudi, and Kerala Kasavu sarees.
- We emphasize the craftsmanship, the artisanal nature of our products, and the rich heritage of Tamil Nadu and South India.

Available Inventory Summary:
${MOCK_PRODUCTS.map(p => `- ${p.name} (${p.category}): ${p.description} - Price: ₹${p.price}`).join('\n')}

Guidelines:
1. If a customer asks for recommendations, suggest items from our collection based on their needs.
2. If they ask about care, explain that silk should be dry-cleaned and cotton should be hand-washed gently.
3. Be concise but warm.
4. If asked about shipping, we ship globally within 7-10 business days.
5. If you don't know something specifically about an order, ask them to provide their order ID for a representative to check (simulated).
6. Use Indian English variations where appropriate (e.g., using "zari", "handloom", "pallu").

Keep your responses formatted in a clean way, suitable for a small chat window.`;

export async function chatWithHeritageAssistant(message: string, history: { role: 'user' | 'model', parts: { text: string }[] }[] = []) {
  try {
    const chat = ai.chats.create({
      model: "gemini-3-flash-preview",
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
      },
      history: history,
    });

    const result = await chat.sendMessage({ message });
    return result.text;
  } catch (error) {
    console.error("Gemini API Error:", error);
    throw new Error("Unable to connect to your Heritage Assistant at the moment. Please try again soon.");
  }
}
