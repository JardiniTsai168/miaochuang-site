import { decodeSlug, getEmDashEntry } from "emdash";
import type { APIRoute } from "astro";

export const GET: APIRoute = async ({ params }) => {
  const slug = decodeSlug(params.slug);
  if (!slug) return new Response("Not found", { status: 404 });

  const { entry } = await getEmDashEntry("sites", slug);
  if (!entry) return new Response("Not found", { status: 404 });

  const expiresAt = new Date(entry.data.expires_at).getTime();
  if (!Number.isFinite(expiresAt) || expiresAt <= Date.now()) {
    return new Response("這個網站預覽已到期。", {
      status: 410,
      headers: { "Content-Type": "text/plain; charset=utf-8", "X-Robots-Tag": "noindex, nofollow, noarchive" },
    });
  }

  return new Response(entry.data.html, {
    status: 200,
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "public, max-age=60, s-maxage=60",
      "X-Content-Type-Options": "nosniff",
      "X-Robots-Tag": "noindex, nofollow, noarchive",
    },
  });
};
