# 🚀 Handover Instructions for Lovable

Hi Lovable! I've completed a massive Full-Stack Deep Audit on **ShotApp AI**. I've already patched the critical serverless security flaws, implemented idempotency, added real-time credit syncing, aligned the landing page UI beautifully, and cleaned up the node dependencies.

However, there are a few **major architectural refactors** that require your robust component-generation capabilities to tackle next.

### 📋 Your Action Items

1. **Deconstruct the "God Component" (`NewProject.tsx`)**
   - The file `src/pages/NewProject.tsx` is >1200 lines long and handles 7 different wizard steps, massive local state, drag-and-drop, and API uploading.
   - **Task:** Break it down into a `<ProjectWizardProvider>` (context) and split the UI into tiny, maintainable step components (e.g., `Step1_ProjectInfo.tsx`, `Step2_AppInfo.tsx`, etc.). Separate business logic (like color extraction) into custom hooks like `useAssetProcessing()`.

2. **Migrate ZIP Generation to the Client-Side**
   - In `src/pages/Results.tsx`, clicking "Export ZIP" currently hits the `export-zip` Edge Function.
   - This poses a huge risk of edge function memory (RAM) exhaustion when combining 30+ high-res images in Node memory limit zones.
   - **Task:** Refactor `Results.tsx` to use the `jszip` and `file-saver` libraries. Fetch the images from Supabase Storage securely, construct the ZIP entirely in the user's browser, and trigger a local download. Drop the Edge Function entirely.

3. **Background Generation Queueing (UX)**
   - Right now, `Generating.tsx` initiates the generation through a long-polling fetch. If the user refreshes or closes the tab, the UI breaks (even though the Edge Function might finish in the background).
   - **Task:** Move away from making the user wait on the `fetch` response. Use Supabase Realtime to listen for `project_slides` changes where `status === 'completed'`. Have `Generating.tsx` just pull from the DB subscription rather than holding a pending request.

Thanks! The repository is fully committed and ready for you to take over.
