import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.36.0";

// Configure Supabase client for Edge Runtime
const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseKey = Deno.env.get('SUPABASE_ANON_KEY')!;
const supabase = createClient(supabaseUrl, supabaseKey, { fetch });

// Helper to escape HTML entities to avoid breaking markup
function escapeHtml(str: string) {
  return str.replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
}

function notFound(slug?: string) {
  return new Response(
    `<!DOCTYPE html><html lang="en"><head><title>Not found</title><meta name="robots" content="noindex"/></head><body><h1>404 – Article ${slug ? `“${escapeHtml(slug)}”` : ''} not found</h1></body></html>`,
    {
      status: 404,
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Cache-Control': 'public, max-age=0, s-maxage=60'
      }
    }
  );
}

serve(async (req) => {
  // CORS pre-flight
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'content-type',
        'Access-Control-Allow-Methods': 'GET,OPTIONS'
      }
    });
  }

  if (req.method !== 'GET') {
    return new Response('Method not allowed', { status: 405 });
  }

  const url = new URL(req.url);
  // The part after `/blog-render` becomes the slug (may be empty for list page)
  const pathParts = url.pathname.split('/');
  const slug = pathParts.slice(pathParts.indexOf('blog-render') + 1).join('/') || '';

  if (!slug) {
    // -------- Blog list page --------
    const { data: blogs, error } = await supabase
      .from('blogs')
      .select('title_en, slug, published_at')
      .eq('is_published', true)
      .order('published_at', { ascending: false })
      .limit(20);

    if (error) {
      console.error(error);
      return new Response('Failed to load blogs', { status: 500 });
    }

    const items = blogs
      .map((b) => `<li><a href="/blog/${b.slug}">${escapeHtml(b.title_en)}</a> <small>(${new Date(b.published_at).toLocaleDateString()})</small></li>`) 
      .join('');

    const html = `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8" /><meta name="viewport" content="width=device-width,initial-scale=1" /><title>ZapAround Blog</title><meta name="description" content="Latest travel insights and product updates from ZapAround." /><link rel="canonical" href="https://zaparound.com/blog" /><style>body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;margin:0;padding:2rem;line-height:1.7;color:#030303;background:#fcfcfc}h1{font-size:2rem;margin-bottom:1rem}ul{padding-left:1.5rem}a{color:#61936f;text-decoration:none}a:hover{text-decoration:underline}</style></head><body><h1>ZapAround Blog</h1><ul>${items}</ul><footer style="margin-top:3rem;font-size:.875rem;text-align:center">© ${new Date().getFullYear()} ZapAround</footer><script type="module" src="/src/main.tsx"></script></body></html>`;

    return new Response(html, {
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400'
      }
    });
  }

  // -------- Single article page --------
  const { data: blog, error } = await supabase
    .from('blogs')
    .select('title_en, content_en, published_at, cover_image')
    .eq('slug', slug)
    .eq('is_published', true)
    .single();

  if (error || !blog) {
    console.error(error);
    return notFound(slug);
  }

  const plainDescription = blog.content_en.replace(/<[^>]+>/g, '').slice(0, 150);

  const html = `<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/><title>${escapeHtml(blog.title_en)} – ZapAround Blog</title><meta name="description" content="${escapeHtml(plainDescription)}"/><link rel="canonical" href="https://zaparound.com/blog/${slug}"/><meta property="og:title" content="${escapeHtml(blog.title_en)}"/><meta property="og:description" content="${escapeHtml(plainDescription)}"/><meta property="og:image" content="${blog.cover_image || '/og-image.png'}"/><style>body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;margin:0;color:#030303;background:#fcfcfc;line-height:1.7;padding:2rem}h1{font-size:2rem;margin-bottom:1rem}article>*{max-width:740px;margin-left:auto;margin-right:auto}img{max-width:100%;height:auto;border-radius:8px}</style></head><body><article><header><h1>${escapeHtml(blog.title_en)}</h1><p><small>${new Date(blog.published_at).toLocaleDateString()}</small></p>${blog.cover_image ? `<img src="${blog.cover_image}" alt="${escapeHtml(blog.title_en)} cover"/>` : ''}</header><section>${blog.content_en}</section></article><footer style="margin-top:4rem;text-align:center;font-size:.875rem">© ${new Date().getFullYear()} ZapAround</footer><script type="module" src="/src/main.tsx"></script></body></html>`;

  return new Response(html, {
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'public, s-maxage=86400, stale-while-revalidate=604800'
    }
  });
}); 