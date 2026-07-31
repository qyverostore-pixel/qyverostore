import "./lib/error-capture";

import { consumeLastCapturedError } from "./lib/error-capture";
import { renderErrorPage } from "./lib/error-page";

type ServerEntry = {
  fetch: (request: Request, env: unknown, ctx: unknown) => Promise<Response> | Response;
};

let serverEntryPromise: Promise<ServerEntry> | undefined;
const siteUrl = (import.meta.env.VITE_SITE_URL || "https://qyvero.com").replace(/\/$/, "");
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const xml = (value: string) =>
  value.replace(
    /[<>&"']/g,
    (character) =>
      ({ "<": "&lt;", ">": "&gt;", "&": "&amp;", '"': "&quot;", "'": "&apos;" })[character] ??
      character,
  );
async function seoResponse(pathname: string) {
  if (pathname === "/robots.txt")
    return new Response(
      `User-agent: *\nAllow: /\nDisallow: /admin/\nDisallow: /profile/\nDisallow: /auth/\n\nSitemap: ${siteUrl}/sitemap.xml\n`,
      { headers: { "content-type": "text/plain; charset=utf-8" } },
    );
  if (pathname !== "/sitemap.xml") return null;
  const staticPages = ["", "/products", "/about", "/contact", "/connect"];
  let products: Array<{ slug: string; updated_at: string }> = [];
  let categories: Array<{ slug: string }> = [];
  if (supabaseUrl && supabaseKey) {
    try {
      const headers = { apikey: supabaseKey, Authorization: `Bearer ${supabaseKey}` };
      const [productResponse, categoryResponse] = await Promise.all([
        fetch(
          `${supabaseUrl}/rest/v1/products?select=slug,updated_at&is_active=eq.true&status=eq.active`,
          { headers },
        ),
        fetch(`${supabaseUrl}/rest/v1/categories?select=slug&is_active=eq.true`, { headers }),
      ]);
      if (productResponse.ok) products = await productResponse.json();
      if (categoryResponse.ok) categories = await categoryResponse.json();
    } catch (error) {
      console.error("Unable to enrich sitemap", error);
    }
  }
  const entries = [
    ...staticPages.map((path) => `<url><loc>${xml(`${siteUrl}${path || "/"}`)}</loc></url>`),
    ...categories.map(
      (category) =>
        `<url><loc>${xml(`${siteUrl}/products?category=${encodeURIComponent(category.slug)}`)}</loc></url>`,
    ),
    ...products.map(
      (product) =>
        `<url><loc>${xml(`${siteUrl}/products/${product.slug}`)}</loc>${product.updated_at ? `<lastmod>${new Date(product.updated_at).toISOString()}</lastmod>` : ""}</url>`,
    ),
  ].join("");
  return new Response(
    `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${entries}</urlset>`,
    {
      headers: {
        "content-type": "application/xml; charset=utf-8",
        "cache-control": "public, max-age=3600",
      },
    },
  );
}

async function getServerEntry(): Promise<ServerEntry> {
  if (!serverEntryPromise) {
    serverEntryPromise = import("@tanstack/react-start/server-entry").then(
      (m) => (m.default ?? m) as ServerEntry,
    );
  }
  return serverEntryPromise;
}

// h3 swallows in-handler throws into a normal 500 Response with body
// {"unhandled":true,"message":"HTTPError"} — try/catch alone never fires for those.
async function normalizeCatastrophicSsrResponse(response: Response): Promise<Response> {
  if (response.status < 500) return response;
  const contentType = response.headers.get("content-type") ?? "";
  if (!contentType.includes("application/json")) return response;

  const body = await response.clone().text();
  if (!isH3SwallowedErrorBody(body)) return response;

  console.error(consumeLastCapturedError() ?? new Error(`h3 swallowed SSR error: ${body}`));
  return new Response(renderErrorPage(), {
    status: 500,
    headers: { "content-type": "text/html; charset=utf-8" },
  });
}

function isH3SwallowedErrorBody(body: string): boolean {
  try {
    const payload = JSON.parse(body) as { unhandled?: unknown; message?: unknown };
    return payload.unhandled === true && payload.message === "HTTPError";
  } catch {
    return false;
  }
}

export default {
  async fetch(request: Request, env: unknown, ctx: unknown) {
    try {
      const seo = await seoResponse(new URL(request.url).pathname);
      if (seo) return seo;
      const handler = await getServerEntry();
      const response = await handler.fetch(request, env, ctx);
      return await normalizeCatastrophicSsrResponse(response);
    } catch (error) {
      console.error(error);
      return new Response(renderErrorPage(), {
        status: 500,
        headers: { "content-type": "text/html; charset=utf-8" },
      });
    }
  },
};
