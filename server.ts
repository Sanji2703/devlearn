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

app.use(express.json({ limit: '10mb' }));

// Initialize Gemini Client
const ai = new GoogleGenAI();

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
Ton rôle est de recalculer et d'adapter le planning de la journée de l'utilisateur en réponse à ses disponibilités ou à un imprévu décrit en langage naturel.

RÈGLES STRICTES DE PLANIFICATION :
1. RESPECT ABSOLU DES ÉVÉNEMENTS FIXES : Tout événement avec "isFixed: true" (ex: cours obligatoires, rendez-vous, déplacements fixes) NE DOIT JAMAIS être annulé ou déplacé sauf si l'utilisateur demande explicitement d'annuler ou modifier CET événement précis.
2. PAS DE SUPPOSITION NON FONDÉE : Ne suppose jamais que l'utilisateur est disponible s'il ne l'a pas indiqué. Si l'information est insuffisante, indique-le dans "clarificationNeeded".
3. NE PAS SURCHARGER : Prévois des pauses de repos réalistes. Ne remplis pas chaque interstice.
4. ADÉQUATION DURÉE / TÂCHE : Si une fenêtre disponible est de 30-45 minutes, choisis des exercices courts ou des révisions ciblées plutôt qu'un module lourd.
5. SÉLECTION PERTINENTE : Choisis uniquement parmi les 4 matières (C, C++, Python, SQL) et les modules/exercices réellement en attente fournis.
6. ÉVITER LES CHEVAUCHEMENTS : Deux activités ne doivent pas se chevaucher dans la même tranche horaire.
7. NE PAS MARQUER TERMINÉ : Ne marque pas une tâche comme terminée si elle a été déplacée.
8. EXPLICATION CLAIRE : Fournis un résumé bienveillant et concis en français expliquant les ajustements effectués.

Réponds TOUJOURS au format JSON strict avec la structure suivante :
{
  "explanation": "Explication claire et bienveillante en français de ce qui a été réorganisé",
  "clarificationNeeded": null ou "Question courte si précision indispensable",
  "activities": [
    {
      "id": "identifiant unique existant si conservé/modifié ou nouveau id au format 'act_' + timestamp",
      "title": "Titre clair de l'activité",
      "type": "course" | "appointment" | "commute" | "personal" | "rest" | "study_available" | "study_session",
      "subject": "c" | "cpp" | "python" | "sql" (ou null si pas d'étude),
      "moduleId": "id du module si applicable ou null",
      "exerciseId": "id de l'exercice si applicable ou null",
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

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: promptText,
      config: {
        systemInstruction,
        responseMimeType: 'application/json',
      },
    });

    const responseText = response.text || '{}';
    let resultJson;
    try {
      resultJson = JSON.parse(responseText);
    } catch (parseErr) {
      console.error('Failed to parse Gemini JSON output:', responseText);
      return res.status(500).json({ error: 'Format de réponse invalide généré par l\'IA.' });
    }

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

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: JSON.stringify({ availableMinutes, subject, pendingExercises, modules }),
      config: {
        systemInstruction,
        responseMimeType: 'application/json',
      },
    });

    const parsed = JSON.parse(response.text || '{}');
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
