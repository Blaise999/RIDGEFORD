import { FACE_ROSTER } from "@/lib/euro-facts";
import { ok, handleError } from "@/lib/http";

export const revalidate = 86400;

/**
 * GET /api/faces — portraits for the people on the wire.
 *
 * Two earlier attempts at this failed, and both failures are worth recording
 * so nobody repeats them:
 *
 *   1. Hardcoded Wikimedia filenames. Most were guesses and 404'd.
 *   2. The REST summary endpoint, then rewriting the thumbnail URL to
 *      `/320px-`. Wikimedia returns 404 for a thumbnail LARGER than the
 *      source file, so any portrait whose original was under 320px silently
 *      broke — and a broken <img> renders its alt text, which is the "Chri"
 *      and "Bori" you saw sitting in the avatar circles.
 *
 * This version asks the MediaWiki API for a thumbnail at an explicit size and
 * uses the URL it hands back, verbatim, with no rewriting. The API returns
 * the largest available render if the source is smaller, so the URL is always
 * valid. One request covers every person instead of eleven.
 */
type Resolved = { title: string; src: string; page: string; width?: number };

let cache: { at: number; data: Resolved[] } | null = null;
const TTL = 12 * 60 * 60 * 1000;

export async function GET() {
  try {
    if (cache && Date.now() - cache.at < TTL) {
      return ok({ faces: cache.data, cached: true, count: cache.data.length });
    }

    const titles = FACE_ROSTER.map((f) => f.title).join("|");
    const url =
      "https://en.wikipedia.org/w/api.php" +
      "?action=query&format=json&formatversion=2" +
      "&prop=pageimages&piprop=thumbnail&pithumbsize=400" +
      "&redirects=1&origin=*" +
      `&titles=${encodeURIComponent(titles)}`;

    const r = await fetch(url, {
      headers: {
        accept: "application/json",
        // Wikimedia asks for a descriptive UA on API traffic.
        "user-agent": "RidgefordBank/1.0 (landing page portraits; contact: dev@ridgefordbank.eu)",
      },
      next: { revalidate: 86400 },
    } as any);

    if (!r.ok) throw new Error(`wikipedia ${r.status}`);
    const j = await r.json();

    // `redirects` and `normalized` remap the titles we asked for, so build a
    // lookup back to the roster key rather than assuming they match.
    const back = new Map<string, string>();
    for (const n of j?.query?.normalized || []) back.set(n.to, n.from);
    for (const n of j?.query?.redirects || []) {
      back.set(n.to, back.get(n.from) || n.from);
    }

    const faces: Resolved[] = [];
    for (const page of j?.query?.pages || []) {
      const src = page?.thumbnail?.source;
      if (!src) continue;
      const rosterTitle = back.get(page.title) || page.title;
      faces.push({
        title: rosterTitle,
        src,                                  // verbatim — never rewritten
        width: page.thumbnail?.width,
        page: `https://en.wikipedia.org/wiki/${encodeURIComponent(page.title.replace(/ /g, "_"))}`,
      });
    }

    if (faces.length) cache = { at: Date.now(), data: faces };
    return ok({ faces, cached: false, count: faces.length });
  } catch (e) {
    // A portrait outage must never take the landing page with it.
    if (cache) return ok({ faces: cache.data, cached: true, stale: true, count: cache.data.length });
    return handleError(e);
  }
}
