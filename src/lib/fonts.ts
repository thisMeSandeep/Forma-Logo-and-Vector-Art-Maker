// Font registry + lazy loader + export-time inliner.
//
// The picker offers a curated set of fonts: a few system stacks (which need no
// fetching) plus a list of Google Fonts that are loaded on demand by injecting
// a <link> into the document head the first time they are referenced.
//
// At export time, Google fonts referenced by the exported texts are inlined
// into the SVG as @font-face blocks with base64-encoded woff2 payloads, so the
// resulting file renders identically anywhere — no network dependency.

export type FontSource = 'system' | 'google';

export type FontDef = {
  // Label shown in the picker (matches the Google family name when applicable).
  label: string;
  // Full CSS font-family value written to TextItem.fontFamily.
  family: string;
  source: FontSource;
  // Google API name (with spaces, not + signs). Required when source = 'google'.
  googleName?: string;
};

// Curated list — popular Google Fonts plus the existing system stacks. Keeping
// it finite avoids paginating thousands of options; users can still type any
// family they want into a TextItem programmatically.
export const FONT_LIST: FontDef[] = [
  // System / pre-bundled stacks
  { label: 'Sans (Geist)', family: 'Geist Variable, system-ui, sans-serif',                    source: 'system' },
  { label: 'Serif',        family: 'ui-serif, Georgia, serif',                                 source: 'system' },
  { label: 'Mono',         family: 'ui-monospace, SFMono-Regular, Menlo, monospace',           source: 'system' },
  { label: 'Display',      family: '"Bebas Neue", Impact, "Arial Black", sans-serif',          source: 'system' },

  // Google Fonts — Sans
  { label: 'Inter',           family: '"Inter", system-ui, sans-serif',         source: 'google', googleName: 'Inter' },
  { label: 'Roboto',          family: '"Roboto", system-ui, sans-serif',        source: 'google', googleName: 'Roboto' },
  { label: 'Open Sans',       family: '"Open Sans", system-ui, sans-serif',     source: 'google', googleName: 'Open Sans' },
  { label: 'Lato',            family: '"Lato", system-ui, sans-serif',          source: 'google', googleName: 'Lato' },
  { label: 'Montserrat',      family: '"Montserrat", system-ui, sans-serif',    source: 'google', googleName: 'Montserrat' },
  { label: 'Poppins',         family: '"Poppins", system-ui, sans-serif',       source: 'google', googleName: 'Poppins' },
  { label: 'Raleway',         family: '"Raleway", system-ui, sans-serif',       source: 'google', googleName: 'Raleway' },
  { label: 'Nunito',          family: '"Nunito", system-ui, sans-serif',        source: 'google', googleName: 'Nunito' },
  { label: 'Work Sans',       family: '"Work Sans", system-ui, sans-serif',     source: 'google', googleName: 'Work Sans' },
  { label: 'DM Sans',         family: '"DM Sans", system-ui, sans-serif',       source: 'google', googleName: 'DM Sans' },
  { label: 'Manrope',         family: '"Manrope", system-ui, sans-serif',       source: 'google', googleName: 'Manrope' },
  { label: 'Plus Jakarta Sans', family: '"Plus Jakarta Sans", system-ui, sans-serif', source: 'google', googleName: 'Plus Jakarta Sans' },
  { label: 'Outfit',          family: '"Outfit", system-ui, sans-serif',        source: 'google', googleName: 'Outfit' },
  { label: 'Oswald',          family: '"Oswald", system-ui, sans-serif',        source: 'google', googleName: 'Oswald' },
  { label: 'Bebas Neue',      family: '"Bebas Neue", Impact, sans-serif',       source: 'google', googleName: 'Bebas Neue' },
  { label: 'Anton',           family: '"Anton", Impact, sans-serif',            source: 'google', googleName: 'Anton' },
  { label: 'Archivo Black',   family: '"Archivo Black", Impact, sans-serif',    source: 'google', googleName: 'Archivo Black' },

  // Google Fonts — Serif
  { label: 'Playfair Display', family: '"Playfair Display", ui-serif, serif',   source: 'google', googleName: 'Playfair Display' },
  { label: 'Merriweather',     family: '"Merriweather", ui-serif, serif',       source: 'google', googleName: 'Merriweather' },
  { label: 'Lora',             family: '"Lora", ui-serif, serif',               source: 'google', googleName: 'Lora' },
  { label: 'PT Serif',         family: '"PT Serif", ui-serif, serif',           source: 'google', googleName: 'PT Serif' },
  { label: 'EB Garamond',      family: '"EB Garamond", ui-serif, serif',        source: 'google', googleName: 'EB Garamond' },
  { label: 'Cormorant Garamond', family: '"Cormorant Garamond", ui-serif, serif', source: 'google', googleName: 'Cormorant Garamond' },
  { label: 'Abril Fatface',    family: '"Abril Fatface", ui-serif, serif',      source: 'google', googleName: 'Abril Fatface' },
  { label: 'DM Serif Display', family: '"DM Serif Display", ui-serif, serif',   source: 'google', googleName: 'DM Serif Display' },

  // Google Fonts — Mono
  { label: 'JetBrains Mono',   family: '"JetBrains Mono", ui-monospace, monospace', source: 'google', googleName: 'JetBrains Mono' },
  { label: 'Fira Code',        family: '"Fira Code", ui-monospace, monospace',     source: 'google', googleName: 'Fira Code' },
  { label: 'Source Code Pro',  family: '"Source Code Pro", ui-monospace, monospace', source: 'google', googleName: 'Source Code Pro' },
  { label: 'IBM Plex Mono',    family: '"IBM Plex Mono", ui-monospace, monospace', source: 'google', googleName: 'IBM Plex Mono' },
  { label: 'Space Mono',       family: '"Space Mono", ui-monospace, monospace',   source: 'google', googleName: 'Space Mono' },

  // Google Fonts — Display / Handwriting
  { label: 'Pacifico',         family: '"Pacifico", cursive',                   source: 'google', googleName: 'Pacifico' },
  { label: 'Lobster',          family: '"Lobster", cursive',                    source: 'google', googleName: 'Lobster' },
  { label: 'Dancing Script',   family: '"Dancing Script", cursive',             source: 'google', googleName: 'Dancing Script' },
  { label: 'Caveat',           family: '"Caveat", cursive',                     source: 'google', googleName: 'Caveat' },
  { label: 'Permanent Marker', family: '"Permanent Marker", cursive',           source: 'google', googleName: 'Permanent Marker' },
  { label: 'Indie Flower',     family: '"Indie Flower", cursive',               source: 'google', googleName: 'Indie Flower' },
  { label: 'Shadows Into Light', family: '"Shadows Into Light", cursive',       source: 'google', googleName: 'Shadows Into Light' },
  { label: 'Press Start 2P',   family: '"Press Start 2P", cursive',             source: 'google', googleName: 'Press Start 2P' },
  { label: 'Monoton',          family: '"Monoton", cursive',                    source: 'google', googleName: 'Monoton' },
  { label: 'Orbitron',         family: '"Orbitron", sans-serif',                source: 'google', googleName: 'Orbitron' },
  { label: 'Righteous',        family: '"Righteous", cursive',                  source: 'google', googleName: 'Righteous' },
  { label: 'Audiowide',        family: '"Audiowide", cursive',                  source: 'google', googleName: 'Audiowide' },
];

