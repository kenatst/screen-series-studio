import { Router, Request, Response } from 'express';
import fs from 'fs';
import path from 'path';

const router = Router();
const TEMPLATES_DIR = path.resolve(__dirname, '../../server/templates');

/**
 * GET /api/templates
 * Returns all templates with metadata and preview image URLs.
 */
router.get('/', (_req: Request, res: Response) => {
    try {
        if (!fs.existsSync(TEMPLATES_DIR)) {
            return res.json([]);
        }

        const templateDirs = fs.readdirSync(TEMPLATES_DIR, { withFileTypes: true })
            .filter(d => d.isDirectory());

        const templates = templateDirs.map(dir => {
            const metaPath = path.join(TEMPLATES_DIR, dir.name, 'meta.json');
            let meta: any = { id: dir.name, name: dir.name };

            if (fs.existsSync(metaPath)) {
                meta = { ...meta, ...JSON.parse(fs.readFileSync(metaPath, 'utf-8')) };
            }

            // Check for preview image
            const previewPath = path.join(TEMPLATES_DIR, dir.name, 'preview.png');
            const hasPreview = fs.existsSync(previewPath) ||
                fs.existsSync(path.join(TEMPLATES_DIR, dir.name, 'preview.jpg'));

            // Check for style guide
            const stylePath = path.join(TEMPLATES_DIR, dir.name, 'style-guide.txt');
            const hasStyleGuide = fs.existsSync(stylePath);

            // Count slide reference images
            const referenceImages = fs.readdirSync(path.join(TEMPLATES_DIR, dir.name))
                .filter(f => /^slide-\d+\.(png|jpg|jpeg|webp)$/i.test(f));

            return {
                ...meta,
                id: dir.name,
                previewUrl: hasPreview ? `/templates/${dir.name}/preview.png` : null,
                hasStyleGuide,
                referenceImageCount: referenceImages.length,
            };
        });

        res.json(templates);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

/**
 * GET /api/templates/:id
 * Returns a specific template's full details including style guide.
 */
router.get('/:id', (req: Request, res: Response) => {
    try {
        const templateDir = path.join(TEMPLATES_DIR, req.params.id);
        if (!fs.existsSync(templateDir)) {
            return res.status(404).json({ error: 'Template not found' });
        }

        const metaPath = path.join(templateDir, 'meta.json');
        let meta: any = { id: req.params.id, name: req.params.id };
        if (fs.existsSync(metaPath)) {
            meta = { ...meta, ...JSON.parse(fs.readFileSync(metaPath, 'utf-8')) };
        }

        const stylePath = path.join(templateDir, 'style-guide.txt');
        const styleGuide = fs.existsSync(stylePath) ? fs.readFileSync(stylePath, 'utf-8') : '';

        res.json({ ...meta, styleGuide });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

export default router;
