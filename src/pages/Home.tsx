import { useTranslation } from 'react-i18next';
import { SEO } from '@/components/SEO';
import useStructuredData from '@/hooks/useStructuredData';

export default function Home() {
  const { i18n, t } = useTranslation();
  const language = i18n.language;
  const locale = language === 'en' ? 'en_US' : language === 'fr' ? 'fr_FR' : 'es_ES';
  const { websiteSchema, organizationSchema, webApplicationSchema } = useStructuredData();

  return (
    <>
      <SEO
        title={t('home.title')}
        description={t('home.description')}
        keywords="ZapAround, travel companion, travel planner, AI travel guide, trip planning, road trip planner, travel recommendations, hangout planner, smart travel app, vacation planning"
        url={`/${language}`}
        locale={locale}
        structuredData={websiteSchema}
        organization={{
          name: organizationSchema.name,
          logo: organizationSchema.logo.url,
          url: organizationSchema.url,
          description: organizationSchema.description,
        }}
      />
    </>
  );
} 