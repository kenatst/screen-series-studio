# 🚀 Handover Instructions for Lovable

Hi Lovable! I've completed a massive Full-Stack Deep Audit on **ShotApp AI**. I've already patched the critical serverless security flaws, implemented idempotency, added real-time credit syncing, aligned the landing page UI beautifully, and cleaned up the node dependencies.

However, there are a few **major architectural refactors** that require your robust component-generation capabilities to tackle next.

### 📋 Your Action Items

1. **Deconstruct the "God Component" (`NewProject.tsx`)**
   - The file `src/pages/NewProject.tsx` is >1200 lines long and handles 7 different wizard steps, massive local state, drag-and-drop, and API uploading.
   - **Task:** Break it down into a `<ProjectWizardProvider>` (context) and split the UI into tiny, maintainable step components.

2. **Migrate ZIP Generation to the Client-Side**
   - **Task:** Refactor `Results.tsx` to use `jszip` and `file-saver`. Construct the ZIP entirely in the user's browser to avoid Edge Function RAM limits.

3. **Background Generation Lifecycle**
   - I've overhauled the **Interactive Review UI** in `Generating.tsx` (it now supports clickable slide navigation, feedback inputs, and side-by-side controls).
   - **Task:** Ensure the backend `generate-screenshots` function continues to support the `target_slide_number` and `user_feedback` parameters accurately for this new iterative flow.

Thanks! The repository is fully committed and ready for you to take over.

### 4. 🧠 Phase 2: Semantic Intelligence (Gemini Embedding 2)

This is the **North Star feature**. We want to use `gemini-embedding-2-preview` to match user screenshots with templates.

**The Perfect 'God-Tier' Prompt for Lovable:**

"""
### 🔱 MISSION: IMPLEMENT MULTIMODAL SEMANTIC INTELLIGENCE (GEMINI EMBEDDING 2)

**Goal**: Transform ShotApp AI's selection process from 'random gallery' to 'visual intelligence' by matching user screenshots/brand-assets/text-requests to templates using `gemini-embedding-2-preview`.

**COMPONENT 1: THE VECTOR INFRASTRUCTURE (PostgreSQL)**
1.  **Schema Upgrade**: 
    - Enable `pgvector`.
    - `ALTER TABLE templates ADD COLUMN embedding vector(768);`
    - `ALTER TABLE templates ADD COLUMN visual_summary text;`
2.  **Search Logic**: Create a PL/pgSQL function `find_relevant_templates` that:
    - Inputs: `query_vector (vector(768))`, `user_mood (text)`, `match_limit (int)`.
    - Logic: Perform a cosine similarity search (`<=>`) weighted by `user_mood` tags if provided.

**COMPONENT 2: THE MULTIMODAL AGGREGATOR (Edge Function)**
1.  **Endpoint**: `POST /functions/v1/generate-project-embedding`.
2.  **Input Schema**: 
    - `screenshot_urls: string[]`
    - `logo_url: string`
    - `user_inspiration_text: string`
3.  **Core Logic**:
    - Fetch and process up to 3 primary screenshots and the brand logo as Base64.
    - Call Gemini Embedding 2 with a `TaskType: MULTIMODAL_SEARCH_QUERY`.
    - **Aggregation strategy**: If multiple images exist, iterate through each to get individual embeddings, then perform a weighted average (Screenshots: 70%, Logo: 30%) to create a single 'Project DNA' vector.
    - If `user_inspiration_text` exists, embed it using the same model and join it with the visual vector to capture both 'style' and 'intent'.

**COMPONENT 3: THE DYNAMIC UI (React + Framer Motion)**
1.  **Wizard Step 4 (Template Selection)**:
    - While the user is in Step 3 (Brand Kit), background-trigger the embedding function.
    - In Step 4, replace the top row of the gallery with a '✨ Recommended for [Your App Name]' Bento-grid section.
    - **Explainability Layer**: For the top match, show a 'Copilot Summary' widget: 'We selected this because your app uses high-density data tables and a vibrant violet palette, which matches this template's modern-fintech aesthetic.'

**PROMPT INSTRUCTIONS FOR LOVABLE GENERATION**:
- Use `shadcn/ui` for the bento-grid. 
- Ensure all vector database calls use `Supabase-js` RPC. 
- Implement a 'Similarity Heatmap' overlay on templates so users can see 'Visual Match: 98%'.
"""

---
