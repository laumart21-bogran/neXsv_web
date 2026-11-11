import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
const supabase = createClient(supabaseUrl, anonKey, {
  auth: { persistSession: false, autoRefreshToken: false }
});

function escapeHtml(value: unknown): string {
  return String(value ?? "").replaceAll("&", "&amp;").replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&#039;");
}

function htmlResponse(body: string, status = 200): Response {
  const headers = new Headers();
  headers.set("Content-Type", "text/html; charset=UTF-8");
  headers.set("Cache-Control", "public, max-age=300");
  headers.set("X-Content-Type-Options", "nosniff");
  return new Response(body, { status, headers });
}

Deno.serve(async (request: Request) => {
  const requestUrl = new URL(request.url);
  const id = requestUrl.searchParams.get("id") || "";
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id)) {
    return htmlResponse("<!doctype html><html lang='es'><meta charset='utf-8'><title>Enlace no válido | neXsv</title><p>Este enlace de neXsv no es válido.</p></html>", 400);
  }

  const { data: publication, error } = await supabase
    .from("community_publications")
    .select("id,title,body,type,status")
    .eq("id", id)
    .eq("status", "PUBLICADA")
    .maybeSingle();

  if (error || !publication) {
    return htmlResponse("<!doctype html><html lang='es'><meta charset='utf-8'><title>Publicación no disponible | neXsv</title><p>Esta publicación ya no está disponible.</p><a href='https://nexsv.com/comunidad.html'>Visitar Comunidad neXsv</a></html>", 404);
  }

  const { data: images } = await supabase
    .from("community_publication_images")
    .select("public_url,sort_order")
    .eq("publication_id", id)
    .order("sort_order", { ascending: true })
    .limit(1);

  const title = escapeHtml(publication.title || "Una publicación de la comunidad neXsv");
  const description = escapeHtml(String(publication.body || "Descubre esta publicación en la comunidad neXsv.").slice(0, 220));
  const image = escapeHtml(images?.[0]?.public_url || "https://nexsv.com/cover-index.jpg");
  const destination = `https://nexsv.com/comunidad.html?publicacion=${encodeURIComponent(id)}`;
  const shareUrl = `https://verswqljdxiaveicdtfq.supabase.co/functions/v1/share-publication?id=${encodeURIComponent(id)}`;

  // Social crawlers need the Open Graph HTML. Human browsers should receive
  // a real HTTP redirect instead of relying on HTML/JavaScript refresh.
  const userAgent = request.headers.get("user-agent") || "";
  const isSocialCrawler = /WhatsApp|facebookexternalhit|Facebot|Twitterbot|LinkedInBot|Slackbot|TelegramBot|Discordbot|SkypeUriPreview|Pinterestbot/i.test(userAgent);
  if (!isSocialCrawler) {
    return new Response(null, {
      status: 302,
      headers: {
        "Location": destination,
        "Cache-Control": "no-store"
      }
    });
  }

  return htmlResponse(`<!doctype html>
<html lang="es">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${title} | Comunidad neXsv</title>
<meta name="description" content="${description}">
<link rel="canonical" href="${shareUrl}">
<meta property="og:type" content="article">
<meta property="og:site_name" content="neXsv">
<meta property="og:title" content="${title}">
<meta property="og:description" content="${description}">
<meta property="og:url" content="${shareUrl}">
<meta property="og:image" content="${image}">
<meta property="og:image:alt" content="Imagen de una publicación de la comunidad neXsv">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${title} | neXsv">
<meta name="twitter:description" content="${description}">
<meta name="twitter:image" content="${image}">
<meta http-equiv="refresh" content="0;url=${destination}">
<script>window.location.replace(${JSON.stringify(destination)});</script>
</head>
<body><p>Abriendo publicación en <a href="${destination}">Comunidad neXsv</a>…</p></body>
</html>`);
});
