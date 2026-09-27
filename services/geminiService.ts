import { GoogleGenAI } from "@google/genai";
import { SYSTEM_INSTRUCTION, IMAGE_EXTRACTION_PROMPT } from "../constants";

const getAIClient = () => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("API Key is missing. Please configure process.env.GEMINI_API_KEY.");
  }
  return new GoogleGenAI({ apiKey });
};

export const generateGeoGebraCommands = async (prompt: string): Promise<string[]> => {
  const ai = getAIClient();

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        temperature: 0.1,
      }
    });

    const text = response.text;
    if (!text) return [];

    // Clean up the response
    const commands = text
      .split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0 && !line.startsWith('```') && !line.startsWith('//'));

    return commands;
  } catch (error) {
    console.error("Gemini API Error (Generate):", error);
    throw error;
  }
};

export const extractProblemFromImage = async (base64Data: string, mimeType: string): Promise<string> => {
  const ai = getAIClient();

  try {
    // Clean base64 string if it contains the header
    const cleanBase64 = base64Data.replace(/^data:image\/(png|jpeg|jpg|webp);base64,/, '');

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: mimeType,
              data: cleanBase64
            }
          },
          {
            text: "Trích xuất đề bài từ ảnh này."
          }
        ]
      },
      config: {
        systemInstruction: IMAGE_EXTRACTION_PROMPT,
        temperature: 0.1,
      }
    });

    return response.text || "";
  } catch (error) {
    console.error("Gemini API Error (Vision):", error);
    throw error;
  }
};
