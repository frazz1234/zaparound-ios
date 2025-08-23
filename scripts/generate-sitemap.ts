import { writeFileSync, readdirSync, readFileSync, existsSync } from 'fs';
import { join, extname } from 'path';
import { glob } from 'glob';
import { createClient } from '@supabase/supabase-js';

interface SitemapUrl {
  loc: string;
  lastmod: string;
  changefreq: 'always' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'never';
  priority: number;
  alternateLocales?: string[];
}

interface BlogPost {
  id: string;
  slug: string;
  title_en: string;
  title_fr: string;
  title_es: string;
  published_at: string | null;
  updated_at: string;
  is_published: boolean;
  category: string | null;
  excerpt_en: string | null;
  excerpt_fr: string | null;
  excerpt_es: string | null;
  image_url: string | null;
  author_id: string;
  keywords?: string[];
  location?: string;
  activities?: string[];
  stock_tickers?: string[];
}

interface PlacePostRow {
  place_id: string | null;
  location: string | null;
  updated_at: string | null;
  created_at: string | null;
}

const BASE_URL = 'https://zaparound.com';
const LANGUAGES = ['en', 'fr', 'es'];
const CURRENT_DATE = new Date().toISOString().split('T')[0];

// Function to get environment variable with fallback
function getEnvVar(key: string, fallback: string): string {
  const value = process.env[key] || process.env[`VITE_${key}`] || fallback;
  return value;
}

// Supabase configuration - using environment variables with fallbacks
const SUPABASE_URL = getEnvVar('SUPABASE_URL', "https://ynvnzmkpifwteyuxondc.supabase.co");
const SUPABASE_PUBLISHABLE_KEY = getEnvVar('SUPABASE_ANON_KEY', "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inludm56bWtwaWZ3dGV5dXhvbmRjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDA0MzM0ODksImV4cCI6MjA1NjAwOTQ4OX0.-7uEZS3Ra22P3KqWgVn1JVgzWlTOxgKnYnjiykgWpms");

// Log configuration source for transparency
const urlSource = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL ? 'environment variable' : 'fallback';
const keySource = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY ? 'environment variable' : 'fallback';


const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);

// Static pages configuration
const STATIC_PAGES: SitemapUrl[] = [
  {
    loc: '/',
    lastmod: CURRENT_DATE,
    changefreq: 'daily',
    priority: 1.0,
    alternateLocales: LANGUAGES
  },
  {
    loc: '/about',
    lastmod: CURRENT_DATE,
    changefreq: 'monthly',
    priority: 0.8,
    alternateLocales: LANGUAGES
  },
  {
    loc: '/contact',
    lastmod: CURRENT_DATE,
    changefreq: 'monthly',
    priority: 0.7,
    alternateLocales: LANGUAGES
  },
  {
    loc: '/pricing',
    lastmod: CURRENT_DATE,
    changefreq: 'weekly',
    priority: 0.9,
    alternateLocales: LANGUAGES
  },
  {
    loc: '/travel-flight',
    lastmod: CURRENT_DATE,
    changefreq: 'daily',
    priority: 0.9,
    alternateLocales: LANGUAGES
  },
  {
    loc: '/faq',
    lastmod: CURRENT_DATE,
    changefreq: 'weekly',
    priority: 0.8,
    alternateLocales: LANGUAGES
  },
  {
    loc: '/blog',
    lastmod: CURRENT_DATE,
    changefreq: 'daily',
    priority: 0.7,
    alternateLocales: LANGUAGES
  },
  {
    loc: '/currency-converter',
    lastmod: CURRENT_DATE,
    changefreq: 'daily',
    priority: 0.6,
    alternateLocales: LANGUAGES
  },
  {
    loc: '/privacy',
    lastmod: CURRENT_DATE,
    changefreq: 'monthly',
    priority: 0.5,
    alternateLocales: LANGUAGES
  },
  {
    loc: '/terms',
    lastmod: CURRENT_DATE,
    changefreq: 'monthly',
    priority: 0.5,
    alternateLocales: LANGUAGES
  },
  {
    loc: '/cookie-policy',
    lastmod: CURRENT_DATE,
    changefreq: 'monthly',
    priority: 0.5,
    alternateLocales: LANGUAGES
  },
  {
    loc: '/gdpr',
    lastmod: CURRENT_DATE,
    changefreq: 'monthly',
    priority: 0.5,
    alternateLocales: LANGUAGES
  },
  {
    loc: '/legal',
    lastmod: CURRENT_DATE,
    changefreq: 'monthly',
    priority: 0.5,
    alternateLocales: LANGUAGES
  }
];

