import { GoogleGenAI } from "@google/genai";

const getClient = () => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    throw new Error("API Key is missing.");
  }
  return new GoogleGenAI({ apiKey });
};

export const generateLuxuryWish = async (recipient: string, theme: string): Promise<string> => {
  try {
    const ai = getClient();
    const prompt = `
      You are the Chief Copywriter for "Arix Signature", an ultra-luxury heritage brand comparable to Cartier or Rolls-Royce.
      
      Task: Write a Christmas wish for a VVIP client named "${recipient}".
      Theme: "${theme}".
      
      Guidelines:
      1. Tone: Aristocratic, grand, timeless, and exceptionally warm. Use elevated vocabulary.
      2. Imagery: Focus on gold, emerald light, eternity, and brilliance.
      3. Length: Short and punchy (Max 35 words).
      4. Format: Plain text, no emojis (emojis are not 'luxury').
      
      Example style: "May the golden light of the season illuminate your path with eternal brilliance and prosperity."
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });

    return response.text || "May your holidays be filled with golden light and eternal joy.";
  } catch (error) {
    console.error("Gemini API Error:", error);
    throw error;
  }
};
