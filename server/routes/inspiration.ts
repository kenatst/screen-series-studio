import { Router, Request, Response } from 'express';
import fs from 'fs';
import path from 'path';

const router = Router();
const INSPIRATION_DIR = path.resolve(__dirname, '../../server/inspiration');

/**
 * GET /api/inspiration
 * Returns all inspiration categories and images.
 */
router.get('/', (_req: Request, res: Response) => {
    try {
        if (!fs.existsSync(INSPIRATION_DIR)) {
            return res.json({ categories: [], images: [] });
        }

        // Read categories.json if it exists
        const categoriesPath = path.join(INSPIRATION_DIR, 'categories.json');
        let categories: any[] = [];
        if (fs.existsSync(categoriesPath)) {
            categories = JSON.parse(fs.readFileSync(categoriesPath, 'utf-8'));
        } else {
            // Auto-detect categories from directories
            categories = fs.readdirSync(INSPIRATION_DIR, { withFileTypes: true })
                .filter(d => d.isDirectory())
                .map(d => ({ id: d.name, name: d.name.charAt(0).toUpperCase() + d.name.slice(1) }));
        }

        // Flatten all images from all categories
        const images: any[] = [];
        for (const cat of categories) {
            const catDir = path.join(INSPIRATION_DIR, cat.id);
            if (fs.existsSync(catDir)) {
                const files = fs.readdirSync(catDir)
                    .filter(f => /\.(png|jpg|jpeg|webp)$/i.test(f));
                for (const file of files) {
                    images.push({
                        id: `${cat.id}-${file}`,
                        category: cat.id,
                        categoryName: cat.name,
                        url: `/inspiration/${cat.id}/${file}`,
                        filename: file,
                    });
                }
            }
        }

        res.json({ categories, images });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

/**
 * GET /api/inspiration/:category
 * Returns images for a specific category.
 */
router.get('/:category', (req: Request, res: Response) => {
    try {
        const catDir = path.join(INSPIRATION_DIR, req.params.category);
        if (!fs.existsSync(catDir)) {
            return res.status(404).json({ error: 'Category not found' });
        }

        const files = fs.readdirSync(catDir)
            .filter(f => /\.(png|jpg|jpeg|webp)$/i.test(f));

        const images = files.map(file => ({
            id: `${req.params.category}-${file}`,
            category: req.params.category,
            url: `/inspiration/${req.params.category}/${file}`,
            filename: file,
        }));

        res.json(images);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

export default router;
