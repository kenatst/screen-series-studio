import { Router } from 'express';
import fs from 'fs';
import path from 'path';
import { ai } from '../lib/gemini';
import { SlideConfig } from '../lib/prompt-builder';

const router = Router();

router.post('/', async (req, res) => {
    const { projectId, targetLanguage } = req.body;
    if (!projectId || !targetLanguage) {
        return res.status(400).json({ error: 'Missing projectId or targetLanguage' });
    }

    try {
        const projectPath = path.resolve(__dirname, '../../server/data/projects', `${projectId}.json`);
        if (!fs.existsSync(projectPath)) {
            return res.status(404).json({ error: 'Project not found' });
        }

        const projectData = JSON.parse(fs.readFileSync(projectPath, 'utf-8'));
        const slides: SlideConfig[] = projectData.slides || [];

        // Build a JSON payload of texts to translate
        const textPayload = slides.map(s => ({
            id: s.number,
            headline: s.headline,
            subheadline: s.subheadline
        }));

        const prompt = `
You are an expert app store localization specialist. Your task is to translate and adapt App Store marketing copy into ${targetLanguage}.

CRITICAL RULES:
1. Do not just translate literally. Adapt the tone, cultural references, and idioms to sound natural, persuasive, and premium in ${targetLanguage}.
2. LENGTH ADAPTATION: App store screenshots have strict space limits. The translated text should roughly match or be slightly shorter than the original English length. Be concise and punchy.
3. Return ONLY a valid JSON array of objects with 'id', 'headline', and 'subheadline' keys. Do not wrap it in markdown codeblocks.

Original Text:
${JSON.stringify(textPayload, null, 2)}
        `.trim();

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: [{ text: prompt }]
        });

        let responseText = '';
        if (response.candidates && response.candidates[0] && response.candidates[0].content) {
            responseText = response.candidates[0].content.parts![0]?.text || '';
        }

        // Clean up markdown if Gemini returned it
        responseText = responseText.replace(/```json/g, '').replace(/```/g, '').trim();

        const translatedTexts = JSON.parse(responseText);

        // Update slides
        const updatedSlides = slides.map(s => {
            const translation = translatedTexts.find((t: any) => t.id === s.number);
            if (translation) {
                return { ...s, headline: translation.headline, subheadline: translation.subheadline };
            }
            return s;
        });

        projectData.slides = updatedSlides;
        projectData.locale = targetLanguage;

        fs.writeFileSync(projectPath, JSON.stringify(projectData, null, 2));

        res.json({ success: true, message: `Successfully translated project to ${targetLanguage}`, slides: updatedSlides });
    } catch (error: any) {
        console.error('Translation error:', error);
        res.status(500).json({ error: 'Translation failed: ' + error.message });
    }
});

export default router;
