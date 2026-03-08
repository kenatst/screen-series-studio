import { Router, Request, Response } from 'express';
import fs from 'fs';
import path from 'path';
import { generateSlide } from '../lib/gemini';
import { buildSlidePrompt, SlideConfig, ProjectConfig, BrandKit } from '../lib/prompt-builder';
import { ConsistencyRules } from '../lib/consistency-engine';

const router = Router();

interface GenerateRequestBody {
    projectId: string;
    slides: SlideConfig[];
    project: ProjectConfig;
    brandKit: BrandKit;
    templateId: string;
    consistencyLevel: 'strict' | 'balanced' | 'exploratory';
    referenceImages: { mimeType: string; data: string }[];
    rawScreens: { tag: string; mimeType: string; data: string }[];
    platform: 'ios' | 'android' | 'both';
}

/**
 * GET /api/generate/:projectId
 * Streams SSE events as each slide is generated. Reads project from disk.
 */
router.get('/:projectId', async (req: Request, res: Response) => {
    const projectId = req.params.projectId as string;
    const projectFilePath = path.resolve(__dirname, '../../server/data/projects', `${projectId}.json`);

    if (!fs.existsSync(projectFilePath)) {
        return res.status(404).json({ error: 'Project not found' });
    }

    const projectData = JSON.parse(fs.readFileSync(projectFilePath, 'utf-8'));

    const {
        slides = [],
        platform = 'both',
        brandKit = { colors: [] },
        templateId = 'clean-saas',
        consistencyLevel = 'balanced',
        referenceImages = [],
        rawScreens = [],
    } = projectData;

    const typedReferenceImages = referenceImages as { mimeType: string; data: string }[];
    const typedRawScreens = rawScreens as { tag: string; mimeType: string; data: string }[];

    const project = { appName: projectData.name, appDescription: projectData.description || '', platform, primaryGoal: projectData.primaryGoal || '' };

    // SSE headers
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no');
    res.flushHeaders();

    // Ensure output directory exists
    const outputDir = path.resolve(__dirname, '../../server/output', projectId);
    fs.mkdirSync(outputDir, { recursive: true });

    // Load template style guide if available
    let templateStyleGuide = '';
    const templateDir = path.resolve(__dirname, '../../server/templates', templateId);
    const styleGuideFile = path.join(templateDir, 'style-guide.txt');
    if (fs.existsSync(styleGuideFile)) {
        templateStyleGuide = fs.readFileSync(styleGuideFile, 'utf-8');
    }

    // Load template reference images
    const templateRefImages: { mimeType: string; data: string }[] = [];
    if (fs.existsSync(templateDir)) {
        const templateFiles = fs.readdirSync(templateDir).filter(f => /\.(png|jpg|jpeg|webp)$/i.test(f) && f !== 'preview.png');
        for (const file of templateFiles.slice(0, 3)) {
            const imgData = fs.readFileSync(path.join(templateDir, file));
            const ext = path.extname(file).toLowerCase().replace('.', '');
            const mime = ext === 'jpg' ? 'image/jpeg' : `image/${ext}`;
            templateRefImages.push({ mimeType: mime, data: imgData.toString('base64') });
        }
    }

    // Build consistency rules
    const consistencyRules: ConsistencyRules = {
        level: consistencyLevel,
        brandColors: brandKit.colors || [],
        fontFamily: brandKit.fontFamily,
    };

    const sendEvent = (event: string, data: any) => {
        res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
    };

    const generationMode = projectData.generationMode || 'full';
    let slidesToGenerate: SlideConfig[] = slides;

    if (generationMode === 'first-3') {
        slidesToGenerate = slides.slice(0, 3);
    } else if (generationMode === 'creative-direction' && slides.length > 0) {
        // Generate 3 variants of the first slide
        slidesToGenerate = [slides[0], slides[0], slides[0]];
    }

    // Generate slides sequentially
    for (let i = 0; i < slidesToGenerate.length; i++) {
        const slide = slidesToGenerate[i];
        const displaySlideNumber = generationMode === 'creative-direction' ? i + 1 : slide.number;

        sendEvent('slide-start', { slideNumber: displaySlideNumber, total: slidesToGenerate.length });

        try {
            // Build prompt
            const prompt = buildSlidePrompt({
                slide: { ...slide, totalSlides: slides.length },
                project,
                brandKit,
                templateStyleGuide,
                consistencyRules,
            });

            // Assemble reference images (up to 14 max):
            const allRefImages: { mimeType: string; data: string }[] = [
                ...templateRefImages,
                ...typedReferenceImages.slice(0, 5),
            ];

            const matchingRaw = typedRawScreens.find(r => r.tag === slide.rawScreenTag);
            if (matchingRaw) {
                allRefImages.push({ mimeType: matchingRaw.mimeType, data: matchingRaw.data });
            }

            if (brandKit.logoBase64) {
                allRefImages.push({ mimeType: 'image/png', data: brandKit.logoBase64 });
            }

            // Call Gemini
            // For creative-direction, we might want to slightly vary the temperature or seed implicitly 
            // by adding a variant hint to the prompt.
            const variantPrompt = generationMode === 'creative-direction'
                ? `${prompt}\n\nMETA: Provide creative variant #${i + 1} with a unique aesthetic spin while respecting the brand core.`
                : prompt;

            const result = await generateSlide({
                prompt: variantPrompt,
                referenceImages: allRefImages.slice(0, 14),
                aspectRatio: '9:16',
                imageSize: '2K',
            });

            // Save image
            const filename = `slide-${displaySlideNumber}.png`;

            const filePath = path.join(outputDir, filename);
            const imageBuffer = Buffer.from(result.imageBase64, 'base64');
            fs.writeFileSync(filePath, imageBuffer);

            sendEvent('slide-done', {
                slideNumber: displaySlideNumber,
                imageUrl: `/output/${projectId}/${filename}`,
                text: result.text,
            });
        } catch (error: any) {
            console.error(`Error generating slide ${slide.number}:`, error);
            sendEvent('slide-error', {
                slideNumber: slide.number,
                message: error.message || 'Generation failed',
            });
        }
    }

    sendEvent('all-done', { projectId });
    res.end();
});

