import { useEffect } from 'react';
import { EnhancedBlogList } from '@/components/blog/EnhancedBlogList';
import { useTranslation } from 'react-i18next';
import { SEO } from '@/components/SEO';
import { motion } from 'framer-motion';

const LOCALE_MAP = { en: 'en_US', fr: 'fr_FR', es: 'es_ES' };

export default function EnhancedBlog() {
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
          { name: t('common.home'), url: `/${language}` },
          { name: t('title'), url: `/${language}/blog` }
        ]}
      />

      <div className="min-h-screen bg-gradient-to-br from-blue-50/30 via-white to-indigo-50/30">


        {/* Blog Content */}
        <section className="container mx-auto px-4 py-8 md:py-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <EnhancedBlogList />
          </motion.div>
        </section>
      </div>
    </>
  );
}