export function findFontByFamily(family: string): FontDef | undefined {
  return FONT_LIST.find((f) => f.family === family);
}

export function findFontByGoogleName(name: string): FontDef | undefined {
  return FONT_LIST.find((f) => f.googleName === name);
}

// Build the Google Fonts CSS URL covering the full weight range. We always
// request the same wide range so any weight the user picks just works without
// re-fetching the stylesheet.
function googleCssUrl(googleName: string): string {
  const fam = encodeURIComponent(googleName).replace(/%20/g, '+');
  // ital,wght axes — italic 0/1 across 100..900.
  return `https://fonts.googleapis.com/css2?family=${fam}:ital,wght@0,100..900;1,100..900&display=swap`;
}

const loadedFamilies = new Set<string>();

// Adds <link rel="stylesheet"> for the given font (if Google + not yet loaded).
// Safe to call repeatedly. No-op for system fonts.
export function ensureFontLoaded(family: string): void {
  if (typeof document === 'undefined') return;
  const def = findFontByFamily(family);
  if (!def || def.source !== 'google' || !def.googleName) return;
  if (loadedFamilies.has(def.googleName)) return;
  loadedFamilies.add(def.googleName);

  // Preconnect hint on first Google font request. Cheap to add multiple times,
  // but we guard with a sentinel attribute anyway.
  if (!document.querySelector('link[data-forma-font-preconnect]')) {
    const pre1 = document.createElement('link');
    pre1.rel = 'preconnect';
    pre1.href = 'https://fonts.googleapis.com';
    pre1.setAttribute('data-forma-font-preconnect', 'true');
    document.head.appendChild(pre1);
    const pre2 = document.createElement('link');
    pre2.rel = 'preconnect';
    pre2.href = 'https://fonts.gstatic.com';
    pre2.crossOrigin = 'anonymous';
    pre2.setAttribute('data-forma-font-preconnect', 'true');
    document.head.appendChild(pre2);
  }

  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = googleCssUrl(def.googleName);
  link.setAttribute('data-forma-font', def.googleName);
  document.head.appendChild(link);
}

