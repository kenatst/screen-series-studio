# AUDIT COMPLET DU SITE - ShotApp AI

**Date**: 16 mars 2026
**Portée**: Frontend, Workflow, Composants, Boutons, Redirections, API, Sécurité, i18n, SEO
**Projet**: Screen Series Studio (ShotApp AI)
**Stack**: React 18 + Vite + TypeScript + Tailwind + Supabase + Shadcn/UI

---

## TABLE DES MATIÈRES

1. [PROBLÈMES CRITIQUES (à corriger immédiatement)](#1-problèmes-critiques)
2. [Sécurité & Authentification](#2-sécurité--authentification)
3. [Routing & Redirections](#3-routing--redirections)
4. [Boutons & Éléments interactifs cassés](#4-boutons--éléments-interactifs-cassés)
5. [Internationalisation (i18n) - Textes non traduits](#5-internationalisation-i18n)
6. [Accessibilité (a11y)](#6-accessibilité-a11y)
7. [Gestion d'erreurs manquante](#7-gestion-derreurs-manquante)
8. [États UI manquants (loading, empty, error)](#8-états-ui-manquants)
9. [Validation de formulaires](#9-validation-de-formulaires)
10. [Performance](#10-performance)
11. [SEO & Meta tags](#11-seo--meta-tags)
12. [Configuration & Build](#12-configuration--build)
13. [Facturation & Crédits](#13-facturation--crédits)
14. [Edge Functions Supabase](#14-edge-functions-supabase)
15. [Code mort & console.log](#15-code-mort--consolelog)
16. [Résumé & Priorisation](#16-résumé--priorisation)

---

## 1. PROBLÈMES CRITIQUES

### 1.1 Fichier `.env` commité dans Git (CRITIQUE!)
- **Fichier**: `.env`
- Le fichier `.env` contient des credentials Supabase réels et est suivi par Git
- Credentials exposés : `VITE_SUPABASE_PROJECT_ID`, `VITE_SUPABASE_PUBLISHABLE_KEY`, `VITE_SUPABASE_URL`
- **`.gitignore` ne contient PAS `.env`** - entrées manquantes : `.env`, `.env.local`, `.env.*.local`
- **Action**: Supprimer de l'historique Git (`git filter-repo`), ajouter au `.gitignore`, rotater les clés

### 1.2 Pas de validation de propriété des projets (CRITIQUE!)
- **Fichiers**: `generate-screenshots/index.ts`, `translate-copy/index.ts`, `export-zip/index.ts`
- Les edge functions Supabase chargent les projets par ID sans vérifier que `project.user_id === userId`
- **Risque**: N'importe quel utilisateur authentifié peut générer/traduire/exporter les projets d'un autre utilisateur
- **Action**: Ajouter une vérification `project.user_id === userId` dans toutes les edge functions

### 1.3 Condition d'hydratation inversée dans le contexte
- **Fichier**: `src/contexts/NewProjectContext.tsx:281`
- `if (!editProjectId || !existingSlides?.length || hydrated === false) return;`
- La condition sort si `hydrated === false` mais l'état initial est `false` - les slides ne s'hydratent jamais
- **Action**: Corriger la logique de condition

---

## 2. SÉCURITÉ & AUTHENTIFICATION

| # | Problème | Fichier | Sévérité |
|---|----------|---------|----------|
| 2.1 | Pas de validation de propriété projet dans les routes protégées | `App.tsx:30-36` | Haute |
| 2.2 | Assets récupérés sans vérifier la propriété | `NewProjectContext.tsx:305-340` | Haute |
| 2.3 | Rate limiting en mémoire sans nettoyage (fuite mémoire) | `generate-screenshots/index.ts:268-275` | Moyenne |
| 2.4 | Chargement de fichiers i18n depuis chemin public sans validation | `i18n/index.ts:15-16` | Basse |
| 2.5 | Race condition dans la suppression de compte | `delete-account/index.ts:48` | Moyenne |
| 2.6 | Variables d'environnement Supabase non validées côté client | `integrations/supabase/client.ts:5-6` | Moyenne |

---

## 3. ROUTING & REDIRECTIONS

| # | Problème | Fichier:Ligne | Impact |
|---|----------|---------------|--------|
| 3.1 | Pas de redirection `/login` → `/` si déjà authentifié | `App.tsx` | UX confuse |
| 3.2 | Route `/project/:projectId/planner` sémantiquement confuse avec `/project/new` | `App.tsx:35` | Maintenance |
| 3.3 | URL de redirection hardcodée dans HeroSection | `HeroSection.tsx:53` | Fragile |
| 3.4 | Numéros d'étapes hardcodés dans les URLs d'upgrade | `StepStyle.tsx:99,110` | Cassera si les étapes changent |
| 3.5 | Template ID non validé avant navigation | `Templates.tsx:143` | Navigation vers template invalide |
| 3.6 | Lien mailto sans fallback support | `AppSidebar.tsx:22` | Pas de support si email down |

---

## 4. BOUTONS & ÉLÉMENTS INTERACTIFS CASSÉS

| # | Problème | Fichier:Ligne | Impact |
|---|----------|---------------|--------|
| 4.1 | **"Privacy Policy"** et **"Terms of Service"** sont des `<span>` sans lien ni onClick | `LandingFooter.tsx:33-34` | Légal - pas de page légale accessible |
| 4.2 | **Bouton "Lock"** sur les slides sans aucun handler onClick | `SortableSlide.tsx:126` | Bouton mort |
| 4.3 | **Bouton "Archive"** dans Generating.tsx - texte confus, devrait être "Stop & Archive" | `Generating.tsx:442` | UX confuse |
| 4.4 | **Badge plan** dans Dashboard sans rôle sémantique | `Dashboard.tsx:99-129` | Non cliquable mais apparaît cliquable |
| 4.5 | **Logos "Trusted By"** avec hover effect mais non interactifs | `TrustedBy.tsx:38` | Hover trompeur |

---

## 5. INTERNATIONALISATION (i18n)

### Couverture actuelle
- **Traduit** (35 clés EN/FR/DE/ES/JA/HI/TR/ZH/AR) : nav, hero, consistency, pricing, faq, footer de la landing page
- **NON traduit** : Tout le reste (dashboard, formulaires, settings, modals, toasts, etc.)

### Pages avec textes hardcodés (non traduits)

| Page/Composant | Exemples de textes hardcodés | Priorité |
|----------------|------------------------------|----------|
| `Dashboard.tsx` | "Create, edit, and export...", "Create your first screenshot set..." | Haute |
| `Login.tsx` | "ShotApp AI", "Sign in", "Forgot password?", placeholders | Haute |
| `Settings.tsx` | "Manage your account...", "Your generation balance", labels crédits | Haute |
| `Generating.tsx` | Phases ("Analyzing", "Processing"...), messages statut, "Want changes?" | Haute |
| `Results.tsx` | "No images to export", "Free plan only previews slide 1" | Haute |
| `NewProject.tsx` | Labels étapes ("Project", "App Info", "Screens"...), "Save draft", "Back", "Continue" | Haute |
| `NotFound.tsx` | "System anomaly. Path does not exist.", "Return to Hub" | Moyenne |
| `Templates.tsx` | Placeholder recherche, emojis moods (🌙, ☀️, 🌈) | Moyenne |
| **Composants new-project** | |
| `StepProject.tsx` | "App name", "Platform", "Target audience", "Primary goal", tous les labels | Haute |
| `StepAppInfo.tsx` | "Short description", "Long description", "Value proposition"... | Haute |
| `StepBrandKit.tsx` | "Brand kit", "Brand colors", "Brand font", labels options | Haute |
| `StepScreens.tsx` | "Upload raw screens", "Drag & drop your app screenshots" | Haute |
| `StepReview.tsx` | "Pre-generation review", tous les labels récapitulatifs | Haute |
| **Composants landing** | |
| `FaqSection.tsx` | Toutes les questions/réponses FAQ (8-49) | Haute |
| `BatchGenerationGrid.tsx` | "Generate 10 perfect visuals in one click." | Moyenne |
| `ConsistencyEngine.tsx` | Feature pills ("Shared color logic", etc.) | Moyenne |
| `Gallery.tsx` | Titres galerie ("HabitForge", "Mental Model"...) | Basse |

**Estimation**: ~200+ chaînes de texte à internationaliser

---

## 6. ACCESSIBILITÉ (a11y)

| # | Problème | Fichier:Ligne | Standard WCAG |
|---|----------|---------------|---------------|
| 6.1 | Boutons filtres sans `aria-selected`/`aria-current` | `Templates.tsx:96-135` | 4.1.2 |
| 6.2 | Sélecteur de langue sans `aria-expanded`, `aria-haspopup` | `LandingNav.tsx:46` | 4.1.2 |
| 6.3 | Icône Google SVG sans `role="img"` ni `aria-label` | `Login.tsx:100-105` | 1.1.1 |
| 6.4 | Labels non connectés via `htmlFor` | `Login.tsx:116,131,151` | 1.3.1 |
| 6.5 | Icônes décoratives sans `aria-hidden="true"` | `Login.tsx:119,159` | 1.1.1 |
| 6.6 | Handle de drag sans attributs ARIA | `SortableSlide.tsx:64-69` | 4.1.2 |
| 6.7 | Pas d'annonce ARIA live pendant la génération | `Generating.tsx:488-491` | 4.1.3 |
| 6.8 | Spinners de chargement sans `aria-label` | `Results.tsx:254`, `Generating.tsx:507` | 1.1.1 |
| 6.9 | Emojis dans les labels boutons (confusion screen readers) | `StepStyle.tsx:219` | 1.1.1 |
| 6.10 | Avatar utilisateur cliquable sans `aria-label` | `DashboardLayout.tsx:61` | 4.1.2 |
| 6.11 | Indicateur de progression sans attributs ARIA | `NewProject.tsx:30-45` | 4.1.2 |
| 6.12 | Alt text images non descriptif | `Gallery.tsx:87` | 1.1.1 |
| 6.13 | `h1` avec gradient texte - problèmes de lisibilité potentiels | `NotFound.tsx:17` | 1.4.3 |
| 6.14 | Section crédits avec fond gradient - contraste texte | `Settings.tsx:111-123` | 1.4.3 |

---

## 7. GESTION D'ERREURS MANQUANTE

| # | Problème | Fichier:Ligne |
|---|----------|---------------|
| 7.1 | Erreurs auth génériques sans message utilisateur clair | `Login.tsx:35-57` |
| 7.2 | Erreurs 402/401 dans Generating sans guidage utilisateur | `Generating.tsx:219-220` |
| 7.3 | Catch block qui log seulement en console | `Generating.tsx:312-317` |
| 7.4 | Résolution d'images qui échoue silencieusement (catch vide) | `Results.tsx:51-66` |
| 7.5 | Boucle de téléchargement qui skip silencieusement les erreurs | `Results.tsx:112-118` |
| 7.6 | `createSignedUrl` failback vers path storage (non-URL) | `useProjects.ts:67-80` |
| 7.7 | `suggest-copy` erreurs non loggées | `suggest-copy/index.ts:157-164` |
| 7.8 | Auto-fill sans vérification de crédits préalable | `NewProjectContext.tsx:516-534` |
| 7.9 | Erreur de génération laisse le projet en état "generating" | `generate-screenshots/index.ts:699-703` |
| 7.10 | Erreurs silencieusement avalées dans StepStyle | `StepStyle.tsx:65` - `.catch(() => undefined)` |

---

## 8. ÉTATS UI MANQUANTS

| # | Type | Fichier | Détail |
|---|------|---------|--------|
| 8.1 | Loading sans texte | `Dashboard.tsx:165-168` | Spinner seul, pas de message |
| 8.2 | Pas d'état vide si slides=null après chargement | `Results.tsx` | Écran blanc possible |
| 8.3 | Pas de skeleton de chargement pour les thumbnails | `ProjectThumbnail.tsx:9-44` | Div vide pendant fetch |
| 8.4 | Erreur persistante après fermeture modale | `TranslationsModal.tsx:45-99` | Ancien message d'erreur visible |
| 8.5 | `isTranslating` pas reset à la fermeture modale | `TranslationsModal.tsx:38-42` | État incohérent au réouverture |
| 8.6 | Pas de feedback si draft non sauvegardé | `NewProject.tsx:47-51` | Utilisateur ne sait pas |
| 8.7 | Template tab switchable pendant chargement recommandations | `StepStyle.tsx:135-136` | Race condition possible |

---

## 9. VALIDATION DE FORMULAIRES

| # | Problème | Fichier:Ligne |
|---|----------|---------------|
| 9.1 | Pas d'indicateur de force mot de passe à l'inscription | `Login.tsx` |
| 9.2 | Pas de validation email côté serveur après validation client | `Login.tsx:114-174` |
| 9.3 | Password min 8 sans requirement de complexité | `Settings.tsx:54` |
| 9.4 | Pas de validation des champs requis avant passage à l'étape suivante | `NewProject.tsx:82-88` |
| 9.5 | Textarea feedback sans limite min/max de caractères | `Generating.tsx:539` |
| 9.6 | Textarea régénération sans limite de caractères | `Results.tsx:350` |
| 9.7 | `toggleFormat` permet de désélectionner tous les formats | `NewProjectContext.tsx:342-344` |
| 9.8 | Template ID non validé contre la liste des templates existants | `NewProjectContext.tsx:636` |
| 9.9 | Code langue non validé dans generate-screenshots | `generate-screenshots/index.ts:161` |

---

## 10. PERFORMANCE

| # | Problème | Fichier:Ligne | Impact |
|---|----------|---------------|--------|
| 10.1 | Galerie sans `React.memo`, items dupliqués dans array | `Gallery.tsx:79-137` | Re-renders inutiles |
| 10.2 | Fingerprint JSON.stringify à chaque render | `StepStyle.tsx:42-92` | Lag avec gros uploads |
| 10.3 | Array de couleurs recréé à chaque render | `WorkflowScrollytelling.tsx:73-75` | Mineur |
| 10.4 | Features visuels JSX recréés à chaque render | `FeatureShowcase.tsx:242-276` | Moyen |
| 10.5 | `TOAST_REMOVE_DELAY = 1000000` (~11.5 jours!) | `use-toast.ts:6` | Fuite mémoire |
| 10.6 | Listeners de toast grandissent indéfiniment | `use-toast.ts` | Fuite mémoire sessions longues |
| 10.7 | Rate limit map en mémoire sans TTL | `generate-screenshots/index.ts:268` | Fuite mémoire serveur |

---

## 11. SEO & META TAGS

**Fichier**: `index.html`

| # | Manquant | Impact |
|---|----------|--------|
| 11.1 | `<meta property="og:url">` | Partage social incorrect |
| 11.2 | `<meta name="twitter:title">` et `twitter:description` | Twitter Card incomplet |
| 11.3 | `<link rel="canonical">` | Problème contenu dupliqué |
| 11.4 | `<meta name="robots">` | Pas d'instruction crawling |
| 11.5 | `<meta property="og:locale">` | Langue non spécifiée pour OG |
| 11.6 | `<meta name="theme-color">` | Barre navigateur mobile ne match pas |
| 11.7 | `class="dark"` hardcodé sur `<html>` | FOUC si utilisateur préfère mode clair |

---

## 12. CONFIGURATION & BUILD

### TypeScript trop permissif
- `tsconfig.app.json` : `strict: false`, `noImplicitAny: false`, `noUnusedLocals: false`, `noUnusedParameters: false`
- Réduit la qualité du code et masque des bugs potentiels

### Tailwind Config
- `tailwind.config.ts:5` : Chemin `"./pages/**/*.{ts,tsx}"` inexistant (devrait être uniquement `"./src/**/*.{ts,tsx}"`)
- Animations `float` et `pulse-glow` dans `index.css` mais absentes du `tailwind.config.ts`

### Vite Config
- `vite.config.ts:9` : `host: "::"` (IPv6 only) - peut causer des problèmes sur réseaux IPv4
- `vite.config.ts:12` : HMR overlay désactivé - erreurs cachées en dev

### CSS
- `index.css:197-201` : `.glass-card` avec couleur blanc hardcodée, ne respecte pas le dark mode
- `index.css:203-205` : `.border-glow` avec valeur HSL hardcodée au lieu de variable CSS

---

## 13. FACTURATION & CRÉDITS

| # | Problème | Fichier | Sévérité |
|---|----------|---------|----------|
| 13.1 | Logique de recharge crédits incohérente entre check-subscription et stripe-webhook | `check-subscription/index.ts:128-129` | Haute |
| 13.2 | Allocation crédits différente pour mêmes types d'événements Stripe | `stripe-webhook/index.ts:79,114,146,156` | Haute |
| 13.3 | suggest-copy vérifie les crédits mais ne les débite jamais | `suggest-copy/index.ts:35-36` | Moyenne |
| 13.4 | Utilisateurs qui upgrade perdent les crédits extra | `check-subscription/index.ts:128-129` | Haute |
| 13.5 | `slideCount` initialisé à 5 même si plan gratuit (maxSlides=1) | `NewProjectContext.tsx:193-196` | Moyenne |

---

## 14. EDGE FUNCTIONS SUPABASE

| # | Problème | Fonction | Sévérité |
|---|----------|----------|----------|
| 14.1 | **Pas de validation propriété projet** dans generate-screenshots | `generate-screenshots/index.ts:342` | CRITIQUE |
| 14.2 | **Pas de validation propriété projet** dans translate-copy | `translate-copy/index.ts:62` | CRITIQUE |
| 14.3 | **Pas de validation propriété projet** dans export-zip | `export-zip/index.ts:153` | CRITIQUE |
| 14.4 | ZIP exporte le même `image_url` pour tous les formats device | `export-zip/index.ts:180` | Haute |
| 14.5 | Versions modèle Gemini incohérentes entre fonctions | `generate-screenshots:59 vs 629` | Moyenne |
| 14.6 | Erreurs non loggées dans suggest-copy | `suggest-copy/index.ts:159-160` | Basse |

---

## 15. CODE MORT & CONSOLE.LOG

### Console.log/error en production
| Fichier:Ligne | Contenu |
|--------------|---------|
| `Dashboard.tsx:79` | `console.error("Archive error:", err)` |
| `Generating.tsx:315` | `console.error("[Generating] request failed", e)` |
| `Results.tsx:127` | `console.error("Download failed", e)` |
| `TranslationsModal.tsx:93` | `console.error('Translation error:', err)` |
| `NotFound.tsx:8` | `console.error("404 Error: ...")` |

### Code mort / inutilisé
| Fichier:Ligne | Détail |
|--------------|--------|
| `Dashboard.tsx:36` | `isCheckingSub` state initialisé mais `setIsCheckingSub` jamais appelé |
| `App.css` | Fichier vide (seulement un commentaire) |
| `StepPlanner.tsx:23` | Transformation de données redondante (même type déjà disponible) |

---

## 16. RÉSUMÉ & PRIORISATION

### Comptage total des problèmes

| Catégorie | Nombre | Sévérité |
|-----------|--------|----------|
| Sécurité / Auth | 8 | CRITIQUE-Haute |
| Boutons / Éléments cassés | 5 | Haute |
| i18n (textes non traduits) | ~200+ chaînes | Haute |
| Accessibilité | 14 | Haute |
| Gestion d'erreurs | 10 | Haute |
| États UI manquants | 7 | Moyenne |
| Validation formulaires | 9 | Moyenne |
| SEO / Meta | 7 | Moyenne |
| Performance / Mémoire | 7 | Moyenne |
| Facturation / Crédits | 5 | Haute |
| Edge Functions | 6 | CRITIQUE-Haute |
| Config / Build | 7 | Basse-Moyenne |
| Code mort / Logs | 8 | Basse |
| **TOTAL** | **~93+ problèmes** | |

### Plan d'action recommandé

#### Phase 1 - URGENT (Semaine 1)
1. Retirer `.env` de Git et rotater les clés Supabase
2. Ajouter validation propriété projet dans TOUTES les edge functions
3. Corriger la condition d'hydratation dans NewProjectContext
4. Corriger la logique de crédits/facturation incohérente

#### Phase 2 - HAUTE PRIORITÉ (Semaines 2-3)
5. Rendre Privacy Policy et Terms of Service cliquables (pages légales)
6. Supprimer bouton "Lock" non fonctionnel ou implémenter la feature
7. Ajouter les meta tags SEO manquants
8. Implémenter la gestion d'erreurs pour toutes les opérations async
9. Ajouter les états loading/empty/error manquants
10. Valider les formulaires avant navigation entre étapes

#### Phase 3 - MOYENNE PRIORITÉ (Semaines 3-4)
11. Internationaliser les ~200+ chaînes de texte restantes
12. Corriger tous les problèmes d'accessibilité WCAG
13. Corriger les fuites mémoire (toast, rate limit)
14. Activer TypeScript strict mode progressivement
15. Corriger la config Tailwind (chemins, animations)

#### Phase 4 - MAINTENANCE (Ongoing)
16. Remplacer tous les `console.error` par un service de logging
17. Supprimer le code mort
18. Optimiser les performances (memoization, re-renders)
19. Ajouter des tests unitaires et d'intégration

---

*Rapport généré le 16 mars 2026 - Audit exhaustif frontend, backend, workflow, sécurité, i18n, a11y, SEO*
