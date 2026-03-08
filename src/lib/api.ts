const API_BASE = 'http://localhost:3001/api';

export interface ApiTemplate {
    id: string;
    name: string;
    previewUrl: string | null;
    tags: string[];
    category: string;
    tone: string;
    bestFor: string;
    complexity: string;
    slidesSupported: number;
}

export interface ApiInspirationImage {
    id: string;
    category: string;
    categoryName: string;
    url: string;
    filename: string;
}

export interface ApiInspirationResponse {
    categories: { id: string; name: string; tags: string[] }[];
    images: ApiInspirationImage[];
}

export const api = {
    async getTemplates(): Promise<ApiTemplate[]> {
        const res = await fetch(`${API_BASE}/templates`);
        if (!res.ok) throw new Error('Failed to fetch templates');
        return res.json();
    },

    async getInspiration(): Promise<ApiInspirationResponse> {
        const res = await fetch(`${API_BASE}/inspiration`);
        if (!res.ok) throw new Error('Failed to fetch inspiration');
        return res.json();
    },

    async getProjects(): Promise<any[]> {
        const res = await fetch(`${API_BASE}/projects`);
        if (!res.ok) throw new Error('Failed to fetch projects');
        return res.json();
    },

    async getProject(id: string): Promise<any> {
        const res = await fetch(`${API_BASE}/projects/${id}`);
        if (!res.ok) throw new Error('Failed to fetch project');
        return res.json();
    },

    async saveProject(data: any): Promise<any> {
        const res = await fetch(`${API_BASE}/projects`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
        });
        if (!res.ok) throw new Error('Failed to save project');
        return res.json();
    },

    async regenerateSlide(data: any): Promise<{ success: boolean; imageUrl: string; text?: string }> {
        const res = await fetch(`${API_BASE}/generate/single`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
        });
        if (!res.ok) throw new Error('Failed to regenerate slide');
        return res.json();
    },

    getDownloadUrl(projectId: string): string {
        return `${API_BASE}/download/${projectId}`;
    },

    async translateProject(projectId: string, targetLanguage: string): Promise<any> {
        const res = await fetch(`${API_BASE}/translate`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ projectId, targetLanguage }),
        });
        if (!res.ok) throw new Error('Failed to translate project');
        return res.json();
    },

    // Note: /api/generate is handled via EventSource in the component, not here.
};
