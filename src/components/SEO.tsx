import { Helmet } from 'react-helmet-async';

interface SEOProps {
  title: string;
  description: string;
  keywords?: string;
  image?: string;
  url?: string;
  type?: 'website' | 'article' | 'product' | 'organization' | 'contactpage' | 'faqpage' | 'webapplication';
  publishedTime?: string;
  modifiedTime?: string;
  author?: string;
  section?: string;
  tags?: string[];
  locale?: string;
  alternateLocales?: string[];
  noindex?: boolean;
  nofollow?: boolean;
  canonical?: string;
  structuredData?: object;
  breadcrumbs?: Array<{ name: string; url: string }>;
  organization?: {
    name?: string;
    logo?: string;
    url?: string;
    description?: string;
    address?: {
      streetAddress?: string;
      addressLocality?: string;
      addressRegion?: string;
      postalCode?: string;
      addressCountry?: string;
    };
    contactPoint?: {
      contactType?: string;
      telephone?: string;
      email?: string;
      url?: string;
    };
    sameAs?: string[];
  };
  // New performance-focused props
  preloadImages?: string[];
  preconnectDomains?: string[];
  dnsPrefetch?: string[];
  preloadFonts?: string[];
  criticalCSS?: string;
  // Core Web Vitals optimization
  enableWebVitals?: boolean;
  // Social media optimization
  twitterCardType?: 'summary' | 'summary_large_image' | 'app' | 'player';
  facebookAppId?: string;
  // Enhanced SEO features
  videoStructuredData?: object;
  eventStructuredData?: object;
  productStructuredData?: object;
  localBusinessStructuredData?: object;
}