// ---------- Export-time inlining ----------

async function fetchAsBase64(url: string): Promise<string> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to fetch font: ${url}`);
  const buf = await res.arrayBuffer();
  // Chunk to avoid call-stack overflow on btoa for large buffers.
  const bytes = new Uint8Array(buf);
  const chunk = 0x8000;
  let binary = '';
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode.apply(null, Array.from(bytes.subarray(i, i + chunk)) as number[]);
  }
  return btoa(binary);
}

// Replaces every `url(<woff2-url>)` in a CSS string with the corresponding
// `url(data:font/woff2;base64,...)`. Fetches happen in parallel.
async function inlineCssFontUrls(css: string): Promise<string> {
  const urlRegex = /url\((https?:\/\/[^)]+\.(?:woff2|woff|ttf))\)/g;
  const urls = Array.from(new Set(Array.from(css.matchAll(urlRegex), (m) => m[1])));
  const replacements = new Map<string, string>();
  await Promise.all(
    urls.map(async (u) => {
      try {
        const b64 = await fetchAsBase64(u);
        const ext = u.endsWith('.woff2') ? 'woff2' : u.endsWith('.woff') ? 'woff' : 'ttf';
        replacements.set(u, `data:font/${ext};base64,${b64}`);
      } catch {
        // If a single woff file fails, leave the original URL in place — the
        // SVG will fall back to network loading for that face.
      }
    }),
  );
  return css.replace(urlRegex, (match, url) => {
    const replaced = replacements.get(url);
    return replaced ? `url(${replaced})` : match;
  });
}

// Builds an SVG <style>-ready string with @font-face rules for every Google
// font referenced by the given families. Returns empty string if none of the
// families are Google fonts.
//
// Google Fonts serves a different CSS depending on the User-Agent — modern
// browsers get woff2. We fetch with the default fetch UA, which Google
// recognizes as a modern browser, so we get woff2 URLs.
export async function buildEmbeddedFontCss(families: string[]): Promise<string> {
  const googleNames = Array.from(
    new Set(
      families
        .map((f) => findFontByFamily(f))
        .filter((d): d is FontDef => !!d && d.source === 'google' && !!d.googleName)
        .map((d) => d.googleName as string),
    ),
  );
  if (googleNames.length === 0) return '';

  const cssChunks = await Promise.all(
    googleNames.map(async (name) => {
      try {
        const res = await fetch(googleCssUrl(name));
        if (!res.ok) return '';
        const css = await res.text();
        return await inlineCssFontUrls(css);
      } catch {
        return '';
      }
    }),
  );
  return cssChunks.filter(Boolean).join('\n');
}
