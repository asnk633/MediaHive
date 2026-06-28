import { NextResponse } from 'next/server';
import { verifyUser } from '@/lib/server/server-utils';
import { GoogleGenAI } from '@google/genai';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export async function POST(req: Request) {
  try {
    const user = await verifyUser(req);
    if (!user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const body = await req.json();
    const { tasks } = body;

    if (!tasks || !Array.isArray(tasks) || tasks.length === 0) {
      return NextResponse.json({ error: 'A non-empty tasks array is required' }, { status: 400 });
    }

    const prompt = `
You are an expert project manager AI. Given the following list of tasks, return them ordered by priority (from highest to lowest). 
Respond ONLY with a valid JSON array of objects, where each object has a "taskId" string and a "reason" string briefly explaining why it was given that priority.
Do not wrap the JSON in markdown code blocks.

Tasks:
${JSON.stringify(tasks, null, 2)}
`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        systemInstruction: 'You are an intelligent task prioritization engine.',
        temperature: 0.2,
      }
    });

    let resultJson = response.text || "[]";
    // Clean up potential markdown formatting from the response
    if (resultJson.startsWith('```json')) {
      resultJson = resultJson.replace(/^```json\n/, '').replace(/\n```$/, '');
    } else if (resultJson.startsWith('```')) {
      resultJson = resultJson.replace(/^```\n/, '').replace(/\n```$/, '');
    }

    let prioritizedList;
    try {
      prioritizedList = JSON.parse(resultJson);
    } catch (parseError) {
      console.error('[AI Prioritize Parse Error]:', parseError, 'Raw response:', response.text);
      return NextResponse.json({ error: 'Failed to parse AI response' }, { status: 500 });
    }

    return NextResponse.json({ prioritizedTasks: prioritizedList });
  } catch (error: any) {
    console.error('[AI Prioritize API Error]:', error);
    return NextResponse.json(
      { error: 'Failed to prioritize tasks', details: error.message },
      { status: 500 }
    );
  }
}
