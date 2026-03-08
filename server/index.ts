import express from 'express';
import cors from 'cors';
import path from 'path';
import dotenv from 'dotenv';
import generateRouter from './routes/generate';
import templatesRouter from './routes/templates';
import inspirationRouter from './routes/inspiration';
import projectsRouter from './routes/projects';
import translateRouter from './routes/translate';

// Load env
dotenv.config({ path: path.resolve(__dirname, '.env') });

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors({ origin: '*' }));
app.use(express.json({ limit: '100mb' }));
app.use(express.urlencoded({ extended: true, limit: '100mb' }));

// Static file serving
app.use('/templates', express.static(path.resolve(__dirname, 'templates')));
app.use('/inspiration', express.static(path.resolve(__dirname, 'inspiration')));
app.use('/output', express.static(path.resolve(__dirname, 'output')));

// API routes
app.use('/api/generate', generateRouter);
app.use('/api/templates', templatesRouter);
app.use('/api/inspiration', inspirationRouter);
app.use('/api/projects', projectsRouter);
app.use('/api/translate', translateRouter);

// Download ZIP route - Pro Export Structure
app.get('/api/download/:projectId', async (req, res) => {
    const archiver = (await import('archiver')).default;
    const outputDir = path.resolve(__dirname, 'output', req.params.projectId);
    const projectPath = path.resolve(__dirname, 'data/projects', `${req.params.projectId}.json`);
    const fs = await import('fs');

    if (!fs.existsSync(outputDir)) {
        return res.status(404).json({ error: 'Project output not found' });
    }

    res.setHeader('Content-Type', 'application/zip');
    res.setHeader('Content-Disposition', `attachment; filename="${req.params.projectId}-screenshots.zip"`);

    const archive = archiver('zip', { zlib: { level: 9 } });
    archive.pipe(res);

    let project: any = {};
    if (fs.existsSync(projectPath)) {
        project = JSON.parse(fs.readFileSync(projectPath, 'utf-8'));
    }

    const locale = project.locale || 'en-US';
    const formats = project.deviceFormats || ['iPhone-6.9-Pro-Max'];

    // Map internal format IDs to pretty folder names
    const formatMap: Record<string, string> = {
        'iphone-6-9': 'iPhone-6.9-Pro-Max',
        'iphone-6-5': 'iPhone-6.5-Max',
        'ipad-12-9': 'iPad-Pro-12.9',
    };

    const files = fs.readdirSync(outputDir).filter(f => f.endsWith('.png') || f.endsWith('.jpg'));

    formats.forEach((formatId: string) => {
        const folderName = formatMap[formatId] || formatId;
        files.forEach((file: string) => {
            // Reformat name: slide-1.png -> 01_slide.png
            const match = file.match(/slide-(\d+)/);
            let newName = file;
            if (match) {
                const num = match[1].padStart(2, '0');
                newName = `${num}_slide.png`;
            }

            archive.file(path.join(outputDir, file), { name: `${locale}/${folderName}/${newName}` });
        });
    });

    if (files.length === 0) {
        // Fallback if no specific files
        archive.directory(outputDir, 'Raw');
    }

    archive.finalize();
});

// Health check
app.get('/api/health', (_req, res) => {
    res.json({
        status: 'ok',
        geminiKey: process.env.GEMINI_API_KEY ? 'configured' : 'MISSING',
        timestamp: new Date().toISOString(),
    });
});

app.listen(PORT, () => {
    console.log(`\n🚀 ScreenForge API running at http://localhost:${PORT}`);
    console.log(`   Gemini API Key: ${process.env.GEMINI_API_KEY ? '✅ configured' : '❌ MISSING — set GEMINI_API_KEY in server/.env'}`);
    console.log(`   Templates: ${path.resolve(__dirname, 'templates')}`);
    console.log(`   Inspiration: ${path.resolve(__dirname, 'inspiration')}`);
    console.log(`   Output: ${path.resolve(__dirname, 'output')}\n`);
});
