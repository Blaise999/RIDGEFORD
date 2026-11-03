# Ridgeford · European-first redesign

This package is an evolution of the uploaded site, not a replacement. The original logo components, brand assets, `src/components/hero/ScrollSequence.tsx`, `src/lib/hero-motion.ts`, and the existing EUR coverage, payment, features and pricing sections are preserved. Frankfurt remains the bank's stated headquarters, with a **Stamford, Connecticut U.S. office** in the site copy. The visual hierarchy is approximately **70% EUR / 30% USD**.

## What changed

- Brand typography and hierarchy: Manrope for headings, DM Sans for body and interface copy, IBM Plex Mono for figures, Instrument Serif only for editorial italic accents. No font files are redistributed.
- Hero: same three scroll-controlled plates, same animation and frame paths, but more readable headlines, shorter copy, clearer locations and currencies, stronger call to action and more legible readouts. The existing brand splash animation is retained but shortened from 3.8 seconds to roughly 2.1 seconds, so the main content appears sooner.
- Navigation: the U.S. desk now has a primary link; European market coverage remains prominently linked.
- News: a 70/30 EUR/USD editorial layout, three dated ECB sources and three dated U.S. (Federal Reserve / Reuters) stories. External headlines are curated, **not live or automatically refreshed**; update dates and links as news changes.
- USD content appears after the European news feed, not after everything else. All original euro sections remain.
- Updated prior Houston mentions to Stamford, Connecticut. Do not present an invented office street address or a U.S. banking charter.
- Existing USD/EUR account selection remains in both signup and administrator account creation; EUR remains the default.

## GitHub: get the actual motion frames back

The uploaded ZIP contains Git **LFS pointers** rather than the real WebP image data. That's why previewing this ZIP without Git LFS shows a blank or unavailable canvas. The original WebP files are not reconstructible from these pointers. The animation code is preserved but the image objects need to come from your Git repository.

If your GitHub repository already stores the actual LFS objects, use it as the source of truth:

```bash
git lfs install
git clone <YOUR_GITHUB_REPOSITORY_URL>
cd <YOUR_REPOSITORY_FOLDER>
git lfs pull
```

Check that `public/seq/frame_001.webp` and `public/seq-m/frame_001.webp` are actual WebP files, not text starting with `version https://git-lfs.github.com/spec/v1`. Keep your repository's `.git`, `.gitattributes` and LFS history; do **not** overwrite them with a fresh ZIP. Copy the updated code and other non-frame files from this package into the cloned repo, leaving the hydrated `/public/seq` and `/public/seq-m` folders intact.

Verify the real frames are tracked before deploying:

```bash
git lfs ls-files
git status
git add .
git commit -m "Refine Frankfurt branding and expand USD desk"
git push
```

On Vercel or another deployment environment, verify that LFS assets are hydrated at build/deploy time and served with the correct `image/webp` content type. If the deployed `https://your-domain/seq/frame_001.webp` response is a Git LFS pointer instead of a WebP image, the scroll animation cannot render.

## Build and deployment

- Install dependencies: `npm ci`
- Check/build: `npm run build` (needs configured Next.js/Supabase environment variables)
- Start locally: `npm run dev`
- USD accounts require the included `supabase/migrations/0011_usd_eur_accounts.sql` migration on an existing Supabase database. Back up the database before running it.
- **Provider-issued bank details only:** real routing numbers, SWIFT/BIC codes and transfer settlement require the corresponding bank or payment partner. The UI alone doesn't activate banking rails.
- Before public launch, verify all stated business addresses, charter/supervision, insurance, deposit protection and financial-service claims against actual company documents and regulatory authorizations. This design update does not verify those claims.