// Function to get blog posts from Supabase
async function getBlogPosts(): Promise<BlogPost[]> {
  try {
    console.log('🔍 Fetching blog posts from Supabase...');
    
    const { data, error } = await supabase
      .from('blogs')
      .select('*')
      .eq('is_published', true)
      .order('published_at', { ascending: false });

    if (error) {
      console.error('❌ Error fetching blog posts from Supabase:', error);
      return [];
    }

    console.log(`✅ Successfully fetched ${data?.length || 0} published blog posts`);
    return data || [];
  } catch (error) {
    console.error('❌ Exception while fetching blog posts:', error);
    return [];
  }
}

// Generate sitemap XML
function generateSitemapXml(urls: SitemapUrl[]): string {
  const xmlUrls = urls.map(url => {
    const alternateLinks = url.alternateLocales?.map(locale => {
      // Extract the path without the language prefix
      const pathWithoutLang = url.loc.replace(/^\/[a-z]{2}/, '');
      const alternateUrl = `/${locale}${pathWithoutLang}`;
      return `    <xhtml:link rel="alternate" hreflang="${locale}" href="${BASE_URL}${alternateUrl}"/>`;
    }).join('\n') || '';
    
    // Support absolute loc values (e.g. https://www.zaparound.com/)
    const locValue = url.loc.startsWith('http') ? url.loc : `${BASE_URL}${url.loc}`;
    
    return `  <url>
    <loc>${locValue}</loc>
    <lastmod>${url.lastmod}</lastmod>
    <changefreq>${url.changefreq}</changefreq>
    <priority>${url.priority}</priority>${alternateLinks ? '\n' + alternateLinks : ''}
  </url>`;
  }).join('\n\n');
  
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:xhtml="http://www.w3.org/1999/xhtml">

${xmlUrls}
</urlset>`;
}

// Generate news sitemap for blog posts
function generateNewsSitemapXml(blogPosts: BlogPost[]): string {
  const xmlUrls = blogPosts.map(post => {
    const lastmod = post.updated_at || post.published_at || CURRENT_DATE;
    const title = post.title_en || post.title_fr || post.title_es || 'Blog Post';
    
    return `  <url>
    <loc>${BASE_URL}/en/blog/${post.slug}</loc>
    <news:news>
      <news:publication>
        <news:name>ZapAround Blog</news:name>
        <news:language>en</news:language>
      </news:publication>
      <news:publication_date>${post.published_at || post.updated_at}</news:publication_date>
      <news:title>${title}</news:title>
      ${post.category ? `<news:keywords>${post.category}</news:keywords>` : ''}
    </news:news>
    <lastmod>${lastmod}</lastmod>
  </url>`;
  }).join('\n\n');
  
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:news="http://www.google.com/schemas/sitemap-news/0.9">

${xmlUrls}
</urlset>`;
}

