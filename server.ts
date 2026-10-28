import express from 'express';
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = parseInt(process.env.PORT || '3000', 10);
const ai = new GoogleGenAI();

app.use(express.json({ limit: '10mb' }));

// Helper: execute Gemini generateContent with model fallbacks
async function generateWithGeminiFallback(contents: string, systemInstruction: string) {
  const candidateModels = ['gemini-3.1-flash-lite', 'gemini-3.8-flash', 'gemini-4-argon'];
  let lastError: any = null;

  for (const model of candidateModels) {
    try {
      const response = await ai.models.generateContent({
        model,
        contents,
        config: {
          systemInstruction,
          responseMimeType: 'application/json',
        },
      });
      const responseText = response.text || '{}';
      return JSON.parse(responseText);
    } catch (err: any) {
      console.warn(`Model ${model} error:`, err.message || err);
      lastError = err;
    }
  }
  throw lastError || new Error('Tous les modèles IA sont indisponibles.');
}

// API: Reorganize schedule with Gemini AI
app.post('/api/ai/reorganize', async (req, res) => {
  try {
    const {
      prompt,
      currentActivities,
      availableModules,
      pendingExercises,
      currentDate,
      userPreferences
    } = req.body;

    if (!prompt) {
      return res.status(400).json({ error: 'Le prompt utilisateur est requis.' });
    }

    const systemInstruction = `
Tu es l'assistant intelligent de planification pour une application d'apprentissage dédiée exclusivement à 4 technologies : C, C++, Python et SQL.
Ton rôle est de recalculer et d'adapter le planning complet de la journée de l'utilisateur en réponse à ses disponibilités ou à un imprévu décrit en langage naturel.

RÈGLES STRICTES DE PLANIFICATION :
1. RESPECT ABSOLU DES ÉVÉNEMENTS FIXES : Tout événement avec "isFixed: true" (cours obligatoires, rendez-vous, trajets fixes) NE DOIT JAMAIS être annulé ou déplacé sauf si l'utilisateur demande explicitement d'annuler ou modifier CET événement précis.
2. PLANIFIE PLUSIEURS CRÉNEAUX DANS LA JOURNÉE : Ne renvoie jamais une seule activité si du temps est disponible. Propose 2 à 4 créneaux d'étude adaptés (ex: 30 à 60 minutes) espacés par des temps de repos réalistes.
3. ADÉQUATION DURÉE / TÂCHE : Si une fenêtre disponible est de 30-45 minutes, choisis des exercices courts ou des révisions ciblées plutôt qu'un module lourd.
4. SÉLECTION PERTINENTE : Choisis uniquement parmi les 4 matières (C, C++, Python, SQL) et les modules/exercices réellement en attente fournis.
5. ÉVITER LES CHEVAUCHEMENTS : Deux activités ne doivent jamais se chevaucher dans la même tranche horaire.
6. EXPLICATION CLAIRE : Fournis un résumé bienveillant et concis en français expliquant les ajustements effectués.

Réponds TOUJOURS au format JSON strict avec la structure suivante :
{
  "explanation": "Explication claire et bienveillante en français de ce qui a été réorganisé",
  "clarificationNeeded": null,
  "activities": [
    {
      "id": "identifiant unique (existant ou nouveau 'act_' + timestamp)",
      "title": "Titre clair de l'activité",
      "type": "course" | "appointment" | "commute" | "personal" | "rest" | "study_available" | "study_session",
      "subject": "c" | "cpp" | "python" | "sql" (ou null),
      "moduleId": "id du module ou null",
      "exerciseId": "id de l'exercice ou null",
      "date": "YYYY-MM-DD",
      "startTime": "HH:mm",
      "endTime": "HH:mm",
      "durationMinutes": 45,
      "isFixed": false,
      "isCompleted": false,
      "notes": "Notes éventuelles",
      "aiProposed": true,
      "aiRationale": "Pourquoi cette séance est proposée à ce moment"
    }
  ],
  "postponedExercises": ["titres ou ids des exercices remis à plus tard si manque de temps"]
}
`;

    const promptText = `
Date concernée : ${currentDate || new Date().toISOString().split('T')[0]}
Demande de l'utilisateur : "${prompt}"

Planning actuel de la journée :
${JSON.stringify(currentActivities || [], null, 2)}

Modules disponibles :
${JSON.stringify((availableModules || []).map((m: any) => ({ id: m.id, subject: m.subject, title: m.title, status: m.status })), null, 2)}

Exercices en attente :
${JSON.stringify((pendingExercises || []).map((e: any) => ({ id: e.id, subject: e.subject, moduleId: e.moduleId, title: e.title, estimatedMinutes: e.estimatedMinutes, difficulty: e.difficulty })), null, 2)}
`;

    const resultJson = await generateWithGeminiFallback(promptText, systemInstruction);
    return res.json(resultJson);
  } catch (error: any) {
    console.error('Error in /api/ai/reorganize:', error);
    return res.status(500).json({
      error: 'Erreur lors de la réorganisation intelligente.',
      details: error.message || String(error)
    });
  }
});

// API: Suggest next best exercise or study action for a given duration
app.post('/api/ai/suggest-next', async (req, res) => {
  try {
    const { availableMinutes, subject, pendingExercises, modules } = req.body;

    const systemInstruction = `
Tu es le tuteur d'apprentissage personnel pour C, C++, Python et SQL.
L'utilisateur dispose de ${availableMinutes || 30} minutes libres et souhaite une suggestion adaptée pour progresser sans se disperser.
Sélectionne l'activité la plus opportune parmi ses données réelles. Ne génère pas de faux exercices.
Réponds en JSON avec :
{
  "recommendedExerciseId": "id de l'exercice recommandé",
  "reason": "Explication pédagogique brève de 1-2 phrases en français",
  "tip": "Conseil d'efficacité pour cette séance courte"
}
`;

    const parsed = await generateWithGeminiFallback(
      JSON.stringify({ availableMinutes, subject, pendingExercises, modules }),
      systemInstruction
    );
    return res.json(parsed);
  } catch (error: any) {
    console.error('Error in /api/ai/suggest-next:', error);
    return res.status(500).json({ error: error.message });
  }
});

// Vite middleware for dev or static serve for production
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server listening on port ${PORT}`);
  });
}

startServer();
