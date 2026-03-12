# 🔍 SHOTAPP.AI — THE ULTIMATE MASTER AUDIT & ARCHITECTURAL DEEP-DIVE

This report is a **no-holds-barred, exhaustive technical and functional audit** of the current ShotApp AI platform. It covers everything from the highest-level frontend architecture to the deepest backend quirks and security vulnerabilities.

---

## 🏗️ 1. ARCHITECTURE & CODE HYGIENE

### 🚨 The "God Component" Disease (`NewProject.tsx` & `Results.tsx`)
*   **Problem**: `src/pages/NewProject.tsx` is a **67KB monolithic file**. It is trying to be a database manager, an image processing lab, a drag-and-drop canvas, and a 7-step UI wizard all at once.
*   **Impact**: Every small state change (like typing an app name) triggers a reconciliation of thousands of DOM nodes. It's a maintenance nightmare.
*   **Verdict**: **FAILING**. Must be broken into:
    *   `NewProjectContext.tsx`: To share data across steps.
    *   `Steps/StepAppInfo.tsx`, `Steps/StepScreens.tsx`, etc.
    *   `hooks/useColorExtraction.ts`: Decouple logic from UI.

### 🧹 Dependency Bloat
*   **Problem**: We found `express`, `multer`, `cors`, and `dotenv` in a **Vite/React** project. These are server side Node.js dependencies and have zero utility in a frontend SPA.
*   **Action Taken**: I have already uninstalled these.
*   **Remaining**: Check `package.json` for unused shadcn/ui components that were installed via `npx` but never imported.

---

## 🎨 2. FRONTEND & UX REVIEW

### 🎞️ Landing Page Optimization
*   **The "Marquee" Trap**: The `Gallery` section now uses two rows of scrolling marquess. Each row duplicates the entire gallery array twice. If you have 20 high-res gallery images, you are now rendering **80 images** simultaneously.
*   **Risk**: Massive LCP (Largest Contentful Paint) issues on mobile and poor Lighthouse scores.
*   **Fix**: Already added `loading="lazy"` and `decoding="async"` but ideally, these should be low-res placeholders that swap to 2K assets only on hover or click.

### 🖱️ User Workflow: The Iterative Shift
*   **Current**: Sequential fetching in `Generating.tsx` is fragile.
*   **New Requirement**: You want a **Slide-by-Slide** approval flow. 
*   **Defect**: `Generating.tsx` is currently hardcoded for a batch-oriented experience. It lacks the "Approval State" UI where the generation pauses to wait for user feedback.
*   **Workflow Improvement**: Slide 1 should generate -> Pause UI -> Display "Approve/Fix" -> If Fix, send `user_feedback` to Edge Function -> If Approve, send `approve_next` signal.

---

## ⚙️ 3. BACKEND & AI PIPELINE (`generate-screenshots`)

### 🧠 Context Chaining (The "Previous Slides" Logic)
*   **Strength**: The logic to pull previous slide images and inject them as visual references for Gemini is already in place.
*   **Risk**: As the user progresses to Slide 10, you are sending **9 previous 2K images + brand assets + new raw screen**. This will hit the **Gemini multimodal context window limits** (though 3.1 Flash has 1M+ tokens, the pixel data counts for a lot).
*   **Optimisation**: Send high-res for the "previous 2 slides" and low-res thumbnails for the "older slides" to maintain consistency without choking the token budget.

### 🛡️ Security & Credit Protection
*   **Critical Vulnerability**: Supabase Auth signups. Without CAPTCHA, a script can generate 1,000 accounts = 3,000 free credits = $100s in Gemini API cost.
*   **Fix**: **MUST ENABLE hCaptcha** in Supabase Auth settings immediately.
*   **Credit Logic**: The credit deduction is currently done *before* the Edge Function starts. If the AI crashes or Deno times out, the user loses a credit for nothing.
*   **Fix**: Implement a "Pending Credit" system or an automatic refund webhook if the slide status is never set to 'completed' within 5 minutes.

---

## 🎭 4. FUNCTIONAL DEFECTS & "USELESS THINGS"

*   **Duplicated Logic**: `Results.tsx` and `Dashboard.tsx` both have logic for opening the Stripe Portal and handling upgrades. This should be a single utility: `lib/stripe.ts` or a hook `useBilling()`.
*   **Realtime Profiles**: I implemented the realtime listener in `useAuth.tsx`. However, the app still polls `check-subscription` every 60 seconds. This is **redundant** and wastes Supabase Function calls. If realtime is working, the polling should be removed.
*   **Notfound Page**: It's a generic shadcn template. It should have a brand-aligned "Lost in the consistency layer?" messaging.

---

## 🚀 ROADMAP TO REFECTION (Next Steps for Lovable)

1.  **Refactor `NewProject.tsx`**: Break it down. It's the #1 technical debt.
2.  **Client-Side ZIP**: Move `export-zip` logic to the browser using `JSZip`. The Edge Function will eventually hit RAM limits for 10-slide high-res sets.
3.  **Interactive Generating UI**: Build the "Pause & Pulse" UI for the one-by-one generation flow.
4.  **Security Lockdown**: hCaptcha + Rate Limiting.

**VERDICT**: The product is visually "God-Tier", but the internal architecture is "Spaghetti-Tier". Refactor now before adding more features.

---
*Audit conducted by Antigravity AI — 2026.*