// Generate blog category sitemap
function generateBlogCategorySitemap(blogPosts: BlogPost[]): string {
  // Extract unique categories
  const categories = [...new Set(blogPosts.map(post => post.category).filter(Boolean))];
  
  const xmlUrls = categories.map(category => {
    const categorySlug = category?.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
    
    return `  <url>
    <loc>${BASE_URL}/en/blog/category/${categorySlug}</loc>
    <lastmod>${CURRENT_DATE}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.6</priority>
    <xhtml:link rel="alternate" hreflang="en" href="${BASE_URL}/en/blog/category/${categorySlug}"/>
    <xhtml:link rel="alternate" hreflang="fr" href="${BASE_URL}/fr/blog/category/${categorySlug}"/>
    <xhtml:link rel="alternate" hreflang="es" href="${BASE_URL}/es/blog/category/${categorySlug}"/>
  </url>`;
  }).join('\n\n');
  
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:xhtml="http://www.w3.org/1999/xhtml">

${xmlUrls}
</urlset>`;
}

// Generate blog tag sitemap
function generateBlogTagSitemap(blogPosts: BlogPost[]): string {
  // Extract unique keywords/tags
  const allKeywords = blogPosts
    .flatMap(post => post.keywords || [])
    .filter(Boolean);
  const uniqueKeywords = [...new Set(allKeywords)];
  
  const xmlUrls = uniqueKeywords.map(keyword => {
    const tagSlug = keyword.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
    
    return `  <url>
    <loc>${BASE_URL}/en/blog/tag/${tagSlug}</loc>
    <lastmod>${CURRENT_DATE}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.5</priority>
    <xhtml:link rel="alternate" hreflang="en" href="${BASE_URL}/en/blog/tag/${tagSlug}"/>
    <xhtml:link rel="alternate" hreflang="fr" href="${BASE_URL}/fr/blog/tag/${tagSlug}"/>
    <xhtml:link rel="alternate" hreflang="es" href="${BASE_URL}/es/blog/tag/${tagSlug}"/>
  </url>`;
  }).join('\n\n');
  
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:xhtml="http://www.w3.org/1999/xhtml">

${xmlUrls}
</urlset>`;
}