/**
 * POST /api/generate/single
 * Regenerate a single slide.
 */
router.post('/single', async (req: Request, res: Response) => {
    const body = req.body;
    const { projectId, slide, project, brandKit, templateId, consistencyLevel, referenceImages = [], rawScreens = [], totalSlides } = body;

    const outputDir = path.resolve(__dirname, '../../server/output', projectId);
    fs.mkdirSync(outputDir, { recursive: true });

    let templateStyleGuide = '';
    const templateDir = path.resolve(__dirname, '../../server/templates', templateId);
    const styleGuideFile = path.join(templateDir, 'style-guide.txt');
    if (fs.existsSync(styleGuideFile)) {
        templateStyleGuide = fs.readFileSync(styleGuideFile, 'utf-8');
    }

    const consistencyRules: ConsistencyRules = {
        level: consistencyLevel || 'balanced',
        brandColors: brandKit?.colors || [],
        fontFamily: brandKit?.fontFamily,
    };

    try {
        const prompt = buildSlidePrompt({
            slide: { ...slide, totalSlides: totalSlides || 5 },
            project,
            brandKit,
            templateStyleGuide,
            consistencyRules,
        });

        const result = await generateSlide({
            prompt,
            referenceImages: (referenceImages || []).slice(0, 14),
            aspectRatio: '9:16',
            imageSize: '2K',
        });

        const filename = `slide-${slide.number}.png`;
        const filePath = path.join(outputDir, filename);
        fs.writeFileSync(filePath, Buffer.from(result.imageBase64, 'base64'));

        res.json({
            success: true,
            imageUrl: `/output/${projectId}/${filename}`,
            text: result.text,
        });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
});

export default router;
