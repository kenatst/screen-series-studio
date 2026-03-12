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
