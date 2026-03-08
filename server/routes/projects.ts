import { Router, Request, Response } from 'express';
import fs from 'fs';
import path from 'path';

const router = Router();
const PROJECTS_DIR = path.resolve(__dirname, '../../server/data/projects');

// Ensure directory exists
fs.mkdirSync(PROJECTS_DIR, { recursive: true });

/**
 * GET /api/projects
 * List all projects.
 */
router.get('/', (_req: Request, res: Response) => {
    try {
        const files = fs.readdirSync(PROJECTS_DIR).filter(f => f.endsWith('.json'));
        const projects = files.map(f => {
            const data = JSON.parse(fs.readFileSync(path.join(PROJECTS_DIR, f), 'utf-8'));
            return data;
        });
        // Sort by updatedAt descending
        projects.sort((a, b) => new Date(b.updatedAt || 0).getTime() - new Date(a.updatedAt || 0).getTime());
        res.json(projects);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

/**
 * GET /api/projects/:id
 * Get a specific project.
 */
router.get('/:id', (req: Request, res: Response) => {
    try {
        const filePath = path.join(PROJECTS_DIR, `${req.params.id}.json`);
        if (!fs.existsSync(filePath)) {
            return res.status(404).json({ error: 'Project not found' });
        }
        const data = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
        res.json(data);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

/**
 * POST /api/projects
 * Create or update a project.
 */
router.post('/', (req: Request, res: Response) => {
    try {
        const project = req.body;
        if (!project.id) {
            project.id = `proj-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
        }
        project.updatedAt = new Date().toISOString();
        if (!project.createdAt) {
            project.createdAt = project.updatedAt;
        }

        const filePath = path.join(PROJECTS_DIR, `${project.id}.json`);
        fs.writeFileSync(filePath, JSON.stringify(project, null, 2));

        res.json(project);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

/**
 * DELETE /api/projects/:id
 */
router.delete('/:id', (req: Request, res: Response) => {
    try {
        const filePath = path.join(PROJECTS_DIR, `${req.params.id}.json`);
        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
        }
        res.json({ success: true });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

export default router;
