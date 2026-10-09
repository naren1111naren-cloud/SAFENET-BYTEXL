/**
 * SAFENET - Gemini Vision Logo Understanding Engine
 * 
 * Extracts visible text, typography, visual description, and estimated brand context from logo images.
 * Adheres strictly to the honest reporting rule: returns NOT_CONFIGURED when keys are absent.
 */

import { GoogleGenerativeAI } from '@google/generative-ai';

export interface GeminiVisionLogoResult {
  status: 'SUCCESS' | 'NOT_CONFIGURED' | 'ERROR';
  extractedText: string;
  brandNameEstimate: string;
  visualDescription: string;
  detectedColors: string[];
  explanation: string;
}

export async function analyzeLogoWithGeminiVision(
  imageBuffer: Buffer,
  mimeType: string
): Promise<GeminiVisionLogoResult> {
  const apiKey = (process.env.GEMINI_API_KEY || '').trim();

  // Validate API key integrity
  if (!apiKey || apiKey.length < 15 || apiKey.startsWith('AQ.')) {
    return {
      status: 'NOT_CONFIGURED',
      extractedText: '',
      brandNameEstimate: '',
      visualDescription: '',
      detectedColors: [],
      explanation: 'Google Gemini Vision is not configured. Visual text extraction skipped.',
    };
  }

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

    const base64Data = imageBuffer.toString('base64');
    const imagePart = {
      inlineData: {
        data: base64Data,
        mimeType: mimeType || 'image/png',
      },
    };

    const prompt = `Analyze this logo / icon image for brand identity and security review.
Respond ONLY in valid JSON with these exact keys:
{
  "extractedText": "exact text written or visible in the image (or empty string if none)",
  "brandNameEstimate": "brand name represented if identifiable (or empty string)",
  "visualDescription": "short 1-2 sentence description of shapes, symbols, and iconography",
  "detectedColors": ["primaryColor", "secondaryColor"]
}`;

    const result = await model.generateContent([prompt, imagePart]);
    const textResponse = result.response.text();

    const cleanJson = textResponse.replace(/```json/g, '').replace(/```/g, '').trim();
    const parsed = JSON.parse(cleanJson);

    return {
      status: 'SUCCESS',
      extractedText: String(parsed.extractedText || '').trim(),
      brandNameEstimate: String(parsed.brandNameEstimate || '').trim(),
      visualDescription: String(parsed.visualDescription || '').trim(),
      detectedColors: Array.isArray(parsed.detectedColors) ? parsed.detectedColors : [],
      explanation: 'Gemini Vision successfully interpreted logo artwork and typography.',
    };
  } catch (err: any) {
    return {
      status: 'ERROR',
      extractedText: '',
      brandNameEstimate: '',
      visualDescription: '',
      detectedColors: [],
      explanation: `Gemini Vision analysis error: ${err?.message || err}`,
    };
  }
}
