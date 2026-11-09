import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';

dotenv.config();

const app = express();

// In development, AI Studio dev server runs on port 3000.
// In Cloud Run production deployment, Cloud Run injects process.env.PORT (defaults to 8080).
const isProduction = process.env.NODE_ENV === 'production';
const PORT = isProduction ? Number(process.env.PORT || 8080) : 3000;

app.use(express.json({ limit: '10mb' }));

// Lazy Gemini client helper with User-Agent telemetry
const getAi = () => {
  return new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY || '',
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
};

// API: Ask Academic Doubt / Guidance
app.post('/api/gemini/ask-doubt', async (req, res) => {
  try {
    const { question, context, subject } = req.body;

    if (!question || typeof question !== 'string') {
      return res.status(400).json({ error: 'Question is required.' });
    }

    const systemInstruction = `You are 'Astra', the Gemini AI Flight Copilot & Academic Tutor for 'Study Buddy – Mission Control'.
Your role is to help students resolve academic doubts, explain difficult concepts in STEM (Astrophysics, Quantum Physics, Mathematics, Biology, Chemistry, Computer Science, Engineering), and break down complex problems into clear, step-by-step actionable understanding.
Maintain an encouraging, sharp, cosmic mission-control persona.
Format your responses with clear markdown headings, bullet points, and code/math blocks where helpful.
If applicable, suggest 2-3 specific study sub-tasks or missions the student can add to their flight manifest.`;

    const prompt = `Subject Orbit: ${subject || 'General Academic'}\nContext: ${context || 'None'}\nStudent Doubt / Question: ${question}`;

    const ai = getAi();
    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        systemInstruction,
      },
    });

    const answer = response.text || 'Telemetry link established, but no textual transmission returned.';
    res.json({ answer });
  } catch (error: any) {
    console.error('Gemini ask-doubt error:', error);
    res.status(500).json({
      error: error?.message || 'Failed to communicate with Gemini Copilot flight computer.',
    });
  }
});

// API: Generate Structured Mission Flight Plan
app.post('/api/gemini/study-plan', async (req, res) => {
  try {
    const { missionTitle, subject, deadline, hoursAvailable } = req.body;

    const systemInstruction = `You are Astra, the academic mission planning specialist. Given an assignment or exam deliverable, generate a structured study sprint flight plan broken down into actionable stages.`;

    const prompt = `Generate a structured study flight plan for:
Mission: "${missionTitle}"
Subject: "${subject}"
Deadline: "${deadline}"
Available Hours: ${hoursAvailable || '4-6 hours'}
Provide a concise day-by-day or phase-by-phase execution plan.`;

    const ai = getAi();
    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        systemInstruction,
      },
    });

    res.json({ plan: response.text });
  } catch (error: any) {
    console.error('Gemini study-plan error:', error);
    res.status(500).json({
      error: error?.message || 'Failed to synthesize mission flight plan.',
    });
  }
});

// API: Parse Timetable (Image or Text) with Gemini
app.post('/api/gemini/parse-timetable', async (req, res) => {
  try {
    const { text, imageBase64, mimeType } = req.body;

    if (!text && !imageBase64) {
      return res.status(400).json({ error: 'Please provide either text notes or a timetable image.' });
    }

    const contents: any[] = [];

    if (imageBase64) {
      const cleanBase64 = imageBase64.replace(/^data:[^;]+;base64,/, '');
      contents.push({
        inlineData: {
          data: cleanBase64,
          mimeType: mimeType || 'image/jpeg',
        },
      });
    }

    const promptText = `Analyze this class timetable and extract all scheduled classes.
${text ? `Student notes / timetable text:\n${text}\n` : ''}

Output a strictly valid JSON object matching this exact schema:
{
  "classes": [
    {
      "day": "Monday" | "Tuesday" | "Wednesday" | "Thursday" | "Friday" | "Saturday" | "Sunday",
      "subject": "string",
      "startTime": "HH:MM",
      "endTime": "HH:MM",
      "room": "string (optional)",
      "instructor": "string (optional)"
    }
  ],
  "analysis": {
    "totalClassesDetected": number,
    "heaviestDay": "string",
    "freeTimeInsight": "string describing when the student is most free during the week",
    "recommendation": "string suggesting optimal study orbit blocks"
  }
}

Important rules:
1. Use 24-hour time format for startTime and endTime (e.g., "09:00", "14:30").
2. Standardize day names to full English day: Monday, Tuesday, Wednesday, Thursday, Friday, Saturday, Sunday.
3. If an end time is not explicitly stated, assume a standard 1-hour session.
4. Only output valid JSON without surrounding markdown blocks.`;

    contents.push({ text: promptText });

    const systemInstruction = `You are the Mission Control Academic Timetable Intelligence Unit. You accurately extract class schedules from timetables, images, photos of whiteboard schedules, or text dumps, converting them into structured class periods and calculating free orbital blocks.`;

    const ai = getAi();
    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents,
      config: {
        systemInstruction,
        responseMimeType: 'application/json',
      },
    });

    const rawOutput = response.text || '{}';
    let parsedData;
    try {
      parsedData = JSON.parse(rawOutput);
    } catch {
      // Clean possible formatting wraps
      const cleaned = rawOutput.replace(/```json/g, '').replace(/```/g, '').trim();
      parsedData = JSON.parse(cleaned);
    }

    res.json(parsedData);
  } catch (error: any) {
    console.error('Gemini parse-timetable error:', error);
    res.status(500).json({
      error: error?.message || 'Failed to analyze timetable with Gemini.',
    });
  }
});

// Mount Vite middleware for dev server
async function startServer() {
  if (!isProduction) {
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: false,
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  }

  const server = app.listen(PORT, '0.0.0.0', () => {
    console.log(`Mission Control server online at http://0.0.0.0:${PORT}`);
  });

  server.on('error', (err: any) => {
    console.error('Server listen error:', err);
  });
}

startServer();
