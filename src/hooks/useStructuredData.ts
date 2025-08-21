import { useMemo } from 'react';

interface BaseSchema {
  '@context': string;
  '@type': string;
}

interface TravelServiceSchema extends BaseSchema {
  name: string;
  description: string;
  url: string;
  provider: {
    '@type': string;
    name: string;
    url: string;
    logo: string;
  };
  areaServed?: string | object;
  serviceType?: string[];
  priceRange?: string;
}

interface WebPageSchema extends BaseSchema {
  name: string;
  description: string;
  url: string;
  isPartOf?: object;
  breadcrumb?: object;
  mainEntity?: object;
}

interface TravelPlanSchema extends BaseSchema {
  name: string;
  description: string;
  itinerary?: object[];
  totalTime?: string;
  location?: object[];
}

export const useStructuredData = () => {
  // Organization Schema
  const organizationSchema = useMemo(() => ({
    '@context': 'https://schema.org',
    '@type': 'TravelAgency',
    name: 'ZapAround',
    alternateName: 'ZapAround Travel Companion',
    url: 'https://zaparound.com',
    logo: {
      '@type': 'ImageObject',
      url: 'https://zaparound.com/zaparound-uploads/transparentnoliner.webp',
      width: 512,
      height: 512,
    },
    description: 'Your Smart Travel Companion. Plan your trips with AI-assisted recommendations and discover the best places to visit or hangout with your friends.',
    foundingDate: '2024',
    address: {
      '@type': 'PostalAddress',
      addressCountry: 'CA',
      addressLocality: 'Quebec',
      addressRegion: 'QC',
    },
    contactPoint: {
      '@type': 'ContactPoint',
      contactType: 'customer service',
      url: 'https://zaparound.com/contact',
      availableLanguage: ['English', 'French', 'Spanish'],
    },
    sameAs: [
      'https://twitter.com/zaparound',
      'https://www.facebook.com/zaparound',
      'https://www.instagram.com/zaparound',
      'https://www.linkedin.com/company/zaparound',
    ],
    serviceArea: {
      '@type': 'GeoShape',
      name: 'Worldwide',
    },
    hasOfferCatalog: {
      '@type': 'OfferCatalog',
      name: 'ZapAround Travel Services',
      itemListElement: [
        {
          '@type': 'Offer',
          itemOffered: {
            '@type': 'Service',
            name: 'ZapTrip - Vacation Planning',
            description: 'AI-powered vacation and trip planning service',
            serviceType: 'Travel Planning',
          },
        },
        {
          '@type': 'Offer',
          itemOffered: {
            '@type': 'Service',
            name: 'ZapOut - Hangout Planning',
            description: 'Local activity and hangout recommendation service',
            serviceType: 'Activity Planning',
          },
        },
        {
          '@type': 'Offer',
          itemOffered: {
            '@type': 'Service',
            name: 'ZapRoad - Road Trip Planning',
            description: 'Comprehensive road trip planning and routing service',
            serviceType: 'Road Trip Planning',
          },
        },
      ],
    },
  }), []);

  // WebSite Schema
  const websiteSchema = useMemo(() => ({
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'ZapAround',
    url: 'https://zaparound.com',
    description: 'Your Smart Travel Companion for planning trips and discovering amazing places',
    publisher: organizationSchema,
    potentialAction: {
      '@type': 'SearchAction',
      target: 'https://zaparound.com/search?q={search_term_string}',
      'query-input': 'required name=search_term_string',
    },
    inLanguage: ['en', 'fr', 'es'],
  }), [organizationSchema]);

  // Travel Service Schema
  const travelServiceSchema = useMemo((): TravelServiceSchema => ({
    '@context': 'https://schema.org',
    '@type': 'TravelAgency',
    name: 'ZapAround Travel Planning Service',
    description: 'AI-powered travel planning and recommendation service',
    url: 'https://zaparound.com',
    provider: {
      '@type': 'Organization',
      name: 'ZapAround',
      url: 'https://zaparound.com',
      logo: 'https://zaparound.com/zaparound-uploads/transparentnoliner.webp',
    },
    areaServed: {
      '@type': 'Country',
      name: 'Worldwide',
    },
    serviceType: [
      'Trip Planning',
      'Travel Recommendations',
      'Itinerary Creation',
      'Activity Discovery',
      'Road Trip Planning',
    ],
    priceRange: '$$',
  }), []);

  // WebApplication Schema
  const webApplicationSchema = useMemo(() => ({
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    name: 'ZapAround',
    description: 'Smart travel planning web application',
    url: 'https://zaparound.com',
    applicationCategory: 'TravelApplication',
    operatingSystem: 'Web Browser',
    browserRequirements: 'Requires JavaScript. Requires HTML5.',
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'USD',
    },
    featureList: [
      'AI-powered trip planning',
      'Real-time recommendations',
      'Multi-language support',
      'Interactive maps',
      'Budget planning',
      'Social sharing',
    ],
  }), []);

  // FAQ Schema Generator
  const generateFAQSchema = (faqs: Array<{ question: string; answer: string }>) => ({
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map((faq) => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: faq.answer,
      },
    })),
  });

  // Article Schema Generator
  const generateArticleSchema = (article: {
    title: string;
    description: string;
    content: string;
    author: string;
    publishedDate: string;
    modifiedDate?: string;
    image?: string;
    url: string;
  }) => ({
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: article.title,
    description: article.description,
    articleBody: article.content,
    author: {
      '@type': 'Person',
      name: article.author,
    },
    publisher: organizationSchema,
    datePublished: article.publishedDate,
    dateModified: article.modifiedDate || article.publishedDate,
    image: article.image || 'https://zaparound.com/og-image.png',
    url: article.url,
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': article.url,
    },
  });

  // Breadcrumb Schema Generator
  const generateBreadcrumbSchema = (breadcrumbs: Array<{ name: string; url: string }>) => ({
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: breadcrumbs.map((crumb, index) => {
      // Handle null/undefined or empty URL
      if (!crumb.url) {
        return {
          '@type': 'ListItem',
          position: index + 1,
          name: crumb.name,
          item: 'https://zaparound.com',
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
      if (isAbsoluteUrl(crumb.url)) {
        return {
          '@type': 'ListItem',
          position: index + 1,
          name: crumb.name,
          item: crumb.url,
        };
      }
      // Otherwise, treat as relative and prepend base URL
      const baseUrl = 'https://zaparound.com';
      const normalizedUrl = crumb.url.startsWith('/') ? crumb.url : `/${crumb.url}`;
      return {
        '@type': 'ListItem',
        position: index + 1,
        name: crumb.name,
        item: `${baseUrl}${normalizedUrl}`,
      };
    }),
  });

  // Trip Plan Schema Generator
  const generateTripPlanSchema = (trip: {
    name: string;
    description: string;
    destinations: Array<{ name: string; address?: string; coordinates?: [number, number] }>;
    duration?: string;
    activities?: string[];
  }) => ({
    '@context': 'https://schema.org',
    '@type': 'TripPlanning',
    name: trip.name,
    description: trip.description,
    itinerary: trip.destinations.map((dest, index) => ({
      '@type': 'TouristDestination',
      name: dest.name,
      address: dest.address,
      geo: dest.coordinates ? {
        '@type': 'GeoCoordinates',
        latitude: dest.coordinates[1],
        longitude: dest.coordinates[0],
      } : undefined,
    })),
    totalTime: trip.duration,
    activity: trip.activities?.map(activity => ({
      '@type': 'TouristActivity',
      name: activity,
    })),
  });

  return {
    organizationSchema,
    websiteSchema,
    travelServiceSchema,
    webApplicationSchema,
    generateFAQSchema,
    generateArticleSchema,
    generateBreadcrumbSchema,
    generateTripPlanSchema,
  };
};

export default useStructuredData;
