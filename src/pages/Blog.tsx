import { useEffect } from 'react';
import { BlogList } from '@/components/blog/BlogList';
import { useTranslation } from 'react-i18next';
import { SEO } from '@/components/SEO';

const LOCALE_MAP = { en: 'en_US', fr: 'fr_FR', es: 'es_ES' };

export default function Blog() {
  const { t, i18n } = useTranslation('blog');
  const language = i18n.language;
  const locale = LOCALE_MAP[language] || 'en_US';

  // Scroll to top when component mounts
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const structuredData = {
    "@context": "https://schema.org",
    "@type": "Blog",
    "name": `ZapAround Blog`,
    "description": t('description'),
    "url": `https://zaparound.com/${language}/blog`,
    "publisher": {
      "@type": "Organization",
      "name": "ZapAround",
      "logo": {
        "@type": "ImageObject",
        "url": "https://zaparound.com/zaparound-uploads/transparentnoliner.webp"
      }
    },
    "mainEntityOfPage": {
      "@type": "WebPage",
      "@id": `https://zaparound.com/${language}/blog`
    }
  };

  return (
    <>
      <SEO
        title={t('title')}
        description={t('description')}
        keywords="travel blog, trip planning, destination guides, travel tips, ZapAround blog, travel stories, adventure guides"
        url={`/${language}/blog`}
        locale={locale}
        type="website"
        structuredData={structuredData}
        breadcrumbs={[
          { name: t('common.home'), url: `/${language}/` },
          { name: t('title'), url: `/${language}/blog` }
        ]}
      />
      
      <div className="container mx-auto py-8 px-4">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">{t('title')}</h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            {t('description')}
          </p>
        </div>
        
        <BlogList />
      </div>
    </>
  );
}
