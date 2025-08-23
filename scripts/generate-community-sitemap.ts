import { createClient } from '@supabase/supabase-js';
import { writeFileSync, mkdirSync } from 'fs';
import { join } from 'path';

// Function to get environment variable with fallback
function getEnvVar(key: string, fallback: string): string {
  const value = process.env[key] || process.env[`VITE_${key}`] || fallback;
  return value;
}

// Supabase configuration - using environment variables with fallbacks
const supabaseUrl = getEnvVar('SUPABASE_URL', "https://ynvnzmkpifwteyuxondc.supabase.co");
const supabaseServiceKey = getEnvVar('SUPABASE_SERVICE_ROLE_KEY', "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inludm56bWtwaWZ3dGV5dXhvbmRjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDA0MzM0ODksImV4cCI6MjA1NjAwOTQ4OX0.-7uEZS3Ra22P3KqWgVn1JVgzWlTOxgKnYnjiykgWpms");

const supabase = createClient(supabaseUrl, supabaseServiceKey);

interface CommunityPost {
  id: number;
  location: string | null;
  created_at: string;
  updated_at: string;
}

async function generateCommunitySitemap() {
  try {
    console.log('🔄 Fetching community posts for sitemap...');
    console.log('🔗 Supabase URL:', supabaseUrl);
    console.log('🔑 Using service key:', supabaseServiceKey ? 'Yes' : 'No');
    
    // Fetch all community posts with location data
    const { data: posts, error } = await supabase
      .from('community_posts')
      .select('id, location, created_at, updated_at')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('❌ Supabase error:', error);
      throw error;
    }

    console.log(`📝 Found ${posts?.length || 0} community posts`);
    
    if (posts && posts.length > 0) {
      console.log('📋 Sample posts:');
      posts.slice(0, 3).forEach((post, index) => {
        console.log(`   ${index + 1}. ID: ${post.id}, Location: ${post.location || 'None'}, Created: ${post.created_at}`);
      });
    }

    // Generate sitemap XML
    const sitemap = generateSitemapXML(posts || []);
    
    // Ensure public directory exists
    const publicDir = join(process.cwd(), 'public');
    mkdirSync(publicDir, { recursive: true });
    
    // Write sitemap to public directory
    const sitemapPath = join(publicDir, 'community-sitemap.xml');
    writeFileSync(sitemapPath, sitemap);
    
    console.log(`✅ Community sitemap generated: ${sitemapPath}`);
    console.log(`🌐 Sitemap will be available at: /community-sitemap.xml`);
    
    return posts?.length || 0;
  } catch (error) {
    console.error('❌ Error generating community sitemap:', error);
    throw error;
  }
}

function generateSitemapXML(posts: CommunityPost[]): string {
  const baseUrl = 'https://zaparound.com'; // Match existing sitemap domain
  const currentDate = new Date().toISOString();
  
  let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
  xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';
  
  // Add main community pages for each language
  const languages = ['en', 'fr', 'es'];
  languages.forEach(lang => {
    xml += `  <url>\n`;
    xml += `    <loc>${baseUrl}/${lang}/community</loc>\n`;
    xml += `    <lastmod>${currentDate}</lastmod>\n`;
    xml += `    <changefreq>daily</changefreq>\n`;
    xml += `    <priority>0.8</priority>\n`;
    xml += `  </url>\n`;
  });
  
  // Add individual post URLs
  posts.forEach(post => {
    if (post.location) {
      // Generate location-based URL for better SEO
      const locationSlug = post.location
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');
      
      // Add URL for each language
      languages.forEach(lang => {
        xml += `  <url>\n`;
        xml += `    <loc>${baseUrl}/${lang}/community/share/${post.id}/${locationSlug}</loc>\n`;
        xml += `    <lastmod>${post.updated_at || post.created_at}</lastmod>\n`;
        xml += `    <changefreq>weekly</changefreq>\n`;
        xml += `    <priority>0.7</priority>\n`;
        xml += `  </url>\n`;
      });
    } else {
      // Posts without location - still add them but with lower priority
      languages.forEach(lang => {
        xml += `  <url>\n`;
        xml += `    <loc>${baseUrl}/${lang}/community/share/${post.id}</loc>\n`;
        xml += `    <lastmod>${post.updated_at || post.created_at}</lastmod>\n`;
        xml += `    <changefreq>weekly</changefreq>\n`;
        xml += `    <priority>0.6</priority>\n`;
        xml += `  </url>\n`;
      });
    }
  });
  
  xml += '</urlset>';
  return xml;
}

// Run the generator directly
generateCommunitySitemap()
  .then(count => {
    console.log(`🎉 Successfully generated sitemap for ${count} posts`);
    process.exit(0);
  })
  .catch(error => {
    console.error('💥 Failed to generate sitemap:', error);
    process.exit(1);
  });

export { generateCommunitySitemap };
