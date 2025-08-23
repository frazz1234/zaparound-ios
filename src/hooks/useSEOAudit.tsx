import React, { useEffect, useState } from 'react';

interface SEOAuditResult {
  score: number;
  checks: {
    title: boolean;
    description: boolean;
    keywords: boolean;
    h1: boolean;
    images: boolean;
    links: boolean;
    structuredData: boolean;
    performance: boolean;
  };
  recommendations: string[];
}

export const useSEOAudit = (enabled: boolean = false) => {
  const [auditResult, setAuditResult] = useState<SEOAuditResult | null>(null);
  const [isAuditing, setIsAuditing] = useState(false);

  const performAudit = () => {
    if (!enabled) return;

    setIsAuditing(true);
    
    setTimeout(() => {
      const checks = {
        title: checkTitle(),
        description: checkDescription(),
        keywords: checkKeywords(),
        h1: checkH1Tags(),
        images: checkImages(),
        links: checkLinks(),
        structuredData: checkStructuredData(),
        performance: checkPerformance(),
      };

      const score = Object.values(checks).filter(Boolean).length / Object.keys(checks).length * 100;
      const recommendations = generateRecommendations(checks);

      setAuditResult({
        score: Math.round(score),
        checks,
        recommendations,
      });
      
      setIsAuditing(false);
    }, 1000);
  };

  const checkTitle = (): boolean => {
    const title = document.querySelector('title')?.textContent;
    return !!(title && title.length >= 30 && title.length <= 60);
  };

  const checkDescription = (): boolean => {
    const description = document.querySelector('meta[name="description"]')?.getAttribute('content');
    return !!(description && description.length >= 120 && description.length <= 160);
  };

  const checkKeywords = (): boolean => {
    const keywords = document.querySelector('meta[name="keywords"]')?.getAttribute('content');
    return !!(keywords && keywords.split(',').length >= 3);
  };

  const checkH1Tags = (): boolean => {
    const h1Tags = document.querySelectorAll('h1');
    return h1Tags.length === 1 && h1Tags[0].textContent!.length > 0;
  };

  const checkImages = (): boolean => {
    const images = document.querySelectorAll('img');
    let hasAlt = 0;
    images.forEach(img => {
      if (img.getAttribute('alt') && img.getAttribute('alt')!.length > 0) {
        hasAlt++;
      }
    });
    return images.length === 0 || hasAlt / images.length >= 0.8;
  };

  const checkLinks = (): boolean => {
    const links = document.querySelectorAll('a[href^="http"]');
    let hasTitle = 0;
    links.forEach(link => {
      if (link.getAttribute('title') || link.getAttribute('aria-label')) {
        hasTitle++;
      }
    });
    return links.length === 0 || hasTitle / links.length >= 0.5;
  };

  const checkStructuredData = (): boolean => {
    const structuredData = document.querySelectorAll('script[type="application/ld+json"]');
    return structuredData.length > 0;
  };

  const checkPerformance = (): boolean => {
    // Basic performance check - more comprehensive checks would require Web Vitals
    const navigationTiming = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
    if (navigationTiming) {
      const loadTime = navigationTiming.loadEventEnd - navigationTiming.fetchStart;
      return loadTime < 3000; // Less than 3 seconds
    }
    return true;
  };

  const generateRecommendations = (checks: SEOAuditResult['checks']): string[] => {
    const recommendations: string[] = [];

    if (!checks.title) {
      recommendations.push('Optimize your page title (30-60 characters)');
    }
    if (!checks.description) {
      recommendations.push('Add a compelling meta description (120-160 characters)');
    }
    if (!checks.keywords) {
      recommendations.push('Include relevant keywords in meta tags');
    }
    if (!checks.h1) {
      recommendations.push('Use exactly one H1 tag per page');
    }
    if (!checks.images) {
      recommendations.push('Add descriptive alt text to all images');
    }
    if (!checks.links) {
      recommendations.push('Add descriptive titles or aria-labels to external links');
    }
    if (!checks.structuredData) {
      recommendations.push('Implement structured data markup');
    }
    if (!checks.performance) {
      recommendations.push('Improve page loading speed');
    }

    if (recommendations.length === 0) {
      recommendations.push('Great job! Your SEO is well optimized.');
    }

    return recommendations;
  };

  useEffect(() => {
    if (enabled) {
      performAudit();
    }
  }, [enabled]);

  return {
    auditResult,
    isAuditing,
    performAudit,
  };
};

// SEO Audit Component for development
export const SEOAuditPanel = ({ enabled = false }: { enabled?: boolean }) => {
  const { auditResult, isAuditing, performAudit } = useSEOAudit(enabled);

  if (!enabled || !auditResult) return null;

  return (
    <div 
      style={{
        position: 'fixed',
        bottom: '20px',
        right: '20px',
        background: 'white',
        border: '1px solid #ccc',
        borderRadius: '8px',
        padding: '16px',
        maxWidth: '300px',
        boxShadow: '0 4px 8px rgba(0,0,0,0.1)',
        zIndex: 9999,
        fontSize: '14px',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
        <h3 style={{ margin: 0, fontSize: '16px' }}>SEO Score</h3>
        <button 
          onClick={performAudit}
          disabled={isAuditing}
          style={{
            background: '#61936f',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            padding: '4px 8px',
            cursor: 'pointer',
            fontSize: '12px',
          }}
        >
          {isAuditing ? 'Auditing...' : 'Refresh'}
        </button>
      </div>
      
      <div style={{ 
        fontSize: '24px', 
        fontWeight: 'bold', 
        textAlign: 'center',
        color: auditResult.score >= 80 ? '#22c55e' : auditResult.score >= 60 ? '#f59e0b' : '#ef4444',
        marginBottom: '12px'
      }}>
        {auditResult.score}%
      </div>

      <div style={{ marginBottom: '12px' }}>
        <h4 style={{ margin: '0 0 8px 0', fontSize: '14px' }}>Checks:</h4>
        {Object.entries(auditResult.checks).map(([key, passed]) => (
          <div key={key} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
            <span style={{ textTransform: 'capitalize' }}>{key.replace(/([A-Z])/g, ' $1')}</span>
            <span style={{ color: passed ? '#22c55e' : '#ef4444' }}>
              {passed ? '✓' : '✗'}
            </span>
          </div>
        ))}
      </div>

      {auditResult.recommendations.length > 0 && (
        <div>
          <h4 style={{ margin: '0 0 8px 0', fontSize: '14px' }}>Recommendations:</h4>
          <ul style={{ margin: 0, paddingLeft: '16px', fontSize: '12px' }}>
            {auditResult.recommendations.slice(0, 3).map((rec, index) => (
              <li key={index} style={{ marginBottom: '4px' }}>{rec}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default useSEOAudit;