export function SEO({
  title,
  description,
  keywords,
  image = '/og-image.png',
  url,
  type = 'website',
  publishedTime,
  modifiedTime,
  author = 'ZapAround',
  section,
  tags = [],
  locale = 'en_US',
  alternateLocales = ['en_US', 'fr_FR', 'es_ES'],
  noindex = false,
  nofollow = false,
  canonical,
  structuredData,
  breadcrumbs,
  organization,
  preloadImages = [],
  preconnectDomains = [],
  dnsPrefetch = [],
  preloadFonts = [],
  criticalCSS,
  enableWebVitals = true,
  twitterCardType = 'summary_large_image',
  facebookAppId,
  videoStructuredData,
  eventStructuredData,
  productStructuredData,
  localBusinessStructuredData,
}: SEOProps) {
  // Build proper URL - if url starts with a language code, use it as-is
  // Otherwise, build it properly for the root domain
  const fullUrl = url ? `https://zaparound.com${url}` : 'https://zaparound.com';
  const fullImageUrl = image.startsWith('http') ? image : `https://zaparound.com${image}`;
  
  const robots = [
    noindex ? 'noindex' : 'index',
    nofollow ? 'nofollow' : 'follow',
    'max-image-preview:large',
    'max-snippet:-1',
    'max-video-preview:-1'
  ].join(', ');

  // Default organization data
  const defaultOrganization = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": "ZapAround",
    "url": "https://zaparound.com",
    "telephone": "+1 (418) 478-5586",
    "image": [
      "https://zaparound.com/zaparound-uploads/transparentnoliner.webp",
      "https://zaparound.com/zaparound-uploads/smalllogo.webp"
    ],
    "logo": "https://zaparound.com/zaparound-uploads/transparentnoliner.webp",
    "description": "Your Smart Travel Companion. Plan your trips with AI-assisted recommendations and discover the best places to visit or hangout with your friends.",
    "address": {
      "@type": "PostalAddress",
      "addressCountry": "CA",
      "addressLocality": "Quebec"
    },
    "contactPoint": {
      "@type": "ContactPoint",
      "contactType": "customer service",
      "url": "https://zaparound.com/contact"
    },
    "sameAs": [
      "https://twitter.com/zaparound",
      "https://www.facebook.com/zaparound",
      "https://www.instagram.com/zaparound"
    ]
  };

  // Breadcrumb structured data
  const breadcrumbStructuredData = breadcrumbs ? {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": breadcrumbs.map((item, index) => {
      // Handle null/undefined or empty URL
      if (!item.url) {
        return {
          "@type": "ListItem",
          "position": index + 1,
          "name": item.name,
          "item": "https://zaparound.com",
        };
      }
      // Helper: is the URL absolute (http, https, protocol-relative, ftp, mailto, tel)
      const isAbsoluteUrl = (url: string): boolean => {
        return (
          url.startsWith('http://') ||
          url.startsWith('https://') ||
          url.startsWith('//') ||
          url.startsWith('ftp://') ||
          url.startsWith('mailto:') ||
          url.startsWith('tel:')
        );
      };
      if (isAbsoluteUrl(item.url)) {
        return {
          "@type": "ListItem",
          "position": index + 1,
          "name": item.name,
          "item": item.url,
        };
      }
      // Otherwise, treat as relative and prepend base URL
      const baseUrl = 'https://zaparound.com';
      const normalizedUrl = item.url.startsWith('/') ? item.url : `/${item.url}`;
      return {
        "@type": "ListItem",
        "position": index + 1,
        "name": item.name,
        "item": `${baseUrl}${normalizedUrl}`,
      };
    })
  } : null;

  // WebPage structured data
  const webpageStructuredData = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    "name": title,
    "description": description,
    "url": fullUrl,
    "inLanguage": locale,
    "isPartOf": {
      "@type": "WebSite",
      "name": "ZapAround",
      "url": "https://zaparound.com"
    },
    "datePublished": publishedTime || new Date().toISOString(),
    "dateModified": modifiedTime || new Date().toISOString(),
    "author": {
      "@type": "Organization",
      "name": author
    }
  };

  // Combine all structured data
  const allStructuredData = [
    webpageStructuredData,
    organization || defaultOrganization,
    breadcrumbStructuredData,
    structuredData
  ].filter(Boolean);

  return (
    <Helmet htmlAttributes={{ lang: locale.split('_')[0] }}>
      {/* Basic Meta Tags */}
      <title>{title}</title>
      <meta name="description" content={description} />
      {keywords && <meta name="keywords" content={keywords} />}
      <meta name="robots" content={robots} />
      <meta name="author" content={author} />
      <meta name="language" content={locale.split('_')[0]} />
      <meta name="generator" content="ZapAround" />
      <meta name="rating" content="general" />
      <meta name="distribution" content="global" />
      <meta name="coverage" content="Worldwide" />
      <meta name="target" content="all" />
      
      {/* Mobile and App Meta Tags */}
      <meta name="HandheldFriendly" content="true" />
      <meta name="MobileOptimized" content="width" />
      <meta name="apple-mobile-web-app-capable" content="yes" />
      <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
      <meta name="format-detection" content="telephone=no" />
      
      {/* Geographic Meta Tags */}
      <meta name="geo.region" content="CA" />
      <meta name="geo.placename" content="Quebec" />
      <meta name="geo.position" content="46.8128;71.2354" />
      <meta name="ICBM" content="46.8128, 71.2354" />
      
      {/* Canonical URL */}
      <link rel="canonical" href={canonical || fullUrl} />
      
      {/* Self-referencing canonical link */}
      <link rel="alternate" hrefLang={locale.split('_')[0]} href={canonical || fullUrl} />
      
      {/* Alternate Language Links for other languages */}
      {alternateLocales.filter(loc => loc !== locale).map(loc => {
        const langCode = loc.split('_')[0];
        // If URL already contains a language prefix, replace it; otherwise add the language prefix
        let alternateUrl;
        if (url) {
          // Check if URL starts with a language code (e.g., /en/, /fr/, /es/)
          const hasLangPrefix = /^\/[a-z]{2}(\/|$)/.test(url);
          if (hasLangPrefix) {
            // Replace existing language prefix
            alternateUrl = `https://zaparound.com/${langCode}${url.substring(3)}`;
          } else {
            // Add language prefix to URL that doesn't have one
            alternateUrl = `https://zaparound.com/${langCode}${url}`;
          }
        } else {
          // Default homepage for this language
          alternateUrl = `https://zaparound.com/${langCode}/`;
        }
        return (
          <link key={loc} rel="alternate" hrefLang={langCode} href={alternateUrl} />
        );
      })}
      
      {/* Add x-default link - always points to English version */}
      <link rel="alternate" hrefLang="x-default" href={url ? `https://zaparound.com/en${url.replace(/^\/[a-z]{2}/, '')}` : 'https://zaparound.com/en/'} />
      
      {/* Performance Optimizations */}
      {preconnectDomains.map(domain => (
        <link key={domain} rel="preconnect" href={domain} crossOrigin="anonymous" />
      ))}
      
      {dnsPrefetch.map(domain => (
        <link key={domain} rel="dns-prefetch" href={domain} />
      ))}
      
      {preloadImages.map(imageUrl => (
        <link key={imageUrl} rel="preload" as="image" href={imageUrl} />
      ))}
      
      {preloadFonts.map(fontUrl => (
        <link key={fontUrl} rel="preload" as="font" href={fontUrl} crossOrigin="anonymous" />
      ))}
      
      {/* Critical CSS */}
      {criticalCSS && (
        <style dangerouslySetInnerHTML={{ __html: criticalCSS }} />
      )}
      
      {/* Open Graph Meta Tags */}
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:type" content={type} />
      <meta property="og:url" content={fullUrl} />
      <meta property="og:image" content={fullImageUrl} />
      <meta property="og:image:width" content="1200" />
      <meta property="og:image:height" content="630" />
      <meta property="og:image:alt" content={title} />
      <meta property="og:site_name" content="ZapAround" />
      <meta property="og:locale" content={locale} />
      {alternateLocales.map(loc => (
        <meta key={loc} property="og:locale:alternate" content={loc} />
      ))}
      
      {/* Article specific Open Graph tags */}
      {type === 'article' && publishedTime && (
        <meta property="article:published_time" content={publishedTime} />
      )}
      {type === 'article' && modifiedTime && (
        <meta property="article:modified_time" content={modifiedTime} />
      )}
      {type === 'article' && author && (
        <meta property="article:author" content={author} />
      )}
      {type === 'article' && section && (
        <meta property="article:section" content={section} />
      )}
      {type === 'article' && tags.length > 0 && (
        tags.map(tag => (
          <meta key={tag} property="article:tag" content={tag} />
        ))
      )}
      
      {/* Twitter Card Meta Tags */}
      <meta name="twitter:card" content={twitterCardType} />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={fullImageUrl} />
      <meta name="twitter:image:alt" content={title} />
      <meta name="twitter:site" content="@zaparound" />
      <meta name="twitter:creator" content="@zaparound" />
      <meta name="twitter:domain" content="zaparound.com" />
      
      {/* Facebook App ID */}
      {facebookAppId && <meta property="fb:app_id" content={facebookAppId} />}
      
      {/* Structured Data */}
      {allStructuredData.map((data, index) => (
        <script key={index} type="application/ld+json">
          {JSON.stringify(data)}
        </script>
      ))}
      
      {/* Additional Structured Data */}
      {videoStructuredData && (
        <script type="application/ld+json">
          {JSON.stringify(videoStructuredData)}
        </script>
      )}
      
      {eventStructuredData && (
        <script type="application/ld+json">
          {JSON.stringify(eventStructuredData)}
        </script>
      )}
      
      {productStructuredData && (
        <script type="application/ld+json">
          {JSON.stringify(productStructuredData)}
        </script>
      )}
      
      {localBusinessStructuredData && (
        <script type="application/ld+json">
          {JSON.stringify(localBusinessStructuredData)}
        </script>
      )}
      
      {/* Additional Performance Meta Tags */}
      <meta name="theme-color" content="#61936f" />
      <meta name="msapplication-TileColor" content="#61936f" />
      <meta name="msapplication-config" content="/browserconfig.xml" />
      <meta name="apple-mobile-web-app-title" content="ZapAround" />
      <meta name="application-name" content="ZapAround" />
      
      {/* Note: Cache-Control and Content-Security-Policy should be set as HTTP headers, not meta tags */}
      {/* These are configured at the server level for optimal security and performance */}
    </Helmet>
  );
} 