// Main function
async function generateSitemaps() {
  console.log('🚀 Generating sitemaps...');
  
  // Get blog posts from Supabase
  const blogPosts = await getBlogPosts();
  console.log(`📝 Found ${blogPosts.length} published blog posts`);

  // Get distinct place IDs from community posts for zap-places
  async function getDistinctPlaces(): Promise<Array<{ place_id: string; location: string; lastmod: string }>> {
    try {
      console.log('🗺️ Fetching distinct places from community posts...');
      const { data, error } = await supabase
        .from('community_posts')
        .select('place_id, location, updated_at, created_at')
        .not('place_id', 'is', null)
        .order('updated_at', { ascending: false })
        .limit(5000);
      if (error) {
        console.error('❌ Error fetching places:', error);
        return [];
      }
      const rows = (data || []) as PlacePostRow[];
      const latestByPlace = new Map<string, { lastmod: string; location: string }>();
      for (const row of rows) {
        if (!row.place_id) continue;
        const lastmod = (row.updated_at || row.created_at || CURRENT_DATE).split('T')[0];
        const location = row.location || `place-${row.place_id}`;
        const prev = latestByPlace.get(row.place_id);
        if (!prev || lastmod > prev.lastmod) {
          latestByPlace.set(row.place_id, { lastmod, location });
        }
      }
      const places = Array.from(latestByPlace.entries()).map(([place_id, { lastmod, location }]) => ({ 
        place_id, 
        location, 
        lastmod 
      }));
      console.log(`🗺️ Found ${places.length} distinct places`);
      return places;
    } catch (e) {
      console.error('❌ Exception while fetching places:', e);
      return [];
    }
  }
  const places = await getDistinctPlaces();
  
  // Generate URLs for all languages
  const allUrls: SitemapUrl[] = [];
  
  // Add static pages for each language
  for (const page of STATIC_PAGES) {
    if (page.alternateLocales) {
      // Add language-specific URLs
      for (const locale of page.alternateLocales) {
        allUrls.push({
          ...page,
          loc: `/${locale}${page.loc}`,
          alternateLocales: page.alternateLocales
        });
      }
    } else {
      allUrls.push(page);
    }
  }
  
  // Add zap-places for each language (we include at least the base listing page per locale)
  for (const locale of LANGUAGES) {
    allUrls.push({
      loc: `/${locale}/zap-places`,
      lastmod: CURRENT_DATE,
      changefreq: 'daily',
      priority: 0.6,
      alternateLocales: LANGUAGES
    });
  }

  // Add blog post URLs for each language
  for (const post of blogPosts) {
    const lastmod = post.updated_at || post.published_at || CURRENT_DATE;
    
    // Add URLs for each language
    for (const locale of LANGUAGES) {
      allUrls.push({
        loc: `/${locale}/blog/${post.slug}`,
        lastmod,
        changefreq: 'monthly',
        priority: 0.6,
        alternateLocales: LANGUAGES
      });
    }
  }
  
  // Add zap-places detail URLs for each distinct place and language
  if (places.length > 0) {
            for (const place of places) {
          for (const locale of LANGUAGES) {
            // Create SEO-friendly URL with place name slug (without placeId)
            const placeName = place.location || `place-${place.place_id}`;
            const placeSlug = placeName
              .toLowerCase()
              .replace(/[^a-z0-9]+/g, '-')
              .replace(/(^-|-$)/g, '');

            allUrls.push({
              loc: `/${locale}/zap-places/${placeSlug}`,
              lastmod: place.lastmod,
              changefreq: 'weekly',
              priority: 0.55,
              alternateLocales: LANGUAGES
            });
          }
        }
  }
  
  // Ensure canonical root entries are present - CRITICAL for brand "ZapAround" SEO
  // Add the main domain root URL for "zaparound" brand searches (highest priority)
  allUrls.unshift({
    loc: '/',
    lastmod: CURRENT_DATE,
    changefreq: 'daily',
    priority: 1.0,
    alternateLocales: LANGUAGES
  });

  // Generate main sitemap
  const sitemapXml = generateSitemapXml(allUrls);
  writeFileSync('public/sitemap.xml', sitemapXml);
  console.log('✅ Main sitemap generated: public/sitemap.xml');
  
  // Generate news sitemap if there are blog posts
  if (blogPosts.length > 0) {
    const newsSitemapXml = generateNewsSitemapXml(blogPosts);
    writeFileSync('public/sitemap-news.xml', newsSitemapXml);
    console.log('✅ News sitemap generated: public/sitemap-news.xml');
    
    // Generate category sitemap
    const categorySitemapXml = generateBlogCategorySitemap(blogPosts);
    writeFileSync('public/sitemap-categories.xml', categorySitemapXml);
    console.log('✅ Category sitemap generated: public/sitemap-categories.xml');
    
    // Generate tag sitemap
    const tagSitemapXml = generateBlogTagSitemap(blogPosts);
    writeFileSync('public/sitemap-tags.xml', tagSitemapXml);
    console.log('✅ Tag sitemap generated: public/sitemap-tags.xml');
  }
  
  // Generate sitemap index if we have multiple sitemaps
  if (blogPosts.length > 0) {
    const sitemapIndex = `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <sitemap>
    <loc>${BASE_URL}/sitemap.xml</loc>
    <lastmod>${CURRENT_DATE}</lastmod>
  </sitemap>
  <sitemap>
    <loc>${BASE_URL}/sitemap-news.xml</loc>
    <lastmod>${CURRENT_DATE}</lastmod>
  </sitemap>
  <sitemap>
    <loc>${BASE_URL}/sitemap-categories.xml</loc>
    <lastmod>${CURRENT_DATE}</lastmod>
  </sitemap>
  <sitemap>
    <loc>${BASE_URL}/sitemap-tags.xml</loc>
    <lastmod>${CURRENT_DATE}</lastmod>
  </sitemap>
  <sitemap>
    <loc>${BASE_URL}/community-sitemap.xml</loc>
    <lastmod>${CURRENT_DATE}</lastmod>
  </sitemap>
</sitemapindex>`;
    
    writeFileSync('public/sitemap-index.xml', sitemapIndex);
    console.log('✅ Sitemap index generated: public/sitemap-index.xml');
  }
  
  console.log(`🎉 Generated sitemaps with ${allUrls.length} URLs`);
  
  // Log some statistics
  const staticPageCount = STATIC_PAGES.length * LANGUAGES.length;
  const blogPostCount = blogPosts.length * LANGUAGES.length;
  console.log(`📊 Statistics:`);
  console.log(`   - Static pages: ${staticPageCount} URLs`);
  console.log(`   - Blog posts: ${blogPostCount} URLs`);
  const placeUrlCount = places.length * LANGUAGES.length;
  console.log(`   - Place pages: ${placeUrlCount} URLs`);
  console.log(`   - Total URLs: ${allUrls.length}`);
  console.log(`   - Languages: ${LANGUAGES.join(', ')}`);
}

// Run the generator
generateSitemaps().catch(console.error); 