import { Helmet } from 'react-helmet-async';
import { Blog } from '@/types/blog';
import { getLocalizedContent } from '@/utils/blogUtils';

interface BlogMetaTagsProps {
  blog: Blog;
  locale: string;
  url: string;
}

export function BlogMetaTags({ blog, locale, url }: BlogMetaTagsProps) {
  const fullUrl = `https://zaparound.com${url}`;
  const fullImageUrl = blog.image_url 
    ? (blog.image_url.startsWith('http') ? blog.image_url : `https://zaparound.com${blog.image_url}`)
    : 'https://zaparound.com/og-image.png';

  // Get localized content based on locale
  const lang = locale.split('_')[0];
  const localizedContent = getLocalizedContent(blog, lang);
  const description = localizedContent.excerpt || localizedContent.content.substring(0, 160);

  const structuredData = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    "headline": localizedContent.title,
    "description": description,
    "image": fullImageUrl,
    "author": {
      "@type": "Person",
      "name": "ZapAround Team"
    },
    "publisher": {
      "@type": "Organization",
      "name": "ZapAround",
      "logo": {
        "@type": "ImageObject",
        "url": "https://zaparound.com/zaparound-uploads/transparentnoliner.webp"
      }
    },
    "datePublished": blog.published_at || blog.created_at,
    "dateModified": blog.updated_at,
    "mainEntityOfPage": {
      "@type": "WebPage",
      "@id": fullUrl
    },
    "url": fullUrl,
    "wordCount": localizedContent.content.length,
    "articleSection": blog.category || "Travel",
    "keywords": blog.category || "travel, trip planning, ZapAround"
  };

  const alternateLocales = ['en_US', 'fr_FR', 'es_ES'].filter(loc => loc !== locale);

  return (
    <Helmet>
      {/* Basic Meta Tags */}
      <title>{`${localizedContent.title} - ZapAround Blog`}</title>
      <meta name="description" content={description} />
      <meta name="keywords" content={blog.category || "travel, trip planning, ZapAround"} />
      <meta name="author" content="ZapAround Team" />
      <meta name="language" content={locale.split('_')[0]} />
      
      {/* Canonical URL */}
      <link rel="canonical" href={fullUrl} />
      
      {/* Alternate Language Links */}
      {alternateLocales.map(loc => {
        const langCode = loc.split('_')[0];
        const alternateUrl = `https://zaparound.com/${langCode}/blog/${blog.slug}`;
        return (
          <link key={loc} rel="alternate" hrefLang={loc} href={alternateUrl} />
        );
      })}
      
      {/* Open Graph Meta Tags */}
      <meta property="og:title" content={localizedContent.title} />
      <meta property="og:description" content={description} />
      <meta property="og:type" content="article" />
      <meta property="og:url" content={fullUrl} />
      <meta property="og:image" content={fullImageUrl} />
      <meta property="og:image:width" content="1200" />
      <meta property="og:image:height" content="630" />
      <meta property="og:image:alt" content={localizedContent.title} />
      <meta property="og:site_name" content="ZapAround" />
      <meta property="og:locale" content={locale} />
      {alternateLocales.map(loc => (
        <meta key={loc} property="og:locale:alternate" content={loc} />
      ))}
      
      {/* Article specific Open Graph tags */}
      <meta property="article:published_time" content={blog.published_at || blog.created_at} />
      <meta property="article:modified_time" content={blog.updated_at} />
      <meta property="article:author" content="ZapAround Team" />
      <meta property="article:section" content={blog.category || "Travel"} />
      {blog.category && (
        <meta property="article:tag" content={blog.category} />
      )}
      
      {/* Twitter Card Meta Tags */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={localizedContent.title} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={fullImageUrl} />
      <meta name="twitter:image:alt" content={localizedContent.title} />
      <meta name="twitter:site" content="@zaparound" />
      <meta name="twitter:creator" content="@zaparound" />
      
      {/* Structured Data */}
      <script type="application/ld+json">
        {JSON.stringify(structuredData)}
      </script>
    </Helmet>
  );
} 