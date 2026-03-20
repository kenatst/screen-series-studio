# Plan d'amélioration : Qualité & Organisation des outputs

## 1. RESIZE PIXEL-PERFECT (remplacer Gemini par Canvas/Sharp)

**Problème** : `resize-slides` utilise Gemini pour "re-générer" l'image dans un autre format.
C'est lent, coûteux (1 crédit/slide), et la qualité varie.

**Solution** : Pour les formats iPhone 6.5" → 6.9" (même aspect ratio 9:16),
faire un simple resize Canvas côté serveur (pas besoin d'IA).
Pour iPad 12.9" (3:4), garder Gemini car l'aspect ratio change = recomposition nécessaire.

**Fichiers** :
- `supabase/functions/resize-slides/index.ts` → ajouter Canvas resize pour 9:16→9:16
- Garder Gemini uniquement pour 9:16→3:4 (iPad)

## 2. STORAGE ORGANISÉ PAR DOSSIERS

**Avant** (flat) :
```
{userId}/{projectId}/slide-1.png
{userId}/{projectId}/slide-1-6-9.png
{userId}/{projectId}/slide-1-ipad.png
{userId}/{projectId}/slide-1-french.png
{userId}/{projectId}/slide-1-6-9-spani.png
```

**Après** (organisé) :
```
{userId}/{projectId}/6-5/en/slide-1.png
{userId}/{projectId}/6-5/fr/slide-1.png
{userId}/{projectId}/6-9/en/slide-1.png
{userId}/{projectId}/6-9/fr/slide-1.png
{userId}/{projectId}/12-9/en/slide-1.png
{userId}/{projectId}/12-9/fr/slide-1.png
```

**Fichiers impactés** :
- `generate-screenshots/index.ts` → storage path
- `resize-slides/index.ts` → storage path
- `translate-copy/index.ts` → storage path
- `export-zip/index.ts` → lecture paths
- `src/pages/Results.tsx` → résolution URLs
- `src/lib/storage-utils.ts` → signed URLs
- DB: `project_slides.image_url` → nouveau format path
- DB: `project_translations.storage_path` → nouveau format path

## 3. DOWNLOAD ZIP PROPRE

**Structure ZIP** :
```
MonApp/
├── 6-5/
│   ├── en/
│   │   ├── slide-01.png
│   │   └── slide-02.png
│   ├── fr/
│   │   ├── slide-01.png
│   │   └── slide-02.png
│   └── es/
│       └── ...
├── 6-9/
│   ├── en/
│   │   └── ...
│   └── fr/
│       └── ...
└── 12-9/
    ├── en/
    │   └── ...
    └── fr/
        └── ...
```

## 4. QUALITÉ : AMÉLIORATIONS PROMPT

- Afficher le quality_score dans le UI (SlideDetailPanel)
- Utiliser le `consistencyLevel` (strict/balanced/exploratory) dans le prompt
- Meilleur retry : 2 tentatives max avec prompt affiné
- Validation post-génération : vérifier que le texte est bien rendu

## 5. WORKFLOW SIMPLIFIÉ

Ordre des opérations :
1. Générer tous les slides en 6.5" / English (base)
2. L'utilisateur review et valide
3. Bouton "Générer tous les formats" → resize 6.9" + recomposition iPad
4. Bouton "Traduire" → traduit pour chaque size séparément
5. Export ZIP final = structure propre par dossier

## Ordre d'implémentation

1. ✅ Storage paths organisés (migration + tous les edge functions)
2. ✅ Canvas resize pour 6.9" (remplace Gemini quand même aspect ratio)
3. ✅ ZIP export avec nouvelle structure
4. ✅ Quality score visible dans le UI
5. ✅ Prompt improvements
